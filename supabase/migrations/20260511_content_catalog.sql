-- ================================================================
-- CONTENT CATALOG — Guides, Fascicules, Podcasts, Videos
-- ================================================================

-- 1. GUIDES
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  prix INTEGER NOT NULL DEFAULT 1490,
  prix_barre INTEGER,
  file_url TEXT,
  drive_url TEXT,
  brand TEXT DEFAULT 'digital',
  gratuit BOOLEAN DEFAULT false,
  premium BOOLEAN DEFAULT true,
  cover_url TEXT,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_categorie ON guides(categorie);
CREATE INDEX IF NOT EXISTS idx_guides_active ON guides(active);

-- 2. FASCICULES
CREATE TABLE IF NOT EXISTS fascicules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  matiere TEXT NOT NULL,
  serie TEXT NOT NULL,
  chapitre INTEGER,
  description TEXT,
  prix INTEGER NOT NULL DEFAULT 990,
  prix_barre INTEGER,
  file_url TEXT,
  drive_url TEXT,
  audio_url TEXT,
  brand TEXT DEFAULT 'academy',
  gratuit BOOLEAN DEFAULT false,
  premium BOOLEAN DEFAULT true,
  cover_url TEXT,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fascicules_matiere ON fascicules(matiere);
CREATE INDEX IF NOT EXISTS idx_fascicules_serie ON fascicules(serie);
CREATE INDEX IF NOT EXISTS idx_fascicules_active ON fascicules(active);

-- 3. PODCASTS
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  serie TEXT NOT NULL,
  description TEXT,
  prix INTEGER NOT NULL DEFAULT 1900,
  audio_url TEXT,
  video_url TEXT,
  cover_url TEXT,
  premium BOOLEAN DEFAULT true,
  gratuit BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  lyrics TEXT,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_podcasts_serie ON podcasts(serie);
CREATE INDEX IF NOT EXISTS idx_podcasts_active ON podcasts(active);
CREATE INDEX IF NOT EXISTS idx_podcasts_featured ON podcasts(featured) WHERE featured = true;

-- 4. VIDEOS
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  prix INTEGER NOT NULL DEFAULT 1900,
  video_url TEXT NOT NULL,
  cover_url TEXT,
  premium BOOLEAN DEFAULT true,
  gratuit BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_categorie ON videos(categorie);
CREATE INDEX IF NOT EXISTS idx_videos_active ON videos(active);

-- 5. CONTENT PACKS (for grouping)
CREATE TABLE IF NOT EXISTS content_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  prix INTEGER NOT NULL,
  prix_barre INTEGER,
  type TEXT NOT NULL, -- digital | academy | podcast | video | mixed
  badge TEXT,
  highlight BOOLEAN DEFAULT false,
  contenu TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS Policies (public read, admin write)
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE fascicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS guides_public_select ON guides FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS guides_admin_all ON guides FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY IF NOT EXISTS fascicules_public_select ON fascicules FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS fascicules_admin_all ON fascicules FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY IF NOT EXISTS podcasts_public_select ON podcasts FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS podcasts_admin_all ON podcasts FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY IF NOT EXISTS videos_public_select ON videos FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS videos_admin_all ON videos FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

-- 7. SUMMARIES (Résumés audio)
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'Résumé Audio',
  description TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  premium BOOLEAN DEFAULT false,
  gratuit BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summaries_active ON summaries(active);

-- 8. FASCICULE AUDIOS
CREATE TABLE IF NOT EXISTS fascicule_audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  serie TEXT NOT NULL,
  matiere TEXT NOT NULL,
  chapitre INTEGER,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  premium BOOLEAN DEFAULT false,
  gratuit BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fascicule_audios_serie ON fascicule_audios(serie);
CREATE INDEX IF NOT EXISTS idx_fascicule_audios_active ON fascicule_audios(active);

-- RLS for summaries and fascicule_audios
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fascicule_audios ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS summaries_public_select ON summaries FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS summaries_admin_all ON summaries FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY IF NOT EXISTS fascicule_audios_public_select ON fascicule_audios FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS fascicule_audios_admin_all ON fascicule_audios FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY IF NOT EXISTS packs_public_select ON content_packs FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS packs_admin_all ON content_packs FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);
