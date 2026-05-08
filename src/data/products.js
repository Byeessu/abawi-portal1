// Auto-generated from ABAWI DIGITAL scan — 2026-04-07
// Auto-generated catalogue

export function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

export function formatPrix(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

export function waLink(titre, prix) {
  const msg = prix ? 'Bonjour ABAWI, je souhaite commander : ' + titre + ' - ' + formatPrix(prix) : 'Bonjour ABAWI, je souhaite commander : ' + titre
  return 'https://wa.me/221775009740?text=' + encodeURIComponent(msg)
}

export const DIGITAL_CATEGORIES = ['Tous', 'Marketing Digital', 'Business & Stratégie', 'Communication', 'Tech & IA', 'Visa & Dossier Bankable', 'Comptabilité', 'Restauration', 'Emploi']

export const ACADEMY_SERIES = ['Toutes', 'S1', 'S2', 'L2', 'Supérieur', 'Concours']
export const ACADEMY_MATIERES = ['Toutes', 'Maths', 'Physique-Chimie', 'SVT', 'Francais', 'Philosophie', 'Histoire-Geo', 'Anglais']

export const guides = [
  {
    "id": "g1",
    "titre": "Agences Compétentes pour Visa",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/ABAWI_Administration_Agences_Competentes.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g2",
    "titre": "Art de la Communication",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/ART_COMMUNICATION.pdf",
    "drive_url": null,
    "brand": "digital",
    "gratuit": true
  },
  {
    "id": "g3",
    "titre": "Art de la Vente",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/ART_DE_LA_VENTE.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g4",
    "titre": "Art du Réseautage",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/ART_DU_RESEAUTAGE.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g5",
    "titre": "Art Oratoire",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Art_Oratoire_Guide_Elite_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g6",
    "titre": "Vente Expert Avance",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/ART_VENTE_EXPERT.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g7",
    "titre": "Négociation Stratégique",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/AS_NEGOCIATION.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g8",
    "titre": "Automatisation Business",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/AUTOMATISATION_BUSINESS.pdf",
    "drive_url": null,
    "brand": "digital",
    "gratuit": true
  },
  {
    "id": "g9",
    "titre": "Catalogue Informatique 2026",
    "categorie": "Tech & IA",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Catalogue_ABAWI_Informatique_2026.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g10",
    "titre": "Communication Commerciale",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Communication_Commerciale_Guide_Complet_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g11",
    "titre": "Communication de Marque",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Communication_de_Marque_Guide_Complet_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g12",
    "titre": "Communication d'Entreprise",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Communication_Entreprise_Guide_Complet_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g13",
    "titre": "Content Marketing Stratégique",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/CONTENT_MARKETING_STRATEGIQUE.pdf",
    "drive_url": null,
    "brand": "digital",
    "gratuit": true
  },
  {
    "id": "g14",
    "titre": "Devenir Ecrivain",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Devenir_Ecrivain_Guide_Elite_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g15",
    "titre": "Devenir Mentor Stratégique",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Devenir_Mentor_Strategique_Guide_Elite_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g16",
    "titre": "Expert Management",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/EXPERT_MANAGEMENT.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g17",
    "titre": "Gisements Économiques du Sénégal",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Gisements_Économiques_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g18",
    "titre": "10 Projets Porteurs 2026-2027",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_10_Projets_Porteurs_2026_2027.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g19",
    "titre": "7 Erreurs du Dossier Bankable",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_7_Erreurs_Dossier_Bankable.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g20",
    "titre": "Agriculture au Sénégal",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Agriculture_Senegal.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g21",
    "titre": "Modele Financier Pratique",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Application_Modele_Financier.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g22",
    "titre": "Business Plan Complet",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Complet_Business_Plan.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g23",
    "titre": "Comptabilité OHADA Modules 1-3",
    "categorie": "Comptabilité",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Comptabilite_Modules_1-3_ABAWI_Digital.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g24",
    "titre": "Comptabilité OHADA Modules 4-6",
    "categorie": "Comptabilité",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Comptabilite_Modules_4-6_ABAWI_Digital.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g25",
    "titre": "Entrepreneuriat au Sénégal",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Entrepreneuriat_Senegal.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g26",
    "titre": "Collection Complete ABAWI Digital",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Exhaustif_Collection_ABAWI_Digital.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g27",
    "titre": "Facebook Ads Expert",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/GUIDE_EXPERT_FACEBOOK.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g28",
    "titre": "Facebook Marketplace",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Expert_Facebook_Marketplace_ABAWI_V3.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g29",
    "titre": "Instagram Growth Expert",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/GUIDE_EXPERT_INSTAGRAM.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g30",
    "titre": "Instagram Reels Avance",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Expert_Instagram_Reels_ABAWI_V3.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g31",
    "titre": "TikTok Business Expert",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/GUIDE_EXPERT_TIKTOK.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g32",
    "titre": "TikTok Business Avance",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Expert_TikTok_ABAWI_V3.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g33",
    "titre": "WhatsApp Business Expert",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/GUIDE_EXPERT_WHATSAPP.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g34",
    "titre": "WhatsApp Business Avance",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Expert_WhatsApp_Business_ABAWI_V3.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g35",
    "titre": "Financement au Sénégal",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Guide_Financement_Senegal.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g36",
    "titre": "IA pour Entrepreneurs",
    "categorie": "Tech & IA",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_IA_Entrepreneurs_ABAWI_Digital.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g37",
    "titre": "Ils Ont Réussi - Témoignages",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Ils_Ont_Reussi.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g38",
    "titre": "Immobilier au Sénégal",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Immobilier_Senegal.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g39",
    "titre": "Investir dans la Restauration au Sénégal",
    "categorie": "Restauration",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Investir_Restauration_Senegal_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g40",
    "titre": "Mindset Entrepreneur",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/guide_mindset_entrepreneur.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g41",
    "titre": "Secteur Minier au Sénégal",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Minier_Senegal.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g42",
    "titre": "Réseautage & Networking",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/guide_networking_croissance.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g43",
    "titre": "Bien choisir son ordinateur",
    "categorie": "Tech & IA",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/GUIDE_ORDINATEUR_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g44",
    "titre": "Elementor - Créer son site",
    "categorie": "Tech & IA",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Pratique_Elementor_ABAWI_V5.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g45",
    "titre": "Productivité CEO",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/guide_productivite_ceo.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g46",
    "titre": "Programmation Web Niveau 1",
    "categorie": "Tech & IA",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Programmation_Web_App_Niveau1_ABAWI_Digital.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g47",
    "titre": "Programmation Web Niveau 2",
    "categorie": "Tech & IA",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Programmation_Web_App_Niveau2_ABAWI_Digital.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g48",
    "titre": "Sénégal - Opportunites Business",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Senegal_Opportunites_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g49",
    "titre": "Tourisme au Sénégal",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Guide_Ultime_Tourisme_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g50",
    "titre": "Intelligence Économique - Protection & Lobbying",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/INTELLIGENCE_ECON_Veille_Protection_Influence_Lobbying.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g51",
    "titre": "Intelligence Économique - Strategie & Data",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/INTELLIGENCE_ECON_Veille_Stratégie_Data_Decision.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g52",
    "titre": "Intelligence Financière",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/INTELLIGENCE_FINANCIERE.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g53",
    "titre": "Intermédiation au Sénégal",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Investir_Intermediation_Senegal_Guide_Complet_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g54",
    "titre": "Maîtriser l'Exportation",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/MAITRISER_EXPORTATION.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g55",
    "titre": "Maîtriser le B2B",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/MAITRISER_LE_B2B.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g56",
    "titre": "Marketing Agressif",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/MARKETING_AGRESSIF.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g57",
    "titre": "De Zero a Millionnaire Digital",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/MILLIONNAIRE_DIGITAL.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g58",
    "titre": "Partenaires Internationaux",
    "categorie": "Communication",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/PARTENAIRES_INTERNATIONAUX.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g59",
    "titre": "Pret a Partir - Guide Voyageur",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/PRET_A_PARTIR_Guide_Voyageur_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g60",
    "titre": "Quitter la Pauvrete",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/Quitter_Pauvrete_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g61",
    "titre": "Réussir Examens & Concours",
    "categorie": "Emploi",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/Reussir_Examens_Concours_Guide_Candidat_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g62",
    "titre": "Secrets des Digital Marketers",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/SECRETS_DIGITAL_MARKETERS.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g63",
    "titre": "Sénégal-Chine Business",
    "categorie": "Business & Stratégie",
    "prix": 3990,
    "prix_barre": 6000,
    "file_url": "/files/guides/SENEGAL_CHINE_BUSINESS.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g64",
    "titre": "Vente Digital Pro",
    "categorie": "Marketing Digital",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VENTE_DIGITAL_PRO.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g65",
    "titre": "Visa Bankable - Canada",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VISA_BANKABLE_Pack_Canada_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g66",
    "titre": "Visa Bankable - Chine",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VISA_BANKABLE_Pack_Chine_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g67",
    "titre": "Visa Bankable - Emirats",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VISA_BANKABLE_Pack_Emirats_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g68",
    "titre": "Visa Bankable - Portugal",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VISA_BANKABLE_Pack_Portugal_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g69",
    "titre": "Visa Bankable - Schengen",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VISA_BANKABLE_Pack_Schengen_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g70",
    "titre": "Visa Bankable - Royaume-Uni",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VISA_BANKABLE_Pack_UK_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  },
  {
    "id": "g71",
    "titre": "Visa Bankable - USA",
    "categorie": "Visa & Dossier Bankable",
    "prix": 3490,
    "prix_barre": 5000,
    "file_url": "/files/guides/VISA_BANKABLE_Pack_USA_ABAWI.pdf",
    "drive_url": null,
    "brand": "digital"
  }
]

export const fascicules = {
  s1: [
  {
    "id": "fs1_1",
    "titre": "English Bac S1 Ch01 Methodology",
    "matiere": "Anglais",
    "serie": "S1",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_English_Bac_S1_Ch01_Methodology_V2.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_2",
    "titre": "English Bac S1 Ch02 Themes Vocabulary",
    "matiere": "Anglais",
    "serie": "S1",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_English_Bac_S1_Ch02_Themes_Vocabulary_V2.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_3",
    "titre": "English Bac S1 Ch03 Texts Extracts",
    "matiere": "Anglais",
    "serie": "S1",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_English_Bac_S1_Ch03_Texts_Extracts_V2.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_4",
    "titre": "Français Bac S1 Ch01 Méthodologie",
    "matiere": "Français",
    "serie": "S1",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Francais_Bac_S1_Ch01_Methodologie.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_5",
    "titre": "Français Bac S1 Ch02 Aventure Ambiguë",
    "matiere": "Français",
    "serie": "S1",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Francais_Bac_S1_Ch02_Aventure_Ambigue.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_6",
    "titre": "Français Bac S1 Ch03 Enfant Noir",
    "matiere": "Français",
    "serie": "S1",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Francais_Bac_S1_Ch03_Enfant_Noir.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_7",
    "titre": "Français Bac S1 Ch04 Bouts Bois Dieu",
    "matiere": "Français",
    "serie": "S1",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Francais_Bac_S1_Ch04_Bouts_Bois_Dieu.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_8",
    "titre": "Français Bac S1 Ch05 Négritude",
    "matiere": "Français",
    "serie": "S1",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Francais_Bac_S1_Ch05_Negritude.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_9",
    "titre": "HG Bac S1 Ch01 Méthodologie",
    "matiere": "Histoire-Geo",
    "serie": "S1",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_HG_Bac_S1_Ch01_Methodologie.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_10",
    "titre": "HG Bac S1 Ch02 Colonisation Decolonisation",
    "matiere": "Histoire-Geo",
    "serie": "S1",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_HG_Bac_S1_Ch02_Colonisation_Decolonisation.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_11",
    "titre": "HG Bac S1 Ch03 Sénégal Relations Internationales",
    "matiere": "Histoire-Geo",
    "serie": "S1",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_HG_Bac_S1_Ch03_Senegal_Relations_Internationales.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_12",
    "titre": "HG Bac S1 Ch04 Geographie Afrique Sénégal",
    "matiere": "Histoire-Geo",
    "serie": "S1",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_HG_Bac_S1_Ch04_Geographie_Afrique_Senegal.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_13",
    "titre": "HG Bac S1 Ch05 Mondialisation",
    "matiere": "Histoire-Geo",
    "serie": "S1",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_HG_Bac_S1_Ch05_Mondialisation.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_14",
    "titre": "Philo Bac S1 Ch01 La Liberté",
    "matiere": "Philosophie",
    "serie": "S1",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Philo_Bac_S1_Ch01_La_Liberte.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_15",
    "titre": "Philo Bac S1 Ch02 Conscience Inconscient",
    "matiere": "Philosophie",
    "serie": "S1",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Philo_Bac_S1_Ch02_Conscience_Inconscient.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_16",
    "titre": "Philo Bac S1 Ch03 Travail Technique",
    "matiere": "Philosophie",
    "serie": "S1",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Philo_Bac_S1_Ch03_Travail_Technique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_17",
    "titre": "Philo Bac S1 Ch05 Etat Societe",
    "matiere": "Philosophie",
    "serie": "S1",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Philo_Bac_S1_Ch05_Etat_Societe.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_18",
    "titre": "Philo Bac S1 Ch06 Bonheur Morale",
    "matiere": "Philosophie",
    "serie": "S1",
    "chapitre": 6,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_Philo_Bac_S1_Ch06_Bonheur_Morale.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_19",
    "titre": "S1 Ch01 Nombres Complexes",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch01_Nombres_Complexes_FINAL.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_20",
    "titre": "S1 Ch02 Suites Numeriques",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch02_Suites_Numeriques_FINAL.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_21",
    "titre": "S1 Ch03 Fonctions Numeriques",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch03_Fonctions_Numeriques_FINAL.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_22",
    "titre": "S1 Ch04 Fonction Exponentielle",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch04_Fonction_Exponentielle_FINAL.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_23",
    "titre": "S1 Ch05 Logarithme Neperien",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch05_Logarithme_Neperien_FINAL.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_24",
    "titre": "S1 Ch06 Calcul Intégral",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 6,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch06_Calcul Intégral.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_25",
    "titre": "S1 Ch07 Équations Différentielles",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 7,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch07_Équations Différentielles.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_26",
    "titre": "S1 Ch08 Dénombrement & Probabilités",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 8,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch08_Dénombrement & Probabilités.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_27",
    "titre": "S1 Ch09 Arithmétique",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 9,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch09_Arithmétique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_28",
    "titre": "S1 Ch10 Systèmes d'Équations Linéaires",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 10,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch10_Systèmes d'Équations Linéaires.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_29",
    "titre": "S1 Ch11 Le Barycentre",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 11,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch11_Le Barycentre.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_30",
    "titre": "S1 Ch12 Transformations du Plan",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 12,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch12_Transformations du Plan.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_31",
    "titre": "S1 Ch13 ProdVect CourbesParam Coniques",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 13,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch13_ProdVect_CourbesParam_Coniques_FINAL.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs1_32",
    "titre": "S1 Ch14 Geometrie Espace",
    "matiere": "Maths",
    "serie": "S1",
    "chapitre": 14,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s1/ABAWI_S1_Ch14_Geometrie_Espace_FINAL.pdf",
    "drive_url": null,
    "brand": "academy"
  }
],
  s2: [
  {
    "id": "fs2_1",
    "titre": "En Bac S2 Ch01 Reading Comprehension",
    "matiere": "Anglais",
    "serie": "S2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_En_Bac_S2_Ch01_Reading_Comprehension.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_2",
    "titre": "En Bac S2 Ch02 Grammar Tenses",
    "matiere": "Anglais",
    "serie": "S2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_En_Bac_S2_Ch02_Grammar_Tenses.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_3",
    "titre": "En Bac S2 Ch03 Advanced Grammar",
    "matiere": "Anglais",
    "serie": "S2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_En_Bac_S2_Ch03_Advanced_Grammar.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_4",
    "titre": "En Bac S2 Ch04 Vocabulary",
    "matiere": "Anglais",
    "serie": "S2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_En_Bac_S2_Ch04_Vocabulary.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_5",
    "titre": "En Bac S2 Ch05 Writing Skills",
    "matiere": "Anglais",
    "serie": "S2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_En_Bac_S2_Ch05_Writing_Skills.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_6",
    "titre": "Fr Bac S2 Ch01 Dissertation",
    "matiere": "Français",
    "serie": "S2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Fr_Bac_S2_Ch01_Dissertation.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_7",
    "titre": "Fr Bac S2 Ch02 Commentaire Compose",
    "matiere": "Français",
    "serie": "S2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Fr_Bac_S2_Ch02_Commentaire_Compose.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_8",
    "titre": "Fr Bac S2 Ch03 Litterature Africaine",
    "matiere": "Français",
    "serie": "S2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Fr_Bac_S2_Ch03_Litterature_Africaine.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_9",
    "titre": "Fr Bac S2 Ch04 Figures Style",
    "matiere": "Français",
    "serie": "S2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Fr_Bac_S2_Ch04_Figures_Style.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_10",
    "titre": "Fr Bac S2 Ch05 Resume Expression",
    "matiere": "Français",
    "serie": "S2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Fr_Bac_S2_Ch05_Resume_Expression.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_11",
    "titre": "HG Bac S2 Ch01 Guerre Froide",
    "matiere": "Histoire-Geo",
    "serie": "S2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_HG_Bac_S2_Ch01_Guerre_Froide.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_12",
    "titre": "HG Bac S2 Ch02 Monde Apres GF",
    "matiere": "Histoire-Geo",
    "serie": "S2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_HG_Bac_S2_Ch02_Monde_Apres_GF.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_13",
    "titre": "HG Bac S2 Ch03 Grandes Puissances",
    "matiere": "Histoire-Geo",
    "serie": "S2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_HG_Bac_S2_Ch03_Grandes_Puissances.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_14",
    "titre": "HG Bac S2 Ch04 Developpement Inegalites",
    "matiere": "Histoire-Geo",
    "serie": "S2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_HG_Bac_S2_Ch04_Developpement_Inegalites.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_15",
    "titre": "HG Bac S2 Ch05 Espaces Mondiaux",
    "matiere": "Histoire-Geo",
    "serie": "S2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_HG_Bac_S2_Ch05_Espaces_Mondiaux.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_16",
    "titre": "Math Bac S2 Ch01 Suites Numeriques",
    "matiere": "Maths",
    "serie": "S2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Math_Bac_S2_Ch01_Suites_Numeriques.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_17",
    "titre": "Math Bac S2 Ch02 Limites Continuite",
    "matiere": "Maths",
    "serie": "S2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Math_Bac_S2_Ch02_Limites_Continuite.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_18",
    "titre": "Math Bac S2 Ch03 Derivation",
    "matiere": "Maths",
    "serie": "S2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Math_Bac_S2_Ch03_Derivation.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_19",
    "titre": "Math Bac S2 Ch04 Integration",
    "matiere": "Maths",
    "serie": "S2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Math_Bac_S2_Ch04_Integration.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_20",
    "titre": "Math Bac S2 Ch05 Probabilites",
    "matiere": "Maths",
    "serie": "S2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Math_Bac_S2_Ch05_Probabilites.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_21",
    "titre": "Math Bac S2 Ch06 Nombres Complexes",
    "matiere": "Maths",
    "serie": "S2",
    "chapitre": 6,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Math_Bac_S2_Ch06_Nombres_Complexes.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_22",
    "titre": "PC Bac S2 Ch01 Cinematique",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch01_Cinematique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_23",
    "titre": "PC Bac S2 Ch02 Dynamique Newton",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch02_Dynamique_Newton.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_24",
    "titre": "PC Bac S2 Ch03 Travail Energie",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch03_Travail_Energie.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_25",
    "titre": "PC Bac S2 Ch04 Oscillations",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch04_Oscillations.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_26",
    "titre": "PC Bac S2 Ch05 Electrostatique",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch05_Electrostatique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_27",
    "titre": "PC Bac S2 Ch06 Circuits Electriques",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 6,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch06_Circuits_Electriques.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_28",
    "titre": "PC Bac S2 Ch07 Optique",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 7,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch07_Optique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_29",
    "titre": "PC Bac S2 Ch08 Reactions Chimiques",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 8,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch08_Reactions_Chimiques.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_30",
    "titre": "PC Bac S2 Ch09 Oxydoreduction",
    "matiere": "Physique-Chimie",
    "serie": "S2",
    "chapitre": 9,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_PC_Bac_S2_Ch09_Oxydoreduction.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_31",
    "titre": "Philo Bac S2 Ch01 Religion Raison",
    "matiere": "Philosophie",
    "serie": "S2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Philo_Bac_S2_Ch01_Religion_Raison.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_32",
    "titre": "Philo Bac S2 Ch02 Art Esthetique",
    "matiere": "Philosophie",
    "serie": "S2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Philo_Bac_S2_Ch02_Art_Esthetique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_33",
    "titre": "Philo Bac S2 Ch03 Religion Foi",
    "matiere": "Philosophie",
    "serie": "S2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Philo_Bac_S2_Ch03_Religion_Foi.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_34",
    "titre": "Philo Bac S2 Ch04 Droit Justice",
    "matiere": "Philosophie",
    "serie": "S2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Philo_Bac_S2_Ch04_Droit_Justice.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_35",
    "titre": "Philo Bac S2 Ch05 Histoire Nature Humaine",
    "matiere": "Histoire-Geo",
    "serie": "S2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_Philo_Bac_S2_Ch05_Histoire_Nature_Humaine.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_36",
    "titre": "SVT Bac S2 Ch01 Genetique",
    "matiere": "SVT",
    "serie": "S2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_SVT_Bac_S2_Ch01_Genetique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_37",
    "titre": "SVT Bac S2 Ch02 Immunologie",
    "matiere": "SVT",
    "serie": "S2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_SVT_Bac_S2_Ch02_Immunologie.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_38",
    "titre": "SVT Bac S2 Ch03 Neurophysiologie",
    "matiere": "SVT",
    "serie": "S2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_SVT_Bac_S2_Ch03_Neurophysiologie.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_39",
    "titre": "SVT Bac S2 Ch04 Ecologie",
    "matiere": "SVT",
    "serie": "S2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_SVT_Bac_S2_Ch04_Ecologie.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fs2_40",
    "titre": "SVT Bac S2 Ch05 Geologie",
    "matiere": "SVT",
    "serie": "S2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/s2/ABAWI_SVT_Bac_S2_Ch05_Geologie.pdf",
    "drive_url": null,
    "brand": "academy"
  }
],
  l2: [
  {
    "id": "fl2_1",
    "titre": "Academy Anglais L2 Ch01",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch01.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_2",
    "titre": "Academy Anglais L2 Ch02",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch02.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_3",
    "titre": "Academy Anglais L2 Ch03",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch03.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_4",
    "titre": "Academy Anglais L2 Ch04",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch04.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_5",
    "titre": "Academy Anglais L2 Ch05",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch05.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_6",
    "titre": "Academy Anglais L2 Ch06",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 6,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch06.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_7",
    "titre": "Academy Anglais L2 Ch07",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 7,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch07.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_8",
    "titre": "Academy Anglais L2 Ch08",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 8,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch08.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_9",
    "titre": "Academy Anglais L2 Ch09",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 9,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch09.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_10",
    "titre": "Academy Anglais L2 Ch10",
    "matiere": "Anglais",
    "serie": "L2",
    "chapitre": 10,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Anglais_L2_Ch10.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_11",
    "titre": "Academy Maths L2 Ch01",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch01.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_12",
    "titre": "Academy Maths L2 Ch02",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch02.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_13",
    "titre": "Academy Maths L2 Ch03",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch03.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_14",
    "titre": "Academy Maths L2 Ch04",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch04.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_15",
    "titre": "Academy Maths L2 Ch05",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch05.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_16",
    "titre": "Academy Maths L2 Ch06",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 6,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch06.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_17",
    "titre": "Academy Maths L2 Ch07",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 7,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch07.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_18",
    "titre": "Academy Maths L2 Ch08",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 8,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch08.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_19",
    "titre": "Academy Maths L2 Ch09",
    "matiere": "Maths",
    "serie": "L2",
    "chapitre": 9,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Academy_Maths_L2_Ch09.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_20",
    "titre": "Fr Bac L2 Ch01 Dissertation",
    "matiere": "Français",
    "serie": "L2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Fr_Bac_L2_Ch01_Dissertation.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_21",
    "titre": "Fr Bac L2 Ch02 Commentaire",
    "matiere": "Français",
    "serie": "L2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Fr_Bac_L2_Ch02_Commentaire.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_22",
    "titre": "Fr Bac L2 Ch03 Classique",
    "matiere": "Français",
    "serie": "L2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Fr_Bac_L2_Ch03_Classique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_23",
    "titre": "Fr Bac L2 Ch04 Afrique",
    "matiere": "Français",
    "serie": "L2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Fr_Bac_L2_Ch04_Afrique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_24",
    "titre": "Fr Bac L2 Ch05 Poesie",
    "matiere": "Français",
    "serie": "L2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Fr_Bac_L2_Ch05_Poesie.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_25",
    "titre": "HG Bac L2 Ch01 GuerreFroide",
    "matiere": "Histoire-Geo",
    "serie": "L2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_HG_Bac_L2_Ch01_GuerreFroide.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_26",
    "titre": "HG Bac L2 Ch02 Decolonisation",
    "matiere": "Histoire-Geo",
    "serie": "L2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_HG_Bac_L2_Ch02_Decolonisation.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_27",
    "titre": "HG Bac L2 Ch03 Afrique",
    "matiere": "Histoire-Geo",
    "serie": "L2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_HG_Bac_L2_Ch03_Afrique.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_28",
    "titre": "HG Bac L2 Ch04 Mondialisation",
    "matiere": "Histoire-Geo",
    "serie": "L2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_HG_Bac_L2_Ch04_Mondialisation.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_29",
    "titre": "Phi Bac L2 Ch01 Connaissance",
    "matiere": "Philosophie",
    "serie": "L2",
    "chapitre": 1,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Phi_Bac_L2_Ch01_Connaissance.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_30",
    "titre": "Phi Bac L2 Ch02 Liberté",
    "matiere": "Philosophie",
    "serie": "L2",
    "chapitre": 2,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Phi_Bac_L2_Ch02_Liberte.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_31",
    "titre": "Phi Bac L2 Ch03 Morale",
    "matiere": "Philosophie",
    "serie": "L2",
    "chapitre": 3,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Phi_Bac_L2_Ch03_Morale.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_32",
    "titre": "Phi Bac L2 Ch04 Raison",
    "matiere": "Philosophie",
    "serie": "L2",
    "chapitre": 4,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Phi_Bac_L2_Ch04_Raison.pdf",
    "drive_url": null,
    "brand": "academy"
  },
  {
    "id": "fl2_33",
    "titre": "Phi Bac L2 Ch05 Culture",
    "matiere": "Philosophie",
    "serie": "L2",
    "chapitre": 5,
    "prix": 990,
    "prix_barre": 2000,
    "file_url": "/files/fascicules/l2/ABAWI_Phi_Bac_L2_Ch05_Culture.pdf",
    "drive_url": null,
    "brand": "academy"
  }
],
}

export const allFascicules = [...fascicules.s1, ...fascicules.s2, ...fascicules.l2]

export const podcasts = [
  {
    "id": "pod-bienvenue",
    "titre": "Bienvenue chez ABAWI — Le message qui change tout",
    "serie": "ABAWI Spécial",
    "audio_url": "/files/podcasts/bienvenue-abawi.mp3",
    "premium": false,
    "featured": true
  },
  {
    "id": "pod1",
    "titre": "3 millions mensuels en automatique sur WhatsApp",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod2",
    "titre": "ABIOGREEN rentabilise les fruits pourris de Casamance",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod3",
    "titre": "Arkel Up et l inclusion numerique a Dakar",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod4",
    "titre": "Bien choisir et faire durer son ordinateur",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod5",
    "titre": "Blocus d Ormuz et revolution des coupe-faim",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod6",
    "titre": "Bâtir sa boutique Elementor pro sans code",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod7",
    "titre": "Bâtir sa liberte financière au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod8",
    "titre": "Bâtir un business rentable au Sénégal",
    "serie": "Business & Digital",
    "audio_url": "/files/podcasts/batir-business-senegal.mp3",
    "premium": false,
    "gratuit": true
  },
  {
    "id": "pod9",
    "titre": "Bâtir une marque forte au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod10",
    "titre": "Communication Le charisme est une discipline de fer",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod11",
    "titre": "Content Marketing Vendre sans publicite grace au contenu",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod12",
    "titre": "Devenir un aimant a opportunites LinkedIn",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod13",
    "titre": "Decrocher des contrats B2B complexes",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod14",
    "titre": "Emploi Battre les algorithmes du recrutement en 2026",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod15",
    "titre": "Gagner quatre heures par jour avec WhatsApp",
    "serie": "Business & Digital",
    "audio_url": "/files/podcasts/gagner-4h-whatsapp.mp3",
    "premium": false,
    "gratuit": true
  },
  {
    "id": "pod16",
    "titre": "L IA pour les entrepreneurs au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod17",
    "titre": "L independance par le code au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod18",
    "titre": "L intelligence economique pour dominer son marche",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod19",
    "titre": "L intermediation le business rentable au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod20",
    "titre": "L or cache dans les rues senegalaises",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod21",
    "titre": "L eloquence humaine face aux algorithmes",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod22",
    "titre": "Le Sénégal entre terre et beton",
    "serie": "Business & Digital",
    "audio_url": "/files/podcasts/senegal-terre-beton.mp3",
    "premium": false
  },
  {
    "id": "pod23",
    "titre": "Les secrets d un visa canadien accepte",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod24",
    "titre": "Les secrets de la neurovente au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod25",
    "titre": "Mandset L esprit precede toujours les chiffres",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod26",
    "titre": "Maîtriser le recrutement moderne",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod27",
    "titre": "Maîtriser la science du mentorat stratégique",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod28",
    "titre": "Maîtriser sa communication d entreprise en Afrique",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod29",
    "titre": "Négocier avec Harvard et le FBI",
    "serie": "Business & Digital",
    "audio_url": "/files/podcasts/negocier-harvard-fbi.mp3",
    "premium": false
  },
  {
    "id": "pod30",
    "titre": "Pourquoi 90 des visas chinois echouent",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod31",
    "titre": "Pourquoi vos mots ne pesent que 7",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod32",
    "titre": "Réussir sa PME et viser l or",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod33",
    "titre": "Réussir son business Chine d importation Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod34",
    "titre": "Réussir son dossier de visa international",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod35",
    "titre": "Réussir son dossier de visa emirati",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod36",
    "titre": "Réussir son depart du Sénégal sans imprevus",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod37",
    "titre": "Réussir son financement bancaire au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod38",
    "titre": "Réussir son management au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod39",
    "titre": "Réussir son restaurant au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod40",
    "titre": "Réussir son visa entrepreneur au Portugal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod41",
    "titre": "S enrichir au Sénégal avec 500 francs",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod42",
    "titre": "Signer des contrats mondiaux depuis l Afrique",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod43",
    "titre": "Sénégal 2026 petrole gaz et Mobile Money",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod44",
    "titre": "Tourisme L économie de la Teranga au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod45",
    "titre": "Transformer son cerveau en machine a reussir",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod46",
    "titre": "Vendre au Sénégal entre Teranga et digital",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod47",
    "titre": "Vendre au cerveau plutot qu a la logique",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod48",
    "titre": "Vendre des PDF pour 3 millions mensuels",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod49",
    "titre": "Vendre en ligne sans site internet",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod50",
    "titre": "Vendre son karite trente fois plus cher",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod51",
    "titre": "Vendre sur Meta sans site internet",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod52",
    "titre": "Vendre sur WhatsApp Business au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod53",
    "titre": "Visa Schengen l argent ne suffit pas",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod54",
    "titre": "Visa luxembourgeois L algorithme",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod55",
    "titre": "le marketing agressif Ecraser les geants",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod56",
    "titre": "visa americain Pourquoi l ambassade refuse",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod57",
    "titre": "visa britannique Comment dejouer l algorithme",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod58",
    "titre": "Lancer son business avec 50000 francs CFA",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod59",
    "titre": "Le business invisible au Sénégal",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod60",
    "titre": "Mindset africain forge par la contrainte",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod61",
    "titre": "Négocier avec les methodes Harvard et FBI",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod62",
    "titre": "Guide Productive CEO Six heures pour diriger",
    "serie": "Business & Digital",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod63",
    "titre": "Jesus Seigneur la subversion des empires",
    "serie": "Souffle Kairos",
    "audio_url": null,
    "premium": false
  },
  {
    "id": "pod64",
    "titre": "L architecture reelle du combat spirituel",
    "serie": "Souffle Kairos",
    "audio_url": null,
    "premium": false
  },
  {
    "id": "pod65",
    "titre": "L anglais au Bac S1 facon ingenierie",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod66",
    "titre": "Bac S1 Français Ch3 L Enfant noir",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod67",
    "titre": "Du tripalium a l intelligence artificielle Le travail",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod68",
    "titre": "L Etat du Leviathan au modele senegalais",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod69",
    "titre": "La verite de Platon aux algorithmes",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod70",
    "titre": "La verite n est pas une certitude",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod71",
    "titre": "Le bonheur entre philosophie et sagesse",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod72",
    "titre": "Sommes nous responsables de notre inconscient",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod73",
    "titre": "Sommes nous vraiment libres de nos choix",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod74",
    "titre": "Art Esthetique De l urinoir aux masques africains",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod75",
    "titre": "La loi n est pas la justice",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod76",
    "titre": "La tension entre religion et raison",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod77",
    "titre": "La cinematique du point materiel",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod78",
    "titre": "Newton au marche de Sandaga",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  },
  {
    "id": "pod79",
    "titre": "Pourquoi tout bouge selon Newton",
    "serie": "Éducatif",
    "audio_url": null,
    "premium": true
  }
]

export const digitalPacks = [
  { id:'pd1', nom:'Pack Essentiel', emoji:'\u{1F949}', prix:9900, prix_barre:22500, economie_pct:56, contenu:['12 guides marketing & reseaux sociaux'] },
  { id:'pd2', nom:'Pack Premium', emoji:'\u{1F948}', prix:24900, prix_barre:67500, economie_pct:63, badge:'BEST SELLER', highlight:true, contenu:['Tout le Pack Essentiel','+ Business, Communication, Strategie'] },
  { id:'pd3', nom:'Pack Excellence', emoji:'\u{1F947}', prix:49900, prix_barre:150000, economie_pct:67, badge:'PREMIUM', contenu:['Plus de 70 guides — Achat unique','Tout le Pack Premium + Tech, IA, Visa, Bankable'] },
  { id:'pd4', nom:'ABAWI+', emoji:'\u{1F49A}', prix:4900, prix_barre:222500, economie_pct:97, badge:'VIP ILLIMITE', contenu:['ACCÈS ILLIMITÉ à TOUT le catalogue','Guides + Academy + Podcasts + Templates + Futurs contenus'] },
]

export const academyPacks = [
  { id:'pa1', nom:'Pack S1 Complet', prix:14990, prix_barre:32000, economie_pct:53, badge:'S1', description:'Toutes les matieres Bac S1 — 32 fascicules' },
  { id:'pa2', nom:'Pack S2 Complet', prix:14990, prix_barre:40000, economie_pct:63, badge:'S2', description:'Toutes les matieres Bac S2 — 40 fascicules' },
  { id:'pa3', nom:'Pack L2 Complet', prix:11990, prix_barre:33000, economie_pct:64, badge:'L2', description:'Toutes les matieres Bac L2 — 33 fascicules' },
  { id:'pa4', nom:'Pack BAC TOTAL', prix:34990, prix_barre:105000, economie_pct:67, badge:'PACK ULTIME', description:'S1 + S2 + L2 — 105 fascicules' },
]
