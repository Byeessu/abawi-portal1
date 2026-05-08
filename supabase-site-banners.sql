-- ═════════════════════════════════════════════════════════════
-- ABAWI - Site Banners SQL (table + index + RLS + policies)
-- Exécuter dans Supabase SQL Editor
-- Script idempotent (safe à relancer)
-- ═════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1) Helper admin (si absent)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_abawi_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.membres m
    WHERE lower(coalesce(m.email, '')) = lower(coalesce(auth.email(), ''))
      AND (
        lower(coalesce(m.role, '')) = 'admin'
        OR lower(coalesce(m.plan_type, '')) = 'admin'
        OR lower(coalesce(m.plan, '')) = 'admin'
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_abawi_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_abawi_admin() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2) Table bannières site
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'top' CHECK (type IN ('top', 'promo', 'install', 'info')),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optionnel: harmoniser site_slider si colonnes manquantes
ALTER TABLE IF EXISTS public.site_slider
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 3) Indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_site_banners_type ON public.site_banners(type);
CREATE INDEX IF NOT EXISTS idx_site_banners_active ON public.site_banners(active);
CREATE INDEX IF NOT EXISTS idx_site_banners_priority ON public.site_banners(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_banners_starts_at ON public.site_banners(starts_at);
CREATE INDEX IF NOT EXISTS idx_site_banners_ends_at ON public.site_banners(ends_at);

-- ─────────────────────────────────────────────────────────────
-- 4) Trigger updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_site_banners_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_site_banners_set_updated_at
    BEFORE UPDATE ON public.site_banners
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_slider')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_site_slider_set_updated_at')
  THEN
    CREATE TRIGGER trg_site_slider_set_updated_at
    BEFORE UPDATE ON public.site_slider
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5) RLS + policies (site_banners)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_banners_public_read_active ON public.site_banners;
DROP POLICY IF EXISTS site_banners_admin_select_all ON public.site_banners;
DROP POLICY IF EXISTS site_banners_admin_insert ON public.site_banners;
DROP POLICY IF EXISTS site_banners_admin_update ON public.site_banners;
DROP POLICY IF EXISTS site_banners_admin_delete ON public.site_banners;

-- Lecture publique pour affichage front
CREATE POLICY site_banners_public_read_active
ON public.site_banners
FOR SELECT
TO anon, authenticated
USING (
  active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

-- Admin: contrôle total
CREATE POLICY site_banners_admin_select_all
ON public.site_banners
FOR SELECT
TO authenticated
USING (public.is_abawi_admin());

CREATE POLICY site_banners_admin_insert
ON public.site_banners
FOR INSERT
TO authenticated
WITH CHECK (public.is_abawi_admin());

CREATE POLICY site_banners_admin_update
ON public.site_banners
FOR UPDATE
TO authenticated
USING (public.is_abawi_admin())
WITH CHECK (public.is_abawi_admin());

CREATE POLICY site_banners_admin_delete
ON public.site_banners
FOR DELETE
TO authenticated
USING (public.is_abawi_admin());

-- ─────────────────────────────────────────────────────────────
-- 6) RLS/policies complémentaires (site_slider) pour admin
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'site_slider'
  ) THEN
    EXECUTE 'ALTER TABLE public.site_slider ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS site_slider_admin_select_all ON public.site_slider';
    EXECUTE 'DROP POLICY IF EXISTS site_slider_admin_insert ON public.site_slider';
    EXECUTE 'DROP POLICY IF EXISTS site_slider_admin_update ON public.site_slider';
    EXECUTE 'DROP POLICY IF EXISTS site_slider_admin_delete ON public.site_slider';

    EXECUTE 'CREATE POLICY site_slider_admin_select_all ON public.site_slider FOR SELECT TO authenticated USING (public.is_abawi_admin())';
    EXECUTE 'CREATE POLICY site_slider_admin_insert ON public.site_slider FOR INSERT TO authenticated WITH CHECK (public.is_abawi_admin())';
    EXECUTE 'CREATE POLICY site_slider_admin_update ON public.site_slider FOR UPDATE TO authenticated USING (public.is_abawi_admin()) WITH CHECK (public.is_abawi_admin())';
    EXECUTE 'CREATE POLICY site_slider_admin_delete ON public.site_slider FOR DELETE TO authenticated USING (public.is_abawi_admin())';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7) Seed optionnel (si table vide)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.site_banners (type, title, content, link, active, priority)
SELECT 'top', 'Bienvenue sur ABAWI', 'Plateforme d''outils IA et business premium', '/outils', true, 100
WHERE NOT EXISTS (SELECT 1 FROM public.site_banners);

-- ═════════════════════════════════════════════════════════════
-- FIN
-- ═════════════════════════════════════════════════════════════
