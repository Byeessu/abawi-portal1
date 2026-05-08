-- ═══════════════════════════════════════════════════════════════════
-- ABAWI PORTAL — SETUP FINAL COMPLET v2026-04-11
-- Exécuter dans Supabase Dashboard → SQL Editor
-- Inclut : membres, payments, guides, fascicules, podcasts, store,
--          news, crm_contacts, stat_formulaires, marketing_posts,
--          marketing_campagnes, credit_transactions, credit_packs,
--          plans_abonnement, user_documents, site_content, admin_messages
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════
-- TABLES CORE
-- ═══════════════════════════════════

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
  plan TEXT DEFAULT 'gratuit',
  date_fin TIMESTAMPTZ DEFAULT NULL,
  credits INTEGER DEFAULT 15,
  credits_total_utilises INTEGER DEFAULT 0,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO membres (prenom, nom, email, mot_de_passe, statut, role, plan, date_fin, credits)
VALUES ('Laurent','ABAWI','ngomlaurentblog@gmail.com','abawi2026','actif','admin','admin','2099-12-31T23:59:59Z',999999)
ON CONFLICT (email) DO UPDATE SET
  role='admin', statut='actif', plan='admin',
  date_fin='2099-12-31T23:59:59Z', credits=999999;

-- ── PAYMENTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT DEFAULT '',
  product_title TEXT DEFAULT '',
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

-- ═══════════════════════════════════
-- ABAWI 360 TABLES
-- ═══════════════════════════════════

-- ── CRM CONTACTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  nom TEXT DEFAULT '',
  prenom TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  entreprise TEXT DEFAULT '',
  poste TEXT DEFAULT '',
  statut TEXT DEFAULT 'prospect' CHECK (statut IN ('prospect','lead','client','inactif')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  valeur_potentielle INTEGER DEFAULT 0,
  derniere_interaction TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── STAT FORMULAIRES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stat_formulaires (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  titre TEXT DEFAULT '',
  description TEXT DEFAULT '',
  champs JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STAT REPONSES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stat_reponses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  formulaire_id UUID REFERENCES stat_formulaires(id) ON DELETE CASCADE,
  repondant_email TEXT DEFAULT '',
  reponses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MARKETING POSTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  membre_email TEXT NOT NULL,
  titre TEXT DEFAULT '',
  contenu TEXT DEFAULT '',
  plateforme TEXT DEFAULT 'Instagram',
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','planifié','publié')),
  date_publication DATE DEFAULT CURRENT_DATE,
  heure_publication TEXT DEFAULT '09:00',
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MARKETING CAMPAGNES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_campagnes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  membre_email TEXT NOT NULL,
  nom TEXT DEFAULT '',
  objectif TEXT DEFAULT '',
  budget INTEGER DEFAULT 0,
  depense INTEGER DEFAULT 0,
  revenus INTEGER DEFAULT 0,
  date_debut DATE DEFAULT CURRENT_DATE,
  date_fin DATE DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT 'active' CHECK (statut IN ('active','terminée','pause')),
  plateforme TEXT DEFAULT 'Multi',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════
-- CRÉDITS & PLANS
-- ═══════════════════════════════════

-- ── CREDIT TRANSACTIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  membre_id UUID REFERENCES membres(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit','credit','recharge','bonus','expiration')),
  montant INTEGER NOT NULL,
  solde_avant INTEGER DEFAULT 0,
  solde_apres INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  produit_id TEXT DEFAULT '',
  produit_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── CREDIT PACKS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  credits INTEGER NOT NULL,
  prix INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  popular BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true
);

INSERT INTO credit_packs (id, nom, credits, prix, bonus_credits, popular, actif) VALUES
  ('pack-50',   'Pack Starter',   50,   2500,   0,   false, true),
  ('pack-100',  'Pack Standard',  100,  4500,  10,   false, true),
  ('pack-200',  'Pack Pro',       200,  8000,  25,   true,  true),
  ('pack-500',  'Pack Business',  500, 17500,  75,   false, true),
  ('pack-1000', 'Pack Elite',    1000, 30000, 200,   false, true)
ON CONFLICT (id) DO UPDATE
  SET credits=EXCLUDED.credits, prix=EXCLUDED.prix,
      bonus_credits=EXCLUDED.bonus_credits, popular=EXCLUDED.popular;

-- ── PLANS ABONNEMENT ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans_abonnement (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prix_mensuel INTEGER NOT NULL,
  prix_annuel INTEGER DEFAULT 0,
  credits_mensuels INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  features JSONB DEFAULT '[]',
  couleur TEXT DEFAULT '#F0B429',
  popular BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO plans_abonnement (id, nom, prix_mensuel, prix_annuel, credits_mensuels, description, features, couleur, popular, actif) VALUES
  ('gratuit','Gratuit',0,0,15,'Accès gratuit + 15 crédits/mois',
   '["15 crédits IA/mois","Guides gratuits","Podcasts gratuits","Outils IA basiques"]',
   '#4A5568',false,true),
  ('starter','Starter',4990,49900,100,'Pour commencer à entreprendre',
   '["100 crédits IA/mois","Guides premium","Fascicules","Outils IA avancés","Support email"]',
   '#3B82F6',false,true),
  ('pro','Pro',9990,99900,300,'Pour les entrepreneurs actifs',
   '["300 crédits/mois","ABAWI 360","Outils IA élite","Support prioritaire","PDF illimité"]',
   '#F0B429',true,true),
  ('elite','Elite',19990,199900,1000,'Pour équipes et PME',
   '["1000 crédits/mois","Tout Plan Pro","Business plans illimités","Support WA dédié","Bêta fonctionnalités"]',
   '#8B5CF6',false,true),
  ('vip','VIP',49990,499900,9999,'Accès total illimité',
   '["Crédits illimités","Accès total","Coach ABAWI 2h/mois","Badge VIP","Priorité absolue"]',
   '#F59E0B',false,true)
ON CONFLICT (id) DO UPDATE
  SET nom=EXCLUDED.nom, prix_mensuel=EXCLUDED.prix_mensuel,
      credits_mensuels=EXCLUDED.credits_mensuels, features=EXCLUDED.features,
      popular=EXCLUDED.popular;

-- ═══════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════

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
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_formulaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_abonnement ENABLE ROW LEVEL SECURITY;

-- Drop all old policies
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- membres
CREATE POLICY "membres_all" ON membres FOR ALL USING (true) WITH CHECK (true);
-- payments
CREATE POLICY "payments_all" ON payments FOR ALL USING (true) WITH CHECK (true);
-- guides
CREATE POLICY "guides_select" ON guides FOR SELECT USING (actif = true);
CREATE POLICY "guides_write"  ON guides FOR ALL   USING (true) WITH CHECK (true);
-- fascicules
CREATE POLICY "fascicules_select" ON fascicules FOR SELECT USING (actif = true);
CREATE POLICY "fascicules_write"  ON fascicules FOR ALL   USING (true) WITH CHECK (true);
-- podcasts
CREATE POLICY "podcasts_select" ON podcasts_db FOR SELECT USING (actif = true);
CREATE POLICY "podcasts_write"  ON podcasts_db FOR ALL   USING (true) WITH CHECK (true);
-- store
CREATE POLICY "store_select" ON store_products FOR SELECT USING (actif = true);
CREATE POLICY "store_write"  ON store_products FOR ALL   USING (true) WITH CHECK (true);
-- news
CREATE POLICY "news_select" ON news FOR SELECT USING (statut = 'publié');
CREATE POLICY "news_write"  ON news FOR ALL   USING (true) WITH CHECK (true);
-- others: open access
CREATE POLICY "user_docs_all"    ON user_documents    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "content_all"      ON site_content      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_msgs_all"   ON admin_messages    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "crm_all"          ON crm_contacts      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stat_all"         ON stat_formulaires  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "stat_rep_all"     ON stat_reponses     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mkt_posts_all"    ON marketing_posts   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mkt_camp_all"     ON marketing_campagnes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "credits_tx_all"   ON credit_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "credit_packs_all" ON credit_packs       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "plans_all"        ON plans_abonnement  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('covers',          'covers',          true, 10485760,  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']),
  ('guides',          'guides',          true, 104857600, ARRAY['application/pdf']),
  ('fascicules',      'fascicules',      true, 104857600, ARRAY['application/pdf','audio/mpeg','audio/mp3']),
  ('podcasts',        'podcasts',        true, 209715200, ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4','audio/x-m4a']),
  ('audio-summaries', 'audio-summaries', true, 52428800,  ARRAY['audio/mpeg','audio/mp3','audio/wav']),
  ('images',          'images',          true, 10485760,  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('store-images',    'store-images',    true, 10485760,  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public=EXCLUDED.public,
  file_size_limit=EXCLUDED.file_size_limit,
  allowed_mime_types=EXCLUDED.allowed_mime_types;

-- Storage: full public access
DROP POLICY IF EXISTS "Full access storage" ON storage.objects;
CREATE POLICY "Full access storage" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════
-- CLEANUP (optionnel)
-- ═══════════════════════════════════

-- Décommenter pour supprimer les podcasts indésirables :
-- DELETE FROM podcasts_db WHERE titre ILIKE '%3 millions%' OR titre ILIKE '%Abiogreen%' OR titre ILIKE '%Arkel%' OR titre ILIKE '%inclusion numérique%';

-- Décommenter pour effacer les résumés audio sur guides/fascicules :
-- UPDATE guides SET audio_url = NULL WHERE audio_url IS NOT NULL AND audio_url != '';
-- UPDATE fascicules SET audio_url = NULL WHERE audio_url IS NOT NULL AND audio_url != '';

-- ═══════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════

SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name=t.table_name AND table_schema='public') as nb_colonnes
FROM information_schema.tables t
WHERE table_schema='public'
ORDER BY table_name;

SELECT id, name, public FROM storage.buckets ORDER BY id;
SELECT COUNT(*) as nb_plans FROM plans_abonnement;
SELECT COUNT(*) as nb_packs FROM credit_packs;
