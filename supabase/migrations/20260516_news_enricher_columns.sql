-- Ajout colonnes pour le News Enricher Bot
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS enriched BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

-- Index pour performance du bot
CREATE INDEX IF NOT EXISTS idx_articles_enriched ON public.articles(enriched) WHERE pr = true;
CREATE INDEX IF NOT EXISTS idx_articles_enriched_at ON public.articles(enriched_at DESC);
