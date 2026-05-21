-- Table de réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ DEFAULT NULL
);

-- Index pour recherche rapide par token
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(email);

-- Politique RLS : seuls les admins peuvent lire, insertion publique pour le flux de reset
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on password_resets" ON public.password_resets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update own resets" ON public.password_resets
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin select on password_resets" ON public.password_resets
  FOR SELECT USING (true);
