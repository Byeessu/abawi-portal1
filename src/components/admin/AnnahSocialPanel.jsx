import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { callGroq } from '../../lib/groqClient'
import { guides, allFascicules, podcasts, videos, summaries } from '../../data/products'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C', maxChars: 2200 },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', maxChars: 63206 },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', maxChars: 3000 },
  { id: 'twitter', label: 'X / Twitter', color: '#1DA1F2', maxChars: 280 },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', maxChars: 1000 },
]

const CONTENT_TYPES = [
  'Post promotionnel', 'Annonce produit', 'Témoignage client', 'Conseil expert',
  'Offre spéciale', 'Storytelling', 'Appel à l\'action', 'Tutoriel / How-to',
  'Actualité', 'Motivation / Inspiration',
]

const TIME_SLOTS = ['07:00', '09:00', '12:00', '15:00', '18:00', '20:00']

function maskToken(t) {
  if (!t) return ''
  if (t.length < 10) return '****'
  return t.slice(0, 4) + '****' + t.slice(-4)
}

export default function AnnahSocialPanel({ owner, showToast }) {
  const [active, setActive] = useState(false)
  const [strategy, setStrategy] = useState({
    postsPerWeek: 5,
    platforms: ['instagram', 'facebook', 'linkedin'],
    contentTypes: ['Post promotionnel', 'Conseil expert', 'Offre spéciale'],
    periodDays: 14,
    timeSlots: ['09:00', '18:00'],
    tone: 'professionnel',
    language: 'fr',
    autoMode: false,
  })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [scheduled, setScheduled] = useState([])
  const [connectors, setConnectors] = useState({})
  const [stats, setStats] = useState({ total: 0, planifié: 0, publié: 0, échoué: 0 })
  const [generatingPost, setGeneratingPost] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [publishingIds, setPublishingIds] = useState(new Set())
  const [lastAutoLog, setLastAutoLog] = useState('')
  const [editPost, setEditPost] = useState(null)

  const catalog = useMemo(() => {
    const items = []
    guides.slice(0, 8).forEach((g, i) => items.push({ id: `g-${i}`, type: 'Guide', name: g.titre, price: g.prix, category: g.categorie }))
    allFascicules.slice(0, 8).forEach((f, i) => items.push({ id: `f-${i}`, type: 'Fascicule', name: f.title || f.titre, price: f.price || f.prix, category: f.category || f.categorie }))
    podcasts.slice(0, 6).forEach((p, i) => items.push({ id: `p-${i}`, type: 'Podcast', name: p.title || p.titre, price: p.price || 0, category: 'Podcast' }))
    videos.slice(0, 6).forEach((v, i) => items.push({ id: `v-${i}`, type: 'Vidéo', name: v.title || v.titre, price: v.price || 0, category: 'Vidéo' }))
    summaries.slice(0, 6).forEach((s, i) => items.push({ id: `s-${i}`, type: 'Résumé', name: s.title || s.titre, price: s.price || 0, category: 'Résumé' }))
    return items
  }, [])

  useEffect(() => {
    if (!owner) return
    loadScheduled()
    loadConnectors()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  // Auto-publish loop
  useEffect(() => {
    if (!autoMode || !owner) return
    const interval = setInterval(async () => {
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      const currentHour = now.getHours().toString().padStart(2, '0')
      const currentMinute = now.getMinutes()
      // Only trigger at minute 0-5 of each hour to avoid spam
      if (currentMinute > 5) return
      const currentTime = `${currentHour}:${now.getMinutes().toString().padStart(2, '0')}`

      try {
        const { data } = await supabase
          .from('marketing_posts')
          .select('*')
          .eq('owner_email', owner)
          .eq('statut', 'planifié')
          .eq('date_publication', today)
        if (!data || !data.length) return
        const due = data.filter(p => {
          const [h, m] = (p.heure || '').split(':').map(Number)
          const postMin = h * 60 + m
          const nowMin = now.getHours() * 60 + now.getMinutes()
          return Math.abs(postMin - nowMin) <= 5
        })
        for (const post of due) {
          if (publishingIds.has(post.id)) continue
          await publishPost(post, true)
        }
        if (due.length) {
          setLastAutoLog(`Auto-publié ${due.length} post(s) — ${new Date().toLocaleTimeString('fr')}`)
          loadScheduled()
        }
      } catch { /* ignore */ }
    }, 60000) // every minute
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, owner, publishingIds])

  async function loadScheduled() {
    try {
      const { data, error } = await supabase
        .from('marketing_posts')
        .select('*')
        .eq('owner_email', owner)
        .order('date_publication', { ascending: true })
        .limit(50)
      if (!error && data) {
        setScheduled(data)
        setStats({
          total: data.length,
          planifié: data.filter(p => p.statut === 'planifié').length,
          publié: data.filter(p => p.statut === 'publié').length,
          échoué: data.filter(p => p.statut === 'échoué').length,
        })
      }
    } catch { /* ignore */ }
  }

  async function loadConnectors() {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key,content_value')
        .eq('content_type', 'social_connector')
        .eq('owner_email', owner)
      if (!error && data) {
        const cfg = {}
        data.forEach(r => { cfg[r.content_key] = r.content_value || {} })
        setConnectors(cfg)
      }
    } catch { /* ignore */ }
  }

  async function generatePlan() {
    if (!owner) { showToast?.('Utilisateur non identifié', 'error'); return }
    setLoading(true)
    try {
      const productsText = selectedProducts.length
        ? selectedProducts.map(id => catalog.find(c => c.id === id)).filter(Boolean).map(c => `- ${c.name} (${c.type}, ${c.price ? c.price + ' FCFA' : 'gratuit'})`).join('\n')
        : 'Aucun produit spécifique sélectionné — promouvoir la marque ABAWI en général.'

      const prompt = `Tu es Annah, directrice marketing senior Afrique francophone pour ABAWI.
Mission : générer un plan éditorial social media autonome pour ${strategy.periodDays} jours.

STRATÉGIE :
- Fréquence : ${strategy.postsPerWeek} posts/semaine
- Plateformes : ${strategy.platforms.map(p => PLATFORMS.find(x => x.id === p)?.label || p).join(', ')}
- Types de contenu : ${strategy.contentTypes.join(', ')}
- Ton : ${strategy.tone}
- Langue : ${strategy.language === 'fr' ? 'Français' : 'Anglais'}
- Créneaux horaires : ${strategy.timeSlots.join(', ')}

PRODUITS À PROMOUVOIR :
${productsText}

INSTRUCTIONS :
1. Génère un tableau JSON de posts avec ces champs : titre, plateforme (instagram|facebook|linkedin|twitter|whatsapp), type_contenu, date_publication (YYYY-MM-DD), heure (HH:MM), contenu (texte complet du post adapté à la plateforme), statut ("planifié").
2. Répartis intelligemment sur ${strategy.periodDays} jours à partir d'aujourd'hui (${new Date().toISOString().slice(0, 10)}).
3. Alterne les plateformes et types de contenu.
4. Adapte la longueur au format de chaque plateforme.
5. Inclus hashtags pertinents pour Instagram/Facebook, tone professionnel pour LinkedIn.
6. Au moins un post sur chaque produit sélectionné.

Retourne UNIQUEMENT ce JSON valide : {"posts":[...]}`

      const raw = await callGroq(prompt, 2500)
      const clean = String(raw || '').replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
      const parsed = JSON.parse(clean)
      if (!Array.isArray(parsed?.posts)) throw new Error('Format invalide')
      setPlan(parsed.posts)
      showToast?.(`✅ Plan généré : ${parsed.posts.length} posts`, 'success')
    } catch (e) {
      showToast?.(`❌ Génération plan échouée : ${e.message}`, 'error')
    }
    setLoading(false)
  }

  async function validatePlan() {
    if (!plan?.length || !owner) return
    setLoading(true)
    try {
      const rows = plan.map(p => ({
        owner_email: owner,
        titre: p.titre || p.title || 'Post auto',
        plateforme: p.plateforme || p.platform || 'instagram',
        type_contenu: p.type_contenu || p.type || 'Post promotionnel',
        date_publication: p.date_publication || p.date || new Date().toISOString().slice(0, 10),
        heure: p.heure || p.time || '09:00',
        statut: 'planifié',
        contenu: p.contenu || p.content || '',
      }))
      const { error } = await supabase.from('marketing_posts').insert(rows)
      if (error) throw error
      showToast?.(`✅ ${rows.length} posts planifiés dans le calendrier`, 'success')
      setPlan(null)
      loadScheduled()
    } catch (e) {
      showToast?.(`❌ Validation échouée : ${e.message}`, 'error')
    }
    setLoading(false)
  }

  async function generateOnePost(platform, type) {
    if (!owner) return
    setGeneratingPost(true)
    try {
      const productsText = selectedProducts.length
        ? catalog.find(c => c.id === selectedProducts[0])?.name || 'ABAWI'
        : 'ABAWI'
      const prompt = `Rédige un ${type} pour ${platform} sur ${productsText}. Ton ${strategy.tone}. Français. Max ${PLATFORMS.find(p => p.id === platform)?.maxChars || 500} caractères. Inclus hashtags si pertinent. Uniquement le texte du post.`
      const text = await callGroq(prompt, 600)
      const today = new Date().toISOString().slice(0, 10)
      const { error } = await supabase.from('marketing_posts').insert({
        owner_email: owner,
        titre: `${type} — ${platform}`,
        plateforme: platform,
        type_contenu: type,
        date_publication: today,
        heure: strategy.timeSlots[0] || '09:00',
        statut: 'planifié',
        contenu: text.trim(),
      })
      if (error) throw error
      showToast?.('✅ Post rapide créé', 'success')
      loadScheduled()
    } catch (e) {
      showToast?.(`❌ Post rapide échoué : ${e.message}`, 'error')
    }
    setGeneratingPost(false)
  }

  async function deletePost(post) {
    if (!owner || !post) return
    if (!confirm(`Supprimer "${post.titre}" ?`)) return
    try {
      const { error } = await supabase.from('marketing_posts').delete().eq('id', post.id)
      if (error) throw error
      showToast?.('🗑️ Post supprimé', 'success')
      loadScheduled()
    } catch (e) {
      showToast?.(`❌ Suppression échouée : ${e.message}`, 'error')
    }
  }

  async function saveEdit() {
    if (!editPost || !owner) return
    try {
      const { error } = await supabase.from('marketing_posts').update({
        titre: editPost.titre,
        plateforme: editPost.plateforme,
        type_contenu: editPost.type_contenu,
        date_publication: editPost.date_publication,
        heure: editPost.heure,
        contenu: editPost.contenu,
      }).eq('id', editPost.id)
      if (error) throw error
      showToast?.('✅ Post mis à jour', 'success')
      setEditPost(null)
      loadScheduled()
    } catch (e) {
      showToast?.(`❌ Mise à jour échouée : ${e.message}`, 'error')
    }
  }

  async function publishPost(post, silent = false) {
    if (!owner || !post) return
    const cfg = connectors[post.plateforme]
    if (!cfg?.enabled || !cfg?.token) {
      if (!silent) showToast?.(`⚠️ Connecteur ${post.plateforme} non configuré`, 'warning')
      return
    }
    setPublishingIds(prev => new Set(prev).add(post.id))
    try {
      const res = await fetch('/.netlify/functions/social-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: owner,
          campaignName: `Annah-${post.titre}`,
          mode: 'live',
          asyncQueue: false,
          message: post.contenu || '',
          targets: [{
            platform: post.plateforme,
            accountId: cfg.accountId || '',
            token: cfg.token || '',
            label: cfg.label || '',
          }],
        }),
      })
      if (!res.ok) throw new Error(`dispatch ${res.status}`)
      const out = await res.json()
      const status = out?.results?.[0]?.status || 'unknown'
      const success = status === 'posted' || status === 'connector-ready' || status === 'simulated'
      await supabase.from('marketing_posts').update({
        statut: success ? 'publié' : 'échoué',
        published_at: success ? new Date().toISOString() : null,
      }).eq('id', post.id)
      if (!silent) showToast?.(success ? `✅ Publié sur ${post.plateforme}` : `⚠️ ${post.plateforme}: ${status}`, success ? 'success' : 'warning')
      loadScheduled()
    } catch (e) {
      if (!silent) showToast?.(`❌ Publication échouée : ${e.message}`, 'error')
      try {
        await supabase.from('marketing_posts').update({ statut: 'échoué' }).eq('id', post.id)
      } catch { /* ignore */ }
    }
    setPublishingIds(prev => { const n = new Set(prev); n.delete(post.id); return n })
  }

  const connectedPlatforms = useMemo(() => {
    return PLATFORMS.filter(p => {
      const cfg = connectors[p.id] || {}
      return !!(cfg.token || '').trim() && cfg.enabled
    })
  }, [connectors])

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }
  const lbl = { display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }
  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }
  const chip = (sel, onClick) => ({ padding: '6px 12px', borderRadius: 20, border: `1px solid ${sel ? '#EC4899' : 'var(--border)'}`, background: sel ? 'rgba(236,72,153,0.12)' : 'transparent', color: sel ? '#EC4899' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' })

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header Expert */}
      <div style={{ ...card, background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(139,92,246,0.08))', borderColor: 'rgba(236,72,153,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#EC4899', fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>EXPERTE MARKETING SENIOR</div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.3rem' }}>🤖 Annah — Publication Auto</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Gère autonomement vos publications sociales. Fréquence, type, modèles, produits et période déterminés par IA.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" checked={autoMode} onChange={e => setAutoMode(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#EC4899', cursor: 'pointer' }} />
              Auto-publier
            </label>
            <button onClick={() => setActive(a => !a)} style={{
              borderRadius: 999, padding: '10px 20px', border: `2px solid ${active ? '#18A84A' : '#EC4899'}`,
              background: active ? 'rgba(24,168,74,0.12)' : 'rgba(236,72,153,0.08)', color: active ? '#18A84A' : '#EC4899',
              fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem',
            }}>
              {active ? '● ANNAH ACTIVE' : '○ ACTIVER ANNAH'}
            </button>
          </div>
          {lastAutoLog && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{lastAutoLog}</div>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total posts', value: stats.total, color: '#8B5CF6' },
          { label: 'Planifiés', value: stats.planifié, color: '#3B82F6' },
          { label: 'Publiés', value: stats.publié, color: '#18A84A' },
          { label: 'Connecteurs', value: connectedPlatforms.length, color: '#F0B429' },
        ].map(s => (
          <div key={s.label} style={{ ...card, textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: 4 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Strategy */}
      <div style={card}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>🎯 Stratégie de publication</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <label style={lbl}>Posts par semaine</label>
            <input type="number" min={1} max={21} style={inp} value={strategy.postsPerWeek} onChange={e => setStrategy(s => ({ ...s, postsPerWeek: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={lbl}>Période (jours)</label>
            <input type="number" min={7} max={90} style={inp} value={strategy.periodDays} onChange={e => setStrategy(s => ({ ...s, periodDays: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={lbl}>Ton global</label>
            <select style={inp} value={strategy.tone} onChange={e => setStrategy(s => ({ ...s, tone: e.target.value }))}>
              {['professionnel', 'décontracté', 'inspirant', 'urgent', 'émotionnel', 'éducatif', 'luxe'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Langue</label>
            <select style={inp} value={strategy.language} onChange={e => setStrategy(s => ({ ...s, language: e.target.value }))}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="wo">Wolof</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={lbl}>Plateformes cibles</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLATFORMS.map(p => {
              const sel = strategy.platforms.includes(p.id)
              const connected = !!(connectors[p.id]?.token && connectors[p.id]?.enabled)
              return (
                <button key={p.id} onClick={() => setStrategy(s => ({ ...s, platforms: sel ? s.platforms.filter(x => x !== p.id) : [...s.platforms, p.id] }))} style={chip(sel)}>
                  {p.label} {connected ? '●' : '○'}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={lbl}>Types de contenu</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CONTENT_TYPES.map(t => {
              const sel = strategy.contentTypes.includes(t)
              return <button key={t} onClick={() => setStrategy(s => ({ ...s, contentTypes: sel ? s.contentTypes.filter(x => x !== t) : [...s.contentTypes, t] }))} style={chip(sel)}>{t}</button>
            })}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={lbl}>Créneaux horaires</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TIME_SLOTS.map(t => {
              const sel = strategy.timeSlots.includes(t)
              return <button key={t} onClick={() => setStrategy(s => ({ ...s, timeSlots: sel ? s.timeSlots.filter(x => x !== t) : [...s.timeSlots, t] }))} style={chip(sel)}>{t}</button>
            })}
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      <div style={card}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>📦 Catalogue à promouvoir</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {catalog.map(item => {
            const sel = selectedProducts.includes(item.id)
            return (
              <button key={item.id} onClick={() => setSelectedProducts(prev => sel ? prev.filter(id => id !== item.id) : [...prev, item.id])} style={{
                textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: `1px solid ${sel ? '#EC4899' : 'var(--border)'}`,
                background: sel ? 'rgba(236,72,153,0.08)' : 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer',
              }}>
                <div style={{ fontSize: '0.72rem', color: sel ? '#EC4899' : 'var(--text-muted)', fontWeight: 700 }}>{item.type.toUpperCase()}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: 2 }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{item.price ? item.price.toLocaleString('fr') + ' FCFA' : 'Gratuit'}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={generatePlan} disabled={loading} style={{
          padding: '14px 24px', borderRadius: 12, border: 'none', background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, #EC4899, #be185d)',
          color: loading ? 'var(--text-muted)' : '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem',
        }}>
          {loading ? '⏳ Annah réfléchit...' : `✨ Générer plan (${strategy.periodDays} jours)`}
        </button>
        <button onClick={validatePlan} disabled={!plan?.length || loading} style={{
          padding: '14px 24px', borderRadius: 12, border: '1px solid #18A84A', background: plan?.length ? 'rgba(24,168,74,0.12)' : 'transparent',
          color: plan?.length ? '#18A84A' : 'var(--text-muted)', fontWeight: 800, cursor: plan?.length ? 'pointer' : 'not-allowed', fontSize: '0.95rem',
        }}>
          ✅ Valider & Planifier ({plan?.length || 0})
        </button>
        <button onClick={() => generateOnePost(strategy.platforms[0] || 'instagram', strategy.contentTypes[0] || 'Post promotionnel')} disabled={generatingPost} style={{
          padding: '14px 24px', borderRadius: 12, border: '1px solid #8B5CF6', background: 'rgba(139,92,246,0.08)',
          color: '#8B5CF6', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem',
        }}>
          {generatingPost ? '...' : '⚡ Post rapide'}
        </button>
      </div>

      {/* Plan preview */}
      {plan && (
        <div style={card}>
          <div style={{ fontSize: '0.75rem', color: '#EC4899', fontWeight: 800, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>📋 Plan proposé par Annah</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plan.map((p, i) => {
              const plat = PLATFORMS.find(x => x.id === (p.plateforme || p.platform))
              return (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: plat?.color || '#8B95A5', padding: '2px 8px', borderRadius: 6, background: (plat?.color || '#8B95A5') + '18' }}>{plat?.label || p.plateforme}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{p.date_publication || p.date} · {p.heure || p.time}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{p.type_contenu || p.type}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{p.titre || p.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{(p.contenu || p.content || '').slice(0, 200)}...</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scheduled posts */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>📅 Publications programmées</div>
          <button onClick={loadScheduled} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>⟳ Actualiser</button>
        </div>
        {scheduled.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>Aucune publication programmée. Générez un plan pour commencer.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
            {scheduled.map(post => {
              const plat = PLATFORMS.find(p => p.id === post.plateforme)
              const statutColor = { planifié: '#3B82F6', publié: '#18A84A', brouillon: '#8B95A5', échoué: '#EF4444', annulé: '#8B95A5' }
              return (
                <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{plat ? '📱' : '📝'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{post.titre}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: statutColor[post.statut] || '#8B95A5', padding: '2px 8px', borderRadius: 6, background: (statutColor[post.statut] || '#8B95A5') + '15' }}>{post.statut}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {plat?.label || post.plateforme} · {post.date_publication} {post.heure} · {post.type_contenu}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {post.statut === 'planifié' && (
                      <>
                        <button onClick={() => publishPost(post)} disabled={publishingIds.has(post.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #18A84A', background: publishingIds.has(post.id) ? 'var(--bg-card)' : 'rgba(24,168,74,0.12)', color: publishingIds.has(post.id) ? 'var(--text-muted)' : '#18A84A', fontWeight: 700, fontSize: '0.78rem', cursor: publishingIds.has(post.id) ? 'not-allowed' : 'pointer' }}>
                          {publishingIds.has(post.id) ? '⏳' : '📢 Publier'}
                        </button>
                        <button onClick={() => setEditPost({ ...post })} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #8B5CF6', background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                          ✏️
                        </button>
                      </>
                    )}
                    <button onClick={() => deletePost(post)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #EF4444', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editPost && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>✏️ Modifier le post</h3>
              <button onClick={() => setEditPost(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={lbl}>Titre</label>
                <input style={inp} value={editPost.titre || ''} onChange={e => setEditPost(p => ({ ...p, titre: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Plateforme</label>
                  <select style={inp} value={editPost.plateforme || 'instagram'} onChange={e => setEditPost(p => ({ ...p, plateforme: e.target.value }))}>
                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Type</label>
                  <select style={inp} value={editPost.type_contenu || CONTENT_TYPES[0]} onChange={e => setEditPost(p => ({ ...p, type_contenu: e.target.value }))}>
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Date</label>
                  <input type="date" style={inp} value={editPost.date_publication || ''} onChange={e => setEditPost(p => ({ ...p, date_publication: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Heure</label>
                  <select style={inp} value={editPost.heure || '09:00'} onChange={e => setEditPost(p => ({ ...p, heure: e.target.value }))}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Contenu</label>
                <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} value={editPost.contenu || ''} onChange={e => setEditPost(p => ({ ...p, contenu: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setEditPost(null)} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>
              <button onClick={saveEdit} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#EC4899,#be185d)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
