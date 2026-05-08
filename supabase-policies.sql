-- ═══════════════════════════════════════════════════════════
-- ABAWI PORTAL — RLS POLICIES GRANULAIRES
-- Exécuter dans Supabase Dashboard → SQL Editor
-- Ces policies remplacent les policies génériques du setup
-- ═══════════════════════════════════════════════════════════

-- ── MEMBRES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read membres" ON membres;
DROP POLICY IF EXISTS "Admin all membres" ON membres;
DROP POLICY IF EXISTS "membres_select" ON membres;
DROP POLICY IF EXISTS "membres_insert" ON membres;
DROP POLICY IF EXISTS "membres_update" ON membres;
DROP POLICY IF EXISTS "membres_delete" ON membres;

CREATE POLICY "membres_select" ON membres
  FOR SELECT USING (true);

CREATE POLICY "membres_insert" ON membres
  FOR INSERT WITH CHECK (true);

CREATE POLICY "membres_update" ON membres
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "membres_delete" ON membres
  FOR DELETE USING (true);

-- ── PAYMENTS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin all payments" ON payments;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (true);

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "payments_delete" ON payments
  FOR DELETE USING (true);

-- ── GUIDES ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read guides" ON guides;
DROP POLICY IF EXISTS "Admin all guides" ON guides;
DROP POLICY IF EXISTS "guides_select" ON guides;
DROP POLICY IF EXISTS "guides_insert" ON guides;
DROP POLICY IF EXISTS "guides_update" ON guides;
DROP POLICY IF EXISTS "guides_delete" ON guides;

CREATE POLICY "guides_select" ON guides
  FOR SELECT USING (actif = true);

CREATE POLICY "guides_insert" ON guides
  FOR INSERT WITH CHECK (true);

CREATE POLICY "guides_update" ON guides
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "guides_delete" ON guides
  FOR DELETE USING (true);

-- ── FASCICULES ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read fascicules" ON fascicules;
DROP POLICY IF EXISTS "Admin all fascicules" ON fascicules;
DROP POLICY IF EXISTS "fascicules_select" ON fascicules;
DROP POLICY IF EXISTS "fascicules_insert" ON fascicules;
DROP POLICY IF EXISTS "fascicules_update" ON fascicules;
DROP POLICY IF EXISTS "fascicules_delete" ON fascicules;

CREATE POLICY "fascicules_select" ON fascicules
  FOR SELECT USING (actif = true);

CREATE POLICY "fascicules_insert" ON fascicules
  FOR INSERT WITH CHECK (true);

CREATE POLICY "fascicules_update" ON fascicules
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "fascicules_delete" ON fascicules
  FOR DELETE USING (true);

-- ── PODCASTS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read podcasts" ON podcasts_db;
DROP POLICY IF EXISTS "Admin all podcasts" ON podcasts_db;
DROP POLICY IF EXISTS "podcasts_select" ON podcasts_db;
DROP POLICY IF EXISTS "podcasts_insert" ON podcasts_db;
DROP POLICY IF EXISTS "podcasts_update" ON podcasts_db;
DROP POLICY IF EXISTS "podcasts_delete" ON podcasts_db;

CREATE POLICY "podcasts_select" ON podcasts_db
  FOR SELECT USING (actif = true);

CREATE POLICY "podcasts_insert" ON podcasts_db
  FOR INSERT WITH CHECK (true);

CREATE POLICY "podcasts_update" ON podcasts_db
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "podcasts_delete" ON podcasts_db
  FOR DELETE USING (true);

-- ── STORE PRODUCTS ───────────────────────────────────────────
DROP POLICY IF EXISTS "Public read store" ON store_products;
DROP POLICY IF EXISTS "Admin all store" ON store_products;
DROP POLICY IF EXISTS "store_select" ON store_products;
DROP POLICY IF EXISTS "store_insert" ON store_products;
DROP POLICY IF EXISTS "store_update" ON store_products;
DROP POLICY IF EXISTS "store_delete" ON store_products;

CREATE POLICY "store_select" ON store_products
  FOR SELECT USING (actif = true);

CREATE POLICY "store_insert" ON store_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "store_update" ON store_products
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "store_delete" ON store_products
  FOR DELETE USING (true);

-- ── NEWS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read news" ON news;
DROP POLICY IF EXISTS "Admin all news" ON news;
DROP POLICY IF EXISTS "news_select" ON news;
DROP POLICY IF EXISTS "news_insert" ON news;
DROP POLICY IF EXISTS "news_update" ON news;
DROP POLICY IF EXISTS "news_delete" ON news;

CREATE POLICY "news_select" ON news
  FOR SELECT USING (statut = 'publié');

CREATE POLICY "news_insert" ON news
  FOR INSERT WITH CHECK (true);

CREATE POLICY "news_update" ON news
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "news_delete" ON news
  FOR DELETE USING (true);

-- ── USER DOCUMENTS ───────────────────────────────────────────
DROP POLICY IF EXISTS "User read own" ON user_documents;
DROP POLICY IF EXISTS "Admin all user_documents" ON user_documents;
DROP POLICY IF EXISTS "user_docs_select" ON user_documents;
DROP POLICY IF EXISTS "user_docs_insert" ON user_documents;
DROP POLICY IF EXISTS "user_docs_update" ON user_documents;
DROP POLICY IF EXISTS "user_docs_delete" ON user_documents;

CREATE POLICY "user_docs_select" ON user_documents
  FOR SELECT USING (true);

CREATE POLICY "user_docs_insert" ON user_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "user_docs_update" ON user_documents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "user_docs_delete" ON user_documents
  FOR DELETE USING (true);

-- ── SITE CONTENT ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read content" ON site_content;
DROP POLICY IF EXISTS "Admin write content" ON site_content;
DROP POLICY IF EXISTS "content_select" ON site_content;
DROP POLICY IF EXISTS "content_insert" ON site_content;
DROP POLICY IF EXISTS "content_update" ON site_content;
DROP POLICY IF EXISTS "content_delete" ON site_content;

CREATE POLICY "content_select" ON site_content
  FOR SELECT USING (true);

CREATE POLICY "content_insert" ON site_content
  FOR INSERT WITH CHECK (true);

CREATE POLICY "content_update" ON site_content
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "content_delete" ON site_content
  FOR DELETE USING (true);

-- ── VÉRIFICATION ─────────────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
