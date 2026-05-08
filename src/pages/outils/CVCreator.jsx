import { useState, useRef } from 'react';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import './CVCreator.css'

import { useCV } from '../../hooks/useCV';
import { aiImprove, extractFromFile, proposeVariants } from '../../lib/cv';
import PersonalInfo from '../../components/cv-creator/PersonalInfo';
import Experience from '../../components/cv-creator/Experience';
import Education from '../../components/cv-creator/Education';
import Skills from '../../components/cv-creator/Skills';
import Languages from '../../components/cv-creator/Languages';
import CVPreview from '../../components/cv-creator/CVPreview';
import PaymentFlow from '../../components/PaymentFlow'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import FileContextUpload from '../../components/FileContextUpload'

// Appel IA centralisé via le proxy Netlify (sécurisé) avec fallback direct

export default function CVCreator() {
  const {
    info, setInfo,
    photo, setPhoto,
    exps, setExps,
    formations, setFormations,
    skills, setSkills,
    langues, setLangues,
    theme, setTheme,
    savedBanner, setSavedBanner,
    handleSave30Days,
  } = useCV();

  const [payment, setPayment] = useState(false);
  const [improving, setImproving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [aiVariants, setAiVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(-1);
  const [proposing, setProposing] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const previewRef = useRef();
  const photoInputRef = useRef();
  const { themed } = useThemedStyles();

  async function handleExtractFromFile(text) {
    if (!text) return;
    setExtracting(true);
    const parsed = await extractFromFile(text);
    if (parsed) {
      if (parsed.prenom || parsed.nom || parsed.titre) {
        setInfo(p => ({ ...p, ...parsed.info }));
      }
      if (parsed.exps?.length) setExps(parsed.exps);
      if (parsed.formations?.length) setFormations(parsed.formations);
      if (parsed.skills?.length) setSkills(parsed.skills.map(s => ({ name: String(s), level: 'Intermédiaire' })));
      if (parsed.langues?.length) setLangues(parsed.langues);
    }
    setExtracting(false);
  }

  async function handleProposeVariants() {
    setProposing(true);
    const variants = await proposeVariants(info, exps);
    if (variants) setAiVariants(variants);
    setProposing(false);
  }

  function applyVariant(idx) {
    setSelectedVariant(idx);
    if (aiVariants[idx]?.resume) setInfo(p => ({ ...p, resume: aiVariants[idx].resume }));
  }

  function handleDownload() {
    sessionStorage.setItem('abawi-cv-data', JSON.stringify({ info, photo, exps, formations, skills, langues, theme }));
    setPayment(true);
  }

  return (
    <main className="cv-page">
      {payment && (
        <PaymentFlow
          product={{ id: 'cv-pro', titre: 'CV Professionnel ABAWI', prix: 990 }}
          onClose={() => setPayment(false)}
          onSuccess={() => { exportCVWord(); exportCVPDF(); setPayment(false) }}
        />
      )}

      <h1 className="cv-page-title">📄 Créateur de CV Pro</h1>
      <p className="cv-page-sub">Importez un CV existant ou remplissez le formulaire. L'IA optimise. Aperçu gratuit — export PDF à 990 FCFA.</p>

      <ToolInfoPanel
        toolName="Créateur de CV Pro"
        icon="📄"
        description="CV professionnel optimisé ATS, 8 thèmes, import intelligent et export PDF/Word"
        benefits={[
          'Importez un CV existant (PDF, Word, TXT) — l\'IA extrait et remplit le formulaire',
          'Choisissez parmi 8 thèmes professionnels adaptés au marché africain',
          'CV optimisé pour les systèmes ATS (Applicant Tracking System)',
          'Aperçu gratuit avant paiement — pas de surprise',
          'Export PDF et Word haute qualité',
        ]}
        howToUse={[
          'Importez votre CV existant ou commencez à zéro',
          'Remplissez ou ajustez les sections : infos, expériences, formations, compétences',
          'Choisissez un thème adapté à votre secteur',
          'Consultez l\'aperçu en temps réel à droite',
          'Exportez en PDF ou Word pour postuler',
        ]}
        tips={[
          'Le thème « Exécutif » ou « Classique » est idéal pour banque/finance/juridique',
          'Le thème « Tech » ou « Moderne » pour IT/startups/digital',
          'Chiffrez vos réalisations (ex: "augmenté les ventes de 30%") pour un CV ATS-friendly',
          'Votre CV est sauvegardé automatiquement 30 jours dans le navigateur',
        ]}
      />

      {savedBanner && (
        <div style={themed({ marginBottom: 16, padding: '12px 18px', borderRadius: 10, background: 'var(--gold-glow)', border: '1px solid var(--gold-border)', fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 })}>
          <span>📂</span>
          <span>CV restauré depuis votre sauvegarde locale.</span>
          <button onClick={() => { localStorage.removeItem(CV_SAVE_KEY); setSavedBanner(null) }} style={themed({ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' })}>Ignorer</button>
        </div>
      )}

      <div style={themed({ marginBottom: 24, padding: '20px 24px', borderRadius: 14, background: 'var(--gold-glow)', border: '1px solid var(--gold-border)' })}>
        <div style={themed({ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, fontSize: '0.95rem' })}>📂 Importer un CV existant (optionnel)</div>
        <p style={themed({ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 14px' })}>
          Importez votre CV en PDF, Word, TXT… L'IA extrait automatiquement toutes vos informations et remplit le formulaire.
        </p>
        <FileContextUpload
          onExtracted={handleExtractFromFile}
          label="Importer CV (PDF, Word, TXT, Excel…)"
          hint="Tous formats acceptés — l'IA lit et remplit le formulaire automatiquement"
        />
        {extracting && (
          <div style={themed({ marginTop: 10, fontSize: '0.82rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 })}>
            <span style={themed({ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--gold-border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' })} />
            Extraction en cours…
          </div>
        )}
      </div>

      <div className="cv-layout">
        <div className="cv-form">
          <PersonalInfo info={info} setInfo={setInfo} photo={photo} setPhoto={setPhoto} photoInputRef={photoInputRef} />
          <Experience exps={exps} setExps={setExps} improving={improving} improveDesc={async (i) => {
            setImproving(true);
            const improved = await aiImprove(exps[i].desc, 'Réécris cette description d\'expérience professionnelle avec des verbes d\'action, des résultats quantifiés, et des mots-clés ATS');
            const newExps = [...exps];
            newExps[i].desc = improved;
            setExps(newExps);
            setImproving(false);
          }} />
          <Education formations={formations} setFormations={setFormations} />
          <Skills skills={skills} setSkills={setSkills} improving={improving} suggestSkills={async () => {
            setImproving(true);
            const result = await aiImprove(info.titre || 'professionnel', 'Suggère 8 compétences clés (séparées par des virgules) pour le poste de');
            const suggested = result.split(',').map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40);
            setSkills([...skills, ...suggested.map((s) => ({ name: s, level: 'Intermédiaire' }))]);
            setImproving(false);
          }} />
          <Languages langues={langues} setLangues={setLangues} />
        </div>

        <CVPreview info={info} photo={photo} exps={exps} formations={formations} skills={skills} langues={langues} theme={theme} setTheme={setTheme} previewRef={previewRef} />
        <div className="cv-actions">
          <button className="cv-action-btn" onClick={() => { handleSave30Days(); setSaveNotice('✅ CV sauvegardé pour 30 jours'); setTimeout(() => setSaveNotice(''), 3000); }}>💾 Sauvegarder 30j</button>
          <button className="cv-action-btn cv-action-btn--gold" onClick={handleDownload}>⬇️ Exporter PDF & Word (990 F)</button>
        </div>
        {saveNotice && <div style={themed({ fontSize: '0.78rem', color: 'var(--green)', textAlign: 'center', marginTop: 8 })}>{saveNotice}</div>}
      </div>
    </main>
  )
}
