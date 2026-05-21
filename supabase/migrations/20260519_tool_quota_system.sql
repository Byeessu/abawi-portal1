-- ============================================================
-- Migration: Système de quotas avancé par outil
-- Date: 2026-05-19
--
-- Catégories:
--   1. GRATUIT_ILLIMITE   — pas de quota, pas de coût
--   2. GRATUIT_LIMITE     — quota journalier gratuit (2/jour)
--   3. FREEMIUM_COOLDOWN  — 1 utilisation / 3h, max 2/jour
--   4. PREMIUM            — nécessite plan ou crédits
--   5. SPECIAL            — règles spécifiques (abawi_ia, etc.)
-- ============================================================

-- Table: configuration des quotas par outil et par plan
CREATE TABLE IF NOT EXISTS tool_quotas (
  id            SERIAL PRIMARY KEY,
  tool_key      TEXT NOT NULL,
  tool_name     TEXT,
  category      TEXT NOT NULL DEFAULT 'GRATUIT_LIMITE', -- GRATUIT_ILLIMITE, GRATUIT_LIMITE, FREEMIUM_COOLDOWN, PREMIUM, SPECIAL
  plan_id       TEXT NOT NULL DEFAULT 'all',            -- 'all', 'gratuit', 'starter', 'pro', '360', 'elite', 'vip'
  limit_count   INTEGER NOT NULL DEFAULT 0,              -- 0 = illimité
  window_type   TEXT NOT NULL DEFAULT 'day',             -- 'hour', 'day', 'week', 'month'
  cooldown_min  INTEGER DEFAULT 0,                       -- minutes de cooldown entre 2 utilisations
  credit_cost   INTEGER DEFAULT 0,                       -- coût en crédits après quota
  action_type   TEXT NOT NULL DEFAULT 'block',           -- 'block', 'premium_cost', 'warn'
  cost_override INTEGER DEFAULT 0,                       -- coût majoré si dépassement
  monthly_price INTEGER DEFAULT 0,                     -- prix mensuel FCFA pour accès illimité à l'outil
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_key, plan_id)
);

-- Ajout de colonnes manquantes si la table existait déjà
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS tool_name TEXT;
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'GRATUIT_LIMITE';
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS plan_id TEXT NOT NULL DEFAULT 'all';
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS limit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS window_type TEXT NOT NULL DEFAULT 'day';
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS cooldown_min INTEGER DEFAULT 0;
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS credit_cost INTEGER DEFAULT 0;
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS action_type TEXT NOT NULL DEFAULT 'block';
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS cost_override INTEGER DEFAULT 0;
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS monthly_price INTEGER DEFAULT 0;
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tool_quotas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tool_quotas_key ON tool_quotas(tool_key);
CREATE INDEX IF NOT EXISTS idx_tool_quotas_plan ON tool_quotas(plan_id);
CREATE INDEX IF NOT EXISTS idx_tool_quotas_active ON tool_quotas(is_active);

-- Table: logs d'utilisation des outils (déjà référencée dans le code, s'assurer qu'elle existe)
CREATE TABLE IF NOT EXISTS tool_usage_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tool_key   TEXT NOT NULL,
  cost       INTEGER DEFAULT 0,
  plan_id    TEXT DEFAULT 'gratuit',
  metadata   JSONB DEFAULT '{}',
  used_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Ajout de colonnes manquantes si la table existait déjà
ALTER TABLE tool_usage_logs ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE tool_usage_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE tool_usage_logs ADD COLUMN IF NOT EXISTS tool_key TEXT;
ALTER TABLE tool_usage_logs ADD COLUMN IF NOT EXISTS cost INTEGER DEFAULT 0;
ALTER TABLE tool_usage_logs ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'gratuit';
ALTER TABLE tool_usage_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE tool_usage_logs ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_tool_usage_email_tool ON tool_usage_logs(email, tool_key);
CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON tool_usage_logs(used_at);

-- ============================================================
-- SEED DATA: Configuration par défaut (plan 'all' = gratuit)
-- ============================================================

-- 1. GRATUIT ILLIMITE (pas de quota, pas de coût)
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, credit_cost, action_type, monthly_price)
VALUES
  ('dictionnaire',      'Dictionnaire Elite',         'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0),
  ('exegetika',         'Exégétika',                  'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0),
  ('sante',             'Santé',                      'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0),
  ('traduction',        'Traducteur Elite',           'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0),
  ('autoroute',         'AutoRoute',                  'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0),
  ('editeur_pro',       'Éditeur Pro',                'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0),
  ('format_converter',  'Convertisseur de format',    'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0),
  ('store_view',        'Boutique (consultation)',    'GRATUIT_ILLIMITE', 'all', 0, 'day', 0, 'warn', 0)
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  category = EXCLUDED.category,
  limit_count = EXCLUDED.limit_count,
  credit_cost = EXCLUDED.credit_cost,
  updated_at = NOW();

-- 2. GRATUIT LIMITÉ (2/jour gratuit)
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, credit_cost, action_type, monthly_price)
VALUES
  ('qr_code_pro',       'QR Code Pro',        'GRATUIT_LIMITE', 'all', 2, 'day', 1, 'block', 9900),
  ('pro_card_elite',    'Pro Card Elite',     'GRATUIT_LIMITE', 'all', 2, 'day', 1, 'block', 9900),
  ('facture',           'Facture Creator',    'GRATUIT_LIMITE', 'all', 2, 'day', 0, 'block', 0),
  ('infographie',       'Infographie Pro',    'GRATUIT_LIMITE', 'all', 2, 'day', 4, 'block', 14900),
  ('image_pro',         'Image Pro',          'GRATUIT_LIMITE', 'all', 2, 'day', 3, 'block', 14900)
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  category = EXCLUDED.category,
  limit_count = EXCLUDED.limit_count,
  credit_cost = EXCLUDED.credit_cost,
  monthly_price = EXCLUDED.monthly_price,
  updated_at = NOW();

-- 3. FREEMIUM AVEC COOLDOWN (1 utilisation / 3h, max 2/jour)
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, cooldown_min, credit_cost, action_type, monthly_price)
VALUES
  ('cv',                'Créateur de CV',         'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 2, 'block', 19900),
  ('lettre',            'Lettre de motivation',   'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 2, 'block', 19900),
  ('analyse_cv',        'Analyse CV',             'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 3, 'block', 19900),
  ('pitch',             'Pitch Deck',             'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 6, 'block', 19900),
  ('business_plan',     'Business Plan',          'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 8, 'block', 19900),
  ('studio_photo',      'Photo Studio Pro',       'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 3, 'block', 19900),
  ('audio_studio',      'Audio Studio Elite',     'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 8, 'block', 29900),
  ('senticket_create',  'SenTicket (création)',   'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 5, 'block', 19900),
  ('senticket_export',  'SenTicket (export)',     'FREEMIUM_COOLDOWN', 'all', 2, 'day', 180, 2, 'block', 19900)
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  category = EXCLUDED.category,
  limit_count = EXCLUDED.limit_count,
  cooldown_min = EXCLUDED.cooldown_min,
  credit_cost = EXCLUDED.credit_cost,
  monthly_price = EXCLUDED.monthly_price,
  updated_at = NOW();

-- 4. PREMIUM (nécessite plan payant ou crédits — pas de quota gratuit)
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, credit_cost, action_type, monthly_price)
VALUES
  ('finance_elite',      'Finance Elite',         'PREMIUM', 'all', 0, 'day', 15, 'warn', 49900),
  ('juridique_elite',    'Juridique Elite',       'PREMIUM', 'all', 0, 'day', 12, 'warn', 49900),
  ('comptable_elite',    'Comptable Elite',       'PREMIUM', 'all', 0, 'day', 12, 'warn', 49900),
  ('rh_elite',           'RH Elite',              'PREMIUM', 'all', 0, 'day', 8,  'warn', 39900),
  ('immobilier_elite',   'Immobilier Elite',      'PREMIUM', 'all', 0, 'day', 8,  'warn', 39900),
  ('consultant_elite',   'Consultant Elite',      'PREMIUM', 'all', 0, 'day', 8,  'warn', 39900),
  ('smart_office',       'Smart Office',          'PREMIUM', 'all', 0, 'day', 5,  'warn', 29900),
  ('abspacegps',         'AbSpace GPS',           'PREMIUM', 'all', 0, 'day', 8,  'warn', 29900),
  ('tontine',            'Tontine',               'PREMIUM', 'all', 0, 'day', 8,  'warn', 29900),
  ('maxavis',            'MaxAvis Elite',         'PREMIUM', 'all', 0, 'day', 5,  'warn', 29900),
  ('crm_mensuel',        'CRM (mensuel)',         'PREMIUM', 'all', 0, 'day', 50, 'warn', 99900),
  ('planification_mensuel','Planification (mensuel)','PREMIUM','all',0,'day',30,'warn', 79900),
  ('stats_mensuel',      'Statistiques (mensuel)','PREMIUM', 'all', 0, 'day', 20, 'warn', 59900)
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  category = EXCLUDED.category,
  credit_cost = EXCLUDED.credit_cost,
  monthly_price = EXCLUDED.monthly_price,
  updated_at = NOW();

-- 5. SPÉCIAL — règles spécifiques
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, cooldown_min, credit_cost, action_type, monthly_price)
VALUES
  ('abawi_ia',          'ABAWI IA',           'SPECIAL', 'all', 10, 'day', 0, 1, 'block', 19900),
  ('annah',             'Annah AI',           'SPECIAL', 'all', 5,  'day', 0, 1, 'block', 19900),
  ('compte',            'Compte / Calculateur','SPECIAL', 'all', 30, 'day', 0, 0, 'block', 0)
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  category = EXCLUDED.category,
  limit_count = EXCLUDED.limit_count,
  cooldown_min = EXCLUDED.cooldown_min,
  credit_cost = EXCLUDED.credit_cost,
  monthly_price = EXCLUDED.monthly_price,
  updated_at = NOW();

-- ============================================================
-- PLANS PAYANTS : quotas multipliés ou illimités
-- ============================================================

-- Plan STARTER : quotas ×3 pour les outils freemium
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, cooldown_min, credit_cost, action_type)
SELECT tool_key, tool_name || ' (Starter)', category, 'starter', 
       CASE WHEN limit_count > 0 THEN limit_count * 3 ELSE 0 END,
       window_type, cooldown_min, GREATEST(1, credit_cost - 1), 'warn'
FROM tool_quotas WHERE plan_id = 'all' AND category IN ('GRATUIT_LIMITE', 'FREEMIUM_COOLDOWN', 'SPECIAL')
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  limit_count = EXCLUDED.limit_count,
  credit_cost = EXCLUDED.credit_cost,
  updated_at = NOW();

-- Plan PRO : quotas ×5 + cooldown réduit
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, cooldown_min, credit_cost, action_type)
SELECT tool_key, tool_name || ' (Pro)', category, 'pro',
       CASE WHEN limit_count > 0 THEN limit_count * 5 ELSE 0 END,
       window_type, CASE WHEN cooldown_min > 0 THEN 60 ELSE 0 END, 
       GREATEST(1, credit_cost - 2), 'warn'
FROM tool_quotas WHERE plan_id = 'all' AND category IN ('GRATUIT_LIMITE', 'FREEMIUM_COOLDOWN', 'SPECIAL')
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  limit_count = EXCLUDED.limit_count,
  cooldown_min = EXCLUDED.cooldown_min,
  credit_cost = EXCLUDED.credit_cost,
  updated_at = NOW();

-- Plan ELITE / VIP : illimité (limit_count = 0, action_type = warn)
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, cooldown_min, credit_cost, action_type)
SELECT tool_key, tool_name || ' (Elite)', category, 'elite', 0, window_type, 0, 0, 'warn'
FROM tool_quotas WHERE plan_id = 'all'
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  limit_count = 0,
  cooldown_min = 0,
  credit_cost = 0,
  updated_at = NOW();

-- Même chose pour VIP
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, cooldown_min, credit_cost, action_type)
SELECT tool_key, tool_name || ' (VIP)', category, 'vip', 0, window_type, 0, 0, 'warn'
FROM tool_quotas WHERE plan_id = 'all'
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  limit_count = 0,
  cooldown_min = 0,
  credit_cost = 0,
  updated_at = NOW();

-- Même chose pour 360
INSERT INTO tool_quotas (tool_key, tool_name, category, plan_id, limit_count, window_type, cooldown_min, credit_cost, action_type)
SELECT tool_key, tool_name || ' (360)', category, '360', 0, window_type, 0, 0, 'warn'
FROM tool_quotas WHERE plan_id = 'all'
ON CONFLICT (tool_key, plan_id) DO UPDATE SET
  limit_count = 0,
  cooldown_min = 0,
  credit_cost = 0,
  updated_at = NOW();

-- ============================================================
-- RLS policies (optionnel — si vous utilisez Supabase Auth)
-- ============================================================

ALTER TABLE tool_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tool_quotas_public_read" ON tool_quotas
  FOR SELECT USING (true);

ALTER TABLE tool_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tool_usage_logs_insert_own" ON tool_usage_logs
  FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

CREATE POLICY "tool_usage_logs_read_own" ON tool_usage_logs
  FOR SELECT USING (auth.uid() IS NULL OR auth.uid() = user_id);
