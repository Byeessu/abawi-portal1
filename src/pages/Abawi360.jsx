import { useAuth } from '../context/AuthContext'
import './Abawi360.css'
import GradientOrbs from '../components/premium/GradientOrbs'
import SectionReveal from '../components/premium/SectionReveal'
import { Link } from 'react-router-dom'
import ToolInfoPanel from '../components/ToolInfoPanel'
import { 
  CRMIcon, 
  PlanificationIcon, 
  StatistiquesIcon, 
  StudioProIcon, 
  DissecteurIcon, 
  MarketingIcon 
} from '../components/icons/Awabi360Icons'

const MODULES = [
  { id: 'crm', icon: 'crm', label: 'CRM', desc: 'Contacts, pipeline de ventes, suivi clients', color: '#3B82F6', path: '/abawi360/crm', features: ['Contacts illimités', 'Pipeline visuel', 'Rappels WhatsApp', 'Rapports IA'], existing: true },
  { id: 'planification', icon: 'planification', label: 'Planification', desc: 'Projets, tâches, Gantt, équipes', color: '#8B5CF6', path: '/abawi360/planification', features: ['Gantt interactif', 'Gestion équipes', 'OKR & KPI', 'Suivi budget'], existing: true },
  { id: 'statistiques', icon: 'statistiques', label: 'Statistiques', desc: 'Formulaires, collecte, analyse IA', color: '#18A84A', path: '/abawi360/statistiques', features: ['Formulaires custom', 'Tableaux de bord', 'Analyse IA', 'Export PDF'], existing: true },
  { id: 'abawi-studio', icon: 'studio', label: 'ABAWI Studio Pro', desc: 'Audio->texte, texte->audio, mastering, voix, musique et video podcast', color: '#14B8A6', path: '/abawi360/studio-pro', features: ['Transcription IA', 'Voix premium', 'Mastering auto', 'Export reels'], existing: true },
  { id: 'dissecteur-elite', icon: 'dissecteur', label: "Disséqueur d'infos Elite", desc: 'URL/PDF/Word/Audio vers fiches, quiz, flashcards, slides et rapports', color: '#F59E0B', path: '/abawi360/dissecteur-elite', features: ['Analyse approfondie', 'Flashcards', 'Quiz auto', 'Rapport structuré'], existing: true },
  { id: 'marketing', icon: 'marketing', label: 'Marketing 360', desc: 'Campagnes, réseaux sociaux, ROI', color: '#EC4899', path: '/abawi360/marketing', features: ['Calendrier éditorial', 'Textes IA', 'Suivi ROI', 'Rapports réseaux'], existing: true },
]

// Map des icônes pour rendu
const ICON_MAP = {
  crm: CRMIcon,
  planification: PlanificationIcon,
  statistiques: StatistiquesIcon,
  studio: StudioProIcon,
  dissecteur: DissecteurIcon,
  marketing: MarketingIcon,
}

export default function Abawi360() {
  const { isMember, isAdmin } = useAuth()
  return (
    <div className="abawi360-page" style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <div className="abawi360-hero" style={{
        position: 'relative',
        background: 'var(--gradient-hero)',
        border: '1px solid var(--border)',
        borderRadius: '28px',
        padding: 'clamp(32px, 5vw, 56px) clamp(24px, 4vw, 48px)',
        marginBottom: '40px',
        textAlign: 'center',
        overflow: 'hidden',
        boxShadow: '0 24px 80px var(--accent3)',
      }}>
        <GradientOrbs variant="purple" intensity={0.6} count={4} />

        <div style={{ position: 'absolute', top: 18, right: 22, opacity: 0.06, transform: 'rotate(-12deg)', pointerEvents: 'none', color: 'var(--accent3)' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2L12 22M2 12L22 12"/>
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 24, opacity: 0.06, transform: 'rotate(15deg)', pointerEvents: 'none', color: 'var(--accent2)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionReveal as="div" delay={0} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '100px', background: 'var(--gold-glow)', border: '1px solid var(--gold-border)', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '2px', backdropFilter: 'blur(8px)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            ABAWI 360 · ÉCOSYSTÈME PREMIUM
          </SectionReveal>
          <SectionReveal as="h1" delay={120} style={{ fontSize: 'clamp(2.1rem, 4.6vw, 3.4rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.5px', lineHeight: 1.05 }}>
            Gérez votre Business <span style={{ background: 'linear-gradient(135deg, var(--accent3), var(--accent) 50%, var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>à 360°</span>
          </SectionReveal>
          <SectionReveal as="p" delay={220} style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            CRM · Planification · Statistiques · Studio Pro · Disséqueur Élite · Marketing — un cockpit unique pour piloter votre activité.
          </SectionReveal>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            {[{ icon: 'rocket', text: '6 modules connectés' }, { icon: 'robot', text: 'IA intégrée' }, { icon: 'chart', text: 'KPI temps réel' }, { icon: 'globe', text: 'Africa-first' }].map((tag) => (
              <span key={tag.text} style={{ padding: '6px 14px', background: 'var(--bg-tag, rgba(255,255,255,0.06))', border: '1px solid var(--border-tag, rgba(139,92,246,0.3))', borderRadius: 100, color: 'var(--text-tag, var(--text-secondary))', fontSize: '0.78rem', fontWeight: 700, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
                  {tag.icon === 'rocket' && <path d="M12 2.5L4 10.5V13.5L12 21.5L20 13.5V10.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5"/>}
                  {tag.icon === 'robot' && <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5"/>}
                  {tag.icon === 'chart' && <path d="M3 17L9 11L13 15L21 7M21 7V13M21 7H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
                  {tag.icon === 'globe' && <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>}
                </svg>
                {tag.text}
              </span>
            ))}
          </div>

          {!isMember && !isAdmin && (
            <Link to="/plans" style={{ display: 'inline-block', padding: '15px 36px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent3), var(--accent))', color: 'var(--text-on-accent)', fontWeight: 800, textDecoration: 'none', boxShadow: '0 12px 32px var(--accent3)', letterSpacing: '0.3px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Accéder à ABAWI 360
            </Link>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {MODULES.map(module => (
          <div key={module.id} className="abawi360-module-card" style={{ background: 'var(--bg-card)', border: `1px solid ${module.coming ? 'var(--border-muted)' : 'var(--border)'}`, borderRadius: '20px', overflow: 'hidden', opacity: module.coming ? 0.6 : 1, transition: 'all 0.3s' }}
            onMouseEnter={e => { if (!module.coming) { e.currentTarget.style.borderColor = module.color; e.currentTarget.style.transform = 'translateY(-4px)' } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = module.coming ? 'var(--border-muted)' : 'var(--border)'; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ padding: '24px', background: `linear-gradient(135deg, ${module.color}15, transparent)`, borderBottom: `1px solid var(--border)`, display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: module.color + '20', border: `1px solid ${module.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {(() => {
                  const IconComponent = ICON_MAP[module.icon]
                  return IconComponent ? <IconComponent color={module.color} size={28} /> : null
                })()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{module.label}</h3>
                  {module.coming && <span style={{ padding: '2px 8px', borderRadius: '100px', background: 'var(--bg-badge)', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>Bientôt</span>}
                  {module.existing && <span style={{ padding: '2px 8px', borderRadius: '100px', background: 'var(--success-bg)', color: 'var(--success-text)', fontSize: '0.65rem', fontWeight: 700 }}>Disponible</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>{module.desc}</p>
              </div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {module.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: module.color }}>✓</span>{f}
                  </div>
                ))}
              </div>
              {module.coming ? (
                <div style={{ padding: '11px', borderRadius: '10px', textAlign: 'center', background: 'var(--bg-muted)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>🚧 En développement</div>
              ) : (
                <Link to={module.path} style={{ display: 'block', padding: '11px', borderRadius: '10px', textAlign: 'center', background: `linear-gradient(135deg, ${module.color}, ${module.color}bb)`, color: 'var(--text-on-accent)', fontWeight: 700, textDecoration: 'none' }}>Accéder →</Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <ToolInfoPanel
        toolName="ABAWI 360"
        icon="🌟"
        description="Suite professionnelle complète de 6 outils pour gérer votre entreprise de A à Z"
        benefits={[
          '6 outils professionnels intégrés (CRM, Marketing, Planification, Statistiques, Studio Pro, Dissecteur)',
          'Interface unifiée et cohérente entre tous les modules',
          'Synchronisation des données entre outils',
          'Tableau de bord centralisé',
          'Export et partage facilités',
          'Mises à jour régulières et améliorations continues',
          'Support premium inclus',
          'Accès à vie une fois souscrit',
        ]}
        howToUse={[
          'Explorez les 6 modules disponibles depuis le tableau de bord',
          'Cliquez sur un outil pour accéder à ses fonctionnalités',
          'Utilisez le CRM pour gérer vos clients et opportunités',
          'Planifiez vos projets avec l\'outil de planification',
          'Analysez vos performances avec les statistiques',
          'Créez du contenu avec le Marketing 360 et Studio Pro',
          'Analysez l\'information avec le Dissecteur',
        ]}
        tips={[
          'Commencez par le module qui correspond à votre besoin immédiat',
          'Les données peuvent être partagées entre certains modules',
          'Utilisez les exportations pour sauvegarder vos données',
          'Chaque outil possède sa propre section "En savoir plus"',
          'L\'abonnement Élite donne accès à tous les outils',
        ]}
      />
    </div>
  )
}
