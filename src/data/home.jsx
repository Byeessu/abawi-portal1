// SVG icons — inline, no external dep, fully scalable
const IconDigital = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26" aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
    <path d="M6 8l3 3-3 3M11 14h6"/>
  </svg>
)

const IconAcademy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>
  </svg>
)

const IconPodcasts = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26" aria-hidden="true">
    <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10a7 7 0 0 1-14 0"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const IconOutils = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26" aria-hidden="true">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/>
    <path d="M13 2.05A10 10 0 0 1 22 12"/>
    <path d="M12 6v6l4 2"/>
    <circle cx="19" cy="5" r="3"/>
    <path d="M17.5 3.5 21.5 7.5"/>
  </svg>
)

const IconAbawi360 = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const IconStore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="26" height="26" aria-hidden="true">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

export const sections = [
  { path: '/digital',  color: 'blue',   Icon: IconDigital,   title: 'Digital',    desc: 'Guides, packs et outils pour booster votre business en ligne.' },
  { path: '/academy',  color: 'green',  Icon: IconAcademy,   title: 'Academy',    desc: 'Formations premium et cours certifiants pour entrepreneurs.' },
  { path: '/podcasts', color: 'purple', Icon: IconPodcasts,  title: 'Podcasts',   desc: 'Émissions inspirantes avec des leaders et experts africains.' },
  { path: '/outils',   color: 'gold',   Icon: IconOutils,    title: 'Outils IA',  desc: 'CV, lettres, business plans, pitch decks — propulsés par IA.' },
  { path: '/abawi360', color: 'teal',   Icon: IconAbawi360,  title: 'ABAWI 360',  desc: 'CRM, planification, finance, juridique — tout-en-un.' },
  { path: '/store',    color: 'red',    Icon: IconStore,     title: 'Store',      desc: 'Produits physiques et digitaux de la communauté ABAWI.' },
]

export const stats = [
  { label: 'Membres',      value: '12K+' },
  { label: 'Guides',       value: '150+' },
  { label: 'Pays',         value: '25+'  },
  { label: 'Satisfaction', value: '98%'  },
]
