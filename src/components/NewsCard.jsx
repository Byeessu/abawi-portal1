import { Link } from 'react-router-dom';
import { slugify } from '../data/products';
import { makeIllustration, tagStyle } from '../lib/newsUtils';

export default function NewsCard({ article, featured = false }) {
  const ts = tagStyle(article.tag);
  const slug = slugify(article.ti);
  const visual = makeIllustration(article);
  const dateStr = article.dt || (article.created_at && new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })) || '';

  if (featured) {
    return (
      <Link to={`/news/${slug}`} className="news-featured-card" style={{ textDecoration: 'none' }}>
        <img src={visual} alt={article.ti} className="news-featured-img" loading="eager" decoding="async" />
        <div className="news-featured-overlay" />
        <div className="news-featured-body">
          <div className="news-featured-tag" style={{ background: ts.bg, color: ts.text }}>{article.tag || 'Actualité'}</div>
          <h2 className="news-featured-title">{article.ti}</h2>
          {article.su && <p className="news-featured-excerpt">{article.su}</p>}
          <div className="news-featured-meta">
            {dateStr && <span>{dateStr}</span>}
            {article.rt && <span>{article.rt} de lecture</span>}
            <span style={{ color: ts.bg, fontWeight: 800, marginLeft: 'auto' }}>Lire l article</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/news/${slug}`}
      className="news-card-elite"
      style={{ '--accent-tag': ts.bg }}
    >
      <div className="news-card-img-wrap">
        <img src={visual} alt={article.ti} width={320} height={180} loading="lazy" decoding="async" />
        <div className="news-card-img-gradient" />
        <div className="news-card-img-tag" style={{ background: ts.bg, color: ts.text }}>{article.tag || 'Actualité'}</div>
        {article.rt && <div className="news-card-img-rt">{article.rt} de lecture</div>}
      </div>

      <div className="news-card-body">
        <h3 className="news-card-title-elite">{article.ti}</h3>
        {article.su && <p className="news-card-excerpt-elite">{article.su}</p>}
        <div className="news-card-footer-elite">
          <span className="news-card-date-elite">{dateStr}</span>
          <span className="news-card-cta-elite" style={{ color: ts.bg }}>
            Lire
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
