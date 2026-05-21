// ─── Arkel Up Center — Cours complets avec curriculum exhaustif ───

export const SEED_COURSES = [
  // ════════════════════════════════════════════════════════════════════
  // C1 — Entrepreneuriat Digital en Afrique (20h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c1',title:'Entrepreneuriat Digital en Afrique',category:'Business',instructor:'Dr. Aminata Diallo',instructorId:'f1',level:'débutant',duration:20,price:49900,enrolled:78,rating:4.8,status:'published',description:"Lancez votre startup en Afrique de l'Ouest : stratégie, financement, pitch, écosystème tech. Programme 100% pratique.",tags:['startup','digital','afrique'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux de l\'entrepreneuriat',lessons:[
      {id:'l1',title:'Mindset entrepreneur : de l\'idée à l\'action',type:'video',duration:25},
      {id:'l2',title:'Lean Startup & validation rapide',type:'video',duration:30},
      {id:'l3',title:'Exercice : définition de votre problem-solution fit',type:'exercise',duration:20},
      {id:'l4',title:'Quiz — Fondamentaux',type:'quiz',duration:15},
    ]},
    {id:'ch2',title:'Module 2 — Écosystème startup africain',lessons:[
      {id:'l5',title:'Panorama tech Afrique de l\'Ouest',type:'video',duration:25},
      {id:'l6',title:'Hubs, incubateurs et accélérateurs',type:'video',duration:20},
      {id:'l7',title:'Réglementation & cadre juridique local',type:'video',duration:25},
      {id:'l8',title:'Étude de cas : Wave, Overtime, Volo',type:'reading',duration:20},
    ]},
    {id:'ch3',title:'Module 3 — Business Model & Validation',lessons:[
      {id:'l9',title:'Business Model Canvas adapté à l\'Afrique',type:'video',duration:30},
      {id:'l10',title:'Modèles économiques : Freemium vs Premium',type:'video',duration:25},
      {id:'l11',title:'Tests utilisateurs & interviews clients',type:'video',duration:25},
      {id:'l12',title:'Exercice : construction du BMC de votre projet',type:'exercise',duration:30},
      {id:'l13',title:'Quiz — Business Model',type:'quiz',duration:15},
    ]},
    {id:'ch4',title:'Module 4 — Financement & Pitch',lessons:[
      {id:'l14',title:'Sources de financement en Afrique',type:'video',duration:25},
      {id:'l15',title:'Le pitch deck qui convainc',type:'video',duration:30},
      {id:'l16',title:'Présentation devant des investisseurs',type:'video',duration:25},
      {id:'l17',title:'Exercice : création de votre pitch deck',type:'project',duration:40},
      {id:'l18',title:'Quiz — Financement',type:'quiz',duration:15},
    ]},
    {id:'ch5',title:'Module 5 — Lancement & Croissance',lessons:[
      {id:'l19',title:'MVP & itération rapide',type:'video',duration:25},
      {id:'l20',title:'Acquisition des premiers clients',type:'video',duration:25},
      {id:'l21',title:'Growth hacking pour le marché africain',type:'video',duration:25},
      {id:'l22',title:'Métriques essentielles & tableau de bord',type:'video',duration:20},
      {id:'l23',title:'Exercice : plan de lancement 90 jours',type:'project',duration:30},
    ]},
    {id:'ch6',title:'Module 6 — Projets finaux & Certification',lessons:[
      {id:'l24',title:'Étude de cas : startup Sénégalaise réussie',type:'video',duration:30},
      {id:'l25',title:'Projet final : présentation de votre startup',type:'project',duration:60},
      {id:'l26',title:'Session live Q&R avec Dr. Diallo',type:'live',duration:45},
      {id:'l27',title:'Examen final & certification',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C2 — Développement Web Full Stack (80h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c2',title:'Développement Web Full Stack',category:'Tech',instructor:'Ibrahima Sow',instructorId:'f2',level:'intermédiaire',duration:80,price:89900,enrolled:124,rating:4.9,status:'coming',description:'HTML, CSS, JavaScript, React, Node.js, bases de données. De zéro à développeur complet en 3 mois.',tags:['web','react','nodejs','javascript'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux du Web',lessons:[
      {id:'l1',title:'Comment fonctionne Internet',type:'video',duration:30},
      {id:'l2',title:'HTML5 sémantique & accessibilité',type:'video',duration:45},
      {id:'l3',title:'CSS3, Flexbox & Grid Layout',type:'video',duration:50},
      {id:'l4',title:'Responsive Design & Mobile First',type:'video',duration:40},
      {id:'l5',title:'Exercice : landing page responsive',type:'exercise',duration:60},
      {id:'l6',title:'Quiz — HTML/CSS',type:'quiz',duration:20},
    ]},
    {id:'ch2',title:'Module 2 — JavaScript Moderne',lessons:[
      {id:'l7',title:'Variables, types & opérateurs ES6+',type:'video',duration:40},
      {id:'l8',title:'Fonctions, arrow functions & closures',type:'video',duration:45},
      {id:'l9',title:'Async/await, Promises & fetch API',type:'video',duration:50},
      {id:'l10',title:'DOM manipulation & événements',type:'video',duration:45},
      {id:'l11',title:'Exercice : application météo avec API',type:'exercise',duration:90},
      {id:'l12',title:'Quiz — JavaScript',type:'quiz',duration:25},
    ]},
    {id:'ch3',title:'Module 3 — React & Écosystème Frontend',lessons:[
      {id:'l13',title:'Composants, JSX & props',type:'video',duration:45},
      {id:'l14',title:'Hooks : useState, useEffect, useRef',type:'video',duration:55},
      {id:'l15',title:'Gestion d\'état avec Context & Reducers',type:'video',duration:50},
      {id:'l16',title:'React Router & navigation',type:'video',duration:40},
      {id:'l17',title:'Styled Components & Tailwind CSS',type:'video',duration:45},
      {id:'l18',title:'Exercice : dashboard React avec données',type:'exercise',duration:120},
      {id:'l19',title:'Quiz — React',type:'quiz',duration:30},
    ]},
    {id:'ch4',title:'Module 4 — Backend Node.js & Express',lessons:[
      {id:'l20',title:'Node.js, npm & modules',type:'video',duration:35},
      {id:'l21',title:'Express : routing & middleware',type:'video',duration:50},
      {id:'l22',title:'Authentification JWT & sessions',type:'video',duration:55},
      {id:'l23',title:'Gestion des erreurs & logging',type:'video',duration:30},
      {id:'l24',title:'Exercice : API REST complète',type:'exercise',duration:120},
      {id:'l25',title:'Quiz — Backend',type:'quiz',duration:25},
    ]},
    {id:'ch5',title:'Module 5 — Bases de Données',lessons:[
      {id:'l26',title:'SQL fondamental : SELECT, JOIN, INDEX',type:'video',duration:45},
      {id:'l27',title:'PostgreSQL & Prisma ORM',type:'video',duration:55},
      {id:'l28',title:'MongoDB & Mongoose',type:'video',duration:50},
      {id:'l29',title:'Modélisation & normalisation',type:'video',duration:40},
      {id:'l30',title:'Exercice : base de données e-commerce',type:'exercise',duration:90},
      {id:'l31',title:'Quiz — Bases de données',type:'quiz',duration:25},
    ]},
    {id:'ch6',title:'Module 6 — Tests, Sécurité & Déploiement',lessons:[
      {id:'l32',title:'Tests unitaires avec Jest',type:'video',duration:40},
      {id:'l33',title:'Tests E2E avec Playwright',type:'video',duration:45},
      {id:'l34',title:'Sécurité web : XSS, CSRF, injections',type:'video',duration:50},
      {id:'l35',title:'Déploiement Vercel, Railway, Render',type:'video',duration:40},
      {id:'l36',title:'CI/CD avec GitHub Actions',type:'video',duration:35},
      {id:'l37',title:'Exercice : pipeline CI/CD',type:'exercise',duration:60},
    ]},
    {id:'ch7',title:'Module 7 — Projet Full Stack Final',lessons:[
      {id:'l38',title:'Cahier des charges & architecture',type:'video',duration:30},
      {id:'l39',title:'Développement itération 1 — Auth & CRUD',type:'project',duration:180},
      {id:'l40',title:'Développement itération 2 — Features avancées',type:'project',duration:180},
      {id:'l41',title:'Développement itération 3 — Polish & Tests',type:'project',duration:120},
      {id:'l42',title:'Déploiement & présentation',type:'project',duration:60},
    ]},
    {id:'ch8',title:'Module 8 — Session live & Certification',lessons:[
      {id:'l43',title:'Code review collective',type:'live',duration:60},
      {id:'l44',title:'Préparation entretien technique',type:'video',duration:45},
      {id:'l45',title:'Session Q&R avec Ibrahima Sow',type:'live',duration:60},
      {id:'l46',title:'Examen final pratique',type:'quiz',duration:90},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C3 — Comptabilité SYSCOHADA pour PME (40h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c3',title:'Comptabilité SYSCOHADA pour PME',category:'Finance',instructor:'Fatou Ndiaye',instructorId:'f3',level:'débutant',duration:40,price:59900,enrolled:52,rating:4.6,status:'coming',description:'Maîtrisez la comptabilité SYSCOHADA appliquée aux PME sénégalaises. Bilan, compte de résultat, TVA, paie.',tags:['comptabilité','syscohada','pme','finance'],
  chapters:[
    {id:'ch1',title:'Module 1 — Introduction à la comptabilité',lessons:[
      {id:'l1',title:'Rôle & importance de la comptabilité',type:'video',duration:25},
      {id:'l2',title:'Le système SYSCOHADA : historique & réforme',type:'video',duration:30},
      {id:'l3',title:'Le plan comptable & les classes de comptes',type:'video',duration:35},
      {id:'l4',title:'Exercice : identification de comptes',type:'exercise',duration:25},
      {id:'l5',title:'Quiz — Introduction',type:'quiz',duration:20},
    ]},
    {id:'ch2',title:'Module 2 — Les Opérations Courantes',lessons:[
      {id:'l6',title:'Les documents commerciaux essentiels',type:'video',duration:30},
      {id:'l7',title:'Enregistrement des achats & ventes',type:'video',duration:35},
      {id:'l8',title:'La TVA : calcul, déduction, remboursement',type:'video',duration:40},
      {id:'l9',title:'Les opérations de trésorerie',type:'video',duration:30},
      {id:'l10',title:'Exercice : enregistrements journaliers',type:'exercise',duration:45},
    ]},
    {id:'ch3',title:'Module 3 — Immobilisations & Amortissements',lessons:[
      {id:'l11',title:'Classification des immobilisations',type:'video',duration:25},
      {id:'l12',title:'Calcul des amortissements linéaires & dégressifs',type:'video',duration:35},
      {id:'l13',title:'Cessions & plus-values',type:'video',duration:30},
      {id:'l14',title:'Exercice : tableau d\'amortissement complet',type:'exercise',duration:50},
      {id:'l15',title:'Quiz — Immobilisations',type:'quiz',duration:20},
    ]},
    {id:'ch4',title:'Module 4 — États Financiers',lessons:[
      {id:'l16',title:'Le Bilan : actif & passif',type:'video',duration:35},
      {id:'l17',title:'Le Compte de Résultat',type:'video',duration:35},
      {id:'l18',title:'Le Tableau des Flux de Trésorerie',type:'video',duration:30},
      {id:'l19',title:'Les Notes annexes',type:'video',duration:25},
      {id:'l20',title:'Exercice : établissement d\'un bilan complet',type:'exercise',duration:60},
    ]},
    {id:'ch5',title:'Module 5 — Paie & Charges Sociales',lessons:[
      {id:'l21',title:'Le bulletin de paie sénégalais',type:'video',duration:35},
      {id:'l22',title:'IPRES, CSS, AMO & autres cotisations',type:'video',duration:40},
      {id:'l23',title:'Exercice : calcul de paie complète',type:'exercise',duration:50},
      {id:'l24',title:'Quiz — Paie & charges',type:'quiz',duration:20},
    ]},
    {id:'ch6',title:'Module 6 — Fiscalité & Projets',lessons:[
      {id:'l25',title:'Impôt sur le revenu & BIC',type:'video',duration:30},
      {id:'l26',title:'IS & taxation des sociétés',type:'video',duration:30},
      {id:'l27',title:'Projet : dossier comptable PME complète',type:'project',duration:90},
      {id:'l28',title:'Session live : fiscalité Q&R',type:'live',duration:45},
      {id:'l29',title:'Examen final & certification',type:'quiz',duration:45},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C4 — Marketing Digital & Réseaux Sociaux (15h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c4',title:'Marketing Digital & Réseaux Sociaux',category:'Marketing',instructor:'Mariama Ba',instructorId:'f4',level:'débutant',duration:15,price:29900,enrolled:193,rating:4.7,status:'coming',description:'Facebook Ads, Instagram, TikTok, Google Ads, SEO, email marketing. Créez des campagnes qui convertissent.',tags:['marketing','socialmedia','ads','seo'],
  chapters:[
    {id:'ch1',title:'Module 1 — Stratégie Digitale',lessons:[
      {id:'l1',title:'Fondamentaux du marketing digital',type:'video',duration:20},
      {id:'l2',title:'Buyer persona & parcours client',type:'video',duration:20},
      {id:'l3',title:'Audit digital & positionnement',type:'video',duration:20},
      {id:'l4',title:'Exercice : création de 2 buyer personas',type:'exercise',duration:25},
    ]},
    {id:'ch2',title:'Module 2 — SEO & Content Marketing',lessons:[
      {id:'l5',title:'SEO on-page & off-page',type:'video',duration:25},
      {id:'l6',title:'Keyword research pour le marché africain',type:'video',duration:20},
      {id:'l7',title:'Stratégie de contenu & calendrier éditorial',type:'video',duration:20},
      {id:'l8',title:'Exercice : plan de contenu 30 jours',type:'exercise',duration:30},
    ]},
    {id:'ch3',title:'Module 3 — Publicité Sociale',lessons:[
      {id:'l9',title:'Facebook & Instagram Ads avancé',type:'video',duration:25},
      {id:'l10',title:'TikTok Ads pour les marques africaines',type:'video',duration:20},
      {id:'l11',title:'Google Ads : Search & Display',type:'video',duration:25},
      {id:'l12',title:'Exercice : création d\'une campagne complète',type:'project',duration:40},
    ]},
    {id:'ch4',title:'Module 4 — Email, Analytics & Conversion',lessons:[
      {id:'l13',title:'Email marketing & automation',type:'video',duration:20},
      {id:'l14',title:'Google Analytics 4 & métriques clés',type:'video',duration:20},
      {id:'l15',title:'A/B testing & optimisation de conversion',type:'video',duration:20},
      {id:'l16',title:'Projet : campagne digitale complète',type:'project',duration:45},
      {id:'l17',title:'Quiz final & certification',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C5 — Leadership & Management Africain (24h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c5',title:'Leadership & Management Africain',category:'Management',instructor:'Dr. Aminata Diallo',instructorId:'f1',level:'avancé',duration:24,price:69900,enrolled:41,rating:4.9,status:'coming',description:'Leadership authentique, gestion d\'équipe, résolution de conflits, management interculturel en contexte africain.',tags:['leadership','management','team'],
  chapters:[
    {id:'ch1',title:'Module 1 — Leadership Fondamental',lessons:[
      {id:'l1',title:'Styles de leadership : autoritaire, démocratique, transformationnel',type:'video',duration:25},
      {id:'l2',title:'Leadership africain : Ubuntu & valeur communautaire',type:'video',duration:30},
      {id:'l3',title:'Intelligence émotionnelle & empathie',type:'video',duration:25},
      {id:'l4',title:'Exercice : auto-évaluation leadership',type:'exercise',duration:20},
    ]},
    {id:'ch2',title:'Module 2 — Gestion d\'Équipe',lessons:[
      {id:'l5',title:'Recrutement & onboarding efficace',type:'video',duration:25},
      {id:'l6',title:'Motivation & engagement des équipes',type:'video',duration:30},
      {id:'l7',title:'Délégation & empowerment',type:'video',duration:25},
      {id:'l8',title:'Exercice : plan d\'action équipe 90 jours',type:'exercise',duration:30},
    ]},
    {id:'ch3',title:'Module 3 — Communication & Conflits',lessons:[
      {id:'l9',title:'Communication assertive en entreprise',type:'video',duration:25},
      {id:'l10',title:'Gestion des conflits interculturels',type:'video',duration:30},
      {id:'l11',title:'Négociation & influence',type:'video',duration:25},
      {id:'l12',title:'Rôle play : médiation de conflit',type:'exercise',duration:35},
    ]},
    {id:'ch4',title:'Module 4 — Stratégie & Exécution',lessons:[
      {id:'l13',title:'Vision stratégique & OKR',type:'video',duration:25},
      {id:'l14',title:'Changement organisationnel en contexte africain',type:'video',duration:30},
      {id:'l15',title:'Innovation management & agilité',type:'video',duration:25},
      {id:'l16',title:'Étude de cas : turnaround d\'une PME',type:'reading',duration:30},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l17',title:'Projet : plan de leadership personnalisé',type:'project',duration:60},
      {id:'l18',title:'Session live : coaching collectif',type:'live',duration:45},
      {id:'l19',title:'Examen final & certification',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C6 — Finance d\'Entreprise & Levée de Fonds (30h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c6',title:'Finance d\'Entreprise & Levée de Fonds',category:'Finance',instructor:'Mamadou Touré',instructorId:'f5',level:'intermédiaire',duration:30,price:79900,enrolled:35,rating:4.7,status:'draft',description:'DCF, valorisation, VC, business angels, crowdfunding. Préparez votre pitch deck et sécurisez votre financement.',tags:['finance','startup','fundraising'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux de la Finance',lessons:[
      {id:'l1',title:'Comprendre les états financiers',type:'video',duration:30},
      {id:'l2',title:'Analyse financière : ratios clés',type:'video',duration:35},
      {id:'l3',title:'Cash flow & gestion de la trésorerie',type:'video',duration:30},
      {id:'l4',title:'Exercice : analyse d\'un bilan réel',type:'exercise',duration:40},
    ]},
    {id:'ch2',title:'Module 2 — Valorisation d\'Entreprise',lessons:[
      {id:'l5',title:'Méthodes de valorisation : comparables & DCF',type:'video',duration:35},
      {id:'l6',title:'Valorisation des startups early-stage',type:'video',duration:30},
      {id:'l7',title:'Le cap table & dilution',type:'video',duration:25},
      {id:'l8',title:'Exercice : calcul de valorisation DCF',type:'exercise',duration:50},
    ]},
    {id:'ch3',title:'Module 3 — Levée de Fonds',lessons:[
      {id:'l9',title:'Sources de financement : bootstrapping à IPO',type:'video',duration:30},
      {id:'l10',title:'Business angels & réseaux africains',type:'video',duration:25},
      {id:'l11',title:'Fonds VC & term sheet',type:'video',duration:35},
      {id:'l12',title:'Crowdfunding & financement participatif',type:'video',duration:25},
      {id:'l13',title:'Exercice : négociation term sheet',type:'exercise',duration:40},
    ]},
    {id:'ch4',title:'Module 4 — Pitch & Relations Investisseurs',lessons:[
      {id:'l14',title:'Le pitch deck qui séduit',type:'video',duration:30},
      {id:'l15',title:'Présentation en 10 slides',type:'video',duration:25},
      {id:'l16',title:'Due diligence & data room',type:'video',duration:30},
      {id:'l17',title:'Projet : pitch deck + data room complets',type:'project',duration:90},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l18',title:'Étude de cas : levée de fonds réussie',type:'reading',duration:30},
      {id:'l19',title:'Session live Q&R avec Mamadou Touré',type:'live',duration:45},
      {id:'l20',title:'Examen final & certification',type:'quiz',duration:45},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C7 — Intelligence Artificielle & Machine Learning (60h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c7',title:'Intelligence Artificielle & Machine Learning',category:'Tech',instructor:'Ibrahima Sow',instructorId:'f2',level:'intermédiaire',duration:60,price:99900,enrolled:67,rating:4.8,status:'coming',description:'Python, ML, deep learning, LLMs, applications pratiques IA pour l\'Afrique. Hands-on avec Jupyter et HuggingFace.',tags:['ia','ml','python','llm'],
  chapters:[
    {id:'ch1',title:'Module 1 — Python pour la Data Science',lessons:[
      {id:'l1',title:'Python fondamental & bibliothèques',type:'video',duration:40},
      {id:'l2',title:'NumPy & manipulation de matrices',type:'video',duration:35},
      {id:'l3',title:'Pandas : analyse de données',type:'video',duration:45},
      {id:'l4',title:'Matplotlib & Seaborn : visualisation',type:'video',duration:35},
      {id:'l5',title:'Exercice : analyse dataset BRVM',type:'exercise',duration:60},
    ]},
    {id:'ch2',title:'Module 2 — Fondamentaux du ML',lessons:[
      {id:'l6',title:'Apprentissage supervisé vs non supervisé',type:'video',duration:30},
      {id:'l7',title:'Régression linéaire & logistique',type:'video',duration:40},
      {id:'l8',title:'Arbres de décision & Random Forest',type:'video',duration:35},
      {id:'l9',title:'SVM & k-NN',type:'video',duration:30},
      {id:'l10',title:'Évaluation : accuracy, precision, recall, F1',type:'video',duration:30},
      {id:'l11',title:'Exercice : prédiction churn client',type:'exercise',duration:75},
    ]},
    {id:'ch3',title:'Module 3 — Deep Learning',lessons:[
      {id:'l12',title:'Réseaux de neurones fondamentaux',type:'video',duration:35},
      {id:'l13',title:'CNN pour la vision par ordinateur',type:'video',duration:45},
      {id:'l14',title:'RNN & LSTM pour les séries temporelles',type:'video',duration:40},
      {id:'l15',title:'TensorFlow & Keras : premier modèle',type:'video',duration:45},
      {id:'l16',title:'Exercice : classification d\'images',type:'exercise',duration:90},
    ]},
    {id:'ch4',title:'Module 4 — LLMs & NLP',lessons:[
      {id:'l17',title:'Traitement du langage naturel',type:'video',duration:35},
      {id:'l18',title:'Transformers & attention mechanism',type:'video',duration:40},
      {id:'l19',title:'HuggingFace & fine-tuning',type:'video',duration:45},
      {id:'l20',title:'Applications LLM pour l\'Afrique : Wolof, Pulaar',type:'video',duration:30},
      {id:'l21',title:'Exercice : chatbot RAG pour FAQ',type:'exercise',duration:90},
    ]},
    {id:'ch5',title:'Module 5 — MLOps & Déploiement',lessons:[
      {id:'l22',title:'Pipeline ML avec MLflow',type:'video',duration:35},
      {id:'l23',title:'Déploiement API Flask/FastAPI',type:'video',duration:40},
      {id:'l24',title:'Monitoring & drift detection',type:'video',duration:30},
      {id:'l25',title:'Éthique IA & biais algorithmiques',type:'video',duration:30},
      {id:'l26',title:'Exercice : déploiement modèle production',type:'exercise',duration:75},
    ]},
    {id:'ch6',title:'Module 6 — Projet IA Final',lessons:[
      {id:'l27',title:'Cahier des charges projet IA',type:'video',duration:25},
      {id:'l28',title:'Itération 1 : collecte & préparation données',type:'project',duration:120},
      {id:'l29',title:'Itération 2 : modélisation & entraînement',type:'project',duration:120},
      {id:'l30',title:'Itération 3 : déploiement & présentation',type:'project',duration:90},
      {id:'l31',title:'Session live & code review',type:'live',duration:60},
      {id:'l32',title:'Examen final',type:'quiz',duration:60},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C8 — Droit des Affaires OHADA (20h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c8',title:'Droit des Affaires OHADA',category:'Juridique',instructor:'Me. Seynabou Fall',instructorId:'f6',level:'débutant',duration:20,price:44900,enrolled:28,rating:4.5,status:'coming',description:'Droit commercial, SARL, SA, contrats, responsabilité. Le cadre juridique de votre entreprise en zone OHADA.',tags:['droit','ohada','entreprise'],
  chapters:[
    {id:'ch1',title:'Module 1 — Cadre Juridique OHADA',lessons:[
      {id:'l1',title:'Historique & portée de l\'OHADA',type:'video',duration:25},
      {id:'l2',title:'Les actes uniformes essentiels',type:'video',duration:25},
      {id:'l3',title:'Droit commercial général',type:'video',duration:25},
      {id:'l4',title:'Quiz — Cadre OHADA',type:'quiz',duration:15},
    ]},
    {id:'ch2',title:'Module 2 — Création d\'Entreprise',lessons:[
      {id:'l5',title:'SARL : constitution & fonctionnement',type:'video',duration:30},
      {id:'l6',title:'SA & SAS : avantages & inconvénients',type:'video',duration:25},
      {id:'l7',title:'EIRL & entreprise individuelle',type:'video',duration:20},
      {id:'l8',title:'Exercice : rédaction des statuts',type:'exercise',duration:35},
    ]},
    {id:'ch3',title:'Module 3 — Contrats & Obligations',lessons:[
      {id:'l9',title:'Rédaction de contrats commerciaux',type:'video',duration:25},
      {id:'l10',title:'Conditions générales de vente',type:'video',duration:20},
      {id:'l11',title:'Responsabilité civile & pénale',type:'video',duration:25},
      {id:'l12',title:'Exercice : analyse de contrat',type:'exercise',duration:30},
    ]},
    {id:'ch4',title:'Module 4 — Contentieux & Certification',lessons:[
      {id:'l13',title:'Procédures devant le Tribunal de Commerce',type:'video',duration:25},
      {id:'l14',title:'Recouvrement & voie d\'exécution',type:'video',duration:25},
      {id:'l15',title:'Projet : dossier juridique complet',type:'project',duration:60},
      {id:'l16',title:'Session live Q&R',type:'live',duration:30},
      {id:'l17',title:'Examen final',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C9 — Gestion de Projet PMP & Agile / Scrum (35h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c9',title:'Gestion de Projet PMP & Agile / Scrum',category:'Management',instructor:'Pierre Diatta',instructorId:'f7',level:'intermédiaire',duration:35,price:64900,enrolled:88,rating:4.8,status:'coming',description:'Certifiez-vous en gestion de projet : méthodologies PMI, Agile, Scrum, Kanban. Pilotage de projets complexes, outils Jira & MS Project.',tags:['pmp','agile','scrum','gestion-projet'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux Gestion de Projet',lessons:[
      {id:'l1',title:'Cycle de vie d\'un projet',type:'video',duration:25},
      {id:'l2',title:'Triangle qualité-coût-délai',type:'video',duration:20},
      {id:'l3',title:'Parties prenantes & communication',type:'video',duration:25},
      {id:'l4',title:'Exercice : cartographie parties prenantes',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Méthodologie PMP/PMBOK',lessons:[
      {id:'l5',title:'Les 10 domaines de connaissance PMBOK',type:'video',duration:35},
      {id:'l6',title:'WBS & planification',type:'video',duration:30},
      {id:'l7',title:'Gestion des risques',type:'video',duration:30},
      {id:'l8',title:'MS Project : planification avancée',type:'video',duration:40},
      {id:'l9',title:'Exercice : plan projet complet',type:'exercise',duration:60},
    ]},
    {id:'ch3',title:'Module 3 — Agile & Scrum',lessons:[
      {id:'l10',title:'Manifeste Agile & principes',type:'video',duration:25},
      {id:'l11',title:'Scrum : rôles, artefacts & cérémonies',type:'video',duration:35},
      {id:'l12',title:'User stories & backlog refinement',type:'video',duration:30},
      {id:'l13',title:'Jira : gestion de sprint',type:'video',duration:35},
      {id:'l14',title:'Exercice : simulation sprint 2 semaines',type:'exercise',duration:50},
    ]},
    {id:'ch4',title:'Module 4 — Kanban & Hybride',lessons:[
      {id:'l15',title:'Kanban : visualisation du flux',type:'video',duration:25},
      {id:'l16',title:'Scrumban & méthodes hybrides',type:'video',duration:25},
      {id:'l17',title:'Métriques Agile : velocity, burndown',type:'video',duration:25},
      {id:'l18',title:'Exercice : tableau Kanban + métriques',type:'exercise',duration:40},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l19',title:'Étude de cas : projet BTP africain',type:'reading',duration:30},
      {id:'l20',title:'Projet : gestion projet réel',type:'project',duration:90},
      {id:'l21',title:'Préparation PMP : questions type examen',type:'video',duration:45},
      {id:'l22',title:'Session live Q&R',type:'live',duration:45},
      {id:'l23',title:'Examen final & certification',type:'quiz',duration:45},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C10 — Excel Avancé & Power BI (25h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c10',title:'Excel Avancé & Power BI — Data Analytics',category:'Tech',instructor:'Marie-Christine Sagna',instructorId:'f8',level:'débutant',duration:25,price:34900,enrolled:217,rating:4.9,status:'coming',description:'Maîtrisez Excel de A à Z (tableaux croisés, macros VBA) et créez des dashboards professionnels sous Power BI. Indispensable pour tout professionnel.',tags:['excel','powerbi','data','analytics'],
  chapters:[
    {id:'ch1',title:'Module 1 — Excel Intermédiaire',lessons:[
      {id:'l1',title:'Formules avancées : INDEX, MATCH, INDIRECT',type:'video',duration:30},
      {id:'l2',title:'Validation de données & mise en forme conditionnelle',type:'video',duration:25},
      {id:'l3',title:'Tableaux structurés & formules dynamiques',type:'video',duration:25},
      {id:'l4',title:'Exercice : base de données clients',type:'exercise',duration:40},
    ]},
    {id:'ch2',title:'Module 2 — Tableaux Croisés Dynamiques',lessons:[
      {id:'l5',title:'Création & personnalisation TCD',type:'video',duration:30},
      {id:'l6',title:'Segments & chronologies interactifs',type:'video',duration:25},
      {id:'l7',title:'TCD avancé : champs calculés',type:'video',duration:25},
      {id:'l8',title:'Exercice : rapport ventes multi-dimensionnel',type:'exercise',duration:50},
    ]},
    {id:'ch3',title:'Module 3 — VBA & Automatisation',lessons:[
      {id:'l9',title:'Enregistreur de macros & VBA fondamental',type:'video',duration:30},
      {id:'l10',title:'Boucles, conditions & userforms',type:'video',duration:35},
      {id:'l11',title:'Automatisation de rapports mensuels',type:'video',duration:30},
      {id:'l12',title:'Exercice : macro de génération de rapport',type:'exercise',duration:50},
    ]},
    {id:'ch4',title:'Module 4 — Power BI',lessons:[
      {id:'l13',title:'Power Query : transformation de données',type:'video',duration:30},
      {id:'l14',title:'Modélisation : relations & DAX',type:'video',duration:35},
      {id:'l15',title:'Visualisations interactives avancées',type:'video',duration:30},
      {id:'l16',title:'Publication & partage Power BI Service',type:'video',duration:25},
      {id:'l17',title:'Exercice : dashboard RH complet',type:'exercise',duration:60},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l18',title:'Projet : dashboard stratégique entreprise',type:'project',duration:90},
      {id:'l19',title:'Session live : astuces Power BI',type:'live',duration:45},
      {id:'l20',title:'Examen final pratique',type:'quiz',duration:45},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C11 — Community Management & Content Creation (18h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c11',title:'Community Management & Content Creation',category:'Marketing',instructor:'Mariama Ba',instructorId:'f4',level:'débutant',duration:18,price:27900,enrolled:156,rating:4.7,status:'coming',description:'Stratégie de contenu, calendrier éditorial, création visuelle Canva, gestion de communauté Facebook/Instagram/LinkedIn/TikTok. Devenez CM pro.',tags:['community','content','canva','réseaux-sociaux'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux du Community Management',lessons:[
      {id:'l1',title:'Rôle du CM & panorama des métiers',type:'video',duration:20},
      {id:'l2',title:'Tone of voice & charte éditoriale',type:'video',duration:20},
      {id:'l3',title:'Analyse concurrentielle sur les réseaux',type:'video',duration:20},
      {id:'l4',title:'Exercice : charte éditoriale pour marque fictive',type:'exercise',duration:25},
    ]},
    {id:'ch2',title:'Module 2 — Création de Contenu',lessons:[
      {id:'l5',title:'Canva Pro : design sans compétences graphiques',type:'video',duration:25},
      {id:'l6',title:'Formats optimaux par plateforme',type:'video',duration:20},
      {id:'l7',title:'Copywriting pour les réseaux sociaux',type:'video',duration:25},
      {id:'l8',title:'Stories, Reels & TikTok : création rapide',type:'video',duration:20},
      {id:'l9',title:'Exercice : 5 visuels pour campagne',type:'exercise',duration:30},
    ]},
    {id:'ch3',title:'Module 3 — Gestion de Communauté & Analytics',lessons:[
      {id:'l10',title:'Modération & gestion de crise',type:'video',duration:20},
      {id:'l11',title:'Engagement : répondre, interagir, fidéliser',type:'video',duration:20},
      {id:'l12',title:'KPIs sociaux & rapports mensuels',type:'video',duration:20},
      {id:'l13',title:'Outils : Meta Business Suite, Buffer, Hootsuite',type:'video',duration:20},
    ]},
    {id:'ch4',title:'Module 4 — Projet & Certification',lessons:[
      {id:'l14',title:'Projet : stratégie sociale média 30 jours',type:'project',duration:60},
      {id:'l15',title:'Session live : retours sur projets',type:'live',duration:30},
      {id:'l16',title:'Quiz final & certification',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C12 — E-Commerce & Dropshipping Afrique (22h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c12',title:'E-Commerce & Dropshipping Afrique',category:'Business',instructor:'Jean-Baptiste Badji',instructorId:'f9',level:'débutant',duration:22,price:39900,enrolled:104,rating:4.7,status:'coming',description:'Créez votre boutique en ligne : Shopify, WooCommerce, paiement mobile Wave/Orange Money, dropshipping fournisseurs africains et chinois.',tags:['ecommerce','dropshipping','shopify','wave'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux E-Commerce',lessons:[
      {id:'l1',title:'Le e-commerce en Afrique : opportunités',type:'video',duration:20},
      {id:'l2',title:'Modèles : stock, dropshipping, print-on-demand',type:'video',duration:25},
      {id:'l3',title:'Niches rentables pour le marché africain',type:'video',duration:20},
      {id:'l4',title:'Exercice : analyse de niche & concurrence',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Création de Boutique',lessons:[
      {id:'l5',title:'Shopify : configuration complète',type:'video',duration:30},
      {id:'l6',title:'WooCommerce & WordPress',type:'video',duration:25},
      {id:'l7',title:'Design UX & conversion',type:'video',duration:20},
      {id:'l8',title:'Intégration paiement : Wave, OM, PayDunya',type:'video',duration:25},
      {id:'l9',title:'Exercice : boutique fonctionnelle',type:'exercise',duration:60},
    ]},
    {id:'ch3',title:'Module 3 — Sourcing & Logistique',lessons:[
      {id:'l10',title:'Fournisseurs chinois : Alibaba, 1688',type:'video',duration:25},
      {id:'l11',title:'Fournisseurs africains & fabrication locale',type:'video',duration:20},
      {id:'l12',title:'Gestion des commandes & service client',type:'video',duration:20},
      {id:'l13',title:'Livraison & retours en Afrique',type:'video',duration:20},
    ]},
    {id:'ch4',title:'Module 4 — Marketing & Scaling',lessons:[
      {id:'l14',title:'Facebook & TikTok Ads pour e-commerce',type:'video',duration:25},
      {id:'l15',title:'Influence marketing africain',type:'video',duration:20},
      {id:'l16',title:'Email marketing & fidélisation',type:'video',duration:20},
      {id:'l17',title:'Projet : boutique + première vente',type:'project',duration:60},
      {id:'l18',title:'Session live Q&R',type:'live',duration:30},
      {id:'l19',title:'Quiz & certification',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C13 — Anglais Professionnel & Business English (40h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c13',title:'Anglais Professionnel & Business English',category:'Langues',instructor:'François Mendy',instructorId:'f10',level:'intermédiaire',duration:40,price:44900,enrolled:132,rating:4.6,status:'coming',description:'Maîtrisez l\'anglais des affaires : emails, réunions, négociations, présentations, IELTS/TOEIC. Méthode immersive et professionnelle.',tags:['anglais','business-english','toeic','ielts'],
  chapters:[
    {id:'ch1',title:'Module 1 — Communication Écrite',lessons:[
      {id:'l1',title:'Structure des emails professionnels',type:'video',duration:25},
      {id:'l2',title:'Formalité & registre de langue',type:'video',duration:25},
      {id:'l3',title:'Rapports, mémos & briefs',type:'video',duration:25},
      {id:'l4',title:'Exercice : rédaction 5 emails types',type:'exercise',duration:40},
    ]},
    {id:'ch2',title:'Module 2 — Réunions & Téléconférences',lessons:[
      {id:'l5',title:'Vocabulaire des réunions',type:'video',duration:25},
      {id:'l6',title:'Présenter son point de vue',type:'video',duration:25},
      {id:'l7',title:'Modérer & conclure une réunion',type:'video',duration:25},
      {id:'l8',title:'Role play : réunion de crise',type:'exercise',duration:40},
    ]},
    {id:'ch3',title:'Module 3 — Négociation & Présentations',lessons:[
      {id:'l9',title:'Négociation : stratégies & tactiques',type:'video',duration:30},
      {id:'l10',title:'Présentations PowerPoint en anglais',type:'video',duration:25},
      {id:'l11',title:'Pitch : convaincre en 5 minutes',type:'video',duration:25},
      {id:'l12',title:'Exercice : pitch enregistré + feedback',type:'exercise',duration:50},
    ]},
    {id:'ch4',title:'Module 4 — Vocabulaire Sectoriel',lessons:[
      {id:'l13',title:'Vocabulaire tech & IT',type:'video',duration:25},
      {id:'l14',title:'Vocabulaire finance & comptabilité',type:'video',duration:25},
      {id:'l15',title:'Vocabulaire marketing & ventes',type:'video',duration:25},
      {id:'l16',title:'Vocabulaire ressources humaines',type:'video',duration:20},
    ]},
    {id:'ch5',title:'Module 5 — Préparation Certifications',lessons:[
      {id:'l17',title:'TOEIC : structure & stratégies',type:'video',duration:30},
      {id:'l18',title:'IELTS : speaking & writing',type:'video',duration:30},
      {id:'l19',title:'Mock exam TOEIC',type:'quiz',duration:90},
      {id:'l20',title:'Session live : conversation libre',type:'live',duration:45},
    ]},
    {id:'ch6',title:'Module 6 — Projets & Certification',lessons:[
      {id:'l21',title:'Projet : présentation entreprise 10 min',type:'project',duration:60},
      {id:'l22',title:'Examen final écrit & oral',type:'quiz',duration:60},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C14 — Graphisme Professionnel (30h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c14',title:'Graphisme Professionnel — Canva, Photoshop & Illustrator',category:'Design',instructor:'Christine Sambou',instructorId:'f11',level:'débutant',duration:30,price:49900,enrolled:174,rating:4.8,status:'coming',description:'Création de logos, flyers, affiches, identité visuelle. Canva avancé, bases Photoshop et Illustrator. Créez des visuels professionnels dès le 1er jour.',tags:['graphisme','canva','photoshop','design'],
  chapters:[
    {id:'ch1',title:'Module 1 — Théorie du Design',lessons:[
      {id:'l1',title:'Principes fondamentaux : contraste, alignement, proximité',type:'video',duration:25},
      {id:'l2',title:'Théorie des couleurs & psychologie',type:'video',duration:25},
      {id:'l3',title:'Typographie : polices, hiérarchie, pairings',type:'video',duration:25},
      {id:'l4',title:'Grid systems & composition',type:'video',duration:20},
      {id:'l5',title:'Exercice : analyse de 5 designs célèbres',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Canva Avancé',lessons:[
      {id:'l6',title:'Canva Pro : fonctions cachées',type:'video',duration:25},
      {id:'l7',title:'Création de templates réutilisables',type:'video',duration:25},
      {id:'l8',title:'Animations & vidéos sociales',type:'video',duration:25},
      {id:'l9',title:'Exercice : kit de marque complet Canva',type:'exercise',duration:50},
    ]},
    {id:'ch3',title:'Module 3 — Photoshop Fondamental',lessons:[
      {id:'l10',title:'Interface & calques',type:'video',duration:25},
      {id:'l11',title:'Sélections, masques & retouche',type:'video',duration:30},
      {id:'l12',title:'Correction couleur & effets',type:'video',duration:25},
      {id:'l13',title:'Mockups & présentations réalistes',type:'video',duration:25},
      {id:'l14',title:'Exercice : retouche photo professionnelle',type:'exercise',duration:50},
    ]},
    {id:'ch4',title:'Module 4 — Illustrator & Vectoriel',lessons:[
      {id:'l15',title:'Formes, plumes & tracés vectoriels',type:'video',duration:30},
      {id:'l16',title:'Création de logos vectoriels',type:'video',duration:30},
      {id:'l17',title:'Icônes & illustrations simples',type:'video',duration:25},
      {id:'l18',title:'Exercice : logo + identité visuelle',type:'exercise',duration:60},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l19',title:'Projet : identité visuelle complète marque',type:'project',duration:120},
      {id:'l20',title:'Portfolio & présentation client',type:'video',duration:25},
      {id:'l21',title:'Session live : review portfolio',type:'live',duration:45},
      {id:'l22',title:'Examen final',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C15 — Logistique, Supply Chain & Transport (28h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c15',title:'Logistique, Supply Chain & Transport',category:'Logistique',instructor:'Mamadou Touré',instructorId:'f5',level:'intermédiaire',duration:28,price:54900,enrolled:46,rating:4.6,status:'coming',description:'Gestion des achats, stocks, import/export, Incoterms, douanes, transport maritime et aérien en Afrique de l\'Ouest. Maîtrisez toute la chaîne logistique.',tags:['logistique','supply-chain','import-export','incoterms'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux Supply Chain',lessons:[
      {id:'l1',title:'Introduction à la supply chain',type:'video',duration:25},
      {id:'l2',title:'Flux physiques, informationnels & financiers',type:'video',duration:25},
      {id:'l3',title:'KPIs logistiques essentiels',type:'video',duration:20},
      {id:'l4',title:'Exercice : cartographie d\'une supply chain',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Achats & Stocks',lessons:[
      {id:'l5',title:'Stratégie d\'achat & négociation fournisseurs',type:'video',duration:25},
      {id:'l6',title:'Gestion des stocks : FIFO, LIFO, moyenne',type:'video',duration:25},
      {id:'l7',title:'ERP & systèmes de traçabilité',type:'video',duration:20},
      {id:'l8',title:'Exercice : calcul de seuil de réapprovisionnement',type:'exercise',duration:35},
    ]},
    {id:'ch3',title:'Module 3 — Import/Export & Incoterms',lessons:[
      {id:'l9',title:'Incoterms 2020 expliqués',type:'video',duration:30},
      {id:'l10',title:'Procédures douanières CEDEAO',type:'video',duration:25},
      {id:'l11',title:'Documents commerciaux internationaux',type:'video',duration:25},
      {id:'l12',title:'Transport maritime, aérien & terrestre',type:'video',duration:25},
      {id:'l13',title:'Exercice : calcul coût import complet',type:'exercise',duration:40},
    ]},
    {id:'ch4',title:'Module 4 — Distribution & Dernier Kilomètre',lessons:[
      {id:'l14',title:'Réseaux de distribution en Afrique',type:'video',duration:20},
      {id:'l15',title:'Logistique urbaine & e-commerce',type:'video',duration:20},
      {id:'l16',title:'Entreposage & cross-docking',type:'video',duration:20},
      {id:'l17',title:'Exercice : optimisation tournée livraison',type:'exercise',duration:35},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l18',title:'Étude de cas : supply chain agroalimentaire',type:'reading',duration:30},
      {id:'l19',title:'Projet : plan logistique import-export',type:'project',duration:60},
      {id:'l20',title:'Session live Q&R',type:'live',duration:30},
      {id:'l21',title:'Examen final',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C16 — RH, Paie & Gestion du Personnel (24h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c16',title:'RH, Paie & Gestion du Personnel',category:'RH',instructor:'Dr. Aminata Diallo',instructorId:'f1',level:'débutant',duration:24,price:49900,enrolled:63,rating:4.7,status:'coming',description:'Recrutement, contrats de travail, code du travail sénégalais, calcul de la paie, IPRES, CSS. Gérez vos ressources humaines comme un DRH.',tags:['rh','paie','droit-travail','recrutement'],
  chapters:[
    {id:'ch1',title:'Module 1 — Stratégie RH',lessons:[
      {id:'l1',title:'Rôle stratégique des RH',type:'video',duration:20},
      {id:'l2',title:'Planification des effectifs',type:'video',duration:20},
      {id:'l3',title:'Politique RH & culture d\'entreprise',type:'video',duration:20},
      {id:'l4',title:'Exercice : organigramme & fiches de poste',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Recrutement',lessons:[
      {id:'l5',title:'Sourcing & annonces efficaces',type:'video',duration:20},
      {id:'l6',title:'Sélection : CV, entretien, tests',type:'video',duration:25},
      {id:'l7',title:'Onboarding & intégration',type:'video',duration:20},
      {id:'l8',title:'Exercice : simulation entretien embauche',type:'exercise',duration:35},
    ]},
    {id:'ch3',title:'Module 3 — Droit du Travail Sénégalais',lessons:[
      {id:'l9',title:'Code du travail : contrats & durées',type:'video',duration:25},
      {id:'l10',title:'Rupture du contrat : licenciement, démission',type:'video',duration:25},
      {id:'l11',title:'Hygiène, sécurité & conditions de travail',type:'video',duration:20},
      {id:'l12',title:'Exercice : cas pratique de licenciement',type:'exercise',duration:30},
    ]},
    {id:'ch4',title:'Module 4 — Paie & Charges Sociales',lessons:[
      {id:'l13',title:'Éléments de salaire & primes',type:'video',duration:25},
      {id:'l14',title:'IPRES, CSS, AMO : calcul détaillé',type:'video',duration:30},
      {id:'l15',title:'Déclarations sociales & fiscales',type:'video',duration:25},
      {id:'l16',title:'Exercice : bulletin de paie complet',type:'exercise',duration:45},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l17',title:'GPEC & formation professionnelle',type:'video',duration:20},
      {id:'l18',title:'Projet : manuel RH PME',type:'project',duration:60},
      {id:'l19',title:'Session live Q&R',type:'live',duration:30},
      {id:'l20',title:'Examen final',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C17 — Communication Professionnelle & Prise de Parole (16h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c17',title:'Communication Professionnelle & Prise de Parole',category:'Management',instructor:'François Mendy',instructorId:'f10',level:'débutant',duration:16,price:24900,enrolled:98,rating:4.8,status:'coming',description:'Prise de parole en public, art de la présentation, techniques de persuasion, communication interpersonnelle et management de conflits. Confiance et impact garantis.',tags:['communication','prise-de-parole','leadership','soft-skills'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux',lessons:[
      {id:'l1',title:'Peur & confiance : gérer le trac',type:'video',duration:20},
      {id:'l2',title:'Langage verbal & non-verbal',type:'video',duration:20},
      {id:'l3',title:'Voix, respiration & posture',type:'video',duration:20},
      {id:'l4',title:'Exercice : présentation 2 minutes',type:'exercise',duration:25},
    ]},
    {id:'ch2',title:'Module 2 — Présentations Impactantes',lessons:[
      {id:'l5',title:'Structure : accroche, développement, conclusion',type:'video',duration:20},
      {id:'l6',title:'Storytelling & anecdotes puissantes',type:'video',duration:20},
      {id:'l7',title:'Slides efficaces : moins c\'est plus',type:'video',duration:20},
      {id:'l8',title:'Exercice : présentation PowerPoint 5 min',type:'exercise',duration:35},
    ]},
    {id:'ch3',title:'Module 3 — Persuasion & Conflits',lessons:[
      {id:'l9',title:'Techniques de persuasion éthique',type:'video',duration:20},
      {id:'l10',title:'Négociation sans concession',type:'video',duration:25},
      {id:'l11',title:'Gestion des objections & Q&R difficiles',type:'video',duration:20},
      {id:'l12',title:'Role play : négociation salariale',type:'exercise',duration:30},
    ]},
    {id:'ch4',title:'Module 4 — Projets & Certification',lessons:[
      {id:'l13',title:'Projet : discours TED-style 10 min',type:'project',duration:45},
      {id:'l14',title:'Session live : feedback collectif',type:'live',duration:30},
      {id:'l15',title:'Examen final',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C18 — Immobilier & BTP (20h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c18',title:'Immobilier & BTP — Investissement & Gestion',category:'Immobilier',instructor:'Me. Seynabou Fall',instructorId:'f6',level:'intermédiaire',duration:20,price:44900,enrolled:39,rating:4.6,status:'coming',description:'Investissement immobilier au Sénégal, droit foncier, permis de construire, gestion locative, promotion immobilière. Guide complet pour l\'investisseur africain.',tags:['immobilier','btp','investissement','foncier'],
  chapters:[
    {id:'ch1',title:'Module 1 — Marché Immobilier Sénégalais',lessons:[
      {id:'l1',title:'Panorama du marché : Dakar, régions',type:'video',duration:25},
      {id:'l2',title:'Tendances & opportunités d\'investissement',type:'video',duration:20},
      {id:'l3',title:'Rentabilité & calcul de rendement',type:'video',duration:25},
      {id:'l4',title:'Exercice : analyse rentabilité bien',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Droit Foncier & Urbanisme',lessons:[
      {id:'l5',title:'Titres fonciers & droit de propriété',type:'video',duration:25},
      {id:'l6',title:'Permis de construire & démarches',type:'video',duration:20},
      {id:'l7',title:'Zonage, COS & règlements',type:'video',duration:20},
      {id:'l8',title:'Exercice : vérification titre foncier',type:'exercise',duration:25},
    ]},
    {id:'ch3',title:'Module 3 — BTP & Construction',lessons:[
      {id:'l9',title:'Devis, métrés & budget travaux',type:'video',duration:25},
      {id:'l10',title:'Choix des matériaux & fournisseurs',type:'video',duration:20},
      {id:'l11',title:'Suivi de chantier & contrôle qualité',type:'video',duration:20},
      {id:'l12',title:'Exercice : devis estimatif maison',type:'exercise',duration:30},
    ]},
    {id:'ch4',title:'Module 4 — Gestion & Certification',lessons:[
      {id:'l13',title:'Gestion locative & baux',type:'video',duration:20},
      {id:'l14',title:'Promotion immobilière & commercialisation',type:'video',duration:20},
      {id:'l15',title:'Projet : business plan immobilier',type:'project',duration:60},
      {id:'l16',title:'Session live Q&R',type:'live',duration:30},
      {id:'l17',title:'Examen final',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C19 — Agrobusiness & Agriculture Intelligente (20h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c19',title:'Agrobusiness & Agriculture Intelligente',category:'Agriculture',instructor:'Jean-Baptiste Badji',instructorId:'f9',level:'débutant',duration:20,price:34900,enrolled:57,rating:4.7,status:'coming',description:'Business plan agricole, cultures à haute valeur ajoutée, agroalimentaire, financement BNDE/FONSTAB, agriculture digitale et marchés d\'exportation.',tags:['agrobusiness','agriculture','agroalimentaire','financement'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux Agrobusiness',lessons:[
      {id:'l1',title:'Agriculture en Afrique : défis & opportunités',type:'video',duration:25},
      {id:'l2',title:'Chaînes de valeur agricoles',type:'video',duration:20},
      {id:'l3',title:'Cultures à haute valeur ajoutée',type:'video',duration:25},
      {id:'l4',title:'Exercice : analyse chaîne de valeur riz',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Business Plan Agricole',lessons:[
      {id:'l5',title:'Étude de marché agricole',type:'video',duration:20},
      {id:'l6',title:'Budget prévisionnel & rentabilité',type:'video',duration:25},
      {id:'l7',title:'Plan de production & saisonnalité',type:'video',duration:20},
      {id:'l8',title:'Exercice : business plan ferme 5 ans',type:'exercise',duration:40},
    ]},
    {id:'ch3',title:'Module 3 — Agriculture Intelligente',lessons:[
      {id:'l9',title:'Irrigation intelligente & water management',type:'video',duration:20},
      {id:'l10',title:'Drones & télédétection agricole',type:'video',duration:20},
      {id:'l11',title:'Applications mobiles pour agriculteurs',type:'video',duration:20},
      {id:'l12',title:'Agroalimentaire : transformation & conservation',type:'video',duration:25},
    ]},
    {id:'ch4',title:'Module 4 — Financement & Certification',lessons:[
      {id:'l13',title:'BNDE, FONSTAB & financements agricoles',type:'video',duration:25},
      {id:'l14',title:'Coopératives & groupements paysans',type:'video',duration:20},
      {id:'l15',title:'Exportation : normes & marchés',type:'video',duration:20},
      {id:'l16',title:'Projet : plan agrobusiness complet',type:'project',duration:60},
      {id:'l17',title:'Examen final',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C20 — Génie Civil — AutoCAD & Calcul de Structure (45h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c20',title:'Génie Civil — AutoCAD & Calcul de Structure',category:'Tech',instructor:'Pierre Diatta',instructorId:'f7',level:'intermédiaire',duration:45,price:74900,enrolled:31,rating:4.7,status:'coming',description:'Dessin technique AutoCAD, calcul béton armé, plans d\'exécution, métrés, suivi de chantier. Formation complète pour techniciens et ingénieurs en bâtiment.',tags:['génie-civil','autocad','btp','structure'],
  chapters:[
    {id:'ch1',title:'Module 1 — Introduction au Génie Civil',lessons:[
      {id:'l1',title:'Rôle de l\'ingénieur & technicien BTP',type:'video',duration:20},
      {id:'l2',title:'Normes & règlements de construction',type:'video',duration:25},
      {id:'l3',title:'Matériaux de construction : propriétés',type:'video',duration:30},
      {id:'l4',title:'Exercice : identification matériaux',type:'exercise',duration:25},
    ]},
    {id:'ch2',title:'Module 2 — AutoCAD 2D & 3D',lessons:[
      {id:'l5',title:'Interface & commandes de base',type:'video',duration:30},
      {id:'l6',title:'Dessin technique : plans, coupes, élévations',type:'video',duration:40},
      {id:'l7',title:'Cotation, hachures & légendes',type:'video',duration:30},
      {id:'l8',title:'Modélisation 3D & rendus',type:'video',duration:35},
      {id:'l9',title:'Exercice : plan maison R+1 complet',type:'exercise',duration:90},
    ]},
    {id:'ch3',title:'Module 3 — Calcul de Structure',lessons:[
      {id:'l10',title:'Charges permanentes & d\'exploitation',type:'video',duration:30},
      {id:'l11',title:'Béton armé : ferraillage fondamentaux',type:'video',duration:45},
      {id:'l12',title:'Poutres, poteaux & dalles',type:'video',duration:40},
      {id:'l13',title:'Fondations superficielles & profondes',type:'video',duration:35},
      {id:'l14',title:'Exercice : note de calcul bâtiment R+2',type:'exercise',duration:90},
    ]},
    {id:'ch4',title:'Module 4 — Métrés & Devis',lessons:[
      {id:'l15',title:'Principes de métré & quantitatifs',type:'video',duration:30},
      {id:'l16',title:'Logiciels de métré : experience',type:'video',duration:30},
      {id:'l17',title:'Devis estimatif & détaillé',type:'video',duration:30},
      {id:'l18',title:'Exercice : métré & devis maison',type:'exercise',duration:60},
    ]},
    {id:'ch5',title:'Module 5 — Suivi de Chantier',lessons:[
      {id:'l19',title:'Planning & diagramme de Gantt',type:'video',duration:25},
      {id:'l20',title:'Contrôle qualité & essais',type:'video',duration:25},
      {id:'l21',title:'Sécurité sur chantier',type:'video',duration:20},
      {id:'l22',title:'Exercice : planning chantier 6 mois',type:'exercise',duration:45},
    ]},
    {id:'ch6',title:'Module 6 — Projets & Certification',lessons:[
      {id:'l23',title:'Projet : dossier technique bâtiment R+1',type:'project',duration:180},
      {id:'l24',title:'Session live : correction projet',type:'live',duration:60},
      {id:'l25',title:'Examen final pratique',type:'quiz',duration:60},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C21 — Cybersécurité & Ethical Hacking (50h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c21',title:'Cybersécurité & Ethical Hacking',category:'Tech',instructor:'Paul Martin',instructorId:'f12',level:'intermédiaire',duration:50,price:84900,enrolled:42,rating:4.8,status:'coming',description:'Sécurité réseau, tests d\'intrusion, Kali Linux, OWASP, cryptographie. Protégez les systèmes d\'information des entreprises africaines contre les cybermenaces.',tags:['cybersécurité','hacking','kali','owasp'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux Cybersécurité',lessons:[
      {id:'l1',title:'Menaces & paysage cyber en Afrique',type:'video',duration:25},
      {id:'l2',title:'Confidentialité, intégrité, disponibilité',type:'video',duration:25},
      {id:'l3',title:'Modèle OSI & protocoles réseau',type:'video',duration:30},
      {id:'l4',title:'Exercice : analyse de risque simple',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Tests d\'Intrusion',lessons:[
      {id:'l5',title:'Méthodologie pentest : reconnaissance à exploitation',type:'video',duration:35},
      {id:'l6',title:'Kali Linux & outils essentiels',type:'video',duration:40},
      {id:'l7',title:'Scanning & énumération',type:'video',duration:30},
      {id:'l8',title:'Exploitation de vulnérabilités',type:'video',duration:35},
      {id:'l9',title:'Lab : pentest réseau local',type:'exercise',duration:90},
    ]},
    {id:'ch3',title:'Module 3 — Sécurité Web',lessons:[
      {id:'l10',title:'OWASP Top 10 détaillé',type:'video',duration:40},
      {id:'l11',title:'Injection SQL & XSS : démonstration',type:'video',duration:35},
      {id:'l12',title:'CSRF, IDOR & sécurité des sessions',type:'video',duration:35},
      {id:'l13',title:'Lab : exploitation & correction vulnérabilités web',type:'exercise',duration:90},
    ]},
    {id:'ch4',title:'Module 4 — Cryptographie & Forensics',lessons:[
      {id:'l14',title:'Cryptographie symétrique & asymétrique',type:'video',duration:35},
      {id:'l15',title:'Hashing, signatures & PKI',type:'video',duration:30},
      {id:'l16',title:'Forensics numérique fondamentale',type:'video',duration:30},
      {id:'l17',title:'Exercice : analyse forensic fichier',type:'exercise',duration:45},
    ]},
    {id:'ch5',title:'Module 5 — Sécurité Réseau & Cloud',lessons:[
      {id:'l18',title:'Firewalls, IDS/IPS & segmentation',type:'video',duration:30},
      {id:'l19',title:'Sécurité cloud AWS/Azure',type:'video',duration:30},
      {id:'l20',title:'SOC & incident response',type:'video',duration:30},
      {id:'l21',title:'Exercice : configuration firewall',type:'exercise',duration:45},
    ]},
    {id:'ch6',title:'Module 6 — Projets & Certification',lessons:[
      {id:'l22',title:'Projet : audit sécurité entreprise fictive',type:'project',duration:120},
      {id:'l23',title:'Préparation CEH : questions type',type:'video',duration:45},
      {id:'l24',title:'Session live : démonstration live hacking',type:'live',duration:60},
      {id:'l25',title:'Examen final',type:'quiz',duration:60},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C22 — UI/UX Design — Figma & Prototypage Avancé (35h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c22',title:'UI/UX Design — Figma & Prototypage Avancé',category:'Design',instructor:'Marie-Claire Diop',instructorId:'f13',level:'débutant',duration:35,price:54900,enrolled:89,rating:4.9,status:'coming',description:'Design thinking, wireframes, maquettes Figma, prototypage interactif, tests utilisateurs. Créez des interfaces mobiles et web dignes des grandes tech companies.',tags:['figma','ui','ux','design-thinking'],
  chapters:[
    {id:'ch1',title:'Module 1 — Design Thinking',lessons:[
      {id:'l1',title:'Processus de design thinking',type:'video',duration:25},
      {id:'l2',title:'Empathie : interviews & personas',type:'video',duration:25},
      {id:'l3',title:'Définition & idéation',type:'video',duration:20},
      {id:'l4',title:'Exercice : atelier d\'idéation',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Recherche Utilisateur',lessons:[
      {id:'l5',title:'Tests utilisateurs : guérilla à lab',type:'video',duration:25},
      {id:'l6',title:'Journées utilisateur & cartographie',type:'video',duration:25},
      {id:'l7',title:'Analyse heuristique & audits UX',type:'video',duration:20},
      {id:'l8',title:'Exercice : audit UX app africaine',type:'exercise',duration:40},
    ]},
    {id:'ch3',title:'Module 3 — Wireframes & Architecture',lessons:[
      {id:'l9',title:'Sitemaps & flows utilisateurs',type:'video',duration:20},
      {id:'l10',title:'Wireframes low-fi & mid-fi',type:'video',duration:25},
      {id:'l11',title:'Design patterns mobile & web',type:'video',duration:25},
      {id:'l12',title:'Exercice : wireframes app mobile',type:'exercise',duration:45},
    ]},
    {id:'ch4',title:'Module 4 — Figma Avancé',lessons:[
      {id:'l13',title:'Interface & auto-layout',type:'video',duration:30},
      {id:'l14',title:'Composants, variants & design systems',type:'video',duration:35},
      {id:'l15',title:'Prototypage interactif avancé',type:'video',duration:30},
      {id:'l16',title:'Plugins Figma essentiels',type:'video',duration:20},
      {id:'l17',title:'Exercice : design system complet',type:'exercise',duration:60},
    ]},
    {id:'ch5',title:'Module 5 — UI Design & Accessibilité',lessons:[
      {id:'l18',title:'Grilles, spacing & hiérarchie visuelle',type:'video',duration:25},
      {id:'l19',title:'Couleurs, typographie & icônes',type:'video',duration:25},
      {id:'l20',title:'Design inclusif & accessibilité WCAG',type:'video',duration:25},
      {id:'l21',title:'Dark mode & thématisation',type:'video',duration:20},
      {id:'l22',title:'Exercice : UI kit complet',type:'exercise',duration:50},
    ]},
    {id:'ch6',title:'Module 6 — Projets & Certification',lessons:[
      {id:'l23',title:'Projet : refonte UX/UI app africaine',type:'project',duration:180},
      {id:'l24',title:'Portfolio & présentation design',type:'video',duration:25},
      {id:'l25',title:'Session live : portfolio review',type:'live',duration:45},
      {id:'l26',title:'Examen final',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C23 — Cloud Computing & DevOps — AWS & Azure (55h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c23',title:'Cloud Computing & DevOps — AWS & Azure',category:'Tech',instructor:'Joseph Faye',instructorId:'f14',level:'intermédiaire',duration:55,price:94900,enrolled:56,rating:4.7,status:'coming',description:'Architecture cloud, serveurs, Docker, Kubernetes, CI/CD, déploiement continu. Devenez ingénieur DevOps prêt pour le marché international.',tags:['cloud','aws','devops','docker'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux Cloud',lessons:[
      {id:'l1',title:'IaaS, PaaS, SaaS : concepts & différences',type:'video',duration:25},
      {id:'l2',title:'AWS vs Azure : comparaison stratégique',type:'video',duration:30},
      {id:'l3',title:'VPC, subnets & sécurité réseau cloud',type:'video',duration:35},
      {id:'l4',title:'Lab : première instance EC2',type:'exercise',duration:45},
    ]},
    {id:'ch2',title:'Module 2 — Stockage & Bases de Données',lessons:[
      {id:'l5',title:'S3, EBS, EFS & stockage objet',type:'video',duration:30},
      {id:'l6',title:'RDS, DynamoDB & Azure SQL',type:'video',duration:35},
      {id:'l7',title:'Backup, DR & haute disponibilité',type:'video',duration:30},
      {id:'l8',title:'Lab : architecture DB multi-AZ',type:'exercise',duration:60},
    ]},
    {id:'ch3',title:'Module 3 — Docker & Containerisation',lessons:[
      {id:'l9',title:'Docker : images, containers, volumes',type:'video',duration:35},
      {id:'l10',title:'Docker Compose & orchestration locale',type:'video',duration:30},
      {id:'l11',title:'Dockerfile best practices',type:'video',duration:25},
      {id:'l12',title:'Lab : containerisation app complète',type:'exercise',duration:75},
    ]},
    {id:'ch4',title:'Module 4 — Kubernetes',lessons:[
      {id:'l13',title:'Architecture K8s : pods, services, ingress',type:'video',duration:35},
      {id:'l14',title:'Déploiements, scaling & rolling updates',type:'video',duration:30},
      {id:'l15',title:'ConfigMaps, secrets & persistence',type:'video',duration:30},
      {id:'l16',title:'Helm & gestion de packages',type:'video',duration:25},
      {id:'l17',title:'Lab : cluster K8s sur EKS',type:'exercise',duration:90},
    ]},
    {id:'ch5',title:'Module 5 — CI/CD & Monitoring',lessons:[
      {id:'l18',title:'GitHub Actions & GitLab CI',type:'video',duration:35},
      {id:'l19',title:'Jenkins & pipelines avancées',type:'video',duration:35},
      {id:'l20',title:'Terraform & infrastructure as code',type:'video',duration:40},
      {id:'l21',title:'Monitoring : Prometheus, Grafana, CloudWatch',type:'video',duration:30},
      {id:'l22',title:'Lab : pipeline CI/CD complète',type:'exercise',duration:90},
    ]},
    {id:'ch6',title:'Module 6 — Projets & Certification',lessons:[
      {id:'l23',title:'Projet : infrastructure cloud complète',type:'project',duration:180},
      {id:'l24',title:'Préparation AWS SAA : questions type',type:'video',duration:45},
      {id:'l25',title:'Session live : architecture review',type:'live',duration:60},
      {id:'l26',title:'Examen final',type:'quiz',duration:60},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C24 — Blockchain, Web3 & Smart Contracts (40h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c24',title:'Blockchain, Web3 & Smart Contracts',category:'Tech',instructor:'Emmanuel Coly',instructorId:'f15',level:'avancé',duration:40,price:79900,enrolled:33,rating:4.6,status:'coming',description:'Ethereum, Solidity, NFTs, DeFi, tokenisation des actifs africains. Comprenez la révolution blockchain et créez vos premiers smart contracts.',tags:['blockchain','web3','solidity','ethereum'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux Blockchain',lessons:[
      {id:'l1',title:'Historique & principes de la blockchain',type:'video',duration:25},
      {id:'l2',title:'Bitcoin vs Ethereum : différences fondamentales',type:'video',duration:25},
      {id:'l3',title:'Consensus : Proof of Work & Proof of Stake',type:'video',duration:30},
      {id:'l4',title:'Wallets, transactions & gaz fees',type:'video',duration:25},
      {id:'l5',title:'Exercice : première transaction testnet',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Solidity & Smart Contracts',lessons:[
      {id:'l6',title:'Langage Solidity : types, fonctions, events',type:'video',duration:35},
      {id:'l7',title:'ERC-20 : création de tokens',type:'video',duration:30},
      {id:'l8',title:'ERC-721 & ERC-1155 : NFTs',type:'video',duration:30},
      {id:'l9',title:'Sécurité : reentrancy, overflow, access control',type:'video',duration:35},
      {id:'l10',title:'Lab : smart contract voting',type:'exercise',duration:75},
    ]},
    {id:'ch3',title:'Module 3 — DeFi & Applications',lessons:[
      {id:'l11',title:'DEX & AMM : Uniswap, PancakeSwap',type:'video',duration:30},
      {id:'l12',title:'Lending & borrowing : Aave, Compound',type:'video',duration:25},
      {id:'l13',title:'Yield farming & staking',type:'video',duration:25},
      {id:'l14',title:'Tokenisation des actifs africains',type:'video',duration:30},
      {id:'l15',title:'Exercice : interaction protocole DeFi',type:'exercise',duration:45},
    ]},
    {id:'ch4',title:'Module 4 — DApps & Web3',lessons:[
      {id:'l16',title:'Web3.js & Ethers.js',type:'video',duration:30},
      {id:'l17',title:'Connexion wallet MetaMask',type:'video',duration:25},
      {id:'l18',title:'IPFS & stockage décentralisé',type:'video',duration:25},
      {id:'l19',title:'Lab : DApp complète React + Web3',type:'exercise',duration:90},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l20',title:'Projet : tokenisation projet immobilier',type:'project',duration:120},
      {id:'l21',title:'Régulation crypto en Afrique',type:'video',duration:25},
      {id:'l22',title:'Session live Q&R',type:'live',duration:45},
      {id:'l23',title:'Examen final',type:'quiz',duration:45},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C25 — Montage Vidéo Pro (30h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c25',title:'Montage Vidéo Pro — Premiere Pro & DaVinci Resolve',category:'Design',instructor:'Bernadette Ndiaye',instructorId:'f16',level:'débutant',duration:30,price:44900,enrolled:112,rating:4.8,status:'coming',description:'Montage professionnel, étalonnage couleur, effets spéciaux, motion design, export multi-plateformes. Devenez monteur vidéo pour réseaux sociaux et cinéma.',tags:['vidéo','premiere','davinci','montage'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux du Montage',lessons:[
      {id:'l1',title:'Grammaire du montage : plans, séquences, rythme',type:'video',duration:25},
      {id:'l2',title:'Premiere Pro : interface & flux de travail',type:'video',duration:30},
      {id:'l3',title:'Import, organisation & proxies',type:'video',duration:20},
      {id:'l4',title:'Exercice : montage interview 2 caméras',type:'exercise',duration:45},
    ]},
    {id:'ch2',title:'Module 2 — Étalonnage & Effets',lessons:[
      {id:'l5',title:'DaVinci Resolve : page Color',type:'video',duration:30},
      {id:'l6',title:'Correction couleur primaire & secondaire',type:'video',duration:30},
      {id:'l7',title:'Luts & looks cinématographiques',type:'video',duration:20},
      {id:'l8',title:'Transitions, titres & graphismes',type:'video',duration:25},
      {id:'l9',title:'Exercice : étalonnage scène complète',type:'exercise',duration:45},
    ]},
    {id:'ch3',title:'Module 3 — Motion Design & Audio',lessons:[
      {id:'l10',title:'After Effects : animations 2D',type:'video',duration:30},
      {id:'l11',title:'Lower thirds & logo animations',type:'video',duration:25},
      {id:'l12',title:'Sound design & mixage audio',type:'video',duration:25},
      {id:'l13',title:'Exercice : intro animée chaîne YouTube',type:'exercise',duration:60},
    ]},
    {id:'ch4',title:'Module 4 — Export & Multi-plateformes',lessons:[
      {id:'l14',title:'Codecs, résolutions & formats',type:'video',duration:20},
      {id:'l15',title:'Optimisation YouTube, TikTok, Instagram',type:'video',duration:20},
      {id:'l16',title:'Workflow collaboratif & archivage',type:'video',duration:20},
      {id:'l17',title:'Exercice : export multi-format',type:'exercise',duration:30},
    ]},
    {id:'ch5',title:'Module 5 — Projets & Certification',lessons:[
      {id:'l18',title:'Projet : court-métrage 3 min',type:'project',duration:120},
      {id:'l19',title:'Session live : feedback montage',type:'live',duration:45},
      {id:'l20',title:'Examen final',type:'quiz',duration:30},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C26 — Photographie Professionnelle (25h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c26',title:'Photographie Professionnelle & Retouche Lightroom',category:'Design',instructor:'Antoine Seck',instructorId:'f17',level:'débutant',duration:25,price:39900,enrolled:76,rating:4.7,status:'coming',description:'Prise de vue, composition, éclairage studio, retouche Lightroom, gestion de flux. Maîtrisez l\'image pour la mode, l\'immobilier et les événements.',tags:['photo','lightroom','retouche','studio'],
  chapters:[
    {id:'ch1',title:'Module 1 — Technique Photo',lessons:[
      {id:'l1',title:'Triangle d\'exposition : ouverture, vitesse, ISO',type:'video',duration:25},
      {id:'l2',title:'Mise au point & profondeur de champ',type:'video',duration:20},
      {id:'l3',title:'Composition : règle des tiers, lignes, cadres',type:'video',duration:20},
      {id:'l4',title:'Exercice : série 10 photos composées',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Éclairage',lessons:[
      {id:'l5',title:'Lumière naturelle : golden hour, direction',type:'video',duration:20},
      {id:'l6',title:'Flash & éclairage studio : softbox, parapluie',type:'video',duration:25},
      {id:'l7',title:'Portrait : éclairage clair-obscur, Rembrandt',type:'video',duration:25},
      {id:'l8',title:'Exercice : portrait studio 3 setups',type:'exercise',duration:40},
    ]},
    {id:'ch3',title:'Module 3 — Lightroom & Retouche',lessons:[
      {id:'l9',title:'Workflow Lightroom : import à export',type:'video',duration:25},
      {id:'l10',title:'Module Développement : exposition, courbes, HSL',type:'video',duration:30},
      {id:'l11',title:'Retouche portrait : peau, yeux, détails',type:'video',duration:25},
      {id:'l12',title:'Préréglages & synchronisation',type:'video',duration:20},
      {id:'l13',title:'Exercice : retouche série événement',type:'exercise',duration:45},
    ]},
    {id:'ch4',title:'Module 4 — Spécialisations & Projets',lessons:[
      {id:'l14',title:'Photo immobilière & architecture',type:'video',duration:20},
      {id:'l15',title:'Photo culinaire & produit',type:'video',duration:20},
      {id:'l16',title:'Photo événementielle & reportage',type:'video',duration:20},
      {id:'l17',title:'Projet : portfolio 15 photos',type:'project',duration:60},
      {id:'l18',title:'Examen final',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C27 — Finance Personnelle, Bourse & Investissement (20h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c27',title:'Finance Personnelle, Bourse & Investissement',category:'Finance',instructor:'Paul Martin',instructorId:'f12',level:'débutant',duration:20,price:34900,enrolled:94,rating:4.8,status:'coming',description:'Budget familial, épargne, investissement BRVM, crypto-monnaies, immobilier locatif. Prenez le contrôle de vos finances et bâtissez votre liberté financière.',tags:['finance-perso','bourse','investissement','brvm'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux',lessons:[
      {id:'l1',title:'Mentalité riche vs pauvre',type:'video',duration:20},
      {id:'l2',title:'Budget familial & règle 50/30/20',type:'video',duration:20},
      {id:'l3',title:'Fond d\'urgence & assurances essentielles',type:'video',duration:20},
      {id:'l4',title:'Exercice : bilan patrimonial personnel',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Investissement BRVM',lessons:[
      {id:'l5',title:'Introduction à la bourse UEMOA',type:'video',duration:20},
      {id:'l6',title:'Analyse fondamentale : ratios, dividendes',type:'video',duration:25},
      {id:'l7',title:'Analyse technique : supports, résistances',type:'video',duration:25},
      {id:'l8',title:'Exercice : sélection portefeuille actions',type:'exercise',duration:35},
    ]},
    {id:'ch3',title:'Module 3 — Immobilier & Crypto',lessons:[
      {id:'l9',title:'Investissement immobilier locatif',type:'video',duration:20},
      {id:'l10',title:'SCPI & crowdfunding immobilier',type:'video',duration:20},
      {id:'l11',title:'Bitcoin & crypto : comprendre avant d\'investir',type:'video',duration:25},
      {id:'l12',title:'Exercice : plan d\'investissement 5 ans',type:'exercise',duration:35},
    ]},
    {id:'ch4',title:'Module 4 — Projets & Certification',lessons:[
      {id:'l13',title:'Fiscalité des investissements',type:'video',duration:20},
      {id:'l14',title:'Projet : stratégie patrimoniale complète',type:'project',duration:60},
      {id:'l15',title:'Session live Q&R',type:'live',duration:30},
      {id:'l16',title:'Examen final',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C28 — Réseaux & Systèmes — Cisco CCNA (45h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c28',title:'Réseaux & Systèmes — Cisco CCNA',category:'Tech',instructor:'Joseph Faye',instructorId:'f14',level:'intermédiaire',duration:45,price:64900,enrolled:38,rating:4.6,status:'coming',description:'Routage, commutation, VLANs, sécurité réseau, troubleshooting. Préparation complète à la certification Cisco CCNA pour le marché IT africain.',tags:['cisco','ccna','réseaux','routing'],
  chapters:[
    {id:'ch1',title:'Module 1 — Fondamentaux Réseaux',lessons:[
      {id:'l1',title:'Modèle OSI & TCP/IP',type:'video',duration:25},
      {id:'l2',title:'Adressage IP, sous-réseaux, CIDR',type:'video',duration:35},
      {id:'l3',title:'Protocoles : TCP, UDP, DHCP, DNS',type:'video',duration:30},
      {id:'l4',title:'Câblage & équipements réseau',type:'video',duration:20},
      {id:'l5',title:'Lab : configuration réseau local',type:'exercise',duration:45},
    ]},
    {id:'ch2',title:'Module 2 — Commutation',lessons:[
      {id:'l6',title:'Switches : MAC table, forwarding',type:'video',duration:25},
      {id:'l7',title:'VLANs, trunking & inter-VLAN routing',type:'video',duration:35},
      {id:'l8',title:'STP & prévention des boucles',type:'video',duration:30},
      {id:'l9',title:'EtherChannel & redondance',type:'video',duration:25},
      {id:'l10',title:'Lab : topology switch avancée',type:'exercise',duration:60},
    ]},
    {id:'ch3',title:'Module 3 — Routage',lessons:[
      {id:'l11',title:'Routage statique & dynamique',type:'video',duration:25},
      {id:'l12',title:'OSPF : configuration & ajustement',type:'video',duration:35},
      {id:'l13',title:'EIGRP & BGP : concepts',type:'video',duration:30},
      {id:'l14',title:'ACLs & NAT',type:'video',duration:30},
      {id:'l15',title:'Lab : réseau multi-site avec OSPF',type:'exercise',duration:75},
    ]},
    {id:'ch4',title:'Module 4 — Sécurité & Services',lessons:[
      {id:'l16',title:'Sécurité réseau : port security, DHCP snooping',type:'video',duration:25},
      {id:'l17',title:'VPN site-to-site & remote access',type:'video',duration:30},
      {id:'l18',title:'IPv6 : adressage & transition',type:'video',duration:25},
      {id:'l19',title:'Wireless LAN fundamentals',type:'video',duration:20},
      {id:'l20',title:'Lab : sécurisation réseau entreprise',type:'exercise',duration:60},
    ]},
    {id:'ch5',title:'Module 5 — Troubleshooting & Certification',lessons:[
      {id:'l21',title:'Méthodologie troubleshooting',type:'video',duration:20},
      {id:'l22',title:'Diagnostics couche 1 à 7',type:'video',duration:30},
      {id:'l23',title:'Préparation CCNA : questions & labs',type:'video',duration:45},
      {id:'l24',title:'Projet : audit réseau entreprise',type:'project',duration:60},
      {id:'l25',title:'Examen final',type:'quiz',duration:60},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C29 — Création de Contenu YouTube & TikTok Pro (22h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c29',title:'Création de Contenu YouTube & TikTok Pro',category:'Marketing',instructor:'Marie-Claire Diop',instructorId:'f13',level:'débutant',duration:22,price:32900,enrolled:143,rating:4.9,status:'coming',description:'Scripting, tournage, SEO YouTube, monétisation, partenariats marques. Devenez créateur de contenu à temps plein avec des revenus stables.',tags:['youtube','tiktok','content','monétisation'],
  chapters:[
    {id:'ch1',title:'Module 1 — Stratégie de Contenu',lessons:[
      {id:'l1',title:'Trouver sa niche & angle unique',type:'video',duration:20},
      {id:'l2',title:'Persona spectateur & parcours d\'attention',type:'video',duration:20},
      {id:'l3',title:'Calendrier éditorial & batching',type:'video',duration:20},
      {id:'l4',title:'Exercice : plan de contenu 30 jours',type:'exercise',duration:25},
    ]},
    {id:'ch2',title:'Module 2 — Production Vidéo',lessons:[
      {id:'l5',title:'Scripting : accroche, storytelling, CTA',type:'video',duration:20},
      {id:'l6',title:'Tournage solo : setup minimal pro',type:'video',duration:25},
      {id:'l7',title:'Édition rapide & templates',type:'video',duration:20},
      {id:'l8',title:'Miniatures & titres qui cliquent',type:'video',duration:20},
      {id:'l9',title:'Exercice : production 3 shorts',type:'exercise',duration:40},
    ]},
    {id:'ch3',title:'Module 3 — SEO & Croissance',lessons:[
      {id:'l10',title:'SEO YouTube : mots-clés, titres, descriptions',type:'video',duration:20},
      {id:'l11',title:'Algorithme TikTok : ce qui fonctionne',type:'video',duration:20},
      {id:'l12',title:'Cross-platform : YouTube, TikTok, Instagram',type:'video',duration:20},
      {id:'l13',title:'Analytics & optimisation',type:'video',duration:15},
    ]},
    {id:'ch4',title:'Module 4 — Monétisation',lessons:[
      {id:'l14',title:'AdSense & Programme Partenaire',type:'video',duration:20},
      {id:'l15',title:'Partenariats marques & sponsorships',type:'video',duration:20},
      {id:'l16',title:'Produits digitaux & affiliation',type:'video',duration:20},
      {id:'l17',title:'Projet : chaîne + première monétisation',type:'project',duration:60},
      {id:'l18',title:'Session live Q&R',type:'live',duration:30},
      {id:'l19',title:'Examen final',type:'quiz',duration:20},
    ]},
  ]},

  // ════════════════════════════════════════════════════════════════════
  // C30 — Anglais Technique & IT pour Développeurs (35h)
  // ════════════════════════════════════════════════════════════════════
  {id:'c30',title:'Anglais Technique & IT pour Développeurs',category:'Langues',instructor:'Bernadette Ndiaye',instructorId:'f16',level:'intermédiaire',duration:35,price:42900,enrolled:87,rating:4.7,status:'coming',description:'Anglais technique pour le code, documentation, réunions Scrum, présentations tech. Indispensable pour travailler à distance avec des clients internationaux.',tags:['anglais-tech','it','scrum','remote'],
  chapters:[
    {id:'ch1',title:'Module 1 — Anglais du Code',lessons:[
      {id:'l1',title:'Vocabulaire programming : variables, functions, loops',type:'video',duration:25},
      {id:'l2',title:'Lecture de documentation technique',type:'video',duration:25},
      {id:'l3',title:'Commentaires & commit messages',type:'video',duration:20},
      {id:'l4',title:'Exercice : rédiger documentation anglaise',type:'exercise',duration:30},
    ]},
    {id:'ch2',title:'Module 2 — Réunions Agile & Scrum',lessons:[
      {id:'l5',title:'Daily stand-up : structure & expressions',type:'video',duration:20},
      {id:'l6',title:'Sprint planning & review',type:'video',duration:25},
      {id:'l7',title:'Retrospectives & feedback',type:'video',duration:20},
      {id:'l8',title:'Role play : réunion Scrum complète',type:'exercise',duration:35},
    ]},
    {id:'ch3',title:'Module 3 — Communication Client',lessons:[
      {id:'l9',title:'Emails clients : demandes, devis, livraison',type:'video',duration:25},
      {id:'l10',title:'Calls & visioconférences',type:'video',duration:20},
      {id:'l11',title:'Gestion des attentes & deadlines',type:'video',duration:20},
      {id:'l12',title:'Exercice : négociation contrat freelance',type:'exercise',duration:35},
    ]},
    {id:'ch4',title:'Module 4 — Présentations Tech',lessons:[
      {id:'l13',title:'Architecture diagrams & explanations',type:'video',duration:25},
      {id:'l14',title:'Code reviews en anglais',type:'video',duration:20},
      {id:'l15',title:'Post-mortem & incident reports',type:'video',duration:20},
      {id:'l16',title:'Exercice : présentation tech 10 min',type:'exercise',duration:40},
    ]},
    {id:'ch5',title:'Module 5 — Remote Work & Culture',lessons:[
      {id:'l17',title:'Remote work : async communication',type:'video',duration:20},
      {id:'l18',title:'Culture tech : Slack, GitHub, Stack Overflow',type:'video',duration:20},
      {id:'l19',title:'Certifications tech anglophones',type:'video',duration:15},
      {id:'l20',title:'Projet : présentation projet client simulé',type:'project',duration:60},
      {id:'l21',title:'Session live conversation',type:'live',duration:45},
      {id:'l22',title:'Examen final',type:'quiz',duration:45},
    ]},
  ]},
]
