import { useMemo, useState } from 'react'
import { callGroq, hasGroqAccess } from '../lib/groqClient'

const DOC_PROFILE_KEY = 'abawi_doc_profile'

const DEFAULTS = {
  includeHeader: false,
  includeFooter: false,
  headerText: '',
  footerText: '',
  logoUrl: '',
  profilePhotoUrl: '',
  signatureUrl: '',
  cachetUrl: '',
  includePageNumbers: false,
  pageNumberStart: 1,
}

function migrateMergedProfile(merged) {
  const m = { ...merged }
  if (m.headerText === 'Document ABAWI') {
    m.headerText = ''
    m.includeHeader = false
  }
  if (m.footerText === 'Document généré avec ABAWI') {
    m.footerText = ''
    m.includeFooter = false
  }
  return m
}

function readProfile() {
  try {
    const raw = localStorage.getItem(DOC_PROFILE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    return migrateMergedProfile({ ...DEFAULTS, ...(parsed || {}) })
  } catch {
    return { ...DEFAULTS }
  }
}

export default function DocumentProfileManager() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState(() => readProfile())
  const [loadingAI, setLoadingAI] = useState(false)
  const hasGroq = useMemo(() => hasGroqAccess(), [])

  function save(next = state) {
    localStorage.setItem(DOC_PROFILE_KEY, JSON.stringify(next))
    setState(next)
  }

  function patch(key, value) {
    const next = { ...state, [key]: value }
    setState(next)
  }

  function readImage(file, key) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => patch(key, String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function generateTexts() {
    if (!hasGroq) return
    setLoadingAI(true)
    try {
      const prompt = `Génère 2 textes professionnels en français pour des documents que l'utilisateur envoie à ses clients (factures, rapports, contrats).
1) Entête courte (max 80 caractères) : nom de l'entreprise ou slogan du client, SANS mentionner une plateforme ou un logiciel tiers.
2) Pied de page (max 110 caractères) : coordonnées ou mention légale du client, SANS nom de plateforme.
Réponds strictement en JSON: {"header":"...","footer":"..."}`
      const out = await callGroq(prompt)
      const json = JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] || '{}')
      const next = {
        ...state,
        headerText: json.header || state.headerText,
        footerText: json.footer || state.footerText,
      }
      save(next)
    } catch {
      // no-op
    } finally {
      setLoadingAI(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'color-mix(in srgb, var(--bg-card) 80%, var(--border))',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          padding: '6px 12px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 700,
        }}
        title="Profil des documents"
      >
        🧾 Docs
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              zIndex: 1001,
              width: 360,
              maxWidth: '90vw',
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              padding: 14,
              boxShadow: '0 14px 38px rgba(0,0,0,0.35)',
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.82rem' }}>PROFIL DOCUMENT GLOBAL</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
              <input type="checkbox" checked={state.includeHeader} onChange={(e) => patch('includeHeader', e.target.checked)} />
              Inclure entête
            </label>
            <input value={state.headerText} onChange={(e) => patch('headerText', e.target.value)} placeholder="Texte d'entête" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <input value={state.logoUrl} onChange={(e) => patch('logoUrl', e.target.value)} placeholder="URL logo (optionnelle)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Import logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => readImage(e.target.files?.[0], 'logoUrl')}
                  style={{ display: 'block', marginTop: 4 }}
                />
              </label>
              {state.logoUrl ? (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OK</span>
              ) : null}
            </div>
            <input value={state.profilePhotoUrl} onChange={(e) => patch('profilePhotoUrl', e.target.value)} placeholder="URL photo profil (optionnelle)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <input value={state.signatureUrl} onChange={(e) => patch('signatureUrl', e.target.value)} placeholder="URL signature (optionnelle)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <input value={state.cachetUrl} onChange={(e) => patch('cachetUrl', e.target.value)} placeholder="URL cachet (optionnelle)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Import signature
                <input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], 'signatureUrl')} style={{ display: 'block', marginTop: 4 }} />
              </label>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Import cachet
                <input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], 'cachetUrl')} style={{ display: 'block', marginTop: 4 }} />
              </label>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
              <input type="checkbox" checked={state.includeFooter} onChange={(e) => patch('includeFooter', e.target.checked)} />
              Inclure pied de page
            </label>
            <input value={state.footerText} onChange={(e) => patch('footerText', e.target.value)} placeholder="Texte de pied de page" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.76rem', marginTop: 4 }}>
              <input type="checkbox" checked={state.includePageNumbers} onChange={(e) => patch('includePageNumbers', e.target.checked)} />
              Numéroter les pages
            </label>
            <input
              type="number"
              min={1}
              value={state.pageNumberStart}
              disabled={!state.includePageNumbers}
              onChange={(e) => patch('pageNumberStart', parseInt(e.target.value || '1', 10))}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: state.includePageNumbers ? 1 : 0.6 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => save()} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--gold-border)', background: 'var(--gold-glow)', color: 'var(--gold)', fontWeight: 700 }}>Enregistrer</button>
              <button onClick={() => { const reset = { ...DEFAULTS }; save(reset) }} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700 }}>Réinitialiser</button>
            </div>
            <button
              disabled={!hasGroq || loadingAI}
              onClick={generateTexts}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--accent3) 28%, transparent)', color: 'var(--text-primary)', fontWeight: 700, opacity: !hasGroq ? 0.55 : 1 }}
            >
              {loadingAI ? 'Génération IA...' : '✨ Générer entête/pied avec IA'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
