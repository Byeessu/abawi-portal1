DELETE FROM podcasts_db WHERE
  titre ILIKE '%3 millions%' OR
  titre ILIKE '%Abiogreen%' OR
  titre ILIKE '%Arkel%' OR
  titre ILIKE '%inclusion numérique%';
SELECT COUNT(*) as podcasts_restants FROM podcasts_db;
