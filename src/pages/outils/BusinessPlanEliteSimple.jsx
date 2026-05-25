import { useState } from 'react';
import { exportToPDF } from '../../lib/generatePDF';
import { extractFilesText } from '../../lib/fileExtract';
import { useBackgroundJob } from '../../hooks/useBackgroundJob';
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useToolAccess } from '../../hooks/useToolAccess'

import { callGroq as groqCall } from '../../lib/groqClient'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import TokenCounter from '../../components/TokenCounter'
import ToolAccessHeader from '../../components/ToolAccessHeader'

const ACCENT = 'var(--accent)'
const GOLD = 'var(--accent)'
const GREEN = 'var(--accent2)'
const RED = 'var(--red)'

const BP_SYSTEM = "Tu es Associé Senior (Partner) dans un cabinet de conseil stratégique tier-1 (McKinsey / BCG / Bain niveau Afrique). Tu élabores des business plans EXHAUSTIFS, CHIFFRÉS, ULTRA-DÉTAILLÉS, niveau dossier d'investissement Series A/B. Standards : profondeur analytique maximale, hypothèses explicites, benchmarks sectoriels, projections justifiées, narration convaincante. Tu rédiges en français, écrits riches et professionnels. CRITIQUE : chaque champ texte doit être DÉVELOPPÉ (jamais une phrase courte sauf labels), chaque liste doit contenir AU MOINS 5 éléments substantiels. Tu réponds TOUJOURS et UNIQUEMENT avec du json pur valide, sans markdown, sans bloc ```json, sans préambule, sans explication. Commence directement par { ou [ et termine par } ou ]."

async function groqJSON(prompt, maxTokens = 3000) {
  const msgs = [
    { role: 'system', content: BP_SYSTEM },
    { role: 'user', content: prompt + '\n\nReponds exclusivement avec du json valide. Commence par { ou [ et termine par } ou ].' }
  ]
  return await groqCall(msgs, { maxTokens, temperature: 0.15 })
}

function safeJSON(text, fallback) {
  try {
    let s = String(text || '').trim()
    // Supprime les blocs markdown ```json ... ```
    s = s.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').replace(/```/g, '')
    // Extrait le premier objet ou tableau JSON
    const m = s.match(/(\[[\s\S]*\]|\{[\s\S]*\})/s)
    const candidate = m ? m[0] : s
    return JSON.parse(candidate)
  } catch { return fallback }
}

function BarChart({ series, accent }) {
  if (!series?.length) return null
  const max = Math.max(...series.map(s => s.value || 0), 1)
  return (
    <div style={{ padding: '8px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
        {series.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, height: '100%', justifyContent: 'flex-end' }}>
            {s.label_value && <div style={{ fontSize: '0.65rem', color: accent, fontWeight: 800, textAlign: 'center', marginBottom: 6, whiteSpace: 'nowrap' }}>{s.label_value}</div>}
            <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: `linear-gradient(180deg, ${accent}, ${accent}80)`, height: `${Math.max((s.value / max) * 82, 6)}%`, minHeight: 6, boxShadow: `0 0 10px ${accent}35` }} />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', paddingBottom: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskMatrix({ risks, accent }) {
  if (!risks?.length) return null
  const lvl = s => {
    const k = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return { haute: 3, eleve: 3, critique: 3, forte: 3, moyenne: 2, modere: 2, moderee: 2, basse: 1, faible: 1, low: 1 }[k] || 2
  }
  const cellColor = (p, i) => { const sc = p * i; return sc >= 6 ? '#EF4444' : sc >= 3 ? '#F0B429' : '#22C55E' }
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, paddingLeft: 58 }}>
        {['Faible impact', 'Impact moyen', 'Impact élevé'].map(l => (
          <div key={l} style={{ flex: 1, textAlign: 'center', fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[3, 2, 1].map(prob => (
          <div key={prob} style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
            <div style={{ width: 54, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
              {['', 'Basse', 'Moy.', 'Haute'][prob]}
            </div>
            {[1, 2, 3].map(impact => {
              const c = cellColor(prob, impact)
              const items = risks.filter(r => lvl(r.probabilite) === prob && lvl(r.impact) === impact)
              return (
                <div key={impact} style={{ flex: 1, minHeight: 52, background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 8, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {items.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.58rem', color: c, fontWeight: 700, background: `${c}22`, padding: '2px 5px', borderRadius: 3, lineHeight: 1.3 }}>
                      {String(r.risque || r._cat || '').slice(0, 30)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: '0.62rem', fontWeight: 700 }}>
        {[['#22C55E', 'Faible'], ['#F0B429', 'Modéré'], ['#EF4444', 'Critique']].map(([c, l]) => (
          <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function PremiumSlide({ slide, index, total, accent }) {
  if (!slide) return null
  const t = accent || '#3B82F6'
  const rawBullets = slide.points_cles || slide.bullets || slide.contenu_principal || []
  const arr = Array.isArray(rawBullets) ? rawBullets : typeof rawBullets === 'string' ? rawBullets.split(/[·•\n]+/).filter(Boolean) : []
  return (
    <div style={{ background: 'linear-gradient(135deg,#07091a 0%,#0d1b3e 55%,#0f2550 100%)', borderRadius: 16, padding: 'clamp(24px,4vw,44px) clamp(28px,5vw,56px)', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: `1px solid ${t}28`, boxShadow: `0 8px 40px ${t}15` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${t}, ${t}60)` }} />
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${t}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 16, right: 22, fontSize: '0.6rem', color: 'rgba(255,255,255,0.22)', fontWeight: 700 }}>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
      <div style={{ fontSize: '0.6rem', color: t, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 14, opacity: 0.85 }}>Slide {slide.numero || index + 1}</div>
      <h2 style={{ color: '#fff', fontSize: 'clamp(1.1rem,2.2vw,1.6rem)', fontWeight: 900, lineHeight: 1.2, margin: '0 0 12px', maxWidth: 620 }}>{slide.titre || `Section ${index + 1}`}</h2>
      {slide.sous_titre && <div style={{ color: t, fontSize: '0.9rem', fontWeight: 700, marginBottom: 18, opacity: 0.88 }}>{slide.sous_titre}</div>}
      {arr.length > 0 && (
        <ul style={{ margin: '0 0 auto', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {arr.slice(0, 5).map((b, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              <span style={{ color: t, fontWeight: 900, flexShrink: 0, marginTop: 2 }}>◆</span>
              {typeof b === 'object' ? (b.point || b.v || JSON.stringify(b)) : String(b)}
            </li>
          ))}
        </ul>
      )}
      {(slide.message_cle || slide.kpi_cle || slide.highlight) && (
        <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: `${t}18`, border: `1px solid ${t}45`, borderRadius: 20, color: t, fontSize: '0.8rem', fontWeight: 800, alignSelf: 'flex-start' }}>
          ★ {slide.message_cle || slide.kpi_cle || slide.highlight}
        </div>
      )}
    </div>
  )
}

function makeSectionFallback(id, form) {
  const name = form.nom || 'votre entreprise'
  const sector = form.secteur || 'votre secteur'
  if (id === 'slides') return { slides: [
    { numero: 1, titre: name, sous_titre: sector, points_cles: [form.mission || 'Vision stratégique', form.produit || 'Produit innovant', form.cible || 'Marché cible', form.investissement ? `Levée: ${form.investissement}` : 'Levée en cours'] },
    { numero: 2, titre: 'Le Problème', sous_titre: 'Opportunité de marché', points_cles: ['Marché insuffisamment servi', 'Besoins non couverts localement', 'Coûts élevés des solutions actuelles', 'Fenêtre stratégique ouverte'] },
    { numero: 3, titre: 'Notre Solution', sous_titre: form.produit || '', points_cles: ['Innovation adaptée au contexte africain', 'Déploiement rapide sans infrastructure lourde', 'Prix compétitifs pour PME', 'Support local dédié'] },
  ]}
  if (id === 'financial') return { projections: { annee1: { ca: form.ca1 || '', marge_brute: '', ebitda: '', resultat_net: '' }, annee2: { ca: form.ca2 || '', marge_brute: '', ebitda: '', resultat_net: '' }, annee3: { ca: form.ca3 || '', marge_brute: '', ebitda: '', resultat_net: '' } }, hypothese: {}, flux_tresorerie: {}, besoin_financement: { montant: form.investissement || '', usage: '' } }
  if (id === 'executive') return { pitch: `${name} est une entreprise du secteur ${sector} en Afrique de l'Ouest.`, vision: `Devenir le leader du ${sector} en Afrique à horizon 5 ans.`, mission: form.mission || '' }
  if (id === 'risks') return { risques_marche: [], risques_operationnels: [], risques_financiers: [], plan_contingence: [] }
  return {}
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
${src ? src.slice(0, 15000) : '(Aucun document fourni — générer avec hypothèses stratégiques réalistes et les marquer explicitement)'}

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

Genere la PROPOSITION DE VALEUR. JSON strict, champs developpes:
{
  "probleme": "probleme cible chiffre en FCFA (5-8 phrases)",
  "douleurs_clients": ["d1","d2","d3","d4","d5"],
  "gains_clients": ["g1","g2","g3","g4","g5"],
  "solution": "description complete produit/service (6-10 phrases)",
  "value_proposition_statement": "Pour [cible] qui [besoin], notre [produit] est [categorie] qui [benefice]",
  "avantages": [{"avantage":"nom","description":"3-5 phrases","quantification":"X%"}],
  "proposition_unique": "USP en 5-8 phrases",
  "moat": "douve concurrentielle (5-8 phrases)",
  "validation_marche": "preuves validation (5-8 phrases)",
  "scalabilite": "potentiel scalabilite (5-8 phrases)",
  "ameliorations": ["s1","s2","s3","s4","s5"]
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

Genere le PLAN COMMERCIAL & GO-TO-MARKET. JSON strict, champs developpes:
{
  "phase_lancement": {"geographie":"zone pilote","duree":"X mois","objectif_clients":"X","budget":"FCFA","kpi_succes":"4-6 phrases"},
  "strategie_acquisition": "strategie multi-canaux (6-10 phrases)",
  "canaux": [{"canal":"nom precis","priorite":"haute|moyenne|basse","investissement":"FCFA/mois","cac_attendu":"FCFA","tactique":"3-5 phrases"}],
  "funnel_conversion": [{"etape":"nom","kpi":"metric","cible":"%","tactique":"levier"}],
  "strategie_prix": {"positionnement":"premium|mid|low","structure":"paliers tarifaires","psychologique":"3-5 phrases"},
  "cycle_vente": {"duree":"moyenne","etapes":["Prospection","Qualification","Demo","Proposition","Closing"],"taux_conversion_par_etape":[{"etape":"Demo","taux":"40%"}]},
  "equipe_commerciale": [{"role":"SDR/AE/CSM","effectif_an1":1,"effectif_an3":6,"cibles":"quota FCFA"}],
  "marketing_mix_4P": {"produit":"3-5 phrases","prix":"3-5 phrases","place_distribution":"3-5 phrases","promotion":"3-5 phrases"},
  "branding_communication": "strategie marque et contenu (5-8 phrases)",
  "objectifs": [{"annee":"An1","ca":"FCFA","clients":"X","croissance_pct":"%"}],
  "fidelisation_strategie": "retention et referral (5-8 phrases)",
  "ameliorations":["s1","s2","s3","s4","s5"]
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

Genere le PLAN FINANCIER 3 ans. JSON strict, montants en FCFA:
{
  "hypotheses_macro": {"inflation":"%","taux_emprunt":"%","tcam_secteur":"%","note":"3-5 phrases"},
  "hypothese": {"croissance_ca":"%","marge_brute":"%","marge_nette":"%","note":"3-5 phrases"},
  "projections": {
    "annee1":{"ca":"FCFA","cogs":"FCFA","marge_brute":"FCFA","opex":"FCFA","ebitda":"FCFA","resultat_net":"FCFA"},
    "annee2":{"ca":"FCFA","cogs":"FCFA","marge_brute":"FCFA","opex":"FCFA","ebitda":"FCFA","resultat_net":"FCFA"},
    "annee3":{"ca":"FCFA","cogs":"FCFA","marge_brute":"FCFA","opex":"FCFA","ebitda":"FCFA","resultat_net":"FCFA"}
  },
  "projections_mensuelles_an1":[{"mois":"M1","ca":"FCFA","cash_in":"FCFA","cash_out":"FCFA","cash_position":"FCFA"}],
  "besoin_financement": {"montant":"FCFA","usage":"5-8 phrases","repartition_usage":[{"poste":"R&D","pct":35,"montant":"FCFA"}],"structure":"equity/dette"},
  "flux_tresorerie": {"annee1":"FCFA","annee2":"FCFA","annee3":"FCFA","point_mort_mois":"M+X","cash_burn":"FCFA/mois"},
  "scenarios": [
    {"nom":"Pessimiste","ca_an3":"FCFA","ebitda_an3":"FCFA","commentaire":"3-5 phrases"},
    {"nom":"Realiste","ca_an3":"FCFA","ebitda_an3":"FCFA","commentaire":"3-5 phrases"},
    {"nom":"Optimiste","ca_an3":"FCFA","ebitda_an3":"FCFA","commentaire":"3-5 phrases"}
  ],
  "valorisation": {"methode":"DCF","valorisation_post_money_an3":"FCFA","tri_attendu":"%"},
  "ameliorations": ["s1","s2","s3","s4","s5"]
}`
}

function promptRisks(form, src) {
  return `${ctx(form, src)}

Genere l ANALYSE DES RISQUES. JSON strict, 4-6 risques par categorie:
{
  "risques_marche": [{"risque":"nom","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases"}],
  "risques_operationnels": [{"risque":"nom","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases"}],
  "risques_financiers": [{"risque":"nom","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases"}],
  "risques_juridiques": [{"risque":"nom","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases"}],
  "risques_reputation": [{"risque":"nom","probabilite":"haute|moyenne|basse","impact":"critique|moyen|faible","description":"3-5 phrases","mitigation":"3-5 phrases"}],
  "plan_contingence": ["mesure 1","mesure 2","mesure 3","mesure 4","mesure 5"],
  "business_continuity_plan": "plan continuite (5-8 phrases)",
  "ameliorations": ["s1","s2","s3","s4","s5"]
}`
}

function promptSlides(form, src) {
  return `${ctx(form, src)}

Genere un PITCH DECK de 12 slides. JSON strict, contenu narratif riche:
{
  "slides": [
    {"numero":1,"titre":"Cover","accent":"#0EA5E9","contenu":"6-10 lignes: tagline, positionnement, contexte"},
    {"numero":2,"titre":"Probleme","accent":"#EF4444","contenu":"8-12 lignes: TAM du probleme, cout social, chiffres"},
    {"numero":3,"titre":"Solution","accent":"#22C55E","contenu":"8-12 lignes: description, benefices, schema"},
    {"numero":4,"titre":"Marche","accent":"#F59E0B","contenu":"8-12 lignes: TAM/SAM/SOM FCFA, drivers"},
    {"numero":5,"titre":"Produit","accent":"#8B5CF6","contenu":"8-12 lignes: parcours utilisateur, USP"},
    {"numero":6,"titre":"Traction","accent":"#06B6D4","contenu":"8-12 lignes: utilisateurs, CA, NPS"},
    {"numero":7,"titre":"Business Model","accent":"#EC4899","contenu":"8-12 lignes: revenus, CAC/LTV"},
    {"numero":8,"titre":"GTM","accent":"#0EA5E9","contenu":"8-12 lignes: acquisition, canaux, scaling"},
    {"numero":9,"titre":"Competition","accent":"#F97316","contenu":"8-12 lignes: matrice, differenciation, moat"},
    {"numero":10,"titre":"Equipe","accent":"#10B981","contenu":"8-12 lignes: fondateurs, advisors"},
    {"numero":11,"titre":"Financials","accent":"#3B82F6","contenu":"8-12 lignes: CA An1/2/3 FCFA, EBITDA"},
    {"numero":12,"titre":"Ask","accent":"#F0B429","contenu":"8-12 lignes: montant, valorisation, usage"}
  ],
  "ameliorations": ["s1","s2","s3","s4","s5"]
}`
}

// Module-level prompt builder map (used by generate + retrySection)
const PROMPT_BUILDERS = {
  executive: promptExecutive, company: promptCompany, market: promptMarket,
  value: promptValue, model: promptModel, gtm: promptGTM,
  operations: promptOperations, financial: promptFinancial,
  risks: promptRisks, slides: promptSlides,
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
          <DataTable accent={accent} headers={['Canal', 'Priorité', 'Invest./mois', 'CAC', 'Tactique']}
            rows={data.canaux.map(c => [c.canal, c.priorite, c.investissement, c.cac_attendu, c.tactique])} />
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
      {(hyp.croissance_ca || hyp.marge_brute || hyp.marge_nette || hyp.delai_paiement) && (
              <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' })}>
          {hyp.croissance_ca && <MetricCard label="Croissance CA" value={hyp.croissance_ca} icon="📈" color="#22C55E" trend="+" themed={themed} />}
          {hyp.marge_brute && <MetricCard label="Marge brute" value={hyp.marge_brute} icon="📊" color={accent} themed={themed} />}
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
              ['Marge brute', ...years.map(y => stripMD(proj[y]?.marge_brute))],
              ['EBITDA', ...years.map(y => stripMD(proj[y]?.ebitda))],
              ['Résultat net', ...years.map(y => stripMD(proj[y]?.resultat_net))],
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
function SectionCard({ section, result, enabled, onToggle, onRetry, accent, c, themed }) {
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
      <div style={themed({ background: 'bg-card', border: `2px solid ${accent}20`, borderRadius: '16px', padding: '20px', marginBottom: '20px' })}>
        <div style={themed({ display: 'flex', alignItems: 'center', gap: '12px' })}>
          <div style={themed({ fontSize: '1.5rem', filter: 'grayscale(0.5)' })}>{section.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={themed({ color: 'text-primary', fontWeight: 700, fontSize: '1rem' })}>{section.label}</div>
            <div style={themed({ color: 'text-muted', fontSize: '0.85rem' })}>Résultat partiel — cliquez pour regénérer</div>
          </div>
          {onRetry && (
            <button onClick={() => onRetry(section.id)} style={{ padding: '8px 16px', background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: '8px', color: accent, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              ⟳ Regénérer
            </button>
          )}
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
  const { themed } = useThemedStyles();
    const bgJob = useBackgroundJob('business-plan-elite', 'Business Plan Élite')
    const tool = useToolAccess('outils-essentiels', 'business_plan')
  
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
  const [totalSections, setTotalSections] = useState(10)
  const [activeTab, setActiveTab] = useState('executive')
  const [enabled, setEnabled] = useState({ executive: true, company: true, market: true, value: true, model: true, gtm: true, operations: true, financial: true, risks: true, slides: false })
    const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { lastSavedAt, clearDraft } = useDraftAutoSave(
    'abawi-bp-draft',
    { form, enabled },
    { onRestore: (d) => { if (d?.form) setForm(d.form); if (d?.enabled) setEnabled(d.enabled) } }
  )


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
    if (!tool.allowed) { setError(tool.errorMessage || 'Accès restreint'); return }
    const debitRes = await tool.debit()
    if (!debitRes.ok) { setError('Crédits ou quota insuffisants'); return }

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

    const promptBuilders = PROMPT_BUILDERS
    setTotalSections(queue.length)

    const newResults = {}
    let done = 0
    const TOKEN_BUDGET = 5000

    const runSection = async (section) => {
      const builder = promptBuilders[section.id]
      if (!builder) return
      setLoadingStep(`Génération: ${section.label}…`)
      let raw = ''
      const tries = [
        () => groqJSON(builder(form, src), TOKEN_BUDGET),
        () => groqJSON(builder(form, src ? src.slice(0, 1500) : ''), TOKEN_BUDGET),
        () => groqJSON(builder(form, '') + '\n\nReponds UNIQUEMENT avec du json valide.', Math.min(TOKEN_BUDGET, 2500)),
      ]
      for (const attempt of tries) {
        try { raw = await attempt(); if (raw) break } catch { /* try next */ }
      }
      newResults[section.id] = safeJSON(raw, null) || makeSectionFallback(section.id, form)
      done++
      setProgress(Math.round((done / queue.length) * 100))
      setLoadingStep(`${done} / ${queue.length} sections…`)
      setResults(r => ({ ...r, [section.id]: newResults[section.id] }))
    }

    // Process in batches of 3 — balances speed vs rate-limit pressure
    const BATCH = 3
    for (let i = 0; i < queue.length; i += BATCH) {
      await Promise.allSettled(queue.slice(i, i + BATCH).map(runSection))
      if (i + BATCH < queue.length) await new Promise(r => setTimeout(r, 1200))
    }

    setLoadingStep('')
    setLoading(false)
    setProgress(100)
  }

  async function retrySection(sectionId) {
    const section = SECTIONS.find(s => s.id === sectionId)
    const builder = PROMPT_BUILDERS[sectionId]
    if (!section || !builder) return
    setLoadingStep(`Regénération: ${section.label}…`)
    setLoading(true)
    setResults(prev => { const n = { ...prev }; delete n[sectionId]; return n })
    const src = uploadedText
    let raw = ''
    const tries = [
      () => groqJSON(builder(form, src), 5000),
      () => groqJSON(builder(form, src ? src.slice(0, 1500) : ''), 5000),
      () => groqJSON(builder(form, '') + '\n\nReponds UNIQUEMENT avec du json valide.', 2500),
    ]
    for (const attempt of tries) {
      try { raw = await attempt(); if (raw) break } catch { /* try next */ }
    }
    setResults(prev => ({ ...prev, [sectionId]: safeJSON(raw, null) || makeSectionFallback(sectionId, form) }))
    setLoading(false)
    setLoadingStep('')
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
       image="/og-tools/business-plan.jpg"/>
      {/* Info Panel */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
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
      <ToolAccessHeader toolAccess={tool} toolName="Business Plan Élite" />

      {/* ── Business Plan Hero ───────────────────────────── */}
      <style>{`
        @keyframes bpOrbit1{from{transform:rotate(0deg) translateX(76px) rotate(0deg)}to{transform:rotate(360deg) translateX(76px) rotate(-360deg)}}
        @keyframes bpOrbit2{from{transform:rotate(0deg) translateX(122px) rotate(0deg)}to{transform:rotate(-360deg) translateX(122px) rotate(360deg)}}
        @keyframes bpOrbit3{from{transform:rotate(0deg) translateX(168px) rotate(0deg)}to{transform:rotate(360deg) translateX(168px) rotate(-360deg)}}
        @keyframes bpCenterPulse{0%,100%{box-shadow:0 0 0 8px rgba(29,78,216,0.2),0 0 0 20px rgba(29,78,216,0.08)}50%{box-shadow:0 0 0 14px rgba(29,78,216,0.3),0 0 0 32px rgba(29,78,216,0.06)}}
        @keyframes bpPing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.8);opacity:0}}
        @keyframes bpShimmer{0%{background-position:-250% center}100%{background-position:250% center}}
        @keyframes bpFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes bpRingGlow{0%,100%{opacity:.3}50%{opacity:.7}}
        .bp-orb1{animation:bpOrbit1 14s linear infinite}
        .bp-orb1-d1{animation:bpOrbit1 14s -4.67s linear infinite}
        .bp-orb1-d2{animation:bpOrbit1 14s -9.33s linear infinite}
        .bp-orb2{animation:bpOrbit2 22s linear infinite}
        .bp-orb2-d1{animation:bpOrbit2 22s -5.5s linear infinite}
        .bp-orb2-d2{animation:bpOrbit2 22s -11s linear infinite}
        .bp-orb2-d3{animation:bpOrbit2 22s -16.5s linear infinite}
        .bp-orb3{animation:bpOrbit3 32s linear infinite}
        .bp-orb3-d1{animation:bpOrbit3 32s -10.67s linear infinite}
        .bp-orb3-d2{animation:bpOrbit3 32s -21.33s linear infinite}
        .bp-center-icon{animation:bpCenterPulse 3s ease-in-out infinite}
        .bp-ping{animation:bpPing 2.4s ease-out infinite}
        .bp-shimmer-text{background:linear-gradient(90deg,#fff 0%,#93c5fd 40%,#f0b429 65%,#fff 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:bpShimmer 5s linear infinite}
        .bp-fade0{animation:bpFadeUp .55s ease both}
        .bp-fade1{animation:bpFadeUp .55s .12s ease both}
        .bp-fade2{animation:bpFadeUp .55s .24s ease both}
        .bp-fade3{animation:bpFadeUp .55s .36s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}
        .bp-float{animation:bpFloat 4.5s ease-in-out infinite}
        .bp-ring-glow{animation:bpRingGlow 3s ease-in-out infinite}
      `}</style>

      <div style={{ background:'linear-gradient(135deg,#030712 0%,#0b1838 40%,#1e3a8a 72%,#1d4ed8 100%)', borderRadius:24, marginBottom:28, position:'relative', overflow:'hidden', minHeight:280, boxShadow:'0 24px 80px rgba(29,78,216,0.35),inset 0 1px 0 rgba(255,255,255,0.05)' }}>

        {/* Grid texture */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(59,130,246,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.06) 1px,transparent 1px)', backgroundSize:'44px 44px', WebkitMaskImage:'radial-gradient(ellipse 85% 85% at 50% 50%,black 20%,transparent 100%)', maskImage:'radial-gradient(ellipse 85% 85% at 50% 50%,black 20%,transparent 100%)' }} />

        {/* Glow blobs */}
        <div style={{ position:'absolute', top:-80, left:'25%', width:420, height:420, background:'radial-gradient(circle,rgba(29,78,216,0.38) 0%,transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-50, right:'8%', width:300, height:300, background:'radial-gradient(circle,rgba(240,180,41,0.1) 0%,transparent 65%)', pointerEvents:'none' }} />

        {/* ── Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(26px,4vw,46px) clamp(22px,4vw,50px)', maxWidth:500, paddingBottom:'clamp(60px,7vw,78px)' }}>
          <div className="bp-fade0" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', background:'rgba(240,180,41,0.15)', border:'1px solid rgba(240,180,41,0.4)', borderRadius:20, marginBottom:16 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#f0b429', boxShadow:'0 0 8px #f0b429', display:'inline-block' }} />
            <span style={{ fontSize:'0.68rem', fontWeight:800, color:'#f0b429', letterSpacing:'1.6px', textTransform:'uppercase' }}>Outil Premium IA</span>
          </div>

          <h1 className="bp-shimmer-text bp-fade1" style={{ margin:'0 0 14px', fontSize:'clamp(1.7rem,3vw,2.7rem)', fontWeight:900, lineHeight:1.12, letterSpacing:'-0.5px' }}>
            Business Plan Élite
          </h1>

          <p className="bp-fade2" style={{ color:'rgba(255,255,255,0.68)', fontSize:'clamp(0.82rem,1.1vw,0.97rem)', lineHeight:1.7, margin:'0 0 22px', maxWidth:420 }}>
            10 sections stratégiques · Niveau cabinet international · Analyses PESTEL, Porter, valorisation DCF, conformité OHADA
          </p>

          <div className="bp-fade3" style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[{t:'10 Sections',c:'#3b82f6'},{t:'PESTEL · Porter',c:'#10b981'},{t:'DCF 3 ans',c:'#f0b429'},{t:'Pitch Deck',c:'#a78bfa'},{t:'Export PDF',c:'#38bdf8'}].map(({t,c})=>(
              <span key={t} style={{ padding:'5px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, color:c, background:`${c}18`, border:`1px solid ${c}38`, whiteSpace:'nowrap' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Orbital diagram */}
        <div style={{ position:'absolute', right:'clamp(-20px,3vw,60px)', top:'50%', transform:'translateY(-52%)', width:260, height:260, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
          {/* Rings */}
          <div className="bp-ring-glow" style={{ position:'absolute', width:152, height:152, borderRadius:'50%', border:'1px dashed rgba(99,179,237,0.4)' }} />
          <div className="bp-ring-glow" style={{ position:'absolute', width:244, height:244, borderRadius:'50%', border:'1px dashed rgba(59,130,246,0.25)', animationDelay:'-1s' }} />
          <div className="bp-ring-glow" style={{ position:'absolute', width:336, height:336, borderRadius:'50%', border:'1px dashed rgba(59,130,246,0.14)', animationDelay:'-2s' }} />

          {/* Center */}
          <div className="bp-center-icon" style={{ width:62, height:62, borderRadius:'50%', background:'linear-gradient(135deg,#1d4ed8,#0ea5e9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', position:'relative', zIndex:4 }}>
            <div className="bp-ping" style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px solid rgba(59,130,246,0.55)' }} />
            📊
          </div>

          {/* Orbit 1 — 3 icons */}
          {[{cls:'bp-orb1',i:'💰'},{cls:'bp-orb1-d1',i:'📈'},{cls:'bp-orb1-d2',i:'🏦'}].map(({cls,i})=>(
            <div key={cls} className={cls} style={{ position:'absolute', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(10,18,40,0.9)', border:'1px solid rgba(99,179,237,0.55)', boxShadow:'0 2px 14px rgba(29,78,216,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>{i}</div>
            </div>
          ))}

          {/* Orbit 2 — 4 label badges */}
          {[{cls:'bp-orb2',t:'PESTEL',c:'#10b981'},{cls:'bp-orb2-d1',t:'Porter',c:'#3b82f6'},{cls:'bp-orb2-d2',t:'SWOT',c:'#f0b429'},{cls:'bp-orb2-d3',t:'DCF',c:'#a78bfa'}].map(({cls,t,c})=>(
            <div key={cls} className={cls} style={{ position:'absolute', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ padding:'3px 9px', borderRadius:20, background:`${c}22`, border:`1px solid ${c}55`, fontSize:'0.62rem', fontWeight:800, color:c, whiteSpace:'nowrap' }}>{t}</div>
            </div>
          ))}

          {/* Orbit 3 — 3 mini metric cards */}
          {[{cls:'bp-orb3',a:'TAM/SAM',b:'Marché'},{cls:'bp-orb3-d1',a:'Unit Eco',b:'CAC/LTV'},{cls:'bp-orb3-d2',a:'Series A',b:'VC-grade'}].map(({cls,a,b})=>(
            <div key={cls} className={cls} style={{ position:'absolute', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ padding:'4px 9px', borderRadius:8, background:'rgba(10,18,40,0.88)', border:'1px solid rgba(59,130,246,0.28)', backdropFilter:'blur(6px)', fontSize:'0.58rem', lineHeight:1.45, whiteSpace:'nowrap', textAlign:'center' }}>
                <div style={{ fontWeight:700, color:'#93c5fd' }}>{a}</div>
                <div style={{ color:'rgba(255,255,255,0.42)' }}>{b}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom stat bar */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:2, display:'flex', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(5,12,30,0.6)', backdropFilter:'blur(8px)' }}>
          {[{n:'10',l:'Sections stratégiques'},{n:'3',l:'Scénarios financiers'},{n:'12',l:'Slides Pitch Deck'},{n:'100%',l:'Conforme OHADA'}].map(({n,l},i)=>(
            <div key={i} style={{ flex:1, padding:'11px 8px', borderRight:i<3?'1px solid rgba(255,255,255,0.07)':'none', textAlign:'center' }}>
              <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#93c5fd', lineHeight:1 }}>{n}</div>
              <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', marginTop:3, fontWeight:500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Loading bar sticky en haut (visible même après scroll) */}
      {loading && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9998, pointerEvents:'none' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#f0b429,#10b981)', backgroundSize:'200% 100%', width:`${Math.max(progress,5)}%`, transition:'width 0.4s ease', animation: progress < 100 ? 'bpShimmer 2s linear infinite' : 'none' }} />
        </div>
      )}

      {/* Élite Progress */}
      {loading && (
        <div style={{ background:'rgba(15,23,42,0.96)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:16, padding:'20px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:18, backdropFilter:'blur(12px)', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ width:44, height:44, border:'3px solid rgba(59,130,246,0.25)', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'#e2e8f0', fontWeight:700, fontSize:'0.95rem', marginBottom:6 }}>
              Génération en cours… <span style={{ color:'#3b82f6' }}>{progress}%</span>
            </div>
            <div style={{ color:'rgba(148,163,184,0.85)', fontSize:'0.8rem', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{loadingStep || 'Initialisation...'}</div>
            <div style={{ height:4, background:'rgba(59,130,246,0.12)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#3b82f6,#f0b429)', width:`${Math.max(progress,2)}%`, transition:'width 0.4s ease', borderRadius:4 }} />
            </div>
          </div>
          <div style={{ flexShrink:0, textAlign:'center' }}>
            <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#93c5fd' }}>{Math.round(progress / (100 / totalSections)) || 0}<span style={{ color:'rgba(148,163,184,0.5)', fontSize:'0.8rem', fontWeight:400 }}>/{totalSections}</span></div>
            <div style={{ fontSize:'0.6rem', color:'rgba(148,163,184,0.5)', marginTop:2 }}>sections</div>
          </div>
        </div>
      )}

      {/* Élite Error */}
      {error && (
        <div style={themed({
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        })}>
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <span style={{ color: '#EF4444', flex: 1, fontSize: '0.9rem' }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}>✕</button>
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
        
        {/* Élite Form — Grouped sections */}
        <div style={themed({ marginBottom: '28px' })}>
          {/* Group 1 — Identity */}
          <div style={themed({ fontSize: '0.72rem', color: ACCENT, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 })}>
            <span style={{ width: 3, height: 14, background: ACCENT, borderRadius: 2, display: 'inline-block' }} />
            Identité
          </div>
          <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' })}>
            {[
              { key: 'nom', label: 'Nom de l\'entreprise *', placeholder: 'Ex: ABAWI Tech' },
              { key: 'secteur', label: 'Secteur *', placeholder: 'Fintech / EdTech / HealthTech' },
              { key: 'pays', label: 'Pays / Région', placeholder: "Sénégal / Afrique de l'Ouest" },
              { key: 'stade', label: 'Stade', placeholder: 'Startup / Croissance / Scale-up' },
            ].map(f => (
              <div key={f.key}>
                <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '6px', fontWeight: 600, fontSize: '0.82rem' })}>{f.label}</label>
                <input type="text" value={form[f.key]} onChange={e => patch(f.key, e.target.value)}
                  style={themed({ width: '100%', padding: '10px 12px', background: 'bg-secondary', border: `1px solid ${form[f.key] ? ACCENT + '50' : 'var(--border)'}`, borderRadius: '9px', color: 'text-primary', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' })}
                  placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          {/* Group 2 — Product */}
          <div style={themed({ fontSize: '0.72rem', color: GREEN, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 })}>
            <span style={{ width: 3, height: 14, background: GREEN, borderRadius: 2, display: 'inline-block' }} />
            Offre & Marché
          </div>
          <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' })}>
            {[
              { key: 'produit', label: 'Produit / Service', placeholder: 'Description de l\'offre principale' },
              { key: 'cible', label: 'Cible Client', placeholder: 'PME, particuliers, B2B, B2C...' },
              { key: 'mission', label: 'Mission', placeholder: 'Raison d\'être de l\'entreprise' },
              { key: 'investissement', label: 'Besoin Investissement', placeholder: 'Ex: 50 000 000 FCFA' },
            ].map(f => (
              <div key={f.key}>
                <label style={themed({ display: 'block', color: 'text-secondary', marginBottom: '6px', fontWeight: 600, fontSize: '0.82rem' })}>{f.label}</label>
                <input type="text" value={form[f.key]} onChange={e => patch(f.key, e.target.value)}
                  style={themed({ width: '100%', padding: '10px 12px', background: 'bg-secondary', border: `1px solid ${form[f.key] ? GREEN + '50' : 'var(--border)'}`, borderRadius: '9px', color: 'text-primary', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' })}
                  placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* Élite File Upload */}
        <div style={themed({ marginBottom: '24px' })}>
          <div style={themed({ fontSize: '0.72rem', color: 'var(--accent3)', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 })}>
            <span style={{ width: 3, height: 14, background: 'var(--accent3)', borderRadius: 2, display: 'inline-block' }} />
            Documents de référence <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span>
          </div>
          <label htmlFor="file-upload" style={themed({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            border: `2px dashed ${uploadedFiles.length ? 'var(--accent3)' : 'var(--border)'}`,
            borderRadius: '12px', padding: '24px 16px', textAlign: 'center',
            background: uploadedFiles.length ? 'rgba(var(--accent3-rgb,139,92,246),0.05)' : 'bg-secondary',
            cursor: 'pointer', transition: 'all 0.2s'
          })}>
            <input type="file" multiple onChange={(e) => importFiles(e.target.files)} style={{ display: 'none' }} id="file-upload" />
            <span style={{ fontSize: '1.8rem' }}>{uploadLoading ? '⏳' : uploadedFiles.length ? '✅' : '📂'}</span>
            <span style={themed({ color: uploadedFiles.length ? 'var(--accent3)' : 'text-secondary', fontWeight: 600, fontSize: '0.88rem' })}>
              {uploadLoading ? 'Extraction en cours...' : uploadedFiles.length ? `${uploadedFiles.length} fichier(s) chargé(s)` : 'Glissez ou cliquez — PDF, DOCX, XLS'}
            </span>
            {uploadedFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                {uploadedFiles.map((f, i) => (
                  <span key={i} style={themed({ padding: '2px 8px', background: 'var(--bg-primary)', borderRadius: 999, fontSize: '0.72rem', color: 'text-secondary', border: '1px solid var(--border)' })}>📎 {f.name.slice(0, 20)}{f.name.length > 20 ? '…' : ''}</span>
                ))}
              </div>
            )}
          </label>
          <div style={themed({ fontSize: '0.72rem', color: 'text-muted', marginTop: 6 })}>
            ℹ️ Les 8 000 premiers caractères seront utilisés comme contexte. Résumés, études de marché, CV équipe conseillés.
          </div>
        </div>

        {/* Élite Sections Selection */}
        <div style={themed({ marginBottom: '24px' })}>
          <div style={themed({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' })}>
            <div style={themed({ fontSize: '0.72rem', color: 'text-secondary', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' })}>
              Sections à générer ({SECTIONS.filter(s => enabled[s.id]).length}/{SECTIONS.length})
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEnabled(Object.fromEntries(SECTIONS.map(s => [s.id, true])))} style={themed({ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: ACCENT, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 })}>Tout</button>
              <button onClick={() => setEnabled(Object.fromEntries(SECTIONS.map(s => [s.id, false])))} style={themed({ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'text-secondary', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 })}>Aucun</button>
            </div>
          </div>
          <div style={themed({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '8px' })}>
            {SECTIONS.map(section => (
              <label key={section.id} style={themed({
                display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px',
                background: enabled[section.id] ? section.color + '12' : 'bg-secondary',
                borderRadius: '10px', cursor: 'pointer',
                border: `1.5px solid ${enabled[section.id] ? section.color + '60' : 'var(--border)'}`,
                transition: 'all 0.18s'
              })}>
                <input type="checkbox" checked={enabled[section.id]}
                  onChange={() => setEnabled(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                  style={{ accentColor: section.color, width: 15, height: 15 }} />
                <div style={{ flex: 1 }}>
                  <div style={themed({ color: enabled[section.id] ? section.color : 'text-primary', fontWeight: 700, fontSize: '0.82rem' })}>{section.icon} {section.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Élite Actions */}
        <div style={themed({ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' })}>
          <button
            onClick={generate}
            disabled={loading}
            title={!form.nom || !form.secteur ? 'Astuce : remplir Nom et Secteur produit des résultats plus précis' : ''}
            style={themed({
              padding: '14px 28px',
              background: loading ? 'var(--text-muted)' : 'linear-gradient(135deg, #F0B429, #F59E0B)',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(240, 180, 41, 0.35)',
              opacity: loading ? 0.7 : 1
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
          <div style={themed({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 10 })}>
            <h2 style={themed({ color: 'text-primary', margin: 0, fontSize: '1.2rem', fontWeight: 800 })}>
              📋 Résultats — {SECTIONS.filter(s => results[s.id] && !results[s.id].error).length}/{SECTIONS.filter(s => results[s.id]).length} sections
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {SECTIONS.some(s => results[s.id]?.error) && (
                <button
                  onClick={async () => {
                    const failedIds = SECTIONS.filter(s => results[s.id]?.error).map(s => s.id)
                    for (const id of failedIds) {
                      await retrySection(id)
                      if (failedIds.indexOf(id) < failedIds.length - 1) {
                        await new Promise(r => setTimeout(r, 2000))
                      }
                    }
                  }}
                  style={themed({ padding: '8px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', color: '#FCA5A5', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' })}
                >
                  ⟳ Regénérer {SECTIONS.filter(s => results[s.id]?.error).length} section(s)
                </button>
              )}
            </div>
          </div>

            {/* Élite Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
              {SECTIONS.filter(s => results[s.id]).map(section => {
                const hasError = results[section.id]?.error
                return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  style={themed({
                    padding: '10px 18px',
                    background: activeTab === section.id ? section.color + '20' : 'transparent',
                    color: hasError ? '#EF4444' : activeTab === section.id ? section.color : 'text-muted',
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderBottom: activeTab === section.id ? `2px solid ${hasError ? '#EF4444' : section.color}` : '2px solid transparent'
                  })}
                >
                  {hasError ? '⚠️' : section.icon} {section.label}
                </button>
                )
              })}
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
                  onRetry={retrySection}
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
