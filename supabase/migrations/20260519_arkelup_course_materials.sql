-- ═══════════════════════════════════════════════════════════════════════════════
-- ArkelUp Course Materials (PDFs, Supports)
-- Admin uploads, approved students & instructors can download
-- ═══════════════════════════════════════════════════════════════════════════════

-- Table: arkelup_course_materials
CREATE TABLE IF NOT EXISTS arkelup_course_materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     TEXT NOT NULL,                -- matches SEED_COURSES.id
  title         TEXT NOT NULL,                -- "Support PDF - Module 1"
  file_name     TEXT NOT NULL,                -- stored filename in bucket
  file_url      TEXT NOT NULL,                -- Supabase Storage public URL
  file_size     INT,                          -- bytes
  mime_type     TEXT DEFAULT 'application/pdf',
  uploaded_by   UUID REFERENCES membres(id) ON DELETE SET NULL, -- admin who uploaded
  is_public     BOOLEAN NOT NULL DEFAULT false, -- if true, visible without approval
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arkelup_materials_course ON arkelup_course_materials(course_id, sort_order);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_timestamp_arkelup_materials ON arkelup_course_materials;
CREATE TRIGGER set_timestamp_arkelup_materials
  BEFORE UPDATE ON arkelup_course_materials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════════
-- View: course_materials_with_uploader
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW arkelup_course_materials_view AS
SELECT
  m.id,
  m.course_id,
  m.title,
  m.file_name,
  m.file_url,
  m.file_size,
  m.mime_type,
  m.uploaded_by,
  m.is_public,
  m.sort_order,
  m.created_at,
  u.prenom AS uploader_prenom,
  u.nom AS uploader_nom
FROM arkelup_course_materials m
LEFT JOIN membres u ON u.id = m.uploaded_by
ORDER BY m.course_id, m.sort_order, m.created_at;

GRANT SELECT ON arkelup_course_materials_view TO authenticated, anon;
