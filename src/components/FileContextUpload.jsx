import { useRef, useState } from 'react'
import { extractFilesText } from '../lib/fileExtract'

const ACCEPT = '.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.md,.csv,.json,.rtf,.html'

/**
 * Reusable file upload zone for AI context injection.
 * Usage:
 *   const [uploadedContext, setUploadedContext] = useState('')
 *   <FileContextUpload onExtracted={setUploadedContext} label="Documents de référence" />
 *
 * Then in your AI prompt: include `uploadedContext.slice(0, 8000)` as extra context.
 */
export default function FileContextUpload({ onExtracted, label = 'Documents de référence', hint }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function process(fileList) {
    const list = Array.from(fileList || [])
    if (!list.length) return
    setFiles(list)
    setDone(false)
    setLoading(true)
    try {
      const text = await extractFilesText(list)
      onExtracted(text)
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setFiles([])
    setDone(false)
    onExtracted('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {hint && (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 6 }}>{hint}</div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--gold, #F0B429)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: dragging ? 'rgba(240,180,41,0.06)' : 'var(--bg-card)',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>📎</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Extraction en cours…</span>
          ) : done && files.length ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
              {files.length} fichier{files.length > 1 ? 's' : ''} importé{files.length > 1 ? 's' : ''} :{' '}
              <span style={{ color: 'var(--gold, #F0B429)', fontWeight: 600 }}>
                {files.slice(0, 3).map((f) => f.name).join(', ')}{files.length > 3 ? '…' : ''}
              </span>
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Glissez ou cliquez — PDF, Word, Excel, PowerPoint, TXT…
            </span>
          )}
        </div>
        {files.length > 0 && !loading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clear() }}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: 4 }}
            title="Effacer les fichiers"
          >
            ×
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={(e) => process(e.target.files)}
      />
    </div>
  )
}
