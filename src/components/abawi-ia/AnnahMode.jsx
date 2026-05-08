import { useState, useRef, useEffect } from 'react';
import { callGroq, cleanIATextLight } from '../../lib/abawi-ia';
import { speak as speakTTS, stopSpeaking } from '../../lib/ttsEngine';
import IAResponseDisplay from '../IAResponseDisplay';

const ANNAH_KEY = 'abawi_annah_messages'
const GREETING = 'Bonjour, je suis **Annah**, votre assistante stratégique ABAWI. Je suis là pour vous conseiller avec précision sur vos enjeux professionnels, business et personnels. Comment puis-je vous aider aujourd\'hui ?'

export default function AnnahMode() {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ANNAH_KEY) || 'null') || [] } catch { return [] }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Persist on every change (max 40 messages)
  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(ANNAH_KEY, JSON.stringify(messages.slice(-40))) } catch {}
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: GREETING }]);
    }
  }, []);

  function clearConversation() {
    localStorage.removeItem(ANNAH_KEY)
    setMessages([{ role: 'assistant', content: GREETING }]);
  }

  async function send() {
    if (!input.trim()) return;
    const msg = { role: 'user', content: input };
    const newMsgs = [...messages, msg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const response = cleanIATextLight(await callGroq([
        {
          role: 'system',
          content: `Tu es Annah, l'assistante vocale premium et stratégique du portail ABAWI. Tu es sophistiquée, professionnelle, bienveillante et experte. Tu donnes des conseils concrets et actionnables pour les professionnels et entrepreneurs africains. Tu réponds en français élégant.

FORMAT OBLIGATOIRE : utilise ## pour les sections, **gras** pour les points clés, - pour les listes à puces. Sépare chaque paragraphe par une ligne vide. Structure toujours ta réponse avec des sections claires.`
        },
        ...newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content }))
      ], 1200));
      setMessages(m => [...m, { role: 'assistant', content: response }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Désolée, une erreur est survenue. Veuillez réessayer.' }]);
    }
    setLoading(false);
  }

  async function speak(text) {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(true);
    try {
      await speakTTS(text, { voice: 'fr-FR-DeniseNeural', rate: 1.0, pitch: 1.05 });
    } catch {}
    setSpeaking(false);
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 8, boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>✦</div>
        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Annah</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Assistante vocale stratégique premium</div>
        {messages.length > 1 && (
          <button onClick={clearConversation} style={{ marginTop: 8, padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
            Nouvelle conversation
          </button>
        )}
      </div>

      <div style={{ maxHeight: '460px', overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-start' }}>
            {m.role === 'assistant' && <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #F59E0B, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>✦</div>}
            <div style={{ maxWidth: '90%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: m.role === 'user' ? 'linear-gradient(135deg, #F59E0B, #EA580C)' : 'var(--bg-card)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none', color: m.role === 'user' ? '#fff' : 'var(--text-primary)' }}>
              {m.role === 'user' ? <span style={{ fontSize: '0.88rem' }}>{m.content}</span> : <IAResponseDisplay text={m.content} compact accentColor="#F59E0B" docTitle="Annah — ABAWI IA" />}
              {m.role === 'assistant' && (
                <button onClick={() => speak(m.content)} style={{ marginTop: 8, padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'transparent', color: '#F59E0B', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                  {speaking ? '⏹ Stop' : '🔊 Écouter'}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>✦</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: `abia-pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} placeholder="Posez votre question à Annah..."
          style={{ flex: 1, padding: '13px 18px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', fontFamily: 'Outfit,sans-serif' }} />
        <button onClick={send} disabled={!input.trim() || loading} style={{ padding: '13px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>→</button>
      </div>
    </div>
  );
}
