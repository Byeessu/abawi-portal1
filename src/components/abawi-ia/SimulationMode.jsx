import { useState, useRef, useEffect } from 'react';
import { callGroq, cleanIATextLight } from '../../lib/abawi-ia';
import IAResponseDisplay from '../IAResponseDisplay';

export default function SimulationMode() {
  const [type, setType] = useState('');
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const systemMsgRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const SIMULATIONS = [
    { id: 'entretien', label: "👔 Entretien d'embauche", desc: "L'IA joue le recruteur" },
    { id: 'negociation', label: '🤝 Négociation commerciale', desc: "L'IA joue l'acheteur" },
    { id: 'investisseur', label: '💼 Pitch investisseur', desc: "L'IA joue l'investisseur" },
    { id: 'client_difficile', label: '😤 Client difficile', desc: 'Gérez une situation tendue' },
    { id: 'banquier', label: '🏦 Demande de crédit', desc: "L'IA joue le banquier" },
    { id: 'mediation', label: '⚖️ Médiation conflit', desc: 'Résolvez un conflit RH' },
  ];

  async function startSimulation() {
    setStarted(true);
    setLoading(true);
    const sim = SIMULATIONS.find(s => s.id === type);
    const sys = {
      role: 'system',
      content: `Tu joues le rôle dans une simulation professionnelle : ${sim?.label}.
Contexte : ${context || 'Situation professionnelle standard au Sénégal'}
RÈGLES :
- Tu joues le rôle de façon réaliste et exigeante
- Tes réponses sont courtes (2-4 phrases max)
- Tu poses des questions ou challenges l'utilisateur
- Après 5 échanges, tu donnes un bref feedback sur la performance
- Tu t'exprimes en français professionnel
- Commence par introduire la situation et te présenter dans ton rôle`,
    };
    systemMsgRef.current = sys;
    const intro = cleanIATextLight(await callGroq([sys, { role: 'user', content: 'Commençons la simulation.' }], 400));
    setMessages([{ role: 'assistant', content: intro }]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    const contextMessages = [systemMsgRef.current, ...newMessages.map(m => ({ role: m.role, content: m.content }))].filter(Boolean);
    const response = cleanIATextLight(await callGroq(contextMessages, 400));
    setMessages(m => [...m, { role: 'assistant', content: response }]);
    setLoading(false);
  }

  if (!started) return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '20px' }}>💼 Choisissez votre simulation</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {SIMULATIONS.map(s => (
          <button key={s.id} onClick={() => setType(s.id)} style={{ padding: '16px', borderRadius: '12px', textAlign: 'left', border: `2px solid ${type === s.id ? '#06B6D4' : 'var(--border)'}`, background: type === s.id ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Outfit,sans-serif' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Contexte spécifique (optionnel)</label>
        <input value={context} onChange={e => setContext(e.target.value)} placeholder="Ex: Poste de Directeur Commercial chez une PME de 50 employés..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif' }} />
      </div>
      <button onClick={startSimulation} disabled={!type} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: !type ? 'var(--bg-card)' : 'linear-gradient(135deg, #06B6D4, #0891B2)', border: 'none', color: !type ? 'var(--text-muted)' : '#fff', fontWeight: 800, cursor: !type ? 'not-allowed' : 'pointer', fontFamily: 'Outfit,sans-serif' }}>
        🎬 Lancer la simulation
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '88%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: m.role === 'user' ? 'linear-gradient(135deg, #06B6D4, #0891B2)' : 'var(--bg-card)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none', color: m.role === 'user' ? '#fff' : 'var(--text-primary)' }}>
              {m.role === 'user' ? <span style={{ fontSize: '0.88rem' }}>{m.content}</span> : <IAResponseDisplay text={m.content} compact accentColor="#06B6D4" docTitle="Simulation ABAWI IA" />}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '6px', padding: '12px' }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06B6D4', animation: `abia-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}/>)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage() }} placeholder="Votre réponse..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', fontFamily: 'Outfit,sans-serif' }} />
        <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ padding: '12px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #06B6D4, #0891B2)', border: 'none', color: '#fff', cursor: 'pointer' }}>→</button>
      </div>
      <button onClick={() => { setStarted(false); setMessages([]); setType('') }} style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Outfit,sans-serif' }}>← Choisir une autre simulation</button>
    </div>
  );
}
