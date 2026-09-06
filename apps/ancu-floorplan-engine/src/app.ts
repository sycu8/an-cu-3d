import { Hono } from "hono";
import { verifyBearerToken } from "./auth";
import { getBindingPresence } from "./health";
import { logJob } from "./logger";
import { isRateLimited } from "./rate-limit";
import { crawl } from "./routes/crawl";
import { floorplans } from "./routes/floorplans";
import { jobs } from "./routes/jobs";
import type { ConversionWorkflowParams } from "./workflow/ConversionWorkflow";

export type Env = {
  ENGINE_DB: D1Database;
  FLOORPLANS: R2Bucket;
  CONVERSION_QUEUE: Queue<ConversionQueueMessage>;
  CRAWL_QUEUE: Queue<CrawlQueueMessage>;
  CONVERSION_WORKFLOW: Workflow;
  AI: Ai;
  BROWSER: Fetcher;
  ENGINE_API_SECRET: string;
  ENVIRONMENT?: string;
  PUBLISH_CONFIDENCE_HIGH: string;
  PUBLISH_CONFIDENCE_REVIEW: string;
};

type ConversionQueueMessage = {
  jobId: string;
  payload: ConversionWorkflowParams;
};

type CrawlQueueMessage = {
  crawlJobId: string;
  seedUrl: string;
  projectSlug?: string;
};

type Variables = {
  requestId: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);
  await next();
});

app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  await next();
});

app.use("*", async (c, next) => {
  const startedAt = Date.now();
  await next();
  logJob("info", "http_request", {
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
  });
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "ancu-floorplan-engine",
    ts: new Date().toISOString(),
    requestId: c.get("requestId"),
    bindings: getBindingPresence(c.env),
  }),
);

app.use("*", async (c, next) => {
  if (c.req.path === "/health") {
    return next();
  }

  const authorized = await verifyBearerToken(
    c.req.header("Authorization"),
    c.env.ENGINE_API_SECRET,
  );

  if (!authorized) {
    return c.json({ error: "unauthorized" }, 401);
  }

  return next();
});

app.use("/jobs", async (c, next) => {
  if (c.req.method !== "POST") {
    return next();
  }

  const path = c.req.path.replace(/\/$/, "");
  if (path !== "/jobs") {
    return next();
  }

  // Admin project-build orchestration must never be rate-limited or timed out.
  if (c.req.header("X-AnCu-Admin-Build") === "1") {
    return next();
  }

  let bodyPreview: { bypassRateLimit?: boolean } | null = null;
  try {
    bodyPreview = await c.req.raw.clone().json();
  } catch {
    bodyPreview = null;
  }
  if (bodyPreview?.bypassRateLimit === true) {
    return next();
  }

  const clientIp =
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown";

  if (isRateLimited(`jobs-post:${clientIp}`)) {
    return c.json({ error: "rate_limit_exceeded" }, 429);
  }

  return next();
});

app.route("/jobs", jobs);
app.route("/sources/crawl", crawl);
app.route("/floorplans", floorplans);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export { app };
