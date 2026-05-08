ALTER TABLE membres ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 15;
ALTER TABLE membres ADD COLUMN IF NOT EXISTS credits_total_utilises INTEGER DEFAULT 0;
ALTER TABLE membres ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'gratuit';

UPDATE membres SET credits = 999999, plan = 'admin' WHERE email = 'ngomlaurentblog@gmail.com';

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit','credit','recharge','bonus','expiration')),
  montant INTEGER NOT NULL,
  solde_avant INTEGER NOT NULL,
  solde_apres INTEGER NOT NULL,
  description TEXT DEFAULT '',
  produit_id TEXT DEFAULT '',
  produit_type TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All credit_transactions" ON credit_transactions FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  credits INTEGER NOT NULL,
  prix INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  popular BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true
);

INSERT INTO credit_packs (id, nom, credits, prix, bonus_credits, popular) VALUES
  ('pack-50', 'Pack Starter', 50, 2500, 0, false),
  ('pack-100', 'Pack Standard', 100, 4500, 10, false),
  ('pack-200', 'Pack Pro', 200, 8000, 25, true),
  ('pack-500', 'Pack Business', 500, 17500, 75, false),
  ('pack-1000', 'Pack Elite', 1000, 30000, 200, false)
ON CONFLICT (id) DO UPDATE SET credits = EXCLUDED.credits, prix = EXCLUDED.prix;

SELECT 'Setup credits termine' as status;
