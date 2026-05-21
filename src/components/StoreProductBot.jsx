import { useState } from 'react'
import { callGroq } from '../lib/groqClient'
import { supabase } from '../lib/supabase'

const CATS = ['PC PORTABLE','PC BUREAU','IMPRIMANTE','ECRAN','CLAVIER','SOURIS','DISQUE DUR','RAM','WEBCAM','CASQUE','SAC','SERVICES']

const SYSTEM = `Tu es un expert e-commerce spécialisé en matériel informatique au Sénégal (marché FCFA, prix Dakar 2026, clientèle PME/entreprises/particuliers).
Génère une fiche produit COMPLÈTE, RICHE et SEO-OPTIMISÉE.
Réponds UNIQUEMENT avec un JSON valide, commence directement par { :
{
  "nom": "Nom commercial complet et précis",
  "seo_title": "Titre SEO ≤65 chars : Nom + spec clé + usage + Sénégal (ex: HP LaserJet M404d — Imprimante Laser PME Dakar)",
  "categorie": "PC PORTABLE|PC BUREAU|IMPRIMANTE|ECRAN|CLAVIER|SOURIS|DISQUE DUR|RAM|WEBCAM|CASQUE|SAC|SERVICES",
  "description": "Méta-description SEO Google 120-155 chars EXACTEMENT : 1-2 phrases percutantes avec chiffre clé, idéale pour les résultats Google",
  "description_longue": "Description éditoriale complète 5-8 phrases développées : présentation produit + caractéristiques techniques détaillées + bénéfices concrets pour le marché sénégalais + comparaison avec alternatives + appel à l'action professionnel",
  "specs": ["Processeur: Intel Core i7 13ème gén 2.4 GHz","RAM: 16 Go DDR5 4800 MHz","Stockage: 512 Go NVMe SSD PCIe 4.0","Écran: 15.6 pouces FHD 1920×1080 IPS antireflet","Batterie: 56 Wh — 8h autonomie réelle","OS: Windows 11 Pro 64 bits inclus"],
  "points_forts": ["Performance professionnelle : traitement bureautique et multitâche sans ralentissement","Rapport qualité/prix optimal pour le marché sénégalais — meilleur choix PME 2026","SSD NVMe ultra-rapide : démarrage en 8s, fichiers lourds gérés instantanément","Support SAV disponible à Dakar, garantie constructeur 1 an"],
  "mots_cles": ["pc portable dakar", "laptop senegal", "ordinateur portable pas cher dakar", "achat informatique senegal", "prix pc portable fcfa", "materiel informatique dakar 2026"],
  "cas_usage": ["PME","Télétravail","Étudiant","Comptabilité"],
  "public_cible": "Professionnels, dirigeants de PME et étudiants sénégalais cherchant un ordinateur fiable et performant à prix compétitif en FCFA",
  "garantie": "1 an constructeur",
  "prix": 550000,
  "prix_original": 650000,
  "stock": 10
}`

const S = {
  wrap: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24 },
  header: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 },
  inputRow: { display: 'flex', gap: 10, marginBottom: 16 },
  input: { flex: 1, padding: '11px 16px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif', outline: 'none' },
  btn: (col, secondary) => ({
    padding: secondary ? '9px 16px' : '11px 22px', borderRadius: 10,
    background: secondary ? 'transparent' : col, color: secondary ? col : '#fff',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
    border: secondary ? `1px solid ${col}40` : 'none', transition: 'all 0.2s',
  }),
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' },
  field: { width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'rgba(24,168,74,0.12)', color: '#18A84A', fontSize: '0.7rem', fontWeight: 700, marginLeft: 6 },
  seoTag: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700, marginLeft: 6 },
  seoSection: { background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 },
  seoLabel: { fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  charCount: (n, max) => ({ fontSize: '0.68rem', color: n > max ? '#ef4444' : n > max * 0.85 ? '#f59e0b' : 'var(--text-muted)', marginTop: 3, textAlign: 'right' }),
}

function Field({ label, value, onChange, type = 'text', rows, hint, maxLen }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={S.label}>{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ ...S.field, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={S.field} />
      )}
      {hint && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{hint}</div>}
      {maxLen && <div style={S.charCount(value?.length || 0, maxLen)}>{value?.length || 0} / {maxLen} chars</div>}
    </div>
  )
}

function Dots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#F0B429', animation: `spb-dot 1s ${i*0.2}s ease-in-out infinite` }} />
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
  const [open, setOpen] = useState(false)

  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  async function generate() {
    if (!prompt.trim()) return
    setLoading(true); setData(null)
    try {
      const result = await callGroq([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Produit à ficher : ${prompt.trim()}` },
      ], { maxTokens: 1400, temperature: 0.4 })

      const json = typeof result === 'string' ? result : (result.content || result.text || '')
      const clean = json.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(clean)
      setData({
        nom: parsed.nom || '',
        seo_title: parsed.seo_title || parsed.nom || '',
        categorie: parsed.categorie || 'PC PORTABLE',
        description: parsed.description || '',
        description_longue: parsed.description_longue || '',
        specs: Array.isArray(parsed.specs) ? parsed.specs.join('\n') : (parsed.specs || ''),
        points_forts: Array.isArray(parsed.points_forts) ? parsed.points_forts.join('\n') : '',
        mots_cles: Array.isArray(parsed.mots_cles) ? parsed.mots_cles.join(', ') : (parsed.mots_cles || ''),
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
      seo_title: data.seo_title || data.nom,
      categorie: data.categorie,
      description: data.description,
      description_longue: data.description_longue || null,
      specs: arrOf(data.specs),
      points_forts: arrOf(data.points_forts),
      mots_cles: arrOf(data.mots_cles),
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
      setData(null); setPrompt('')
      onDone?.()
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={{ fontSize: '1.2rem' }}>🤖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Bot Produit ABAWI
            <span style={S.tag}>IA</span>
            <span style={S.seoTag}>SEO</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Décrivez un produit → fiche complète + SEO générée en 5 secondes
          </div>
        </div>
        <button onClick={() => setOpen(v => !v)} style={{ ...S.btn('#6B7280', true), padding: '6px 12px', fontSize: '0.78rem' }}>
          {open ? '▲ Réduire' : '▼ Ouvrir'}
        </button>
      </div>

      {open && (
        <>
          <div style={S.inputRow}>
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && generate()}
              placeholder="Ex: HP LaserJet Pro M404d imprimante laser bureau PME Dakar..."
              style={S.input}
            />
            <button onClick={generate} disabled={loading || !prompt.trim()} style={S.btn('#F0B429')}>
              {loading ? <Dots /> : '✨ Générer'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {['MacBook Air M2', 'Dell XPS 15', 'HP DeskJet 2710', 'Logitech MX Keys', 'SSD Samsung 1To', 'Écran 27" 4K'].map(s => (
              <button key={s} onClick={() => setPrompt(s)} style={{ padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>{s}</button>
            ))}
          </div>

          {data && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#18A84A', marginBottom: 16 }}>
                ✓ Fiche générée — vérifiez et complétez avant d'enregistrer
              </div>

              {/* === BLOC SEO === */}
              <div style={S.seoSection}>
                <div style={S.seoLabel}>
                  <span>🔍</span> Référencement SEO
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Titre SEO Google (≤ 65 chars)</label>
                  <input value={data.seo_title} onChange={e => set('seo_title', e.target.value)} style={S.field} />
                  <div style={S.charCount(data.seo_title?.length || 0, 65)}>{data.seo_title?.length || 0} / 65 chars</div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Méta-description (120–155 chars)</label>
                  <textarea value={data.description} onChange={e => set('description', e.target.value)} rows={2} style={{ ...S.field, resize: 'vertical' }} />
                  <div style={S.charCount(data.description?.length || 0, 155)}>{data.description?.length || 0} / 155 chars</div>
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label style={S.label}>Mots-clés SEO (séparés par virgule)</label>
                  <input value={data.mots_cles} onChange={e => set('mots_cles', e.target.value)} style={S.field} placeholder="pc portable dakar, laptop senegal, prix ordinateur fcfa..." />
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {data.mots_cles?.split(',').filter(k => k.trim()).length || 0} mots-clés
                  </div>
                </div>
              </div>

              {/* === CONTENU === */}
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

              <Field
                label="Description longue éditoriale"
                value={data.description_longue}
                onChange={v => set('description_longue', v)}
                rows={5}
                hint="5-8 phrases riches : caractéristiques, bénéfices, usage, marché sénégalais"
              />
              <Field label="Spécifications techniques (une par ligne)" value={data.specs} onChange={v => set('specs', v)} rows={5} />
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
