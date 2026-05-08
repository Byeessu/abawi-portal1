import { useState } from 'react'
import { callGroq as groqCall } from '../lib/groqClient'

async function callGroq(prompt, maxTokens = 800) {
  return groqCall(prompt, { maxTokens })
}

const TABS = ['Partager', 'SEO / SEM', 'Textes réseaux']

/**
 * SocialShare component
 * Props:
 *   titre: string — product/article title
 *   url: string — page URL
 *   description: string — short description
 *   type: string — 'guide' | 'fascicule' | 'podcast' | 'article'
 */
export default function SocialShare({ titre = '', url = '', description = '', type = 'guide', onClose }) {
  const [tab, setTab] = useState(0)
  const [seoData, setSeoData] = useState(null)
  const [textes, setTextes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')

  const pageUrl = url || window.location.href

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const SHARE_LINKS = [
    {
      id: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: '📱',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${titre}\n${pageUrl}`)}`,
    },
    {
      id: 'facebook', label: 'Facebook', color: '#1877F2', icon: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
    {
      id: 'twitter', label: 'X / Twitter', color: '#000000', icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(titre)}&url=${encodeURIComponent(pageUrl)}`,
    },
    {
      id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: '💼',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    },
    {
      id: 'telegram', label: 'Telegram', color: '#26A5E4', icon: '✈️',
      href: `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(titre)}`,
    },
  ]

  async function generateSEO() {
    setLoading(true)
    try {
      const raw = await callGroq(`Génère du contenu SEO/SEM pour ce ${type} africain.
Titre: "${titre}"
Description: "${description}"
URL: "${pageUrl}"

Réponds UNIQUEMENT en JSON valide:
{
  "meta_title": "...(60 chars max)...",
  "meta_description": "...(160 chars max)...",
  "mots_cles": ["...", "...", "...", "...", "...", "..."],
  "google_ads_headline": "...(30 chars max)...",
  "google_ads_description": "...(90 chars max)...",
  "facebook_ads_text": "...",
  "og_title": "...",
  "og_description": "..."
}`, 800)
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw)
      setSeoData(json)
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function generateTextes() {
    setLoading(true)
    try {
      const raw = await callGroq(`Génère des textes de partage pour réseaux sociaux pour ce ${type}.
Titre: "${titre}"
Description: "${description}"
URL: "${pageUrl}"

Réponds en JSON:
{
  "whatsapp": "...(message WhatsApp avec emojis, 3-4 lignes)...",
  "facebook": "...(post Facebook engageant, 4-5 lignes)...",
  "twitter": "...(tweet 280 chars max avec hashtags)...",
  "linkedin": "...(post LinkedIn professionnel, 5-6 lignes)...",
  "hashtags": ["#ABAWI", "...", "...", "...", "...", "...", "..."]
}`, 1000)
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw)
      setTextes(json)
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28,
        width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 2 }}>📤 Partager</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{titre?.substring(0, 50)}</p>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              flex: 1, padding: '9px 8px', borderRadius: 9, cursor: 'pointer', fontWeight: tab === i ? 700 : 400,
              background: tab === i ? 'rgba(240,180,41,0.15)' : 'transparent',
              border: `1px solid ${tab === i ? 'rgba(240,180,41,0.35)' : 'transparent'}`,
              color: tab === i ? '#F0B429' : 'var(--text-secondary)',
              fontSize: '0.8rem', fontFamily: 'Outfit,sans-serif', transition: 'all 0.2s',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab 0 — Partager */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              {SHARE_LINKS.map(link => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
                    background: `${link.color}14`, border: `1px solid ${link.color}30`,
                    color: link.color, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${link.color}22` }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${link.color}14` }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                readOnly value={pageUrl}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Outfit,sans-serif', outline: 'none' }}
              />
              <button onClick={() => copy(pageUrl, 'url')} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {copied === 'url' ? '✅ Copié' : '📋 Copier'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 1 — SEO / SEM */}
        {tab === 1 && (
          <div>
            {!seoData ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
                  Générez automatiquement vos méta-tags SEO, Google Ads et Facebook Ads.
                </p>
                <button onClick={generateSEO} disabled={loading} style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#F0B429,#e5a820)', border: 'none', color: '#070B0F', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
                  {loading ? '⏳ Génération IA...' : '✨ Générer SEO / SEM'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Meta Title', key: 'meta_title', desc: `${seoData.meta_title?.length || 0}/60` },
                  { label: 'Meta Description', key: 'meta_description', desc: `${seoData.meta_description?.length || 0}/160` },
                  { label: 'Google Ads Headline', key: 'google_ads_headline', desc: '' },
                  { label: 'Google Ads Description', key: 'google_ads_description', desc: '' },
                  { label: 'Facebook Ads Text', key: 'facebook_ads_text', desc: '' },
                ].map(({ label, key, desc }) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>{label.toUpperCase()}</span>
                      {desc && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        {seoData[key]}
                      </div>
                      <button onClick={() => copy(seoData[key], key)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', cursor: 'pointer', fontSize: '0.75rem' }}>
                        {copied === key ? '✅' : '📋'}
                      </button>
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>MOTS-CLÉS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {seoData.mots_cles?.map((k, i) => (
                      <span key={i} onClick={() => copy(k, `kw${i}`)} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontSize: '0.78rem', cursor: 'pointer' }}>
                        {copied === `kw${i}` ? '✅' : k}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => setSeoData(null)} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Outfit,sans-serif', fontSize: '0.82rem' }}>
                  Régénérer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2 — Textes réseaux */}
        {tab === 2 && (
          <div>
            {!textes ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
                  Textes optimisés pour chaque réseau social + hashtags tendance.
                </p>
                <button onClick={generateTextes} disabled={loading} style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#F0B429,#e5a820)', border: 'none', color: '#070B0F', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
                  {loading ? '⏳ Génération IA...' : '✍️ Générer les textes'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'whatsapp', label: '📱 WhatsApp', color: '#25D366' },
                  { key: 'facebook', label: '📘 Facebook', color: '#1877F2' },
                  { key: 'twitter', label: '𝕏 Twitter / X', color: '#000' },
                  { key: 'linkedin', label: '💼 LinkedIn', color: '#0A66C2' },
                ].map(({ key, label, color }) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{label}</span>
                      <button onClick={() => copy(textes[key], key)} style={{ padding: '4px 12px', borderRadius: 8, background: `${color}14`, border: `1px solid ${color}30`, color, cursor: 'pointer', fontSize: '0.75rem' }}>
                        {copied === key ? '✅ Copié' : '📋 Copier'}
                      </button>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: `${color}08`, border: `1px solid ${color}20`, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {textes[key]}
                    </div>
                  </div>
                ))}
                {textes.hashtags?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>HASHTAGS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {textes.hashtags.map((h, i) => (
                        <span key={i} onClick={() => copy(h, `ht${i}`)} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontSize: '0.78rem', cursor: 'pointer' }}>
                          {copied === `ht${i}` ? '✅' : h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setTextes(null)} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Outfit,sans-serif', fontSize: '0.82rem' }}>
                  Régénérer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
