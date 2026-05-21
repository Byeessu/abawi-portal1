/**
 * Campagne de lancement ABAWI Portal — injection automatique Marketing 360
 * Usage : node scripts/launch-campaign.mjs
 */

const BASE_URL = process.env.SITE_URL || 'https://abawi.app'
// Fallback: insertion directe Supabase si la fonction Netlify est indisponible
const SUPABASE_URL  = 'https://nqpfmnsecjhqxuvfkqhi.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno'
const OWNER    = 'contactabawi@gmail.com'

// ── Helpers ────────────────────────────────────────────────────────────────
function addDays(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function crud(action, table, payload = {}) {
  // Essaie d'abord via Netlify function
  try {
    const res = await fetch(`${BASE_URL}/.netlify/functions/marketing-crud`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, table, ownerEmail: OWNER, ...payload }),
    })
    const out = await res.json().catch(() => ({}))
    if (res.ok && out?.ok !== false) return out
  } catch { /* ignore */ }

  // Fallback: insertion directe via Supabase REST
  if (action === 'insert') {
    const body = { ...payload.payload, owner_email: OWNER }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Supabase ${res.status}`)
    }
    return res.json()
  }
  throw new Error('Action non supportée en fallback')
}

// ── Posts de la campagne ───────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10)

const CAMPAIGN_POSTS = [

  // ═══════════════════════════════════════════════════════
  // PHASE 1 — TEASING (J-7 à J-3)
  // ═══════════════════════════════════════════════════════

  {
    titre: '🔥 Quelque chose arrive… [Teaser ABAWI]',
    plateforme: 'instagram',
    type_contenu: 'Teaser',
    date_publication: addDays(TODAY, 1),
    heure: '08:00',
    statut: 'planifié',
    contenu: `✨ On a travaillé dur dans l'ombre.

Quelque chose de grand arrive pour les entrepreneurs et étudiants d'Afrique.

📱 Une expérience comme vous n'en avez jamais eu.
🤖 De l'IA. En Français. En Anglais. En Wolof.
🌍 Conçu à Dakar. Pour le monde.

Stay tuned. 👀

#ABAWI #ComingSoon #TechAfrique #Dakar #Sénégal`,
  },

  {
    titre: '⏳ J-5 — Le compte à rebours a commencé',
    plateforme: 'facebook',
    type_contenu: 'Teaser',
    date_publication: addDays(TODAY, 2),
    heure: '10:00',
    statut: 'planifié',
    contenu: `⏳ Dans 5 jours, tout change pour les entrepreneurs africains.

Imaginez :
✅ Un Business Plan de niveau McKinsey généré en 5 minutes
✅ Un coach IA qui vous répond en Wolof
✅ 30+ outils professionnels dans votre poche
✅ Disponible sur votre téléphone, en app

Vous avez toujours voulu le niveau des grands cabinets internationaux.
Sans leurs prix. Sans leurs délais.

🗓️ La réponse arrive dans 5 jours.

Partagez à un entrepreneur que vous connaissez 👇

#ABAWI #AfriqueTech #Entrepreneuriat #Sénégal #Innovation`,
  },

  {
    titre: '🇸🇳 Wolof AI — Premier Coach IA en Wolof [Teaser LinkedIn]',
    plateforme: 'linkedin',
    type_contenu: 'Teaser',
    date_publication: addDays(TODAY, 2),
    heure: '11:00',
    statut: 'planifié',
    contenu: `Dans quelques jours, ABAWI lance quelque chose d'inédit en Afrique.

Un assistant IA expert senior disponible en 🇫🇷 Français, 🇬🇧 English et 🇸🇳 Wolof.

Pourquoi le Wolof ?
→ 90% des Sénégalais comprennent le Wolof
→ Apprendre dans sa langue maternelle = 35% de meilleure rétention
→ L'inclusion numérique commence par la langue

Ce n'est pas qu'un outil. C'est un pont entre le savoir stratégique international et l'entrepreneur africain.

Restez connectés. Le lancement arrive.

#InclusionNumerique #AIAfrica #Wolof #ABAWI #Senegal #EdTech`,
  },

  {
    titre: '📱 L\'app arrive — WhatsApp Teaser',
    plateforme: 'whatsapp',
    type_contenu: 'Teaser',
    date_publication: addDays(TODAY, 3),
    heure: '09:00',
    statut: 'planifié',
    contenu: `Salam tout le monde 🙏

On a une grande nouvelle à vous annoncer très bientôt.

ABAWI sera bientôt disponible en APPLICATION MOBILE ! 📱

✅ Android : disponible dès maintenant
✅ iOS : bientôt disponible

Tout ce que vous aimez sur abawi.sn — guides, outils IA, podcasts — dans votre poche.

Partagez ce message à vos amis entrepreneurs 🚀

À très bientôt !
— L'équipe ABAWI`,
  },

  {
    titre: '⚡ J-3 — Que font les grands quand ils ont un problème business ?',
    plateforme: 'instagram',
    type_contenu: 'Teaser',
    date_publication: addDays(TODAY, 4),
    heure: '08:30',
    statut: 'planifié',
    contenu: `Ils appellent McKinsey. Ils paient 50 millions FCFA.

Tu sais ce que tu vas faire toi dans 3 jours ?

La même chose. En 5 minutes. Depuis ton téléphone.

Business plan ✅
Analyse juridique OHADA ✅
Coach IA en Wolof ✅
Studio design pro ✅

ABAWI Portal arrive dans 3 jours 🔥

Save the date 📅

#ABAWI #BusinessAfrique #Entrepreneuriat #IA #Dakar`,
  },

  // ═══════════════════════════════════════════════════════
  // PHASE 2 — LANCEMENT (J0)
  // ═══════════════════════════════════════════════════════

  {
    titre: '🚀 LANCEMENT OFFICIEL — ABAWI Portal est là !',
    plateforme: 'instagram',
    type_contenu: 'Annonce produit',
    date_publication: addDays(TODAY, 7),
    heure: '08:00',
    statut: 'planifié',
    contenu: `🚀 C'est aujourd'hui. ABAWI Portal est officiel.

L'écosystème digital le plus complet jamais créé pour les entrepreneurs africains.

📱 APPLICATION DISPONIBLE :
→ Android : Téléchargez maintenant
→ iOS : Bientôt

🤖 30+ OUTILS IA PROFESSIONNELS :
→ Business Plan niveau McKinsey
→ Analyse Juridique OHADA
→ Studio Design Pro (logos, affiches)
→ CV Pro, Lettre, Finance Élite...

🌍 MULTILINGUE : 🇫🇷 FR · 🇬🇧 EN · 🇸🇳 Wolof

🎯 Plans à partir de 4 990 FCFA/mois

👉 abawi.app

Partagez à 3 personnes qui ont besoin de ça 🙏

#ABAWI #Lancement #TechAfrique #AfriqueBusiness #Dakar #Sénégal #IA`,
  },

  {
    titre: '🎉 ABAWI Portal — Lancement Officiel [Facebook]',
    plateforme: 'facebook',
    type_contenu: 'Annonce produit',
    date_publication: addDays(TODAY, 7),
    heure: '08:00',
    statut: 'planifié',
    contenu: `🎉 ABAWI Portal est officiellement lancé !

Après des mois de développement, nous sommes fiers de vous présenter l'écosystème digital le plus complet jamais créé pour les entrepreneurs, étudiants et professionnels africains.

🏆 CE QUI FAIT D'ABAWI UN TOURNANT :

1️⃣ INTELLIGENCE ARTIFICIELLE MULTILINGUE
→ 7 modes IA : Recherche, Débat, Simulation, Apprentissage, Quiz, Défi, Annah (vocal)
→ Disponible en Français, Anglais ET Wolof
→ Contexte 100% africain : OHADA, UEMOA, BCEAO, marché sénégalais

2️⃣ 30+ OUTILS PROFESSIONNELS
→ Business Plan Élite (niveau McKinsey / BCG)
→ Studio Design Pro (logos, affiches via Replicate AI)
→ Analyse Juridique OHADA, Finance Élite, RH, Immobilier...
→ CV Pro, Lettre de motivation, Pitch Deck investisseur

3️⃣ 150+ RESSOURCES PREMIUM
→ Guides business, marketing, tech
→ Fascicules scolaires (Bac → Licence)
→ Podcasts analyses économiques

4️⃣ APPLICATION MOBILE
→ Android : disponible maintenant
→ iOS : bientôt

5️⃣ PRIX ACCESSIBLE
→ Plan Gratuit (15 crédits/mois)
→ Starter : 4 990 FCFA/mois
→ Pro : 9 990 FCFA/mois
→ VIP : 49 990 FCFA/mois

👉 Créez votre compte GRATUIT maintenant : abawi.app

#ABAWI #Lancement #TechAfrique #Entrepreneuriat #Sénégal #AfriqueTech`,
  },

  {
    titre: '🌍 ABAWI Portal est lancé — LinkedIn',
    plateforme: 'linkedin',
    type_contenu: 'Annonce produit',
    date_publication: addDays(TODAY, 7),
    heure: '09:00',
    statut: 'planifié',
    contenu: `Aujourd'hui, nous lançons ABAWI Portal.

Après avoir observé un problème concret — les entrepreneurs et étudiants africains n'ont pas accès aux mêmes outils stratégiques que leurs homologues occidentaux — nous avons décidé de changer ça.

ABAWI Portal, c'est :
• 30+ outils IA professionnels (Business Plan, Juridique OHADA, Finance, Studio Design)
• Un coach IA multilingue : Français, Anglais, Wolof
• 150+ ressources premium adaptées au contexte africain
• Des plans à partir de 4 990 FCFA/mois (~8 USD)

Pour comparer : un cabinet conseil facture 150 000 à 500 000 FCFA pour un business plan. ABAWI le génère en 5 minutes pour 250 FCFA en crédits.

Notre conviction : la démocratisation du savoir stratégique est possible. Elle commence aujourd'hui.

👉 abawi.app

#Entrepreneuriat #AfriqueDigitale #IA #OHADA #Sénégal #Innovation #TechAfrique`,
  },

  {
    titre: '🚀 LANCEMENT ABAWI — X/Twitter',
    plateforme: 'twitter',
    type_contenu: 'Annonce produit',
    date_publication: addDays(TODAY, 7),
    heure: '08:00',
    statut: 'planifié',
    contenu: `🚀 ABAWI Portal est lancé !

30+ outils IA pour entrepreneurs africains
🇫🇷 FR · 🇬🇧 EN · 🇸🇳 Wolof
Business plan en 5 min ✅
Application Android disponible ✅
Dès 4 990 FCFA/mois ✅

👉 abawi.app

#ABAWI #TechAfrique #Dakar`,
  },

  {
    titre: '🎁 Jour du lancement — WhatsApp',
    plateforme: 'whatsapp',
    type_contenu: 'Annonce produit',
    date_publication: addDays(TODAY, 7),
    heure: '08:00',
    statut: 'planifié',
    contenu: `🎉 Ça y est ! ABAWI Portal est lancé !

Téléchargez l'app Android maintenant et créez votre compte GRATUIT :
👉 abawi.app

Ce que vous avez maintenant dans votre poche :
✅ Business Plan niveau international
✅ Coach IA en Wolof
✅ Studio Design Pro (logos, affiches)
✅ 150+ guides premium
✅ Et tellement plus...

Partagez à vos amis ! 🙏
#ABAWI`,
  },

  // ═══════════════════════════════════════════════════════
  // PHASE 3 — ACTIVATION (J+1 à J+14)
  // ═══════════════════════════════════════════════════════

  {
    titre: '💡 Focus outil : Business Plan Élite',
    plateforme: 'instagram',
    type_contenu: 'Conseil expert',
    date_publication: addDays(TODAY, 8),
    heure: '10:00',
    statut: 'planifié',
    contenu: `Tu as une idée de business. Maintenant transforme-la en plan solide.

📋 BUSINESS PLAN ÉLITE ABAWI :
→ Executive Summary professionnel
→ Analyse de marché OHADA/UEMOA
→ Projections financières 3 ans
→ SWOT + Plan d'action
→ Prêt pour les banques et investisseurs

En 5 minutes. Depuis ton téléphone. Pour 250 FCFA.

Un cabinet de conseil te facturerait 300 000 FCFA. 🤯

👉 Essaie maintenant : abawi.app/outils

#BusinessPlan #OHADA #Entrepreneuriat #ABAWI #Sénégal`,
  },

  {
    titre: '🎨 Studio Design Pro — Logos et affiches par IA',
    plateforme: 'instagram',
    type_contenu: 'Annonce produit',
    date_publication: addDays(TODAY, 9),
    heure: '09:00',
    statut: 'planifié',
    contenu: `Tu n'as plus besoin d'une agence pour avoir un logo professionnel.

🎨 STUDIO DESIGN PRO ABAWI :
→ Logos vectoriels via Recraft AI
→ Affiches, flyers, posts réseaux
→ Cartes de visite
→ Bannières web
→ Téléchargement PNG haute résolution

Décris ton entreprise → l'IA génère → tu télécharges.

En 10 secondes. Pour 150 FCFA.

👉 abawi.app/outils/studio-design-pro

#Design #Logo #Branding #ABAWI #StartupAfrique`,
  },

  {
    titre: '🗣️ Coach IA en Wolof — Révolution de l\'inclusion',
    plateforme: 'facebook',
    type_contenu: 'Conseil expert',
    date_publication: addDays(TODAY, 10),
    heure: '11:00',
    statut: 'planifié',
    contenu: `Premier coach IA expert senior en Wolof. 🇸🇳

Pourquoi c'est révolutionnaire :

✅ 90% des Sénégalais comprennent le Wolof
✅ Apprendre dans sa langue maternelle = meilleure compréhension
✅ Demander du conseil en wolof = moins de friction
✅ Accessible même à ceux peu à l'aise en français

Exemples de questions en Wolof :
→ "Samp ma jëfandikoo ci xaritu yi ci Sénégal"
   (Parle-moi du marché au Sénégal)
→ "Maangi bëgg jëfandikoo business plan bu baax"
   (Je veux un bon business plan)

L'IA répond avec l'expertise d'un consultant Big 4.
En Wolof.

C'est ça l'inclusion numérique. 🌍

👉 abawi.app/outils/abawi-ia

#Wolof #InclusionNumerique #IA #Sénégal #ABAWI`,
  },

  {
    titre: '📱 L\'app Android — télécharge maintenant',
    plateforme: 'whatsapp',
    type_contenu: 'Post promotionnel',
    date_publication: addDays(TODAY, 11),
    heure: '09:00',
    statut: 'planifié',
    contenu: `📱 L'app ABAWI Portal est disponible sur Android !

Comment installer :
1️⃣ Va sur abawi.app
2️⃣ Clique "Installer l'application" (ou télécharge l'APK)
3️⃣ Accepte l'installation depuis source externe
4️⃣ Ouvre l'app et crée ton compte GRATUIT

L'app se met à jour automatiquement à chaque fois qu'on améliore le site 🔄

Partage à tes contacts ! 🙏`,
  },

  {
    titre: '💰 Comparatif : ABAWI vs Consultants traditionnels',
    plateforme: 'linkedin',
    type_contenu: 'Conseil expert',
    date_publication: addDays(TODAY, 12),
    heure: '10:00',
    statut: 'planifié',
    contenu: `Les chiffres qui parlent d'eux-mêmes.

ABAWI vs Cabinet conseil traditionnel :

| Service | Cabinet | ABAWI |
|---|---|---|
| Business plan | 150-500K FCFA | 250 FCFA |
| Analyse juridique | 50-200K FCFA | 400 FCFA |
| Logo pro | 50-500K FCFA | 150 FCFA |
| Formation 3 mois | 200K-1M FCFA | 9 990/mois |

Même qualité. 99% moins cher.

Ce n'est pas de la démagogie. C'est de la technologie mise au service de l'Afrique.

👉 abawi.app

#Entrepreneuriat #ROI #TechAfrique #ABAWI #Business`,
  },

  {
    titre: '🎯 Rejoins ABAWI+ — Offre de lancement',
    plateforme: 'instagram',
    type_contenu: 'Post promotionnel',
    date_publication: addDays(TODAY, 14),
    heure: '08:00',
    statut: 'planifié',
    contenu: `🎯 OFFRE DE LANCEMENT ABAWI+

Tout ce dont tu as besoin pour ton business :

📦 PLAN PRO — 9 990 FCFA/mois
✅ 300 crédits IA/mois
✅ Accès illimité guides + fascicules
✅ ABAWI 360 (CRM, Stats, Marketing)
✅ 30+ outils IA Élite
✅ Support prioritaire WhatsApp

C'est moins cher qu'un déjeuner par semaine.
Pour des outils de niveau international. 🌍

👉 abawi.app/plans

#ABAWI #AbawiPlus #Entrepreneuriat #Sénégal #Business #IA`,
  },

]

// ── Campagnes à créer ───────────────────────────────────────────────────────
const CAMPAGNES = [
  {
    nom: 'Lancement ABAWI Portal — Phase Teasing',
    plateforme: 'instagram',
    budget: 50000,
    date_debut: addDays(TODAY, 1),
    date_fin: addDays(TODAY, 6),
    statut: 'active',
    objectif: 'Notoriété & anticipation — 10K impressions',
    notes: 'Phase teasing pré-lancement. Posts mystère et compte à rebours.',
  },
  {
    nom: 'Lancement ABAWI Portal — Jour J',
    plateforme: 'facebook',
    budget: 100000,
    date_debut: addDays(TODAY, 7),
    date_fin: addDays(TODAY, 7),
    statut: 'active',
    objectif: 'Acquisition — 500 inscriptions jour J',
    notes: 'Annonce officielle tous réseaux. Budget pub concentré sur J0.',
  },
  {
    nom: 'Activation & Conversion post-lancement',
    plateforme: 'linkedin',
    budget: 150000,
    date_debut: addDays(TODAY, 8),
    date_fin: addDays(TODAY, 21),
    statut: 'active',
    objectif: 'Conversion — 200 abonnements payants',
    notes: 'Posts features, comparatifs, témoignages. CTA vers plans.',
  },
]

// ── Main ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('🚀 Injection campagne de lancement ABAWI Portal...\n')

  // 1. Créer les campagnes
  console.log('📊 Création des campagnes...')
  for (const camp of CAMPAGNES) {
    try {
      await crud('insert', 'marketing_campagnes', { payload: { ...camp, depense: 0, revenus: 0 } })
      console.log(`  ✅ Campagne: ${camp.nom}`)
    } catch (e) {
      console.log(`  ⚠️  ${camp.nom}: ${e.message}`)
    }
  }

  // 2. Créer les posts
  console.log('\n📝 Planification des posts...')
  let ok = 0, fail = 0
  for (const post of CAMPAIGN_POSTS) {
    try {
      await crud('insert', 'marketing_posts', { payload: post })
      console.log(`  ✅ [${post.plateforme.padEnd(9)}] J+${post.date_publication.slice(8)} ${post.heure} — ${post.titre.slice(0, 50)}`)
      ok++
    } catch (e) {
      console.log(`  ❌ ${post.titre.slice(0, 40)}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n✅ Campagne injectée: ${ok} posts planifiés, ${fail} erreurs`)
  console.log('📅 Calendrier visible sur: abawi.sn/abawi360 → Marketing')
  console.log('\nPlanification:')
  console.log(`  J+1  à J+6  : Phase Teasing (${addDays(TODAY, 1)} → ${addDays(TODAY, 6)})`)
  console.log(`  J+7         : Lancement officiel (${addDays(TODAY, 7)})`)
  console.log(`  J+8  à J+14 : Activation & Conversion`)
}

run().catch(console.error)
