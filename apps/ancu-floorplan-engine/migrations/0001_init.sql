-- AnCư floorplan engine — initial schema (P4)

CREATE TABLE IF NOT EXISTS floorplan_sources (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  domain TEXT NOT NULL,
  base_url TEXT NOT NULL,
  allowlisted INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS floorplan_assets (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  project_slug TEXT,
  content_hash TEXT,
  mime_type TEXT,
  byte_size INTEGER,
  r2_key TEXT NOT NULL,
  classification TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES floorplan_sources(id)
);

CREATE TABLE IF NOT EXISTS crawl_jobs (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  seed_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  result_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES floorplan_sources(id)
);

CREATE TABLE IF NOT EXISTS crawl_candidates (
  id TEXT PRIMARY KEY,
  crawl_job_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'discovered',
  content_hash TEXT,
  r2_key TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (crawl_job_id) REFERENCES crawl_jobs(id)
);

CREATE TABLE IF NOT EXISTS conversion_jobs (
  id TEXT PRIMARY KEY,
  project_slug TEXT,
  source_id TEXT,
  asset_id TEXT,
  status TEXT NOT NULL DEFAULT 'DISCOVERED',
  input_json TEXT,
  result_json TEXT,
  error_message TEXT,
  workflow_instance_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES floorplan_sources(id),
  FOREIGN KEY (asset_id) REFERENCES floorplan_assets(id)
);

CREATE TABLE IF NOT EXISTS floorplan_versions (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  conversion_job_id TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  r2_key TEXT NOT NULL,
  confidence REAL,
  metadata_json TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversion_job_id) REFERENCES conversion_jobs(id)
);

CREATE TABLE IF NOT EXISTS floorplan_reviews (
  id TEXT PRIMARY KEY,
  conversion_job_id TEXT NOT NULL,
  version_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversion_job_id) REFERENCES conversion_jobs(id),
  FOREIGN KEY (version_id) REFERENCES floorplan_versions(id)
);

CREATE INDEX IF NOT EXISTS idx_conversion_jobs_status ON conversion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_floorplan_assets_hash ON floorplan_assets(content_hash);
CREATE INDEX IF NOT EXISTS idx_floorplan_assets_project ON floorplan_assets(project_slug);
CREATE INDEX IF NOT EXISTS idx_floorplan_versions_project ON floorplan_versions(project_slug);
CREATE INDEX IF NOT EXISTS idx_crawl_candidates_job ON crawl_candidates(crawl_job_id);
