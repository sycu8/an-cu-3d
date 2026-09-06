-- Project build orchestration tracking on engine (optional mirror)

CREATE TABLE IF NOT EXISTS project_build_runs (
  id TEXT PRIMARY KEY,
  property_job_id TEXT,
  project_name TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  stage TEXT NOT NULL DEFAULT 'queued',
  result_json TEXT,
  error_message TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_project_build_runs_slug ON project_build_runs(project_slug);
