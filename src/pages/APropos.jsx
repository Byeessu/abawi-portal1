import './APropos.css'
import { Link } from 'react-router-dom'

const STATS = [
  { val: '70+', label: 'Guides & fascicules premium' },
  { val: '6',   label: 'Outils IA professionnels' },
  { val: '500+', label: 'Entrepreneurs accompagnés' },
  { val: 'ABAWI+', label: 'Une famille qui grandit' },
  { val: '🇸🇳', label: 'Conçu à Dakar pour l\'Afrique' },
]

const VALEURS = [
  { icon: '🎯', titre: 'Excellence', texte: 'Chaque guide, chaque fascicule, chaque outil est conçu avec un soin extrême du détail. Nous ne publions que ce que nous serions fiers de présenter à un investisseur ou d\'utiliser nous-mêmes.' },
  { icon: '🌍', titre: 'Ancrage africain', texte: 'Nos contenus sont adaptés au contexte sénégalais et africain : marché local, réglementations OHADA, opportunités du continent. Pas de copier-coller de concepts occidentaux.' },
  { icon: '⚡', titre: 'Accessibilité', texte: 'Démocratiser le savoir premium. Un entrepreneur de Ziguinchor doit avoir accès aux mêmes outils stratégiques qu\'un cadre de Paris ou New York — à une fraction du prix.' },
  { icon: '🤝', titre: 'Communauté', texte: 'ABAWI c\'est aussi une famille qui se construit. Des entrepreneurs qui s\'entraident, partagent leurs victoires et avancent ensemble — pas un réseau, une vraie relation.' },
]

const BRANDS = [
  { name: 'ABAWI Digital', desc: 'Guides premium pour entrepreneurs africains. Marketing, business, tech, communication, emploi. 70+ ressources actionnables.', color: 'gold', link: '/digital' },
  { name: 'ABAWI Academy', desc: 'Fascicules scolaires et universitaires. Du Bac aux études supérieures — programme officiel sénégalais avec corrigés détaillés.', color: 'green', link: '/academy' },
  { name: 'ABAWI News', desc: 'Média économique digital. Sources fiables et vérifiées, couverture Sénégal et Afrique, 24h/24.', color: 'green', link: '/news' },
  { name: 'Outils IA', desc: '6 outils IA professionnels : CV Pro, Lettre de motivation, Business Plan ABAWI Élite, Pitch Deck, Facture, Analyse CV.', color: 'gold', link: '/outils' },
  { name: 'ABAWI+', desc: 'Une famille d\'entrepreneurs qui se construit. Accès illimité aux guides, groupe WhatsApp privé, contenu exclusif.', color: 'green', link: '/plans' },
  { name: 'Store IT', desc: 'Matériel informatique au Sénégal. PCs, upgrades, maintenance et conseil personnalisé à Dakar.', color: 'blue', link: '/store' },
]

function APropos() {
  return (
    <main className="ap-about">
      {/* Hero */}
      <section className="ap-about-hero">
        <h1 className="ap-about-title">
          ABAWI — Le savoir qui <span className="text-green">transforme</span> l'<span className="text-gold">Afrique</span>
        </h1>
        <p className="ap-about-subtitle">
          Démocratiser l'accès au savoir stratégique pour les entrepreneurs et étudiants africains.
        </p>
      </section>

      {/* Mission */}
      <section className="ap-about-section">
        <div className="ap-about-section-tag">Notre mission</div>
        <h2 className="ap-about-h2">Rendre le savoir stratégique accessible à tous</h2>
        <p className="ap-about-text">
          ABAWI démocratise l'accès au savoir stratégique pour les entrepreneurs et étudiants africains.
          Nos guides, fascicules et outils IA sont conçus au Sénégal, pour le Sénégal et l'Afrique entière.
          Chaque contenu est adapté au contexte local : marché, réglementations, opportunités et défis
          spécifiques au continent. Plus de <strong>70 ressources premium</strong>, <strong>6 outils IA professionnels</strong>
          et une communauté <strong>ABAWI+</strong> — une famille d'entrepreneurs qui se construit ensemble.
        </p>
      </section>

      {/* Stats */}
      <section className="ap-about-section">
        <h2 className="ap-about-h2">ABAWI en chiffres</h2>
        <div className="ap-about-stats">
          {STATS.map((s, i) => (
            <div key={i} className="ap-about-stat">
              <span className="ap-about-stat-val">{s.val}</span>
              <span className="ap-about-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="ap-about-section">
        <div className="ap-about-section-tag">Notre vision</div>
        <h2 className="ap-about-h2">Un continent qui entreprend, innove et s'émancipe</h2>
        <p className="ap-about-text">
          D'ici 2030, nous voulons que chaque entrepreneur africain ait les mêmes outils stratégiques
          qu'un consultant de grandes capitales mondiales — sans payer le prix d'un cabinet international.
          Un Sénégal où les PME utilisent les mêmes frameworks d'analyse que les multinationales.
          Une Afrique de l'Ouest où la formation professionnelle est accessible dans n'importe quel quartier,
          depuis n'importe quel téléphone.
        </p>
      </section>

      {/* Valeurs */}
      <section className="ap-about-section">
        <div className="ap-about-section-tag">Nos valeurs</div>
        <h2 className="ap-about-h2">Ce qui nous guide chaque jour</h2>
        <div className="ap-about-valeurs">
          {VALEURS.map((v, i) => (
            <div key={i} className="ap-about-valeur">
              <span className="ap-about-valeur-icon">{v.icon}</span>
              <div>
                <h3 className="ap-about-valeur-titre">{v.titre}</h3>
                <p className="ap-about-valeur-texte">{v.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* L'effet ABAWI */}
      <section className="ap-about-section ap-about-effet">
        <div className="ap-about-section-tag">L'effet ABAWI</div>
        <h2 className="ap-about-h2">Des vies qui changent, des business qui décollent</h2>
        <div className="ap-about-effet-cards">
          <div className="ap-about-effet-card">
            <p className="ap-about-effet-quote">"Un jeune de Pikine qui lit le guide Marketing Digital peut lancer son business sur WhatsApp en une semaine."</p>
          </div>
          <div className="ap-about-effet-card">
            <p className="ap-about-effet-quote">"Une étudiante de Thiès qui utilise nos fascicules peut décrocher son Bac avec mention."</p>
          </div>
          <div className="ap-about-effet-card">
            <p className="ap-about-effet-quote">"Un entrepreneur de Saint-Louis qui utilise nos outils IA peut créer son business plan en 5 minutes."</p>
          </div>
        </div>
        <p className="ap-about-text" style={{ marginTop: 24, textAlign: 'center' }}>
          C'est ça, <strong style={{ color: 'var(--green)' }}>l'effet ABAWI</strong> — concret, mesurable, africain.
        </p>
      </section>

      {/* Produits */}
      <section className="ap-about-section">
        <h2 className="ap-about-h2">Nos produits & services</h2>
        <div className="ap-about-brands">
          {BRANDS.map((b) => (
            <Link key={b.name} to={b.link} className={`ap-about-brand ap-about-brand--${b.color}`}>
              <h3>{b.name}</h3>
              <p>{b.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="ap-about-section">
        <h2 className="ap-about-h2">Contact</h2>
        <div className="ap-about-contact">
          <div className="ap-about-contact-item">
            <strong>Adresse</strong><br />VDN Liberté 6 Extension, Dakar, Sénégal
          </div>
          <div className="ap-about-contact-item">
            <strong>WhatsApp</strong><br />
            <a href="https://wa.me/221775185050" target="_blank" rel="noopener noreferrer">+221 77 518 50 50</a>
          </div>
          <div className="ap-about-contact-item">
            <strong>Email</strong><br />
            <a href="mailto:contact@abawi.sn">contact@abawi.sn</a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default APropos
