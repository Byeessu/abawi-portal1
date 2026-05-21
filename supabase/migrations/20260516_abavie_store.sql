-- ═══════════════════════════════════════════════════════════
-- ABAWI BOUTIQUE ABAVIE — Tables produits santé + fournisseurs
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── FOURNISSEURS (confidentiel admin) ──────────────────────
CREATE TABLE IF NOT EXISTS abavie_suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL DEFAULT '',
  contact_nom TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  ville TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE abavie_suppliers IS 'Fournisseurs de matériel médical — visible uniquement par admin';

-- ── PRODUITS ABAVIE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS abavie_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL DEFAULT '',
  categorie TEXT DEFAULT 'MATERIEL LEGER' CHECK (categorie IN (
    'TENUE MEDICALE','MATERIEL LEGER','MATERIEL SEMI-LOURD',
    'MATERIEL LOURD','CONSOMMABLE','MOBILIER'
  )),
  description TEXT DEFAULT '',
  description_courte TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  prix_original INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  specs TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 1,
  featured BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  marque TEXT DEFAULT '',
  garantie TEXT DEFAULT '12 mois',
  -- SEO
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  keywords TEXT DEFAULT '',
  -- Fournisseur (confidentiel admin)
  supplier_id UUID REFERENCES abavie_suppliers(id) ON DELETE SET NULL,
  supplier_link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE abavie_products IS 'Produits boutique Abavie (santé) — fournisseurs masqués pour le client';

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_abavie_products_cat ON abavie_products(categorie);
CREATE INDEX IF NOT EXISTS idx_abavie_products_actif ON abavie_products(actif);
CREATE INDEX IF NOT EXISTS idx_abavie_products_featured ON abavie_products(featured);
CREATE INDEX IF NOT EXISTS idx_abavie_suppliers_ville ON abavie_suppliers(ville);
CREATE INDEX IF NOT EXISTS idx_abavie_suppliers_verified ON abavie_suppliers(verified);

-- ── RLS : produits publics en lecture ─────────────────────
ALTER TABLE abavie_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE abavie_suppliers ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les produits actifs
-- Supprime d'abord les policies existantes pour éviter les doublons
DROP POLICY IF EXISTS abavie_products_read_public ON abavie_products;
DROP POLICY IF EXISTS abavie_products_admin_all ON abavie_products;
DROP POLICY IF EXISTS abavie_suppliers_admin_only ON abavie_suppliers;

-- Tout le monde peut lire les produits actifs
CREATE POLICY abavie_products_read_public
  ON abavie_products FOR SELECT
  USING (actif = true);

-- Seul l'admin peut tout faire sur les produits
CREATE POLICY abavie_products_admin_all
  ON abavie_products FOR ALL
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM membres WHERE id = auth.uid() AND role = 'admin'
  ));

-- Fournisseurs : admin uniquement (aucun accès public)
CREATE POLICY abavie_suppliers_admin_only
  ON abavie_suppliers FOR ALL
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM membres WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── TRIGGER updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_abavie_products ON abavie_products;
CREATE TRIGGER set_timestamp_abavie_products
  BEFORE UPDATE ON abavie_products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_abavie_suppliers ON abavie_suppliers;
CREATE TRIGGER set_timestamp_abavie_suppliers
  BEFORE UPDATE ON abavie_suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
