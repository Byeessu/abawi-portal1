import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadFile } from '../../lib/uploadFile'
import { callGroq, callGroqJSON } from '../../lib/groqClient'

const PRODUCT_CATS = [
  'TENUE MEDICALE',
  'MATERIEL LEGER',
  'MATERIEL SEMI-LOURD',
  'MATERIEL LOURD',
  'CONSOMMABLE',
  'MOBILIER',
]

const EMPTY_PRODUCT = {
  nom: '', categorie: 'MATERIEL LEGER', description: '', description_courte: '',
  prix: 0, prix_original: 0, stock: 1, image_url: '', featured: false, actif: true,
  meta_title: '', meta_description: '', keywords: '', long_tail_keywords: '',
  storytelling: '', angle_vente: '', public_cible: '',
  points_forts: [], cas_usage: [],
  post_facebook: '', post_instagram: '', post_whatsapp: '', post_twitter: '',
  hashtags: [], faq: [],
  schema_org: '',
  supplier_id: '', supplier_link: '',
  specs: [], marque: '', garantie: '12 mois'
}

const EMPTY_SUPPLIER = {
  nom: '', contact_nom: '', telephone: '', email: '', adresse: '', ville: '',
  notes: '', verified: false, actif: true
}

function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const bg = type === 'success' ? '#10B981' : type === 'error' ? '#ef4444' : '#F0B429'
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, background: bg, color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxWidth: 360 }}>
      {msg}
    </div>
  )
}

export default function AbavieStorePanel() {
  const [tab, setTab] = useState('products') // products | suppliers
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Tous')
  const [schemaError, setSchemaError] = useState(null)

  // Product modal
  const [prodModal, setProdModal] = useState(false)
  const [editProd, setEditProd] = useState({ ...EMPTY_PRODUCT })
  const [isEdit, setIsEdit] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileInputRef = useRef(null)
  const [prodTab, setProdTab] = useState('base')
  const [copiedKey, setCopiedKey] = useState(null)

  // Supplier modal
  const [supModal, setSupModal] = useState(false)
  const [editSup, setEditSup] = useState({ ...EMPTY_SUPPLIER })
  const [isEditSup, setIsEditSup] = useState(false)

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  const isSchemaError = (msg) => /schema cache|does not exist|relation|42P01/i.test(msg)

  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('abavie_products').select('*, supplier:supplier_id(nom,telephone,ville)').order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (e) {
      const msg = e.message || String(e)
      if (isSchemaError(msg)) setSchemaError(msg)
      showToast('Erreur chargement produits: ' + msg, 'error')
    }
  }, [])

  const loadSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('abavie_suppliers').select('*').order('nom', { ascending: true })
      if (error) throw error
      setSuppliers(data || [])
    } catch (e) {
      const msg = e.message || String(e)
      if (isSchemaError(msg)) setSchemaError(msg)
      showToast('Erreur chargement fournisseurs: ' + msg, 'error')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadProducts(), loadSuppliers()]).finally(() => setLoading(false))
  }, [loadProducts, loadSuppliers])

  // ── AI Senior Expert Generation ──
  const generateAIDescription = async () => {
    if (!editProd.nom.trim()) { showToast('Remplissez le nom du produit d\'abord', 'error'); return }
    setAiLoading(true)
    try {
      const specsText = (Array.isArray(editProd.specs) ? editProd.specs : []).map(s => typeof s === 'string' ? s : `${s.label}: ${s.value}`).join(', ')
      const prompt = `Tu es un expert senior en stratégie produit, marketing digital, branding et social media pour le marché africain (Sénégal, Côte d\'Ivoire, Bénin, Mali, Burkina Faso). Tu travailles pour ABAVI, la boutique santé professionnelle de référence.

Génère un DOSSIER PRODUIT COMPLET, premium et structuré pour :
- Produit: ${editProd.nom}
- Catégorie: ${editProd.categorie}
- Marque: ${editProd.marque || 'non spécifiée'}
- Prix: ${editProd.prix ? Number(editProd.prix).toLocaleString('fr-FR') + ' FCFA' : 'prix sur demande'}
- Spécifications: ${specsText || 'à consulter'}

Règles essentielles :
- Ton : professionnel, rassurant, expert, chaleureux. Français avec sensibilité africaine.
- Cible : professionnels de santé, cliniques, hôpitaux, infirmiers, médecins, étudiants en médecine, particuliers exigeants.
- SEO : optimisé pour la recherche locale (villes, pays francophones ouest-africains).
- Social : posts prêts à publier, engageants, avec storytelling.

Réponds UNIQUEMENT en JSON valide selon ce schéma exact :
{
  "description_courte": "phrase d'accroche 1-2 lignes max, percutante",
  "description": "description longue détaillée 4-6 lignes, bénéfices, usages, contexte africain",
  "storytelling": "histoire émotionnelle autour du produit, 2-3 lignes, pourquoi il compte",
  "angle_vente": "3 angles de vente distincts séparés par le caractère |",
  "public_cible": "public cible précis et segmenté (professionnels, cliniques, etc.)",
  "points_forts": ["point fort 1", "point fort 2", "point fort 3", "point fort 4", "point fort 5"],
  "cas_usage": ["cas d'usage 1", "cas d'usage 2", "cas d'usage 3"],
  "meta_title": "titre SEO optimisé, max 60 caractères",
  "meta_description": "meta description avec appel à l'action, max 160 caractères",
  "keywords": "mots-clés principaux séparés par des virgules",
  "long_tail_keywords": "mots-clés longs séparés par des virgules, inclure noms de villes africaines",
  "post_facebook": "post Facebook engageant, 80-120 mots avec emojis",
  "post_instagram": "caption Instagram storytelling + hashtags inline",
  "post_whatsapp": "message WhatsApp commercial chaleureux et direct",
  "post_twitter": "tweet percutant max 280 caractères avec hashtags",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6"],
  "faq": [
    {"q":"question fréquente 1","r":"réponse détaillée et utile"},
    {"q":"question fréquente 2","r":"réponse détaillée et utile"},
    {"q":"question fréquente 3","r":"réponse détaillée et utile"}
  ],
  "schema_org": {"@context":"https://schema.org","@type":"Product","name":"${editProd.nom}","description":"...","brand":{"@type":"Brand","name":"${editProd.marque || 'ABAVI'}"},"offers":{"@type":"Offer","priceCurrency":"XOF","availability":"https://schema.org/InStock"}}
}`
      const parsed = await callGroqJSON(prompt, { maxTokens: 2500, temperature: 0.45 })
      if (!parsed) throw new Error('Réponse IA vide ou malformée')
      setEditProd(prev => ({
        ...prev,
        description_courte: parsed.description_courte || prev.description_courte,
        description: parsed.description || prev.description,
        storytelling: parsed.storytelling || prev.storytelling,
        angle_vente: parsed.angle_vente || prev.angle_vente,
        public_cible: parsed.public_cible || prev.public_cible,
        points_forts: Array.isArray(parsed.points_forts) ? parsed.points_forts : prev.points_forts,
        cas_usage: Array.isArray(parsed.cas_usage) ? parsed.cas_usage : prev.cas_usage,
        meta_title: parsed.meta_title || prev.meta_title,
        meta_description: parsed.meta_description || prev.meta_description,
        keywords: parsed.keywords || prev.keywords,
        long_tail_keywords: parsed.long_tail_keywords || prev.long_tail_keywords,
        post_facebook: parsed.post_facebook || prev.post_facebook,
        post_instagram: parsed.post_instagram || prev.post_instagram,
        post_whatsapp: parsed.post_whatsapp || prev.post_whatsapp,
        post_twitter: parsed.post_twitter || prev.post_twitter,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : prev.hashtags,
        faq: Array.isArray(parsed.faq) ? parsed.faq : prev.faq,
        schema_org: typeof parsed.schema_org === 'object' ? JSON.stringify(parsed.schema_org, null, 2) : (parsed.schema_org || prev.schema_org),
      }))
      showToast('✅ Dossier produit IA généré (Description + SEO + Social + FAQ)')
    } catch (e) { showToast('Erreur IA: ' + e.message, 'error') }
    finally { setAiLoading(false) }
  }

  function copyText(key, text) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // ── Image Upload ──
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingImg(true)
    try {
      const url = await uploadFile(file, 'store-images', `abavie-product-${Date.now()}-${file.name}`)
      setEditProd(prev => ({ ...prev, image_url: url }))
      showToast('Image uploadée')
    } catch (err) { showToast('Erreur upload: ' + err.message, 'error') }
    finally { setUploadingImg(false) }
  }

  // ── Product CRUD ──
  const saveProduct = async () => {
    if (!editProd.nom.trim()) { showToast('Le nom est obligatoire', 'error'); return }
    const payload = { ...editProd, prix: Number(editProd.prix) || 0, prix_original: Number(editProd.prix_original) || 0, stock: Number(editProd.stock) || 0, specs: Array.isArray(editProd.specs) ? editProd.specs : (editProd.specs || '').split(',').map(s => s.trim()).filter(Boolean) }
    try {
      if (isEdit) {
        const { error } = await supabase.from('abavie_products').update(payload).eq('id', editProd.id)
        if (error) throw error
        showToast('Produit mis à jour')
      } else {
        const { error } = await supabase.from('abavie_products').insert([payload])
        if (error) throw error
        showToast('Produit créé')
      }
      setProdModal(false)
      loadProducts()
    } catch (e) { showToast('Erreur sauvegarde: ' + e.message, 'error') }
  }

  const deleteProduct = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      const { error } = await supabase.from('abavie_products').delete().eq('id', id)
      if (error) throw error
      showToast('Produit supprimé')
      loadProducts()
    } catch (e) { showToast('Erreur suppression: ' + e.message, 'error') }
  }

  // ── Supplier CRUD ──
  const saveSupplier = async () => {
    if (!editSup.nom.trim()) { showToast('Le nom du fournisseur est obligatoire', 'error'); return }
    try {
      if (isEditSup) {
        const { error } = await supabase.from('abavie_suppliers').update(editSup).eq('id', editSup.id)
        if (error) throw error
        showToast('Fournisseur mis à jour')
      } else {
        const { error } = await supabase.from('abavie_suppliers').insert([editSup])
        if (error) throw error
        showToast('Fournisseur créé')
      }
      setSupModal(false)
      loadSuppliers()
    } catch (e) { showToast('Erreur: ' + e.message, 'error') }
  }

  const deleteSupplier = async (id) => {
    if (!confirm('Supprimer ce fournisseur ? Les produits associés perdront leur lien.')) return
    try {
      const { error } = await supabase.from('abavie_suppliers').delete().eq('id', id)
      if (error) throw error
      showToast('Fournisseur supprimé')
      loadSuppliers()
      loadProducts()
    } catch (e) { showToast('Erreur: ' + e.message, 'error') }
  }

  const filteredProducts = products.filter(p => {
    if (catFilter !== 'Tous' && p.categorie !== catFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (p.nom + ' ' + (p.categorie || '') + ' ' + (p.marque || '')).toLowerCase().includes(q)
    }
    return true
  })

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Schema error banner */}
      {schemaError && (
        <div style={{
          borderRadius: 12, padding: '16px 18px', marginBottom: 20,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <div style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.82rem', marginBottom: 6 }}>
            ❌ Table manquante sur Supabase
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: 10 }}>
            {schemaError}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginBottom: 10, lineHeight: 1.5 }}>
            <strong>💡 Cause :</strong> La table <code>abavie_suppliers</code> ou <code>abavie_products</code> existe en local mais n’a pas encore été créée sur le projet Supabase distant.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a
              href="https://supabase.com/dashboard/project/nqpfmnsecjhqxuvfkqhi/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                background: '#3B82F6', color: '#fff', textDecoration: 'none', display: 'inline-block',
              }}
            >
              🔗 Ouvrir SQL Editor
            </a>
            <button
              onClick={() => { setLoading(true); setSchemaError(null); Promise.all([loadProducts(), loadSuppliers()]).finally(() => setLoading(false)) }}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', cursor: 'pointer',
              }}
            >
              ↻ Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 20, paddingBottom: 10 }}>
        <button onClick={() => setTab('products')} style={{ padding: '8px 16px', borderRadius: 10, border: tab === 'products' ? '1.5px solid #10B981' : '1px solid transparent', background: tab === 'products' ? 'rgba(16,185,129,0.12)' : 'transparent', color: tab === 'products' ? '#34D399' : 'var(--text-secondary)', fontWeight: tab === 'products' ? 800 : 600, fontSize: '0.85rem', cursor: 'pointer' }}>🩺 Produits ({products.length})</button>
        <button onClick={() => setTab('suppliers')} style={{ padding: '8px 16px', borderRadius: 10, border: tab === 'suppliers' ? '1.5px solid #10B981' : '1px solid transparent', background: tab === 'suppliers' ? 'rgba(16,185,129,0.12)' : 'transparent', color: tab === 'suppliers' ? '#34D399' : 'var(--text-secondary)', fontWeight: tab === 'suppliers' ? 800 : 600, fontSize: '0.85rem', cursor: 'pointer' }}>🏭 Fournisseurs ({suppliers.length})</button>
      </div>

      {/* ── PRODUCTS TAB ── */}
      {tab === 'products' && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1, margin: 0 }}>🩺 Produits Abavie</h2>
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }} />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 160 }}>
              <option value="Tous">Toutes catégories</option>
              {PRODUCT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => { setEditProd({ ...EMPTY_PRODUCT }); setIsEdit(false); setProdTab('base'); setProdModal(true) }} style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>+ Nouveau produit</button>
          </div>

          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Chargement…</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filteredProducts.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aucun produit.</p>}
              {filteredProducts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  {p.image_url ? <img src={p.image_url} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : <span style={{ fontSize: '1.5rem' }}>🩺</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.nom}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {p.categorie} · {(p.prix || 0).toLocaleString()} F · Stock: {p.stock ?? '—'} · {p.actif ? '✅ Actif' : '❌ Inactif'}
                      {p.supplier && <> · Fournisseur: {p.supplier.nom}</>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditProd({ ...p, specs: Array.isArray(p.specs) ? p.specs : [] }); setIsEdit(true); setProdTab('base'); setProdModal(true) }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => deleteProduct(p.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SUPPLIERS TAB ── */}
      {tab === 'suppliers' && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1, margin: 0 }}>🏭 Fournisseurs (admin uniquement)</h2>
            <button onClick={() => { setEditSup({ ...EMPTY_SUPPLIER }); setIsEditSup(false); setSupModal(true) }} style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>+ Nouveau fournisseur</button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            🔒 Ces informations sont confidentielles et visibles uniquement par l'administration ABAWI.
          </p>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Chargement…</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {suppliers.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aucun fournisseur.</p>}
              {suppliers.map(s => (
                <div key={s.id} style={{ padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', flex: 1 }}>{s.nom}</div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800, background: s.verified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: s.verified ? '#10B981' : '#f59e0b' }}>{s.verified ? '✓ Vérifié' : '⏳ Non vérifié'}</span>
                    <button onClick={() => { setEditSup({ ...s }); setIsEditSup(true); setSupModal(true) }} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => deleteSupplier(s.id)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer' }}>🗑️</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '4px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <div>👤 {s.contact_nom || '—'}</div>
                    <div>📞 {s.telephone || '—'}</div>
                    <div>✉️ {s.email || '—'}</div>
                    <div>📍 {s.adresse || '—'}{s.ville ? `, ${s.ville}` : ''}</div>
                    {s.notes && <div style={{ gridColumn: '1 / -1', marginTop: 4, fontStyle: 'italic' }}>📝 {s.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PRODUCT MODAL ── */}
      {prodModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setProdModal(false) }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 800, maxHeight: '92vh', overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{isEdit ? '✏️ Modifier' : '➕ Nouveau'} produit</h3>
              <button onClick={() => setProdModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* AI Generation Banner — always visible */}
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: '#C084FC', fontSize: '0.9rem' }}>🤖 IA Senior Expert</span>
              <button onClick={generateAIDescription} disabled={aiLoading} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#A855F7,#9333EA)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', opacity: aiLoading ? 0.6 : 1 }}>{aiLoading ? 'Génération…' : '✨ Générer le dossier complet'}</button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Description, storytelling, SEO, social, FAQ</span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 18, overflowX: 'auto' }}>
              {[
                { id: 'base', label: 'Base', icon: '📋' },
                { id: 'content', label: 'Contenu', icon: '✍️' },
                { id: 'marketing', label: 'SEO', icon: '🔍' },
                { id: 'social', label: 'Social', icon: '📣' },
                { id: 'faq', label: 'FAQ', icon: '❓' },
                { id: 'admin', label: 'Admin', icon: '⚙️' },
              ].map(t => (
                <button key={t.id} onClick={() => setProdTab(t.id)} style={{
                  padding: '8px 14px', borderRadius: '8px 8px 0 0', border: '1px solid transparent', borderBottom: prodTab === t.id ? '2px solid #A855F7' : '2px solid transparent',
                  background: prodTab === t.id ? 'rgba(168,85,247,0.08)' : 'transparent', color: prodTab === t.id ? '#C084FC' : 'var(--text-secondary)',
                  fontWeight: prodTab === t.id ? 700 : 600, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>{t.icon} {t.label}</button>
              ))}
            </div>

            {/* TAB: Base */}
            {prodTab === 'base' && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Nom du produit *</label><input value={editProd.nom} onChange={e => setEditProd({ ...editProd, nom: e.target.value })} style={inputStyle} placeholder="Ex: Stéthoscope Littmann Classic III" /></div>
                  <div><label style={labelStyle}>Catégorie</label><select value={editProd.categorie} onChange={e => setEditProd({ ...editProd, categorie: e.target.value })} style={inputStyle}>{PRODUCT_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Prix (FCFA) *</label><input type="number" value={editProd.prix} onChange={e => setEditProd({ ...editProd, prix: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Prix barré</label><input type="number" value={editProd.prix_original} onChange={e => setEditProd({ ...editProd, prix_original: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Stock</label><input type="number" value={editProd.stock} onChange={e => setEditProd({ ...editProd, stock: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Marque</label><input value={editProd.marque} onChange={e => setEditProd({ ...editProd, marque: e.target.value })} style={inputStyle} placeholder="Ex: 3M Littmann" /></div>
                  <div><label style={labelStyle}>Garantie</label><input value={editProd.garantie} onChange={e => setEditProd({ ...editProd, garantie: e.target.value })} style={inputStyle} placeholder="Ex: 12 mois" /></div>
                </div>
                <div>
                  <label style={labelStyle}>Image</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {editProd.image_url && <img src={editProd.image_url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImg} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.82rem', cursor: 'pointer' }}>{uploadingImg ? 'Upload…' : '📤 Uploader image'}</button>
                    <input value={editProd.image_url} onChange={e => setEditProd({ ...editProd, image_url: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="URL image…" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Content */}
            {prodTab === 'content' && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div><label style={labelStyle}>Description courte (catalogue)</label><textarea value={editProd.description_courte} onChange={e => setEditProd({ ...editProd, description_courte: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="1-2 phrases d'accroche percutantes" /></div>
                <div><label style={labelStyle}>Description longue</label><textarea value={editProd.description} onChange={e => setEditProd({ ...editProd, description: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Description commerciale détaillée, bénéfices, usages…" /></div>
                <div><label style={labelStyle}>Storytelling produit</label><textarea value={editProd.storytelling} onChange={e => setEditProd({ ...editProd, storytelling: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Histoire émotionnelle autour du produit…" /></div>
                <div><label style={labelStyle}>Angles de vente (séparés par | )</label><textarea value={editProd.angle_vente} onChange={e => setEditProd({ ...editProd, angle_vente: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Angle 1 | Angle 2 | Angle 3" /></div>
                <div><label style={labelStyle}>Public cible</label><input value={editProd.public_cible} onChange={e => setEditProd({ ...editProd, public_cible: e.target.value })} style={inputStyle} placeholder="Ex: infirmiers libéraux, cliniques privées, étudiants en médecine…" /></div>
                <div>
                  <label style={labelStyle}>Points forts</label>
                  {(editProd.points_forts || []).map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input value={pt} onChange={e => { const next = [...(editProd.points_forts || [])]; next[i] = e.target.value; setEditProd({ ...editProd, points_forts: next }) }} style={{ ...inputStyle, marginBottom: 0 }} placeholder={`Point fort ${i+1}`} />
                      <button onClick={() => setEditProd({ ...editProd, points_forts: (editProd.points_forts || []).filter((_, idx) => idx !== i) })} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setEditProd({ ...editProd, points_forts: [...(editProd.points_forts || []), ''] })} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}>+ Ajouter un point fort</button>
                </div>
                <div>
                  <label style={labelStyle}>Cas d'usage</label>
                  {(editProd.cas_usage || []).map((u, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input value={u} onChange={e => { const next = [...(editProd.cas_usage || [])]; next[i] = e.target.value; setEditProd({ ...editProd, cas_usage: next }) }} style={{ ...inputStyle, marginBottom: 0 }} placeholder={`Cas d'usage ${i+1}`} />
                      <button onClick={() => setEditProd({ ...editProd, cas_usage: (editProd.cas_usage || []).filter((_, idx) => idx !== i) })} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setEditProd({ ...editProd, cas_usage: [...(editProd.cas_usage || []), ''] })} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}>+ Ajouter un cas d'usage</button>
                </div>
              </div>
            )}

            {/* TAB: SEO & Marketing */}
            {prodTab === 'marketing' && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div><label style={labelStyle}>Meta title (&lt; 60 caractères)</label><input value={editProd.meta_title} onChange={e => setEditProd({ ...editProd, meta_title: e.target.value })} style={inputStyle} placeholder="Titre optimisé pour Google" /></div>
                <div><label style={labelStyle}>Meta description (&lt; 160 caractères)</label><textarea value={editProd.meta_description} onChange={e => setEditProd({ ...editProd, meta_description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Meta description avec appel à l'action" /></div>
                <div><label style={labelStyle}>Mots-clés principaux</label><input value={editProd.keywords} onChange={e => setEditProd({ ...editProd, keywords: e.target.value })} style={inputStyle} placeholder="stéthoscope, médical, Sénégal, Dakar…" /></div>
                <div><label style={labelStyle}>Mots-clés longs (long-tail)</label><textarea value={editProd.long_tail_keywords} onChange={e => setEditProd({ ...editProd, long_tail_keywords: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="acheter stéthoscope professionnel Dakar, matériel médical pas cher Sénégal…" /></div>
                <div>
                  <label style={labelStyle}>Schema.org JSON-LD</label>
                  <textarea value={editProd.schema_org} onChange={e => setEditProd({ ...editProd, schema_org: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem' }} placeholder='{"@context":"https://schema.org",...}' />
                </div>
              </div>
            )}

            {/* TAB: Social Media */}
            {prodTab === 'social' && (
              <div style={{ display: 'grid', gap: 14 }}>
                {[
                  { key: 'post_facebook', label: 'Facebook', color: '#1877F2', icon: '📘' },
                  { key: 'post_instagram', label: 'Instagram', color: '#E4405F', icon: '📸' },
                  { key: 'post_whatsapp', label: 'WhatsApp', color: '#25D366', icon: '💬' },
                  { key: 'post_twitter', label: 'Twitter / X', color: '#1DA1F2', icon: '🐦' },
                ].map(net => (
                  <div key={net.key} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: net.color }}>{net.icon} {net.label}</span>
                      <button onClick={() => copyText(net.key, editProd[net.key] || '')} style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', background: copiedKey === net.key ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copiedKey === net.key ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, color: copiedKey === net.key ? '#10B981' : 'var(--text-secondary)', cursor: 'pointer' }}>{copiedKey === net.key ? '✅ Copié' : '📋 Copier'}</button>
                    </div>
                    <textarea value={editProd[net.key] || ''} onChange={e => setEditProd({ ...editProd, [net.key]: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder={`Post ${net.label} prêt à publier…`} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Hashtags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {(editProd.hashtags || []).map((h, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#8B5CF6', fontSize: '0.78rem' }}>
                        {h} <button onClick={() => setEditProd({ ...editProd, hashtags: (editProd.hashtags || []).filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}>✕</button>
                      </span>
                    ))}
                  </div>
                  <input
                    style={inputStyle}
                    placeholder="Ajouter un hashtag et appuyer sur Entrée"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) { setEditProd(prev => ({ ...prev, hashtags: [...(prev.hashtags || []), v.startsWith('#') ? v : '#' + v] })); e.target.value = ''; } } }}
                  />
                </div>
              </div>
            )}

            {/* TAB: FAQ */}
            {prodTab === 'faq' && (
              <div style={{ display: 'grid', gap: 14 }}>
                {(editProd.faq || []).map((item, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>FAQ #{i+1}</span>
                      <button onClick={() => setEditProd({ ...editProd, faq: (editProd.faq || []).filter((_, idx) => idx !== i) })} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem' }}>Supprimer</button>
                    </div>
                    <input value={item.q || ''} onChange={e => { const next = [...(editProd.faq || [])]; next[i] = { ...next[i], q: e.target.value }; setEditProd({ ...editProd, faq: next }) }} style={{ ...inputStyle, marginBottom: 0 }} placeholder="Question" />
                    <textarea value={item.r || ''} onChange={e => { const next = [...(editProd.faq || [])]; next[i] = { ...next[i], r: e.target.value }; setEditProd({ ...editProd, faq: next }) }} rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 0 }} placeholder="Réponse" />
                  </div>
                ))}
                <button onClick={() => setEditProd({ ...editProd, faq: [...(editProd.faq || []), { q: '', r: '' }] })} style={{ padding: '8px 14px', borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer' }}>+ Ajouter une FAQ</button>
              </div>
            )}

            {/* TAB: Admin */}
            {prodTab === 'admin' && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#10B981', marginBottom: 10 }}>🔗 Fournisseur (confidentiel)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={labelStyle}>Fournisseur</label>
                      <select value={editProd.supplier_id || ''} onChange={e => setEditProd({ ...editProd, supplier_id: e.target.value })} style={inputStyle}>
                        <option value="">— Choisir —</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.nom} ({s.ville || '?'}) {s.verified ? '✓' : ''}</option>)}
                      </select>
                    </div>
                    <div><label style={labelStyle}>Lien direct produit</label><input value={editProd.supplier_link} onChange={e => setEditProd({ ...editProd, supplier_link: e.target.value })} style={inputStyle} placeholder="https://fournisseur.com/produit/123" /></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={editProd.actif} onChange={e => setEditProd({ ...editProd, actif: e.target.checked })} />
                    Actif (visible publiquement)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={editProd.featured} onChange={e => setEditProd({ ...editProd, featured: e.target.checked })} />
                    ★ Vedette (homepage)
                  </label>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setProdModal(false)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={saveProduct} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{isEdit ? '💾 Enregistrer' : '➕ Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPLIER MODAL ── */}
      {supModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setSupModal(false) }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{isEditSup ? '✏️ Modifier' : '➕ Nouveau'} fournisseur</h3>
              <button onClick={() => setSupModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Nom de l'entreprise *</label><input value={editSup.nom} onChange={e => setEditSup({ ...editSup, nom: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Contact (personne)</label><input value={editSup.contact_nom} onChange={e => setEditSup({ ...editSup, contact_nom: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Téléphone</label><input value={editSup.telephone} onChange={e => setEditSup({ ...editSup, telephone: e.target.value })} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Email</label><input type="email" value={editSup.email} onChange={e => setEditSup({ ...editSup, email: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Adresse</label><input value={editSup.adresse} onChange={e => setEditSup({ ...editSup, adresse: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Ville / Localisation</label><input value={editSup.ville} onChange={e => setEditSup({ ...editSup, ville: e.target.value })} style={inputStyle} placeholder="Ex: Dakar, Thiès, Kaolack…" /></div>
              <div><label style={labelStyle}>Notes privées</label><textarea value={editSup.notes} onChange={e => setEditSup({ ...editSup, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Conditions de paiement, délais, relations…" /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={editSup.verified} onChange={e => setEditSup({ ...editSup, verified: e.target.checked })} />
                Fournisseur vérifié
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={editSup.actif} onChange={e => setEditSup({ ...editSup, actif: e.target.checked })} />
                Actif
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setSupModal(false)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={saveSupplier} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{isEditSup ? '💾 Enregistrer' : '➕ Créer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
