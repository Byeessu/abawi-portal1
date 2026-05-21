import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cleanIATextLight } from '../../lib/cleanText';
import { exportToPDF } from '../../lib/generatePDF';
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave';
import { callGroq } from '../../lib/groqClient';
import { useFreeToolQuota } from '../../hooks/useFreeToolQuota';
import FreeToolPaywall from '../FreeToolPaywall';
import FileContextUpload from '../FileContextUpload';
import RichDoc from '../RichDoc';
import DocumentProfileManager from '../DocumentProfileManager';
import TokenCounter from '../TokenCounter';
import './LettreMotivation.css';

const LETTRE_SAVE_KEY = 'abawi-lettre-save-30j';
function saveTool30Days(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() })); } catch { /* ignore */ }
}

function buildLettrePreview(form) {
  const poste = form.poste || '[Intitulé du poste]';
  const entreprise = form.entreprise || '[Entreprise]';
  const secteur = form.secteur || '[Secteur]';
  const ville = form.ville || '[Ville / Pays]';
  const experience = form.experience || '[Vos expériences clés]';
  const competences = form.competences || '[Vos compétences principales]';
  const motivation = form.motivation || '[Votre motivation]';

  return `## Objet : Candidature au poste de ${poste}\n\nMadame, Monsieur,\n\nJe vous adresse ma candidature pour le poste de **${poste}** au sein de **${entreprise}**, acteur reconnu du secteur **${secteur}** à **${ville}**.\n\nMon parcours se distingue notamment par les éléments suivants : ${experience}.\n\nMes compétences les plus pertinentes pour ce poste sont : ${competences}.\n\nJe souhaite rejoindre votre structure pour les raisons suivantes : ${motivation}.\n\nJe serais ravi(e) de pouvoir échanger avec vous lors d'un entretien afin de détailler ma contribution potentielle à vos objectifs.\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`;
}

const LETTRE_INITIAL = { poste: '', entreprise: '', secteur: '', ville: '', experience: '', competences: '', motivation: '' };

export default function LettreMotivation() {
  const { membre } = useAuth();
  const [form, setForm] = useState(LETTRE_INITIAL);
  useDraftAutoSave(LETTRE_SAVE_KEY, form, { onRestore: setForm });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedContext, setUploadedContext] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [toneVariants, setToneVariants] = useState([]);
  const [selectedTone, setSelectedTone] = useState(-1);
  const [proposingTone, setProposingTone] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  const quota = useFreeToolQuota('lettre', {
    anonymousLimit: 2, memberLimit: 5, membre, creditType: 'lettre',
  })

  const livePreview = useMemo(() => buildLettrePreview(form), [form]);
  const displayedText = result || livePreview;

  function patch(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function proposerTons() {
    setProposingTone(true);
    try {
      const raw = await callGroq(`Tu es un consultant RH expert. Génère 3 variantes courtes (2-3 phrases max chacune) d'introduction de lettre de motivation pour ce profil.
Poste : ${form.poste || '(non précisé)'}, Entreprise : ${form.entreprise || '(non précisée)'}, Secteur : ${form.secteur || ''}

Réponds UNIQUEMENT avec JSON :
[
  { "label": "Formel & Institutionnel", "intro": "..." },
  { "label": "Direct & Impact", "intro": "..." },
  { "label": "Chaleureux & Personnalisé", "intro": "..." }
]`, 600);
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) setToneVariants(JSON.parse(match[0]));
    } catch { /**/ }
    finally { setProposingTone(false); }
  }

  function applyTone(idx) {
    setSelectedTone(idx);
    if (toneVariants[idx]?.intro) {
      setForm(f => ({ ...f, motivation: (toneVariants[idx].intro + '\n' + f.motivation).trim() }));
    }
  }

  async function handleDownloadPDF(slug) {
    if (quota.quotaAvailable) {
      quota.recordUse()
      exportToPDF('lettre-motivation-export', slug, { includeHeader: false, includeFooter: false });
    } else if (quota.canUseCredits) {
      const result = await quota.debitCredits()
      if (!result.ok) { setShowPaywall(true); return }
      exportToPDF('lettre-motivation-export', slug, { includeHeader: false, includeFooter: false });
    } else if (!quota.canUse) {
      setShowPaywall(true)
    }
  }

  async function generate() {
    setLoading(true);
    try {
      const contextBlock = uploadedContext
        ? `\nDocuments fournis (CV, offre d'emploi, etc.) :\n${uploadedContext.slice(0, 6000)}\n`
        : '';
      const raw = await callGroq(`Tu es un consultant RH senior (niveau cabinet international). Rédige une lettre de motivation premium en français, ton professionnel, concret, crédible et orienté résultats.

Données formulaire :
- Poste visé : ${form.poste || '(à compléter)'}
- Entreprise : ${form.entreprise || '(à préciser)'}
- Secteur : ${form.secteur || 'non précisé'}
- Ville / pays : ${form.ville || 'non précisé'}
- Parcours et expériences clés : ${form.experience || 'non précisé'}
- Compétences à mettre en avant : ${form.competences || 'non précisé'}
- Motivations pour rejoindre cette structure : ${form.motivation || 'non précisé'}
${contextBlock}
Exigences de qualité:
- Structure claire avec "## Objet : ..." puis 5 à 7 paragraphes courts.
- Mentionner au moins 2 apports concrets du candidat (impact, réalisation, méthode).
- Adapter le vocabulaire au secteur "${form.secteur || 'ciblé'}".
- Aucune invention (diplôme, poste, chiffre) non fourni.
- Finir par une formule de politesse professionnelle.
- Format Markdown propre (titres, paragraphes espacés, pas de séparateurs parasites).`);
      setResult(cleanIATextLight(raw));
    } finally {
      setLoading(false);
    }
  }

  function copyText() {
    if (!displayedText) return;
    navigator.clipboard.writeText(displayedText).catch(() => {});
  }

  const fileSlug = (form.poste || 'lettre-motivation').replace(/[^\wÀ-ÿ-]+/gi, '-').slice(0, 48) || 'lettre-motivation';

  return (
    <main className="lm-page">
      {showPaywall && (
        <FreeToolPaywall
          toolName="Lettre de Motivation"
          usedToday={quota.usedToday}
          limit={quota.limit}
          membre={membre}
          creditCost={quota.creditCost}
          soldeCredits={quota.soldeCredits}
          upgradeAction="export"
          onClose={() => setShowPaywall(false)}
          onUseCredit={async () => {
            const result = await quota.debitCredits()
            if (result.ok) {
              setShowPaywall(false)
              exportToPDF('lettre-motivation-export', fileSlug, { includeHeader: false, includeFooter: false })
            }
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <TokenCounter />
        <DocumentProfileManager />
      </div>

      <div className="lm-header">
        <h1>Lettre de motivation</h1>
        <p>Formulaire guidé, génération IA — aperçu gratuit, export PDF à 2 crédits</p>
      </div>

      <div className="lm-layout">
        {/* ── Form ── */}
        <div className="lm-form">
          {/* Cible */}
          <div className="lm-card">
            <div className="lm-card-header">
              <span className="lm-card-icon">🎯</span>
              <h2 className="lm-card-title">Cible du poste</h2>
            </div>
            <div className="lm-field">
              <label className="lm-label">Poste visé</label>
              <input className="lm-input" value={form.poste} onChange={(e) => patch('poste', e.target.value)} placeholder="Intitulé du poste" />
            </div>
            <div className="lm-field">
              <label className="lm-label">Entreprise ou institution</label>
              <input className="lm-input" value={form.entreprise} onChange={(e) => patch('entreprise', e.target.value)} placeholder="Ex : Orange Sénégal" />
            </div>
            <div className="lm-row">
              <div className="lm-field">
                <label className="lm-label">Secteur</label>
                <input className="lm-input" value={form.secteur} onChange={(e) => patch('secteur', e.target.value)} placeholder="Ex : Télécoms" />
              </div>
              <div className="lm-field">
                <label className="lm-label">Ville / Pays</label>
                <input className="lm-input" value={form.ville} onChange={(e) => patch('ville', e.target.value)} placeholder="Ex : Dakar" />
              </div>
            </div>
          </div>

          {/* Profil */}
          <div className="lm-card">
            <div className="lm-card-header">
              <span className="lm-card-icon">👤</span>
              <h2 className="lm-card-title">Votre profil</h2>
            </div>
            <div className="lm-field">
              <label className="lm-label">Expériences & réalisations clés</label>
              <textarea className="lm-textarea" rows={4} value={form.experience} onChange={(e) => patch('experience', e.target.value)} placeholder="Formations, expériences, réalisations chiffrées…" />
            </div>
            <div className="lm-field">
              <label className="lm-label">Compétences pertinentes</label>
              <textarea className="lm-textarea" rows={3} value={form.competences} onChange={(e) => patch('competences', e.target.value)} placeholder="Compétences techniques et soft skills pertinentes" />
            </div>
          </div>

          {/* Motivation & Tons */}
          <div className="lm-card">
            <div className="lm-card-header">
              <span className="lm-card-icon">💡</span>
              <h2 className="lm-card-title">Votre motivation</h2>
            </div>
            <div className="lm-field">
              <label className="lm-label">Pourquoi cette entreprise maintenant</label>
              <textarea className="lm-textarea" rows={3} value={form.motivation} onChange={(e) => patch('motivation', e.target.value)} placeholder="Décrivez ce qui vous attire dans ce poste et cette structure…" />
            </div>
            <button type="button" className="lm-btn-secondary" onClick={proposerTons} disabled={proposingTone}>
              {proposingTone ? '⚡ Génération…' : '🎨 Variantes de ton IA'}
            </button>
            {toneVariants.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {toneVariants.map((t, i) => (
                  <button key={i} onClick={() => applyTone(i)} type="button" className={`lm-tone-btn ${selectedTone === i ? 'lm-tone-btn--active' : ''}`}>
                    <div className="lm-tone-label" style={{ color: selectedTone === i ? 'var(--gold)' : 'var(--text-primary)' }}>
                      {selectedTone === i ? '✅ ' : ''}{t.label}
                    </div>
                    <div className="lm-tone-text">{t.intro}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="lm-card">
            <div className="lm-card-header">
              <span className="lm-card-icon">📎</span>
              <h2 className="lm-card-title">Documents de référence</h2>
            </div>
            <FileContextUpload
              onExtracted={setUploadedContext}
              label="Importer CV, offre d'emploi, fiche de poste…"
              hint="PDF, Word, Excel, TXT — l'IA utilisera ces documents pour personnaliser la lettre"
            />
          </div>

          {/* Actions */}
          <div className="lm-card" style={{ gap: 10 }}>
            <button type="button" className="lm-btn-primary" onClick={generate} disabled={loading}>
              {loading ? '✨ Rédaction en cours…' : '✨ Générer avec IA'}
            </button>
            {displayedText && (
              <button type="button" className="lm-btn-ghost" onClick={copyText}>📋 Copier le texte</button>
            )}
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="lm-preview-wrap">
          <div className="lm-paper">
            <div className="lm-paper-toolbar">
              <span>Aperçu</span>
              <span style={{ fontSize: '0.7rem', color: '#adb5bd' }}>{form.poste || 'Candidature'}</span>
            </div>
            <div className="lm-paper-body">
              {displayedText ? (
                <RichDoc
                  text={displayedText}
                  editable
                  onEdit={setResult}
                  exportId="lettre-motivation-export"
                  exportSlug={fileSlug}
                  docTitle={`Lettre de motivation — ${form.poste || 'Candidature'}`}
                />
              ) : (
                <div className="lm-empty">
                  <span className="lm-empty-icon">✉️</span>
                  <div className="lm-empty-text">
                    Remplissez le formulaire et cliquez sur<br />
                    <strong>"Générer avec IA"</strong><br />
                    pour voir l'aperçu gratuit.
                  </div>
                </div>
              )}
            </div>
          </div>

          {displayedText && (
            <div className="lm-actions" style={{ marginTop: 14 }}>
              {saveNotice && <div className="lm-notice">{saveNotice}</div>}
              <button
                onClick={() => { saveTool30Days(LETTRE_SAVE_KEY, { form, result: displayedText }); setSaveNotice('✅ Lettre sauvegardée pour 30 jours'); setTimeout(() => setSaveNotice(''), 3000); }}
                className="lm-btn-ghost"
              >
                💾 Sauvegarder (30 jours)
              </button>
              <button onClick={() => handleDownloadPDF(fileSlug)} className="lm-btn-primary">
                ⬇️ Télécharger PDF {quota.canUse ? '' : '— 2 crédits'}
              </button>
              <p className="lm-hint">{quota.quotaAvailable ? 'Export gratuit — quota journalier' : quota.canUseCredits ? `Export à ${quota.creditCost} crédit${quota.creditCost > 1 ? 's' : ''}` : 'Aperçu gratuit — export avec crédits'}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
