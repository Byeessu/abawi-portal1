import { useEffect, useState } from 'react'
import { useAudio } from '../context/AudioContext'
import Equalizer from './Equalizer'

export default function ContentViewer({ type, src, titre, onClose }) {
  const audio = useAudio()
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [editOpen, setEditOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [workingText, setWorkingText] = useState('')

  useEffect(() => {
    if (type === 'audio' && src) {
      audio.play({ id: titre, titre, serie: 'ABAWI', src })
    }
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [src, type])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#070B0F', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        height: 56, background: '#0D1117', borderBottom: '1px solid #1A2332',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.1rem' }}>{type === 'pdf' ? '📄' : '🎧'}</span>
          <span style={{ fontWeight: 600, color: '#F0F2F5', fontSize: '0.95rem' }}>{titre}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {type === 'pdf' && (
            <button onClick={() => setEditOpen((v) => !v)} style={{
              padding: '7px 14px', borderRadius: 8,
              background: 'rgba(24,168,74,0.1)', border: '1px solid rgba(24,168,74,0.3)',
              color: '#18A84A', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
            }}>
              {editOpen ? '🧩 Masquer éditeur' : '🧩 Modifier PDF'}
            </button>
          )}
          {src && type === 'pdf' && (
            <a href={src} download style={{
              padding: '7px 14px', borderRadius: 8,
              background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)',
              color: '#F0B429', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ⬇️ Télécharger
            </a>
          )}
          <button onClick={onClose} style={{
            padding: '7px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', border: 'none',
            color: '#F0F2F5', cursor: 'pointer', fontSize: '0.82rem',
            fontFamily: 'Outfit, sans-serif',
          }}>✕ Fermer</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {type === 'pdf' && src && (
          isMobile ? (
            /* Mobile: no iframe — show open/download buttons */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 20, padding: 32,
            }}>
              <div style={{ fontSize: '3.5rem' }}>📄</div>
              <h2 style={{ color: '#F0F2F5', textAlign: 'center', fontSize: '1.1rem', maxWidth: 300 }}>{titre}</h2>
              <p style={{ color: '#8B95A5', fontSize: '0.88rem', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
                Les PDFs s'ouvrent mieux dans votre navigateur ou application de lecture.
              </p>
              <a href={src} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 14, textDecoration: 'none',
                background: 'linear-gradient(135deg, #F0B429, #e5a820)',
                color: '#070B0F', fontWeight: 800, fontSize: '1rem',
                boxShadow: '0 4px 16px rgba(240,180,41,0.3)',
              }}>
                📖 Lire le PDF
              </a>
              <a href={src} download style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12, textDecoration: 'none',
                background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.3)',
                color: '#F0B429', fontWeight: 700, fontSize: '0.9rem',
              }}>
                ⬇️ Télécharger
              </a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: editOpen ? 'minmax(0,2fr) minmax(300px,1fr)' : '1fr', height: '100%' }}>
              <iframe
                src={src + '#toolbar=1&navpanes=1&scrollbar=1'}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={titre}
              />
              {editOpen && (
                <div style={{ borderLeft: '1px solid #1A2332', padding: 14, overflowY: 'auto', background: '#0B1119' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#F0F2F5', fontSize: '0.92rem' }}>Atelier d’édition</h3>
                  <p style={{ margin: '0 0 12px', color: '#8B95A5', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    Ajoutez des annotations, importez du texte ou préparez une version modifiée à exporter.
                  </p>
                  <label style={{ display: 'block', marginBottom: 8, color: '#8B95A5', fontSize: '0.75rem' }}>Upload document texte (txt/md/json/csv/html)</label>
                  <input
                    type="file"
                    accept=".txt,.md,.json,.csv,.html,.htm"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const text = await file.text()
                      setWorkingText(text)
                      setUploadName(file.name)
                    }}
                    style={{ width: '100%', marginBottom: 10 }}
                  />
                  {uploadName && <div style={{ color: '#18A84A', fontSize: '0.75rem', marginBottom: 8 }}>Fichier chargé: {uploadName}</div>}
                  <label style={{ display: 'block', marginBottom: 8, color: '#8B95A5', fontSize: '0.75rem' }}>Contenu éditable</label>
                  <textarea
                    value={workingText}
                    onChange={(e) => setWorkingText(e.target.value)}
                    placeholder="Collez ici le texte à intégrer dans votre version document..."
                    style={{ width: '100%', minHeight: 120, borderRadius: 8, background: '#0D1117', color: '#E5E7EB', border: '1px solid #263245', padding: 10, marginBottom: 10 }}
                  />
                  <label style={{ display: 'block', marginBottom: 8, color: '#8B95A5', fontSize: '0.75rem' }}>Notes PDF</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Corrections, signatures à apposer, sections à modifier..."
                    style={{ width: '100%', minHeight: 140, borderRadius: 8, background: '#0D1117', color: '#E5E7EB', border: '1px solid #263245', padding: 10 }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                    <button onClick={() => downloadText('txt', `${titre || 'document'}-edite.txt`, [workingText, notes].filter(Boolean).join('\n\n'))} style={btnStyle}>Export TXT</button>
                    <button onClick={() => downloadText('md', `${titre || 'document'}-edite.md`, `# ${titre || 'Document'}\n\n${workingText}\n\n## Notes\n${notes}`)} style={btnStyle}>Export MD</button>
                    <button onClick={() => downloadText('html', `${titre || 'document'}-edite.html`, `<h1>${escapeHtml(titre || 'Document')}</h1><pre>${escapeHtml(workingText || '')}</pre><h2>Notes</h2><pre>${escapeHtml(notes || '')}</pre>`)} style={btnStyle}>Export HTML</button>
                    <button onClick={() => window.print()} style={btnStyle}>Imprimer/PDF</button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
        {type === 'audio' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', flexDirection: 'column', gap: 24,
          }}>
            <div style={{ fontSize: '4rem' }}>🎧</div>
            <h2 style={{ color: '#F0F2F5', textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>{titre}</h2>
            <Equalizer size="xl" />
            <div style={{ color: '#8B95A5', fontSize: '0.9rem', textAlign: 'center' }}>
              Le lecteur en bas de page vous permet de continuer l'écoute en naviguant
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => audio.playing ? audio.pause() : audio.replay()} style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                background: '#18A84A', color: '#fff', fontWeight: 700,
                fontSize: '1rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              }}>
                {audio.playing ? '⏸ Pause' : '▶ Reprendre'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #2b3a4d',
  background: '#0F1723',
  color: '#D1D5DB',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: 700,
  fontFamily: 'Outfit, sans-serif',
}

function downloadText(ext, filename, content) {
  const blob = new Blob([content || ''], { type: ext === 'html' ? 'text/html' : 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
