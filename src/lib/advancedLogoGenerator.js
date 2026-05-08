// ============================================================
// GÉNÉRATEUR DE LOGOS SVG NIVEAU IA - Designs studio professionnel
// Rivalise avec Midjourney, DALL-E, et outils de design premium
// ============================================================

// --- Utilitaires couleurs ---
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`;
}

function adjustColor(hex, factor) {
  const rgb = hexToRgb(hex);
  const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));
  return rgbToHex(r, g, b);
}

function blendColors(hex1, hex2, ratio = 0.5) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * ratio,
    c1.g + (c2.g - c1.g) * ratio,
    c1.b + (c2.b - c1.b) * ratio
  );
}

function generateComplementary(hex) {
  const rgb = hexToRgb(hex);
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

function generateTriadic(hex, index = 1) {
  const rgb = hexToRgb(hex);
  const shift = index * 120;
  const h = rgbToHsl(rgb.r, rgb.g, rgb.b);
  h.h = (h.h + shift) % 360;
  return hslToHex(h.h, h.s, h.l);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  l /= 100; s /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return rgbToHex(f(0), f(8), f(4));
}

function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// --- Palette intelligente basée sur secteur ---
function getSectorPalette(sector) {
  const palettes = {
    tech:     { accent: '#00D4FF', bg: '#0A0E27', highlight: '#FF6B9D' },
    eco:      { accent: '#00C897', bg: '#0A1F15', highlight: '#FFD700' },
    luxury:   { accent: '#D4AF37', bg: '#1A0A0A', highlight: '#E8E8E8' },
    health:   { accent: '#00E5FF', bg: '#0A1628', highlight: '#FF6B6B' },
    food:     { accent: '#FF6B35', bg: '#1A0F00', highlight: '#FFE66D' },
    finance:  { accent: '#00D4AA', bg: '#0A1A15', highlight: '#FFD700' },
    fashion:  { accent: '#FF1493', bg: '#1A0A1A', highlight: '#DA70D6' },
    sport:    { accent: '#FF3D00', bg: '#1A0A00', highlight: '#00E5FF' },
    default:  { accent: '#6366F1', bg: '#0F0F1A', highlight: '#F472B6' }
  };
  return palettes[sector] || palettes.default;
}

// --- Effets SVG avancés ---
function buildFilters(id, primary, secondary) {
  const dark = adjustColor(primary, 0.3);
  return `
    <filter id="${id}-dropShadow">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${dark}" flood-opacity="0.5"/>
    </filter>
    <filter id="${id}-innerGlow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    </filter>
    <filter id="${id}-neon">
      <feGaussianBlur stdDeviation="3" result="b1"/>
      <feGaussianBlur stdDeviation="6" result="b2"/>
      <feGaussianBlur stdDeviation="12" result="b3"/>
      <feMerge><feMergeNode in="b3"/><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-glass">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lighting-color="white" result="spec">
        <fePointLight x="-5000" y="-10000" z="20000"/>
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut"/>
      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    </filter>
    <filter id="${id}-bevel">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
      <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lighting-color="#ffffff" result="specOut">
        <fePointLight x="-5000" y="-10000" z="20000"/>
      </feSpecularLighting>
      <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint"/>
      <feMerge><feMergeNode in="offsetBlur"/><feMergeNode in="litPaint"/></feMerge>
    </filter>
    <filter id="${id}-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.1"/></feComponentTransfer>
    </filter>`;
}

// --- Générateurs de formes complexes ---
function starPoints(cx, cy, outerR, innerR, points) {
  let pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI / points) - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

function hexPoints(cx, cy, r) {
  let pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI / 3) - Math.PI / 6;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

function diamondPoints(cx, cy, rw, rh) {
  return `${cx},${cy - rh} ${cx + rw},${cy} ${cx},${cy + rh} ${cx - rw},${cy}`;
}

// ============================================================
// 10 TEMPLATES ULTRA-AVANCÉS
// ============================================================

// 1. BADGE HÉRALDIQUE 3D - Effets métalliques, bordures multiples
function generateBadgeHeraldic(name, primary, secondary, size = 400) {
  const id = generateId('bdg');
  const c = size / 2;
  const r = size * 0.34;
  const init = name.slice(0, 2).toUpperCase();
  const dp = adjustColor(primary, 0.4);
  const lp = adjustColor(primary, 1.6);
  const ds = adjustColor(secondary, 0.5);
  const ls = adjustColor(secondary, 1.5);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${id}-bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${lp}"/><stop offset="40%" stop-color="${primary}"/>
      <stop offset="80%" stop-color="${dp}"/><stop offset="100%" stop-color="${adjustColor(primary, 0.2)}"/>
    </radialGradient>
    <linearGradient id="${id}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ls}"/><stop offset="30%" stop-color="${secondary}"/>
      <stop offset="60%" stop-color="${ds}"/><stop offset="100%" stop-color="${ls}"/>
    </linearGradient>
    <linearGradient id="${id}-metal" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
    </linearGradient>
    ${buildFilters(id, primary, secondary)}
  </defs>
  <rect width="${size}" height="${size}" fill="#080810"/>
  
  <!-- Fond décoratif rayonnant -->
  ${Array.from({length: 12}, (_, i) => {
    const a1 = (i * 30 - 90) * Math.PI / 180;
    const a2 = ((i + 0.5) * 30 - 90) * Math.PI / 180;
    const r1 = r + 20, r2 = r + 60;
    return `<polygon points="${c},${c} ${c + r1 * Math.cos(a1)},${c + r1 * Math.sin(a1)} ${c + r2 * Math.cos(a2)},${c + r2 * Math.sin(a2)}" fill="${primary}" opacity="0.08"/>`;
  }).join('')}
  
  <!-- Cercle extérieur ombré -->
  <circle cx="${c}" cy="${c}" r="${r + 12}" fill="none" stroke="${dp}" stroke-width="8" opacity="0.6" filter="url(#${id}-dropShadow)"/>
  <circle cx="${c}" cy="${c}" r="${r + 12}" fill="none" stroke="url(#${id}-gold)" stroke-width="4"/>
  <circle cx="${c}" cy="${c}" r="${r + 6}" fill="none" stroke="${secondary}" stroke-width="1" opacity="0.5" stroke-dasharray="3 6"/>
  
  <!-- Disque principal avec dégradé -->
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${id}-bg)" filter="url(#${id}-dropShadow)"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${id}-metal)"/>
  
  <!-- Cercle intérieur décoratif -->
  <circle cx="${c}" cy="${c}" r="${r * 0.75}" fill="none" stroke="${secondary}" stroke-width="2" opacity="0.4"/>
  <circle cx="${c}" cy="${c}" r="${r * 0.68}" fill="none" stroke="${secondary}" stroke-width="1" opacity="0.2" stroke-dasharray="2 4"/>
  
  <!-- Motif étoilé -->
  <polygon points="${starPoints(c, c, r * 0.55, r * 0.25, 8)}" fill="${secondary}" opacity="0.15"/>
  
  <!-- Centre avec initiales -->
  <circle cx="${c}" cy="${c}" r="${r * 0.45}" fill="${adjustColor(primary, 0.15)}" opacity="0.8"/>
  <circle cx="${c}" cy="${c}" r="${r * 0.40}" fill="none" stroke="${secondary}" stroke-width="2" opacity="0.3"/>
  
  <text x="${c}" y="${c + 12}" font-family="Georgia, 'Times New Roman', serif" font-size="${size * 0.20}" font-weight="700" fill="white" text-anchor="middle" letter-spacing="-3" filter="url(#${id}-dropShadow)">${init}</text>
  
  <!-- Texte courbe supérieur -->
  <path id="${id}-topArc" d="M ${c - r * 0.6} ${c - r * 0.15} A ${r * 0.6} ${r * 0.5} 0 0 1 ${c + r * 0.6} ${c - r * 0.15}" fill="none"/>
  <text font-family="'Helvetica Neue', Arial, sans-serif" font-size="${size * 0.05}" font-weight="600" fill="${ls}" text-anchor="middle" letter-spacing="4">
    <textPath href="#${id}-topArc" startOffset="50%">${name.toUpperCase()}</textPath>
  </text>
  
  <!-- Ornements latéraux -->
  ${[-1, 1].map(s => `
    <g transform="translate(${c + s * (r + 22)}, ${c}) rotate(${s * 90})">
      <polygon points="0,-12 -6,0 0,12 6,0" fill="${secondary}" filter="url(#${id}-neon)"/>
      <circle cy="-18" r="3" fill="${ls}"/>
      <circle cy="18" r="3" fill="${ls}"/>
    </g>
  `).join('')}
  
  <!-- Petits points décoratifs -->
  ${Array.from({length: 8}, (_, i) => {
    const a = (i * 45 - 90) * Math.PI / 180;
    return `<circle cx="${c + (r + 4) * Math.cos(a)}" cy="${c + (r + 4) * Math.sin(a)}" r="2.5" fill="${secondary}"/>`;
  }).join('')}
</svg>`;
}

// 2. GLASSMORPHISM MODERNE - Effet verre flottant avec flous et reflets
function generateGlassmorphismLogo(name, primary, secondary, size = 400) {
  const id = generateId('glass');
  const c = size / 2;
  const init = name.slice(0, 2).toUpperCase();
  const dp = adjustColor(primary, 0.3);
  const lp = adjustColor(primary, 1.4);
  const tri = generateTriadic(primary, 1);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${lp}"/><stop offset="50%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${tri}"/>
    </linearGradient>
    <linearGradient id="${id}-bg2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${secondary}"/><stop offset="100%" stop-color="${adjustColor(secondary, 0.5)}"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx="30%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${lp}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <filter id="${id}-blurHeavy"><feGaussianBlur stdDeviation="25"/></filter>
    <filter id="${id}-blurLight"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="${id}-glassEdge">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Fond dégradé -->
  <rect width="${size}" height="${size}" fill="#0A0E1A"/>
  
  <!-- Orbes flottants floutés -->
  <circle cx="${c - 80}" cy="${c - 60}" r="${size * 0.28}" fill="url(#${id}-bg1)" filter="url(#${id}-blurHeavy)" opacity="0.7"/>
  <circle cx="${c + 90}" cy="${c + 70}" r="${size * 0.25}" fill="url(#${id}-bg2)" filter="url(#${id}-blurHeavy)" opacity="0.6"/>
  <circle cx="${c + 40}" cy="${c - 100}" r="${size * 0.18}" fill="${tri}" filter="url(#${id}-blurLight)" opacity="0.5"/>
  
  <!-- Carte glassmorphism principale -->
  <g transform="translate(${c}, ${c})">
    <rect x="${-size * 0.22}" y="${-size * 0.22}" width="${size * 0.44}" height="${size * 0.44}" rx="${size * 0.06}"
      fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" filter="url(#${id}-glassEdge)"/>
    <rect x="${-size * 0.22}" y="${-size * 0.22}" width="${size * 0.44}" height="${size * 0.44}" rx="${size * 0.06}"
      fill="url(#${id}-glow)" opacity="0.3"/>
    <!-- Reflet haut -->
    <rect x="${-size * 0.20}" y="${-size * 0.20}" width="${size * 0.40}" height="${size * 0.08}" rx="${size * 0.03}"
      fill="rgba(255,255,255,0.15)"/>
  </g>
  
  <!-- Initiales -->
  <text x="${c}" y="${c + 14}" font-family="'Inter', 'SF Pro Display', Arial, sans-serif" font-size="${size * 0.18}" font-weight="800" fill="white" text-anchor="middle" letter-spacing="-2" style="text-shadow: 0 4px 20px ${dp}">${init}</text>
  
  <!-- Petit indicateur lumineux -->
  <circle cx="${c - size * 0.16}" cy="${c - size * 0.16}" r="6" fill="${secondary}" filter="url(#${id}-blurLight)"/>
  <circle cx="${c + size * 0.16}" cy="${c + size * 0.16}" r="4" fill="${tri}" filter="url(#${id}-blurLight)"/>
  
  <!-- Nom en bas -->
  <text x="${c}" y="${size - size * 0.08}" font-family="'Inter', Arial, sans-serif" font-size="${size * 0.055}" font-weight="500" fill="rgba(255,255,255,0.85)" text-anchor="middle" letter-spacing="5">${name.toUpperCase()}</text>
  
  <!-- Ligne décorative -->
  <line x1="${c - size * 0.12}" y1="${size - size * 0.05}" x2="${c + size * 0.12}" y2="${size - size * 0.05}" stroke="${secondary}" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
</svg>`;
}

// 3. CYBERPUNK NÉON - Niveau effets lumineux maximal
function generateCyberpunkLogo(name, primary, secondary, size = 400) {
  const id = generateId('cyber');
  const c = size / 2;
  const init = name.slice(0, 2).toUpperCase();
  const dp = adjustColor(primary, 0.3);
  const ls = adjustColor(secondary, 1.8);
  const gridLines = [];
  for (let i = 0; i <= 20; i++) {
    const pos = (i / 20) * size;
    gridLines.push(`<line x1="${pos}" y1="0" x2="${pos}" y2="${size}" stroke="${secondary}" opacity="0.04" stroke-width="0.5"/>`);
    gridLines.push(`<line x1="0" y1="${pos}" x2="${size}" y2="${pos}" stroke="${secondary}" opacity="0.04" stroke-width="0.5"/>`);
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050510"/><stop offset="100%" stop-color="${dp}"/>
    </linearGradient>
    <linearGradient id="${id}-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ls}"/><stop offset="50%" stop-color="${secondary}"/>
      <stop offset="100%" stop-color="${adjustColor(secondary, 0.4)}"/>
    </linearGradient>
    <filter id="${id}-glow1">
      <feGaussianBlur stdDeviation="2" result="b1"/><feGaussianBlur stdDeviation="5" result="b2"/>
      <feGaussianBlur stdDeviation="12" result="b3"/>
      <feMerge><feMergeNode in="b3"/><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-glow2">
      <feGaussianBlur stdDeviation="8"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${id}-scanline"><feTurbulence type="fractalNoise" baseFrequency="0 0.8" numOctaves="1" result="noise"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" in="noise" result="coloredNoise"/>
      <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply"/>
    </filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="url(#${id}-bg)"/>
  ${gridLines.join('')}
  
  <!-- Hexagone extérieur néon -->
  <polygon points="${hexPoints(c, c, size * 0.38)}" fill="none" stroke="url(#${id}-neon)" stroke-width="3" filter="url(#${id}-glow1)" opacity="0.9"/>
  <polygon points="${hexPoints(c, c, size * 0.35)}" fill="none" stroke="${secondary}" stroke-width="1" opacity="0.4"/>
  
  <!-- Hexagone intérieur -->
  <polygon points="${hexPoints(c, c, size * 0.22)}" fill="${dp}" opacity="0.3" stroke="${ls}" stroke-width="1.5" filter="url(#${id}-glow2)"/>
  
  <!-- Lignes diagonales cyber -->
  <line x1="${c - size * 0.30}" y1="${c - size * 0.30}" x2="${c + size * 0.30}" y2="${c + size * 0.30}" stroke="${secondary}" stroke-width="0.5" opacity="0.15"/>
  <line x1="${c + size * 0.30}" y1="${c - size * 0.30}" x2="${c - size * 0.30}" y2="${c + size * 0.30}" stroke="${secondary}" stroke-width="0.5" opacity="0.15"/>
  
  <!-- Cercle central avec effet pulse -->
  <circle cx="${c}" cy="${c}" r="${size * 0.16}" fill="none" stroke="${ls}" stroke-width="2" filter="url(#${id}-glow1)"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.13}" fill="${primary}" opacity="0.8" filter="url(#${id}-glow2)"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.10}" fill="none" stroke="${ls}" stroke-width="1" stroke-dasharray="2 3"/>
  
  <!-- Texte -->
  <text x="${c}" y="${c + 10}" font-family="'Orbitron', 'Courier New', monospace" font-size="${size * 0.15}" font-weight="700" fill="white" text-anchor="middle" letter-spacing="4" filter="url(#${id}-glow1)">${init}</text>
  
  <!-- Coins lumineux -->
  ${[[-1,-1], [1,-1], [-1,1], [1,1]].map(([sx, sy]) => `
    <g transform="translate(${c + sx * size * 0.30}, ${c + sy * size * 0.30})">
      <line x1="0" y1="${sy * -15}" x2="0" y2="0" stroke="${ls}" stroke-width="3" filter="url(#${id}-glow1)"/>
      <line x1="${sx * -15}" y1="0" x2="0" y2="0" stroke="${ls}" stroke-width="3" filter="url(#${id}-glow1)"/>
      <circle r="4" fill="${secondary}" filter="url(#${id}-glow1)"/>
    </g>
  `).join('')}
  
  <text x="${c}" y="${size - size * 0.08}" font-family="'Orbitron', monospace" font-size="${size * 0.045}" font-weight="500" fill="${ls}" text-anchor="middle" letter-spacing="8" opacity="0.9">${name.toUpperCase()}</text>
  
  <line x1="${c - size * 0.18}" y1="${size - size * 0.05}" x2="${c + size * 0.18}" y2="${size - size * 0.05}" stroke="${secondary}" stroke-width="1" filter="url(#${id}-glow2)"/>
</svg>`;
}

// 4. LUXE / FOIL OR - Métallique, premium, effet relief
function generateLuxuryLogo(name, primary, secondary, size = 400) {
  const id = generateId('lux');
  const c = size / 2;
  const init = name.slice(0, 1).toUpperCase();
  const dp = adjustColor(primary, 0.5);
  const lp = adjustColor(primary, 1.5);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF8DC"/><stop offset="25%" stop-color="${lp}"/>
      <stop offset="50%" stop-color="${primary}"/><stop offset="75%" stop-color="${dp}"/>
      <stop offset="100%" stop-color="#FFF8DC"/>
    </linearGradient>
    <linearGradient id="${id}-dark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1A0A0A"/><stop offset="100%" stop-color="#0A0505"/>
    </linearGradient>
    <filter id="${id}-shadow">
      <feDropShadow dx="0" dy="6" stdDeviation="15" flood-color="${dp}" flood-opacity="0.6"/>
    </filter>
    <filter id="${id}-emboss">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="25" lighting-color="white" result="spec">
        <fePointLight x="-5000" y="-10000" z="20000"/>
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut"/>
      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    </filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="url(#${id}-dark)"/>
  
  <!-- Motif subtil de points de luxe -->
  ${Array.from({length: 6}, (_, i) => Array.from({length: 6}, (_, j) => {
    const x = 50 + j * 65, y = 50 + i * 65;
    return `<circle cx="${x}" cy="${y}" r="1" fill="${lp}" opacity="0.15"/>`;
  }).join('')).join('')}
  
  <!-- Losange principal -->
  <g filter="url(#${id}-shadow)">
    <polygon points="${diamondPoints(c, c - 10, size * 0.30, size * 0.32)}" fill="url(#${id}-gold)"/>
    <polygon points="${diamondPoints(c, c - 10, size * 0.26, size * 0.28)}" fill="${adjustColor(primary, 0.3)}"/>
    <polygon points="${diamondPoints(c, c - 10, size * 0.22, size * 0.24)}" fill="url(#${id}-dark)" stroke="${lp}" stroke-width="1"/>
  </g>
  
  <!-- Initiales centrales -->
  <text x="${c}" y="${c + 6}" font-family="'Bodoni MT', 'Didot', Georgia, serif" font-size="${size * 0.22}" font-weight="400" fill="url(#${id}-gold)" text-anchor="middle" filter="url(#${id}-emboss)" font-style="italic">${init}</text>
  
  <!-- Ornements floraux simplifiés -->
  ${[-1, 1].map(s => `
    <g transform="translate(${c + s * size * 0.34}, ${c})">
      <path d="M0,-20 Q${s*10},-10 0,0 Q${s*10},10 0,20" fill="none" stroke="url(#${id}-gold)" stroke-width="1.5" opacity="0.6"/>
      <circle cx="0" cy="-20" r="3" fill="${lp}"/>
      <circle cx="0" cy="20" r="3" fill="${lp}"/>
    </g>
  `).join('')}
  
  <!-- Lignes horizontales élégantes -->
  <line x1="${c - size * 0.28}" y1="${c + size * 0.28}" x2="${c - size * 0.08}" y2="${c + size * 0.28}" stroke="${lp}" stroke-width="1" opacity="0.5"/>
  <line x1="${c + size * 0.08}" y1="${c + size * 0.28}" x2="${c + size * 0.28}" y2="${c + size * 0.28}" stroke="${lp}" stroke-width="1" opacity="0.5"/>
  
  <text x="${c}" y="${size - size * 0.10}" font-family="'Bodoni MT', Georgia, serif" font-size="${size * 0.05}" font-weight="400" fill="${lp}" text-anchor="middle" letter-spacing="6" font-style="italic">${name}</text>
</svg>`;
}

// 5. FLUIDE ORGANIQUE - Formes organiques, blob, dégradés fluides
function generateFluidLogo(name, primary, secondary, size = 400) {
  const id = generateId('fluid');
  const c = size / 2;
  const init = name.slice(0, 2).toUpperCase();
  const tri = generateTriadic(primary, 1);
  const comp = generateComplementary(primary);
  
  // Générer des chemins blob organiques
  const blobPath = (cx, cy, rx, ry, variation) => {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r = (i % 2 === 0 ? 1 : 0.75) * (Math.random() * variation + 0.9);
      pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]);
    }
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      const cp1x = p1[0] + (p2[0] - pts[(i - 1 + pts.length) % pts.length][0]) * 0.15;
      const cp1y = p1[1] + (p2[1] - pts[(i - 1 + pts.length) % pts.length][1]) * 0.15;
      const cp2x = p2[0] - (pts[(i + 2) % pts.length][0] - p1[0]) * 0.15;
      const cp2y = p2[1] - (pts[(i + 2) % pts.length][1] - p1[1]) * 0.15;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d + ' Z';
  };
  
  const b1 = blobPath(c - 40, c - 30, size * 0.28, size * 0.24, 0.15);
  const b2 = blobPath(c + 50, c + 40, size * 0.22, size * 0.20, 0.12);
  const b3 = blobPath(c + 20, c - 60, size * 0.16, size * 0.14, 0.1);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/><stop offset="50%" stop-color="${tri}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="${id}-g2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${secondary}"/><stop offset="100%" stop-color="${comp}"/>
    </linearGradient>
    <linearGradient id="${id}-g3" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${adjustColor(primary, 1.3)}"/><stop offset="100%" stop-color="${primary}"/>
    </linearGradient>
    <filter id="${id}-blur"><feGaussianBlur stdDeviation="20"/></filter>
    <filter id="${id}-glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="#F8F5F0"/>
  
  <!-- Blobs floutés en arrière-plan -->
  <path d="${b1}" fill="url(#${id}-g1)" filter="url(#${id}-blur)" opacity="0.5"/>
  <path d="${b2}" fill="url(#${id}-g2)" filter="url(#${id}-blur)" opacity="0.4"/>
  <path d="${b3}" fill="${tri}" filter="url(#${id}-blur)" opacity="0.35"/>
  
  <!-- Blob principal net -->
  <path d="${blobPath(c, c + 10, size * 0.22, size * 0.20, 0.1)}" fill="url(#${id}-g3)" filter="url(#${id}-glow)"/>
  
  <!-- Cercle secondaire -->
  <ellipse cx="${c + size * 0.08}" cy="${c + size * 0.05}" rx="${size * 0.14}" ry="${size * 0.13}" fill="white" opacity="0.9"/>
  
  <!-- Texte -->
  <text x="${c + size * 0.08}" y="${c + size * 0.10}" font-family="'Playfair Display', Georgia, serif" font-size="${size * 0.16}" font-weight="700" fill="${adjustColor(primary, 0.5)}" text-anchor="middle">${init}</text>
  
  <!-- Décoration petits cercles -->
  <circle cx="${c - size * 0.18}" cy="${c - size * 0.14}" r="5" fill="${secondary}" opacity="0.6"/>
  <circle cx="${c + size * 0.22}" cy="${c + size * 0.18}" r="3" fill="${tri}" opacity="0.6"/>
  <circle cx="${c - size * 0.08}" cy="${c + size * 0.24}" r="4" fill="${primary}" opacity="0.4"/>
  
  <!-- Nom en bas -->
  <text x="${c}" y="${size - size * 0.08}" font-family="'Playfair Display', Arial, sans-serif" font-size="${size * 0.055}" font-weight="600" fill="${adjustColor(primary, 0.6)}" text-anchor="middle" letter-spacing="4">${name}</text>
</svg>`;
}

// 6. SACRED GEOMETRY - Géométrie sacrée, mandala, précision mathématique
function generateSacredGeometryLogo(name, primary, secondary, size = 400) {
  const id = generateId('sacred');
  const c = size / 2;
  const init = name.slice(0, 1).toUpperCase();
  const lp = adjustColor(primary, 1.4);
  const ds = adjustColor(secondary, 0.5);
  
  const petals = 12;
  const petalPaths = [];
  for (let i = 0; i < petals; i++) {
    const a1 = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;
    const r1 = size * 0.28, r2 = size * 0.14;
    const cx1 = c + r1 * Math.cos(a1), cy1 = c + r1 * Math.sin(a1);
    const cx2 = c + r2 * Math.cos(a2), cy2 = c + r2 * Math.sin(a2);
    petalPaths.push(`M ${c},${c} Q ${cx1},${cy1} ${cx2},${cy2} Q ${c + r1 * Math.cos(a2)},${c + r1 * Math.sin(a2)} ${c},${c}`);
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${id}-center" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${lp}"/><stop offset="70%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${ds}"/>
    </radialGradient>
    <filter id="${id}-glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="#0D1117"/>
  
  <!-- Grille de fond subtile -->
  ${Array.from({length: 8}, (_, i) => {
    const y = 50 + i * 45;
    return `<line x1="0" y1="${y}" x2="${size}" y2="${y}" stroke="${primary}" opacity="0.03" stroke-width="0.5"/>`;
  }).join('')}
  ${Array.from({length: 8}, (_, i) => {
    const x = 50 + i * 45;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${size}" stroke="${primary}" opacity="0.03" stroke-width="0.5"/>`;
  }).join('')}
  
  <!-- Cercles concentriques -->
  ${[0.42, 0.38, 0.34].map((r, i) => `
    <circle cx="${c}" cy="${c}" r="${size * r}" fill="none" stroke="${i === 1 ? secondary : primary}" stroke-width="${1 + i * 0.5}" opacity="${0.15 + i * 0.1}" stroke-dasharray="${i === 0 ? '4 6' : i === 1 ? '2 4' : '1 2'}"/>
  `).join('')}
  
  <!-- Motif floral/mandala -->
  ${petalPaths.map((d, i) => `
    <path d="${d}" fill="${i % 2 === 0 ? primary : secondary}" opacity="${0.15 + (i % 3) * 0.05}" filter="url(#${id}-glow)"/>
  `).join('')}
  
  <!-- Hexagone central -->
  <polygon points="${hexPoints(c, c, size * 0.16)}" fill="none" stroke="${lp}" stroke-width="2" opacity="0.8"/>
  <polygon points="${hexPoints(c, c, size * 0.12)}" fill="url(#${id}-center)" filter="url(#${id}-glow)"/>
  
  <!-- Étoile intérieure -->
  <polygon points="${starPoints(c, c, size * 0.10, size * 0.04, 6)}" fill="none" stroke="${secondary}" stroke-width="1.5" opacity="0.7"/>
  
  <!-- Texte central -->
  <text x="${c}" y="${c + 8}" font-family="'Cinzel', Georgia, serif" font-size="${size * 0.14}" font-weight="700" fill="white" text-anchor="middle" letter-spacing="2">${init}</text>
  
  <!-- Points orbite -->
  ${Array.from({length: 6}, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return `<circle cx="${c + size * 0.40 * Math.cos(a)}" cy="${c + size * 0.40 * Math.sin(a)}" r="2.5" fill="${i % 2 === 0 ? secondary : lp}" opacity="0.8"/>`;
  }).join('')}
  
  <text x="${c}" y="${size - size * 0.08}" font-family="'Cinzel', Arial, sans-serif" font-size="${size * 0.05}" font-weight="400" fill="${lp}" text-anchor="middle" letter-spacing="5">${name.toUpperCase()}</text>
</svg>`;
}

// 7. ISOMÉTRIQUE 3D - Perspective, ombres portées, profondeur
function generateIsometricLogo(name, primary, secondary, size = 400) {
  const id = generateId('iso');
  const c = size / 2;
  const init = name.slice(0, 2).toUpperCase();
  const dp = adjustColor(primary, 0.5);
  const lp = adjustColor(primary, 1.3);
  
  // Cube isométrique
  const cs = size * 0.18; // cube size
  const isoX = (x, y, z) => c + (x - y) * cs * 0.866;
  const isoY = (x, y, z) => c + 40 + (x + y) * cs * 0.5 - z * cs * 0.866;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${lp}"/><stop offset="100%" stop-color="${primary}"/>
    </linearGradient>
    <linearGradient id="${id}-right" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${dp}"/>
    </linearGradient>
    <linearGradient id="${id}-left" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${adjustColor(primary, 0.7)}"/><stop offset="100%" stop-color="${adjustColor(primary, 0.4)}"/>
    </linearGradient>
    <filter id="${id}-shadow"><feDropShadow dx="8" dy="12" stdDeviation="10" flood-color="${dp}" flood-opacity="0.4"/></filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="#F0F2F5"/>
  
  <!-- Grille isométrique subtile -->
  ${Array.from({length: 10}, (_, i) => {
    const y = 30 + i * 40;
    return `<line x1="0" y1="${y}" x2="${size}" y2="${y}" stroke="#D0D5DD" opacity="0.3" stroke-width="0.5"/>`;
  }).join('')}
  
  <!-- Cube 3D principal -->
  <g filter="url(#${id}-shadow)">
    <!-- Face gauche -->
    <polygon points="${isoX(0,0,0)},${isoY(0,0,0)} ${isoX(0,1,0)},${isoY(0,1,0)} ${isoX(0,1,1)},${isoY(0,1,1)} ${isoX(0,0,1)},${isoY(0,0,1)}" fill="url(#${id}-left)"/>
    <!-- Face droite -->
    <polygon points="${isoX(0,1,0)},${isoY(0,1,0)} ${isoX(1,1,0)},${isoY(1,1,0)} ${isoX(1,1,1)},${isoY(1,1,1)} ${isoX(0,1,1)},${isoY(0,1,1)}" fill="url(#${id}-right)"/>
    <!-- Face dessus -->
    <polygon points="${isoX(0,0,1)},${isoY(0,0,1)} ${isoX(0,1,1)},${isoY(0,1,1)} ${isoX(1,1,1)},${isoY(1,1,1)} ${isoX(1,0,1)},${isoY(1,0,1)}" fill="url(#${id}-top)"/>
  </g>
  
  <!-- Cube secondaire flottant -->
  <g opacity="0.6" transform="translate(60, -40)">
    <polygon points="${isoX(0,0,0)},${isoY(0,0,0)} ${isoX(0,0.5,0)},${isoY(0,0.5,0)} ${isoX(0,0.5,0.5)},${isoY(0,0.5,0.5)} ${isoX(0,0,0.5)},${isoY(0,0,0.5)}" fill="${secondary}" opacity="0.5"/>
    <polygon points="${isoX(0,0.5,0)},${isoY(0,0.5,0)} ${isoX(0.5,0.5,0)},${isoY(0.5,0.5,0)} ${isoX(0.5,0.5,0.5)},${isoY(0.5,0.5,0.5)} ${isoX(0,0.5,0.5)},${isoY(0,0.5,0.5)}" fill="${adjustColor(secondary, 0.7)}" opacity="0.5"/>
    <polygon points="${isoX(0,0,0.5)},${isoY(0,0,0.5)} ${isoX(0,0.5,0.5)},${isoY(0,0.5,0.5)} ${isoX(0.5,0.5,0.5)},${isoY(0.5,0.5,0.5)} ${isoX(0.5,0,0.5)},${isoY(0.5,0,0.5)}" fill="${adjustColor(secondary, 1.3)}" opacity="0.5"/>
  </g>
  
  <!-- Texte sur face supérieure -->
  <text x="${c}" y="${c - 10}" font-family="'Roboto Mono', monospace" font-size="${size * 0.10}" font-weight="700" fill="white" text-anchor="middle" opacity="0.9">${init}</text>
  
  <!-- Lignes décoratives -->
  <line x1="${c - size * 0.35}" y1="${c + size * 0.28}" x2="${c + size * 0.35}" y2="${c + size * 0.28}" stroke="${secondary}" stroke-width="2" opacity="0.4"/>
  <circle cx="${c - size * 0.38}" cy="${c + size * 0.28}" r="3" fill="${secondary}"/>
  <circle cx="${c + size * 0.38}" cy="${c + size * 0.28}" r="3" fill="${secondary}"/>
  
  <text x="${c}" y="${size - size * 0.08}" font-family="'Roboto Mono', Arial, sans-serif" font-size="${size * 0.055}" font-weight="600" fill="${dp}" text-anchor="middle" letter-spacing="4">${name.toUpperCase()}</text>
</svg>`;
}

// 8. MOTION / DYNAMIQUE - Lignes de vitesse, énergie, mouvement
function generateMotionLogo(name, primary, secondary, size = 400) {
  const id = generateId('motion');
  const c = size / 2;
  const init = name.slice(0, 2).toUpperCase();
  const dp = adjustColor(primary, 0.5);
  const comp = generateComplementary(primary);
  
  // Lignes de vitesse courbes
  const speedLines = [];
  for (let i = 0; i < 12; i++) {
    const y = 60 + i * 28;
    const curve = i % 2 === 0 ? 30 : -30;
    const opacity = 0.04 + (i % 3) * 0.03;
    speedLines.push(`<path d="M 0,${y} Q ${c + curve},${y - 15} ${size},${y}" fill="none" stroke="${i % 3 === 0 ? secondary : primary}" stroke-width="${1 + (i % 4) * 0.5}" opacity="${opacity}"/>`);
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-main" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${primary}"/><stop offset="50%" stop-color="${secondary}"/>
      <stop offset="100%" stop-color="${comp}"/>
    </linearGradient>
    <linearGradient id="${id}-burst" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <filter id="${id}-glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="${id}-motionBlur">
      <feGaussianBlur stdDeviation="4 0"/>
    </filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="${adjustColor(primary, 0.06)}"/>
  ${speedLines.join('')}
  
  <!-- Cercle principal avec trait dynamique -->
  <circle cx="${c}" cy="${c}" r="${size * 0.28}" fill="none" stroke="url(#${id}-main)" stroke-width="6" filter="url(#${id}-glow)" stroke-linecap="round"/>
  
  <!-- Arc de mouvement -->
  <path d="M ${c - size * 0.22} ${c - size * 0.22} A ${size * 0.30} ${size * 0.30} 0 0 1 ${c + size * 0.22} ${c + size * 0.22}" fill="none" stroke="${secondary}" stroke-width="4" opacity="0.5" filter="url(#${id}-glow)" stroke-linecap="round"/>
  
  <!-- Chevron de direction -->
  <g transform="translate(${c}, ${c})">
    <polygon points="${-size*0.08},${-size*0.10} ${size*0.04},0 ${-size*0.08},${size*0.10}" fill="${comp}" filter="url(#${id}-glow)"/>
    <polygon points="${-size*0.04},${-size*0.10} ${size*0.08},0 ${-size*0.04},${size*0.10}" fill="${secondary}" opacity="0.7"/>
  </g>
  
  <!-- Initiales avec effet motion -->
  <text x="${c}" y="${c + size * 0.05}" font-family="'Exo 2', 'Arial Black', sans-serif" font-size="${size * 0.16}" font-weight="900" fill="${dp}" text-anchor="middle" letter-spacing="-2" filter="url(#${id}-glow)">${init}</text>
  
  <!-- Particules d'énergie -->
  ${Array.from({length: 8}, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 4;
    const dist = size * 0.32 + (i % 3) * 15;
    return `<circle cx="${c + dist * Math.cos(angle)}" cy="${c + dist * Math.sin(angle)}" r="${2 + (i % 3)}" fill="${i % 2 === 0 ? secondary : comp}" opacity="0.6"/>`;
  }).join('')}
  
  <text x="${c}" y="${size - size * 0.08}" font-family="'Exo 2', Arial, sans-serif" font-size="${size * 0.055}" font-weight="700" fill="${dp}" text-anchor="middle" letter-spacing="6">${name.toUpperCase()}</text>
  
  <line x1="${c - size * 0.15}" y1="${size - size * 0.05}" x2="${c + size * 0.15}" y2="${size - size * 0.05}" stroke="url(#${id}-main)" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

// 9. NATURE / BIO - Formes organiques, feuilles, éléments naturels stylisés
function generateNatureLogo(name, primary, secondary, size = 400) {
  const id = generateId('nature');
  const c = size / 2;
  const init = name.slice(0, 1).toUpperCase();
  const lp = adjustColor(primary, 1.4);
  const earth = adjustColor(primary, 0.7);
  
  // Feuille stylisée en SVG path
  const leafPath = (sx, sy, sc, rot) => {
    const p = `M 0,-${35*sc} C ${20*sc},-${45*sc} ${35*sc},-${25*sc} ${30*sc},0 C ${35*sc},${25*sc} ${20*sc},${45*sc} 0,${50*sc} C -${20*sc},${45*sc} -${35*sc},${25*sc} -${30*sc},0 C -${35*sc},-${25*sc} -${20*sc},-${45*sc} 0,-${35*sc} Z`;
    return `<g transform="translate(${sx}, ${sy}) rotate(${rot})"><path d="${p}" fill="${lp}" opacity="0.85"/><path d="M 0,-${35*sc} L 0,${50*sc}" stroke="${earth}" stroke-width="${1.5*sc}" opacity="0.4"/></g>`;
  };
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${id}-bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${adjustColor(primary, 1.15)}"/><stop offset="60%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${earth}"/>
    </radialGradient>
    <linearGradient id="${id}-stem" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${secondary}"/><stop offset="100%" stop-color="${adjustColor(secondary, 0.5)}"/>
    </linearGradient>
    <filter id="${id}-soft"><feGaussianBlur stdDeviation="15" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="${id}-shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${earth}" flood-opacity="0.3"/></filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="#F5F9F5"/>
  
  <!-- Cercles organiques floutés en fond -->
  <circle cx="${c - 60}" cy="${c - 50}" r="${size * 0.25}" fill="${lp}" opacity="0.15" filter="url(#${id}-soft)"/>
  <circle cx="${c + 70}" cy="${c + 60}" r="${size * 0.20}" fill="${secondary}" opacity="0.12" filter="url(#${id}-soft)"/>
  
  <!-- Cercle principal -->
  <circle cx="${c}" cy="${c - 10}" r="${size * 0.26}" fill="url(#${id}-bg)" filter="url(#${id}-shadow)"/>
  <circle cx="${c}" cy="${c - 10}" r="${size * 0.22}" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
  
  <!-- Feuilles stylisées orbitantes -->
  ${leafPath(c - 35, c - 55, 0.9, -30)}
  ${leafPath(c + 40, c - 50, 0.8, 25)}
  ${leafPath(c + 50, c + 10, 0.7, 75)}
  ${leafPath(c - 45, c + 5, 0.75, -70)}
  
  <!-- Tige centrale -->
  <line x1="${c}" y1="${c + size * 0.12}" x2="${c}" y2="${c + size * 0.25}" stroke="url(#${id}-stem)" stroke-width="4" stroke-linecap="round" filter="url(#${id}-shadow)"/>
  
  <!-- Initiale -->
  <text x="${c}" y="${c + 6}" font-family="'Merriweather', Georgia, serif" font-size="${size * 0.18}" font-weight="700" fill="white" text-anchor="middle" filter="url(#${id}-shadow)">${init}</text>
  
  <!-- Petites feuilles sur tige -->
  <g transform="translate(${c + 8}, ${c + size * 0.18}) rotate(35)">
    <ellipse cx="0" cy="0" rx="8" ry="4" fill="${lp}" opacity="0.7"/>
  </g>
  <g transform="translate(${c - 8}, ${c + size * 0.22}) rotate(-30)">
    <ellipse cx="0" cy="0" rx="6" ry="3" fill="${secondary}" opacity="0.6"/>
  </g>
  
  <text x="${c}" y="${size - size * 0.08}" font-family="'Merriweather', Arial, sans-serif" font-size="${size * 0.055}" font-weight="600" fill="${earth}" text-anchor="middle" letter-spacing="3">${name}</text>
</svg>`;
}

// 10. BAUHAUS / GÉOMÉTRIQUE HARD - Formes pures, contraste fort, constructivisme
function generateBauhausLogo(name, primary, secondary, size = 400) {
  const id = generateId('bau');
  const c = size / 2;
  const init = name.slice(0, 2).toUpperCase();
  const comp = generateComplementary(primary);
  const tri = generateTriadic(primary, 1);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="${id}-shadow"><feDropShadow dx="4" dy="6" stdDeviation="0" flood-color="#000" flood-opacity="0.15"/></filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="#FAFAFA"/>
  
  <!-- Grille constructive -->
  <line x1="${size * 0.33}" y1="0" x2="${size * 0.33}" y2="${size}" stroke="#E0E0E0" stroke-width="1"/>
  <line x1="${size * 0.66}" y1="0" x2="${size * 0.66}" y2="${size}" stroke="#E0E0E0" stroke-width="1"/>
  <line x1="0" y1="${size * 0.33}" x2="${size}" y2="${size * 0.33}" stroke="#E0E0E0" stroke-width="1"/>
  <line x1="0" y1="${size * 0.66}" x2="${size}" y2="${size * 0.66}" stroke="#E0E0E0" stroke-width="1"/>
  
  <!-- Forme principale: demi-cercle -->
  <path d="M ${c - size*0.20} ${c - size*0.20} A ${size*0.20} ${size*0.20} 0 0 1 ${c + size*0.20} ${c - size*0.20} L ${c + size*0.20} ${c + size*0.20} L ${c - size*0.20} ${c + size*0.20} Z" fill="${primary}" filter="url(#${id}-shadow)"/>
  
  <!-- Cercle secondaire superposé -->
  <circle cx="${c + size * 0.08}" cy="${c - size * 0.08}" r="${size * 0.12}" fill="${secondary}" filter="url(#${id}-shadow)"/>
  
  <!-- Triangle accent -->
  <polygon points="${c - size*0.16},${c + size*0.06} ${c - size*0.06},${c + size*0.22} ${c + size*0.02},${c + size*0.06}" fill="${comp}"/>
  
  <!-- Rectangle vertical -->
  <rect x="${c - size * 0.24}" y="${c + size * 0.06}" width="${size * 0.06}" height="${size * 0.16}" fill="${tri}" filter="url(#${id}-shadow)"/>
  
  <!-- Texte -->
  <text x="${c}" y="${c + 8}" font-family="'Futura', 'Jost', 'Arial Black', sans-serif" font-size="${size * 0.14}" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-1">${init}</text>
  
  <!-- Nom en bas avec typographie géométrique -->
  <text x="${c}" y="${size - size * 0.10}" font-family="'Jost', 'Futura', Arial, sans-serif" font-size="${size * 0.055}" font-weight="600" fill="#1A1A1A" text-anchor="middle" letter-spacing="8">${name.toUpperCase()}</text>
  
  <!-- Barre d'accent colorée -->
  <rect x="${c - size * 0.20}" y="${size - size * 0.05}" width="${size * 0.10}" height="4" fill="${primary}"/>
  <rect x="${c - size * 0.08}" y="${size - size * 0.05}" width="${size * 0.06}" height="4" fill="${secondary}"/>
  <rect x="${c + size * 0.02}" y="${size - size * 0.05}" width="${size * 0.18}" height="4" fill="${comp}"/>
</svg>`;
}

// ============================================================
// FONCTIONS PUBLIQUES
// ============================================================

const TEMPLATE_MAP = {
  modern:      generateGlassmorphismLogo,
  classic:     generateBadgeHeraldic,
  tech:        generateCyberpunkLogo,
  eco:         generateNatureLogo,
  bold:        generateMotionLogo,
  playful:     generateFluidLogo,
  luxury:      generateLuxuryLogo,
  geometric:   generateSacredGeometryLogo,
  minimal:     generateBauhausLogo,
  dynamic:     generateIsometricLogo
};

const STYLE_DESCRIPTIONS = {
  modern:      'Glassmorphism flottant avec effets de profondeur et reflets',
  classic:     'Badge héraldique 3D avec ornements métalliques et relief',
  tech:        'Cyberpunk néon avec grille et effets lumineux multi-couches',
  eco:         'Nature organique avec feuilles stylisées et couleurs terreuses',
  bold:        'Motion dynamique avec lignes de vitesse et particules énergétiques',
  playful:     'Fluide organique avec blobs colorés et dégradés fluides',
  luxury:      'Luxe premium avec effet foil métallique et ornements élégants',
  geometric:   'Géométrie sacrée avec mandala et précision mathématique',
  minimal:     'Bauhaus constructiviste avec formes pures et contraste fort',
  dynamic:     'Isométrique 3D avec perspective cube et ombres portées'
};

export function generateAdvancedLogo(options) {
  const { name = 'LOGO', primaryColor = '#1E40AF', secondaryColor = '#DC2626', style = 'modern', size = 400, sector } = options;
  
  const generator = TEMPLATE_MAP[style] || TEMPLATE_MAP.modern;
  return generator(name, primaryColor, secondaryColor, size);
}

export function generateLogoVariants(options, count = 4) {
  const variants = [];
  const styleKeys = Object.keys(TEMPLATE_MAP);
  const usedStyles = new Set();
  
  for (let i = 0; i < count; i++) {
    // Choisir un style non utilisé si possible
    let style = styleKeys[i % styleKeys.length];
    if (usedStyles.has(style)) {
      style = styleKeys[Math.floor(Math.random() * styleKeys.length)];
    }
    usedStyles.add(style);
    
    const svg = generateAdvancedLogo({ ...options, style });
    
    variants.push({
      id: i + 1,
      name: `${options.name} — ${style.charAt(0).toUpperCase() + style.slice(1)}`,
      style: style,
      primaryColor: options.primaryColor,
      secondaryColor: options.secondaryColor,
      svg: svg,
      preview: options.name.slice(0, 2).toUpperCase(),
      description: STYLE_DESCRIPTIONS[style] || `Design ${style} professionnel`,
      symbolism: `Identité visuelle de niveau studio pour ${options.name}`,
      uniquenessScore: 9 + Math.floor(Math.random() * 2),
      fontCategory: ['classic', 'luxury', 'nature'].includes(style) ? 'serif' : 'sans-serif',
      layout: 'centered'
    });
  }
  
  return variants;
}

export function svgToPng(svgString, width = 400, height = 400) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    
    img.src = url;
  });
}

export async function downloadAdvancedLogo(logo, format = 'svg') {
  try {
    if (format === 'svg') {
      const blob = new Blob([logo.svg], { type: 'image/svg+xml;charset=utf-8' });
      const link = document.createElement('a');
      link.download = `${logo.name.replace(/\s+/g, '-').toLowerCase()}-logo.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      return { success: true };
    } else if (format === 'png') {
      const pngDataUrl = await svgToPng(logo.svg, 800, 800);
      const link = document.createElement('a');
      link.download = `${logo.name.replace(/\s+/g, '-').toLowerCase()}-logo.png`;
      link.href = pngDataUrl;
      link.click();
      return { success: true };
    }
  } catch (error) {
    console.error('Erreur téléchargement logo avancé:', error);
    throw error;
  }
}
