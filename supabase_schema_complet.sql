-- ═══════════════════════════════════════════════════════════════════
-- ABAWI PORTAL — SCHEMA SQL COMPLET
-- Exécuter dans Supabase Dashboard → SQL Editor (New query)
-- Crée toutes les tables manquantes pour que tous les outils
-- fonctionnent immédiatement sans erreur.
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- 1. CORE — Membres & Paiements (déjà souvent présents, idempotent)
-- ═══════════════════════════════════════════════════════════════════

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
  plan_type TEXT DEFAULT 'gratuit',
  date_fin TIMESTAMPTZ DEFAULT NULL,
  credits INTEGER DEFAULT 0,
  credits_total_utilises INTEGER DEFAULT 0,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin par défaut
INSERT INTO membres (prenom, nom, email, mot_de_passe, statut, role, date_fin, credits)
VALUES ('Laurent','ABAWI','ngomlaurentblog@gmail.com','abawi2026','actif','admin','2099-12-31T23:59:59Z', 99999)
ON CONFLICT (email) DO UPDATE SET role='admin', statut='actif', date_fin='2099-12-31T23:59:59Z', credits=EXCLUDED.credits;

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

-- ═══════════════════════════════════════════════════════════════════
-- 2. CREDITS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL DEFAULT '',
  credits INTEGER DEFAULT 0,
  bonus_credits INTEGER DEFAULT 0,
  prix INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  popular BOOLEAN DEFAULT false,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter popular si la table existe déjà sans cette colonne
ALTER TABLE credit_packs ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;
ALTER TABLE credit_packs ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

INSERT INTO credit_packs (id, nom, credits, bonus_credits, prix, actif, popular, description) VALUES
('pack-50',  'Pack Starter',  50,  0,  2500,  true, false, 'Premiers pas avec les outils IA'),
('pack-100', 'Pack Standard', 100, 10, 4500,  true, false, 'Le meilleur rapport qualité/prix'),
('pack-200', 'Pack Pro',      200, 25, 8000,  true, true,  'Pour les utilisateurs intensifs')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit','recharge','refund','bonus')),
  montant INTEGER DEFAULT 0,
  solde_avant INTEGER DEFAULT 0,
  solde_apres INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  produit_id TEXT DEFAULT '',
  produit_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 3. CONTENU — Guides, Fascicules, Podcasts, Vidéos, News, Résumés
-- ═══════════════════════════════════════════════════════════════════

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

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  slug TEXT DEFAULT '',
  categorie TEXT DEFAULT 'Business',
  description TEXT DEFAULT '',
  duree TEXT DEFAULT '',
  url TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  src TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  premium BOOLEAN DEFAULT true,
  gratuit BOOLEAN DEFAULT false,
  prix INTEGER DEFAULT 4900,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  categorie TEXT DEFAULT 'Business',
  description TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  premium BOOLEAN DEFAULT true,
  gratuit BOOLEAN DEFAULT false,
  prix INTEGER DEFAULT 1500,
  active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ti TEXT NOT NULL DEFAULT '',
  co TEXT DEFAULT '',
  tag TEXT DEFAULT 'Business',
  rt TEXT DEFAULT '3 min',
  cover_url TEXT DEFAULT '',
  pr BOOLEAN DEFAULT false,
  statut TEXT DEFAULT 'publié' CHECK (statut IN ('publié','brouillon')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- ═══════════════════════════════════════════════════════════════════
-- 4. STORE IT
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  nom TEXT NOT NULL DEFAULT '',
  name TEXT DEFAULT '',
  categorie TEXT DEFAULT 'Portables',
  cat TEXT DEFAULT 'Portables',
  description TEXT DEFAULT '',
  description_courte TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  prix_original INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '',
  img TEXT DEFAULT '',
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

-- ═══════════════════════════════════════════════════════════════════
-- 5. SITE MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_slider (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  link TEXT DEFAULT '/plans',
  img TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT DEFAULT 'top',
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  link TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, field)
);

-- ═══════════════════════════════════════════════════════════════════
-- 6. SENTICKET — Billetterie événementielle
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS senticket_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titre TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  categorie TEXT DEFAULT 'Concert',
  ville TEXT DEFAULT 'Dakar',
  lieu TEXT DEFAULT '',
  date DATE DEFAULT NULL,
  heure TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  featured BOOLEAN DEFAULT false,
  statut TEXT DEFAULT 'published' CHECK (statut IN ('published','draft','cancelled','ended')),
  commission_rate INTEGER DEFAULT 10,
  organizer_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS senticket_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES senticket_events(id) ON DELETE CASCADE,
  nom TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  places INTEGER DEFAULT 0,
  vendus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS senticket_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES senticket_events(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES senticket_tickets(id) ON DELETE SET NULL,
  user_id TEXT DEFAULT '',
  qty INTEGER DEFAULT 1,
  prix_total INTEGER DEFAULT 0,
  commission INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  net_organisateur INTEGER DEFAULT 0,
  acheteur JSONB DEFAULT '{}',
  payment_method TEXT DEFAULT '',
  coupon_code TEXT DEFAULT '',
  group_emails TEXT[] DEFAULT '{}',
  statut TEXT DEFAULT 'paid' CHECK (statut IN ('paid','pending','cancelled','refunded')),
  qr_data TEXT DEFAULT '',
  scanned BOOLEAN DEFAULT false,
  date_achat TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS senticket_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id UUID REFERENCES senticket_events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

CREATE TABLE IF NOT EXISTS senticket_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES senticket_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  stars INTEGER DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS senticket_withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES senticket_events(id) ON DELETE SET NULL,
  organizer_id TEXT NOT NULL,
  montant INTEGER DEFAULT 0,
  methode TEXT DEFAULT 'wave',
  telephone TEXT DEFAULT '',
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending','paid','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS senticket_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES senticket_events(id) ON DELETE CASCADE,
  ip_hash TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RPC helper pour incrémenter les ventes de billets
CREATE OR REPLACE FUNCTION increment_ticket_sales(ticket_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE senticket_tickets SET vendus = COALESCE(vendus,0) + qty WHERE id = ticket_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- 7. ABAWI 360 — CRM, Projets, Marketing, Analytics
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  nom TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  entreprise TEXT DEFAULT '',
  statut TEXT DEFAULT 'prospect',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  nom TEXT DEFAULT '',
  description TEXT DEFAULT '',
  statut TEXT DEFAULT 'en_cours',
  priorite TEXT DEFAULT 'moyenne',
  date_echeance DATE DEFAULT NULL,
  budget INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  titre TEXT DEFAULT '',
  description TEXT DEFAULT '',
  statut TEXT DEFAULT 'à_faire',
  priorite TEXT DEFAULT 'moyenne',
  assigne_a TEXT DEFAULT '',
  date_echeance DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS okr_objectifs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  titre TEXT DEFAULT '',
  description TEXT DEFAULT '',
  periode TEXT DEFAULT 'Q1 2026',
  progression INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'actif',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stat_formulaires (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  titre TEXT DEFAULT '',
  champs JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stat_reponses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  formulaire_id UUID REFERENCES stat_formulaires(id) ON DELETE CASCADE,
  reponses JSONB DEFAULT '{}',
  ip TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT DEFAULT '',
  tool TEXT DEFAULT '',
  job_type TEXT DEFAULT '',
  payload JSONB DEFAULT '{}',
  statut TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  titre TEXT DEFAULT '',
  contenu TEXT DEFAULT '',
  plateforme TEXT DEFAULT '',
  statut TEXT DEFAULT 'brouillon',
  date_planifiee TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  nom TEXT DEFAULT '',
  description TEXT DEFAULT '',
  budget INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'active',
  date_debut DATE DEFAULT NULL,
  date_fin DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 8. ABAVIE — Santé & Communauté
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  ville TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  type TEXT DEFAULT 'patient',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS statuses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text','image','video')),
  content TEXT DEFAULT '',
  media_url TEXT DEFAULT '',
  duration INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS status_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status_id UUID REFERENCES statuses(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(status_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  type TEXT DEFAULT 'public',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'membre',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  media_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  media_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS starred_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, message_id)
);

CREATE TABLE IF NOT EXISTS user_gifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  type TEXT DEFAULT 'rose',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  question TEXT DEFAULT '',
  options JSONB DEFAULT '[]',
  multiple BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  option_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS e2e_public_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ DEFAULT NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- 9. UTILITAIRES — Documents, Cache, Logs
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, type)
);

CREATE TABLE IF NOT EXISTS pdf_extracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pdf_path TEXT DEFAULT '',
  extracted_text TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audio_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  text_hash TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  voice_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_dispatch_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform TEXT DEFAULT '',
  post_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_dispatch_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  platform TEXT DEFAULT '',
  content TEXT DEFAULT '',
  media_urls TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ DEFAULT NULL,
  sent_at TIMESTAMPTZ DEFAULT NULL,
  statut TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 10. ROW LEVEL SECURITY (RLS) — Policies permissives pour dev
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'membres','payments','guides','fascicules','podcasts_db','videos','summaries',
    'articles','news','store_products','site_slider','site_banners','site_content',
    'credit_packs','credit_transactions',
    'senticket_events','senticket_tickets','senticket_orders','senticket_favorites',
    'senticket_reviews','senticket_withdrawals','senticket_views',
    'crm_contacts','projets','taches','okr_objectifs','stat_formulaires',
    'stat_reponses','ai_jobs','marketing_posts','marketing_campaigns',
    'profiles','statuses','status_views','communities','community_members',
    'community_messages','message_reads','conversations','messages',
    'scheduled_messages','starred_messages','user_gifts','polls','poll_votes',
    'meeting_participants','e2e_public_keys','admin_messages',
    'user_documents','pdf_extracts','audio_cache','social_dispatch_logs','social_dispatch_queue'
  ]
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'Allow all ' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true);', 'Allow all ' || t, t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 11. STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('covers','covers',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']),
  ('guides','guides',true,104857600,ARRAY['application/pdf']),
  ('podcasts','podcasts',true,209715200,ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4','audio/x-m4a']),
  ('audio-summaries','audio-summaries',true,52428800,ARRAY['audio/mpeg','audio/mp3','audio/wav']),
  ('images','images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('store-images','store-images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('status-media','status-media',true,52428800,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','video/mp4','video/webm'])
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public, file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types;

-- Storage policies
DO $$
DECLARE b TEXT; bl TEXT[] := ARRAY[
  'covers','guides','podcasts','audio-summaries','images','store-images','status-media'
];
BEGIN
  FOREACH b IN ARRAY bl LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Public read ' || b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow upload ' || b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow update ' || b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Allow delete ' || b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)', 'Public read ' || b, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)', 'Allow upload ' || b, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L)', 'Allow update ' || b, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L)', 'Allow delete ' || b, b);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 12. VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
AND table_name IN (
  'membres','payments','guides','fascicules','podcasts_db','videos','summaries',
  'articles','news','store_products','site_slider','site_banners','site_content',
  'credit_packs','credit_transactions',
  'senticket_events','senticket_tickets','senticket_orders','senticket_favorites',
  'senticket_reviews','senticket_withdrawals','senticket_views',
  'crm_contacts','projets','taches','okr_objectifs','stat_formulaires',
  'stat_reponses','ai_jobs','marketing_posts','marketing_campaigns',
  'profiles','statuses','status_views','communities','community_members',
  'community_messages','message_reads','conversations','messages',
  'scheduled_messages','starred_messages','user_gifts','polls','poll_votes',
  'meeting_participants','e2e_public_keys','admin_messages',
  'user_documents','pdf_extracts','audio_cache','social_dispatch_logs','social_dispatch_queue'
)
ORDER BY table_name;
