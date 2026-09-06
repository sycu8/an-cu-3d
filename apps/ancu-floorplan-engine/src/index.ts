import { app, type Env } from "./app";
import { assertProductionEnv } from "./env";
import { logJob } from "./logger";
import { processCrawlMessage } from "./routes/crawl";
import type { ConversionWorkflowParams } from "./workflow/ConversionWorkflow";

export type { Env } from "./app";
export { app };

type ConversionQueueMessage = {
  jobId: string;
  payload: ConversionWorkflowParams;
};

type CrawlQueueMessage = {
  crawlJobId: string;
  seedUrl: string;
  projectSlug?: string;
};

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
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/health") {
      try {
        assertProductionEnv(env);
      } catch {
        return Response.json({ error: "misconfigured" }, { status: 503 });
      }
    }

    return app.fetch(request, env, ctx);
  },
  queue: handleQueueBatch,
};
