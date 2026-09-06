import {
  createFloorplanVersion,
  getConversionJob,
  updateConversionJobStatus,
} from "../db/jobs";
import { logJob } from "../logger";
import { publishedFloorplanKey } from "../r2";
import {
  isSharedFloorPlanDocument,
  type FloorPlanDocument,
} from "../schema/floorPlanDocument";

export type PublishResult = {
  versionId: string;
  r2Key: string;
  status: "published";
};

function documentProjectSlug(document: FloorPlanDocument): string {
  if (isSharedFloorPlanDocument(document)) {
    return document.source.projectSlug;
  }
  return document.projectSlug;
}

export async function publishFloorplan(
  env: {
    ENGINE_DB: D1Database;
    FLOORPLANS: R2Bucket;
    PUBLISH_CONFIDENCE_HIGH: string;
    PUBLISH_CONFIDENCE_REVIEW: string;
  },
  input: {
    floorplanId: string;
    document: FloorPlanDocument;
    conversionJobId?: string;
    confidence?: number;
  },
): Promise<PublishResult> {
  const high = Number.parseFloat(env.PUBLISH_CONFIDENCE_HIGH);
  const review = Number.parseFloat(env.PUBLISH_CONFIDENCE_REVIEW);
  const confidence = input.confidence ?? 0;

  if (confidence < review) {
    throw new Error("confidence_below_review_threshold");
  }

  const projectSlug = documentProjectSlug(input.document);
  const versionId = crypto.randomUUID();
  const r2Key = publishedFloorplanKey(projectSlug, versionId);

  await env.FLOORPLANS.put(r2Key, JSON.stringify(input.document), {
    httpMetadata: { contentType: "application/json" },
  });

  await createFloorplanVersion(env.ENGINE_DB, {
    id: versionId,
    projectSlug,
    conversionJobId: input.conversionJobId ?? input.floorplanId,
    r2Key,
    confidence,
    metadata: {
      autoApproved: confidence >= high,
      publishedVia: "engine-api",
      schemaKind: isSharedFloorPlanDocument(input.document) ? "shared" : "legacy",
    },
    status: "published",
  });

  if (input.conversionJobId) {
    await updateConversionJobStatus(env.ENGINE_DB, input.conversionJobId, "PUBLISHED", {
      result: { versionId, r2Key, confidence },
    });
  }

  logJob("info", "floorplan_published", {
    jobId: input.conversionJobId,
    versionId,
    projectSlug,
    confidence,
  });

  return { versionId, r2Key, status: "published" };
}

export async function publishFromJob(
  env: {
    ENGINE_DB: D1Database;
    FLOORPLANS: R2Bucket;
    PUBLISH_CONFIDENCE_HIGH: string;
    PUBLISH_CONFIDENCE_REVIEW: string;
  },
  jobId: string,
): Promise<PublishResult> {
  const job = await getConversionJob(env.ENGINE_DB, jobId);
  if (!job) throw new Error("job_not_found");
  if (job.status !== "APPROVED" && job.status !== "NEEDS_REVIEW") {
    throw new Error("job_not_publishable");
  }

  const result = job.result_json ? JSON.parse(job.result_json) : null;
  const document = result?.document;
  if (!document) throw new Error("missing_document");

  return publishFloorplan(env, {
    floorplanId: jobId,
    conversionJobId: jobId,
    document,
    confidence: result?.confidence ?? 0,
  });
}
