import { useState } from 'react'
import './UniversalViewer.css'

export function PdfViewer({ url, onClose }) {
  if (!url) return null
  const embedUrl = url.includes('drive.google.com') ? url.replace('/view', '/preview').replace('/edit', '/preview') : url

  return (
    <div className="uv-overlay" onClick={onClose}>
      <div className="uv-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="uv-toolbar">
          <span className="uv-toolbar-title">Lecteur PDF</span>
          <div className="uv-toolbar-btns">
            <a href={url} target="_blank" rel="noopener noreferrer" className="uv-tb-btn">Télécharger</a>
            <button className="uv-tb-btn uv-tb-close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <iframe src={embedUrl} className="uv-frame" title="PDF" />
      </div>
    </div>
  )
}

export function ImageViewer({ url, alt, onClose }) {
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)
  if (!url) return null

  return (
    <div className="uv-overlay" onClick={onClose}>
      <div className="uv-img-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="uv-toolbar">
          <div className="uv-toolbar-btns">
            <button className="uv-tb-btn" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>+</button>
            <button className="uv-tb-btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>-</button>
            <button className="uv-tb-btn" onClick={() => setRot((r) => r + 90)}>↻</button>
            <a href={url} download className="uv-tb-btn">Télécharger</a>
            <button className="uv-tb-btn uv-tb-close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="uv-img-wrap">
          <img src={url} alt={alt || ''} loading="lazy" decoding="async" style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transition: 'transform 0.3s' }} />
        </div>
      </div>
    </div>
  )
}
