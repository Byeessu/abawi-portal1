import { THEMES, NIVEAUX_LANGUE } from '../../data/cv';

export default function CVPreview({ info, photo, exps, formations, skills, langues, theme, setTheme, previewRef }) {
  const selectedTheme = THEMES.find((t) => t.id === theme) || THEMES[1];

  function niveauLabel(val) {
    const n = NIVEAUX_LANGUE.find((n) => n.value === val);
    return n ? n.label.split('—')[1]?.trim() || val : val;
  }

  return (
    <div className="cv-preview-wrap">
      <div className="cv-themes">
        {THEMES.map((t) => (
          <button key={t.id} className={`cv-theme ${theme === t.id ? 'cv-theme--active' : ''}`} style={{ borderColor: theme === t.id ? t.accent : 'transparent' }} onClick={() => setTheme(t.id)}>
            <div className="cv-theme-swatch" style={{ background: t.accent }} />
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      <div ref={previewRef} id="cv-preview-export" className="cv-preview" style={{ fontFamily: selectedTheme.font, background: '#ffffff' }}>
        <div className="cv-pv-header" style={{ background: selectedTheme.accent, color: '#fff' }}>
          {photo && <img src={photo} alt="Photo" className="cv-pv-photo" />}
          <div>
            <h2>{info.prenom} {info.nom}</h2>
            <p>{info.titre}</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>{info.email} | {info.tel} | {info.ville}, {info.pays}</p>
          </div>
        </div>
        {info.resume && <div className="cv-pv-section"><p style={{ fontSize: '0.7rem', lineHeight: 1.5 }}>{info.resume}</p></div>}
        {exps.length > 0 && (
          <div className="cv-pv-section">
            <h3 style={{ color: selectedTheme.accent, borderBottom: `1px solid ${selectedTheme.accent}`, paddingBottom: 2 }}>Expériences</h3>
            {exps.map((e, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: '0.72rem' }}>{e.poste}</strong> — <span style={{ fontSize: '0.68rem', color: '#666' }}>{e.entreprise} | {e.debut} - {e.fin || 'Présent'}</span>
                <p style={{ fontSize: '0.65rem', color: '#444', marginTop: 2 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        )}
        {formations.length > 0 && (
          <div className="cv-pv-section">
            <h3 style={{ color: selectedTheme.accent, borderBottom: `1px solid ${selectedTheme.accent}`, paddingBottom: 2 }}>Formation</h3>
            {formations.map((f, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: '0.72rem' }}>{f.diplome}</strong> — <span style={{ fontSize: '0.68rem', color: '#666' }}>{f.ecole}, {f.ville} ({f.annee})</span>
              </div>
            ))}
          </div>
        )}
        {skills.length > 0 && (
          <div className="cv-pv-section">
            <h3 style={{ color: selectedTheme.accent, borderBottom: `1px solid ${selectedTheme.accent}`, paddingBottom: 2 }}>Compétences</h3>
            <p style={{ fontSize: '0.7rem', color: '#444' }}>{skills.map(s => `${s.name} (${s.level})`).join(' · ')}</p>
          </div>
        )}
        {langues.length > 0 && (
          <div className="cv-pv-section">
            <h3 style={{ color: selectedTheme.accent, borderBottom: `1px solid ${selectedTheme.accent}`, paddingBottom: 2 }}>Langues</h3>
            <p style={{ fontSize: '0.7rem', color: '#444' }}>{langues.filter(l => l.langue).map(l => `${l.langue} — ${niveauLabel(l.niveau)}`).join(' · ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
