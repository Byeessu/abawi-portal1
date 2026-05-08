import { Link } from 'react-router-dom';
import { useTilt } from '../hooks/useTilt';
import ToolIcon from './ToolIcon';

function formatP(n) {
  return n === 0 ? 'GRATUIT' : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function EliteCard({ tool }) {
  const tiltRef = useTilt({ max: 6, scale: 1.02, glare: true });
  return (
    <Link to={tool.path} ref={tiltRef} className="outils-elite-card">
      <div className="outils-elite-card__header">
        <span className="outils-elite-card__icon">
          <ToolIcon name={tool.iconKey} size={48} />
        </span>
        <span className="outils-elite-badge">ÉLITE</span>
      </div>
      <h3 className="outils-elite-card__title">{tool.title}</h3>
      <p className="outils-elite-card__desc">{tool.desc}</p>
      <div className="outils-elite-card__tags">
        {tool.tags.map(tag => (
          <span key={tag} className="outils-elite-tag">{tag}</span>
        ))}
      </div>
      <div className="outils-elite-card__footer">
        <span className="outils-elite-card__prix">{formatP(tool.prix)}</span>
        <span className="outils-elite-card__cta">Accéder →</span>
      </div>
    </Link>
  );
}
