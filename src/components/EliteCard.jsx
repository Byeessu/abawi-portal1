import { Link } from 'react-router-dom'
import { useTilt } from '../hooks/useTilt'
import ToolIcon from './ToolIcon'
import { CREDIT_COSTS_DISPLAY, TOOL_ACCENT } from '../data/tools'

function fmtFCFA(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

export default function EliteCard({ tool }) {
  const tiltRef = useTilt({ max: 6, scale: 1.02, glare: true })
  const credits = tool.creditKey ? CREDIT_COSTS_DISPLAY[tool.creditKey] : null
  const isFree = !tool.prix || tool.access === 'public'
  const [t1, t2] = TOOL_ACCENT[tool.id] ?? ['#334155', '#475569']

  let badgeText = ''
  let badgeAlt = ''
  if (isFree && !tool.quota) {
    badgeText = 'GRATUIT'
  } else if (tool.quota) {
    badgeText = `${tool.quota.anonymous} gratuites/jour`
    badgeAlt = `compte = ${tool.quota.member}`
  } else if (credits) {
    badgeText = `${credits} crédits`
    badgeAlt = tool.access === 'outils-elite' ? 'ABA WI+' : 'à la demande'
  } else {
    badgeText = fmtFCFA(tool.prix)
  }

  return (
    <Link to={tool.path} ref={tiltRef} className="outils-elite-card" style={{ '--t1': t1, '--t2': t2 }}>
      <div className="outils-elite-card__hd">
        <span className="outils-elite-card__icon">
          <ToolIcon name={tool.iconKey} size={40} />
        </span>
        <div className="outils-elite-card__hd-text">
          <h3 className="outils-elite-card__title">{tool.title}</h3>
          <span className="outils-elite-badge">ÉLITE</span>
        </div>
      </div>
      <div className="outils-elite-card__body">
        <p className="outils-elite-card__desc">{tool.desc}</p>
        {tool.tags && (
          <div className="outils-elite-card__tags">
            {tool.tags.map(tag => (
              <span key={tag} className="outils-elite-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="outils-elite-card__footer">
          {isFree && !tool.quota ? (
            <span className="outils-elite-card__prix outils-elite-card__prix--free">{badgeText}</span>
          ) : (
            <span className="outils-elite-prix-wrap">
              <span className="outils-elite-credits">{badgeText}</span>
              {badgeAlt && <span className="outils-elite-prix-alt">{badgeAlt}</span>}
            </span>
          )}
          <span className="outils-elite-card__cta">Accéder →</span>
        </div>
      </div>
    </Link>
  )
}
