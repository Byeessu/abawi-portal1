// Arche décorative — Palette officielle : Vert + Or (zéro violet)
export default function ArkelUpArch() {
  return (
    <svg
      className="au-arch-svg"
      viewBox="0 0 900 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        {/* Pierre verte — colonnes et arc */}
        <linearGradient id="archStone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2E5E35" />
          <stop offset="40%"  stopColor="#1E4228" />
          <stop offset="100%" stopColor="#0F2B18" />
        </linearGradient>

        {/* Reflet gauche — vert clair */}
        <linearGradient id="archEdgeL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#4CAF50" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
        </linearGradient>

        {/* Reflet droit — vert clair */}
        <linearGradient id="archEdgeR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%"   stopColor="#4CAF50" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
        </linearGradient>

        {/* Intérieur de l'arche — halo vert */}
        <linearGradient id="archInnerGlow" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#4CAF50" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.04" />
        </linearGradient>

        {/* Clef de voûte — or */}
        <linearGradient id="keystoneGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#F0B429" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>

        {/* Halo supérieur — vert */}
        <radialGradient id="archGlowTop" cx="50%" cy="30%" r="40%">
          <stop offset="0%"   stopColor="#4CAF50" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
        </radialGradient>

        {/* Architrave — dégradé vert foncé + reflet or */}
        <linearGradient id="archBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2E5E35" />
          <stop offset="100%" stopColor="#163020" />
        </linearGradient>

        <filter id="archBlur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Halo derrière l'arche */}
      <ellipse cx="450" cy="220" rx="300" ry="200" fill="url(#archGlowTop)" filter="url(#archBlur)" />

      {/* ── COLONNE GAUCHE ── */}
      <rect x="120" y="140" width="80" height="380" fill="url(#archStone)" rx="2" />
      <rect x="120" y="140" width="12" height="380" fill="url(#archEdgeL)" rx="2" />
      <rect x="188" y="140" width="10" height="380" fill="rgba(0,0,0,0.25)" />
      {/* Base */}
      <rect x="100" y="490" width="120" height="28" fill="url(#archStone)" rx="3" />
      <rect x="106" y="480" width="108" height="14" fill="url(#archStone)" rx="2" />
      {/* Chapiteau — or */}
      <rect x="100" y="136" width="120" height="18" fill="#1A4020" rx="2" />
      <rect x="108" y="122" width="104" height="16" fill="#F0B429" opacity="0.25" rx="2" />
      {/* Cannelures */}
      {[138, 154, 170, 186].map((x, i) => (
        <line key={i} x1={x} y1="158" x2={x} y2="478" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
      ))}

      {/* ── COLONNE DROITE ── */}
      <rect x="700" y="140" width="80" height="380" fill="url(#archStone)" rx="2" />
      <rect x="700" y="140" width="12" height="380" fill="url(#archEdgeR)" rx="2" />
      <rect x="768" y="140" width="10" height="380" fill="rgba(0,0,0,0.25)" />
      <rect x="680" y="490" width="120" height="28" fill="url(#archStone)" rx="3" />
      <rect x="686" y="480" width="108" height="14" fill="url(#archStone)" rx="2" />
      <rect x="680" y="136" width="120" height="18" fill="#1A4020" rx="2" />
      <rect x="688" y="122" width="104" height="16" fill="#F0B429" opacity="0.25" rx="2" />
      {[718, 734, 750, 766].map((x, i) => (
        <line key={i} x1={x} y1="158" x2={x} y2="478" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
      ))}

      {/* ── ARC PRINCIPAL ── */}
      <path
        d="M120 140 Q120 10 450 10 Q780 10 780 140 L780 140 Q780 140 700 140 Q700 80 450 80 Q200 80 200 140 L120 140 Z"
        fill="url(#archStone)"
      />
      {/* Soulignement intérieur de l'arc — vert clair */}
      <path
        d="M200 140 Q200 80 450 80 Q700 80 700 140"
        stroke="#4CAF50"
        strokeWidth="1.5"
        fill="none"
        opacity="0.45"
      />
      {/* Contour extérieur de l'arc — or subtil */}
      <path
        d="M120 140 Q120 10 450 10 Q780 10 780 140"
        stroke="rgba(240,180,41,0.3)"
        strokeWidth="2"
        fill="none"
      />

      {/* ── INTÉRIEUR DE L'ARCHE (lumière verte) ── */}
      <path
        d="M200 140 Q200 80 450 80 Q700 80 700 140 L700 520 L200 520 Z"
        fill="url(#archInnerGlow)"
      />

      {/* ── CLEF DE VOÛTE — or ── */}
      <path d="M430 10 L470 10 L480 55 L450 70 L420 55 Z" fill="url(#keystoneGrad)" />
      <path d="M436 13 L464 13 L473 52 L450 65 L427 52 Z" fill="rgba(240,180,41,0.18)" />
      <text x="450" y="46" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="18" fontWeight="900" fontFamily="Inter, sans-serif">A</text>

      {/* ── ARCHITRAVE (poutre horizontale) ── */}
      <rect x="120" y="100" width="660" height="28" fill="url(#archBeam)" />
      {/* Filet or sur la poutre */}
      <rect x="120" y="100" width="660" height="3" fill="rgba(240,180,41,0.35)" />
      <rect x="120" y="125" width="660" height="3" fill="rgba(0,0,0,0.2)" />

      {/* ── FRISE — diamants or ── */}
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={160 + i * 52 - 5}
          y={109}
          width={10}
          height={10}
          fill="rgba(240,180,41,0.4)"
          transform={`rotate(45 ${160 + i * 52} 114)`}
        />
      ))}

      {/* ── LIGNE DE SOL — or ── */}
      <line x1="80" y1="518" x2="820" y2="518" stroke="rgba(240,180,41,0.25)" strokeWidth="1.5" />

      {/* ── HALO INTÉRIEUR — vert ── */}
      <path
        d="M204 144 Q204 84 450 84 Q696 84 696 144"
        stroke="rgba(76,175,80,0.35)"
        strokeWidth="3"
        fill="none"
        filter="url(#archBlur)"
      />
    </svg>
  )
}
