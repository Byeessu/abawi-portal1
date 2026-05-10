-- ═══════════════════════════════════════
-- ABAWI PORTAL — SETUP COMPLET SUPABASE
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── MEMBRES ──────────────────────────────
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

-- ── PAYMENTS ─────────────────────────────
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

-- ── GUIDES ───────────────────────────────
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

-- ── FASCICULES ───────────────────────────
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

-- ── PODCASTS ─────────────────────────────
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

-- ── STORE ────────────────────────────────
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

-- ── NEWS ─────────────────────────────────
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

-- ── USER DOCUMENTS ───────────────────────
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, type)
);

-- ── SITE CONTENT ─────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, field)
);

-- ── RLS ──────────────────────────────────
ALTER TABLE membres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read membres" ON membres;
DROP POLICY IF EXISTS "Admin all membres" ON membres;
CREATE POLICY "Public read membres" ON membres FOR SELECT USING (true);
CREATE POLICY "Admin all membres" ON membres FOR ALL USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin all payments" ON payments;
CREATE POLICY "Admin all payments" ON payments FOR ALL USING (true);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read guides" ON guides;
DROP POLICY IF EXISTS "Admin all guides" ON guides;
CREATE POLICY "Public read guides" ON guides FOR SELECT USING (actif = true);
CREATE POLICY "Admin all guides" ON guides FOR ALL USING (true);

ALTER TABLE fascicules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read fascicules" ON fascicules;
DROP POLICY IF EXISTS "Admin all fascicules" ON fascicules;
CREATE POLICY "Public read fascicules" ON fascicules FOR SELECT USING (actif = true);
CREATE POLICY "Admin all fascicules" ON fascicules FOR ALL USING (true);

ALTER TABLE podcasts_db ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read podcasts" ON podcasts_db;
DROP POLICY IF EXISTS "Admin all podcasts" ON podcasts_db;
CREATE POLICY "Public read podcasts" ON podcasts_db FOR SELECT USING (actif = true);
CREATE POLICY "Admin all podcasts" ON podcasts_db FOR ALL USING (true);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read store" ON store_products;
DROP POLICY IF EXISTS "Admin all store" ON store_products;
CREATE POLICY "Public read store" ON store_products FOR SELECT USING (actif = true);
CREATE POLICY "Admin all store" ON store_products FOR ALL USING (true);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read news" ON news;
DROP POLICY IF EXISTS "Admin all news" ON news;
CREATE POLICY "Public read news" ON news FOR SELECT USING (statut = 'publié');
CREATE POLICY "Admin all news" ON news FOR ALL USING (true);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User read own" ON user_documents;
DROP POLICY IF EXISTS "Admin all user_documents" ON user_documents;
CREATE POLICY "User read own" ON user_documents FOR SELECT USING (true);
CREATE POLICY "Admin all user_documents" ON user_documents FOR ALL USING (true);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read content" ON site_content;
DROP POLICY IF EXISTS "Admin write content" ON site_content;
CREATE POLICY "Public read content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Admin write content" ON site_content FOR ALL USING (true);

-- ── STORAGE BUCKETS ──────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('covers','covers',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']),
  ('guides','guides',true,104857600,ARRAY['application/pdf']),
  ('podcasts','podcasts',true,209715200,ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4','audio/x-m4a']),
  ('audio-summaries','audio-summaries',true,52428800,ARRAY['audio/mpeg','audio/mp3','audio/wav']),
  ('images','images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('store-images','store-images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public, file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types;

-- ── STORAGE POLICIES (CORRIGÉ) ──────────
DO $$
DECLARE b TEXT; bl TEXT[] := ARRAY['covers','guides','podcasts','audio-summaries','images','store-images'];
BEGIN
  FOREACH b IN ARRAY bl LOOP
    -- Drop
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Public read ' || b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow upload ' || b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow update ' || b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow delete ' || b);
    -- Create
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)', 'Public read ' || b, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)', 'Allow upload ' || b, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L)', 'Allow update ' || b, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L)', 'Allow delete ' || b, b);
  END LOOP;
END $$;

-- ── VÉRIFICATION ─────────────────────────
SELECT table_name FROM information_schema.tables WHERE table_schema='public'
AND table_name IN ('membres','payments','guides','fascicules','podcasts_db','store_products','news','user_documents','site_content')
ORDER BY table_name;
SELECT id, name, public FROM storage.buckets WHERE id IN ('covers','guides','podcasts','audio-summaries','images','store-images');
