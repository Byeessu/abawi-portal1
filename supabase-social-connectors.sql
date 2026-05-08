-- Social connector persistence for Marketing 360
-- Safe to run multiple times

ALTER TABLE IF EXISTS site_content
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

CREATE INDEX IF NOT EXISTS idx_site_content_owner_type_key
  ON site_content(owner_email, content_type, content_key);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'site_content'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'site_content_owner_type_key_unique'
    ) THEN
      ALTER TABLE site_content
        ADD CONSTRAINT site_content_owner_type_key_unique
        UNIQUE (owner_email, content_type, content_key);
    END IF;
  END IF;
END $$;

-- Optional RLS policies
ALTER TABLE IF EXISTS site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner can read social connectors" ON site_content;
CREATE POLICY "owner can read social connectors"
  ON site_content FOR SELECT
  USING (
    content_type <> 'social_connector'
    OR owner_email = auth.jwt() ->> 'email'
  );

DROP POLICY IF EXISTS "owner can write social connectors" ON site_content;
CREATE POLICY "owner can write social connectors"
  ON site_content FOR ALL
  USING (
    content_type <> 'social_connector'
    OR owner_email = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    content_type <> 'social_connector'
    OR owner_email = auth.jwt() ->> 'email'
  );

-- Optional execution log table for connector dispatches
CREATE TABLE IF NOT EXISTS social_dispatch_logs (
  id BIGSERIAL PRIMARY KEY,
  owner_email TEXT,
  campaign_name TEXT,
  mode TEXT DEFAULT 'dry-run',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_dispatch_logs_owner_created
  ON social_dispatch_logs(owner_email, created_at DESC);

-- Queue table for async social dispatch execution
CREATE TABLE IF NOT EXISTS social_dispatch_queue (
  id BIGSERIAL PRIMARY KEY,
  owner_email TEXT,
  campaign_name TEXT,
  platform TEXT,
  account_id TEXT,
  mode TEXT DEFAULT 'live',
  message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- pending | running | done | failed
  attempts INT DEFAULT 0,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_dispatch_queue_owner_created
  ON social_dispatch_queue(owner_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_dispatch_queue_status_scheduled
  ON social_dispatch_queue(status, scheduled_for ASC);
