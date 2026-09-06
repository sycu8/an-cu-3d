import { Hono } from "hono";
import { validateAllowlistedUrl } from "../allowlist";
import {
  addCrawlCandidate,
  createCrawlJob,
  ensureSource,
  getCrawlJob,
  updateCrawlJob,
} from "../db/crawl";
import { logJob } from "../logger";

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

  logJob("info", "crawl_job_enqueued", { jobId: crawlJobId });

  return c.json({ id: crawlJobId, status: "pending" }, 202);
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
  const { crawlJobId, seedUrl } = message;

  try {
    await updateCrawlJob(env.ENGINE_DB, crawlJobId, { status: "running" });

    await addCrawlCandidate(env.ENGINE_DB, {
      id: crypto.randomUUID(),
      crawlJobId,
      url: seedUrl,
      status: "discovered",
      metadata: { stub: true },
    });

    await updateCrawlJob(env.ENGINE_DB, crawlJobId, {
      status: "completed",
      result: {
        candidates: 1,
        note: "crawl_stub_completed",
      },
    });

    logJob("info", "crawl_job_completed", { jobId: crawlJobId });
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
