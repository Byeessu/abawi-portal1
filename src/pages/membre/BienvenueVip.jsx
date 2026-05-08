import { useAuth } from '../../context/AuthContext'
import './BienvenueVip.css'
import BienvenuePlayer from '../../components/BienvenuePlayer'
import { Link } from 'react-router-dom'

function BienvenueVip() {
  const { membre } = useAuth()
  const prenom = membre?.prenom || 'Membre'

  return (
    <main className="bv-page">
      <div className="bv-confetti" />
      <div className="bv-card">
        <div className="bv-badge-anim">ABAWI+ VIP</div>
        <h1 className="bv-title">Bienvenue dans ABAWI+, {prenom} !</h1>
        <p className="bv-text">Votre accès est activé. Explorez tout le catalogue : guides, fascicules, podcasts et templates.</p>
        <p className="bv-email">Un email de confirmation a été envoyé à {membre?.email || 'votre adresse'}.</p>

        <div style={{ margin: '24px 0' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 12 }}>🎧 Votre cadeau de bienvenue</p>
          <BienvenuePlayer autoPlay compact />
        </div>

        <div className="bv-btns">
          <Link to="/membre" className="bv-btn bv-btn--gold">Accéder à mon espace membre</Link>
          <a href="https://wa.me/221775185050?text=Acces%20groupe%20WhatsApp%20VIP" target="_blank" rel="noopener noreferrer" className="bv-btn bv-btn--green">
            Rejoindre le groupe WhatsApp VIP
          </a>
        </div>
      </div>
    </main>
  )
}

export default BienvenueVip
