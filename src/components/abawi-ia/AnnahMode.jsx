import { useState, useRef, useEffect } from 'react';
import { callGroq, cleanIATextLight } from '../../lib/abawi-ia';
import { stopSpeaking } from '../../lib/ttsEngine';
import { toUserFriendlyAIError } from '../../lib/aiErrorMessages';
import { buildSystemPrompt } from '../../lib/abawi-persona';
import IAResponseDisplay from '../IAResponseDisplay';
import { useAuth } from '../../context/AuthContext'
import { useFreeToolQuota } from '../../hooks/useFreeToolQuota'
import FreeToolPaywall from '../../components/FreeToolPaywall'

const ANNAH_KEY = 'abawi_annah_messages'
const GREETING = 'Salut, je suis Annah, votre assistante stratégique. Je suis là pour vous conseiller avec précision sur vos enjeux professionnels, business et personnels. Comment puis-je vous aider aujourd\'hui ?'

function getGoogleFrenchVoice() {
  const voices = window.speechSynthesis?.getVoices() || []
  const lower = (s) => s.toLowerCase()

  const isMaleName = (name) =>
    /\bmale\b|homme|thomas|daniel|jacques|pierre|paul|louis|henri|antoine|marc|\bjean\b|franck|arnaud|nicolas|mathieu|philippe|benoit|olivier|serge/.test(lower(name))

  // 1. Voix Google Neural fr-FR (Chrome/Android) — la plus naturelle disponible gratuitement
  const googleNeural = voices.find(v =>
    lower(v.name).includes('google') && v.lang?.startsWith('fr')
  )
  if (googleNeural) return googleNeural

  // 2. macOS / iOS — voix neurale Apple
  for (const t of ['ameli', 'ariane', 'aurelie', 'claire']) {
    const found = voices.find(v => v.lang?.startsWith('fr') && lower(v.name).replace(/[éèê]/g, 'e').includes(t))
    if (found) return found
  }

  // 3. Edge / Windows Neural
  for (const t of ['hortense', 'denise', 'vivienne', 'brigitte', 'julie', 'eloise', 'camille', 'sonia']) {
    const found = voices.find(v => v.lang?.startsWith('fr') && lower(v.name).includes(t))
    if (found) return found
  }

  // 4. Toute voix fr non masculine
  return voices.find(v => v.lang?.startsWith('fr') && !isMaleName(v.name))
    ?? voices.find(v => v.lang?.startsWith('fr'))
    ?? voices[0]
    ?? null
}

export default function AnnahMode({ language = 'fr' } = {}) {
  const { membre } = useAuth()
  const quota = useFreeToolQuota('abawi_ia', {
    anonymousLimit: 5, memberLimit: 10, membre, creditType: 'abawi_ia',
  })
  const [showPaywall, setShowPaywall] = useState(false)

  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ANNAH_KEY) || 'null') || [] } catch { return [] }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const bottomRef = useRef(null);
  const voiceRef = useRef(null);
  const recogRef = useRef(null);

  // Persist on every change (max 40 messages)
  useEffect(() => {
    if (messages.length > 0) {
      try { localStorage.setItem(ANNAH_KEY, JSON.stringify(messages.slice(-40))) } catch { /* ignore */ }
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: GREETING }]);
    }
  }, [messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, interimText]);

  function clearConversation() {
    localStorage.removeItem(ANNAH_KEY)
    setMessages([{ role: 'assistant', content: GREETING }]);
    stopVoice();
  }

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

  async function send(userText = input) {
    const text = userText?.trim()
    if (!text) return;
    const ok = await checkAccessThen()
    if (!ok) return
    const msg = { role: 'user', content: text };
    const newMsgs = [...messages, msg];
    setMessages(newMsgs);
    setInput('');
    setInterimText('');
    setLoading(true);

    try {
      const response = cleanIATextLight(await callGroq([
        {
          role: 'system',
          content: buildSystemPrompt({ language,
            role: "Annah, assistante vocale premium et stratégique du portail ABAWI — sophistiquée, bienveillante, experte multidisciplinaire",
            extra: `TONALITÉ : français élégant, voix posée, conseils concrets et actionnables pour entrepreneurs et cadres africains.
FORMAT VOCAL-FRIENDLY : phrases courtes, paragraphes séparés par une ligne vide, ## pour les sections, **gras** pour les points clés, - pour les listes. Évite les tableaux (illisibles à la lecture vocale).`,
          }),
        },
        ...newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content }))
      ], 700));
      setMessages(m => [...m, { role: 'assistant', content: response }]);
      if (voiceMode) {
        setTimeout(() => speakBrowser(response), 300);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: toUserFriendlyAIError(e, 'Désolée, je suis momentanément indisponible. Réessayez dans quelques instants.') }]);
    }
    setLoading(false);
  }

  function speakBrowser(text) {
    if (!window.speechSynthesis) return;
    stopSpeaking();
    window.speechSynthesis.cancel();

    // Nettoyage du markdown pour une lecture naturelle
    const clean = text
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^[-•]\s+/gm, '')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .trim()

    // Chrome bug : speechSynthesis se coupe après ~15s — chunker par phrases
    const sentences = clean.match(/[^.!?]+[.!?]+\s*/g) || [clean]

    // Voix choisie une seule fois pour toutes les phrases
    const voice = getGoogleFrenchVoice()

    // Délai de chargement des voix si elles ne sont pas encore disponibles
    const speakAll = () => {
      const selectedVoice = voice || getGoogleFrenchVoice()
      setSpeaking(true)
      let idx = 0
      const next = () => {
        if (idx >= sentences.length) { setSpeaking(false); return }
        const u = new SpeechSynthesisUtterance(sentences[idx++].trim())
        if (selectedVoice) u.voice = selectedVoice
        u.rate = 0.97   // légèrement moins vite = plus naturel
        u.pitch = 1.0   // pitch neutre = voix non artificielle
        u.volume = 1
        u.onend = next
        u.onerror = () => { setSpeaking(false) }
        voiceRef.current = u
        window.speechSynthesis.speak(u)
      }
      next()
    }

    // Les voix peuvent ne pas être chargées immédiatement au premier appel
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { speakAll(); window.speechSynthesis.onvoiceschanged = null }
    } else {
      speakAll()
    }
  }

  function stopVoice() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setIsListening(false);
    if (recogRef.current) {
      try { recogRef.current.stop() } catch { /* ignore */ }
      recogRef.current = null;
    }
  }

  function toggleVoiceMode() {
    const next = !voiceMode;
    setVoiceMode(next);
    if (!next) {
      stopVoice();
    } else {
      // Greet user in voice mode
      const greeting = messages.length <= 1 ? GREETING : '';
      if (greeting) setTimeout(() => speakBrowser(greeting.replace(/\*\*/g, '')), 400);
    }
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('API SpeechRecognition non disponible. Utilisez Chrome ou Edge.'); return; }
    setIsListening(true);
    setInterimText('');
    const recog = new SR();
    recog.lang = 'fr-FR';
    recog.continuous = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    let finalChunk = '';
    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setInterimText(interim);
    };
    recog.onerror = (e) => {
      if (e.error !== 'aborted') console.error('Speech error:', e.error);
    };
    recog.onend = () => {
      setIsListening(false);
      setInterimText('');
      if (finalChunk.trim()) {
        send(finalChunk.trim());
      }
      recogRef.current = null;
    };
    recog.start();
    recogRef.current = recog;
  }

  function stopListening() {
    setIsListening(false);
    if (recogRef.current) {
      try { recogRef.current.stop() } catch { /* ignore */ }
      recogRef.current = null;
    }
  }

  async function speak(text) {
    if (speaking) { stopVoice(); return; }
    speakBrowser(text);
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 8, boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>✦</div>
        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Annah</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Assistante vocale stratégique premium</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
          {messages.length > 1 && (
            <button onClick={clearConversation} style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
              Nouvelle conversation
            </button>
          )}
          <button onClick={toggleVoiceMode} style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${voiceMode ? '#F59E0B' : 'var(--border)'}`, background: voiceMode ? 'rgba(245,158,11,0.12)' : 'transparent', color: voiceMode ? '#F59E0B' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
            {voiceMode ? '🔊 Mode vocal ON' : '🎙 Activer mode vocal'}
          </button>
        </div>
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
        {interimText && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '90%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', background: 'rgba(245,158,11,0.15)', border: '1px dashed rgba(245,158,11,0.4)', color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>{interimText}</span>
              <div style={{ fontSize: '0.65rem', color: '#F59E0B', marginTop: 3, fontWeight: 600 }}>🎙 Écoute en cours...</div>
            </div>
          </div>
        )}
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

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} placeholder="Posez votre question à Annah..."
          style={{ flex: 1, padding: '13px 18px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', fontFamily: 'Outfit,sans-serif' }} />
        {voiceMode ? (
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            style={{ padding: '13px 18px', borderRadius: '50%', background: isListening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg, #F59E0B, #EA580C)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '1.2rem', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Maintenez pour parler"
          >
            {isListening ? '●' : '🎙'}
          </button>
        ) : (
          <button onClick={send} disabled={!input.trim() || loading} style={{ padding: '13px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #EA580C)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>→</button>
        )}
      </div>

      {showPaywall && (
        <FreeToolPaywall
          toolName="Annah — Assistant Vocal"
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
