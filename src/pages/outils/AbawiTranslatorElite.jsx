import { useMemo, useState } from 'react'
import { exportToPDF } from '../../lib/generatePDF'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { groqChatCompletion } from '../../lib/groqClient'

const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

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
  { id: 'pt', label: 'Português' },
  { id: 'de', label: 'Deutsch' },
]

async function callTranslator(text, fromLang, toLang, explainLang, detailLevel, translationMode, domainContext) {
  const modeInstruction = translationMode === 'official'
    ? 'Applique un registre officiel institutionnel (académique, professionnel, diplomatique), avec précision terminologique stricte.'
    : 'Applique un registre professionnel clair.'

  const prompt = `
Tu es un service de traduction professionnel multilingue (terminologie précise, ton adapté au contexte).

Traduis le texte de "${fromLang}" vers "${toLang}".
Ensuite, rédige une explication ${detailLevel} dans la langue "${explainLang}".
Contexte métier: ${domainContext || 'général'}.
Mode: ${translationMode}.
${modeInstruction}

Donne une réponse JSON stricte:
{
  "detected_language": "...",
  "translation": "...",
  "alt_translations": ["...", "...", "..."],
  "terminology_glossary": [{"source_term":"...", "target_term":"...", "justification":"..."}],
  "quality_checks": ["...", "..."],
  "official_layout": {
    "title":"...",
    "opening_formula":"...",
    "body":"...",
    "closing_formula":"..."
  },
  "explanation": "...",
  "examples": [
    {"source":"...", "target":"..."},
    {"source":"...", "target":"..."}
  ],
  "notes": ["...", "..."]
}

Texte source:
${text}
`

  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 2200,
    messages: [{ role: 'user', content: prompt }],
  })
  const out = data?.choices?.[0]?.message?.content?.trim() || '{}'
  return JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] || '{}')
}

export default function AbawiTranslatorElite() {
  const [text, setText] = useState('')
  const [fromLang, setFromLang] = useState('fr')
  const [toLang, setToLang] = useState('en')
  const [explainLang, setExplainLang] = useState('fr')
  const [detailLevel, setDetailLevel] = useState('exhaustive et pédagogique')
  const [translationMode, setTranslationMode] = useState('pro')
  const [domainContext, setDomainContext] = useState('académique et professionnel')
  const [referenceCode, setReferenceCode] = useState('ABW-TR-001')
  const [authorName, setAuthorName] = useState('Service de traduction')
  const [organizationName, setOrganizationName] = useState('Votre organisation')
  const [documentObject, setDocumentObject] = useState('Traduction officielle')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const canRun = useMemo(() => text.trim().length > 0 && !loading, [text, loading])
  // Refresh the export date every time a new translation result comes in,
  // even though the body does not directly read `result` — that is by design.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const exportDate = useMemo(() => new Date().toLocaleDateString('fr-FR'), [result])

  function buildOfficialPlainText() {
    if (!result) return ''
    return [
      `${organizationName}`,
      `Reference: ${referenceCode}`,
      `Date: ${exportDate}`,
      `Auteur: ${authorName}`,
      `Objet: ${documentObject}`,
      `Langue source: ${fromLang}`,
      `Langue cible: ${toLang}`,
      '',
      '--- TRADUCTION PRINCIPALE ---',
      result.translation || '',
      '',
      '--- VARIANTES ---',
      ...(result.alt_translations || []),
      '',
      '--- EXPLICATION ---',
      result.explanation || '',
      '',
      '--- CONTROLES QUALITE ---',
      ...(result.quality_checks || []),
    ].join('\n')
  }

  function exportOfficialWord() {
    if (!result) return
    const html = `
<html>
<head>
  <meta charset="utf-8" />
  <title>Traduction officielle</title>
</head>
<body style="font-family: Calibri, Arial, sans-serif; line-height:1.5; color:#111;">
  <h2 style="margin:0;">${organizationName}</h2>
  <p style="margin:6px 0 0 0;"><strong>Reference:</strong> ${referenceCode}</p>
  <p style="margin:2px 0;"><strong>Date:</strong> ${exportDate}</p>
  <p style="margin:2px 0;"><strong>Auteur:</strong> ${authorName}</p>
  <p style="margin:2px 0;"><strong>Objet:</strong> ${documentObject}</p>
  <p style="margin:2px 0;"><strong>Langue source:</strong> ${fromLang} | <strong>Langue cible:</strong> ${toLang}</p>
  <hr />
  <h3>Traduction principale</h3>
  <p>${(result.translation || '').replace(/\n/g, '<br/>')}</p>
  <h3>Variantes</h3>
  <ul>${(result.alt_translations || []).map((x) => `<li>${x}</li>`).join('')}</ul>
  <h3>Explication detaillee</h3>
  <p>${(result.explanation || '').replace(/\n/g, '<br/>')}</p>
  <h3>Controles qualite</h3>
  <ul>${(result.quality_checks || []).map((x) => `<li>${x}</li>`).join('')}</ul>
</body>
</html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Traduction-Officielle-${referenceCode}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function runTranslation() {
    if (!canRun) return
    setLoading(true)
    setError('')
    try {
      const data = await callTranslator(
        text.trim(),
        fromLang,
        toLang,
        explainLang,
        detailLevel,
        translationMode,
        domainContext
      )
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 32px) 80px' }}>
      <ToolInfoPanel
        toolName="ABAWI Translator Elite"
        icon="🌐"
        description="Traduction + explication avancée dans plus de 10 langues"
        benefits={[
          'Traduisez entre FR, EN, ES, IT, DE, PT, AR, ZH, JA, Wolof',
          'Recevez une explication contextuelle dans la langue de votre choix',
          'Mode officiel pour usage académique, professionnel et diplomatique',
          'Préservation du registre (soutenu, technique, juridique, familier)',
          'Copie instantanée ou export pour intégration dans vos documents',
        ]}
        howToUse={[
          'Sélectionnez la langue source et la langue cible',
          'Choisissez dans quelle langue vous voulez l\'explication',
          'Collez votre texte (mot, phrase, paragraphe)',
          'Cliquez sur « Traduire & Expliquer »',
          'Copiez la traduction et/ou l\'explication',
        ]}
        tips={[
          'Pour un document long, segmentez en paragraphes (meilleure qualité)',
          'L\'explication est particulièrement utile pour apprendre une nouvelle langue',
          'Mode « Officiel » recommandé pour correspondance avec ambassade/institution',
          'Le Wolof est en orthographe latine standardisée',
        ]}
      />
      <div style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 999, background: 'var(--gold-glow)', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800, marginBottom: 12 }}>
          🧠 ABAWI TRANSLATOR ELITE
        </div>
        <h1 style={{ marginTop: 0, marginBottom: 8, color: 'var(--text-primary)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
          Traduction + explication avancée multilingue
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Traduction professionnelle et explication détaillée dans la langue de ton choix.
        </p>
        <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Mode officiel disponible pour usage académique, professionnel et diplomatique (ambassades/institutions).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: 10, marginBottom: 10 }}>
        <select value={fromLang} onChange={(e) => setFromLang(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>Depuis: {l.label}</option>)}
        </select>
        <select value={toLang} onChange={(e) => setToLang(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>Vers: {l.label}</option>)}
        </select>
        <select value={explainLang} onChange={(e) => setExplainLang(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>Explication: {l.label}</option>)}
        </select>
        <select value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {['exhaustive et pédagogique', 'professionnelle et structurée', 'courte et directe'].map((v) => (
            <option key={v} value={v}>Niveau: {v}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 12 }}>
        <select value={translationMode} onChange={(e) => setTranslationMode(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          <option value="pro">Mode professionnel</option>
          <option value="official">Mode officiel institutionnel</option>
        </select>
        <input
          value={domainContext}
          onChange={(e) => setDomainContext(e.target.value)}
          placeholder="Contexte (ex: note verbale ambassade, article académique, contrat juridique...)"
          style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: 10, marginBottom: 12 }}>
        <input value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} placeholder="Référence document" style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
        <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Auteur / Traducteur" style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
        <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Organisation" style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
        <input value={documentObject} onChange={(e) => setDocumentObject(e.target.value)} placeholder="Objet du document" style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
      </div>

      <textarea
        rows={7}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Colle ici le texte à traduire..."
        style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginBottom: 12 }}
      />

      <button
        onClick={runTranslation}
        disabled={!canRun}
        style={{ padding: '11px 16px', borderRadius: 10, border: '1px solid var(--gold-border)', background: 'var(--gold-glow)', color: 'var(--gold)', fontWeight: 800, cursor: canRun ? 'pointer' : 'not-allowed', marginBottom: 16 }}
      >
        {loading ? 'Traduction en cours...' : '🚀 Lancer Abawi Translator Elite'}
      </button>

      {!!error && <div style={{ color: '#ef4444', marginBottom: 12 }}>Erreur: {error}</div>}

      {result && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => exportToPDF('translator-official-export', `Traduction-Officielle-${referenceCode}`)}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--gold-border)', background: 'var(--gold-glow)', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}
            >
              Export PDF officiel
            </button>
            <button
              onClick={exportOfficialWord}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}
            >
              Export Word (.doc)
            </button>
            <button
              onClick={() => {
                const textOut = buildOfficialPlainText()
                navigator.clipboard?.writeText(textOut)
              }}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
            >
              Copier version officielle
            </button>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Langue détectée</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{result.detected_language || 'N/A'}</div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Traduction principale</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, whiteSpace: 'pre-wrap' }}>{result.translation || 'N/A'}</div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Variantes de traduction</div>
            <ul style={{ margin: '8px 0 0 18px', color: 'var(--text-secondary)' }}>
              {(result.alt_translations || []).map((v, i) => <li key={i}>{v}</li>)}
            </ul>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Glossaire terminologique contrôlé</div>
            {(result.terminology_glossary || []).map((g, i) => (
              <div key={i} style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                • <strong style={{ color: 'var(--text-primary)' }}>{g.source_term}</strong> → <strong style={{ color: 'var(--text-primary)' }}>{g.target_term}</strong><br />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{g.justification}</span>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Explication détaillée</div>
            <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{result.explanation || 'N/A'}</div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Exemples</div>
            {(result.examples || []).map((ex, i) => (
              <div key={i} style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                • {ex.source} → <strong style={{ color: 'var(--text-primary)' }}>{ex.target}</strong>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Contrôles qualité linguistique</div>
            <ul style={{ margin: '8px 0 0 18px', color: 'var(--text-secondary)' }}>
              {(result.quality_checks || []).map((v, i) => <li key={i}>{v}</li>)}
            </ul>
          </div>

          {translationMode === 'official' && result.official_layout && (
            <div style={{ border: '1px solid color-mix(in srgb, var(--gold) 40%, var(--border))', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
              <div style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700 }}>Version officielle prête institution</div>
              <div style={{ marginTop: 8, color: 'var(--text-primary)', fontWeight: 700 }}>{result.official_layout.title}</div>
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{result.official_layout.opening_formula}</div>
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{result.official_layout.body}</div>
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{result.official_layout.closing_formula}</div>
            </div>
          )}

          <div id="translator-official-export" style={{ background: '#fff', color: '#111', padding: 22, borderRadius: 10 }}>
            <h2 style={{ margin: 0 }}>{organizationName}</h2>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <div><strong>Reference:</strong> {referenceCode}</div>
              <div><strong>Date:</strong> {exportDate}</div>
              <div><strong>Auteur:</strong> {authorName}</div>
              <div><strong>Objet:</strong> {documentObject}</div>
              <div><strong>Langues:</strong> {fromLang} → {toLang}</div>
              <div><strong>Contexte:</strong> {domainContext}</div>
            </div>
            <hr />
            <h3>Traduction officielle</h3>
            <div style={{ whiteSpace: 'pre-wrap' }}>{result.translation || ''}</div>
            <h3>Variantes</h3>
            <ul>{(result.alt_translations || []).map((v, i) => <li key={i}>{v}</li>)}</ul>
            <h3>Explication</h3>
            <div style={{ whiteSpace: 'pre-wrap' }}>{result.explanation || ''}</div>
            <h3>Controles qualite</h3>
            <ul>{(result.quality_checks || []).map((v, i) => <li key={i}>{v}</li>)}</ul>
            {result.official_layout && (
              <>
                <h3>Version institutionnelle</h3>
                <div style={{ whiteSpace: 'pre-wrap' }}>{result.official_layout.title}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{result.official_layout.opening_formula}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{result.official_layout.body}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{result.official_layout.closing_formula}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
