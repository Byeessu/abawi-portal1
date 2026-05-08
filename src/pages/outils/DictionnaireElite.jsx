import { useMemo, useState } from 'react'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { groqChatCompletion } from '../../lib/groqClient'

const LANGS = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'wo', label: 'Wolof' },
  { id: 'zh', label: '中文' },
  { id: 'es', label: 'Español' },
  { id: 'it', label: 'Italiano' },
  { id: 'la', label: 'Latina' },
  { id: 'ar', label: 'العربية' },
  { id: 'el', label: 'Ελληνικά' },
  { id: 'ln', label: 'Lingala' },
]

const DICTIONARY = [
  { id: 1, category: 'Business', fr: 'entreprise', en: 'company', wo: 'entrepriz', zh: '公司', es: 'empresa', it: 'impresa', la: 'societas', ar: 'شركة', el: 'εταιρεία', ln: 'entrepriza' },
  { id: 2, category: 'Business', fr: 'client', en: 'client', wo: 'kilifa', zh: '客户', es: 'cliente', it: 'cliente', la: 'cliens', ar: 'عميل', el: 'πελάτης', ln: 'client' },
  { id: 3, category: 'Business', fr: 'contrat', en: 'contract', wo: 'kòntar', zh: '合同', es: 'contrato', it: 'contratto', la: 'contractus', ar: 'عقد', el: 'σύμβαση', ln: 'contrat' },
  { id: 4, category: 'Finance', fr: 'budget', en: 'budget', wo: 'biije', zh: '预算', es: 'presupuesto', it: 'bilancio', la: 'ratio', ar: 'ميزانية', el: 'προϋπολογισμός', ln: 'budget' },
  { id: 5, category: 'Finance', fr: 'bénéfice', en: 'profit', wo: 'njariñ', zh: '利润', es: 'beneficio', it: 'profitto', la: 'lucrum', ar: 'ربح', el: 'κέρδος', ln: 'benefice' },
  { id: 6, category: 'RH', fr: 'salaire', en: 'salary', wo: 'pey', zh: '工资', es: 'salario', it: 'stipendio', la: 'salarium', ar: 'راتب', el: 'μισθός', ln: 'lifuti' },
  { id: 7, category: 'Digital', fr: 'données', en: 'data', wo: 'done', zh: '数据', es: 'datos', it: 'dati', la: 'data', ar: 'بيانات', el: 'δεδομένα', ln: 'data' },
  { id: 8, category: 'Communication', fr: 'bonjour', en: 'hello', wo: 'salaam malekum', zh: '你好', es: 'hola', it: 'ciao', la: 'salve', ar: 'مرحبا', el: 'γεια σας', ln: 'mbote' },
  { id: 9, category: 'Communication', fr: 'merci', en: 'thank you', wo: 'jërëjëf', zh: '谢谢', es: 'gracias', it: 'grazie', la: 'gratias tibi', ar: 'شكرا', el: 'ευχαριστώ', ln: 'matondi' },
  { id: 10, category: 'Administration', fr: 'document', en: 'document', wo: 'dokimaa', zh: '文件', es: 'documento', it: 'documento', la: 'documentum', ar: 'وثيقة', el: 'έγγραφο', ln: 'document' },
]

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
const STORAGE_KEY = 'abawi_dictionary_elite_entries'

function parseEntriesFromModelOutput(out) {
  try {
    const parsed = JSON.parse(out)
    if (Array.isArray(parsed?.entries)) return parsed.entries
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch {}
  try {
    const wrapped = JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] || '{}')
    if (Array.isArray(wrapped?.entries)) return wrapped.entries
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch {}
  const objectMatches = out.match(/\{[^{}]*"fr"\s*:\s*"[^"]+"[^{}]*\}/g) || []
  const recovered = []
  for (const rawObj of objectMatches) {
    try {
      recovered.push(JSON.parse(rawObj))
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
  }
  return recovered
}

async function generateWordsBatch(domain, batchSize, maxRetries = 2) {
  const prompt = `
Génère ${batchSize} entrées de dictionnaire business multilingue.
Domaine: ${domain}.

Format JSON strict:
{
  "entries": [
    { "fr": "...", "en": "...", "wo": "...", "zh": "...", "es":"...", "it":"...", "la":"...", "ar":"...", "el":"...", "ln":"...", "category": "${domain}" }
  ]
}

Contraintes:
- Entrées utiles pour professionnels Afrique/OHADA.
- Pas de doublons.
- Mots ou expressions courtes.
- Vocabulaire soutenu, formel, officiel, académique ou professionnel uniquement. Pas de langue familière.
- Wolof en écriture latine.
- Chinois simplifié.
`

  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })
  const out = data?.choices?.[0]?.message?.content?.trim() || ''
  const entries = parseEntriesFromModelOutput(out)
  if (entries.length > 0) return entries
  if (maxRetries > 0) {
    return generateWordsBatch(domain, Math.max(50, Math.floor(batchSize * 0.7)), maxRetries - 1)
  }
  throw new Error('Sortie IA non lisible après retries')
}

function loadCustomEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mergeEntries(baseEntries, newEntries) {
  const map = new Map()
  ;[...baseEntries, ...newEntries].forEach((item, idx) => {
    const key = `${String(item.fr || '').toLowerCase()}|${String(item.en || '').toLowerCase()}`
    if (!map.has(key)) map.set(key, { ...item, id: item.id || Date.now() + idx })
  })
  return Array.from(map.values())
}

export default function DictionnaireElite() {
  const [customEntries, setCustomEntries] = useState(() => loadCustomEntries())
  const [fromLang, setFromLang] = useState('fr')
  const [toLang, setToLang] = useState('en')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [domainToGenerate, setDomainToGenerate] = useState('Business')
  const [batchSize, setBatchSize] = useState(100)
  const [autoRuns, setAutoRuns] = useState(5)
  const [targetTotal, setTargetTotal] = useState(5000)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState('')

  const allEntries = useMemo(() => [...DICTIONARY, ...customEntries], [customEntries])

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(allEntries.map((item) => item.category)))],
    [allEntries]
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allEntries.filter((item) => {
      const categoryOk = category === 'all' || item.category === category
      const sourceText = String(item[fromLang] || '').toLowerCase()
      const targetText = String(item[toLang] || '').toLowerCase()
      const queryOk = !q || sourceText.includes(q) || targetText.includes(q)
      return categoryOk && queryOk
    })
  }, [allEntries, query, category, fromLang, toLang])

  async function handleGenerate() {
    setGenerating(true)
    setStatus('Génération IA en cours...')
    try {
      const generated = await generateWordsBatch(domainToGenerate, batchSize)
      const normalized = generated.map((x) => ({
        fr: String(x.fr || '').trim(),
        en: String(x.en || '').trim(),
        wo: String(x.wo || '').trim(),
        zh: String(x.zh || '').trim(),
        es: String(x.es || '').trim(),
        it: String(x.it || '').trim(),
        la: String(x.la || '').trim(),
        ar: String(x.ar || '').trim(),
        el: String(x.el || '').trim(),
        ln: String(x.ln || '').trim(),
        category: String(x.category || domainToGenerate).trim() || domainToGenerate,
      })).filter((x) => x.fr && x.en)
      const merged = mergeEntries(allEntries, normalized)
      const nextCustom = merged.slice(DICTIONARY.length)
      setCustomEntries(nextCustom)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustom))
      setStatus(`+${normalized.length} entrées générées. Total: ${merged.length} mots/expressions.`)
    } catch (e) {
      setStatus(`Erreur: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleAutoRun() {
    setGenerating(true)
    setStatus(`Auto-run lancé: ${autoRuns} lots x ${batchSize}...`)
    try {
      let current = [...allEntries]
      let totalAdded = 0
      for (let i = 0; i < autoRuns; i++) {
        setStatus(`Lot ${i + 1}/${autoRuns} en cours...`)
        const generated = await generateWordsBatch(domainToGenerate, batchSize)
        const normalized = generated.map((x) => ({
          fr: String(x.fr || '').trim(),
          en: String(x.en || '').trim(),
          wo: String(x.wo || '').trim(),
          zh: String(x.zh || '').trim(),
          es: String(x.es || '').trim(),
          it: String(x.it || '').trim(),
          la: String(x.la || '').trim(),
          ar: String(x.ar || '').trim(),
          el: String(x.el || '').trim(),
          ln: String(x.ln || '').trim(),
          category: String(x.category || domainToGenerate).trim() || domainToGenerate,
        })).filter((x) => x.fr && x.en)
        const before = current.length
        current = mergeEntries(current, normalized)
        totalAdded += current.length - before
        const nextCustom = current.slice(DICTIONARY.length)
        setCustomEntries(nextCustom)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustom))
      }
      setStatus(`Auto-run terminé. +${totalAdded} entrées nettes ajoutées. Total: ${current.length}.`)
    } catch (e) {
      setStatus(`Erreur auto-run: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleFillToTarget() {
    setGenerating(true)
    setStatus(`Remplissage massif lancé vers ${targetTotal} entrées...`)
    try {
      let current = [...allEntries]
      let guard = 0
      while (current.length < targetTotal && guard < 80) {
        guard += 1
        setStatus(`Progression: ${current.length}/${targetTotal}... lot ${guard}`)
        const generated = await generateWordsBatch(domainToGenerate, batchSize)
        const normalized = generated.map((x) => ({
          fr: String(x.fr || '').trim(),
          en: String(x.en || '').trim(),
          wo: String(x.wo || '').trim(),
          zh: String(x.zh || '').trim(),
          es: String(x.es || '').trim(),
          it: String(x.it || '').trim(),
          la: String(x.la || '').trim(),
          ar: String(x.ar || '').trim(),
          el: String(x.el || '').trim(),
          ln: String(x.ln || '').trim(),
          category: String(x.category || domainToGenerate).trim() || domainToGenerate,
        })).filter((x) => x.fr && x.en)
        current = mergeEntries(current, normalized)
        const nextCustom = current.slice(DICTIONARY.length)
        setCustomEntries(nextCustom)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustom))
      }
      setStatus(`Stock massif prêt. Total: ${current.length} entrées.`)
    } catch (e) {
      setStatus(`Erreur remplissage: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 32px) 80px' }}>
      <ToolInfoPanel
        toolName="ABAWI Language Pro"
        icon="🌐"
        description="Dictionnaire multilingue massif (10 langues) avec auto-génération IA"
        benefits={[
          'Recherche instantanée dans 10 langues : FR, EN, Wolof, 中文, ES, IT, Latin, AR, Grec, Lingala',
          'Génération automatique par IA de nouvelles entrées thématiques',
          'Catégories professionnelles : Business, Finance, Juridique, RH, Tech, Admin',
          'Wolof en orthographe latine officielle',
          'Sauvegarde locale du corpus enrichi',
        ]}
        howToUse={[
          'Tapez un mot en français (ou dans n\'importe quelle langue) dans la recherche',
          'Consultez les traductions dans toutes les langues',
          'Filtrez par catégorie (Business, Finance, RH...)',
          'Cliquez sur « Générer » pour enrichir le dictionnaire d\'un domaine précis',
          'Les entrées ajoutées sont conservées dans votre navigateur',
        ]}
        tips={[
          'Parfait pour traduire vocabulaire OHADA, SYSCOHADA ou termes diplomatiques',
          'La génération IA produit du vocabulaire professionnel/formel uniquement',
          'Vous pouvez exporter votre dictionnaire personnalisé',
          'Le Latin est utile pour les expressions juridiques (ad hoc, nemo auditur...)',
        ]}
      />
      <div style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 999, background: 'var(--gold-glow)', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800, marginBottom: 12 }}>
          🌐 ABAWI LANGUAGE PRO
        </div>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
          Dictionnaire multilingue avancé
        </h1>
        <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
          Français, anglais, wolof, chinois, espagnol, italien, latin, arabe, grec, lingala et plus.
        </p>
        <p style={{ marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          Corpus total actuel: <strong style={{ color: 'var(--text-primary)' }}>{allEntries.length}</strong> entrées.
        </p>
      </div>

      <div style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 14, padding: 12, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1.2fr 0.9fr 0.9fr 1fr auto auto auto' }}>
          <select value={domainToGenerate} onChange={(e) => setDomainToGenerate(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {['Business', 'Finance', 'RH', 'Digital', 'Communication', 'Administration', 'Juridique', 'Marketing', 'Vente', 'Immobilier'].map((d) => (
              <option key={d} value={d}>Domaine IA: {d}</option>
            ))}
          </select>
          <select value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value, 10))} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {[100, 300, 500].map((n) => <option key={n} value={n}>Lot: {n} mots</option>)}
          </select>
          <select value={autoRuns} onChange={(e) => setAutoRuns(parseInt(e.target.value, 10))} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {[2, 5, 10, 20].map((n) => <option key={n} value={n}>Auto-run: {n} lots</option>)}
          </select>
          <select value={targetTotal} onChange={(e) => setTargetTotal(parseInt(e.target.value, 10))} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {[3000, 5000, 8000, 10000].map((n) => <option key={n} value={n}>Objectif: {n}</option>)}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--gold-border)', background: 'var(--gold-glow)', color: 'var(--gold)', fontWeight: 700, cursor: generating ? 'wait' : 'pointer' }}
          >
            {generating ? 'Génération...' : '✨ Générer en masse'}
          </button>
          <button
            onClick={handleAutoRun}
            disabled={generating}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--accent3)', background: 'color-mix(in srgb, var(--accent3) 20%, transparent)', color: 'var(--text-primary)', fontWeight: 700, cursor: generating ? 'wait' : 'pointer' }}
          >
            {generating ? 'Auto-run...' : '🚀 Auto-run massif'}
          </button>
          <button
            onClick={handleFillToTarget}
            disabled={generating}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--gold-border)', background: 'linear-gradient(135deg, #f0b42922, #f0b42910)', color: 'var(--text-primary)', fontWeight: 700, cursor: generating ? 'wait' : 'pointer' }}
          >
            {generating ? 'Remplissage...' : '🏦 Stocker au max'}
          </button>
          <button
            onClick={() => {
              setCustomEntries([])
              localStorage.removeItem(STORAGE_KEY)
              setStatus('Corpus IA réinitialisé.')
            }}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
          >
            Réinitialiser IA
          </button>
        </div>
        {!!status && <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{status}</div>}
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr 2fr', marginBottom: 16 }}>
        <select value={fromLang} onChange={(e) => setFromLang(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>Depuis: {l.label}</option>)}
        </select>
        <select value={toLang} onChange={(e) => setToLang(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>Vers: {l.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'Toutes catégories' : c}</option>)}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un mot ou une traduction..."
          style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        />
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', background: 'var(--bg-card)', padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>{LANGS.find((l) => l.id === fromLang)?.label}</span>
          <span>{LANGS.find((l) => l.id === toLang)?.label}</span>
          <span>Catégorie</span>
        </div>
        {results.map((item) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item[fromLang]}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{item[toLang] || '—'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.category}</span>
          </div>
        ))}
        {!results.length && (
          <div style={{ padding: 18, color: 'var(--text-secondary)' }}>
            Aucun résultat pour cette recherche.
          </div>
        )}
      </div>
    </div>
  )
}
