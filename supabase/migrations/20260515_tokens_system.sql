-- Migration : Système de tokens (1 crédit = 1000 tokens)
-- Ajoute les colonnes tokens aux membres et enrichit credit_transactions

-- 1. Colonnes tokens sur membres
ALTER TABLE public.membres
  ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_total_utilises INTEGER DEFAULT 0;

-- 2. Index rapide
CREATE INDEX IF NOT EXISTS idx_membres_tokens ON public.membres(tokens);

-- 3. Colonne tokens_montant sur credit_transactions pour tracer les dépenses en tokens
ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS tokens_montant INTEGER DEFAULT 0;

-- 4. Vue temps réel solde tokens par membre
CREATE OR REPLACE VIEW public.membre_token_balance AS
SELECT
  id,
  email,
  credits,
  tokens,
  tokens_total_utilises,
  COALESCE(tokens, 0) + COALESCE(credits, 0) * 1000 AS total_tokens_disponibles,
  role,
  plan,
  statut,
  date_fin
FROM public.membres;

-- 5. Fonction pour convertir crédits en tokens (1 crédit = 1000 tokens)
CREATE OR REPLACE FUNCTION public.convert_credits_to_tokens(p_email TEXT, p_credits INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_membre RECORD;
  v_new_tokens INTEGER;
BEGIN
  SELECT credits, tokens INTO v_membre FROM public.membres WHERE email = p_email;
  IF NOT FOUND THEN RETURN -1; END IF;
  IF v_membre.credits < p_credits THEN RETURN -2; END IF; -- crédits insuffisants

  v_new_tokens := COALESCE(v_membre.tokens, 0) + p_credits * 1000;

  UPDATE public.membres
  SET credits = credits - p_credits,
      tokens = v_new_tokens
  WHERE email = p_email;

  RETURN v_new_tokens;
END;
$$;

-- 6. Trigger : synchroniser tokens quand credits change (ajout de crédits)
CREATE OR REPLACE FUNCTION public.sync_tokens_on_credit_add()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si des crédits sont ajoutés, on convertit automatiquement en tokens
  IF NEW.credits > OLD.credits THEN
    NEW.tokens := COALESCE(NEW.tokens, 0) + (NEW.credits - OLD.credits) * 1000;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tokens_credit_add ON public.membres;
CREATE TRIGGER trg_sync_tokens_credit_add
  BEFORE UPDATE ON public.membres
  FOR EACH ROW
  WHEN (NEW.credits > OLD.credits)
  EXECUTE FUNCTION public.sync_tokens_on_credit_add();

-- 7. Politique RLS sur la vue
ALTER VIEW public.membre_token_balance OWNER TO postgres;
