import { useState, useRef } from 'react';
import { callGroq, cleanIATextLight } from '../../lib/abawi-ia';
import { toUserFriendlyAIError } from '../../lib/aiErrorMessages';
import { buildSystemPrompt } from '../../lib/abawi-persona';
import IAResponseDisplay from '../IAResponseDisplay';
import { useAuth } from '../../context/AuthContext'
import { useFreeToolQuota } from '../../hooks/useFreeToolQuota'
import FreeToolPaywall from '../../components/FreeToolPaywall'

export default function DebatMode({ language = 'fr' } = {}) {
  const { membre } = useAuth()
  const quota = useFreeToolQuota('abawi_ia', {
    anonymousLimit: 5, memberLimit: 10, membre, creditType: 'abawi_ia',
  })
  const [showPaywall, setShowPaywall] = useState(false)

  const [sujet, setSujet] = useState('');
  const [position, setPosition] = useState('pour');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const sysRef = useRef(null);
  const bottomRef = useRef(null);

  // NOTE: pas de scroll auto — fenêtre stable.

  async function checkAccessThen() {
    if (quota.quotaAvailable) {
      quota.recordUse()
      return true
    }
    if (quota.canUseCredits) {
      const result = await quota.debitCredits()
      if (result.ok) return true
    }
    setShowPaywall(true)
    return false
  }

  async function start() {
    if (!sujet.trim()) return;
    const ok = await checkAccessThen()
    if (!ok) return
    setStarted(true);
    setLoading(true);
    const posOppose = position === 'pour' ? 'contre' : 'pour';
    sysRef.current = {
      role: 'system',
      content: buildSystemPrompt({ language,
        role: "débatteur expert ABAWI, polyvalent et rigoureux",
        includeStyle: false,
        extra: `RÔLE DÉBAT : Le sujet est : "${sujet}". Tu défends la position ${posOppose.toUpperCase()} pendant que l'utilisateur défend ${position.toUpperCase()}.
Tes arguments sont précis, factuels, ancrés dans des exemples africains et des données chiffrées.
FORMAT : 3 à 4 phrases maximum, **gras** pour les arguments clés, ton incisif et courtois.`,
      })
    };
    try {
      const intro = cleanIATextLight(await callGroq([sysRef.current, { role: 'user', content: 'Présente ton argument d\'ouverture.' }], 350));
      setMessages([{ role: 'assistant', content: intro }]);
    } catch (e) {
      setMessages([{ role: 'assistant', content: toUserFriendlyAIError(e, 'Simulation indisponible, réessayez dans quelques instants.') }]);
    }
    setLoading(false);
  }

  async function send() {
    if (!input.trim()) return;
    const ok = await checkAccessThen()
    if (!ok) return
    const newMsgs = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const response = cleanIATextLight(await callGroq([sysRef.current, ...newMsgs], 380));
      setMessages(m => [...m, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: toUserFriendlyAIError(e, 'Réponse indisponible momentanément.') }]);
    }
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

      {showPaywall && (
        <FreeToolPaywall
          toolName="Débat IA"
          usedToday={quota.usedToday}
          limit={quota.limit}
          membre={membre}
          creditCost={quota.creditCost}
          soldeCredits={quota.soldeCredits}
          upgradeAction="generate"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}
