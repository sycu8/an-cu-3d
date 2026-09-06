-- Admin jobs, blog, research fields for projects (P30+)

ALTER TABLE projects ADD COLUMN research_json TEXT;
ALTER TABLE projects ADD COLUMN cover_r2_key TEXT;
ALTER TABLE projects ADD COLUMN published_at TEXT;
ALTER TABLE projects ADD COLUMN showroom_json TEXT;

CREATE TABLE IF NOT EXISTS project_build_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  stage TEXT NOT NULL DEFAULT 'queued',
  started_at TEXT,
  finished_at TEXT,
  error TEXT,
  result_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_build_jobs_status ON project_build_jobs(status);
CREATE INDEX IF NOT EXISTS idx_build_jobs_slug ON project_build_jobs(slug);

CREATE TABLE IF NOT EXISTS project_build_events (
  id TEXT PRIMARY KEY NOT NULL,
  job_id TEXT NOT NULL REFERENCES project_build_jobs(id),
  stage TEXT NOT NULL,
  message TEXT NOT NULL,
  at_ms INTEGER NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_build_events_job ON project_build_events(job_id);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL,
  cover_r2_key TEXT,
  cover_url TEXT,
  project_slugs_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  locale TEXT NOT NULL DEFAULT 'vi',
  seo_title TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);

CREATE TABLE IF NOT EXISTS blog_media (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES blog_posts(id),
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  alt_text TEXT,
  prompt TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_blog_media_post ON blog_media(post_id);
