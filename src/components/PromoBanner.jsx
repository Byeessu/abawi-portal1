import { useState } from 'react'
import './PromoBanner.css'
import { Link } from 'react-router-dom'

const ITEMS = [
  { text: '🔥 PACK PREMIUM -63% → 24 900 F', link: '/digital/pack/pack-premium' },
  { text: '📚 Fascicules Bac disponibles', link: '/academy' },
  { text: '💎 ABAWI+ : Accès illimité à 4 900 F/mois', link: '/plans' },
  { text: '💳 Abawi Pay — 0% de frais entre comptes Abawi', link: '/abawi-pay' },
  { text: '🌍 Transferts internationaux dès 0,7% — le plus bas d\'Afrique de l\'Ouest', link: '/abawi-pay' },
  { text: '⬛ QR dynamique chiffré AES-256 — Renouvellement toutes les 5 min', link: '/abawi-pay' },
  { text: '🔄 Interopérable Wave · Orange Money · Free Money · Expresso · USSD *888#', link: '/abawi-pay' },
  { text: '💎 Carte physique Abawi Pay — Standard · Gold · Premium', link: '/abawi-pay' },
  { text: '📞 WhatsApp : 77 518 50 50', link: 'https://wa.me/221775185050' },
]

const FULL = ITEMS.map((i) => i.text).join('  |  ')

function PromoBanner() {
  const [visible, setVisible] = useState(() => sessionStorage.getItem('abawi-promo-closed') !== '1')
  if (!visible) return null

  return (
    <div className="promo-ticker">
      <div className="promo-ticker-track">
        {[0, 1].map((dup) => (
          <span key={dup} className="promo-ticker-text">
            {ITEMS.map((item, i) => (
              <span key={`${dup}-${i}`}>
                {item.link.startsWith('http') ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="promo-ticker-link">{item.text}</a>
                ) : (
                  <Link to={item.link} className="promo-ticker-link">{item.text}</Link>
                )}
                {i < ITEMS.length - 1 && <span className="promo-ticker-sep">  |  </span>}
              </span>
            ))}
            <span className="promo-ticker-sep">    </span>
          </span>
        ))}
      </div>
      <button className="promo-ticker-close" onClick={() => { setVisible(false); sessionStorage.setItem('abawi-promo-closed', '1') }}>&times;</button>
    </div>
  )
}

export default PromoBanner
