import { useState, useRef } from 'react'

export default function FileUpload({
  type = 'pdf',
  onFile,
  label,
  maxMB = 5,
  accept,
}) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  const ACCEPT_MAP = {
    photo: 'image/jpeg,image/png,image/webp',
    logo: 'image/jpeg,image/png,image/svg+xml,image/webp',
    pdf: 'application/pdf',
    signature: 'image/jpeg,image/png',
    audio: 'audio/mpeg,audio/wav,audio/ogg',
  }

  const LABELS = {
    photo: 'Cliquez ou déposez votre photo',
    logo: 'Cliquez ou déposez votre logo',
    pdf: 'Cliquez ou déposez votre PDF',
    signature: 'Cliquez ou déposez votre signature',
    audio: 'Cliquez ou déposez votre fichier audio',
  }

  const ICONS = { photo: '🤳', logo: '🖼️', pdf: '📄', signature: '✍️', audio: '🎵' }

  const finalAccept = accept || ACCEPT_MAP[type] || '*'
  const finalLabel = label || LABELS[type] || 'Choisir un fichier'

  async function processFile(f) {
    setError('')
    setLoading(true)

    const acceptedTypes = finalAccept.split(',').map(t => t.trim())
    const isValid = acceptedTypes.some(t => {
      if (t === '*') return true
      if (t.endsWith('/*')) return f.type.startsWith(t.replace('/*', ''))
      return f.type === t
    })

    const ext = f.name.split('.').pop().toLowerCase()
    const extValid = type === 'pdf' ? ext === 'pdf' :
                     type === 'audio' ? ['mp3','wav','ogg','m4a'].includes(ext) :
                     ['jpg','jpeg','png','webp','svg','gif'].includes(ext)

    if (!isValid && !extValid) {
      setError(`Format non accepté. Attendu : ${type.toUpperCase()}`)
      setLoading(false)
      return
    }

    const maxBytes = maxMB * 1024 * 1024
    if (f.size > maxBytes) {
      setError(`Fichier trop volumineux (${(f.size/1024/1024).toFixed(1)} Mo). Maximum : ${maxMB} Mo`)
      setLoading(false)
      return
    }

    if (f.size === 0) {
      setError('Le fichier semble vide.')
      setLoading(false)
      return
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
        reader.readAsDataURL(f)
      })

      setFile(f)
      onFile(f, dataUrl)
    } catch(e) {
      setError('Erreur lors du chargement : ' + e.message)
    }

    setLoading(false)
  }

  function handleInputChange(e) {
    const f = e.target.files?.[0]
    if (f) processFile(f)
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  function removeFile(e) {
    e.stopPropagation()
    setFile(null)
    setError('')
    onFile(null, null)
  }

  const borderColor = error ? '#ef4444' : dragging ? '#18A84A' : file ? '#F0B429' : '#1A2332'
  const bgColor = dragging ? 'rgba(24,168,74,0.05)' : file ? 'rgba(240,180,41,0.03)' : 'rgba(255,255,255,0.02)'

  return (
    <div style={{ width: '100%' }}>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragging(true) }}
        onDragLeave={e => { e.preventDefault(); setDragging(false) }}
        style={{
          border: `2px dashed ${borderColor}`, borderRadius: 14,
          padding: '28px 20px', textAlign: 'center',
          cursor: loading ? 'wait' : 'pointer', background: bgColor,
          transition: 'all 0.2s ease',
        }}
      >
        <input ref={inputRef} type="file" accept={finalAccept} onChange={handleInputChange} style={{ display: 'none' }} />

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(240,180,41,0.2)', borderTopColor: '#F0B429', animation: 'fu-spin 0.8s linear infinite' }} />
            <span style={{ color: '#8B95A5', fontSize: '0.85rem' }}>Chargement...</span>
          </div>
        )}

        {!loading && file && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {(type === 'photo' || type === 'logo' || type === 'signature') && (
              <img src={URL.createObjectURL(file)} alt="preview" style={{
                width: type === 'photo' ? 80 : 64, height: type === 'photo' ? 80 : 64,
                borderRadius: type === 'photo' ? '50%' : 10, objectFit: 'cover', border: '2px solid #F0B429',
              }} />
            )}
            {type === 'pdf' && <div style={{ fontSize: '2.5rem' }}>📄</div>}
            {type === 'audio' && <div style={{ fontSize: '2.5rem' }}>🎵</div>}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F0B429' }}>
                {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8B95A5', marginTop: 2 }}>
                {(file.size / 1024).toFixed(0)} Ko
              </div>
            </div>
            <button onClick={removeFile} style={{
              padding: '5px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            }}>✕ Supprimer</button>
          </div>
        )}

        {!loading && !file && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: '2.5rem' }}>{ICONS[type] || '📎'}</div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F0F2F5', marginBottom: 4 }}>{finalLabel}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Glisser-déposer ou cliquer</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Max {maxMB} Mo · {type.toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '0.8rem' }}>
          ⚠️ {error}
        </div>
      )}
      <style>{`@keyframes fu-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
