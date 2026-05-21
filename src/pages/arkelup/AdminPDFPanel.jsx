import { useState, useRef, useCallback } from 'react'
import { SEED_COURSES } from '../../data/arkelCourses'
import {
  IconPDF, IconUpload, IconDownload, IconEye, IconEyeOff,
  IconShield, IconUnlock, IconTrash, IconClose, IconCheck,
  IconPlus, IconSearch,
} from './ArkelUpIcons'
import {
  getCoursePDFs, addPDF, updatePDF, deletePDF,
  formatFileSize, readFileAsDataURL, MAX_LOCAL_SIZE,
} from './coursePDFs'

const ACCESS_LABELS = {
  admin:    { label:'Admin seulement', color:'#EF4444', bg:'rgba(239,68,68,0.12)', icon:<IconShield size={11}/> },
  enrolled: { label:'Inscrits approuvés', color:'#10B981', bg:'rgba(16,185,129,0.12)', icon:<IconUnlock size={11}/> },
}

export default function AdminPDFPanel({ onClose }) {
  const [selectedCourseId, setSelectedCourseId] = useState(SEED_COURSES[0]?.id || '')
  const [pdfs, setPdfs] = useState(() => getCoursePDFs(SEED_COURSES[0]?.id || ''))
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [previewPDF, setPreviewPDF] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [form, setForm] = useState({ title:'', description:'', accessLevel:'enrolled', file:null })
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

  function selectCourse(id) {
    setSelectedCourseId(id)
    setPdfs(getCoursePDFs(id))
    setShowUploadForm(false)
    setUploadError(null)
  }

  function refresh() { setPdfs(getCoursePDFs(selectedCourseId)) }

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      setUploadError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    if (file.size > MAX_LOCAL_SIZE) {
      setUploadError(`Fichier trop volumineux (${formatFileSize(file.size)}). Maximum : 4 Mo.`)
      return
    }
    setUploadError(null)
    setForm(f => ({ ...f, file, title: f.title || file.name.replace('.pdf','').replace(/_/g,' ') }))
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.file || !form.title.trim()) { setUploadError('Titre et fichier requis.'); return }
    setUploading(true)
    setUploadError(null)
    try {
      const fileData = await readFileAsDataURL(form.file)
      addPDF(selectedCourseId, {
        title: form.title.trim(),
        description: form.description.trim(),
        fileName: form.file.name,
        fileSize: form.file.size,
        fileData,
        accessLevel: form.accessLevel,
      })
      refresh()
      setShowUploadForm(false)
      setForm({ title:'', description:'', accessLevel:'enrolled', file:null })
    } catch (err) {
      setUploadError(err.message || 'Erreur lors de l\'upload.')
    } finally {
      setUploading(false)
    }
  }

  function toggleAccess(pdf) {
    const next = pdf.accessLevel === 'enrolled' ? 'admin' : 'enrolled'
    updatePDF(selectedCourseId, pdf.id, { accessLevel: next })
    refresh()
  }

  function handleDelete(pdf) {
    if (!window.confirm(`Supprimer "${pdf.title}" ?`)) return
    deletePDF(selectedCourseId, pdf.id)
    refresh()
  }

  const course = SEED_COURSES.find(c => c.id === selectedCourseId)
  const filtered = pdfs.filter(p => !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()) || p.fileName.toLowerCase().includes(searchQ.toLowerCase()))

  const totalSize = pdfs.reduce((s, p) => s + (p.fileSize || 0), 0)

  return (
    <>
      {/* PDF Preview Modal */}
      {previewPDF && (
        <div style={{ position:'fixed', inset:0, zIndex:2100, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', display:'flex', flexDirection:'column' }} onClick={() => setPreviewPDF(null)}>
          <div style={{ padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(10,5,25,0.9)', borderBottom:'1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'rgba(240,244,255,0.8)' }}>
              <IconPDF size={18} color="#F0B429" />
              <div>
                <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{previewPDF.title}</div>
                <div style={{ fontSize:'0.7rem', color:'rgba(240,244,255,0.4)' }}>{previewPDF.fileName} · {formatFileSize(previewPDF.fileSize)}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <a href={previewPDF.fileData} download={previewPDF.fileName}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background:'rgba(240,180,41,0.15)', border:'1px solid rgba(240,180,41,0.3)', color:'#F0B429', fontWeight:700, fontSize:'0.78rem', textDecoration:'none' }}>
                <IconDownload size={13} /> Télécharger
              </a>
              <button onClick={() => setPreviewPDF(null)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.6)', cursor:'pointer', padding:'7px', borderRadius:8, display:'flex' }}>
                <IconClose size={15} />
              </button>
            </div>
          </div>
          <div style={{ flex:1, overflow:'hidden' }} onClick={e => e.stopPropagation()}>
            <iframe src={previewPDF.fileData} style={{ width:'100%', height:'100%', border:'none' }} title={previewPDF.title} />
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'stretch', justifyContent:'flex-end', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} onClick={onClose}>
        <div style={{ width:'min(720px, 98vw)', background:'#0a0514', borderLeft:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'-20px 0 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12, background:'rgba(240,180,41,0.05)' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(240,180,41,0.15)', border:'1px solid rgba(240,180,41,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#F0B429', flexShrink:0 }}>
              <IconShield size={20} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:900, fontSize:'0.95rem', color:'#fff' }}>Supports PDF — Gestion Admin</div>
              <div style={{ fontSize:'0.72rem', color:'rgba(240,244,255,0.45)' }}>Uploadez des supports et contrôlez l'accès par cours</div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.5)', cursor:'pointer', padding:'7px', borderRadius:9, display:'flex' }}>
              <IconClose size={16} />
            </button>
          </div>

          <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
            {/* Left — course list */}
            <div style={{ width:220, borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0 }}>
              <div style={{ padding:'12px 12px 8px', fontSize:'0.64rem', fontWeight:800, color:'rgba(240,244,255,0.3)', textTransform:'uppercase', letterSpacing:1.5 }}>
                Cours ({SEED_COURSES.length})
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                {SEED_COURSES.map(c => {
                  const count = getCoursePDFs(c.id).length
                  const isSelected = c.id === selectedCourseId
                  return (
                    <button key={c.id} onClick={() => selectCourse(c.id)}
                      style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 12px', border:'none', background: isSelected ? 'rgba(240,180,41,0.1)' : 'transparent', cursor:'pointer', textAlign:'left', fontFamily:'inherit', borderLeft: isSelected ? '2px solid #F0B429' : '2px solid transparent', transition:'all 0.15s' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.78rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#F0B429' : 'rgba(240,244,255,0.65)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>{c.title}</div>
                        <div style={{ fontSize:'0.64rem', color:'rgba(240,244,255,0.3)', marginTop:2 }}>{c.category}</div>
                      </div>
                      {count > 0 && (
                        <span style={{ flexShrink:0, width:18, height:18, borderRadius:'50%', background: isSelected ? 'rgba(240,180,41,0.2)' : 'rgba(255,255,255,0.08)', color: isSelected ? '#F0B429' : 'rgba(240,244,255,0.4)', fontSize:'0.62rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right — PDF list + upload */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Course header */}
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:'0.88rem', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{course?.title}</div>
                  <div style={{ fontSize:'0.7rem', color:'rgba(240,244,255,0.4)', marginTop:2 }}>
                    {pdfs.length} fichier(s) · {formatFileSize(totalSize)}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {/* Search */}
                  {pdfs.length > 3 && (
                    <div style={{ position:'relative' }}>
                      <IconSearch size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'rgba(240,244,255,0.3)', pointerEvents:'none' }} />
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher..."
                        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.8)', borderRadius:8, padding:'6px 10px 6px 28px', fontSize:'0.75rem', outline:'none', fontFamily:'inherit', width:140 }} />
                    </div>
                  )}
                  <button onClick={() => { setShowUploadForm(v => !v); setUploadError(null) }}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background: showUploadForm ? 'rgba(240,180,41,0.2)' : 'rgba(240,180,41,0.12)', border:`1px solid ${showUploadForm ? 'rgba(240,180,41,0.5)' : 'rgba(240,180,41,0.25)'}`, color:'#F0B429', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, fontFamily:'inherit', transition:'all 0.15s' }}>
                    <IconUpload size={14} />{showUploadForm ? 'Annuler' : 'Ajouter un PDF'}
                  </button>
                </div>
              </div>

              {/* Upload form */}
              {showUploadForm && (
                <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(240,180,41,0.04)' }}>
                  <form onSubmit={handleUpload} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border:`2px dashed ${dragOver ? '#F0B429' : form.file ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', background: dragOver ? 'rgba(240,180,41,0.06)' : form.file ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)' }}>
                      {form.file ? (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                          <IconPDF size={22} color="#10B981" />
                          <div style={{ textAlign:'left' }}>
                            <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#10B981' }}>{form.file.name}</div>
                            <div style={{ fontSize:'0.7rem', color:'rgba(240,244,255,0.4)' }}>{formatFileSize(form.file.size)}</div>
                          </div>
                          <button type="button" onClick={e => { e.stopPropagation(); setForm(f => ({...f, file:null})) }}
                            style={{ background:'rgba(239,68,68,0.15)', border:'none', color:'#EF4444', cursor:'pointer', borderRadius:6, padding:'4px 6px', display:'flex', marginLeft:8 }}>
                            <IconClose size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <IconUpload size={24} color="rgba(240,180,41,0.6)" />
                          <div style={{ marginTop:8, fontSize:'0.8rem', color:'rgba(240,244,255,0.5)', fontWeight:600 }}>Glisser-déposer ou cliquer pour sélectionner</div>
                          <div style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.3)', marginTop:4 }}>PDF uniquement · Max 4 Mo</div>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />

                    {/* Fields */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div>
                        <label style={{ display:'block', fontSize:'0.66rem', fontWeight:700, color:'rgba(240,244,255,0.4)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}>Titre du document *</label>
                        <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Ex: Support cours Module 1" required
                          style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.9)', borderRadius:9, padding:'8px 12px', fontSize:'0.82rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'0.66rem', fontWeight:700, color:'rgba(240,244,255,0.4)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}>Niveau d'accès</label>
                        <div style={{ display:'flex', gap:6 }}>
                          {Object.entries(ACCESS_LABELS).map(([val, cfg]) => (
                            <button key={val} type="button" onClick={() => setForm(f=>({...f,accessLevel:val}))}
                              style={{ flex:1, padding:'8px 6px', borderRadius:8, border:`1.5px solid ${form.accessLevel===val ? cfg.color : 'rgba(255,255,255,0.1)'}`, background: form.accessLevel===val ? cfg.bg : 'transparent', color: form.accessLevel===val ? cfg.color : 'rgba(240,244,255,0.4)', fontWeight:700, fontSize:'0.7rem', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.15s' }}>
                              {cfg.icon}{cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.66rem', fontWeight:700, color:'rgba(240,244,255,0.4)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}>Description (optionnel)</label>
                      <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Contenu ou objectifs du document..."
                        style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.9)', borderRadius:9, padding:'8px 12px', fontSize:'0.82rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                    </div>

                    {uploadError && (
                      <div style={{ padding:'10px 14px', borderRadius:9, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', fontSize:'0.78rem', fontWeight:600 }}>
                        {uploadError}
                      </div>
                    )}

                    <button type="submit" disabled={uploading || !form.file}
                      style={{ padding:'10px 20px', borderRadius:10, border:'none', background: uploading || !form.file ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#F0B429,#E8A820)', color: uploading || !form.file ? 'rgba(240,244,255,0.3)' : '#0d0800', fontWeight:800, cursor: uploading || !form.file ? 'not-allowed' : 'pointer', fontSize:'0.82rem', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      {uploading ? 'Upload en cours...' : <><IconUpload size={14} /> Ajouter le support</>}
                    </button>
                  </form>
                </div>
              )}

              {/* PDF list */}
              <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign:'center', padding:'44px 20px', color:'rgba(240,244,255,0.25)' }}>
                    <IconPDF size={36} color="rgba(240,180,41,0.2)" />
                    <div style={{ marginTop:12, fontSize:'0.84rem', fontWeight:600 }}>
                      {pdfs.length === 0 ? 'Aucun support PDF pour ce cours' : 'Aucun résultat'}
                    </div>
                    {pdfs.length === 0 && (
                      <div style={{ fontSize:'0.74rem', marginTop:6, color:'rgba(240,244,255,0.2)' }}>
                        Cliquez sur "Ajouter un PDF" pour uploader un support
                      </div>
                    )}
                  </div>
                )}

                {filtered.map((pdf, idx) => {
                  const access = ACCESS_LABELS[pdf.accessLevel] || ACCESS_LABELS.admin
                  return (
                    <div key={pdf.id}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                      {/* File icon */}
                      <div style={{ width:38, height:38, borderRadius:9, background:'rgba(240,180,41,0.1)', border:'1px solid rgba(240,180,41,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#F0B429', flexShrink:0 }}>
                        <IconPDF size={18} />
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.84rem', color:'rgba(240,244,255,0.9)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pdf.title}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                          <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.35)' }}>{pdf.fileName}</span>
                          <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.25)' }}>·</span>
                          <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.35)' }}>{formatFileSize(pdf.fileSize)}</span>
                          {pdf.description && (
                            <>
                              <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.25)' }}>·</span>
                              <span style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>{pdf.description}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Access badge + actions */}
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                        {/* Access toggle */}
                        <button onClick={() => toggleAccess(pdf)} title={`Accès : ${access.label} — cliquer pour changer`}
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:100, background:access.bg, border:`1px solid ${access.color}40`, color:access.color, fontWeight:700, fontSize:'0.66rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                          {access.icon}{access.label}
                        </button>

                        {/* Preview */}
                        <button onClick={() => setPreviewPDF(pdf)} title="Prévisualiser"
                          style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'rgba(240,244,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.15)'; e.currentTarget.style.color='#6366F1'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(240,244,255,0.5)'; }}>
                          <IconEye size={13} />
                        </button>

                        {/* Download */}
                        <a href={pdf.fileData} download={pdf.fileName} title="Télécharger"
                          style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'rgba(240,244,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(240,180,41,0.15)'; e.currentTarget.style.color='#F0B429'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(240,244,255,0.5)'; }}>
                          <IconDownload size={13} />
                        </a>

                        {/* Delete */}
                        <button onClick={() => handleDelete(pdf)} title="Supprimer"
                          style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'rgba(240,244,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#EF4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(240,244,255,0.5)'; }}>
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer summary */}
              <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:14, flexWrap:'wrap' }}>
                {Object.entries(ACCESS_LABELS).map(([val, cfg]) => {
                  const count = pdfs.filter(p => p.accessLevel === val).length
                  return (
                    <div key={val} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem' }}>
                      <span style={{ display:'flex', color:cfg.color }}>{cfg.icon}</span>
                      <span style={{ color:'rgba(240,244,255,0.5)' }}>{cfg.label} :</span>
                      <span style={{ fontWeight:800, color:cfg.color }}>{count}</span>
                    </div>
                  )
                })}
                <div style={{ marginLeft:'auto', fontSize:'0.72rem', color:'rgba(240,244,255,0.3)' }}>
                  Total : {pdfs.length} fichier(s) · {formatFileSize(totalSize)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
