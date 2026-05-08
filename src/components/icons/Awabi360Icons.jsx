// ═══════════════════════════════════════════════════════════════
// ABAWI 360 - ICONES PROFESSIONNELS SVG
// Remplacent les emojis par des logos vectoriels modernes
// ═══════════════════════════════════════════════════════════════

import React from 'react';

// Style commun pour tous les icones
const iconStyle = {
  width: '100%',
  height: '100%',
  display: 'block',
};

// 👥 CRM - Icône contacts/pipeline
export const CRMIcon = ({ color = '#3B82F6', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.5" fill={`${color}20`}/>
    <path d="M3 18C3 14.5 5 12 9 12C13 12 15 14.5 15 18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth="1.5" fill={`${color}15`}/>
    <path d="M21 16C21 13.5 19.5 12 17 12C14.5 12 13 13.5 13 16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Pipeline indicator */}
    <circle cx="20" cy="19" r="1.5" fill={color}/>
    <circle cx="20" cy="19" r="3" stroke={color} strokeWidth="1" strokeDasharray="2 1" fill="none"/>
  </svg>
);

// 📅 PLANIFICATION - Icône Gantt/calendrier
export const PlanificationIcon = ({ color = '#8B5CF6', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Calendar base */}
    <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" fill={`${color}10`}/>
    <path d="M3 9H21" stroke={color} strokeWidth="1.5"/>
    <path d="M7 2V6M17 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Gantt bars */}
    <rect x="6" y="12" width="4" height="2.5" rx="1" fill={color}/>
    <rect x="6" y="16" width="7" height="2.5" rx="1" fill={`${color}80`}/>
    <rect x="14" y="12" width="4" height="2.5" rx="1" fill={`${color}60`}/>
  </svg>
);

// 📊 STATISTIQUES - Icône analytics/dashboard
export const StatistiquesIcon = ({ color = '#18A84A', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Chart bars */}
    <rect x="4" y="14" width="3.5" height="6" rx="1" fill={`${color}40`} stroke={color} strokeWidth="1"/>
    <rect x="10.25" y="10" width="3.5" height="10" rx="1" fill={`${color}60`} stroke={color} strokeWidth="1"/>
    <rect x="16.5" y="6" width="3.5" height="14" rx="1" fill={color} stroke={color} strokeWidth="1"/>
    {/* Trend line */}
    <path d="M5 11L9 8L13 9L17 5L20 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="6" r="1.5" fill={color}/>
  </svg>
);

// 🎙️ STUDIO PRO - Icône audio/microphone
export const StudioProIcon = ({ color = '#14B8A6', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Microphone */}
    <rect x="8" y="3" width="8" height="11" rx="4" stroke={color} strokeWidth="1.5" fill={`${color}15`}/>
    <path d="M12 14V19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 17C8 19.5 9.5 21 12 21C14.5 21 16 19.5 16 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Sound waves */}
    <path d="M6 11C6 11 5 13 6 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <path d="M18 11C18 11 19 13 18 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    {/* AI sparkle */}
    <path d="M20 4L21 6L23 7L21 8L20 10L19 8L17 7L19 6L20 4Z" fill={color}/>
  </svg>
);

// 🧠 DISSECTEUR ELITE - Icône cerveau/analyse
export const DissecteurIcon = ({ color = '#F59E0B', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Brain/Analysis circle */}
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" fill={`${color}10`}/>
    {/* Neural connections */}
    <circle cx="12" cy="8" r="2" fill={color}/>
    <circle cx="8" cy="13" r="1.5" fill={`${color}80`}/>
    <circle cx="16" cy="13" r="1.5" fill={`${color}80`}/>
    <circle cx="12" cy="17" r="1.5" fill={color}/>
    {/* Connections */}
    <path d="M12 10V15M12 15L8.5 13M12 15L15.5 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Document lines */}
    <path d="M20 4L22 6M22 6L20 8M22 6H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 📈 MARKETING - Icône marketing/croissance
export const MarketingIcon = ({ color = '#EC4899', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Megaphone/speaker */}
    <path d="M3 8H6L11 4V20L6 16H3C2.5 16 2 15.5 2 15V9C2 8.5 2.5 8 3 8Z" stroke={color} strokeWidth="1.5" fill={`${color}15`}/>
    <path d="M14 9C15.5 9.5 16.5 10.5 16.5 12C16.5 13.5 15.5 14.5 14 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Growth chart */}
    <path d="M17 7L21 7L21 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 7L17 11L15 9L13 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Target dot */}
    <circle cx="18" cy="16" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="18" cy="16" r="1" fill={color}/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// ICONES DES OUTILS PRINCIPAUX
// ═══════════════════════════════════════════════════════════════

// TONTINE - Icône monnaie/cycle
export const TontineIcon = ({ color = '#F59E0B', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Cycle arrow */}
    <path d="M20 12C20 16.5 16.5 20 12 20C7.5 20 4 16.5 4 12C4 7.5 7.5 4 12 4C15 4 17.5 5.5 19 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M20 4V8H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Coins */}
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill={`${color}20`}/>
    <text x="12" y="13.5" textAnchor="middle" fontSize="5" fill={color} fontWeight="bold">$</text>
  </svg>
);

// MAXAVIS - Icône sondage/formulaire
export const MaxAvisIcon = ({ color = '#3B82F6', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Clipboard */}
    <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" fill={`${color}10`}/>
    <path d="M9 3V2C9 1.5 9.5 1 10 1H14C14.5 1 15 1.5 15 2V3" stroke={color} strokeWidth="1.5"/>
    {/* Checkmarks */}
    <circle cx="8.5" cy="8.5" r="1" fill={color}/>
    <path d="M11 8.5H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8.5" cy="12.5" r="1" fill={color}/>
    <path d="M11 12.5H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Bar chart on clipboard */}
    <rect x="8" y="16" width="8" height="2" rx="1" fill={color}/>
  </svg>
);

// SMART WORD - Icône document/editeur
export const SmartWordIcon = ({ color = '#8B5CF6', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* Document */}
    <path d="M14 2H6C5.5 2 5 2.5 5 3V21C5 21.5 5.5 22 6 22H18C18.5 22 19 21.5 19 21V8L14 2Z" stroke={color} strokeWidth="1.5" fill={`${color}10`}/>
    <path d="M14 2V8H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Text lines */}
    <path d="M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 16H13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    {/* Pen */}
    <path d="M16.5 14.5L18 13L20 15L18.5 16.5L16.5 14.5Z" fill={color}/>
    <path d="M15 18L16.5 16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ABAWI IA - Icône intelligence artificielle
export const AbawiAIIcon = ({ color = '#8B5CF6', size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ ...iconStyle, width: size, height: size }}>
    {/* AI Brain */}
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" fill={`${color}10`}/>
    {/* Circuit pattern */}
    <circle cx="12" cy="9" r="1.5" fill={color}/>
    <circle cx="9" cy="14" r="1.2" fill={color}/>
    <circle cx="15" cy="14" r="1.2" fill={color}/>
    <path d="M12 10.5V12.5M12 12.5L9.7 13.5M12 12.5L14.3 13.5" stroke={color} strokeWidth="1.5"/>
    {/* Sparkle */}
    <path d="M20 3L20.5 4.5L22 5L20.5 5.5L20 7L19.5 5.5L18 5L19.5 4.5L20 3Z" fill={color}/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// COMPOSANT UNIVERSEL POUR RENDRE LES ICONES
// ═══════════════════════════════════════════════════════════════

export const ABAWI360Icon = ({ icon, color, size = 24 }) => {
  const icons = {
    crm: CRMIcon,
    planification: PlanificationIcon,
    statistiques: StatistiquesIcon,
    'abawi-studio': StudioProIcon,
    'dissecteur-elite': DissecteurIcon,
    marketing: MarketingIcon,
    tontine: TontineIcon,
    maxavis: MaxAvisIcon,
    smartword: SmartWordIcon,
    'abawi-ia': AbawiAIIcon,
  };

  const IconComponent = icons[icon] || (() => null);
  return <IconComponent color={color} size={size} />;
};

export default {
  CRMIcon,
  PlanificationIcon,
  StatistiquesIcon,
  StudioProIcon,
  DissecteurIcon,
  MarketingIcon,
  TontineIcon,
  MaxAvisIcon,
  SmartWordIcon,
  AbawiAIIcon,
  ABAWI360Icon,
};
