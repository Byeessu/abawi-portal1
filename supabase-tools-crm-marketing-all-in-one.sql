-- ABAWI 360 - ALL IN ONE (tables + triggers + RLS)
-- Run once in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  prenom TEXT,
  nom TEXT,
  entreprise TEXT,
  poste TEXT,
  email TEXT,
  telephone TEXT,
  whatsapp TEXT,
  ville TEXT,
  secteur TEXT,
  statut TEXT NOT NULL DEFAULT 'prospect' CHECK (statut IN ('prospect', 'contact', 'client', 'partenaire', 'inactif')),
  valeur_estimee NUMERIC(14,2) NOT NULL DEFAULT 0,
  probabilite INTEGER NOT NULL DEFAULT 0 CHECK (probabilite >= 0 AND probabilite <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  plateforme TEXT NOT NULL,
  type_contenu TEXT,
  date_publication DATE NOT NULL,
  heure TIME,
  statut TEXT NOT NULL DEFAULT 'planifié' CHECK (statut IN ('planifié', 'publié', 'brouillon', 'annulé')),
  contenu TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_campagnes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  nom TEXT NOT NULL,
  plateforme TEXT NOT NULL,
  budget NUMERIC(14,2) NOT NULL DEFAULT 0,
  depense NUMERIC(14,2) NOT NULL DEFAULT 0,
  revenus NUMERIC(14,2) NOT NULL DEFAULT 0,
  date_debut DATE,
  date_fin DATE,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'pause', 'terminée', 'annulée')),
  objectif TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  priorite TEXT DEFAULT 'moyenne',
  statut TEXT DEFAULT 'actif',
  date_echeance DATE,
  progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  statut TEXT DEFAULT 'todo' CHECK (statut IN ('todo', 'doing', 'done')),
  priorite TEXT DEFAULT 'moyenne',
  date_echeance DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS okr_objectifs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  trimestre TEXT,
  progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stat_formulaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  champs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stat_reponses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulaire_id UUID REFERENCES stat_formulaires(id) ON DELETE CASCADE,
  owner_email TEXT,
  reponse JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner_email ON crm_contacts(owner_email);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_owner_email ON marketing_posts(owner_email);
CREATE INDEX IF NOT EXISTS idx_marketing_campagnes_owner_email ON marketing_campagnes(owner_email);
CREATE INDEX IF NOT EXISTS idx_projets_owner_email ON projets(owner_email);
CREATE INDEX IF NOT EXISTS idx_taches_owner_email ON taches(owner_email);
CREATE INDEX IF NOT EXISTS idx_taches_projet_id ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_okr_objectifs_owner_email ON okr_objectifs(owner_email);
CREATE INDEX IF NOT EXISTS idx_stat_formulaires_owner_email ON stat_formulaires(owner_email);
CREATE INDEX IF NOT EXISTS idx_stat_reponses_formulaire_id ON stat_reponses(formulaire_id);

-- =========================================================
-- TRIGGERS
-- =========================================================
DROP TRIGGER IF EXISTS trg_crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_marketing_posts_updated_at ON marketing_posts;
CREATE TRIGGER trg_marketing_posts_updated_at BEFORE UPDATE ON marketing_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_marketing_campagnes_updated_at ON marketing_campagnes;
CREATE TRIGGER trg_marketing_campagnes_updated_at BEFORE UPDATE ON marketing_campagnes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_projets_updated_at ON projets;
CREATE TRIGGER trg_projets_updated_at BEFORE UPDATE ON projets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_taches_updated_at ON taches;
CREATE TRIGGER trg_taches_updated_at BEFORE UPDATE ON taches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_okr_objectifs_updated_at ON okr_objectifs;
CREATE TRIGGER trg_okr_objectifs_updated_at BEFORE UPDATE ON okr_objectifs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_stat_formulaires_updated_at ON stat_formulaires;
CREATE TRIGGER trg_stat_formulaires_updated_at BEFORE UPDATE ON stat_formulaires FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_stat_reponses_updated_at ON stat_reponses;
CREATE TRIGGER trg_stat_reponses_updated_at BEFORE UPDATE ON stat_reponses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- ADMIN HELPER
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
-- ENABLE RLS
-- =========================================================
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_formulaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_reponses ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- DROP OLD POLICIES
-- =========================================================
DROP POLICY IF EXISTS crm_owner_select ON crm_contacts;
DROP POLICY IF EXISTS crm_owner_insert ON crm_contacts;
DROP POLICY IF EXISTS crm_owner_update ON crm_contacts;
DROP POLICY IF EXISTS crm_owner_delete ON crm_contacts;
DROP POLICY IF EXISTS marketing_posts_owner_select ON marketing_posts;
DROP POLICY IF EXISTS marketing_posts_owner_insert ON marketing_posts;
DROP POLICY IF EXISTS marketing_posts_owner_update ON marketing_posts;
DROP POLICY IF EXISTS marketing_posts_owner_delete ON marketing_posts;
DROP POLICY IF EXISTS marketing_campagnes_owner_select ON marketing_campagnes;
DROP POLICY IF EXISTS marketing_campagnes_owner_insert ON marketing_campagnes;
DROP POLICY IF EXISTS marketing_campagnes_owner_update ON marketing_campagnes;
DROP POLICY IF EXISTS marketing_campagnes_owner_delete ON marketing_campagnes;
DROP POLICY IF EXISTS projets_owner_select ON projets;
DROP POLICY IF EXISTS projets_owner_insert ON projets;
DROP POLICY IF EXISTS projets_owner_update ON projets;
DROP POLICY IF EXISTS projets_owner_delete ON projets;
DROP POLICY IF EXISTS taches_owner_select ON taches;
DROP POLICY IF EXISTS taches_owner_insert ON taches;
DROP POLICY IF EXISTS taches_owner_update ON taches;
DROP POLICY IF EXISTS taches_owner_delete ON taches;
DROP POLICY IF EXISTS okr_owner_select ON okr_objectifs;
DROP POLICY IF EXISTS okr_owner_insert ON okr_objectifs;
DROP POLICY IF EXISTS okr_owner_update ON okr_objectifs;
DROP POLICY IF EXISTS okr_owner_delete ON okr_objectifs;
DROP POLICY IF EXISTS stat_formulaires_owner_select ON stat_formulaires;
DROP POLICY IF EXISTS stat_formulaires_owner_insert ON stat_formulaires;
DROP POLICY IF EXISTS stat_formulaires_owner_update ON stat_formulaires;
DROP POLICY IF EXISTS stat_formulaires_owner_delete ON stat_formulaires;
DROP POLICY IF EXISTS stat_reponses_owner_select ON stat_reponses;
DROP POLICY IF EXISTS stat_reponses_owner_insert ON stat_reponses;
DROP POLICY IF EXISTS stat_reponses_owner_update ON stat_reponses;
DROP POLICY IF EXISTS stat_reponses_owner_delete ON stat_reponses;

-- =========================================================
-- OWNER + ADMIN POLICIES
-- =========================================================
CREATE POLICY crm_owner_select ON crm_contacts FOR SELECT TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY crm_owner_insert ON crm_contacts FOR INSERT TO authenticated WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY crm_owner_update ON crm_contacts FOR UPDATE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin()) WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY crm_owner_delete ON crm_contacts FOR DELETE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_posts_owner_select ON marketing_posts FOR SELECT TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY marketing_posts_owner_insert ON marketing_posts FOR INSERT TO authenticated WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY marketing_posts_owner_update ON marketing_posts FOR UPDATE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin()) WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY marketing_posts_owner_delete ON marketing_posts FOR DELETE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY marketing_campagnes_owner_select ON marketing_campagnes FOR SELECT TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY marketing_campagnes_owner_insert ON marketing_campagnes FOR INSERT TO authenticated WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY marketing_campagnes_owner_update ON marketing_campagnes FOR UPDATE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin()) WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY marketing_campagnes_owner_delete ON marketing_campagnes FOR DELETE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY projets_owner_select ON projets FOR SELECT TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY projets_owner_insert ON projets FOR INSERT TO authenticated WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY projets_owner_update ON projets FOR UPDATE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin()) WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY projets_owner_delete ON projets FOR DELETE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY taches_owner_select ON taches FOR SELECT TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY taches_owner_insert ON taches FOR INSERT TO authenticated WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY taches_owner_update ON taches FOR UPDATE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin()) WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY taches_owner_delete ON taches FOR DELETE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY okr_owner_select ON okr_objectifs FOR SELECT TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY okr_owner_insert ON okr_objectifs FOR INSERT TO authenticated WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY okr_owner_update ON okr_objectifs FOR UPDATE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin()) WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY okr_owner_delete ON okr_objectifs FOR DELETE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY stat_formulaires_owner_select ON stat_formulaires FOR SELECT TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY stat_formulaires_owner_insert ON stat_formulaires FOR INSERT TO authenticated WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY stat_formulaires_owner_update ON stat_formulaires FOR UPDATE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin()) WITH CHECK (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());
CREATE POLICY stat_formulaires_owner_delete ON stat_formulaires FOR DELETE TO authenticated USING (lower(owner_email) = lower(coalesce(auth.email(), '')) OR public.is_abawi_admin());

CREATE POLICY stat_reponses_owner_select ON stat_reponses FOR SELECT TO authenticated USING (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (SELECT 1 FROM stat_formulaires sf WHERE sf.id = stat_reponses.formulaire_id AND lower(sf.owner_email) = lower(coalesce(auth.email(), '')))
);
CREATE POLICY stat_reponses_owner_insert ON stat_reponses FOR INSERT TO authenticated WITH CHECK (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, coalesce(auth.email(), ''))) = lower(coalesce(auth.email(), ''))
);
CREATE POLICY stat_reponses_owner_update ON stat_reponses FOR UPDATE TO authenticated USING (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (SELECT 1 FROM stat_formulaires sf WHERE sf.id = stat_reponses.formulaire_id AND lower(sf.owner_email) = lower(coalesce(auth.email(), '')))
) WITH CHECK (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (SELECT 1 FROM stat_formulaires sf WHERE sf.id = stat_reponses.formulaire_id AND lower(sf.owner_email) = lower(coalesce(auth.email(), '')))
);
CREATE POLICY stat_reponses_owner_delete ON stat_reponses FOR DELETE TO authenticated USING (
  public.is_abawi_admin()
  OR lower(coalesce(owner_email, '')) = lower(coalesce(auth.email(), ''))
  OR EXISTS (SELECT 1 FROM stat_formulaires sf WHERE sf.id = stat_reponses.formulaire_id AND lower(sf.owner_email) = lower(coalesce(auth.email(), '')))
);

-- =========================================================
-- CHECK
-- =========================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('crm_contacts', 'marketing_posts', 'marketing_campagnes', 'projets', 'taches', 'okr_objectifs', 'stat_formulaires', 'stat_reponses')
ORDER BY tablename;
