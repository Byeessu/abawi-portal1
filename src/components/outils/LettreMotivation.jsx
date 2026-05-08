import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cleanIATextLight } from '../../lib/cleanText';
import { exportToPDF } from '../../lib/generatePDF';
import { useDraftAutoSave } from '../../hooks/useDraftAutoSave';
import { callGroq } from '../../lib/groqClient';
import PaymentFlow from '../PaymentFlow';
import FileContextUpload from '../FileContextUpload';
import RichDoc from '../RichDoc';
import DocumentProfileManager from '../DocumentProfileManager';
import ToolInfoPanel from '../ToolInfoPanel';

const LETTRE_SAVE_KEY = 'abawi-lettre-save-30j';

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

export default function LettreMotivation() {
  const { membre } = useAuth();
  const [form, setForm] = useDraftAutoSave(LETTRE_SAVE_KEY, { poste: '', entreprise: '', secteur: '', ville: '', experience: '', competences: '', motivation: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedContext, setUploadedContext] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [toneVariants, setToneVariants] = useState([]);
  const [selectedTone, setSelectedTone] = useState(-1);
  const [proposingTone, setProposingTone] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

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

  function handleDownloadPDF(slug) {
    setShowPayment(true);
    sessionStorage.setItem('abawi-lettre-pending-export', slug);
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

  const fileSlug = (form.poste || 'lettre-motivation').replace(/[^\wÀ-ÿ\-]+/gi, '-').slice(0, 48) || 'lettre-motivation';

  const inp = { className: 'cv-input' };
  const lbl = { className: 'cv-section-title', style: { marginTop: 0 } };

  return (
    <main className="cv-page">
      {showPayment && (
        <PaymentFlow
          product={{ id: 'lettre-motivation', titre: 'Export Lettre de Motivation PDF', prix: 1490 }}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            const slug = sessionStorage.getItem('abawi-lettre-pending-export') || fileSlug;
            exportToPDF('lettre-motivation-export', slug, { includeHeader: false, includeFooter: false });
            setShowPayment(false);
          }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <DocumentProfileManager />
      </div>
      <h1 className="cv-page-title">Lettre de motivation</h1>
      <p className="cv-page-sub">Formulaire guidé, génération IA — aperçu gratuit, export PDF à 1 490 FCFA.</p>

      <div className="cv-layout">
        <div className="cv-form">
          <span {...lbl}>Cible</span>
          <input {...inp} value={form.poste} onChange={(e) => patch('poste', e.target.value)} placeholder="Intitulé du poste" />
          <input {...inp} value={form.entreprise} onChange={(e) => patch('entreprise', e.target.value)} placeholder="Entreprise ou institution" />
          <div className="cv-row">
            <input {...inp} value={form.secteur} onChange={(e) => patch('secteur', e.target.value)} placeholder="Secteur" />
            <input {...inp} value={form.ville} onChange={(e) => patch('ville', e.target.value)} placeholder="Ville / pays" />
          </div>
          <span className="cv-section-title">Votre profil</span>
          <textarea className="cv-textarea" rows={4} value={form.experience} onChange={(e) => patch('experience', e.target.value)} placeholder="Formations, expériences, réalisations chiffrées…" />
          <textarea className="cv-textarea" rows={3} value={form.competences} onChange={(e) => patch('competences', e.target.value)} placeholder="Compétences techniques et soft skills pertinentes" />

          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <button type="button" className="cv-ai-btn" style={{ fontSize: '0.78rem', flex: 1 }} onClick={proposerTons} disabled={proposingTone}>
              {proposingTone ? '⚡ Génération…' : '🎨 Variantes de ton IA'}
            </button>
          </div>
          {toneVariants.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {toneVariants.map((t, i) => (
                <button key={i} onClick={() => applyTone(i)} type="button" style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${selectedTone === i ? 'var(--gold)' : 'var(--border)'}`,
                  background: selectedTone === i ? 'rgba(240,180,41,0.06)' : 'var(--bg-card)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: selectedTone === i ? 'var(--gold)' : 'var(--text-primary)', marginBottom: 3 }}>
                    {selectedTone === i ? '✅ ' : ''}{t.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.intro}</div>
                </button>
              ))}
            </div>
          )}

          <textarea className="cv-textarea" rows={3} value={form.motivation} onChange={(e) => patch('motivation', e.target.value)} placeholder="Pourquoi cette entreprise / ce métier maintenant" />
          <span className="cv-section-title">Documents de référence (optionnel)</span>
          <FileContextUpload
            onExtracted={setUploadedContext}
            label="Importer CV, offre d'emploi, fiche de poste…"
            hint="PDF, Word, Excel, TXT — l'IA utilisera ces documents pour personnaliser la lettre"
          />
          <div className="cv-block-btns" style={{ marginTop: 12 }}>
            <button type="button" className="cv-ai-btn" onClick={generate} disabled={loading}>{loading ? 'Rédaction…' : '✨ Générer avec IA'}</button>
            {displayedText && (
              <button type="button" className="cv-add-btn" onClick={copyText}>Copier</button>
            )}
          </div>
        </div>
        <div className="cv-preview-wrap">
          <div className="cv-preview" style={{ aspectRatio:'auto', minHeight:280, padding:'18px 22px', textAlign:'left' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: 40, opacity: 0.2 }}>✉️</span>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Remplissez le formulaire et cliquez sur<br/>
                  <strong style={{ color: 'var(--text-secondary)' }}>"Générer avec IA"</strong><br/>
                  pour voir l'aperçu gratuit.
                </div>
              </div>
            )}
          </div>
          {displayedText && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexDirection: 'column' }}>
              {saveNotice && (
                <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.09)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.8rem', color: '#22c55e' }}>
                  {saveNotice}
                </div>
              )}
              <button onClick={() => { saveTool30Days(LETTRE_SAVE_KEY, { form, result: displayedText }); setSaveNotice('✅ Lettre sauvegardée pour 30 jours'); setTimeout(() => setSaveNotice(''), 3000); }} style={{
                padding: '10px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
              }}>
                💾 Sauvegarder (30 jours)
              </button>
              <button onClick={() => handleDownloadPDF(fileSlug)} style={{
                padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#F0B429,#e5a820)', color: '#070B0F', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                ⬇️ Télécharger PDF — 1 490 FCFA
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Aperçu gratuit — paiement unique à l'export
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
