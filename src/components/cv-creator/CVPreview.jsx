import { useState } from 'react';
import { THEMES, NIVEAUX_LANGUE } from '../../data/cv';

const LAYOUTS = [
  { id: 'standard', name: 'Standard', desc: 'Classique & ATS-safe' },
  { id: 'elegant', name: 'Élégant', desc: 'Photo & espacement' },
  { id: 'strict', name: 'Strict ATS', desc: 'Sans photo, 100% texte' },
];

function getContrastColor(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substr(0, 2), 16);
  const g = parseInt(h.substr(2, 2), 16);
  const b = parseInt(h.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#111827' : '#ffffff';
}

export default function CVPreview({ info, photo, exps, formations, skills, langues, theme, setTheme, previewRef }) {
  const selectedTheme = THEMES.find((t) => t.id === theme) || THEMES[1];
  const isDark = selectedTheme.dark;
  const headerText = getContrastColor(selectedTheme.accent);
  const [layout, setLayout] = useState('standard');

  const previewBg = isDark ? '#0f1115' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#1a1a1a';
  const textSecondary = isDark ? 'rgba(255,255,255,0.65)' : '#666666';
  const textBody = isDark ? 'rgba(255,255,255,0.8)' : '#444444';
  const titleColor = isDark ? '#ffffff' : selectedTheme.accent;
  const accent = selectedTheme.accent;

  function niveauLabel(val) {
    const n = NIVEAUX_LANGUE.find((n) => n.value === val);
    return n ? n.label.split('—')[1]?.trim() || val : val;
  }

  function SectionTitle({ children }) {
    return (
      <h3 style={{
        color: layout === 'strict' ? textPrimary : titleColor,
        borderBottom: layout === 'strict' ? `2px solid ${textPrimary}` : `1px solid ${accent}`,
        paddingBottom: 4,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 6,
      }}>
        {children}
      </h3>
    );
  }

  function ContactLine() {
    const parts = [info.email, info.tel, info.ville, info.pays].filter(Boolean);
    return parts.join('  ·  ');
  }

  const renderStandard = () => (
    <>
      <div className="cv-pv-header" style={{ background: accent, color: headerText }}>
        {photo && layout !== 'strict' && <img src={photo} alt="Photo" className="cv-pv-photo" style={{ borderColor: headerText === '#ffffff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)' }} />}
        <div>
          <h2>{info.prenom} {info.nom}</h2>
          <p>{info.titre}</p>
          <p style={{ fontSize: '0.7rem', opacity: 0.85 }}><ContactLine /></p>
        </div>
      </div>
      {info.resume && <div className="cv-pv-section"><p style={{ fontSize: '0.7rem', lineHeight: 1.5, color: textBody }}>{info.resume}</p></div>}
      {exps.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Expériences</SectionTitle>
          {exps.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: '0.72rem' }}>{e.poste}</strong>{' — '}<span style={{ fontSize: '0.68rem', color: textSecondary }}>{e.entreprise} | {e.debut} – {e.fin || 'Présent'}</span>
              <p style={{ fontSize: '0.65rem', color: textBody, marginTop: 2 }}>{e.desc}</p>
            </div>
          ))}
        </div>
      )}
      {formations.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Formation</SectionTitle>
          {formations.map((f, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <strong style={{ fontSize: '0.72rem' }}>{f.diplome}</strong>{' — '}<span style={{ fontSize: '0.68rem', color: textSecondary }}>{f.ecole}, {f.ville} ({f.annee})</span>
            </div>
          ))}
        </div>
      )}
      {skills.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Compétences</SectionTitle>
          <p style={{ fontSize: '0.7rem', color: textBody }}>{skills.map(s => `${s.name} (${s.level})`).join(' · ')}</p>
        </div>
      )}
      {langues.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Langues</SectionTitle>
          <p style={{ fontSize: '0.7rem', color: textBody }}>{langues.filter(l => l.langue).map(l => `${l.langue} — ${niveauLabel(l.niveau)}`).join(' · ')}</p>
        </div>
      )}
    </>
  );

  const renderElegant = () => (
    <>
      <div className="cv-pv-header" style={{ background: accent, color: headerText, padding: '24px 20px', gap: 16 }}>
        {photo && <img src={photo} alt="Photo" className="cv-pv-photo" style={{ width: 64, height: 64, borderColor: headerText === '#ffffff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)' }} />}
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>{info.prenom} {info.nom}</h2>
          <p style={{ fontSize: '0.78rem', fontWeight: 500 }}>{info.titre}</p>
          <p style={{ fontSize: '0.68rem', opacity: 0.85 }}><ContactLine /></p>
        </div>
      </div>
      {info.resume && <div className="cv-pv-section"><p style={{ fontSize: '0.72rem', lineHeight: 1.6, color: textBody }}>{info.resume}</p></div>}
      {exps.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Expériences Professionnelles</SectionTitle>
          {exps.map((e, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '0.74rem' }}>{e.poste}</strong>
                <span style={{ fontSize: '0.65rem', color: textSecondary }}>{e.debut} – {e.fin || 'Présent'}</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: textSecondary, marginBottom: 2 }}>{e.entreprise}</div>
              <p style={{ fontSize: '0.65rem', color: textBody, marginTop: 2 }}>{e.desc}</p>
            </div>
          ))}
        </div>
      )}
      {formations.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Formation</SectionTitle>
          {formations.map((f, i) => (
            <div key={i} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: '0.72rem' }}>{f.diplome}</strong>
              <span style={{ fontSize: '0.65rem', color: textSecondary }}>{f.ecole}, {f.ville} — {f.annee}</span>
            </div>
          ))}
        </div>
      )}
      {skills.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Compétences</SectionTitle>
          <p style={{ fontSize: '0.7rem', color: textBody }}>{skills.map(s => `${s.name} (${s.level})`).join(' · ')}</p>
        </div>
      )}
      {langues.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Langues</SectionTitle>
          <p style={{ fontSize: '0.7rem', color: textBody }}>{langues.filter(l => l.langue).map(l => `${l.langue} — ${niveauLabel(l.niveau)}`).join(' · ')}</p>
        </div>
      )}
    </>
  );

  const renderStrict = () => (
    <>
      <div className="cv-pv-section" style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4, color: textPrimary }}>{info.prenom} {info.nom}</h2>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: textPrimary }}>{info.titre}</p>
        <p style={{ fontSize: '0.65rem', color: textSecondary }}><ContactLine /></p>
      </div>
      {info.resume && <div className="cv-pv-section"><p style={{ fontSize: '0.7rem', lineHeight: 1.6, color: textBody, textAlign: 'center' }}>{info.resume}</p></div>}
      {exps.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Experience</SectionTitle>
          {exps.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: '0.72rem', color: textPrimary }}>{e.poste}</strong>
              <span style={{ fontSize: '0.68rem', color: textSecondary }}> | {e.entreprise} | {e.debut} – {e.fin || 'Present'}</span>
              <p style={{ fontSize: '0.65rem', color: textBody, marginTop: 2 }}>{e.desc}</p>
            </div>
          ))}
        </div>
      )}
      {formations.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Education</SectionTitle>
          {formations.map((f, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <strong style={{ fontSize: '0.72rem', color: textPrimary }}>{f.diplome}</strong>
              <span style={{ fontSize: '0.68rem', color: textSecondary }}> — {f.ecole}, {f.ville} ({f.annee})</span>
            </div>
          ))}
        </div>
      )}
      {skills.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Skills</SectionTitle>
          <p style={{ fontSize: '0.7rem', color: textBody }}>{skills.map(s => `${s.name} (${s.level})`).join(' · ')}</p>
        </div>
      )}
      {langues.length > 0 && (
        <div className="cv-pv-section">
          <SectionTitle>Languages</SectionTitle>
          <p style={{ fontSize: '0.7rem', color: textBody }}>{langues.filter(l => l.langue).map(l => `${l.langue} — ${niveauLabel(l.niveau)}`).join(' · ')}</p>
        </div>
      )}
    </>
  );

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

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {LAYOUTS.map((l) => (
          <button key={l.id} onClick={() => setLayout(l.id)} style={{
            padding: '5px 12px', borderRadius: 6, border: '1px solid',
            borderColor: layout === l.id ? accent : 'var(--border)',
            background: layout === l.id ? `${accent}15` : 'var(--bg-card)',
            color: layout === l.id ? accent : 'var(--text-secondary)',
            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            {l.name}
          </button>
        ))}
      </div>

      <div ref={previewRef} id="cv-preview-export" className="cv-preview" style={{ fontFamily: selectedTheme.font, background: previewBg, color: textPrimary }}>
        {layout === 'elegant' && renderElegant()}
        {layout === 'strict' && renderStrict()}
        {(layout === 'standard' || !layout) && renderStandard()}
      </div>
    </div>
  );
}
