import { useState, useRef, useEffect } from 'react'
import ArkelUpLogo from '../../components/icons/ArkelUpLogo'
import {
  IconPlay, IconPause, IconQuiz, IconExercise, IconReading,
  IconProject, IconLive, IconClock, IconCheck, IconCheckCircle,
  IconClose, IconChevronRight, IconChevronDown, IconRefresh,
  IconCertificate, IconBP, IconDownload, IconCopy, IconPrint,
  CategoryIcon, LessonTypeIcon, IconPDF, IconEye, IconShield, IconUnlock,
} from './ArkelUpIcons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getPDFsForUser, formatFileSize } from './coursePDFs'

// ─── Lesson content library ──────────────────────────────────────────────────
const LESSON_CONTENT = {
  // ── Rich text content per lesson title ──
  getLessonText(lesson, course) {
    const texts = {
      'Mindset entrepreneur': `**Introduction**\nL'entrepreneuriat en Afrique demande une mentalité particulière. Contrairement aux marchés matures où les structures sont déjà en place, l'Afrique offre des opportunités pour ceux qui osent créer.\n\n**1. Mentalité de croissance vs fixe**\nSelon Carol Dweck, ceux qui croient que leurs compétences peuvent s'améliorer par l'effort (growth mindset) réussissent davantage. En Afrique, les ressources sont limitées — c'est précisément cette contrainte qui forge l'innovation.\n\n**2. Tolérance au risque calculé**\nEchouer n'est pas la fin. Au Sénégal, la startup Overtime a pivoted 3 fois avant de trouver son modèle. L'important est de valider rapidement à moindre coût.\n\n**3. Les 5 traits des entrepreneurs africains qui réussissent**\n• Résilience face aux coupures, à la bureaucratie, au manque de financement\n• Réseautage : le « waxal » et la confiance relationnelle sont essentiels\n• Frugalité : créer beaucoup avec peu\n• Vision locale : comprendre les vrais problèmes de sa communauté\n• Agilité : s'adapter aux changements de réglementation et de marché`,
      'Lean Startup': `**Le cycle Build-Measure-Learn**\nÉric Ries a formalisé cette approche : construire rapidement une version minimale, mesurer la réaction du marché, et apprendre pour itérer.\n\n**MVP africain**\nPas besoin d'une app complète. Wave a commencé par un simple service de transfert d'argent via USSD. Testez avec WhatsApp, des landing pages, ou des prototypes papier.\n\n**Comment décider : pivot ou persister ?**\n• Si vos métriques de rétention stagnent après 3 itérations → pivot\n• Si un segment adore votre produit mais pas les autres → pivot sur ce segment\n• Si le canal de acquisition est trop cher → pivot sur le canal\n\n**OKRs pour startups**\nObjectifs trimestriels mesurables. Exemple : « Atteindre 1000 utilisateurs actifs mensuels d'ici fin Q2 ».`,
      'Business Model Canvas': `**Les 9 blocs expliqués**\n1. Segments clients : qui paye ? (ex: jeunes urbains 18-35 ans)\n2. Proposition de valeur : quel problème résolvez-vous ?\n3. Canaux : comment les atteindre ? (radio, WhatsApp, influenceurs)\n4. Relations clients : comment les fidéliser ?\n5. Flux de revenus : paiement mobile, abonnement, commission ?\n6. Ressources clés : votre équipe, vos données, vos partenariats\n7. Activités clés : développement, vente, support\n8. Partenariats : fournisseurs, distributeurs, hubs tech\n9. Structure de coûts : coûts fixes (salaires) et variables (marketing)\n\n**Adaptation à l'Afrique**\nPensez « mobile-first », « cash economy », et « confiance communautaire ». Le paiement par mobile money est 10× plus répandu que les cartes bancaires.`,
      'HTML5 sémantique': `**Pourquoi la sémantique compte**\nLes balises sémantiques (<header>, <nav>, <main>, <article>, <footer>) aident les moteurs de recherche à comprendre la structure de votre page et améliorent l'accessibilité pour les lecteurs d'écran.\n\n**Structure type d'une page web**\n<header> : logo + navigation\n<main> : contenu principal unique par page\n<article> : contenu autonome (article de blog, fiche produit)\n<section> : regroupement thématique\n<aside> : contenu connexe (sidebar, publicités)\n<footer> : liens légaux, contact, réseaux sociaux\n\n**Accessibilité (a11y)**\n• Attribut alt sur toutes les images\n• Contraste minimum 4.5:1 pour le texte\n• Navigation au clavier possible\n• Labels associés aux inputs via for/id`,
      'CSS3, Flexbox': `**Le modèle de boîte CSS**\nChaque élément est une boîte avec : content → padding → border → margin. La propriété box-sizing: border-box inclut padding et border dans la taille totale.\n\n**Flexbox — Alignement 1D**\ndisplay: flex sur le conteneur\n• justify-content : alignement horizontal (flex-start, center, space-between)\n• align-items : alignement vertical (stretch, center, flex-start)\n• flex-direction : row (défaut) ou column\n• flex-wrap : wrap pour le responsive\n\n**Grid Layout — Alignement 2D**\ndisplay: grid\n• grid-template-columns: repeat(3, 1fr)\n• gap: 16px\n• grid-template-areas pour des layouts complexes\n\n**Media Queries**\n@media (max-width: 768px) { ... } permet d'adapter le design aux écrans mobiles. Mobile-first = écrire d'abord pour mobile, puis ajouter des règles pour desktop.`,
      'JavaScript ES6+': `**Variables et portée**\nconst : valeur fixe (référence immuable)\nlet : valeur modifiable, portée de bloc\nvar : à éviter, portée de fonction, hoisting\n\n**Arrow functions**\nconst double = x => x * 2;\nAvantages : syntaxe concise, pas de binding de this propre (hérite du parent).\n\n**Destructuring**\nconst { name, age } = user;\nconst [first, ...rest] = array;\n\n**Spread & Rest**\nconst copy = { ...obj }; // copie superficielle\nconst merged = { ...defaults, ...user };\n\n**Async/Await**\nasync function fetchData() {\n  try {\n    const res = await fetch('/api');\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    console.error(err);\n  }\n}\n\n**Template literals**\nconst greeting = \`Bonjour \${name}, vous avez \${age} ans\`;`,
      'React composants': `**Composants fonctionnels**\nfunction Welcome({ name }) {\n  return <h1>Bonjour {name}</h1>;\n}\n\n**JSX**\nSyntaxe qui ressemble à du HTML dans du JavaScript. Règles :\n• Un seul élément racine\n• className au lieu de class\n• onClick au lieu de onclick\n• Expressions JavaScript entre accolades {}\n\n**Props**\nDonnées passées du parent vers l'enfant. Immuables dans l'enfant.\nfunction Card({ title, children }) {\n  return <div><h2>{title}</h2>{children}</div>;\n}\n\n**useState**\nconst [count, setCount] = useState(0);\nNe jamais muter directement : setCount(count + 1) ✓, count++ ✗\n\n**useEffect**\nuseEffect(() => {\n  // code au montage / mise à jour\n  return () => { /* cleanup */ };\n}, [dependency]); // tableau de dépendances`,
      'Node.js Express': `**Architecture serveur**\nUn serveur Node.js reçoit des requêtes HTTP et renvoie des réponses. Express simplifie ce processus.\n\n**Route basique**\nconst express = require('express');\nconst app = express();\napp.get('/api/users', (req, res) => {\n  res.json({ users: [] });\n});\n\n**Middleware**\nFonctions qui traitent les requêtes en chaîne :\n• express.json() : parse le body JSON\n• cors() : autorise les requêtes cross-origin\n• Authentification : vérifie le token JWT\n\n**REST API**\nGET /users → liste\nGET /users/:id → détail\nPOST /users → création\nPUT /users/:id → mise à jour complète\nPATCH /users/:id → mise à jour partielle\nDELETE /users/:id → suppression\n\n**Connexion base de données**\nAvec PostgreSQL + pg ou MongoDB + Mongoose. Utilisez des variables d'environnement pour les credentials.`,
      'SQL & Bases de données': `**Modèle relationnel**\nTables liées par des clés étrangères. Trois formes normales (3NF) évitent la redondance.\n\n**Requêtes fondamentales**\nSELECT * FROM users WHERE age > 18 ORDER BY name;\nINSERT INTO users (name, email) VALUES ('Ali', 'ali@test.com');\nUPDATE users SET name = 'Aliou' WHERE id = 1;\nDELETE FROM users WHERE id = 1;\n\n**Jointures**\nINNER JOIN : correspondances dans les deux tables\nLEFT JOIN : toutes les lignes de la table de gauche\n\n**Index**\nCREATE INDEX idx_email ON users(email);\nAccélère les recherches mais ralentit les insertions.\n\n**Transactions**\nBEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1; UPDATE accounts SET balance = balance + 100 WHERE id = 2; COMMIT;\nGarantit l'atomicité : tout ou rien.`,
      'SYSCOHADA': `**Structure du référentiel**\nLe SYSCOHADA classe les comptes en 8 classes :\n1 : Comptes de ressources durables (capitaux, emprunts)\n2 : Comptes d'actifs immobilisés\n3 : Comptes de stocks\n4 : Comptes de tiers (clients, fournisseurs)\n5 : Comptes de trésorerie\n6 : Comptes de charges\n7 : Comptes de produits\n8 : Comptes de résultat (à ne pas confondre avec le compte de résultat)\n\n**Bilan**\nActif = Passif (Capitaux propres + Dettes)\nActif = immobilisations + stocks + créances + disponibilités\n\n**Compte de résultat**\nProduits - Charges = Résultat\nEBITDA = Excédent brut d'exploitation\n\n**TVA au Sénégal**\nTaux normal : 18%\nTaux réduit : 10% (certains biens et services)\nTaux zéro : exportations, prestations internationales`,
      'Facebook Ads': `**Structure d'une campagne**\nCampaign → Ad Sets → Ads\n• Campaign : objectif (Conversions, Traffic, Awareness)\n• Ad Set : audience, budget, placement, calendrier\n• Ad : créatif (image, vidéo, carrousel), texte, CTA\n\n**Audiences**\n• Core : ciblage par intérêts, comportements, démographie\n• Custom : vos propres listes (emails, visiteurs site)\n• Lookalike : personnes similaires à vos meilleurs clients\n\n**Paiement mobile**\nEn Afrique, privilégiez les formats click-to-WhatsApp et les lead forms natifs. Le paiement en ligne par carte est faible ; prévoyez un suivi par Orange Money / Wave.\n\n**Métriques clés**\nCPM (coût par 1000 impressions), CPC, CTR, ROAS (Return On Ad Spend). Un ROAS > 3 est rentable.`,
      'SEO': `**Les piliers du SEO**\n1. Technique : vitesse, mobile-friendly, indexation, sitemap\n2. Contenu : pertinence, E-E-A-T (Experience, Expertise, Authority, Trust)\n3. Backlinks : liens entrants de qualité\n\n**Recherche de mots-clés**\nUtilisez Ubersuggest (gratuit) ou Ahrefs (payant).\n• Volume : nombre de recherches mensuelles\n• KD (Keyword Difficulty) : difficulté de classement\n• Intent : informational, navigational, transactional\n\n**On-page SEO**\n• Title < 60 caractères avec mot-clé principal\n• Meta description < 160 caractères\n• H1 unique par page, structure H2/H3 logique\n• Alt text sur les images\n• URL courte et descriptive\n\n**SEO local**\nGoogle Business Profile, avis clients, NAP (Name, Address, Phone) cohérent sur tous les annuaires.`,
      'Leadership': `**Leadership transformationnel**\nInspire et motive au-delà de la rémunération. 4 piliers :\n1. Influence idéalisée (modèle)\n2. Motivation inspirante (vision)\n3. Stimulation intellectuelle (innovation)\n4. Considération individualisée (développement)\n\n**Ubuntu en management**\n« Je suis parce que nous sommes. » Le management africain valorise la communauté, la consultation collective et le respect des aînés.\n\n**Gestion des conflits**\n• Méthode DESC : Décrire, Exprimer, Spécifier, Conséquences\n• Ne jamais régler un conflit en public (perte de face)\n• Impliquer un tiers respecté si nécessaire\n\n**Tableaux de bord**\nOKR (Objectives & Key Results) + KPIs opérationnels. Réunion hebdomadaire de 15 min max.`,
      'Droit OHADA': `**Actes uniformes essentiels**\n• Acte uniforme du droit commercial général\n• Acte uniforme des sociétés commerciales et du GIE (ASCOGE)\n• Acte uniforme relatif au droit des sûretés\n• Acte uniforme de procédure devant la Cour Commune de Justice et d'Arbitrage (CCJA)\n\n**Formes de sociétés**\n• SARL : 1 à 100 associés, capital libre, gérant\n• SA : actionnaires, conseil d'administration, directoire\n• SAS : forme flexible, répandue chez les startups\n\n**Contrats commerciaux**\nObligatoirement écrit pour les valeurs > 500 000 FCFA. Mentionner les parties, l'objet, le prix, les modalités d'exécution, la résolution des litiges.\n\n**Règlement des litiges**\nLa CCJA à Abidjan ou l'arbitrage OHADA sont les voies privilégiées.`,
      'Gestion de projet': `**Triangle d'or**\nPortée (scope) + Temps + Coût = Qualité. Vous ne pouvez pas optimiser les trois simultanément.\n\n**Scrum**\n• Product Backlog : liste de toutes les fonctionnalités\n• Sprint : itération de 2-4 semaines\n• Daily stand-up : 15 min, 3 questions (hier, aujourd'hui, blocages)\n• Sprint Review + Retrospective\n\n**Diagramme de Gantt**\nOutil visuel pour planifier. Microsoft Project, GanttProject (gratuit), ou Notion.\n\n**Gestion des risques**\nIdentifiez (matrice probabilité × impact), planifiez des actions, surveillez. En Afrique : risque devise, risque politique, risque infrastructure.`,
      'Excel avancé': `**INDEX / MATCH**\n=INDEX(plage, MATCH(valeur, colonne, 0))\nPlus flexible que RECHERCHEV car la colonne de recherche peut être à droite.\n\n**Tableaux croisés dynamiques**\nAlt + N + V (Excel) → sélectionner plage → glisser champs dans zones Lignes, Colonnes, Valeurs.\n\n**Power Query**\nOutil d'ETL intégré à Excel. Importez, transformez, fusionnez des données de multiples sources (CSV, web, base de données).\n\n**Macros VBA**\nSub Hello()\n  MsgBox "Bonjour"\nEnd Sub\nEnregistrez une macro pour générer le code, puis modifiez-le.`,
      'Power BI': `**Flux de travail**\n1. Power Query : connecter et transformer les données\n2. Modèle de données : créer les relations entre tables\n3. DAX : formules pour les mesures calculées\n4. Visualisations : choisir les graphiques adaptés\n5. Publication : Power BI Service\n\n**DAX fondamental**\n• SUM, AVERAGE, COUNT\n• CALCULATE : modifie le contexte de filtre\n• FILTER : retourne une table filtrée\n\n**Types de visualisations**\n• Cartes KPI : indicateurs clés\n• Graphiques à barres : comparaisons\n• Courbes : tendances temporelles\n• Cartes géographiques : données par région\n• Matrices : tableaux croisés`,
      'Canva': `**Organisation du travail**\n• Créer un dossier par projet\n• Utiliser les templates comme point de départ\n• Établir une charte graphique (couleurs, polices, logo)\n\n**Formats par plateforme**\n• Instagram feed : 1080×1080 px\n• Instagram story / Reels : 1080×1920 px\n• LinkedIn : 1200×627 px\n• Facebook : 1200×630 px\n• TikTok : 1080×1920 px\n\n**Principes de design**\n• Hiérarchie visuelle : le plus important en grand et en haut\n• Contraste : texte lisible sur image (ombre ou overlay)\n• Cohérence : mêmes couleurs et polices sur tous les visuels\n• Espace blanc : ne surchargez pas`,
      'Shopify': `**Configuration de base**\n1. Créer un compte Shopify (14 jours gratuits)\n2. Choisir un thème responsive (Dawn est gratuit)\n3. Configurer les paramètres de la boutique (devise FCFA, langue fr)\n4. Ajouter les produits (images, descriptions, variants)\n5. Configurer les frais de livraison\n\n**Paiement mobile en Afrique**\n• Intégrer PayDunya ou CinetPay pour mobile money\n• Proposer le paiement à la livraison (cash on delivery)\n• WhatsApp Checkout : le client commande par WhatsApp\n\n**Conversion**\n• Page produit : images de qualité, avis clients, description détaillée\n• Panier abandonné : email/SMS de relance automatique\n• Upsell : proposer des produits complémentaires`,
      'Anglais professionnel': `**Structure d'un email**\nSubject line : clair et actionnable\nOpening : contexte + purpose\nBody : 1 idée par paragraphe, bullet points\nClosing : call to action + deadline\nSign-off : Best regards / Kind regards\n\n**Réunions**\n• "Let's kick off with..." pour commencer\n• "To recap..." pour résumer\n• "Action items : who does what by when"\n• "Let's take this offline" pour les sujets hors sujet\n\n**Négociation**\n• Préparer votre BATNA (Best Alternative to a Negotiated Agreement)\n• Anchor high : proposer un chiffre audacieux en premier\n• Concession graduelle : ne jamais céder trop vite\n• Silence : après une offre, attendre. Le premier qui parle perd.`,
      'Photographie': `**Triangle d'exposition**\n• Ouverture (f/) : contrôle la profondeur de champ. f/1.8 = arrière-plan flou. f/11 = tout net.\n• Vitesse d'obturation : figer (1/500s) ou flouter (1/15s) le mouvement.\n• ISO : sensibilité du capteur. Bas = propre. Haut = grain.\n\n**Composition**\n• Règle des tiers : placer le sujet sur les intersections\n• Lignes directrices : routes, rivières, fenêtres\n• Encadrement : utiliser les portes, fenêtres, branches\n• Perspective : changer de hauteur (au sol, en hauteur)\n\n**Lightroom**\nWorkflow : Import → Étoiles/Flags → Développement → Export.\nDéveloppement : exposition → balance des blancs → tonalité → couleurs → détails → effets.`,
      'UI/UX Figma': `**Design Thinking**\n1. Empathie : comprendre les utilisateurs via interviews\n2. Définition : formuler le problème en phrase « How might we... »\n3. Idéation : brainstorm, mind mapping, Crazy 8s\n4. Prototypage : wireframes rapides\n5. Test : 5 utilisateurs suffisent pour détecter 85% des problèmes\n\n**Figma — Auto-layout**\nCrée des composants qui s'adaptent automatiquement au contenu.\nDirection : Vertical / Horizontal\nPadding : espacement interne\nGap : espacement entre éléments\n\n**Design System**\n• Couleurs : primaire, secondaire, états (hover, disabled, error)\n• Typographie : 3 tailles max (titre, sous-titre, corps)\n• Composants : boutons, inputs, cartes, modales\n• Espacement : multiple de 4 ou 8 px`,
      'Cloud AWS': `**Modèles de service**\n• IaaS : Infrastructure (EC2, S3) — vous gérez OS, middleware, app\n• PaaS : Plateforme (Elastic Beanstalk, Heroku) — vous gérez l'app\n• SaaS : Logiciel (Gmail, Salesforce) — vous utilisez\n\n**Services clés AWS**\n• EC2 : serveurs virtuels\n• S3 : stockage d'objets (images, backups)\n• RDS : bases de données managées\n• Lambda : fonctions serverless\n• CloudFront : CDN pour la distribution globale\n\n**Sécurité cloud**\n• IAM : Identity and Access Management (principe du moindre privilège)\n• VPC : réseau privé virtuel avec subnets publics/privés\n• Security Groups : pare-feu au niveau instance\n• AWS WAF : protection contre les attaques web`,
      'Blockchain': `**Principes fondamentaux**\n• Décentralisation : pas d'autorité centrale\n• Immutabilité : une transaction enregistrée ne peut pas être effacée\n• Transparence : toutes les transactions sont publiques et vérifiables\n• Consensus : les nœuds du réseau doivent s'accorder\n\n**Smart Contracts**\nCode auto-exécutable sur la blockchain.\nSolidity : langage principal d'Ethereum.\n• Fonctions : public, external, internal, private\n• Modifiers : onlyOwner, reentrancy guard\n• Events : logging pour le front-end\n\n**Tokenisation en Afrique**\n• Tokeniser des actifs immobiliers pour fractionner l'investissement\n• Certificats académiques anti-contrefaçon\n• Traçabilité agricole (origine, qualité)\n• Paiements transfrontaliers instantanés`,
      'Cybersécurité': `**CIA Triad**\n• Confidentiality : données accessibles uniquement aux autorisés\n• Integrity : données exactes et non altérées\n• Availability : systèmes accessibles quand nécessaire\n\n**OWASP Top 10**\n1. Broken Access Control\n2. Cryptographic Failures\n3. Injection (SQL, NoSQL, OS command)\n4. Insecure Design\n5. Security Misconfiguration\n6. Vulnerable and Outdated Components\n7. Identification and Authentication Failures\n8. Software and Data Integrity Failures\n9. Security Logging and Monitoring Failures\n10. Server-Side Request Forgery (SSRF)\n\n**Bonnes pratiques**\n• Authentification multi-facteurs (MFA)\n• Mots de passe forts et gestionnaire de mots de passe\n• Chiffrement des données sensibles (AES-256)\n• Mises à jour régulières (patch management)\n• Backups 3-2-1 : 3 copies, 2 supports, 1 hors site`,
      'Réseaux Cisco': `**Modèle OSI**\n7. Application (HTTP, FTP, SMTP)\n6. Présentation (SSL/TLS, encoding)\n5. Session (gestion des sessions)\n4. Transport (TCP, UDP, ports)\n3. Réseau (IP, routage)\n2. Liaison (MAC, Ethernet)\n1. Physique (câbles, signaux)\n\n**Adressage IP**\nIPv4 : 32 bits, 4 octets (ex: 192.168.1.1)\nMasque de sous-réseau : définit la partie réseau et la partie hôte\nCIDR : /24 = 256 adresses, /16 = 65 536 adresses\n\n**Routage**\n• Statique : administrateur définit les routes manuellement\n• Dynamique : protocoles (OSPF, EIGRP, BGP) échangent les routes\n• NAT : translation d'adresse pour partager une IP publique\n• ACL : Access Control Lists pour filtrer le trafic`,
      'Finance personnelle': `**Règle 50/30/20**\n• 50% : besoins (loyer, transport, nourriture)\n• 30% : envies (loisirs, resto, shopping)\n• 20% : épargne et remboursement dettes\n\n**Fond d'urgence**\n3 à 6 mois de dépenses sur un compte accessible. Au Sénégal, compte épargne BHS ou livret CEL avec un taux ~3,5%.\n\n**BRVM (Bourse Régionale des Valeurs Mobilières)**\n• Actions : propriété d'une partie de l'entreprise\n• Obligations : prêt à l'entreprise/État avec intérêts fixes\n• OPCVM : fonds gérés par des professionnels\n\n**Analyse fondamentale**\n• PER (Price Earning Ratio) : cours / bénéfice par action\n• ROE (Return On Equity) : rentabilité des capitaux propres\n• Dividende yield : rendement du dividende`,
      'Agrobusiness': `**Chaînes de valeur**\nProduction → Transformation → Distribution → Consommation\nChaque maillon ajoute de la valeur. En Afrique, le plus grand potentiel est dans la transformation locale.\n\n**Cultures à haute valeur**\n• Anacarde : Côte d'Ivoire et Ghana dominent\n• Mangue : marché d'export vers l'Europe\n• Moringa : superfood mondial en forte demande\n• Spiruline : complément alimentaire à fort potentiel\n• Sesame : marché japonais et coréen\n\n**Financement agricole**\n• BNDE : prêts long terme à taux préférentiel\n• Cauris Crédit : microfinance spécialisée\n• CECA (Caisses d'Épargne et de Crédit Agricole)\n• Partenariats avec des transformateurs pour des contrats de préfinancement`,
      'Génie civil': `**Matériaux de construction**\n• Béton : ciment + sable + gravier + eau. Dosage typique C25/30 pour logement.\n• Acier : barres à haute adhérence (HA) pour le ferraillage\n• Parpaings : 15×20×40 cm standard au Sénégal\n\n**Béton armé**\nBéton résiste bien à la compression mais mal à la traction.\nL'acier résiste bien à la traction.\n=> On associe les deux : le béton comprimé, l'acier tendu.\n\n**Métré**\nQuantification de chaque ouvrage pour établir le coût.\nExemple : mur en briques = longueur × hauteur × épaisseur (m³)\n\n**Planning**\nDiagramme de Gantt : barres horizontales représentant les tâches dans le temps.\nChemin critique : séquence de tâches dont le retard impacte la date finale.`,
      'RH & Paie': `**Recrutement**\n1. Définition du besoin (fiche de poste)\n2. Sourcing (annonces, réseaux, cooptation)\n3. Sélection (CV, tests, entretiens structurés)\n4. Onboarding (intégration sur 90 jours)\n\n**Code du travail sénégalais**\n• CDI / CDD / CTT (contrat à temps partiel)\n• Durée légale : 40h/semaine\n• Heures supplémentaires : +15% (jour), +40% (nuit), +60% (dimanche/jour férié)\n• Congés payés : 2,5 jours ouvrables / mois = 30 jours / an\n\n**Charges sociales**\n• IPRES : retraite (employeur 7.2%, salarié 3.6%)\n• CSS : couverture maladie (employeur 3%, salarié 3%)\n• AMO : assurance maladie obligatoire (employeur 3%, salarié 3%)\n• PF : prestations familiales (employeur 7%)`,
      'Communication': `**Gérer le trac**\n• Respiration 4-7-8 : inspirez 4s, retenez 7s, expirez 8s\n• Visualisation positive : imaginez-vous réussir\n• Préparation : répétez à voix haute 5× minimum\n• Connexion : regardez 3 personnes dans la salle, pas le public entier\n\n**Structure d'une présentation**\n• Accroche : question, chiffre choquant, histoire personnelle\n• Problème : ce qui ne va pas\n• Solution : votre proposition\n• Preuve : données, témoignages, démonstration\n• CTA : appel à l'action clair\n\n**Langage non-verbal**\n• Gestes ouverts (pas les bras croisés)\n• Station debout : pieds écartés largeur des épaules\n• Mouvements lents et intentionnels\n• Sourire authentique (les yeux aussi sourient)`,
      'Immobilier': `**Titres fonciers**\n• Titre foncier : propriété complète et définitive\n• Permis d'habiter : pour les constructions neuves\n• ACD (Attestation de Cession de Droit) : droit de construire sur un terrain communal\n\n**Calcul de rentabilité**\nRendement brut = (Loyer annuel / Prix d'achat) × 100\nRendement net = ((Loyer annuel - Charges) / (Prix + Frais)) × 100\nUn rendement net > 6% est correct à Dakar.\n\n**BTP**\n• Dossier de consultation (DC) : description des travaux pour les entreprises\n• DPGF (Décomposition du Prix Global Forfaitaire)\n• DCE (Dossier de Consultation des Entreprises)\n• Reception : provisoire (1 an de garantie) puis définitive`,
      'Montage vidéo': `**Grammaire du montage**\n• Plan : visage complet\n• American shot : jusqu'aux genoux\n• Gros plan : visage seul\n• Travelling : mouvement de caméra\n• Contrechamp : alternance de deux angles opposés\n\n**Premiere Pro**\n• Séquence : timeline où on assemble les clips\n• Outil Razoir (C) : couper un clip\n• Outil Sélection (V) : déplacer les clips\n• Effets : transitions, stabilisation, correction couleur Lumetri\n\n**DaVinci Resolve — Color grading**\n• Nodes : chaîne de traitements couleur\n• Primaires : Lift (ombres), Gamma (mi-tons), Gain (hautes lumières)\n• Qualificateur : sélectionner une couleur spécifique pour l'ajuster`,
      'YouTube & TikTok': `**Algorithme YouTube**\n• Click-Through Rate (CTR) : % de clics sur les impressions\n• Average View Duration (AVD) : temps de visionnage moyen\n• Engagement : likes, commentaires, partages\n• Consistency : fréquence de publication régulière\n\n**SEO YouTube**\n• Mot-clé principal dans le titre (début de titre)\n• Description de 200+ mots avec timestamps\n• Tags : 10-15 mots-clés pertinents\n• Playlist : regrouper les vidéos par thème\n\n**Monétisation**\n• AdSense : 1000 abonnés + 4000h visionnage (12 derniers mois)\n• Sponsorships : tarif ≈ 0.01-0.05€ par vue attendue\n• Produits digitaux : formation, ebook, template\n• Affiliation : liens Amazon, partenariats marques`,
    }
    for (const [k, v] of Object.entries(texts)) {
      if (lesson.title.toLowerCase().includes(k.toLowerCase())) return v
    }
    // Fallback généré dynamiquement
    return `**${lesson.title}**\n\nCette leçon fait partie du cours « ${course?.title || 'Arkel Up'} ». Elle couvre des concepts fondamentaux essentiels à votre progression dans ce domaine.\n\n**Objectifs d'apprentissage**\n• Comprendre les principes théoriques de ce sujet\n• Identifier les applications pratiques dans le contexte africain\n• Maîtriser les outils et méthodologies associés\n• Appliquer ces connaissances à des cas réels\n\n**Contexte**\nEn Afrique de l'Ouest, la maîtrise de ce domaine représente un avantage concurrentiel majeur. Les entreprises qui investissent dans la formation de leurs équipes constatent une amélioration moyenne de 35% de leur productivité.\n\n**Application**\nPendant cette leçon de ${lesson.duration} minutes, concentrez-vous sur les exemples concrets et prenez des notes. Les concepts présentés seront directement applicables à votre projet professionnel ou entrepreneurial.`
  },

  getKeyPoints(lesson, course) {
    const base = {
      'Mindset entrepreneur': ['Développer une mentalité de croissance vs mentalité fixe','Identifier votre "Why" selon Simon Sinek','Tolérance au risque calculé : expérimentez vite, échouez vite','Biographies inspirantes : Elon Musk, Aliko Dangote, Frédéric Ouedraogo','Les 5 traits communs des entrepreneurs africains qui réussissent'],
      'Lean Startup': ['Build-Measure-Learn : le cycle d\'itération rapide','Définir votre MVP minimum viable product','Pivot vs persister : comment décider ?','Exemple : Dropbox MVP — simple video de démonstration','OKRs pour les startups en phase de validation'],
      'Business Model Canvas': ['Les 9 blocs : Segments, Proposition, Canaux, Relations, Revenus, Activités, Ressources, Partenaires, Coûts','Adapter le BMC aux réalités africaines','Mobile-first, cash economy, réseau de confiance','Exemples : Wave, Jumia, mPesa','Testez 3 modèles de revenus différents avant de choisir'],
      'SEO': ['Les 200+ facteurs Google ranking','Keyword research avec Ubersuggest, Ahrefs','Backlinks : qualité > quantité','Core Web Vitals et performance technique','SEO local pour les PME africaines'],
      'React': ['Composants fonctionnels vs classes : les classes sont obsolètes','Virtual DOM : comment React optimise les rendus','Hooks rules : seulement dans les composants / hooks custom','State immutabilité : ne mutez jamais directement','Écosystème : React Router, Zustand, React Query, Vite'],
      'HTML5 sémantique': ['Balises structurelles : header, nav, main, article, section, aside, footer','Accessibilité (a11y) : alt, contrastes, navigation clavier','SEO on-page : hiérarchie H1-H6, balises meta','Sémantique vs div : un seul H1 par page, pas de saut de niveau','WAI-ARIA pour les composants complexes'],
      'CSS3 Flexbox': ['Flex container : display flex, inline-flex','Axes principal et transversal : flex-direction','Alignement : justify-content, align-items, align-self','Répartition : flex-grow, flex-shrink, flex-basis','Responsive : flex-wrap, media queries mobile-first'],
      'JavaScript': ['Variables const/let vs var : portée de bloc','Arrow functions et binding du this','Async/await et gestion des Promises','Array methods : map, filter, reduce, find, some','Destructuring et spread operator'],
      'Node.js': ['Event loop non-bloquant','Middleware pattern dans Express','Gestion des erreurs avec try/catch','Variables d\'environnement (dotenv)','Tests avec Jest ou Vitest'],
      'SQL': ['Modèle relationnel et normalisation (3NF)','Clés primaires et étrangères','Jointures : INNER, LEFT, RIGHT, FULL','Index pour optimiser les requêtes','Transactions ACID'],
      'SYSCOHADA': ['8 classes de comptes (1-8)','Bilan Actif = Passif','Compte de résultat : Produits - Charges','TVA Sénégal : 18% taux normal','Amortissement linéaire et dégressif'],
      'Facebook Ads': ['Structure Campaign > Ad Set > Ad','Audiences : Core, Custom, Lookalike','Paiement mobile : click-to-WhatsApp','Métriques : CPM, CPC, CTR, ROAS','Test A/B : une variable à la fois'],
      'Leadership': ['Leadership transformationnel : 4 piliers','Ubuntu : management communautaire africain','DESC : méthode de gestion de conflits','OKR : Objectives & Key Results','Feedback régulier et constructif'],
      'OHADA': ['Actes uniformes essentiels','SARL vs SA vs SAS','Contrats commerciaux écrits > 500K FCFA','CCJA : règlement des litiges','Comptabilité SYSCOHADA obligatoire'],
      'Gestion de projet': ['Triangle d\'or : Scope, Time, Cost','Scrum : sprints, daily, review, retro','Gantt : planification visuelle','Matrice des risques : probabilité × impact','Stakeholder management'],
      'Excel': ['INDEX/MATCH plus puissant que VLOOKUP','Tableaux croisés dynamiques','Power Query : ETL intégré','Macros VBA : automatisation','Validation de données et mise en forme conditionnelle'],
      'Power BI': ['Power Query : import et transformation','Modélisation : relations et cardinalité','DAX : CALCULATE, FILTER, SUMX','Visualisations : KPI, barres, cartes, matrices','Publication Power BI Service'],
      'Canva': ['Templates et design systems','Formats optimaux par réseau social','Hiérarchie visuelle et CTA','Palette de couleurs cohérente','Espace blanc et lisibilité'],
      'Shopify': ['Configuration boutique et thèmes','Paiement mobile : PayDunya, CinetPay','Conversion : page produit, panier, checkout','Marketing automation : paniers abandonnés','Analytics et optimisation'],
      'Anglais': ['Structure email : subject, opening, body, closing, CTA','Réunions : kick off, recap, action items','Négociation : BATNA, anchor, silence','Vocabulaire sectoriel : tech, finance, marketing','Certifications : TOEIC, IELTS'],
      'Photo': ['Triangle d\'exposition : ouverture, vitesse, ISO','Règle des tiers et composition','Lightroom : workflow Import → Développement → Export','Retouche portrait : peau, yeux, détails','Spécialisations : immobilier, culinaire, événement'],
      'Figma': ['Design thinking : empathie, définition, idéation, prototype, test','Auto-layout : direction, padding, gap','Design system : couleurs, typographie, composants','Prototypage interactif','Tests utilisateurs : 5 personnes suffisent'],
      'Cloud': ['IaaS, PaaS, SaaS : différences et cas d\'usage','AWS : EC2, S3, RDS, Lambda, CloudFront','Sécurité : IAM, VPC, Security Groups','Serverless : functions sans gestion de serveur','Coûts : on-demand, reserved instances, spot'],
      'Blockchain': ['Décentralisation, immutabilité, transparence','Solidity : langage de smart contracts','ERC-20 (tokens) et ERC-721 (NFTs)','DeFi : Uniswap, Aave, staking','Tokenisation des actifs africains'],
      'Cybersécurité': ['CIA Triad : Confidentiality, Integrity, Availability','OWASP Top 10','MFA et gestion des mots de passe','Chiffrement AES-256','Backups 3-2-1'],
      'Cisco': ['Modèle OSI : 7 couches','Adressage IP et sous-réseaux','Routage statique et dynamique (OSPF, BGP)','VLANs et trunking','ACLs et NAT'],
      'Finance perso': ['Règle 50/30/20','Fond d\'urgence : 3-6 mois','BRVM : actions, obligations, OPCVM','Analyse fondamentale : PER, ROE','Fiscalité des investissements'],
      'Agrobusiness': ['Chaînes de valeur agricoles','Cultures à haute valeur ajoutée','Transformation locale = plus-value','Financement : BNDE, CECA, microfinance','Exportation : normes et certifications'],
      'Génie civil': ['Matériaux : béton, acier, parpaings','Béton armé : compression + traction','Métré et quantitatifs','Planning Gantt et chemin critique','Normes de construction et sécurité'],
      'RH': ['Recrutement : sourcing, sélection, onboarding','Code du travail sénégalais','Charges sociales : IPRES, CSS, AMO, PF','GPEC et formation','Tableaux de bord RH'],
      'Communication': ['Gestion du trac : respiration, visualisation','Structure : accroche, problème, solution, preuve, CTA','Langage non-verbal','Storytelling émotionnel','Feedback et amélioration continue'],
      'Immobilier': ['Titres fonciers et permis','Rentabilité : brut vs net','BTP : DCE, DPGF, DC','Gestion locative et baux','Promotion immobilière'],
      'Vidéo': ['Grammaire du montage : plans, séquences, rythme','Premiere Pro : timeline, razoir, transitions','DaVinci Resolve : color grading','Motion design : After Effects','Export multi-format'],
      'YouTube': ['Algorithme : CTR, AVD, engagement','SEO : titre, description, tags, playlist','Monétisation : AdSense, sponsorships, produits','Cross-platform : YouTube, TikTok, Instagram','Cohérence éditoriale'],
    }
    for (const [k, v] of Object.entries(base)) {
      if (lesson.title.toLowerCase().includes(k.toLowerCase())) return v
    }
    const catPoints = {
      Business: ['Analyse des besoins du marché local','Modèles économiques adaptés à l\'Afrique de l\'Ouest','Conformité OHADA et réglementation sénégalaise','Financement : BNDE, BHS, fonds d\'amorçage','Métriques clés de performance business'],
      Tech: ['Architecture orientée composants','Bonnes pratiques de code propre (Clean Code)','Tests unitaires et intégration continue','Documentation et maintenabilité','Performance et optimisation'],
      Finance: ['Principes de prudence comptable','Correspondance des exercices SYSCOHADA','Analyse des ratios financiers','Gestion de trésorerie pour PME','Conformité fiscale DGI Sénégal'],
      Marketing: ['Entonnoir AARRR : Acquisition, Activation, Rétention, Recommandation, Revenu','Content marketing adapté au marché africain','Community management francophone','Analytics : Google Analytics 4, Facebook Insights','ROI publicitaire minimum attendu : 3x'],
      Management: ['Leadership situationnel selon Hersey & Blanchard','Gestion des équipes multiculturelles africaines','Communication non-violente (CNV)','OKRs et tableaux de bord de pilotage','Gestion des conflits et performance'],
      Juridique: ['Actes uniformes OHADA','Droit des sociétés : SARL, SA, SAS','Règlement des litiges commerciaux','Protection de la propriété intellectuelle','Conformité fiscale et sociale'],
      RH: ['Recrutement et onboarding','Code du travail et charges sociales','GPEC et formation professionnelle','Gestion de la paie et déclarations','Bien-être et culture d\'entreprise'],
      Logistique: ['Supply chain et flux','Incoterms 2020','Douanes et procédures CEDEAO','Gestion des stocks et entrepôts','Transport et distribution'],
      Immobilier: ['Droit foncier et urbanisme','BTP et construction','Gestion locative','Promotion immobilière','Rentabilité et fiscalité'],
      Agriculture: ['Chaînes de valeur agricoles','Agrobusiness et financement','Transformation et conservation','Exportation et normes','Agriculture intelligente et digitale'],
      Langues: ['Communication professionnelle','Vocabulaire sectoriel','Certifications internationales','Présentations et négociations','Remote work et culture tech'],
      Design: ['Théorie du design et composition','Outils : Canva, Figma, Photoshop','UI/UX et accessibilité','Prototypage et tests utilisateurs','Portfolio et présentation client'],
    }
    return catPoints[course?.category] || ['Point clé 1 de ce module','Point clé 2 avec exemples pratiques','Point clé 3 — application directe','Point clé 4 — cas réels africains','Point clé 5 — outils et ressources recommandées']
  },

  getQuizQuestions(lesson, course) {
    const genericByCategory = {
      Business: [
        { q:'Que représente le "M" dans l\'acronyme MVP ?', options:['Market Value Proposition','Minimum Viable Product','Maximum Value Point','Market Validation Process'], correct:1, explanation:'MVP = Minimum Viable Product : la version la plus simple d\'un produit qui permet de tester une hypothèse avec de vrais utilisateurs.' },
        { q:'Quel est le principal avantage de l\'approche Lean Startup ?', options:['Réduire les coûts au maximum','Valider rapidement les hypothèses avant d\'investir massivement','Copier les modèles étrangers','Éviter de parler aux clients'], correct:1, explanation:'Le Lean Startup permet de tester des hypothèses rapidement avec un minimum de ressources, réduisant le risque d\'investir dans quelque chose que personne ne veut.' },
        { q:'Le Business Model Canvas comprend combien de blocs ?', options:['6','7','9','12'], correct:2, explanation:'Le BMC d\'Osterwalder comporte 9 blocs : Segments clients, Proposition de valeur, Canaux, Relations clients, Flux de revenus, Ressources clés, Activités clés, Partenariats clés, Structure de coûts.' },
        { q:'Dans un pitch deck, quelle slide est la plus importante selon les investisseurs ?', options:['La slide financière','La slide équipe','La slide problème','La slide exit strategy'], correct:2, explanation:'La slide "Problème" est cruciale : les investisseurs investissent d\'abord dans un problème important à résoudre. Sans problème clairement défini, pas de solution crédible.' },
      ],
      Tech: [
        { q:'Qu\'est-ce que le Virtual DOM dans React ?', options:['Une base de données virtuelle','Une copie légère du DOM réel pour optimiser les mises à jour','Un outil de développement','Un gestionnaire d\'état'], correct:1, explanation:'Le Virtual DOM est une représentation légère du DOM réel en mémoire. React compare (diffing) le nouveau vDOM avec l\'ancien pour calculer le minimum de changements à appliquer au DOM réel.' },
        { q:'Quelle est la commande pour créer un projet Vite avec React ?', options:['npm create vite@latest','npx create-react-app','npm install react','yarn add vite'], correct:0, explanation:'La commande npm create vite@latest (ou yarn create vite) est l\'approche moderne recommandée. Create React App est obsolète depuis 2023.' },
        { q:'Que fait le hook useState dans React ?', options:['Fait une requête HTTP','Permet d\'ajouter un état local à un composant fonctionnel','Gère les effets secondaires','Optimise les performances'], correct:1, explanation:'useState est un hook qui permet d\'ajouter et de gérer un état local dans les composants fonctionnels React. Il retourne une paire [valeur, setter].' },
        { q:'Quelle méthode HTTP utilise-t-on pour créer une ressource en REST API ?', options:['GET','PUT','POST','DELETE'], correct:2, explanation:'POST est utilisé pour créer une nouvelle ressource. GET récupère, PUT/PATCH met à jour, DELETE supprime. C\'est la convention REST (RESTful APIs).' },
      ],
      Finance: [
        { q:'Que signifie SYSCOHADA ?', options:['Système Comptable des Hôtels et des Affaires','Système Comptable de l\'OHADA','Système de Contrôle Harmonisé des Affaires','Système Commercial de l\'OHADA'], correct:1, explanation:'SYSCOHADA = Système Comptable de l\'OHADA. C\'est le référentiel comptable unifié des 17 États membres de l\'Organisation pour l\'Harmonisation en Afrique du Droit des Affaires.' },
        { q:'Dans le bilan SYSCOHADA, l\'actif est composé de :', options:['Capitaux propres + Dettes','Actif immobilisé + Actif circulant + Trésorerie-Actif','Stocks + Créances + Liquidités','Immobilisations + Emprunts'], correct:1, explanation:'L\'actif du bilan SYSCOHADA se décompose en : Actif immobilisé (brut - amortissements), Actif circulant (stocks, créances), et Trésorerie-Actif (banque, caisse).' },
        { q:'La TVA applicable au Sénégal est de :', options:['15%','18%','20%','23%'], correct:1, explanation:'La TVA au Sénégal est de 18% (taux normal) depuis 2001. Il existe des taux réduits pour certains produits de première nécessité et des exonérations.' },
        { q:'L\'amortissement linéaire d\'une immobilisation à 5M FCFA sur 5 ans est de :', options:['500 000 FCFA/an','1 000 000 FCFA/an','2 500 000 FCFA/an','250 000 FCFA/an'], correct:1, explanation:'Amortissement linéaire = Valeur d\'origine / Durée de vie = 5 000 000 / 5 = 1 000 000 FCFA par an. Le taux est de 20% (1/5 ans).' },
      ],
      Marketing: [
        { q:'Que signifie CTR en marketing digital ?', options:['Cost To Reach','Click Through Rate','Customer Total Revenue','Channel Traffic Rate'], correct:1, explanation:'CTR = Click Through Rate = Taux de clics. Il mesure le % de personnes qui ont cliqué sur une annonce après l\'avoir vue. CTR = (Clics / Impressions) × 100.' },
        { q:'Quel réseau social a le plus grand nombre d\'utilisateurs actifs en Afrique de l\'Ouest ?', options:['Instagram','TikTok','WhatsApp','Twitter/X'], correct:2, explanation:'WhatsApp domine largement l\'Afrique de l\'Ouest avec plus de 400M d\'utilisateurs africains. C\'est le canal de communication numérique n°1, suivi de Facebook.' },
        { q:'Un bon score de Net Promoter Score (NPS) est supérieur à :', options:['0','30','50','80'], correct:1, explanation:'Un NPS > 0 est positif. > 30 est bon. > 50 est excellent. > 70 est exceptionnel (Apple, Amazon). Le NPS mesure la probabilité de recommandation sur une échelle 0-10.' },
        { q:'Que signifie SEO ?', options:['Social Engagement Optimization','Search Engine Optimization','Sales Enhancement Operations','Strategic Email Outreach'], correct:1, explanation:'SEO = Search Engine Optimization = Optimisation pour les moteurs de recherche. L\'objectif est d\'améliorer la visibilité organique (non payante) d\'un site sur Google et autres moteurs.' },
      ],
    }
    const cat = course?.category || 'Business'
    return genericByCategory[cat] || genericByCategory.Business
  },

  getExerciseInstructions(lesson) {
    if (lesson.type !== 'exercise' && lesson.type !== 'project') return ''
    const templates = {
      exercise: `EXERCICE PRATIQUE : ${lesson.title}

Durée estimée : ${lesson.duration} minutes

OBJECTIF
Appliquer les concepts vus dans ce module à votre propre contexte.

ÉTAPES
1. Lisez attentivement l'énoncé complet avant de commencer
2. Prenez 5 minutes pour réfléchir et noter vos idées brutes
3. Structurez votre réponse selon le format demandé
4. Relisez et enrichissez avec des exemples concrets

À RENDRE
Rédigez votre réponse dans le champ ci-dessous. Soyez précis et concret. Utilisez des exemples réels de votre secteur ou de votre projet personnel.

CRITÈRES D'ÉVALUATION
— Pertinence par rapport au contexte africain
— Exemples concrets et chiffrés
— Structure claire et argumentée
— Application directe des concepts du module`,
      project: `PROJET : ${lesson.title}

Durée estimée : ${lesson.duration} minutes

CONTEXTE
Ce projet est votre livrable principal pour ce module. Il sera intégré dans votre portfolio Arkel Up.

LIVRABLES ATTENDUS
1. Document principal (rédigez dans le champ ci-dessous)
2. Structurez votre projet en sections claires
3. Incluez des données chiffrées réalistes

CONSEILS
• Appuyez-vous sur les leçons précédentes de ce module
• N'hésitez pas à faire des recherches complémentaires
• Pensez "contexte africain / sénégalais" dans vos hypothèses

SOUMISSION
Votre travail sera sauvegardé automatiquement. Cliquez sur "Soumettre et continuer" quand vous êtes prêt.`,
    }
    return templates[lesson.type] || templates.exercise
  },
}

// ─── Progress storage ─────────────────────────────────────────────────────────
const PROGRESS_KEY = 'arkelup_progress_v2'
function loadProgress() { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') } catch { return {} } }
function saveProgress(p) { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)) } catch { /* ignore */ } }

function getCourseProgress(courseId) {
  const p = loadProgress()
  return p[courseId] || { completedLessons: [], quizScores: {}, exerciseAnswers: {}, bpData: {} }
}
function markLessonDone(courseId, lessonKey) {
  const p = loadProgress()
  if (!p[courseId]) p[courseId] = { completedLessons: [], quizScores: {}, exerciseAnswers: {}, bpData: {} }
  if (!p[courseId].completedLessons.includes(lessonKey)) {
    p[courseId].completedLessons.push(lessonKey)
    saveProgress(p)
  }
}
function saveQuizScore(courseId, lessonKey, score) {
  const p = loadProgress()
  if (!p[courseId]) p[courseId] = { completedLessons: [], quizScores: {}, exerciseAnswers: {}, bpData: {} }
  p[courseId].quizScores[lessonKey] = score
  saveProgress(p)
}
function saveExerciseAnswer(courseId, lessonKey, answer) {
  const p = loadProgress()
  if (!p[courseId]) p[courseId] = { completedLessons: [], quizScores: {}, exerciseAnswers: {}, bpData: {} }
  p[courseId].exerciseAnswers[lessonKey] = answer
  saveProgress(p)
}

// ─── Business Plan Steps ──────────────────────────────────────────────────────
const BP_STEPS = [
  { id:'problem', label:'Problème', prompt:'Décrivez le problème que vous résolvez. Qui en souffre ? Combien ça leur coûte ?' },
  { id:'solution', label:'Solution', prompt:'Décrivez votre solution. En quoi est-elle unique ? Quel est votre avantage concurrentiel ?' },
  { id:'market', label:'Marché', prompt:'Définissez votre marché : TAM, SAM, SOM. Qui sont vos clients cibles ?' },
  { id:'model', label:'Modèle Économique', prompt:'Comment gagnez-vous de l\'argent ? Sources de revenus, prix, unité économique.' },
  { id:'team', label:'Équipe', prompt:'Présentez l\'équipe fondatrice. Compétences, expériences, complémentarité.' },
  { id:'traction', label:'Traction', prompt:'Quelles preuves de traction avez-vous ? Clients, partenariats, revenus, KPIs.' },
  { id:'finance', label:'Projections', prompt:'Projections financières sur 3 ans. Hypothèses clés, chemin vers la rentabilité.' },
  { id:'ask', label:'Demande', prompt:'Combien levez-vous ? Pour quelle valorisation ? Usage précis des fonds ?' },
]

// ─── Category colors ──────────────────────────────────────────────────────────
const CAT_COLORS = {
  Business: { bg: 'rgba(168,85,247,0.18)', color: '#A855F7', thumb: 'linear-gradient(135deg,#1a0a3d,#2d1b69)' },
  Tech:     { bg: 'rgba(99,102,241,0.18)', color: '#6366F1', thumb: 'linear-gradient(135deg,#0d0037,#1a0a60)' },
  Finance:  { bg: 'rgba(240,180,41,0.18)', color: '#F0B429', thumb: 'linear-gradient(135deg,#1a1000,#302000)' },
  Marketing:{ bg: 'rgba(16,185,129,0.18)', color: '#10B981', thumb: 'linear-gradient(135deg,#001a10,#003020)' },
  Management:{ bg:'rgba(236,72,153,0.18)', color: '#EC4899', thumb: 'linear-gradient(135deg,#1a0018,#2d0028)' },
  Juridique:{ bg: 'rgba(248,113,113,0.18)',color: '#F87171', thumb: 'linear-gradient(135deg,#1a0000,#2d0808)' },
  RH:       { bg: 'rgba(251,146,60,0.18)', color: '#FB923C', thumb: 'linear-gradient(135deg,#1a0800,#2d1200)' },
}
function getCat(c) { return CAT_COLORS[c] || CAT_COLORS.Business }

// ─── Helper: total lessons in course ─────────────────────────────────────────
function totalLessons(course) {
  return course.chapters?.reduce((s, ch) => s + (ch.lessons?.length || 0), 0) || 0
}
function lessonKey(chIdx, lIdx) { return `${chIdx}_${lIdx}` }

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE PLAYER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CoursePlayer({ course, onClose, isAdmin = false, enrolled = new Set() }) {
  const { membre } = useAuth()
  const userId = membre?.id || null
  const isInstructor = course.instructorId === membre?.id
  const isEnrolled = isAdmin || enrolled.has(course.id)

  const progress = getCourseProgress(course.id)
  const [completedLessons, setCompleted] = useState(new Set(progress.completedLessons))
  const [quizScores, setQuizScores] = useState(progress.quizScores || {})
  const [exerciseAnswers, setExerciseAnswers] = useState(progress.exerciseAnswers || {})
  const [bpData, setBpData] = useState(progress.bpData || {})

  // ── PDFs ─────────────────────────────────────────────────────────────────────
  const [coursePDFs, setCoursePDFs] = useState(() => getPDFsForUser(course.id, { isAdmin, isEnrolled }))
  const [showPDFPanel, setShowPDFPanel] = useState(false)
  const [previewPDF, setPreviewPDF] = useState(null)

  function refreshPDFs() {
    setCoursePDFs(getPDFsForUser(course.id, { isAdmin, isEnrolled }))
  }

  // Materials
  const [materials, setMaterials] = useState([])
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    // Check if user has approved enrollment or is the instructor
    async function checkAccess() {
      if (isInstructor) { setHasAccess(true); return }
      if (!userId) { setHasAccess(false); return }
      const { data } = await supabase.from('arkelup_enrollments')
        .select('status')
        .eq('course_id', course.id)
        .eq('user_id', userId)
        .single()
      setHasAccess(data?.status === 'approved')
    }
    checkAccess()

    // Load course materials
    async function loadMaterials() {
      const { data, error } = await supabase.from('arkelup_course_materials')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_order', { ascending: true })
      if (!error) setMaterials(data || [])
    }
    loadMaterials()
  }, [course.id, userId, isInstructor])

  // Navigation
  const [activeCh, setActiveCh] = useState(0)
  const [activeL, setActiveL] = useState(0)
  const [openChapters, setOpenChapters] = useState(new Set([0]))
  const [showBP, setShowBP] = useState(false)
  const [showCert, setShowCert] = useState(false)
  const mainRef = useRef(null)

  const total = totalLessons(course)
  const completePct = total ? Math.round((completedLessons.size / total) * 100) : 0
  const allDone = completedLessons.size >= total

  const currentChapter = course.chapters?.[activeCh]
  const currentLesson = currentChapter?.lessons?.[activeL]
  const currentKey = lessonKey(activeCh, activeL)
  const isDone = completedLessons.has(currentKey)

  function flatLessons() {
    const list = []
    course.chapters?.forEach((ch, ci) => ch.lessons?.forEach((l, li) => list.push({ ch: ci, l: li, key: lessonKey(ci, li), lesson: l })))
    return list
  }
  function goToNext() {
    const flat = flatLessons()
    const idx = flat.findIndex(x => x.key === currentKey)
    if (idx < flat.length - 1) {
      setActiveCh(flat[idx + 1].ch)
      setActiveL(flat[idx + 1].l)
      setOpenChapters(s => new Set([...s, flat[idx + 1].ch]))
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  function goToPrev() {
    const flat = flatLessons()
    const idx = flat.findIndex(x => x.key === currentKey)
    if (idx > 0) {
      setActiveCh(flat[idx - 1].ch)
      setActiveL(flat[idx - 1].l)
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  function markDone() {
    const next = new Set(completedLessons)
    next.add(currentKey)
    setCompleted(next)
    markLessonDone(course.id, currentKey)
    if (next.size >= total) { setShowCert(true); return }
    goToNext()
  }
  function selectLesson(ci, li) {
    setActiveCh(ci); setActiveL(li)
    setOpenChapters(s => new Set([...s, ci]))
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const flat = flatLessons()
  const currentIdx = flat.findIndex(x => x.key === currentKey)
  const isLast = currentIdx === flat.length - 1
  const isFirst = currentIdx === 0

  // ── BP save
  function saveBP(stepId, val) {
    const next = { ...bpData, [stepId]: val }
    setBpData(next)
    const p = loadProgress()
    if (!p[course.id]) p[course.id] = { completedLessons: [...completedLessons], quizScores, exerciseAnswers, bpData: {} }
    p[course.id].bpData = next
    saveProgress(p)
  }

  // ── Exercise save
  function saveExercise(val) {
    const next = { ...exerciseAnswers, [currentKey]: val }
    setExerciseAnswers(next)
    saveExerciseAnswer(course.id, currentKey, val)
  }

  const cat = getCat(course.category)
  return (
    <div className="au-player-overlay">
      {/* PDF Preview Modal */}
      {previewPDF && (
        <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', display:'flex', flexDirection:'column' }} onClick={() => setPreviewPDF(null)}>
          <div style={{ padding:'11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(10,5,25,0.95)', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'rgba(240,244,255,0.8)' }}>
              <IconPDF size={17} color="#F0B429" />
              <div>
                <div style={{ fontWeight:700, fontSize:'0.86rem' }}>{previewPDF.title}</div>
                <div style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.35)' }}>{previewPDF.fileName} · {formatFileSize(previewPDF.fileSize)}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <a href={previewPDF.fileData} download={previewPDF.fileName}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, background:'rgba(240,180,41,0.12)', border:'1px solid rgba(240,180,41,0.3)', color:'#F0B429', fontWeight:700, fontSize:'0.75rem', textDecoration:'none' }}>
                <IconDownload size={12} /> Télécharger
              </a>
              <button onClick={() => setPreviewPDF(null)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.5)', cursor:'pointer', padding:'6px', borderRadius:7, display:'flex' }}>
                <IconClose size={14} />
              </button>
            </div>
          </div>
          <div style={{ flex:1, overflow:'hidden' }} onClick={e => e.stopPropagation()}>
            <iframe src={previewPDF.fileData} style={{ width:'100%', height:'100%', border:'none' }} title={previewPDF.title} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="au-player-header">
        <button className="au-player-close" onClick={onClose} title="Fermer"><IconClose size={16} /></button>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
          <ArkelUpLogo size={52} />
          <span className="au-player-course-title">{course.title}</span>
        </div>
        {coursePDFs.length > 0 && (
          <button
            onClick={() => setShowPDFPanel(v => !v)}
            style={{ padding:'7px 14px', borderRadius:10, border:`1px solid rgba(240,180,41,${showPDFPanel ? '0.5' : '0.25'})`, background: showPDFPanel ? 'rgba(240,180,41,0.15)' : 'rgba(240,180,41,0.07)', color:'#F0B429', cursor:'pointer', fontSize:'0.72rem', fontWeight:800, whiteSpace:'nowrap', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, position:'relative' }}
          >
            <IconPDF size={13} /> Supports
            {coursePDFs.length > 0 && (
              <span style={{ width:16, height:16, borderRadius:'50%', background:'#F0B429', color:'#0d0800', fontSize:'0.58rem', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{coursePDFs.length}</span>
            )}
          </button>
        )}
        <button
          onClick={() => setShowBP(v => !v)}
          style={{ padding:'7px 14px', borderRadius:10, border:`1px solid rgba(240,180,41,0.35)`, background: showBP ? 'rgba(240,180,41,0.15)' : 'transparent', color:'#F0B429', cursor:'pointer', fontSize:'0.75rem', fontWeight:800, whiteSpace:'nowrap', fontFamily:'inherit' }}
        >
          Business Plan
        </button>
        <div className="au-player-global-progress">
          <span className="au-player-global-pct">{completePct}%</span>
          <div className="au-player-progress-track">
            <div className="au-player-progress-fill" style={{ width: `${completePct}%` }} />
          </div>
        </div>
      </div>

      <div className="au-player-body">
        {/* Sidebar */}
        <aside className="au-player-sidebar">
          {course.chapters?.map((ch, ci) => {
            const chLessons = ch.lessons || []
            const chDone = chLessons.filter((_, li) => completedLessons.has(lessonKey(ci, li))).length
            const chOpen = openChapters.has(ci)
            return (
              <div key={ch.id} className="au-sidebar-chapter">
                <div
                  className={`au-sidebar-ch-header ${chOpen ? 'open' : ''}`}
                  onClick={() => setOpenChapters(s => { const n = new Set(s); n.has(ci) ? n.delete(ci) : n.add(ci); return n })}
                >
                  <div className={`au-sidebar-ch-check ${chDone === chLessons.length && chLessons.length > 0 ? 'done' : ''}`}>
                    {chDone === chLessons.length && chLessons.length > 0 ? <IconCheck size={10} /> : ''}
                  </div>
                  <span style={{ flex:1 }}>{ch.title}</span>
                  <span style={{ fontSize:'0.65rem', color:'rgba(240,244,255,0.35)', marginRight:6 }}>{chDone}/{chLessons.length}</span>
                  <span className="au-sidebar-ch-arrow"><IconChevronRight size={10} /></span>
                </div>
                {chOpen && chLessons.map((l, li) => {
                  const k = lessonKey(ci, li)
                  const done = completedLessons.has(k)
                  const active = ci === activeCh && li === activeL
                  return (
                    <div key={l.id} className={`au-sidebar-lesson ${active ? 'active' : ''} ${done ? 'done' : ''}`} onClick={() => selectLesson(ci, li)}>
                      <span className="au-sidebar-lesson-icon">{done ? <IconCheck size={10} /> : <LessonTypeIcon type={l.type} size={12} />}</span>
                      <span className="au-sidebar-lesson-title">{l.title}</span>
                      <span className="au-sidebar-lesson-dur">{l.duration}min</span>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* PDF Section in sidebar */}
          {coursePDFs.length > 0 && (
            <div style={{ marginTop:8, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:8 }}>
              <div style={{ padding:'6px 12px 8px', fontSize:'0.62rem', fontWeight:800, color:'rgba(240,180,41,0.6)', textTransform:'uppercase', letterSpacing:1.5, display:'flex', alignItems:'center', gap:6 }}>
                <IconPDF size={11} color="rgba(240,180,41,0.6)" /> Supports PDF ({coursePDFs.length})
              </div>
              {coursePDFs.map(pdf => (
                <div key={pdf.id}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', cursor:'pointer', transition:'background 0.14s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(240,180,41,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ color:'rgba(240,180,41,0.7)', flexShrink:0 }}><IconPDF size={13} /></span>
                  <span style={{ flex:1, fontSize:'0.74rem', color:'rgba(240,244,255,0.65)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>{pdf.title}</span>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={() => setPreviewPDF(pdf)} title="Voir"
                      style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,244,255,0.35)', padding:'2px', display:'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color='#6366F1'}
                      onMouseLeave={e => e.currentTarget.style.color='rgba(240,244,255,0.35)'}>
                      <IconEye size={12} />
                    </button>
                    <a href={pdf.fileData} download={pdf.fileName} title="Télécharger"
                      style={{ color:'rgba(240,244,255,0.35)', display:'flex', padding:'2px' }}
                      onMouseEnter={e => e.currentTarget.style.color='#F0B429'}
                      onMouseLeave={e => e.currentTarget.style.color='rgba(240,244,255,0.35)'}>
                      <IconDownload size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="au-player-main" ref={mainRef}>
          {showPDFPanel ? (
            <PDFPanel pdfs={coursePDFs} isAdmin={isAdmin} onPreview={setPreviewPDF} onRefresh={refreshPDFs} />
          ) : showBP ? (
            <BPMode course={course} bpData={bpData} onSave={saveBP} />
          ) : showCert ? (
            <CertificateView course={course} onClose={() => setShowCert(false)} />
          ) : currentLesson ? (
            <LessonView
              course={course}
              lesson={currentLesson}
              lessonKey={currentKey}
              isDone={isDone}
              quizScores={quizScores}
              exerciseAnswer={exerciseAnswers[currentKey] || ''}
              onQuizScore={(score) => {
                const next = { ...quizScores, [currentKey]: score }
                setQuizScores(next)
                saveQuizScore(course.id, currentKey, score)
              }}
              onExerciseChange={saveExercise}
              onMarkDone={markDone}
              onPrev={isFirst ? null : goToPrev}
              onNext={isLast ? null : goToNext}
              isLast={isLast}
              completePct={completePct}
              materials={materials}
              hasAccess={hasAccess}
              isInstructor={isInstructor}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LESSON VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function LessonView({ course, lesson, lessonKey: lk, isDone, quizScores, exerciseAnswer, onQuizScore, onExerciseChange, onMarkDone, onPrev, onNext, isLast, materials, hasAccess, isInstructor }) {
  const keyPoints = LESSON_CONTENT.getKeyPoints(lesson, course)
  const questions = LESSON_CONTENT.getQuizQuestions(lesson, course)
  const exerciseInstr = LESSON_CONTENT.getExerciseInstructions(lesson)
  const lessonText = LESSON_CONTENT.getLessonText(lesson, course)
  const typeLabel = { video:'Vidéo', quiz:'Quiz', exercise:'Exercice', reading:'Lecture', project:'Projet', live:'Session Live' }

  const showMaterials = materials.length > 0 && (hasAccess || isInstructor || materials.some(m => m.is_public))
  const visibleMaterials = materials.filter(m => hasAccess || isInstructor || m.is_public)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:860, margin:'0 auto', width:'100%' }}>
      {/* Lesson header */}
      <div className="au-lesson-header">
        <span className={`au-lesson-type-badge au-lesson-type-${lesson.type}`}>{typeLabel[lesson.type] || lesson.type}</span>
        <h1 className="au-lesson-title">{lesson.title}</h1>
      </div>

      {/* Content by type */}
      {lesson.type === 'video' && <VideoLesson lesson={lesson} keyPoints={keyPoints} text={lessonText} isDone={isDone} />}
      {lesson.type === 'reading' && <ReadingLesson lesson={lesson} keyPoints={keyPoints} text={lessonText} isDone={isDone} />}
      {lesson.type === 'quiz' && <QuizLesson lesson={lesson} questions={questions} lk={lk} score={quizScores[lk]} onScore={onQuizScore} isDone={isDone} />}
      {(lesson.type === 'exercise' || lesson.type === 'project') && (
        <ExerciseLesson lesson={lesson} instructions={exerciseInstr} answer={exerciseAnswer} onChange={onExerciseChange} isDone={isDone} />
      )}
      {lesson.type === 'live' && <LiveLesson lesson={lesson} keyPoints={keyPoints} text={lessonText} isDone={isDone} />}

      {/* Course Materials */}
      {showMaterials && (
        <div className="au-content-block" style={{ borderColor:'rgba(59,130,246,0.25)' }}>
          <h3 style={{ display:'flex', alignItems:'center', gap:8, color:'#3B82F6' }}>
            <IconDownload size={16} /> Supports de cours
            {isInstructor && (
              <span style={{ fontSize:'0.7rem', color:'rgba(240,244,255,0.5)', fontWeight:400 }}>(formateur)</span>
            )}
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
            {visibleMaterials.map(m => (
              <a key={m.id} href={m.file_url} target="_blank" rel="noreferrer" download
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', textDecoration:'none', color:'var(--text-primary)', transition:'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(59,130,246,0.12)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(59,130,246,0.06)'}
              >
                <span style={{ fontSize:'1.3rem' }}>📄</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'0.85rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.title}</div>
                  <div style={{ fontSize:'0.72rem', color:'rgba(240,244,255,0.5)' }}>{m.file_name}</div>
                </div>
                <span style={{ fontSize:'0.75rem', color:'#3B82F6', fontWeight:700, whiteSpace:'nowrap' }}>Télécharger ⬇</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="au-lesson-nav" style={{ paddingTop:8, borderTop:'1px solid rgba(46,125,50,0.1)', marginTop:8 }}>
        <button className="au-lesson-nav-btn" onClick={onPrev} disabled={!onPrev} style={{ display:'flex', alignItems:'center', gap:6 }}><IconChevronRight size={14} style={{ transform:'rotate(180deg)' }} /> Précédent</button>
        {!isDone && (
          <button className="au-lesson-complete-btn" onClick={onMarkDone} style={{ display:'flex', alignItems:'center', gap:7 }}>
            {isLast ? <><IconCertificate size={16} /> Terminer le cours</> : <>Marquer comme complété <IconChevronRight size={14} /></>}
          </button>
        )}
        {isDone && !isLast && (
          <button className="au-lesson-complete-btn" onClick={onNext} style={{ display:'flex', alignItems:'center', gap:7 }}>
            Leçon suivante <IconChevronRight size={14} />
          </button>
        )}
        {isDone && isLast && (
          <button className="au-lesson-complete-btn" onClick={onMarkDone} style={{ background:'linear-gradient(135deg,#F0B429,#E8A820)', color:'#0d0800', display:'flex', alignItems:'center', gap:7 }}>
            <IconCertificate size={16} /> Voir votre certificat
          </button>
        )}
        {onNext && isDone && !isLast && null}
        <button className="au-lesson-nav-btn" onClick={onNext} disabled={!onNext} style={{ display:'flex', alignItems:'center', gap:6 }}>Suivant <IconChevronRight size={14} /></button>
      </div>
    </div>
  )
}

// ── Video lesson
function VideoLesson({ lesson, keyPoints, text, isDone }) {
  const [playing, setPlaying] = useState(false)
  return (
    <>
      <div className="au-video-area">
        <div className="au-video-icon" onClick={() => setPlaying(v => !v)}>
          {playing ? <IconPause size={36} /> : <IconPlay size={36} />}
        </div>
        <span className="au-video-label">{playing ? 'Simulation lecture en cours...' : 'Cliquez pour lire la vidéo'}</span>
        <span className="au-video-duration" style={{ display:'flex', alignItems:'center', gap:5 }}><IconClock size={14} /> {lesson.duration} min</span>
        {playing && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:16 }}>
            <div style={{ width:200, height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#2E7D32,#4CAF50)', animation:'videoProgress 30s linear', borderRadius:2 }} />
            </div>
          </div>
        )}
        <style>{`@keyframes videoProgress { from{width:0%} to{width:100%} }`}</style>
      </div>
      <div className="au-content-block">
        <h3>Contenu de la leçon</h3>
        <div className="au-reading-content" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
      </div>
      <div className="au-content-block">
        <h3>Points clés de cette leçon</h3>
        <div className="au-key-points">
          {keyPoints.map((pt, i) => (
            <div key={i} className="au-key-point">
              <span className="au-key-point-num">{i + 1}</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>
      {isDone && <DoneNote />}
    </>
  )
}

// ── Reading lesson
function ReadingLesson({ lesson, keyPoints, text, isDone }) {
  return (
    <>
      <div className="au-content-block">
        <h3>Contenu de lecture</h3>
        <div className="au-reading-content" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
      </div>
      <div className="au-content-block">
        <h3>Points essentiels</h3>
        <div className="au-key-points">
          {keyPoints.map((pt, i) => (
            <div key={i} className="au-key-point">
              <span className="au-key-point-num">{i + 1}</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>
      {isDone && <DoneNote />}
    </>
  )
}

// ── Quiz lesson
function QuizLesson({ lesson, questions, lk, score, onScore, isDone }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(score !== undefined)
  const cq = questions[current]

  function answer(i) {
    if (answers[current] !== undefined) return
    setAnswers(a => ({ ...a, [current]: i }))
  }
  function next() {
    if (current < questions.length - 1) setCurrent(c => c + 1)
    else {
      const correct = questions.filter((q, i) => answers[i] === q.correct).length
      const finalScore = Math.round((correct / questions.length) * 100)
      onScore(finalScore)
      setFinished(true)
    }
  }
  function restart() { setAnswers({}); setCurrent(0); setFinished(false) }

  if (finished) {
    const finalScore = score ?? Math.round((questions.filter((q, i) => answers[i] === q.correct).length / questions.length) * 100)
    return (
      <div className="au-content-block">
        <h3>Résultat du quiz</h3>
        <div className="au-quiz-score">
          <div className="au-quiz-score-big" style={{ color: finalScore >= 70 ? '#10B981' : '#F0B429' }}>{finalScore}%</div>
          <div className="au-quiz-score-label">
            {finalScore >= 80 ? 'Excellent ! Vous maîtrisez ce module.' : finalScore >= 60 ? 'Bien ! Quelques révisions recommandées.' : 'Révisez les concepts et recommencez.'}
          </div>
          <div style={{ marginTop:20, display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="au-lesson-nav-btn" onClick={restart} style={{ display:'flex', alignItems:'center', gap:6 }}><IconRefresh size={14} /> Recommencer le quiz</button>
          </div>
        </div>
        {isDone && <DoneNote />}
      </div>
    )
  }

  if (!cq) return null
  const answered = answers[current] !== undefined
  return (
    <div className="au-content-block">
      <h3>Question {current + 1} / {questions.length}</h3>
      <div style={{ marginBottom:8, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${((current + 1) / questions.length) * 100}%`, background:'linear-gradient(90deg,#2E7D32,#4CAF50)', transition:'width 0.4s' }} />
      </div>
      <p className="au-quiz-question">{cq.question || cq.q}</p>
      <div className="au-quiz-options">
        {(cq.options || []).map((opt, i) => {
          let cls = 'au-quiz-option'
          if (answered) {
            if (i === cq.correct) cls += ' correct'
            else if (i === answers[current]) cls += ' wrong'
          }
          return (
            <button key={i} className={cls} onClick={() => answer(i)} disabled={answered}>
              <span className="au-quiz-option-letter">{['A','B','C','D'][i]}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {answered && cq.explanation && (
        <div className="au-quiz-explanation" style={{ display:'flex', alignItems:'flex-start', gap:8 }}><IconCheck size={14} style={{ flexShrink:0, marginTop:2 }} /> {cq.explanation}</div>
      )}
      <div className="au-quiz-navigation">
        {answered && (
          <button className="au-lesson-complete-btn" onClick={next} style={{ marginTop:8 }}>
            {current < questions.length - 1 ? 'Question suivante →' : 'Voir le résultat'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Exercise / Project lesson
function ExerciseLesson({ lesson, instructions, answer, onChange, isDone }) {
  return (
    <>
      <div className="au-content-block">
        <h3>Instructions</h3>
        <div className="au-exercise-instructions">{instructions}</div>
      </div>
      <div className="au-content-block">
        <h3>Votre travail</h3>
        <textarea
          className="au-exercise-textarea"
          placeholder="Rédigez votre réponse ici..."
          value={answer}
          onChange={e => onChange(e.target.value)}
          rows={10}
        />
        {answer.length > 0 && (
          <div style={{ marginTop:8, fontSize:'0.72rem', color:'rgba(240,244,255,0.35)' }}>
            {answer.length} caractères · Sauvegardé automatiquement
          </div>
        )}
      </div>
      {isDone && <DoneNote />}
    </>
  )
}

// ── Live session lesson
function LiveLesson({ lesson, keyPoints, text, isDone }) {
  return (
    <>
      <div className="au-content-block" style={{ borderColor:'rgba(236,72,153,0.2)' }}>
        <h3 style={{ color:'#EC4899' }}>Session en direct</h3>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'16px', background:'rgba(236,72,153,0.06)', borderRadius:12, marginBottom:16 }}>
          <span style={{ color:'#EC4899', flexShrink:0 }}><IconLive size={32} /></span>
          <div>
            <div style={{ fontWeight:800, color:'var(--au-white)', marginBottom:4 }}>Session Q&R live avec le formateur</div>
            <div style={{ fontSize:'0.84rem', color:'rgba(240,244,255,0.6)', lineHeight:1.6 }}>
              {text.replace(/\*\*(.+?)\*\*/g, '$1').slice(0, 300)}...
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button style={{ padding:'10px 20px', borderRadius:12, border:'1px solid rgba(236,72,153,0.4)', background:'rgba(236,72,153,0.1)', color:'#EC4899', cursor:'pointer', fontWeight:800, fontSize:'0.82rem', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 }}>
            <IconCheckCircle size={14} /> Réserver une session live
          </button>
          <button style={{ padding:'10px 20px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(240,244,255,0.6)', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 }}>
            <IconPlay size={14} /> Voir le replay
          </button>
        </div>
      </div>
      <div className="au-content-block">
        <h3>Préparation recommandée</h3>
        <div className="au-key-points">
          {keyPoints.slice(0, 4).map((pt, i) => (
            <div key={i} className="au-key-point">
              <span className="au-key-point-num">{i + 1}</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>
      {isDone && <DoneNote />}
    </>
  )
}

function DoneNote() {
  return (
    <div style={{ padding:'12px 18px', borderRadius:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', gap:10, alignItems:'center' }}>
      <span style={{ color:'#10B981', display:'flex' }}><IconCheck size={16} /></span>
      <span style={{ color:'#6EE7B7', fontSize:'0.84rem', fontWeight:700 }}>Leçon complétée</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS PLAN MODE
// ═══════════════════════════════════════════════════════════════════════════════
function BPMode({ course, bpData, onSave }) {
  const [activeStep, setActiveStep] = useState(0)
  const doneSteps = BP_STEPS.filter(s => bpData[s.id]?.trim()).length
  return (
    <div style={{ maxWidth:800, margin:'0 auto', width:'100%' }}>
      <div className="au-bp-mode">
        <div className="au-bp-header">
          <div className="au-bp-icon"><IconBP size={28} /></div>
          <div>
            <div className="au-bp-title">Mode Business Plan — {course.title}</div>
            <div className="au-bp-sub">{doneSteps}/{BP_STEPS.length} sections complétées</div>
          </div>
        </div>
        {/* Progress */}
        <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden', marginBottom:24 }}>
          <div style={{ height:'100%', width:`${(doneSteps/BP_STEPS.length)*100}%`, background:'linear-gradient(90deg,#F0B429,#E8A820)', transition:'width 0.5s' }} />
        </div>
        {/* Steps nav */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:24 }}>
          {BP_STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setActiveStep(i)}
              style={{ padding:'6px 14px', borderRadius:100, border:`1.5px solid ${i === activeStep ? 'rgba(240,180,41,0.6)' : bpData[s.id]?.trim() ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, background: i === activeStep ? 'rgba(240,180,41,0.1)' : bpData[s.id]?.trim() ? 'rgba(16,185,129,0.06)' : 'transparent', color: i === activeStep ? '#F0B429' : bpData[s.id]?.trim() ? '#6EE7B7' : 'rgba(240,244,255,0.5)', fontSize:'0.75rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
              {bpData[s.id]?.trim() ? <IconCheck size={10} /> : (i + 1)} {s.label}
            </button>
          ))}
        </div>
        {/* Active step */}
        {BP_STEPS[activeStep] && (
          <BPStep
            step={BP_STEPS[activeStep]}
            value={bpData[BP_STEPS[activeStep].id] || ''}
            onSave={val => onSave(BP_STEPS[activeStep].id, val)}
            onNext={() => setActiveStep(i => Math.min(i + 1, BP_STEPS.length - 1))}
            isLast={activeStep === BP_STEPS.length - 1}
            doneAll={doneSteps === BP_STEPS.length}
          />
        )}
      </div>
    </div>
  )
}

function BPStep({ step, value, onSave, onNext, isLast, doneAll }) {
  const [text, setText] = useState(value)
  const [saved, setSaved] = useState(false)
  function handleSave() {
    onSave(text)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (!isLast) onNext()
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:1.5, color:'rgba(240,180,41,0.8)', textTransform:'uppercase', marginBottom:4 }}>Section {step.label}</div>
      <div style={{ fontSize:'0.88rem', color:'rgba(240,244,255,0.65)', lineHeight:1.6, marginBottom:8 }}>
        <strong style={{ color:'rgba(240,244,255,0.85)' }}>Invitation :</strong> {step.prompt}
      </div>
      <textarea className="au-bp-textarea" rows={8} value={text} onChange={e => setText(e.target.value)} placeholder={`Rédigez la section "${step.label}" de votre business plan...`} />
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <button className="au-bp-save-btn" onClick={handleSave} style={{ display:'flex', alignItems:'center', gap:7 }}>
          {saved ? <><IconCheck size={14} /> Sauvegardé !</> : isLast ? <><IconDownload size={14} /> Finaliser le Business Plan</> : <><IconDownload size={14} /> Sauvegarder et continuer</>}
        </button>
        {text.length > 0 && <span style={{ fontSize:'0.72rem', color:'rgba(240,244,255,0.35)' }}>{text.length} caractères</span>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CERTIFICATE
// ═══════════════════════════════════════════════════════════════════════════════
function CertificateView({ course, onClose }) {
  return (
    <div style={{ maxWidth:700, margin:'0 auto', width:'100%' }}>
      <div className="au-certificate">
        <div className="au-certificate-logo" style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
          <ArkelUpLogo size={120} />
        </div>
        <div className="au-certificate-title">Certificat de Complétion</div>
        <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.45)', marginBottom:24 }}>Décerné avec honneur à</div>
        <div className="au-certificate-name">Votre Nom</div>
        <div className="au-certificate-course">pour avoir complété avec succès</div>
        <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#fff', margin:'8px 0 24px', lineHeight:1.3 }}>{course.title}</div>
        <div style={{ display:'flex', gap:32, justifyContent:'center', marginBottom:28, flexWrap:'wrap' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', letterSpacing:1.5, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:4 }}>Durée</div>
            <div style={{ fontWeight:800, color:'#fff' }}>{course.duration}h</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', letterSpacing:1.5, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:4 }}>Catégorie</div>
            <div style={{ fontWeight:800, color:'#fff' }}>{course.category}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.65rem', letterSpacing:1.5, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:4 }}>Date</div>
            <div style={{ fontWeight:800, color:'#fff' }}>{new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        <div className="au-certificate-badge" style={{ display:'inline-flex', alignItems:'center', gap:7 }}><IconCertificate size={16} /> Certification Arkel Up Center</div>
        <div style={{ marginTop:28, display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => window.print()} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid rgba(240,180,41,0.4)', background:'rgba(240,180,41,0.1)', color:'#F0B429', cursor:'pointer', fontWeight:800, fontSize:'0.82rem', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 }}>
            <IconPrint size={16} /> Imprimer / PDF
          </button>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(240,244,255,0.6)', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', fontFamily:'inherit' }}>
            Retour au cours
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF PANEL — Supports du cours
// ═══════════════════════════════════════════════════════════════════════════════
function PDFPanel({ pdfs, isAdmin, onPreview, onRefresh }) {
  if (pdfs.length === 0) {
    return (
      <div style={{ maxWidth:700, margin:'0 auto', width:'100%', padding:'60px 20px', textAlign:'center' }}>
        <div style={{ marginBottom:16, opacity:0.3 }}><IconPDF size={48} color="#F0B429" /></div>
        <div style={{ fontSize:'1.05rem', fontWeight:800, color:'rgba(240,244,255,0.5)', marginBottom:8 }}>Aucun support disponible</div>
        <div style={{ fontSize:'0.84rem', color:'rgba(240,244,255,0.3)', lineHeight:1.6 }}>
          {isAdmin
            ? 'Utilisez le bouton "Supports PDF" dans le catalogue pour uploader des supports pour ce cours.'
            : 'L\'administrateur n\'a pas encore partagé de supports pour ce cours. Revenez plus tard.'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth:760, margin:'0 auto', width:'100%' }}>
      {/* Header */}
      <div className="au-lesson-header" style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ padding:'4px 12px', borderRadius:100, background:'rgba(240,180,41,0.15)', border:'1px solid rgba(240,180,41,0.3)', fontSize:'0.72rem', fontWeight:800, color:'#F0B429', display:'flex', alignItems:'center', gap:6 }}>
            <IconPDF size={12} /> Supports du cours
          </span>
          {isAdmin && (
            <span style={{ padding:'4px 12px', borderRadius:100, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', fontSize:'0.68rem', fontWeight:800, color:'#EF4444', display:'flex', alignItems:'center', gap:5 }}>
              <IconShield size={11} /> Vue Admin
            </span>
          )}
        </div>
        <h1 className="au-lesson-title">Supports PDF</h1>
      </div>

      {/* Access legend for admin */}
      {isAdmin && (
        <div style={{ padding:'12px 16px', borderRadius:12, background:'rgba(240,180,41,0.06)', border:'1px solid rgba(240,180,41,0.15)', marginBottom:20, display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontSize:'0.72rem', color:'rgba(240,244,255,0.5)', fontWeight:600 }}>Niveaux d'accès :</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem' }}>
            <span style={{ color:'#EF4444', display:'flex' }}><IconShield size={12} /></span>
            <span style={{ color:'rgba(240,244,255,0.5)' }}>Admin seulement</span>
            <span style={{ fontWeight:800, color:'#EF4444' }}>{pdfs.filter(p => p.accessLevel === 'admin').length}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem' }}>
            <span style={{ color:'#10B981', display:'flex' }}><IconUnlock size={12} /></span>
            <span style={{ color:'rgba(240,244,255,0.5)' }}>Inscrits approuvés</span>
            <span style={{ fontWeight:800, color:'#10B981' }}>{pdfs.filter(p => p.accessLevel === 'enrolled').length}</span>
          </div>
        </div>
      )}

      {/* PDF grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
        {pdfs.map(pdf => {
          const isAdminOnly = pdf.accessLevel === 'admin'
          return (
            <div key={pdf.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 20px', transition:'all 0.2s', cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(240,180,41,0.06)'; e.currentTarget.style.borderColor='rgba(240,180,41,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
              onClick={() => onPreview(pdf)}>

              {/* Icon + access badge */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div style={{ width:44, height:44, borderRadius:11, background:'rgba(240,180,41,0.12)', border:'1px solid rgba(240,180,41,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#F0B429' }}>
                  <IconPDF size={22} />
                </div>
                {isAdmin && (
                  <span style={{ padding:'3px 8px', borderRadius:100, fontSize:'0.63rem', fontWeight:700, background: isAdminOnly ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: isAdminOnly ? '#EF4444' : '#10B981', border:`1px solid ${isAdminOnly ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, display:'flex', alignItems:'center', gap:4 }}>
                    {isAdminOnly ? <><IconShield size={10} />Admin</> : <><IconUnlock size={10} />Inscrits</>}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:'0.9rem', color:'rgba(240,244,255,0.9)', marginBottom:5, lineHeight:1.3 }}>{pdf.title}</div>
                {pdf.description && (
                  <div style={{ fontSize:'0.77rem', color:'rgba(240,244,255,0.45)', lineHeight:1.5 }}>{pdf.description}</div>
                )}
              </div>

              {/* Meta */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
                <div style={{ display:'flex', gap:10 }}>
                  <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.3)', fontWeight:600 }}>{pdf.fileName}</span>
                  <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.25)' }}>·</span>
                  <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.3)', fontWeight:600 }}>{formatFileSize(pdf.fileSize)}</span>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={e => { e.stopPropagation(); onPreview(pdf) }}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.5)', cursor:'pointer', fontSize:'0.7rem', fontWeight:600, fontFamily:'inherit' }}>
                    <IconEye size={11} /> Lire
                  </button>
                  <a href={pdf.fileData} download={pdf.fileName} onClick={e => e.stopPropagation()}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, background:'rgba(240,180,41,0.1)', border:'1px solid rgba(240,180,41,0.25)', color:'#F0B429', fontSize:'0.7rem', fontWeight:700, textDecoration:'none' }}>
                    <IconDownload size={11} />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Upload hint for admin */}
      {isAdmin && (
        <div style={{ marginTop:24, padding:'14px 18px', borderRadius:12, background:'rgba(240,180,41,0.05)', border:'1px dashed rgba(240,180,41,0.2)', textAlign:'center' }}>
          <div style={{ fontSize:'0.78rem', color:'rgba(240,180,41,0.6)', fontWeight:600 }}>
            Pour ajouter ou modifier les supports, utilisez le panneau <strong style={{ color:'#F0B429' }}>Supports PDF</strong> depuis le catalogue de cours.
          </div>
        </div>
      )}
    </div>
  )
}
