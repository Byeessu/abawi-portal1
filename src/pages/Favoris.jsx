import { useFav } from '../context/FavContext'
import { guides, allFascicules, podcasts, slugify, formatPrix } from '../data/products'
import { Link } from 'react-router-dom'
import { CoverImage } from '../components/CoverImage'

function Favoris() {
  const { favs, toggle } = useFav()
  const all = [
    ...guides.filter((g) => favs.includes(g.id)).map((g) => ({ ...g, type: 'guide', link: `/digital/${slugify(g.titre)}` })),
    ...allFascicules.filter((f) => favs.includes(f.id)).map((f) => ({ ...f, type: 'fasc', link: `/academy/${slugify(f.titre)}` })),
    ...podcasts.filter((p) => favs.includes(p.id)).map((p) => ({ ...p, type: 'pod', link: `/podcasts/${slugify(p.titre)}` })),
  ]

  return (
    <main style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Mes favoris</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{all.length} produit{all.length !== 1 ? 's' : ''} sauvegarde{all.length !== 1 ? 's' : ''}</p>

      {all.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>Aucun favori pour le moment. Cliquez sur ♡ pour sauvegarder un produit.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {all.map((item) => (
          <div key={item.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <Link to={item.link}>
              <CoverImage titre={item.titre} categorie={item.categorie || item.matiere || item.serie} type={item.type === 'pod' ? 'audio' : 'guide'} brand={item.type === 'fasc' ? 'academy' : item.type === 'pod' ? 'podcast' : 'digital'} size="md" />
            </Link>
            <div style={{ padding: 16 }}>
              <Link to={item.link} style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>{item.titre}</Link>
              {item.prix && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--gold)' }}>{formatPrix(item.prix)}</span>}
              <button onClick={() => toggle(item.id)} style={{ display: 'block', marginTop: 8, padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                Retirer des favoris
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default Favoris
