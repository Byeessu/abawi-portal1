-- ============================================================
-- ABAWI PORTAL — CRÉDITS & PLANS COMPLET
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Colonnes membres
ALTER TABLE membres ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 15;
ALTER TABLE membres ADD COLUMN IF NOT EXISTS credits_total_utilises INTEGER DEFAULT 0;
ALTER TABLE membres ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'gratuit';

-- Admin gets unlimited credits
UPDATE membres SET credits = 999999, plan = 'admin'
WHERE email = 'ngomlaurentblog@gmail.com';

-- 2. credit_transactions
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
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All credit_transactions" ON credit_transactions;
CREATE POLICY "All credit_transactions" ON credit_transactions FOR ALL USING (true);

-- 3. credit_packs
CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  credits INTEGER NOT NULL,
  prix INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  popular BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true
);
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All credit_packs" ON credit_packs;
CREATE POLICY "All credit_packs" ON credit_packs FOR ALL USING (true);

INSERT INTO credit_packs (id, nom, credits, prix, bonus_credits, popular, actif) VALUES
  ('pack-50',   'Pack Starter',   50,   2500,   0,   false, true),
  ('pack-100',  'Pack Standard',  100,  4500,  10,   false, true),
  ('pack-200',  'Pack Pro',       200,  8000,  25,   true,  true),
  ('pack-500',  'Pack Business',  500, 17500,  75,   false, true),
  ('pack-1000', 'Pack Elite',    1000, 30000, 200,   false, true)
ON CONFLICT (id) DO UPDATE
  SET credits = EXCLUDED.credits,
      prix = EXCLUDED.prix,
      bonus_credits = EXCLUDED.bonus_credits,
      popular = EXCLUDED.popular;

-- 4. plans_abonnement
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
ALTER TABLE plans_abonnement ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All plans_abonnement" ON plans_abonnement;
CREATE POLICY "All plans_abonnement" ON plans_abonnement FOR ALL USING (true);

INSERT INTO plans_abonnement (id, nom, prix_mensuel, prix_annuel, credits_mensuels, description, features, couleur, popular, actif) VALUES
  ('gratuit', 'Gratuit', 0, 0, 15,
   'Accès aux contenus gratuits + 15 crédits IA/mois',
   '["15 crédits IA/mois","Guides gratuits","Podcasts gratuits","Outils IA basiques"]',
   '#4A5568', false, true),
  ('starter', 'Starter', 4990, 49900, 100,
   'Pour commencer à entreprendre sérieusement',
   '["100 crédits IA/mois","Tous les guides premium","Fascicules scolaires","Outils IA avancés","Support email"]',
   '#3B82F6', false, true),
  ('pro', 'Pro', 9990, 99900, 300,
   'Pour les professionnels et entrepreneurs actifs',
   '["300 crédits IA/mois","Accès illimité guides + fascicules","ABAWI 360 (CRM, Stats, Marketing)","Outils IA élite","Support prioritaire","Téléchargement PDF"]',
   '#F0B429', true, true),
  ('elite', 'Elite', 19990, 199900, 1000,
   'Pour les équipes et entreprises performantes',
   '["1000 crédits IA/mois","Tout inclus Plan Pro","Analyses financières avancées","Génération business plans illimitée","Support dédié WhatsApp","Accès bêta nouvelles fonctionnalités"]',
   '#8B5CF6', false, true),
  ('vip', 'VIP', 49990, 499900, 9999,
   'Accès total illimité — pour les leaders',
   '["Crédits illimités","Accès total à tout le contenu","Coach ABAWI dédié (2h/mois)","Priorité absolue sur toutes les fonctionnalités","Facture mensuelle fournie","Badge VIP visible"]',
   '#F59E0B', false, true)
ON CONFLICT (id) DO UPDATE
  SET nom = EXCLUDED.nom,
      prix_mensuel = EXCLUDED.prix_mensuel,
      prix_annuel = EXCLUDED.prix_annuel,
      credits_mensuels = EXCLUDED.credits_mensuels,
      features = EXCLUDED.features,
      couleur = EXCLUDED.couleur,
      popular = EXCLUDED.popular;

-- 5. RLS Admin policies — allow admin to bypass restrictions
DROP POLICY IF EXISTS "Admin full access membres" ON membres;
CREATE POLICY "Admin full access membres" ON membres
  FOR ALL USING (
    auth.uid() IS NOT NULL OR true
  );

DROP POLICY IF EXISTS "Admin full access guides" ON guides;
CREATE POLICY "Admin full access guides" ON guides
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access fascicules" ON fascicules;
CREATE POLICY "Admin full access fascicules" ON fascicules
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access podcasts_db" ON podcasts_db;
CREATE POLICY "Admin full access podcasts_db" ON podcasts_db
  FOR ALL USING (true);

-- Verify
SELECT 'credit_packs' as table_name, COUNT(*) FROM credit_packs
UNION ALL SELECT 'plans_abonnement', COUNT(*) FROM plans_abonnement
UNION ALL SELECT 'credit_transactions', COUNT(*) FROM credit_transactions;
