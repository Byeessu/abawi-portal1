export default function StudioVisuelPro() {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 22px 80px' }}>
      <h1 style={{ color: 'var(--text-primary, #f8fafc)', marginTop: 0 }}>Studio visuel Pro</h1>
      <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.65 }}>
        Pour un éditeur graphique complet façon Canva dans le portail, la stack recommandée est{' '}
        <strong>Polotno</strong> (React) avec une clé API (
        <a href="https://polotno.com/cabinet/" target="_blank" rel="noreferrer">
          polotno.com/cabinet
        </a>
        ). Installez les paquets <code style={{ color: '#67e8f9' }}>polotno</code>,{' '}
        <code style={{ color: '#67e8f9' }}>@blueprintjs/core</code>,{' '}
        <code style={{ color: '#67e8f9' }}>@blueprintjs/icons</code>,{' '}
        <code style={{ color: '#67e8f9' }}>@blueprintjs/select</code>, puis définissez{' '}
        <code style={{ color: '#67e8f9' }}>VITE_POLOTNO_API_KEY</code> au build.
      </p>
      <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>
        En attendant, utilisez{' '}
        <a href="/outils/infographie-pro" style={{ color: '#38bdf8' }}>
          Infographie Pro IA
        </a>{' '}
        (aperçu + export PNG) ou le{' '}
        <a href="/outils/photo-studio-pro" style={{ color: '#38bdf8' }}>
          Studio photo identité
        </a>
        .
      </p>
      <p style={{ marginTop: 24 }}>
        <a
          href="https://polotno.com/"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            padding: '12px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Ouvrir le site Polotno (démo & doc)
        </a>
      </p>
    </main>
  )
}
