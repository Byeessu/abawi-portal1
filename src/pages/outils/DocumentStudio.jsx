import { useMemo, useState } from 'react'

const ACCEPTED = '.pdf,.txt,.md,.json,.csv,.html,.htm,.doc,.docx,.ppt,.pptx'

export default function DocumentStudio() {
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [content, setContent] = useState('')
  const [fileList, setFileList] = useState([])
  const [notes, setNotes] = useState('')

  const isPdf = useMemo(() => fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf'), [fileName, fileType])

  async function readTextMaybe(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    try {
      if (ext === 'docx' || ext === 'doc') {
        const mammoth = await import('mammoth')
        const data = await file.arrayBuffer()
        const out = await mammoth.extractRawText({ arrayBuffer: data })
        return String(out?.value || '').trim()
      }
      if (['txt', 'md', 'json', 'csv', 'html', 'htm', 'rtf'].includes(ext)) return String(await file.text()).trim()
      if (['pptx', 'ppt'].includes(ext)) return `[PowerPoint: ${file.name} — conversion/lecture non disponible]`
      // fallback: peut échouer sur formats binaires
      return String(await file.text()).trim()
    } catch {
      return ''
    }
  }

  async function onUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setFileList(files)

    const primary = files[0]
    setFileName(primary.name)
    setFileType(primary.type || '')

    const primaryUrl = URL.createObjectURL(primary)
    setSourceUrl(primaryUrl)

    const nonPdfTexts = []
    for (const f of files) {
      if (f.name.toLowerCase().endsWith('.pdf')) continue
      const t = await readTextMaybe(f)
      if (t) nonPdfTexts.push(`--- ${f.name} ---\n\n${t}`)
    }
    setContent(nonPdfTexts.join('\n\n'))
  }

  function download(ext) {
    const base = (fileName || 'document').replace(/\.[^.]+$/, '')
    const output = [content, notes].filter(Boolean).join('\n\n')
    let data = output
    let mime = 'text/plain'
    if (ext === 'md') data = `# ${base}\n\n${output}`
    if (ext === 'json') data = JSON.stringify({ title: base, content, notes, exportedAt: new Date().toISOString() }, null, 2)
    if (ext === 'html') {
      mime = 'text/html'
      data = `<h1>${escapeHtml(base)}</h1><pre>${escapeHtml(content)}</pre><h2>Notes</h2><pre>${escapeHtml(notes)}</pre>`
    }
    if (ext === 'json') mime = 'application/json'
    const blob = new Blob([data], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 80px' }}>
      <section style={{ marginBottom: 18 }}>
        <span style={{ fontSize: '0.76rem', color: '#F0B429', fontWeight: 800, letterSpacing: 1 }}>NOUVEAU • ABAWI DOCUMENT STUDIO</span>
        <h1 style={{ margin: '8px 0', color: '#F7F7F8' }}>Lecteur + Éditeur + Convertisseur multi-formats</h1>
        <p style={{ color: '#9CA3AF', maxWidth: 820 }}>Importez vos documents, lisez-les, ajoutez vos notes de modification, puis exportez dans plusieurs formats professionnels.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden', minHeight: 600, background: '#0B1119' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <input type="file" accept={ACCEPTED} multiple onChange={onUpload} />
            {sourceUrl && !isPdf && (
              <a href={sourceUrl} download={fileName} style={{ color: '#18A84A', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>Télécharger original</a>
            )}
          </div>
          {!sourceUrl && <div style={{ padding: 18, color: '#9CA3AF' }}>Chargez un document pour commencer.</div>}
          {sourceUrl && isPdf && (
            <iframe title={fileName || 'PDF'} src={`${sourceUrl}#toolbar=1`} style={{ width: '100%', height: 540, border: 'none' }} />
          )}
          {(sourceUrl && (!isPdf || content)) && (
            <textarea value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '100%', minHeight: 540, border: 'none', background: '#0B1119', color: '#E5E7EB', padding: 14 }} />
          )}
        </div>

        <aside style={{ border: '1px solid #1f2937', borderRadius: 14, background: '#0B1119', padding: 14 }}>
          <h3 style={{ marginTop: 0, color: '#F0F2F5' }}>Édition & conversion</h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Nom du fichier: {fileName || '—'}</p>
          {fileList.length > 1 && (
            <p style={{ color: '#9CA3AF', fontSize: '0.78rem', marginTop: -6 }}>
              +{fileList.length - 1} autres fichier(s) importés (texte fusionné).
            </p>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes de correction, mentions signature/cachet, consignes d'envoi..."
            style={{ width: '100%', minHeight: 200, borderRadius: 10, background: '#111827', color: '#E5E7EB', border: '1px solid #374151', padding: 10 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button onClick={() => download('txt')} style={btn}>TXT</button>
            <button onClick={() => download('md')} style={btn}>MD</button>
            <button onClick={() => download('json')} style={btn}>JSON</button>
            <button onClick={() => download('html')} style={btn}>HTML</button>
            <button onClick={() => window.print()} style={{ ...btn, gridColumn: '1 / -1' }}>Imprimer / Sauver PDF</button>
          </div>
        </aside>
      </section>
    </main>
  )
}

const btn = {
  border: '1px solid #374151',
  background: '#111827',
  color: '#E5E7EB',
  borderRadius: 10,
  padding: '10px 12px',
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 700,
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
