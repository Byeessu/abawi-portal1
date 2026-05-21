-- ================================================================
-- TABLES RECRUTEMENT — Offres d'emploi & Candidatures
-- ================================================================

-- Offres d'emploi
CREATE TABLE IF NOT EXISTS job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text,
  location text,
  contract_type text,
  salary text,
  description text,
  summary text,
  requirements text[],
  tags text[],
  source text,
  external_url text,
  contact_email text,
  active boolean DEFAULT true,
  analyzed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidatures
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES job_offers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  cv_url text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_job_offers_active ON job_offers(active);
CREATE INDEX IF NOT EXISTS idx_job_offers_source ON job_offers(source);
CREATE INDEX IF NOT EXISTS idx_job_offers_created ON job_offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_offer ON job_applications(offer_id);

-- RLS policies
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Offres : lecture publique, écriture admin
CREATE POLICY "job_offers_select_all" ON job_offers FOR SELECT USING (true);
CREATE POLICY "job_offers_insert_admin" ON job_offers FOR INSERT WITH CHECK (false);
CREATE POLICY "job_offers_update_admin" ON job_offers FOR UPDATE USING (false);

-- Candidatures : insertion publique (pour postuler), lecture admin
CREATE POLICY "job_applications_insert_all" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "job_applications_select_admin" ON job_applications FOR SELECT USING (false);
CREATE POLICY "job_applications_update_admin" ON job_applications FOR UPDATE USING (false);

-- ================================================================
-- DONNÉES DE DÉMO — Sources principales Afrique de l'Ouest
-- ================================================================

INSERT INTO job_offers (title, company, location, contract_type, salary, description, summary, requirements, tags, source, external_url, active, created_at) VALUES
('Développeur Full Stack (React/Node)', 'Startup Fintech', 'Dakar, Sénégal', 'CDI', '400 000 - 700 000 FCFA', 'Nous recherchons un développeur full stack expérimenté pour rejoindre notre équipe produit. Vous travaillerez sur des applications de paiement mobile et de gestion financière.', 'Développeur Full Stack pour startup fintech à Dakar. React, Node.js, MongoDB.', ARRAY['3+ ans expérience React/Node', 'Maîtrise de MongoDB et PostgreSQL', 'Anglais technique requis', 'Expérience fintech appréciée'], ARRAY['IT', 'CDI', 'Dakar'], 'ABAWI Jobs', NULL, true, now()),
('Responsable Marketing Digital', 'Groupe Agroalimentaire', 'Abidjan, Côte d''Ivoire', 'CDI', '800 000 - 1 200 000 FCFA', 'Piloter la stratégie digitale du groupe sur l''ensemble de la zone UEMOA. Gestion d''équipe de 5 personnes, budget 500M FCFA.', 'Responsable marketing digital pour groupe agroalimentaire majeur en Côte d''Ivoire.', ARRAY['5+ ans en marketing digital', 'Expérience e-commerce B2B/B2C', 'Leadership d''équipe', 'Bilingue français/anglais'], ARRAY['Marketing', 'CDI', 'Abidjan'], 'ABAWI Jobs', NULL, true, now()),
('Consultant SAP S/4HANA', 'EY Afrique', 'Dakar / Remote', 'CDD', '1 500 000 - 2 500 000 FCFA', 'Mission de conseil en implémentation SAP S/4HANA pour grands comptes bancaires et industriels de la zone.', 'Consultant SAP S/4HANA pour EY Afrique, missions en zone UEMOA.', ARRAY['Certification SAP S/4HANA', '5+ ans en conseil ERP', 'Mobilité internationale', 'Français + anglais professionnel'], ARRAY['IT', 'Consulting', 'Remote'], 'Michael Page', NULL, true, now()),
('Chargé(e) de Communication', 'ONG Internationale', 'Bamako, Mali', 'CDD', '300 000 - 500 000 FCFA', 'Communication externe et interne pour un projet de développement rural sur 3 ans. Rédaction de rapports, gestion réseaux sociaux.', 'Chargé de communication pour ONG internationale à Bamako.', ARRAY['Master communication/journalisme', '2+ ans expérience ONG', 'Rédaction anglais/français', 'Maîtrise Canva / Adobe Suite'], ARRAY['Communication', 'CDD', 'Mali'], 'Expat Dakar', NULL, true, now()),
('Ingénieur Réseau & Sécurité', 'Orange Sénégal', 'Dakar', 'CDI', 'Sur grille', 'Administration réseau core, sécurité SI, gestion incidents N2/N3. Environnement multivendeur Cisco, Huawei, Fortinet.', 'Ingénieur réseau et sécurité pour Orange Sénégal à Dakar.', ARRAY['Diplôme ingénieur télécoms/réseaux', '3+ ans en administration réseau', 'Certifications CCNP ou équivalent', 'Disponibilité immédiate'], ARRAY['IT', 'CDI', 'Dakar'], 'Emploi Sénégal', NULL, true, now()),
('Comptable Senior — OHADA', 'Cabinet Comptable', 'Cotonou, Bénin', 'CDI', '500 000 - 800 000 FCFA', 'Tenue comptable, révision, consolidation et accompagnement fiscal pour PME de la zone. Expertise OHADA requise.', 'Comptable senior expert OHADA pour cabinet comptable à Cotonou.', ARRAY['Diplôme comptable supérieur', '5+ ans expérience OHADA', 'Maîtrise des logiciels SAGE et CIEL', 'Rigoureux et autonome'], ARRAY['Finance', 'CDI', 'Cotonou'], 'ABAWI Jobs', NULL, true, now()),
('Business Developer — Zone CEDEAO', 'Logistics Tech', 'Dakar / Lagos / Accra', 'CDI', 'Variable + commissions', 'Développement commercial B2B sur la zone CEDEAO pour solution logistique SaaS. Prospection grands comptes transport et e-commerce.', 'Business Developer zone CEDEAO pour logistics tech. B2B SaaS.', ARRAY['3+ ans business development B2B', 'Réseau logistique/e-commerce Afrique', 'Anglais professionnel obligatoire', 'Mobilité fréquente'], ARRAY['Commercial', 'CDI', 'Remote'], 'LinkedIn', NULL, true, now()),
('Data Analyst — Agriculture de Précision', 'Agritech Startup', 'Ouagadougou, Burkina Faso', 'Stage', '150 000 FCFA / mois', 'Analyse de données satellitaires et capteurs sol pour optimisation des rendements agricoles. Python, QGIS, ML.', 'Stage data analyst agriculture de précision pour agritech à Ouagadougou.', ARRAY['Master data science / agronomie', 'Python, pandas, scikit-learn', 'Intérêt pour l''agriculture africaine', 'Durée 6 mois minimum'], ARRAY['IT', 'Stage', 'Burkina'], 'Rekrute', NULL, true, now())
ON CONFLICT DO NOTHING;
