-- ABAWI Portal - Unified Runtime SQL
-- Safe to re-run. Applies compatibility fixes for app runtime.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- CORE MEMBERS + PAYMENTS
-- =========================
CREATE TABLE IF NOT EXISTS membres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prenom TEXT DEFAULT '',
  nom TEXT DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  telephone TEXT DEFAULT '',
  mot_de_passe TEXT DEFAULT '',
  statut TEXT DEFAULT 'inactif',
  role TEXT DEFAULT 'membre',
  plan TEXT DEFAULT 'gratuit',
  plan_type TEXT DEFAULT 'gratuit',
  date_fin TIMESTAMPTZ NULL,
  credits INTEGER DEFAULT 0,
  credits_total_utilises INTEGER DEFAULT 0,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT DEFAULT '',
  product_title TEXT DEFAULT '',
  product_type TEXT DEFAULT 'guide',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  montant INTEGER DEFAULT 0,
  methode TEXT DEFAULT '',
  statut TEXT DEFAULT 'pending',
  paydunya_token TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- CONTENT TABLES
-- =========================
CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT DEFAULT '',
  categorie TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  pages INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  summary_audio_url TEXT DEFAULT '',
  gratuit BOOLEAN DEFAULT FALSE,
  premium BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  actif BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',
  auteur TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fascicules (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT DEFAULT '',
  matiere TEXT DEFAULT '',
  serie TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  pages INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  summary_audio_url TEXT DEFAULT '',
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS podcasts_db (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT DEFAULT '',
  serie TEXT DEFAULT '',
  episode INTEGER DEFAULT 1,
  description TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  duree TEXT DEFAULT '',
  lyrics TEXT DEFAULT '',
  premium BOOLEAN DEFAULT TRUE,
  gratuit BOOLEAN DEFAULT FALSE,
  prix INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  nom TEXT DEFAULT '',
  categorie TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_courte TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  prix_original INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  specs TEXT[] DEFAULT '{}',
  specs_techniques JSONB DEFAULT '{}'::jsonb,
  stock INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  actif BOOLEAN DEFAULT TRUE,
  marque TEXT DEFAULT '',
  modele TEXT DEFAULT '',
  garantie TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ti TEXT DEFAULT '',
  co TEXT DEFAULT '',
  tag TEXT DEFAULT '',
  rt TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  statut TEXT DEFAULT 'publié',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, type)
);

CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, field)
);

CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membre_email TEXT NOT NULL,
  membre_nom TEXT DEFAULT '',
  sujet TEXT DEFAULT '',
  message TEXT DEFAULT '',
  canal TEXT DEFAULT 'email',
  type TEXT DEFAULT 'message',
  statut TEXT DEFAULT 'envoye',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- ABAWI 360 TABLES
-- =========================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  prenom TEXT DEFAULT '',
  nom TEXT DEFAULT '',
  entreprise TEXT DEFAULT '',
  poste TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  ville TEXT DEFAULT '',
  secteur TEXT DEFAULT '',
  statut TEXT DEFAULT 'prospect',
  valeur_estimee NUMERIC(14,2) DEFAULT 0,
  probabilite INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  plateforme TEXT DEFAULT '',
  type_contenu TEXT DEFAULT '',
  date_publication DATE NOT NULL DEFAULT CURRENT_DATE,
  heure TIME,
  statut TEXT DEFAULT 'planifié',
  contenu TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_campagnes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  nom TEXT NOT NULL,
  plateforme TEXT DEFAULT '',
  budget NUMERIC(14,2) DEFAULT 0,
  depense NUMERIC(14,2) DEFAULT 0,
  revenus NUMERIC(14,2) DEFAULT 0,
  date_debut DATE,
  date_fin DATE,
  statut TEXT DEFAULT 'active',
  objectif TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  nom TEXT DEFAULT '',
  titre TEXT DEFAULT '',
  description TEXT DEFAULT '',
  statut TEXT DEFAULT 'planifie',
  priorite TEXT DEFAULT 'normale',
  date_debut DATE,
  date_fin DATE,
  date_echeance DATE,
  budget NUMERIC(14,2) DEFAULT 0,
  progression INTEGER DEFAULT 0,
  couleur TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT DEFAULT '',
  assignee TEXT DEFAULT '',
  statut TEXT DEFAULT 'todo',
  priorite TEXT DEFAULT 'normale',
  date_echeance DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS okr_objectifs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT DEFAULT '',
  trimestre TEXT DEFAULT '',
  progression INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stat_formulaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  titre TEXT DEFAULT '',
  description TEXT DEFAULT '',
  champs JSONB DEFAULT '[]'::jsonb,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stat_reponses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulaire_id UUID REFERENCES stat_formulaires(id) ON DELETE CASCADE,
  owner_email TEXT DEFAULT '',
  reponse JSONB DEFAULT '{}'::jsonb,
  reponses JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- TOOLS / CREDITS / IA
-- =========================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membre_id UUID NULL,
  email TEXT DEFAULT '',
  type TEXT DEFAULT 'debit',
  montant INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  price_fcfa INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans_abonnement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool TEXT NOT NULL,
  job_type TEXT DEFAULT 'analysis',
  user_email TEXT DEFAULT '',
  member_id UUID NULL,
  status TEXT DEFAULT 'completed',
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT DEFAULT '',
  cost_credits INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NULL,
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NULL REFERENCES ai_jobs(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  format TEXT DEFAULT 'txt',
  file_url TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  mime_type TEXT DEFAULT 'text/plain',
  size_bytes BIGINT DEFAULT 0,
  user_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audio_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  chapter_idx INTEGER NOT NULL DEFAULT 0,
  audio_base64 TEXT NOT NULL,
  caracteres INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, chapter_idx)
);

CREATE TABLE IF NOT EXISTS site_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- TRIGGERS (updated_at)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_membres_updated') THEN
    CREATE TRIGGER trg_membres_updated BEFORE UPDATE ON membres FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guides_updated') THEN
    CREATE TRIGGER trg_guides_updated BEFORE UPDATE ON guides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fascicules_updated') THEN
    CREATE TRIGGER trg_fascicules_updated BEFORE UPDATE ON fascicules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_podcasts_updated') THEN
    CREATE TRIGGER trg_podcasts_updated BEFORE UPDATE ON podcasts_db FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_products_updated') THEN
    CREATE TRIGGER trg_store_products_updated BEFORE UPDATE ON store_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_crm_contacts_updated') THEN
    CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_marketing_posts_updated') THEN
    CREATE TRIGGER trg_marketing_posts_updated BEFORE UPDATE ON marketing_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_marketing_campagnes_updated') THEN
    CREATE TRIGGER trg_marketing_campagnes_updated BEFORE UPDATE ON marketing_campagnes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projets_updated') THEN
    CREATE TRIGGER trg_projets_updated BEFORE UPDATE ON projets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_taches_updated') THEN
    CREATE TRIGGER trg_taches_updated BEFORE UPDATE ON taches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_okr_objectifs_updated') THEN
    CREATE TRIGGER trg_okr_objectifs_updated BEFORE UPDATE ON okr_objectifs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stat_formulaires_updated') THEN
    CREATE TRIGGER trg_stat_formulaires_updated BEFORE UPDATE ON stat_formulaires FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stat_reponses_updated') THEN
    CREATE TRIGGER trg_stat_reponses_updated BEFORE UPDATE ON stat_reponses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_jobs_updated') THEN
    CREATE TRIGGER trg_ai_jobs_updated BEFORE UPDATE ON ai_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_site_banners_updated') THEN
    CREATE TRIGGER trg_site_banners_updated BEFORE UPDATE ON site_banners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- =========================
-- RLS (simple owner/admin)
-- =========================
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_formulaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_owner_all ON crm_contacts;
CREATE POLICY crm_owner_all ON crm_contacts FOR ALL USING (owner_email = auth.email()) WITH CHECK (owner_email = auth.email());

DROP POLICY IF EXISTS marketing_posts_owner_all ON marketing_posts;
CREATE POLICY marketing_posts_owner_all ON marketing_posts FOR ALL USING (owner_email = auth.email()) WITH CHECK (owner_email = auth.email());

DROP POLICY IF EXISTS marketing_campagnes_owner_all ON marketing_campagnes;
CREATE POLICY marketing_campagnes_owner_all ON marketing_campagnes FOR ALL USING (owner_email = auth.email()) WITH CHECK (owner_email = auth.email());

DROP POLICY IF EXISTS projets_owner_all ON projets;
CREATE POLICY projets_owner_all ON projets FOR ALL USING (owner_email = auth.email()) WITH CHECK (owner_email = auth.email());

DROP POLICY IF EXISTS taches_owner_all ON taches;
CREATE POLICY taches_owner_all ON taches FOR ALL USING (owner_email = auth.email()) WITH CHECK (owner_email = auth.email());

DROP POLICY IF EXISTS okr_owner_all ON okr_objectifs;
CREATE POLICY okr_owner_all ON okr_objectifs FOR ALL USING (owner_email = auth.email()) WITH CHECK (owner_email = auth.email());

DROP POLICY IF EXISTS stat_formulaires_owner_all ON stat_formulaires;
CREATE POLICY stat_formulaires_owner_all ON stat_formulaires FOR ALL USING (owner_email = auth.email()) WITH CHECK (owner_email = auth.email());

DROP POLICY IF EXISTS stat_reponses_owner_all ON stat_reponses;
CREATE POLICY stat_reponses_owner_all ON stat_reponses FOR ALL
USING (owner_email = auth.email() OR owner_email = '' OR owner_email IS NULL)
WITH CHECK (owner_email = auth.email() OR owner_email = '' OR owner_email IS NULL);

DROP POLICY IF EXISTS ai_jobs_read_all ON ai_jobs;
DROP POLICY IF EXISTS ai_jobs_write_all ON ai_jobs;
CREATE POLICY ai_jobs_read_all ON ai_jobs FOR SELECT USING (TRUE);
CREATE POLICY ai_jobs_write_all ON ai_jobs FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS ai_exports_read_all ON ai_exports;
DROP POLICY IF EXISTS ai_exports_write_all ON ai_exports;
CREATE POLICY ai_exports_read_all ON ai_exports FOR SELECT USING (TRUE);
CREATE POLICY ai_exports_write_all ON ai_exports FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS credit_transactions_read_all ON credit_transactions;
DROP POLICY IF EXISTS credit_transactions_write_all ON credit_transactions;
CREATE POLICY credit_transactions_read_all ON credit_transactions FOR SELECT USING (TRUE);
CREATE POLICY credit_transactions_write_all ON credit_transactions FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =========================
-- STORAGE BUCKETS
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('covers', 'covers', true),
  ('podcasts', 'podcasts', true),
  ('guides', 'guides', true),
  ('store', 'store', true),
  ('ai-jobs', 'ai-jobs', true),
  ('studio-audio', 'studio-audio', true),
  ('studio-video', 'studio-video', true)
ON CONFLICT (id) DO NOTHING;

-- Done.
