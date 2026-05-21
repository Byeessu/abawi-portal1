/**
 * Campagne de lancement ABAWI — Suite & Completion
 * TikTok + Twitter série + Semaine 3-4 rétention + Email newsletter
 */

const SUPABASE_URL  = 'https://nqpfmnsecjhqxuvfkqhi.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno'
const OWNER = 'contactabawi@gmail.com'

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function insert(post) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/marketing_posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON,
      'Authorization': `Bearer ${ANON}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ ...post, owner_email: OWNER }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
}

const POSTS = [

  // ════════════════════════════════════════════════
  // TIKTOK — 5 posts (format court, hook percutant)
  // ════════════════════════════════════════════════

  {
    titre: '🎬 TikTok — POV: tu fais un business plan en 5 min',
    plateforme: 'tiktok',
    type_contenu: 'Teaser',
    date_publication: addDays(2),
    heure: '18:00',
    statut: 'planifié',
    contenu: `POV: t'as une idée de business mais 0 FCFA pour un consultant 😅

⏱️ Regarde ce qui se passe en 5 minutes sur ABAWI…

✅ Executive Summary pro
✅ Analyse marché Sénégal/OHADA
✅ Projections financières 3 ans
✅ Plan d'action détaillé

Un cabinet te facturerait 300 000 FCFA.
Nous : 250 FCFA. 💀

🔗 abawi.app
#ABAWI #BusinessPlan #Entrepreneuriat #Sénégal #TechAfrique #IA #Dakar`,
  },

  {
    titre: '🎬 TikTok — Le premier coach IA en Wolof 🇸🇳',
    plateforme: 'tiktok',
    type_contenu: 'Annonce produit',
    date_publication: addDays(5),
    heure: '19:00',
    statut: 'planifié',
    contenu: `Personne n'avait encore fait ça. Nous l'avons fait. 🇸🇳

Un coach IA expert senior qui répond en WOLOF.

Domaines couverts en Wolof :
→ Droit des affaires OHADA
→ Comptabilité SYSCOHADA
→ Marketing digital
→ Business plan
→ Finance entreprise

90% des Sénégalais comprennent le Wolof.
Maintenant ils ont tous accès aux meilleurs conseils business.

C'est ça l'Afrique Tech. 🌍

🔗 Lien en bio
#Wolof #ABAWI #InclusionNumerique #Sénégal #AfriqueTech`,
  },

  {
    titre: '🎬 TikTok — Jour du lancement officiel',
    plateforme: 'tiktok',
    type_contenu: 'Annonce produit',
    date_publication: addDays(7),
    heure: '08:00',
    statut: 'planifié',
    contenu: `C'est aujourd'hui. 🚀

ABAWI Portal est officiellement lancé.

30+ outils IA pour les entrepreneurs africains :
🎨 Studio Design (logos, affiches)
📋 Business Plan niveau McKinsey
⚖️ Juridique OHADA
💰 Finance Élite
🎤 Coach vocal Annah

En Français 🇫🇷 · Anglais 🇬🇧 · Wolof 🇸🇳

📱 Application Android disponible maintenant
🍎 iOS : très bientôt

Dès 4 990 FCFA/mois. C'est moins cher que ton abonnement Canal+ 😅

🔗 abawi.app
#ABAWI #Lancement #TechAfrique #IA #Sénégal #Dakar`,
  },

  {
    titre: '🎬 TikTok — Studio Design : logo en 10 secondes',
    plateforme: 'tiktok',
    type_contenu: 'Conseil expert',
    date_publication: addDays(11),
    heure: '17:00',
    statut: 'planifié',
    contenu: `Tu paies combien pour ton logo ? 👀

Une agence à Dakar : 50 000 – 500 000 FCFA
Freelance : 15 000 – 50 000 FCFA
ABAWI Studio Design Pro : 150 FCFA ✅

Et le résultat ?
→ Logo vectoriel professionnel
→ Affiche publicitaire
→ Post Instagram
→ Carte de visite
→ Bannière web

Powered by Recraft AI + FLUX.

10 secondes. 150 FCFA.

Arrêtons de surpayer le design. 🎨

🔗 abawi.app/outils/studio-design-pro
#Design #Logo #Branding #ABAWI #StartupAfrique #Dakar`,
  },

  {
    titre: '🎬 TikTok — App ABAWI disponible sur Android',
    plateforme: 'tiktok',
    type_contenu: 'Post promotionnel',
    date_publication: addDays(15),
    heure: '18:00',
    statut: 'planifié',
    contenu: `Tout ABAWI dans votre poche. 📱

L'application Android est disponible maintenant !

Ce que vous avez dans votre téléphone :
✅ 30+ outils IA pro
✅ 150+ guides business premium
✅ Coach IA Wolof/FR/EN
✅ Studio Design Pro
✅ Podcasts + fascicules scolaires

Et le meilleur ? L'app se met à jour automatiquement.
Chaque amélioration du site = votre app améliorée. 🔄

Téléchargez maintenant.
🔗 abawi.app

#ABAWI #Android #App #TechAfrique #Sénégal`,
  },

  // ════════════════════════════════════════════════
  // TWITTER/X — Série de tweets (5 posts)
  // ════════════════════════════════════════════════

  {
    titre: 'Twitter — Thread lancement ABAWI 1/5',
    plateforme: 'twitter',
    type_contenu: 'Annonce produit',
    date_publication: addDays(7),
    heure: '09:00',
    statut: 'planifié',
    contenu: `🧵 THREAD : On a lancé ABAWI Portal aujourd'hui.

Voici pourquoi c'est un tournant pour les entrepreneurs africains.

1/ Le problème qu'on résout 👇`,
  },

  {
    titre: 'Twitter — Thread lancement ABAWI 2/5',
    plateforme: 'twitter',
    type_contenu: 'Annonce produit',
    date_publication: addDays(7),
    heure: '09:05',
    statut: 'planifié',
    contenu: `2/ Le problème :

Un entrepreneur africain qui veut un business plan pro paie 150 000-500 000 FCFA.
Un étudiant sénégalais paie 200 000-2M pour se former.
Un logo pro : 50 000-500 000 FCFA.

Ces prix excluent 90% de ceux qui en ont le plus besoin.`,
  },

  {
    titre: 'Twitter — Thread lancement ABAWI 3/5',
    plateforme: 'twitter',
    type_contenu: 'Annonce produit',
    date_publication: addDays(7),
    heure: '09:10',
    statut: 'planifié',
    contenu: `3/ Notre réponse :

@ABAWI_SN = 30+ outils IA pro pour entrepreneurs africains.

Business plan → 250 FCFA
Logo pro → 150 FCFA
Analyse juridique OHADA → 400 FCFA
Formation complète → 9 990 FCFA/mois

Même qualité. 99% moins cher.`,
  },

  {
    titre: 'Twitter — Thread lancement ABAWI 4/5',
    plateforme: 'twitter',
    type_contenu: 'Annonce produit',
    date_publication: addDays(7),
    heure: '09:15',
    statut: 'planifié',
    contenu: `4/ Ce qu'on a fait en plus :

Premier coach IA en 🇸🇳 Wolof.
App Android disponible.
150+ ressources premium.
20+ services dans un écosystème.

Conçu à Dakar. Pour 25+ pays africains.`,
  },

  {
    titre: 'Twitter — Thread lancement ABAWI 5/5',
    plateforme: 'twitter',
    type_contenu: 'Annonce produit',
    date_publication: addDays(7),
    heure: '09:20',
    statut: 'planifié',
    contenu: `5/ Essaie maintenant — c'est GRATUIT.

👉 abawi.app

Plan gratuit : 15 crédits IA/mois
Plan Starter : 4 990 FCFA/mois (100 crédits)
Plan Pro : 9 990 FCFA/mois (300 crédits)

RT si tu connais un entrepreneur africain qui a besoin de ça 🙏

#ABAWI #TechAfrique #Entrepreneuriat #Sénégal`,
  },

  // ════════════════════════════════════════════════
  // WHATSAPP — Messages hebdomadaires semaine 3-4
  // ════════════════════════════════════════════════

  {
    titre: 'WhatsApp — Semaine 2 : témoignage utilisateur',
    plateforme: 'whatsapp',
    type_contenu: 'Témoignage client',
    date_publication: addDays(14),
    heure: '10:00',
    statut: 'planifié',
    contenu: `Bonjour ! 🙏

Depuis le lancement d'ABAWI Portal, les retours sont incroyables.

Voici ce que nos utilisateurs disent :

💬 "J'ai généré un business plan en 5 minutes pour présenter à la banque. Avant je payais 200 000 FCFA un consultant."
— Mamadou, entrepreneur Dakar

💬 "Le coach IA en Wolof c'est révolutionnaire. Je comprends tout maintenant."
— Aïssatou, étudiante UCAD

💬 "Le Studio Design a créé mon logo + affiche pour mon restaurant. Qualité professionnelle."
— Ibrahim, restaurateur Saint-Louis

👉 Rejoins-nous : abawi.app

Plans dès 4 990 FCFA/mois 🚀`,
  },

  {
    titre: 'WhatsApp — Semaine 3 : nouveauté Arkel Up',
    plateforme: 'whatsapp',
    type_contenu: 'Annonce produit',
    date_publication: addDays(21),
    heure: '09:00',
    statut: 'planifié',
    contenu: `Grande nouvelle ! 🎉

ABAWI x ARKEL UP CENTER

Formation professionnelle physique ET digitale à Dakar :
📍 Espace coworking : 15 000 FCFA/mois
💻 PC avec paiement échelonné (15% + 3-6 mois)
🎓 Formations certifiantes (70% pratique)
🤖 Coach IA en Wolof, Français, Anglais
💼 Job clinic + réseau alumni

L'inclusion numérique concrète. Dakar d'abord, puis Afrique.

Plus d'infos : abawi.app/arkel-up-center`,
  },

  {
    titre: 'WhatsApp — Semaine 4 : offre spéciale abonnement',
    plateforme: 'whatsapp',
    type_contenu: 'Post promotionnel',
    date_publication: addDays(28),
    heure: '09:00',
    statut: 'planifié',
    contenu: `⏰ Offre spéciale — 1 mois seulement

Pour fêter notre lancement, on offre :

🎁 Plan Pro à 7 490 FCFA (au lieu de 9 990)
→ 300 crédits IA/mois
→ Accès illimité guides + fascicules
→ ABAWI 360 complet
→ Support WhatsApp prioritaire

Valable jusqu'à fin mai 2026.

👉 abawi.app/plans

Code promo : LAUNCH26 🚀`,
  },

  // ════════════════════════════════════════════════
  // FACEBOOK — Semaine 3-4 rétention & conversion
  // ════════════════════════════════════════════════

  {
    titre: 'Facebook — Success story entrepreneur Sénégal',
    plateforme: 'facebook',
    type_contenu: 'Témoignage client',
    date_publication: addDays(16),
    heure: '11:00',
    statut: 'planifié',
    contenu: `🌟 Comment Fatou a transformé son idée en business en 48h avec ABAWI

Fatou, 29 ans, couturière à Thiès, avait une idée de boutique en ligne.
Problème : elle ne savait pas par où commencer.

Avec ABAWI Portal, en 2 jours :
✅ Business plan complet généré (Executive Summary, analyse marché, projections)
✅ Logo professionnel créé en 10 secondes via Studio Design
✅ Lettre de motivation pour demande de financement DER écrite
✅ Contrat fournisseur généré via Juridique OHADA

Résultat : dossier DER déposé et accepté. Boutique lancée.

Et vous ? Quelle est votre prochaine étape business ?
👇 Dites-nous en commentaire

👉 Créez votre compte gratuit : abawi.app

#ABAWI #SuccessStory #Entrepreneuriat #Femme #Sénégal`,
  },

  {
    titre: 'Facebook — Guide complet des outils ABAWI',
    plateforme: 'facebook',
    type_contenu: 'Conseil expert',
    date_publication: addDays(23),
    heure: '10:00',
    statut: 'planifié',
    contenu: `📋 GUIDE COMPLET : Quel outil ABAWI pour quel besoin ?

Tu démarres une entreprise ?
→ Business Plan Élite + Juridique OHADA + CV Pro

Tu cherches un emploi ?
→ CV Pro + Lettre de Motivation + Simulation entretien (IA)

Tu veux développer ton business ?
→ Finance Élite + Consultant Élite + ABAWI 360 CRM

Tu as besoin de visibilité ?
→ Studio Design Pro + Infographie + Marketing 360

Tu veux apprendre ?
→ ABAWI IA (7 modes) + Guides premium + Fascicules

Tu recrutes ?
→ RH Élite + RecruteMoiSN + Analyse CV

👉 Tout ça sur : abawi.app
Plans dès 4 990 FCFA/mois 🚀

#ABAWI #Guide #Entrepreneuriat #Sénégal #Business`,
  },

  // ════════════════════════════════════════════════
  // INSTAGRAM — Semaine 3-4 engagement & conversion
  // ════════════════════════════════════════════════

  {
    titre: 'Instagram — Swipe : Les 5 raisons de choisir ABAWI',
    plateforme: 'instagram',
    type_contenu: 'Conseil expert',
    date_publication: addDays(17),
    heure: '09:00',
    statut: 'planifié',
    contenu: `5 raisons pour lesquelles les entrepreneurs africains choisissent ABAWI 👇

1️⃣ PRIX AFRICAIN
Plans dès 4 990 FCFA/mois (~8 USD)
Pas en dollars, pas en euros — en FCFA.

2️⃣ CONTEXTE LOCAL
OHADA, SYSCOHADA, BCEAO, marché sénégalais
100% adapté — pas un copier-coller occidental

3️⃣ WOLOF + FRANÇAIS + ANGLAIS
Premier coach IA en Wolof d'Afrique de l'Ouest 🇸🇳

4️⃣ TOUT EN UN
30+ outils + 150+ ressources + Formation + CRM
Une seule plateforme pour tout gérer

5️⃣ MOBILE-FIRST
Application Android disponible
Fonctionne avec peu de connexion

Lequel te convainc le plus ? 👇

👉 abawi.app

#ABAWI #Entrepreneuriat #Sénégal #TechAfrique #IA`,
  },

  {
    titre: 'Instagram — Quiz : Quel outil ABAWI es-tu ?',
    plateforme: 'instagram',
    type_contenu: 'Post promotionnel',
    date_publication: addDays(20),
    heure: '18:00',
    statut: 'planifié',
    contenu: `🧠 QUIZ : Quel outil ABAWI corresponds à ta situation ?

Réponds en commentaire avec ta lettre :

A) J'ai une idée mais pas de plan structuré
→ Business Plan Élite t'attend 📋

B) Je cherche du travail et mon CV est basique
→ CV Pro + Lettre de Motivation 💼

C) Mon entreprise existe mais je galère à gérer
→ ABAWI 360 (CRM, Finance, RH) 📊

D) J'ai besoin d'un logo et de visuels pro
→ Studio Design Pro 🎨

E) Je veux apprendre et monter en compétence
→ ABAWI IA en Wolof/FR/EN 🤖

Dis-nous en commentaire ! 👇

👉 abawi.app

#ABAWI #Quiz #Entrepreneuriat #Business #Sénégal`,
  },

  {
    titre: 'Instagram — ABAWI 360 : tour de contrôle business',
    plateforme: 'instagram',
    type_contenu: 'Annonce produit',
    date_publication: addDays(25),
    heure: '10:00',
    statut: 'planifié',
    contenu: `Tu gères ton business encore avec des cahiers ? 📓

Il est temps d'upgrader. Voici ABAWI 360 :

📊 CRM — Gérez vos clients et pipeline
📋 Planification — Projets, tâches, deadlines
💰 Finance — Comptabilité, facturation, trésorerie
⚖️ Juridique — Documents OHADA en 2 min
👥 RH — Paie, contrats, évaluations
📈 Marketing 360 — Calendrier, campagnes, analytics

Tout ça dans une interface claire et mobile.
Conçu pour les PME africaines.

Inclus dans le plan Pro à 9 990 FCFA/mois.

👉 abawi.app/abawi360

#ABAWI360 #CRM #PME #Entrepreneuriat #Sénégal #Business`,
  },

  // ════════════════════════════════════════════════
  // LINKEDIN — Articles professionnels semaine 3-4
  // ════════════════════════════════════════════════

  {
    titre: 'LinkedIn — Article : L\'IA change les règles du business en Afrique',
    plateforme: 'linkedin',
    type_contenu: 'Conseil expert',
    date_publication: addDays(18),
    heure: '08:00',
    statut: 'planifié',
    contenu: `L'Intelligence Artificielle est en train de réécrire les règles du business en Afrique de l'Ouest.

Et ABAWI en est la preuve.

Voici 3 changements que j'observe :

1. LA FIN DE L'ASYMÉTRIE D'INFORMATION
Avant : seules les grandes entreprises avaient accès aux analyses de marché, aux projections financières calibrées, aux frameworks stratégiques.
Aujourd'hui : une PME de Kaolack peut générer le même niveau d'analyse qu'une multinationale dakaroise.

2. LA LANGUE COMME VECTEUR D'INCLUSION
Le Wolof n'était pas une langue de business formalisé.
Avec ABAWI IA, c'est maintenant la langue d'un coach expert senior disponible 24h/24.
Ce n'est pas anecdotique. C'est structurel.

3. LE TEMPS COMME AVANTAGE COMPÉTITIF
Un business plan prenait 2-4 semaines avec un consultant.
Il prend maintenant 5 minutes.
Les entrepreneurs africains qui adoptent ces outils aujourd'hui auront une longueur d'avance irréversible.

Ce n'est pas une promesse. C'est ce que nous voyons avec nos utilisateurs sur abawi.app.

L'Afrique ne rattrape pas son retard technologique.
Elle prend une autre route.

#IA #TechAfrique #Entrepreneuriat #Innovation #Sénégal #ABAWI`,
  },

  {
    titre: 'LinkedIn — Partenariats B2B ABAWI',
    plateforme: 'linkedin',
    type_contenu: 'Annonce produit',
    date_publication: addDays(26),
    heure: '09:00',
    statut: 'planifié',
    contenu: `Vous dirigez une entreprise de 10+ personnes ?

ABAWI propose des solutions B2B adaptées :

🏢 PLAN ENTREPRISE
→ Accès multi-comptes (5-20 sièges)
→ Tableau de bord RH centralisé
→ Formations certifiantes pour vos équipes
→ Support dédié WhatsApp
→ Facturation mensuelle

Cas d'usage concrets :
• Former vos commerciaux au pitch et à la négociation (Simulation IA)
• Générer des analyses financières hebdomadaires (Finance Élite)
• Automatiser la rédaction de vos contrats OHADA (Juridique Élite)
• Manager vos projets et équipes (ABAWI 360)

Économie estimée : 70% vs cabinet conseil ou formation classique.

Intéressé ? Contactez-nous :
📧 contact@abawi.sn
📱 +221 77 518 50 50

👉 abawi.app

#B2B #Entreprise #Formation #ABAWI #Sénégal #RH`,
  },

]

async function run() {
  console.log(`🚀 Injection suite campagne — ${POSTS.length} nouveaux posts\n`)

  const byPlatform = {}
  let ok = 0, fail = 0

  for (const post of POSTS) {
    try {
      await insert(post)
      byPlatform[post.plateforme] = (byPlatform[post.plateforme] || 0) + 1
      console.log(`  ✅ [${post.plateforme.padEnd(9)}] ${post.date_publication} ${post.heure} — ${post.titre.slice(0, 55)}`)
      ok++
    } catch (e) {
      console.log(`  ❌ [${post.plateforme}] ${post.titre.slice(0, 40)}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n✅ ${ok} posts ajoutés, ${fail} erreurs\n`)
  console.log('📊 Répartition finale par plateforme :')
  Object.entries(byPlatform).sort((a,b) => b[1]-a[1]).forEach(([p,n]) => {
    console.log(`   ${p.padEnd(10)} +${n} posts`)
  })

  console.log('\n📅 Calendrier complet:')
  console.log('  J+1  → J+6   : Teasing (Instagram, Facebook, LinkedIn, WhatsApp, TikTok)')
  console.log('  J+7          : Lancement officiel TOUS réseaux simultanément')
  console.log('  J+8  → J+14  : Activation features (tous réseaux)')
  console.log('  J+15 → J+21  : Rétention semaine 3 (témoignages, success stories)')
  console.log('  J+22 → J+28  : Conversion semaine 4 (B2B, offres, quiz)')
  console.log('\n👉 Visible sur abawi.sn → ABAWI 360 → Marketing')
}

run().catch(console.error)
