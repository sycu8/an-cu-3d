import { Hono } from "hono";
import { getConversionJob } from "../db/jobs";
import { logJob } from "../logger";
import { publishFromJob } from "../pipeline/publish";

type Env = {
  ENGINE_DB: D1Database;
  FLOORPLANS: R2Bucket;
  PUBLISH_CONFIDENCE_HIGH: string;
  PUBLISH_CONFIDENCE_REVIEW: string;
};

const floorplans = new Hono<{ Bindings: Env }>();

floorplans.post("/:id/publish", async (c) => {
  const jobId = c.req.param("id");
  const job = await getConversionJob(c.env.ENGINE_DB, jobId);
  if (!job) return c.json({ error: "not_found" }, 404);

  try {
    const result = await publishFromJob(c.env, jobId);
    logJob("info", "publish_endpoint_success", { jobId });
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "publish_failed";
    logJob("warn", "publish_endpoint_failed", { jobId, message });
    return c.json({ error: message }, 400);
  }
});

export { floorplans };
