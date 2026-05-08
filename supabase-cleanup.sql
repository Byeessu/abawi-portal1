-- ============================================================
-- ABAWI PORTAL — CLEANUP SQL
-- 1. Supprimer les résumés audio existants (audio_url sur guides/fascicules)
-- 2. Supprimer les podcasts indésirables (voir supabase-delete-podcasts.sql)
-- ============================================================

-- 1A. Clear audio summaries on guides
UPDATE guides
SET audio_url = NULL
WHERE audio_url IS NOT NULL AND audio_url != '';

-- 1B. Clear audio summaries on fascicules
UPDATE fascicules
SET audio_url = NULL
WHERE audio_url IS NOT NULL AND audio_url != '';

-- 1C. Verify
SELECT 'guides with audio' as label, COUNT(*) FROM guides WHERE audio_url IS NOT NULL
UNION ALL
SELECT 'fascicules with audio', COUNT(*) FROM fascicules WHERE audio_url IS NOT NULL;

-- 2. Delete unwanted podcasts (also in supabase-delete-podcasts.sql)
DELETE FROM podcasts_db WHERE
  titre ILIKE '%3 millions%' OR
  titre ILIKE '%Abiogreen%' OR
  titre ILIKE '%Arkel%' OR
  titre ILIKE '%inclusion numérique%';

SELECT COUNT(*) as podcasts_restants FROM podcasts_db;
