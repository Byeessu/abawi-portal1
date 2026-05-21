import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { isSystemAdmin } from '../lib/permissions'
import { callGroq } from '../lib/groqClient'
import { SEED_COURSES } from '../data/arkelCourses'
import SEO from '../components/SEO'
import ArkelUpLogo from '../components/icons/ArkelUpLogo'
import ArkelUpPage from './arkelup/ArkelUpPage'

// ─── Storage ──────────────────────────────────────────────────────────────────
const K = {
  courses:   'arkel_courses_v1',
  programs:  'arkel_programs_v1',
  students:  'arkel_students_v1',
  instructors:'arkel_instructors_v1',
  spaces:    'arkel_spaces_v1',
  bookings:  'arkel_bookings_v1',
  regs:      'arkel_regs_v1',
  preregs:   'arkel_preregs_v1',
}
function ls(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
function ss(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }
function uid()    { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}` }
function dateFR(s){ return new Date(s).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) }

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
  { id:'f6', name:'Me. Seynabou Fall', email:'s.fall@arkelup.sn', phone:'+221 77 789 01 23', bio:'Avocate d\'affaires, Barreau de Dakar. Spécialiste droit OHADA, droit des sociétés, droit foncier et contrats commerciaux.', expertise:['Droit OHADA','Immobilier','Contrats'], courses:['c8','c18'], rating:4.5, students:28, status:'active' },
  { id:'f7', name:'Pierre Diatta', email:'p.diatta@arkelup.sn', phone:'+221 77 891 23 45', bio:'Ingénieur en génie civil, PMP certifié. Chef de projet BTP chez Dakar Dem Dikk pendant 8 ans. Formateur en gestion de projet et AutoCAD.', expertise:['Gestion de Projet','Génie Civil','AutoCAD'], courses:['c9','c20'], rating:4.8, students:88, status:'active' },
  { id:'f8', name:'Marie-Christine Sagna', email:'mc.sagna@arkelup.sn', phone:'+221 77 912 34 56', bio:'Data analyst, certifiée Microsoft Power BI. Ex-contrôleuse de gestion dans une multinationale. Expert Excel avancé et business intelligence.', expertise:['Excel','Power BI','Data Analytics'], courses:['c10'], rating:4.9, students:217, status:'active' },
  { id:'f9', name:'Jean-Baptiste Badji', email:'jb.badji@arkelup.sn', phone:'+221 77 023 45 67', bio:'E-commerçant depuis 2017, fondateur de 3 boutiques en ligne à succès. Expert dropshipping Afrique/Chine, paiement mobile et agrobusiness.', expertise:['E-Commerce','Dropshipping','Agrobusiness'], courses:['c12','c19'], rating:4.7, students:104, status:'active' },
  { id:'f10', name:'François Mendy', email:'f.mendy@arkelup.sn', phone:'+221 77 134 56 78', bio:'Coach en communication, certifié IELTS 8.0. Ancien journaliste RFI Dakar. Formateur anglais business et communication professionnelle pour cadres.', expertise:['Anglais Professionnel','Communication','Prise de parole'], courses:['c13','c17'], rating:4.8, students:132, status:'active' },
  { id:'f11', name:'Christine Sambou', email:'c.sambou@arkelup.sn', phone:'+221 77 245 67 89', bio:'Graphiste & directrice artistique. 10 ans d\'expérience en agences de communication. Expert Canva, Adobe Suite. Créatrice de l\'identité visuelle de 200+ marques africaines.', expertise:['Graphisme','Canva','Adobe Suite'], courses:['c14'], rating:4.8, students:174, status:'active' },
  { id:'f12', name:'Paul Martin', email:'p.martin@arkelup.sn', phone:'+221 77 356 78 90', bio:'Consultant cybersécurité, CEH certifié. Ex-CISO banque régionale. 12 ans d\'expérience en audit sécurité et tests d\'intrusion pour institutions financières africaines.', expertise:['Cybersécurité','Ethical Hacking','Audit'], courses:['c21','c27'], rating:4.8, students:136, status:'active' },
  { id:'f13', name:'Marie-Claire Diop', email:'mc.diop@arkelup.sn', phone:'+221 77 467 89 01', bio:'Product Designer, ex-Spotify Stockholm. Spécialiste Figma, design systems, accessibilité. A mené la refonte UX de 5 super-apps africaines.', expertise:['UI/UX','Figma','Design Systems'], courses:['c22','c29'], rating:4.9, students:232, status:'active' },
  { id:'f14', name:'Joseph Faye', email:'j.faye@arkelup.sn', phone:'+221 77 578 90 12', bio:'Architecte Cloud AWS & Azure certifié. Ex-DevOps Lead chez Jumia. Expert infrastructure cloud, CI/CD, Kubernetes et scaling pour startups africaines.', expertise:['Cloud','DevOps','AWS'], courses:['c23','c28'], rating:4.7, students:94, status:'active' },
  { id:'f15', name:'Emmanuel Coly', email:'e.coly@arkelup.sn', phone:'+221 77 689 01 23', bio:'Blockchain developer, fondateur d\'un protocole DeFi. Expert Ethereum, Solidity, smart contracts. Conférencier régulier aux Africa Blockchain Summits.', expertise:['Blockchain','Web3','Solidity'], courses:['c24'], rating:4.6, students:33, status:'active' },
  { id:'f16', name:'Bernadette Ndiaye', email:'b.ndiaye@arkelup.sn', phone:'+221 77 790 12 34', bio:'Monteuse vidéo & directrice artistique. 8 ans d\'expérience en production audiovisuelle. Expert Premiere Pro, DaVinci Resolve, After Effects. Créatrice de 3 séries web à succès.', expertise:['Montage Vidéo','DaVinci','Premiere'], courses:['c25','c30'], rating:4.8, students:199, status:'active' },
  { id:'f17', name:'Antoine Seck', email:'a.seck@arkelup.sn', phone:'+221 77 801 23 45', bio:'Photographe professionnel spécialisé mode et portrait. Ex-contributeur Getty Images. Formateur Lightroom et direction artistique photo.', expertise:['Photographie','Lightroom','Portrait'], courses:['c26'], rating:4.7, students:76, status:'active' },
]

const SEED_STUDENTS = [
  { id:'s1', name:'Oumar Sarr', email:'o.sarr@gmail.com', phone:'+221 77 111 22 33', city:'Dakar', enrolledCourses:['c1','c4'], progress:{'c1':65,'c4':100}, joinedAt:'2024-09-15', status:'active' },
  { id:'s2', name:'Aissatou Dieng', email:'a.dieng@gmail.com', phone:'+221 77 222 33 44', city:'Thiès', enrolledCourses:['c2','c7'], progress:{'c2':40,'c7':10}, joinedAt:'2024-10-01', status:'active' },
  { id:'s3', name:'Cheikh Mbaye', email:'c.mbaye@gmail.com', phone:'+221 77 333 44 55', city:'Dakar', enrolledCourses:['c3'], progress:{'c3':80}, joinedAt:'2024-08-20', status:'active' },
  { id:'s4', name:'Rokhaya Seck', email:'r.seck@gmail.com', phone:'+221 77 444 55 66', city:'Saint-Louis', enrolledCourses:['c1','c5'], progress:{'c1':100,'c5':35}, joinedAt:'2024-11-05', status:'active' },
  { id:'s5', name:'Modou Niang', email:'m.niang@gmail.com', phone:'+221 77 555 66 77', city:'Kaolack', enrolledCourses:['c4'], progress:{'c4':55}, joinedAt:'2024-11-12', status:'active' },
  { id:'s6', name:'Ndéye Touré', email:'n.toure@gmail.com', phone:'+221 77 666 77 88', city:'Dakar', enrolledCourses:['c2'], progress:{'c2':25}, joinedAt:'2024-12-01', status:'active' },
  { id:'s7', name:'Babacar Fall', email:'b.fall@gmail.com', phone:'+221 77 777 88 99', city:'Ziguinchor', enrolledCourses:['c8'], progress:{'c8':90}, joinedAt:'2024-09-30', status:'active' },
  { id:'s8', name:'Fatima Traoré', email:'f.traore@gmail.com', phone:'+221 77 888 99 00', city:'Dakar', enrolledCourses:['c1','c4','c5'], progress:{'c1':100,'c4':100,'c5':75}, joinedAt:'2024-08-01', status:'active' },
  { id:'s9', name:'Paul Sene', email:'p.sene@gmail.com', phone:'+221 77 999 00 11', city:'Thiès', enrolledCourses:['c21','c27'], progress:{'c21':45,'c27':80}, joinedAt:'2024-12-15', status:'active' },
  { id:'s10', name:'Marie Diouf', email:'m.diouf@gmail.com', phone:'+221 77 000 11 22', city:'Saint-Louis', enrolledCourses:['c22','c29'], progress:{'c22':60,'c29':30}, joinedAt:'2024-10-20', status:'active' },
  { id:'s11', name:'Antoine Niang', email:'a.niang@gmail.com', phone:'+221 77 111 22 33', city:'Kaolack', enrolledCourses:['c23','c28'], progress:{'c23':25,'c28':55}, joinedAt:'2024-11-08', status:'active' },
  { id:'s12', name:'Bernadette Faye', email:'b.faye@gmail.com', phone:'+221 77 222 33 44', city:'Ziguinchor', enrolledCourses:['c25','c30'], progress:{'c25':70,'c30':40}, joinedAt:'2024-09-12', status:'active' },
]

const SEED_SPACES = [
  { id:'sp1', name:'Bureau Privé Alpha', type:'bureau', capacity:4, priceHour:5000, priceDay:25000, features:['WiFi fibre','Climatisation','Imprimante','Café inclus'], available:true, color:'#8B5CF6' },
  { id:'sp2', name:'Bureau Privé Beta', type:'bureau', capacity:2, priceHour:4000, priceDay:18000, features:['WiFi fibre','Climatisation','Vue jardin'], available:true, color:'#6366F1' },
  { id:'sp3', name:'Salle Teranga', type:'reunion', capacity:12, priceHour:15000, priceDay:60000, features:['Projecteur HD','Tableau blanc','Visio','Café'], available:true, color:'#EC4899' },
  { id:'sp4', name:'Salle Baobab', type:'reunion', capacity:6, priceHour:10000, priceDay:40000, features:['Écran TV 75"','Tableau blanc','WiFi'], available:false, color:'#F97316' },
  { id:'sp5', name:'Open Space Créatif', type:'open', capacity:20, priceHour:3000, priceDay:12000, features:['WiFi fibre','Café illimité','Casiers','Imprimante'], available:true, color:'#10B981' },
  { id:'sp6', name:'Studio Podcast / Vidéo', type:'studio', capacity:3, priceHour:20000, priceDay:80000, features:['Micro pro','Éclairage studio','Fond vert','Mixeur audio'], available:true, color:'#EF4444' },
  { id:'sp7', name:'Salle de Formation', type:'formation', capacity:30, priceHour:25000, priceDay:100000, features:['Vidéoprojecteur','WiFi','30 postes','Tableau interactif','Climatisation'], available:true, color:'#F59E0B' },
]

const SEED_REGS = [
  { id:'r1', type:'preinscription', name:'Moussa Konaté', email:'m.konate@gmail.com', phone:'+221 77 123 45 67', interest:'Programme MBA Africa', role:'Étudiant', message:'Très intéressé par le MBA, je travaille en finance depuis 5 ans.', status:'pending', createdAt:'2025-01-15T09:30:00Z' },
  { id:'r2', type:'preinscription', name:'Saliou Diop', email:'s.diop@hotmail.com', phone:'+221 77 234 56 78', interest:'Développement Web Full Stack', role:'Étudiant', message:'Je veux me reconvertir dans le web.', status:'contacted', createdAt:'2025-01-14T14:20:00Z' },
  { id:'r3', type:'preinscription', name:'Adja Gaye', email:'adja.gaye@gmail.com', phone:'+221 77 345 67 89', interest:'Marketing Digital', role:'Professionnel', message:'Responsable marketing PME, je veux digitaliser notre communication.', status:'pending', createdAt:'2025-01-13T11:00:00Z' },
  { id:'r4', type:'preinscription', name:'Ibrahim Camara', email:'i.camara@yahoo.fr', phone:'+221 77 456 78 90', interest:'Formateur', role:'Formateur', message:'Expert en comptabilité SYSCOHADA, prêt à rejoindre l\'équipe pédagogique.', status:'pending', createdAt:'2025-01-12T16:45:00Z' },
  { id:'r5', type:'preinscription', name:'Coumba Ndiaye', email:'c.ndiaye@gmail.com', phone:'+221 78 567 89 01', interest:'Coworking mensuel', role:'Entrepreneur', message:'Startup en phase de démarrage, besoin d\'un espace professionnel.', status:'enrolled', createdAt:'2025-01-10T08:15:00Z' },
]

function seedIfEmpty() {
  // Cours : si vide OU chapitres vides → fusionner avec seed
  const existingCourses = ls(K.courses, null)
  if (!existingCourses) {
    ss(K.courses, SEED_COURSES)
  } else {
    const seedMap = new Map(SEED_COURSES.map(c => [c.id, c]))
    const merged = existingCourses.map(c => {
      const seed = seedMap.get(c.id)
      if (seed && (!c.chapters || c.chapters.length === 0)) {
        return { ...c, chapters: seed.chapters }
      }
      return c
    })
    // Ajouter les nouveaux cours seed qui n'existent pas encore
    const existingIds = new Set(existingCourses.map(c => c.id))
    const newCourses = SEED_COURSES.filter(c => !existingIds.has(c.id))
    if (newCourses.length > 0 || merged.some((c,i) => c.chapters !== existingCourses[i].chapters)) {
      ss(K.courses, [...merged, ...newCourses])
    }
  }
  if (!ls(K.programs, null)) ss(K.programs, SEED_PROGRAMS)
  if (!ls(K.instructors, null)) ss(K.instructors, SEED_INSTRUCTORS)
  if (!ls(K.students, null)) ss(K.students, SEED_STUDENTS)
  if (!ls(K.spaces, null)) ss(K.spaces, SEED_SPACES)
  if (!ls(K.regs, null)) ss(K.regs, SEED_REGS)
  if (!ls(K.bookings, null)) ss(K.bookings, [])
  if (!ls(K.preregs, null)) ss(K.preregs, [])
}
seedIfEmpty() // met à jour localStorage avant le premier rendu

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ArkelUpCenter() {
  const { membre } = useAuth()
  const admin = isSystemAdmin(membre)

  useEffect(() => { seedIfEmpty() }, [])

  if (!admin) return <ArkelUpPage />
  return <ArkelPlatform />
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE — Immersive Ocean + Arch + Starry Sky Theme
// ═══════════════════════════════════════════════════════════════════════════════
function ArkelLanding() {
  return <ArkelLandingImmersive />
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM — Admin Full Access
// ═══════════════════════════════════════════════════════════════════════════════
const NAV_SECTIONS = [
  { id:'dashboard',    icon:'🏠', label:'Dashboard' },
  { id:'courses',      icon:'📚', label:'Cours' },
  { id:'programs',     icon:'📋', label:'Programmes' },
  { id:'students',     icon:'🎓', label:'Étudiants' },
  { id:'instructors',  icon:'👨‍🏫', label:'Formateurs' },
  { id:'coworking',    icon:'🏢', label:'Coworking' },
  { id:'registrations',icon:'📝', label:'Inscriptions' },
  { id:'settings',     icon:'⚙️', label:'Paramètres' },
]

function ArkelPlatform() {
  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [courses,      setCourses]      = useState(() => ls(K.courses, SEED_COURSES))
  const [programs,     setPrograms]     = useState(() => ls(K.programs, SEED_PROGRAMS))
  const [students,     setStudents]     = useState(() => ls(K.students, SEED_STUDENTS))
  const [instructors,  setInstructors]  = useState(() => ls(K.instructors, SEED_INSTRUCTORS))
  const [spaces,       setSpaces]       = useState(() => ls(K.spaces, SEED_SPACES))
  const [bookings,     setBookings]     = useState(() => ls(K.bookings, []))
  const [regs,         setRegs]         = useState(() => [...ls(K.regs, SEED_REGS), ...ls(K.preregs, [])])
  const [notif,        setNotif]        = useState('')

  function showNotif(msg) { setNotif(msg); setTimeout(() => setNotif(''), 3500) }

  function updateRegs(next) { setRegs(next); ss(K.regs, next.filter(r => !r._pre)); ss(K.preregs, next.filter(r => r._pre)) }

  const ctx = { courses, setCourses, programs, setPrograms, students, setStudents, instructors, setInstructors, spaces, setSpaces, bookings, setBookings, regs, setRegs:updateRegs, showNotif }

  const cur = NAV_SECTIONS.find(s => s.id === section) || NAV_SECTIONS[0]

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-primary)' }}>
      <SEO
        title="Arkel Up Center — Plateforme d'administration"
        description="Plateforme de gestion Arkel Up Center : cours, programmes, étudiants, formateurs, espaces et réservations."
        noindex={true}
      />
      <style>{PLATFORM_CSS}</style>
      {notif && <div className="plat-toast">{notif}</div>}

      {/* ── Sidebar ── */}
      <aside className={`plat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="plat-sidebar-logo" onClick={() => setSidebarOpen(v=>!v)}>
          {sidebarOpen
            ? <ArkelUpLogo variant="full" size={148} light />
            : <ArkelUpLogo variant="icon" size={42} />
          }
        </div>
        <nav className="plat-nav">
          {NAV_SECTIONS.map(s => (
            <button key={s.id}
              className={`plat-nav-item ${section===s.id?'active':''}`}
              onClick={() => setSection(s.id)}
              title={!sidebarOpen ? s.label : undefined}>
              <span className="plat-nav-icon">{s.icon}</span>
              {sidebarOpen && <span className="plat-nav-label">{s.label}</span>}
              {s.id==='registrations' && regs.filter(r=>r.status==='pending').length > 0 && (
                <span className="plat-nav-badge">{regs.filter(r=>r.status==='pending').length}</span>
              )}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="plat-sidebar-footer">
            <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>
              Arkel Up Center<br />Administration v1.0
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="plat-main">
        {/* Header */}
        <header className="plat-header">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="plat-menu-btn" onClick={() => setSidebarOpen(v=>!v)}>☰</button>
            <h1 className="plat-header-title">{cur.icon} {cur.label}</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="plat-admin-badge">👑 Admin</div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}</div>
          </div>
        </header>

        {/* Content */}
        <div className="plat-content">
          {section==='dashboard'     && <Dashboard     ctx={ctx} />}
          {section==='courses'       && <CoursesSection     ctx={ctx} />}
          {section==='programs'      && <ProgramsSection    ctx={ctx} />}
          {section==='students'      && <StudentsSection    ctx={ctx} />}
          {section==='instructors'   && <InstructorsSection ctx={ctx} />}
          {section==='coworking'     && <CoworkingSection   ctx={ctx} />}
          {section==='registrations' && <RegistrationsSection ctx={ctx} />}
          {section==='settings'      && <SettingsSection    ctx={ctx} />}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ ctx }) {
  const { courses, students, instructors, spaces, bookings, regs } = ctx
  const totalRevenue = students.reduce((s, st) => s + st.enrolledCourses.reduce((ss, cid) => ss + (courses.find(c=>c.id===cid)?.price||0), 0), 0)
  const pending = regs.filter(r => r.status==='pending').length
  const activeSpaces = spaces.filter(s => !s.available).length

  const METRICS = [
    { label:'Étudiants actifs', value:students.length, icon:'🎓', color:'#A855F7', sub:`+${Math.floor(students.length*0.12)} ce mois` },
    { label:'Cours publiés', value:courses.filter(c=>c.status==='published').length, icon:'📚', color:'#3B82F6', sub:`${courses.length} au total` },
    { label:'Formateurs', value:instructors.length, icon:'👨‍🏫', color:'#10B981', sub:'Tous actifs' },
    { label:'Revenus (FCFA)', value:(totalRevenue/1000).toFixed(0)+'K', icon:'💰', color:'#F59E0B', sub:'Cumulatif' },
    { label:'Inscriptions en attente', value:pending, icon:'📝', color:'#EF4444', sub:'À traiter' },
    { label:'Espaces occupés', value:`${activeSpaces}/${spaces.length}`, icon:'🏢', color:'#6366F1', sub:`${Math.round(activeSpaces/spaces.length*100)}% taux d'occupation` },
  ]

  const topCourses = [...courses].sort((a,b) => b.enrolled-a.enrolled).slice(0,4)
  const recentRegs = [...regs].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5)

  return (
    <div className="plat-grid-auto plat-fade">
      {/* Metrics */}
      {METRICS.map(m => (
        <div key={m.label} className="plat-metric-card" style={{ '--mc':m.color }}>
          <div className="plat-metric-icon">{m.icon}</div>
          <div>
            <div className="plat-metric-val">{m.value}</div>
            <div className="plat-metric-label">{m.label}</div>
            <div className="plat-metric-sub">{m.sub}</div>
          </div>
        </div>
      ))}

      {/* Top courses */}
      <div className="plat-card plat-card-wide">
        <h3 className="plat-card-title">📚 Cours les plus populaires</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {topCourses.map(c => (
            <div key={c.id} className="plat-row-item">
              <div className="plat-row-icon" style={{ background:'rgba(168,85,247,0.15)' }}>📖</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="plat-row-name">{c.title}</div>
                <div className="plat-row-sub">{c.instructor} · {c.category}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>{c.enrolled} élèves</div>
                <div style={{ fontSize:'0.72rem', color:'var(--accent)' }}>⭐ {c.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent registrations */}
      <div className="plat-card plat-card-wide">
        <h3 className="plat-card-title">📝 Inscriptions récentes</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {recentRegs.map(r => (
            <div key={r.id} className="plat-row-item">
              <div className="plat-row-icon" style={{ background:'rgba(16,185,129,0.12)' }}>👤</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="plat-row-name">{r.name}</div>
                <div className="plat-row-sub">{r.interest} · {r.role}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Courses ───────────────────────────────────────────────────────────────────
function CoursesSection({ ctx }) {
  const { courses, setCourses, instructors, showNotif } = ctx
  const [view, setView] = useState('list') // 'list' | 'form' | 'detail'
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const cats = [...new Set(courses.map(c => c.category))]
  const filtered = courses.filter(c =>
    (!search || c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || c.category === filterCat)
  )

  function saveCourse(data) {
    if (data.id) {
      const next = courses.map(c => c.id===data.id ? data : c)
      setCourses(next); ss(K.courses, next)
    } else {
      const entry = { ...data, id:uid(), enrolled:0, rating:0, chapters:[] }
      const next = [entry, ...courses]
      setCourses(next); ss(K.courses, next)
    }
    showNotif('✓ Cours sauvegardé'); setView('list')
  }

  function deleteCourse(id) {
    if (!confirm('Supprimer ce cours ?')) return
    const next = courses.filter(c => c.id!==id)
    setCourses(next); ss(K.courses, next); showNotif('✓ Cours supprimé')
  }

  if (view === 'form') return <CourseForm course={selected} instructors={instructors} onSave={saveCourse} onBack={() => setView('list')} />
  if (view === 'detail') return <CourseDetail course={selected} onBack={() => setView('list')} onEdit={() => setView('form')} />

  return (
    <div className="plat-fade">
      <div className="plat-toolbar">
        <div style={{ display:'flex', gap:8, flex:1, flexWrap:'wrap' }}>
          <input className="plat-search" placeholder="🔍 Rechercher un cours…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="plat-select" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
            <option value="">Toutes catégories</option>
            {cats.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="plat-btn-primary" onClick={() => { setSelected(null); setView('form') }}>+ Nouveau cours</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
        {filtered.map(c => (
          <div key={c.id} className="plat-course-card">
            <div className="plat-course-hdr" style={{ background:`linear-gradient(135deg, ${CAT_COLORS[c.category]||'#6366F1'}, ${CAT_COLORS[c.category]||'#4F46E5'}aa)` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span className="plat-course-cat">{c.category}</span>
                <StatusBadge status={c.status} />
              </div>
              <div className="plat-course-title">{c.title}</div>
              <div className="plat-course-instructor">{c.instructor}</div>
            </div>
            <div className="plat-course-body">
              <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', margin:'0 0 12px', lineHeight:1.5, WebkitLineClamp:2, display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.description}</p>
              <div className="plat-course-meta">
                <span>🎓 {c.enrolled} inscrits</span>
                <span>⭐ {c.rating||'–'}</span>
                <span>⏱ {c.duration}h</span>
                <span>💰 {(c.price/1000).toFixed(0)}K FCFA</span>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button className="plat-btn-sm" onClick={() => { setSelected(c); setView('detail') }}>👁 Voir</button>
                <button className="plat-btn-sm" onClick={() => { setSelected(c); setView('form') }}>✏️ Modifier</button>
                <button className="plat-btn-sm danger" onClick={() => deleteCourse(c.id)}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CourseForm({ course, instructors, onSave, onBack }) {
  const [form, setForm] = useState(course || { title:'', description:'', category:'Business', instructor: instructors[0]?.name||'', instructorId: instructors[0]?.id||'', level:'débutant', duration:10, price:29900, status:'draft', tags:[] })
  const p = k => e => setForm(f => ({...f, [k]: k==='price'||k==='duration' ? Number(e.target.value) : e.target.value}))

  return (
    <div className="plat-fade plat-form-wrap">
      <button className="plat-back-btn" onClick={onBack}>← Retour</button>
      <h2 className="plat-section-h">{course?'Modifier le cours':'Nouveau cours'}</h2>
      <div className="plat-form-grid">
        <div className="plat-form-field plat-span2">
          <label>Titre du cours *</label>
          <input className="plat-input" value={form.title} onChange={p('title')} placeholder="Nom du cours" />
        </div>
        <div className="plat-form-field plat-span2">
          <label>Description</label>
          <textarea className="plat-input" rows={3} value={form.description} onChange={p('description')} style={{ resize:'vertical' }} />
        </div>
        <div className="plat-form-field">
          <label>Catégorie</label>
          <select className="plat-input" value={form.category} onChange={p('category')}>
            {['Business','Tech','Finance','Marketing','Management','Juridique','Santé','RH'].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="plat-form-field">
          <label>Formateur</label>
          <select className="plat-input" value={form.instructorId} onChange={e => setForm(f => ({...f, instructorId:e.target.value, instructor: instructors.find(i=>i.id===e.target.value)?.name||f.instructor}))}>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="plat-form-field">
          <label>Niveau</label>
          <select className="plat-input" value={form.level} onChange={p('level')}>
            {['débutant','intermédiaire','avancé'].map(l=><option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="plat-form-field">
          <label>Statut</label>
          <select className="plat-input" value={form.status} onChange={p('status')}>
            {['draft','published','archived'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="plat-form-field">
          <label>Durée (heures)</label>
          <input className="plat-input" type="number" value={form.duration} onChange={p('duration')} min={1} />
        </div>
        <div className="plat-form-field">
          <label>Prix (FCFA)</label>
          <input className="plat-input" type="number" value={form.price} onChange={p('price')} min={0} step={1000} />
        </div>
      </div>
      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        <button className="plat-btn-primary" onClick={() => onSave(form)}>💾 Enregistrer</button>
        <button className="plat-btn-ghost" onClick={onBack}>Annuler</button>
      </div>
    </div>
  )
}

function CourseDetail({ course, onBack, onEdit }) {
  return (
    <div className="plat-fade plat-form-wrap">
      <button className="plat-back-btn" onClick={onBack}>← Retour</button>
      <div className="plat-detail-hero" style={{ background:`linear-gradient(135deg,${CAT_COLORS[course.category]||'#6366F1'},${CAT_COLORS[course.category]||'#4F46E5'}88)` }}>
        <div>
          <span className="plat-course-cat">{course.category}</span>
          <StatusBadge status={course.status} />
        </div>
        <h2 style={{ color:'#fff', fontSize:'1.4rem', fontWeight:900, margin:'10px 0 4px' }}>{course.title}</h2>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.88rem' }}>Par {course.instructor}</div>
      </div>
      <div className="plat-detail-body">
        <div className="plat-detail-stats">
          {[['🎓',`${course.enrolled} inscrits`],['⭐',`${course.rating||'–'}/5`],['⏱',`${course.duration}h`],['💰',`${(course.price/1000).toFixed(0)}K FCFA`],['📊',course.level]].map(([i,v]) => (
            <div key={v} className="plat-mini-stat"><span>{i}</span><span>{v}</span></div>
          ))}
        </div>
        <p style={{ color:'var(--text-secondary)', lineHeight:1.7, margin:'16px 0' }}>{course.description}</p>
        {course.chapters.length > 0 && (
          <>
            <h3 style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--text-primary)', marginBottom:10 }}>Programme</h3>
            {course.chapters.map(ch => (
              <div key={ch.id} className="plat-chapter">
                <div className="plat-chapter-title">📁 {ch.title}</div>
                {ch.lessons.map(l => (
                  <div key={l.id} className="plat-lesson">
                    {l.type==='video'?'🎬':l.type==='quiz'?'❓':'📄'} {l.title} <span style={{ color:'var(--text-muted)', fontSize:'0.7rem' }}>{l.duration}min</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
        <button className="plat-btn-primary" style={{ marginTop:16 }} onClick={onEdit}>✏️ Modifier ce cours</button>
      </div>
    </div>
  )
}

// ── Programs ──────────────────────────────────────────────────────────────────
function ProgramsSection({ ctx }) {
  const { programs, setPrograms, courses, showNotif } = ctx
  const [editing, setEditing] = useState(null)

  function saveProgram(p) {
    if (p.id) { const n=programs.map(x=>x.id===p.id?p:x); setPrograms(n); ss(K.programs,n) }
    else { const n=[{...p,id:uid(),enrolled:0},...programs]; setPrograms(n); ss(K.programs,n) }
    showNotif('✓ Programme sauvegardé'); setEditing(null)
  }

  if (editing !== null) return (
    <div className="plat-fade plat-form-wrap">
      <button className="plat-back-btn" onClick={() => setEditing(null)}>← Retour</button>
      <h2 className="plat-section-h">{editing?.id?'Modifier':'Nouveau programme'}</h2>
      <ProgramForm prog={editing||{}} courses={courses} onSave={saveProgram} onCancel={() => setEditing(null)} />
    </div>
  )

  return (
    <div className="plat-fade">
      <div className="plat-toolbar">
        <h2 className="plat-section-h" style={{ margin:0 }}>📋 Programmes ({programs.length})</h2>
        <button className="plat-btn-primary" onClick={() => setEditing({})}>+ Nouveau programme</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:16 }}>
        {programs.map(p => (
          <div key={p.id} className="plat-card">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <StatusBadge status={p.status==='active'?'published':p.status==='coming'?'draft':'archived'} />
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{p.duration}</span>
            </div>
            <h3 style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)', marginBottom:6 }}>{p.title}</h3>
            <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.6, marginBottom:12 }}>{p.description}</p>
            <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
              <span className="plat-tag">🎓 {p.enrolled} inscrits</span>
              <span className="plat-tag">📊 {p.level}</span>
              <span className="plat-tag">💰 {(p.price/1000).toFixed(0)}K FCFA</span>
              <span className="plat-tag">📚 {p.courses.length} cours</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="plat-btn-sm" onClick={() => setEditing(p)}>✏️ Modifier</button>
              <button className="plat-btn-sm danger" onClick={() => { const n=programs.filter(x=>x.id!==p.id); setPrograms(n); ss(K.programs,n); showNotif('✓ Supprimé') }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgramForm({ prog, courses, onSave, onCancel }) {
  const [form, setForm] = useState({ title:'', description:'', duration:'', level:'Tous niveaux', price:0, status:'active', courses:[], tags:[], ...prog })
  const p = k => e => setForm(f=>({...f,[k]:k==='price'?Number(e.target.value):e.target.value}))
  function toggleCourse(id) { setForm(f=>({...f,courses:f.courses.includes(id)?f.courses.filter(c=>c!==id):[...f.courses,id]})) }
  return (
    <div className="plat-form-grid">
      <div className="plat-form-field plat-span2"><label>Titre du programme *</label><input className="plat-input" value={form.title} onChange={p('title')} /></div>
      <div className="plat-form-field plat-span2"><label>Description</label><textarea className="plat-input" rows={3} value={form.description} onChange={p('description')} style={{ resize:'vertical' }} /></div>
      <div className="plat-form-field"><label>Durée</label><input className="plat-input" value={form.duration} onChange={p('duration')} placeholder="ex: 3 mois" /></div>
      <div className="plat-form-field"><label>Niveau</label><select className="plat-input" value={form.level} onChange={p('level')}>{['Tous niveaux','Débutant','Intermédiaire','Avancé'].map(l=><option key={l}>{l}</option>)}</select></div>
      <div className="plat-form-field"><label>Prix (FCFA)</label><input className="plat-input" type="number" value={form.price} onChange={p('price')} step={1000} /></div>
      <div className="plat-form-field"><label>Statut</label><select className="plat-input" value={form.status} onChange={p('status')}>{['active','coming','archived'].map(s=><option key={s}>{s}</option>)}</select></div>
      <div className="plat-form-field plat-span2">
        <label>Cours inclus</label>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
          {courses.map(c=>(
            <button key={c.id} type="button" className={`plat-tag ${form.courses.includes(c.id)?'selected':''}`} onClick={() => toggleCourse(c.id)} style={{ cursor:'pointer', border:'1.5px solid', borderColor:form.courses.includes(c.id)?'var(--accent)':'var(--border)', background:form.courses.includes(c.id)?'color-mix(in srgb,var(--accent) 12%,transparent)':'transparent', color:form.courses.includes(c.id)?'var(--accent)':'var(--text-secondary)' }}>{c.title.slice(0,30)}</button>
          ))}
        </div>
      </div>
      <div className="plat-form-field plat-span2" style={{ display:'flex', gap:10 }}>
        <button className="plat-btn-primary" onClick={() => onSave(form)}>💾 Enregistrer</button>
        <button className="plat-btn-ghost" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

// ── Students ──────────────────────────────────────────────────────────────────
function StudentsSection({ ctx }) {
  const { students, setStudents, courses, showNotif } = ctx
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = students.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="plat-fade">
      <div className="plat-toolbar">
        <input className="plat-search" placeholder="🔍 Rechercher un étudiant…" value={search} onChange={e=>setSearch(e.target.value)} />
        <div style={{ display:'flex', gap:8, alignItems:'center', color:'var(--text-muted)', fontSize:'0.82rem' }}>
          <span>Total : <strong style={{ color:'var(--text-primary)' }}>{students.length}</strong></span>
        </div>
      </div>

      {selected ? (
        <div className="plat-fade plat-form-wrap">
          <button className="plat-back-btn" onClick={() => setSelected(null)}>← Retour</button>
          <div className="plat-student-profile">
            <div className="plat-student-avatar">{selected.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
            <div>
              <h2 style={{ fontWeight:900, fontSize:'1.2rem', color:'var(--text-primary)', margin:'0 0 4px' }}>{selected.name}</h2>
              <div style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>{selected.city} · Inscrit le {dateFR(selected.joinedAt)}</div>
            </div>
          </div>
          <div className="plat-form-grid" style={{ marginTop:16 }}>
            {[['✉️','Email',selected.email],['📞','Téléphone',selected.phone||'–'],['📍','Ville',selected.city],['📊','Statut',selected.status]].map(([i,l,v])=>(
              <div key={l} className="plat-detail-row"><span className="plat-dr-label">{i} {l}</span><span className="plat-dr-val">{v}</span></div>
            ))}
          </div>
          <h3 style={{ fontWeight:800, fontSize:'0.88rem', color:'var(--text-primary)', margin:'20px 0 10px' }}>📚 Cours suivis</h3>
          {selected.enrolledCourses.map(cid => {
            const c = courses.find(x=>x.id===cid); if (!c) return null
            const pct = selected.progress?.[cid] || 0
            return (
              <div key={cid} style={{ marginBottom:12, padding:'10px 14px', borderRadius:10, background:'var(--bg-primary)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-primary)' }}>{c.title}</span>
                  <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--accent)' }}>{pct}%</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:3, background:`linear-gradient(90deg,var(--accent),${pct===100?'#10B981':'var(--accent)'})`, width:`${pct}%`, transition:'width 0.6s' }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="plat-table-wrap">
          <table className="plat-table">
            <thead><tr><th>Étudiant</th><th>Email</th><th>Ville</th><th>Cours</th><th>Inscription</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)} style={{ cursor:'pointer' }}>
                  <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><div className="plat-student-mini-av">{s.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>{s.name}</div></td>
                  <td style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{s.email}</td>
                  <td>{s.city||'–'}</td>
                  <td><span className="plat-tag">{s.enrolledCourses.length} cours</span></td>
                  <td style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{dateFR(s.joinedAt)}</td>
                  <td><StatusBadge status={s.status==='active'?'published':'draft'} /></td>
                  <td>›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Instructors ───────────────────────────────────────────────────────────────
function InstructorsSection({ ctx }) {
  const { instructors, setInstructors, courses, showNotif } = ctx
  const [editing, setEditing] = useState(null)

  function save(data) {
    if (data.id) { const n=instructors.map(x=>x.id===data.id?data:x); setInstructors(n); ss(K.instructors,n) }
    else { const n=[{...data,id:uid(),courses:[],rating:0,students:0},...instructors]; setInstructors(n); ss(K.instructors,n) }
    showNotif('✓ Formateur enregistré'); setEditing(null)
  }

  if (editing !== null) return (
    <div className="plat-fade plat-form-wrap">
      <button className="plat-back-btn" onClick={() => setEditing(null)}>← Retour</button>
      <h2 className="plat-section-h">{editing?.id?'Modifier le formateur':'Nouveau formateur'}</h2>
      <InstructorForm inst={editing||{}} onSave={save} onCancel={() => setEditing(null)} />
    </div>
  )

  return (
    <div className="plat-fade">
      <div className="plat-toolbar">
        <h2 className="plat-section-h" style={{ margin:0 }}>👨‍🏫 Formateurs ({instructors.length})</h2>
        <button className="plat-btn-primary" onClick={() => setEditing({})}>+ Nouveau formateur</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {instructors.map(f => {
          const fCourses = courses.filter(c=>f.courses.includes(c.id))
          return (
            <div key={f.id} className="plat-card">
              <div style={{ display:'flex', gap:14, marginBottom:12 }}>
                <div className="plat-instructor-avatar">{f.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--text-primary)' }}>{f.name}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{f.email}</div>
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--accent)' }}>⭐ {f.rating||'–'}</span>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>👥 {f.students} élèves</span>
                  </div>
                </div>
              </div>
              {f.bio && <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.6, marginBottom:10 }}>{f.bio}</p>}
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                {(f.expertise||[]).map(e=><span key={e} className="plat-tag">{e}</span>)}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="plat-btn-sm" onClick={() => setEditing(f)}>✏️ Modifier</button>
                <button className="plat-btn-sm danger" onClick={() => { const n=instructors.filter(x=>x.id!==f.id); setInstructors(n); ss(K.instructors,n); showNotif('✓ Supprimé') }}>🗑</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InstructorForm({ inst, onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', bio:'', expertise:[], status:'active', ...inst })
  const p = k => e => setForm(f=>({...f,[k]:e.target.value}))
  const [expInput, setExpInput] = useState('')
  function addExp() { if(expInput.trim()) { setForm(f=>({...f,expertise:[...f.expertise,expInput.trim()]})); setExpInput('') } }
  return (
    <div className="plat-form-grid">
      <div className="plat-form-field"><label>Nom complet *</label><input className="plat-input" value={form.name} onChange={p('name')} /></div>
      <div className="plat-form-field"><label>Email *</label><input className="plat-input" type="email" value={form.email} onChange={p('email')} /></div>
      <div className="plat-form-field"><label>Téléphone</label><input className="plat-input" value={form.phone} onChange={p('phone')} /></div>
      <div className="plat-form-field"><label>Statut</label><select className="plat-input" value={form.status} onChange={p('status')}><option>active</option><option>inactive</option></select></div>
      <div className="plat-form-field plat-span2"><label>Biographie</label><textarea className="plat-input" rows={3} value={form.bio} onChange={p('bio')} style={{ resize:'vertical' }} /></div>
      <div className="plat-form-field plat-span2">
        <label>Expertises</label>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}><input className="plat-input" value={expInput} onChange={e=>setExpInput(e.target.value)} placeholder="Ajouter une expertise" onKeyDown={e=>e.key==='Enter'&&addExp()} style={{ flex:1 }} /><button type="button" className="plat-btn-sm" onClick={addExp}>+</button></div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>{form.expertise.map(e=><span key={e} className="plat-tag" style={{ cursor:'pointer' }} onClick={() => setForm(f=>({...f,expertise:f.expertise.filter(x=>x!==e)}))}>{e} ✕</span>)}</div>
      </div>
      <div className="plat-form-field plat-span2" style={{ display:'flex', gap:10 }}>
        <button className="plat-btn-primary" onClick={() => onSave(form)}>💾 Enregistrer</button>
        <button className="plat-btn-ghost" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

// ── Coworking ─────────────────────────────────────────────────────────────────
function CoworkingSection({ ctx }) {
  const { spaces, setSpaces, bookings, setBookings, showNotif } = ctx
  const [view, setView] = useState('spaces')
  const [selected, setSelected] = useState(null)
  const [bookForm, setBookForm] = useState({ name:'', email:'', phone:'', date:'', start:'08:00', end:'18:00', notes:'' })

  function book() {
    if (!bookForm.name || !bookForm.date) { showNotif('⚠️ Nom et date requis'); return }
    const entry = { id:uid(), spaceId:selected.id, spaceName:selected.name, ...bookForm, status:'confirmed', createdAt:new Date().toISOString() }
    const next = [...bookings, entry]; setBookings(next); ss(K.bookings, next)
    showNotif('✓ Réservation confirmée !'); setSelected(null)
  }

  const SPACE_ICONS = { bureau:'🏢', reunion:'📋', open:'🌐', studio:'🎙️', formation:'🎓' }

  if (selected) return (
    <div className="plat-fade plat-form-wrap">
      <button className="plat-back-btn" onClick={() => setSelected(null)}>← Retour</button>
      <h2 className="plat-section-h">📅 Réserver — {selected.name}</h2>
      <div className="plat-booking-card" style={{ background:`linear-gradient(135deg,${selected.color}22,${selected.color}11)`, borderColor:`${selected.color}44` }}>
        <span style={{ fontSize:'2rem' }}>{SPACE_ICONS[selected.type]||'🏢'}</span>
        <div>
          <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)' }}>{selected.name}</div>
          <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Capacité : {selected.capacity} · {selected.priceHour.toLocaleString()} FCFA/h · {selected.priceDay.toLocaleString()} FCFA/jour</div>
          <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>{selected.features.map(f=><span key={f} className="plat-tag">{f}</span>)}</div>
        </div>
      </div>
      <div className="plat-form-grid" style={{ marginTop:16 }}>
        <div className="plat-form-field"><label>Votre nom *</label><input className="plat-input" value={bookForm.name} onChange={e=>setBookForm(f=>({...f,name:e.target.value}))} /></div>
        <div className="plat-form-field"><label>Email *</label><input className="plat-input" type="email" value={bookForm.email} onChange={e=>setBookForm(f=>({...f,email:e.target.value}))} /></div>
        <div className="plat-form-field"><label>Téléphone</label><input className="plat-input" value={bookForm.phone} onChange={e=>setBookForm(f=>({...f,phone:e.target.value}))} /></div>
        <div className="plat-form-field"><label>Date *</label><input className="plat-input" type="date" value={bookForm.date} min={new Date().toISOString().split('T')[0]} onChange={e=>setBookForm(f=>({...f,date:e.target.value}))} /></div>
        <div className="plat-form-field"><label>Heure de début</label><input className="plat-input" type="time" value={bookForm.start} onChange={e=>setBookForm(f=>({...f,start:e.target.value}))} /></div>
        <div className="plat-form-field"><label>Heure de fin</label><input className="plat-input" type="time" value={bookForm.end} onChange={e=>setBookForm(f=>({...f,end:e.target.value}))} /></div>
        <div className="plat-form-field plat-span2"><label>Notes (optionnel)</label><textarea className="plat-input" rows={2} value={bookForm.notes} onChange={e=>setBookForm(f=>({...f,notes:e.target.value}))} style={{ resize:'vertical' }} /></div>
      </div>
      <button className="plat-btn-primary" style={{ marginTop:16, minWidth:200 }} onClick={book}>✅ Confirmer la réservation</button>
    </div>
  )

  return (
    <div className="plat-fade">
      <div className="plat-toolbar">
        <div style={{ display:'flex', gap:6 }}>
          {[['spaces','🏢 Espaces'],['bookings','📅 Réservations']].map(([v,l])=>(
            <button key={v} className={`plat-tab-btn ${view===v?'active':''}`} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
      </div>

      {view==='spaces' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {spaces.map(s => (
            <div key={s.id} className="plat-space-card" style={{ '--sc':s.color }}>
              <div className="plat-space-hdr">
                <span style={{ fontSize:'2rem' }}>{SPACE_ICONS[s.type]||'🏢'}</span>
                <div>
                  <div className="plat-space-name">{s.name}</div>
                  <div className="plat-space-type">{s.type} · {s.capacity} pers.</div>
                </div>
                <span className={`plat-avail ${s.available?'yes':'no'}`}>{s.available?'Disponible':'Occupé'}</span>
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', margin:'10px 0' }}>
                {s.features.map(f=><span key={f} className="plat-tag" style={{ fontSize:'0.68rem' }}>{f}</span>)}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                  <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{s.priceHour.toLocaleString()} FCFA</span>/h
                  <span style={{ marginLeft:8, color:'var(--text-muted)' }}>· {s.priceDay.toLocaleString()} FCFA/j</span>
                </div>
                <button className="plat-btn-primary" style={{ padding:'6px 14px', fontSize:'0.78rem' }} onClick={() => setSelected(s)}>📅 Réserver</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view==='bookings' && (
        <div className="plat-table-wrap">
          {bookings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <div style={{ fontSize:'3rem', marginBottom:10 }}>📅</div>
              <p>Aucune réservation pour le moment.</p>
            </div>
          ) : (
            <table className="plat-table">
              <thead><tr><th>Espace</th><th>Client</th><th>Date</th><th>Horaires</th><th>Statut</th></tr></thead>
              <tbody>
                {[...bookings].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(b=>(
                  <tr key={b.id}>
                    <td>{b.spaceName}</td>
                    <td><div style={{ fontWeight:600 }}>{b.name}</div><div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{b.email}</div></td>
                    <td>{dateFR(b.date)}</td>
                    <td style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{b.start} – {b.end}</td>
                    <td><StatusBadge status={b.status==='confirmed'?'published':'draft'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Registrations ─────────────────────────────────────────────────────────────
function RegistrationsSection({ ctx }) {
  const { regs, setRegs, showNotif } = ctx
  const [filter, setFilter] = useState('all')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiNote, setAiNote] = useState({})

  const STATUS_OPTIONS = ['pending','contacted','enrolled','declined']
  function updateStatus(id, status) {
    const next = regs.map(r => r.id===id ? {...r,status} : r)
    setRegs(next); showNotif('✓ Statut mis à jour')
  }

  const filtered = filter==='all' ? regs : regs.filter(r=>r.status===filter)

  async function generateAINote(reg) {
    setAiLoading(reg.id)
    try {
      const note = await callGroq(`Tu es un conseiller en formation. Rédige un email de réponse personnalisé et chaleureux en français (max 100 mots) pour cette pré-inscription:\nNom: ${reg.name}\nRôle: ${reg.role}\nIntérêt: ${reg.interest}\nMessage: ${reg.message||'(pas de message)'}\nL'email doit être professionnel, encourager l'inscription et mentionner les avantages d'Arkel Up Center.`, { maxTokens:200, temperature:0.7 })
      setAiNote(n=>({...n,[reg.id]:note}))
    } catch { showNotif('Erreur IA') }
    setAiLoading(null)
  }

  return (
    <div className="plat-fade">
      <div className="plat-toolbar">
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['all','Toutes'],['pending','En attente'],['contacted','Contactés'],['enrolled','Inscrits'],['declined','Refusés']].map(([v,l])=>(
            <button key={v} className={`plat-tab-btn ${filter===v?'active':''}`} onClick={() => setFilter(v)}>
              {l} {v==='pending' && regs.filter(r=>r.status==='pending').length > 0 && <span className="plat-count-badge">{regs.filter(r=>r.status==='pending').length}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.length===0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)' }}>Aucune inscription dans cette catégorie.</div>}
        {filtered.map(r => (
          <div key={r.id} className="plat-card" style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div className="plat-reg-avatar">{r.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                <span style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--text-primary)' }}>{r.name}</span>
                <span className="plat-tag" style={{ fontSize:'0.68rem' }}>{r.role}</span>
                <StatusBadge status={r.status==='enrolled'?'published':r.status==='pending'?'draft':r.status==='contacted'?'archived':'archived'} label={r.status} />
              </div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:6 }}>
                <span>✉️ {r.email}</span>
                {r.phone && <span>📞 {r.phone}</span>}
                <span>🎯 {r.interest}</span>
                <span>📅 {dateFR(r.createdAt)}</span>
              </div>
              {r.message && <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', margin:'0 0 8px', lineHeight:1.5, fontStyle:'italic' }}>"{r.message}"</p>}
              {aiNote[r.id] && (
                <div style={{ background:'color-mix(in srgb,var(--accent) 6%,transparent)', border:'1px solid color-mix(in srgb,var(--accent) 20%,transparent)', borderRadius:10, padding:'10px 14px', fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.6, marginBottom:8, whiteSpace:'pre-line' }}>
                  {aiNote[r.id]}
                </div>
              )}
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                <select className="plat-select" style={{ padding:'5px 10px', fontSize:'0.78rem' }} value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}>
                  {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <a href={`mailto:${r.email}`} className="plat-btn-sm" style={{ textDecoration:'none' }}>✉️ Email</a>
                {r.phone && <a href={`tel:${r.phone}`} className="plat-btn-sm" style={{ textDecoration:'none' }}>📞 Appeler</a>}
                <button className="plat-btn-sm" disabled={aiLoading===r.id} onClick={() => generateAINote(r)}>
                  {aiLoading===r.id?'⏳ IA…':'🤖 Réponse IA'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsSection({ ctx }) {
  const { courses, students, instructors, spaces, regs } = ctx
  function exportData(key, filename) {
    const data = ls(key, [])
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click()
  }
  return (
    <div className="plat-fade">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
        <div className="plat-card">
          <h3 className="plat-card-title">📊 Statistiques globales</h3>
          {[['Cours total',courses.length],['Étudiants',students.length],['Formateurs',instructors.length],['Espaces coworking',spaces.length],['Inscriptions',regs.length],['Préinscrits',ls(K.preregs,[]).length]].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'0.85rem' }}>
              <span style={{ color:'var(--text-secondary)' }}>{l}</span>
              <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="plat-card">
          <h3 className="plat-card-title">💾 Export des données</h3>
          <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:14 }}>Exportez vos données en JSON pour sauvegarde ou migration.</p>
          {[['📚 Cours',K.courses,'arkel_cours.json'],['🎓 Étudiants',K.students,'arkel_etudiants.json'],['📝 Inscriptions',K.regs,'arkel_inscriptions.json'],['📋 Programmes',K.programs,'arkel_programmes.json']].map(([l,k,f])=>(
            <button key={k} className="plat-btn-ghost" style={{ width:'100%', marginBottom:8, justifyContent:'flex-start', gap:10 }} onClick={() => exportData(k,f)}>{l}</button>
          ))}
        </div>
        <div className="plat-card">
          <h3 className="plat-card-title">🏛️ Informations plateforme</h3>
          {[['Plateforme','Arkel Up Center'],['Version','1.0.0'],['Localisation','Dakar, Sénégal'],['Contact','contact@arkelup.sn']].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'0.85rem' }}>
              <span style={{ color:'var(--text-secondary)' }}>{l}</span>
              <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CAT_COLORS = { Business:'#8B5CF6', Tech:'#3B82F6', Finance:'#10B981', Marketing:'#F59E0B', Management:'#EC4899', Juridique:'#6366F1', Santé:'#EF4444', RH:'#14B8A6' }

function StatusBadge({ status, label }) {
  const cfg = {
    published:{ bg:'rgba(16,185,129,0.12)', color:'#10B981', text: label || 'Publié' },
    draft:    { bg:'rgba(245,158,11,0.12)',  color:'#F59E0B', text: label || 'Brouillon' },
    archived: { bg:'rgba(100,116,139,0.12)', color:'#64748B', text: label || 'Archivé' },
    pending:  { bg:'rgba(245,158,11,0.12)',  color:'#F59E0B', text: label || 'En attente' },
    contacted:{ bg:'rgba(59,130,246,0.12)',  color:'#3B82F6', text: label || 'Contacté' },
    enrolled: { bg:'rgba(16,185,129,0.12)',  color:'#10B981', text: label || 'Inscrit' },
    declined: { bg:'rgba(239,68,68,0.12)',   color:'#EF4444', text: label || 'Refusé' },
    confirmed:{ bg:'rgba(16,185,129,0.12)',  color:'#10B981', text: label || 'Confirmé' },
  }
  const c = cfg[status] || cfg.draft
  return <span style={{ padding:'2px 10px', borderRadius:100, fontSize:'0.68rem', fontWeight:700, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>{c.text}</span>
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════════════

const PLATFORM_CSS = `
@keyframes platFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.plat-fade { animation:platFade 0.25s ease-out }

/* Toast */
.plat-toast {
  position:fixed;top:calc(var(--navbar-total-h,60px)+16px);right:20px;z-index:9999;
  padding:10px 18px;border-radius:12px;background:rgba(16,185,129,0.15);
  border:1px solid rgba(16,185,129,0.35);color:#10B981;font-weight:600;font-size:0.85rem;
  backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(0,0,0,0.2);
}

/* Sidebar */
.plat-sidebar {
  background:linear-gradient(180deg,#0d0621 0%,#1a0a3d 60%,#150d35 100%);
  border-right:1px solid rgba(168,85,247,0.15);
  display:flex;flex-direction:column;transition:width 0.3s cubic-bezier(0.4,0,0.2,1);
  flex-shrink:0;overflow:hidden;min-height:100vh;
  position:sticky;top:0;height:100vh;
}
.plat-sidebar.open  { width:220px }
.plat-sidebar.closed{ width:64px }
.plat-sidebar-logo {
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  border-bottom:1px solid rgba(168,85,247,0.12);
  transition:padding 0.3s;
}
.plat-sidebar.open  .plat-sidebar-logo { padding:20px 20px 16px; min-height:176px; }
.plat-sidebar.closed .plat-sidebar-logo { padding:11px 0; min-height:64px; }
.plat-sidebar-icon { font-size:1.5rem;flex-shrink:0 }
.plat-sidebar-brand { font-size:0.88rem;font-weight:900;color:#fff;letter-spacing:0.5px;white-space:nowrap }
.plat-nav { flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:3px }
.plat-nav-item {
  display:flex;align-items:center;gap:12px;padding:10px 10px;border-radius:10px;
  border:none;background:transparent;cursor:pointer;font-family:inherit;
  position:relative;transition:all 0.2s;color:rgba(255,255,255,0.55);
  white-space:nowrap;overflow:hidden;
}
.plat-nav-item:hover { background:rgba(168,85,247,0.12);color:rgba(255,255,255,0.85) }
.plat-nav-item.active { background:rgba(168,85,247,0.2);color:#fff;box-shadow:inset 2px 0 0 #A855F7 }
.plat-nav-icon { font-size:1.1rem;flex-shrink:0 }
.plat-nav-label { font-size:0.83rem;font-weight:600 }
.plat-nav-badge {
  position:absolute;right:8px;top:50%;transform:translateY(-50%);
  background:#EF4444;color:#fff;font-size:0.6rem;font-weight:900;
  min-width:16px;height:16px;border-radius:99px;display:flex;align-items:center;justify-content:center;padding:0 4px;
}
.plat-sidebar-footer { padding:16px;border-top:1px solid rgba(168,85,247,0.1) }

/* Main */
.plat-main { flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden }
.plat-header {
  height:64px;display:flex;align-items:center;justify-content:space-between;
  padding:0 24px;border-bottom:1px solid var(--border);background:var(--bg-card);
  position:sticky;top:0;z-index:100;gap:12px;flex-shrink:0;
}
.plat-header-title { font-size:1rem;font-weight:800;color:var(--text-primary);margin:0 }
.plat-menu-btn { width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center }
.plat-admin-badge { padding:4px 12px;border-radius:100px;background:color-mix(in srgb,var(--gold) 12%,transparent);border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);color:var(--gold);font-size:0.72rem;font-weight:800 }
.plat-content { flex:1;overflow-y:auto;padding:24px;background:var(--bg-primary) }

/* Dashboard */
.plat-grid-auto { display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px }
.plat-metric-card {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border);border-radius:16px;padding:20px;
  display:flex;gap:14px;align-items:flex-start;
  border-top:3px solid var(--mc,var(--accent));
  transition:transform 0.2s;
}
.plat-metric-card:hover { transform:translateY(-2px) }
.plat-metric-icon { font-size:1.6rem }
.plat-metric-val { font-size:1.6rem;font-weight:900;color:var(--text-primary);line-height:1 }
.plat-metric-label { font-size:0.78rem;font-weight:700;color:var(--text-secondary);margin-top:4px }
.plat-metric-sub { font-size:0.68rem;color:var(--text-muted);margin-top:3px }
.plat-card { background:color-mix(in srgb,var(--bg-card) 92%,transparent);border:1px solid var(--border);border-radius:16px;padding:20px }
.plat-card-wide { grid-column:1/-1 }
@media(min-width:1100px) { .plat-card-wide { grid-column:span 2 } }
.plat-card-title { font-size:0.82rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin:0 0 16px }
.plat-row-item { display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border) }
.plat-row-item:last-child { border-bottom:none }
.plat-row-icon { width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0 }
.plat-row-name { font-size:0.85rem;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
.plat-row-sub { font-size:0.72rem;color:var(--text-muted) }

/* Toolbar */
.plat-toolbar { display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:20px }
.plat-search { flex:1;min-width:180px;padding:10px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);font-size:0.88rem;outline:none;font-family:inherit }
.plat-search:focus { border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 10%,transparent) }
.plat-select { padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);font-size:0.82rem;outline:none;cursor:pointer;font-family:inherit }

/* Buttons */
.plat-btn-primary { padding:10px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#A855F7,#6366F1);color:#fff;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 4px 12px rgba(168,85,247,0.28);display:inline-flex;align-items:center;justify-content:center;gap:6px }
.plat-btn-primary:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 18px rgba(168,85,247,0.4) }
.plat-btn-primary:disabled { opacity:0.45;cursor:not-allowed }
.plat-btn-ghost { padding:10px 16px;border-radius:10px;border:1.5px solid var(--border);background:transparent;color:var(--text-secondary);font-size:0.82rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;display:inline-flex;align-items:center;justify-content:center;gap:6px }
.plat-btn-ghost:hover { border-color:var(--accent);color:var(--accent) }
.plat-btn-sm { padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.18s;white-space:nowrap;text-align:center }
.plat-btn-sm:hover:not(:disabled) { border-color:var(--accent);color:var(--accent) }
.plat-btn-sm.danger:hover { border-color:rgba(239,68,68,0.4);color:#EF4444;background:rgba(239,68,68,0.06) }
.plat-tab-btn { padding:8px 16px;border-radius:9px;border:1.5px solid var(--border);background:transparent;color:var(--text-secondary);font-size:0.82rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;white-space:nowrap;display:inline-flex;align-items:center;gap:6px }
.plat-tab-btn.active { border-color:#A855F7;background:rgba(168,85,247,0.12);color:#A855F7 }
.plat-count-badge { background:#EF4444;color:#fff;font-size:0.6rem;font-weight:900;min-width:16px;height:16px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px }

/* Courses */
.plat-course-card { background:var(--bg-card);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s }
.plat-course-card:hover { transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,0.12) }
.plat-course-hdr { padding:20px;display:flex;flex-direction:column;gap:6px }
.plat-course-cat { display:inline-block;padding:3px 10px;border-radius:100px;background:rgba(255,255,255,0.18);color:#fff;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;align-self:flex-start }
.plat-course-title { font-size:1rem;font-weight:900;color:#fff;line-height:1.25 }
.plat-course-instructor { font-size:0.78rem;color:rgba(255,255,255,0.7) }
.plat-course-body { padding:16px }
.plat-course-meta { display:flex;gap:10px;flex-wrap:wrap }
.plat-course-meta span { font-size:0.72rem;color:var(--text-muted);font-weight:600 }

/* Forms */
.plat-form-wrap { max-width:800px }
.plat-form-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px }
@media(max-width:640px) { .plat-form-grid { grid-template-columns:1fr } }
.plat-form-field { display:flex;flex-direction:column;gap:5px }
.plat-form-field label { font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px }
.plat-span2 { grid-column:span 2 }
.plat-input { padding:10px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);font-size:0.88rem;outline:none;font-family:inherit;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;width:100% }
.plat-input:focus { border-color:#A855F7;box-shadow:0 0 0 3px rgba(168,85,247,0.12) }
.plat-input::placeholder { color:var(--text-muted) }
.plat-section-h { font-size:1.1rem;font-weight:900;color:var(--text-primary);margin:0 0 20px }
.plat-back-btn { display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);font-size:0.82rem;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:18px;transition:all 0.2s }
.plat-back-btn:hover { border-color:var(--accent);color:var(--accent) }

/* Detail */
.plat-detail-hero { border-radius:14px;padding:24px;margin-bottom:20px;display:flex;flex-direction:column;gap:8px }
.plat-detail-body { padding:4px 0 }
.plat-detail-stats { display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px }
.plat-mini-stat { display:flex;gap:6px;align-items:center;padding:6px 12px;border-radius:9px;background:var(--bg-card);border:1px solid var(--border);font-size:0.8rem;font-weight:600;color:var(--text-secondary) }
.plat-chapter { background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:10px }
.plat-chapter-title { font-weight:700;font-size:0.88rem;color:var(--text-primary);margin-bottom:8px }
.plat-lesson { padding:5px 0 5px 12px;font-size:0.82rem;color:var(--text-secondary);border-left:2px solid var(--border) }

/* Students */
.plat-table-wrap { background:var(--bg-card);border:1px solid var(--border);border-radius:16px;overflow:hidden }
.plat-table { width:100%;border-collapse:collapse }
.plat-table th { padding:12px 16px;background:var(--bg-primary);font-size:0.72rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;text-align:left;border-bottom:1px solid var(--border) }
.plat-table td { padding:12px 16px;font-size:0.85rem;color:var(--text-primary);border-bottom:1px solid var(--border) }
.plat-table tr:last-child td { border-bottom:none }
.plat-table tr:hover td { background:color-mix(in srgb,var(--accent) 4%,transparent) }
.plat-student-avatar { width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#A855F7,#6366F1);display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:900;color:#fff;flex-shrink:0 }
.plat-student-mini-av { width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#A855F7,#6366F1);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:900;color:#fff;flex-shrink:0 }
.plat-student-profile { display:flex;gap:16px;align-items:center;margin-bottom:16px;padding:20px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border) }
.plat-detail-row { display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:0.85rem }
.plat-dr-label { color:var(--text-secondary) }
.plat-dr-val { font-weight:600;color:var(--text-primary) }

/* Instructors */
.plat-instructor-avatar { width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#6366F1,#A855F7);display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:900;color:#fff;flex-shrink:0 }

/* Coworking */
.plat-space-card { background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:20px;border-top:3px solid var(--sc,var(--accent));transition:transform 0.2s }
.plat-space-card:hover { transform:translateY(-3px) }
.plat-space-hdr { display:flex;gap:12px;align-items:flex-start;margin-bottom:10px }
.plat-space-name { font-size:0.95rem;font-weight:800;color:var(--text-primary) }
.plat-space-type { font-size:0.72rem;color:var(--text-muted);text-transform:capitalize }
.plat-avail { padding:3px 10px;border-radius:100px;font-size:0.68rem;font-weight:700;white-space:nowrap }
.plat-avail.yes { background:rgba(16,185,129,0.12);color:#10B981 }
.plat-avail.no  { background:rgba(239,68,68,0.12);color:#EF4444 }
.plat-booking-card { display:flex;gap:14px;padding:16px;border-radius:12px;border:1.5px solid;margin-bottom:16px;align-items:flex-start }

/* Registrations */
.plat-reg-avatar { width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);display:flex;align-items:center;justify-content:center;font-size:0.82rem;font-weight:900;color:#fff;flex-shrink:0;margin-top:2px }

/* Tags */
.plat-tag { padding:3px 9px;border-radius:100px;font-size:0.68rem;font-weight:700;background:color-mix(in srgb,var(--accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);color:var(--text-secondary);white-space:nowrap }

/* Misc */
.plat-section-h { font-size:1.1rem;font-weight:900;color:var(--text-primary) }
`
