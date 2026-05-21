import { useState, useEffect } from 'react'
import { createInvoice, waLink, isPaydunyaConfigured } from '../config/paydunya'
import { trackEvent, captureError } from '../lib/observability'

function AbawiPayMethodIcon({ size = 32 }) {
  const r = Math.round(size * 0.18)
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: '#0a0a0a', overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(245,197,24,0.3)',
    }}>
      <img
        src="/abawi-pay-icon.jpg"
        width={size}
        height={size}
        alt="AbawiPay"
        style={{ display: 'block', objectFit: 'cover', width: '100%', height: '100%' }}
      />
    </div>
  )
}

function formatPrixLocal(p) {
  return (p || 0).toLocaleString('fr-FR') + ' FCFA'
}

const METHODS = [
  {
    id: 'abawi-pay',
    label: 'Abawi Pay',
    desc: '0% frais · Instantané',
    color: '#f5c518',
    svg: <AbawiPayMethodIcon size={32} />,
  },
  {
    id: 'wave',
    label: 'Wave',
    desc: 'Paiement instantané',
    color: '#1BA8F5',
    svg: (
      <img src="/logo-wave.jfif" alt="Wave" width={32} height={32} style={{ borderRadius: 8, objectFit: 'cover', display: 'block' }} />
    ),
  },
  {
    id: 'orange-money',
    label: 'Orange Money',
    desc: 'Orange Money Sénégal',
    color: '#FF6600',
    svg: (
      <img src="/logo-orange-money.png" alt="Orange Money" width={32} height={32} style={{ borderRadius: 8, objectFit: 'cover', display: 'block' }} />
    ),
  },
  {
    id: 'free-money',
    label: 'Free Money',
    desc: 'Free Money Sénégal',
    color: '#E30613',
    svg: (
      <img src="/logo-free-money.png" alt="Free Money" width={32} height={32} style={{ borderRadius: 8, objectFit: 'cover', display: 'block' }} />
    ),
  },
  {
    id: 'card',
    label: 'Carte bancaire',
    desc: 'Visa / Mastercard',
    color: '#6366F1',
    svg: (
      <svg width="32" height="32" viewBox="0 0 40 40">
        <rect width="40" height="40" rx="10" fill="#1e2a3a"/>
        <rect x="4" y="12" width="32" height="20" rx="3" fill="#2A3F5F"/>
        <rect x="4" y="17" width="32" height="7" fill="#F0B429"/>
        <rect x="8" y="26" width="10" height="3" rx="1" fill="#8B95A5"/>
        <rect x="22" y="26" width="10" height="3" rx="1" fill="#8B95A5"/>
      </svg>
    ),
  },
]

export default function PaymentFlow({ product, onClose, onSuccess, bypassPayment = false }) {
  const [method, setMethod] = useState('abawi-pay')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paydunyaReady, setPaydunyaReady] = useState(false)

  useEffect(() => {
    isPaydunyaConfigured().then(setPaydunyaReady)
  }, [])

  if (!product) return null

  const wa = waLink(product.titre, product.prix)

  async function handlePay() {
    const productType = product.type || 'guide'
    trackEvent('checkout_start', {
      method,
      productType,
      productId: product.id,
      amount: product.prix,
    })

    if (bypassPayment) {
      onSuccess?.()
      onClose?.()
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await createInvoice({
        title: product.titre,
        amount: product.prix,
        method,
        productId: product.id,
        productType,
        billingType: product.billing_type || null,
        returnUrl: `${window.location.origin}/merci?product=${product.id}&type=${productType}${product.pack_type ? '&pack_type='+product.pack_type : ''}${product.pack_name ? '&pack_name='+encodeURIComponent(product.pack_name) : ''}${product.product_ids ? '&product_ids='+encodeURIComponent(JSON.stringify(product.product_ids)) : ''}`,
        cancelUrl: window.location.href,
      })
      if (result?.url) {
        trackEvent('checkout_redirect', { method, productType, productId: product.id })
        window.location.href = result.url
      } else {
        throw new Error('Lien de paiement non reçu')
      }
    } catch (e) {
      trackEvent('checkout_error', {
        method,
        productType,
        productId: product.id,
        message: (e.message || 'unknown').slice(0, 80),
      })
      captureError(e, { scope: 'PaymentFlow.handlePay', method, productId: product.id })
      if (e.message === 'PAYDUNYA_NOT_CONFIGURED') {
        setError('Paiement en ligne indisponible pour le moment. Commandez via WhatsApp ci-dessous.')
      } else if (/masterkey/i.test(e.message || '')) {
        setError('Configuration PayDunya invalide (Master Key). Utilisez WhatsApp pendant la correction.')
      } else if (e.message?.includes('connexion') || e.message?.includes('internet')) {
        setError('Connexion impossible. Vérifiez votre réseau et réessayez, ou commandez via WhatsApp.')
      } else if (e.message?.includes('Clé') || e.message?.includes('Token') || e.message?.includes('invalide')) {
        setError('Problème de configuration paiement. Utilisez WhatsApp pour commander.')
      } else {
        setError(e.message || 'Une erreur est survenue. Commandez via WhatsApp ci-dessous.')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483647,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: '#0D1117',
        border: '1px solid #1A2332',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '460px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
      }} onClick={e => e.stopPropagation()}>

        {/* Fermer */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.06)', border: 'none',
          borderRadius: '8px', width: '32px', height: '32px',
          color: '#8B95A5', cursor: 'pointer', fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <style>{`@keyframes abawiBadgeSpin { to { transform: rotate(360deg); } }`}</style>
              <div style={{
                position: 'absolute', inset: -2, borderRadius: '50%',
                background: 'conic-gradient(from 0deg,#18A84A 0deg,#F0B429 120deg,#6366F1 240deg,#18A84A 360deg)',
                animation: 'abawiBadgeSpin 5s linear infinite',
                filter: 'blur(0.8px)',
              }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
                <img src="/favicon-abawi-64.webp" alt="ABAWI" style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  transform: 'scale(1.30)',
                }} />
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: '#F0B429',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px',
          }}>COMMANDE ABAWI</div>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, color: '#F0F2F5',
            marginBottom: '10px', lineHeight: 1.3, margin: '0 0 10px',
          }}>{product.titre}</h3>
          <div style={{
            fontSize: '2.2rem', fontWeight: 900,
            background: 'linear-gradient(135deg, #F0B429, #e5a820)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {formatPrixLocal(product.prix)}
          </div>
        </div>

        {/* PAYDUNYA EN PREMIER */}
        {/* Méthodes de paiement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{
              padding: '14px 12px', borderRadius: '12px',
              border: `2px solid ${method === m.id ? m.color : '#1A2332'}`,
              background: method === m.id ? m.color + '12' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '10px',
              textAlign: 'left',
            }}>
              {m.svg}
              <div>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 700,
                  color: method === m.id ? m.color : '#F0F2F5',
                }}>{m.label}</div>
                <div style={{ fontSize: '0.68rem', color: '#8B95A5' }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444', fontSize: '0.82rem', lineHeight: 1.5,
          }}>{error}</div>
        )}
        {!paydunyaReady && !error && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', marginBottom: '14px',
            background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.22)',
            color: '#F0B429', fontSize: '0.78rem', lineHeight: 1.5,
          }}>
            Paiement mobile temporairement indisponible. Commande WhatsApp recommandée.
          </div>
        )}

        {/* Bouton payer PayDunya */}
        <button onClick={handlePay} disabled={loading} style={{
          width: '100%', padding: '16px', borderRadius: '14px',
          background: loading ? '#1A2332' : `linear-gradient(135deg, ${METHODS.find(m2 => m2.id === method)?.color || '#F0B429'}, ${METHODS.find(m2 => m2.id === method)?.color || '#e5a820'}cc)`,
          border: 'none',
          color: loading ? '#8B95A5' : '#fff',
          fontWeight: 800, fontSize: '1.05rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', marginBottom: '20px',
          boxShadow: loading ? 'none' : '0 6px 20px rgba(0,0,0,0.3)',
          fontFamily: 'Outfit, sans-serif',
        }}>
          {loading ? '⏳ Traitement en cours...' : `Payer ${formatPrixLocal(product.prix)}`}
        </button>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* WhatsApp EN SECONDAIRE */}
        <a href={wa} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '12px', borderRadius: '12px',
          background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.3)',
          color: '#25D366', fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', marginBottom: '16px',
        }}>
          <svg width="18" height="18" fill="#25D366" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Commander via WhatsApp
        </a>

        {/* Sécurité */}
        <div style={{
          textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          🔒 Paiement sécurisé · PayDunya · +221 77 518 50 50
        </div>
      </div>
    </div>
  )
}
