-- P0 hierarchy + floorplan verification foundation (additive, non-destructive)
-- Developer → Project → Precinct → Building already partially exists via buildings.
-- This migration adds precincts and floorplan verification metadata without altering existing rows.

CREATE TABLE IF NOT EXISTS precincts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  source_class TEXT NOT NULL DEFAULT 'estimated',
  provenance TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_precincts_project ON precincts(project_id);

-- Link buildings to optional precinct
ALTER TABLE buildings ADD COLUMN precinct_id TEXT REFERENCES precincts(id);

-- Floorplan verification on apartment types (visitor trust)
ALTER TABLE apartment_types ADD COLUMN floorplan_verification TEXT;
ALTER TABLE apartment_types ADD COLUMN floorplan_document_id TEXT;
ALTER TABLE apartment_types ADD COLUMN verified_at TEXT;

-- Published FloorPlanDocument pointer (R2 key + version) — D1 holds pointer, R2 holds JSON
CREATE TABLE IF NOT EXISTS published_floorplans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  apartment_type_id TEXT REFERENCES apartment_types(id) ON DELETE SET NULL,
  unit_type_code TEXT,
  bedroom_count INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'unknown',
  publication_state TEXT NOT NULL DEFAULT 'draft',
  r2_key TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'latest',
  schema_version INTEGER NOT NULL DEFAULT 1,
  scale_confidence REAL,
  overall_confidence REAL,
  source_class TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (project_id, unit_type_code, version)
);

CREATE INDEX IF NOT EXISTS idx_published_floorplans_project
  ON published_floorplans(project_id);
