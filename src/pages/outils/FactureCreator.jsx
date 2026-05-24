import { useState, useEffect } from 'react'
import { exportToPDF } from '../../lib/generatePDF'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'

/* ═══════════════════════════════════════════════════════════════
   FACTURE / DEVIS PRO — Créateur de documents professionnels
   Templates × Thèmes × Aperçu temps réel × Export PDF
   ═══════════════════════════════════════════════════════════════ */

const LS_KEY = 'abawi_facture_v3'

/* ── Types de documents ── */
const DOC_TYPES = {
  facture:     { label: 'Facture',           color: '#0EA5E9', icon: '🧾' },
  devis:       { label: 'Devis / Offre',     color: '#8B5CF6', icon: '📝' },
  bon_commande:{ label: 'Bon de commande',   color: '#F59E0B', icon: '📋' },
  avoir:       { label: 'Avoir / Crédit',    color: '#6B7280', icon: '↩️' },
  recu:        { label: 'Reçu de paiement', color: '#10B981', icon: '✅' },
  proforma:    { label: 'Proforma',          color: '#EF4444', icon: '🌍' },
}

/* ── Devises ── */
const CURRENCIES = [
  { code: 'FCFA', name: 'Franc CFA' }, { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'Dollar US' }, { code: 'MAD', name: 'Dirham' },
  { code: 'GHS', name: 'Cedi' }, { code: 'NGN', name: 'Naira' },
]

/* ── Thèmes visuels ── */
const THEMES = {
  corporate: { label: 'Corporate Navy',  headerBg: '#003566', accent: '#ffd166', text: '#fff', sub: '#cce4ff', alt: '#f0f6ff' },
  classic:   { label: 'Classique',       headerBg: '#1a1a2e', accent: '#e94560', text: '#fff', sub: '#e3e3e3', alt: '#f8f9fa' },
  premium:   { label: 'Premium Gold',   headerBg: '#0f0c29', accent: '#d4af37', text: '#fff', sub: '#ffe180', alt: '#fffdf5' },
  tech:      { label: 'Violet Tech',    headerBg: '#240046', accent: '#c77dff', text: '#fff', sub: '#e0aaff', alt: '#f8f0ff' },
  nature:    { label: 'Vert Naturel',   headerBg: '#1b4332', accent: '#52b788', text: '#fff', sub: '#b7e4c7', alt: '#f0faf4' },
  africa:    { label: 'Afrique',        headerBg: '#6a040f', accent: '#f48c06', text: '#fff', sub: '#ffe08a', alt: '#fff9f0' },
  ocean:     { label: 'Océan',          headerBg: '#023e8a', accent: '#48cae4', text: '#fff', sub: '#caf0f8', alt: '#f0faff' },
  slate:     { label: 'Ardoise',        headerBg: '#1e293b', accent: '#94a3b8', text: '#fff', sub: '#e2e8f0', alt: '#f8fafc' },
  senegal:   { label: '🇸🇳 Sénégal',    headerBg: '#006B3F', accent: '#FFCD00', text: '#fff', sub: '#ffe680', alt: '#f0fff4' },
}

const today = () => new Date().toISOString().slice(0, 10)
const daysLater = d => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10)
const num = (prefix, n = '') => `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}${n}`

/* ═══════════════════════════════════════════════════════════════
   TEMPLATES PROFESSIONNELS
   ═══════════════════════════════════════════════════════════════ */
const TEMPLATES = [
  /* ── FACTURES ── */
  {
    id: 'consulting', category: 'facture', industry: 'Conseil & Stratégie', icon: '💼',
    name: 'Conseil Pro', theme: 'corporate', currency: 'FCFA',
    desc: 'Audit, conseil, accompagnement stratégique',
    meta: { type: 'facture', numero: num('FAC'), date: today(), echeance: daysLater(30),
      emetteur: 'ABAWI Consulting SARL', emetteur_detail: 'VDN Liberté 6, Dakar\nNINEA : SN-2024-XXXXXXX\nRCCM : SN-DKR-2024-XXXX\nTél : +221 77 XXX XX XX\ncontact@consulting.sn',
      client: 'Entreprise Client SA', client_detail: 'Zone Industrielle, Dakar\nContact : M. Directeur\nTél : +221 78 XXX XX XX',
      objet: 'Prestation de conseil en stratégie digitale — Phase 1',
      conditions: 'Paiement à 30 jours — Virement bancaire ou Mobile Money',
      mention: 'Conformément au droit OHADA, tout retard de paiement entraîne des pénalités de retard.' },
    lines: [
      { desc: 'Audit stratégique & diagnostic digital', qty: 1, pu: 750000 },
      { desc: 'Rapport de recommandations (20 pages)', qty: 1, pu: 350000 },
      { desc: 'Présentation exécutive (3h)', qty: 1, pu: 200000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },
  {
    id: 'dev-web', category: 'facture', industry: 'IT & Développement', icon: '💻',
    name: 'Développement', theme: 'tech', currency: 'FCFA',
    desc: 'Applications web, mobile, API',
    meta: { type: 'facture', numero: num('FAC-DEV'), date: today(), echeance: '',
      emetteur: 'DevAgency SN', emetteur_detail: 'Sacré-Cœur III, Dakar\nNINEA : SN-2023-XXXXXXX\nTél : +221 76 XXX XX XX\ndev@agency.sn',
      client: 'Startup TechHub', client_detail: 'Plateau, Dakar',
      objet: 'Développement application mobile iOS & Android — v1.0',
      conditions: '50% à la commande, 50% à la livraison finale',
      mention: 'Le code source est livré intégralement à réception du paiement complet.' },
    lines: [
      { desc: 'Design UI/UX — maquettes Figma (30 écrans)', qty: 1, pu: 500000 },
      { desc: 'Développement React Native (8 sprints)', qty: 8, pu: 350000 },
      { desc: 'Backend API REST + base de données', qty: 1, pu: 600000 },
      { desc: 'Tests QA & déploiement stores App Store / Play', qty: 1, pu: 250000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: false, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },
  {
    id: 'btp', category: 'facture', industry: 'Bâtiment & BTP', icon: '🏗️',
    name: 'Travaux BTP', theme: 'classic', currency: 'FCFA',
    desc: 'Construction, rénovation, aménagement',
    meta: { type: 'facture', numero: num('FAC-BTP'), date: today(), echeance: '',
      emetteur: 'BTP Sénégal SARL', emetteur_detail: 'Route de Rufisque, Dakar\nNINEA : SN-2021-XXXXXXX\nLicence BTP N° XXXX\nTél : +221 77 XXX XX XX',
      client: 'M. Propriétaire', client_detail: 'Almadies, Dakar\nTél : +221 78 XXX XX XX',
      objet: 'Travaux de construction — Villa R+1',
      conditions: 'Paiement par tranches selon avancement des travaux (30-30-40%)',
      mention: '' },
    lines: [
      { desc: 'Fondations béton armé (60m²)', qty: 60, pu: 45000 },
      { desc: 'Maçonnerie murs (180m²)', qty: 180, pu: 25000 },
      { desc: 'Carrelage intérieur pose incluse (90m²)', qty: 90, pu: 18000 },
      { desc: 'Peinture intérieure (250m²)', qty: 250, pu: 4500 },
      { desc: 'Plomberie sanitaire complète', qty: 1, pu: 850000 },
      { desc: 'Électricité + tableau divisionnaire', qty: 1, pu: 650000 },
    ],
    useTVA: true, tvaPct: 18, useEcheance: false, useObjet: true, useConditions: true, useMention: false, useSignature: true, useCachet: true,
  },
  {
    id: 'sante', category: 'facture', industry: 'Santé & Médical', icon: '🏥',
    name: 'Médical / Clinique', theme: 'ocean', currency: 'FCFA',
    desc: 'Consultations, actes médicaux, soins',
    meta: { type: 'facture', numero: num('FAC-MED'), date: today(), echeance: '',
      emetteur: 'Cabinet Médical Dr. XXX', emetteur_detail: 'Mermoz, Dakar\nN° Ordre : XXXX\nTél : +221 77 XXX XX XX\ncabinet@medecin.sn',
      client: 'Patient / Assurance', client_detail: 'Assurance : Mutuelle XXX\nN° Police : XXXXX',
      objet: 'Consultations et actes médicaux — Mois de janvier 2025',
      conditions: 'Paiement comptant ou remboursement assurance',
      mention: 'Facture médicale officielle — Conservez ce document pour vos remboursements.' },
    lines: [
      { desc: 'Consultation générale', qty: 3, pu: 15000 },
      { desc: 'Echographie abdominale', qty: 1, pu: 45000 },
      { desc: 'Analyses biologiques (bilan complet)', qty: 1, pu: 35000 },
    ],
    useTVA: false, tvaPct: 0, useEcheance: false, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },

  /* ── DEVIS ── */
  {
    id: 'devis-agence', category: 'devis', industry: 'Marketing & Communication', icon: '📊',
    name: 'Agence Créative', theme: 'premium', currency: 'FCFA',
    desc: 'Campagnes, branding, production créative',
    meta: { type: 'devis', numero: num('DEV'), date: today(), echeance: daysLater(15),
      emetteur: 'Agence Créative Dakar', emetteur_detail: 'Mermoz, Dakar\nNINEA : SN-2022-XXXXXXX\nTél : +221 77 XXX XX XX\nagence@creative.sn',
      client: 'Marque Client', client_detail: 'Direction Marketing\ncontact@marque.sn',
      objet: 'Campagne 360° — Lancement produit Q1 2025',
      conditions: 'Devis valable 15 jours. Bon pour accord vaut commande.',
      mention: 'Ce devis devient contractuel après signature des deux parties et versement de l\'acompte de 30%.' },
    lines: [
      { desc: 'Stratégie de communication (brief + plan média)', qty: 1, pu: 450000 },
      { desc: 'Création identité visuelle (logo + charte graphique)', qty: 1, pu: 800000 },
      { desc: 'Production spot publicitaire 30s (tournage + montage)', qty: 1, pu: 1500000 },
      { desc: 'Gestion réseaux sociaux (3 mois)', qty: 3, pu: 350000 },
      { desc: 'Conception & impression flyers A5 recto/verso (5 000 ex)', qty: 5000, pu: 120 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },
  {
    id: 'devis-formation', category: 'devis', industry: 'Formation & Éducation', icon: '🎓',
    name: 'Centre de Formation', theme: 'nature', currency: 'FCFA',
    desc: 'Formations professionnelles, certifications',
    meta: { type: 'devis', numero: num('DEV-FORM'), date: today(), echeance: daysLater(10),
      emetteur: 'Centre de Formation Pro', emetteur_detail: 'Université, Dakar\nAgrément MFPE N° XXXX\nTél : +221 77 XXX XX XX\nformation@centre.sn',
      client: 'Entreprise ABC', client_detail: 'DRH\ndrh@entreprise.sn',
      objet: 'Formation Management & Leadership — 15 participants',
      conditions: '100% à la confirmation. Annulation 48h avant : 50% remboursé.',
      mention: 'Programme agréé par le Ministère de la Formation Professionnelle et de l\'Artisanat.' },
    lines: [
      { desc: 'Formation Management (2 jours × 8h)', qty: 2, pu: 450000 },
      { desc: 'Support de cours et manuel participant', qty: 15, pu: 25000 },
      { desc: 'Attestation officielle par participant', qty: 15, pu: 15000 },
      { desc: 'Déjeuner & pause-café (2 jours × 15 pers)', qty: 30, pu: 8000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },
  {
    id: 'devis-transport', category: 'devis', industry: 'Transport & Logistique', icon: '🚚',
    name: 'Transport & Logistique', theme: 'africa', currency: 'FCFA',
    desc: 'Fret, livraison, transit douanier',
    meta: { type: 'devis', numero: num('DEV-TRANS'), date: today(), echeance: daysLater(7),
      emetteur: 'Translogis SARL', emetteur_detail: 'Port de Dakar\nLicence Transport N° XXXX\nTél : +221 77 XXX XX XX\ntranslogis@sn',
      client: 'Importateur SA', client_detail: 'Zone Industrielle, Dakar',
      objet: 'Transport de marchandises Dakar → Bamako — 1 conteneur 20 pieds',
      conditions: 'Devis valable 7 jours. Paiement 50% avant chargement.',
      mention: 'Transport sous assurance. Délai estimé : 5-7 jours ouvrables.' },
    lines: [
      { desc: 'Transport routier Dakar → Bamako (1 conteneur 20\')', qty: 1, pu: 2500000 },
      { desc: 'Formalités douanières Sénégal', qty: 1, pu: 350000 },
      { desc: 'Formalités douanières Mali', qty: 1, pu: 280000 },
      { desc: 'Assurance marchandises (1% valeur)', qty: 1, pu: 150000 },
      { desc: 'Escorte sécurité', qty: 1, pu: 200000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },

  /* ── BON DE COMMANDE ── */
  {
    id: 'bc-fournitures', category: 'bon_commande', industry: 'Commerce & Fournitures', icon: '📦',
    name: 'Fournitures Bureau', theme: 'corporate', currency: 'FCFA',
    desc: 'Achats matériel, mobilier, informatique',
    meta: { type: 'bon_commande', numero: num('BC'), date: today(), echeance: '',
      emetteur: 'Entreprise Acheteuse SA', emetteur_detail: 'Service Achats / Approvisionnements\nDakar, Sénégal\ncommandes@entreprise.sn',
      client: 'Fournisseur Référence SARL', client_detail: 'Zone Industrielle Mbao\nNINEA : SN-XXXXXXX\ncommercial@fournisseur.sn',
      objet: 'Fournitures de bureau & matériel informatique — Trimestre 1',
      conditions: 'Livraison dans les 5 jours ouvrables. Paiement à 60 jours fin de mois.',
      mention: 'Toute livraison partielle doit faire l\'objet d\'un accord écrit préalable.' },
    lines: [
      { desc: 'Ramettes papier A4 80g/m² (500 feuilles)', qty: 50, pu: 3500 },
      { desc: 'Cartouches imprimante HP 85A', qty: 10, pu: 25000 },
      { desc: 'Écran moniteur 24" Full HD IPS', qty: 5, pu: 175000 },
      { desc: 'Clavier + souris sans fil', qty: 5, pu: 35000 },
      { desc: 'Fauteuil de bureau ergonomique', qty: 3, pu: 95000 },
    ],
    useTVA: true, tvaPct: 18, useEcheance: false, useObjet: true, useConditions: true, useMention: true, useSignature: true, useCachet: true,
  },

  {
    id: 'freelance', category: 'facture', industry: 'Freelance & Indépendant', icon: '🧑‍💻',
    name: 'Freelance', theme: 'tech', currency: 'FCFA',
    desc: 'Rédaction, design, consulting indépendant',
    meta: { type: 'facture', numero: num('FAC-FL'), date: today(), echeance: daysLater(15),
      emetteur: 'Prénom NOM — Freelance', emetteur_detail: 'Dakar, Sénégal\nTél : +221 77 XXX XX XX\nfreelance@email.sn\nNINEA : SN-XXXXXXX (auto-entrepreneur)',
      client: 'Client SA', client_detail: 'Dakar, Sénégal\ncontact@client.sn',
      objet: 'Mission freelance — Création de contenu et community management',
      conditions: 'Paiement à 15 jours — Wave / Orange Money / Virement',
      mention: 'Auto-entrepreneur — non soumis à la TVA.' },
    lines: [
      { desc: 'Rédaction articles blog (5 articles × 800 mots)', qty: 5, pu: 45000 },
      { desc: 'Gestion réseaux sociaux (1 mois)', qty: 1, pu: 150000 },
      { desc: 'Création visuels Canva (20 posts)', qty: 20, pu: 8000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },
  {
    id: 'restauration', category: 'facture', industry: 'Restauration & Traiteur', icon: '🍽️',
    name: 'Traiteur / Resto', theme: 'africa', currency: 'FCFA',
    desc: 'Prestation traiteur, buffet, événement',
    meta: { type: 'facture', numero: num('FAC-REST'), date: today(), echeance: '',
      emetteur: 'Traiteur Excellence SARL', emetteur_detail: 'Dakar, Sénégal\nTél : +221 77 XXX XX XX\ntraiteur@excellence.sn',
      client: 'Entreprise XYZ', client_detail: 'Contact événements : +221 78 XXX XX XX',
      objet: 'Prestation traiteur — Réception 150 personnes — 25 Janvier 2025',
      conditions: 'Acompte 50% à la confirmation, solde 48h avant l\'événement',
      mention: '' },
    lines: [
      { desc: 'Buffet dinatoire complet (plats sénégalais + internationaux)', qty: 150, pu: 12000 },
      { desc: 'Boissons (eau, jus, café)', qty: 150, pu: 2500 },
      { desc: 'Location vaisselle et couverts', qty: 1, pu: 85000 },
      { desc: 'Service et personnel (5 serveurs × 8h)', qty: 5, pu: 20000 },
      { desc: 'Déplacement et transport matériel', qty: 1, pu: 35000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: false, useObjet: true, useConditions: true, useMention: false, useSignature: true, useCachet: false,
  },
  {
    id: 'immobilier', category: 'facture', industry: 'Immobilier & Agence', icon: '🏠',
    name: 'Immobilier / Agence', theme: 'premium', currency: 'FCFA',
    desc: 'Honoraires agence, location, vente',
    meta: { type: 'facture', numero: num('FAC-IMM'), date: today(), echeance: daysLater(30),
      emetteur: 'Agence Immobilière Dakar', emetteur_detail: 'Plateau, Dakar\nLicence N° XXXXXX\nTél : +221 77 XXX XX XX\nagence@immo.sn',
      client: 'Acquéreur / Locataire', client_detail: 'Dakar, Sénégal',
      objet: 'Honoraires d\'agence — Location villa meublée Almadies',
      conditions: 'Paiement comptant à la signature du bail',
      mention: 'Conformément à la réglementation en vigueur, les honoraires sont dus à la conclusion de la transaction.' },
    lines: [
      { desc: 'Honoraires d\'agence — location annuelle (5% loyer annuel)', qty: 1, pu: 900000 },
      { desc: 'Frais de dossier et vérification', qty: 1, pu: 50000 },
      { desc: 'État des lieux d\'entrée', qty: 1, pu: 75000 },
    ],
    useTVA: true, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: true, useCachet: true,
  },
  {
    id: 'securite', category: 'facture', industry: 'Sécurité & Gardiennage', icon: '🛡️',
    name: 'Gardiennage / Sécurité', theme: 'slate', currency: 'FCFA',
    desc: 'Surveillance, rondes, sécurité événementielle',
    meta: { type: 'facture', numero: num('FAC-SEC'), date: today(), echeance: daysLater(30),
      emetteur: 'SARL Sécurité Pro', emetteur_detail: 'Dakar, Sénégal\nAgrément Ministère Intérieur N° XXXX\nTél : +221 77 XXX XX XX',
      client: 'Société Industrielle SA', client_detail: 'Zone Industrielle, Dakar',
      objet: 'Prestation de gardiennage — Mois de Janvier 2025',
      conditions: 'Paiement mensuel avant le 5 du mois suivant',
      mention: '' },
    lines: [
      { desc: 'Gardiens de jour (2 agents × 26 jours × 8h)', qty: 52, pu: 8500 },
      { desc: 'Gardiens de nuit (2 agents × 26 nuits × 10h)', qty: 52, pu: 10500 },
      { desc: 'Rondes de sécurité périodiques', qty: 1, pu: 45000 },
      { desc: 'Rapport mensuel de sécurité', qty: 1, pu: 15000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: false, useSignature: true, useCachet: true,
  },
  {
    id: 'evenement', category: 'facture', industry: 'Événementiel', icon: '🎪',
    name: 'Organisation Événement', theme: 'premium', currency: 'FCFA',
    desc: 'Conférences, galas, forums, séminaires',
    meta: { type: 'facture', numero: num('FAC-EVT'), date: today(), echeance: daysLater(10),
      emetteur: 'EventPro SARL', emetteur_detail: 'Almadies, Dakar\nNINEA : SN-2023-XXXXXXX\nTél : +221 77 XXX XX XX\neventpro@dakar.sn',
      client: 'Organisateur Client', client_detail: 'contact@client.sn',
      objet: 'Organisation Forum Économique — 200 participants — Hôtel Radisson Blu',
      conditions: '40% à la signature, 40% J-15, 20% après l\'événement',
      mention: '' },
    lines: [
      { desc: 'Location salle de conférence (2 jours)', qty: 2, pu: 750000 },
      { desc: 'Technique son & lumière + équipe', qty: 1, pu: 1200000 },
      { desc: 'Coordination logistique et protocole', qty: 1, pu: 850000 },
      { desc: 'Signalétique et habillage de salle', qty: 1, pu: 450000 },
      { desc: 'Photographe + vidéaste professionnel', qty: 2, pu: 350000 },
      { desc: 'Accueil hôtesses (4 personnes × 2 jours)', qty: 8, pu: 50000 },
    ],
    useTVA: true, tvaPct: 18, useEcheance: false, useObjet: true, useConditions: true, useMention: false, useSignature: false, useCachet: false,
  },

  /* ── DEVIS SUPPLÉMENTAIRES ── */
  {
    id: 'devis-juridique', category: 'devis', industry: 'Cabinet Juridique', icon: '⚖️',
    name: 'Cabinet Juridique', theme: 'slate', currency: 'FCFA',
    desc: 'Honoraires avocat, consultation juridique',
    meta: { type: 'devis', numero: num('DEV-JUR'), date: today(), echeance: daysLater(10),
      emetteur: 'Cabinet Maître XXX', emetteur_detail: 'Barreau de Dakar\nPlateau, Dakar\nTél : +221 77 XXX XX XX\ncabinet@avocat.sn',
      client: 'Société Requérante', client_detail: 'Dakar, Sénégal',
      objet: 'Assistance juridique — Contentieux commercial — Tribunal de Commerce de Dakar',
      conditions: 'Provision 50% à la constitution du dossier. Solde à l\'issue de la procédure.',
      mention: 'Honoraires soumis au barème du Barreau de Dakar. TVA non applicable (profession libérale réglementée).' },
    lines: [
      { desc: 'Consultation juridique initiale (2h)', qty: 2, pu: 75000 },
      { desc: 'Rédaction mémoire et conclusions', qty: 1, pu: 450000 },
      { desc: 'Représentation audience (forfait 3 audiences)', qty: 3, pu: 200000 },
      { desc: 'Frais de greffe et procédure', qty: 1, pu: 85000 },
    ],
    useTVA: false, tvaPct: 0, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },
  {
    id: 'devis-nettoyage', category: 'devis', industry: 'Nettoyage & Propreté', icon: '🧹',
    name: 'Nettoyage / Facility', theme: 'nature', currency: 'FCFA',
    desc: 'Entretien locaux, nettoyage industriel',
    meta: { type: 'devis', numero: num('DEV-NET'), date: today(), echeance: daysLater(7),
      emetteur: 'ProClean Sénégal SARL', emetteur_detail: 'Dakar, Sénégal\nTél : +221 77 XXX XX XX\nproclean@sn',
      client: 'Bureau Client SA', client_detail: 'Plateau, Dakar',
      objet: 'Entretien et nettoyage bureaux — Contrat mensuel',
      conditions: 'Paiement mensuel à terme échu. Contrat résiliable avec 30 jours de préavis.',
      mention: '' },
    lines: [
      { desc: 'Nettoyage bureaux (5j/semaine × 4 semaines)', qty: 20, pu: 35000 },
      { desc: 'Produits d\'entretien (fournis)', qty: 1, pu: 45000 },
      { desc: 'Nettoyage vitres intérieur/extérieur (mensuel)', qty: 1, pu: 85000 },
      { desc: 'Désinfection sanitaires (quotidienne)', qty: 20, pu: 8000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: false, useSignature: false, useCachet: false,
  },
  {
    id: 'devis-impression', category: 'devis', industry: 'Imprimerie & Édition', icon: '🖨️',
    name: 'Imprimerie & Édition', theme: 'corporate', currency: 'FCFA',
    desc: 'Impression, packaging, signalétique',
    meta: { type: 'devis', numero: num('DEV-IMP'), date: today(), echeance: daysLater(5),
      emetteur: 'Imprimerie Moderne Dakar', emetteur_detail: 'Parcelles Assainies, Dakar\nTél : +221 77 XXX XX XX\nimprimerie@dakar.sn',
      client: 'Marque Client', client_detail: 'Direction Communication\nprint@marque.sn',
      objet: 'Commande impression — Supports de communication Q1 2025',
      conditions: 'Paiement avant mise en impression. Délai 5-7 jours ouvrables.',
      mention: 'Le bon à tirer (BAT) doit être approuvé par le client avant toute impression.' },
    lines: [
      { desc: 'Flyers A5 recto-verso quadri (5 000 ex)', qty: 5000, pu: 100 },
      { desc: 'Affiches A3 plastifiées (500 ex)', qty: 500, pu: 850 },
      { desc: 'Cartes de visite 90×50mm, vernis sélectif (1 000 ex)', qty: 1000, pu: 350 },
      { desc: 'Roll-up 85×200cm (impression + structure)', qty: 3, pu: 95000 },
      { desc: 'Création/adaptation maquettes (PAO)', qty: 1, pu: 150000 },
    ],
    useTVA: true, tvaPct: 18, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },

  /* ── BON DE COMMANDE SUPPLÉMENTAIRE ── */
  {
    id: 'bc-informatique', category: 'bon_commande', industry: 'IT & Informatique', icon: '🖥️',
    name: 'Équipements IT', theme: 'tech', currency: 'FCFA',
    desc: 'Matériel informatique, réseau, téléphonie',
    meta: { type: 'bon_commande', numero: num('BC-IT'), date: today(), echeance: '',
      emetteur: 'DSI — Direction des Systèmes d\'Information', emetteur_detail: 'Entreprise XYZ SA\nDakar, Sénégal\ndsi@entreprise.sn',
      client: 'Informatique Pro SARL', client_detail: 'Zone Industrielle, Dakar\ncommercial@informatiquepro.sn',
      objet: 'Acquisition équipements informatiques — Renouvellement parc 2025',
      conditions: 'Livraison avec installation et configuration incluse. Paiement 30 jours.',
      mention: 'Garantie constructeur obligatoire. Support technique 1 an inclus.' },
    lines: [
      { desc: 'PC portable Dell Latitude 15" (i7, 16Go, 512Go SSD)', qty: 10, pu: 850000 },
      { desc: 'Switch réseau 24 ports Gigabit', qty: 2, pu: 185000 },
      { desc: 'Imprimante multifonction réseau HP A3', qty: 2, pu: 450000 },
      { desc: 'Onduleur 1500VA (protection 6 postes)', qty: 5, pu: 120000 },
      { desc: 'Installation et configuration réseau', qty: 1, pu: 350000 },
    ],
    useTVA: true, tvaPct: 18, useEcheance: false, useObjet: true, useConditions: true, useMention: true, useSignature: true, useCachet: true,
  },

  /* ── AVOIR ── */
  {
    id: 'avoir-retour', category: 'avoir', industry: 'Tous secteurs', icon: '↩️',
    name: 'Note de Crédit', theme: 'slate', currency: 'FCFA',
    desc: 'Retour marchandise, remboursement partiel',
    meta: { type: 'avoir', numero: num('AVO'), date: today(), echeance: '',
      emetteur: 'Vendeur SARL', emetteur_detail: 'Dakar, Sénégal',
      client: 'Client SA', client_detail: '',
      objet: 'Avoir sur facture FAC-2025-015 — Retour marchandise défectueuse',
      conditions: 'Avoir à valoir sur prochaine commande ou remboursement sous 15 jours',
      mention: '' },
    lines: [
      { desc: 'Retour produit défectueux réf. ABC-123', qty: -2, pu: 75000 },
      { desc: 'Avoir geste commercial suite litige', qty: 1, pu: -25000 },
    ],
    useTVA: false, tvaPct: 18, useEcheance: false, useObjet: true, useConditions: true, useMention: false, useSignature: false, useCachet: false,
  },

  /* ── REÇU ── */
  {
    id: 'recu-paiement', category: 'recu', industry: 'Tous secteurs', icon: '✅',
    name: 'Reçu de paiement', theme: 'nature', currency: 'FCFA',
    desc: 'Attestation de réception de paiement',
    meta: { type: 'recu', numero: num('REC'), date: today(), echeance: '',
      emetteur: 'Prestataire / Vendeur', emetteur_detail: 'Dakar, Sénégal\nTél : +221 77 XXX XX XX',
      client: 'Client / Acheteur', client_detail: '',
      objet: 'Reçu de paiement — Règlement intégral de la prestation',
      conditions: '',
      mention: 'Ce reçu certifie la bonne réception du paiement. Conservez ce document.' },
    lines: [{ desc: 'Prestation / Produit vendu', qty: 1, pu: 150000 }],
    useTVA: false, tvaPct: 0, useEcheance: false, useObjet: true, useConditions: false, useMention: true, useSignature: true, useCachet: false,
  },

  /* ── PROFORMA ── */
  {
    id: 'proforma-export', category: 'proforma', industry: 'Commerce International', icon: '🌍',
    name: 'Export Afrique', theme: 'senegal', currency: 'FCFA',
    desc: 'Import/export, dédouanement, incoterms',
    meta: { type: 'proforma', numero: num('PRO'), date: today(), echeance: daysLater(7),
      emetteur: 'Export Afrique SARL', emetteur_detail: 'Port de Dakar, Sénégal\nNINEA : SN-XXXXXXX\nExportateur agréé N° XXXX\nexport@afrique.sn',
      client: 'Importateur International', client_detail: 'Abidjan, Côte d\'Ivoire\ncontact@importateur.ci',
      objet: 'Proforma pour importation — Incoterms CIF Abidjan',
      conditions: 'Validité 7 jours. Paiement par L/C ou virement T/T anticipé.',
      mention: 'Document proforma non contractuel — sujet à modification selon cours des matières.' },
    lines: [
      { desc: 'Arachides décortiquées (sac 50kg)', qty: 100, pu: 45000 },
      { desc: 'Noix de cajou brutes (sac 25kg)', qty: 50, pu: 85000 },
      { desc: 'Frais d\'emballage et étiquetage export', qty: 1, pu: 150000 },
      { desc: 'Transport terrestre Dakar → Port', qty: 1, pu: 250000 },
      { desc: 'Frais de transit et dédouanement', qty: 1, pu: 175000 },
    ],
    useTVA: false, tvaPct: 0, useEcheance: true, useObjet: true, useConditions: true, useMention: true, useSignature: false, useCachet: false,
  },
]

const HIST_KEY = 'abawi_facture_hist'
const PROFILE_KEY = 'abawi_facture_profile'

function loadSaved() { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null } }
function loadHist() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]') } catch { return [] } }
function saveHist(h) { try { localStorage.setItem(HIST_KEY, JSON.stringify(h)) } catch {} }
function loadProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null } }
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)) } catch {} }

const DEFAULT = TEMPLATES[0]
function makeDefault() {
  return {
    meta: { ...DEFAULT.meta, numero: num('FAC'), date: today() },
    lines: [...DEFAULT.lines],
    theme: DEFAULT.theme, currency: DEFAULT.currency,
    useTVA: DEFAULT.useTVA, tvaPct: DEFAULT.tvaPct,
    useEcheance: DEFAULT.useEcheance, useObjet: DEFAULT.useObjet,
    useConditions: DEFAULT.useConditions, useMention: DEFAULT.useMention,
    useSignature: DEFAULT.useSignature, useCachet: DEFAULT.useCachet,
    signatureUrl: '', cachetUrl: '',
  }
}

export default function FactureCreator() {
  const saved = loadSaved()
  const d = saved || makeDefault()

  const [step, setStep] = useState('templates')
  const [selectedTpl, setSelectedTpl] = useState(null)
  const [filterCat, setFilterCat] = useState('tous')

  const [meta, setMeta] = useState(d.meta)
  const [lines, setLines] = useState(d.lines)
  const [theme, setTheme] = useState(d.theme || 'corporate')
  const [currency, setCurrency] = useState(d.currency || 'FCFA')

  const [useTVA, setUseTVA] = useState(d.useTVA ?? false)
  const [tvaPct, setTvaPct] = useState(d.tvaPct ?? 18)
  const [useEcheance, setUseEcheance] = useState(d.useEcheance ?? false)
  const [useObjet, setUseObjet] = useState(d.useObjet ?? true)
  const [useConditions, setUseConditions] = useState(d.useConditions ?? true)
  const [useMention, setUseMention] = useState(d.useMention ?? true)
  const [useSignature, setUseSignature] = useState(d.useSignature ?? false)
  const [useCachet, setUseCachet] = useState(d.useCachet ?? false)
  const [signatureUrl, setSignatureUrl] = useState(d.signatureUrl || '')
  const [cachetUrl, setCachetUrl] = useState(d.cachetUrl || '')
  const [logoUrl, setLogoUrl] = useState(d.logoUrl || '')
  const [useLogo, setUseLogo] = useState(d.useLogo ?? false)

  const [discount, setDiscount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [history, setHistory] = useState(loadHist)
  const [savedProfile, setSavedProfile] = useState(loadProfile)
  const [fcToast, setFcToast] = useState('')

  const { membre } = useAuth()
  const guard = useToolGuard('facture', 'facture')

  function showToast(msg) { setFcToast(msg); setTimeout(() => setFcToast(''), 3000) }

  function saveAsProfile() {
    const profile = {
      emetteur: meta.emetteur,
      emetteur_detail: meta.emetteur_detail,
      logoUrl: logoUrl.length < 80000 ? logoUrl : '',
      useLogo,
      theme,
      currency,
      useTVA,
      tvaPct,
      savedAt: new Date().toISOString(),
    }
    saveProfile(profile)
    setSavedProfile(profile)
    showToast('✅ Profil émetteur sauvegardé')
  }

  function applyProfile() {
    if (!savedProfile) return
    if (savedProfile.emetteur) updateMeta('emetteur', savedProfile.emetteur)
    if (savedProfile.emetteur_detail) updateMeta('emetteur_detail', savedProfile.emetteur_detail)
    if (savedProfile.logoUrl) { setLogoUrl(savedProfile.logoUrl); setUseLogo(true) }
    if (savedProfile.theme) setTheme(savedProfile.theme)
    if (savedProfile.currency) setCurrency(savedProfile.currency)
    if (savedProfile.useTVA !== undefined) setUseTVA(savedProfile.useTVA)
    if (savedProfile.tvaPct) setTvaPct(savedProfile.tvaPct)
    showToast('✅ Profil appliqué')
  }

  function updateHistStatus(id, status) {
    const newHist = history.map(h => h.id === id ? { ...h, status } : h)
    saveHist(newHist)
    setHistory(newHist)
  }

  function deleteHistItem(id) {
    if (!confirm('Supprimer cet enregistrement ?')) return
    const newHist = history.filter(h => h.id !== id)
    saveHist(newHist)
    setHistory(newHist)
  }

  function reuseFromHistory(record) {
    updateMeta('emetteur', record.emetteur || '')
    updateMeta('client', record.client || '')
    setTheme(record.theme || 'corporate')
    setCurrency(record.currency || 'FCFA')
    updateMeta('type', record.type || 'facture')
    updateMeta('numero', num(record.type?.toUpperCase?.() || 'FAC'))
    updateMeta('date', today())
    setStep('form')
    showToast('✅ Modèle chargé — complétez les détails')
  }

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        meta, lines, theme, currency, useTVA, tvaPct,
        useEcheance, useObjet, useConditions, useMention,
        useSignature, signatureUrl: signatureUrl.length < 50000 ? signatureUrl : '',
        useCachet, cachetUrl: cachetUrl.length < 50000 ? cachetUrl : '',
        useLogo, logoUrl: logoUrl.length < 80000 ? logoUrl : '',
      }))
    } catch { /* ignore */ }
  }, [meta, lines, theme, currency, useTVA, tvaPct, useEcheance, useObjet, useConditions, useMention, useSignature, signatureUrl, useCachet, cachetUrl, useLogo, logoUrl])

  function applyTemplate(tpl) {
    setSelectedTpl(tpl.id)
    setMeta({ ...tpl.meta, numero: num(tpl.meta.numero.split('-')[0] + '-' + tpl.meta.numero.split('-')[1] || 'FAC'), date: today() })
    setLines([...tpl.lines])
    setTheme(tpl.theme)
    setCurrency(tpl.currency || 'FCFA')
    setUseTVA(tpl.useTVA); setTvaPct(tpl.tvaPct || 18)
    setUseEcheance(tpl.useEcheance); setUseObjet(tpl.useObjet)
    setUseConditions(tpl.useConditions); setUseMention(tpl.useMention)
    setUseSignature(tpl.useSignature); setUseCachet(tpl.useCachet)
    setSignatureUrl(''); setCachetUrl('')
    setStep('form')
  }

  function updateMeta(k, v) { setMeta(m => ({ ...m, [k]: v })) }
  function updateLine(i, k, v) { setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l)) }
  function addLine() { setLines(ls => [...ls, { desc: '', qty: 1, pu: 0 }]) }
  function removeLine(i) { setLines(ls => ls.filter((_, idx) => idx !== i)) }
  function readImage(file, setter) {
    if (!file) return
    const r = new FileReader(); r.onload = e => setter(e.target.result); r.readAsDataURL(file)
  }

  const totalHT = lines.reduce((s, l) => s + Math.max(0, Number(l.qty) * Number(l.pu)), 0)
  const discountAmt = totalHT * (discount / 100)
  const baseHT = totalHT - discountAmt
  const tva = useTVA ? baseHT * (tvaPct / 100) : 0
  const totalTTC = baseHT + tva
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR')
  const t = THEMES[theme] || THEMES.corporate
  const docType = DOC_TYPES[meta.type] || DOC_TYPES.facture
  async function exportPDF() {
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return
    await guard.recordUsage()

    // Log in history
    const record = {
      id: Date.now(),
      numero: meta.numero,
      type: meta.type,
      emetteur: meta.emetteur,
      client: meta.client,
      total: totalTTC,
      currency,
      date: meta.date,
      theme,
      status: 'emise',
      createdAt: new Date().toISOString(),
    }
    const newHist = [record, ...loadHist()].slice(0, 200)
    saveHist(newHist)
    setHistory(newHist)

    exportToPDF('facture-export', meta.type + '-' + meta.numero, { includeHeader: false, includeFooter: false })
    showToast('📥 PDF en cours de génération…')
  }

  /* ── Styles ── */
  const CSS = `
    .fc-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: var(--text-primary); }
    .fc-tabs { display: flex; background: var(--bg-secondary,#1e293b); border-radius: 14px; padding: 4px; gap: 4px; margin-bottom: 20px; }
    .fc-tab { flex: 1; padding: 10px 8px; border: none; border-radius: 10px; font-size: .82rem; font-weight: 700; cursor: pointer; transition: all .18s; color: var(--text-muted); background: transparent; }
    .fc-tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 2px 8px rgba(0,0,0,.15); }
    .fc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
    .fc-tpl-card { border-radius: 16px; overflow: hidden; cursor: pointer; border: 2px solid var(--border); transition: all .2s; background: var(--bg-card); }
    .fc-tpl-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.18); }
    .fc-tpl-card.active { border-color: #0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,.2); }
    .fc-field { width: 100%; padding: 10px 12px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); font-size: .86rem; box-sizing: border-box; outline: none; }
    .fc-field:focus { border-color: #0EA5E9; }
    .fc-lbl { font-size: .72rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .5px; }
    .fc-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 18px; margin-bottom: 14px; }
    .fc-sec-title { font-size: .75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; display: flex; align-items: center; gap: 7px; }
    .fc-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: .82rem; color: var(--text-secondary); user-select: none; }
    .fc-pill { padding: 4px 10px; border-radius: 20px; font-size: .7rem; font-weight: 700; border: 1px solid; cursor: pointer; transition: all .15s; }
    .fc-row-add { padding: 8px 14px; border: 1.5px dashed var(--border); border-radius: 8px; background: transparent; color: var(--text-muted); cursor: pointer; font-size: .8rem; font-weight: 700; transition: all .18s; }
    .fc-row-add:hover { border-color: #0EA5E9; color: #0EA5E9; }
    .fc-btn-primary { border: none; border-radius: 12px; padding: 12px 22px; font-weight: 800; font-size: .9rem; cursor: pointer; transition: all .18s; }
    .fc-btn-ghost { border: 1px solid var(--border); border-radius: 10px; padding: 9px 16px; background: transparent; font-weight: 600; font-size: .82rem; cursor: pointer; color: var(--text-primary); }
    .fc-btn-ghost:hover { border-color: #0EA5E9; color: #0EA5E9; }
    .fc-preview-wrap { position: sticky; top: 80px; max-height: calc(100vh - 96px); overflow-y: auto; }
    @media (max-width: 900px) {
      .fc-workspace { grid-template-columns: 1fr !important; }
      .fc-preview-wrap { position: static; max-height: none; }
      .fc-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    }
    @media (max-width: 540px) {
      .fc-line-row { grid-template-columns: 1fr 44px 70px 20px !important; }
      .fc-line-row .fc-line-total { display: none; }
      .fc-line-header { grid-template-columns: 1fr 44px 70px 20px !important; }
      .fc-line-header .fc-line-total-h { display: none; }
    }
  `

  /* ── FILTER TABS ── */
  const catCounts = { tous: TEMPLATES.length }
  TEMPLATES.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1 })
  const catFilters = [
    { id: 'tous', label: 'Tous' },
    ...Object.entries(DOC_TYPES).map(([id, d]) => ({ id, label: d.label.split(' / ')[0] }))
  ]
  const filteredTpls = filterCat === 'tous' ? TEMPLATES : TEMPLATES.filter(t => t.category === filterCat)

  return (
    <div className="fc-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px 80px' }}>
      <style>{CSS}</style>
      <SEO title="Facture / Devis Pro — ABAWI" description="Créez vos factures, devis, bons de commande et avoirs professionnels."  image="/og-tools/facture.jpg"/>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900 }}>
            🧾 Facture & Devis Pro
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: 'var(--text-muted)' }}>
            {TEMPLATES.length} templates professionnels · Aperçu temps réel · Export PDF
          </p>
          <div style={{ marginTop: 8 }}>
            <ToolGuardBadge guard={guard} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="fc-btn-ghost" onClick={() => setStep('history')} style={{ position: 'relative' }}>
            📋 Historique
            {history.length > 0 && (
              <span style={{ marginLeft: 6, background: '#0EA5E9', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '.68rem', fontWeight: 800 }}>
                {history.length}
              </span>
            )}
          </button>
          {step === 'form' && (
            <>
              <button className="fc-btn-ghost" onClick={() => setStep('templates')}>← Modèles</button>
              <button className="fc-btn-primary" onClick={exportPDF}
                style={{ background: `linear-gradient(135deg,${t.headerBg},${t.accent}cc)`, color: t.text, border: `1.5px solid ${t.accent}` }}>
                📥 Exporter PDF
              </button>
            </>
          )}
          {step === 'history' && (
            <button className="fc-btn-ghost" onClick={() => setStep('templates')}>← Nouveau document</button>
          )}
        </div>
      </div>

      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) { guard.closeUpsell(); exportPDF() }
        }}
      />

      {/* ── Toast ── */}
      {fcToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#10B981', color: '#fff', padding: '10px 22px', borderRadius: 12,
          fontWeight: 700, fontSize: '.86rem', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,.3)',
        }}>{fcToast}</div>
      )}

      {/* ── STEP: HISTORY ── */}
      {step === 'history' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📋 Historique des documents émis</h2>
            {history.length > 0 && (
              <button className="fc-btn-ghost" style={{ fontSize: '.72rem', color: '#EF4444', borderColor: '#EF4444' }}
                onClick={() => { if (confirm('Vider tout l\'historique ?')) { saveHist([]); setHistory([]) } }}>
                🗑 Vider l&apos;historique
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '.95rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📂</div>
              <p style={{ margin: 0 }}>Aucun document dans l&apos;historique.<br/>Exporter un PDF l&apos;enregistre ici automatiquement.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(record => {
                const dt = DOC_TYPES[record.type] || DOC_TYPES.facture
                const th = THEMES[record.theme] || THEMES.corporate
                const statusColors = { emise: { bg: '#F59E0B20', color: '#F59E0B', label: 'Émise' }, payee: { bg: '#10B98120', color: '#10B981', label: 'Payée ✓' }, annulee: { bg: '#EF444420', color: '#EF4444', label: 'Annulée' } }
                const sc = statusColors[record.status] || statusColors.emise
                return (
                  <div key={record.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                    padding: '14px 16px', display: 'grid',
                    gridTemplateColumns: '8px 1fr auto', gap: '0 14px', alignItems: 'center',
                  }}>
                    {/* Color stripe */}
                    <div style={{ height: '100%', minHeight: 56, background: th.headerBg, borderRadius: 4, gridRow: '1 / span 2' }} />

                    {/* Info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '.88rem' }}>{dt.icon} {record.numero}</span>
                        <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 20, background: dt.color + '18', color: dt.color, border: `1px solid ${dt.color}44` }}>{dt.label}</span>
                        <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 700, cursor: 'pointer', border: `1px solid ${sc.color}40` }}
                          onClick={() => {
                            const next = record.status === 'emise' ? 'payee' : record.status === 'payee' ? 'annulee' : 'emise'
                            updateHistStatus(record.id, next)
                          }} title="Cliquer pour changer le statut">
                          {sc.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        <span>{record.emetteur || '—'}</span>
                        {record.client && <span style={{ margin: '0 6px', opacity: .4 }}>→</span>}
                        {record.client && <span>{record.client}</span>}
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {record.date} · <strong style={{ color: 'var(--text-primary)' }}>{Math.round(record.total || 0).toLocaleString('fr-FR')} {record.currency}</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="fc-btn-ghost" style={{ padding: '5px 10px', fontSize: '.72rem' }}
                        onClick={() => reuseFromHistory(record)} title="Créer un nouveau document avec ce modèle">
                        ↻ Réutiliser
                      </button>
                      <button style={{ padding: '5px 8px', fontSize: '.72rem', background: 'transparent', border: '1px solid #EF444444', color: '#EF4444', borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => deleteHistItem(record.id)}>
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Saved profile summary */}
          {savedProfile && (
            <div style={{ marginTop: 28, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontWeight: 800, fontSize: '.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>💾 Profil émetteur sauvegardé</div>
              <div style={{ fontSize: '.86rem', color: 'var(--text-primary)', fontWeight: 700 }}>{savedProfile.emetteur}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Thème : {THEMES[savedProfile.theme]?.label || savedProfile.theme} · {savedProfile.currency} · Sauvegardé le {new Date(savedProfile.savedAt).toLocaleDateString('fr-FR')}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="fc-btn-ghost" style={{ fontSize: '.75rem', padding: '5px 12px' }}
                  onClick={() => { setStep('form'); setTimeout(applyProfile, 100) }}>
                  ↩ Créer un document avec ce profil
                </button>
                <button style={{ fontSize: '.72rem', padding: '5px 10px', background: 'transparent', border: '1px solid #EF444444', color: '#EF4444', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => { saveProfile(null); setSavedProfile(null); showToast('Profil supprimé') }}>
                  🗑 Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP : TEMPLATES ── */}
      {step === 'templates' && (
        <div>
          {/* Type filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {catFilters.map(c => {
              const cnt = c.id === 'tous' ? TEMPLATES.length : TEMPLATES.filter(t => t.category === c.id).length
              if (c.id !== 'tous' && cnt === 0) return null
              const docInfo = DOC_TYPES[c.id]
              const isActive = filterCat === c.id
              return (
                <button key={c.id} onClick={() => setFilterCat(c.id)} className="fc-pill" style={{
                  borderColor: isActive ? (docInfo?.color || '#0EA5E9') : 'var(--border)',
                  background: isActive ? (docInfo?.color || '#0EA5E9') + '20' : 'transparent',
                  color: isActive ? (docInfo?.color || '#0EA5E9') : 'var(--text-secondary)',
                }}>
                  {docInfo?.icon || '📋'} {c.label} <span style={{ opacity: .6, marginLeft: 4 }}>{cnt}</span>
                </button>
              )
            })}
          </div>

          {/* Template grid */}
          <div className="fc-grid">
            {filteredTpls.map(tpl => {
              const th = THEMES[tpl.theme] || THEMES.corporate
              const dt = DOC_TYPES[tpl.category] || DOC_TYPES.facture
              const isActive = selectedTpl === tpl.id
              return (
                <div key={tpl.id} className={`fc-tpl-card${isActive ? ' active' : ''}`} onClick={() => applyTemplate(tpl)}>
                  {/* Card header — colored */}
                  <div style={{ background: th.headerBg, padding: '16px 14px 12px' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{tpl.icon}</div>
                    <div style={{ color: th.accent, fontWeight: 800, fontSize: '.88rem', lineHeight: 1.2 }}>{tpl.name}</div>
                    <div style={{ color: th.sub, fontSize: '.68rem', marginTop: 3, opacity: .85 }}>{tpl.industry}</div>
                  </div>
                  {/* Card body */}
                  <div style={{ padding: '10px 14px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: dt.color + '18', color: dt.color, fontSize: '.68rem', fontWeight: 700, border: `1px solid ${dt.color}44` }}>
                      {dt.icon} {dt.label}
                    </span>
                    <p style={{ margin: '6px 0 0', fontSize: '.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{tpl.desc}</p>
                  </div>
                  {isActive && (
                    <div style={{ padding: '6px 14px 10px' }}>
                      <span style={{ fontSize: '.72rem', color: '#0EA5E9', fontWeight: 700 }}>✓ Sélectionné</span>
                    </div>
                  )}
                </div>
              )
            })}
            {/* Blank / Custom card */}
            <div className="fc-tpl-card" onClick={() => { setSelectedTpl(null); setStep('form') }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px 14px 12px' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>✨</div>
                <div style={{ color: '#0EA5E9', fontWeight: 800, fontSize: '.88rem' }}>Document vierge</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', marginTop: 3 }}>Partir de zéro</div>
              </div>
              <div style={{ padding: '10px 14px 12px' }}>
                <p style={{ margin: 0, fontSize: '.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Créez votre propre document personnalisé</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP : FORM + PREVIEW ── */}
      {step === 'form' && (
        <div className="fc-workspace" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT: FORM ── */}
          <div>

            {/* Section: Type de document */}
            <div className="fc-section">
              <div className="fc-sec-title">📋 Type de document</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {Object.entries(DOC_TYPES).map(([k, d]) => (
                  <button key={k} onClick={() => { updateMeta('type', k) }} className="fc-pill" style={{
                    borderColor: meta.type === k ? d.color : 'var(--border)',
                    background: meta.type === k ? d.color + '18' : 'transparent',
                    color: meta.type === k ? d.color : 'var(--text-secondary)',
                  }}>{d.icon} {d.label}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="fc-lbl">Numéro</label>
                  <input className="fc-field" value={meta.numero} onChange={e => updateMeta('numero', e.target.value)} />
                </div>
                <div>
                  <label className="fc-lbl">Devise</label>
                  <select className="fc-field" value={currency} onChange={e => setCurrency(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: useEcheance ? '1fr 1fr' : '1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label className="fc-lbl">Date d'émission</label>
                  <input className="fc-field" type="date" value={meta.date} onChange={e => updateMeta('date', e.target.value)} />
                </div>
                {useEcheance ? (
                  <div>
                    <label className="fc-lbl">Échéance</label>
                    <input className="fc-field" type="date" value={meta.echeance} onChange={e => updateMeta('echeance', e.target.value)} />
                  </div>
                ) : (
                  <button className="fc-btn-ghost" style={{ padding: '9px 12px', fontSize: '.75rem' }} onClick={() => setUseEcheance(true)}>+ Échéance</button>
                )}
              </div>
            </div>

            {/* Section: Parties */}
            <div className="fc-section">
              <div className="fc-sec-title" style={{ justifyContent: 'space-between' }}>
                <span>🏢 Émetteur & Client</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {savedProfile && (
                    <button className="fc-btn-ghost" style={{ padding: '4px 10px', fontSize: '.7rem' }} onClick={applyProfile} title={`Profil: ${savedProfile.emetteur}`}>
                      ↩ Utiliser mon profil
                    </button>
                  )}
                  <button className="fc-btn-ghost" style={{ padding: '4px 10px', fontSize: '.7rem' }} onClick={saveAsProfile}>
                    💾 Sauvegarder profil
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                <label className="fc-lbl">Émetteur (votre entreprise)</label>
                <input className="fc-field" value={meta.emetteur} onChange={e => updateMeta('emetteur', e.target.value)} placeholder="Nom / Raison sociale" />
                <textarea className="fc-field" rows={3} style={{ resize: 'vertical' }} value={meta.emetteur_detail} onChange={e => updateMeta('emetteur_detail', e.target.value)} placeholder="Adresse · NINEA · RCCM · Tél · Email" />
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <label className="fc-lbl">{meta.type === 'bon_commande' ? 'Fournisseur' : 'Client / Destinataire'}</label>
                <input className="fc-field" value={meta.client} onChange={e => updateMeta('client', e.target.value)} placeholder="Nom / Raison sociale" />
                <textarea className="fc-field" rows={2} style={{ resize: 'vertical' }} value={meta.client_detail} onChange={e => updateMeta('client_detail', e.target.value)} placeholder="Adresse · Contact · NINEA si applicable" />
              </div>
            </div>

            {/* Section: Lignes */}
            <div className="fc-section">
              <div className="fc-sec-title">📦 Lignes de détail</div>
              {/* Header row */}
              <div className="fc-line-header" style={{ display: 'grid', gridTemplateColumns: '1fr 52px 80px 64px 20px', gap: 6, marginBottom: 6 }}>
                {['Description', 'Qté', 'P.U.', 'Total', ''].map((h, i) => (
                  <span key={i} className={i === 3 ? 'fc-line-total-h' : ''} style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', textAlign: i > 1 ? 'right' : 'left' }}>{h}</span>
                ))}
              </div>
              {lines.map((l, i) => (
                <div key={i} className="fc-line-row" style={{ display: 'grid', gridTemplateColumns: '1fr 52px 80px 64px 20px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input className="fc-field" style={{ padding: '8px 10px' }} value={l.desc} onChange={e => updateLine(i, 'desc', e.target.value)} placeholder="Description" />
                  <input className="fc-field" style={{ padding: '8px 6px', textAlign: 'center' }} type="number" value={l.qty} onChange={e => updateLine(i, 'qty', e.target.value)} />
                  <input className="fc-field" style={{ padding: '8px 8px', textAlign: 'right' }} type="number" value={l.pu} onChange={e => updateLine(i, 'pu', e.target.value)} />
                  <span className="fc-line-total" style={{ fontSize: '.72rem', color: 'var(--text-secondary)', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(Number(l.qty) * Number(l.pu))}
                  </span>
                  <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '.9rem', padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ))}
              <button className="fc-row-add" onClick={addLine}>+ Ajouter une ligne</button>

              {/* Discount */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>Remise globale (%)</span>
                <input className="fc-field" style={{ width: 70, padding: '6px 8px', textAlign: 'center' }} type="number" min={0} max={100} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
              </div>

              {/* Totaux mini */}
              <div style={{ marginTop: 12, background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5, fontSize: '.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Sous-total HT</span><strong>{fmt(totalHT)} {currency}</strong></div>
                {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}><span>Remise ({discount}%)</span><strong>− {fmt(discountAmt)} {currency}</strong></div>}
                <label className="fc-toggle" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <input type="checkbox" checked={useTVA} onChange={e => setUseTVA(e.target.checked)} />
                  <span>TVA</span>
                  {useTVA && <input className="fc-field" style={{ width: 56, padding: '4px 6px', textAlign: 'center', marginLeft: 4 }} type="number" min={0} max={100} value={tvaPct} onChange={e => setTvaPct(Number(e.target.value))} />}
                  {useTVA && <span>%</span>}
                </label>
                {useTVA && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>TVA ({tvaPct}%)</span><strong>{fmt(tva)} {currency}</strong></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, borderTop: `2px solid ${t.accent}`, paddingTop: 8, color: t.accent }}>
                  <span>{useTVA ? 'Total TTC' : 'TOTAL'}</span>
                  <span>{fmt(totalTTC)} {currency}</span>
                </div>
              </div>
            </div>

            {/* Section: Options */}
            <div className="fc-section">
              <div className="fc-sec-title">⚙️ Informations complémentaires</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                {[
                  [useObjet, setUseObjet, 'Objet'],
                  [useConditions, setUseConditions, 'Conditions'],
                  [useMention, setUseMention, 'Mention légale'],
                  [useLogo, setUseLogo, 'Logo entreprise'],
                  [useSignature, setUseSignature, 'Signature'],
                  [useCachet, setUseCachet, 'Cachet'],
                ].map(([val, set, lbl]) => (
                  <label key={lbl} className="fc-toggle">
                    <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
              {useLogo && (
                <div style={{ marginBottom: 10, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <label className="fc-lbl">Logo entreprise (PNG · JPG · SVG)</label>
                  <input className="fc-field" type="file" accept="image/*" onChange={e => readImage(e.target.files[0], setLogoUrl)} style={{ marginBottom: logoUrl ? 8 : 0 }} />
                  {logoUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <img src={logoUrl} alt="logo" style={{ height: 44, maxWidth: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)', padding: 4, background: '#fff' }} />
                      <button onClick={() => setLogoUrl('')} style={{ border: 'none', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: '.8rem' }}>✕ Supprimer</button>
                    </div>
                  )}
                  <p style={{ margin: '6px 0 0', fontSize: '.7rem', color: 'var(--text-muted)' }}>S'affiche dans l'en-tête du document à côté du type.</p>
                </div>
              )}
              {useObjet && (
                <div style={{ marginBottom: 10 }}>
                  <label className="fc-lbl">Objet</label>
                  <input className="fc-field" value={meta.objet} onChange={e => updateMeta('objet', e.target.value)} placeholder="Objet de la prestation ou commande" />
                </div>
              )}
              {useConditions && (
                <div style={{ marginBottom: 10 }}>
                  <label className="fc-lbl">Conditions de paiement</label>
                  <input className="fc-field" value={meta.conditions} onChange={e => updateMeta('conditions', e.target.value)} placeholder="Ex: Paiement à 30 jours / À réception" />
                </div>
              )}
              {useMention && (
                <div style={{ marginBottom: 10 }}>
                  <label className="fc-lbl">Mention légale</label>
                  <textarea className="fc-field" rows={2} style={{ resize: 'vertical' }} value={meta.mention} onChange={e => updateMeta('mention', e.target.value)} />
                </div>
              )}
              {useSignature && (
                <div style={{ marginBottom: 10 }}>
                  <label className="fc-lbl">Signature (image PNG/JPG)</label>
                  <input className="fc-field" type="file" accept="image/*" onChange={e => readImage(e.target.files[0], setSignatureUrl)} />
                  {signatureUrl && <img src={signatureUrl} alt="sig" style={{ maxHeight: 44, marginTop: 6, borderRadius: 4 }} />}
                </div>
              )}
              {useCachet && (
                <div>
                  <label className="fc-lbl">Cachet / Tampon (image PNG/JPG)</label>
                  <input className="fc-field" type="file" accept="image/*" onChange={e => readImage(e.target.files[0], setCachetUrl)} />
                  {cachetUrl && <img src={cachetUrl} alt="cachet" style={{ maxHeight: 44, marginTop: 6, borderRadius: 4 }} />}
                </div>
              )}
            </div>

            {/* Section: Thème */}
            <div className="fc-section">
              <div className="fc-sec-title">🎨 Thème visuel</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {Object.entries(THEMES).map(([k, th]) => (
                  <button key={k} onClick={() => setTheme(k)} style={{
                    padding: '10px 8px', borderRadius: 10, cursor: 'pointer', transition: 'all .18s',
                    border: `2px solid ${theme === k ? th.accent : 'var(--border)'}`,
                    background: theme === k ? th.headerBg : 'var(--bg-card)',
                    color: theme === k ? th.text : 'var(--text-secondary)',
                    fontSize: '.72rem', fontWeight: 700,
                  }}>{th.label}</button>
                ))}
              </div>
            </div>

            {/* Export button */}
            <button className="fc-btn-primary" onClick={exportPDF} style={{
              width: '100%', justifyContent: 'center',
              background: `linear-gradient(135deg, ${t.headerBg} 0%, ${t.accent}80 100%)`,
              color: t.text, border: `2px solid ${t.accent}`,
              boxShadow: `0 6px 20px ${t.accent}40`,
            }}>
              📥 Exporter en PDF
            </button>
          </div>

          {/* ── RIGHT: PREVIEW ── */}
          <div className="fc-preview-wrap">
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📄 Aperçu temps réel</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '.68rem' }}>A4 · {currency}</span>
            </div>

            {/* Document preview */}
            <div id="facture-export" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.22)', overflow: 'hidden', fontSize: '11.5px', lineHeight: 1.5 }}>

              {/* Header band */}
              <div style={{ background: t.headerBg, color: t.text, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {useLogo && logoUrl && (
                    <img src={logoUrl} alt="logo" style={{ height: 52, maxWidth: 110, objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 6px' }} />
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '1.1rem' }}>{docType.icon}</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3, color: t.accent }}>{docType.label}</span>
                    </div>
                    <div style={{ fontSize: '.75rem', color: t.sub, fontWeight: 700, opacity: .9 }}>{meta.emetteur || 'Votre Entreprise'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: t.accent, fontSize: '.85rem' }}>N° {meta.numero}</div>
                  <div style={{ color: t.sub, fontSize: '.72rem', marginTop: 3 }}>Émis le {meta.date}</div>
                  {useEcheance && meta.echeance && (
                    <div style={{ color: t.sub, fontSize: '.72rem', marginTop: 2 }}>Échéance : {meta.echeance}</div>
                  )}
                </div>
              </div>

              {/* Emetteur / Client */}
              <div style={{ padding: '16px 24px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, color: '#222', borderBottom: `3px solid ${t.accent}20` }}>
                {[
                  { label: 'De', name: meta.emetteur, detail: meta.emetteur_detail },
                  { label: meta.type === 'bon_commande' ? 'À' : 'Facturé à', name: meta.client, detail: meta.client_detail },
                ].map((p, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '.6rem', fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 }}>{p.label}</div>
                    <div style={{ fontWeight: 800, color: '#111', fontSize: '.82rem' }}>{p.name || (i === 0 ? 'Votre Entreprise' : '— Client —')}</div>
                    <div style={{ whiteSpace: 'pre-line', color: '#555', fontSize: '.68rem', lineHeight: 1.55, marginTop: 2 }}>{p.detail}</div>
                  </div>
                ))}
              </div>

              {/* Objet */}
              {useObjet && meta.objet && (
                <div style={{ padding: '8px 24px', background: t.accent + '10', borderLeft: `3px solid ${t.accent}`, margin: '0 0 0 0' }}>
                  <span style={{ fontSize: '.65rem', fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 1 }}>Objet : </span>
                  <span style={{ fontSize: '.76rem', color: '#333' }}>{meta.objet}</span>
                </div>
              )}

              {/* Table */}
              <div style={{ padding: '0 12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#222' }}>
                  <thead>
                    <tr style={{ background: t.headerBg }}>
                      {['Description', 'Qté', 'P.U.', 'Total'].map((h, i) => (
                        <th key={h} style={{ padding: '9px 10px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 700, fontSize: '.64rem', textTransform: 'uppercase', letterSpacing: .5, color: t.sub }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e9ecef', background: i % 2 === 0 ? '#fff' : (t.alt || '#f8f9fa') }}>
                        <td style={{ padding: '8px 10px', color: '#222', fontSize: '.76rem' }}>{l.desc || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#555', fontSize: '.73rem' }}>{l.qty}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#555', fontSize: '.73rem' }}>{fmt(Number(l.pu))} {currency}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#222', fontSize: '.76rem' }}>{fmt(Number(l.qty) * Number(l.pu))} {currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 240, fontSize: '.76rem', display: 'flex', flexDirection: 'column', gap: 5, color: '#333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Sous-total HT</span>
                    <strong>{fmt(totalHT)} {currency}</strong>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                      <span>Remise ({discount}%)</span>
                      <strong>− {fmt(discountAmt)} {currency}</strong>
                    </div>
                  )}
                  {(discount > 0 || useTVA) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0e0e0', paddingTop: 5 }}>
                      <span style={{ color: '#666' }}>Total HT</span>
                      <strong>{fmt(baseHT)} {currency}</strong>
                    </div>
                  )}
                  {useTVA && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>TVA ({tvaPct}%)</span>
                      <strong>{fmt(tva)} {currency}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem', fontWeight: 900, borderTop: `2.5px solid ${t.accent}`, paddingTop: 8, color: t.accent }}>
                    <span>{useTVA ? 'Total TTC' : 'TOTAL'}</span>
                    <span>{fmt(totalTTC)} {currency}</span>
                  </div>
                </div>
              </div>

              {/* Conditions + mention */}
              {(useConditions || useMention) && (
                <div style={{ padding: '10px 24px', borderTop: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', gap: 4, background: '#fafafa' }}>
                  {useConditions && meta.conditions && (
                    <div style={{ fontSize: '.68rem', color: '#444', display: 'flex', gap: 6 }}>
                      <span>💳</span><span>{meta.conditions}</span>
                    </div>
                  )}
                  {useMention && meta.mention && (
                    <div style={{ fontSize: '.65rem', color: '#777', fontStyle: 'italic', lineHeight: 1.4 }}>{meta.mention}</div>
                  )}
                </div>
              )}

              {/* Signature + Cachet */}
              {(useSignature || useCachet) && (
                <div style={{ padding: '12px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #dee2e6' }}>
                  {useSignature && (
                    <div>
                      <div style={{ fontSize: '.62rem', color: '#999', marginBottom: 4 }}>Signature autorisée</div>
                      {signatureUrl
                        ? <img src={signatureUrl} alt="sig" style={{ maxHeight: 48, maxWidth: 120 }} />
                        : <div style={{ width: 110, borderBottom: '1px solid #ccc', marginTop: 28, fontSize: '.6rem', color: '#bbb', textAlign: 'center' }}>___________</div>
                      }
                    </div>
                  )}
                  {useCachet && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '.62rem', color: '#999', marginBottom: 4 }}>Cachet / Tampon</div>
                      {cachetUrl
                        ? <img src={cachetUrl} alt="cachet" style={{ maxHeight: 48, maxWidth: 120 }} />
                        : <div style={{ width: 80, height: 48, border: '1px dashed #ccc', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: '#bbb', marginLeft: 'auto' }}>Cachet</div>
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Footer band */}
              <div style={{ background: t.headerBg, padding: '9px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '.62rem', color: t.sub, opacity: .7 }}>{meta.emetteur || ''}</div>
                <div style={{ fontSize: '.62rem', color: t.sub, opacity: .6 }}>{meta.conditions ? '' : meta.date}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
