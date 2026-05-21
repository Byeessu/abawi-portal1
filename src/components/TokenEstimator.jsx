import { useMemo } from 'react'
import { estimateTokens, TOKENS_PER_CREDIT } from '../lib/credits'

export default function TokenEstimator({ text = '', baseCost = 0, label = 'Estimation' }) {
  const tokens = useMemo(() => estimateTokens(text, baseCost), [text, baseCost])
  const credits = useMemo(() => Math.ceil(tokens / TOKENS_PER_CREDIT), [tokens])

  return (
    <div className="token-estimator">
      <span className="token-estimator__label">{label}</span>
      <span className="token-estimator__value">≈ {tokens.toLocaleString('fr-FR')} tk</span>
      <span className="token-estimator__eq">({credits} crédit{credits > 1 ? 's' : ''})</span>
    </div>
  )
}
