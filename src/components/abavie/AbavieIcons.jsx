/* ================================================================
   ABAVIE ICONS — SVG medical icon system
   Consistent colored badges for every health section
   ================================================================ */

const ICON_SIZE = 22;
const STROKE = 1.8;

// ── Utility: icon wrapper with colored badge ─────────────────────
export function IconBadge({ children, color = '#10B981', bg, size = 44 }) {
  const background = bg || color + '1A'; // 10% opacity hex
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 12,
        background,
        color,
        flexShrink: 0,
        boxShadow: `0 4px 12px ${color}25`,
      }}
    >
      {children}
    </span>
  );
}

// ── SVG primitives ──────────────────────────────────────────────
function Svg({ children, size = ICON_SIZE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// ── Hospital ──────────────────────────────────────────────────────
export function HospitalIcon(props) { return (
  <Svg {...props}>
    <path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h2v6M13 21v-6h2v6M10 9h4M10 13h4"/>
  </Svg>
);}

// ── Pharmacy / Pill ─────────────────────────────────────────────
export function PharmacyIcon(props) { return (
  <Svg {...props}>
    <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
    <path d="M8.5 8.5l7 7"/>
    <path d="M3 21h18"/>
  </Svg>
);}

// ── Doctor / Stethoscope ─────────────────────────────────────────
export function DoctorIcon(props) { return (
  <Svg {...props}>
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .2.2"/>
    <path d="M8 15v4M8 21h.01M12 21h.01M16 21h.01"/>
    <path d="M19 10a4 4 0 0 1 0 8"/>
  </Svg>
);}

// ── Lab / Flask ───────────────────────────────────────────────────
export function LabIcon(props) { return (
  <Svg {...props}>
    <path d="M9 3h6M10 3v7.5a4.5 4.5 0 1 0 4 0V3"/>
    <path d="M7 21h10"/>
    <path d="M6.8 17h10.4"/>
  </Svg>
);}

// ── Ambulance ─────────────────────────────────────────────────────
export function AmbulanceIcon(props) { return (
  <Svg {...props}>
    <rect x="2" y="7" width="15" height="10" rx="2"/>
    <path d="M17 12h3l2 3v2h-5"/>
    <circle cx="7" cy="17" r="1.5"/>
    <circle cx="17" cy="17" r="1.5"/>
    <path d="M9 10h2v2H9z"/>
    <path d="M6 10v2"/>
    <path d="M13 10v2"/>
  </Svg>
);}

// ── Emergency / Alert ─────────────────────────────────────────────
export function EmergencyIcon(props) { return (
  <Svg {...props}>
    <path d="M10.3 3.3a2.4 2.4 0 0 1 3.4 0l7 7a2.4 2.4 0 0 1 0 3.4l-7 7a2.4 2.4 0 0 1-3.4 0l-7-7a2.4 2.4 0 0 1 0-3.4z"/>
    <path d="M12 8v4M12 16h.01"/>
  </Svg>
);}

// ── Thermometer / Fever ───────────────────────────────────────────
export function ThermometerIcon(props) { return (
  <Svg {...props}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    <path d="M12 15a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
  </Svg>
);}

// ── Headache / Brain ──────────────────────────────────────────────
export function HeadacheIcon(props) { return (
  <Svg {...props}>
    <path d="M12 5a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V16h4v-3.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z"/>
    <path d="M9 16v3M15 16v3M10 19h4"/>
    <path d="M6 9a6 6 0 0 1 12 0"/>
  </Svg>
);}

// ── Cough / Mask ──────────────────────────────────────────────────
export function MaskIcon(props) { return (
  <Svg {...props}>
    <path d="M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z"/>
    <path d="M8 9V7a4 4 0 0 1 8 0v2"/>
    <path d="M9 13h6"/>
  </Svg>
);}

// ── Fatigue / Battery ─────────────────────────────────────────────
export function FatigueIcon(props) { return (
  <Svg {...props}>
    <rect x="2" y="7" width="16" height="10" rx="2"/>
    <path d="M22 11v2"/>
    <path d="M6 11h2M10 11h2"/>
  </Svg>
);}

// ── Stomach / Diarrhea ──────────────────────────────────────────
export function StomachIcon(props) { return (
  <Svg {...props}>
    <path d="M16 4c0-1.1-.9-2-2-2s-2 .9-2 2c0 2-2 3-2 5v4c0 2 2 3 2 5 0 1.1.9 2 2 2s2-.9 2-2"/>
    <path d="M12 10h3M12 14h3"/>
  </Svg>
);}

// ── Rash / Skin ───────────────────────────────────────────────────
export function RashIcon(props) { return (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
  </Svg>
);}

// ── Nausea / Droplet ────────────────────────────────────────────
export function NauseaIcon(props) { return (
  <Svg {...props}>
    <path d="M12 2.7a5.5 5.5 0 0 1 7.8 7.8l-7.8 7.8-7.8-7.8A5.5 5.5 0 0 1 12 2.7z"/>
    <path d="M12 8v4M12 14h.01"/>
  </Svg>
);}

// ── Heart / Cardio ───────────────────────────────────────────────
export function HeartIcon(props) { return (
  <Svg {...props}>
    <path d="M19 14c1.5-1.5 2-3 2-4.5A4.5 4.5 0 0 0 16.5 5c-1.5 0-3 .5-4.5 2-1.5-1.5-3-2-4.5-2A4.5 4.5 0 0 0 3 9.5c0 1.5.5 3 2 4.5l7.5 7.5 7.5-7.5"/>
    <path d="M12 8v4M10 10h4"/>
  </Svg>
);}

// ── Breath / Lungs ──────────────────────────────────────────────
export function LungsIcon(props) { return (
  <Svg {...props}>
    <path d="M6 21a6 6 0 0 1-4-5.6V8a4 4 0 0 1 4-4h2v17z"/>
    <path d="M18 21a6 6 0 0 0 4-5.6V8a4 4 0 0 0-4-4h-2v17z"/>
    <path d="M6 8h12"/>
    <path d="M12 4v17"/>
  </Svg>
);}

// ── Bone / Joint ──────────────────────────────────────────────────
export function BoneIcon(props) { return (
  <Svg {...props}>
    <path d="M16 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 0-3 0 2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 0 3 0"/>
    <path d="M16 15a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 0-3 0 2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 0 3 0"/>
    <path d="M14.5 9l-5 6"/>
  </Svg>
);}

// ── Blood / Drop ──────────────────────────────────────────────────
export function BloodIcon(props) { return (
  <Svg {...props}>
    <path d="M12 2.7a5.5 5.5 0 0 1 7.8 7.8l-7.8 7.8-7.8-7.8A5.5 5.5 0 0 1 12 2.7z"/>
    <path d="M12 8v6"/>
  </Svg>
);}

// ── Thirst / Water ───────────────────────────────────────────────
export function WaterIcon(props) { return (
  <Svg {...props}>
    <path d="M12 2.7a5.5 5.5 0 0 1 7.8 7.8l-7.8 7.8-7.8-7.8A5.5 5.5 0 0 1 12 2.7z"/>
    <path d="M12 11v5"/>
  </Svg>
);}

// ── Detection / Search ────────────────────────────────────────────
export function DetectionIcon(props) { return (
  <Svg {...props}>
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.3-4.3"/>
    <path d="M11 8v6M8 11h6"/>
  </Svg>
);}

// ── Deficiency / Apple ────────────────────────────────────────────
export function NutritionIcon(props) { return (
  <Svg {...props}>
    <path d="M12 8a5 5 0 0 1 5 5c0 2.5-2 5-5 8-3-3-5-5.5-5-8a5 5 0 0 1 5-5z"/>
    <path d="M12 8V5"/>
    <path d="M15 3a3 3 0 0 0-3 2"/>
  </Svg>
);}

// ── Mosquito / Tropical ───────────────────────────────────────────
export function TropicalIcon(props) { return (
  <Svg {...props}>
    <path d="M12 2v20M2 12h4M18 12h4"/>
    <path d="M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8"/>
  </Svg>
);}

// ── Practice / Check ──────────────────────────────────────────────
export function PracticeIcon(props) { return (
  <Svg {...props}>
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </Svg>
);}

// ── Child / Baby ──────────────────────────────────────────────────
export function BabyIcon(props) { return (
  <Svg {...props}>
    <circle cx="12" cy="7" r="4"/>
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
  </Svg>
);}

// ── Environment / Globe ───────────────────────────────────────────
export function GlobeIcon(props) { return (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </Svg>
);}

// ── Sexual / Shield ───────────────────────────────────────────────
export function ShieldIcon(props) { return (
  <Svg {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </Svg>
);}

// ── Vaccine / Syringe ───────────────────────────────────────────
export function VaccineIcon(props) { return (
  <Svg {...props}>
    <path d="M18 2l4 4M16 4l6 6M8 16l-4 4M6 14l-4 4"/>
    <path d="M14.5 7.5L7 15"/>
    <path d="M20 8l-4-4"/>
  </Svg>
);}

// ── Tips / Lightbulb ──────────────────────────────────────────────
export function LightbulbIcon(props) { return (
  <Svg {...props}>
    <path d="M9 18h6M10 22h4"/>
    <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>
  </Svg>
);}

// ── Book / Education ──────────────────────────────────────────────
export function BookIcon(props) { return (
  <Svg {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <path d="M12 6h6M12 10h6"/>
  </Svg>
);}

// ── Document / FileText ───────────────────────────────────────────
export function DocumentIcon(props) { return (
  <Svg {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/>
    <path d="M16 13H8M16 17H8M10 9H8"/>
  </Svg>
);}

// ── Store / ShoppingBag ───────────────────────────────────────────
export function StoreIcon(props) { return (
  <Svg {...props}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <path d="M3 6h18"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </Svg>
);}

// ── AI / Sparkles ────────────────────────────────────────────────
export function SparklesIcon(props) { return (
  <Svg {...props}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    <path d="M5 16l1 2M19 16l-1 2M8 20h8"/>
  </Svg>
);}

// ── Phone ────────────────────────────────────────────────────────
export function PhoneIcon(props) { return (
  <Svg {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1 .5 1.96 1.08 2.83a2 2 0 0 1-.45 2.6l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.6-.45c.87.58 1.83.95 2.83 1.08A2 2 0 0 1 22 16.92z"/>
  </Svg>
);}

// ── MapPin / Location ────────────────────────────────────────────
export function MapPinIcon(props) { return (
  <Svg {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </Svg>
);}

// ── Clock ────────────────────────────────────────────────────────
export function ClockIcon(props) { return (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </Svg>
);}

// ── Bed / Patient ───────────────────────────────────────────────
export function BedIcon(props) { return (
  <Svg {...props}>
    <path d="M2 17v3M2 7v7M22 17v3M6 17h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z"/>
    <path d="M6 11V7a2 2 0 0 1 2-2h2"/>
  </Svg>
);}

// ── Specialty / Activity ──────────────────────────────────────────
export function SpecialtyIcon(props) { return (
  <Svg {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </Svg>
);}

// ── CheckCircle ──────────────────────────────────────────────────
export function CheckCircleIcon(props) { return (
  <Svg {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="M22 4L12 14.01l-3-3"/>
  </Svg>
);}

// ── Moon / Night ──────────────────────────────────────────────────
export function MoonIcon(props) { return (
  <Svg {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </Svg>
);}

// ── TestTube / Experiment ─────────────────────────────────────────
export function TestTubeIcon(props) { return (
  <Svg {...props}>
    <path d="M8 2v14a4 4 0 0 0 8 0V2"/>
    <path d="M6 2h12"/>
    <path d="M10 10h4M10 14h4"/>
  </Svg>
);}

// ── Car / Direction ───────────────────────────────────────────────
export function CarIcon(props) { return (
  <Svg {...props}>
    <path d="M5 17a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/>
    <path d="M5 17h14M3 13h18"/>
    <circle cx="7" cy="17" r="1.5"/>
    <circle cx="17" cy="17" r="1.5"/>
  </Svg>
);}

// ── Map ───────────────────────────────────────────────────────────
export function MapIcon(props) { return (
  <Svg {...props}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <path d="M8 2v16M16 6v16"/>
  </Svg>
);}

// ── Building ──────────────────────────────────────────────────────
export function BuildingIcon(props) { return (
  <Svg {...props}>
    <path d="M3 21h18M5 21V7l8-4 8 4v14"/>
    <path d="M9 21v-6h2v6M13 21v-6h2v6"/>
  </Svg>
);}

// ── Star ──────────────────────────────────────────────────────────
export function StarIcon(props) { return (
  <Svg {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </Svg>
);}
