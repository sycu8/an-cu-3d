import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import {
  createConversionJob,
  getConversionJob,
  listAssetHashes,
  updateConversionJobStatus,
} from "../db/jobs";
import { logJob } from "../logger";
import { analysisArtifactKey, geometryArtifactKey, normalizedAssetKey } from "../r2";
import { classifyByFilenameOrAlt } from "../pipeline/classify";
import { dedupeByBytes } from "../pipeline/dedupe";
import { validateGeometry } from "../pipeline/geometry";
import { normalizeAsset } from "../pipeline/normalize";
import type { ConversionJobStatus } from "../pipeline/states";
import { canTransition } from "../pipeline/states";
import { runVisionStub } from "../pipeline/vision";

export type ConversionWorkflowParams = {
  jobId: string;
  projectSlug?: string;
  sourceId?: string;
  assetId?: string;
  filename?: string;
  altText?: string;
  seedDocument?: unknown;
  bytesBase64?: string;
  input?: Record<string, unknown>;
};

type Env = {
  ENGINE_DB: D1Database;
  FLOORPLANS: R2Bucket;
  AI: Ai;
  PUBLISH_CONFIDENCE_HIGH: string;
  PUBLISH_CONFIDENCE_REVIEW: string;
};

async function setStatus(
  env: Env,
  jobId: string,
  status: ConversionJobStatus,
  patch?: Parameters<typeof updateConversionJobStatus>[3],
): Promise<void> {
  const current = await getConversionJob(env.ENGINE_DB, jobId);
  if (current && !canTransition(current.status, status)) {
    throw new Error(`invalid_transition:${current.status}->${status}`);
  }
  await updateConversionJobStatus(env.ENGINE_DB, jobId, status, patch);
  logJob("info", "job_status_updated", { jobId, status });
}

export class ConversionWorkflow extends WorkflowEntrypoint<
  Env,
  ConversionWorkflowParams
> {
  async run(
    event: WorkflowEvent<ConversionWorkflowParams>,
    step: WorkflowStep,
  ): Promise<Record<string, unknown>> {
    const payload = event.payload;
    const jobId = payload.jobId;

    logJob("info", "workflow_started", { jobId });

    let existing = await getConversionJob(this.env.ENGINE_DB, jobId);
    if (!existing) {
      await createConversionJob(this.env.ENGINE_DB, {
        id: jobId,
        projectSlug: payload.projectSlug,
        sourceId: payload.sourceId,
        assetId: payload.assetId,
        input: payload.input,
      });
      existing = await getConversionJob(this.env.ENGINE_DB, jobId);
    }

    await setStatus(this.env, jobId, "DISCOVERED");

    const downloaded = await step.do("download", async () => {
      await setStatus(this.env, jobId, "DOWNLOADED");
      const bytes = payload.bytesBase64
        ? Uint8Array.from(atob(payload.bytesBase64), (c) => c.charCodeAt(0))
        : null;
      return { byteSize: bytes?.byteLength ?? 0, hasBytes: Boolean(bytes), bytes };
    });

    const normalized = await step.do("normalize", async () => {
      await setStatus(this.env, jobId, "NORMALIZED");
      const asset = normalizeAsset({
        assetId: payload.assetId ?? jobId,
        projectSlug: payload.projectSlug ?? "unknown",
        byteSize: downloaded.byteSize,
        metadata: {},
      });

      const key = normalizedAssetKey(asset.projectSlug, asset.assetId);
      await this.env.FLOORPLANS.put(key, JSON.stringify(asset), {
        httpMetadata: { contentType: "application/json" },
      });

      return asset;
    });

    const classified = await step.do("classify", async () => {
      await setStatus(this.env, jobId, "ANALYZING");
      const result = classifyByFilenameOrAlt(payload.filename, payload.altText);
      const knownHashes = await listAssetHashes(
        this.env.ENGINE_DB,
        normalized.projectSlug,
      );
      const dedupe = await dedupeByBytes(downloaded.bytes, knownHashes);

      return { classification: result, dedupe };
    });

    const vision = await step.do("vision", async () => {
      await setStatus(this.env, jobId, "RECONSTRUCTING");
      const inputHash = classified.dedupe.contentHash ?? jobId;
      const cache = await runVisionStub({ inputHash, assetId: normalized.assetId });

      const key = analysisArtifactKey(normalized.projectSlug, jobId);
      await this.env.FLOORPLANS.put(key, JSON.stringify(cache), {
        httpMetadata: { contentType: "application/json" },
      });

      return cache;
    });

    const geometry = await step.do("geometry", async () => {
      await setStatus(this.env, jobId, "VALIDATING");
      const validation = validateGeometry({
        seedDocument: payload.seedDocument ?? payload.input?.seedDocument,
        statedAreaSqm:
          typeof payload.input?.statedAreaSqm === "number"
            ? payload.input.statedAreaSqm
            : undefined,
      });

      const key = geometryArtifactKey(normalized.projectSlug, jobId);
      await this.env.FLOORPLANS.put(
        key,
        JSON.stringify({ validation, visionConfidence: vision.confidence }),
        { httpMetadata: { contentType: "application/json" } },
      );

      return validation;
    });

    const reviewThreshold = Number.parseFloat(this.env.PUBLISH_CONFIDENCE_REVIEW);
    const highThreshold = Number.parseFloat(this.env.PUBLISH_CONFIDENCE_HIGH);

    let finalStatus: ConversionJobStatus;
    let result: Record<string, unknown>;

    if (!geometry.ok) {
      finalStatus = "NEEDS_REVIEW";
      result = {
        reason: geometry.reason,
        classification: classified.classification,
        dedupe: classified.dedupe,
        vision,
      };
    } else {
      const confidence = Math.max(
        classified.classification.confidence,
        geometry.confidence,
        vision.confidence,
      );

      // Severity-aware: shared docs may force review even at high aggregate confidence.
      finalStatus =
        geometry.needsReview || confidence < highThreshold
          ? "NEEDS_REVIEW"
          : "APPROVED";
      // reviewThreshold retained for publish path / observability
      void reviewThreshold;

      result = {
        document: geometry.document,
        confidence,
        classification: classified.classification,
        dedupe: classified.dedupe,
        vision,
      };
    }

    await setStatus(this.env, jobId, finalStatus, { result });

    logJob("info", "workflow_completed", { jobId, status: finalStatus });
    return { jobId, status: finalStatus, result };
  }
}

export { ConversionWorkflow as default };
