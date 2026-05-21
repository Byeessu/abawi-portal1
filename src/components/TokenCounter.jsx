import { useAuth } from '../context/AuthContext'
import { useTokenBalance } from '../hooks/useTokenBalance'
import './TokenCounter.css'

export default function TokenCounter({ className = '' }) {
  const { membre, isAdmin } = useAuth()
  const { total, tokens, credits, consumed, loading } = useTokenBalance(5000)

  if (!membre) return null
  if (isAdmin) {
    return (
      <div className={`token-counter token-counter--admin ${className}`}>
        <span className="token-counter__chip">🛡️ Admin illimité</span>
      </div>
    )
  }

  const tokensDisplay = total.toLocaleString('fr-FR')
  const consumedDisplay = consumed.toLocaleString('fr-FR')
  const creditTokens = credits * 1000

  return (
    <div className={`token-counter ${className}`}>
      <div className="token-counter__main">
        <span className="token-counter__icon">🔮</span>
        <div className="token-counter__values">
          <span className="token-counter__total">{tokensDisplay} <small>tokens</small></span>
          {loading && <span className="token-counter__sync">⟳</span>}
        </div>
        <div className="token-counter__detail">
          <span className="token-counter__tokens" title="Tokens directs">{tokens.toLocaleString('fr-FR')} tk</span>
          <span className="token-counter__sep">+</span>
          <span className="token-counter__credits" title={`${credits} crédits = ${creditTokens.toLocaleString('fr-FR')} tokens`}>{credits} cr</span>
        </div>
      </div>
      {consumed > 0 && (
        <div className="token-counter__consumed" title="Tokens consommés cette session / aujourd'hui">
          −{consumedDisplay} consommés
        </div>
      )}
    </div>
  )
}
