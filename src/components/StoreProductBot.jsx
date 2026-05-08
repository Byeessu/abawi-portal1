import { useState } from 'react'
import { callGroq } from '../lib/groqClient'
import { supabase } from '../lib/supabase'

const CATS = ['PC PORTABLE','PC BUREAU','IMPRIMANTE','ECRAN','CLAVIER','SOURIS','DISQUE DUR','RAM','WEBCAM','CASQUE','SAC','SERVICES']

const SYSTEM = `Tu es un expert e-commerce spécialisé en matériel informatique au Sénégal (marché FCFA, prix marché Dakar 2025).
Génère une fiche produit complète et convaincante à partir du nom/description fourni.
Réponds UNIQUEMENT avec un JSON valide (aucun texte avant/après) :
{
  "nom": "Nom commercial complet du produit",
  "categorie": "PC PORTABLE|PC BUREAU|IMPRIMANTE|ECRAN|CLAVIER|SOURIS|DISQUE DUR|RAM|WEBCAM|CASQUE|SAC|SERVICES",
  "description": "2-3 phrases commerciales ciblées, ton business professionnel, focus productivité/valeur pour le marché sénégalais",
  "specs": ["spécification technique 1","spec 2","spec 3","spec 4","spec 5"],
  "points_forts": ["Avantage concurrentiel 1","Avantage 2","Avantage 3"],
  "cas_usage": ["PME","Télétravail","Étudiant"],
  "public_cible": "Description du profil client idéal en 1 phrase",
  "garantie": "X an(s) constructeur",
  "prix": 150000,
  "prix_original": 180000,
  "stock": 10
}`

const S = {
  wrap: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24 },
  header: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 },
  inputRow: { display: 'flex', gap: 10, marginBottom: 16 },
  input: { flex: 1, padding: '11px 16px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif', outline: 'none' },
  btn: (col, secondary) => ({
    padding: secondary ? '9px 16px' : '11px 22px', borderRadius: 10, border: 'none',
    background: secondary ? 'transparent' : col, color: secondary ? col : '#fff',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
    border: secondary ? `1px solid ${col}40` : 'none', transition: 'all 0.2s',
  }),
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' },
  field: { width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'rgba(24,168,74,0.12)', color: '#18A84A', fontSize: '0.7rem', fontWeight: 700, marginLeft: 6 },
}

function Field({ label, value, onChange, type = 'text', rows, as }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={S.label}>{label}</label>
      {as === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={S.field}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ ...S.field, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={S.field} />
      )}
    </div>
  )
}

function Dots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#F0B429',
          animation: `spb-dot 1s ${i*0.2}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`@keyframes spb-dot{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

export default function StoreProductBot({ onDone, showToast }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(null)
  const [raw, setRaw] = useState('')
  const [open, setOpen] = useState(false)

  // editable fields
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  async function generate() {
    if (!prompt.trim()) return
    setLoading(true); setData(null); setRaw('')
    try {
      const result = await callGroq([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Produit à ficher : ${prompt.trim()}` },
      ], { maxTokens: 900, temperature: 0.5 })

      const json = typeof result === 'string' ? result : (result.content || result.text || '')
      const clean = json.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(clean)
      setData({
        nom: parsed.nom || '',
        categorie: parsed.categorie || 'PC PORTABLE',
        description: parsed.description || '',
        specs: Array.isArray(parsed.specs) ? parsed.specs.join('\n') : (parsed.specs || ''),
        points_forts: Array.isArray(parsed.points_forts) ? parsed.points_forts.join('\n') : '',
        cas_usage: Array.isArray(parsed.cas_usage) ? parsed.cas_usage.join(', ') : '',
        public_cible: parsed.public_cible || '',
        garantie: parsed.garantie || '1 an constructeur',
        prix: String(parsed.prix || ''),
        prix_original: String(parsed.prix_original || ''),
        stock: String(parsed.stock || '10'),
        image_url: '',
      })
    } catch (e) {
      showToast?.('❌ Erreur IA : ' + e.message, 'error')
    }
    setLoading(false)
  }

  async function save() {
    if (!data?.nom) return
    setSaving(true)
    const arrOf = str => str.split(/\n|,/).map(s => s.trim()).filter(Boolean)
    const { error } = await supabase.from('store_products').insert({
      nom: data.nom,
      name: data.nom,
      categorie: data.categorie,
      description: data.description,
      specs: arrOf(data.specs),
      points_forts: arrOf(data.points_forts),
      cas_usage: arrOf(data.cas_usage),
      public_cible: data.public_cible,
      garantie: data.garantie,
      prix: parseInt(data.prix) || 0,
      prix_barre: parseInt(data.prix_original) || null,
      image_url: data.image_url || null,
      stock: parseInt(data.stock) || 10,
      actif: true,
      featured: false,
    })
    setSaving(false)
    if (error) { showToast?.('❌ ' + error.message, 'error') }
    else {
      showToast?.('✅ Produit créé avec succès !')
      setData(null); setPrompt(''); setRaw('')
      onDone?.()
    }
  }

  return (
    <div style={S.wrap}>
      {/* Header / toggle */}
      <div style={S.header}>
        <span style={{ fontSize: '1.2rem' }}>🤖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Bot Produit ABAWI
            <span style={S.tag}>IA</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Décrivez un produit → fiche complète générée en 3 secondes
          </div>
        </div>
        <button onClick={() => setOpen(v => !v)} style={{ ...S.btn('#6B7280', true), padding: '6px 12px', fontSize: '0.78rem' }}>
          {open ? '▲ Réduire' : '▼ Ouvrir'}
        </button>
      </div>

      {open && (
        <>
          {/* Prompt input */}
          <div style={S.inputRow}>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && generate()}
              placeholder="Ex: HP LaserJet Pro M404d imprimante laser bureau PME..."
              style={S.input}
            />
            <button onClick={generate} disabled={loading || !prompt.trim()} style={S.btn('#F0B429')}>
              {loading ? <Dots /> : 'Générer →'}
            </button>
          </div>

          {/* Suggestions */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {['MacBook Air M2', 'Dell XPS 15', 'HP DeskJet 2710', 'Logitech MX Keys', 'SSD Samsung 1To'].map(s => (
              <button key={s} onClick={() => { setPrompt(s); }} style={{
                padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600,
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>

          {/* Generated form */}
          {data && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#18A84A', marginBottom: 14 }}>
                ✓ Fiche générée — vérifiez et complétez avant d'enregistrer
              </div>

              <Field label="Nom du produit *" value={data.nom} onChange={v => set('nom', v)} />

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Catégorie</label>
                  <select value={data.categorie} onChange={e => set('categorie', e.target.value)} style={S.field}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Garantie</label>
                  <input value={data.garantie} onChange={e => set('garantie', e.target.value)} style={S.field} />
                </div>
              </div>

              <div style={S.grid3}>
                <div>
                  <label style={S.label}>Prix (FCFA) *</label>
                  <input type="number" value={data.prix} onChange={e => set('prix', e.target.value)} style={S.field} />
                </div>
                <div>
                  <label style={S.label}>Prix barré</label>
                  <input type="number" value={data.prix_original} onChange={e => set('prix_original', e.target.value)} style={S.field} />
                </div>
                <div>
                  <label style={S.label}>Stock</label>
                  <input type="number" value={data.stock} onChange={e => set('stock', e.target.value)} style={S.field} />
                </div>
              </div>

              <Field label="Description commerciale" value={data.description} onChange={v => set('description', v)} rows={3} />
              <Field label="Spécifications (une par ligne)" value={data.specs} onChange={v => set('specs', v)} rows={4} />
              <Field label="Points forts (un par ligne)" value={data.points_forts} onChange={v => set('points_forts', v)} rows={3} />

              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Cas d'usage (virgule)</label>
                  <input value={data.cas_usage} onChange={e => set('cas_usage', e.target.value)} style={S.field} />
                </div>
                <div>
                  <label style={S.label}>Public cible</label>
                  <input value={data.public_cible} onChange={e => set('public_cible', e.target.value)} style={S.field} />
                </div>
              </div>

              <Field label="URL image principale" value={data.image_url} onChange={v => set('image_url', v)} />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={generate} disabled={loading} style={S.btn('#6B7280', true)}>
                  🔄 Regénérer
                </button>
                <button onClick={save} disabled={saving || !data.nom || !data.prix} style={S.btn('#18A84A')}>
                  {saving ? 'Enregistrement…' : '✓ Enregistrer ce produit'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
