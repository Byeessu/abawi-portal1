-- ═════════════════════════════════════════════════════════════
-- ABAWI TOOLS V2 - SQL COMPLET (Studio + Dissecteur + Outils)
-- Exécuter dans Supabase SQL Editor
-- Script idempotent (safe à relancer)
-- ═════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1) Harmonisation membres / plans / credits
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS membres
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'gratuit',
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'gratuit',
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE membres
SET
  plan_type = COALESCE(NULLIF(LOWER(TRIM(plan_type)), ''), NULLIF(LOWER(TRIM(plan)), ''), 'gratuit'),
  plan = COALESCE(NULLIF(LOWER(TRIM(plan)), ''), NULLIF(LOWER(TRIM(plan_type)), ''), 'gratuit')
WHERE TRUE;

-- ─────────────────────────────────────────────────────────────
-- 2) Journal crédits (utilisé par les outils)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membre_id UUID NULL,
  email TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'debit' CHECK (type IN ('credit','debit','bonus','adjustment')),
  montant INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_email ON credit_transactions(email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_membre_id ON credit_transactions(membre_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 3) Jobs IA unifiés (ABAWI Studio + Disséqueur + futurs outils)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool TEXT NOT NULL, -- ex: abawi-studio-pro / dissecteur-infos-elite
  job_type TEXT NOT NULL DEFAULT 'analysis', -- transcription / generation / export / analysis
  user_email TEXT DEFAULT '',
  member_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT DEFAULT '',
  cost_credits INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NULL,
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_tool ON ai_jobs(tool);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_job_type ON ai_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_email ON ai_jobs(user_email);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_member_id ON ai_jobs(member_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created_at ON ai_jobs(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 4) Fichiers/exports générés par les outils
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NULL REFERENCES ai_jobs(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'txt' CHECK (format IN ('txt','pdf','docx','pptx','xlsx','json','mp3','mp4')),
  file_url TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT 'text/plain',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  user_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_exports_job_id ON ai_exports(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_exports_tool ON ai_exports(tool);
CREATE INDEX IF NOT EXISTS idx_ai_exports_created_at ON ai_exports(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 5) Compléments contenus (lyrics, audio résumé, media)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS podcasts_db
  ADD COLUMN IF NOT EXISTS lyrics TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS guides
  ADD COLUMN IF NOT EXISTS summary_audio_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS fascicules
  ADD COLUMN IF NOT EXISTS summary_audio_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 6) Trigger updated_at générique
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_jobs_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_ai_jobs_set_updated_at
    BEFORE UPDATE ON ai_jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_membres_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_membres_set_updated_at
    BEFORE UPDATE ON membres
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guides_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_guides_set_updated_at
    BEFORE UPDATE ON guides
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fascicules_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_fascicules_set_updated_at
    BEFORE UPDATE ON fascicules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_podcasts_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_podcasts_set_updated_at
    BEFORE UPDATE ON podcasts_db
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7) RLS
--    (Aligné avec le projet: lecture publique, écriture admin/app)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ai_jobs" ON ai_jobs;
DROP POLICY IF EXISTS "Admin all ai_jobs" ON ai_jobs;
CREATE POLICY "Public read ai_jobs" ON ai_jobs FOR SELECT USING (true);
CREATE POLICY "Admin all ai_jobs" ON ai_jobs FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read ai_exports" ON ai_exports;
DROP POLICY IF EXISTS "Admin all ai_exports" ON ai_exports;
CREATE POLICY "Public read ai_exports" ON ai_exports FOR SELECT USING (true);
CREATE POLICY "Admin all ai_exports" ON ai_exports FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read credit_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admin all credit_transactions" ON credit_transactions;
CREATE POLICY "Public read credit_transactions" ON credit_transactions FOR SELECT USING (true);
CREATE POLICY "Admin all credit_transactions" ON credit_transactions FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────
-- 8) Buckets stockage outils v2 (si absents)
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ai-jobs', 'ai-jobs', true, 104857600, ARRAY[
    'text/plain','application/json','application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]),
  ('studio-audio', 'studio-audio', true, 262144000, ARRAY[
    'audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/x-m4a'
  ]),
  ('studio-video', 'studio-video', true, 524288000, ARRAY[
    'video/mp4','video/webm','image/jpeg','image/jpg','image/png','image/webp'
  ])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
DECLARE b TEXT;
DECLARE bl TEXT[] := ARRAY['ai-jobs','studio-audio','studio-video'];
DECLARE p_read TEXT;
DECLARE p_upload TEXT;
DECLARE p_update TEXT;
DECLARE p_delete TEXT;
BEGIN
  FOREACH b IN ARRAY bl LOOP
    p_read := 'public_read_' || replace(b, '-', '_');
    p_upload := 'allow_upload_' || replace(b, '-', '_');
    p_update := 'allow_update_' || replace(b, '-', '_');
    p_delete := 'allow_delete_' || replace(b, '-', '_');

    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p_read);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p_upload);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p_update);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p_delete);

    EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)', p_read, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)', p_upload, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L)', p_update, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L)', p_delete, b);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 9) Vue de reporting usage outils
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_ai_tools_usage AS
SELECT
  tool,
  job_type,
  status,
  date_trunc('day', created_at) AS day,
  count(*) AS jobs_count,
  sum(cost_credits) AS credits_used
FROM ai_jobs
GROUP BY tool, job_type, status, date_trunc('day', created_at);

-- ─────────────────────────────────────────────────────────────
-- 10) Vérification rapide
-- ─────────────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ai_jobs','ai_exports','credit_transactions')
ORDER BY table_name;

SELECT id, name, public
FROM storage.buckets
WHERE id IN ('ai-jobs','studio-audio','studio-video')
ORDER BY id;
