import { useState } from 'react';
import { callGroq, cleanIATextLight } from '../../lib/abawi-ia';
import IAResponseDisplay from '../IAResponseDisplay';

export default function ApprentissageMode() {
  const [topic, setTopic] = useState('');
  const [niveau, setNiveau] = useState('débutant');
  const [parcours, setParcours] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stepContent, setStepContent] = useState({});
  const [stepLoading, setStepLoading] = useState(false);

  async function generateParcours() {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const raw = await callGroq([
        { role: 'system', content: 'Tu crées des parcours d\'apprentissage structurés. Réponds UNIQUEMENT en JSON valide.' },
        {
          role: 'user',
          content: `Crée un parcours d'apprentissage niveau ${niveau} sur "${topic}" avec 5 étapes.
JSON: {"titre": "...", "description": "...", "etapes": [{"titre": "...", "objectif": "...", "duree": "..."}]}`
        }
      ], 1500, true);
      const p = JSON.parse(raw);
      setParcours(p);
      setCurrentStep(0);
      setStepContent({});
    } catch {
      setParcours({ titre: `Parcours: ${topic}`, description: 'Formation personnalisée', etapes: ['Introduction', 'Bases', 'Pratique', 'Avancé', 'Maîtrise'].map((t, i) => ({ titre: t, objectif: `Étape ${i + 1} du parcours`, duree: '15 min' })) });
    }
    setLoading(false);
  }

  async function loadStep(idx) {
    if (stepContent[idx]) { setCurrentStep(idx); return; }
    setCurrentStep(idx);
    setStepLoading(true);
    const step = parcours.etapes[idx];
    try {
      const content = cleanIATextLight(await callGroq([
        { role: 'system', content: 'Tu es un pédagogue expert. Formate en Markdown structuré : ## sections principales, ### sous-sections, **gras** pour les termes clés, - pour les listes, paragraphes séparés par des lignes vides. Structure claire et fluide.' },
        { role: 'user', content: `Explique en détail l'étape "${step.titre}" du parcours sur "${topic}" pour un apprenant niveau ${niveau}. Objectif: ${step.objectif}. Donne du contenu complet et pédagogique.` }
      ], 1500));
      setStepContent(c => ({ ...c, [idx]: content }));
    } catch {
      setStepContent(c => ({ ...c, [idx]: 'Contenu en cours de chargement...' }));
    }
    setStepLoading(false);
  }

  if (!parcours) return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '20px' }}>📚 Apprentissage guidé par IA</h3>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Sujet à apprendre</label>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Comptabilité SYSCOHADA, Python, Marketing digital..."
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Niveau actuel</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['débutant', 'intermédiaire', 'avancé'].map(n => (
            <button key={n} onClick={() => setNiveau(n)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${niveau === n ? '#18A84A' : 'var(--border)'}`, background: niveau === n ? 'rgba(24,168,74,0.1)' : 'transparent', color: niveau === n ? '#18A84A' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: niveau === n ? 700 : 400, fontSize: '0.82rem', fontFamily: 'Outfit,sans-serif' }}>{n}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(24,168,74,0.2)', borderTopColor: '#18A84A', borderRadius: '50%', animation: 'abia-spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <button onClick={generateParcours} disabled={!topic.trim()} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: !topic.trim() ? 'var(--bg-card)' : 'linear-gradient(135deg, #18A84A, #15803D)', border: 'none', color: !topic.trim() ? 'var(--text-muted)' : '#fff', fontWeight: 800, cursor: !topic.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Outfit,sans-serif' }}>
          📚 Générer mon parcours d'apprentissage
        </button>
      )}
    </div>
  );

  const step = parcours.etapes[currentStep];
  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
      <div style={{ marginBottom: 20, padding: '20px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.72rem', color: '#18A84A', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Parcours · {niveau}</div>
        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: 4 }}>{parcours.titre}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{parcours.description}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {parcours.etapes.map((e, i) => (
          <button key={i} onClick={() => loadStep(i)} style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 10, border: `2px solid ${currentStep === i ? '#18A84A' : 'var(--border)'}`, background: currentStep === i ? 'rgba(24,168,74,0.1)' : stepContent[i] ? 'rgba(24,168,74,0.04)' : 'transparent', color: currentStep === i ? '#18A84A' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: currentStep === i ? 700 : 400, fontFamily: 'Outfit,sans-serif' }}>
            {stepContent[i] ? '✅ ' : ''}{i + 1}. {e.titre}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Étape {currentStep + 1}/{parcours.etapes.length} · {step?.duree}</div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>{step?.titre}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>{step?.objectif}</div>
          </div>
          {!stepContent[currentStep] && !stepLoading && (
            <button onClick={() => loadStep(currentStep)} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #18A84A, #15803D)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Apprendre →</button>
          )}
        </div>

        {stepLoading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(24,168,74,0.2)', borderTopColor: '#18A84A', borderRadius: '50%', animation: 'abia-spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : stepContent[currentStep] ? (
          <IAResponseDisplay text={stepContent[currentStep]} accentColor="#18A84A" docTitle={`Étape — ${step?.titre || ''}`} />
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Cliquez "Apprendre" pour accéder au contenu de cette étape.</div>
        )}
      </div>
    </div>
  );
}
