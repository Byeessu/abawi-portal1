-- ── AbSchool — Gestion Scolaire Complète ─────────────────────────────────
-- Tables pour la gestion d'établissements scolaires (primaire, collège,
-- lycée, université) avec élèves, enseignants, classes, notes, présences,
-- scolarité, bulletins et parents.
-- ───────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Établissements ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_etablissements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           text NOT NULL,
  type          text NOT NULL CHECK (type IN ('maternelle', 'primaire', 'college', 'lycee', 'universite', 'formation', 'autre')),
  adresse       text,
  ville         text DEFAULT 'Dakar',
  telephone     text,
  email         text,
  logo_url      text,
  directeur_nom text,
  directeur_tel text,
  annee_scolaire text NOT NULL DEFAULT '2025-2026',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── 2. Classes / Sections ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_classes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  nom             text NOT NULL,
  niveau          text NOT NULL,
  section         text,
  capacite        int DEFAULT 40,
  salle           text,
  emploi_temps    jsonb DEFAULT '[]',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── 3. Matières ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_matieres (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  nom           text NOT NULL,
  code          text,
  coefficient   int DEFAULT 1,
  couleur       text DEFAULT '#3B82F6',
  created_at    timestamptz DEFAULT now()
);

-- ── 4. Enseignants / Professeurs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_enseignants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  prenom          text NOT NULL,
  nom             text NOT NULL,
  email           text,
  telephone       text,
  specialite      text,
  matiere_ids     uuid[] DEFAULT '{}',
  photo_url       text,
  salaire_mensuel int,
  date_embauche   date,
  statut          text DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'conge')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── 5. Élèves / Étudiants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_eleves (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  classe_id       uuid REFERENCES public.abschool_classes(id) ON DELETE SET NULL,
  prenom          text NOT NULL,
  nom             text NOT NULL,
  date_naissance  date,
  lieu_naissance  text,
  sexe            text CHECK (sexe IN ('M', 'F')),
  matricule       text,
  email           text,
  telephone       text,
  adresse         text,
  photo_url       text,
  parent_nom      text,
  parent_email    text,
  parent_telephone text,
  parent2_nom     text,
  parent2_telephone text,
  frais_scolarite int DEFAULT 0,
  bourse          boolean DEFAULT false,
  statut          text DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'exclu', 'diplome')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_abschool_eleves_matricule
  ON public.abschool_eleves(etablissement_id, matricule)
  WHERE matricule IS NOT NULL;

-- ── 6. Notes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  matiere_id    uuid REFERENCES public.abschool_matieres(id) ON DELETE CASCADE,
  enseignant_id uuid REFERENCES public.abschool_enseignants(id) ON DELETE SET NULL,
  type          text NOT NULL DEFAULT 'devoir' CHECK (type IN ('devoir', 'interro', 'participation', 'examen', 'rattrapage')),
  titre         text,
  note          numeric(4,2) NOT NULL CHECK (note >= 0 AND note <= 20),
  coeff         int DEFAULT 1,
  trimestre     int NOT NULL DEFAULT 1 CHECK (trimestre IN (1,2,3)),
  annee         text NOT NULL DEFAULT '2025-2026',
  commentaire   text,
  created_at    timestamptz DEFAULT now()
);

-- ── 7. Présences ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_presences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  classe_id     uuid REFERENCES public.abschool_classes(id) ON DELETE CASCADE,
  date          date NOT NULL,
  statut        text NOT NULL CHECK (statut IN ('present', 'absent', 'retard', 'justifie')),
  motif         text,
  heure_entree  time,
  heure_sortie  time,
  created_at    timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_abschool_presences_unique
  ON public.abschool_presences(eleve_id, date);

-- ── 8. Paiements Scolarité ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_paiements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  montant       int NOT NULL,
  type          text NOT NULL DEFAULT 'scolarite' CHECK (type IN ('scolarite', 'inscription', 'cantine', 'transport', 'examen', 'autre')),
  mois          text,
  trimestre     int,
  methode       text DEFAULT 'especes' CHECK (methode IN ('especes', 'wave', 'orange_money', 'free_money', 'virement', 'cheque')),
  reference     text,
  statut        text DEFAULT 'paye' CHECK (statut IN ('paye', 'en_attente', 'annule')),
  date_paiement date DEFAULT CURRENT_DATE,
  created_at    timestamptz DEFAULT now()
);

-- ── 9. Bulletins (synthèse trimestrielle) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_bulletins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id      uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  trimestre     int NOT NULL CHECK (trimestre IN (1,2,3)),
  annee         text NOT NULL DEFAULT '2025-2026',
  moyenne       numeric(4,2),
  rang          int,
  appreciation  text,
  decision      text DEFAULT 'en_cours' CHECK (decision IN ('en_cours', 'passe', 'redouble', 'exclu')),
  details       jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_abschool_bulletins_unique
  ON public.abschool_bulletins(eleve_id, trimestre, annee);

-- ── 10. Indexs de performance ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_abschool_eleves_classe ON public.abschool_eleves(classe_id);
CREATE INDEX IF NOT EXISTS idx_abschool_eleves_etab ON public.abschool_eleves(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_abschool_notes_eleve ON public.abschool_notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_abschool_notes_matiere ON public.abschool_notes(matiere_id);
CREATE INDEX IF NOT EXISTS idx_abschool_notes_trimestre ON public.abschool_notes(trimestre, annee);
CREATE INDEX IF NOT EXISTS idx_abschool_presences_date ON public.abschool_presences(date);
CREATE INDEX IF NOT EXISTS idx_abschool_paiements_eleve ON public.abschool_paiements(eleve_id);
CREATE INDEX IF NOT EXISTS idx_abschool_classes_etab ON public.abschool_classes(etablissement_id);

-- ── 11. Triggers updated_at ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.abschool_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_abschool_etab_updated') THEN
    CREATE TRIGGER trg_abschool_etab_updated BEFORE UPDATE ON public.abschool_etablissements
      FOR EACH ROW EXECUTE FUNCTION public.abschool_set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_abschool_classes_updated') THEN
    CREATE TRIGGER trg_abschool_classes_updated BEFORE UPDATE ON public.abschool_classes
      FOR EACH ROW EXECUTE FUNCTION public.abschool_set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_abschool_eleves_updated') THEN
    CREATE TRIGGER trg_abschool_eleves_updated BEFORE UPDATE ON public.abschool_eleves
      FOR EACH ROW EXECUTE FUNCTION public.abschool_set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_abschool_enseignants_updated') THEN
    CREATE TRIGGER trg_abschool_enseignants_updated BEFORE UPDATE ON public.abschool_enseignants
      FOR EACH ROW EXECUTE FUNCTION public.abschool_set_updated_at();
  END IF;
END $$;

-- ── 12. RLS (désactivé par défaut, politiques souples) ───────────────────
ALTER TABLE public.abschool_etablissements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_matieres          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_enseignants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_eleves            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_presences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_paiements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_bulletins         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abschool_all" ON public.abschool_etablissements;
CREATE POLICY "abschool_all" ON public.abschool_etablissements FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_classes;
CREATE POLICY "abschool_all" ON public.abschool_classes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_matieres;
CREATE POLICY "abschool_all" ON public.abschool_matieres FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_enseignants;
CREATE POLICY "abschool_all" ON public.abschool_enseignants FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_eleves;
CREATE POLICY "abschool_all" ON public.abschool_eleves FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_notes;
CREATE POLICY "abschool_all" ON public.abschool_notes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_presences;
CREATE POLICY "abschool_all" ON public.abschool_presences FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_paiements;
CREATE POLICY "abschool_all" ON public.abschool_paiements FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_bulletins;
CREATE POLICY "abschool_all" ON public.abschool_bulletins FOR ALL USING (true) WITH CHECK (true);

-- ── 13. Sanctions / Avertissements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_sanctions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  eleve_id        uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('avertissement','blame','exclusion','suspension')),
  motif           text NOT NULL,
  date            date NOT NULL,
  decideur        text,
  created_at      timestamptz DEFAULT now()
);

-- ── 14. Reçus de paiement ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_recus (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  paiement_id     uuid REFERENCES public.abschool_paiements(id) ON DELETE CASCADE,
  eleve_id        uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  reference       text NOT NULL,
  montant         int NOT NULL,
  libelle         text,
  date_recu       timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- ── 15. Contrats ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_contrats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('enseignant','eleve','partenaire')),
  nom             text NOT NULL,
  contenu         text,
  lien_id         text,
  date_debut      date,
  date_fin        date,
  statut          text DEFAULT 'actif' CHECK (statut IN ('actif','resilie','termine')),
  created_at      timestamptz DEFAULT now()
);

-- ── 16. Justificatifs d'absence ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_justificatifs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  eleve_id        uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('absence','retard','maladie','familial')),
  date_debut      date NOT NULL,
  date_fin        date,
  motif           text NOT NULL,
  statut          text DEFAULT 'en_attente' CHECK (statut IN ('en_attente','approuve','refuse')),
  created_at      timestamptz DEFAULT now()
);

-- ── 17. Documents élève ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_documents_eleve (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  eleve_id        uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('bulletin','certificat','photo','piece_identite','extrait_naissance','autre')),
  nom             text NOT NULL,
  url             text,
  date            date,
  created_at      timestamptz DEFAULT now()
);

-- ── 18. Partenaires ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_partenaires (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  nom             text NOT NULL,
  type            text NOT NULL CHECK (type IN ('sponsor','fournisseur','institution','association','autre')),
  contact         text,
  telephone       text,
  email           text,
  statut          text DEFAULT 'actif' CHECK (statut IN ('actif','inactif')),
  created_at      timestamptz DEFAULT now()
);

-- ── 19. Personnel administratif ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_personnel (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  prenom          text NOT NULL,
  nom             text NOT NULL,
  poste           text NOT NULL,
  telephone       text,
  email           text,
  salaire_mensuel int,
  statut          text DEFAULT 'actif' CHECK (statut IN ('actif','conge','licencie')),
  created_at      timestamptz DEFAULT now()
);

-- ── 20. Notes / Observations sur les élèves ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_notes_eleve (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  eleve_id        uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  auteur          text NOT NULL,
  contenu         text NOT NULL,
  date            date NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- ── 21. Cursus / Parcours scolaire ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abschool_cursus (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES public.abschool_etablissements(id) ON DELETE CASCADE,
  eleve_id        uuid REFERENCES public.abschool_eleves(id) ON DELETE CASCADE,
  annee           text NOT NULL,
  classe          text NOT NULL,
  etablissement_nom text,
  moyenne         numeric(4,2),
  statut          text NOT NULL CHECK (statut IN ('passe','redouble','transfert','en_cours')),
  created_at      timestamptz DEFAULT now()
);

-- ── 22. Indexs supplémentaires ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_abschool_sanctions_eleve ON public.abschool_sanctions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_abschool_sanctions_etab ON public.abschool_sanctions(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_abschool_recus_paiement ON public.abschool_recus(paiement_id);
CREATE INDEX IF NOT EXISTS idx_abschool_justifs_eleve ON public.abschool_justificatifs(eleve_id);
CREATE INDEX IF NOT EXISTS idx_abschool_docs_eleve ON public.abschool_documents_eleve(eleve_id);
CREATE INDEX IF NOT EXISTS idx_abschool_notes_eleve_eleve ON public.abschool_notes_eleve(eleve_id);
CREATE INDEX IF NOT EXISTS idx_abschool_cursus_eleve ON public.abschool_cursus(eleve_id);

-- ── 23. RLS nouvelles tables ────────────────────────────────────────────────
ALTER TABLE public.abschool_sanctions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_recus            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_contrats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_justificatifs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_documents_eleve  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_partenaires      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_personnel        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_notes_eleve      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abschool_cursus           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abschool_all" ON public.abschool_sanctions;
CREATE POLICY "abschool_all" ON public.abschool_sanctions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_recus;
CREATE POLICY "abschool_all" ON public.abschool_recus FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_contrats;
CREATE POLICY "abschool_all" ON public.abschool_contrats FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_justificatifs;
CREATE POLICY "abschool_all" ON public.abschool_justificatifs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_documents_eleve;
CREATE POLICY "abschool_all" ON public.abschool_documents_eleve FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_partenaires;
CREATE POLICY "abschool_all" ON public.abschool_partenaires FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_personnel;
CREATE POLICY "abschool_all" ON public.abschool_personnel FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_notes_eleve;
CREATE POLICY "abschool_all" ON public.abschool_notes_eleve FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "abschool_all" ON public.abschool_cursus;
CREATE POLICY "abschool_all" ON public.abschool_cursus FOR ALL USING (true) WITH CHECK (true);
