import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Import Excel WooCommerce → store_products Supabase.
 *
 * Colonnes attendues : Name, SKU, Categories, Short description, Description,
 * Regular price, Sale price, Images (URL séparées par virgule), Stock, Published,
 * Featured, Meta: title, Meta: description, Tags.
 *
 * Modes :
 * - Merge (défaut) : upsert par SKU, met à jour si déjà présent
 * - Replace : supprime tous les produits actifs puis insère
 */
export default function StoreExcelImport({ onDone, showToast }) {
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('merge')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: [] })

  function clean(s) { return (s || '').toString().trim() }
  function stripHtml(s) { return clean(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
  function firstImage(imgs) {
    const s = clean(imgs)
    return s ? (s.split(',')[0].trim() || null) : null
  }
  function allImages(imgs) {
    const s = clean(imgs)
    return s ? s.split(',').map(x => x.trim()).filter(Boolean) : []
  }

  async function parseFile() {
    if (!file) return
    setBusy(true)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      const products = rows.map(r => {
        const published = r['Published']
        const actif = published === '1' || published === 1 || published === true || String(published).toLowerCase() === 'true' || String(published).toLowerCase() === 'yes'
        const featured = r['Featured']
        const isFeatured = featured === '1' || featured === 1 || featured === true || String(featured).toLowerCase() === 'true' || String(featured).toLowerCase() === 'yes'
        
        return {
          name: clean(r['Name']),
          sku: clean(r['SKU']) || null,
          categorie: clean(r['Categories']) || 'Divers',
          specs: clean(r['Short description']),
          description: stripHtml(r['Description']),
          prix: parseInt(r['Regular price']) || 0,
          prix_barre: r['Sale price'] && parseInt(r['Sale price']) ? parseInt(r['Regular price']) : null,
          image_url: firstImage(r['Images']),
          images: allImages(r['Images']),
          actif: actif,
          featured: isFeatured,
          new_arrival: false,
          stock: parseInt(r['Stock']) || 0,
          seo_title: clean(r['Meta: title']) || null,
          seo_desc: clean(r['Meta: description']) || null,
          tags: clean(r['Tags']) || null,
        }
      }).filter(p => p.name)

      setPreview(products)
    } catch (e) {
      showToast?.(`Erreur lecture Excel : ${e.message}`, 'error')
      setPreview(null)
    } finally {
      setBusy(false)
    }
  }

  async function runImport() {
    if (!preview || !preview.length) return
    if (mode === 'replace' && !confirm(`⚠️ Supprimer tous les produits existants et importer ${preview.length} produits ?`)) return
    if (mode === 'merge' && !confirm(`Importer ${preview.length} produits (mise à jour par SKU) ?`)) return

    setBusy(true)
    setProgress({ done: 0, total: preview.length, errors: [] })

    try {
      if (mode === 'replace') {
        const { error } = await supabase.from('store_products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) throw error
      }

      let done = 0
      const errors = []
      const batchSize = 20

      for (let i = 0; i < preview.length; i += batchSize) {
        const batch = preview.slice(i, i + batchSize)
        let result
        if (mode === 'merge') {
          result = await supabase.from('store_products').upsert(batch, { onConflict: 'sku', ignoreDuplicates: false })
        } else {
          result = await supabase.from('store_products').insert(batch)
        }
        if (result.error) {
          errors.push({ batch: i / batchSize + 1, message: result.error.message })
        }
        done += batch.length
        setProgress({ done, total: preview.length, errors })
      }

      if (errors.length) {
        showToast?.(`Import terminé avec ${errors.length} erreur(s) — voir console`, 'warning')
        console.warn('[StoreExcelImport] erreurs', errors)
      } else {
        showToast?.(`✅ ${preview.length} produits importés`)
      }
      onDone?.()
    } catch (e) {
      showToast?.(`Échec import : ${e.message}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      background: '#0D1117', border: '1px solid #1A2332',
      borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      <h3 style={{ color: '#F0F2F5', marginTop: 0, marginBottom: 12, fontSize: '1rem', fontWeight: 800 }}>
        📥 Import depuis Excel (WooCommerce)
      </h3>
      <p style={{ color: '#8B95A5', fontSize: '0.82rem', marginBottom: 14, lineHeight: 1.5 }}>
        Sélectionnez un fichier <code>.xlsx</code> au format WooCommerce (colonnes Name, SKU, Categories, Regular price, Images…).
        Les images sont récupérées depuis les URLs indiquées.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null) }}
          disabled={busy}
          style={{ color: '#C8D3E0', fontSize: '0.85rem' }}
        />
        <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={busy} style={{
          padding: '8px 12px', borderRadius: 8,
          background: '#070B0F', border: '1px solid #1A2332',
          color: '#F0F2F5', fontSize: '0.82rem',
        }}>
          <option value="merge">Fusion (upsert par SKU)</option>
          <option value="replace">Remplacer (supprimer tout puis insérer)</option>
        </select>
        <button
          type="button"
          onClick={parseFile}
          disabled={!file || busy}
          style={{
            padding: '8px 16px', borderRadius: 8, cursor: (!file || busy) ? 'not-allowed' : 'pointer',
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)',
            color: '#3B82F6', fontWeight: 700, fontSize: '0.82rem',
            opacity: (!file || busy) ? 0.5 : 1,
          }}>
          🔍 Prévisualiser
        </button>
      </div>

      {preview && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: '#22C55E', fontSize: '0.85rem', marginBottom: 8, fontWeight: 700 }}>
            ✅ {preview.length} produit(s) détecté(s)
          </div>
          <div style={{
            maxHeight: 180, overflowY: 'auto',
            background: '#070B0F', border: '1px solid #1A2332',
            borderRadius: 8, padding: 8,
          }}>
            {preview.slice(0, 8).map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: '0.78rem', color: '#C8D3E0' }}>
                {p.image_url ? (
                  <img src={p.image_url} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                ) : (
                  <span style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#0D1117', borderRadius: 4 }}>💻</span>
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span style={{ color: '#F0B429', fontWeight: 700, whiteSpace: 'nowrap' }}>{p.prix.toLocaleString()} FCFA</span>
              </div>
            ))}
            {preview.length > 8 && (
              <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: 4 }}>
                … et {preview.length - 8} autres
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={runImport}
            disabled={busy}
            style={{
              marginTop: 12, padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #F0B429, #F59E0B)',
              border: 'none', color: '#0a0a0a', fontWeight: 800, fontSize: '0.9rem',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
              boxShadow: '0 4px 14px rgba(240,180,41,0.3)',
            }}>
            {busy && progress.total > 0
              ? `⏳ Import ${progress.done}/${progress.total}…`
              : `🚀 Importer ${preview.length} produits`}
          </button>

          {progress.errors.length > 0 && (
            <div style={{ marginTop: 10, color: '#EF4444', fontSize: '0.78rem' }}>
              ⚠️ {progress.errors.length} erreur(s) — consultez la console pour le détail.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
