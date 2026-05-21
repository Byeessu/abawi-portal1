import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { SEED_COURSES } from '../../data/arkelCourses'
import SEO from '../SEO'
import ArkelUpLogo from '../icons/ArkelUpLogo'

/* ─── LocalStorage helpers ─── */
const K = {
  courses: 'arkel_courses_v1',
  programs: 'arkel_programs_v1',
  students: 'arkel_students_v1',
  instructors: 'arkel_instructors_v1',
  spaces: 'arkel_spaces_v1',
  bookings: 'arkel_bookings_v1',
  regs: 'arkel_regs_v1',
  preregs: 'arkel_preregs_v1',
}
function ls(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
function ss(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }
function uid() { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}` }

/* ─── Seed data (subset for public view) ─── */
const SEED_PROGRAMS = [
  { id:'p1', title:'MBA Africa Executive', description:'Formation intensive de 6 mois pour cadres et dirigeants. Management, stratégie, finance, innovation et leadership africain.', duration:'6 mois', level:'Avancé', price:450000, enrolled:18, status:'active', courses:['c1','c5','c3','c6'], tags:['mba','executive','leadership'] },
  { id:'p2', title:'Certificat Développeur Full Stack', description:'Parcours complet de 3 mois, de débutant à développeur employable. HTML, JS, React, Node, bases de données, déploiement.', duration:'3 mois', level:'Tous niveaux', price:250000, enrolled:34, status:'active', courses:['c2','c7'], tags:['dev','web','tech'] },
  { id:'p3', title:'Programme Entrepreneuriat Jeunes 18-30', description:'2 mois pour transformer votre idée en entreprise. Business model, financement, marketing digital, coworking inclus.', duration:'2 mois', level:'Débutant', price:149000, enrolled:56, status:'active', courses:['c1','c4'], tags:['entrepreneuriat','jeunes','startup'] },
  { id:'p4', title:'Bootcamp Data & IA', description:'Immersion intensive 6 semaines en data science et intelligence artificielle. Python, pandas, ML, déploiement de modèles.', duration:'6 semaines', level:'Intermédiaire', price:199000, enrolled:22, status:'coming', courses:['c7'], tags:['data','ia','bootcamp'] },
]

const SEED_INSTRUCTORS = [
  { id:'f1', name:'Dr. Aminata Diallo', email:'a.diallo@arkelup.sn', phone:'+221 77 345 67 89', bio:'PhD Management, HEC Paris. Ex-directrice CTIC Dakar. 15 ans d\'expérience en accompagnement startup, leadership et RH.', expertise:['Entrepreneuriat','Leadership','RH'], courses:['c1','c5','c16'], rating:4.9, students:119, status:'active' },
  { id:'f2', name:'Ibrahima Sow', email:'i.sow@arkelup.sn', phone:'+221 77 234 56 78', bio:'Ingénieur logiciel, ex-Google Berlin. Fondateur de 2 startups tech. Passionné par l\'enseignement de la tech en Afrique.', expertise:['Développement Web','IA/ML','React'], courses:['c2','c7'], rating:4.9, students:191, status:'active' },
  { id:'f3', name:'Fatou Ndiaye', email:'f.ndiaye@arkelup.sn', phone:'+221 77 456 78 90', bio:'Expert-comptable SYSCOHADA, DEC. Fondatrice d\'un cabinet comptable à Dakar. Formatrice agréée OHADA.', expertise:['Comptabilité','SYSCOHADA','TVA'], courses:['c3'], rating:4.6, students:52, status:'active' },
  { id:'f4', name:'Mariama Ba', email:'m.ba@arkelup.sn', phone:'+221 77 567 89 01', bio:'CMO d\'une agence digitale top 3 Dakar. Certifiée Google Ads & Meta Business. Spécialiste croissance e-commerce et content Afrique.', expertise:['Marketing Digital','Community Mgt','Social Ads'], courses:['c4','c11'], rating:4.7, students:193, status:'active' },
  { id:'f5', name:'Mamadou Touré', email:'m.toure@arkelup.sn', phone:'+221 77 678 90 12', bio:'Banquier d\'affaires, ex-Ecobank Capital Markets. MBA Finance, Columbia University. Accompagne 50+ PME en levée de fonds et logistique internationale.', expertise:['Finance','Logistique','Supply Chain'], courses:['c6','c15'], rating:4.7, students:35, status:'active' },
]

function computeStats() {
  const published = SEED_COURSES.filter(c => c.status === 'published')
  const totalEnrolled = published.reduce((s, c) => s + (c.enrolled || 0), 0)
  const instructors = new Set(published.map(c => c.instructorId))
  return [
    [`${totalEnrolled}+`, 'Apprenants', '🎓'],
    [`${published.length}`, 'Cours certifiants', '📚'],
    [`${instructors.size}+`, 'Formateurs experts', '👨‍🏫'],
    ['7', 'Pays africains', '🌍'],
    ['7', 'Espaces coworking', '🏢'],
    ['98%', 'Taux de satisfaction', '⭐'],
  ]
}

const CAT_COLORS = {
  Business: '#8B5CF6', Tech: '#3B82F6', Finance: '#10B981', Marketing: '#F59E0B',
  Management: '#EC4899', Juridique: '#15803d', Santé: '#EF4444', RH: '#14B8A6',
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  IMMERSIVE ARKEL LANDING — Ocean, Giant Arch, Starry Sky Theme            */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ArkelLandingImmersive() {
  const { membre } = useAuth()
  const [activeTab, setActiveTab] = useState('hero')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showPreReg, setShowPreReg] = useState(false)
  const [showBusinessPlan, setShowBusinessPlan] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const courses = ls(K.courses, SEED_COURSES)
  const instructors = ls(K.instructors, SEED_INSTRUCTORS)
  const programs = ls(K.programs, SEED_PROGRAMS)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setActiveTab(id)
  }

  const openCourse = (c) => {
    setSelectedCourse(c)
    setShowCourseModal(true)
  }

  return (
    <div className="arkel-immersive">
      <SEO
        title="Arkel Up Center — Votre Arche de Développement"
        description="Formation professionnelle, coworking premium, support startup et innovation IA. Arkel Up Center by ABAWI — Dakar, Sénégal."
        keywords="formation Dakar, coworking Sénégal, startup, innovation, IA, Arkel Up Center"
        image="/og/arkel-up-center.webp"
      />
      <style dangerouslySetInnerHTML={{ __html: IMMERSIVE_CSS }} />

      {/* ═══ FLOATING NAV ═══ */}
      <nav className={`arkel-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="arkel-nav-inner">
          <div className="arkel-nav-logo" onClick={() => scrollTo('hero')}>
            <ArkelUpLogo variant="full" size={28} light />
          </div>
          <div className="arkel-nav-links">
            {[
              { id: 'programs', label: 'Programmes' },
              { id: 'courses', label: 'Cours' },
              { id: 'instructors', label: 'Formateurs' },
              { id: 'business-plan', label: 'Business Plan' },
              { id: 'coworking', label: 'Coworking' },
              { id: 'contact', label: 'Contact' },
            ].map(l => (
              <button key={l.id} className={activeTab === l.id ? 'active' : ''} onClick={() => scrollTo(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="arkel-nav-cta">
            <button className="arkel-nav-btn-secondary" onClick={() => setShowBusinessPlan(true)}>
              📊 Business Plan
            </button>
            <button className="arkel-nav-btn-primary" onClick={() => setShowPreReg(true)}>
              🚀 Pré-inscription
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION — Ocean + Arch + Starry Sky ═══ */}
      <section id="hero" className="arkel-hero">
        {/* Animated ocean background layers */}
        <div className="arkel-ocean-bg">
          <div className="arkel-stars" />
          <div className="arkel-moon" />
          <div className="arkel-arch" />
          <div className="arkel-ocean-waves">
            <div className="wave w1" />
            <div className="wave w2" />
            <div className="wave w3" />
          </div>
          <div className="arkel-particles" />
        </div>

        <div className="arkel-hero-content">
          <div className="arkel-hero-badge">
            <span className="arkel-dot" />
            <span>Ouverture prévue · Dakar, Sénégal</span>
          </div>

          <div className="arkel-hero-logo-wrap">
            <ArkelUpLogo variant="stack" size={72} light />
          </div>

          <h1 className="arkel-hero-title">
            Votre <span className="arkel-gradient-text">Arche</span> de Développement
          </h1>
          <p className="arkel-hero-subtitle">
            Formation · Innovation · Coworking
          </p>
          <p className="arkel-hero-desc">
            Arkel Up Center est le pont entre vos ambitions et votre réussite.
            Formations certifiantes, espaces de travail premium et accompagnement startup
            au cœur de Dakar.
          </p>

          <div className="arkel-hero-actions">
            <button className="arkel-btn-glow" onClick={() => setShowPreReg(true)}>
              🚀 Rejoindre la liste d'attente
            </button>
            <button className="arkel-btn-ghost" onClick={() => scrollTo('programs')}>
              📚 Explorer les programmes
            </button>
          </div>

          {/* Stats */}
          <div className="arkel-hero-stats">
            {computeStats().map(([n, l, i]) => (
              <div key={l} className="arkel-stat-card">
                <span className="arkel-stat-icon">{i}</span>
                <span className="arkel-stat-n">{n}</span>
                <span className="arkel-stat-l">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="arkel-scroll-indicator" onClick={() => scrollTo('programs')}>
          <div className="arkel-mouse">
            <div className="arkel-wheel" />
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ═══ PROGRAMS SECTION ═══ */}
      <section id="programs" className="arkel-section">
        <div className="arkel-section-header">
          <span className="arkel-section-tag">Nos parcours</span>
          <h2>Programmes certifiants</h2>
          <p>Des parcours complets conçus pour vous mener de l'apprentissage à l'emploi.</p>
        </div>
        <div className="arkel-programs-grid">
          {programs.map(p => (
            <div key={p.id} className="arkel-program-card">
              <div className="arkel-program-hdr">
                <div className="arkel-program-tags">
                  {p.tags.map(t => <span key={t} className="arkel-tag">#{t}</span>)}
                  {p.status === 'coming' && <span className="arkel-tag coming">Bientôt</span>}
                </div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
              <div className="arkel-program-body">
                <div className="arkel-program-meta">
                  <span>⏱ {p.duration}</span>
                  <span>📊 {p.level}</span>
                  <span>🎓 {p.enrolled} inscrits</span>
                </div>
                <div className="arkel-program-footer">
                  <span className="arkel-program-price">{(p.price/1000).toFixed(0)}K FCFA</span>
                  <button className="arkel-btn-sm" onClick={() => setShowPreReg(true)}>
                    S'inscrire →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COURSES SECTION — Interactive Explorer ═══ */}
      <section id="courses" className="arkel-section ark-courses">
        <div className="arkel-section-header">
          <span className="arkel-section-tag">Catalogue</span>
          <h2>Explorez nos cours</h2>
          <p>30 cours interactifs dans 8 domaines d'excellence. Cliquez sur un cours pour voir le programme détaillé.</p>
        </div>
        <CoursesExplorer courses={courses} onOpenCourse={openCourse} />
      </section>

      {/* ═══ INSTRUCTORS SECTION ═══ */}
      <section id="instructors" className="arkel-section">
        <div className="arkel-section-header">
          <span className="arkel-section-tag">Notre équipe</span>
          <h2>Formateurs experts</h2>
          <p>Des professionnels reconnus, passionnés par le transfert de compétences.</p>
        </div>
        <div className="arkel-instructors-grid">
          {instructors.slice(0, 6).map(f => (
            <div key={f.id} className="arkel-instructor-card">
              <div className="arkel-instructor-avatar">
                {f.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h4>{f.name}</h4>
              <p className="arkel-instructor-bio">{f.bio.slice(0, 120)}…</p>
              <div className="arkel-instructor-expertise">
                {f.expertise.map(e => <span key={e}>{e}</span>)}
              </div>
              <div className="arkel-instructor-stats">
                <span>⭐ {f.rating}</span>
                <span>🎓 {f.students} élèves</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BUSINESS PLAN SECTION ═══ */}
      <section id="business-plan" className="arkel-section ark-bp">
        <div className="arkel-section-header">
          <span className="arkel-section-tag">Mode Business Plan</span>
          <h2>Votre projet, notre arche</h2>
          <p>Construisez votre business plan interactif étape par étape avec nos outils et templates.</p>
        </div>
        <BusinessPlanTeaser onOpen={() => setShowBusinessPlan(true)} />
      </section>

      {/* ═══ COWORKING SECTION ═══ */}
      <section id="coworking" className="arkel-section">
        <div className="arkel-section-header">
          <span className="arkel-section-tag">Espaces</span>
          <h2>Coworking Premium</h2>
          <p>Bureaux privés, salles de réunion, studio podcast et open space créatif à Dakar.</p>
        </div>
        <CoworkingPreview />
      </section>

      {/* ═══ PRE-REGISTRATION / CONTACT ═══ */}
      <section id="contact" className="arkel-section ark-contact">
        <div className="arkel-contact-card">
          <div className="arkel-contact-left">
            <h2>Prêt à embarquer ?</h2>
            <p>
              Rejoignez <strong>{(ls(K.preregs, []).length + 47)} personnes</strong> déjà préinscrites.
              Accès prioritaire à l'ouverture et tarif préférentiel.
            </p>
            <ul className="arkel-contact-benefits">
              <li>✅ Accès prioritaire aux cours</li>
              <li>✅ Tarif préférentiel de lancement (-30%)</li>
              <li>✅ 1 mois de coworking offert</li>
              <li>✅ Mentorat personnalisé inclus</li>
            </ul>
            <button className="arkel-btn-glow" onClick={() => setShowPreReg(true)}>
              🚀 Je m'inscris gratuitement
            </button>
          </div>
          <div className="arkel-contact-right">
            <div className="arkel-contact-visual">
              <div className="arkel-contact-icon">🌊</div>
              <div className="arkel-contact-text">
                <span>Arkel Up Center</span>
                <span>Dakar, Sénégal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="arkel-footer">
        <div className="arkel-footer-inner">
          <div className="arkel-footer-brand">
            <ArkelUpLogo variant="full" size={24} light />
            <p>Votre Arche de Développement · Formation · Innovation · Coworking</p>
          </div>
          <div className="arkel-footer-links">
            <a onClick={() => scrollTo('programs')}>Programmes</a>
            <a onClick={() => scrollTo('courses')}>Cours</a>
            <a onClick={() => scrollTo('business-plan')}>Business Plan</a>
            <a onClick={() => scrollTo('coworking')}>Coworking</a>
            <a onClick={() => scrollTo('contact')}>Contact</a>
          </div>
          <p className="arkel-footer-copy">© 2025 Arkel Up Center by ABAWI. Tous droits réservés.</p>
        </div>
      </footer>

      {/* ═══ MODALS ═══ */}
      {showPreReg && <PreRegModal onClose={() => setShowPreReg(false)} />}
      {showBusinessPlan && <BusinessPlanModal onClose={() => setShowBusinessPlan(false)} />}
      {showCourseModal && selectedCourse && (
        <CourseDetailModal course={selectedCourse} onClose={() => setShowCourseModal(false)} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CoursesExplorer({ courses, onOpenCourse }) {
  const [filter, setFilter] = useState('')
  const [cat, setCat] = useState('')
  const cats = [...new Set(courses.map(c => c.category))]
  const filtered = courses.filter(c =>
    (!cat || c.category === cat) &&
    (!filter || c.title.toLowerCase().includes(filter.toLowerCase()) || c.instructor.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div className="ark-courses-explorer">
      <div className="ark-courses-toolbar">
        <input
          className="ark-courses-search"
          placeholder="🔍 Rechercher un cours, un formateur..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <div className="ark-courses-filters">
          <button className={!cat ? 'active' : ''} onClick={() => setCat('')}>Tous</button>
          {cats.map(c => (
            <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)} style={{ '--cat-color': CAT_COLORS[c] || '#15803d' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="ark-courses-grid">
        {filtered.map(c => (
          <div key={c.id} className="ark-course-card" onClick={() => onOpenCourse(c)} style={{ '--cat-color': CAT_COLORS[c.category] || '#15803d' }}>
            <div className="ark-course-hdr">
              <span className="ark-course-cat">{c.category}</span>
              <span className="ark-course-level">{c.level}</span>
            </div>
            <h4>{c.title}</h4>
            <p className="ark-course-desc">{c.description.slice(0, 100)}…</p>
            <div className="ark-course-instructor">Par {c.instructor}</div>
            <div className="ark-course-footer">
              <span>⏱ {c.duration}h</span>
              <span>🎓 {c.enrolled}</span>
              <span>⭐ {c.rating}</span>
              <span className="ark-course-price">{(c.price/1000).toFixed(0)}K</span>
            </div>
            <div className="ark-course-progress-bar">
              <div className="ark-course-progress" style={{ width: `${Math.min((c.enrolled / 150) * 100, 100)}%` }} />
            </div>
            <div className="ark-course-hover">
              <span>📖 Voir le programme</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BusinessPlanTeaser({ onOpen }) {
  const steps = [
    { icon: '💡', title: 'Idée', desc: 'Définir votre vision et votre problème' },
    { icon: '🎯', title: 'Marché', desc: 'Analyser votre cible et la concurrence' },
    { icon: '💰', title: 'Business Model', desc: 'Canvasser vos revenus et coûts' },
    { icon: '📈', title: 'Plan Financier', desc: 'Projections 3 ans, BFR, seuil rentabilité' },
    { icon: '🚀', title: 'Lancement', desc: 'Roadmap opérationnelle et pitch' },
  ]
  return (
    <div className="ark-bp-teaser">
      <div className="ark-bp-steps">
        {steps.map((s, i) => (
          <div key={i} className="ark-bp-step">
            <div className="ark-bp-step-num">{i + 1}</div>
            <div className="ark-bp-step-icon">{s.icon}</div>
            <h4>{s.title}</h4>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="ark-bp-cta">
        <button className="arkel-btn-glow" onClick={onOpen}>
          📊 Construire mon Business Plan
        </button>
      </div>
    </div>
  )
}

function CoworkingPreview() {
  const spaces = [
    { name: 'Bureau Privé Alpha', type: 'bureau', cap: 4, price: '5K/h', features: ['WiFi fibre', 'Climatisation', 'Imprimante', 'Café inclus'], color: '#8B5CF6' },
    { name: 'Salle Teranga', type: 'reunion', cap: 12, price: '15K/h', features: ['Projecteur HD', 'Tableau blanc', 'Visio', 'Café'], color: '#EC4899' },
    { name: 'Open Space Créatif', type: 'open', cap: 20, price: '3K/h', features: ['WiFi fibre', 'Café illimité', 'Casiers', 'Imprimante'], color: '#10B981' },
    { name: 'Studio Podcast', type: 'studio', cap: 3, price: '20K/h', features: ['Micro pro', 'Éclairage studio', 'Fond vert', 'Mixeur audio'], color: '#EF4444' },
  ]
  return (
    <div className="ark-coworking-grid">
      {spaces.map(s => (
        <div key={s.name} className="ark-coworking-card" style={{ '--space-color': s.color }}>
          <div className="ark-coworking-icon">{s.type === 'bureau' ? '🏢' : s.type === 'reunion' ? '👥' : s.type === 'open' ? '💻' : '🎙️'}</div>
          <h4>{s.name}</h4>
          <p className="ark-coworking-cap">Jusqu'à {s.cap} personnes · {s.price}</p>
          <div className="ark-coworking-features">
            {s.features.map(f => <span key={f}>{f}</span>)}
          </div>
          <button className="arkel-btn-sm">Réserver →</button>
        </div>
      ))}
    </div>
  )
}

/* ─── Pre-registration Modal ─── */
function PreRegModal({ onClose }) {
  const [form, setForm] = useState({ nom:'', email:'', phone:'', role:'Étudiant', interest:'Formation en ligne', message:'' })
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim()) return
    const entry = { id: uid(), type:'preinscription', name:form.nom, email:form.email, phone:form.phone, interest:form.interest, role:form.role, message:form.message, status:'pending', createdAt: new Date().toISOString(), _pre: true }
    const prev = ls(K.preregs, [])
    ss(K.preregs, [entry, ...prev])
    setSent(true)
  }

  return (
    <div className="ark-modal-overlay" onClick={onClose}>
      <div className="ark-modal" onClick={e => e.stopPropagation()}>
        <button className="ark-modal-close" onClick={onClose}>×</button>
        {sent ? (
          <div className="ark-modal-success">
            <div className="ark-success-icon">🎉</div>
            <h3>Préinscription enregistrée !</h3>
            <p>Merci <strong>{form.nom}</strong>. Vous serez notifié(e) en avant-première.</p>
          </div>
        ) : (
          <>
            <h3>🚀 Pré-inscription gratuite</h3>
            <p className="ark-modal-sub">Réservez votre place et bénéficiez d'un tarif préférentiel.</p>
            <form onSubmit={handleSubmit}>
              <div className="ark-form-row">
                <div className="ark-form-field">
                  <label>Nom complet *</label>
                  <input className="ark-input" placeholder="Votre nom" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} required />
                </div>
                <div className="ark-form-field">
                  <label>Email *</label>
                  <input className="ark-input" type="email" placeholder="votre@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
                </div>
              </div>
              <div className="ark-form-row">
                <div className="ark-form-field">
                  <label>Téléphone</label>
                  <input className="ark-input" placeholder="+221 77 000 00 00" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
                </div>
                <div className="ark-form-field">
                  <label>Je suis</label>
                  <select className="ark-input" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                    {['Étudiant','Professionnel','Entrepreneur','Formateur','Investisseur','Autre'].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="ark-form-field">
                <label>Centre d'intérêt</label>
                <select className="ark-input" value={form.interest} onChange={e=>setForm(f=>({...f,interest:e.target.value}))}>
                  {['Formation en ligne','Coworking','Programme MBA','Bootcamp Tech','Entrepreneuriat','Accompagnement Startup','Tout m\'intéresse'].map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="ark-form-field">
                <label>Message (optionnel)</label>
                <textarea className="ark-input" rows={3} placeholder="Votre projet ou vos attentes..." value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} style={{ resize:'vertical' }} />
              </div>
              <button type="submit" className="arkel-btn-glow" style={{ width:'100%' }}>
                🚀 Rejoindre la liste d'attente
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Business Plan Interactive Modal ─── */
function BusinessPlanModal({ onClose }) {
  const [step, setStep] = useState(0)
  const [bp, setBp] = useState({
    idea: '', target: '', problem: '', solution: '',
    revenue: '', costs: '', investment: '',
    timeline: '', team: '', marketing: ''
  })

  const steps = [
    { title: '💡 Vision', fields: [
      { k: 'idea', label: 'Décrivez votre idée en une phrase', placeholder: 'Une plateforme qui...' },
      { k: 'problem', label: 'Quel problème résolvez-vous ?', placeholder: 'Les jeunes entrepreneurs manquent de...' },
      { k: 'solution', label: 'Votre solution unique', placeholder: 'Nous offrons...' },
    ]},
    { title: '🎯 Marché', fields: [
      { k: 'target', label: 'Votre cible (segments)', placeholder: 'Jeunes 18-35 ans, PME, startups...' },
      { k: 'marketing', label: 'Stratégie d\'acquisition', placeholder: 'Réseaux sociaux, partenariats, SEO...' },
    ]},
    { title: '💰 Financement', fields: [
      { k: 'revenue', label: 'Modèle de revenus', placeholder: 'Abonnement, commission, vente directe...' },
      { k: 'costs', label: 'Coûts principaux (mensuels)', placeholder: 'Salaires, loyer, marketing, tech...' },
      { k: 'investment', label: 'Besoin en financement', placeholder: '5M FCFA sur 12 mois...' },
    ]},
    { title: '🚀 Exécution', fields: [
      { k: 'team', label: 'Votre équipe (rôles)', placeholder: 'CEO, CTO, Commercial, Community...' },
      { k: 'timeline', label: 'Roadmap 12 mois', placeholder: 'M1-M3: MVP, M4-M6: Lancement, M7-M12: Scale...' },
    ]},
  ]

  const current = steps[step]
  const canNext = current.fields.every(f => bp[f.k].trim().length > 0)

  return (
    <div className="ark-modal-overlay" onClick={onClose}>
      <div className="ark-modal ark-modal-lg" onClick={e => e.stopPropagation()}>
        <button className="ark-modal-close" onClick={onClose}>×</button>
        <h3>📊 Business Plan Interactif</h3>
        <p className="ark-modal-sub">Étape {step + 1} sur {steps.length} : {current.title}</p>

        <div className="ark-bp-progress">
          {steps.map((_, i) => (
            <div key={i} className={`ark-bp-dot ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
          ))}
        </div>

        <div className="ark-bp-fields">
          {current.fields.map(f => (
            <div key={f.k} className="ark-form-field">
              <label>{f.label}</label>
              <textarea
                className="ark-input"
                rows={3}
                placeholder={f.placeholder}
                value={bp[f.k]}
                onChange={e => setBp(p => ({ ...p, [f.k]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="ark-bp-actions">
          {step > 0 && (
            <button className="arkel-btn-ghost" onClick={() => setStep(s => s - 1)}>← Précédent</button>
          )}
          {step < steps.length - 1 ? (
            <button className="arkel-btn-glow" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
              Suivant →
            </button>
          ) : (
            <button className="arkel-btn-glow" disabled={!canNext} onClick={() => alert('Business Plan généré ! (Export PDF à venir)')}>
              📄 Générer mon BP
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Course Detail Modal ─── */
function CourseDetailModal({ course, onClose }) {
  const [activeCh, setActiveCh] = useState(0)
  const totalLessons = course.chapters?.reduce((s, ch) => s + (ch.lessons?.length || 0), 0) || 0
  const totalDuration = course.chapters?.reduce((s, ch) => s + (ch.lessons?.reduce((ss, l) => ss + (l.duration || 0), 0) || 0), 0) || 0

  return (
    <div className="ark-modal-overlay" onClick={onClose}>
      <div className="ark-modal ark-modal-lg" onClick={e => e.stopPropagation()}>
        <button className="ark-modal-close" onClick={onClose}>×</button>

        <div className="ark-course-detail-hdr" style={{ background: `linear-gradient(135deg, ${CAT_COLORS[course.category] || '#15803d'}, ${CAT_COLORS[course.category] || '#22c55e'}88)` }}>
          <span className="ark-course-detail-cat">{course.category}</span>
          <h3>{course.title}</h3>
          <p>Par {course.instructor} · {course.level} · {course.duration}h</p>
        </div>

        <div className="ark-course-detail-stats">
          <span>🎓 {course.enrolled} inscrits</span>
          <span>⭐ {course.rating}/5</span>
          <span>📁 {course.chapters?.length || 0} modules</span>
          <span>🎬 {totalLessons} leçons</span>
          <span>⏱ {totalDuration} min</span>
        </div>

        <p className="ark-course-detail-desc">{course.description}</p>

        {course.chapters && course.chapters.length > 0 && (
          <div className="ark-course-chapters">
            <h4>📚 Programme du cours</h4>
            {course.chapters.map((ch, i) => (
              <div key={ch.id} className="ark-chapter">
                <button className="ark-chapter-toggle" onClick={() => setActiveCh(activeCh === i ? -1 : i)}>
                  <span>📁 {ch.title}</span>
                  <span>{ch.lessons?.length || 0} leçons · {ch.lessons?.reduce((s,l)=>s+(l.duration||0),0)}min</span>
                </button>
                {activeCh === i && (
                  <div className="ark-chapter-lessons">
                    {ch.lessons?.map(l => (
                      <div key={l.id} className="ark-lesson">
                        <span>{l.type === 'video' ? '🎬' : l.type === 'quiz' ? '❓' : l.type === 'exercise' ? '✏️' : l.type === 'project' ? '📂' : l.type === 'live' ? '🔴' : '📄'} {l.title}</span>
                        <span>{l.duration}min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="ark-course-detail-footer">
          <span className="ark-course-detail-price">{course.price.toLocaleString()} FCFA</span>
          <button className="arkel-btn-glow">🚀 S'inscrire à ce cours</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  IMMERSIVE CSS — Ocean, Giant Arch, Starry Sky                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
const IMMERSIVE_CSS = `
/* ── Base ── */
.arkel-immersive {
  min-height: 100vh;
  background: #0f1f15;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
}

/* ── Navigation ── */
.arkel-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  padding: 16px 24px;
  transition: all 0.35s ease;
  background: transparent;
}
.arkel-nav.scrolled {
  background: rgba(21, 128, 61, 0.08);
  backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 12px 24px;
}
.arkel-nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.arkel-nav-logo { cursor: pointer; flex-shrink: 0; }
.arkel-nav-links {
  display: flex;
  gap: 6px;
  align-items: center;
}
.arkel-nav-links button {
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.65);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.arkel-nav-links button:hover,
.arkel-nav-links button.active {
  color: #fff;
  background: rgba(21, 128, 61, 0.15);
}
.arkel-nav-cta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}
.arkel-nav-btn-primary {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #15803d, #22c55e);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(21, 128, 61, 0.35);
  transition: all 0.2s;
}
.arkel-nav-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(21, 128, 61, 0.5); }
.arkel-nav-btn-secondary {
  padding: 10px 18px;
  border-radius: 10px;
  border: 1.5px solid rgba(255,255,255,0.15);
  background: transparent;
  color: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.arkel-nav-btn-secondary:hover { border-color: rgba(21, 128, 61, 0.5); color: #fff; }

@media (max-width: 900px) {
  .arkel-nav-links { display: none; }
  .arkel-nav-btn-secondary { display: none; }
}

/* ── Hero ── */
.arkel-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 24px 80px;
  overflow: hidden;
}

/* Ocean Background */
.arkel-ocean-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg,
    #0f1f15 0%,
    #0f2618 25%,
    #0d3b1a 45%,
    #0a5c2e 55%,
    #084d2e 70%,
    #063d28 85%,
    #052f1f 100%
  );
}

/* Starry Sky */
.arkel-stars {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 55%;
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.8), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 160px 20px, rgba(255,255,255,0.8), transparent),
    radial-gradient(2px 2px at 200px 60px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 250px 30px, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 300px 90px, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 340px 50px, rgba(255,255,255,0.8), transparent),
    radial-gradient(2px 2px at 380px 100px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 420px 40px, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 460px 80px, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 500px 25px, rgba(255,255,255,0.8), transparent),
    radial-gradient(2px 2px at 550px 65px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 600px 35px, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 650px 75px, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 700px 45px, rgba(255,255,255,0.8), transparent),
    radial-gradient(2px 2px at 750px 85px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 800px 55px, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 850px 95px, rgba(255,255,255,0.7), transparent);
  background-size: 900px 150px;
  animation: twinkle 8s ease-in-out infinite alternate;
}
@keyframes twinkle {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Moon */
.arkel-moon {
  position: absolute;
  top: 8%; right: 12%;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fef3c7, #fbbf24 30%, transparent 70%);
  box-shadow: 0 0 60px rgba(251, 191, 36, 0.3), 0 0 120px rgba(251, 191, 36, 0.1);
  animation: moonGlow 4s ease-in-out infinite alternate;
}
@keyframes moonGlow {
  0% { box-shadow: 0 0 60px rgba(251,191,36,0.25), 0 0 120px rgba(251,191,36,0.08); }
  100% { box-shadow: 0 0 80px rgba(251,191,36,0.4), 0 0 160px rgba(251,191,36,0.15); }
}

/* Giant Arch */
.arkel-arch {
  position: absolute;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 500px; height: 320px;
  background: linear-gradient(180deg,
    rgba(21, 128, 61, 0) 0%,
    rgba(21, 128, 61, 0.08) 30%,
    rgba(34, 197, 94, 0.15) 60%,
    rgba(21, 128, 61, 0.25) 100%
  );
  border-radius: 250px 250px 0 0;
  border: 2px solid rgba(21, 128, 61, 0.2);
  border-bottom: none;
  box-shadow:
    0 0 80px rgba(21, 128, 61, 0.15),
    inset 0 0 60px rgba(21, 128, 61, 0.05);
}
.arkel-arch::before {
  content: '';
  position: absolute;
  top: -20px; left: 50%;
  transform: translateX(-50%);
  width: 60px; height: 60px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.6), transparent 70%);
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(251, 191, 36, 0.4);
  animation: archStar 3s ease-in-out infinite alternate;
}
@keyframes archStar {
  0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(1.3); opacity: 1; }
}

/* Ocean Waves */
.arkel-ocean-waves {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 180px;
}
.wave {
  position: absolute;
  bottom: 0; left: -50%;
  width: 200%;
  height: 100%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
  opacity: 0.3;
}
.wave.w1 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,60 C200,0 400,120 600,60 C800,0 1000,120 1200,60 L1200,120 L0,120 Z' fill='%233b82f6' opacity='0.3'/%3E%3C/svg%3E");
  animation: waveMove 8s linear infinite;
  opacity: 0.15;
}
.wave.w2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,40 C300,100 500,0 800,50 C1000,90 1100,20 1200,60 L1200,120 L0,120 Z' fill='%2322c55e' opacity='0.2'/%3E%3C/svg%3E");
  animation: waveMove 10s linear infinite reverse;
  opacity: 0.12;
  bottom: -10px;
}
.wave.w3 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,80 C150,20 350,100 600,40 C850,80 1050,10 1200,70 L1200,120 L0,120 Z' fill='%2315803d' opacity='0.15'/%3E%3C/svg%3E");
  animation: waveMove 12s linear infinite;
  opacity: 0.1;
  bottom: -20px;
}
@keyframes waveMove {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Floating Particles */
.arkel-particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(3px 3px at 10% 20%, rgba(21, 128, 61, 0.3), transparent),
    radial-gradient(2px 2px at 80% 40%, rgba(34, 197, 94, 0.2), transparent),
    radial-gradient(3px 3px at 30% 60%, rgba(21, 128, 61, 0.25), transparent),
    radial-gradient(2px 2px at 70% 80%, rgba(251, 191, 36, 0.15), transparent);
  background-size: 400px 400px;
  animation: particlesFloat 20s linear infinite;
}
@keyframes particlesFloat {
  0% { background-position: 0 0, 100px 100px, 200px 200px, 300px 300px; }
  100% { background-position: 400px 400px, 500px 500px, 600px 600px, 700px 700px; }
}

/* Hero Content */
.arkel-hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  animation: heroFadeIn 1.2s ease-out;
}
@keyframes heroFadeIn {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.arkel-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 100px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  font-size: 0.82rem;
  color: rgba(255,255,255,0.7);
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
}
.arkel-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px #10B981;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.arkel-hero-logo-wrap {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}
.arkel-hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  color: #fff;
  margin: 0 0 12px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.arkel-gradient-text {
  background: linear-gradient(135deg, #15803d, #F59E0B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.arkel-hero-subtitle {
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: rgba(255,255,255,0.6);
  margin: 0 0 20px;
  font-weight: 500;
}
.arkel-hero-desc {
  font-size: 1rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  max-width: 560px;
  margin: 0 auto 36px;
}
.arkel-hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 48px;
}
.arkel-btn-glow {
  padding: 14px 32px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #15803d, #22c55e);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 20px rgba(21, 128, 61, 0.4), 0 0 40px rgba(21, 128, 61, 0.15);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.arkel-btn-glow:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(21, 128, 61, 0.55), 0 0 60px rgba(21, 128, 61, 0.25);
}
.arkel-btn-glow:disabled { opacity: 0.5; cursor: not-allowed; }
.arkel-btn-ghost {
  padding: 14px 28px;
  border-radius: 12px;
  border: 1.5px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.85);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}
.arkel-btn-ghost:hover {
  border-color: rgba(21, 128, 61, 0.5);
  background: rgba(21, 128, 61, 0.1);
  color: #fff;
}
.arkel-btn-sm {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.arkel-btn-sm:hover {
  border-color: rgba(21, 128, 61, 0.4);
  background: rgba(21, 128, 61, 0.1);
  color: #fff;
}

/* Hero Stats */
.arkel-hero-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.arkel-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(10px);
  min-width: 100px;
  transition: transform 0.3s;
}
.arkel-stat-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.07); }
.arkel-stat-icon { font-size: 1.4rem; }
.arkel-stat-n { font-size: 1.3rem; font-weight: 900; color: #fff; }
.arkel-stat-l { font-size: 0.72rem; color: rgba(255,255,255,0.5); font-weight: 500; }

/* Scroll Indicator */
.arkel-scroll-indicator {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.4);
  font-size: 0.7rem;
  cursor: pointer;
  z-index: 2;
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-10px); }
  60% { transform: translateX(-50%) translateY(-5px); }
}
.arkel-mouse {
  width: 22px; height: 36px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}
.arkel-wheel {
  width: 4px; height: 8px;
  background: rgba(255,255,255,0.5);
  border-radius: 2px;
  animation: wheelScroll 1.5s infinite;
}
@keyframes wheelScroll {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(12px); }
}

/* ── Sections ── */
.arkel-section {
  position: relative;
  z-index: 2;
  padding: 80px 24px;
  max-width: 1400px;
  margin: 0 auto;
}
.arkel-section-header {
  text-align: center;
  margin-bottom: 48px;
}
.arkel-section-tag {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 100px;
  background: rgba(21, 128, 61, 0.12);
  border: 1px solid rgba(21, 128, 61, 0.2);
  color: #15803d;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}
.arkel-section-header h2 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 900;
  color: #fff;
  margin: 0 0 12px;
}
.arkel-section-header p {
  font-size: 1rem;
  color: rgba(255,255,255,0.5);
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

/* ── Programs ── */
.arkel-programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.arkel-program-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.35s ease;
  display: flex;
  flex-direction: column;
}
.arkel-program-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(21, 128, 61, 0.2);
  background: rgba(255,255,255,0.06);
}
.arkel-program-hdr {
  padding: 24px;
  flex: 1;
}
.arkel-program-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.arkel-tag {
  padding: 4px 10px;
  border-radius: 100px;
  background: rgba(21, 128, 61, 0.1);
  border: 1px solid rgba(21, 128, 61, 0.2);
  color: rgba(255,255,255,0.7);
  font-size: 0.7rem;
  font-weight: 600;
}
.arkel-tag.coming {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #FBBF24;
}
.arkel-program-hdr h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 10px;
  line-height: 1.3;
}
.arkel-program-hdr p {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.6;
  margin: 0;
}
.arkel-program-body {
  padding: 0 24px 24px;
}
.arkel-program-meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.arkel-program-meta span {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
}
.arkel-program-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.arkel-program-price {
  font-size: 1.1rem;
  font-weight: 900;
  color: #15803d;
}

/* ── Courses Explorer ── */
.ark-courses-explorer {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.ark-courses-toolbar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}
.ark-courses-search {
  flex: 1;
  min-width: 240px;
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
  transition: all 0.2s;
}
.ark-courses-search:focus {
  border-color: rgba(21, 128, 61, 0.4);
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}
.ark-courses-search::placeholder { color: rgba(255,255,255,0.35); }
.ark-courses-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ark-courses-filters button {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.6);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.ark-courses-filters button:hover,
.ark-courses-filters button.active {
  border-color: var(--cat-color, #15803d);
  background: rgba(21, 128, 61, 0.1);
  color: #fff;
}
.ark-courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.ark-course-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.ark-course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  border-color: var(--cat-color, rgba(21, 128, 61, 0.3));
}
.ark-course-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--cat-color, #15803d);
  opacity: 0.6;
}
.ark-course-hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.ark-course-cat {
  padding: 3px 10px;
  border-radius: 100px;
  background: rgba(21, 128, 61, 0.1);
  border: 1px solid rgba(21, 128, 61, 0.2);
  color: #15803d;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ark-course-level {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.4);
}
.ark-course-card h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 8px;
  line-height: 1.3;
}
.ark-course-desc {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.45);
  line-height: 1.5;
  margin: 0 0 10px;
}
.ark-course-instructor {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  margin-bottom: 12px;
}
.ark-course-footer {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.4);
  margin-bottom: 10px;
}
.ark-course-price {
  font-weight: 700;
  color: #15803d;
}
.ark-course-progress-bar {
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
  margin-bottom: 12px;
}
.ark-course-progress {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #15803d, #22c55e);
  transition: width 0.5s ease;
}
.ark-course-hover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 26, 0.85);
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 16px;
}
.ark-course-hover span {
  padding: 10px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #15803d, #22c55e);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
}
.ark-course-card:hover .ark-course-hover {
  opacity: 1;
}

/* ── Instructors ── */
.arkel-instructors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.arkel-instructor-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
}
.arkel-instructor-card:hover {
  transform: translateY(-4px);
  background: rgba(255,255,255,0.06);
}
.arkel-instructor-avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #15803d, #22c55e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 900;
  color: #fff;
  margin: 0 auto 14px;
}
.arkel-instructor-card h4 {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 8px;
}
.arkel-instructor-bio {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.45);
  line-height: 1.5;
  margin: 0 0 12px;
}
.arkel-instructor-expertise {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.arkel-instructor-expertise span {
  padding: 3px 10px;
  border-radius: 100px;
  background: rgba(21, 128, 61, 0.1);
  border: 1px solid rgba(21, 128, 61, 0.2);
  color: rgba(255,255,255,0.7);
  font-size: 0.68rem;
  font-weight: 600;
}
.arkel-instructor-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.5);
}

/* ── Business Plan Teaser ── */
.ark-bp-teaser {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.ark-bp-steps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}
.ark-bp-step {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
  position: relative;
}
.ark-bp-step:hover {
  transform: translateY(-4px);
  background: rgba(255,255,255,0.06);
  border-color: rgba(21, 128, 61, 0.3);
}
.ark-bp-step-num {
  position: absolute;
  top: -12px; left: 50%;
  transform: translateX(-50%);
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #15803d, #22c55e);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ark-bp-step-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}
.ark-bp-step h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
}
.ark-bp-step p {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.45);
  line-height: 1.5;
  margin: 0;
}
.ark-bp-cta {
  text-align: center;
}

/* ── Coworking ── */
.ark-coworking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.ark-coworking-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
  border-top: 3px solid var(--space-color, #15803d);
}
.ark-coworking-card:hover {
  transform: translateY(-4px);
  background: rgba(255,255,255,0.06);
}
.ark-coworking-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}
.ark-coworking-card h4 {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
}
.ark-coworking-cap {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.45);
  margin-bottom: 12px;
}
.ark-coworking-features {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 16px;
}
.ark-coworking-features span {
  padding: 3px 10px;
  border-radius: 100px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
  font-size: 0.68rem;
}

/* ── Contact ── */
.ark-contact {
  padding: 60px 24px;
}
.arkel-contact-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: linear-gradient(135deg, rgba(21, 128, 61, 0.08), rgba(34, 197, 94, 0.05));
  border: 1px solid rgba(21, 128, 61, 0.15);
  border-radius: 24px;
  padding: 48px;
  max-width: 900px;
  margin: 0 auto;
}
.arkel-contact-left h2 {
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  margin: 0 0 14px;
}
.arkel-contact-left p {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.6;
  margin: 0 0 24px;
}
.arkel-contact-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.arkel-contact-benefits li {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  gap: 8px;
}
.arkel-contact-right {
  display: flex;
  align-items: center;
  justify-content: center;
}
.arkel-contact-visual {
  text-align: center;
}
.arkel-contact-icon {
  font-size: 5rem;
  margin-bottom: 16px;
  animation: floatIcon 4s ease-in-out infinite;
}
@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
.arkel-contact-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.arkel-contact-text span:first-child {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
}
.arkel-contact-text span:last-child {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
}
@media (max-width: 700px) {
  .arkel-contact-card { grid-template-columns: 1fr; padding: 32px; }
  .arkel-contact-right { display: none; }
}

/* ── Footer ── */
.arkel-footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 48px 24px 32px;
}
.arkel-footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
}
.arkel-footer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.arkel-footer-brand p {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.4);
  margin: 0;
}
.arkel-footer-links {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.arkel-footer-links a {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: color 0.2s;
}
.arkel-footer-links a:hover { color: #15803d; }
.arkel-footer-copy {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.3);
  margin: 0;
}

/* ── Modals ── */
.ark-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
  animation: modalFadeIn 0.25s ease;
}
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.ark-modal {
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 32px;
  max-width: 520px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease;
}
.ark-modal-lg {
  max-width: 680px;
}
@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.ark-modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.6);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.ark-modal-close:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #EF4444;
}
.ark-modal h3 {
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
}
.ark-modal-sub {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.45);
  margin: 0 0 24px;
}
.ark-modal-success {
  text-align: center;
  padding: 24px;
}
.ark-success-icon { font-size: 3.5rem; margin-bottom: 16px; }

/* Modal Forms */
.ark-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.ark-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.ark-form-field label {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ark-input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
}
.ark-input:focus {
  border-color: rgba(21, 128, 61, 0.4);
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
}
.ark-input::placeholder { color: rgba(255,255,255,0.3); }

/* Business Plan Modal */
.ark-bp-progress {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 24px;
}
.ark-bp-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s;
}
.ark-bp-dot.active {
  background: linear-gradient(135deg, #15803d, #22c55e);
  border-color: rgba(21, 128, 61, 0.4);
  box-shadow: 0 0 8px rgba(21, 128, 61, 0.3);
}
.ark-bp-dot.done {
  background: #10B981;
  border-color: #10B981;
}
.ark-bp-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}
.ark-bp-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Course Detail Modal */
.ark-course-detail-hdr {
  border-radius: 14px;
  padding: 28px;
  margin: -32px -32px 20px;
  color: #fff;
}
.ark-course-detail-cat {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  background: rgba(255,255,255,0.15);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}
.ark-course-detail-hdr h3 {
  font-size: 1.3rem;
  font-weight: 900;
  margin: 0 0 6px;
}
.ark-course-detail-hdr p {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.75);
  margin: 0;
}
.ark-course-detail-stats {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.ark-course-detail-stats span {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.06);
  font-size: 0.78rem;
  color: rgba(255,255,255,0.6);
}
.ark-course-detail-desc {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.6);
  line-height: 1.6;
  margin: 0 0 20px;
}
.ark-course-chapters h4 {
  font-size: 0.9rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 14px;
}
.ark-chapter {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
}
.ark-chapter-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.8);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}
.ark-chapter-toggle:hover { background: rgba(255,255,255,0.03); }
.ark-chapter-toggle span:last-child {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.4);
  font-weight: 500;
}
.ark-chapter-lessons {
  padding: 0 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ark-lesson {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
}
.ark-lesson span:last-child {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.35);
}
.ark-course-detail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
  margin-top: 20px;
}
.ark-course-detail-price {
  font-size: 1.4rem;
  font-weight: 900;
  color: #15803d;
}

@media (max-width: 640px) {
  .ark-form-row { grid-template-columns: 1fr; }
  .arkel-hero-stats { gap: 10px; }
  .arkel-stat-card { min-width: 80px; padding: 12px 14px; }
  .arkel-hero-actions { flex-direction: column; align-items: stretch; }
  .arkel-btn-glow, .arkel-btn-ghost { justify-content: center; }
}
`
