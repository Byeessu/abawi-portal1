-- Enrichment columns for store_products. Idempotent — safe to re-run.
-- After applying, run `npm run store:enrich` to backfill the new fields.

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS points_forts JSONB,
  ADD COLUMN IF NOT EXISTS cas_usage    JSONB,
  ADD COLUMN IF NOT EXISTS public_cible TEXT,
  ADD COLUMN IF NOT EXISTS tags         JSONB;

-- Convert legacy text/array `specs` to JSONB if not already.
-- (Skip if your `specs` column is already jsonb — Postgres will no-op.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_products' AND column_name = 'specs'
      AND data_type NOT IN ('jsonb', 'json')
  ) THEN
    ALTER TABLE store_products ALTER COLUMN specs TYPE JSONB USING
      CASE
        WHEN specs IS NULL THEN NULL
        WHEN specs::text ~ '^\s*[\[{]' THEN specs::text::jsonb
        ELSE to_jsonb(string_to_array(specs::text, ','))
      END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_store_products_tags ON store_products USING GIN (tags);
