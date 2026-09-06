import type { ConversionJobStatus } from "../pipeline/states";

export type ConversionJobRow = {
  id: string;
  project_slug: string | null;
  source_id: string | null;
  asset_id: string | null;
  status: ConversionJobStatus;
  input_json: string | null;
  result_json: string | null;
  error_message: string | null;
  workflow_instance_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateConversionJobInput = {
  id: string;
  projectSlug?: string;
  sourceId?: string;
  assetId?: string;
  input?: Record<string, unknown>;
};

export async function createConversionJob(
  db: D1Database,
  input: CreateConversionJobInput,
): Promise<ConversionJobRow> {
  await db
    .prepare(
      `INSERT INTO conversion_jobs
        (id, project_slug, source_id, asset_id, status, input_json)
       VALUES (?, ?, ?, ?, 'DISCOVERED', ?)`,
    )
    .bind(
      input.id,
      input.projectSlug ?? null,
      input.sourceId ?? null,
      input.assetId ?? null,
      input.input ? JSON.stringify(input.input) : null,
    )
    .run();

  const row = await getConversionJob(db, input.id);
  if (!row) throw new Error("failed_to_create_conversion_job");
  return row;
}

export async function getConversionJob(
  db: D1Database,
  id: string,
): Promise<ConversionJobRow | null> {
  return db
    .prepare(`SELECT * FROM conversion_jobs WHERE id = ?`)
    .bind(id)
    .first<ConversionJobRow>();
}

export async function updateConversionJobStatus(
  db: D1Database,
  id: string,
  status: ConversionJobStatus,
  patch?: {
    result?: Record<string, unknown>;
    errorMessage?: string;
    workflowInstanceId?: string;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE conversion_jobs
       SET status = ?,
           result_json = COALESCE(?, result_json),
           error_message = COALESCE(?, error_message),
           workflow_instance_id = COALESCE(?, workflow_instance_id),
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      status,
      patch?.result ? JSON.stringify(patch.result) : null,
      patch?.errorMessage ?? null,
      patch?.workflowInstanceId ?? null,
      id,
    )
    .run();
}

export async function listAssetHashes(
  db: D1Database,
  projectSlug?: string,
): Promise<Set<string>> {
  const stmt = projectSlug
    ? db
        .prepare(
          `SELECT content_hash FROM floorplan_assets
           WHERE content_hash IS NOT NULL AND project_slug = ?`,
        )
        .bind(projectSlug)
    : db.prepare(
        `SELECT content_hash FROM floorplan_assets WHERE content_hash IS NOT NULL`,
      );

  const { results } = await stmt.all<{ content_hash: string }>();
  return new Set(results?.map((r) => r.content_hash) ?? []);
}

export type FloorplanVersionRow = {
  id: string;
  project_slug: string;
  conversion_job_id: string | null;
  version_number: number;
  status: string;
  r2_key: string;
  confidence: number | null;
  metadata_json: string | null;
  published_at: string | null;
  created_at: string;
};

export async function createFloorplanVersion(
  db: D1Database,
  input: {
    id: string;
    projectSlug: string;
    conversionJobId: string;
    r2Key: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
    status?: string;
  },
): Promise<FloorplanVersionRow> {
  await db
    .prepare(
      `INSERT INTO floorplan_versions
        (id, project_slug, conversion_job_id, version_number, status, r2_key, confidence, metadata_json, published_at)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.projectSlug,
      input.conversionJobId,
      input.status ?? "published",
      input.r2Key,
      input.confidence ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.status === "published" ? new Date().toISOString() : null,
    )
    .run();

  const row = await db
    .prepare(`SELECT * FROM floorplan_versions WHERE id = ?`)
    .bind(input.id)
    .first<FloorplanVersionRow>();
  if (!row) throw new Error("failed_to_create_floorplan_version");
  return row;
}

export async function getLatestVersionForJob(
  db: D1Database,
  conversionJobId: string,
): Promise<FloorplanVersionRow | null> {
  return db
    .prepare(
      `SELECT * FROM floorplan_versions
       WHERE conversion_job_id = ?
       ORDER BY version_number DESC
       LIMIT 1`,
    )
    .bind(conversionJobId)
    .first<FloorplanVersionRow>();
}

export async function upsertReview(
  db: D1Database,
  input: {
    id: string;
    conversionJobId: string;
    status: "pending" | "approved" | "rejected";
    note?: string;
    versionId?: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO floorplan_reviews
        (id, conversion_job_id, version_id, status, reviewer_note)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         reviewer_note = excluded.reviewer_note,
         version_id = COALESCE(excluded.version_id, floorplan_reviews.version_id),
         updated_at = datetime('now')`,
    )
    .bind(
      input.id,
      input.conversionJobId,
      input.versionId ?? null,
      input.status,
      input.note ?? null,
    )
    .run();
}
