-- AnCư 3D property metadata (P4)
-- IDs are TEXT (ULID/UUID strings)

CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  website TEXT,
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  developer_id TEXT NOT NULL REFERENCES developers(id),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  city TEXT,
  district TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  handover TEXT,
  price_range TEXT,
  total_units TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  confidence REAL DEFAULT 0.5,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer_id);

CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  floors INTEGER,
  units_per_floor TEXT,
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_buildings_project ON buildings(project_id);

CREATE TABLE IF NOT EXISTS apartment_types (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqm TEXT,
  floorplan_key TEXT,
  price TEXT,
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  confidence REAL DEFAULT 0.5,
  validation_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_apartment_types_project ON apartment_types(project_id);
CREATE INDEX IF NOT EXISTS idx_apartment_types_slug ON apartment_types(slug);

CREATE TABLE IF NOT EXISTS amenities (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_amenities_project ON amenities(project_id);
CREATE INDEX IF NOT EXISTS idx_amenities_category ON amenities(category);

CREATE TABLE IF NOT EXISTS nearby_places (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  distance_km TEXT,
  travel_time TEXT,
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nearby_project ON nearby_places(project_id);
CREATE INDEX IF NOT EXISTS idx_nearby_category ON nearby_places(category);

CREATE TABLE IF NOT EXISTS project_media (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  kind TEXT NOT NULL,
  url TEXT,
  r2_key TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_project ON project_media(project_id);

CREATE TABLE IF NOT EXISTS project_sources (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  source_type TEXT NOT NULL,
  source_url TEXT,
  source_label TEXT,
  retrieved_at TEXT,
  source_class TEXT NOT NULL DEFAULT 'verified_public',
  provenance TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sources_project ON project_sources(project_id);
