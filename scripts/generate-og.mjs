/**
 * generate-og.mjs
 * Generates 1200×630 OG banner images for every ABAWI route.
 * Run: node scripts/generate-og.mjs
 *
 * Each banner is unique: tool-specific color, name, tagline, URL.
 * No font dependencies — uses SVG with system sans-serif.
 */

import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dir, '../public/og')
mkdirSync(OUT, { recursive: true })

// ─── Tool + page definitions ────────────────────────────────────────────────

const PAGES = [
  // === Racine ===
  { slug: 'home',           color: '#18A84A', name: 'ABAWI',                 tag: 'Portail Premium',      line1: 'Guides Premium · Outils IA',          line2: 'Académie Business pour l\'Afrique',   url: 'abawi.app' },

  // === Sections principales ===
  { slug: 'news',           color: '#38BDF8', name: 'Actualités ABAWI',       tag: 'Économie & Business',  line1: 'Toute l\'actualité économique,',       line2: 'business et tech pour l\'Afrique',    url: 'abawi.app/news' },
  { slug: 'digital',        color: '#A855F7', name: 'ABAWI Digital',          tag: 'Guides Premium',       line1: 'Guides business premium :',            line2: 'finance, entrepreneuriat, OHADA',     url: 'abawi.app/digital' },
  { slug: 'academy',        color: '#F59E0B', name: 'Académie ABAWI',         tag: 'Formation Bac',        line1: 'Préparez votre Bac avec',             line2: 'les meilleurs fascicules Sénégal',    url: 'abawi.app/academy' },
  { slug: 'store',          color: '#10B981', name: 'ABAWI Store',            tag: 'Boutique',             line1: 'Templates, guides, formations',        line2: 'et ressources business premium',      url: 'abawi.app/store' },
  { slug: 'boutique-sante', color: '#EC4899', name: 'Abavie Boutique Santé',  tag: 'Santé',                line1: 'Matériel médical & tenues',           line2: 'professionnelles au Sénégal',         url: 'abawi.app/boutique-sante' },
  { slug: 'plans',          color: '#F0B429', name: 'ABAWI Premium',          tag: 'Abonnements',          line1: 'Accès illimité aux guides,',          line2: 'outils IA et académie',               url: 'abawi.app/plans' },
  { slug: 'podcasts',       color: '#8B5CF6', name: 'Podcasts ABAWI',         tag: 'Audio',                line1: 'Business, stratégie et',              line2: 'entrepreneuriat en Afrique',          url: 'abawi.app/podcasts' },
  { slug: 'a-propos',       color: '#18A84A', name: 'À Propos — ABAWI',       tag: 'Notre Mission',        line1: 'Démocratiser l\'excellence',          line2: 'business pour l\'Afrique',            url: 'abawi.app/a-propos' },

  // === Outils liste ===
  { slug: 'outils',         color: '#6366F1', name: 'Outils ABAWI',           tag: '30+ Applications',     line1: 'CV, factures, business plan,',        line2: 'studio IA, emploi et bien plus',      url: 'abawi.app/outils' },

  // === Outils Professionnels ===
  { slug: 'cv',             color: '#6366F1', name: 'CV Creator',             tag: 'Emploi & Carrière',    line1: 'Créez votre CV professionnel',        line2: 'en 5 minutes — 20+ templates',        url: 'abawi.app/outils/cv' },
  { slug: 'lettre',         color: '#3B82F6', name: 'Lettre de Motivation',   tag: 'Emploi & Carrière',    line1: 'Rédigez votre lettre avec l\'IA',     line2: 'adaptée au marché africain',          url: 'abawi.app/outils/lettre' },
  { slug: 'business-plan',  color: '#18A84A', name: 'Business Plan Elite',    tag: 'Entrepreneuriat',      line1: 'Plan d\'affaires complet et',         line2: 'bankable — SYSCOHADA / OHADA',        url: 'abawi.app/outils/business-plan' },
  { slug: 'pitch',          color: '#8B5CF6', name: 'Pitch Deck Elite',       tag: 'Investisseurs',        line1: 'Présentations investisseurs',         line2: 'de qualité supérieure',               url: 'abawi.app/outils/pitch' },
  { slug: 'facture',        color: '#F0B429', name: 'Facture Creator',        tag: 'Documents Pro',        line1: '50+ templates : factures,',           line2: 'devis, bons de commande',             url: 'abawi.app/outils/facture' },
  { slug: 'analyse-cv',     color: '#06B6D4', name: 'Analyse CV IA',          tag: 'IA & Emploi',          line1: 'Score ATS & recommandations',         line2: 'pour optimiser votre CV',             url: 'abawi.app/outils/analyse-cv' },
  { slug: 'finance',        color: '#10B981', name: 'Finance Elite',          tag: 'Gestion Financière',   line1: 'Tableaux de bord, projections',       line2: 'et rentabilité pour PME',             url: 'abawi.app/outils/finance' },
  { slug: 'juridique',      color: '#3B82F6', name: 'Juridique Elite',        tag: 'Droit OHADA',          line1: 'Contrats, CGV, statuts',              line2: 'conformes OHADA & droit sénégalais',  url: 'abawi.app/outils/juridique' },
  { slug: 'comptable',      color: '#0EA5E9', name: 'Comptable Elite',        tag: 'SYSCOHADA',            line1: 'Bilan, compte de résultat',           line2: 'et déclarations fiscales Sénégal',    url: 'abawi.app/outils/comptable' },
  { slug: 'rh',             color: '#EC4899', name: 'RH Elite',               tag: 'Ressources Humaines',  line1: 'Paie, contrats, bulletins',           line2: 'code du travail sénégalais',          url: 'abawi.app/outils/rh' },
  { slug: 'immobilier',     color: '#F59E0B', name: 'Immobilier Elite',       tag: 'Immobilier',           line1: 'Estimation, vente, location',         line2: 'contrats notariaux Sénégal',          url: 'abawi.app/outils/immobilier' },
  { slug: 'consultant',     color: '#A855F7', name: 'Consultant Elite',       tag: 'Consulting',           line1: 'Propositions commerciales,',          line2: 'rapports et plans d\'action pro',     url: 'abawi.app/outils/consultant' },

  // === Outils Créatifs ===
  { slug: 'infographie-pro',    color: '#F97316', name: 'Infographie Pro',        tag: 'Création Visuelle',    line1: '100+ templates infographiques,',      line2: 'export HD pour réseaux sociaux',      url: 'abawi.app/outils/infographie-pro' },
  { slug: 'photo-studio-pro',   color: '#14B8A6', name: 'Photo Studio Pro',       tag: 'Studio Photo',         line1: 'Suppression de fond IA,',             line2: 'photos ID conformes, retouche HD',    url: 'abawi.app/outils/photo-studio-pro' },
  { slug: 'audio-studio-elite', color: '#DB2777', name: 'Audio Studio Elite',     tag: 'Production Audio',     line1: 'Enregistrement, effets,',             line2: 'export MP3, transcription Whisper',   url: 'abawi.app/outils/audio-studio-elite' },
  { slug: 'studio-visuel-pro',  color: '#EF4444', name: 'Studio Visuel Pro',      tag: 'Création Graphique',   line1: 'Bannières, posts réseaux sociaux,',   line2: '22 templates export PNG/JPEG',        url: 'abawi.app/outils/studio-visuel-pro' },
  { slug: 'image-pro',          color: '#60A5FA', name: 'Image Pro',              tag: 'Retouche IA',          line1: 'Filtres, redimensionnement,',         line2: 'suppression de fond IA avancée',      url: 'abawi.app/outils/image-pro' },
  { slug: 'qr-code-pro',        color: '#1E293B', name: 'QR Code Pro',            tag: 'Génération QR',        line1: 'QR codes personnalisés : logo,',      line2: 'couleurs, vCards, paiements',         url: 'abawi.app/outils/qr-code-pro' },
  { slug: 'pro-card-elite',     color: '#D97706', name: 'Pro Card Elite',         tag: 'Carte Numérique',      line1: 'Carte de visite numérique',           line2: 'design premium, partage QR code',     url: 'abawi.app/outils/pro-card-elite' },
  { slug: 'format-converter',   color: '#64748B', name: 'Format Converter',       tag: 'Conversion',           line1: 'Convertissez PDF, images,',           line2: 'audio et documents en ligne',         url: 'abawi.app/outils/format-converter' },

  // === Outils Linguistiques ===
  { slug: 'dictionnaire-elite', color: '#7C3AED', name: 'Dictionnaire Elite',     tag: 'Langue & Terminologie',line1: 'Français, terminologie juridique,',    line2: 'économique et langues africaines',    url: 'abawi.app/outils/dictionnaire-elite' },
  { slug: 'translator-elite',   color: '#2563EB', name: 'Translator Elite',       tag: 'Traduction IA',        line1: 'Traduction haute précision :',        line2: '50+ langues + langues africaines',    url: 'abawi.app/outils/translator-elite' },

  // === Outils IA ===
  { slug: 'abawi-ia',           color: '#8B5CF6', name: 'ABAWI IA',               tag: 'Intelligence Artificielle', line1: 'Assistant IA africain tout-en-un :', line2: 'recherches, analyses, conseils',     url: 'abawi.app/outils/abawi-ia' },
  { slug: 'exegetika',          color: '#DC2626', name: 'ABAWI Exégetika',        tag: 'Analyse IA',           line1: 'Analysez et décryptez tout document,', line2: 'rapport ou texte complexe',          url: 'abawi.app/outils/exegetika' },

  // === Santé ===
  { slug: 'sante',              color: '#16A34A', name: 'Abavie Santé',           tag: 'Santé Sénégal',        line1: 'Hôpitaux, cliniques, pharmacies',     line2: 'carte interactive & IA santé',        url: 'abawi.app/outils/sante' },
  { slug: 'abavie',             color: '#16A34A', name: 'Abavie',                 tag: 'Santé & Bien-être',    line1: 'Trouvez médecin, pharmacie,',         line2: 'hôpital au Sénégal — carte live',     url: 'abawi.app/abavie' },

  // === Géo & Local ===
  { slug: 'abspacegps',         color: '#0284C7', name: 'AbSpace GPS',            tag: 'Géolocalisation',      line1: 'Localisez-vous précisément,',         line2: 'analyse IA de zone en temps réel',    url: 'abawi.app/outils/abspacegps' },
  { slug: 'abzone',             color: '#15803D', name: 'AbZone',                 tag: 'Forum Local',          line1: 'Forum communautaire par zone,',       line2: 'informations locales Sénégal',        url: 'abawi.app/outils/abzone' },

  // === Business & Communauté ===
  { slug: 'maxavis',            color: '#EA580C', name: 'MaxAvis Elite',          tag: 'Sondages & Avis',      line1: 'Sondages professionnels,',            line2: 'avis clients et visualisations',      url: 'abawi.app/outils/maxavis' },
  { slug: 'tontine',            color: '#059669', name: 'Tontine ABAWI',          tag: 'Épargne Collective',   line1: 'Gérez votre tontine : cotisations,',  line2: 'tour de table, notifications',        url: 'abawi.app/outils/tontine' },
  { slug: 'autoroute',          color: '#B91C1C', name: 'ABAWI AutoRoute',        tag: 'Navigation',           line1: 'Itinéraires, distances, temps',       line2: 'et points d\'intérêt au Sénégal',     url: 'abawi.app/outils/autoroute' },
  { slug: 'editeur-pro',        color: '#1D4ED8', name: 'Éditeur Pro',            tag: 'Traitement de Texte',  line1: 'Formatage avancé, modèles,',          line2: 'export PDF et Word — sans logiciel',  url: 'abawi.app/outils/editeur-pro' },
  { slug: 'smart-word-editor',  color: '#0369A1', name: 'Smart Word Editor',      tag: 'Rédaction IA',         line1: 'Rédigez avec l\'IA intégrée,',        line2: 'modèles et export multi-formats',     url: 'abawi.app/outils/smart-word-editor' },
  { slug: 'smart-office',       color: '#1E40AF', name: 'Smart Office',           tag: 'Suite Cloud',          line1: 'Documents, tableurs, présentations,', line2: 'collaboration en temps réel',         url: 'abawi.app/outils/smart-office' },

  // === Emploi & RH ===
  { slug: 'recrute-moi-sn',     color: '#2563EB', name: 'Recrute-moi SN',         tag: 'Emploi Sénégal',       line1: 'CDI, CDD, freelance, stages',         line2: 'postulez directement',                url: 'abawi.app/outils/recrute-moi-sn' },
  { slug: 'place-ouvrier',      color: '#C2410C', name: 'Place Ouvrier',          tag: 'Artisans & Ouvriers',  line1: 'Maçon, plombier, électricien,',       line2: 'menuisier — vérifiés et géolocalisés', url: 'abawi.app/outils/place-ouvrier' },
  { slug: 'espace-ouvrier',     color: '#0891B2', name: 'Espace Ouvrier',         tag: 'Profil Professionnel', line1: 'Publiez votre profil d\'ouvrier',     line2: 'et trouvez des chantiers Sénégal',    url: 'abawi.app/outils/espace-ouvrier' },

  // === ABAWI 360 ===
  { slug: 'abawi360',           color: '#F0B429', name: 'ABAWI 360',              tag: 'ERP Africain',         line1: 'CRM, comptabilité, RH, marketing,',   line2: 'planification pour PME africaines',   url: 'abawi.app/abawi360' },
  { slug: 'abawi360-crm',       color: '#D97706', name: 'CRM ABAWI 360',          tag: 'CRM & Ventes',         line1: 'Clients, prospects, pipeline',         line2: 'suivi et relances en temps réel',     url: 'abawi.app/abawi360/crm' },
  { slug: 'abawi360-planif',    color: '#B45309', name: 'Planification 360',      tag: 'Gestion de Projets',   line1: 'Tâches, jalons, équipes',             line2: 'et rapports d\'avancement',           url: 'abawi.app/abawi360/planification' },
  { slug: 'abawi360-stats',     color: '#92400E', name: 'Statistiques 360',       tag: 'KPIs & Tableaux',      line1: 'Ventes, revenus, clients,',           line2: 'performance — tableaux de bord live', url: 'abawi.app/abawi360/statistiques' },
  { slug: 'abawi360-mktg',      color: '#A16207', name: 'Marketing 360',          tag: 'Campagnes Marketing',  line1: 'Emails, SMS, réseaux sociaux',        line2: 'et analytics pour PME africaines',    url: 'abawi.app/abawi360/marketing' },

  // === Produits & Services ===
  { slug: 'abawi-pay',          color: '#16A34A', name: 'ABAWI Pay',              tag: 'Paiement Mobile',      line1: 'Orange Money, Wave, Free Money',      line2: 'intégration simple et sécurisée',     url: 'abawi.app/abawi-pay' },
  { slug: 'abawi-bank',         color: '#0F766E', name: 'ABAWI Bank',             tag: 'Fintech',              line1: 'Épargne, transferts, microfinance',   line2: 'et gestion financière digitale',      url: 'abawi.app/abawi-bank' },
  { slug: 'arkel-up-center',    color: '#6D28D9', name: 'ArkelUp Center',         tag: 'Informatique',         line1: 'HP, Dell, Lenovo, Canon —',           line2: 'livraison, installation et SAV',      url: 'abawi.app/arkel-up-center' },
  { slug: 'abtalk',             color: '#38BDF8', name: 'AbTalk',                 tag: 'Messagerie',           line1: 'Discussions sécurisées, appels,',     line2: 'partage de fichiers & IA intégrée',   url: 'abawi.app/abtalk' },
]

// ─── SVG banner generator ────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function buildSVG(page) {
  const c = page.color
  const { r, g, b } = hexToRgb(c)

  // Dark background for qr-code-pro (which has a dark color)
  const bg1 = '#080E18'
  const bg2 = '#0C1522'

  const name  = esc(page.name)
  const tag   = esc(page.tag)
  const line1 = esc(page.line1)
  const line2 = esc(page.line2)
  const url   = esc(page.url)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <!-- Accent gradient (horizontal) -->
    <linearGradient id="accH" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </linearGradient>
    <!-- Right glow -->
    <radialGradient id="glow" cx="85%" cy="50%" r="45%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
    <!-- Left glow -->
    <radialGradient id="lglow" cx="5%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
    <!-- Noise filter for grain texture -->
    <filter id="noise" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended"/>
      <feComposite in="blended" in2="SourceGraphic" operator="in"/>
    </filter>
    <!-- Clip path for inner content -->
    <clipPath id="card">
      <rect width="1200" height="630" rx="0"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Right glow -->
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Left glow -->
  <rect width="1200" height="630" fill="url(#lglow)"/>

  <!-- Subtle grain (low opacity) -->
  <rect width="1200" height="630" fill="rgba(${r},${g},${b},0.03)" filter="url(#noise)" opacity="0.35"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="7" height="630" fill="${c}"/>

  <!-- Top accent line -->
  <rect x="7" y="0" width="1193" height="1" fill="${c}" opacity="0.25"/>

  <!-- Bottom accent gradient -->
  <rect x="7" y="629" width="1193" height="1" fill="${c}" opacity="0.18"/>

  <!-- Decorative circles (right) -->
  <circle cx="1050" cy="315" r="240" fill="${c}" opacity="0.04"/>
  <circle cx="1050" cy="315" r="170" fill="${c}" opacity="0.05"/>
  <circle cx="1050" cy="315" r="100" fill="${c}" opacity="0.08"/>
  <circle cx="1050" cy="315" r="48" fill="${c}" opacity="0.14"/>

  <!-- Ring outline -->
  <circle cx="1050" cy="315" r="220" fill="none" stroke="${c}" stroke-width="1" opacity="0.15"/>
  <circle cx="1050" cy="315" r="150" fill="none" stroke="${c}" stroke-width="1" opacity="0.12"/>

  <!-- Dot grid (subtle, top-right) -->
  <g opacity="0.06">
    ${Array.from({length:8}, (_, row) =>
      Array.from({length:8}, (_, col) =>
        `<circle cx="${850 + col*30}" cy="${60 + row*30}" r="1.5" fill="${c}"/>`
      ).join('')
    ).join('')}
  </g>

  <!-- Horizontal divider line accent -->
  <rect x="60" y="480" width="680" height="1" fill="${c}" opacity="0.2"/>

  <!-- ── ABAWI chip (top-left) ── -->
  <rect x="60" y="52" width="100" height="30" rx="15" fill="${c}" opacity="0.15"/>
  <rect x="60" y="52" width="100" height="30" rx="15" fill="none" stroke="${c}" stroke-width="1" opacity="0.4"/>
  <text x="110" y="72" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="800"
        fill="${c}" text-anchor="middle" letter-spacing="1.5">ABAWI</text>

  <!-- ── Category tag ── -->
  <rect x="170" y="52" width="${Math.min(tag.length * 9 + 28, 260)}" height="30" rx="15" fill="rgba(${r},${g},${b},0.08)"/>
  <rect x="170" y="52" width="${Math.min(tag.length * 9 + 28, 260)}" height="30" rx="15" fill="none" stroke="${c}" stroke-width="0.8" opacity="0.25"/>
  <text x="${170 + Math.min(tag.length * 9 + 28, 260) / 2}" y="72"
        font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700"
        fill="${c}" text-anchor="middle" opacity="0.9">${tag}</text>

  <!-- ── Tool name ── -->
  <text x="60" y="290"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${name.length > 22 ? 52 : name.length > 16 ? 58 : 66}"
        font-weight="900"
        fill="#FFFFFF"
        letter-spacing="-0.5">${name}</text>

  <!-- ── Description lines ── -->
  <text x="60" y="348"
        font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="400"
        fill="rgba(148,163,184,0.9)">${line1}</text>
  <text x="60" y="386"
        font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="400"
        fill="rgba(148,163,184,0.9)">${line2}</text>

  <!-- ── URL (bottom) ── -->
  <text x="60" y="560"
        font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="600"
        fill="${c}" opacity="0.85">${url}</text>

  <!-- ── Bottom tagline ── -->
  <text x="60" y="598"
        font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="500"
        fill="rgba(148,163,184,0.5)" letter-spacing="0.5">Le portail premium pour l'Afrique de l'Ouest</text>

  <!-- Right side center logo circle -->
  <circle cx="1050" cy="315" r="46" fill="rgba(${r},${g},${b},0.2)" stroke="${c}" stroke-width="1.5" opacity="0.6"/>
  <text x="1050" y="325" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900"
        fill="${c}" text-anchor="middle" opacity="0.9">AW</text>
</svg>`
}

// ─── Main ────────────────────────────────────────────────────────────────────

let ok = 0, fail = 0

for (const page of PAGES) {
  const svg = buildSVG(page)
  const outPath = `${OUT}/${page.slug}.png`
  try {
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, quality: 90 })
      .resize(1200, 630)
      .toFile(outPath)
    ok++
    process.stdout.write(`  ✓ ${page.slug}.png\n`)
  } catch (e) {
    fail++
    process.stderr.write(`  ✗ ${page.slug}: ${e.message}\n`)
  }
}

console.log(`\nDone: ${ok} generated, ${fail} failed → public/og/`)
