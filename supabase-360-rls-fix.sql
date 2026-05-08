-- Emergency unblock for ABAWI 360 custom auth flows
-- If some legacy screens still write directly and hit RLS, run this.

ALTER TABLE IF EXISTS crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS okr_objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stat_formulaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stat_reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_contacts_all_access" ON crm_contacts;
DROP POLICY IF EXISTS "projets_all_access" ON projets;
DROP POLICY IF EXISTS "taches_all_access" ON taches;
DROP POLICY IF EXISTS "okr_objectifs_all_access" ON okr_objectifs;
DROP POLICY IF EXISTS "stat_formulaires_all_access" ON stat_formulaires;
DROP POLICY IF EXISTS "stat_reponses_all_access" ON stat_reponses;
DROP POLICY IF EXISTS "ai_jobs_all_access" ON ai_jobs;

CREATE POLICY "crm_contacts_all_access" ON crm_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "projets_all_access" ON projets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "taches_all_access" ON taches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "okr_objectifs_all_access" ON okr_objectifs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stat_formulaires_all_access" ON stat_formulaires FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stat_reponses_all_access" ON stat_reponses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ai_jobs_all_access" ON ai_jobs FOR ALL USING (true) WITH CHECK (true);

-- IMPORTANT:
-- This is a fast recovery policy for production continuity.
-- Harden later with proper Supabase Auth JWT owner checks.
