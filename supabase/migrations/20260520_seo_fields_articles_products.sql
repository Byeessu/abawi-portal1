-- Articles SEO fields
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS dc text,
  ADD COLUMN IF NOT EXISTS dl text,
  ADD COLUMN IF NOT EXISTS kw jsonb,
  ADD COLUMN IF NOT EXISTS sl text;

-- Store products SEO fields
ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS description_longue text,
  ADD COLUMN IF NOT EXISTS mots_cles jsonb;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS articles_sl_idx ON articles (sl) WHERE sl IS NOT NULL AND sl <> '';
CREATE INDEX IF NOT EXISTS articles_kw_gin ON articles USING gin (kw);
CREATE INDEX IF NOT EXISTS store_products_kw_gin ON store_products USING gin (mots_cles);

-- Default values for existing rows (handle duplicate slugs)
WITH base_slugs AS (
  SELECT id, ti, su,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(ti, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) AS base
  FROM articles
  WHERE dc IS NULL OR sl IS NULL
),
numbered AS (
  SELECT id, ti, su, base,
    ROW_NUMBER() OVER (PARTITION BY base ORDER BY id) AS rn
  FROM base_slugs
)
UPDATE articles a
SET dc = SUBSTRING(n.su, 1, 155),
    sl = CASE
      WHEN n.rn = 1 THEN n.base
      ELSE n.base || '-' || (n.rn - 1)
    END
FROM numbered n
WHERE a.id = n.id;

UPDATE store_products
SET seo_title = SUBSTRING(nom, 1, 65)
WHERE seo_title IS NULL;
