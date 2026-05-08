import { useState, useRef, useCallback } from 'react'
import '../../styles/ThemeUniversal.css'
import './DissecteurInfosElite.css'
import { supabase } from '../../lib/supabase'
import { exportToPDF } from '../../lib/generatePDF'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { useHistory as useToolHistory } from '../../hooks/useHistory'
import { HISTORY_TOOLS } from '../../lib/historyManager'
import { cleanIAText } from '../../lib/cleanText'
import { groqChatCompletion } from '../../lib/groqClient'

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

const SYSTEM = "Tu es un analyste stratégique senior de niveau cabinet international. Tu réponds UNIQUEMENT avec du JSON valide et strictement structuré, sans balises markdown, sans commentaires, sans explication. Chaque réponse doit apporter de la valeur stratégique réelle, des chiffres concrets, et des insights actionnables."

// Appel via le client Groq centralisé (proxy Netlify + fallback direct)
async function groqJSON(prompt, maxTokens = 4000) {
  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    temperature: 0.18,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: prompt }
    ]
  })
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

function safeJSON(text, fallback) {
  try {
    const s = String(text || '')
    const m = s.match(/(\[[\s\S]*\]|\{[\s\S]*\})/s)
    return m ? JSON.parse(m[0]) : JSON.parse(s)
  } catch { return fallback }
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}
function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

const ACCENT = {
  summary: 'var(--accent2)', strategy: 'var(--accent)', flashcards: 'var(--accent3)',
  quiz: 'var(--accent2)', report: 'var(--accent2)', trends: 'var(--accent3)',
  slides: 'var(--accent)', infographic: 'var(--accent)',
  dictionary: 'var(--accent3)'
}
const TABS = [
  { id: 'summary',    label: 'Résumé Complet',       icon: '📋', tokens: 5000 },
  { id: 'strategy',   label: 'Analyse Stratégique',  icon: '🧠', tokens: 6000 },
  { id: 'dictionary', label: 'Lexique',          icon: '📖', tokens: 4000 },
  { id: 'flashcards', label: 'Flashcards',            icon: '🃏', tokens: 4500 },
  { id: 'quiz',       label: 'Quiz Expert',           icon: '🎯', tokens: 4000 },
  { id: 'report',     label: 'Rapport Expert',        icon: '📊', tokens: 5500 },
  { id: 'trends',     label: 'Tendances & Insights',  icon: '📈', tokens: 4500 },
  { id: 'slides',     label: 'Slides',                icon: '🖼', tokens: 5000 },
  { id: 'infographic',label: 'Infographie',           icon: '🎨', tokens: 4000 },
]

// ─── File extraction ────────────────────────────────────────────────────────
async function fetchUrlText(url) {
  const normalized = url.startsWith('http') ? url : `https://${url}`
  const proxy = `https://r.jina.ai/${normalized}`
  const res = await fetch(proxy)
  if (!res.ok) throw new Error(`URL inaccessible (${res.status}): ${url}`)
  return await res.text()
}

async function extractFileText(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') {
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      let t = ''
      for (let i = 1; i <= Math.min(pdf.numPages, 60); i++) {
        const pg = await pdf.getPage(i)
        t += (await pg.getTextContent()).items.map(x => x.str).join(' ') + '\n'
      }
      return t.trim()
    } catch { return '' }
  }
  if (ext === 'docx' || ext === 'doc') {
    try {
      const m = await import('mammoth')
      return String((await m.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value || '').trim()
    } catch { return '' }
  }
  if (['xlsx', 'xls'].includes(ext)) {
    try {
      const X = await import('xlsx')
      const wb = X.read(await file.arrayBuffer(), { type: 'array' })
      return wb.SheetNames.map(name => `=== Feuille: ${name} ===\n${JSON.stringify(X.utils.sheet_to_json(wb.Sheets[name], { defval: '' }), null, 2)}`).join('\n\n')
    } catch { return '' }
  }
  if (['ppt', 'pptx'].includes(ext)) {
    try {
      const m = await import('mammoth')
      return String((await m.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value || '').trim()
    } catch { return `[Fichier PowerPoint: ${file.name}]` }
  }
  try { return (await file.text()).trim() } catch { return '' }
}

// ─── Prompts ────────────────────────────────────────────────────────────────
function promptSummary(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT ce JSON valide (sans markdown, sans commentaires):\n{"titre":"Titre précis et professionnel du sujet","executive":"Résumé exécutif complet et détaillé en 10-15 phrases. Couvre tous les points clés, le contexte, les enjeux et les conclusions. Style cabinet conseil.","key_points":["Point clé 1 détaillé","Point clé 2 détaillé","Point clé 3 détaillé","Point clé 4 détaillé","Point clé 5 détaillé","Point clé 6 détaillé","Point clé 7 détaillé","Point clé 8 détaillé"],"key_figures":[{"label":"Métrique","value":"Chiffre ou donnée","contexte":"Ce que ça signifie"}],"contexte":"Contexte macro et enjeux en 3-4 phrases","implications":"Implications stratégiques en 3-4 phrases","conclusion":"Conclusion actionnable 4-5 phrases avec next steps","tags":["tag1","tag2","tag3","tag4","tag5","tag6"],"niveau":"débutant|intermédiaire|avancé|expert","domaine":"secteur ou domaine principal"}\n\nGénère au moins 8 key_points et 5 key_figures. Sois exhaustif et précis.`
}

function promptStrategy(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT ce JSON valide (analyse stratégique niveau cabinet international, sans markdown):\n{"titre":"Analyse stratégique: [sujet]","synthese_strategique":"Vue stratégique d'ensemble en 5-7 phrases percutantes","swot":{"forces":["Force 1 avec détail","Force 2","Force 3","Force 4"],"faiblesses":["Faiblesse 1","Faiblesse 2","Faiblesse 3"],"opportunites":["Opportunité 1","Opportunité 2","Opportunité 3","Opportunité 4"],"menaces":["Menace 1","Menace 2","Menace 3"]},"enjeux_strategiques":[{"titre":"Enjeu stratégique","description":"Explication 2 sentences","impact":"élevé|moyen|faible","urgence":"immédiate|court terme|long terme","icon":"emoji"}],"avantages_concurrentiels":["Avantage 1 différenciant","Avantage 2","Avantage 3"],"risques_majeurs":[{"risque":"Description du risque","probabilite":"haute|moyenne|faible","impact":"fort|modéré|faible","mitigation":"Action recommandée"}],"recommandations_strategiques":[{"priorite":1,"action":"Action stratégique précise","rationale":"Pourquoi cette action","impact_attendu":"Résultat tangible attendu","delai":"court|moyen|long terme"}],"quick_wins":["Action rapide et impactante 1","Action rapide 2","Action rapide 3"],"kpis_cles":[{"kpi":"Indicateur","cible":"Valeur cible","delai":"Délai"}]}\n\nGénère au moins 4 enjeux, 3 risques, 4 recommandations classées par priorité.`
}

function promptFlashcards(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT un tableau JSON de flashcards (sans markdown):\n[{"front":"Question directe et précise ?","back":"Réponse complète, pédagogique et mémorisable","category":"Catégorie thématique","difficulty":"easy|medium|hard","emoji":"emoji représentatif","exemple":"Exemple concret ou cas d'usage"}]\n\nGénère exactement 15 flashcards couvrant tous les concepts clés. Varie les types (définition, application, cas, chiffre, concept). Difficulté progressive (5 faciles, 5 moyennes, 5 difficiles).`
}

function promptQuiz(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT un tableau JSON de questions QCM (sans markdown):\n[{"question":"Question précise et non ambiguë ?","options":["Option A détaillée","Option B détaillée","Option C détaillée","Option D détaillée"],"correct":0,"explanation":"Explication pédagogique de la bonne réponse avec contexte","emoji":"emoji","difficulte":"facile|moyen|difficile|expert","categorie":"thème de la question","source_hint":"Indice sur où trouver la réponse dans le texte"}]\n\nGénère exactement 12 questions. Difficulté progressive (3 faciles, 4 moyennes, 3 difficiles, 2 expert). correct = index 0-3.`
}

function promptReport(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT ce JSON (rapport d'expert, sans markdown):\n{"titre":"Titre du rapport expert","sous_titre":"Sous-titre contextuel","synthese":"Synthèse exécutive 5-6 phrases","sections":[{"titre":"Titre section","icon":"emoji","contenu":"Contenu complet 3-4 paragraphes avec données et exemples","points_cles":["Point 1","Point 2","Point 3"],"recommandations":["Recommandation actionnable 1","Recommandation 2","Recommandation 3"],"citation":"Citation ou donnée clé à retenir"}],"kpis":[{"label":"KPI","valeur":"Valeur","tendance":"hausse|baisse|stable","variation":"variation en %","emoji":"emoji","interpretation":"Ce que ça signifie"}],"benchmark":[{"critere":"Critère","score":"x/10","commentaire":"Évaluation"}],"next_steps":[{"etape":"Action concrète","responsable":"Qui","delai":"Quand","impact":"Impact attendu"}],"verdict":"Verdict final en 2-3 phrases très percutantes"}\n\nGénère 5 sections thématiques, 5-6 KPIs, 3 benchmarks, et 4 next steps.`
}

function promptTrends(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT ce JSON (analyse de tendances et insights stratégiques, sans markdown):\n{"titre":"Tendances & Insights: [sujet]","mega_tendances":[{"titre":"Tendance majeure","description":"Explication détaillée 2-3 phrases","horizon":"court|moyen|long terme","force":"faible|modérée|forte|disruptive","icone":"emoji","impact_secteurs":["secteur1","secteur2"],"signaux_faibles":["Signal 1","Signal 2"]}],"disruptions_potentielles":[{"disruption":"Description de la disruption","probabilite":"haute|moyenne|faible","impact":"majeur|modéré|mineur","acteurs_cles":["Acteur 1","Acteur 2"],"fenetre_opportunite":"Délai pour agir"}],"insights":[{"insight":"Insight stratégique percutant","type":"opportunité|risque|observation|rupture","evidence":"Preuve ou donnée supportant l'insight","action":"Ce qu'il faut faire"}],"futur_probable":"Vision du futur dans 5 ans en 3-4 phrases","futur_disruptif":"Vision si disruption majeure en 2-3 phrases","top_3_paris":[{"pari":"Pari stratégique à faire","rationale":"Pourquoi"}]}\n\nGénère 4 méga-tendances, 3 disruptions, 5 insights, 3 paris stratégiques. Sois prospectif et percutant.`
}

function promptSlides(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT un tableau JSON de slides (sans markdown):\n[{"numero":1,"type":"titre|contexte|analyse|données|stratégie|recommandation|conclusion","titre":"Titre impactant de la slide","sous_titre":"Accroche ou contexte","bullets":["Point 1 développé","Point 2 développé","Point 3 développé","Point 4"],"stat_clé":"Chiffre ou donnée marquante à mettre en avant","icon":"emoji","accent":"#code_couleur_hex","note_orateur":"Note confidentielle pour l'orateur en 1-2 phrases"}]\n\nGénère 10 slides professionnelles. Slide 1=titre, slides 2-9=contenu varié (contexte, analyse, données, stratégie, recommandations), slide 10=conclusion avec call-to-action.`
}

function promptInfographic(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT un tableau JSON de cartes infographiques (sans markdown):\n[{"titre":"Titre court percutant","icon":"emoji grand","stat":"Chiffre ou donnée marquante","stat_label":"Libellé du stat","description":"2-3 phrases explicatives riches","points":["Point clé 1","Point clé 2","Point clé 3"],"couleur":"#code_hex","type":"stat|concept|processus|tendance|comparaison|insight","badge":"Label badge optionnel"}]\n\nGénère 10 cartes infographiques variées. Couleurs vives et variées (#22D3EE, #8B5CF6, #22C55E, #F59E0B, #EF4444, #EC4899, #3B82F6, #F97316, #10B981, #A855F7).`
}

function promptDictionary(src) {
  return `SOURCE DOCUMENTAIRE COMPLÈTE:\n${src}\n\n---\nRetourne UNIQUEMENT ce JSON valide (dictionnaire de termes, sans markdown):\n{"titre":"Dictionnaire: [sujet]","description":"Dictionnaire complet des termes et concepts clés pour comprendre le sujet en profondeur","termes":[{"terme":"Terme technique ou concept","categorie":"Technique|Métier|Acronyme|Concept|Industrie","definition":"Définition complète et claire en 2-4 phrases","contexte":"Contexte d'utilisation dans ce domaine","exemple":"Exemple concret d'utilisation","importance":"Pourquoi c'est important","niveau":"débutant|intermédiaire|avancé|expert","relations":["Terme lié 1","Terme lié 2"]}],"acronymes":[{"acronyme":"ABC","signification":"Signification complète","definition":"Définition de ce qu'il représente"}],"voir_aussi":["Concept connexe 1","Concept connexe 2"],"niveau_global":"débutant|intermédiaire|avancé|expert","nb_termes":"15-25"}\n\nGénère 15-25 termes couvrant tous les concepts clés du document :\n- Termes techniques spécifiques au domaine\n- Acronymes et sigles\n- Concepts fondamentaux à comprendre\n- Vocabulaire métier essentiel\n- Niveau de difficulté progressif\nChaque terme doit avoir une définition complète, un contexte d'utilisation, et des relations avec d'autres concepts.`
}

const PROMPTS = { summary: promptSummary, strategy: promptStrategy, dictionary: promptDictionary, flashcards: promptFlashcards, quiz: promptQuiz, report: promptReport, trends: promptTrends, slides: promptSlides, infographic: promptInfographic }
const DEFAULTS = { summary: {}, strategy: {}, dictionary: {}, flashcards: [], quiz: [], report: {}, trends: {}, slides: [], infographic: [] }

// ─── Download bar per section ────────────────────────────────────────────────
function SectionActions({ tabId, data, label }) {
  const [copied, setCopied] = useState(false)
  if (!data) return null
  function flatText(obj) {
    if (typeof obj === 'string') return obj
    if (Array.isArray(obj)) return obj.map(flatText).join('\n')
    if (typeof obj === 'object' && obj !== null) return Object.entries(obj).map(([k, v]) => `${k}: ${flatText(v)}`).join('\n')
    return String(obj)
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      <button
        onClick={() => { copyToClipboard(flatText(data)); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="dissecteur-action-btn dissecteur-action-btn--secondary"
        style={{ color: copied ? 'var(--green)' : 'var(--text-secondary)' }}
      >
        {copied ? '✓ Copié' : '📋 Copier'}
      </button>
      <button
        onClick={() => downloadText(flatText(data), `dissecteur-${tabId}-${Date.now()}.txt`)}
        className="dissecteur-action-btn dissecteur-action-btn--secondary"
      >
        ⬇ TXT
      </button>
      <button
        onClick={() => downloadJSON(data, `dissecteur-${tabId}-${Date.now()}.json`)}
        className="dissecteur-action-btn dissecteur-action-btn--secondary"
      >
        ⬇ JSON
      </button>
      <button
        onClick={() => exportToPDF(`section-${tabId}`, `Dissecteur-${label}-${Date.now()}`)}
        className="dissecteur-action-btn dissecteur-action-btn--primary"
      >
        ⬇ PDF
      </button>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function DissecteurInfosElite() {
  const [sourceType, setSourceType] = useState('text')
  const [sourceText, setSourceText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceUrlsText, setSourceUrlsText] = useState('')
  const [sourceFiles, setSourceFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [enabled, setEnabled] = useState({ summary: true, strategy: true, flashcards: true, quiz: true, report: true, trends: true, slides: false, infographic: true })
  const [results, setResults] = useState({})
  const [loadingStep, setLoadingStep] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem('abawi_dissecteur_v3') || '[]') } catch { return [] } })
  const [error, setError] = useState('')
  const [charCount, setCharCount] = useState(0)
  const dropRef = useRef(null)

  // Hook pour l'historique
  const { save: saveToHistory, retention, setRetention, retentionOptions } = useToolHistory(HISTORY_TOOLS.DISSECTEUR, 'permanent')

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length) { setSourceFiles(prev => [...prev, ...files]); setSourceType('files') }
  }, [])

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  async function getSources() {
    if (sourceType === 'text') return sourceText.trim() ? [sourceText.trim()] : []
    if (sourceType === 'url') return sourceUrl.trim() ? [await fetchUrlText(sourceUrl.trim())] : []
    if (sourceType === 'urls') {
      const urls = String(sourceUrlsText).split(/[\n,;]+/).map(u => u.trim()).filter(Boolean)
      const results = await Promise.allSettled(urls.map(fetchUrlText))
      return results.filter(r => r.status === 'fulfilled').map(r => r.value)
    }
    if (sourceType === 'files' && sourceFiles.length) {
      const results = await Promise.allSettled(sourceFiles.map(extractFileText))
      const extracted = results.map((r, i) => ({ ok: r.status === 'fulfilled' && r.value, text: r.value || '', name: sourceFiles[i]?.name }))
      const failed = extracted.filter(x => !x.ok).map(x => x.name).filter(Boolean)
      if (failed.length) console.warn('[Dissecteur] Fichiers non extraits:', failed.join(', '))
      return extracted.filter(x => x.ok).map(x => x.text)
    }
    return []
  }

  async function dissect() {
    setLoading(true); setError(''); setResults({}); setProgress(0)
    try {
      const sources = (await getSources()).filter(s => s && s.trim().length > 30)
      if (!sources.length) throw new Error(sourceType === 'files' ? `Aucun fichier n'a pu être lu. Formats supportés : PDF, Word (DOCX), Excel, TXT. Vérifiez que les fichiers ne sont pas corrompus.` : 'Source vide ou illisible. Vérifiez votre contenu.')
      const combined = sources.map((s, i) => sources.length > 1 ? `=== SOURCE ${i + 1}: ${sourceFiles[i]?.name || `URL ${i+1}`} ===\n${s}` : s).join('\n\n')
      const src = combined.slice(0, 28000)
      setCharCount(src.length)
      const queue = TABS.filter(t => enabled[t.id])
      let done = 0
      for (const tab of queue) {
        setLoadingStep(`${tab.icon} Génération ${tab.label}...`)
        const raw = await groqJSON(PROMPTS[tab.id](src), tab.tokens)
        const parsed = safeJSON(raw, DEFAULTS[tab.id])
        setResults(prev => ({ ...prev, [tab.id]: parsed }))
        done++; setProgress(Math.round((done / queue.length) * 100))
        setActiveTab(tab.id)
      }
      setLoadingStep('✅ Analyse terminée.')
      const row = { id: `${Date.now()}`, created_at: new Date().toISOString(), src: combined.slice(0, 200), sections: queue.map(t => t.id), chars: src.length }
      const next = [row, ...history].slice(0, 20)
      setHistory(next); localStorage.setItem('abawi_dissecteur_v3', JSON.stringify(next))
      // Sauvegarder dans le gestionnaire d'historique
      saveToHistory({ source: src.slice(0, 500), results, sections: queue.map(t => t.id), chars: src.length }, retention)
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      try { await supabase.from('ai_jobs').insert({ tool: 'dissecteur-elite-v3', job_type: 'analysis', payload: row, created_at: row.created_at }) } catch {}
    } catch (e) { setError(`Erreur : ${e.message}`) }
    finally { setLoading(false) }
  }

  const hasResults = Object.keys(results).length > 0
  const inp = { width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 12px', fontFamily: 'inherit', fontSize: '0.86rem' }

  const totalEnabledSections = TABS.filter(t => enabled[t.id]).length

  return (
    <main className="dissecteur-container">
      {/* Header */}
      <div className="dissecteur-header">
        <div className="dissecteur-header__label">ABAWI 360 / DISSECTEUR ELITE v3</div>
        <h1 className="dissecteur-header__title">Dissecteur d'Informations Elite</h1>
        <p className="dissecteur-header__description">Analyse stratégique de niveau cabinet conseil international. Importez tout document (PDF, DOCX, XLSX, PPT, TXT), URL ou texte. Génère résumé complet, analyse stratégique élite, flashcards, quiz, rapport expert, tendances, slides et infographie.</p>
        <div className="dissecteur-header__badges">
          <span className="dissecteur-badge dissecteur-badge--pdf">📄 PDF</span>
          <span className="dissecteur-badge dissecteur-badge--docx">📝 DOCX</span>
          <span className="dissecteur-badge dissecteur-badge--xlsx">📊 XLSX</span>
          <span className="dissecteur-badge dissecteur-badge--url">🌐 URL</span>
          <span className="dissecteur-badge dissecteur-badge--text">📋 Texte</span>
        </div>
      </div>

    <div className="dissecteur-source-pane">
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Source d'analyse</div>

    {/* Source type selector */}
    <div className="dissecteur-source-grid">
      {[['text', '✍️ Texte'], ['url', '🌐 URL'], ['urls', '🔗 Multi-URLs'], ['files', '📂 Fichiers']].map(([id, lbl]) => (
        <button
          key={id}
          onClick={() => setSourceType(id)}
          className={`dissecteur-source-btn ${sourceType === id ? 'dissecteur-source-btn--active' : ''}`}
        >
          {lbl}
        </button>
      ))}
    </div>

    {/* Source inputs */}
    {sourceType === 'text' && (
      <div>
        <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} rows={10} placeholder="Collez article, rapport, transcript, notes, données..." className="dissecteur-textarea" />
        {sourceText && <div className="dissecteur-char-count">{sourceText.length.toLocaleString()} caractères</div>}
      </div>
    )}
    {sourceType === 'url' && (
      <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://exemple.com/article" className="dissecteur-textarea" style={{ height: '42px' }} />
    )}
    {sourceType === 'urls' && (
      <div>
        <textarea value={sourceUrlsText} onChange={e => setSourceUrlsText(e.target.value)} rows={6} placeholder={'https://url1.com\nhttps://url2.com\nhttps://url3.com'} className="dissecteur-textarea" />
        <div className="dissecteur-url-count">{sourceUrlsText.split(/[\n,;]+/).filter(u => u.trim()).length} URLs</div>
      </div>
    )}
    {sourceType === 'files' && (
      <div>
        <div className="dissecteur-upload-area" onClick={() => document.getElementById('file-input-dissecteur').click()}>
          <div className="dissecteur-upload-icon">📂</div>
          <div className="dissecteur-upload-title">Cliquer ou glisser-déposer</div>
          <div className="dissecteur-upload-hint">PDF, DOCX, XLSX, TXT, CSV, HTML, JSON, PPT</div>
        </div>
        <input id="file-input-dissecteur" type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.xls,.html,.ppt,.pptx" onChange={e => setSourceFiles(prev => [...prev, ...Array.from(e.target.files || [])])} style={{ display: 'none' }} />
        {sourceFiles.length > 0 && (
          <div className="dissecteur-file-list">
            {sourceFiles.map((f, i) => (
              <div key={i} className="dissecteur-file-item">
                <span className="dissecteur-file-icon">{f.name.endsWith('.pdf') ? '📄' : f.name.endsWith('.docx') || f.name.endsWith('.doc') ? '📝' : f.name.endsWith('.xlsx') || f.name.endsWith('.xls') ? '📊' : '📋'}</span>
                <span className="dissecteur-file-name">{f.name}</span>
                <span className="dissecteur-file-size">{(f.size / 1024).toFixed(0)}ko</span>
                <button onClick={() => setSourceFiles(prev => prev.filter((_, j) => j !== i))} className="dissecteur-file-remove">×</button>
              </div>
            ))}
            <button onClick={() => setSourceFiles([])} className="dissecteur-clear-all-btn">🗑 Tout effacer</button>
          </div>
        )}
      </div>
    )}

    {/* Sections selector */}
          <div style={{ marginTop: 18, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Livrables ({totalEnabledSections}/{TABS.length})</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEnabled(Object.fromEntries(TABS.map(t => [t.id, true])))} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>Tout</button>
                <button onClick={() => setEnabled(Object.fromEntries(TABS.map(t => [t.id, false])))} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}>Aucun</button>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 5 }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setEnabled(p => ({ ...p, [t.id]: !p[t.id] }))}
                  className={`dissecteur-tab-btn dissecteur-tab-btn--${t.id} ${enabled[t.id] ? 'dissecteur-tab-btn--active' : ''}`}
                  data-enabled={enabled[t.id]}
                >
                  <span style={{ fontSize: '1rem' }}>{t.icon}</span>
                  <span style={{ flex: 1 }}>{t.label}</span>
                  <span style={{
                    fontSize: '0.65rem',
                    background: enabled[t.id] ? ACCENT[t.id] + '28' : 'var(--border)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    color: enabled[t.id] ? ACCENT[t.id] : 'var(--text-muted)'
                  }}>{enabled[t.id] ? 'ON' : 'OFF'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Launch button */}
          <button
            onClick={dissect}
            disabled={loading}
            className="dissecteur-analyze-btn"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? `${loadingStep} (${progress}%)` : `🚀 Lancer le Dissecteur Elite`}
          </button>
          {loading && (
            <div style={{ marginTop: 8, background: 'var(--bg-primary)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent3), var(--accent2))', width: `${progress}%`, transition: 'width 0.5s ease', borderRadius: 999 }} />
            </div>
          )}
          {error && <div className="dissecteur-error">{error}</div>}

          {/* Export all */}
          {hasResults && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button
                onClick={() => exportToPDF('dissecteur-export', `Dissecteur-Elite-${Date.now()}`)}
                className="dissecteur-action-btn dissecteur-action-btn--primary"
                style={{ flex: 1 }}
              >
                ⬇ PDF Complet
              </button>
              <button
                onClick={() => downloadJSON(results, `dissecteur-all-${Date.now()}.json`)}
                className="dissecteur-action-btn dissecteur-action-btn--secondary"
                style={{ flex: 1 }}
              >
                ⬇ JSON Tout
              </button>
            </div>
          )}
          {charCount > 0 && <div className="dissecteur-char-count">{charCount.toLocaleString()} caractères analysés</div>}
        </div>

        {/* ─── Results panel ─────────────────────────────────────────────────── */}
        {hasResults && (
          <div id="dissecteur-export">
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {TABS.filter(t => results[t.id] !== undefined).map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`dissecteur-tab-btn dissecteur-tab-btn--${t.id}`}
                  style={{
                    border: `1px solid ${activeTab === t.id ? ACCENT[t.id] : 'var(--border)'}`,
                    background: activeTab === t.id ? ACCENT[t.id] + '18' : 'var(--bg-card)',
                    color: activeTab === t.id ? ACCENT[t.id] : 'var(--text-secondary)'
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Active section */}
            <div id={`section-${activeTab}`}>
              {activeTab === 'summary' && results.summary && (
                <><SectionActions tabId="summary" data={results.summary} label="Resume" /><SummaryPanel data={results.summary} /></>
              )}
              {activeTab === 'strategy' && results.strategy && (
                <><SectionActions tabId="strategy" data={results.strategy} label="Strategie" /><StrategyPanel data={results.strategy} /></>
              )}
              {activeTab === 'dictionary' && results.dictionary && (
                <><SectionActions tabId="dictionary" data={results.dictionary} label="Dictionnaire" /><DictionaryPanel data={results.dictionary} /></>
              )}
              {activeTab === 'flashcards' && results.flashcards && (
                <><SectionActions tabId="flashcards" data={results.flashcards} label="Flashcards" /><FlashcardsPanel cards={results.flashcards} /></>
              )}
              {activeTab === 'quiz' && results.quiz && (
                <><SectionActions tabId="quiz" data={results.quiz} label="Quiz" /><QuizPanel questions={results.quiz} /></>
              )}
              {activeTab === 'report' && results.report && (
                <><SectionActions tabId="report" data={results.report} label="Rapport" /><ReportPanel data={results.report} /></>
              )}
              {activeTab === 'trends' && results.trends && (
                <><SectionActions tabId="trends" data={results.trends} label="Tendances" /><TrendsPanel data={results.trends} /></>
              )}
              {activeTab === 'slides' && results.slides && (
                <><SectionActions tabId="slides" data={results.slides} label="Slides" /><SlidesPanel slides={results.slides} /></>
              )}
              {activeTab === 'infographic' && results.infographic && (
                <><SectionActions tabId="infographic" data={results.infographic} label="Infographie" /><InfographicPanel cards={results.infographic} /></>
              )}
            </div>
          </div>
        )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 24, border: '1px solid var(--border)', borderRadius: 14, padding: 16, background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Historique ({history.length})</div>
            <button onClick={() => { setHistory([]); localStorage.removeItem('abawi_dissecteur_v3') }} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.72rem' }}>Effacer</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.map(h => (
              <div key={h.id} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{new Date(h.created_at).toLocaleDateString('fr-FR')}</span>
                {(h.src || '').slice(0, 45)}...
                {h.chars && <span style={{ marginLeft: 6, color: 'var(--accent)' }}>{(h.chars / 1000).toFixed(1)}k</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

// ─── SUMMARY PANEL ──────────────────────────────────────────────────────────
function SummaryPanel({ data }) {
  const d = data || {}
  const color = ACCENT.summary
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${color}18, var(--bg-secondary))`, border: `1px solid ${color}35`, borderRadius: 16, padding: '24px 28px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {d.domaine && <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700 }}>🏢 {d.domaine}</span>}
          {d.niveau && <span style={{ padding: '3px 10px', borderRadius: 999, background: color + '20', border: `1px solid ${color}40`, color, fontSize: '0.7rem', fontWeight: 700 }}>📊 {d.niveau}</span>}
          {(d.tags || []).map((tag, i) => <span key={i} style={{ padding: '3px 10px', borderRadius: 999, background: color + '15', border: `1px solid ${color}30`, color, fontSize: '0.7rem', fontWeight: 600 }}>{tag}</span>)}
        </div>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 16px', fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', fontWeight: 900 }}>{d.titre || 'Analyse Complète'}</h2>
        <div style={{ fontSize: '0.7rem', color, fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>RÉSUMÉ EXÉCUTIF</div>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{d.executive}</div>
      </div>

      {/* Contexte + Implications */}
      {(d.contexte || d.implications) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {d.contexte && (
            <div style={{ background: 'var(--bg-primary)', border: `1px solid ${color}25`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5, marginBottom: 8 }}>🌍 CONTEXTE</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.84rem' }}>{d.contexte}</div>
            </div>
          )}
          {d.implications && (
            <div style={{ background: 'var(--bg-primary)', border: `1px solid ${color}25`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5, marginBottom: 8 }}>⚡ IMPLICATIONS</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.84rem' }}>{d.implications}</div>
            </div>
          )}
        </div>
      )}

      {/* Key figures */}
      {(d.key_figures || []).length > 0 && (
        <div>
          <div style={{ color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5, marginBottom: 10 }}>CHIFFRES CLÉS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
            {d.key_figures.map((kf, i) => (
              <div key={i} style={{ background: 'var(--bg-primary)', border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color, marginBottom: 3 }}>{kf.value || kf.valeur || '—'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>{kf.label || kf.libelle}</div>
                {kf.contexte && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{kf.contexte}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key points */}
      {(d.key_points || []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}25`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5, marginBottom: 12 }}>POINTS CLÉS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {d.key_points.map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ minWidth: 26, height: 26, borderRadius: '50%', background: color + '22', border: `1px solid ${color}40`, color, fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', lineHeight: 1.65, paddingTop: 3 }}>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      {d.conclusion && (
        <div style={{ background: color + '12', border: `1px solid ${color}35`, borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${color}` }}>
          <div style={{ color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5, marginBottom: 8 }}>🎯 CONCLUSION & NEXT STEPS</div>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.88rem' }}>{d.conclusion}</div>
        </div>
      )}
    </div>
  )
}

// ─── STRATEGY PANEL ─────────────────────────────────────────────────────────
function StrategyPanel({ data }) {
  const d = data || {}
  const color = ACCENT.strategy
  const [activeView, setActiveView] = useState('swot')
  const swot = d.swot || {}
  const IMPACT_COLOR = { élevé: 'var(--red)', modéré: 'var(--accent)', faible: 'var(--accent2)', moyen: 'var(--accent)' }
  const URG_COLOR = { immédiate: 'var(--red)', 'court terme': 'var(--accent)', 'long terme': 'var(--accent2)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${color}18, var(--bg-secondary))`, border: `1px solid ${color}35`, borderRadius: 16, padding: '22px 26px' }}>
        <div style={{ fontSize: '0.7rem', color, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>ANALYSE STRATÉGIQUE ELITE</div>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px', fontSize: '1.15rem', fontWeight: 900 }}>{d.titre || 'Analyse Stratégique'}</h2>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.88rem' }}>{cleanIAText(d.synthese_strategique)}</div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['swot', '🔲 SWOT'], ['enjeux', '⚡ Enjeux'], ['risques', '⚠️ Risques'], ['recommandations', '🎯 Recommandations'], ['kpis', '📊 KPIs']].map(([id, lbl]) => (
          <button key={id} onClick={() => setActiveView(id)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${activeView === id ? color : 'var(--border)'}`, background: activeView === id ? color + '18' : 'var(--bg-card)', color: activeView === id ? color : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>{lbl}</button>
        ))}
      </div>

      {/* SWOT */}
      {activeView === 'swot' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Forces', '💪', swot.forces || [], 'var(--accent2)'],
            ['Faiblesses', '⚠️', swot.faiblesses || [], 'var(--red)'],
            ['Opportunités', '🚀', swot.opportunites || [], 'var(--accent2)'],
            ['Menaces', '🌩️', swot.menaces || [], 'var(--accent)'],
          ].map(([label, icon, items, clr]) => (
            <div key={label} style={{ background: 'var(--bg-card)', border: `1px solid ${clr}30`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <span style={{ color: clr, fontWeight: 800, fontSize: '0.8rem', letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                  <span style={{ color: clr, flexShrink: 0, marginTop: 2 }}>•</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Enjeux */}
      {activeView === 'enjeux' && (d.enjeux_strategiques || []).map((enjeu, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.6rem' }}>{enjeu.icon || '⚡'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{enjeu.titre}</span>
              <span style={{ padding: '2px 8px', borderRadius: 999, background: (IMPACT_COLOR[enjeu.impact] || 'var(--text-secondary)') + '20', color: IMPACT_COLOR[enjeu.impact] || 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 700 }}>{enjeu.impact}</span>
              <span style={{ padding: '2px 8px', borderRadius: 999, background: (URG_COLOR[enjeu.urgence] || 'var(--text-secondary)') + '20', color: URG_COLOR[enjeu.urgence] || 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 700 }}>{enjeu.urgence}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.6 }}>{enjeu.description}</div>
          </div>
        </div>
      ))}

      {/* Risques */}
      {activeView === 'risques' && (d.risques_majeurs || []).map((r, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid var(--red)`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: '0.88rem' }}>⚠️ {r.risque}</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--red)20', color: 'var(--red)', fontSize: '0.68rem', fontWeight: 700 }}>Prob: {r.probabilite}</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--accent)20', color: 'var(--accent)', fontSize: '0.68rem', fontWeight: 700 }}>Impact: {r.impact}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent2)', flexShrink: 0, fontSize: '0.8rem' }}>🛡️</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}><strong style={{ color: 'var(--accent2)' }}>Mitigation :</strong> {r.mitigation}</span>
          </div>
        </div>
      ))}

      {/* Recommandations */}
      {activeView === 'recommandations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(d.recommandations_strategiques || []).map((rec, i) => (
            <div key={i} style={{ background: `linear-gradient(135deg, ${color}10, var(--bg-card))`, border: `1px solid ${color}30`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: color + '25', color, fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>#{rec.priorite || i + 1}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{rec.action}</span>
                <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 999, background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.67rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{rec.delai}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 6 }}>{rec.rationale}</div>
              {rec.impact_attendu && <div style={{ color: 'var(--accent2)', fontSize: '0.78rem' }}>✓ {rec.impact_attendu}</div>}
            </div>
          ))}
          {(d.quick_wins || []).length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent2)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ color: 'var(--accent2)', fontWeight: 800, fontSize: '0.72rem', marginBottom: 10 }}>⚡ QUICK WINS</div>
              {d.quick_wins.map((qw, i) => <div key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: 6, display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent2)' }}>→</span>{qw}</div>)}
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      {activeView === 'kpis' && (d.kpis_cles || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {d.kpis_cles.map((kpi, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color, marginBottom: 3 }}>{kpi.cible}</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{kpi.kpi}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Délai : {kpi.delai}</div>
            </div>
          ))}
        </div>
      )}

      {/* Avantages concurrentiels */}
      {(d.avantages_concurrentiels || []).length > 0 && (
        <div style={{ background: color + '10', border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5, marginBottom: 10 }}>🏆 AVANTAGES CONCURRENTIELS</div>
          {d.avantages_concurrentiels.map((av, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
              <span style={{ color, flexShrink: 0 }}>★</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>{av}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DICTIONARY PANEL ─────────────────────────────────────────────────────────
const NIVEAU_COLORS = { debutant: 'var(--accent2)', intermediaire: 'var(--accent)', avance: 'var(--accent)', expert: 'var(--accent3)' }
const CATEGORIE_ICONS = { Technique: '🔧', Métier: '💼', Acronyme: '🔠', Concept: '💡', Industrie: '🏭' }

function DictionaryPanel({ data }) {
  const d = data || {}
  const color = ACCENT.dictionary
  const [expandedTerm, setExpandedTerm] = useState(null)
  const [filterCategorie, setFilterCategorie] = useState('all')
  const [filterNiveau, setFilterNiveau] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const termes = d.termes || []
  const acronymes = d.acronymes || []
  const voirAussi = d.voir_aussi || []

  const categories = [...new Set(termes.map(t => t.categorie).filter(Boolean))]
  const niveaux = [...new Set(termes.map(t => t.niveau).filter(Boolean))]

  const filteredTerms = termes.filter(t => {
    const matchCat = filterCategorie === 'all' || t.categorie === filterCategorie
    const matchNiv = filterNiveau === 'all' || t.niveau === filterNiveau
    const matchSearch = !searchTerm || (t.terme && t.terme.toLowerCase().includes(searchTerm.toLowerCase())) || (t.definition && t.definition.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchCat && matchNiv && matchSearch
  })

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header du dictionnaire */}
      <div style={{ marginBottom: 24, padding: 20, background: `linear-gradient(135deg, ${color}15 0%, ${color}10 100%)`, borderRadius: 12, border: `1px solid ${color}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>📖</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color }}>{d.titre || 'Dictionnaire du sujet'}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d.description || 'Dictionnaire complet des termes et concepts'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <span style={{ fontSize: '0.75rem', padding: '4px 12px', background: `${color}20`, borderRadius: 100, color }}>
            {termes.length} termes
          </span>
          <span style={{ fontSize: '0.75rem', padding: '4px 12px', background: `${color}20`, borderRadius: 100, color }}>
            {acronymes.length} acronymes
          </span>
          <span style={{ fontSize: '0.75rem', padding: '4px 12px', background: `${color}20`, borderRadius: 100, color }}>
            Niveau: {d.niveau_global || 'Tous'}
          </span>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Rechercher un terme..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
        />
        <select
          value={filterCategorie}
          onChange={e => setFilterCategorie(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          <option value="all">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{CATEGORIE_ICONS[c] || '📌'} {c}</option>)}
        </select>
        <select
          value={filterNiveau}
          onChange={e => setFilterNiveau(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          <option value="all">Tous niveaux</option>
          {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Liste des termes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredTerms.map((term, idx) => (
          <div
            key={idx}
            onClick={() => setExpandedTerm(expandedTerm === idx ? null : idx)}
            style={{
              padding: 16,
              background: 'var(--bg-card)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderLeft: `4px solid ${NIVEAU_COLORS[term.niveau] || color}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{CATEGORIE_ICONS[term.categorie] || '📌'}</span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{term.terme}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: NIVEAU_COLORS[term.niveau] || color,
                  color: '#fff',
                  fontWeight: 600
                }}>
                  {term.niveau}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {expandedTerm === idx ? '▼' : '▶'}
              </span>
            </div>

            {expandedTerm === idx && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.95rem', lineHeight: 1.6 }}>{term.definition}</p>
                
                {term.contexte && (
                  <div style={{ marginBottom: 10, padding: 10, background: `${color}08`, borderRadius: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>💡 Contexte:</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{term.contexte}</p>
                  </div>
                )}

                {term.exemple && (
                  <div style={{ marginBottom: 10, padding: 10, background: 'var(--accent2)08', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent2)' }}>✏️ Exemple:</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{term.exemple}"</p>
                  </div>
                )}

                {term.importance && (
                  <div style={{ marginBottom: 10, fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>⭐ Importance:</span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{term.importance}</span>
                  </div>
                )}

                {term.relations && term.relations.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>🔗 Lié à:</span>
                    {term.relations.map((rel, i) => (
                      <span key={i} style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'var(--bg-secondary)', borderRadius: 100, color: 'var(--text-secondary)' }}>
                        {rel}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Section Acronymes */}
      {acronymes.length > 0 && (
        <div style={{ marginTop: 32, padding: 20, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color }}>🔠 Acronymes & Sigles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {acronymes.map((acro, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, color, minWidth: 60, fontSize: '0.95rem' }}>{acro.acronyme}</span>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{acro.signification}</span>
                  {acro.definition && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{acro.definition}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Voir Aussi */}
      {voirAussi.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--text-secondary)' }}>📚 Voir aussi</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {voirAussi.map((item, idx) => (
              <span key={idx} style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'var(--bg-secondary)', borderRadius: 100, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {filteredTerms.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          📖 Aucun terme trouvé avec ces filtres
        </div>
      )}
    </div>
  )
}

// ─── FLASHCARDS PANEL ───────────────────────────────────────────────────────
const DIFF_COLORS = { easy: 'var(--accent2)', medium: 'var(--accent)', hard: 'var(--red)', expert: 'var(--accent3)', facile: 'var(--accent2)', moyen: 'var(--accent)', difficile: 'var(--red)' }

function FlashcardsPanel({ cards }) {
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mastered, setMastered] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const list = cards || []
  const filtered = filter === 'all' ? list : filter === 'mastered' ? list.filter((_, i) => mastered.has(i)) : list.filter((_, i) => !mastered.has(i))
  const card = filtered[current] || list[0]
  const color = ACCENT.flashcards
  if (!card) return null
  function nav(dir) { setFlipped(false); setTimeout(() => setCurrent(c => Math.max(0, Math.min(filtered.length - 1, c + dir))), 80) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all', 'Toutes'], ['pending', 'À revoir'], ['mastered', 'Maîtrisées']].map(([v, l]) => (
            <button key={v} onClick={() => { setFilter(v); setCurrent(0); setFlipped(false) }} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${filter === v ? color : 'var(--border)'}`, background: filter === v ? color + '18' : 'transparent', color: filter === v ? color : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>{l}</button>
          ))}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{mastered.size}/{list.length} maîtrisées</div>
      </div>

      {/* Card */}
      <div style={{ perspective: '1200px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setFlipped(f => !f)}>
        <div style={{ position: 'relative', minHeight: 300, transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 20, background: `linear-gradient(135deg, ${color}22, var(--bg-secondary))`, border: `2px solid ${color}45`, padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: 300 }}>
            <span style={{ fontSize: '2.8rem', marginBottom: 16 }}>{card.emoji || '🃏'}</span>
            <div style={{ color, fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>QUESTION</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.55, maxWidth: 460 }}>{card.front}</div>
            <div style={{ marginTop: 16, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cliquer pour la réponse</div>
          </div>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 20, background: `linear-gradient(135deg, var(--bg-card), ${color}18)`, border: `2px solid ${color}60`, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: 300 }}>
            <div style={{ color: 'var(--accent2)', fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>RÉPONSE</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 480, marginBottom: 10 }}>{card.back}</div>
            {card.exemple && <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 8 }}>Ex : {card.exemple}</div>}
            {card.category && <div style={{ padding: '3px 10px', borderRadius: 999, background: color + '22', color, fontSize: '0.7rem', fontWeight: 700 }}>{card.category}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => nav(-1)} disabled={current === 0} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: current === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: current === 0 ? 'default' : 'pointer', fontWeight: 700 }}>← Préc.</button>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: 70, textAlign: 'center' }}>{current + 1} / {filtered.length}</div>
        <button onClick={() => { setMastered(m => { const n = new Set(m); const idx = list.indexOf(filtered[current]); n.has(idx) ? n.delete(idx) : n.add(idx); return n }); nav(1) }} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--accent2)', background: 'var(--accent2)15', color: 'var(--accent2)', cursor: 'pointer', fontWeight: 700 }}>
          {mastered.has(list.indexOf(filtered[current])) ? 'Non maîtrisée' : 'Maîtrisée ✓'}
        </button>
        <button onClick={() => nav(1)} disabled={current === filtered.length - 1} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: current === filtered.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: current === filtered.length - 1 ? 'default' : 'pointer', fontWeight: 700 }}>Suiv. →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 7 }}>
        {filtered.map((c, i) => {
          const diffColor = DIFF_COLORS[c.difficulty || c.difficulte] || color
          return (
            <div key={i} onClick={() => { setCurrent(i); setFlipped(false) }} style={{ padding: '9px 11px', borderRadius: 10, border: `1px solid ${i === current ? color : 'var(--border)'}`, background: i === current ? color + '15' : 'var(--bg-card)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: diffColor, flexShrink: 0 }} />
                <span style={{ fontSize: '0.68rem', color: diffColor, fontWeight: 700 }}>#{i + 1}</span>
                {mastered.has(list.indexOf(c)) && <span style={{ fontSize: '0.65rem', color: 'var(--accent2)', marginLeft: 'auto' }}>✓</span>}
              </div>
              <div style={{ fontSize: '0.71rem', color: i === current ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.front}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── QUIZ PANEL ─────────────────────────────────────────────────────────────
function QuizPanel({ questions }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const q = questions || []
  const cq = q[current]
  const color = ACCENT.quiz
  if (!cq && !done) return null

  function answer(idx) {
    if (answers[current] !== undefined) return
    const next = { ...answers, [current]: idx }
    setAnswers(next)
    if (Object.keys(next).length === q.length) setTimeout(() => setDone(true), 800)
    else setTimeout(() => setCurrent(c => c + 1), 900)
  }

  const score = Object.entries(answers).filter(([i, v]) => v === q[i]?.correct).length
  const pct = q.length > 0 ? Math.round((score / q.length) * 100) : 0
  const scoreColor = pct >= 80 ? 'var(--accent2)' : pct >= 60 ? 'var(--accent)' : 'var(--red)'

  if (done) return (
    <div style={{ textAlign: 'center', padding: '32px 20px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}</div>
      <div style={{ fontSize: '3rem', fontWeight: 900, color: scoreColor, marginBottom: 6 }}>{pct}%</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{score} / {q.length} correctes</div>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{pct >= 80 ? 'Excellent ! Maîtrise confirmée.' : pct >= 60 ? 'Bon niveau. Révisez les flashcards.' : 'À retravailler. Consultez le rapport expert.'}</div>
      <button onClick={() => { setCurrent(0); setAnswers({}); setDone(false) }} style={{ padding: '11px 26px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer', marginBottom: 24 }}>Recommencer</button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 620, margin: '0 auto' }}>
        {q.map((question, i) => {
          const isOk = answers[i] === question.correct
          return (
            <div key={i} style={{ background: isOk ? 'var(--accent2)07' : 'var(--red)07', border: `1px solid ${isOk ? 'var(--accent2)' : 'var(--red)'}30`, borderRadius: 10, padding: '11px 14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span>{isOk ? '✅' : '❌'}</span>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Q{i + 1}. {question.question}</div>
                  {!isOk && <div style={{ color: 'var(--red)', fontSize: '0.74rem' }}>Votre réponse : {question.options?.[answers[i]] || '—'}</div>}
                  <div style={{ color: 'var(--accent2)', fontSize: '0.74rem' }}>Bonne réponse : {question.options?.[question.correct]}</div>
                  {question.explanation && <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: 4, lineHeight: 1.45 }}>{question.explanation}</div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const diffColor = DIFF_COLORS[cq.difficulte || cq.difficulty] || color
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 999, height: 7, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg, ${color}, var(--accent3))`, width: `${(current / q.length) * 100}%`, transition: 'width 0.3s', borderRadius: 999 }} />
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{current + 1} / {q.length}</span>
      </div>
      <div style={{ background: `linear-gradient(135deg, ${color}15, var(--bg-secondary))`, border: `2px solid ${color}35`, borderRadius: 20, padding: '26px 30px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: '1.3rem' }}>{cq.emoji || '❓'}</span>
          <span style={{ padding: '3px 10px', borderRadius: 999, background: color + '22', color, fontSize: '0.7rem', fontWeight: 800 }}>Q{current + 1}</span>
          {(cq.difficulte || cq.difficulty) && <span style={{ padding: '3px 10px', borderRadius: 999, background: diffColor + '22', color: diffColor, fontSize: '0.7rem', fontWeight: 700 }}>{cq.difficulte || cq.difficulty}</span>}
          {cq.categorie && <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.68rem' }}>{cq.categorie}</span>}
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, lineHeight: 1.55, marginBottom: 22 }}>{cq.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {(cq.options || []).map((opt, i) => {
            const isAnswered = answers[current] !== undefined
            const isSelected = answers[current] === i
            const isCorrect = cq.correct === i
            let bg = 'var(--bg-card)', border = 'var(--border)', textColor = 'var(--text-secondary)'
            if (isAnswered) {
              if (isCorrect) { bg = 'var(--accent2)12'; border = 'var(--accent2)'; textColor = 'var(--accent2)' }
              else if (isSelected) { bg = 'var(--red)12'; border = 'var(--red)'; textColor = 'var(--red)' }
            }
            return (
              <button key={i} onClick={() => answer(i)} disabled={isAnswered} style={{ padding: '12px 16px', borderRadius: 12, border: `2px solid ${border}`, background: bg, color: textColor, cursor: isAnswered ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.87rem', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', transition: 'all 0.2s' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: isAnswered ? (isCorrect ? 'var(--accent2)30' : isSelected ? 'var(--red)30' : 'transparent') : color + '20', border: `1px solid ${isAnswered ? (isCorrect ? 'var(--accent2)' : isSelected ? 'var(--red)' : 'var(--border)') : color + '50'}`, color: isAnswered ? (isCorrect ? 'var(--accent2)' : isSelected ? 'var(--red)' : 'var(--text-secondary)') : color, fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
        {answers[current] !== undefined && cq.explanation && (
          <div style={{ marginTop: 14, padding: '11px 14px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.74rem' }}>Explication : </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.79rem' }}>{cq.explanation}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── REPORT PANEL ───────────────────────────────────────────────────────────
function ReportPanel({ data }) {
  const [openSections, setOpenSections] = useState(new Set([0]))
  const d = data || {}
  const color = ACCENT.report
  const TREND_COLOR = { hausse: 'var(--accent2)', baisse: 'var(--red)', stable: 'var(--accent)' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: `linear-gradient(135deg, ${color}15, #0D1117)`, border: `1px solid ${color}35`, borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ fontSize: '0.68rem', color, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>RAPPORT EXPERT</div>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 900 }}>{d.titre || 'Rapport Expert'}</h2>
        {d.sous_titre && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 12 }}>{d.sous_titre}</div>}
        {d.synthese && <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.88rem' }}>{cleanIAText(d.synthese)}</div>}
      </div>

      {/* KPIs */}
      {(d.kpis || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
          {d.kpis.map((kpi, i) => {
            const tc = TREND_COLOR[kpi.tendance] || 'var(--text-secondary)'
            return (
              <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${color}25`, borderRadius: 12, padding: '13px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '1.05rem' }}>{kpi.emoji || '📊'}</span>
                  <span style={{ fontSize: '0.68rem', color: tc, fontWeight: 700 }}>{kpi.tendance === 'hausse' ? '↑' : kpi.tendance === 'baisse' ? '↓' : '→'} {kpi.variation || kpi.tendance}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color, marginBottom: 2 }}>{kpi.valeur}</div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{kpi.label}</div>
                {kpi.interpretation && <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{cleanIAText(kpi.interpretation)}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Sections */}
      {(d.sections || []).map((sec, i) => (
        <div key={i} style={{ border: `1px solid ${color}22`, borderRadius: 13, overflow: 'hidden' }}>
          <button onClick={() => setOpenSections(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })} style={{ width: '100%', padding: '13px 18px', background: openSections.has(i) ? color + '12' : 'var(--bg-secondary)', border: 'none', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: '1.15rem' }}>{sec.icon || '📌'}</span>
            <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88rem' }}>{sec.titre}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{openSections.has(i) ? '▲' : '▼'}</span>
          </button>
          {openSections.has(i) && (
            <div style={{ padding: '0 18px 18px', background: 'var(--bg-secondary)' }}>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.78, fontSize: '0.86rem', marginBottom: 12 }}>{cleanIAText(sec.contenu)}</div>
              {sec.citation && <div style={{ padding: '10px 14px', borderLeft: `3px solid ${color}`, background: color + '0A', borderRadius: '0 8px 8px 0', marginBottom: 12, color: color, fontSize: '0.82rem', fontStyle: 'italic' }}>"{cleanIAText(sec.citation)}"</div>}
              {(sec.points_cles || []).length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color, fontSize: '0.68rem', fontWeight: 800, marginBottom: 6 }}>POINTS CLÉS</div>
                  {sec.points_cles.map((p, j) => <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 5 }}><span style={{ color, fontSize: '0.82rem' }}>{cleanIAText(p)}</span></div>)}
                </div>
              )}
              {(sec.recommandations || []).length > 0 && (
                <div>
                  <div style={{ color, fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5, marginBottom: 7 }}>RECOMMANDATIONS</div>
                  {sec.recommandations.map((r, j) => <div key={j} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 5 }}><span style={{ color, marginTop: 2, flexShrink: 0 }}>→</span><span style={{ color: 'var(--text-secondary)', fontSize: '0.81rem', lineHeight: 1.5 }}>{cleanIAText(r)}</span></div>)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Benchmark */}
      {(d.benchmark || []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}25`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ color, fontWeight: 800, fontSize: '0.72rem', marginBottom: 10 }}>BENCHMARK</div>
          {d.benchmark.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{b.critere}</span>
              <span style={{ color, fontWeight: 800, fontSize: '0.88rem', minWidth: 40 }}>{b.score}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', maxWidth: 200 }}>{b.commentaire}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next steps */}
      {(d.next_steps || []).length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}28`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ color, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5, marginBottom: 10 }}>PROCHAINES ÉTAPES</div>
          {d.next_steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: color + '22', color, fontWeight: 900, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 600 }}>{step.etape || step}</div>
                {step.responsable && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{step.responsable} · {step.delai}</div>}
                {step.impact && <div style={{ color: 'var(--accent2)', fontSize: '0.72rem', marginTop: 2 }}>→ {step.impact}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {d.verdict && (
        <div style={{ background: `linear-gradient(135deg, ${color}18, var(--bg-card))`, border: `2px solid ${color}40`, borderRadius: 12, padding: '16px 20px', borderLeft: `5px solid ${color}` }}>
          <div style={{ color, fontWeight: 800, fontSize: '0.72rem', marginBottom: 8 }}>VERDICT FINAL</div>
          <div style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '0.9rem', fontWeight: 600 }}>{d.verdict}</div>
        </div>
      )}
    </div>
  )
}

// ─── TRENDS PANEL ───────────────────────────────────────────────────────────
function TrendsPanel({ data }) {
  const d = data || {}
  const color = ACCENT.trends
  const [activeSection, setActiveSection] = useState('tendances')
  const FORCE_COLOR = { faible: 'var(--accent2)', modérée: 'var(--accent)', forte: 'var(--red)', disruptive: 'var(--accent3)' }
  const TYPE_COLOR = { opportunité: 'var(--accent2)', risque: 'var(--red)', observation: 'var(--accent2)', rupture: 'var(--accent3)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: `linear-gradient(135deg, ${color}15, var(--bg-secondary))`, border: `1px solid ${color}35`, borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ fontSize: '0.68rem', color, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>TENDANCES & INSIGHTS PROSPECTIFS</div>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 900 }}>{d.titre || 'Analyse Prospective'}</h2>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['tendances', '📈 Méga-tendances'], ['disruptions', '💥 Disruptions'], ['insights', '💡 Insights'], ['futur', '🔮 Futur'], ['paris', '🎲 Paris Stratégiques']].map(([id, lbl]) => (
          <button key={id} onClick={() => setActiveSection(id)} style={{ padding: '7px 13px', borderRadius: 8, border: `1px solid ${activeSection === id ? color : 'var(--border)'}`, background: activeSection === id ? color + '18' : 'var(--bg-secondary)', color: activeSection === id ? color : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.77rem' }}>{lbl}</button>
        ))}
      </div>

      {activeSection === 'tendances' && (d.mega_tendances || []).map((t, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${FORCE_COLOR[t.force] || color}30`, borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>{t.icone || '📈'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{t.titre}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: (FORCE_COLOR[t.force] || 'var(--text-secondary)') + '20', color: FORCE_COLOR[t.force] || 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 700 }}>{t.force}</span>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.68rem' }}>{t.horizon}</span>
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.65, marginBottom: 10 }}>{t.description}</div>
          {(t.signaux_faibles || []).length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, marginBottom: 6 }}>SIGNAUX FAIBLES</div>
              {t.signaux_faibles.map((s, j) => <div key={j} style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 4 }}>· {s}</div>)}
            </div>
          )}
        </div>
      ))}

      {activeSection === 'disruptions' && (d.disruptions_potentielles || []).map((d2, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--red)', borderRadius: 13, padding: '14px 18px' }}>
          <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '0.88rem', marginBottom: 8 }}>💥 {d2.disruption}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--red)12', color: 'var(--red)', fontSize: '0.68rem', fontWeight: 700 }}>Prob: {d2.probabilite}</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--accent)12', color: 'var(--accent)', fontSize: '0.68rem', fontWeight: 700 }}>Impact: {d2.impact}</span>
          </div>
          {(d2.acteurs_cles || []).length > 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.77rem', marginBottom: 8 }}>Acteurs : {d2.acteurs_cles.join(', ')}</div>}
          {d2.fenetre_opportunite && <div style={{ color: 'var(--accent2)', fontSize: '0.78rem' }}>🕐 Fenêtre : {d2.fenetre_opportunite}</div>}
        </div>
      ))}

      {activeSection === 'futur' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {d.futur_probable && (
            <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}30`, borderRadius: 13, padding: '16px 20px' }}>
              <div style={{ color, fontWeight: 800, fontSize: '0.72rem', marginBottom: 8 }}>🔮 FUTUR PROBABLE (5 ans)</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.87rem' }}>{d.futur_probable}</div>
            </div>
          )}
          {d.futur_disruptif && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent3)', borderRadius: 13, padding: '16px 20px' }}>
              <div style={{ color: 'var(--accent3)', fontWeight: 800, fontSize: '0.72rem', marginBottom: 8 }}>💥 SCÉNARIO DISRUPTIF</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.87rem' }}>{d.futur_disruptif}</div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'paris' && (d.top_3_paris || []).map((pari, i) => (
        <div key={i} style={{ background: `linear-gradient(135deg, ${color}12, var(--bg-card))`, border: `1px solid ${color}30`, borderRadius: 13, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: color + '25', color, fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>{pari.pari}</div>
              {pari.rationale && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>{pari.rationale}</div>}
            </div>
          </div>
        </div>
      ))}

      <ToolInfoPanel
        toolName="Dissecteur Infos Elite"
        icon="🔬"
        description="Outil d'analyse intelligente de documents, URLs et fichiers avec IA pour résumer, stratégie, flashcards, quiz et plus"
        benefits={[
          'Analyse de textes, URLs et fichiers (PDF, DOCX, XLSX)',
          'Génération automatique de résumés complets',
          'Analyse stratégique avec insights actionnables',
          'Création de flashcards pour l\'apprentissage',
          'Génération de quiz experts avec réponses',
          'Rapports professionnels structurés',
          'Identification des tendances et insights',
          'Export des résultats (PDF, Word, JSON)',
        ]}
        howToUse={[
          'Collez un texte, entrez une URL ou importez un fichier',
          'Activez les modes d\'analyse souhaités (Résumé, Stratégie, Flashcards, etc.)',
          'Lancez l\'analyse IA en cliquant sur "Analyser"',
          'Explorez les résultats dans les différents onglets',
          'Exportez les résultats dans le format de votre choix',
          'Utilisez le Dictionnaire pour comprendre les termes techniques',
        ]}
        tips={[
          'Plus le document est détaillé, meilleure est l\'analyse',
          'Utilisez le mode Stratégie pour des insights business',
          'Les flashcards sont parfaites pour l\'apprentissage rapide',
          'Le Dictionnaire explique tous les termes techniques du document',
          'Exportez régulièrement vos analyses importantes',
        ]}
      />
    </div>
  )
}

// ─── SLIDES PANEL ───────────────────────────────────────────────────────────
function SlidesPanel({ slides }) {
  const [current, setCurrent] = useState(0)
  const list = slides || []
  const slide = list[current]
  const color = ACCENT.slides
  if (!slide) return null
  const accent = slide.accent || color

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: `linear-gradient(135deg, ${accent}20, var(--bg-card))`, border: `2px solid ${accent}40`, borderRadius: 20, minHeight: 360, padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '2.5rem' }}>{slide.icon || '🖼'}</span>
          <div>
            <div style={{ fontSize: '0.66rem', color: accent, fontWeight: 800, letterSpacing: 1.2, marginBottom: 3 }}>SLIDE {slide.numero || current + 1} — {(slide.type || '').toUpperCase()}</div>
            {slide.sous_titre && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{slide.sous_titre}</div>}
          </div>
        </div>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 18px', fontSize: 'clamp(1.2rem,2.8vw,1.7rem)', fontWeight: 900, lineHeight: 1.3 }}>{slide.titre}</h2>
        {slide.stat_clé && (
          <div style={{ marginBottom: 18, padding: '10px 16px', borderRadius: 10, background: accent + '15', border: `1px solid ${accent}30`, display: 'inline-block' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: accent }}>{slide.stat_clé}</div>
          </div>
        )}
        {(slide.bullets || []).length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slide.bullets.map((b, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 8 }} />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.91rem', lineHeight: 1.6 }}>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {slide.note_orateur && (
          <div style={{ position: 'absolute', bottom: 14, right: 18, color: 'var(--text-muted)', fontSize: '0.68rem', maxWidth: 300, textAlign: 'right', fontStyle: 'italic' }}>Note : {slide.note_orateur}</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: current === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: current === 0 ? 'default' : 'pointer', fontWeight: 700 }}>←</button>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', minWidth: 65, textAlign: 'center' }}>{current + 1} / {list.length}</span>
        <button onClick={() => setCurrent(c => Math.min(list.length - 1, c + 1))} disabled={current === list.length - 1} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: current === list.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: current === list.length - 1 ? 'default' : 'pointer', fontWeight: 700 }}>→</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
        {list.map((sl, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${i === current ? (sl.accent || color) : 'var(--border)'}`, background: i === current ? (sl.accent || color) + '15' : 'var(--bg-card)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.85rem' }}>{sl.icon || '🖼'}</span>
              <span style={{ fontSize: '0.63rem', color: sl.accent || color, fontWeight: 800 }}>#{sl.numero || i + 1}</span>
            </div>
            <div style={{ fontSize: '0.71rem', color: i === current ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{sl.titre}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── INFOGRAPHIC PANEL ──────────────────────────────────────────────────────
function InfographicPanel({ cards }) {
  const [active, setActive] = useState(null)
  const list = cards || []
  const PALETTE = ['#22D3EE', '#60A5FA', '#A78BFA', '#34D399', '#F59E0B', '#F472B6', '#FB923C', '#4ADE80', '#E879F9', '#38BDF8']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))', gap: 13 }}>
        {list.map((card, i) => {
          const clr = card.couleur || card.color || PALETTE[i % PALETTE.length]
          const isActive = active === i
          return (
            <div key={i} onClick={() => setActive(isActive ? null : i)} style={{ background: `linear-gradient(145deg, ${clr}18, var(--bg-card))`, border: `1.5px solid ${isActive ? clr : clr + '40'}`, borderRadius: 16, padding: '20px 18px', cursor: 'pointer', transition: 'all 0.22s', transform: isActive ? 'scale(1.02)' : 'scale(1)', boxShadow: isActive ? `0 0 28px ${clr}28` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: '2.2rem' }}>{card.icon || '📌'}</span>
                {card.badge && <span style={{ padding: '2px 8px', borderRadius: 999, background: clr + '20', color: clr, fontSize: '0.63rem', fontWeight: 700 }}>{card.badge}</span>}
              </div>
              <div style={{ fontSize: '0.62rem', color: clr, fontWeight: 800, letterSpacing: 1.1, marginBottom: 5, textTransform: 'uppercase' }}>{card.type || 'concept'}</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.92rem', marginBottom: 10, lineHeight: 1.3 }}>{card.titre}</div>
              {card.stat && (
                <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 9, background: clr + '16', border: `1px solid ${clr}28` }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: clr }}>{card.stat}</div>
                  {card.stat_label && <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>{card.stat_label}</div>}
                </div>
              )}
              <div style={{ color: 'var(--text-primary)', opacity: 0.85, fontSize: '0.78rem', lineHeight: 1.55 }}>{card.description}</div>
              {isActive && (card.points || []).length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${clr}28` }}>
                  {card.points.map((pt, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                      <span style={{ color: clr, fontSize: '0.8rem', flexShrink: 0 }}>•</span>
                      <span style={{ color: 'var(--text-primary)', opacity: 0.88, fontSize: '0.75rem', lineHeight: 1.4 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Cliquer sur une carte pour voir les détails</div>
    </div>
  )
}
