-- ═══════════════════════════════════════════════════════════════
-- Migration : SenTicket — Tiers Organisateurs & Commission dynamique
-- ═══════════════════════════════════════════════════════════════
-- Objectif :
--   1. Ajouter organizer_tier sur public.membres
--   2. Créer senticket_tier_config (commission/features par offre)
--   3. S'assurer que les tables senticket existent
--   4. Rétrocompatible : valeur par défaut 'start' = 7%
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Tiers organisateur sur membres ──────────────────────────
DO $$
BEGIN
  ALTER TABLE public.membres ADD COLUMN organizer_tier text DEFAULT 'start';
EXCEPTION WHEN duplicate_column THEN
  -- La colonne existe déjà
END $$;

DO $$
BEGIN
  ALTER TABLE public.membres ADD CONSTRAINT membres_organizer_tier_check
    CHECK (organizer_tier IN ('start', 'pro', 'business'));
EXCEPTION WHEN duplicate_object OR duplicate_table OR check_violation THEN
  -- Existe déjà
END $$;

-- Index rapide
CREATE INDEX IF NOT EXISTS idx_membres_organizer_tier ON public.membres(organizer_tier);

-- ── 2. Table de configuration des offres SenTicket ─────────────
CREATE TABLE IF NOT EXISTS public.senticket_tier_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key        text NOT NULL UNIQUE CHECK (tier_key IN ('start', 'pro', 'business')),
  label           text NOT NULL,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.0700,
  monthly_price   integer DEFAULT 0,          -- FCFA/mois (0 = gratuit)
  withdrawal_delay_days integer DEFAULT 3,   -- J+3 pour Start
  max_events      integer DEFAULT NULL,        -- NULL = illimité
  branding        boolean DEFAULT false,       -- Logo perso sur billets
  featured_boost  boolean DEFAULT false,       -- Mise en avant ABAWI
  api_access      boolean DEFAULT false,        -- Export API/CSV avancé
  support_level   text DEFAULT 'email' CHECK (support_level IN ('email', 'whatsapp', 'dedicated')),
  description     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE public.senticket_tier_config IS 'Configuration des 3 offres SenTicket (Start/Pro/Business)';

-- ── 3. Seed des 3 offres (idempotent) ───────────────────────────
INSERT INTO public.senticket_tier_config (tier_key, label, commission_rate, monthly_price, withdrawal_delay_days, max_events, branding, featured_boost, api_access, support_level, description)
VALUES
  ('start',    'SenTicket Start',    0.0700, 0,      3, NULL, false, false, false, 'email',      'Gratuit — 7% de commission, retrait J+3, parfait pour les petits événements et associations.'),
  ('pro',      'SenTicket Pro',      0.0450, 15000,  1, NULL, true,  false, false, 'whatsapp',   '15 000 FCFA/mois — 4,5% de commission, retrait J+1, branding perso, support prioritaire WhatsApp.'),
  ('business', 'SenTicket Business', 0.0200, 0,      0, NULL, true,  true,  true,  'dedicated','Sur mesure — 2% (négociable au-dessus de 5M FCFA), retrait instantané, compte manager dédié, API & intégrations.')
ON CONFLICT (tier_key) DO UPDATE SET
  label             = EXCLUDED.label,
  commission_rate   = EXCLUDED.commission_rate,
  monthly_price     = EXCLUDED.monthly_price,
  withdrawal_delay_days = EXCLUDED.withdrawal_delay_days,
  max_events        = EXCLUDED.max_events,
  branding          = EXCLUDED.branding,
  featured_boost    = EXCLUDED.featured_boost,
  api_access        = EXCLUDED.api_access,
  support_level     = EXCLUDED.support_level,
  description       = EXCLUDED.description,
  updated_at        = now();

-- ── 4. Tables SenTicket (création défensive IF NOT EXISTS) ─────
--    Si elles existent déjà (créées manuellement ou via dashboard), on ne touche à rien.

CREATE TABLE IF NOT EXISTS public.senticket_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         text NOT NULL,
  description   text,
  categorie     text,
  ville         text,
  lieu          text,
  date          date,
  heure         text,
  cover_url     text,
  featured      boolean DEFAULT false,
  statut        text DEFAULT 'actif',
  commission_rate numeric(5,4) DEFAULT 0.0700,  -- Override possible par événement
  organizer_id  uuid REFERENCES public.membres(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.senticket_tickets (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  uuid REFERENCES public.senticket_events(id) ON DELETE CASCADE,
  nom       text NOT NULL,
  prix      integer NOT NULL DEFAULT 0,
  places    integer NOT NULL DEFAULT 0,
  vendus    integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.senticket_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES public.senticket_events(id) ON DELETE CASCADE,
  ticket_id       uuid REFERENCES public.senticket_tickets(id) ON DELETE SET NULL,
  user_id         uuid REFERENCES public.membres(id) ON DELETE SET NULL,
  qty             integer NOT NULL DEFAULT 1,
  prix_total      integer NOT NULL DEFAULT 0,
  commission      integer NOT NULL DEFAULT 0,
  discount        integer NOT NULL DEFAULT 0,
  net_organisateur integer NOT NULL DEFAULT 0,
  acheteur        jsonb DEFAULT '{}',
  payment_method  text,
  coupon_code     text,
  group_emails    text[],
  statut          text DEFAULT 'confirmé',
  qr_data         text,
  scanned         boolean DEFAULT false,
  date_achat      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.senticket_withdrawals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id  uuid REFERENCES public.membres(id) ON DELETE CASCADE,
  event_id      uuid REFERENCES public.senticket_events(id) ON DELETE SET NULL,
  montant       integer NOT NULL DEFAULT 0,
  methode       text,
  telephone     text,
  statut        text DEFAULT 'En attente',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.senticket_favorites (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid REFERENCES public.membres(id) ON DELETE CASCADE,
  event_id  uuid REFERENCES public.senticket_events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.senticket_reviews (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  uuid REFERENCES public.senticket_events(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES public.membres(id) ON DELETE CASCADE,
  stars     integer CHECK (stars >= 1 AND stars <= 5),
  text      text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- ── 5. Index de performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_senticket_events_organizer ON public.senticket_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_senticket_events_statut    ON public.senticket_events(statut);
CREATE INDEX IF NOT EXISTS idx_senticket_orders_event     ON public.senticket_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_senticket_orders_user      ON public.senticket_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_senticket_withdrawals_org  ON public.senticket_withdrawals(organizer_id);

-- ── 6. Trigger : mettre à jour updated_at ─────────────────────
CREATE OR REPLACE FUNCTION public.senticket_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER trg_senticket_events_updated_at
    BEFORE UPDATE ON public.senticket_events
    FOR EACH ROW EXECUTE FUNCTION public.senticket_set_updated_at();
EXCEPTION WHEN duplicate_object THEN
  -- Trigger existe déjà
END $$;

-- ── 7. RLS de base (désactivé par défaut, activer manuellement si besoin) ──
--    On laisse les politiques souples pour ne pas casser l'existant.
ALTER TABLE public.senticket_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senticket_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senticket_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senticket_withdrawals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senticket_favorites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senticket_reviews      ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "senticket_events_all" ON public.senticket_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "senticket_tickets_all" ON public.senticket_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "senticket_orders_all" ON public.senticket_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "senticket_withdrawals_all" ON public.senticket_withdrawals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "senticket_favorites_all" ON public.senticket_favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "senticket_reviews_all" ON public.senticket_reviews FOR ALL USING (true) WITH CHECK (true);
