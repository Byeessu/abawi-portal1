-- ABAWI 360 - CRM & Marketing SQL
-- Execute this script in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generic updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- CRM CONTACTS
-- ======================================
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

CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner_email ON crm_contacts(owner_email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_statut ON crm_contacts(statut);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created_at ON crm_contacts(created_at DESC);

DROP TRIGGER IF EXISTS trg_crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated_at
BEFORE UPDATE ON crm_contacts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ======================================
-- MARKETING POSTS (editorial calendar)
-- ======================================
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

CREATE INDEX IF NOT EXISTS idx_marketing_posts_owner_email ON marketing_posts(owner_email);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_date_publication ON marketing_posts(date_publication);
CREATE INDEX IF NOT EXISTS idx_marketing_posts_statut ON marketing_posts(statut);

DROP TRIGGER IF EXISTS trg_marketing_posts_updated_at ON marketing_posts;
CREATE TRIGGER trg_marketing_posts_updated_at
BEFORE UPDATE ON marketing_posts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ======================================
-- MARKETING CAMPAGNES (ROI tracking)
-- ======================================
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

CREATE INDEX IF NOT EXISTS idx_marketing_campagnes_owner_email ON marketing_campagnes(owner_email);
CREATE INDEX IF NOT EXISTS idx_marketing_campagnes_statut ON marketing_campagnes(statut);
CREATE INDEX IF NOT EXISTS idx_marketing_campagnes_created_at ON marketing_campagnes(created_at DESC);

DROP TRIGGER IF EXISTS trg_marketing_campagnes_updated_at ON marketing_campagnes;
CREATE TRIGGER trg_marketing_campagnes_updated_at
BEFORE UPDATE ON marketing_campagnes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ======================================
-- Optional: disable RLS on these tables to match
-- the current app logic based on owner_email.
-- ======================================
ALTER TABLE crm_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campagnes DISABLE ROW LEVEL SECURITY;

-- ======================================
-- PLANIFICATION / PROJETS
-- ======================================
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

CREATE INDEX IF NOT EXISTS idx_projets_owner_email ON projets(owner_email);
CREATE INDEX IF NOT EXISTS idx_taches_owner_email ON taches(owner_email);
CREATE INDEX IF NOT EXISTS idx_taches_projet_id ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_okr_owner_email ON okr_objectifs(owner_email);

DROP TRIGGER IF EXISTS trg_projets_updated_at ON projets;
CREATE TRIGGER trg_projets_updated_at
BEFORE UPDATE ON projets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_taches_updated_at ON taches;
CREATE TRIGGER trg_taches_updated_at
BEFORE UPDATE ON taches
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_okr_updated_at ON okr_objectifs;
CREATE TRIGGER trg_okr_updated_at
BEFORE UPDATE ON okr_objectifs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE projets DISABLE ROW LEVEL SECURITY;
ALTER TABLE taches DISABLE ROW LEVEL SECURITY;
ALTER TABLE okr_objectifs DISABLE ROW LEVEL SECURITY;

-- ======================================
-- STATISTIQUES / FORMULAIRES
-- ======================================
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

CREATE INDEX IF NOT EXISTS idx_stat_formulaires_owner_email ON stat_formulaires(owner_email);
CREATE INDEX IF NOT EXISTS idx_stat_reponses_formulaire_id ON stat_reponses(formulaire_id);
CREATE INDEX IF NOT EXISTS idx_stat_reponses_created_at ON stat_reponses(created_at DESC);

DROP TRIGGER IF EXISTS trg_stat_formulaires_updated_at ON stat_formulaires;
CREATE TRIGGER trg_stat_formulaires_updated_at
BEFORE UPDATE ON stat_formulaires
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_stat_reponses_updated_at ON stat_reponses;
CREATE TRIGGER trg_stat_reponses_updated_at
BEFORE UPDATE ON stat_reponses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE stat_formulaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE stat_reponses DISABLE ROW LEVEL SECURITY;

-- ======================================
-- Quick validation
-- ======================================
SELECT 'crm_contacts' AS table_name, COUNT(*) AS rows FROM crm_contacts
UNION ALL
SELECT 'marketing_posts' AS table_name, COUNT(*) AS rows FROM marketing_posts
UNION ALL
SELECT 'marketing_campagnes' AS table_name, COUNT(*) AS rows FROM marketing_campagnes
UNION ALL
SELECT 'projets' AS table_name, COUNT(*) AS rows FROM projets
UNION ALL
SELECT 'taches' AS table_name, COUNT(*) AS rows FROM taches
UNION ALL
SELECT 'okr_objectifs' AS table_name, COUNT(*) AS rows FROM okr_objectifs
UNION ALL
SELECT 'stat_formulaires' AS table_name, COUNT(*) AS rows FROM stat_formulaires
UNION ALL
SELECT 'stat_reponses' AS table_name, COUNT(*) AS rows FROM stat_reponses;
