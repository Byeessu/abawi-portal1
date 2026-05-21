import { useMemo, useState } from 'react'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import TokenCounter from '../../components/TokenCounter'
import ToolHero from '../../components/ToolHero'
import ToolIcon from '../../components/ToolIcon'
import { groqChatCompletion } from '../../lib/groqClient'
import { DICTIONARY_CORPUS } from '../../data/dictionaryCorpus'
import { useAuth } from '../../context/AuthContext'
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'

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

const DICTIONARY = DICTIONARY_CORPUS.map((item, idx) => ({
  id: idx + 1,
  category: item.cat,
  fr: item.fr, en: item.en, wo: item.wo, zh: item.zh, es: item.es, it: item.it, la: item.la, ar: item.ar, el: item.el, ln: item.ln
}))

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
const STORAGE_KEY = 'abawi_dictionary_elite_entries'

function parseEntriesFromModelOutput(out) {
  try {
    const parsed = JSON.parse(out)
    if (Array.isArray(parsed?.entries)) return parsed.entries
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch { /* ignore */ }
  try {
    const wrapped = JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] || '{}')
    if (Array.isArray(wrapped?.entries)) return wrapped.entries
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch { /* ignore */ }
  const objectMatches = out.match(/\{[^{}]*"fr"\s*:\s*"[^"]+"[^{}]*\}/g) || []
  const recovered = []
  for (const rawObj of objectMatches) {
    try {
      recovered.push(JSON.parse(rawObj))
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch { /* ignore */ }
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
  const { membre } = useAuth()
  const guard = useToolGuard('dictionnaire_elite', 'dictionnaire_elite')

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
  const [selectedWord, setSelectedWord] = useState(null)

  const CATEGORY_TABS = ['all', 'Business', 'Finance', 'RH', 'Digital', 'Communication', 'Administration', 'Juridique', 'Marketing', 'Vente', 'Immobilier']

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

  async function checkAccessThen(action) {
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return false
    await guard.recordUsage({ action })
    return true
  }

  async function handleGenerate() {
    const ok = await checkAccessThen()
    if (!ok) return
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
    const ok = await checkAccessThen()
    if (!ok) return
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
    const ok = await checkAccessThen()
    if (!ok) return
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 32px) 80px' }}>
      <SEO title="Abawi Language Pro — Dictionnaire multilingue IA" description="Dictionnaire massif multilingue avec auto-run IA. Français, Anglais, Wolof, Chinois, Espagnol, Arabe." image="/og-tools/dictionnaire-elite.jpg" />
      <style>{`
        @media (max-width: 600px) {
          .dict-lang-grid { grid-template-columns: 1fr !important; }
          .dict-result-grid { grid-template-columns: 1fr 1fr !important; }
          .dict-result-grid .dict-cat-col { display: none; }
        }
      `}</style>
      <ToolHero
        icon={<ToolIcon name="dictionnaire" size={48} />}
        badge="LANG PRO"
        title="ABAWI"
        titleAccent="Language Pro"
        subtitle="Dictionnaire massif multilingue + auto-génération IA. 10 langues, corpus professionnel, exportable."
        gradient="linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #2563eb 100%)"
        glowColor="rgba(37,99,235,0.4)"
        accentColor="#93C5FD"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
      <ToolInfoPanel
        toolName="Abawi Language Pro"
        icon={<ToolIcon name="dictionnaire" size={28} />}
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
      <div style={{ marginTop: 8 }}>
        <ToolGuardBadge guard={guard} />
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--gold-glow)', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800, marginBottom: 12 }}>
          <ToolIcon name="dictionnaire" size={16} /> ABAWI LANGUAGE PRO
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
              setStatus('Réinitialisé.')
            }}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
          >
            Réinitialiser
          </button>
        </div>
        {!!status && <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{status}</div>}
      </div>

      <div className="dict-lang-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 2fr', marginBottom: 16 }}>
        <select value={fromLang} onChange={(e) => setFromLang(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>Depuis: {l.label}</option>)}
        </select>
        <select value={toLang} onChange={(e) => setToLang(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>Vers: {l.label}</option>)}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un mot ou une traduction..."
          style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {CATEGORY_TABS.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: category === c ? 'var(--accent)' : 'var(--bg-card)',
              color: category === c ? '#fff' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {c === 'all' ? 'Toutes' : c}
          </button>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div className="dict-result-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', background: 'var(--bg-card)', padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>{LANGS.find((l) => l.id === fromLang)?.label}</span>
          <span>{LANGS.find((l) => l.id === toLang)?.label}</span>
          <span className="dict-cat-col">Catégorie</span>
        </div>
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedWord(item)}
            className="dict-result-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr 0.8fr',
              padding: '10px 14px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-primary)' }}
          >
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item[fromLang]}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{item[toLang] || '—'}</span>
            <span className="dict-cat-col" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.category}</span>
          </div>
        ))}
        {!results.length && (
          <div style={{ padding: 18, color: 'var(--text-secondary)' }}>
            Aucun résultat pour cette recherche.
          </div>
        )}
      </div>

      {/* ── Modal détail mot ── */}
      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) guard.closeUpsell()
        }}
      />

      {selectedWord && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setSelectedWord(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              maxWidth: 560,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.3rem' }}>{selectedWord.fr}</h3>
              <button onClick={() => setSelectedWord(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Traductions</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {LANGS.map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>{l.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', direction: l.id === 'ar' ? 'rtl' : 'ltr' }}>{selectedWord[l.id] || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Catégorie</div>
              <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: 'var(--gold-glow)', color: 'var(--gold)', fontWeight: 700, fontSize: '0.82rem' }}>
                {selectedWord.category}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Exemples</div>
              {selectedWord.examples && selectedWord.examples.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {selectedWord.examples.map((ex, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{ex}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucun exemple disponible pour cette entrée.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
