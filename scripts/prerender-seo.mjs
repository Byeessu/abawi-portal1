#!/usr/bin/env node
/**
 * Prerender SEO — Génère des HTML statiques pour chaque route
 * à servir côté serveur (Netlify prerender, Cloudflare, etc.)
 *
 * Usage: node scripts/prerender-seo.mjs
 * Les fichiers sont générés dans dist/
 */
import fs from 'fs'
import path from 'path'

const DIST_DIR = path.resolve('dist')
const OUT_DIR  = path.resolve('dist')
const BASE     = 'https://abawi.app'

// ── Supabase for store products ───────────────────────────────────────────────
let supabase = null
let storeProducts = []
let abavieProducts = []

try {
  const { createClient } = await import('@supabase/supabase-js')
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    // Fetch store products with SEO fields
    const [{ data: sp }, { data: ap }] = await Promise.all([
      supabase.from('store_products').select('id,nom,name,categorie,cat,prix,description,description_longue,meta_title,meta_description,seo_tags,points_forts,cas_usage,caracteristiques,actif').eq('actif', true).limit(200),
      supabase.from('abavie_products').select('id,nom,categorie,prix,description,description_longue,meta_title,meta_description,seo_tags,points_forts,cas_usage,caracteristiques,actif').eq('actif', true).limit(200),
    ])
    storeProducts = sp || []
    abavieProducts = ap || []
    console.log(`📦 Store: ${storeProducts.length} produits tech, ${abavieProducts.length} produits santé`)
  }
} catch(e) {
  console.warn('⚠️ Supabase store fetch failed:', e.message?.slice(0,80))
}

// ── Load products.js via child_process (handles ESM spread syntax) ────────────
import { execSync } from 'child_process'

let guides = [], allFascicules = [], podcasts = []

function slugify(s) {
  return String(s||'').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

try {
  const productsPath = path.resolve('src/data/products.js').replace(/\\/g, '/')
  const snippet = `
import { guides, allFascicules, podcasts } from '${productsPath}'
process.stdout.write(JSON.stringify({
  guides: guides.map(g => ({ id:g.id, titre:g.titre, categorie:g.categorie, prix:g.prix, gratuit:g.gratuit })),
  fascicules: allFascicules.map(f => ({ id:f.id, titre:f.titre, matiere:f.matiere, serie:f.serie, chapitre:f.chapitre, prix:f.prix, gratuit:f.gratuit })),
  podcasts: podcasts.map(p => ({ id:p.id, titre:p.titre, serie:p.serie, prix:p.prix, gratuit:p.gratuit })),
}))
`
  const tmpFile = path.resolve('scripts/_tmp_products_dump.mjs')
  fs.writeFileSync(tmpFile, snippet)
  const json = execSync(`node "${tmpFile}"`, { encoding: 'utf8', timeout: 20000 })
  fs.unlinkSync(tmpFile)
  const data  = JSON.parse(json)
  guides        = data.guides
  allFascicules = data.fascicules
  podcasts      = data.podcasts
  console.log(`📦 products: ${guides.length} guides, ${allFascicules.length} fascicules, ${podcasts.length} podcasts`)
} catch(e) {
  console.warn('⚠ products.js chargement échoué — pages produits ignorées:', e.message.slice(0,100))
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const HIDDEN = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none'

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// Toutes les routes publiques à prerender
const ROUTES = [
  '/', '/outils', '/news', '/digital', '/academy', '/podcasts', '/store',
  '/boutique-sante', '/abavie', '/abawi360', '/plans', '/a-propos',
  '/mentions-legales', '/politique-confidentialite', '/politique-cookies',
  '/cgu', '/docs', '/business',
  '/outils/cv', '/outils/lettre', '/outils/business-plan', '/outils/pitch',
  '/outils/facture', '/outils/analyse-cv', '/outils/finance', '/outils/juridique',
  '/outils/comptable', '/outils/rh', '/outils/immobilier', '/outils/consultant',
  '/outils/image-pro', '/outils/format-converter', '/outils/qr-code-pro',
  '/outils/pro-card-elite', '/outils/photo-studio-pro', '/outils/infographie-pro',
  '/outils/audio-studio-elite', '/outils/studio-visuel-pro',
  '/outils/abawi-ia', '/outils/exegetika', '/outils/dictionnaire-elite',
  '/outils/translator-elite', '/outils/sante', '/outils/abspacegps',
  '/outils/abzone', '/outils/maxavis', '/outils/tontine', '/outils/autoroute',
  '/outils/editeur-pro', '/outils/smart-word-editor', '/outils/smart-office',
  '/outils/recrute-moi-sn', '/outils/place-ouvrier', '/outils/espace-ouvrier',
  '/abawi360/crm', '/abawi360/planification', '/abawi360/statistiques',
  '/abawi360/marketing', '/abawi-pay', '/abawi-bank', '/arkel-up-center',
  '/abtalk', '/clair',
]

const SEO_DATA = {
  '/': {
    title: 'ABAWI — Guides Premium, Outils IA et Académie Business pour l\'Afrique',
    desc: 'Portail premium africain : guides business, outils IA (CV, business plan, finance, juridique), académie Bac, actualités économiques. Créez vos documents professionnels en 5 minutes.',
    keywords: 'ABAWI, business plan Afrique, CV Sénégal, outils IA, OHADA, SYSCOHADA, académie Bac, guides business, fintech, entrepreneuriat africain, UEMOA, BCEAO'
  },
  '/outils': {
    title: 'Outils IA Professionnels — CV, Business Plan, Finance, Juridique | ABAWI',
    desc: '40+ outils IA premium pour entrepreneurs africains : créateur de CV, business plan, finance, juridique, comptabilité OHADA, infographie, photo studio, audio.',
    keywords: 'outils IA Afrique, créateur CV Sénégal, business plan OHADA, outil finance, juridique Afrique, comptable SYSCOHADA'
  },
  '/outils/cv': {
    title: 'Créateur de CV IA — Modèles professionnels pour l\'Afrique | ABAWI',
    desc: 'Créez un CV professionnel en 5 minutes avec l\'IA. Modèles adaptés au marché africain, format PDF exportable, conforme aux standards internationaux.',
    keywords: 'créateur CV Sénégal, CV professionnel Afrique, CV IA, modèle CV, CV PDF'
  },
  '/outils/lettre': {
    title: 'Rédacteur de Lettre de Motivation IA — Modèles gratuits | ABAWI',
    desc: 'Rédigez une lettre de motivation impactante en quelques minutes. Modèles personnalisés pour le marché du travail africain.',
    keywords: 'lettre motivation, candidature emploi Afrique, lettre motivation IA, modèle lettre Sénégal'
  },
  '/outils/business-plan': {
    title: 'Business Plan Elite — Générateur IA pour startups africaines | ABAWI',
    desc: 'Générez un business plan complet et professionnel pour votre startup africaine. Structure OHADA, projections financières, étude de marché.',
    keywords: 'business plan Afrique, générateur business plan, startup Sénégal, OHADA, plan d\'affaires'
  },
  '/outils/pitch': {
    title: 'Pitch Deck Pro — Créateur de présentations investisseurs | ABAWI',
    desc: 'Créez un pitch deck convaincant pour séduire les investisseurs. Templates professionnels adaptés aux startups africaines.',
    keywords: 'pitch deck, présentation investisseurs, startup pitch Afrique'
  },
  '/outils/facture': {
    title: 'Générateur de Factures — Conforme OHADA | ABAWI',
    desc: 'Créez des factures professionnelles conformes au référentiel OHADA. Numérotation automatique, calcul TVA, export PDF.',
    keywords: 'facture OHADA, générateur facture Afrique, comptabilité UEMOA'
  },
  '/outils/analyse-cv': {
    title: 'Analyseur de CV IA — Optimisez votre candidature | ABAWI',
    desc: 'Analysez votre CV avec l\'IA et recevez des recommandations personnalisées pour maximiser vos chances de recrutement.',
    keywords: 'analyse CV, optimisation CV, recrutement Afrique'
  },
  '/outils/finance': {
    title: 'Outils Finance — Calculs et simulations | ABAWI',
    desc: 'Simulateurs financiers pour entrepreneurs africains : rentabilité, seuil de rentabilité, tableau d\'amortissement, ratios financiers.',
    keywords: 'simulateur finance, calcul entreprise Afrique, rentabilité OHADA'
  },
  '/outils/juridique': {
    title: 'Assistant Juridique IA — Droit des affaires Afrique | ABAWI',
    desc: 'Consultez notre assistant juridique IA sur le droit OHADA, le droit des sociétés, les contrats et la fiscalité en Afrique.',
    keywords: 'droit OHADA, assistant juridique Afrique, fiscalité UEMOA, contrats entreprise'
  },
  '/outils/comptable': {
    title: 'Comptabilité OHADA Elite — Outils et guides | ABAWI',
    desc: 'Outils comptables conformes au SYSCOHADA révisé. Balance, grand livre, états financiers, écritures comptables.',
    keywords: 'SYSCOHADA, comptabilité OHADA, états financiers Afrique, balance comptable'
  },
  '/outils/rh': {
    title: 'Outils RH — Gestion des ressources humaines | ABAWI',
    desc: 'Gérez vos ressources humaines efficacement : fiches de paie, contrats, évaluations, planning, recrutement.',
    keywords: 'RH Afrique, gestion paie Sénégal, recrutement, contrat travail OHADA'
  },
  '/outils/immobilier': {
    title: 'Outils Immobilier — Estimation et gestion | ABAWI',
    desc: 'Estimez vos biens immobiliers et gérez votre patrimoine. Outils de simulation de prêt, rendement locatif, fiscalité.',
    keywords: 'immobilier Afrique, estimation bien, prêt immobilier, rendement locatif'
  },
  '/outils/consultant': {
    title: 'Consultant Virtuel IA — Conseil business 24/7 | ABAWI',
    desc: 'Posez vos questions business à notre consultant IA. Stratégie, marketing, finance, juridique, opérations.',
    keywords: 'consultant IA, conseil business Afrique, stratégie entreprise'
  },
  '/outils/image-pro': {
    title: 'Image Pro — Création visuelle IA | ABAWI',
    desc: 'Générez des images professionnelles avec l\'IA pour votre communication. Visuels marketing, réseaux sociaux, branding.',
    keywords: 'image IA, génération image, visuel marketing Afrique'
  },
  '/outils/format-converter': {
    title: 'Convertisseur de Format Pro — Documents et médias | ABAWI',
    desc: 'Convertissez vos documents et médias dans tous les formats : PDF, Word, Excel, images, audio, vidéo.',
    keywords: 'convertisseur format, conversion document, PDF Word'
  },
  '/outils/qr-code-pro': {
    title: 'Générateur QR Code Pro — Paiement et marketing | ABAWI',
    desc: 'Créez des QR codes dynamiques pour paiements, menus, cartes de visite digitales et campagnes marketing.',
    keywords: 'QR code, paiement QR, marketing digital Afrique'
  },
  '/outils/abawi-ia': {
    title: 'ABAWI IA — Assistant intelligent multimodal | ABAWI',
    desc: 'Notre assistant IA avancé : texte, image, audio. Rédaction, analyse, traduction, génération de contenu.',
    keywords: 'assistant IA, IA multimodale, IA Afrique, génération contenu'
  },
  '/outils/exegetika': {
    title: 'Exegetika — Exégèse biblique et théologique | ABAWI',
    desc: 'Outil d\'exégèse biblique et de recherche théologique. Études approfondies, commentaires, analyses scripturaires.',
    keywords: 'exégèse biblique, théologie Afrique, étude bible, commentaire scripturaire'
  },
  '/outils/sante': {
    title: 'Santé ABAWI — Outils et guides bien-être | ABAWI',
    desc: 'Outils santé et bien-être : calcul IMC, calories, suivi médical, guides nutrition et prévention.',
    keywords: 'santé Afrique, bien-être, nutrition, calcul IMC'
  },
  '/outils/maxavis': {
    title: 'MaxAvis — Sondages et avis clients | ABAWI',
    desc: 'Créez des sondages professionnels et collectez des avis clients. Analysez les résultats en temps réel.',
    keywords: 'sondage, avis client, enquête Afrique, feedback'
  },
  '/outils/tontine': {
    title: 'Tontine Digitale — Gestion communautaire | ABAWI',
    desc: 'Gérez votre tontine ou groupe d\'épargne en ligne. Suivi des cotisations, tirages, membres et historique.',
    keywords: 'tontine digitale, épargne groupe, finance communautaire Afrique'
  },
  '/outils/smart-office': {
    title: 'Smart Office — Suite bureautique intelligente | ABAWI',
    desc: 'Suite bureautique intelligente avec éditeur de texte, tableur et présentation. Collaboration en temps réel.',
    keywords: 'bureautique Afrique, suite office, éditeur document'
  },
  '/outils/recrute-moi-sn': {
    title: 'Recrute-Moi SN — Plateforme emploi Sénégal | ABAWI',
    desc: 'Trouvez votre prochain emploi au Sénégal. Offres dans tous les secteurs : tech, finance, santé, éducation.',
    keywords: 'emploi Sénégal, recrutement, offre emploi, carrière'
  },
  '/outils/place-ouvrier': {
    title: 'Place Ouvrier — Mise en relation travailleurs | ABAWI',
    desc: 'Mettez en relation ouvriers qualifiés et employeurs. Maçons, électriciens, plombiers, menuisiers au Sénégal.',
    keywords: 'ouvrier Sénégal, maçon, électricien, plombier, travail manuel'
  },
  '/outils/espace-ouvrier': {
    title: 'Espace Ouvrier — Espace dédié travailleurs | ABAWI',
    desc: 'Espace dédié aux travailleurs manuels : profil, compétences, disponibilité, historique et mise en relation.',
    keywords: 'travailleur manuel, espace professionnel, compétences ouvrier'
  },
  '/news': {
    title: 'Actualités Économiques Afrique — News Business | ABAWI',
    desc: 'Actualités économiques et business en Afrique de l\'Ouest. Analyses marché, fintech, entrepreneuriat, UEMOA, BCEAO.',
    keywords: 'actualités économiques Afrique, news business Sénégal, fintech, entrepreneuriat'
  },
  '/academy': {
    title: 'Académie ABAWI — Cours Bac, Révisions, Guides | ABAWI',
    desc: 'Académie en ligne pour réussir le Bac et les examens. Cours, fascicules, podcasts éducatifs pour lycéens africains.',
    keywords: 'cours Bac Sénégal, révisions Bac, académie en ligne Afrique, fascicules'
  },
  '/digital': {
    title: 'ABAWI Digital — Guides, Packs et Ressources Business | ABAWI',
    desc: 'Guides premium, packs business et ressources digitales pour entrepreneurs africains. Templates, formations, outils téléchargeables.',
    keywords: 'guides business Afrique, packs entrepreneur, ressources digitales, templates business'
  },
  '/podcasts': {
    title: 'Podcasts ABAWI — Business, Tech et Culture | ABAWI',
    desc: 'Écoutez nos podcasts sur l\'entrepreneuriat africain, la tech, la finance et la culture.',
    keywords: 'podcast Afrique, business podcast, tech Afrique, entrepreneuriat audio'
  },
  '/store': {
    title: 'Boutique ABAWI — Templates, Guides et Formations | ABAWI',
    desc: 'Achetez templates professionnels, guides business et formations digitales pour booster votre entreprise.',
    keywords: 'boutique digitale Afrique, templates business, formations en ligne'
  },
  '/boutique-sante': {
    title: 'Boutique Santé — Matériel et Fournitures | ABAWI',
    desc: 'Boutique spécialisée en matériel médical et fournitures de santé. Livraison rapide au Sénégal.',
    keywords: 'boutique santé Sénégal, matériel médical, fournitures santé'
  },
  '/abavie': {
    title: 'Abavie — Vente de matériel médical et paramédical | ABAWI',
    desc: 'Matériel médical, équipement paramédical et fournitures de santé. Livraison rapide au Sénégal et en Afrique de l\'Ouest.',
    keywords: 'matériel médical Sénégal, équipement paramédical, fournitures santé Afrique'
  },
  '/abawi360': {
    title: 'ABAWI 360 — CRM et Outils de Gestion | ABAWI',
    desc: 'Suite complète de gestion d\'entreprise : CRM, planification, statistiques et marketing. Tout-en-un pour PME africaines.',
    keywords: 'CRM Afrique, gestion entreprise, PME Sénégal, outils gestion'
  },
  '/plans': {
    title: 'Tarifs ABAWI — Abonnements et Crédits | ABAWI',
    desc: 'Choisissez votre abonnement ABAWI : gratuit, starter, pro, elite, VIP. Accès illimité aux outils IA, guides premium et académie.',
    keywords: 'tarifs ABAWI, abonnement, crédits, plan gratuit, outils IA'
  },
  '/a-propos': {
    title: 'À Propos — Notre mission et notre équipe | ABAWI',
    desc: 'Découvrez ABAWI, le portail premium africain dédié à l\'entrepreneuriat, l\'éducation et l\'innovation. Notre mission, notre équipe.',
    keywords: 'à propos ABAWI, mission, équipe, entreprise africaine'
  },
  '/mentions-legales': {
    title: 'Mentions Légales | ABAWI',
    desc: 'Mentions légales du site ABAWI. Informations sur l\'éditeur, l\'hébergeur et les conditions d\'utilisation.',
    keywords: 'mentions légales'
  },
  '/politique-confidentialite': {
    title: 'Politique de Confidentialité | ABAWI',
    desc: 'Politique de confidentialité et protection des données personnelles sur ABAWI. RGPD et lois africaines.',
    keywords: 'confidentialité, données personnelles, RGPD'
  },
  '/politique-cookies': {
    title: 'Politique des Cookies | ABAWI',
    desc: 'Politique d\'utilisation des cookies sur le site ABAWI. Types de cookies, finalités et paramétrage.',
    keywords: 'cookies, politique cookies'
  },
  '/cgu': {
    title: 'Conditions Générales d\'Utilisation | ABAWI',
    desc: 'Conditions générales d\'utilisation du site ABAWI. Accès, services, responsabilités et propriété intellectuelle.',
    keywords: 'CGU, conditions utilisation'
  },
  '/docs': {
    title: 'Documentation ABAWI — Guides d\'utilisation | ABAWI',
    desc: 'Documentation complète et guides d\'utilisation de la plateforme ABAWI. Tutoriels, FAQ et assistance.',
    keywords: 'documentation, guide utilisation, tutoriel, FAQ'
  },
  '/business': {
    title: 'Business — Solutions entreprises | ABAWI',
    desc: 'Solutions dédiées aux entreprises : outils collaboratifs, gestion de projet, analytics et support premium.',
    keywords: 'business, solutions entreprise, B2B Afrique'
  },
  '/arkel-up-center': {
    title: 'Arkel Up Center — Formation et Innovation | ABAWI',
    desc: 'Centre de formation et d\'innovation Arkel Up. Bootcamps tech, incubation startup et mentorat.',
    keywords: 'formation tech, incubation startup, mentorat Afrique, bootcamp'
  },
  '/abtalk': {
    title: 'AbTalk — Communication et Messagerie | ABAWI',
    desc: 'Outil de communication intégré pour équipes et communautés. Messagerie, visioconférence, collaboration.',
    keywords: 'messagerie, communication équipe, visioconférence Afrique'
  },
  '/clair': {
    title: 'Clair — Clarté et Transparence | ABAWI',
    desc: 'Notre engagement pour la transparence et la clarté dans tous nos services et interactions.',
    keywords: 'transparence, clarté, confiance'
  },
  '/abawi-pay': {
    title: 'ABAWI Pay — Paiements et Transferts | ABAWI',
    desc: 'Solutions de paiement et de transfert d\'argent pour particuliers et entreprises en Afrique de l\'Ouest.',
    keywords: 'paiement mobile, transfert argent Afrique, fintech'
  },
  '/abawi-bank': {
    title: 'ABAWI Bank — Services Financiers | ABAWI',
    desc: 'Services financiers innovants pour entrepreneurs et particuliers : épargne, crédit, investissement.',
    keywords: 'services financiers, crédit Afrique, investissement, épargne'
  },
  '/abawi360/crm': {
    title: 'CRM ABAWI 360 — Gestion clients | ABAWI',
    desc: 'Gérez vos relations clients efficacement. Suivi des leads, opportunités, contrats et support client.',
    keywords: 'CRM, gestion clients, leads, opportunités'
  },
  '/abawi360/planification': {
    title: 'Planification ABAWI 360 — Gestion de projet | ABAWI',
    desc: 'Planifiez et suivez vos projets avec des outils de Gantt, Kanban et gestion des tâches.',
    keywords: 'planification projet, Gantt, Kanban, gestion tâches'
  },
  '/abawi360/statistiques': {
    title: 'Statistiques ABAWI 360 — Analytics Business | ABAWI',
    desc: 'Tableaux de bord analytiques pour suivre vos KPIs, ventes, performances et croissance.',
    keywords: 'analytics, statistiques business, KPI, tableau bord'
  },
  '/abawi360/marketing': {
    title: 'Marketing ABAWI 360 — Campagnes et Automation | ABAWI',
    desc: 'Créez et gérez vos campagnes marketing. Email automation, SMS, réseaux sociaux et analytics.',
    keywords: 'marketing digital, email automation, campagne SMS, réseaux sociaux'
  },
}

function defaultSeo(path) {
  const base = path.replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' — ')
  const title = base ? `${base.charAt(0).toUpperCase() + base.slice(1)} | ABAWI` : 'ABAWI'
  return {
    title: title,
    desc: `Découvrez ${title} sur ABAWI, le portail premium africain de guides business, outils IA et académie.`,
    keywords: 'ABAWI, outils IA, business Afrique'
  }
}

// Static body content injected into <div id="root"> so Googlebot sees real text
const BODY_CONTENT = {
  '/': `<main id="prerender" role="main" aria-label="Contenu principal">
<h1>ABAWI — Portail Premium Africain pour l'Entrepreneuriat, l'Éducation et l'Innovation</h1>
<p>ABAWI est le portail de référence en Afrique de l'Ouest qui offre des <strong>guides business premium</strong>, des <strong>outils IA professionnels</strong> et une <strong>académie en ligne</strong> pour réussir vos examens et votre entreprise.</p>
<section><h2>40+ Outils IA Professionnels</h2><ul><li>Créateur de CV avec IA</li><li>Générateur de business plan conforme OHADA</li><li>Assistant juridique et comptable SYSCOHADA</li><li>Outils finance, RH et immobilier</li><li>Studio photo, audio et infographie IA</li></ul></section>
<section><h2>Académie ABAWI — Réussir le Bac</h2><p>Cours, fascicules et podcasts éducatifs pour lycéens sénégalais et africains. Préparez le baccalauréat avec des ressources de qualité.</p></section>
<section><h2>Actualités Économiques et Guides Business</h2><p>Restez informé avec nos analyses de marché, actualités fintech, entrepreneuriat et économie UEMOA-BCEAO.</p></section>
</main>`,
  '/outils': `<main id="prerender"><h1>40+ Outils IA Professionnels pour Entrepreneurs Africains</h1><p>La plus grande suite d'outils IA dédiée au marché africain. Créez vos documents professionnels, gérez votre entreprise et boostez votre productivité.</p>
<section><h2>Outils Business et Juridique</h2><ul><li>CV IA, lettre de motivation, business plan</li><li>Assistant juridique OHADA et comptable SYSCOHADA</li><li>Finance, facturation, RH et immobilier</li></ul></section>
<section><h2>Outils Créatifs et IA</h2><ul><li>Studio photo pro, infographie, audio IA</li><li>Image Pro, QR Code, convertisseur de format</li><li>ABAWI IA multimodale : texte, image, audio</li></ul></section>
<section><h2>Outils Santé et Local</h2><ul><li>Abavie : matériel médical</li><li>ABSpaceGPS et ABZone : localisation et zones</li></ul></section>
</main>`,
  '/outils/cv': `<main id="prerender"><h1>Créateur de CV IA — Modèles Professionnels pour l'Afrique</h1><p>Créez un <strong>CV professionnel</strong> en 5 minutes avec l'intelligence artificielle. Nos modèles sont adaptés au <strong>marché de l'emploi africain</strong> et conformes aux standards internationaux.</p>
<section><h2>Fonctionnalités Clés</h2><ul><li>20+ templates premium optimisés ATS</li><li>Génération IA du contenu personnalisé</li><li>Export PDF haute qualité</li><li>Conforme aux normes africaines et internationales</li><li>Interface intuitive en français</li></ul></section>
<section><h2>Pourquoi choisir ABAWI CV ?</h2><p>Notre créateur de CV est spécialement conçu pour les professionnels africains. Il intègre les attentes des recruteurs au Sénégal, en Côte d'Ivoire, au Mali et dans toute l'UEMOA.</p></section>
</main>`,
  '/outils/business-plan': `<main id="prerender"><h1>Business Plan Elite — Générateur IA pour Startups Africaines</h1><p>Élaborez un <strong>business plan complet et professionnel</strong> pour votre startup ou PME africaine. Structure conforme <strong>OHADA</strong>, projections financières et étude de marché intégrée.</p>
<section><h2>Contenu du Business Plan</h2><ul><li>Résumé exécutif et présentation du projet</li><li>Étude de marché détaillée</li><li>Stratégie marketing et commerciale</li><li>Plan opérationnel et organisationnel</li><li>Projections financières sur 3 ans</li><li>Analyse des risques et mitigation</li></ul></section>
</main>`,
  '/news': `<main id="prerender"><h1>Actualités Économiques Afrique de l'Ouest</h1><p>Suivez l'actualité économique et business en <strong>Afrique de l'Ouest</strong>. Analyses de marché, fintech, entrepreneuriat, décisions de la BCEAO et de l'UEMOA.</p>
<section><h2>Thématiques Couvertes</h2><ul><li>Économie et finance</li><li>Fintech et innovation</li><li>Entrepreneuriat africain</li><li>Marchés et investissements</li><li>Politique économique UEMOA</li></ul></section>
</main>`,
  '/academy': (() => {
    const items = allFascicules.slice(0, 30).map(f => `<li><a href="${BASE}/academy/${slugify(f.titre)}">${esc(f.titre)}</a>${f.matiere ? ` — ${esc(f.matiere)}` : ''}${f.serie ? ` ${esc(f.serie)}` : ''}</li>`).join('')
    const matieres = [...new Set(allFascicules.map(f=>f.matiere).filter(Boolean))].slice(0,10)
    const series   = [...new Set(allFascicules.map(f=>f.serie).filter(Boolean))].slice(0,6)
    return `<main id="prerender"><h1>Académie ABAWI — Fascicules Bac et Cours Sénégal</h1><p>L'académie en ligne de référence pour réussir le <strong>Baccalauréat</strong> au Sénégal et en Afrique de l'Ouest. <strong>${allFascicules.length}+ fascicules</strong> de cours, méthodes et exercices corrigés — Séries S1, S2, L1, L2.</p><section><h2>Fascicules Disponibles</h2><ul>${items}</ul></section><section><h2>Matières</h2><ul>${matieres.map(m=>`<li>${esc(m)}</li>`).join('')}</ul></section><section><h2>Séries</h2><ul>${series.map(s=>`<li>Bac ${esc(s)}</li>`).join('')}</ul></section></main>`
  })(),
  '/digital': (() => {
    const items = guides.slice(0, 30).map(g => `<li><a href="${BASE}/digital/${slugify(g.titre)}">${esc(g.titre)}</a> — ${g.prix ? g.prix.toLocaleString()+' F CFA' : 'Gratuit'}</li>`).join('')
    return `<main id="prerender"><h1>Guides Business Premium — ABAWI Digital</h1><p>Accédez à <strong>${guides.length}+ guides premium</strong> téléchargeables : stratégie commerciale, entrepreneuriat, communication, marketing digital, guides OHADA, art de la vente. Documents PDF professionnels pour entrepreneurs africains.</p><section><h2>Guides Disponibles</h2><ul>${items}</ul></section><section><h2>Catégories</h2><ul><li>Business &amp; Stratégie</li><li>Communication &amp; Marketing</li><li>Finance &amp; OHADA</li><li>Art de la Vente</li><li>Informatique &amp; Digital</li></ul></section></main>`
  })(),
  '/store': `<main id="prerender"><h1>Boutique ABAWI — Templates et Formations</h1><p>Achetez des <strong>templates professionnels</strong>, guides business et formations digitales pour booster votre entreprise africaine.</p>
<section><h2>Catégories de Produits</h2><ul><li>Templates documents professionnels</li><li>Formations en ligne vidéo</li><li>E-books et guides pratiques</li><li>Packs outils premium</li></ul></section>
</main>`,
  '/abavie': `<main id="prerender"><h1>Abavie — Matériel Médical et Paramédical</h1><p><strong>Abavie</strong> est votre fournisseur de matériel médical, équipement paramédical et fournitures de santé au Sénégal et en Afrique de l'Ouest. Livraison rapide et produits certifiés.</p>
<section><h2>Nos Produits</h2><ul><li>Matériel médical professionnel</li><li>Équipement paramédical</li><li>Fournitures de santé et consommables</li><li>Dispositifs médicaux certifiés</li></ul></section>
</main>`,
  '/plans': `<main id="prerender"><h1>Tarifs et Abonnements ABAWI</h1><p>Choisissez l'abonnement qui correspond à vos besoins. Du <strong>plan gratuit</strong> au <strong>VIP</strong>, accédez aux outils IA, guides premium et académie selon votre niveau.</p>
<section><h2>Nos Offres</h2><ul><li>Plan Gratuit — Accès limité</li><li>Starter — Pour débuter</li><li>Pro — Pour entrepreneurs actifs</li><li>Elite — Accès complet</li><li>VIP — Expérience premium</li></ul></section>
</main>`,
  '/a-propos': `<main id="prerender"><h1>À Propos d'ABAWI</h1><p>ABAWI est le <strong>portail premium africain</strong> dédié à l'entrepreneuriat, l'éducation et l'innovation technologique. Notre mission est de fournir aux Africains les outils et ressources nécessaires pour réussir.</p>
<section><h2>Notre Mission</h2><p>Accompagner la croissance économique de l'Afrique de l'Ouest en démocratisant l'accès aux outils professionnels, à l'éducation de qualité et à l'information économique.</p></section>
</main>`,
  '/mentions-legales': `<main id="prerender"><h1>Mentions Légales</h1><p>Consultez les mentions légales du site ABAWI : éditeur du site, hébergeur, propriété intellectuelle et conditions d'utilisation.</p></main>`,
  '/politique-confidentialite': `<main id="prerender"><h1>Politique de Confidentialité</h1><p>ABAWI s'engage à protéger vos données personnelles. Découvrez comment nous collectons, utilisons et sécurisons vos informations conformément au RGPD et aux lois africaines.</p></main>`,
  '/politique-cookies': `<main id="prerender"><h1>Politique des Cookies</h1><p>Informations sur l'utilisation des cookies sur le site ABAWI : types de cookies, finalités et options de paramétrage.</p></main>`,
  '/cgu': `<main id="prerender"><h1>Conditions Générales d'Utilisation</h1><p>Les conditions générales d'utilisation définissent les règles d'accès et d'utilisation des services proposés par ABAWI.</p></main>`,
  '/docs': `<main id="prerender"><h1>Documentation ABAWI</h1><p>Guides d'utilisation, tutoriels et FAQ pour maîtriser la plateforme ABAWI et ses outils professionnels.</p></main>`,
  '/business': `<main id="prerender"><h1>Solutions Business ABAWI</h1><p>Outils collaboratifs, gestion de projet, analytics et support premium pour les entreprises africaines.</p></main>`,
  '/arkel-up-center': `<main id="prerender"><h1>Arkel Up Center — Formation et Innovation</h1><p>Centre de formation tech, incubation de startups et mentorat pour l'écosystème entrepreneurial africain. Bootcamps, ateliers et accompagnement personnalisé.</p></main>`,
  '/abtalk': `<main id="prerender"><h1>AbTalk — Communication d'Équipe</h1><p>Messagerie instantanée, visioconférence et outils de collaboration pour équipes et communautés africaines.</p></main>`,
  '/abawi360': `<main id="prerender"><h1>ABAWI 360 — Suite de Gestion d'Entreprise</h1><p>CRM, planification, statistiques et marketing : la suite complète pour gérer et faire croître votre PME africaine.</p></main>`,
  '/abawi-pay': `<main id="prerender"><h1>ABAWI Pay — Paiements Mobiles</h1><p>Solutions de paiement et de transfert d'argent sécurisées pour particuliers et entreprises en Afrique de l'Ouest.</p></main>`,
  '/abawi-bank': `<main id="prerender"><h1>ABAWI Bank — Services Financiers</h1><p>Services financiers innovants : épargne, crédit, investissement et gestion de patrimoine pour les Africains.</p></main>`,
  '/podcasts': (() => {
    const items = podcasts.slice(0, 30).map(p => `<li><a href="${BASE}/podcasts/${slugify(p.titre)}">${esc(p.titre)}</a>${p.serie ? ` — ${esc(p.serie)}` : ''}</li>`).join('')
    const series = [...new Set(podcasts.map(p=>p.serie).filter(Boolean))].slice(0,8)
    return `<main id="prerender"><h1>Podcasts ABAWI — Business, Entrepreneuriat et Finance Afrique</h1><p>Écoutez <strong>${podcasts.length}+ podcasts</strong> sur l'entrepreneuriat africain, la finance, la tech, l'immobilier et la culture business. Analyses et décryptages pour entrepreneurs au Sénégal et en Afrique de l'Ouest.</p><section><h2>Épisodes Disponibles</h2><ul>${items}</ul></section><section><h2>Thématiques</h2><ul>${series.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></section></main>`
  })(),
  '/boutique-sante': `<main id="prerender"><h1>Boutique Santé ABAWI</h1><p>Matériel médical, équipement paramédical et fournitures de santé. Livraison rapide au Sénégal.</p></main>`,
  '/clair': `<main id="prerender"><h1>Clair — Transparence et Confiance</h1><p>Notre engagement pour la transparence dans tous nos services et interactions avec nos utilisateurs.</p></main>`,
}

function getBodyContent(route) {
  if (BODY_CONTENT[route]) return BODY_CONTENT[route]
  // Fallback for generic /outils/ routes
  if (route.startsWith('/outils/')) {
    const name = route.replace('/outils/', '').replace(/-/g, ' ')
    return `<main id="prerender"><h1>${name.charAt(0).toUpperCase() + name.slice(1)} — Outil ABAWI</h1><p>Découvrez cet outil professionnel sur ABAWI, le portail premium africain de guides business et outils IA.</p></main>`
  }
  if (route.startsWith('/abawi360/')) {
    const name = route.replace('/abawi360/', '').replace(/-/g, ' ')
    return `<main id="prerender"><h1>${name.charAt(0).toUpperCase() + name.slice(1)} — ABAWI 360</h1><p>Gérez votre entreprise avec les outils ABAWI 360 : CRM, planification, statistiques et marketing.</p></main>`
  }
  return `<main id="prerender"><h1>ABAWI — Portail Premium Africain</h1><p>Découvrez les outils IA, guides business et académie en ligne sur ABAWI.</p></main>`
}

function buildBreadcrumb(route) {
  if (route === '/') return null
  const parts = route.split('/').filter(Boolean)
  const items = [{ name: 'Accueil', item: 'https://abawi.app/' }]
  let currentPath = ''
  for (const part of parts) {
    currentPath += '/' + part
    const label = part.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())
    items.push({ name: label, item: `https://abawi.app${currentPath}` })
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.item
    }))
  }
}

function buildHtml(baseHtml, route) {
  const seo = SEO_DATA[route] || defaultSeo(route)
  const canonical = `https://abawi.app${route}`

  // Replace <title>
  let html = baseHtml.replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`)

  // Inject or replace meta description
  if (html.includes('name="description"')) {
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${seo.desc}" />`)
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${seo.desc}" />\n</head>`)
  }

  // Inject canonical
  if (!html.includes('rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonical}" />\n</head>`)
  } else {
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonical}" />`)
  }

  // Inject Open Graph
  const ogTags = `
  <meta property="og:title" content="${seo.title}" />
  <meta property="og:description" content="${seo.desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="https://abawi.app/abawi-og-banner.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />`
  if (!html.includes('property="og:title"')) {
    html = html.replace('</head>', ogTags + '\n</head>')
  }

  // Inject Twitter
  const twTags = `
  <meta name="twitter:title" content="${seo.title}" />
  <meta name="twitter:description" content="${seo.desc}" />`
  if (!html.includes('name="twitter:title"')) {
    html = html.replace('</head>', twTags + '\n</head>')
  }

  // Build structured data: WebPage + BreadcrumbList
  const webPageLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: seo.title, description: seo.desc, url: canonical }
  const breadcrumbLd = buildBreadcrumb(route)
  const structuredData = [webPageLd]
  if (breadcrumbLd) structuredData.push(breadcrumbLd)
  const jsonLd = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
  html = html.replace('</head>', jsonLd + '\n</head>')

  // Inject static body content into <div id="root"> so crawlers see real text.
  // The inline style makes #prerender visually hidden from the very first paint
  // (before any external CSS loads), preventing FOUC. Crawlers still read the DOM.
  const HIDDEN = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none'
  const bodyContent = getBodyContent(route)
    .replace(/<main id="prerender"([^>]*)>/,
      (_, rest) => `<main id="prerender"${rest} style="${HIDDEN}">`)
  const noscript = `<noscript><div style="padding:2rem;font-family:sans-serif;max-width:800px;margin:auto;">${getBodyContent(route)}</div></noscript>`
  // Replace <div id="root"></div> with <div id="root">[content]</div>
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${bodyContent}${noscript}</div>`
  )

  return html
}

// Génération — utilise le index.html généré par Vite comme template
const baseHtmlPath = path.join(DIST_DIR, 'index.html')
if (!fs.existsSync(baseHtmlPath)) {
  console.error('❌ dist/index.html non trouvé. Lancez vite build d\'abord.')
  process.exit(1)
}
const baseHtml = fs.readFileSync(baseHtmlPath, 'utf-8')

let generatedCount = 0
for (const route of ROUTES) {
  const dirPath = route === '/' ? OUT_DIR : path.join(OUT_DIR, route.slice(1))
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
  const outPath = path.join(dirPath, 'index.html')
  fs.writeFileSync(outPath, buildHtml(baseHtml, route))
  console.log(`✓ ${route} → ${outPath.replace(OUT_DIR + '/', '')}`)
  generatedCount++
}

console.log(`\n✓ Pages statiques : ${generatedCount} routes`)

// ── Prerender individual product pages ────────────────────────────────────────
function buildProductHtml(baseHtml, { route, title, desc, h1, bodyHtml, jsonLd }) {
  const canonical = `${BASE}${route}`
  let html = baseHtml
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${esc(desc)}" />`)
  html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${esc(canonical)}" />`)
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`)
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(canonical)}" />`)
  html = html.replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`)
  html = html.replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`)
  if (jsonLd) {
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`)
  }
  const hiddenBody = `<main id="prerender" style="${HIDDEN}" role="main"><h1>${esc(h1)}</h1>${bodyHtml}</main>`
  const noscript   = `<noscript><div style="padding:2rem;font-family:sans-serif;max-width:800px;margin:auto;"><h1>${esc(h1)}</h1>${bodyHtml}</div></noscript>`
  html = html.replace(/<div id="root"><\/div>/, `<div id="root">${hiddenBody}${noscript}</div>`)
  return html
}

let productCount = 0

// Guides → /digital/[slug]
for (const g of guides) {
  const slug  = slugify(g.titre)
  const route = `/digital/${slug}`
  const dir   = path.join(OUT_DIR, 'digital', slug)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const title = `${g.titre} — Guide PDF ABAWI`
  const desc  = `Téléchargez le guide "${g.titre}" — document premium PDF pour entrepreneurs africains. ${g.categorie}. ${g.prix ? g.prix.toLocaleString()+' F CFA' : 'Gratuit'}.`
  const jsonLd = { '@context':'https://schema.org', '@type':'Product', name:g.titre, description:desc, url:`${BASE}${route}`, brand:{'@type':'Brand',name:'ABAWI'}, offers:{'@type':'Offer',price:g.prix||0,priceCurrency:'XOF',availability:'https://schema.org/InStock'} }
  const body  = `<p>${esc(desc)}</p><ul><li>Format : PDF professionnel</li><li>Catégorie : ${esc(g.categorie||'Business')}</li><li>Prix : ${g.prix ? g.prix.toLocaleString()+' F CFA' : 'Gratuit'}</li></ul>`
  fs.writeFileSync(path.join(dir, 'index.html'), buildProductHtml(baseHtml, { route, title, desc, h1: g.titre, bodyHtml: body, jsonLd }))
  productCount++
}
console.log(`✓ /digital/[slug] — ${guides.length} guides`)

// Fascicules → /academy/[slug]
for (const f of allFascicules) {
  const slug  = slugify(f.titre)
  const route = `/academy/${slug}`
  const dir   = path.join(OUT_DIR, 'academy', slug)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const title = `${f.titre} — Fascicule BAC ${f.serie||''} ABAWI Academy`
  const desc  = `Fascicule ${f.matiere||''} Bac ${f.serie||''} — ${f.titre}. Chapitre ${f.chapitre||''}. Cours, méthodes et exercices corrigés premium — ABAWI Academy Sénégal.`
  const jsonLd = { '@context':'https://schema.org', '@type':'Book', name:f.titre, description:desc, url:`${BASE}${route}`, author:{'@type':'Organization',name:'ABAWI Academy'}, inLanguage:'fr', educationalLevel:f.serie||'Baccalauréat', genre:f.matiere||'Sciences', offers:{'@type':'Offer',price:f.prix||0,priceCurrency:'XOF',availability:'https://schema.org/InStock'} }
  const body  = `<p>${esc(desc)}</p><ul><li>Matière : ${esc(f.matiere||'')}</li><li>Série : Bac ${esc(f.serie||'')}</li>${f.chapitre?`<li>Chapitre : ${f.chapitre}</li>`:''}<li>Prix : ${f.prix ? f.prix.toLocaleString()+' F CFA' : 'Gratuit'}</li></ul>`
  fs.writeFileSync(path.join(dir, 'index.html'), buildProductHtml(baseHtml, { route, title, desc, h1: f.titre, bodyHtml: body, jsonLd }))
  productCount++
}
console.log(`✓ /academy/[slug] — ${allFascicules.length} fascicules`)

// Podcasts → /podcasts/[slug]  (first-wins deduplication on slug collision)
const podSeenSlugs = new Set()
for (const p of podcasts) {
  const slug  = slugify(p.titre)
  if (podSeenSlugs.has(slug)) continue  // duplicate slug — React shows the first match too
  podSeenSlugs.add(slug)
  const route = `/podcasts/${slug}`
  const dir   = path.join(OUT_DIR, 'podcasts', slug)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const title = `${p.titre} — Podcast ABAWI`
  const desc  = `Écoutez "${p.titre}" — podcast ${p.serie||'Business & Digital'} pour entrepreneurs africains. Analyses, décryptages et conseils pratiques.`
  const jsonLd = { '@context':'https://schema.org', '@type':'PodcastEpisode', name:p.titre, description:desc, url:`${BASE}${route}`, inLanguage:'fr', partOfSeries:{'@type':'PodcastSeries',name:p.serie||'ABAWI Podcasts',url:`${BASE}/podcasts`}, author:{'@type':'Organization',name:'ABAWI SN'} }
  const body  = `<p>${esc(desc)}</p><ul><li>Série : ${esc(p.serie||'Business & Digital')}</li><li>Format : Audio MP3</li><li>Prix : ${p.gratuit ? 'Gratuit' : (p.prix ? p.prix.toLocaleString()+' F CFA' : 'Premium')}</li></ul>`
  fs.writeFileSync(path.join(dir, 'index.html'), buildProductHtml(baseHtml, { route, title, desc, h1: p.titre, bodyHtml: body, jsonLd }))
  productCount++
}
console.log(`✓ /podcasts/[slug] — ${podcasts.length} podcasts`)

// ── Store products → /store/[id] ─────────────────────────
for (const p of storeProducts) {
  const id = p.id
  const route = `/store/${id}`
  const dir = path.join(OUT_DIR, 'store', id)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const nom = p.nom || p.name || 'Produit'
  const cat = p.categorie || p.cat || 'Tech'
  const prix = p.prix || 0
  const title = p.meta_title || `${nom} — ${cat} | ABAWI Store`
  const desc = p.meta_description || `${nom}. ${p.description || ''}`.slice(0, 160)
  const tags = Array.isArray(p.seo_tags) ? p.seo_tags.join(', ') : ''
  const points = Array.isArray(p.points_forts) ? p.points_forts : []
  const usage = Array.isArray(p.cas_usage) ? p.cas_usage : []
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: nom,
    description: desc,
    url: `${BASE}${route}`,
    brand: { '@type': 'Brand', name: 'ABAWI' },
    category: cat,
    offers: { '@type': 'Offer', price: prix, priceCurrency: 'XOF', availability: 'https://schema.org/InStock' }
  }
  let body = `<p>${esc(desc)}</p>`
  if (points.length) body += `<ul>${points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>`
  if (usage.length) body += `<p><strong>Cas d'usage :</strong> ${usage.map(u => esc(u)).join(' · ')}</p>`
  fs.writeFileSync(path.join(dir, 'index.html'), buildProductHtml(baseHtml, { route, title, desc, h1: nom, bodyHtml: body, jsonLd }))
  productCount++
}
console.log(`✓ /store/[id] — ${storeProducts.length} produits tech`)

// ── Abavie products → /abavie/produit/[id] ───────────────
for (const p of abavieProducts) {
  const id = p.id
  const route = `/abavie/produit/${id}`
  const dir = path.join(OUT_DIR, 'abavie', 'produit', id)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const nom = p.nom || 'Produit'
  const cat = p.categorie || 'Santé'
  const prix = p.prix || 0
  const title = p.meta_title || `${nom} — ${cat} | Abavie Santé`
  const desc = p.meta_description || `${nom}. ${p.description || ''}`.slice(0, 160)
  const points = Array.isArray(p.points_forts) ? p.points_forts : []
  const usage = Array.isArray(p.cas_usage) ? p.cas_usage : []
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: nom,
    description: desc,
    url: `${BASE}${route}`,
    brand: { '@type': 'Brand', name: 'Abavie' },
    category: cat,
    offers: { '@type': 'Offer', price: prix, priceCurrency: 'XOF', availability: 'https://schema.org/InStock' }
  }
  let body = `<p>${esc(desc)}</p>`
  if (points.length) body += `<ul>${points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>`
  if (usage.length) body += `<p><strong>Cas d'usage :</strong> ${usage.map(u => esc(u)).join(' · ')}</p>`
  fs.writeFileSync(path.join(dir, 'index.html'), buildProductHtml(baseHtml, { route, title, desc, h1: nom, bodyHtml: body, jsonLd }))
  productCount++
}
console.log(`✓ /abavie/produit/[id] — ${abavieProducts.length} produits santé`)

console.log(`\n✅ Prerender terminé : ${generatedCount} pages statiques + ${productCount} pages produits = ${generatedCount + productCount} total`)
