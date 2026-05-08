-- ═══════════════════════════════════════════════════════════════════
-- ABAWI PORTAL — SETUP FINAL COMPLET
-- Version : 2026-04-10
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════
-- TABLES
-- ══════════════════════════════

-- ── MEMBRES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prenom TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  telephone TEXT DEFAULT '',
  mot_de_passe TEXT DEFAULT '',
  statut TEXT DEFAULT 'inactif' CHECK (statut IN ('actif','inactif','suspendu')),
  role TEXT DEFAULT 'membre' CHECK (role IN ('membre','admin')),
  date_fin TIMESTAMPTZ DEFAULT NULL,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO membres (prenom, nom, email, mot_de_passe, statut, role, date_fin)
VALUES ('Laurent','ABAWI','ngomlaurentblog@gmail.com','abawi2026','actif','admin','2099-12-31T23:59:59Z')
ON CONFLICT (email) DO UPDATE SET role='admin', statut='actif', date_fin='2099-12-31T23:59:59Z';

-- ── PAYMENTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT DEFAULT '',
  product_type TEXT DEFAULT 'guide',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  montant INTEGER DEFAULT 0,
  methode TEXT DEFAULT '',
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending','paid','failed','cancelled')),
  paydunya_token TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── GUIDES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  categorie TEXT DEFAULT 'Business & Stratégie',
  prix INTEGER DEFAULT 2500,
  pages INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  gratuit BOOLEAN DEFAULT false,
  premium BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  auteur TEXT DEFAULT 'ABAWI',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── FASCICULES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fascicules (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  matiere TEXT DEFAULT '',
  serie TEXT DEFAULT 'S1',
  prix INTEGER DEFAULT 2900,
  pages INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── PODCASTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcasts_db (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  serie TEXT DEFAULT '',
  episode INTEGER DEFAULT 1,
  description TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  duree TEXT DEFAULT '',
  premium BOOLEAN DEFAULT true,
  gratuit BOOLEAN DEFAULT false,
  prix INTEGER DEFAULT 990,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STORE PRODUCTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  nom TEXT NOT NULL DEFAULT '',
  categorie TEXT DEFAULT 'Portables',
  description TEXT DEFAULT '',
  description_courte TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  prix_original INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  specs TEXT[] DEFAULT '{}',
  specs_techniques JSONB DEFAULT '{}',
  stock INTEGER DEFAULT 1,
  featured BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  marque TEXT DEFAULT '',
  modele TEXT DEFAULT '',
  garantie TEXT DEFAULT '12 mois',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vider le store des données de test (garder table vide)
-- DELETE FROM store_products; -- décommenter si besoin

-- ── NEWS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ti TEXT NOT NULL DEFAULT '',
  co TEXT DEFAULT '',
  tag TEXT DEFAULT 'Business',
  rt TEXT DEFAULT '3 min',
  cover_url TEXT DEFAULT '',
  statut TEXT DEFAULT 'publié' CHECK (statut IN ('publié','brouillon')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── USER DOCUMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, type)
);

-- ── SITE CONTENT ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, field)
);

-- ── ADMIN MESSAGES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  membre_email TEXT NOT NULL,
  membre_nom TEXT DEFAULT '',
  sujet TEXT NOT NULL,
  message TEXT NOT NULL,
  canal TEXT DEFAULT 'email' CHECK (canal IN ('email','whatsapp','les_deux')),
  type TEXT DEFAULT 'message',
  statut TEXT DEFAULT 'envoye',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════

ALTER TABLE membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE fascicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts_db ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- membres
CREATE POLICY "membres_select" ON membres FOR SELECT USING (true);
CREATE POLICY "membres_insert" ON membres FOR INSERT WITH CHECK (true);
CREATE POLICY "membres_update" ON membres FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "membres_delete" ON membres FOR DELETE USING (true);

-- payments
CREATE POLICY "payments_select" ON payments FOR SELECT USING (true);
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "payments_delete" ON payments FOR DELETE USING (true);

-- guides
CREATE POLICY "guides_select" ON guides FOR SELECT USING (actif = true);
CREATE POLICY "guides_insert" ON guides FOR INSERT WITH CHECK (true);
CREATE POLICY "guides_update" ON guides FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "guides_delete" ON guides FOR DELETE USING (true);

-- fascicules
CREATE POLICY "fascicules_select" ON fascicules FOR SELECT USING (actif = true);
CREATE POLICY "fascicules_insert" ON fascicules FOR INSERT WITH CHECK (true);
CREATE POLICY "fascicules_update" ON fascicules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "fascicules_delete" ON fascicules FOR DELETE USING (true);

-- podcasts
CREATE POLICY "podcasts_select" ON podcasts_db FOR SELECT USING (actif = true);
CREATE POLICY "podcasts_insert" ON podcasts_db FOR INSERT WITH CHECK (true);
CREATE POLICY "podcasts_update" ON podcasts_db FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "podcasts_delete" ON podcasts_db FOR DELETE USING (true);

-- store
CREATE POLICY "store_select" ON store_products FOR SELECT USING (actif = true);
CREATE POLICY "store_insert" ON store_products FOR INSERT WITH CHECK (true);
CREATE POLICY "store_update" ON store_products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "store_delete" ON store_products FOR DELETE USING (true);

-- news
CREATE POLICY "news_select" ON news FOR SELECT USING (statut = 'publié');
CREATE POLICY "news_insert" ON news FOR INSERT WITH CHECK (true);
CREATE POLICY "news_update" ON news FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "news_delete" ON news FOR DELETE USING (true);

-- user_documents
CREATE POLICY "user_docs_select" ON user_documents FOR SELECT USING (true);
CREATE POLICY "user_docs_insert" ON user_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "user_docs_update" ON user_documents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "user_docs_delete" ON user_documents FOR DELETE USING (true);

-- site_content
CREATE POLICY "content_select" ON site_content FOR SELECT USING (true);
CREATE POLICY "content_insert" ON site_content FOR INSERT WITH CHECK (true);
CREATE POLICY "content_update" ON site_content FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "content_delete" ON site_content FOR DELETE USING (true);

-- admin_messages
CREATE POLICY "admin_messages_all" ON admin_messages FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════
-- STORAGE BUCKETS
-- ══════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('covers','covers',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']),
  ('guides','guides',true,104857600,ARRAY['application/pdf']),
  ('podcasts','podcasts',true,209715200,ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4','audio/x-m4a']),
  ('audio-summaries','audio-summaries',true,52428800,ARRAY['audio/mpeg','audio/mp3','audio/wav']),
  ('images','images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('store-images','store-images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public=EXCLUDED.public,
  file_size_limit=EXCLUDED.file_size_limit,
  allowed_mime_types=EXCLUDED.allowed_mime_types;

-- ── STORAGE POLICIES ──────────────────────────────────────────────────
DO $$
DECLARE b TEXT; bl TEXT[] := ARRAY['covers','guides','podcasts','audio-summaries','images','store-images'];
BEGIN
  FOREACH b IN ARRAY bl LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS "Allow upload %I" ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS "Allow update %I" ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS "Allow delete %I" ON storage.objects', b);
    EXECUTE format('CREATE POLICY "Public read %I" ON storage.objects FOR SELECT USING (bucket_id = %L)', b, b);
    EXECUTE format('CREATE POLICY "Allow upload %I" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)', b, b);
    EXECUTE format('CREATE POLICY "Allow update %I" ON storage.objects FOR UPDATE USING (bucket_id = %L)', b, b);
    EXECUTE format('CREATE POLICY "Allow delete %I" ON storage.objects FOR DELETE USING (bucket_id = %L)', b, b);
  END LOOP;
END $$;

-- ── STORAGE FULL ACCESS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Full access storage" ON storage.objects;
CREATE POLICY "Full access storage" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════
-- VÉRIFICATION
-- ══════════════════════════════

SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
AND table_name IN ('membres','payments','guides','fascicules','podcasts_db','store_products','news','user_documents','site_content')
ORDER BY table_name;

SELECT id, name, public FROM storage.buckets
WHERE id IN ('covers','guides','podcasts','audio-summaries','images','store-images');

SELECT schemaname, tablename, policyname, cmd
FROM pg_policies WHERE schemaname='public'
ORDER BY tablename, cmd;
