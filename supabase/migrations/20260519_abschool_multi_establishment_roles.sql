-- =====================================================================
-- Abschool Multi-Establishment Role System
-- Each establishment gets a pass code. Users join with role:
--   admin, enseignant, eleve, parent, tuteur
-- =====================================================================

-- 1. Add pass_code to existing etablissements table
ALTER TABLE IF EXISTS public.abschool_etablissements
ADD COLUMN IF NOT EXISTS pass_code text UNIQUE,
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS site_web text,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Generate pass codes for existing establishments
UPDATE public.abschool_etablissements
SET pass_code = UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8))
WHERE pass_code IS NULL;

-- 2. Table linking users to establishments with roles
CREATE TABLE IF NOT EXISTS public.abschool_user_roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('admin','enseignant','eleve','parent','tuteur')),
  -- For eleve/parent: link to the specific student record
  eleve_id      uuid REFERENCES public.abschool_eleves(id) ON DELETE SET NULL,
  -- Pass code used to join (audit trail)
  joined_via    text,
  -- Active status for this role
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  -- One user can only have one role per establishment
  UNIQUE(user_id, etablissement_id, role)
);

-- 3. Table for establishment-specific announcements / campus info
CREATE TABLE IF NOT EXISTS public.abschool_annonces (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id  uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  titre             text NOT NULL,
  contenu           text,
  type              text DEFAULT 'general' CHECK (type IN ('general','urgent','event','note','scolarite')),
  pinned            boolean DEFAULT false,
  visible_to_roles  text[] DEFAULT ARRAY['admin','enseignant','eleve','parent','tuteur'],
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now(),
  expires_at        timestamptz
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_abschool_user_roles_user ON public.abschool_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_abschool_user_roles_etab ON public.abschool_user_roles(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_abschool_user_roles_active ON public.abschool_user_roles(active);
CREATE INDEX IF NOT EXISTS idx_abschool_annonces_etab ON public.abschool_annonces(etablissement_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.abschool_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_annonces ENABLE ROW LEVEL SECURITY;

-- Policies for abschool_user_roles
CREATE POLICY "Users see their own roles"
  ON public.abschool_user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles in their establishment"
  ON public.abschool_user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.abschool_user_roles r
      WHERE r.user_id = auth.uid()
        AND r.etablissement_id = abschool_user_roles.etablissement_id
        AND r.role = 'admin'
        AND r.active = true
    )
  );

-- Policies for abschool_annonces
CREATE POLICY "Users see visible announcements"
  ON public.abschool_annonces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.abschool_user_roles r
      WHERE r.user_id = auth.uid()
        AND r.etablissement_id = abschool_annonces.etablissement_id
        AND r.active = true
        AND (abschool_annonces.visible_to_roles @> ARRAY[r.role]
             OR abschool_annonces.visible_to_roles @> ARRAY['all'])
    )
  );

CREATE POLICY "Admins manage announcements"
  ON public.abschool_annonces FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.abschool_user_roles r
      WHERE r.user_id = auth.uid()
        AND r.etablissement_id = abschool_annonces.etablissement_id
        AND r.role = 'admin'
        AND r.active = true
    )
  );

-- 6. Helper function: generate unique pass code
CREATE OR REPLACE FUNCTION public.generate_school_pass_code()
RETURNS text AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.abschool_etablissements WHERE pass_code = code)
    INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Helper function: join establishment with pass code
CREATE OR REPLACE FUNCTION public.join_establishment(
  p_pass_code text,
  p_role text DEFAULT 'eleve',
  p_eleve_id uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_etab_id uuid;
  v_existing uuid;
BEGIN
  -- Find establishment by pass code
  SELECT id INTO v_etab_id
  FROM public.abschool_etablissements
  WHERE pass_code = p_pass_code AND active = true;

  IF v_etab_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Code invalide ou établissement inactif');
  END IF;

  -- Check if already joined
  SELECT id INTO v_existing
  FROM public.abschool_user_roles
  WHERE user_id = auth.uid() AND etablissement_id = v_etab_id;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Vous êtes déjà membre de cet établissement');
  END IF;

  -- Insert role
  INSERT INTO public.abschool_user_roles (user_id, etablissement_id, role, eleve_id, joined_via)
  VALUES (auth.uid(), v_etab_id, p_role, p_eleve_id, p_pass_code);

  RETURN json_build_object('success', true, 'etablissement_id', v_etab_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: auto-generate pass_code on insert if not provided
CREATE OR REPLACE FUNCTION public.auto_pass_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.pass_code IS NULL THEN
    NEW.pass_code := public.generate_school_pass_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_pass_code ON public.abschool_etablissements;
CREATE TRIGGER trg_auto_pass_code
  BEFORE INSERT ON public.abschool_etablissements
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_pass_code();

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abschool_user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abschool_annonces TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_school_pass_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_establishment TO authenticated;
