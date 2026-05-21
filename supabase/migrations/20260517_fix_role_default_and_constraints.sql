-- Sécurisation : corriger les défauts et contraintes pour éviter
-- qu'un compte devienne automatiquement admin.

-- 1. S'assurer que role vaut 'membre' par défaut
ALTER TABLE public.membres
  ALTER COLUMN role SET DEFAULT 'membre';

-- 2. S'assurer que statut vaut 'actif' par défaut (pour les inscriptions libres)
ALTER TABLE public.membres
  ALTER COLUMN statut SET DEFAULT 'actif';

-- 3. S'assurer que plan_type vaut 'gratuit' par défaut
DO $$
BEGIN
  ALTER TABLE public.membres ALTER COLUMN plan_type SET DEFAULT 'gratuit';
EXCEPTION WHEN undefined_column THEN
  -- plan_type n'existe pas, on ne fait rien
END $$;

DO $$
BEGIN
  ALTER TABLE public.membres ALTER COLUMN plan SET DEFAULT 'gratuit';
EXCEPTION WHEN undefined_column THEN
  -- plan n'existe pas, on ne fait rien
END $$;

-- 4. Contrainte UNIQUE sur email (empêche les doublons et les upserts foireux)
DO $$
BEGIN
  ALTER TABLE public.membres ADD CONSTRAINT membres_email_unique UNIQUE (email);
EXCEPTION WHEN duplicate_table OR unique_violation OR duplicate_object THEN
  -- La contrainte existe déjà
END $$;

-- 5. CHECK sur role (seules valeurs autorisées : 'membre' ou 'admin')
DO $$
BEGIN
  ALTER TABLE public.membres ADD CONSTRAINT membres_role_check CHECK (role IN ('membre', 'admin'));
EXCEPTION WHEN duplicate_table OR check_violation OR duplicate_object THEN
  -- La contrainte existe déjà
END $$;

-- 6. Index sur email pour performance des recherches de login
CREATE INDEX IF NOT EXISTS idx_membres_email ON public.membres(email);
CREATE INDEX IF NOT EXISTS idx_membres_telephone ON public.membres(telephone);
