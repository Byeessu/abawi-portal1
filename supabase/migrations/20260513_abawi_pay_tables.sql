-- ================================================================
-- ABAWI PAY — Tables de paiement, wallet, transactions, épargne
-- Style défensif : idempotent, réexécutable sans erreur
-- ================================================================

-- ── WALLETS (solde utilisateur) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;
CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
CREATE POLICY "wallets_insert_own" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── TRANSACTIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL,
  amount BIGINT NOT NULL,
  fee BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  description TEXT,
  reference VARCHAR(100) UNIQUE,
  recipient_phone VARCHAR(20),
  recipient_name VARCHAR(100),
  network VARCHAR(30),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type, created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── SAVINGS GOALS (épargne) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Mon épargne',
  target_amount BIGINT NOT NULL DEFAULT 100000,
  current_amount BIGINT NOT NULL DEFAULT 0,
  mode VARCHAR(30) DEFAULT 'round_500',
  lock_period VARCHAR(20) DEFAULT 'none',
  interest_rate DECIMAL(5,2) DEFAULT 3.5,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_user ON public.savings_goals(user_id, status);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_select_own" ON public.savings_goals;
CREATE POLICY "savings_select_own" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_insert_own" ON public.savings_goals;
CREATE POLICY "savings_insert_own" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_update_own" ON public.savings_goals;
CREATE POLICY "savings_update_own" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);


-- ── QR PAYMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token VARCHAR(20) NOT NULL UNIQUE,
  amount BIGINT,
  currency VARCHAR(3) DEFAULT 'XOF',
  payload TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_user ON public.qr_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_qr_token ON public.qr_payments(token);

ALTER TABLE public.qr_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_select_own" ON public.qr_payments;
CREATE POLICY "qr_select_own" ON public.qr_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "qr_insert_own" ON public.qr_payments;
CREATE POLICY "qr_insert_own" ON public.qr_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── SECRET CODES (codes secrets) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.secret_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  amount BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  status VARCHAR(20) DEFAULT 'active',
  duration_minutes INT DEFAULT 5,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_codes_user ON public.secret_codes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_codes_code ON public.secret_codes(code);

ALTER TABLE public.secret_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "codes_select_own" ON public.secret_codes;
CREATE POLICY "codes_select_own" ON public.secret_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "codes_insert_own" ON public.secret_codes;
CREATE POLICY "codes_insert_own" ON public.secret_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── FONCTION : updated_at trigger ─────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables pay
DROP TRIGGER IF EXISTS trg_wallets_updated ON public.wallets;
CREATE TRIGGER trg_wallets_updated
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated ON public.transactions;
CREATE TRIGGER trg_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_savings_updated ON public.savings_goals;
CREATE TRIGGER trg_savings_updated
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── FONCTION : wallet balance non négative ────────────────────
CREATE OR REPLACE FUNCTION public.check_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance < 0 THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wallet_balance ON public.wallets;
CREATE TRIGGER trg_wallet_balance
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.check_wallet_balance();


-- ── FONCTION : cleanup expired QR & codes ─────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_pay_ephemeral()
RETURNS void AS $$
BEGIN
  DELETE FROM public.qr_payments WHERE expires_at < NOW() AND status = 'active';
  DELETE FROM public.secret_codes WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── VUE : résumé transactions par utilisateur ───────────────
CREATE OR REPLACE VIEW public.user_transaction_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  SUM(amount) FILTER (WHERE type = 'receive' AND status = 'completed') as total_received,
  SUM(amount) FILTER (WHERE type = 'send' AND status = 'completed') as total_sent,
  SUM(fee) FILTER (WHERE status = 'completed') as total_fees,
  MAX(created_at) as last_transaction_at
FROM public.transactions
GROUP BY user_id;
