-- Emergency RLS unblock for ABAWI custom auth (no Supabase Auth JWT)
-- Apply in Supabase SQL editor when marketing tools throw:
-- "new row violates row-level security policy"

ALTER TABLE IF EXISTS marketing_campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS marketing_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_campagnes_select_owner" ON marketing_campagnes;
DROP POLICY IF EXISTS "marketing_campagnes_insert_owner" ON marketing_campagnes;
DROP POLICY IF EXISTS "marketing_campagnes_update_owner" ON marketing_campagnes;
DROP POLICY IF EXISTS "marketing_campagnes_delete_owner" ON marketing_campagnes;

DROP POLICY IF EXISTS "marketing_posts_select_owner" ON marketing_posts;
DROP POLICY IF EXISTS "marketing_posts_insert_owner" ON marketing_posts;
DROP POLICY IF EXISTS "marketing_posts_update_owner" ON marketing_posts;
DROP POLICY IF EXISTS "marketing_posts_delete_owner" ON marketing_posts;

-- Temporary permissive policies for operational continuity.
CREATE POLICY "marketing_campagnes_all_access"
ON marketing_campagnes
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "marketing_posts_all_access"
ON marketing_posts
FOR ALL
USING (true)
WITH CHECK (true);

-- Recommended hardening later:
-- replace USING/CHECK true with owner_email checks via JWT
-- after migrating to real Supabase Auth.
