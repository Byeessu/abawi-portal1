import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cleanIATextLight } from '../../lib/cleanText';
import { callGroq } from '../../lib/groqClient';
import DocumentProfileManager from '../DocumentProfileManager';

export default function BusinessPlan() {
  const { membre } = useAuth();
  const [form, setForm] = useState({
    societe: '', secteur: '', mission: '', effectif: '',
    ca1: '', ca2: '', ca3: '', ch1: '', ch2: '', ch3: '',
  });
  const [syntheseIA, setSyntheseIA] = useState('');
  const [rawDataText, setRawDataText] = useState('');
  const [rawLoading, setRawLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [cachetUrl, setCachetUrl] = useState('');
  const [pageStart, setPageStart] = useState(1);
  const [showPageNum, setShowPageNum] = useState(false);

  function patch(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const n = (v) => parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;
  const ca = [n(form.ca1), n(form.ca2), n(form.ca3)];
  const ch = [n(form.ch1), n(form.ch2), n(form.ch3)];
  const res = ca.map((c, i) => c - ch[i]);
  const marge = ca.map((c, i) => (c > 0 ? ((res[i] / c) * 100).toFixed(1) : '—'));
  const croissance =
    ca[1] > 0 ? `${(((ca[2] - ca[1]) / ca[1]) * 100).toFixed(1)} % (N-1 → N)` : ca[0] > 0 ? `${(((ca[1] - ca[0]) / ca[0]) * 100).toFixed(1)} % (N-2 → N-1)` : '—';

  const blocChiffre = [
    `Projet : ${form.societe || '—'}`,
    `Secteur : ${form.secteur || '—'} · Effectif visé : ${form.effectif || '—'}`,
    '',
    'Synthèse chiffrée (FCFA, ordre N-2, N-1, N)',
    `CA : ${ca.map((x) => x.toLocaleString('fr-FR')).join(' · ')}`,
    `Charges / coûts directs : ${ch.map((x) => x.toLocaleString('fr-FR')).join(' · ')}`,
    `Résultat simplifié (CA − charges) : ${res.map((x) => x.toLocaleString('fr-FR')).join(' · ')}`,
    `Marge après charges (%) : ${marge.join(' · ')}`,
    `Dynamique de croissance du CA : ${croissance}`,
    '',
    form.mission ? `Mission / vision (rédaction utilisateur) :\n${form.mission}` : '',
    syntheseIA ? `\nCommentaires stratégiques (IA) :\n${syntheseIA}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  async function enrichirIA() {
    setLoading(true);
    try {
      const rawSnippet = rawDataText ? rawDataText.slice(0, 50000) : '';
      const raw = await callGroq(
        `Entreprise : ${form.societe}\nSecteur : ${form.secteur}\nMission : ${form.mission || 'non fournie'}\nEffectif cible : ${form.effectif}\nCA N-2/N-1/N (FCFA) : ${ca.join(' / ')}\nCharges N-2/N-1/N : ${ch.join(' / ')}\nMarges % : ${marge.join(' / ')}\nCroissance CA : ${croissance}\n\nDonnées brutes supplémentaires :\n${rawSnippet || '(aucune)'}\n\n---\nRédige une synthèse exécutive en français (12 à 18 phrases) couvrant : marché, risques, priorités 12 mois, leviers de croissance.\nRègle absolue : exploite TOUTES les données fournies ci-dessus. Si tu formules une hypothèse, signale-la explicitement entre crochets [Hypothèse].`,
        { maxTokens: 2000, temperature: 0.2, system: "Tu es Associé Senior dans un cabinet de conseil stratégique (niveau McKinsey / BCG Afrique). Tu analyses les données EXACTEMENT telles que fournies sans les minimiser ni les enjoliver. Chaque hypothèse est explicitement signalée. Ton style est dense, chiffré, actionnable." }
      );
      setSyntheseIA(cleanIATextLight(raw));
    } finally {
      setLoading(false);
    }
  }

  async function structurerAvecIA() {
    if (!rawDataText) {
      alert("Importez d'abord des données brutes (CSV/Excel/JSON/TXT).");
      return;
    }
    setLoading(true);
    try {
      const rawSnippet = rawDataText.slice(0, 80000);
      const raw = await callGroq(
        `Projet : ${form.societe || '(non fourni)'}\nSecteur : ${form.secteur || '(non fourni)'}\nMission : ${form.mission || '(non fournie)'}\nEffectif visé : ${form.effectif || '(non fourni)'}\nCA N-2/N-1/N (FCFA) : ${ca.join(' / ')}\nCharges N-2/N-1/N : ${ch.join(' / ')}\nMarges % : ${marge.join(' / ')}\nCroissance CA : ${croissance}\n\nDOCUMENTS SOURCES IMPORTÉS :\n${rawSnippet}\n\n---\nProduis un business plan structuré (Markdown, FR) en 9 sections :\n1) Résumé exécutif (12-16 lignes)\n2) Données réelles vs hypothèses — "Réel" (présent dans les imports) | "À valider" + comment obtenir\n3) Marché : segmentation + TAM/SAM/SOM (chiffré si données disponibles, sinon hypothèses explicites)\n4) Proposition de valeur : 6-8 points\n5) Stratégie GTM : plan 90 jours + 12 mois (axes + actions + KPI mesurables)\n6) Opérations : processus clés + ressources critiques\n7) Risques majeurs + atténuations concrètes\n8) KPIs prioritaires (6-10)\n9) Projections financières 3 ans avec résultats, marges et scénarios explicitement liés aux données fournies\n\nREGLE : exploite chaque chiffre et fait fourni dans les sources. Signale [Hypothèse] si tu extrapoles.`,
        { maxTokens: 6000, temperature: 0.2, system: "Tu es Associé Senior dans un cabinet de conseil stratégique (niveau McKinsey / BCG Afrique). Tu t'appuies EXCLUSIVEMENT sur les données fournies. Chaque hypothèse est signalée [Hypothèse]. Ton analyse est chiffrée, dense et actionnalble. Pas de rembourrage." }
      );
      setSyntheseIA(cleanIATextLight(raw));
    } finally {
      setLoading(false);
    }
  }

  const fileSlug = (form.societe || 'business-plan').replace(/[^\wÀ-ÿ-]+/gi, '-').slice(0, 48) || 'business-plan';

  return (
    <main className="cv-page">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <DocumentProfileManager />
      </div>
      <h1 className="cv-page-title">Business plan express</h1>
      <p className="cv-page-sub">Vision, chiffres sur 3 exercices, marges automatiques et synthèse IA optionnelle ; export PDF pour présentation.</p>
      <div className="cv-layout">
        <div className="cv-form">
          <input className="cv-input" value={form.societe} onChange={(e) => patch('societe', e.target.value)} placeholder="Nom du projet / société" />
          <div className="cv-row">
            <input className="cv-input" value={form.secteur} onChange={(e) => patch('secteur', e.target.value)} placeholder="Secteur" />
            <input className="cv-input" value={form.effectif} onChange={(e) => patch('effectif', e.target.value)} placeholder="Effectif (ex. 5)" />
          </div>
          <textarea className="cv-textarea" rows={3} value={form.mission} onChange={(e) => patch('mission', e.target.value)} placeholder="Mission, offre, différenciation" />
          <span className="cv-section-title">Chiffres (FCFA)</span>
          <div className="cv-row">
            <input className="cv-input" type="number" min={0} value={form.ca1} onChange={(e) => patch('ca1', e.target.value)} placeholder="CA N-2" />
            <input className="cv-input" type="number" min={0} value={form.ch1} onChange={(e) => patch('ch1', e.target.value)} placeholder="Charges N-2" />
          </div>
          <div className="cv-row">
            <input className="cv-input" type="number" min={0} value={form.ca2} onChange={(e) => patch('ca2', e.target.value)} placeholder="CA N-1" />
            <input className="cv-input" type="number" min={0} value={form.ch2} onChange={(e) => patch('ch2', e.target.value)} placeholder="Charges N-1" />
          </div>
          <div className="cv-row">
            <input className="cv-input" type="number" min={0} value={form.ca3} onChange={(e) => patch('ca3', e.target.value)} placeholder="CA N" />
            <input className="cv-input" type="number" min={0} value={form.ch3} onChange={(e) => patch('ch3', e.target.value)} placeholder="Charges N" />
          </div>
          <div className="bp-fin-table" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div><strong>Marge après charges</strong> : {marge.join(' · ')} %</div>
            <div style={{ marginTop: 6 }}><strong>Croissance CA</strong> : {croissance}</div>
          </div>

          <span className="cv-section-title" style={{ marginTop: 14 }}>Visuels du document</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Logo</span>
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoUrl(String(r.result)); r.readAsDataURL(f); } }} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 40, objectFit: 'contain', borderRadius: 6 }} />}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Signature</span>
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setSignatureUrl(String(r.result)); r.readAsDataURL(f); } }} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              {signatureUrl && <img src={signatureUrl} alt="signature" style={{ height: 40, objectFit: 'contain', borderRadius: 6 }} />}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cachet</span>
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setCachetUrl(String(r.result)); r.readAsDataURL(f); } }} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              {cachetUrl && <img src={cachetUrl} alt="cachet" style={{ height: 40, objectFit: 'contain', borderRadius: 6 }} />}
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showPageNum} onChange={e => setShowPageNum(e.target.checked)} />
              Numéroter les pages à partir de
            </label>
            {showPageNum && (
              <input type="number" min={1} value={pageStart} onChange={e => setPageStart(parseInt(e.target.value) || 1)} style={{ width: 60, padding: '4px 8px', borderRadius: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
