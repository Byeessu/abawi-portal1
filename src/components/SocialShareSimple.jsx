import { useState } from 'react'

export default function SocialShareSimple({ titre, description, url, prix, type }) {
  const [copied, setCopied] = useState('')
  const shareUrl = url || window.location.href
  const shareText = `${type ? type + ' ABAWI' : 'ABAWI'} — ${titre}${prix ? '\n💰 ' + prix.toLocaleString('fr-FR') + ' FCFA' : ''}\n${description?.substring(0, 100) || ''}`
  const encoded = encodeURIComponent(shareText + '\n\n🔗 ' + shareUrl)
  const urlEnc = encodeURIComponent(shareUrl)

  const SOCIALS = [
    {
      id: 'whatsapp', label: 'WhatsApp', color: '#25D366',
      href: `https://wa.me/?text=${encoded}`,
      icon: '💬',
    },
    {
      id: 'facebook', label: 'Facebook', color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`,
      icon: 'f',
    },
    {
      id: 'linkedin', label: 'LinkedIn', color: '#0A66C2',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${urlEnc}`,
      icon: 'in',
    },
    {
      id: 'twitter', label: 'X', color: '#000000',
      href: `https://twitter.com/intent/tweet?text=${encoded}`,
      icon: 'X',
    },
    {
      id: 'copy', label: 'Copier', color: '#6B7280',
      onClick: () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied('copy')
        setTimeout(() => setCopied(''), 2000)
      },
      icon: '📋',
    },
  ]

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ color: '#8B95A5', fontSize: '0.8rem', fontWeight: 600 }}>Partager :</span>
        <div style={{ flex: 1, height: '1px', background: '#1A2332' }}/>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {SOCIALS.map(s => (
          <a key={s.id}
            href={s.onClick ? undefined : s.href}
            target={s.onClick ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={s.onClick}
            title={copied === s.id ? 'Copié !' : s.label}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: copied === s.id ? '#18A84A' : s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none',
              color: '#fff', fontSize: '0.85rem', fontWeight: 800,
              boxShadow: `0 2px 8px ${s.color}40`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          >
            {copied === s.id ? '✓' : s.icon}
          </a>
        ))}
      </div>
    </div>
  )
}
