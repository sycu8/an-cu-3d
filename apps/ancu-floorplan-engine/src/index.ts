import { Hono } from "hono";
import { verifyBearerToken } from "./auth";
import { crawl } from "./routes/crawl";
import { floorplans } from "./routes/floorplans";
import { jobs } from "./routes/jobs";
import { logJob } from "./logger";
import { processCrawlMessage } from "./routes/crawl";
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

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "ancu-floorplan-engine",
    ts: new Date().toISOString(),
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

app.route("/jobs", jobs);
app.route("/sources/crawl", crawl);
app.route("/floorplans", floorplans);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export { app };

export async function handleQueueBatch(
  batch: MessageBatch<ConversionQueueMessage | CrawlQueueMessage>,
  env: Env,
): Promise<void> {
  for (const message of batch.messages) {
    const body = message.body;

    if ("payload" in body && "jobId" in body) {
      const conversion = body as ConversionQueueMessage;
      logJob("info", "conversion_queue_message", { jobId: conversion.jobId });

      try {
        const instance = await env.CONVERSION_WORKFLOW.create({
          id: conversion.jobId,
          params: conversion.payload,
        });

        await env.ENGINE_DB.prepare(
          `UPDATE conversion_jobs
           SET workflow_instance_id = ?, updated_at = datetime('now')
           WHERE id = ?`,
        )
          .bind(instance.id, conversion.jobId)
          .run();

        message.ack();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "workflow_start_failed";
        logJob("error", "conversion_queue_failed", {
          jobId: conversion.jobId,
          errorMessage,
        });
        message.retry();
      }
      continue;
    }

    if ("crawlJobId" in body) {
      try {
        await processCrawlMessage(env, body as CrawlQueueMessage);
        message.ack();
      } catch {
        message.retry();
      }
    }
  }
}

export { ConversionWorkflow } from "./workflow/ConversionWorkflow";

export default {
  fetch: app.fetch,
  queue: handleQueueBatch,
};
