-- ═══════════════════════════════════════════════════════════
-- STORE SEO ENHANCED — Champs SEO complets pour tous les produits
-- Description, Caractéristiques, Points forts, Cas d'usage
-- ═══════════════════════════════════════════════════════════

-- ── STORE PRODUCTS (Tech) ──────────────────────────────────
ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS description_longue TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS points_forts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cas_usage TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS public_cible TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- ── ABAVIE PRODUCTS (Santé) ────────────────────────────────
ALTER TABLE abavie_products
  ADD COLUMN IF NOT EXISTS description_longue TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS points_forts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cas_usage TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS public_cible TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- ── GUIDES ─────────────────────────────────────────────────
ALTER TABLE guides
  ADD COLUMN IF NOT EXISTS description_longue TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS points_forts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cas_usage TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS public_cible TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- ── FASCICULES ───────────────────────────────────────────
ALTER TABLE fascicules
  ADD COLUMN IF NOT EXISTS description_longue TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS points_forts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cas_usage TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS public_cible TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- ── PODCASTS ─────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'podcasts') THEN
    ALTER TABLE podcasts
      ADD COLUMN IF NOT EXISTS description_longue TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS points_forts TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS cas_usage TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS seo_tags TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS public_cible TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- ── VIDEOS ────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos') THEN
    ALTER TABLE videos
      ADD COLUMN IF NOT EXISTS description_longue TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS points_forts TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS cas_usage TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS seo_tags TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS public_cible TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- ── CONTENT PACKS ──────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_packs') THEN
    ALTER TABLE content_packs
      ADD COLUMN IF NOT EXISTS description_longue TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS caracteristiques JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS points_forts TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS cas_usage TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS seo_tags TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS public_cible TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- ── INDEXES SEO ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_store_products_seo_score ON store_products(seo_score);
CREATE INDEX IF NOT EXISTS idx_abavie_products_seo_score ON abavie_products(seo_score);
CREATE INDEX IF NOT EXISTS idx_guides_seo_score ON guides(seo_score);
CREATE INDEX IF NOT EXISTS idx_fascicules_seo_score ON fascicules(seo_score);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'podcasts') THEN
    CREATE INDEX IF NOT EXISTS idx_podcasts_seo_score ON podcasts(seo_score);
  END IF;
END $$;

-- ── FUNCTION: SEO Score Calculator ──────────────────────
CREATE OR REPLACE FUNCTION calculate_seo_score(
  p_desc TEXT,
  p_carac JSONB,
  p_points TEXT[],
  p_usage TEXT[],
  p_meta_title TEXT,
  p_meta_desc TEXT,
  p_tags TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Description longue (0-25 points)
  IF LENGTH(COALESCE(p_desc, '')) > 300 THEN score := score + 25;
  ELSIF LENGTH(COALESCE(p_desc, '')) > 150 THEN score := score + 15;
  ELSIF LENGTH(COALESCE(p_desc, '')) > 50 THEN score := score + 5;
  END IF;

  -- Caractéristiques (0-20 points)
  IF jsonb_array_length(COALESCE(p_carac, '[]'::jsonb)) >= 5 THEN score := score + 20;
  ELSIF jsonb_array_length(COALESCE(p_carac, '[]'::jsonb)) >= 3 THEN score := score + 10;
  ELSIF jsonb_array_length(COALESCE(p_carac, '[]'::jsonb)) >= 1 THEN score := score + 5;
  END IF;

  -- Points forts (0-15 points)
  IF array_length(COALESCE(p_points, '{}'), 1) >= 5 THEN score := score + 15;
  ELSIF array_length(COALESCE(p_points, '{}'), 1) >= 3 THEN score := score + 10;
  ELSIF array_length(COALESCE(p_points, '{}'), 1) >= 1 THEN score := score + 5;
  END IF;

  -- Cas d'usage (0-15 points)
  IF array_length(COALESCE(p_usage, '{}'), 1) >= 4 THEN score := score + 15;
  ELSIF array_length(COALESCE(p_usage, '{}'), 1) >= 2 THEN score := score + 10;
  ELSIF array_length(COALESCE(p_usage, '{}'), 1) >= 1 THEN score := score + 5;
  END IF;

  -- Meta title (0-10 points)
  IF LENGTH(COALESCE(p_meta_title, '')) BETWEEN 30 AND 65 THEN score := score + 10;
  ELSIF LENGTH(COALESCE(p_meta_title, '')) > 0 THEN score := score + 5;
  END IF;

  -- Meta description (0-10 points)
  IF LENGTH(COALESCE(p_meta_desc, '')) BETWEEN 120 AND 160 THEN score := score + 10;
  ELSIF LENGTH(COALESCE(p_meta_desc, '')) > 0 THEN score := score + 5;
  END IF;

  -- Tags (0-5 points)
  IF array_length(COALESCE(p_tags, '{}'), 1) >= 5 THEN score := score + 5;
  ELSIF array_length(COALESCE(p_tags, '{}'), 1) >= 3 THEN score := score + 3;
  ELSIF array_length(COALESCE(p_tags, '{}'), 1) >= 1 THEN score := score + 1;
  END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- ── TRIGGER: Auto-update SEO score ────────────────────────
CREATE OR REPLACE FUNCTION trigger_update_seo_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.seo_score := calculate_seo_score(
    NEW.description_longue,
    NEW.caracteristiques,
    NEW.points_forts,
    NEW.cas_usage,
    NEW.meta_title,
    NEW.meta_description,
    NEW.seo_tags
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all product tables
DROP TRIGGER IF EXISTS update_seo_score_store ON store_products;
CREATE TRIGGER update_seo_score_store
  BEFORE INSERT OR UPDATE ON store_products
  FOR EACH ROW EXECUTE FUNCTION trigger_update_seo_score();

DROP TRIGGER IF EXISTS update_seo_score_abavie ON abavie_products;
CREATE TRIGGER update_seo_score_abavie
  BEFORE INSERT OR UPDATE ON abavie_products
  FOR EACH ROW EXECUTE FUNCTION trigger_update_seo_score();

DROP TRIGGER IF EXISTS update_seo_score_guides ON guides;
CREATE TRIGGER update_seo_score_guides
  BEFORE INSERT OR UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION trigger_update_seo_score();

DROP TRIGGER IF EXISTS update_seo_score_fascicules ON fascicules;
CREATE TRIGGER update_seo_score_fascicules
  BEFORE INSERT OR UPDATE ON fascicules
  FOR EACH ROW EXECUTE FUNCTION trigger_update_seo_score();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'podcasts') THEN
    DROP TRIGGER IF EXISTS update_seo_score_podcasts ON podcasts;
    CREATE TRIGGER update_seo_score_podcasts
      BEFORE INSERT OR UPDATE ON podcasts
      FOR EACH ROW EXECUTE FUNCTION trigger_update_seo_score();
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos') THEN
    DROP TRIGGER IF EXISTS update_seo_score_videos ON videos;
    CREATE TRIGGER update_seo_score_videos
      BEFORE INSERT OR UPDATE ON videos
      FOR EACH ROW EXECUTE FUNCTION trigger_update_seo_score();
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_packs') THEN
    DROP TRIGGER IF EXISTS update_seo_score_packs ON content_packs;
    CREATE TRIGGER update_seo_score_packs
      BEFORE INSERT OR UPDATE ON content_packs
      FOR EACH ROW EXECUTE FUNCTION trigger_update_seo_score();
  END IF;
END $$;
