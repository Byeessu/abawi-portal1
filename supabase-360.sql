-- =============================================
-- ABAWI 360 — Tables CRM, Planification, Stats
-- =============================================

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  prenom TEXT DEFAULT '',
  nom TEXT DEFAULT '',
  entreprise TEXT DEFAULT '',
  poste TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  ville TEXT DEFAULT '',
  secteur TEXT DEFAULT '',
  statut TEXT DEFAULT 'prospect' CHECK (statut IN ('prospect','contact','client','partenaire','inactif')),
  valeur_estimee INTEGER DEFAULT 0,
  probabilite INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All crm_contacts" ON crm_contacts FOR ALL USING (true);

-- CRM Interactions
CREATE TABLE IF NOT EXISTS crm_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  type TEXT DEFAULT 'note' CHECK (type IN ('note','appel','email','rdv','whatsapp','contrat')),
  contenu TEXT DEFAULT '',
  date_interaction TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All crm_interactions" ON crm_interactions FOR ALL USING (true);

-- Projets
CREATE TABLE IF NOT EXISTS projets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  nom TEXT NOT NULL,
  description TEXT DEFAULT '',
  statut TEXT DEFAULT 'planifie' CHECK (statut IN ('planifie','en_cours','en_pause','termine','annule')),
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse','normale','haute','critique')),
  date_debut DATE,
  date_fin DATE,
  budget INTEGER DEFAULT 0,
  progression INTEGER DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
  couleur TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All projets" ON projets FOR ALL USING (true);

-- Tâches
CREATE TABLE IF NOT EXISTS taches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT DEFAULT '',
  assignee TEXT DEFAULT '',
  statut TEXT DEFAULT 'todo' CHECK (statut IN ('todo','en_cours','review','done')),
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse','normale','haute','critique')),
  date_echeance DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All taches" ON taches FOR ALL USING (true);

-- OKR Objectifs
CREATE TABLE IF NOT EXISTS okr_objectifs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT DEFAULT '',
  periode TEXT DEFAULT 'Q1-2026',
  progression INTEGER DEFAULT 0,
  resultats_cles JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE okr_objectifs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All okr_objectifs" ON okr_objectifs FOR ALL USING (true);

-- Formulaires statistiques
CREATE TABLE IF NOT EXISTS stat_formulaires (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_email TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT DEFAULT '',
  champs JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  nb_reponses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE stat_formulaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All stat_formulaires" ON stat_formulaires FOR ALL USING (true);

-- Réponses formulaires
CREATE TABLE IF NOT EXISTS stat_reponses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  formulaire_id UUID REFERENCES stat_formulaires(id) ON DELETE CASCADE,
  repondant_email TEXT DEFAULT '',
  reponses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE stat_reponses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All stat_reponses" ON stat_reponses FOR ALL USING (true);

SELECT 'Setup ABAWI 360 termine' as status;
