-- Effective default for a new project row is 'draft', which public reads do not return.
-- 0001 still declares DEFAULT 'active'. D1 cannot change a column default without
-- dropping projects, and amenities, apartment types, nearby places, and sources
-- reference that table. The build pipeline never uses the column default: it
-- writes 'published' or 'failed' itself.
-- This trigger rewrites the legacy default when an INSERT stores 'active'
-- (the value SQLite fills in when status is omitted, and the only status that
-- was implicit). Explicit 'published', 'failed', and 'draft' inserts are unchanged.
-- Rows that were already 'active' before this migration stay 'active' so admin
-- can still see them. 'draft' stays off the public API until approve-all.

CREATE TRIGGER IF NOT EXISTS projects_omit_status_defaults_to_draft
AFTER INSERT ON projects
FOR EACH ROW
WHEN NEW.status = 'active'
BEGIN
  UPDATE projects
  SET status = 'draft'
  WHERE id = NEW.id
    AND status = 'active';
END;
