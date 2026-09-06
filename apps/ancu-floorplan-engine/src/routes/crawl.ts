import { Hono } from "hono";
import {
  crawlChannelForHost,
  validateAllowlistedUrl,
} from "../allowlist";
import {
  addCrawlCandidate,
  createCrawlJob,
  ensureSource,
  getCrawlJob,
  updateCrawlJob,
} from "../db/crawl";
import { logJob } from "../logger";
import { classifyAsset } from "../pipeline/classify";
import { extractPage } from "../pipeline/extractHtml";

type Env = {
  ENGINE_DB: D1Database;
  CRAWL_QUEUE: Queue<CrawlQueueMessage>;
};

type CrawlQueueMessage = {
  crawlJobId: string;
  seedUrl: string;
  projectSlug?: string;
};

const crawl = new Hono<{ Bindings: Env }>();

crawl.post("/", async (c) => {
  const body = await c.req.json<{
    url: string;
    projectSlug?: string;
  }>();

  const validation = validateAllowlistedUrl(body.url);
  if (!validation.ok) {
    return c.json({ error: validation.reason }, 400);
  }

  const crawlJobId = crypto.randomUUID();
  const domain = validation.url.hostname;
  const sourceId = crypto.randomUUID();
  const channel = crawlChannelForHost(domain) ?? "developer";

  if (body.projectSlug) {
    await ensureSource(c.env.ENGINE_DB, {
      id: sourceId,
      projectSlug: body.projectSlug,
      domain,
      baseUrl: `${validation.url.protocol}//${validation.url.host}`,
    });
  }

  await createCrawlJob(c.env.ENGINE_DB, {
    id: crawlJobId,
    seedUrl: validation.url.toString(),
    sourceId: body.projectSlug ? sourceId : undefined,
  });

  await c.env.CRAWL_QUEUE.send({
    crawlJobId,
    seedUrl: validation.url.toString(),
    projectSlug: body.projectSlug,
  });

  logJob("info", "crawl_job_enqueued", { jobId: crawlJobId, channel });

  return c.json({ id: crawlJobId, status: "pending", channel }, 202);
});

crawl.get("/:id", async (c) => {
  const row = await getCrawlJob(c.env.ENGINE_DB, c.req.param("id"));
  if (!row) return c.json({ error: "not_found" }, 404);

  return c.json({
    id: row.id,
    status: row.status,
    seedUrl: row.seed_url,
    result: row.result_json ? JSON.parse(row.result_json) : null,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

export { crawl };

export async function processCrawlMessage(
  env: Env,
  message: CrawlQueueMessage,
): Promise<void> {
  const { crawlJobId, seedUrl, projectSlug } = message;

  try {
    await updateCrawlJob(env.ENGINE_DB, crawlJobId, { status: "running" });

    const validation = validateAllowlistedUrl(seedUrl);
    if (!validation.ok) {
      throw new Error(validation.reason);
    }

    const channel = crawlChannelForHost(validation.url.hostname) ?? "developer";

    const response = await fetch(validation.url.toString(), {
      headers: {
        "User-Agent":
          "AnCu3D-ResearchBot/1.0 (+https://ancu.vn; allowlist crawl only)",
        Accept:
          "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`fetch_failed_${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const candidates: Array<{
      id: string;
      url: string;
      status: string;
      metadata: Record<string, unknown>;
    }> = [];

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const page = extractPage(html, validation.url.toString());

      await addCrawlCandidate(env.ENGINE_DB, {
        id: crypto.randomUUID(),
        crawlJobId,
        url: seedUrl,
        status: "fetched",
        metadata: {
          kind: "page",
          channel,
          title: page.title,
          description: page.description,
          textSnippet: page.textSnippet.slice(0, 1500),
          projectSlug: projectSlug ?? null,
        },
      });

      for (const link of page.links) {
        if (link.kind === "page") continue;
        const linkValidation = validateAllowlistedUrl(link.url);
        const classified = classifyAsset(link.url, link.text);
        candidates.push({
          id: crypto.randomUUID(),
          url: link.url,
          status: "discovered",
          metadata: {
            kind: link.kind,
            channel,
            linkText: link.text,
            classification: classified.label,
            confidence: classified.confidence,
            matchedKeywords: classified.matchedKeywords,
            // CDN assets may be off-allowlist when discovered from allowlisted HTML
            allowlistedAsset: linkValidation.ok,
            parentPage: seedUrl,
            projectSlug: projectSlug ?? null,
          },
        });
      }
    } else {
      const classified = classifyAsset(seedUrl, contentType);
      candidates.push({
        id: crypto.randomUUID(),
        url: seedUrl,
        status: "fetched",
        metadata: {
          kind: contentType.includes("pdf") ? "pdf" : "binary",
          channel,
          contentType,
          classification: classified.label,
          confidence: classified.confidence,
          projectSlug: projectSlug ?? null,
        },
      });
    }

    for (const candidate of candidates.slice(0, 40)) {
      await addCrawlCandidate(env.ENGINE_DB, {
        id: candidate.id,
        crawlJobId,
        url: candidate.url,
        status: candidate.status,
        metadata: candidate.metadata,
      });
    }

    const atlasCount = candidates.filter(
      (c) => c.metadata.classification === "atlas",
    ).length;
    const floorplanCount = candidates.filter(
      (c) => c.metadata.classification === "floorplan",
    ).length;

    await updateCrawlJob(env.ENGINE_DB, crawlJobId, {
      status: "completed",
      result: {
        channel,
        candidates: candidates.length + 1,
        atlasCount,
        floorplanCount,
        note:
          channel === "secondary_market"
            ? "secondary_market_reference_only_not_cdt_price_sheet"
            : "developer_public_page_crawl",
      },
    });

    logJob("info", "crawl_job_completed", {
      jobId: crawlJobId,
      candidates: candidates.length,
      channel,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "crawl_failed";
    await updateCrawlJob(env.ENGINE_DB, crawlJobId, {
      status: "failed",
      errorMessage,
    });
    logJob("error", "crawl_job_failed", { jobId: crawlJobId, errorMessage });
    throw error;
  }
}
