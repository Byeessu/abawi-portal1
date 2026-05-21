import { useState, useRef, useCallback } from 'react'
import { exportToPDF } from '../../lib/generatePDF'
import { callGroqJSON, callGroq } from '../../lib/groqClient'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import FileContextUpload from '../../components/FileContextUpload'
import TokenCounter from '../../components/TokenCounter'

/* ═══════════════════════════════════════════
   ABAWI Exégètika — Moteur d'exégèse totale
   ═══════════════════════════════════════════ */

const HISTORY_KEY = 'exegetika_history_v2'

const MODES = [
  { id: 'auto', label: 'Auto-détecté', emoji: '🔍', desc: 'Détection intelligente selon le contenu — mot, phrase, document ou concept' },
  { id: 'word', label: 'Mot / Terme', emoji: '📖', desc: 'Étymologie, sémantique, évolution, registres' },
  { id: 'phrase', label: 'Phrase / Verse', emoji: '📜', desc: 'Syntaxe, contexte, interprétations, intertextualité' },
  { id: 'document', label: 'Document', emoji: '📄', desc: 'Synthèse, structure, points critiques, biais' },
  { id: 'theme', label: 'Thème / Concept', emoji: '🌐', desc: 'Dimensions, philosophie, débats, applications' },
]

const DEPTHS = [
  { id: 'essentiel', label: 'Essentiel', color: '#22c55e', desc: 'Synthèse ultra-condensée' },
  { id: 'intermediaire', label: 'Intermédiaire', color: '#3b82f6', desc: 'Contexte + étymologie' },
  { id: 'expert', label: 'Expert', color: '#a855f7', desc: 'Analyse complète avec sources' },
  { id: 'strategique', label: 'Stratégique', color: '#f59e0b', desc: 'Applications & scénarios' },
]

const LANGUAGES = [
  { code: 'auto', label: 'Auto-détecté' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'la', label: 'Latin' },
  { code: 'el', label: 'Grec' },
  { code: 'he', label: 'Hébreu' },
  { code: 'ar', label: 'Arabe' },
  { code: 'wo', label: 'Wolof' },
]

const DOMAINS = [
  { id: 'general', label: 'Général' },
  { id: 'religious', label: 'Religieux / Spirituel' },
  { id: 'philosophical', label: 'Philosophique' },
  { id: 'legal', label: 'Juridique' },
  { id: 'economic', label: 'Économique' },
  { id: 'political', label: 'Politique / Géopolitique' },
  { id: 'scientific', label: 'Scientifique / Technique' },
  { id: 'literary', label: 'Littéraire / Artistique' },
]

/* ── Détection automatique du mode selon le contenu ── */
function autoDetectMode(query, hasContext) {
  const t = (query || '').trim()
  if (!t && hasContext) return 'document'
  if (!t) return 'word'

  const words = t.split(/\s+/).filter(Boolean)
  const charCount = t.length
  const lineCount = t.split('\n').filter(l => l.trim()).length
  const sentenceEnders = (t.match(/[.!?…;:]+/g) || []).length

  // Long text or multi-line → document
  if (charCount > 500 || lineCount > 3 || sentenceEnders > 4) return 'document'

  // Sentence structure with punctuation → phrase/verse
  if (sentenceEnders >= 1 && words.length >= 5) return 'phrase'

  // Multi-word abstract concept (2-6 words, no sentence punctuation) → theme
  if (words.length >= 2 && words.length <= 6) return 'theme'

  // Single word or short term → word
  return 'word'
}

/* ── Prompts système par mode ── */
function buildSystemPrompt(mode, domain) {
  const domainBlock = domain !== 'general'
    ? `DOMAINE SPÉCIALISÉ: Privilégiez l'angle ${DOMAINS.find(d=>d.id===domain).label.toLowerCase()} dans toutes les analyses pertinentes.`
    : ''

  const base = `Tu es ABAWI Exégètika — moteur d'exégèse et d'analyse herméneutique de niveau académique doctoral. Tu ne produis aucun remplissage. Chaque section doit apporter une valeur concrète et vérifiable.`

  const modePrompts = {
    word: `${base}\nMODE: ANALYSE DE MOT / TERME\n${domainBlock}\nSTRUCTURE JSON REQUISE:\n{\n  "executiveSummary": "Définition en 1 phrase + usage clé",\n  "sections": [\n    { "id": "etymology", "title": "Origines & Étymologie", "content": "Racines linguistiques (latin, grec, arabe, hébreu, langues africaines si pertinent), formes anciennes, première attestation, évolution phonétique." },\n    { "id": "semantic", "title": "Sémantique & Évolution", "content": "Sens originel → sens actuel(s). Développement sémantique. Registres : soutenu, courant, familier, technique, argot, religieux. Synonymes et antonymes avec nuances." },\n    { "id": "morphology", "title": "Morphologie & Construction", "content": "Décomposition (préfixe, suffixe, racine), familles dérivées, composés et collocations fréquentes." },\n    { "id": "contexts", "title": "Contextes d'Usage", "content": "Domaines d'emploi (juridique, religieux, scientifique, littéraire, quotidien). Exemples illustrant chaque registre. Connotations selon le contexte." },\n    { "id": "contemporary", "title": "Usages Contemporains", "content": "Emplois actuels dans la presse, réseaux sociaux, business, technologie. Évolution récente. Tendances." },\n    { "id": "crosslinguistic", "title": "Équivalents & Traductions", "content": "Traductions dans 4-6 langues avec nuances. Faux-amis. Équivalents culturels." }\n  ],\n  "confidence": { "facts": [], "hypotheses": [], "uncertainties": [] }\n}\nRÈGLES: Jamais de contenu vide.`,

    phrase: `${base}\nMODE: ANALYSE DE PHRASE / VERSET / TEXTE COURT\n${domainBlock}\nSTRUCTURE JSON REQUISE:\n{\n  "executiveSummary": "Synthèse de l'unité de sens en 2-3 lignes",\n  "sections": [\n    { "id": "syntax", "title": "Structure & Syntaxe", "content": "Analyse grammaticale, type de phrase, constructions remarquables (chiasme, parallélisme), figures de style." },\n    { "id": "immediateContext", "title": "Contexte Immédiat", "content": "Texte qui précède et suit, circonstances de production (auteur, date, destinataire), intention communicative." },\n    { "id": "historicalContext", "title": "Contexte Historique & Culturel", "content": "Époque, civilisation, événements historiques de référence, coutumes, codes sociaux implicites." },\n    { "id": "interpretations", "title": "Niveaux d'Interprétation", "content": "Littérale, spirituelle/allégorique, historico-critique, exégèse narrative, intertextualité avec d'autres textes." },\n    { "id": "theological", "title": "Dimensions Théologiques / Philosophiques", "content": "Concepts religieux ou philosophiques, implications doctrinales, débats historiques, grandes écoles d'interprétation." },\n    { "id": "reception", "title": "Réception & Influence", "content": "Lecture au fil des siècles, citations célèbres, influence sur littérature, art, politique, loi. Traductions célèbres." },\n    { "id": "application", "title": "Application Contemporaine", "content": "Relevance aujourd'hui : éthique, politique, psychologie, management. Exemples concrets d'application moderne." }\n  ],\n  "confidence": { "facts": [], "hypotheses": [], "uncertainties": [] }\n}`,

    document: `${base}\nMODE: ANALYSE DE DOCUMENT / TEXTE LONG\n${domainBlock}\nSTRUCTURE JSON REQUISE:\n{\n  "executiveSummary": "Synthèse exécutive (3-5 lignes max)",\n  "sections": [\n    { "id": "structure", "title": "Structure & Architecture", "content": "Plan détaillé, articulation logique, progression argumentative, transitions, chapitres/sections clés." },\n    { "id": "coreArguments", "title": "Arguments & Thèses Centrales", "content": "Proposition principale, arguments majeurs (3-5), preuves avancées, force logique." },\n    { "id": "criticalPoints", "title": "Points Critiques & Failles", "content": "Présupposés non démontrés, biais identifiables, sophismes, contradictions internes, omissions significatives." },\n    { "id": "contextualization", "title": "Contextualisation", "content": "Moment historique de rédaction, position de l'auteur, public visé, influences intellectuelles, réaction contemporaine." },\n    { "id": "relevance", "title": "Relevance & Portée", "content": "Impact sur le domaine concerné, citations et réfutations ultérieures, héritage intellectuel, utilité actuelle." },\n    { "id": "recommendations", "title": "Recommandations de Lecture", "content": "Comment aborder ce texte selon le profil (débutant, expert, décideur), œuvres complémentaires, points à vérifier." }\n  ],\n  "confidence": { "facts": [], "hypotheses": [], "uncertainties": [] }\n}`,

    theme: `${base}\nMODE: ANALYSE DE THÈME / CONCEPT\n${domainBlock}\nSTRUCTURE JSON REQUISE:\n{\n  "executiveSummary": "Définition opérationnelle du concept",\n  "sections": [\n    { "id": "definition", "title": "Définition & Frontières", "content": "Définition précise, distinctions avec concepts voisins, ambiguïtés courantes, évolution de la définition." },\n    { "id": "dimensions", "title": "Dimensions Multiples", "content": "Philosophique, économique, sociale, politique, psychologique, technologique, religieuse. Pour chaque : 2-3 lignes concrètes." },\n    { "id": "evolution", "title": "Évolution Historique", "content": "Naissance du concept, tournants majeurs, penseurs clés, contextes qui ont transformé sa signification. Chronologie des mutations." },\n    { "id": "currentDebates", "title": "Débats Actuels", "content": "Controverses contemporaines, écoles opposées, arguments de chaque camp, consensus émergents, zones d'ombre." },\n    { "id": "applications", "title": "Applications Concrètes", "content": "Business, politique, technologie, santé, éducation, Afrique et monde. Cas d'étude concrets." },\n    { "id": "futures", "title": "Scénarios & Tendances", "content": "Évolution prévisible à 5-10 ans, risques de dérive, opportunités, impacts sur la société." }\n  ],\n  "confidence": { "facts": [], "hypotheses": [], "uncertainties": [] }\n}`
  }

  return modePrompts[mode] || modePrompts.theme
}

/* ── Helpers ── */
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(item) {
  const h = [item, ...getHistory()].slice(0, 30)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
}
function deleteHistoryItem(id) {
  const h = getHistory().filter(x => x.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
  return h
}
function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function parseSections(raw) {
  if (!raw) return []
  if (typeof raw === 'string') {
    const lines = raw.split('\n')
    const secs = []
    let current = null
    for (const line of lines) {
      const m = line.match(/^##+\s+(.+)$/)
      if (m) {
        if (current) secs.push(current)
        current = { title: m[1], content: '' }
      } else if (current) {
        current.content += line + '\n'
      }
    }
    if (current) secs.push(current)
    return secs
  }
  if (Array.isArray(raw)) return raw
  return []
}
function sectionIcon(id) {
  const map = {
    etymology: '🔍', semantic: '🧠', morphology: '🏗', contexts: '🌍', contemporary: '📡',
    crosslinguistic: '🌐', syntax: '✍', immediateContext: '📌', historicalContext: '⏳',
    interpretations: '🔮', theological: '✝☪☸', reception: '📢', application: '🎯',
    structure: '🏛', coreArguments: '⚖', criticalPoints: '⚡', contextualization: '📍',
    relevance: '🔥', recommendations: '💡', definition: '📐', dimensions: '🧩',
    evolution: '📈', currentDebates: '💬', applications: '🚀', futures: '🔭'
  }
  return map[id] || '📄'
}
function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    .replace(/^### (.+)$/gm, '<h4 style="margin:18px 0 8px;font-size:1.05rem;font-weight:800;color:var(--gold)">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin:20px 0 10px;font-size:1.15rem;font-weight:800;color:#C084FC">$1</h3>')
    .replace(/^- (.+)$/gm, '<li style="margin:6px 0 6px 18px;color:var(--text-secondary)">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:6px 0 6px 18px;list-style-type:decimal;color:var(--text-secondary)">$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.split('\n\n').map(p => p.trim().startsWith('<') ? p : `<p style="margin:10px 0;line-height:1.7">${p}</p>`).join('')
  return html
}

/* ═══════════════════════════════════════════
   Composant Principal
   ═══════════════════════════════════════════ */
export default function AbawiExegetika() {
  const [query, setQuery] = useState('')
  const [context, setContext] = useState('')
  const [mode, setMode] = useState('auto')
  const [depth, setDepth] = useState('expert')
  const [language, setLanguage] = useState('auto')
  const [domain, setDomain] = useState('general')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [detectedMode, setDetectedMode] = useState(null)
  const [history, setHistory] = useState(() => getHistory())
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef(null)

  const fileSlug = `exegetika-${Date.now()}`
  const activeDepth = DEPTHS.find(d => d.id === depth)

  const runAnalysis = useCallback(async () => {
    if (!query.trim() && !context.trim()) return
    setLoading(true); setError(''); setResult(null); setActiveTab('summary')
    try {
      const effectiveMode = mode === 'auto' ? autoDetectMode(query, !!context) : mode
      if (mode === 'auto') setDetectedMode(effectiveMode)
      else setDetectedMode(null)

      const system = buildSystemPrompt(effectiveMode, domain)
      const depthLabel = DEPTHS.find(d => d.id === depth)?.label || depth
      const modeLabel = MODES.find(m => m.id === effectiveMode)?.label || effectiveMode
      const langLabel = LANGUAGES.find(l => l.code === language)?.label || language

      const prompt = `SUJET À EXÉGÉSER:\n${query || '(analyse du document fourni uniquement)'}\n\nMODE D'ANALYSE: ${modeLabel}\nNIVEAU: ${depthLabel}\nLANGUE: ${langLabel}\n${domain !== 'general' ? `DOMAINE: ${DOMAINS.find(d => d.id === domain)?.label}` : ''}\n\n${context ? `CONTEXTE:\n${context.slice(0, 12000)}\n` : ''}\n\nINSTRUCTIONS:\n1. Adapte la structure au mode "${effectiveMode}".\n2. Pour niveau "${depth}": ${depth === 'essentiel' ? 'synthèse très courte, 2-3 sections max' : depth === 'intermediaire' ? 'ajoute étymologie/contexte principal' : depth === 'strategique' ? 'privilégie applications concrètes et scénarios' : 'analyse complète avec toutes les sections, sources et distinctions factuelles'}.\n3. Chaque section doit contenir du contenu substantiel.\n4. Réponds en JSON valide avec la structure demandée dans le system prompt.\n5. Dans "confidence", liste 3-5 faits certains, 2-3 hypothèses probables, 1-2 incertitudes.`

      let data
      try {
        data = await callGroqJSON(prompt, { maxTokens: 5000, temperature: 0.25, system })
      } catch {
        // network / API error — fallback plain text
      }
      if (!data) {
        const raw = await callGroq(prompt, { maxTokens: 5000, temperature: 0.25, system })
        data = { executiveSummary: '', sections: parseSections(raw), confidence: { facts: [], hypotheses: [], uncertainties: [] } }
      }
      const parsed = {
        executiveSummary: data?.executiveSummary || data?.summary || '',
        sections: Array.isArray(data?.sections) ? data.sections : parseSections(data?.sections || data?.content || ''),
        confidence: data?.confidence || { facts: [], hypotheses: [], uncertainties: [] },
      }
      setResult(parsed)
      const effectiveModeForHistory = mode === 'auto' ? autoDetectMode(query, !!context) : mode
      const historyItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, query: query.slice(0,120), mode: effectiveModeForHistory, depth, domain, timestamp: Date.now(), summary: parsed.executiveSummary.slice(0,200) }
      saveHistory(historyItem)
      setHistory(getHistory())
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) { setError(e.message || 'Erreur lors de l\'analyse. Réessayez.') }
    finally { setLoading(false) }
  }, [query, context, mode, depth, language, domain])

  const loadFromHistory = useCallback((item) => {
    setQuery(item.query); setMode(item.mode); setDepth(item.depth); setDomain(item.domain)
    setShowHistory(false); setResult(null)
  }, [])

  const confidenceMeta = (type) => {
    const map = { facts: { color: '#22c55e', label: 'Fait', icon: '✓' }, hypotheses: { color: '#f59e0b', label: 'Hypothèse', icon: '◐' }, uncertainties: { color: '#ef4444', label: 'Incertain', icon: '?' } }
    return map[type] || map.facts
  }

  const labelStyle = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, display: 'block' }
  const selectStyle = { width: '100%', padding: '9px 12px', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '0.88rem', cursor: 'pointer' }

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 32px) 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
      <ToolInfoPanel toolName="ABAWI Exégètika" icon="🧬" description="Analyse exégétique totale — origines, contextes, interprétations, évolutions, applications"
        benefits={['Analysez un mot : étymologie profonde, racines, sémantique, registres, évolution', 'Analysez une phrase ou un verset : syntaxe, contexte historique, interprétations multiples', 'Analysez un document : structure, arguments, failles logiques, contextualisation', 'Analysez un thème : dimensions philosophiques, économiques, débats, scénarios futurs', '4 niveaux de profondeur + 8 domaines spécialisés']}
        howToUse={['Choisissez le mode d\'analyse (Mot, Phrase, Document, Thème)', 'Saisissez le texte à exégéser', 'Affinez : langue source, domaine spécialisé, niveau de profondeur', 'Cliquez sur « Exégéser » — l\'IA produit une analyse structurée en onglets', 'Naviguez entre les sections : Résumé, Origines, Contextes, Interprétations, Applications']}
        tips={['Le mode « Phrase / Verse » est idéal pour les textes sacrés, poétiques ou juridiques', 'Le mode « Mot » décode jusqu\'aux racines indo-européennes, sémitiques ou africaines', 'Le domaine « Religieux » active des dimensions herméneutiques et théologiques', 'Le niveau « Stratégique » transforme toute analyse en plan d\'action concret']}
      />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1a1033 0%,#2d1b69 50%,#1a1033 100%)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 24, padding: '36px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle,rgba(168,85,247,0.2) 0%,transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 30, width: 120, height: 120, background: 'radial-gradient(circle,rgba(236,72,153,0.15) 0%,transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(168,85,247,0.2)', borderRadius: 16, padding: '16px 20px', border: '1px solid rgba(168,85,247,0.3)', backdropFilter: 'blur(10px)' }}>
            <span style={{ fontSize: '3rem' }}>🧬</span>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'rgba(168,85,247,0.9)', borderRadius: 20, marginBottom: 10 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Exégèse Totale & Herméneutique</span>
            </div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.5px' }}>ABAWI Exégètika</h1>
            <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 560 }}>
              Décodez les strates cachées du langage. Du mot isolé au document entier,
              en passant par le verset et le concept — chaque niveau de sens révélé.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              {['Étymologie','Contextes','Interprétations','Évolution','Applications'].map((t,i) => (
                <span key={i} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div style={{ display: 'grid', gap: 18 }}>
        <div>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Mode d'analyse</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setResult(null) }}
                style={{ padding: '16px 14px', borderRadius: 14, border: mode===m.id ? '2px solid #A855F7' : '1px solid var(--border)', background: mode===m.id ? 'rgba(168,85,247,0.12)' : 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all .2s', boxShadow: mode===m.id ? '0 4px 16px rgba(168,85,247,0.15)' : 'none' }}>
                <span style={{ fontSize: '1.6rem' }}>{m.emoji}</span>
                <div><div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 3 }}>{m.label}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.desc}</div></div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
          <div><label style={labelStyle}>Langue source</label><select value={language} onChange={e=>setLanguage(e.target.value)} style={selectStyle}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
          <div><label style={labelStyle}>Domaine</label><select value={domain} onChange={e=>setDomain(e.target.value)} style={selectStyle}>{DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
          <div><label style={labelStyle}>Profondeur</label><select value={depth} onChange={e=>setDepth(e.target.value)} style={selectStyle}>{DEPTHS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button onClick={runAnalysis} disabled={loading} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#A855F7,#9333EA)', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Analyse…' : 'Exégéser'}</button>
            <button onClick={() => setShowHistory(v=>!v)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>📚</button>
          </div>
        </div>

        {mode === 'auto' && query.trim() && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.8px' }}>Mode détecté :</span>
            {(() => { const dm = autoDetectMode(query, !!context); const m = MODES.find(x => x.id === dm); return m ? <span style={{ padding:'3px 10px', borderRadius:20, background:'rgba(168,85,247,0.15)', color:'#C084FC', fontSize:'0.75rem', fontWeight:700 }}>{m.emoji} {m.label}</span> : null })()}
          </div>
        )}
        <textarea value={query} onChange={e=>setQuery(e.target.value)} rows={mode==='document'?8:5}
          placeholder={
            mode==='auto' ? "Entrez un mot, une phrase, un texte ou un thème — le mode est détecté automatiquement…"
            : mode==='word' ? "Entrez un mot (ex: 'sabbat', 'ubuntu', 'jihad', 'sagesse')…"
            : mode==='phrase' ? "Collez un verset, vers ou phrase (ex: 'Au commencement était le Verbe…')…"
            : mode==='document' ? "Collez le texte complet, ou uploadez un fichier ci-dessous…"
            : "Décrivez le thème (ex: 'Justice sociale', 'Souveraineté numérique')…"
          }
          style={{ width:'100%',padding:14,borderRadius:12,background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)',resize:'vertical',boxSizing:'border-box',fontSize:'0.95rem',lineHeight:1.6,minHeight:mode==='document'||mode==='auto'?140:100 }} />

        <FileContextUpload onExtracted={setContext} label="Document contextuel (optionnel)" hint="PDF, Word ou texte pour enrichir l'analyse" />

        {error && <div style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:12,padding:'14px 18px',color:'#ef4444',fontSize:'0.9rem' }}>⚠ {error}</div>}
      </div>

      {/* Historique */}
      {showHistory && (
        <div style={{ marginTop: 24, background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'20px 24px' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
            <h3 style={{ margin:0,fontSize:'1.05rem',fontWeight:800 }}>Historique ({history.length})</h3>
            <button onClick={()=>{setHistory([]);localStorage.setItem(HISTORY_KEY,'[]');setShowHistory(false)}} style={{ fontSize:'0.78rem',color:'#ef4444',background:'none',border:'none',cursor:'pointer' }}>Tout effacer</button>
          </div>
          {history.length===0 ? <p style={{ color:'var(--text-secondary)',fontSize:'0.85rem' }}>Aucune analyse dans l'historique.</p> : (
            <div style={{ display:'grid',gap:8 }}>
              {history.map(item => (
                <div key={item.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-secondary)' }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:'0.88rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{item.query}</div>
                    <div style={{ fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:2 }}>{MODES.find(m=>m.id===item.mode)?.label} · {DEPTHS.find(d=>d.id===item.depth)?.label} · {formatDate(item.timestamp)}</div>
                    {item.summary && <div style={{ fontSize:'0.78rem',color:'var(--text-secondary)',marginTop:4,lineHeight:1.4 }}>{item.summary}…</div>}
                  </div>
                  <button onClick={()=>loadFromHistory(item)} style={{ padding:'6px 12px',borderRadius:8,border:'1px solid #A855F7',background:'rgba(168,85,247,0.1)',color:'#C084FC',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',whiteSpace:'nowrap' }}>Recharger</button>
                  <button onClick={()=>setHistory(deleteHistoryItem(item.id))} style={{ padding:'4px 8px',borderRadius:6,border:'none',background:'none',color:'#ef4444',fontSize:'1.1rem',cursor:'pointer' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div ref={resultRef} style={{ marginTop: 32 }}>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',borderBottom:'1px solid var(--border)',paddingBottom:10,marginBottom:18 }}>
            <button onClick={()=>setActiveTab('summary')} style={{ padding:'8px 14px',borderRadius:10,border:activeTab==='summary'?'1.5px solid #A855F7':'1px solid transparent',background:activeTab==='summary'?'rgba(168,85,247,0.12)':'transparent',color:activeTab==='summary'?'#C084FC':'var(--text-secondary)',fontWeight:activeTab==='summary'?800:600,fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}><span>📋</span> Résumé</button>
            {(result.sections||[]).map(s => (
              <button key={s.id} onClick={()=>setActiveTab(s.id)} style={{ padding:'8px 14px',borderRadius:10,border:activeTab===s.id?'1.5px solid #A855F7':'1px solid transparent',background:activeTab===s.id?'rgba(168,85,247,0.12)':'transparent',color:activeTab===s.id?'#C084FC':'var(--text-secondary)',fontWeight:activeTab===s.id?800:600,fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}><span>{sectionIcon(s.id)}</span> {s.title}</button>
            ))}
            <button onClick={()=>setActiveTab('confidence')} style={{ padding:'8px 14px',borderRadius:10,border:activeTab==='confidence'?'1.5px solid #A855F7':'1px solid transparent',background:activeTab==='confidence'?'rgba(168,85,247,0.12)':'transparent',color:activeTab==='confidence'?'#C084FC':'var(--text-secondary)',fontWeight:activeTab==='confidence'?800:600,fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}><span>◐</span> Fiabilité</button>
            <div style={{ marginLeft:'auto',display:'flex',gap:8 }}>
              <button onClick={()=>exportToPDF('exegetika-output',fileSlug)} style={{ padding:'8px 14px',borderRadius:10,border:'1px solid rgba(168,85,247,0.4)',background:'rgba(168,85,247,0.1)',color:'#C084FC',fontWeight:700,fontSize:'0.78rem',cursor:'pointer' }}>Export PDF</button>
            </div>
          </div>

          <div id="exegetika-output">
            {activeTab==='summary' && (
              <div style={{ background:'linear-gradient(135deg,rgba(168,85,247,0.08),rgba(236,72,153,0.04))',border:'1px solid rgba(168,85,247,0.2)',borderRadius:16,padding:'24px 28px' }}>
                <h2 style={{ margin:'0 0 12px',fontSize:'1.15rem',fontWeight:800,color:'#C084FC' }}>Résumé Exécutif</h2>
                <p style={{ margin:0,fontSize:'1rem',lineHeight:1.7,color:'var(--text-primary)' }}>{result.executiveSummary || 'Aucun résumé disponible.'}</p>
                <div style={{ marginTop:16,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center' }}>
                  {detectedMode ? (
                    <>
                      <span style={{ padding:'4px 10px',borderRadius:20,background:'rgba(168,85,247,0.08)',color:'#9b6dcc',fontSize:'0.72rem',fontWeight:600,border:'1px dashed rgba(168,85,247,0.35)' }}>🔍 Auto</span>
                      <span style={{ padding:'4px 10px',borderRadius:20,background:'rgba(168,85,247,0.15)',color:'#C084FC',fontSize:'0.75rem',fontWeight:700 }}>{MODES.find(m=>m.id===detectedMode)?.emoji} {MODES.find(m=>m.id===detectedMode)?.label}</span>
                    </>
                  ) : (
                    <span style={{ padding:'4px 10px',borderRadius:20,background:'rgba(168,85,247,0.15)',color:'#C084FC',fontSize:'0.75rem',fontWeight:700 }}>{MODES.find(m=>m.id===mode)?.emoji} {MODES.find(m=>m.id===mode)?.label}</span>
                  )}
                  <span style={{ padding:'4px 10px',borderRadius:20,background:activeDepth?`${activeDepth.color}22`:'rgba(255,255,255,0.06)',color:activeDepth?.color||'#fff',fontSize:'0.75rem',fontWeight:700 }}>{activeDepth?.label}</span>
                </div>
              </div>
            )}

            {(result.sections||[]).map(sec => activeTab===sec.id && (
              <div key={sec.id} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'24px 28px' }}>
                <h2 style={{ margin:'0 0 16px',fontSize:'1.1rem',fontWeight:800,color:'var(--text-primary)' }}>{sec.title}</h2>
                <div style={{ lineHeight:1.75,color:'var(--text-primary)',fontSize:'0.95rem' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(sec.content || 'Aucun contenu pour cette section.') }} />
              </div>
            ))}

            {activeTab==='confidence' && (
              <div style={{ display:'grid',gap:16 }}>
                {(['facts','hypotheses','uncertainties']).map(type => {
                  const meta = confidenceMeta(type)
                  const items = (result.confidence?.[type] || [])
                  return (
                    <div key={type} style={{ background:'var(--bg-card)',border:`1px solid ${meta.color}33`,borderRadius:16,padding:'18px 22px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                        <span style={{ background:`${meta.color}22`,color:meta.color,padding:'3px 8px',borderRadius:8,fontSize:'0.75rem',fontWeight:800 }}>{meta.icon} {meta.label}</span>
                        <span style={{ fontSize:'0.8rem',color:'var(--text-secondary)' }}>{items.length} élément(s)</span>
                      </div>
                      {items.length===0 ? <p style={{ color:'var(--text-secondary)',fontSize:'0.85rem',margin:0 }}>Aucun élément dans cette catégorie.</p> : (
                        <ul style={{ margin:0,padding:0,listStyle:'none' }}>
                          {items.map((it,i) => (
                            <li key={i} style={{ padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'flex-start',gap:10 }}>
                              <span style={{ color:meta.color,fontWeight:800,fontSize:'0.9rem',marginTop:2 }}>{meta.icon}</span>
                              <span style={{ color:'var(--text-primary)',fontSize:'0.9rem',lineHeight:1.6 }}>{typeof it==='string' ? it : it.text || JSON.stringify(it)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
