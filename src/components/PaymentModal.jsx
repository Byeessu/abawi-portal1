import { useState } from 'react'
import { formatPrix, waLink } from '../data/products'
import { createInvoice } from '../config/paydunya'
import './PaymentModal.css'

function PaymentModal({ product, onClose, accentColor }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const color = accentColor || 'gold'

  if (!product) return null

  async function handlePay() {
    setLoading(true)
    setError(null)
    const result = await createInvoice(product)
    setLoading(false)

    if (result.success && result.url) {
      window.location.href = result.url
    } else {
      setError(result.error || 'Erreur lors de la creation de la facture. Essayez via WhatsApp.')
    }
  }

  return (
    <div className="pay-modal-overlay" onClick={onClose}>
      <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pay-modal-close" onClick={onClose}>&times;</button>

        <h3 className="pay-modal-title">{product.titre}</h3>
        <p className={`pay-modal-price pay-modal-price--${color}`}>{formatPrix(product.prix)}</p>

        {error && <p className="pay-modal-error">{error}</p>}

        <button
          className={`pay-modal-btn pay-modal-btn--${color}`}
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? 'Redirection...' : `Payer maintenant — ${formatPrix(product.prix)}`}
        </button>

        <a
          href={waLink(product.titre, product.prix)}
          target="_blank"
          rel="noopener noreferrer"
          className="pay-modal-wa"
        >
          Commander via WhatsApp
        </a>

        <p className="pay-modal-secure">Paiement securise par PayDunya — Wave, Orange Money, Carte bancaire</p>
      </div>
    </div>
  )
}

export default PaymentModal
