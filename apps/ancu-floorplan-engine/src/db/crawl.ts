export type CrawlJobRow = {
  id: string;
  source_id: string | null;
  seed_url: string;
  status: string;
  error_message: string | null;
  result_json: string | null;
  created_at: string;
  updated_at: string;
};

export async function createCrawlJob(
  db: D1Database,
  input: {
    id: string;
    seedUrl: string;
    sourceId?: string;
  },
): Promise<CrawlJobRow> {
  await db
    .prepare(
      `INSERT INTO crawl_jobs (id, source_id, seed_url, status)
       VALUES (?, ?, ?, 'pending')`,
    )
    .bind(input.id, input.sourceId ?? null, input.seedUrl)
    .run();

  const row = await getCrawlJob(db, input.id);
  if (!row) throw new Error("failed_to_create_crawl_job");
  return row;
}

export async function getCrawlJob(
  db: D1Database,
  id: string,
): Promise<CrawlJobRow | null> {
  return db
    .prepare(`SELECT * FROM crawl_jobs WHERE id = ?`)
    .bind(id)
    .first<CrawlJobRow>();
}

export async function updateCrawlJob(
  db: D1Database,
  id: string,
  patch: {
    status?: string;
    errorMessage?: string;
    result?: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE crawl_jobs
       SET status = COALESCE(?, status),
           error_message = COALESCE(?, error_message),
           result_json = COALESCE(?, result_json),
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      patch.status ?? null,
      patch.errorMessage ?? null,
      patch.result ? JSON.stringify(patch.result) : null,
      id,
    )
    .run();
}

export async function addCrawlCandidate(
  db: D1Database,
  input: {
    id: string;
    crawlJobId: string;
    url: string;
    status?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO crawl_candidates (id, crawl_job_id, url, status, metadata_json)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.crawlJobId,
      input.url,
      input.status ?? "discovered",
      input.metadata ? JSON.stringify(input.metadata) : null,
    )
    .run();
}

export async function ensureSource(
  db: D1Database,
  input: {
    id: string;
    projectSlug: string;
    domain: string;
    baseUrl: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO floorplan_sources (id, project_slug, domain, base_url, allowlisted)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(id) DO NOTHING`,
    )
    .bind(input.id, input.projectSlug, input.domain, input.baseUrl)
    .run();
}
