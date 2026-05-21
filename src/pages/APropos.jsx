import './APropos.css'
import { Link } from 'react-router-dom'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import SectionReveal from '../components/premium/SectionReveal'
import SEO from '../components/SEO'

const STATS = [
  { val: '150+',   label: 'Ressources premium' },
  { val: '35+',    label: 'Outils IA professionnels' },
  { val: '25+',    label: 'Pays représentés' },
  { val: '98%',    label: 'Taux de satisfaction' },
  { val: '20+',    label: 'Piliers de l\'écosystème' },
  { val: 'ABAWI+', label: 'Une famille qui grandit' },
]

const VALEURS = [
  { icon: '🎯', titre: 'Excellence', texte: 'Chaque guide, chaque vidéo, chaque outil IA est conçu avec un soin extrême du détail. Nous ne publions que ce que nous serions fiers de présenter à un investisseur.' },
  { icon: '🌍', titre: 'Ancrage africain', texte: 'Nos contenus sont adaptés au contexte sénégalais et africain : marché local, réglementations OHADA, opportunités du continent. Pas de copier-coller occidental.' },
  { icon: '⚡', titre: 'Accessibilité', texte: 'Démocratiser le savoir premium. Un entrepreneur de Ziguinchor doit avoir accès aux mêmes outils qu\'un cadre de Paris — à une fraction du prix.' },
  { icon: '🤖', titre: 'Innovation IA', texte: 'ABAWI IA est un expert senior universel (Big 4 + think tank) dans tous les domaines business, profession et études. Disponible 24h/24.' },
  { icon: '🤝', titre: 'Communauté', texte: 'ABAWI+, Abavie, Arkel Up Center — une famille qui se construit. Des entrepreneurs qui s\'entraident et avancent ensemble.' },
]

const QUOTES = [
  <>{'"Un jeune de Pikine qui lit le '}<Link to="/digital">guide Marketing Digital</Link>{' peut lancer son business sur WhatsApp en une semaine."'}</>,
  <>{'"Une étudiante de Thiès qui utilise nos '}<Link to="/academy">fascicules</Link>{' peut décrocher son Bac avec mention."'}</>,
  <>{'"Un entrepreneur de Saint-Louis qui utilise '}<Link to="/outils/abawi-ia">ABAWI IA</Link>{' obtient un business plan de niveau cabinet en 5 minutes."'}</>,
  <>{'"Une PME de Dakar qui adopte '}<Link to="/abawi360">ABAWI 360</Link>{' double sa visibilité en ligne en 3 mois."'}</>,
]

const ECOSYSTEM = [
  { name: 'ABAWI Digital', desc: 'Guides PDF + vidéos premium pour entrepreneurs. Marketing, business, tech, communication, emploi. 150+ ressources.', color: 'gold', link: '/digital', tag: 'Guides + Vidéos' },
  { name: 'ABAWI Academy', desc: 'Fascicules scolaires et universitaires. Du Bac aux études supérieures — programme officiel sénégalais.', color: 'green', link: '/academy', tag: 'Éducation' },
  { name: 'ABAWI IA', desc: 'Coach IA expert senior multilingue 🇫🇷 Français · 🇬🇧 English · 🇸🇳 Wolof. Recherche, Débat, Simulation, Annah, Quiz — 7 modes intelligents, disponibles 24h/24.', color: 'purple', link: '/outils/abawi-ia', tag: 'Intelligence Artificielle' },
  { name: 'Outils IA Pro', desc: '35+ outils : CV Pro, Business Plan Élite, Studio Design, Pitch Deck, Analyse Juridique, Finance, RH, Image Pro, Audio Studio, et bien plus.', color: 'gold', link: '/outils', tag: 'Productivité' },
  { name: 'ABAWI News', desc: 'Média économique digital. Sources vérifiées, couverture Sénégal et Afrique 24h/24 avec résumés audio.', color: 'green', link: '/news', tag: 'Actualités' },
  { name: 'Podcasts', desc: 'Analyses, interviews et décryptages pour entrepreneurs africains. Disponibles avec résumés audio intelligents.', color: 'purple', link: '/podcasts', tag: 'Audio' },
  { name: 'ABAWI+', desc: 'Abonnement complet. Accès illimité aux ressources, groupe WhatsApp privé, crédits mensuels, tarifs préférentiels.', color: 'gold', link: '/plans', tag: 'Abonnement' },
  { name: 'Abavie', desc: 'Plateforme à jour de santé et bien-être. Informations médicales fiables, annuaire santé exhaustif, pharmacies de garde, numéros d\'urgence et accompagnement santé pour le Sénégal.', color: 'green', link: '/abavie', tag: 'Santé' },
  { name: 'Arkel Up Center', desc: 'Centre de formation professionnelle. Cours en ligne, instructeurs qualifiés, certifications reconnues.', color: 'blue', link: '/arkel-up-center', tag: 'Formation' },
  { name: 'AbawiPay', desc: 'Solution de paiement intégrée. Transactions sécurisées, abonnements et gestion de crédits pour l\'écosystème.', color: 'gold', link: '/abawi-pay', tag: 'Fintech' },
  { name: 'ABAWI 360', desc: 'Suite tout-en-un. CRM, planification de projets, finance, juridique, RH — une tour de contrôle pour entrepreneurs.', color: 'green', link: '/abawi360', tag: 'Business Suite' },
  { name: 'Recrute-Moi SN', desc: 'Plateforme emploi & RH sénégalaise. Offres d\'emploi, recrutement assisté par IA, mise en relation employeur.', color: 'gold', link: '/recrute-moi-sn', tag: 'Emploi & RH' },
  { name: 'Espace Ouvrier', desc: 'Mise en relation artisans, techniciens et employeurs. Plombiers, électriciens, menuisiers — trouvez le bon profil.', color: 'blue', link: '/espace-ouvrier', tag: 'Travail & Artisanat' },
  { name: 'MaxAvis Elite', desc: 'Gestion de réputation et d\'avis en ligne. Collectez, analysez et valorisez les retours de vos clients.', color: 'green', link: '/maxavis', tag: 'Avis & Réputation' },
  { name: 'Tontine SN', desc: 'Tontine numérique et épargne solidaire. Gérez vos tours, suivez les contributions, automatisez les rappels.', color: 'green', link: '/tontine', tag: 'Finance Solidaire' },
  { name: 'SenTicket', desc: 'Billetterie événementielle au Sénégal. Créez, vendez et gérez vos billets pour concerts, conférences et formations.', color: 'blue', link: '/senticket', tag: 'Billetterie' },
  { name: 'AbZone', desc: "Espace communautaire ABAWI. Forum premium, partage de ressources, défis business et entraide entre membres actifs. Animé par Annah, la CM IA.", color: 'purple', link: '/outils/abzone', tag: 'Communauté' },
  { name: 'AbSpace GPS', desc: 'Intelligence territoriale en temps réel : boutiques, restaurants, santé, services, transports, opportunités business. Monde entier.', color: 'blue', link: '/outils/abspacegps', tag: 'GPS & Territoire' },
  { name: 'AutoRoute', desc: 'Planificateur de trajets et transport au Sénégal. Itinéraires, covoiturage et logistique pour professionnels.', color: 'gold', link: '/autoroute', tag: 'Transport' },
  { name: 'Store IT', desc: 'Matériel informatique au Sénégal. PCs, upgrades, maintenance et conseil personnalisé à Dakar.', color: 'blue', link: '/store', tag: 'Tech' },
  { name: 'Format Converter', desc: 'Convertisseur universel 100% local : images, audio, vidéo (ffmpeg.wasm), documents et données. Aucun upload serveur.', color: 'purple', link: '/outils/format-converter', tag: 'Conversion' },
]

function APropos() {
  return (
    <main className="ap-about">
      <SEO
        title="À Propos — ABAWI | Portail Business Afrique"
        description="Découvrez l'histoire, la vision et l'équipe ABAWI. Notre mission : démocratiser l'excellence business pour l'Afrique. Dakar, Sénégal."
        keywords="ABAWI, à propos, mission, équipe, Dakar, Sénégal, entrepreneuriat africain, excellence business"
        image="/abawi-og-banner.jpg"
      />

      {/* ── HERO ── */}
      <section className="ap-hero">
        <ParticlesBackground count={20} color="#F0B429" linkDistance={120} opacity={0.15} />
        <div className="ap-hero-inner">
          <div className="ap-hero-left">
            <span className="ap-hero-eyebrow">À propos d'ABAWI</span>
            <h1 className="ap-hero-title">
              L'<span className="text-gold">écosystème</span><br />
              qui <span className="text-green">transforme</span><br />
              l'Afrique.
            </h1>
            <p className="ap-hero-sub">
              Guides, IA, formation, santé, fintech et marketing — une plateforme complète conçue à Dakar pour les entrepreneurs et étudiants africains.
            </p>
            <div className="ap-hero-actions">
              <Link to="/outils" className="ap-hero-btn ap-hero-btn--gold">Explorer les outils →</Link>
              <Link to="/plans" className="ap-hero-btn ap-hero-btn--outline">Rejoindre ABAWI+</Link>
            </div>
          </div>
          <div className="ap-hero-stats">
            {STATS.map((s, i) => (
              <div key={i} className="ap-hero-stat">
                <span className="ap-hero-stat-val">{s.val}</span>
                <span className="ap-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION + VISION ── */}
      <SectionReveal as="section" className="ap-split" direction="up" distance={32}>
        <div className="ap-split-card ap-split-card--gold">
          <span className="ap-tag ap-tag--gold">Notre mission</span>
          <h2 className="ap-split-h2">Rendre le savoir stratégique accessible à tous</h2>
          <p className="ap-split-text">
            ABAWI démocratise l'accès au savoir stratégique pour les entrepreneurs et étudiants africains. Conçu au Sénégal, pour le Sénégal et l'Afrique entière — chaque contenu est adapté au contexte local : marché, réglementations OHADA, opportunités du continent.
          </p>
          <p className="ap-split-text" style={{ marginTop: 12 }}>
            Plus de <Link to="/digital"><strong>150 ressources premium</strong></Link>, <Link to="/outils"><strong>35+ outils IA professionnels</strong></Link> et un <Link to="/outils/abawi-ia"><strong>assistant IA expert senior</strong></Link> multi-domaines qui grandit chaque jour.
          </p>
        </div>
        <div className="ap-split-card ap-split-card--green">
          <span className="ap-tag ap-tag--green">Notre vision</span>
          <h2 className="ap-split-h2">Un continent qui entreprend, innove et s'émancipe</h2>
          <p className="ap-split-text">
            D'ici 2030, chaque entrepreneur africain aura accès aux mêmes outils stratégiques qu'un consultant international — sans payer le prix d'un cabinet Big 4.
          </p>
          <p className="ap-split-text" style={{ marginTop: 12 }}>
            Un Sénégal où les PME utilisent <Link to="/outils/abawi-ia">l'IA</Link> et les frameworks des multinationales. Une Afrique où <Link to="/academy">la formation</Link>, <Link to="/abavie">la santé</Link> et <Link to="/digital">le marketing</Link> sont accessibles depuis n'importe quel téléphone.
          </p>
        </div>
      </SectionReveal>

      {/* ── VALEURS ── */}
      <SectionReveal as="section" className="ap-section" direction="up" distance={32}>
        <div className="ap-section-head">
          <span className="ap-tag ap-tag--green">Nos valeurs</span>
          <h2 className="ap-section-h2">Ce qui nous guide chaque jour</h2>
        </div>
        <div className="ap-valeurs-grid">
          {VALEURS.map((v, i) => (
            <div key={i} className="ap-valeur-card">
              <span className="ap-valeur-icon">{v.icon}</span>
              <h3 className="ap-valeur-titre">{v.titre}</h3>
              <p className="ap-valeur-texte">{v.texte}</p>
            </div>
          ))}
        </div>
      </SectionReveal>

      {/* ── L'EFFET ABAWI ── */}
      <SectionReveal as="section" className="ap-section ap-section--dark" direction="up" distance={32}>
        <div className="ap-section-head">
          <span className="ap-tag ap-tag--gold">L'effet ABAWI</span>
          <h2 className="ap-section-h2">Des vies qui changent, des business qui décollent</h2>
        </div>
        <div className="ap-quotes-grid">
          {QUOTES.map((q, i) => (
            <blockquote key={i} className="ap-quote-card">
              <p className="ap-quote-text">{q}</p>
              <div className="ap-quote-bar" />
            </blockquote>
          ))}
        </div>
        <p className="ap-effet-footer">
          C'est ça, <strong className="text-green">l'effet ABAWI</strong> — concret, mesurable, africain.
        </p>
      </SectionReveal>

      {/* ── ÉCOSYSTÈME ── */}
      <SectionReveal as="section" className="ap-section" direction="up" distance={32}>
        <div className="ap-section-head">
          <span className="ap-tag ap-tag--green">Notre écosystème</span>
          <h2 className="ap-section-h2">22 piliers. Un seul objectif : votre réussite.</h2>
          <p className="ap-section-sub">Chaque pilier est un service indépendant, pensé pour répondre à un besoin précis des entrepreneurs et étudiants africains.</p>
        </div>
        <div className="ap-brands-grid">
          {ECOSYSTEM.map((b) => (
            <Link key={b.name} to={b.link} className={`ap-brand ap-brand--${b.color}`}>
              <span className="ap-brand-tag">{b.tag}</span>
              <h3 className="ap-brand-name">{b.name}</h3>
              <p className="ap-brand-desc">{b.desc}</p>
              <span className="ap-brand-arrow">→</span>
            </Link>
          ))}
        </div>
      </SectionReveal>

      {/* ── CONTACT ── */}
      <SectionReveal as="section" className="ap-section ap-section--last" direction="up" distance={32}>
        <div className="ap-section-head">
          <h2 className="ap-section-h2">Nous contacter</h2>
        </div>
        <div className="ap-contact-grid">
          <div className="ap-contact-card">
            <span className="ap-contact-icon">📍</span>
            <strong>Adresse</strong>
            <span>VDN Liberté 6 Extension, Dakar, Sénégal</span>
          </div>
          <div className="ap-contact-card">
            <span className="ap-contact-icon">💬</span>
            <strong>WhatsApp</strong>
            <a href="https://wa.me/221775185050" target="_blank" rel="noopener noreferrer">+221 77 518 50 50</a>
          </div>
          <div className="ap-contact-card">
            <span className="ap-contact-icon">✉️</span>
            <strong>Email</strong>
            <a href="mailto:contact@abawi.sn">contact@abawi.sn</a>
          </div>
        </div>
      </SectionReveal>

    </main>
  )
}

export default APropos
