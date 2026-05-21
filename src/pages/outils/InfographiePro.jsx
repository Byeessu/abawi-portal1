import { useMemo, useRef, useState } from 'react'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { useToolAccess } from '../../hooks/useToolAccess'
import { cleanIAText } from '../../lib/cleanText'
import { groqChatCompletion } from '../../lib/groqClient'
import { toUserFriendlyAIError } from '../../lib/aiErrorMessages'
import TokenCounter from '../../components/TokenCounter'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

const CANVAS_FORMATS = [
  { id: 'square_1080', label: 'Post carré (1080×1080)', w: 1080, h: 1080 },
  { id: 'story_916', label: 'Story 9:16 (1080×1920)', w: 1080, h: 1920 },
  { id: 'landscape_169', label: 'Paysage 16:9 (1920×1080)', w: 1920, h: 1080 },
  { id: 'portrait_45', label: 'Portrait 4:5 (1080×1350)', w: 1080, h: 1350 },
]

const VISUAL_THEMES = {
  abyss: {
    name: 'Abysse',
    pageBg: 'linear-gradient(160deg,#020617 0%,#0f172a 55%,#1e1b4b 100%)',
    header: '#94a3b8',
    title: '#f8fafc',
    subtitle: '#cbd5e1',
    footer: '#64748b',
    body: '#e2e8f0',
    cardBorder: (c) => `${c}55`,
    cardInner: (c) => `${c}18`,
  },
  paper: {
    name: 'Studio clair',
    pageBg: 'linear-gradient(180deg,#f8fafc,#e2e8f0)',
    header: '#64748b',
    title: '#0f172a',
    subtitle: '#475569',
    footer: '#94a3b8',
    body: '#334155',
    cardBorder: (c) => `${c}aa`,
    cardInner: (c) => `${c}30`,
  },
  gold: {
    name: 'Or prestige',
    pageBg: 'linear-gradient(145deg,#1c1917,#292524 45%,#422006)',
    header: '#a8a29e',
    title: '#fffbeb',
    subtitle: '#fcd34d',
    footer: '#78716c',
    body: '#fef3c7',
    cardBorder: () => 'rgba(245,158,11,0.45)',
    cardInner: (c) => `${c}24`,
  },
  ocean: {
    name: 'Signal cyan',
    pageBg: 'linear-gradient(135deg,#042f2e,#0c4a6e,#172554)',
    header: '#99f6e4',
    title: '#ecfeff',
    subtitle: '#a5f3fc',
    footer: '#5eead4',
    body: '#ccfbf1',
    cardBorder: (c) => '#22d3ee55',
    cardInner: (c) => `${c}1f`,
  },
}

export default function InfographiePro() {
  const { membre } = useAuth()
  const tool = useToolAccess('studio', 'infographie')
  const [showPayment, setShowPayment] = useState(false)
  const previewRef = useRef(null)
  const [formatId, setFormatId] = useState(CANVAS_FORMATS[0].id)
  const fmt = CANVAS_FORMATS.find((f) => f.id === formatId) || CANVAS_FORMATS[0]
  const [themeKey, setThemeKey] = useState('abyss')
  const theme = VISUAL_THEMES[themeKey] || VISUAL_THEMES.abyss

  const [title, setTitle] = useState('Tableau de synthèse stratégique')
  const [subtitle, setSubtitle] = useState('Vision claire, actions mesurables, exécution rapide')
  const [logoUrl, setLogoUrl] = useState('')
  const [headerText, setHeaderText] = useState('ABAWI IA - Document professionnel')
  const [footerText, setFooterText] = useState('Confidentiel - Généré avec ABAWI')
  const [items, setItems] = useState([
    { id: 1, label: 'Objectif', value: 'Croissance durable', color: '#22D3EE' },
    { id: 2, label: 'Marché', value: 'PME Afrique francophone', color: '#60A5FA' },
    { id: 3, label: 'Canal', value: 'Digital + Commercial terrain', color: '#A78BFA' },
    { id: 4, label: 'KPI', value: 'Conversion, Rétention, MRR', color: '#34D399' },
  ])
  const [mode, setMode] = useState('infographie')
  const [aiBrief, setAiBrief] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [pngLoading, setPngLoading] = useState(false)

  const displayScale = useMemo(() => Math.min(460 / fmt.w, 520 / fmt.h, 1), [fmt.w, fmt.h])

  const doc = useMemo(
    () => ({
      title,
      subtitle,
      logoUrl,
      headerText,
      footerText,
      items,
      formatId,
      themeKey,
      generatedAt: new Date().toISOString(),
    }),
    [title, subtitle, logoUrl, headerText, footerText, items, formatId, themeKey],
  )

  function updateItem(id, key, value) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)))
  }

  function addItem() {
    const nextId = (items.at(-1)?.id || 0) + 1
    setItems((prev) => [...prev, { id: nextId, label: `Bloc ${nextId}`, value: 'Nouveau contenu', color: '#F59E0B' }])
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    download(blob, `infographie-${Date.now()}.json`)
  }

  function exportMarkdown() {
    const md = [
      `# ${title}`,
      '',
      subtitle,
      '',
      `Header: ${headerText}`,
      '',
      ...items.map((it) => `- **${it.label}**: ${it.value}`),
      '',
      `Footer: ${footerText}`,
    ].join('\n')
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    download(blob, `infographie-${Date.now()}.md`)
  }

  function exportHTML() {
    const cardHtml = items
      .map(
        (it) =>
          `<article style="border:1px solid ${it.color}66;border-radius:12px;padding:12px;background:${it.color}1A"><h3 style="margin:0 0 8px;color:${it.color}">${escapeHtml(it.label)}</h3><p style="margin:0;color:#dbe7f4">${escapeHtml(it.value)}</p></article>`,
      )
      .join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head><body style="background:#070b0f;color:#f0f2f5;font-family:Arial,sans-serif;padding:20px"><header style="margin-bottom:14px;color:#9fb0c4">${escapeHtml(headerText)}</header><h1>${escapeHtml(title)}</h1><p style="color:#9fb0c4">${escapeHtml(subtitle)}</p><section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">${cardHtml}</section><footer style="margin-top:18px;color:#8b95a5;font-size:12px">${escapeHtml(footerText)}</footer></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    download(blob, `infographie-${Date.now()}.html`)
  }

  function importJSON(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || '{}'))
        setTitle(payload.title || '')
        setSubtitle(payload.subtitle || '')
        setLogoUrl(payload.logoUrl || '')
        setHeaderText(payload.headerText || '')
        setFooterText(payload.footerText || '')
        setItems(Array.isArray(payload.items) && payload.items.length ? payload.items : [])
        if (payload.formatId && CANVAS_FORMATS.some((x) => x.id === payload.formatId)) setFormatId(payload.formatId)
        if (payload.themeKey && VISUAL_THEMES[payload.themeKey]) setThemeKey(payload.themeKey)
      } catch {
        // no-op
      }
    }
    reader.readAsText(f)
  }

  async function exportPNG() {
    if (!tool.allowed) { setShowPayment(true); return }
    if (!previewRef.current) return
    setPngLoading(true)
    setAiError('')
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      })
      await new Promise((resolve, reject) => {
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              download(blob, `infographie-${fmt.w}x${fmt.h}-${Date.now()}.png`)
              if (!tool.unlimited) {
                const res = await tool.debit()
                if (!res.ok) { setShowPayment(true) }
              }
              resolve()
            } else reject(new Error('blob'))
          },
          'image/png',
          0.95,
        )
      })
    } catch {
      setAiError("Export PNG échoué (souvent lié au logo distant sans CORS). Retirez l'URL du logo ou hébergez-le sur votre domaine.")
    } finally {
      setPngLoading(false)
    }
  }

  async function generateWithAI() {
    if (!tool.allowed) { setShowPayment(true); return }
    setAiError('')
    if (!aiBrief.trim()) return
    setAiLoading(true)
    try {
      const prompt = `Crée une structure de contenu visuel professionnel type affiche / carrousel social.
Mode: ${mode}
Brief: ${aiBrief}
Retourne UNIQUEMENT un JSON valide (sans markdown):
{"title":"...","subtitle":"...","headerText":"...","footerText":"...","items":[{"label":"...","value":"...","color":"#RRGGBB"}]}]`
      const data = await groqChatCompletion(
        {
          model: GROQ_MODEL,
          max_tokens: 900,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }],
        },
        GROQ_KEY,
      )
      const raw = cleanIAText(data?.choices?.[0]?.message?.content || '')
      const json = JSON.parse(
        String(raw)
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim(),
      )
      setTitle(json.title || title)
      setSubtitle(json.subtitle || subtitle)
      setHeaderText(json.headerText || headerText)
      setFooterText(json.footerText || footerText)
      if (Array.isArray(json.items) && json.items.length) {
        setItems(
          json.items.map((it, idx) => ({
            id: idx + 1,
            label: it.label || `Bloc ${idx + 1}`,
            value: it.value || '',
            color: it.color || '#22D3EE',
          })),
        )
      }
      if (!tool.unlimited) {
        const res = await tool.debit()
        if (!res.ok) { setShowPayment(true) }
      }
    } catch (e) {
      setAiError(toUserFriendlyAIError(e, 'Impossible de générer la structure. Vérifiez le brief ou réessayez.'))
    } finally {
      setAiLoading(false)
    }
  }

  const scaledW = Math.round(fmt.w * displayScale)
  const scaledH = Math.round(fmt.h * displayScale)

  return (
    <main style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 22px 80px' }}>
      <SEO title="Infographie Pro — Créateur de visuels professionnels" description="Créez des infographies et visuels professionnels. Templates premium, export haute définition." image="/og-tools/infographie-pro.jpg" />
      <style>{`
        @media (max-width: 700px) {
          .ip-workspace-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
      <ToolInfoPanel
        toolName="Infographie Pro IA"
        icon="🎨"
        description="Créez des visuels professionnels (posts, stories, banners) avec l'IA et exportez en PNG haute résolution"
        benefits={[
          'Générez le contenu de votre infographie en décrivant simplement votre sujet à l\'IA',
          'Choisissez parmi 4 formats (carré, story 9:16, paysage, portrait) prêts pour tous les réseaux',
          'Appliquez des thèmes visuels professionnels (Abysse, Studio clair, Or prestige, Signal cyan)',
          'Exportez en PNG HD directement depuis votre navigateur sans aucun logiciel',
          'Ajoutez votre logo, en-tête et pied de page pour un rendu à votre image',
        ]}
        howToUse={[
          'Choisissez votre format (post Instagram, story, banner LinkedIn…)',
          'Sélectionnez un thème visuel qui correspond à votre charte graphique',
          'Décrivez votre contenu dans le champ IA ou saisissez-le manuellement',
          'Ajustez les éléments (titre, sous-titre, données, logo) via les champs',
          'Cliquez sur « Export PNG » pour télécharger votre infographie',
        ]}
        tips={[
          'Pour un résultat optimal, utilisez des phrases courtes et percutantes dans les titres',
          'Le thème « Or prestige » est idéal pour les contenus luxe et événements haut de gamme',
          'Combinez plusieurs exports pour créer une série cohérente de publications',
        ]}
      />

      <section
        style={{
          border: '1px solid #1A2332',
          borderRadius: 16,
          padding: 16,
          background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(2,6,23,0.9))',
        }}
      >
        <div style={{ color: '#67E8F9', fontWeight: 800, fontSize: '0.76rem' }}>OUTILS ABAWI / INFOGRAPHIE PRO IA</div>
        <h1 style={{ color: 'var(--text-primary)', marginTop: 10 }}>Infographie Pro IA</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 920 }}>
          Aperçu « type Canva » avec formats fixes, thèmes, export PNG HD depuis le rendu, plus JSON / Markdown / HTML.
          Pour un éditeur complet (calques, millions d’assets), il faudrait un moteur dédié (Polotno, Fabric, service
          externe) — ici on vise des visuels pro rapides et exportables.
        </p>
      </section>

      <section className="ip-workspace-grid" style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)', gap: 14 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'var(--bg-card)' }}>
          <Label text="Format canvas (export PNG)" />
          <select value={formatId} onChange={(e) => setFormatId(e.target.value)} style={field}>
            {CANVAS_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <Label text="Thème visuel" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {Object.entries(VISUAL_THEMES).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setThemeKey(k)} style={btn(themeKey === k ? '#2563EB' : '#334155')}>
                {v.name}
              </button>
            ))}
          </div>
          <Label text="Mode créatif" />
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            {['infographie', 'slides', 'animation'].map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} style={btn(mode === m ? '#2563EB' : '#334155')}>
                {m}
              </button>
            ))}
          </div>
          <Label text="Brief IA" />
          <textarea
            value={aiBrief}
            onChange={(e) => setAiBrief(e.target.value)}
            style={{ ...field, minHeight: 70, resize: 'vertical' }}
            placeholder="Ex: campagne premium fintech Afrique, ton sobre, 4 piliers clés..."
          />
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={generateWithAI} disabled={aiLoading || !aiBrief.trim()} style={btn('#0EA5E9')}>
              {aiLoading ? 'Génération...' : '✨ Générer avec IA'}
            </button>
          </div>
          {aiError && (
            <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: 10 }} role="alert">
              {aiError}
            </p>
          )}
          <Label text="Titre" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={field} />
          <Label text="Sous-titre" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={field} />
          <Label text="Logo (URL — même origine ou CORS pour PNG)" />
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={field} placeholder="https://..." />
          <Label text="Entête" />
          <input value={headerText} onChange={(e) => setHeaderText(e.target.value)} style={field} />
          <Label text="Pied de page" />
          <input value={footerText} onChange={(e) => setFooterText(e.target.value)} style={field} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={addItem} style={btn('#3B82F6')}>
              Ajouter un bloc
            </button>
            <button type="button" onClick={exportPNG} disabled={pngLoading} style={btn('#EC4899')}>
              {pngLoading ? 'Export PNG…' : `📷 PNG ${fmt.w}×${fmt.h}`}
            </button>
            <button type="button" onClick={exportJSON} style={btn('#14B8A6')}>
              JSON
            </button>
            <button type="button" onClick={exportMarkdown} style={btn('#8B5CF6')}>
              Markdown
            </button>
            <button type="button" onClick={exportHTML} style={btn('#F59E0B')}>
              HTML
            </button>
            <button
              type="button"
              onClick={() =>
                download(
                  new Blob([JSON.stringify({ mode, slides: items, meta: { title, subtitle, headerText, footerText, formatId, themeKey } }, null, 2)], {
                    type: 'application/json',
                  }),
                  `infographie-deck-${Date.now()}.json`,
                )
              }
              style={btn('#7C3AED')}
            >
              Deck JSON
            </button>
            <label style={{ ...btn('#334155'), display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              Importer JSON
              <input type="file" accept=".json,application/json" onChange={importJSON} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'var(--bg-card)', maxHeight: 720, overflow: 'auto' }}>
          {items.map((it) => (
            <div key={it.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                <input value={it.label} onChange={(e) => updateItem(it.id, 'label', e.target.value)} style={field} />
                <input value={it.value} onChange={(e) => updateItem(it.id, 'value', e.target.value)} style={field} />
                <input
                  type="color"
                  value={it.color}
                  onChange={(e) => updateItem(it.id, 'color', e.target.value)}
                  style={{ width: 44, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
              <button type="button" onClick={() => removeItem(it.id)} style={{ ...btn('#DC2626'), marginTop: 8 }}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 10 }}>
          Aperçu rendu (échelle {Math.round(displayScale * 100)} % — export PNG à {fmt.w}×{fmt.h} px)
        </div>
        <div
          style={{
            width: scaledW,
            height: scaledH,
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            border: '1px solid #1e293b',
          }}
        >
          <div
            ref={previewRef}
            style={{
              width: fmt.w,
              height: fmt.h,
              transform: `scale(${displayScale})`,
              transformOrigin: 'top left',
              background: theme.pageBg,
              padding: Math.round(fmt.w * 0.055),
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: fmt.h > fmt.w ? 14 : 10,
            }}
          >
            <div style={{ color: theme.header, fontSize: Math.max(18, fmt.w * 0.022), fontWeight: 600 }}>{headerText}</div>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                aria-hidden="true"
                crossOrigin="anonymous"
                style={{ height: Math.max(36, fmt.h * 0.06), width: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }}
              />
            ) : null}
            <h2 style={{ color: theme.title, margin: 0, fontSize: Math.max(28, fmt.w * 0.05), lineHeight: 1.12 }}>{title}</h2>
            <p style={{ color: theme.subtitle, margin: 0, fontSize: Math.max(16, fmt.w * 0.026), lineHeight: 1.35 }}>{subtitle}</p>
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: `repeat(${items.length > 4 ? 2 : Math.min(items.length || 1, 2)}, minmax(0, 1fr))`,
                gap: Math.max(10, fmt.w * 0.018),
                alignContent: 'start',
              }}
            >
              {items.map((it) => (
                <article
                  key={`preview-${it.id}`}
                  style={{
                    border: `2px solid ${theme.cardBorder(it.color)}`,
                    borderRadius: Math.max(12, fmt.w * 0.02),
                    padding: Math.max(12, fmt.w * 0.022),
                    background: theme.cardInner(it.color),
                    animation: mode === 'animation' ? 'infographiePulse 2.4s ease-in-out infinite' : 'none',
                  }}
                >
                  <h3 style={{ color: it.color, margin: '0 0 8px', fontSize: Math.max(15, fmt.w * 0.024) }}>{it.label}</h3>
                  <p style={{ color: theme.body, margin: 0, fontSize: Math.max(13, fmt.w * 0.021), lineHeight: 1.4 }}>{it.value}</p>
                </article>
              ))}
            </div>
            <div style={{ color: theme.footer, fontSize: Math.max(12, fmt.w * 0.018), marginTop: 'auto' }}>{footerText}</div>
          </div>
        </div>
        <style>{`@keyframes infographiePulse {0%{transform:translateY(0);opacity:.92}50%{transform:translateY(-3px);opacity:1}100%{transform:translateY(0);opacity:.92}}`}</style>
        {mode === 'slides' && (
          <div style={{ marginTop: 10, color: '#60A5FA', fontSize: '0.78rem' }}>Mode slides : chaque bloc peut servir de slide ; exportez le PNG pour une image unique ou le deck JSON.</div>
        )}
      </section>
    </main>
  )
}

function download(blob, filename) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 400)
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function Label({ text }) {
  return <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 8, marginBottom: 5 }}>{text}</label>
}

const field = { width: '100%', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '9px 10px' }
const btn = (color) => ({
  borderRadius: 9,
  border: 'none',
  padding: '8px 10px',
  color: '#fff',
  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
  fontWeight: 700,
  cursor: 'pointer',
})
