import { useState, useEffect, useMemo } from 'react'
import { SEED_COURSES } from '../../data/arkelCourses'
import ArkelUpLogo from '../../components/icons/ArkelUpLogo'
import ArkelUpArch from './ArkelUpArch'
import CoursePlayer from './CoursePlayer'
import AdminPDFPanel from './AdminPDFPanel'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  CategoryIcon, IconClock, IconBook, IconUsers, IconStar,
  IconLevel, IconArrowRight, IconCheck, IconCheckCircle,
  IconPlus, IconSearch, IconChevronRight, IconGlobe,
  IconBP, IconCertificate, IconRefresh, IconClose,
  IconShield, IconPDF,
} from './ArkelUpIcons'
import './ArkelUp.css'

// ─── Progress helpers ─────────────────────────────────────────────────────────
const PROGRESS_KEY = 'arkelup_progress_v2'
function loadProgress() { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') } catch { return {} } }
function courseProgress(courseId) {
  const p = loadProgress()[courseId]
  if (!p) return 0
  const done = p.completedLessons?.length || 0
  const total = SEED_COURSES.find(c => c.id === courseId)?.chapters?.reduce((s, ch) => s + (ch.lessons?.length || 0), 0) || 1
  return Math.round((done / total) * 100)
}

// ─── Category helpers ─────────────────────────────────────────────────────────
const CAT_COLORS = {
  Business:  { tag:'rgba(168,85,247,0.18)',  color:'#A855F7', thumb:'linear-gradient(135deg,#1a0a3d 0%,#2d1b69 100%)' },
  Tech:      { tag:'rgba(99,102,241,0.18)',   color:'#6366F1', thumb:'linear-gradient(135deg,#0d0037 0%,#1a0a60 100%)' },
  Finance:   { tag:'rgba(240,180,41,0.18)',   color:'#F0B429', thumb:'linear-gradient(135deg,#1a1000 0%,#302000 100%)' },
  Marketing: { tag:'rgba(16,185,129,0.18)',   color:'#10B981', thumb:'linear-gradient(135deg,#001a10 0%,#003020 100%)' },
  Management:{ tag:'rgba(236,72,153,0.18)',   color:'#EC4899', thumb:'linear-gradient(135deg,#1a0018 0%,#2d0028 100%)' },
  Juridique: { tag:'rgba(248,113,113,0.18)',  color:'#F87171', thumb:'linear-gradient(135deg,#1a0000 0%,#2d0808 100%)' },
  RH:        { tag:'rgba(251,146,60,0.18)',   color:'#FB923C', thumb:'linear-gradient(135deg,#1a0800 0%,#2d1200 100%)' },
}
const LEVEL_COLORS = { 'débutant':'#4CAF50', 'intermédiaire':'#F0B429', 'avancé':'#EF4444' }
const LEVELS = { 'débutant':'Débutant', 'intermédiaire':'Intermédiaire', 'avancé':'Avancé' }
function getCat(c) { return CAT_COLORS[c] || CAT_COLORS.Business }

const ALL_CATS = ['Tous', ...Object.keys(CAT_COLORS)]
const ALL_LEVELS = ['Tous niveaux', 'débutant', 'intermédiaire', 'avancé']

// ─── Pre-registration form ─────────────────────────────────────────────────────
function PreRegForm() {
  const [form, setForm] = useState({ nom:'', email:'', role:'Étudiant', interest:'Formation en ligne' })
  const [sent, setSent] = useState(false)
  function submit(e) {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim()) return
    setSent(true)
  }
  if (sent) return (
    <div style={{ textAlign:'center', padding:'32px 20px' }}>
      <div style={{ marginBottom:16, display:'flex', justifyContent:'center' }}>
        <span style={{ width:56, height:56, borderRadius:'50%', background:'rgba(76,175,80,0.18)', border:'2px solid rgba(76,175,80,0.5)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4CAF50' }}>
          <IconCheckCircle size={28} />
        </span>
      </div>
      <div style={{ fontWeight:900, color:'#fff', marginBottom:8, fontSize:'1.1rem' }}>Inscription confirmée !</div>
      <div style={{ color:'rgba(240,244,255,0.6)', fontSize:'0.88rem' }}>Merci {form.nom}. Vous serez notifié(e) dès l'ouverture.</div>
    </div>
  )
  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div className="au-form-row">
        <div className="au-field">
          <label>Prénom & Nom *</label>
          <input className="au-field-input" value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="Votre nom complet" required />
        </div>
        <div className="au-field">
          <label>Email *</label>
          <input className="au-field-input" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="votre@email.com" required />
        </div>
      </div>
      <div className="au-form-row">
        <div className="au-field">
          <label>Profil</label>
          <select className="au-field-input" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
            {['Étudiant','Entrepreneur','Cadre','Reconversion','Autre'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="au-field">
          <label>Intérêt principal</label>
          <select className="au-field-input" value={form.interest} onChange={e => setForm(f=>({...f,interest:e.target.value}))}>
            {['Formation en ligne','Coworking','MBA Executive','Bootcamp Tech','Entrepreneuriat','Tout m\'intéresse'].map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" className="au-btn-primary" style={{ fontSize:'0.9rem', padding:'13px' }}>
        Rejoindre la liste d'attente
      </button>
      <p style={{ textAlign:'center', fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', margin:0 }}>
        100% gratuit · Aucun engagement · Notification à l'ouverture
      </p>
    </form>
  )
}

// ─── Course Card ─────────────────────────────────────────────────────────────
function CourseCard({ course, enrolled, pending, progress, onEnroll, onStart }) {
  const cat = getCat(course.category)
  const pct = progress || 0
  const isComing = course.status !== 'published'
  const isPending = pending
  return (
    <div className="au-course-card" onClick={enrolled ? onStart : undefined} style={isComing ? { opacity: 0.65 } : undefined}>
      {/* Thumbnail */}
      <div className="au-course-card-thumb" style={{ background: cat.thumb }}>
        <span className="au-course-card-tag" style={{ background: cat.tag, color: cat.color }}>{course.category}</span>
        {isComing && (
          <span className="au-course-card-tag" style={{ background: 'rgba(100,100,100,0.5)', color: '#ccc', position:'absolute', top:8, right:8, fontSize:'0.65rem' }}>À venir</span>
        )}
        <span className="au-course-card-level" style={{ display:'flex', alignItems:'center', gap:4 }}>
          <IconLevel size={10} />{course.level}
        </span>
        <span className="au-course-card-emoji" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <CategoryIcon category={course.category} size={38} color={cat.color} />
        </span>
      </div>
      {/* Body */}
      <div className="au-course-card-body">
        <h3 className="au-course-card-title">{course.title}</h3>
        <p className="au-course-card-desc">{course.description}</p>
        <div className="au-course-card-meta">
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><IconClock size={12} />{course.duration}h</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><IconBook size={12} />{course.chapters?.reduce((s,ch)=>s+(ch.lessons?.length||0),0)} leçons</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><IconUsers size={12} />{course.enrolled}+</span>
        </div>
        {enrolled && (
          <div className="au-progress-bar-wrap">
            <div className="au-progress-bar-track"><div className="au-progress-bar-fill" style={{ width:`${pct}%` }} /></div>
            <div className="au-progress-pct">{pct}% complété</div>
          </div>
        )}
        <div className="au-course-card-footer">
          <span className={`au-course-price ${course.price === 0 ? 'au-course-price-free' : ''}`}>
            {course.price === 0 ? 'Gratuit' : `${course.price.toLocaleString('fr-FR')} FCFA`}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span className="au-course-rating" style={{ display:'flex', alignItems:'center', gap:3 }}>
              <IconStar size={11} color="#F0B429" filled />{course.rating}
            </span>
            {enrolled ? (
              <button className="au-course-enroll-btn" onClick={e => { e.stopPropagation(); onStart() }}
                style={{ background: pct === 100 ? 'linear-gradient(135deg,#F0B429,#E8A820)' : undefined, display:'flex', alignItems:'center', gap:5 }}>
                {pct === 0
                  ? <><IconChevronRight size={12} />Commencer</>
                  : pct === 100
                  ? <><IconCertificate size={12} />Revoir</>
                  : <><IconChevronRight size={12} />Continuer</>}
              </button>
            ) : isPending ? (
              <button className="au-course-enroll-btn" disabled style={{ opacity:0.7, cursor:'default', display:'flex', alignItems:'center', gap:5, background:'rgba(245,158,11,0.15)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.3)' }}>
                <IconClock size={11} />En attente
              </button>
            ) : isComing ? (
              <button className="au-course-enroll-btn" disabled style={{ opacity:0.5, cursor:'not-allowed', display:'flex', alignItems:'center', gap:5 }}>
                <IconClock size={11} />À venir
              </button>
            ) : (
              <button className="au-course-enroll-btn" onClick={e => { e.stopPropagation(); onEnroll() }} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <IconPlus size={11} />S'inscrire
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Selected course side panel ───────────────────────────────────────────────
function CourseSidePanel({ course, enrolled, pending, progress, onEnroll, onStart, onClose }) {
  if (!course) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16, padding:32, textAlign:'center' }}>
      <div style={{ opacity:0.25, color:'rgba(240,244,255,0.5)' }}><IconBook size={48} /></div>
      <div style={{ color:'rgba(240,244,255,0.35)', fontSize:'0.88rem', lineHeight:1.6 }}>
        Sélectionnez un cours pour voir les détails et démarrer votre apprentissage.
      </div>
    </div>
  )
  const cat = getCat(course.category)
  const totalLessons = course.chapters?.reduce((s, ch) => s + (ch.lessons?.length || 0), 0) || 0
  const pct = progress || 0
  return (
    <div style={{ height:'100%', overflow:'auto', padding:'24px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ padding:'4px 12px', borderRadius:100, fontSize:'0.68rem', fontWeight:800, background: cat.tag, color: cat.color }}>{course.category}</span>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color: LEVEL_COLORS[course.level] || 'rgba(240,244,255,0.4)', display:'flex', alignItems:'center', gap:4 }}>
            <IconLevel size={11} />{LEVELS[course.level] || course.level}
          </span>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(240,244,255,0.5)', cursor:'pointer', padding:'6px 8px', borderRadius:8, display:'flex', alignItems:'center' }}>
          <IconClose size={14} />
        </button>
      </div>
      {/* Thumb */}
      <div style={{ width:'100%', height:120, borderRadius:14, background: cat.thumb, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
        <CategoryIcon category={course.category} size={44} color={cat.color} />
      </div>
      {/* Title */}
      <h2 style={{ fontSize:'1.05rem', fontWeight:900, color:'#fff', margin:'0 0 8px', lineHeight:1.3 }}>{course.title}</h2>
      <p style={{ fontSize:'0.82rem', color:'rgba(240,244,255,0.6)', lineHeight:1.6, margin:'0 0 16px' }}>{course.description}</p>
      {/* Meta */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        {[
          [<IconClock size={13} />, `${course.duration}h`],
          [<IconBook size={13} />, `${totalLessons} leçons`],
          [<IconUsers size={13} />, `${course.enrolled}+ inscrits`],
          [<IconStar size={13} color="#F0B429" filled />, `${course.rating}/5`],
        ].map(([icon, val], i) => (
          <div key={i} style={{ display:'flex', gap:5, alignItems:'center', fontSize:'0.75rem', color:'rgba(240,244,255,0.5)' }}>
            {icon}<span>{val}</span>
          </div>
        ))}
      </div>
      {/* Instructor */}
      <div style={{ padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:16 }}>
        <div style={{ fontSize:'0.68rem', letterSpacing:1.2, color:'rgba(240,244,255,0.4)', textTransform:'uppercase', marginBottom:6 }}>Formateur</div>
        <div style={{ fontWeight:700, color:'rgba(240,244,255,0.8)', fontSize:'0.85rem' }}>{course.instructor}</div>
      </div>
      {/* Progress */}
      {enrolled && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:'0.72rem', color:'rgba(240,244,255,0.5)' }}>Progression</span>
            <span style={{ fontSize:'0.72rem', fontWeight:800, color: cat.color }}>{pct}%</span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${cat.color}, ${cat.color}aa)`, borderRadius:3, transition:'width 0.5s' }} />
          </div>
        </div>
      )}
      {/* Programme accordion preview */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:'0.72rem', letterSpacing:1.2, color:'rgba(240,244,255,0.4)', textTransform:'uppercase', marginBottom:10 }}>Programme ({course.chapters?.length} modules)</div>
        {course.chapters?.slice(0, 3).map((ch, i) => (
          <div key={ch.id} style={{ padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', marginBottom:6 }}>
            <div style={{ fontSize:'0.78rem', fontWeight:700, color:'rgba(240,244,255,0.7)', marginBottom:3 }}>{ch.title}</div>
            <div style={{ fontSize:'0.68rem', color:'rgba(240,244,255,0.35)' }}>{ch.lessons?.length} leçons · {ch.lessons?.reduce((s,l)=>s+l.duration,0)} min</div>
          </div>
        ))}
        {course.chapters?.length > 3 && (
          <div style={{ fontSize:'0.72rem', color:'rgba(240,244,255,0.35)', textAlign:'center', padding:'6px 0' }}>+{course.chapters.length - 3} modules supplémentaires</div>
        )}
      </div>
      {/* CTA */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, position:'sticky', bottom:0, paddingTop:12, background:'linear-gradient(0deg, rgba(8,4,18,1) 60%, transparent)' }}>
        <div style={{ textAlign:'center', marginBottom:4 }}>
          <span style={{ fontSize:'1.2rem', fontWeight:900, color: course.price === 0 ? '#10B981' : '#F0B429' }}>
            {course.price === 0 ? 'Gratuit' : `${course.price.toLocaleString('fr-FR')} FCFA`}
          </span>
        </div>
        {enrolled ? (
          <button className="au-btn-primary" onClick={onStart} style={{ width:'100%', fontSize:'0.95rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {pct === 0
              ? <><IconChevronRight size={16} />Démarrer le cours</>
              : pct === 100
              ? <><IconCertificate size={16} />Voir le certificat</>
              : <><IconChevronRight size={16} />Continuer ({pct}%)</>}
          </button>
        ) : pending ? (
          <button disabled style={{ width:'100%', opacity:0.8, cursor:'default', fontSize:'0.95rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 16px', borderRadius:10, border:'1px solid rgba(245,158,11,0.3)', background:'rgba(245,158,11,0.1)', color:'#F59E0B' }}>
            <IconClock size={16} />Demande en attente de validation admin
          </button>
        ) : course.status !== 'published' ? (
          <button disabled style={{ width:'100%', opacity:0.5, cursor:'not-allowed', fontSize:'0.95rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'rgba(240,244,255,0.5)' }}>
            <IconClock size={16} />À venir — Inscriptions bientôt ouvertes
          </button>
        ) : (
          <>
            <button className="au-btn-primary" onClick={onEnroll} style={{ width:'100%', fontSize:'0.95rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <IconArrowRight size={16} />Demander l'accès
            </button>
            <button className="au-btn-ghost" onClick={onStart} style={{ width:'100%', fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <IconSearch size={14} />Aperçu gratuit
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ArkelUpPage() {
  const { membre, isAdmin } = useAuth()
  const userId = membre?.id || null
  const isLoggedIn = !!userId

  // Admin a accès à tous les cours
  const allCourseIds = useMemo(() => new Set(SEED_COURSES.map(c => c.id)), [])
  const [enrolled, setEnrolled] = useState(new Set())    // course_ids approved by admin
  const [pending, setPending] = useState(new Set())      // course_ids with pending request
  const [progress, setProgress] = useState({})
  const [catFilter, setCatFilter] = useState('Tous')
  const [levelFilter, setLevelFilter] = useState('Tous niveaux')
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [playingCourse, setPlayingCourse] = useState(null)
  const [view, setView] = useState('home') // 'home' | 'catalog'
  const [toastMsg, setToastMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdminPDF, setShowAdminPDF] = useState(false)

  // Load approved + pending enrollments from Supabase
  useEffect(() => {
    const p = {}
    SEED_COURSES.forEach(c => { p[c.id] = courseProgress(c.id) })
    setProgress(p)

    if (!userId) { setLoading(false); return }

    supabase.from('arkelup_enrollments')
      .select('course_id,status')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) { console.error('[ArkelUp] enrollments error:', error); setLoading(false); return }
        const approved = new Set()
        const pend = new Set()
        data.forEach(row => {
          if (row.status === 'approved') approved.add(row.course_id)
          else if (row.status === 'pending') pend.add(row.course_id)
        })
        // Admin = accès complet à tous les cours
        if (isAdmin) {
          SEED_COURSES.forEach(c => approved.add(c.id))
        }
        setEnrolled(approved)
        setPending(pend)
        setLoading(false)
      })
  }, [userId])

  async function enroll(courseId) {
    if (!isLoggedIn) {
      setToastMsg('🔒 Connectez-vous pour demander l\'accès à ce cours')
      setTimeout(() => setToastMsg(null), 4000)
      return
    }
    const course = SEED_COURSES.find(c => c.id === courseId)
    if (!course || course.status !== 'published') {
      setToastMsg('🔒 Ce cours n\'est pas encore ouvert aux inscriptions')
      setTimeout(() => setToastMsg(null), 3000)
      return
    }
    if (pending.has(courseId)) {
      setToastMsg('⏳ Votre demande d\'accès est en attente de validation par l\'admin')
      setTimeout(() => setToastMsg(null), 4000)
      return
    }
    if (enrolled.has(courseId)) {
      setSelectedCourse(course)
      setToastMsg('✅ Vous avez déjà accès à ce cours')
      setTimeout(() => setToastMsg(null), 3000)
      return
    }

    const { error } = await supabase.from('arkelup_enrollments').insert({
      course_id: courseId,
      user_id: userId,
      status: 'pending',
    })

    if (error) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        setToastMsg('⏳ Demande déjà envoyée — en attente de validation')
      } else {
        setToastMsg('❌ Erreur : ' + error.message)
      }
      setTimeout(() => setToastMsg(null), 4000)
      return
    }

    const nextPending = new Set(pending)
    nextPending.add(courseId)
    setPending(nextPending)
    setSelectedCourse(course)
    setToastMsg('📨 Demande envoyée ! L\'admin la validera sous peu.')
    setTimeout(() => setToastMsg(null), 4000)
  }

  function startCourse(course) {
    if (!isLoggedIn) {
      setToastMsg('🔒 Connectez-vous pour accéder au contenu')
      setTimeout(() => setToastMsg(null), 4000)
      return
    }
    if (!enrolled.has(course.id) && !isAdmin) {
      setToastMsg('🔒 Accès réservé. Demandez l\'inscription ou attendez la validation admin.')
      setTimeout(() => setToastMsg(null), 4000)
      return
    }
    setPlayingCourse(course)
  }
  function closePlayer() {
    setPlayingCourse(null)
    const p = {}
    SEED_COURSES.forEach(c => { p[c.id] = courseProgress(c.id) })
    setProgress(p)
  }

  const published = SEED_COURSES.filter(c => c.status === 'published')
  const filtered = SEED_COURSES.filter(c => {
    if (catFilter !== 'Tous' && c.category !== catFilter) return false
    if (levelFilter !== 'Tous niveaux' && c.level !== levelFilter) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.category.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const enrolledCourses = published.filter(c => enrolled.has(c.id))
  const totalEnrolled = published.reduce((s, c) => s + (c.enrolled || 0), 0) + enrolled.size
  const uniqueInstructors = new Set(published.map(c => c.instructorId))
  const stats = [
    { n: published.length, s:'', l:'Cours' },
    { n: totalEnrolled, s:'+', l:'Inscrits' },
    { n: uniqueInstructors.size, s:'+', l:'Formateurs' },
    { n: 7, s:'', l:'Pays' },
  ]

  return (
    <div className="arkelup-root">
      {playingCourse && <CoursePlayer course={playingCourse} onClose={closePlayer} isAdmin={isAdmin} enrolled={enrolled} />}
      {showAdminPDF && isAdmin && <AdminPDFPanel onClose={() => setShowAdminPDF(false)} />}
      {toastMsg && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:9999, background:'rgba(16,185,129,0.95)', color:'#fff', padding:'12px 24px', borderRadius:8, fontWeight:700, fontSize:'0.9rem', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', animation:'fadeInDown 0.3s ease' }}>
          {toastMsg}
        </div>
      )}

      {/* ── HERO ── */}
      {view === 'home' && (
        <div className="arkelup-universe">
          {/* Stars */}
          <div className="au-stars-layer">
            <div className="au-stars-1" /><div className="au-stars-2" /><div className="au-stars-bright" />
            <div className="au-shooting-star" /><div className="au-shooting-star" />
          </div>
          {/* Moon */}
          <div className="au-moon" />
          {/* Ocean */}
          <div className="au-ocean-layer">
            <div className="au-wave au-wave-1" /><div className="au-wave au-wave-2" /><div className="au-wave au-wave-3" />
          </div>
          <div className="au-ocean-reflection" />
          {/* Arch */}
          <div className="au-arch-wrap"><ArkelUpArch /></div>

          {/* Hero content */}
          <div className="au-hero-content">
            <div className="au-hero-eyebrow">
              <span className="au-hero-eyebrow-dot" />
              Ouverture prévue · Dakar, Sénégal
            </div>
            <h1 className="au-hero-title">
              <span className="au-title-arkel">ARKEL</span>{' '}
              <span className="au-title-up">UP</span>
              <span className="au-title-center">CENTER</span>
            </h1>
            <p className="au-hero-tagline">
              Votre Arche de Développement — Formation certifiante, coworking premium et accompagnement startup pour les entrepreneurs et professionnels africains.
            </p>
            <div className="au-hero-ctas">
              <button className="au-btn-primary" onClick={() => setView('catalog')} style={{ display:'flex', alignItems:'center', gap:8 }}>
                Explorer les cours <IconArrowRight size={16} />
              </button>
              <button className="au-btn-ghost" onClick={() => document.getElementById('au-prereg')?.scrollIntoView({ behavior:'smooth' })} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <IconCheckCircle size={16} />Pré-inscription gratuite
              </button>
            </div>
            <div className="au-hero-stats">
              {stats.map(s => (
                <div key={s.l} className="au-stat">
                  <div className="au-stat-n">{s.n}<span>{s.s}</span></div>
                  <div className="au-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CATALOG ── */}
      {(view === 'catalog' || view === 'home') && (
        <div className="au-catalog" id="au-catalog">
          <div className="au-catalog-inner">
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:40 }}>
              <div>
                <div className="au-section-label">Catalogue</div>
                <h2 className="au-section-title">
                  {view === 'catalog' ? 'Tous les cours' : 'Cours disponibles'}
                </h2>
                <p className="au-section-sub">
                  {SEED_COURSES.length} formations certifiantes • Business, Tech, Finance, Marketing et plus
                </p>
              </div>
              {view === 'home' && (
                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  {enrolledCourses.length > 0 && (
                    <span style={{ fontSize:'0.78rem', color:'rgba(16,185,129,0.8)', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', padding:'6px 14px', borderRadius:100, display:'flex', alignItems:'center', gap:6 }}>
                      <IconCheck size={12} />{enrolledCourses.length} cours en cours
                    </span>
                  )}
                  {isAdmin && (
                    <button onClick={() => setShowAdminPDF(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, border:'1px solid rgba(240,180,41,0.35)', background:'rgba(240,180,41,0.08)', color:'#F0B429', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, fontFamily:'inherit', transition:'all 0.2s' }}>
                      <IconShield size={14} /> Supports PDF
                    </button>
                  )}
                  <button className="au-btn-primary" onClick={() => setView('catalog')} style={{ padding:'10px 20px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
                    Voir tout le catalogue <IconArrowRight size={14} />
                  </button>
                </div>
              )}
              {view === 'catalog' && (
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {isAdmin && (
                    <button onClick={() => setShowAdminPDF(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, border:'1px solid rgba(240,180,41,0.35)', background:'rgba(240,180,41,0.08)', color:'#F0B429', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, fontFamily:'inherit', transition:'all 0.2s' }}>
                      <IconShield size={14} /> Supports PDF
                    </button>
                  )}
                  <button className="au-btn-ghost" onClick={() => setView('home')} style={{ padding:'10px 20px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
                    <IconArrowRight size={14} style={{ transform:'rotate(180deg)' }} />Accueil
                  </button>
                </div>
              )}
            </div>

            {/* My courses (if enrolled) */}
            {view === 'catalog' && enrolledCourses.length > 0 && (
              <div style={{ marginBottom:40 }}>
                <div style={{ fontSize:'0.72rem', fontWeight:800, letterSpacing:1.5, color:'#10B981', textTransform:'uppercase', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:20, height:2, background:'#10B981', borderRadius:1, display:'inline-block' }} />
                  Mes cours ({enrolledCourses.length})
                </div>
                <div style={{ display:'flex', gap:10, overflow:'auto', paddingBottom:8 }}>
                  {enrolledCourses.map(c => (
                    <div key={c.id} onClick={() => startCourse(c)} style={{ minWidth:220, padding:'14px 16px', borderRadius:14, background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}
                      onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'}
                      onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}
                    >
                      <div style={{ fontWeight:800, color:'#fff', fontSize:'0.82rem', marginBottom:6, lineHeight:1.3 }}>{c.title}</div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                        <div style={{ height:'100%', width:`${progress[c.id] || 0}%`, background:'linear-gradient(90deg,#10B981,#059669)', borderRadius:2 }} />
                      </div>
                      <div style={{ fontSize:'0.65rem', color:'rgba(16,185,129,0.7)' }}>{progress[c.id] || 0}% · Cliquer pour continuer</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            {view === 'catalog' && (
              <div style={{ marginBottom:28, display:'flex', flexDirection:'column', gap:12 }}>
                <input
                  placeholder="Rechercher un cours..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ padding:'11px 16px', borderRadius:12, border:'1.5px solid rgba(168,85,247,0.2)', background:'rgba(255,255,255,0.04)', color:'#fff', fontFamily:'inherit', fontSize:'0.88rem', outline:'none', maxWidth:400 }}
                />
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <div className="au-filters" style={{ margin:0 }}>
                    {ALL_CATS.map(cat => (
                      <button key={cat} className={`au-filter-btn ${catFilter===cat?'active':''}`} onClick={() => setCatFilter(cat)}>{cat}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Two-column layout: catalog left + detail right */}
            <div style={{ display:'grid', gridTemplateColumns: selectedCourse ? '1fr 340px' : '1fr', gap:24, alignItems:'start' }}>
              {/* Course grid */}
              <div>
                <div className="au-course-grid">
                  {(view === 'home' ? filtered.slice(0, 6) : filtered).map(c => (
                    <CourseCard
                      key={c.id}
                      course={c}
                      enrolled={enrolled.has(c.id)}
                      pending={pending.has(c.id)}
                      progress={progress[c.id]}
                      onEnroll={() => { enroll(c.id); setSelectedCourse(c) }}
                      onStart={() => startCourse(c)}
                    />
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(240,244,255,0.35)' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🔍</div>
                    <div>Aucun cours trouvé pour ces filtres.</div>
                  </div>
                )}
                {view === 'home' && SEED_COURSES.length > 6 && (
                  <div style={{ textAlign:'center', marginTop:32 }}>
                    <button className="au-btn-ghost" onClick={() => setView('catalog')}>
                      Voir tous les {SEED_COURSES.length} cours →
                    </button>
                  </div>
                )}
              </div>

              {/* Side panel: course detail + start button */}
              {selectedCourse && (
                <div style={{ position:'sticky', top:20, background:'rgba(8,4,18,0.95)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:20, overflow:'hidden', maxHeight:'calc(100vh - 80px)', backdropFilter:'blur(20px)' }}>
                  <CourseSidePanel
                    course={selectedCourse}
                    enrolled={enrolled.has(selectedCourse.id)}
                    pending={pending.has(selectedCourse.id)}
                    progress={progress[selectedCourse.id]}
                    onEnroll={() => enroll(selectedCourse.id)}
                    onStart={() => startCourse(selectedCourse)}
                    onClose={() => setSelectedCourse(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PRE-REGISTRATION ── */}
      {view === 'home' && (
        <div className="au-prereg-section" id="au-prereg">
          <div className="au-prereg-inner">
            <div style={{ textAlign:'center', marginBottom:40 }}>
              <div className="au-section-label" style={{ justifyContent:'center' }}>Pré-inscription</div>
              <h2 className="au-section-title">Soyez parmi les premiers</h2>
              <p className="au-section-sub" style={{ margin:'0 auto' }}>
                Rejoignez la liste d'attente et accédez en avant-première à nos cours dès l'ouverture.
              </p>
            </div>
            <div className="au-prereg-card">
              <PreRegForm />
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ padding:'40px 24px', textAlign:'center', borderTop:'1px solid rgba(46,125,50,0.15)', background:'rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom:12, display:'flex', justifyContent:'center' }}>
          <ArkelUpLogo size={180} />
        </div>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', margin:'6px 0' }}>
          Dakar, Sénégal · contact@arkelup.sn
        </p>
        <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.7rem', margin:0 }}>
          © {new Date().getFullYear()} Arkel Up Center by ABAWI — Tous droits réservés
        </p>
      </footer>
    </div>
  )
}
