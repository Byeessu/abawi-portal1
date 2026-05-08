import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../lib/permissions';
import { exportToPDF } from '../../lib/generatePDF';
import { extractFilesText } from '../../lib/fileExtract';
import { useBackgroundJob } from '../../hooks/useBackgroundJob';
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';

import { callGroq as groqCall } from '../../lib/groqClient'
import React from 'react'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'

const ACCENT = 'var(--accent)'
const GOLD = 'var(--accent)'
const GREEN = 'var(--accent2)'
const RED = 'var(--red)'

// Appel via le client qui passe par le proxy Netlify (sécurité) avec fallback direct
async function groqJSON(prompt, maxTokens = 8000) {
  return await groqCall(
    [
      { role: 'system', content: "Tu es Associé Senior (Partner) dans un cabinet de conseil stratégique tier-1 (McKinsey / BCG / Bain niveau Afrique). Tu élabores des business plans EXHAUSTIFS, CHIFFRÉS, ULTRA-DÉTAILLÉS, niveau dossier d'investissement Series A/B. Standards : profondeur analytique maximale, hypothèses explicites, benchmarks sectoriels, projections justifiées, narration convaincante. Tu rédiges en français, écrits riches et professionnels. CRITIQUE : chaque champ texte doit être DÉVELOPPÉ (jamais une phrase courte sauf labels), chaque liste doit contenir AU MOINS 5 éléments substantiels, chaque tableau doit avoir AU MOINS 4-6 lignes. Tu réponds UNIQUEMENT avec du JSON valide, sans markdown, sans préambule, sans explication externe." },
      { role: 'user', content: prompt },
    ],
    { maxTokens, temperature: 0.2, jsonMode: true }
  )
}

function safeJSON(text, fallback) {
  try {
    const m = String(text || '').match(/(\[[\s\S]*\]|\{[\s\S]*\})/s)
    return m ? JSON.parse(m[0]) : JSON.parse(text)
  } catch { return fallback }
}

// Élite Sections Definitions
const SECTIONS = [
  { id: 'executive', label: 'Résumé Exécutif', icon: '📋', color: ACCENT },
  { id: 'company', label: 'Entreprise', icon: '🏢', color: 'var(--accent3)' },
  { id: 'market', label: 'Marché', icon: '📊', color: GOLD },
  { id: 'value', label: 'Proposition de Valeur', icon: '💎', color: 'var(--accent3)' },
  { id: 'model', label: 'Modèle Économique', icon: '💼', color: GREEN },
  { id: 'gtm', label: 'Plan Commercial', icon: '🚀', color: GREEN },
  { id: 'operations', label: 'Opérations', icon: '⚙️', color: 'var(--accent)' },
  { id: 'financial', label: 'Plan Financier', icon: '💰', color: 'var(--accent2)' },
  { id: 'risks', label: 'Risques', icon: '⚠️', color: RED },
  { id: 'slides', label: 'Slides', icon: '🎨', color: 'var(--accent3)' },
]

const defaults = {}

// Élite Prompt Builders
function ctx(form, src) {
  return `CONTEXTE ENTREPRISE:
- Nom: ${form.nom || '(non fourni, générer un exemple réaliste)'}
- Secteur: ${form.secteur || '(non fourni)'}
- Pays/Région: ${form.pays || "Afrique de l'Ouest / Sénégal"}
- Mission: ${form.mission || '(non fournie)'}
- Effectif cible: ${form.effectif || '(non fourni)'}
- Stade: ${form.stade || 'Startup'}
- Produit/Service: ${form.produit || '(non fourni)'}
- Cible client: ${form.cible || '(non fournie)'}
- CA N-2/N-1/N (FCFA): ${form.ca1||0} / ${form.ca2||0} / ${form.ca3||0}
- Charges N-2/N-1/N: ${form.ch1||0} / ${form.ch2||0} / ${form.ch3||0}
- Investissement besoin: ${form.investissement || '(non fourni)'}
- Horizon: ${form.horizon || '3 ans'}

DOCUMENTS SOURCES FOURNIS:
${src ? src.slice(0, 12000) : '(Aucun document fourni — générer avec hypothèses stratégiques réalistes et les marquer explicitement)'}

INSTRUCTION CRITIQUE: Si des données manquent, les estimer avec des hypothèses explicites basées sur des benchmarks sectoriels. Suggérer les améliorations possibles dans le champ "ameliorations" de chaque section.`
}

function promptExecutive(form, src) {
  return `${ctx(form, src)}

Genere le RESUME EXECUTIF d un business plan elite tier-1, ultra-detaille, niveau dossier investisseur Series A. JSON strict (chaque champ texte = paragraphe riche de 4-8 phrases minimum, listes = au moins 6 elements developpes):
{
  "pitch": "pitch executif puissant en 4-6 phrases : qui, quoi, pour qui, pourquoi maintenant, traction, impact economique attendu",
  "vision": "vision a 5-10 ans inspirante et concrete, 4-6 phrases avec horizon, ambition geographique, impact societal",
  "mission": "mission operationnelle 3-5 phrases : raison d etre, beneficiaires, methode",
  "opportunity": "opportunite de marche avec TAM/SAM/SOM chiffres en FCFA, dynamique de croissance, fenetre temporelle, drivers macroeconomiques (5-8 phrases)",
  "problem": "probleme identifie chiffre, douleur client mesuree (cout du probleme), cas concrets (4-6 phrases)",
  "solution": "solution et avantage concurrentiel : technologie, modele, distribution, IP. Pourquoi cette solution gagne (5-8 phrases)",
  "business_model": "comment on gagne de l argent : sources de revenus principales et secondaires, prix, structure d unit economics CAC/LTV/Payback (4-6 phrases)",
  "traction": "traction actuelle ou potentielle chiffree : MVP, premiers clients, pipeline, partenariats, recompenses, signaux marche (5-8 phrases ou bullet detaille)",
  "team_summary": "synthese des forces de l equipe : profils cles, experience cumulee, reseau, complementarite (4-6 phrases)",
  "ask": "demande precise : montant en FCFA et EUR, type (equity/dette/grant), valorisation pre-money proposee, dilution, usage des fonds par poste avec %",
  "use_of_funds": [{"poste":"R&D produit","pct":35,"montant":"X FCFA","justification":"explication detaillee"}],
  "kpis_cibles": [{"label":"KPI","valeur":"cible","delai":"horizon","benchmark":"reference sectorielle"}],
  "milestones_18mois": [{"horizon":"M+3","jalon":"jalon precis","kpi_associe":"metrique"}],
  "faits_marquants": ["fait 1 substantiel et chiffre","fait 2","fait 3","fait 4","fait 5","fait 6","fait 7"],
  "valeurs_uniques": ["differenciateur 1 explicite","differenciateur 2","differenciateur 3","differenciateur 4","differenciateur 5"],
  "stakeholders_cles": [{"acteur":"nom","role":"impact","statut":"engage|interesse|cible"}],
  "narratif_investisseur": "section narration : pourquoi investir MAINTENANT dans cette equipe pour ce marche, en 6-10 phrases",
  "ameliorations": ["suggestion 1 actionable","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptCompany(form, src) {
  return `${ctx(form, src)}

Genere la section PRESENTATION DE L ENTREPRISE niveau due-diligence cabinet conseil. JSON strict (paragraphes detailles 4-8 phrases, listes 5-8 elements):
{
  "historique": "historique et genese du projet : declic fondateur, date de demarrage, etapes franchies, pivots, apprentissages cles (6-10 phrases)",
  "mission": "mission claire en 3-5 phrases avec verbe d action, beneficiaires, perimetre",
  "vision": "vision a 5-10 ans : ou veut arriver l entreprise, taille, geographie, impact (4-6 phrases)",
  "valeurs": [{"valeur":"nom valeur","description":"explication operationnelle de comment cette valeur se traduit en decisions et comportements (3-5 phrases)"}],
  "raison_etre": "raison d etre societale et economique de l entreprise (4-6 phrases)",
  "structure_juridique": {
    "forme_recommandee": "SARL/SA/SAS/etc avec justification 3-5 phrases",
    "siege_social": "ville, pays",
    "capital_recommande": "capital initial avec justification",
    "actionnariat_cible": [{"actionnaire":"nom/categorie","pct":40,"role":"role"}],
    "gouvernance": "organes de gouvernance : CA, comites, frequence, pouvoirs (4-6 phrases)"
  },
  "equipe_cle": [{"poste":"titre","role":"role cle 3-5 phrases","profil":"profil ideal","experience_requise":"X annees","reference_marche":"benchmark salaire FCFA"}],
  "organigramme_cible": [{"niveau":"Direction|Manager|Operationnel","postes":["poste 1","poste 2"],"effectif":3}],
  "avantages_competitifs": [{"avantage":"nom","description":"explication detaillee 3-5 phrases","durabilite":"haute|moyenne|faible","preuves":"preuves tangibles"}],
  "propriete_intellectuelle": {
    "brevets": ["brevet ou potentiel"],
    "marques": ["marque deposee"],
    "secrets": ["secret de fabrication"],
    "licences": ["licence detenue"],
    "strategie_ip": "strategie de protection IP en 4-6 phrases"
  },
  "implantation": {
    "siege": "lieu et superficie",
    "antennes": ["liste villes secondaires"],
    "logique_geographique": "explication 3-5 phrases"
  },
  "rse_impact": "engagement RSE : environnement, social, gouvernance, impact mesurable (5-8 phrases)",
  "certifications_cibles": ["ISO9001","ISO27001","etc"],
  "ameliorations": ["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptMarket(form, src) {
  return `${ctx(form, src)}

Genere une ANALYSE DE MARCHE EXHAUSTIVE de niveau cabinet stratego tier-1 avec PESTEL, Porter 5 forces, segmentation, concurrence detaillee, tendances macro et micro. JSON strict (paragraphes 4-8 phrases, listes 5-8 elements minimum):
{
  "taille_marche": {
    "tam": "Total Addressable Market en FCFA et EUR avec chiffre absolu et methode de calcul (4-6 phrases)",
    "sam": "Serviceable Addressable Market avec restriction geographique/segment justifiee (4-6 phrases)",
    "som": "Serviceable Obtainable Market - cible realiste a 3 ans avec part de marche cible % (4-6 phrases)",
    "tcam": "taux de croissance annuel moyen attendu en %, sources",
    "source": "base de calcul et hypotheses : sources statistiques (BCEAO, ANSD, INS, McKinsey Africa, World Bank), methodologie top-down ET bottom-up"
  },
  "pestel": {
    "politique": "facteurs politiques (stabilite, politiques publiques) 3-5 phrases",
    "economique": "facteurs economiques (PIB, inflation, taux change FCFA) 3-5 phrases",
    "sociaux": "facteurs sociaux (demographie, urbanisation, classe moyenne) 3-5 phrases",
    "technologique": "facteurs technologiques (mobile money, internet, IA) 3-5 phrases",
    "ecologique": "facteurs environnementaux 3-5 phrases",
    "legal": "cadre legal et regulation OHADA, sectoriel 3-5 phrases"
  },
  "porter_5_forces": {
    "concurrence_directe": {"intensite":"haute|moyenne|faible","analyse":"analyse 3-5 phrases"},
    "nouveaux_entrants": {"intensite":"haute|moyenne|faible","analyse":"3-5 phrases"},
    "produits_substitution": {"intensite":"haute|moyenne|faible","analyse":"3-5 phrases"},
    "pouvoir_clients": {"intensite":"haute|moyenne|faible","analyse":"3-5 phrases"},
    "pouvoir_fournisseurs": {"intensite":"haute|moyenne|faible","analyse":"3-5 phrases"},
    "synthese": "synthese des 5 forces et attractivite globale du marche (4-6 phrases)"
  },
  "tendances": [{"tendance":"nom precis","impact":"fort|moyen|faible","horizon":"court|moyen|long terme","description":"explication detaillee 4-6 phrases avec donnees","opportunite":"opportunite associee 3-5 phrases","menace":"menace associee si applicable"}],
  "segments": [{"nom":"segment precis","taille_pct":20,"taille_absolue":"X clients ou X FCFA","caracteristiques":"description detaillee 4-6 phrases","besoins":"besoins specifiques 3-5 phrases","comportements":"comportements achat","capacite_payer":"FCFA min/mois","accessibilite":"facile|moyen|difficile","priorite":"primaire|secondaire|tertiaire"}],
  "personas": [{"nom":"Persona 1","age":"30-45","metier":"profession","budget":"FCFA","frustrations":["f1","f2"],"objectifs":["o1","o2"],"canaux_preferes":["c1","c2"]}],
  "concurrents": [{"nom":"concurrent","type":"direct|indirect|substitut","part_marche":"%","ca_estime":"FCFA","effectifs":"X","forces":["f1","f2","f3"],"faiblesses":["f1","f2","f3"],"prix":"positionnement prix detaille","positionnement":"positioning statement","leve_de_fonds":"historique financement","strategie_recente":"actions strategiques 12 derniers mois"}],
  "matrice_concurrentielle": [{"critere":"prix","nous":"score 1-5","concurrent_a":"score","concurrent_b":"score"}],
  "positionnement": "ou se positionne l entreprise vs concurrence : axes prix/qualite, USP, differenciation (5-8 phrases)",
  "blue_ocean_potential": "potentiel d ocean bleu : nouveaux espaces non disputes (3-5 phrases)",
  "barrieres_entree": [{"barriere":"nom","hauteur":"haute|moyenne|basse","description":"explication 3-5 phrases","strategie_franchissement":"comment notre projet la franchit"}],
  "reglementation": "cadre reglementaire cle : licences requises, autorites de tutelle, normes, OHADA, fiscalite specifique sectorielle (6-10 phrases)",
  "saisonnalite": "saisonnalite du marche en %/mois si applicable, evenements cles",
  "geographie_priorisee": [{"zone":"Dakar","priorite":1,"potentiel":"FCFA","timing":"phase 1"}],
  "sources_donnees": ["BCEAO","ANSD","Reports sectoriels"],
  "ameliorations": ["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptValue(form, src) {
  return `${ctx(form, src)}

Genere la PROPOSITION DE VALEUR niveau Value Proposition Canvas + Lean Canvas + Jobs-To-Be-Done. JSON strict (paragraphes 4-7 phrases, listes 5-8 elements):
{
  "probleme": "probleme cible avec chiffres : taille du probleme en FCFA, frequence, severite, status quo douloureux (5-8 phrases)",
  "douleurs_clients": ["douleur 1 detaillee","douleur 2","douleur 3","douleur 4","douleur 5"],
  "gains_clients": ["gain attendu 1","gain 2","gain 3","gain 4","gain 5"],
  "solution": "solution innovante : description complete du produit/service, pourquoi elle resout le probleme, technologie sous-jacente (6-10 phrases)",
  "value_proposition_statement": "phrase canonique : Pour [cible] qui [besoin], notre [produit] est [categorie] qui [benefice cle], contrairement a [alternative], nous [differenciation]",
  "avantages": [{"avantage":"nom","description":"explication detaillee 3-5 phrases","preuve":"preuve tangible","quantification":"X% / X FCFA"}],
  "proposition_unique": "Unique Selling Proposition en 5-8 phrases : ce que nous sommes les SEULS a offrir et pourquoi cela compte",
  "differentiation_axes": [{"axe":"prix|qualite|service|innovation|distribution","positionnement":"explication"}],
  "moat": "douve concurrentielle : effets reseau, switching costs, marque, IP, donnees, scale (5-8 phrases)",
  "validation_marche": "preuves validation marche : tests, MVP, lettres d intention, pilotes, NPS, taux de conversion observes (5-8 phrases ou liste)",
  "early_adopters": "profil precis des early adopters et pourquoi ils achetent en premier (3-5 phrases)",
  "scalabilite": "potentiel scalabilite : leverage technologique, multiplication geographique, modele plateforme, marges scaling (5-8 phrases)",
  "use_cases": [{"cas":"cas d usage","description":"description 3-5 phrases","impact_client":"benefice mesure"}],
  "preuve_concept": "MVP/POC realise ou roadmap pour le faire, kpi de validation cibles",
  "ameliorations": ["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptModel(form, src) {
  return `${ctx(form, src)}

Genere le MODELE ECONOMIQUE complet (Business Model Canvas + Unit Economics + Pricing Strategy). JSON strict (paragraphes 3-6 phrases, listes 5-8 elements):
{
  "business_model_type": "type de modele : marketplace, SaaS, subscription, transactional, freemium, B2B, B2C, B2B2C, etc., justification 3-5 phrases",
  "revenus": [{"source":"source precise","modele":"abonnement|vente unitaire|freemium|commission|licence|publicite|services","prix":"prix detaille FCFA","cible":"cible","frequence":"mensuel|annuel|ponctuel","poids_pct":40,"justification":"3-5 phrases"}],
  "structure_prix": {
    "strategie":"penetration|skimming|valeur|competitive",
    "tarification":[{"tier":"Basic|Pro|Enterprise","prix":"FCFA","fonctionnalites":["f1","f2"],"cible":"qui"}],
    "elasticite":"sensibilite prix estimee",
    "promotions":"strategie promo 3-5 phrases"
  },
  "couts": [{"type":"fixe|variable|semi-fixe","categorie":"personnel|tech|marketing|operations|locaux|admin","description":"description detaillee","montant_estime":"FCFA/mois ou %","scaling":"comment ce cout evolue avec la croissance"}],
  "couts_initiaux": [{"poste":"poste","montant":"FCFA","periode":"M1-M3"}],
  "marges": {
    "brute":"% avec calcul",
    "operationnelle":"%",
    "nette":"%",
    "evolution_3ans":"trajectoire cible An1->An2->An3"
  },
  "unit_economics": {
    "cac":"Cout Acquisition Client en FCFA detaille",
    "ltv":"Lifetime Value en FCFA detaille",
    "ratio_ltv_cac":"X (cible >3)",
    "payback_period":"mois pour rentabiliser un client",
    "churn_mensuel":"% attendu",
    "arpu":"Average Revenue Per User en FCFA",
    "gross_margin_unit":"marge brute par unite"
  },
  "leviers_croissance": [{"levier":"nom","description":"explication 3-5 phrases","impact_estime":"% sur CA","cout_activation":"FCFA","horizon":"M+X"}],
  "metrics": [{"metric":"CAC|LTV|MRR|ARR|Churn|NPS","valeur":"valeur cible","frequence_suivi":"hebdo|mensuel"}],
  "modele_revenus_recurrent_pct":"% de revenus recurrents vs ponctuels",
  "saisonnalite_revenus":"profil saisonnier en %",
  "monetisation_secondaire":["data","publicite","cross-sell","upsell"],
  "scenarios_pricing":[{"nom":"baseline|aggressive|premium","cas_4P":"description","impact_ca":"%"}],
  "ameliorations":["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptGTM(form, src) {
  return `${ctx(form, src)}

Genere le PLAN COMMERCIAL & GO-TO-MARKET complet (acquisition, activation, retention, ventes, marketing, branding). JSON strict (listes 5-8 elements, paragraphes 3-6 phrases):
{
  "phase_lancement": {
    "geographie":"zone pilote precise",
    "duree":"X mois",
    "objectif_clients":"X clients",
    "budget":"FCFA",
    "kpi_succes":"criteres de validation pour passer a la phase suivante (4-6 phrases)"
  },
  "strategie_acquisition": "strategie globale d acquisition multi-canaux en 6-10 phrases",
  "canaux": [{"canal":"nom precis (Meta Ads, Google Ads, sales direct, partenariats banques, agents terrain, influenceurs, SEO, etc.)","priorite":"haute|moyenne|basse","investissement":"FCFA/mois","cac_attendu":"FCFA","volume_cible":"clients/mois","roi_estime":"X","horizon":"M1-M6","tactique":"tactique detaillee 3-5 phrases"}],
  "funnel_conversion": [{"etape":"Awareness|Acquisition|Activation|Retention|Revenue|Referral","kpi":"metric","cible":"%","tactique":"levier"}],
  "strategie_prix": {
    "positionnement":"premium|mid-market|low-cost|valeur",
    "structure":"detail des paliers tarifaires",
    "psychologique":"ancrages, prix charme, decoy effect (3-5 phrases)",
    "remises":"politique de remises et conditions",
    "test_pricing":"approche de test A/B prix"
  },
  "cycle_vente": {
    "duree":"duree moyenne",
    "etapes":["Prospection","Qualification","Decouverte","Demo","Proposition","Negociation","Closing"],
    "taux_conversion_par_etape":[{"etape":"Demo","taux":"40%"}],
    "outils_sales":["CRM","sequencer","prospecting"]
  },
  "equipe_commerciale": [{"role":"SDR/AE/CSM/etc","effectif_an1":1,"effectif_an2":3,"effectif_an3":6,"cibles":"quota mensuel FCFA","remuneration":"fixe + variable %"}],
  "marketing_mix_4P": {
    "produit":"strategie produit 3-5 phrases",
    "prix":"strategie prix 3-5 phrases",
    "place_distribution":"canaux distribution 3-5 phrases",
    "promotion":"strategie promotion/comm 3-5 phrases"
  },
  "branding_communication": "strategie de marque, ton de voix, identite visuelle, RP, contenu (5-8 phrases)",
  "calendrier_marketing": [{"mois":"M+1","action":"campagne","budget":"FCFA","kpi":"objectif"}],
  "partenariats_strategiques": [{"partenaire":"type","valeur":"apport","conditions":"deal","timing":"M+X"}],
  "objectifs": [{"annee":"Annee 1","ca":"FCFA","clients":"X","panier_moyen":"FCFA","croissance_pct":"%","commentaire":"contexte"}],
  "kpis_commerciaux": [{"kpi":"nom","cible_an1":"X","cible_an3":"Y","frequence":"hebdo"}],
  "fidelisation_strategie": "programme de retention, NPS cible, upsell/cross-sell, referral (5-8 phrases)",
  "ameliorations":["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptOperations(form, src) {
  return `${ctx(form, src)}

Genere le PLAN OPERATIONS detaille (chaine de valeur, supply chain, IT, qualite, RH, scalabilite). JSON strict (paragraphes 3-6 phrases, listes 5-8 elements):
{
  "chaine_valeur": "description de la chaine de valeur Porter en 6-10 phrases avec activites principales et soutien",
  "processus_cles": [{"processus":"nom (Production, Livraison, Onboarding, SAV, etc.)","description":"description detaillee 4-6 phrases","kpi":"KPI suivi","sla":"engagement de service","outils":["outil1","outil2"],"responsable":"role"}],
  "technologie": [{"outil":"outil","categorie":"CRM|ERP|tech produit|comm","usage":"usage detaille","impact":"impact business","cout":"FCFA/mois","alternatives":"options"}],
  "stack_technique": "stack technologique detaille (langages, frameworks, cloud, data) en 4-6 phrases",
  "infrastructure": {"hebergement":"AWS|GCP|on-prem","disponibilite":"99.X%","plan_continuite":"DRP en 3-5 phrases"},
  "partenaires": [{"nom":"partenaire","type":"fournisseur|distributeur|techno|institutionnel","criticite":"haute|moyenne|basse","contribution":"apport","alternatives":"options de remplacement","contractualisation":"type de contrat"}],
  "supply_chain": "description supply chain : approvisionnement, production, stockage, distribution, retours (5-8 phrases)",
  "qualite": {
    "normes":["ISO9001","ISO27001","autres"],
    "indicateurs":[{"kpi":"taux defaut","cible":"%"}],
    "process_qualite":"process qualite 3-5 phrases",
    "audit":"frequence et type d audit"
  },
  "rh_operations": {
    "effectif_cible":[{"annee":"An1","total":10,"detail":[{"role":"Dev","nb":3}]}],
    "recrutement_plan":"plan de recrutement 3-5 phrases",
    "formation":"plan de formation continue",
    "culture":"culture d entreprise et engagement"
  },
  "service_client": {
    "canaux":["chat","email","whatsapp","tel"],
    "horaires":"24/7 ou 8h-20h",
    "sla":"temps de premier reponse, resolution",
    "kpis":["NPS","CSAT","FRT","resolution_first_contact"]
  },
  "scalabilite": {
    "capacite_actuelle":"capacite actuelle de servir X clients/transactions",
    "projections":"capacite cible An3 et leviers",
    "goulots_etranglement":["goulot 1","goulot 2"],
    "investissements_capacite":[{"poste":"infra","montant":"FCFA","timing":"M+X"}]
  },
  "compliance_securite":"compliance reglementaire, securite donnees, RGPD/local data law (5-8 phrases)",
  "kpi_operations":[{"kpi":"OEE|productivite|qualite|securite","cible":"valeur","frequence":"suivi"}],
  "ameliorations":["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptFinancial(form, src) {
  return `${ctx(form, src)}

Genere le PLAN FINANCIER ULTRA-DETAILLE niveau dossier banque/investisseur (3 ans, mensuel pour An1 si possible, scenarios, valorisation). JSON strict, montants en FCFA. Listes 5-8 elements:
{
  "hypotheses_macro":{
    "inflation":"% an","change_eur_xof":"valeur","taux_emprunt":"%","tcam_secteur":"%","note":"sources et contexte 3-5 phrases"
  },
  "hypothese": {
    "croissance_ca":"% YoY An1->An3 avec courbe (J/S)","marge_brute":"%","marge_nette":"%","delai_paiement_clients":"jours","delai_paiement_fournisseurs":"jours","stock_jours":"jours","capex_pct_ca":"%","note":"justification 3-5 phrases"
  },
  "projections": {
    "annee1":{"ca":"FCFA","ca_repartition":[{"source":"S1","montant":"FCFA","pct":40}],"cogs":"FCFA","marge_brute":"FCFA et %","opex":"FCFA","opex_detail":[{"poste":"personnel","montant":"FCFA"}],"ebitda":"FCFA et %","amortissements":"FCFA","ebit":"FCFA","resultat_financier":"FCFA","impots":"FCFA","resultat_net":"FCFA et %"},
    "annee2":{"ca":"FCFA","cogs":"FCFA","marge_brute":"FCFA et %","opex":"FCFA","ebitda":"FCFA et %","ebit":"FCFA","resultat_net":"FCFA et %"},
    "annee3":{"ca":"FCFA","cogs":"FCFA","marge_brute":"FCFA et %","opex":"FCFA","ebitda":"FCFA et %","ebit":"FCFA","resultat_net":"FCFA et %"}
  },
  "projections_mensuelles_an1":[{"mois":"M1","ca":"FCFA","clients":"X","cash_in":"FCFA","cash_out":"FCFA","cash_position":"FCFA"}],
  "bilan_previsionnel":{
    "annee1":{"actif_immobilise":"FCFA","actif_circulant":"FCFA","tresorerie":"FCFA","capitaux_propres":"FCFA","dettes_long_terme":"FCFA","dettes_court_terme":"FCFA","total":"FCFA"},
    "annee2":{"actif_immobilise":"FCFA","actif_circulant":"FCFA","tresorerie":"FCFA","capitaux_propres":"FCFA","dettes":"FCFA"},
    "annee3":{"actif_immobilise":"FCFA","actif_circulant":"FCFA","tresorerie":"FCFA","capitaux_propres":"FCFA","dettes":"FCFA"}
  },
  "besoin_financement": {
    "montant":"FCFA et EUR equivalent",
    "usage":"description detaillee 5-8 phrases",
    "repartition_usage":[{"poste":"R&D","pct":35,"montant":"FCFA","detail":"justification"}],
    "structure":"equity/dette/grant/mezzanine",
    "valorisation_pre_money":"FCFA",
    "dilution":"%",
    "calendrier_versement":[{"tranche":"Tranche 1","montant":"FCFA","conditions":"milestones"}]
  },
  "flux_tresorerie": {"annee1":"FCFA (operationnel + investissement + financement)","annee2":"FCFA","annee3":"FCFA","point_mort_mois":"M+X","cash_burn_mensuel":"FCFA","runway_mois":"X"},
  "scenarios":[
    {"nom":"Pessimiste","ca_an3":"FCFA","ebitda_an3":"FCFA","commentaire":"hypothese 3-5 phrases"},
    {"nom":"Realiste","ca_an3":"FCFA","ebitda_an3":"FCFA","commentaire":"hypothese 3-5 phrases"},
    {"nom":"Optimiste","ca_an3":"FCFA","ebitda_an3":"FCFA","commentaire":"hypothese 3-5 phrases"}
  ],
  "valorisation":{"methode":"DCF + multiples comparables","multiples_secteur":"X CA / Y EBITDA","valorisation_post_money_an3":"FCFA","tri_attendu":"%","multiple_de_sortie":"X"},
  "sortie_strategie":"strategie de sortie pour investisseurs : IPO, M&A, secondary (4-6 phrases)",
  "ratios": [{"ratio":"Marge brute|Marge EBITDA|ROE|ROA|Ratio dette/EBITDA|Current ratio|Quick ratio","valeur":"% ou valeur","benchmark":"benchmark sectoriel","commentaire":"interpretation 2-3 phrases"}],
  "indicateurs_investisseur":{"tri_5ans":"%","cash_on_cash":"X","payback_periode":"X annees"},
  "sensibilite":[{"variable":"prix moyen","variation":"-10%","impact_ebitda":"-X%"}],
  "ameliorations":["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptRisks(form, src) {
  return `${ctx(form, src)}

Genere l ANALYSE DES RISQUES exhaustive (matrice probabilite x impact, mitigation, BCP). Identifie au moins 5 risques par categorie. JSON strict:
{
  "risques_marche": [{"risque":"risque precis","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"explication 3-5 phrases","signaux_avant_coureurs":["signal1","signal2"],"mitigation":"plan d action detaille 3-5 phrases","plan_b":"alternative si materialise","cout_mitigation":"FCFA"}],
  "risques_operationnels":[{"risque":"risque","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases","plan_b":"alternative","cout_mitigation":"FCFA"}],
  "risques_financiers":[{"risque":"risque","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases","plan_b":"alternative","cout_mitigation":"FCFA"}],
  "risques_juridiques":[{"risque":"compliance/litige/IP","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases"}],
  "risques_reputation":[{"risque":"risque image","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases"}],
  "risques_cybersecurite":[{"risque":"intrusion|ransomware|fuite","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","mitigation":"plan technique 3-5 phrases"}],
  "risques_geopolitiques":[{"risque":"instabilite politique|change devise|sanction","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","mitigation":"3-5 phrases"}],
  "plan_contingence":["mesure detaillee 1 (3-5 phrases)","mesure 2","mesure 3","mesure 4","mesure 5"],
  "business_continuity_plan":"plan de continuite : seuils declencheurs, equipes de crise, communication, retour a la normale (5-8 phrases)",
  "assurance":[{"couverture":"RC pro|cyber|biens|RH","prime_estimee":"FCFA/an","plafond":"FCFA","fournisseur":"compagnie suggeree"}],
  "comite_risques":"gouvernance risques : frequence, instances, reporting (3-5 phrases)",
  "early_warning_indicators":[{"indicateur":"DSO clients","seuil":">90j","action":"escalade dirigeant"}],
  "ameliorations":["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

function promptSlides(form, src) {
  return `${ctx(form, src)}

Genere un PITCH DECK INVESTISSEUR de 12 slides (Cover, Probleme, Solution, Marche, Produit, Traction, Business Model, GTM, Competition, Equipe, Financials, Ask). Chaque slide doit avoir un contenu narratif riche (8-15 lignes minimum, donnees chiffrees). JSON strict:
{
  "slides": [
    {"numero":1,"titre":"Cover : Nom de l entreprise + tagline","accent":"#0EA5E9","contenu":"contenu narratif puissant 6-10 lignes incluant tagline, positionnement court, contexte (ex: Series A 2026, ville)"},
    {"numero":2,"titre":"Probleme","accent":"#EF4444","contenu":"narration probleme avec chiffres (TAM du probleme, % population concernee, cout social/economique), 8-12 lignes"},
    {"numero":3,"titre":"Solution","accent":"#22C55E","contenu":"description solution claire avec 3-5 benefices et schema fonctionnel, 8-12 lignes"},
    {"numero":4,"titre":"Marche & Opportunite","accent":"#F59E0B","contenu":"TAM/SAM/SOM en FCFA, taux croissance, drivers macro Afrique, 8-12 lignes"},
    {"numero":5,"titre":"Produit / Demo","accent":"#8B5CF6","contenu":"description produit, parcours utilisateur, captures, USP, 8-12 lignes"},
    {"numero":6,"titre":"Traction","accent":"#06B6D4","contenu":"chiffres : utilisateurs, CA, croissance MoM, NPS, partenaires, 8-12 lignes"},
    {"numero":7,"titre":"Business Model","accent":"#EC4899","contenu":"sources revenus, prix, unit economics CAC/LTV, marges, 8-12 lignes"},
    {"numero":8,"titre":"Go-To-Market","accent":"#0EA5E9","contenu":"strategie acquisition, canaux prioritaires, partenariats, scaling geographique, 8-12 lignes"},
    {"numero":9,"titre":"Concurrence","accent":"#F97316","contenu":"matrice concurrentielle, positionnement differencie, moat (effets reseau, switching cost, IP), 8-12 lignes"},
    {"numero":10,"titre":"Equipe","accent":"#10B981","contenu":"fondateurs, expertises, references passees, advisors strategiques, recrutements cles a venir, 8-12 lignes"},
    {"numero":11,"titre":"Financials & Projections","accent":"#3B82F6","contenu":"projections CA An1/2/3 en FCFA, EBITDA, point mort, scenarios, 8-12 lignes"},
    {"numero":12,"titre":"Ask & Use of Funds","accent":"#F0B429","contenu":"montant leve, valorisation, dilution, repartition usage en %, milestones 18 mois, contact, 8-12 lignes"}
  ],
  "structure":["Cover","Probleme","Solution","Marche","Produit","Traction","Business Model","GTM","Competition","Equipe","Financials","Ask"],
  "design":{"theme":"premium minimal","couleurs":["#0A0A0A","#F0B429","#FFFFFF","#0EA5E9"],"police":"Inter / SF Pro","style":"datavis dense + visuels percutants"},
  "appendices_suggerees":["FAQ investisseur","Cap table","Detail financier","Risques detailles","References clients"],
  "ameliorations":["suggestion 1","suggestion 2","suggestion 3","suggestion 4","suggestion 5"]
}`
}

// Icon helper for section keys
function getIconForKey(key) {
  const icons = {
    pitch: '🎯',
    vision: '🔭',
    opportunity: '💡',
    solution: '⚡',
    business_model: '💼',
    traction: '📈',
    ask: '🤝',
    historique: '📜',
    equipe: '👥',
    mission: '🎯',
    valeurs: '💎',
    taille: '📊',
    croissance: '🚀',
    tendances: '📈',
    concurrence: '⚔️',
    avantage: '⭐',
    proposition: '💡',
    differentiation: '🎨',
    revenus: '💰',
    couts: '📉',
    rentabilite: '📈',
    strategie: '🎲',
    canaux: '📢',
    acquisition: '🎣',
    partenariats: '🤝',
    processus: '⚙️',
    ressources: '🛠️',
    risques: '⚠️',
    mitigation: '🛡️',
    previsions: '📅',
    indicateurs: '📊',
    slides: '🎨',
    executive: '📋',
    company: '🏢',
    market: '📊',
    value: '💎',
    model: '💼',
    gtm: '🚀',
    operations: '⚙️',
    financial: '💰',
    risks: '⚠️'
  }
  return icons[key.toLowerCase()] || '📄'
}

// Strip residual markdown that AI may slip into JSON values
function stripMD(s) {
  return String(s ?? '')
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*(?=\S)/g, '$1')
    .replace(/(?<=\S)\*(?=\s|$)/g, '')
    .replace(/`/g, '')
    .replace(/^#+\s*/gm, '')
    .trim()
}

function parseNumber(v) {
  if (v == null) return 0
  const m = String(v).replace(/[^\d.,-]/g, '').replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(m)
  return Number.isFinite(n) ? n : 0
}

// Visual Card Component for KPI/Metrics
function MetricCard({ label, value, trend, icon, color }) {
  const isPositive = String(trend || '').startsWith('+')
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      border: `1px solid ${color}35`,
      borderRadius: '14px', padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: '14px',
      minWidth: '160px', boxShadow: `0 4px 14px ${color}10`
    }}>
      <div style={{
        fontSize: '1.6rem', background: `${color}25`,
        width: '44px', height: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '12px', border: `1px solid ${color}40`
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>{stripMD(label)}</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stripMD(value)}</div>
        {trend && <div style={{ fontSize: '0.72rem', color: isPositive ? 'var(--accent2)' : color, fontWeight: 700, marginTop: '2px' }}>{stripMD(trend)}</div>}
      </div>
    </div>
  )
}

// Premium data table
function DataTable({ headers, rows, accent }) {
  if (!rows?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: `1px solid ${accent}25`, overflow: 'hidden', boxShadow: `0 4px 18px ${accent}08`, marginTop: '8px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}10)` }}>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `2px solid var(--border)`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid var(--border)', background: ri % 2 ? 'transparent' : 'var(--bg-secondary)' }}>
                {row.map((val, ci) => (
                  <td key={ci} style={{ padding: '12px 16px', borderTop: `1px solid var(--border)`, color: 'var(--text-secondary)' }}>{typeof val === 'number' ? val.toLocaleString() : stripMD(String(val ?? ''))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatementBlock({ icon, title, body, accent }) {
  if (!body) return null
  return (
    <div style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 12, border: `1px solid ${accent}25`, background: `${accent}08` }}>
      <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 6 }}>{icon} {title}</div>
      <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{stripMD(String(body))}</div>
    </div>
  )
}

function TagList({ items, accent }) {
  if (!items?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {items.map((item, i) => (
        <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: `${accent}15`, color: accent, fontSize: '0.8rem', fontWeight: 600 }}>
          {stripMD(typeof item === 'string' ? item : item.valeur || item.label || JSON.stringify(item))}
        </span>
      ))}
    </div>
  )
}

function ExecutiveView({ data, accent, themed }) {
  return (
    <div>
      {data.pitch && <StatementBlock icon="🎯" title="Pitch Exécutif" body={data.pitch} accent={accent} />}
      {data.vision && <StatementBlock icon="🔭" title="Vision" body={data.vision} accent={accent} />}
      {data.mission && <StatementBlock icon="🎪" title="Mission" body={data.mission} accent={accent} />}
      {data.opportunity && <StatementBlock icon="📈" title="Opportunité de Marché" body={data.opportunity} accent={accent} />}
      {data.problem && <StatementBlock icon="⚠️" title="Problème Identifié" body={data.problem} accent={accent} />}
      {data.solution && <StatementBlock icon="💡" title="Solution" body={data.solution} accent={accent} />}
      {data.business_model && <StatementBlock icon="💼" title="Modèle Économique" body={data.business_model} accent={accent} />}
      {data.traction && <StatementBlock icon="🚀" title="Traction" body={data.traction} accent={accent} />}
      {data.narratif_investisseur && <StatementBlock icon="💰" title="Narratif Investisseur" body={data.narratif_investisseur} accent={accent} />}
      {data.faits_marquants?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>⭐ Faits Marquants</div>
          <TagList items={data.faits_marquants} accent={accent} />
        </div>
      )}
      {data.kpis_cibles?.length > 0 && (
        <DataTable accent={accent} headers={['KPI', 'Valeur Cible', 'Délai', 'Benchmark']}
          rows={data.kpis_cibles.map(k => [k.label, k.valeur, k.delai, k.benchmark])} />
      )}
      {data.milestones_18mois?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>📅 Milestones 18 mois</div>
          <DataTable accent={accent} headers={['Horizon', 'Jalon', 'KPI Associé']}
            rows={data.milestones_18mois.map(m => [m.horizon, m.jalon, m.kpi_associe])} />
        </div>
      )}
    </div>
  )
}

function CompanyView({ data, accent, themed }) {
  return (
    <div>
      {data.historique && <StatementBlock icon="📖" title="Historique" body={data.historique} accent={accent} />}
      {data.mission && <StatementBlock icon="🎯" title="Mission" body={data.mission} accent={accent} />}
      {data.vision && <StatementBlock icon="🔭" title="Vision" body={data.vision} accent={accent} />}
      {data.raison_etre && <StatementBlock icon="💎" title="Raison d'être" body={data.raison_etre} accent={accent} />}
      {data.rse_impact && <StatementBlock icon="🌱" title="RSE & Impact" body={data.rse_impact} accent={accent} />}
      {data.valeurs?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>💎 Valeurs</div>
          {data.valeurs.map((v, i) => (
            <StatementBlock key={i} icon="✦" title={v.valeur || v} body={v.description || ''} accent={accent} />
          ))}
        </div>
      )}
      {data.equipe_cle?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>👥 Équipe Clé</div>
          <DataTable accent={accent} headers={['Poste', 'Rôle', 'Profil', 'Expérience']}
            rows={data.equipe_cle.map(e => [e.poste, e.role, e.profil, e.experience_requise])} />
        </div>
      )}
      {data.avantages_competitifs?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>⚡ Avantages Compétitifs</div>
          {data.avantages_competitifs.map((a, i) => (
            <StatementBlock key={i} icon="✦" title={a.avantage} body={a.description} accent={accent} />
          ))}
        </div>
      )}
    </div>
  )
}

function MarketView({ data, accent, themed }) {
  const tam = data.taille_marche || {}
  const pestel = data.pestel || {}
  const porter = data.porter_5_forces || {}
  return (
    <div>
      {(tam.tam || tam.sam || tam.som) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>📊 Taille de Marché</div>
          {tam.tam && <StatementBlock icon="🌍" title="TAM" body={tam.tam} accent={accent} />}
          {tam.sam && <StatementBlock icon="🎯" title="SAM" body={tam.sam} accent={accent} />}
          {tam.som && <StatementBlock icon="🏹" title="SOM" body={tam.som} accent={accent} />}
        </div>
      )}
      {data.positionnement && <StatementBlock icon="📍" title="Positionnement" body={data.positionnement} accent={accent} />}
      {Object.keys(pestel).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>🔍 PESTEL</div>
          {Object.entries(pestel).map(([k, v]) => v && <StatementBlock key={k} icon="→" title={k.charAt(0).toUpperCase() + k.slice(1)} body={v} accent={accent} />)}
        </div>
      )}
      {data.concurrents?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>⚔️ Concurrents</div>
          <DataTable accent={accent} headers={['Nom', 'Type', 'Part Marché', 'Positionnement']}
            rows={data.concurrents.map(c => [c.nom, c.type, c.part_marche, c.positionnement])} />
        </div>
      )}
      {data.tendances?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>📈 Tendances</div>
          {data.tendances.map((t, i) => <StatementBlock key={i} icon="→" title={t.tendance} body={t.description} accent={accent} />)}
        </div>
      )}
    </div>
  )
}

function ValueView({ data, accent, themed }) {
  return (
    <div>
      {data.probleme && <StatementBlock icon="⚠️" title="Problème" body={data.probleme} accent={accent} />}
      {data.solution && <StatementBlock icon="💡" title="Solution" body={data.solution} accent={accent} />}
      {data.value_proposition_statement && <StatementBlock icon="💎" title="Value Proposition" body={data.value_proposition_statement} accent={accent} />}
      {data.proposition_unique && <StatementBlock icon="⭐" title="USP" body={data.proposition_unique} accent={accent} />}
      {data.moat && <StatementBlock icon="🏰" title="Douve Concurrentielle" body={data.moat} accent={accent} />}
      {data.scalabilite && <StatementBlock icon="📈" title="Scalabilité" body={data.scalabilite} accent={accent} />}
      {data.douleurs_clients?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>😣 Douleurs Clients</div>
          <TagList items={data.douleurs_clients} accent={accent} />
        </div>
      )}
      {data.avantages?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>✅ Avantages</div>
          <DataTable accent={accent} headers={['Avantage', 'Description', 'Quantification']}
            rows={data.avantages.map(a => [a.avantage, a.description, a.quantification])} />
        </div>
      )}
    </div>
  )
}

function ModelView({ data, accent, themed }) {
  const ue = data.unit_economics || {}
  return (
    <div>
      {data.business_model_type && <StatementBlock icon="💼" title="Type de Modèle" body={data.business_model_type} accent={accent} />}
      {data.revenus?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>💰 Sources de Revenus</div>
          <DataTable accent={accent} headers={['Source', 'Modèle', 'Prix FCFA', 'Poids %']}
            rows={data.revenus.map(r => [r.source, r.modele, r.prix, r.poids_pct + '%'])} />
        </div>
      )}
      {(ue.cac || ue.ltv) && (
        <div style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 12, border: `1px solid ${accent}25`, background: `${accent}08` }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 10 }}>📊 Unit Economics</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[['CAC', ue.cac], ['LTV', ue.ltv], ['Ratio LTV/CAC', ue.ratio_ltv_cac], ['Payback', ue.payback_period], ['ARPU', ue.arpu]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ padding: '10px 12px', borderRadius: 8, background: `${accent}12`, textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: accent }}>{stripMD(String(v))}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.couts?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>📉 Structure de Coûts</div>
          <DataTable accent={accent} headers={['Type', 'Catégorie', 'Montant', 'Scaling']}
            rows={data.couts.map(c => [c.type, c.categorie, c.montant_estime, c.scaling])} />
        </div>
      )}
    </div>
  )
}

function GTMView({ data, accent, themed }) {
  const phase = data.phase_lancement || {}
  return (
    <div>
      {Object.keys(phase).length > 0 && (
        <div style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 12, border: `1px solid ${accent}25`, background: `${accent}08` }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>🚀 Phase de Lancement</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {[['Zone', phase.geographie], ['Durée', phase.duree], ['Clients cibles', phase.objectif_clients], ['Budget', phase.budget]].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} style={{ padding: '8px 12px', borderRadius: 8, background: `${accent}12` }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stripMD(String(v))}</div>
              </div>
            ))}
          </div>
          {phase.kpi_succes && <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stripMD(phase.kpi_succes)}</div>}
        </div>
      )}
      {data.strategie_acquisition && <StatementBlock icon="🎣" title="Stratégie d'Acquisition" body={data.strategie_acquisition} accent={accent} />}
      {data.canaux?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>📢 Canaux</div>
          <DataTable accent={accent} headers={['Canal', 'Priorité', 'Invest./mois', 'CAC', 'ROI']}
            rows={data.canaux.map(c => [c.canal, c.priorite, c.investissement, c.cac_attendu, c.roi_estime])} />
        </div>
      )}
      {data.funnel_conversion?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 8 }}>🔄 Funnel de Conversion</div>
          <DataTable accent={accent} headers={['Étape', 'KPI', 'Cible', 'Tactique']}
            rows={data.funnel_conversion.map(f => [f.etape, f.kpi, f.cible, f.tactique])} />
        </div>
      )}
    </div>
  )
}

function OperationsView({ data, accent }) {
  const ops = data.processus_cles || [];
  const tech = data.technologie || [];
  const part = data.partenaires || [];
  const sc = data.scalabilite || {};
  const q = data.qualite || {};

  return (
    <div>
      {data.chaine_valeur && <StatementBlock icon="🔗" title="Chaîne de valeur" body={data.chaine_valeur} accent={accent} />}
      
      {ops.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>⚙️ Processus Clés</div>
          <DataTable
            accent={accent}
            headers={['Processus', 'Description', 'KPI', 'SLA']}
            rows={ops.map(o => [stripMD(o.processus), stripMD(o.description), stripMD(o.kpi), stripMD(o.sla)])}
          />
        </div>
      )}
      
      {tech.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ color: 'var(--accent3)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>💻 Technologie</div>
          <DataTable
            accent="var(--accent3)"
            headers={['Outil', 'Usage', 'Impact', 'Coût']}
            rows={tech.map(t => [stripMD(t.outil), stripMD(t.usage), stripMD(t.impact), stripMD(t.cout)])}
          />
        </div>
      )}

      {q.process_qualite && (
        <div style={{ marginTop: 18 }}>
          {q.process_qualite && <StatementBlock icon="🔬" title="Processus Qualité" body={q.process_qualite} accent={accent} />}
          {q.indicateurs && q.indicateurs.length > 0 && (
            <div style={{ marginTop: 12, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
              <div style={{ color: 'var(--accent2)', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📊 KPI qualité</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {q.indicateurs.map((n, i) => <span key={i} style={{ padding: '4px 10px', background: 'var(--accent2)15', color: 'var(--accent2)', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>{stripMD(n.kpi || n)}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
      {(sc.capacite_actuelle || sc.projections) && (
        <div style={{ marginTop: 18 }}>
          {sc.capacite_actuelle && <StatementBlock icon="📦" title="Capacité actuelle" body={sc.capacite_actuelle} accent={accent} />}
          {sc.projections && <StatementBlock icon="📈" title="Projections de scalabilité" body={sc.projections} accent="var(--accent2)" />}
        </div>
      )}
    </div>
  )
}

function FinancialView({ data, accent, themed }) {
  const proj = data.projections || {}
  const flux = data.flux_tresorerie || {}
  const hyp = data.hypothese || {}
  const bf = data.besoin_financement || {}

  const years = ['annee1', 'annee2', 'annee3'].filter(y => proj[y])
  const caSeries = years.map((y, i) => ({
    label: `Année ${i + 1}`,
    value: parseNumber(proj[y]?.ca),
    label_value: stripMD(proj[y]?.ca),
  }))

  return (
    <div>
      {(hyp.croissance_ca || hyp.marge_nette || hyp.delai_paiement) && (
              <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' })}>
          {hyp.croissance_ca && <MetricCard label="Croissance CA" value={hyp.croissance_ca} icon="📈" color="#22C55E" trend="+" themed={themed} />}
                    {hyp.marge_nette && <MetricCard label="Marge nette" value={hyp.marge_nette} icon="💰" color={accent} themed={themed} />}
                    {hyp.delai_paiement && <MetricCard label="Délai paiement" value={hyp.delai_paiement} icon="⏱️" color="#8B5CF6" themed={themed} />}
        </div>
      )}

      {caSeries.length > 0 && caSeries.some(s => s.value > 0) && (
                <div style={themed({ marginBottom: '24px' })}>
          <div style={themed({ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' })}>📊 Évolution du chiffre d'affaires</div>
          <BarChart series={caSeries} accent={accent} />
        </div>
      )}

      {years.length > 0 && (
        <div style={themed({ marginBottom: '24px' })}>
          <div style={themed({ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' })}>💼 Compte de résultat prévisionnel</div>
          <DataTable
            accent={accent}
            headers={['Indicateur', ...years.map((_, i) => `Année ${i + 1}`)]}
            rows={[
              ['Chiffre d\'affaires', ...years.map(y => stripMD(proj[y]?.ca))],
              ['Marge', ...years.map(y => stripMD(proj[y]?.marge))],
              ['EBITDA', ...years.map(y => stripMD(proj[y]?.ebitda))],
              ['Résultat net', ...years.map(y => stripMD(proj[y]?.resultat))],
            ]}
            themed={themed}
          />
        </div>
      )}

      {(flux.annee1 || flux.annee2 || flux.annee3) && (
                <div style={themed({ marginBottom: '20px' })}>
          <div style={themed({ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' })}>💧 Flux de trésorerie</div>
          <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' })}>
            {['annee1', 'annee2', 'annee3'].map((y, i) => flux[y] && (
              <MetricCard key={y} label={`Année ${i + 1}`} value={flux[y]} icon="💧" color={i === 0 ? '#3B82F6' : i === 1 ? '#8B5CF6' : '#22C55E'} themed={themed} />
            ))}
          </div>
        </div>
      )}

      {(bf.montant || bf.usage) && (
                <div style={themed({
          background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
          border: `1px solid ${accent}40`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px'
        })}>
                    <div style={themed({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' })}>
                        <div style={themed({ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px' })}>🤝 Besoin de financement</div>
                        {bf.montant && <div style={themed({ color: accent, fontWeight: 900, fontSize: '1.4rem' })}>{stripMD(bf.montant)}</div>}
          </div>
                    {bf.usage && <div style={themed({ color: 'text-primary', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '6px' })}><strong>Usage :</strong> {stripMD(bf.usage)}</div>}
                    {bf.structure && <div style={themed({ color: 'text-secondary', fontSize: '0.88rem', lineHeight: 1.6 })}><strong>Structure :</strong> {stripMD(bf.structure)}</div>}
        </div>
      )}

      {Array.isArray(data.ratios) && data.ratios.length > 0 && (
                <div>
          <div style={themed({ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' })}>📐 Ratios financiers</div>
          <DataTable
            accent="#8B5CF6"
            headers={['Ratio', 'Valeur', 'Benchmark sectoriel']}
            rows={data.ratios.map(r => [stripMD(r.ratio), stripMD(r.valeur), stripMD(r.benchmark)])}
            themed={themed}
          />
        </div>
      )}
    </div>
  )
}

function RisksView({ data, accent, themed }) {
  const allRisks = [
    ...(data.risques_marche || []).map(r => ({ ...r, _cat: 'Marché' })),
    ...(data.risques_operationnels || []).map(r => ({ ...r, _cat: 'Opérationnel' })),
    ...(data.risques_financiers || []).map(r => ({ ...r, _cat: 'Financier' })),
  ]
  return (
    <div>
      {allRisks.length > 0 && (
        <>
                    <div style={themed({ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' })}>🎯 Matrice de risques (Probabilité × Impact)</div>
          <RiskMatrix risks={allRisks} accent={accent} />
                    <div style={themed({ marginTop: '24px' })}>
                        <div style={themed({ color: accent, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' })}>📋 Détail & mitigation</div>
            <DataTable
              accent={accent}
              headers={['Catégorie', 'Risque', 'Probabilité', 'Impact', 'Mitigation']}
              rows={allRisks.map(r => {
                const p = String(r.probabilite || '').toLowerCase()
                const im = String(r.impact || '').toLowerCase()
                const pColor = p === 'haute' ? '#EF4444' : p === 'basse' ? '#22C55E' : '#F0B429'
                const iColor = im === 'critique' ? '#EF4444' : im === 'faible' ? '#22C55E' : '#F0B429'
                return [
                                    <span key="c" style={themed({ background: `${accent}20`, color: accent, padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' })}>{r._cat}</span>,
                  stripMD(r.risque),
                                    <span key="p" style={themed({ background: `${pColor}20`, color: pColor, padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' })}>{stripMD(r.probabilite)}</span>,
                                    <span key="i" style={themed({ background: `${iColor}20`, color: iColor, padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' })}>{stripMD(r.impact)}</span>,
                  stripMD(r.mitigation),
                ]
              })}
            />
          </div>
        </>
      )}
      {Array.isArray(data.plan_contingence) && data.plan_contingence.length > 0 && (
                <div style={themed({ marginTop: '20px' })}>
          <div style={themed({ color: '#F0B429', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' })}>🛡️ Plan de contingence</div>
          <div style={themed({ display: 'flex', flexDirection: 'column', gap: '8px' })}>
            {data.plan_contingence.map((m, i) => (
              <div key={i} style={themed({ padding: '10px 14px', background: 'bg-card', border: '1px solid border', borderLeft: '4px solid #F0B429', borderRadius: '8px', color: 'text-primary', fontSize: '0.9rem', lineHeight: 1.5 })}>{stripMD(m)}</div>
            ))}
          </div>
        </div>
      )}
      {Array.isArray(data.assurance) && data.assurance.length > 0 && (
                <div style={themed({ marginTop: '16px' })}>
          <div style={themed({ color: '#3B82F6', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' })}>🏥 Couvertures assurance</div>
          <div style={themed({ display: 'flex', flexWrap: 'wrap', gap: '8px' })}>
            {data.assurance.map((a, i) => (
              <span key={i} style={themed({ padding: '8px 14px', background: '#3B82F615', border: '1px solid #3B82F640', color: '#3B82F6', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem' })}>🛡️ {stripMD(a)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SlidesView({ data, accent, themed }) {
  const list = data.slides || []
  const [current, setCurrent] = useState(0)
    if (!list.length) return <div style={themed({ color: 'text-muted' })}>Aucune slide générée.</div>
  return (
    <div>
      <PremiumSlide slide={list[current]} index={current} total={list.length} accent={accent} />
            <div style={themed({ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', margin: '16px 0' })}>
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          style={themed({ padding: '10px 20px', borderRadius: '10px', border: 'none', background: current === 0 ? 'bg-secondary' : accent, color: current === 0 ? 'text-muted' : '#0a0a0a', cursor: current === 0 ? 'default' : 'pointer', fontWeight: 800 })}>← Précédent</button>
                <span style={themed({ color: 'text-muted', fontSize: '0.85rem', minWidth: '70px', textAlign: 'center', fontWeight: 700 })}>{current + 1} / {list.length}</span>
                <button onClick={() => setCurrent(c => Math.min(list.length - 1, c + 1))} disabled={current === list.length - 1}
          style={themed({ padding: '10px 20px', borderRadius: '10px', border: 'none', background: current === list.length - 1 ? 'bg-secondary' : accent, color: current === list.length - 1 ? 'text-muted' : '#0a0a0a', cursor: current === list.length - 1 ? 'default' : 'pointer', fontWeight: 800 })}>Suivant →</button>
      </div>
            <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' })}>
        {list.map((sl, i) => (
                    <div key={i} onClick={() => setCurrent(i)} style={themed({
            padding: '12px 14px', borderRadius: '12px',
            border: `2px solid ${i === current ? accent : 'var(--border)'}`,
            background: i === current ? `linear-gradient(135deg, ${accent}20, ${accent}05)` : 'var(--bg-secondary)',
            cursor: 'pointer', transition: 'all 0.2s'
          })}>
                        <div style={themed({ fontSize: '0.7rem', color: i === current ? accent : 'text-muted', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.5px' })}>SLIDE #{sl.numero || i + 1}</div>
                        <div style={themed({ fontSize: '0.82rem', color: i === current ? 'text-primary' : 'text-secondary', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: i === current ? 700 : 500 })}>{stripMD(sl.titre)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const VIEW_BY_SECTION = {
  executive: ExecutiveView,
  company: CompanyView,
  market: MarketView,
  value: ValueView,
  model: ModelView,
  gtm: GTMView,
  operations: OperationsView,
  financial: FinancialView,
  risks: RisksView,
  slides: SlidesView,
}

const KNOWN_KEYS_BY_SECTION = {
  executive: ['pitch','vision','mission','opportunity','problem','solution','business_model','traction','narratif_investisseur','faits_marquants','kpis_cibles','milestones_18mois','team_summary','ask','use_of_funds','valeurs_uniques','stakeholders_cles'],
  company: ['historique','mission','vision','valeurs','raison_etre','structure_juridique','equipe_cle','organigramme_cible','avantages_competitifs','propriete_intellectuelle','implantation','rse_impact','certifications_cibles'],
  market: ['taille_marche','pestel','porter_5_forces','tendances','segments','personas','concurrents','matrice_concurrentielle','positionnement','blue_ocean_potential','barrieres_entree','reglementation','saisonnalite','geographie_priorisee','sources_donnees'],
  value: ['probleme','douleurs_clients','gains_clients','solution','value_proposition_statement','avantages','proposition_unique','differentiation_axes','moat','validation_marche','early_adopters','scalabilite','use_cases','preuve_concept'],
  model: ['business_model_type','revenus','structure_prix','couts','couts_initiaux','marges','unit_economics','leviers_croissance','metrics','modele_revenus_recurrent_pct','saisonnalite_revenus','monetisation_secondaire','scenarios_pricing'],
  gtm: ['phase_lancement','strategie_acquisition','canaux','funnel_conversion','strategie_prix','cycle_vente','equipe_commerciale','budget_marketing','kpis_gtm'],
  operations: ['chaine_valeur','processus_cles','technologie','partenaires','scalabilite','qualite'],
  financial: ['projections','compte_resultat','bilan','flux_tresorerie','ratios','break_even','financement'],
  risks: ['risques_majeurs','matrice_risques','plan_continuite','scenario_stress'],
  slides: ['slides'],
}

function renderImprovements(result, accent) {
  const items = result?.ameliorations
  if (!items?.length) return null
  return (
    <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, border: `1px solid ${accent}20`, background: `${accent}06` }}>
      <div style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: accent, marginBottom: 10 }}>💡 Suggestions d'amélioration</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((s, i) => (
          <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>{stripMD(String(s))}</li>
        ))}
      </ul>
    </div>
  )
}

function renderAdditionalFields(result, knownKeys = [], accent) {
  if (!result || typeof result !== 'object') return null
  const extra = Object.entries(result).filter(([k]) => !knownKeys.includes(k) && k !== 'ameliorations' && typeof result[k] === 'string' && result[k].length > 20)
  if (!extra.length) return null
  return (
    <div style={{ marginTop: 12 }}>
      {extra.map(([key, val]) => (
        <StatementBlock key={key} icon={getIconForKey(key)} title={key.replace(/_/g, ' ')} body={val} accent={accent} />
      ))}
    </div>
  )
}

// Élite Component Functions
function SectionCard({ section, result, enabled, onToggle, accent, c, themed }) {
  if (!result) {
    return (
            <div style={themed({
        background: 'bg-card', border: `2px solid ${accent}20`, borderRadius: '16px',
        padding: '24px', marginBottom: '20px', opacity: 0.5
      })}>
                <div style={themed({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' })}>
                    <div style={themed({ display: 'flex', alignItems: 'center', gap: '12px' })}>
                        <div style={themed({ fontSize: '1.5rem', filter: 'grayscale(1)' })}>{section.icon}</div>
            <div>
                            <div style={themed({ color: 'text-primary', fontWeight: 700, fontSize: '1.1rem' })}>{section.label}</div>
                            <div style={themed({ color: 'text-muted', fontSize: '0.85rem' })}>⏳ Génération en cours...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (result.error) {
    return (
            <div style={themed({
        background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: '16px',
        padding: '20px', marginBottom: '20px'
      })}>
                <div style={themed({ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' })}>
                    <div style={themed({ fontSize: '1.5rem' })}>⚠️</div>
          <div style={{ flex: 1 }}>
                        <div style={themed({ color: 'text-primary', fontWeight: 700, fontSize: '1rem' })}>{section.label}</div>
                        <div style={themed({ color: '#EF4444', fontSize: '0.85rem' })}>Échec de la génération</div>
          </div>
        </div>
                <div style={themed({ color: '#FCA5A5', fontSize: '0.85rem', marginTop: '8px' })}>
          {result.error}
        </div>
      </div>
    )
  }

  const ViewRenderer = VIEW_BY_SECTION[section.id] || ExecutiveView
  const knownKeys = KNOWN_KEYS_BY_SECTION[section.id] || []

  return (
        <div style={themed({
      background: 'bg-card', 
      border: `1px solid ${accent}30`, 
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '24px',
      boxShadow: `0 4px 24px ${accent}10`
    })}>
      {/* Header */}
            <div style={themed({ 
        background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
        padding: '20px 24px',
        borderBottom: `1px solid ${accent}20`
      })}>
                <div style={themed({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
                    <div style={themed({ display: 'flex', alignItems: 'center', gap: '14px' })}>
                        <div style={themed({ 
              fontSize: '2rem', 
              background: `${accent}20`,
              borderRadius: '12px',
              padding: '8px',
              border: `1px solid ${accent}30`
            })}>{section.icon}</div>
            <div>
                            <div style={themed({ color: 'text-primary', fontWeight: 800, fontSize: '1.2rem' })}>{section.label}</div>
                            <div style={themed({ color: accent, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' })}>
                Section Premium
              </div>
            </div>
          </div>
                    <label style={themed({ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            padding: '6px 12px',
            background: enabled ? `${accent}20` : 'var(--bg-secondary)',
            borderRadius: '20px',
            border: `1px solid ${enabled ? accent : 'var(--border)'}`,
            transition: 'all 0.2s'
          })}>
            <input type="checkbox" checked={enabled} onChange={() => onToggle(section.id)} style={{ accentColor: accent }} />
                        <span style={themed({ color: enabled ? accent : 'text-secondary', fontSize: '0.8rem', fontWeight: 600 })}>
              {enabled ? '✓ Inclus' : 'Inclure'}
            </span>
          </label>
        </div>
      </div>

      {/* Content */}
            <div style={themed({ padding: '24px' })}>
                <ViewRenderer data={result} accent={accent} themed={themed} />
        {renderAdditionalFields(result, KNOWN_KEYS_BY_SECTION[section.id], accent)}
        {renderImprovements(result, accent)}
      </div>
    </div>
  )
}

// Élite Main Component
export default function BusinessPlanEliteSimple() {
    const { membre } = useAuth();
  const { themed } = useThemedStyles();
    const bgJob = useBackgroundJob('business-plan-elite', 'Business Plan Élite')
  
  // Élite State Management
  const [form, setForm] = useState({
    nom: '', secteur: '', pays: "Sénégal / Afrique de l'Ouest", mission: '', effectif: '',
    stade: 'Startup', produit: '', cible: '', investissement: '', horizon: '3 ans',
    ca1: '', ca2: '', ca3: '', ch1: '', ch2: '', ch3: '',
  })
  const [logoUrl, setLogoUrl] = useState('')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [uploadedText, setUploadedText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadLoading, setUploadLoading] = useState(false)
  const [results, setResults] = useState({})
  const [slides, setSlides] = useState(defaults.slides || [])
  const [loadingStep, setLoadingStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('executive')
  const [enabled, setEnabled] = useState({ executive: true, company: true, market: true, value: true, model: true, gtm: true, operations: true, financial: true, risks: true, slides: false })
    const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { lastSavedAt, clearDraft } = useDraftAutoSave(
    'abawi-bp-draft',
    { form, enabled },
    { onRestore: (d) => { if (d?.form) setForm(d.form); if (d?.enabled) setEnabled(d.enabled) } }
  )

  // Élite Permission Check
  if (!canAccess(membre, 'outils-essentiels')) {
    return (
            <div style={themed({ 
       minHeight: '60vh', 
       display: 'flex', 
       alignItems: 'center', 
       justifyContent: 'center',
       background: 'gradient-hero'
     })}>
                <div style={themed({ 
         textAlign: 'center', 
         padding: '48px', 
         background: 'bg-card', 
         borderRadius: '20px', 
         border: '1px solid border',
         maxWidth: '500px'
       })}>
                    <div style={themed({ fontSize: '4rem', marginBottom: '24px' })}>🔒</div>
                    <h2 style={themed({ color: 'text-primary', marginBottom: '16px' })}>Accès Élite Restreint</h2>
                    <p style={themed({ color: 'text-muted', lineHeight: 1.6 })}>
            L'accès au Business Plan Élite nécessite un abonnement Starter ou supérieur.
          </p>
                    <div style={themed({
           marginTop: '24px',
           padding: '16px',
           background: 'bg-card',
           borderRadius: '12px',
           border: '1px solid border'
         })}>
                        <div style={themed({ color: '#F0B429', fontWeight: 600, marginBottom: '8px' })}>Fonctionnalités Élite :</div>
                        <div style={themed({ color: 'text-secondary', fontSize: '0.9rem' })}>
              ✅ 10 sections exhaustives<br/>
              ✅ Génération IA avancée<br/>
              ✅ Export PDF professionnel<br/>
              ✅ Analyse financière 3 ans<br/>
              ✅ Slides investor-ready
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Élite Helper Functions
  function patch(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function importFiles(files) {
    const list = Array.from(files || [])
    if (!list.length) return
    setUploadedFiles(list); setUploadLoading(true); setUploadedText('')
    try {
      const text = await extractFilesText(list)
      setUploadedText(text)
    } catch { setUploadedText('') }
    finally { setUploadLoading(false) }
  }

    const generate = async () => {
    setLoading(true);
    setError('');
    setResults({});
    setProgress(0);
    setLoadingStep('Initialisation...');

    const src = uploadedText
    const queue = SECTIONS.filter(s => enabled[s.id])

    if (!queue.length) {
      setError('Aucune section sélectionnée.')
            setLoading(false);
      setLoadingStep('');
      return
    }

    const promptBuilders = {
      executive: promptExecutive, company: promptCompany, market: promptMarket,
      value: promptValue, model: promptModel, gtm: promptGTM,
      operations: promptOperations, financial: promptFinancial,
      risks: promptRisks, slides: promptSlides,
    }

    const newResults = {}
    let done = 0

    for (const section of queue) {
      setLoadingStep(`Génération: ${section.label}...`)
      setProgress(Math.round((done / queue.length) * 100))

      try {
        const builder = promptBuilders[section.id]
        if (!builder) continue
        // Tokens étendus pour générer un contenu ultra-détaillé (financial/market/slides plus volumineux)
        const tokenBudget = ['financial', 'market', 'slides', 'company'].includes(section.id) ? 9000 : 7500
        const raw = await groqJSON(builder(form, src), tokenBudget)
        newResults[section.id] = safeJSON(raw, { error: 'Parse error', raw })
        setResults({ ...newResults })
      } catch (err) {
        console.error(`[BusinessPlan] Erreur section ${section.id}:`, err)
        newResults[section.id] = { error: err.message || 'Erreur réseau', section: section.id }
        setResults({ ...newResults })
      }

      done++
      setProgress(Math.round((done / queue.length) * 100))
    }

    setLoadingStep('')
        setLoading(false);
    setProgress(100);

    const failed = Object.values(newResults).filter(r => r?.error).length
    if (failed === queue.length) {
      setError('La génération a échoué sur toutes les sections. Vérifiez votre connexion ou la clé API.')
    } else if (failed > 0) {
      setError(`${failed} section(s) n'ont pas pu être générées. Vous pouvez relancer.`)
    }
  }

  const exportPDF = async () => {
    try {
      const content = document.getElementById('business-plan-content')
      if (!content) {
        setError('Contenu business plan non trouvé')
        return
      }
      
      // Élite PDF Export
      await bgJob.run(
        async () => {
          return await exportToPDF(content, {
            filename: 'business-plan-ultra-elite.pdf',
            includeHeader: true,
            includeFooter: true,
            headerText: 'Business Plan ABAWI Élite',
            footerText: 'Généré avec Abawi IA'
          })
        },
        {
          onDone: (result) => {
            console.log('PDF de niveau cabinet exporté avec succès')
          },
          onError: (error) => {
            setError(`Erreur export PDF: ${error.message}`)
            window.print()
          }
        }
      )
    } catch (error) {
      setError(`Erreur export PDF: ${error.message}`)
    }
  }

  // Élite Render
  return (
        <div style={themed({
      maxWidth: 'min(1440px, 96vw)',
      margin: '0 auto',
      padding: 'clamp(16px, 2.5vw, 32px) clamp(16px, 2.5vw, 40px)',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'text-primary',
      background: 'bg-primary',
      minHeight: '100vh'
    })}>
      <SEO
        title="Business Plan Élite IA — 10 sections détaillées + projections 3 ans"
        description="Générez un business plan exhaustif de niveau cabinet international : 10 sections ultra-détaillées (résumé exécutif, PESTEL, Porter, marché TAM/SAM/SOM, plan financier 3 ans avec scénarios, valorisation DCF, matrice de risques, pitch deck 12 slides). Conforme OHADA, adapté Afrique de l'Ouest."
        keywords="business plan Sénégal, business plan OHADA, business plan IA, executive summary, plan financier 3 ans, PESTEL, Porter, SWOT, pitch investisseur, UEMOA, BCEAO, valorisation DCF, unit economics"
        type="article"
      />
      {/* Info Panel */}
      <ToolInfoPanel
        toolName="Business Plan Élite"
        icon="📊"
        description="Génération avancée tier-1 avec IA et analyses exhaustives"
        benefits={[
          'Structurez votre vision en 10 sections stratégiques couvrant tous les aspects',
          'Obtenez des analyses de marché chiffrées et réalistes pour l\'Afrique de l\'Ouest',
          'Générez des projections financières sur 5 ans conformes aux normes OHADA',
          'Présentez un dossier professionnel aux investisseurs et banques',
          'Exportez en PDF premium avec mise en page professionnelle'
        ]}
        howToUse={[
          'Remplissez les informations de votre entreprise (nom, secteur, pays, CA...)',
          'Sélectionnez les sections à générer via les onglets et cochez celles souhaitées',
          'Importez des documents pour enrichir l\'analyse IA (optionnel)',
          'Cliquez sur "Générer Business Plan Élite" pour obtenir votre document',
          'Consultez chaque section, puis exportez en PDF pour vos présentations'
        ]}
        tips={[
          'Plus vous fournissez de données chiffrées, plus l\'IA génère des analyses pertinentes',
          'L\'outil est optimisé pour les marchés ouest-africains et les normes OHADA',
          'Vous pouvez cocher/décocher les sections pour générer uniquement ce dont vous avez besoin',
          'Le résumé exécutif est la section la plus importante pour convaincre les investisseurs'
        ]}
      />

      {/* Élite Hero Header */}
            <div style={themed({ 
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #0ea5e9 100%)', 
        padding: '40px 32px', 
        borderRadius: '24px', 
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(37, 99, 235, 0.3)'
      })}>
        {/* Animated Background Elements */}
                <div style={themed({ 
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        })} />
                <div style={themed({ 
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(240,180,41,0.15) 0%, transparent 70%)',
          borderRadius: '50%'
        })} />
        
        {/* Chart Icons Decoration */}
                <div style={themed({
          position: 'absolute',
          top: '20px',
          right: '40px',
          fontSize: '4rem',
          opacity: 0.2,
          transform: 'rotate(-15deg)'
        })}>📈</div>
                <div style={themed({
          position: 'absolute',
          bottom: '20px',
          left: '40px',
          fontSize: '3rem',
          opacity: 0.15,
          transform: 'rotate(15deg)'
        })}>💼</div>
        
                <div style={themed({ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '32px' })}>
                    <div style={themed({
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '20px',
            padding: '20px 24px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          })}>
                        <span style={themed({ fontSize: '3.5rem' })}>📊</span>
          </div>
          
                    <div style={{ flex: 1 }}>
                        <div style={themed({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(240,180,41,0.9)',
              borderRadius: '20px',
              marginBottom: '12px'
            })}>
                            <span style={themed({ fontSize: '0.75rem', fontWeight: 800, color: '#0a0a0a', textTransform: 'uppercase', letterSpacing: '1px' })}>
                ⚡ Outil Premium
              </span>
            </div>
            
                        <h1 style={themed({ 
              color: 'white', 
              margin: 0, 
              fontSize: '2.2rem', 
              fontWeight: 900,
              letterSpacing: '-0.5px'
            })}>
              Business Plan Élite
            </h1>
                        <p style={themed({ 
              color: 'rgba(255,255,255,0.85)', 
              margin: '12px 0 0 0', 
              fontSize: '1.05rem',
              lineHeight: 1.6,
              maxWidth: '500px'
            })}>
              Générez un business plan professionnel de niveau cabinet international
            </p>
            
            {/* Feature Tags */}
                        <div style={themed({ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' })}>
              {['10 Sections', 'Analyse OHADA', 'Export PDF', 'Slides Pro'].map((tag, i) => (
                                <span key={i} style={themed({
                  padding: '6px 14px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: 'white',
                  fontWeight: 600
                })}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Élite Progress */}
            {loading && (
        <div style={themed({
          background: 'bg-card',
          border: '1px solid border',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        })}>
                    <div style={themed({ 
            width: '50px', 
            height: '50px', 
            border: '4px solid border', 
            borderTopColor: 'gold', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          })} />
                    <h3 style={themed({ color: 'text-primary', marginBottom: '8px', fontSize: '1.1rem' })}>Génération Élite en cours...</h3>
                    <p style={themed({ color: 'text-secondary', marginBottom: '12px' })}>{loadingStep}</p>
                    <div style={themed({ 
            height: '6px', 
            background: 'bg-secondary', 
            borderRadius: '4px', 
            overflow: 'hidden',
            marginBottom: '8px'
          })}>
                        <div style={themed({ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--gold), var(--accent))', 
              width: `${progress}%`,
              transition: 'width 0.3s ease'
            })} />
          </div>
                    <div style={themed({ color: 'text-muted', fontSize: '0.85rem' })}>{progress}% complété</div>
        </div>
      )}

      {/* Élite Error */}
            {error && (
        <div style={themed({
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          color: '#EF4444',
        })}>
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Élite Controls */}
            <div style={themed({
        background: 'bg-card',
        border: '1px solid border',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px'
      })}>
                <div style={themed({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' })}>
                    <h2 style={themed({ color: 'text-primary', margin: 0, fontSize: '1.3rem' })}>Configuration</h2>
                    {lastSavedAt && (
            <div style={themed({ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' })}>
                            <span style={themed({ color: 'accent2' })}>✓ Brouillon sauvegardé</span>
                            <button onClick={clearDraft} style={themed({ background: 'transparent', border: '1px solid rgba(139,149,165,0.3)', color: 'text-secondary', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem' })}>
                Effacer
              </button>
            </div>
          )}
        </div>
        
        {/* Élite Form */}
                <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' })}>
          <div>
                        <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '8px', fontWeight: 600 })}>Nom de l'entreprise *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => patch('nom', e.target.value)}
                            style={themed({
                width: '100%',
                padding: '12px',
                background: 'bg-secondary',
                border: '1px solid border',
                borderRadius: '8px',
                color: 'text-primary',
                fontSize: '1rem'
              })}
              placeholder="Ex: ABAWI Tech"
            />
          </div>
          
          <div>
                        <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '8px', fontWeight: 600 })}>Secteur *</label>
            <input
              type="text"
              value={form.secteur}
              onChange={(e) => patch('secteur', e.target.value)}
                            style={themed({
                width: '100%',
                padding: '12px',
                background: 'bg-secondary',
                border: '1px solid border',
                borderRadius: '8px',
                color: 'text-primary',
                fontSize: '1rem'
              })}
              placeholder="Ex: Fintech / EdTech / HealthTech"
            />
          </div>
          
          <div>
                        <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '8px', fontWeight: 600 })}>Pays/Région</label>
            <input
              type="text"
              value={form.pays}
              onChange={(e) => patch('pays', e.target.value)}
                            style={themed({
                width: '100%',
                padding: '12px',
                background: 'bg-secondary',
                border: '1px solid border',
                borderRadius: '8px',
                color: 'text-primary',
                fontSize: '1rem'
              })}
              placeholder="Ex: Sénégal / Afrique de l'Ouest"
            />
          </div>
          
          <div>
                        <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '8px', fontWeight: 600 })}>Mission</label>
            <input
              type="text"
              value={form.mission}
              onChange={(e) => patch('mission', e.target.value)}
                            style={themed({
                width: '100%',
                padding: '12px',
                background: 'bg-secondary',
                border: '1px solid border',
                borderRadius: '8px',
                color: 'text-primary',
                fontSize: '1rem'
              })}
              placeholder="Mission de l'entreprise"
            />
          </div>
          
          <div>
                        <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '8px', fontWeight: 600 })}>Produit/Service</label>
            <input
              type="text"
              value={form.produit}
              onChange={(e) => patch('produit', e.target.value)}
                            style={themed({
                width: '100%',
                padding: '12px',
                background: 'bg-secondary',
                border: '1px solid border',
                borderRadius: '8px',
                color: 'text-primary',
                fontSize: '1rem'
              })}
              placeholder="Description du produit/service"
            />
          </div>
          
          <div>
                        <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '8px', fontWeight: 600 })}>Cible Client</label>
            <input
              type="text"
              value={form.cible}
              onChange={(e) => patch('cible', e.target.value)}
                            style={themed({
                width: '100%',
                padding: '12px',
                background: 'bg-secondary',
                border: '1px solid border',
                borderRadius: '8px',
                color: 'text-primary',
                fontSize: '1rem'
              })}
              placeholder="Client cible"
            />
          </div>
        </div>

        {/* Élite File Upload */}
                <div style={themed({ marginBottom: '24px' })}>
          <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '8px', fontWeight: 600 })}>
            Documents de référence (optionnel)
          </label>
                    <div style={themed({
            border: '2px dashed border',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            background: 'bg-secondary',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          })}>
            <input
              type="file"
              multiple
              onChange={(e) => importFiles(e.target.files)}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                            <div style={themed({ fontSize: '3rem', marginBottom: '16px' })}>📤</div>
                            <div style={themed({ color: 'text-primary', fontWeight: 600, marginBottom: '8px' })}>
                {uploadLoading ? 'Traitement...' : 'Glissez les fichiers ou cliquez pour uploader'}
              </div>
                            <div style={themed({ color: 'text-muted', fontSize: '0.9rem' })}>
                PDF, DOC, XLS acceptés — Maximum 10 MB
              </div>
            </label>
          </div>
                    {uploadedFiles.length > 0 && (
            <div style={themed({ marginTop: '16px' })}>
                            <div style={themed({ color: 'text-secondary', fontSize: '0.9rem', marginBottom: '8px' })}>
                Fichiers uploadés: {uploadedFiles.length}
              </div>
              {uploadedFiles.map((file, i) => (
                                <div key={i} style={themed({ 
                  padding: '8px 12px', 
                  background: 'bg-secondary', 
                  borderRadius: '6px', 
                  marginBottom: '4px',
                  color: 'text-secondary',
                  fontSize: '0.85rem'
                })}>
                  📎 {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Élite Sections Selection */}
                <div style={themed({ marginBottom: '24px' })}>
          <h3 style={themed({ color: 'text-primary', marginBottom: '16px' })}>Sections à générer</h3>
          <div style={themed({ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px' 
          })}>
            {SECTIONS.map(section => (
                            <label key={section.id} style={themed({ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px',
                background: 'bg-secondary',
                borderRadius: '12px',
                cursor: 'pointer',
                border: enabled[section.id] ? `2px solid ${section.color}` : '2px solid transparent',
                transition: 'all 0.3s ease'
              })}>
                <input
                  type="checkbox"
                  checked={enabled[section.id]}
                  onChange={() => setEnabled(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                  style={{ accentColor: section.color }}
                />
                <div>
                                    <div style={themed({ color: 'text-primary', fontWeight: 600 })}>{section.icon} {section.label}</div>
                                    <div style={themed({ color: 'text-muted', fontSize: '0.8rem' })}>
                    {section.id === 'slides' ? 'Slides investor' : 'Section complète'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Élite Actions */}
                <div style={themed({ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' })}>
          <button
            onClick={generate}
            disabled={loading}
            title={!form.nom || !form.secteur ? 'Astuce : remplir Nom et Secteur produit des résultats plus précis' : ''}
                        style={themed({
              padding: '16px 32px',
              background: loading ? 'text-muted' : 'linear-gradient(135deg, #F0B429, #F59E0B)',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(240, 180, 41, 0.3)'
            })}
          >
            {loading ? `⏳ Génération... ${progress}%` : '🚀 Générer Business Plan Élite'}
          </button>

          {(!form.nom || !form.secteur) && !loading && (
                        <span style={themed({ color: 'text-muted', fontSize: '0.85rem' })}>
              💡 Remplissez <strong>Nom</strong> + <strong>Secteur</strong> pour un résultat calibré (sinon l'IA utilise des hypothèses génériques).
            </span>
          )}

          {Object.keys(results).length > 0 && (
            <button
              onClick={exportPDF}
                            style={themed({
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: 'text-primary',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
              })}
            >
              📄 Exporter PDF Élite
            </button>
          )}
        </div>
      </div>

      {/* Élite Results */}
      {Object.keys(results).length > 0 && (
        <div id="business-plan-content">
                    <div style={themed({
            background: 'bg-card',
            border: '1px solid border',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px'
          })}>
                        <h2 style={themed({ color: 'text-primary', marginBottom: '24px' })}>Résultats Élite</h2>
            
            {/* Élite Tabs */}
                        <div style={themed({ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '24px',
              borderBottom: '2px solid border',
              paddingBottom: '0px'
            })}>
              {SECTIONS.filter(s => results[s.id]).map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                                    style={themed({
                    padding: '12px 20px',
                    background: activeTab === section.id ? section.color + '20' : 'transparent',
                    color: activeTab === section.id ? section.color : 'text-muted',
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderBottom: activeTab === section.id ? `2px solid ${section.color}` : '2px solid transparent'
                  })}
                >
                  {section.icon} {section.label}
                </button>
              ))}
            </div>

            {/* Élite Tab Content */}
            {SECTIONS.filter(s => results[s.id]).map(section => (
              activeTab === section.id && (
                                <SectionCard
                  key={section.id}
                  section={section}
                  result={results[section.id]}
                  enabled={enabled[section.id]}
                  onToggle={(id) => setEnabled(prev => ({ ...prev, [id]: !prev[id] }))}
                  accent={section.color}
                  c={section.color}
                  themed={themed}
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* Élite Footer */}
            <div style={themed({
        textAlign: 'center',
        padding: '32px',
        background: 'bg-card',
        border: '1px solid border',
        borderRadius: '16px'
      })}>
                <div style={themed({ color: 'text-muted', fontSize: '0.9rem', marginBottom: '16px' })}>
          Business Plan Élite — Propulsé par Abawi IA
        </div>
                <div style={themed({
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          color: 'text-secondary',
          fontSize: '0.85rem'
        })}>
          <div>📋 10 Sections Exhaustives</div>
          <div>⚡ Abawi IA</div>
          <div>📄 Export PDF Pro</div>
          <div>💰 Analyse Financière 3 Ans</div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
