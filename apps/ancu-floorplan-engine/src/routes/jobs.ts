import { Hono } from "hono";
import { verifyBearerToken } from "../auth";
import {
  createConversionJob,
  getConversionJob,
  getLatestVersionForJob,
  updateConversionJobStatus,
  upsertReview,
} from "../db/jobs";
import { logJob } from "../logger";
import { canTransition } from "../pipeline/states";
import type { ConversionWorkflowParams } from "../workflow/ConversionWorkflow";

type Env = {
  ENGINE_DB: D1Database;
  CONVERSION_QUEUE: Queue<ConversionQueueMessage>;
  CONVERSION_WORKFLOW: Workflow;
  ENGINE_API_SECRET: string;
};

type ConversionQueueMessage = {
  jobId: string;
  payload: ConversionWorkflowParams;
};

const jobs = new Hono<{ Bindings: Env }>();

jobs.post("/", async (c) => {
  const body = await c.req.json<{
    projectSlug?: string;
    sourceId?: string;
    assetId?: string;
    filename?: string;
    altText?: string;
    seedDocument?: unknown;
    input?: Record<string, unknown>;
  }>();

  const jobId = crypto.randomUUID();
  const payload: ConversionWorkflowParams = {
    jobId,
    projectSlug: body.projectSlug,
    sourceId: body.sourceId,
    assetId: body.assetId,
    filename: body.filename,
    altText: body.altText,
    seedDocument: body.seedDocument,
    input: body.input,
  };

  await createConversionJob(c.env.ENGINE_DB, {
    id: jobId,
    projectSlug: body.projectSlug,
    sourceId: body.sourceId,
    assetId: body.assetId,
    input: body.input,
  });

  await c.env.CONVERSION_QUEUE.send({ jobId, payload });

  logJob("info", "conversion_job_enqueued", { jobId });

  return c.json({ id: jobId, status: "DISCOVERED" }, 202);
});

jobs.get("/:id", async (c) => {
  const job = await getConversionJob(c.env.ENGINE_DB, c.req.param("id"));
  if (!job) return c.json({ error: "not_found" }, 404);

  return c.json({
    id: job.id,
    status: job.status,
    projectSlug: job.project_slug,
    workflowInstanceId: job.workflow_instance_id,
    errorMessage: job.error_message,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  });
});

jobs.get("/:id/result", async (c) => {
  const job = await getConversionJob(c.env.ENGINE_DB, c.req.param("id"));
  if (!job) return c.json({ error: "not_found" }, 404);

  return c.json({
    id: job.id,
    status: job.status,
    result: job.result_json ? JSON.parse(job.result_json) : null,
    errorMessage: job.error_message,
  });
});

jobs.post("/:id/retry", async (c) => {
  const jobId = c.req.param("id");
  const job = await getConversionJob(c.env.ENGINE_DB, jobId);
  if (!job) return c.json({ error: "not_found" }, 404);

  const input = job.input_json ? JSON.parse(job.input_json) : {};
  const payload: ConversionWorkflowParams = {
    jobId,
    projectSlug: job.project_slug ?? undefined,
    sourceId: job.source_id ?? undefined,
    assetId: job.asset_id ?? undefined,
    input,
  };

  await updateConversionJobStatus(c.env.ENGINE_DB, jobId, "DISCOVERED", {
    errorMessage: undefined,
  });
  await c.env.CONVERSION_QUEUE.send({ jobId, payload });

  logJob("info", "conversion_job_retried", { jobId });
  return c.json({ id: jobId, status: "DISCOVERED" });
});

jobs.post("/:id/approve", async (c) => {
  const jobId = c.req.param("id");
  const job = await getConversionJob(c.env.ENGINE_DB, jobId);
  if (!job) return c.json({ error: "not_found" }, 404);

  if (!canTransition(job.status, "APPROVED")) {
    return c.json({ error: "invalid_transition", from: job.status, to: "APPROVED" }, 409);
  }

  await updateConversionJobStatus(c.env.ENGINE_DB, jobId, "APPROVED");
  await upsertReview(c.env.ENGINE_DB, {
    id: crypto.randomUUID(),
    conversionJobId: jobId,
    status: "approved",
  });

  logJob("info", "conversion_job_approved", { jobId });
  return c.json({ id: jobId, status: "APPROVED" });
});

jobs.post("/:id/reject", async (c) => {
  const jobId = c.req.param("id");
  const body = (await c.req.json<{ note?: string }>().catch(() => ({
    note: undefined,
  }))) as { note?: string };
  const job = await getConversionJob(c.env.ENGINE_DB, jobId);
  if (!job) return c.json({ error: "not_found" }, 404);

  if (!canTransition(job.status, "FAILED")) {
    return c.json({ error: "invalid_transition", from: job.status, to: "FAILED" }, 409);
  }

  await updateConversionJobStatus(c.env.ENGINE_DB, jobId, "FAILED", {
    errorMessage: body.note ?? "rejected_by_reviewer",
  });
  await upsertReview(c.env.ENGINE_DB, {
    id: crypto.randomUUID(),
    conversionJobId: jobId,
    status: "rejected",
    note: body.note,
  });

  logJob("info", "conversion_job_rejected", { jobId });
  return c.json({ id: jobId, status: "FAILED" });
});

export { jobs };
