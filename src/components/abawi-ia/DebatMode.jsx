import { useState, useRef, useEffect } from 'react';
import { callGroq, cleanIATextLight } from '../../lib/abawi-ia';
import IAResponseDisplay from '../IAResponseDisplay';

export default function DebatMode() {
  const [sujet, setSujet] = useState('');
  const [position, setPosition] = useState('pour');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const sysRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function start() {
    setStarted(true);
    setLoading(true);
    const posOppose = position === 'pour' ? 'contre' : 'pour';
    sysRef.current = {
      role: 'system',
      content: `Tu es un débatteur expert et rigoureux. Le sujet est: "${sujet}". Tu défends la position ${posOppose.toUpperCase()} pendant que l'utilisateur est ${position.toUpperCase()}. Tes arguments sont précis, basés sur des faits et des exemples africains. Réponds en 3-4 phrases max. Formate avec **gras** pour les arguments clés.`
    };
    const intro = cleanIATextLight(await callGroq([sysRef.current, { role: 'user', content: 'Présente ton argument d\'ouverture.' }], 400));
    setMessages([{ role: 'assistant', content: intro }]);
    setLoading(false);
  }

  async function send() {
    if (!input.trim()) return;
    const msg = { role: 'user', content: input };
    const newMsgs = [...messages, msg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    const response = cleanIATextLight(await callGroq([sysRef.current, ...newMsgs], 500));
    setMessages(m => [...m, { role: 'assistant', content: response }]);
    setLoading(false);
  }

  if (!started) return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '20px' }}>⚖️ Débat avec l'IA</h3>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Sujet du débat</label>
        <input value={sujet} onChange={e => setSujet(e.target.value)} placeholder="Ex: L'IA va-t-elle remplacer les juristes en Afrique ?"
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Votre position</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['pour', 'contre'].map(p => (
            <button key={p} onClick={() => setPosition(p)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${position === p ? '#EF4444' : 'var(--border)'}`, background: position === p ? 'rgba(239,68,68,0.1)' : 'transparent', color: position === p ? '#EF4444' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: position === p ? 700 : 400, fontFamily: 'Outfit,sans-serif' }}>
              {p === 'pour' ? '✅ Pour' : '❌ Contre'}
            </button>
          ))}
        </div>
      </div>
      <button onClick={start} disabled={!sujet.trim()} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: !sujet.trim() ? 'var(--bg-card)' : 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', color: !sujet.trim() ? 'var(--text-muted)' : '#fff', fontWeight: 800, cursor: !sujet.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Outfit,sans-serif' }}>
        ⚖️ Lancer le débat
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '90%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: m.role === 'user' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'var(--bg-card)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none', color: m.role === 'user' ? '#fff' : 'var(--text-primary)' }}>
              {m.role === 'user' ? <span style={{ fontSize: '0.88rem' }}>{m.content}</span> : <IAResponseDisplay text={m.content} compact accentColor="#EF4444" docTitle="Débat ABAWI IA" />}
            </div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex', gap: 6, padding: '12px' }}>{[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: `abia-pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} placeholder="Votre argument..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', fontFamily: 'Outfit,sans-serif' }} />
        <button onClick={send} disabled={!input.trim() || loading} style={{ padding: '12px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', color: '#fff', cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}
