-- ═══════════════════════════════════════════════════════════════════════════════
-- ArkelUp Online Course Enrollments System
-- Admin-controlled access: users request enrollment, admin approves/rejects
-- ═══════════════════════════════════════════════════════════════════════════════

-- Table: arkelup_enrollments
-- Stores enrollment requests for online courses
CREATE TABLE IF NOT EXISTS arkelup_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     TEXT NOT NULL,                -- e.g. 'c1', 'c2' (matches SEED_COURSES.id)
  user_id       UUID NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES membres(id) ON DELETE SET NULL,
  notes         TEXT,                         -- admin notes (rejection reason, etc.)
  progress_pct  INT NOT NULL DEFAULT 0,       -- cached progress percentage
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(course_id, user_id)                  -- one enrollment per course per user
);

-- Index for fast lookups by user and status
CREATE INDEX IF NOT EXISTS idx_arkelup_enrollments_user ON arkelup_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_arkelup_enrollments_course ON arkelup_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_arkelup_enrollments_pending ON arkelup_enrollments(status, requested_at) WHERE status = 'pending';

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_arkelup_enrollments ON arkelup_enrollments;
CREATE TRIGGER set_timestamp_arkelup_enrollments
  BEFORE UPDATE ON arkelup_enrollments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- RLS disabled: this project uses a custom auth system (localStorage + membres table)
-- Security enforced at application layer (frontend checks + admin-only mutations)
-- ALTER TABLE arkelup_enrollments ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- View: pending_enrollments_with_user_info
-- Helper for admin dashboard to see pending requests with user details
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW arkelup_enrollment_requests AS
SELECT
  ae.id,
  ae.course_id,
  ae.user_id,
  ae.status,
  ae.requested_at,
  ae.approved_at,
  ae.approved_by,
  ae.notes,
  ae.progress_pct,
  m.prenom AS user_prenom,
  m.nom AS user_nom,
  m.email AS user_email,
  m.telephone AS user_telephone,
  m.statut AS user_statut,
  m.plan_type AS user_plan
FROM arkelup_enrollments ae
LEFT JOIN membres m ON m.id = ae.user_id
ORDER BY ae.requested_at DESC;

-- Grant access to the view
GRANT SELECT ON arkelup_enrollment_requests TO authenticated, anon;
