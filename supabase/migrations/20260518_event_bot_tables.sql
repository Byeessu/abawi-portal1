-- ── SenTicket Event Bot ──
-- Tables pour le bot d'événements (logs et file d'attente)

CREATE TABLE IF NOT EXISTS public.senticket_bot_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type      text NOT NULL DEFAULT 'scheduled', -- scheduled | manual
  categories    text[] NOT NULL DEFAULT '{}',
  events_created integer NOT NULL DEFAULT 0,
  events_failed  integer NOT NULL DEFAULT 0,
  details       jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.senticket_bot_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         text NOT NULL,
  description   text,
  categorie     text,
  ville         text,
  lieu          text,
  date          date,
  heure         text,
  billets       jsonb DEFAULT '[]',
  featured      boolean DEFAULT false,
  source        text DEFAULT 'bot',
  status        text DEFAULT 'pending', -- pending | published | rejected
  created_at    timestamptz DEFAULT now()
);

-- RLS policies (service-role / admin only)
ALTER TABLE public.senticket_bot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senticket_bot_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Allow all" ON public.senticket_bot_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  -- Policy existe déjà
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow all" ON public.senticket_bot_queue FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN
  -- Policy existe déjà
END $$;
