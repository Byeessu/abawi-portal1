import { useState, useEffect } from 'react';
import { callGroq, DOMAINES } from '../../lib/abawi-ia';
import { toUserFriendlyAIError } from '../../lib/aiErrorMessages';
import { useAuth } from '../../context/AuthContext'
import { useFreeToolQuota } from '../../hooks/useFreeToolQuota'

const QUIZ_KEY = 'abawi_quiz_history'

export default function QuizMode({ language = 'fr' } = {}) {
  const { membre } = useAuth()
  const quota = useFreeToolQuota('abawi_ia', {
    anonymousLimit: 5, memberLimit: 10, membre, creditType: 'abawi_ia',
  })
  const [showPaywall, setShowPaywall] = useState(false)

  const [domaine, setDomaine] = useState('');
  const [customDomaine, setCustomDomaine] = useState('');
  const [difficulte, setDifficulte] = useState('moyen');
  const [nbQuestions, setNbQuestions] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(QUIZ_KEY) || 'null') || [] } catch { return [] }
  });

  // Persist quiz answer history
  useEffect(() => {
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify(history.slice(-50))) } catch { /* ignore */ }
  }, [history]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  async function generateQuiz() {
    const ok = await checkAccessThen()
    if (!ok) return
    setLoading(true);
    setErrorMsg('');
    const d = customDomaine || domaine;
    try {
      const raw = await callGroq([
        {
          role: 'system',
          content: 'Tu es un créateur de quiz expert ABAWI senior multidisciplinaire (OHADA, SYSCOHADA, BCEAO, contexte africain, pédagogie Bac sénégalais). Tes questions sont rigoureuses, ancrées dans le contexte africain quand pertinent, et adaptées au niveau demandé. Réponds UNIQUEMENT avec du JSON valide, aucun texte avant ou après.'
        }, {
          role: 'user',
          content: `Crée ${nbQuestions} questions de quiz niveau ${difficulte} sur le domaine : "${d}".
Réponds avec ce JSON exact:
{
  "questions": [
    {
      "question": "La question",
      "options": ["A", "B", "C", "D"],
      "reponse": "La bonne réponse exactement comme dans options",
      "reponse_attendue": "La bonne réponse",
      "explication": "Explication courte"
    }
  ]
}`
        }], 1200, true);
      const parsed = JSON.parse(raw);
      setQuestions(parsed.questions || []);
      setCurrentQ(0);
      setScore(0);
      setHistory([]);
      setFinished(false);
      setSelectedAnswer(null);
      setFeedback(null);
    } catch (e) {
      setErrorMsg(toUserFriendlyAIError(e, 'Impossible de générer le quiz pour le moment.'));
      setQuestions([]);
    }
    setLoading(false);
  }

  function answer(opt) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(opt);
    const q = questions[currentQ];
    const correct = opt === q.reponse || opt === q.reponse_attendue;
    if (correct) setScore(s => s + 1);
    setFeedback({ correct, reponse_complete: q.explication || q.reponse_attendue || q.reponse });
    setHistory(h => [...h, { q: q.question, answer: opt, correct, explication: q.explication || '' }]);
  }

  function next() {
    if (currentQ + 1 >= questions.length) { setFinished(true); return; }
    setCurrentQ(c => c + 1);
    setSelectedAnswer(null);
    setFeedback(null);
  }

  function restart() {
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setHistory([]);
    setFinished(false);
    setSelectedAnswer(null);
    setFeedback(null);
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ width: 48, height: 48, border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'abia-spin 0.8s linear infinite', margin: '0 auto 20px' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Génération du quiz en cours…</p>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '20px' }}>🧠 Configurez votre quiz</h3>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', fontWeight: 600 }}>Domaine de connaissances</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {DOMAINES.map(d => (
            <button key={d} onClick={() => { setDomaine(d); setCustomDomaine('') }} style={{
              padding: '7px 14px', borderRadius: '100px', border: 'none',
              background: domaine === d ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
              color: domaine === d ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.2s', fontFamily: 'Outfit,sans-serif',
            }}>{d}</button>
          ))}
        </div>
        <input value={customDomaine} onChange={e => { setCustomDomaine(e.target.value); setDomaine('') }} placeholder="Ou tapez votre propre domaine (ex: Chimie organique, Droit maritime...)" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Niveau</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['facile', 'moyen', 'expert'].map(d => (
              <button key={d} onClick={() => setDifficulte(d)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                background: difficulte === d ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                color: difficulte === d ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: difficulte === d ? 700 : 400, fontFamily: 'Outfit,sans-serif',
              }}>
                {d === 'facile' ? '🟢' : d === 'moyen' ? '🟡' : '🔴'} {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nombre de questions</label>
          <select value={nbQuestions} onChange={e => setNbQuestions(parseInt(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'Outfit,sans-serif' }}>
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
          </select>
        </div>
      </div>
      <button onClick={generateQuiz} disabled={!domaine && !customDomaine} style={{
        width: '100%', padding: '16px', borderRadius: '14px',
        background: (!domaine && !customDomaine) ? 'var(--bg-card)' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
        border: 'none', color: (!domaine && !customDomaine) ? 'var(--text-muted)' : '#fff',
        fontWeight: 800, fontSize: '1.05rem', cursor: (!domaine && !customDomaine) ? 'not-allowed' : 'pointer',
        boxShadow: (!domaine && !customDomaine) ? 'none' : '0 6px 20px rgba(139,92,246,0.35)', fontFamily: 'Outfit,sans-serif',
      }}>
        🧠 Générer le quiz par IA
      </button>
      {errorMsg && (
        <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#EF4444' }}>{errorMsg}</div>
      )}
    </div>
  );

  if (finished) {
    const pct = Math.round(score / questions.length * 100);
    const mention = pct >= 80 ? '🏆 Excellent !' : pct >= 60 ? '👍 Bien' : pct >= 40 ? '📚 À améliorer' : '💪 Continuez !';
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{pct >= 80 ? '🏆' : pct >= 60 ? '🥈' : pct >= 40 ? '🥉' : '📚'}</div>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, marginBottom: '8px' }}>{mention}</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#8B5CF6', marginBottom: '4px' }}>{score}/{questions.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>{pct}% de bonnes réponses</div>
          <div style={{ height: '10px', background: 'var(--border)', borderRadius: '100px', margin: '20px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: pct >= 60 ? 'linear-gradient(90deg, #8B5CF6, #18A84A)' : 'linear-gradient(90deg, #8B5CF6, #F0B429)', borderRadius: '100px', transition: 'width 1s ease' }}/>
          </div>
        </div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '16px' }}>📋 Correction détaillée</h3>
        {history.map((h, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${h.correct ? 'rgba(24,168,74,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span>{h.correct ? '✅' : '❌'}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600 }}>Q{i + 1}: {h.q}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: h.correct ? '#18A84A' : '#ef4444', marginBottom: '4px' }}>Votre réponse : {h.answer}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>💡 {h.explication}</div>
          </div>
        ))}
        <button onClick={restart} style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '16px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
          🔄 Nouveau quiz
        </button>
      </div>
    );
  }

  const q = questions[currentQ];
  const progressPct = (currentQ / questions.length) * 100;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>Question {currentQ + 1} / {questions.length}</span>
          <span style={{ color: '#8B5CF6', fontWeight: 700 }}>Score: {score}</span>
        </div>
        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: progressPct + '%', background: 'linear-gradient(90deg, #8B5CF6, #7C3AED)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{q?.question}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {(q?.options || []).map((opt, j) => {
          let bg = 'var(--bg-card)', border = 'var(--border)', color = 'var(--text-primary)';
          if (selectedAnswer !== null) {
            if (opt === q.reponse || opt === q.reponse_attendue) { bg = 'rgba(24,168,74,0.1)'; border = '#18A84A'; color = '#18A84A'; }
            else if (opt === selectedAnswer) { bg = 'rgba(239,68,68,0.1)'; border = '#EF4444'; color = '#EF4444'; }
          }
          return (
            <button key={j} onClick={() => answer(opt)} disabled={selectedAnswer !== null} style={{
              padding: '14px 18px', borderRadius: '12px', textAlign: 'left', background: bg,
              border: `2px solid ${border}`, color, cursor: selectedAnswer !== null ? 'default' : 'pointer',
              fontSize: '0.88rem', fontWeight: 500, transition: 'all 0.2s', fontFamily: 'Outfit,sans-serif',
            }}>
              {opt}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '16px', background: feedback.correct ? 'rgba(24,168,74,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${feedback.correct ? 'rgba(24,168,74,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: feedback.correct ? '#18A84A' : '#EF4444' }}>{feedback.correct ? '✅ Correct !' : '❌ Incorrect'}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>💡 {feedback.reponse_complete}</div>
        </div>
      )}

      {selectedAnswer !== null && (
        <button onClick={next} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
          {currentQ + 1 >= questions.length ? '🏁 Voir les résultats' : 'Question suivante →'}
        </button>
      )}
    </div>
  );
}
