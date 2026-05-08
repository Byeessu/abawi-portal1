import './CoverImage.css'

const MESH = {
  'Marketing Digital': 'radial-gradient(ellipse at 20% 50%,#F0B429 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,#B8860B 0%,transparent 50%),linear-gradient(135deg,#1a1510,#0D1117)',
  'Business & Stratégie': 'radial-gradient(ellipse at 30% 30%,#1e4976 0%,transparent 50%),radial-gradient(ellipse at 70% 70%,#0a2540 0%,transparent 50%),linear-gradient(135deg,#0D1117,#1a2744)',
  'Communication': 'radial-gradient(ellipse at 20% 80%,#6B21A8 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,#3B0764 0%,transparent 50%),linear-gradient(135deg,#1a0a2e,#0D1117)',
  'Tech & IA': 'radial-gradient(ellipse at 50% 30%,#059669 0%,transparent 50%),radial-gradient(ellipse at 20% 70%,#0D9488 0%,transparent 40%),linear-gradient(135deg,#0a1a15,#0D1117)',
  'Visa & Dossier Bankable': 'radial-gradient(ellipse at 40% 40%,#92400E 0%,transparent 50%),radial-gradient(ellipse at 60% 80%,#78350f 0%,transparent 50%),linear-gradient(135deg,#1a1510,#0D1117)',
  'Comptabilité': 'radial-gradient(ellipse at 30% 60%,#5B21B6 0%,transparent 50%),linear-gradient(135deg,#1a0a2e,#0D1117)',
  'Restauration': 'radial-gradient(ellipse at 50% 50%,#92400E 0%,transparent 50%),linear-gradient(135deg,#1a0a0a,#0D1117)',
  'Emploi': 'radial-gradient(ellipse at 30% 50%,#9F1239 0%,transparent 50%),radial-gradient(ellipse at 70% 30%,#7F1D1D 0%,transparent 50%),linear-gradient(135deg,#1a0a0a,#0D1117)',
  'academy': 'radial-gradient(ellipse at 30% 40%,#059669 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,#065F46 0%,transparent 50%),linear-gradient(135deg,#0a1a10,#070B0F)',
  'podcast': 'radial-gradient(ellipse at 50% 50%,#18A84A 0%,transparent 40%),linear-gradient(135deg,#111,#070B0F)',
  'store': 'radial-gradient(ellipse at 40% 40%,#1e40af 0%,transparent 50%),linear-gradient(135deg,#0a1a2e,#0D1117)',
}

const EMOJI = { 'Marketing Digital': '📱', 'Business & Stratégie': '💼', 'Communication': '🗣️', 'Tech & IA': '💻', 'Visa & Dossier Bankable': '🗂️', 'Comptabilité': '📊', 'Restauration': '🍽️', 'Emploi': '📋' }

function getMesh(cat, brand) {
  if (brand === 'academy') return MESH.academy
  if (brand === 'podcast') return MESH.podcast
  if (brand === 'store') return MESH[cat] || MESH.store
  return MESH[cat] || MESH['Business & Stratégie']
}

export function CoverImage({ titre, categorie, type, brand, pages, serie, matiere, size = 'md', pack = null }) {
  const isAcademy = brand === 'academy'
  const isPodcast = type === 'audio' || brand === 'podcast'
  const bg = getMesh(categorie, brand)
  const accent = isAcademy ? '#18A84A' : '#F0B429'
  const brandLabel = isAcademy ? 'ABAWI ACADEMY' : isPodcast ? 'ABAWI PODCASTS' : 'ABAWI DIGITAL'

    if (pack) {
    const { nom, badge, count } = pack;
    const accent = brand === 'academy' ? '#18A84A' : '#F0B429';
    return (
      <div className={`cv cv--pack cv--${size}`}>
        <div className="cv-texture" />
        <div className="cv-fan">
          <div className="cv-fan-card" style={{ borderColor: accent + '30', transform: 'rotate(-8deg) translateX(-8px)' }} />
          <div className="cv-fan-card" style={{ borderColor: accent + '50', transform: 'rotate(0deg)' }} />
          <div className="cv-fan-card" style={{ borderColor: accent + '70', transform: 'rotate(8deg) translateX(8px)' }} />
        </div>
        <div className="cv-center" style={{ zIndex: 2 }}>
          <div className="cv-glass">
            {count > 0 && <div className="cv-pack-count" style={{ color: accent }}>{count}+</div>}
            <h3 className="cv-title">{nom}</h3>
          </div>
        </div>
        {badge && <div className="cv-ribbon" style={{ background: accent }}>{badge}</div>}
        <div className="cv-bar" style={{ background: accent }} />
      </div>
    );
  }

  if (isPodcast) {
    return (
      <div className={`cv cv--podcast cv--${size}`} style={{ background: bg }}>
        <div className="cv-rings"><div className="cv-ring" /><div className="cv-ring cv-ring--2" /><div className="cv-ring cv-ring--3" /></div>
        <div className="cv-pod-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#18A84A" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg></div>
        <div className="cv-pod-title">{titre}</div>
      </div>
    );
  }

  return (
    <div className={`cv cv--${size} ${isAcademy ? 'cv--acad' : 'cv--guide'}`} style={{ background: bg }}>
      <div className="cv-texture" />
      <div className="cv-glow" />
      <div className="cv-spine" />

      {/* Top bar */}
      <div className="cv-top">
        {isAcademy && <div className="cv-flag"><span className="cv-fg" /><span className="cv-fy" /><span className="cv-fr" /></div>}
        <span className="cv-brand">{brandLabel}</span>
      </div>

      {/* Center */}
      <div className="cv-center">
        <div className="cv-glass">
          {isAcademy && serie && <div className="cv-bac">BAC {serie}</div>}
          {isAcademy && matiere && <div className="cv-matiere">{matiere}</div>}
          {isAcademy && serie && <div className="cv-sep" />}
          <h3 className="cv-title">{titre}</h3>
        </div>
      </div>

      {/* Bottom */}
      <div className="cv-bottom">
        <div className="cv-pills">
          {!isAcademy && categorie && <span className="cv-pill" style={{ background: accent + '20', color: accent }}>{EMOJI[categorie] || '📄'} {categorie}</span>}
          {isAcademy && <span className="cv-pill cv-pill--corr">✓ Corrigés inclus</span>}
          {pages > 0 && <span className="cv-pages">{pages}p</span>}
        </div>
      </div>

      <div className="cv-bar" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      <div className="cv-shimmer" />
    </div>
  )
}


export function PackCover({ nom, badge, count = 0, brand = 'digital', size = 'md' }) {
  const accent = brand === 'academy' ? '#18A84A' : '#F0B429';
  return (
    <div className={`cv cv--pack cv--${size}`}>
      <div className="cv-texture" />
      <div className="cv-fan">
        <div className="cv-fan-card" style={{ borderColor: accent + '30', transform: 'rotate(-8deg) translateX(-8px)' }} />
        <div className="cv-fan-card" style={{ borderColor: accent + '50', transform: 'rotate(0deg)' }} />
        <div className="cv-fan-card" style={{ borderColor: accent + '70', transform: 'rotate(8deg) translateX(8px)' }} />
      </div>
      <div className="cv-center" style={{ zIndex: 2 }}>
        <div className="cv-glass">
          {count > 0 && <div className="cv-pack-count" style={{ color: accent }}>{count}+</div>}
          <h3 className="cv-title">{nom}</h3>
        </div>
      </div>
      {badge && <div className="cv-ribbon" style={{ background: accent }}>{badge}</div>}
      <div className="cv-bar" style={{ background: accent }} />
    </div>
  );
}
