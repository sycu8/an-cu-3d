import type { ProjectBuildEvent, ProjectBuildJob, ProjectBuildStage } from "@ancu/shared";

export type JobRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  stage: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  result_json: string | null;
  created_at: string;
};

export function mapJob(row: JobRow, events?: ProjectBuildEvent[]): ProjectBuildJob {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status as ProjectBuildJob["status"],
    stage: row.stage as ProjectBuildStage,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    error: row.error,
    resultJson: row.result_json,
    createdAt: row.created_at,
    events,
  };
}

export async function createBuildJob(
  db: D1Database,
  input: { id: string; name: string; slug: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO project_build_jobs (id, name, slug, status, stage)
       VALUES (?, ?, ?, 'queued', 'queued')`,
    )
    .bind(input.id, input.name, input.slug)
    .run();
}

export async function updateBuildJob(
  db: D1Database,
  id: string,
  patch: {
    status?: string;
    stage?: string;
    startedAt?: string | null;
    finishedAt?: string | null;
    error?: string | null;
    resultJson?: string | null;
  },
): Promise<void> {
  const sets: string[] = ["updated_at = datetime('now')"];
  const binds: unknown[] = [];
  if (patch.status !== undefined) {
    sets.push("status = ?");
    binds.push(patch.status);
  }
  if (patch.stage !== undefined) {
    sets.push("stage = ?");
    binds.push(patch.stage);
  }
  if (patch.startedAt !== undefined) {
    sets.push("started_at = ?");
    binds.push(patch.startedAt);
  }
  if (patch.finishedAt !== undefined) {
    sets.push("finished_at = ?");
    binds.push(patch.finishedAt);
  }
  if (patch.error !== undefined) {
    sets.push("error = ?");
    binds.push(patch.error);
  }
  if (patch.resultJson !== undefined) {
    sets.push("result_json = ?");
    binds.push(patch.resultJson);
  }
  binds.push(id);
  await db
    .prepare(`UPDATE project_build_jobs SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();
}

export async function appendBuildEvent(
  db: D1Database,
  event: {
    id: string;
    jobId: string;
    stage: ProjectBuildStage;
    message: string;
    atMs: number;
    elapsedMs: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO project_build_events (id, job_id, stage, message, at_ms, elapsed_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(event.id, event.jobId, event.stage, event.message, event.atMs, event.elapsedMs)
    .run();
  await updateBuildJob(db, event.jobId, { stage: event.stage });
}

export async function getBuildJob(
  db: D1Database,
  id: string,
): Promise<ProjectBuildJob | null> {
  const row = await db
    .prepare(`SELECT * FROM project_build_jobs WHERE id = ?`)
    .bind(id)
    .first<JobRow>();
  if (!row) return null;
  const eventRows = await db
    .prepare(
      `SELECT id, job_id, stage, message, at_ms, elapsed_ms
       FROM project_build_events WHERE job_id = ? ORDER BY at_ms ASC`,
    )
    .bind(id)
    .all<{
      id: string;
      job_id: string;
      stage: string;
      message: string;
      at_ms: number;
      elapsed_ms: number;
    }>();
  const events: ProjectBuildEvent[] = (eventRows.results ?? []).map((e) => ({
    id: e.id,
    jobId: e.job_id,
    stage: e.stage as ProjectBuildStage,
    message: e.message,
    atMs: e.at_ms,
    elapsedMs: e.elapsed_ms,
  }));
  return mapJob(row, events);
}

export async function listBuildJobs(db: D1Database, limit = 50): Promise<ProjectBuildJob[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM project_build_jobs ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<JobRow>();
  return (rows.results ?? []).map((r) => mapJob(r));
}
