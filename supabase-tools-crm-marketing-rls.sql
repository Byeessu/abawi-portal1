-- ABAWI 360 - RLS secure policies
-- Run AFTER tables are created (supabase-tools-crm-marketing.sql).

-- =========================================================
-- Helper: detect admin from membres table
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_abawi_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.membres m
    WHERE lower(coalesce(m.email, '')) = lower(coalesce(auth.email(), ''))
      AND (
        lower(coalesce(m.role, '')) = 'admin'
        OR lower(coalesce(m.plan_type, '')) = 'admin'
        OR lower(coalesce(m.plan, '')) = 'admin'
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_abawi_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_abawi_admin() TO authenticated;

-- =========================================================
-- Enable RLS
-- =========================================================
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_formulaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_reponses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS crm_contacts_select ON crm_contacts;
DROP POLICY IF EXISTS crm_contacts_insert ON crm_contacts;
DROP POLICY IF EXISTS crm_contacts_update ON crm_contacts;
DROP POLICY IF EXISTS crm_contacts_delete ON crm_contacts;

DROP POLICY IF EXISTS marketing_posts_select ON marketing_posts;
DROP POLICY IF EXISTS marketing_posts_insert ON marketing_posts;
DROP POLICY IF EXISTS marketing_posts_update ON marketing_posts;
DROP POLICY IF EXISTS marketing_posts_delete ON marketing_posts;

DROP POLICY IF EXISTS marketing_campagnes_select ON marketing_campagnes;
DROP POLICY IF EXISTS marketing_campagnes_insert ON marketing_campagnes;
DROP POLICY IF EXISTS marketing_campagnes_update ON marketing_campagnes;
DROP POLICY IF EXISTS marketing_campagnes_delete ON marketing_campagnes;

DROP POLICY IF EXISTS projets_select ON projets;
DROP POLICY IF EXISTS projets_insert ON projets;
DROP POLICY IF EXISTS projets_update ON projets;
DROP POLICY IF EXISTS projets_delete ON projets;

DROP POLICY IF EXISTS taches_select ON taches;
DROP POLICY IF EXISTS taches_insert ON taches;
DROP POLICY IF EXISTS taches_update ON taches;
DROP POLICY IF EXISTS taches_delete ON taches;

DROP POLICY IF EXISTS okr_objectifs_select ON okr_objectifs;
DROP POLICY IF EXISTS okr_objectifs_insert ON okr_objectifs;
DROP POLICY IF EXISTS okr_objectifs_update ON okr_objectifs;
DROP POLICY IF EXISTS okr_objectifs_delete ON okr_objectifs;

DROP POLICY IF EXISTS stat_formulaires_select ON stat_formulaires;
DROP POLICY IF EXISTS stat_formulaires_insert ON stat_formulaires;
DROP POLICY IF EXISTS stat_formulaires_update ON stat_formulaires;
DROP POLICY IF EXISTS stat_formulaires_delete ON stat_formulaires;

DROP POLICY IF EXISTS stat_reponses_select ON stat_reponses;
DROP POLICY IF EXISTS stat_reponses_insert ON stat_reponses;
DROP POLICY IF EXISTS stat_reponses_update ON stat_reponses;
DROP POLICY IF EXISTS stat_reponses_delete ON stat_reponses;

-- =========================================================
-- CRM CONTACTS policies
-- =========================================================
CREATE POLICY crm_contacts_select ON crm_contacts
FOR SELECT TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY crm_contacts_insert ON crm_contacts
FOR INSERT TO authenticated
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY crm_contacts_update ON crm_contacts
FOR UPDATE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin())
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY crm_contacts_delete ON crm_contacts
FOR DELETE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

-- =========================================================
-- MARKETING POSTS policies
-- =========================================================
CREATE POLICY marketing_posts_select ON marketing_posts
FOR SELECT TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_posts_insert ON marketing_posts
FOR INSERT TO authenticated
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_posts_update ON marketing_posts
FOR UPDATE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin())
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_posts_delete ON marketing_posts
FOR DELETE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

-- =========================================================
-- MARKETING CAMPAGNES policies
-- =========================================================
CREATE POLICY marketing_campagnes_select ON marketing_campagnes
FOR SELECT TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_campagnes_insert ON marketing_campagnes
FOR INSERT TO authenticated
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_campagnes_update ON marketing_campagnes
FOR UPDATE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin())
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_campagnes_delete ON marketing_campagnes
FOR DELETE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

-- =========================================================
-- PROJETS policies
-- =========================================================
CREATE POLICY projets_select ON projets
FOR SELECT TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY projets_insert ON projets
FOR INSERT TO authenticated
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY projets_update ON projets
FOR UPDATE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin())
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY projets_delete ON projets
FOR DELETE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

-- =========================================================
-- TACHES policies
-- =========================================================
CREATE POLICY taches_select ON taches
FOR SELECT TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY taches_insert ON taches
FOR INSERT TO authenticated
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY taches_update ON taches
FOR UPDATE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin())
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY taches_delete ON taches
FOR DELETE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

-- =========================================================
-- OKR policies
-- =========================================================
CREATE POLICY okr_objectifs_select ON okr_objectifs
FOR SELECT TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY okr_objectifs_insert ON okr_objectifs
FOR INSERT TO authenticated
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY okr_objectifs_update ON okr_objectifs
FOR UPDATE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin())
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY okr_objectifs_delete ON okr_objectifs
FOR DELETE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

-- =========================================================
-- FORMULAIRES policies
-- =========================================================
CREATE POLICY stat_formulaires_select ON stat_formulaires
FOR SELECT TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY stat_formulaires_insert ON stat_formulaires
FOR INSERT TO authenticated
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY stat_formulaires_update ON stat_formulaires
FOR UPDATE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin())
WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY stat_formulaires_delete ON stat_formulaires
FOR DELETE TO authenticated
USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

-- =========================================================
-- REPONSES policies
-- - owner_email can be null for anonymous responses.
-- - owners/admin can read/update/delete all responses for their forms.
-- =========================================================
CREATE POLICY stat_reponses_select ON stat_reponses
FOR SELECT TO authenticated
USING (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (
    SELECT 1
    FROM stat_formulaires sf
    WHERE sf.id = stat_reponses.formulaire_id
      AND lower(sf.owner_email) = lower(coalesce(auth.email(), ''))
  )
);

CREATE POLICY stat_reponses_insert ON stat_reponses
FOR INSERT TO authenticated
WITH CHECK (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, coalesce(auth.email(), ''))) = lower(coalesce(auth.email(), ''))
);

CREATE POLICY stat_reponses_update ON stat_reponses
FOR UPDATE TO authenticated
USING (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (
    SELECT 1
    FROM stat_formulaires sf
    WHERE sf.id = stat_reponses.formulaire_id
      AND lower(sf.owner_email) = lower(coalesce(auth.email(), ''))
  )
)
WITH CHECK (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (
    SELECT 1
    FROM stat_formulaires sf
    WHERE sf.id = stat_reponses.formulaire_id
      AND lower(sf.owner_email) = lower(coalesce(auth.email(), ''))
  )
);

CREATE POLICY stat_reponses_delete ON stat_reponses
FOR DELETE TO authenticated
USING (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (
    SELECT 1
    FROM stat_formulaires sf
    WHERE sf.id = stat_reponses.formulaire_id
      AND lower(sf.owner_email) = lower(coalesce(auth.email(), ''))
  )
);

-- =========================================================
-- Verification helpers
-- =========================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'crm_contacts',
    'marketing_posts',
    'marketing_campagnes',
    'projets',
    'taches',
    'okr_objectifs',
    'stat_formulaires',
    'stat_reponses'
  )
ORDER BY tablename;
