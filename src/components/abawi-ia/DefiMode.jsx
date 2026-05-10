import { useState } from 'react';
import { callGroq } from '../../lib/abawi-ia';
import IAResponseDisplay from '../IAResponseDisplay';

export default function DefiMode() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(false);

  async function nextQuestion() {
    if (!topic.trim()) return;
    setLoading(true);
    setUserAnswer('');
    setResult(null);
    try {
      const raw = await callGroq([
        { role: 'system', content: 'Tu es un maître du défi intellectuel ABAWI, expert senior multidisciplinaire (OHADA, SYSCOHADA, BCEAO, contexte africain). Tes défis sont exigeants et ancrés dans des cas réels africains. Réponds UNIQUEMENT en JSON valide.' },
        {
          role: 'user',
          content: `Crée une question de défi niveau ${level}/5 sur le thème "${topic}".
JSON: {"question": "...", "reponse": "...", "indice": "...", "explication": "..."}`
        }
      ], 1000, true);
      const parsed = JSON.parse(raw);
      setQuestion(parsed);
    } catch {
      setQuestion({ question: `Question niveau ${level} sur ${topic} — Donnez votre meilleure réponse.`, reponse: '', indice: 'Réfléchissez bien.', explication: '' });
    }
    setLoading(false);
  }

  async function checkAnswer() {
    if (!userAnswer.trim() || !question) return;
    setLoading(true);
    try {
      const raw = await callGroq([
        { role: 'system', content: 'Tu évalues des réponses avec la rigueur d\'un examinateur senior ABAWI (contexte africain, OHADA, pédagogie Bac). Réponds UNIQUEMENT en JSON : {"correct": true/false, "score": 0-100, "feedback": "..."}' },
        {
          role: 'user',
          content: `Question: ${question.question}\nRéponse attendue: ${question.reponse}\nRéponse donnée: ${userAnswer}\nÉvalue et donne ton verdict.`
        }
      ], 400, true);
      const ev = JSON.parse(raw);
      const pts = Math.round((ev.score || 0) / 10);
      setScore(s => s + pts);
      setRound(r => r + 1);
      if (ev.correct && level < 5) setLevel(l => l + 1);
      setResult({ ...ev, pts });
    } catch {
      setResult({ correct: false, feedback: 'Erreur lors de l\'évaluation.', pts: 0 });
    }
    setLoading(false);
  }

  if (!question && !loading) return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '20px' }}>🎯 Défi de connaissances</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Choisissez un thème. Le niveau augmente automatiquement à chaque bonne réponse.</p>
      <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Histoire de l'Afrique, Finance, IA..."
        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'Outfit,sans-serif' }} />
      <button onClick={nextQuestion} disabled={!topic.trim()} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: !topic.trim() ? 'var(--bg-card)' : 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none', color: !topic.trim() ? 'var(--text-muted)' : '#070B0F', fontWeight: 800, cursor: !topic.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Outfit,sans-serif' }}>
        🎯 Commencer le défi
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Niveau {level}/5 · Round {round + 1}</span>
        <span style={{ fontSize: '0.8rem', color: '#F0B429', fontWeight: 700 }}>Score: {score} pts</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(240,180,41,0.2)', borderTopColor: '#F0B429', borderRadius: '50%', animation: 'abia-spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : question && (
        <>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', color: '#F0B429', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Niveau {level} — {topic}</div>
            <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.5, margin: 0 }}>{question.question}</p>
            {question.indice && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 10 }}>💡 Indice: {question.indice}</p>}
          </div>

          {!result ? (
            <>
              <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="Votre réponse..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical', minHeight: 100, boxSizing: 'border-box', marginBottom: 12, fontFamily: 'Outfit,sans-serif' }} />
              <button onClick={checkAnswer} disabled={!userAnswer.trim()} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: !userAnswer.trim() ? 'var(--bg-card)' : 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none', color: !userAnswer.trim() ? 'var(--text-muted)' : '#070B0F', fontWeight: 800, cursor: !userAnswer.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                Valider ma réponse
              </button>
            </>
          ) : (
            <>
              <div style={{ padding: '16px', borderRadius: 12, marginBottom: 12, background: result.correct ? 'rgba(24,168,74,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${result.correct ? 'rgba(24,168,74,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <div style={{ fontWeight: 700, marginBottom: 6, color: result.correct ? '#18A84A' : '#EF4444' }}>{result.correct ? '✅ Excellent !' : '❌ Pas tout à fait'} — +{result.pts} pts</div>
                <IAResponseDisplay text={result.feedback} compact accentColor="#F0B429" docTitle="Évaluation Défi" showEditorButton={false} />
              </div>
              <button onClick={nextQuestion} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none', color: '#070B0F', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                Question suivante →
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
