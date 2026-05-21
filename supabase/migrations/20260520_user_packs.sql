-- Table: user_packs — packs achetés par un utilisateur
CREATE TABLE IF NOT EXISTS public.user_packs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id     text NOT NULL,           -- ex: 'digital-pack-pro'
  pack_type   text NOT NULL DEFAULT 'digital', -- 'digital' | 'academy'
  pack_name   text NOT NULL,
  status      text NOT NULL DEFAULT 'active',  -- 'active' | 'expired' | 'cancelled'
  product_ids jsonb DEFAULT '[]',      -- liste des IDs produits inclus
  expires_at  timestamptz,             -- NULL = achat permanent
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_packs_user    ON public.user_packs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_packs_pack    ON public.user_packs(pack_id, pack_type);

ALTER TABLE public.user_packs ENABLE ROW LEVEL SECURITY;

-- Utilisateur voit SES packs
DROP POLICY IF EXISTS "user_packs_select_own" ON public.user_packs;
CREATE POLICY "user_packs_select_own" ON public.user_packs
  FOR SELECT USING (auth.uid() = user_id);

-- Utilisateur peut insérer SES packs (via Merci.jsx / PaymentFlow)
DROP POLICY IF EXISTS "user_packs_insert_own" ON public.user_packs;
CREATE POLICY "user_packs_insert_own" ON public.user_packs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin voit tout
DROP POLICY IF EXISTS "user_packs_admin_all" ON public.user_packs;
CREATE POLICY "user_packs_admin_all" ON public.user_packs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.membres WHERE id = auth.uid() AND role = 'admin'
    )
  );
