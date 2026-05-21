-- ============================================================
-- Migration : Système de Quotas Intelligents (Smart Quotas)
-- ============================================================

-- Table de configuration des quotas par outil et par plan
CREATE TABLE IF NOT EXISTS tool_quotas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_key      text NOT NULL,           -- ex: 'audio_studio', 'business_plan_elite'
  plan_id       text NOT NULL DEFAULT 'all',  -- 'gratuit','starter','pro','elite','360','vip','all'
  window_type   text NOT NULL CHECK (window_type IN ('hour','day','week','month')),
  limit_count   int NOT NULL DEFAULT 0,  -- 0 = illimité (juste crédits)
  cost_override int,                     -- coût si dépassement (optionnel)
  action_type   text NOT NULL DEFAULT 'block' CHECK (action_type IN ('block','warn','premium_cost')),
  description   text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(tool_key, plan_id)
);

-- Table de logs d'usage (pour compter dans la fenêtre glissante)
CREATE TABLE IF NOT EXISTS tool_usage_logs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email     text NOT NULL,
  tool_key  text NOT NULL,
  used_at   timestamptz DEFAULT now(),
  cost      int DEFAULT 0,
  plan_id   text,
  session_id text,                       -- pour regrouper les appels d'une même session
  metadata  jsonb DEFAULT '{}'
);

-- Index pour performances des requêtes de comptage
CREATE INDEX IF NOT EXISTS idx_tool_usage_email_tool ON tool_usage_logs(email, tool_key);
CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON tool_usage_logs(used_at);

-- Table de reset automatique des quotas (planifiés)
CREATE TABLE IF NOT EXISTS quota_reset_schedule (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  tool_key    text NOT NULL,
  window_type text NOT NULL,
  reset_at    timestamptz NOT NULL,
  notified    boolean DEFAULT false,
  UNIQUE(email, tool_key, window_type)
);

-- ============================================================
-- Fonction utilitaire : compter les usages dans la fenêtre
-- ============================================================
CREATE OR REPLACE FUNCTION get_quota_usage(p_email text, p_tool_key text, p_window text)
RETURNS int AS $$
DECLARE
  v_count int;
  v_since timestamptz;
BEGIN
  v_since := CASE p_window
    WHEN 'hour'  THEN now() - interval '1 hour'
    WHEN 'day'   THEN now() - interval '1 day'
    WHEN 'week'  THEN now() - interval '1 week'
    WHEN 'month' THEN now() - interval '1 month'
    ELSE now() - interval '1 day'
  END;

  SELECT COUNT(*)::int INTO v_count
  FROM tool_usage_logs
  WHERE email = p_email
    AND tool_key = p_tool_key
    AND used_at >= v_since;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Seed : configuration par défaut des quotas
-- ============================================================

-- Outils FREEMIUM (gratuits avec limite stricte)
INSERT INTO tool_quotas (tool_key, plan_id, window_type, limit_count, action_type, description)
VALUES
  ('studio_photo',      'gratuit', 'day', 3,  'block', 'Studio Photo IA — 3/jour gratuits'),
  ('studio_photo',      'starter', 'day', 15, 'block', 'Studio Photo IA — 15/jour'),
  ('studio_photo',      'pro',     'day', 50, 'block', 'Studio Photo IA — 50/jour'),
  ('studio_photo',      'elite',   'day', 0,  'block', 'Studio Photo IA — illimité'),

  ('studio_logo',       'gratuit', 'day', 2,  'block', 'Studio Logo IA — 2/jour gratuits'),
  ('studio_logo',       'starter', 'day', 10, 'block', 'Studio Logo IA — 10/jour'),
  ('studio_logo',       'pro',     'day', 30, 'block', 'Studio Logo IA — 30/jour'),

  ('infographie',       'gratuit', 'day', 1,  'block', 'Infographie IA — 1/jour gratuit'),
  ('infographie',       'starter', 'day', 5,  'block', 'Infographie IA — 5/jour'),
  ('infographie',       'pro',     'day', 20, 'block', 'Infographie IA — 20/jour'),

  ('abawi_ia_quiz',     'gratuit', 'day', 5,  'block', 'Quiz IA — 5/jour gratuits'),
  ('abawi_ia_quiz',     'starter', 'day', 20, 'block', 'Quiz IA — 20/jour'),

  ('abawi_ia_recherche','gratuit', 'day', 5,  'block', 'Recherche IA — 5/jour gratuits'),
  ('abawi_ia_recherche','starter', 'day', 30, 'block', 'Recherche IA — 30/jour'),

  ('cv',                'gratuit', 'day', 1,  'block', 'Générateur CV — 1/jour gratuit'),
  ('cv',                'starter', 'day', 5,  'block', 'Générateur CV — 5/jour'),

  ('lettre',            'gratuit', 'day', 1,  'block', 'Lettre de motivation — 1/jour gratuit'),
  ('lettre',            'starter', 'day', 5,  'block', 'Lettre de motivation — 5/jour'),

  ('traduction',        'gratuit', 'day', 3,  'block', 'Traduction IA — 3/jour gratuits'),
  ('traduction',        'starter', 'day', 15, 'block', 'Traduction IA — 15/jour')

ON CONFLICT (tool_key, plan_id) DO NOTHING;

-- Outils PROTECTION API (payant + rate limit pour protéger les coûts API)
INSERT INTO tool_quotas (tool_key, plan_id, window_type, limit_count, cost_override, action_type, description)
VALUES
  ('audio_studio',      'all', 'hour', 3,  12, 'premium_cost', 'Audio Studio — max 3/h, ensuite 12 crédits'),
  ('audio_studio',      'pro', 'hour', 5,  12, 'premium_cost', 'Audio Studio Pro — max 5/h'),
  ('audio_studio',      'elite','hour', 8,  12, 'premium_cost', 'Audio Studio Elite — max 8/h'),

  ('business_plan',     'all', 'hour', 2,  10, 'premium_cost', 'Business Plan — max 2/h'),
  ('business_plan',     'pro', 'hour', 3,  10, 'premium_cost', 'Business Plan Pro — max 3/h'),

  ('finance_elite',     'all', 'hour', 3,  20, 'premium_cost', 'Finance Elite — max 3/h'),
  ('juridique_elite',   'all', 'hour', 3,  16, 'premium_cost', 'Juridique Elite — max 3/h'),
  ('comptable_elite',   'all', 'hour', 3,  16, 'premium_cost', 'Comptable Elite — max 3/h'),

  ('smart_office',      'all', 'hour', 2,  10, 'premium_cost', 'Smart Office — max 2/h'),
  ('crm_mensuel',       'all', 'day',  50, 0,  'block', 'CRM — max 50 actions/jour')

ON CONFLICT (tool_key, plan_id) DO NOTHING;

-- ============================================================
-- Seed : TOUS les outils restants (gratuits + payants)
-- ============================================================

-- Outils basiques gratuits / low-cost (guides, podcasts, etc.)
INSERT INTO tool_quotas (tool_key, plan_id, window_type, limit_count, action_type, description)
VALUES
  ('guide',             'gratuit', 'day', 2,  'block', 'Guides premium — 2/jour gratuits'),
  ('guide',             'starter', 'day', 10, 'block', 'Guides premium — 10/jour'),
  ('guide',             'pro',     'day', 0,  'block', 'Guides premium — illimité'),

  ('fascicule',         'gratuit', 'day', 3,  'block', 'Fascicules — 3/jour gratuits'),
  ('fascicule',         'starter', 'day', 15, 'block', 'Fascicules — 15/jour'),
  ('fascicule',         'pro',     'day', 0,  'block', 'Fascicules — illimité'),

  ('podcast',           'gratuit', 'day', 3,  'block', 'Podcasts — 3/jour gratuits'),
  ('podcast',           'starter', 'day', 15, 'block', 'Podcasts — 15/jour'),

  ('facture',           'gratuit', 'day', 3,  'block', 'Factures — 3/jour gratuits'),
  ('facture',           'starter', 'day', 15, 'block', 'Factures — 15/jour'),

  ('dictionnaire',      'gratuit', 'day', 5,  'block', 'Dictionnaire — 5/jour gratuits'),
  ('dictionnaire',      'starter', 'day', 25, 'block', 'Dictionnaire — 25/jour'),

  ('sante',             'gratuit', 'day', 3,  'block', 'Sante IA — 3/jour gratuits'),
  ('sante',             'starter', 'day', 15, 'block', 'Sante IA — 15/jour'),

  ('autoroute',         'gratuit', 'day', 3,  'block', 'Autoroute — 3/jour gratuits'),
  ('autoroute',         'starter', 'day', 15, 'block', 'Autoroute — 15/jour'),

  ('editeur_pro',       'gratuit', 'day', 3,  'block', 'Editeur Pro — 3/jour gratuits'),
  ('editeur_pro',       'starter', 'day', 15, 'block', 'Editeur Pro — 15/jour'),

  ('abawi_ia_defi',     'gratuit', 'day', 5,  'block', 'Defi IA — 5/jour gratuits'),
  ('abawi_ia_defi',     'starter', 'day', 20, 'block', 'Defi IA — 20/jour'),

  ('abawi_ia_simulation','gratuit','day', 3,  'block', 'Simulation IA — 3/jour gratuits'),
  ('abawi_ia_simulation','starter','day', 15, 'block', 'Simulation IA — 15/jour'),

  ('abawi_ia_apprentissage','gratuit','day', 3,  'block', 'Apprentissage IA — 3/jour gratuits'),
  ('abawi_ia_apprentissage','starter','day', 15, 'block', 'Apprentissage IA — 15/jour')

ON CONFLICT (tool_key, plan_id) DO NOTHING;

-- Outils PAYANTS (quotas plus généreux mais protégés)
INSERT INTO tool_quotas (tool_key, plan_id, window_type, limit_count, cost_override, action_type, description)
VALUES
  ('pitch',             'all',     'hour', 3,  8,  'premium_cost', 'Pitch — max 3/h, ensuite 8 credits'),
  ('pitch',             'pro',     'hour', 5,  8,  'premium_cost', 'Pitch Pro — max 5/h'),
  ('pitch',             'elite',   'hour', 0,  0,  'block',        'Pitch Elite — illimité'),

  ('analyse_cv',        'all',     'hour', 3,  6,  'premium_cost', 'Analyse CV — max 3/h, ensuite 6 credits'),
  ('analyse_cv',        'pro',     'hour', 5,  6,  'premium_cost', 'Analyse CV Pro — max 5/h'),

  ('rh_elite',          'all',     'hour', 3,  12, 'premium_cost', 'RH Elite — max 3/h, ensuite 12 credits'),
  ('rh_elite',          'pro',     'hour', 5,  12, 'premium_cost', 'RH Elite Pro — max 5/h'),

  ('immobilier_elite',  'all',     'hour', 3,  12, 'premium_cost', 'Immobilier Elite — max 3/h'),
  ('immobilier_elite',  'pro',     'hour', 5,  12, 'premium_cost', 'Immobilier Elite Pro — max 5/h'),

  ('consultant_elite',  'all',     'hour', 3,  12, 'premium_cost', 'Consultant Elite — max 3/h'),
  ('consultant_elite',  'pro',     'hour', 5,  12, 'premium_cost', 'Consultant Elite Pro — max 5/h'),

  ('tontine',           'all',     'hour', 3,  10, 'premium_cost', 'Tontine — max 3/h, ensuite 10 credits'),
  ('tontine',           'pro',     'hour', 5,  10, 'premium_cost', 'Tontine Pro — max 5/h'),

  ('senticket_create',  'all',     'hour', 3,  10, 'premium_cost', 'SenTicket — max 3/h, ensuite 10 credits'),
  ('senticket_export',  'all',     'hour', 5,  4,  'premium_cost', 'SenTicket Export — max 5/h'),

  ('exegetika',         'all',     'hour', 3,  6,  'premium_cost', 'Exegetika — max 3/h, ensuite 6 credits'),
  ('exegetika',         'pro',     'hour', 5,  6,  'premium_cost', 'Exegetika Pro — max 5/h'),

  ('maxavis',           'all',     'hour', 3,  6,  'premium_cost', 'MaxAvis — max 3/h, ensuite 6 credits'),
  ('maxavis',           'pro',     'hour', 5,  6,  'premium_cost', 'MaxAvis Pro — max 5/h'),

  ('planification_mensuel','all',  'day',  10, 50, 'premium_cost', 'Planification — max 10/jour, ensuite 50 credits'),
  ('planification_mensuel','pro',  'day',  20, 50, 'premium_cost', 'Planification Pro — max 20/jour'),

  ('stats_mensuel',     'all',     'day',  10, 40, 'premium_cost', 'Stats mensuel — max 10/jour, ensuite 40 credits'),
  ('stats_mensuel',     'pro',     'day',  20, 40, 'premium_cost', 'Stats Pro — max 20/jour')

ON CONFLICT (tool_key, plan_id) DO NOTHING;

-- Commentaires documentaires
COMMENT ON TABLE tool_quotas IS 'Configuration des limites d\'usage par outil et plan';
COMMENT ON TABLE tool_usage_logs IS 'Historique des usages pour le calcul des quotas glissants';
