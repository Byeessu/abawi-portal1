import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canAccess, hasCredits } from '../../lib/permissions';
import { cleanIATextLight } from '../../lib/cleanText';
import { callGroq } from '../../lib/groqClient';
import PaymentFlow from '../PaymentFlow';
import FileContextUpload from '../FileContextUpload';
import RichDoc from '../RichDoc';

export default function JuridiqueElite() {
  const { membre } = useAuth();
  const [activeTab, setActiveTab] = useState('contrats');
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [uploadedContext, setUploadedContext] = useState('');
  const [customDetails, setCustomDetails] = useState('');

  const accessGranted = canAccess(membre, 'outils-elite');

  const TABS = [
    { id: 'contrats', label: 'Contrats Travail', icon: '📄', prompt: 'Rédige un contrat de travail (CDD) complet conforme au Code du Travail du Sénégal et aux normes OHADA.' },
    { id: 'statuts', label: 'Statuts SARL', icon: '🏛️', prompt: 'Rédige les statuts complets d\'une SARL conforme à l\'Acte Uniforme de l\'OHADA.' },
    { id: 'bail', label: 'Bail Commercial', icon: '🔑', prompt: 'Rédige un contrat de bail commercial conforme aux règles OHADA (AUDCG).' },
    { id: 'nda', label: 'NDA / Confidentialité', icon: '🤫', prompt: 'Rédige un accord de confidentialité (NDA) robuste pour le marché sénégalais.' }
  ];

  async function generate() {
    if (!hasCredits(membre, 5)) return alert("Crédits insuffisants (5 requis)");
    setGenerating(true);
    const basePrompt = TABS.find(t => t.id === activeTab).prompt;
    const contextBlock = uploadedContext ? `\nDocuments fournis :\n${uploadedContext.slice(0, 6000)}\n` : '';
    const detailsBlock = customDetails ? `\nInformations spécifiques :\n${customDetails}\n` : '';
    const raw = await callGroq(`Tu es un avocat expert en droit OHADA et droit sénégalais. ${basePrompt} Réponds en français juridique pro, structuré, avec toutes les clauses obligatoires.${detailsBlock}${contextBlock}`, 3500);
    setContent(cleanIATextLight(raw));
    setGenerating(false);
  }

  if (!accessGranted) {
    return (
      <div className="locked-tool-overlay" style={{ textAlign: 'center', padding: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <h2 style={{ color: 'var(--gold)' }}>🔒 Juridique Élite</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Accès réservé aux membres Élite (Pack Juridique).</p>
        <button onClick={() => setShowPayment(true)} className="btn-gold" style={{ marginTop: 20 }}>Débloquer (7 900 FCFA)</button>
        {showPayment && <PaymentFlow product={{ id: 'juridique', titre: 'Pack Juridique Élite', prix: 7900 }} onClose={() => setShowPayment(false)} />}
      </div>
    );
  }

  return (
    <div className="elite-tool-wrapper">
      <div className="elite-tabs-nav" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => {setActiveTab(t.id); setContent('')}}
            style={{ padding: '10px 15px', borderRadius: 8, background: activeTab === t.id ? 'var(--gold)' : 'var(--bg-card)', color: activeTab === t.id ? '#0D1117' : 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
        <textarea
          rows={3}
          placeholder="Informations spécifiques (noms des parties, montants, dates, clauses particulières…)"
          value={customDetails}
          onChange={(e) => setCustomDetails(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
        />
        <FileContextUpload
          onExtracted={setUploadedContext}
          label="Documents de référence (optionnel)"
          hint="Modele de contrat, conventions, cahier des charges — PDF, Word, TXT"
        />
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button className="cv-ai-btn" onClick={generate} disabled={generating}>{generating ? '⚖️ Rédaction...' : '✨ Générer avec IA (5 crédits)'}</button>
        </div>
      </div>
      {content && (
        <div style={{ background:'var(--bg-primary)', padding:'16px 20px', borderRadius:12, border:'1px solid var(--border)' }}>
          <RichDoc text={content} editable exportId="juridique-export" exportSlug={`document-juridique-${activeTab}`} />
        </div>
      )}
    </div>
  );
}
