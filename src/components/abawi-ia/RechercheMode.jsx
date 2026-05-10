import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cleanIAText, cleanIATextLight } from '../../lib/cleanText';
import { callGroq, extractTextFromAnyFile } from '../../lib/abawi-ia';
import { toUserFriendlyAIError } from '../../lib/aiErrorMessages';
import { buildSystemPrompt } from '../../lib/abawi-persona';
import IAResponseDisplay from '../IAResponseDisplay';

const RECHERCHE_KEY = 'abawi_recherche_history'

function buildLocalFallbackAnswer(question, files = []) {
  const cleanQuestion = (question || 'Analyse stratégique demandée').trim()
  const normalized = cleanQuestion.toLowerCase()
  const shortPolite = ['ok', 'merci', 'thanks', 'thx', 'daccord', "d'accord", 'oui', 'non', 'test']
  if (shortPolite.includes(normalized) || cleanQuestion.length < 12) {
    return `Service IA temporairement limite (quota). Message bien recu: "${cleanQuestion}". Reessaie dans quelques secondes avec une question plus precise (objectif + contexte) pour obtenir une reponse complete.`
  }

  const filesPart = files.length
    ? `Documents pris en compte: ${files.map(f => f.name).slice(0, 5).join(', ')}.`
    : 'Aucun document joint.'

  return `## ANALYSE RAPIDE (MODE SECOURS)

Le service IA externe est temporairement saturé, donc je bascule en mode local pour éviter le blocage.

## CONTEXTE
Question: ${cleanQuestion}
${filesPart}

## LECTURE STRATÉGIQUE PRÉLIMINAIRE
- Clarifier l'objectif prioritaire (croissance, rentabilité, conformité, exécution).
- Identifier 3 hypothèses critiques à valider rapidement.
- Isoler les contraintes fortes (budget, délais, réglementation, ressources).

## PLAN D'ACTION IMMÉDIAT (7 JOURS)
1. Formaliser le problème en 5 lignes avec KPI cible.
2. Produire un mini-diagnostic: causes, impact, risques.
3. Tester une action à faible coût et forte probabilité d'impact.
4. Mesurer les résultats puis décider scale / arrêt.

## DONNÉES À AJOUTER POUR UNE ANALYSE IA COMPLÈTE
- Chiffres actuels (CA, coûts, marge, conversion, churn).
- Horizon temporel visé (30/90/180 jours).
- Contraintes non négociables.
- Résultat attendu chiffré.

## RECOMMANDATION
Relancer l'analyse IA dans quelques minutes avec une question plus ciblée et un contexte plus court (1 objectif + 3 KPI), pour obtenir une recommandation plus précise et actionnable.`
}

export default function RechercheMode() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECHERCHE_KEY) || 'null') || [] } catch { return [] }
  });
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileContext, setFileContext] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(0);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        setQuery(q);
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    } catch {}
  }, []);

  const prevHistoryLength = useRef(0);
  useEffect(() => {
    if (history.length > prevHistoryLength.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
      // Persist history (max 20 entries)
      try { localStorage.setItem(RECHERCHE_KEY, JSON.stringify(history.slice(-20))) } catch {}
    }
    prevHistoryLength.current = history.length;
  }, [history]);

  async function handleFiles(files) {
    if (!files?.length) return;
    setFileLoading(true);
    const list = Array.from(files);
    setUploadedFiles(list);
    const combined = [];
    for (const f of list) {
      const text = await extractTextFromAnyFile(f);
      if (text) combined.push(`=== ${f.name} ===\n${cleanIAText(text.slice(0, 2500))}`);
    }
    setFileContext(combined.join('\n\n'));
    setFileLoading(false);
  }

  async function search() {
    const now = Date.now();
    if (now < rateLimitedUntil) {
      const remaining = Math.ceil((rateLimitedUntil - now) / 1000);
      setHistory(h => [...h, { q: query.trim() || 'Nouvelle demande', a: `Limite de debit atteinte. Reessayez dans ${remaining}s.` }]);
      return;
    }
    const q = query.trim();
    if (!q && !fileContext) return;
    setLoading(true);
    setQuery('');

    const userContent = fileContext
      ? `[Documents uploadés: ${uploadedFiles.map(f => f.name).join(', ')}]\n\n${fileContext.slice(0, 6000)}\n\nMa question: ${q || 'Analyse ces documents et donne-moi un résumé expert.'}`
      : q;

    try {
      const messages = [
        {
          role: 'system',
          content: buildSystemPrompt({
            role: "analyste senior issu d'un cabinet international de stratégie et de conseil",
            extra: `STRUCTURE SPÉCIFIQUE :
- Pour une analyse SWOT : sections ## FORCES, ## FAIBLESSES, ## OPPORTUNITÉS, ## MENACES.
- Pour toute comparaison multi-dimensionnelle : utilise un tableau markdown.
- Réponds avec la densité d'une note stratégique haut de gamme.`,
          }),
        },
        ...history.slice(-6).flatMap(h => ([
          { role: 'user', content: h.q.slice(0, 500) },
          { role: 'assistant', content: h.a.slice(0, 1000) },
        ])),
        { role: 'user', content: userContent },
      ];
      const answer = cleanIATextLight(await callGroq(messages, 900));
      setHistory(h => [...h, { q: q || `Analyse: ${uploadedFiles.map(f => f.name).join(', ')}`, a: answer }]);
      if (fileContext) { setFileContext(''); setUploadedFiles([]); }
    } catch (e) {
      const isRateLimit = String(e?.message || '').toUpperCase().includes('RATE_LIMIT');
      const friendlyError = toUserFriendlyAIError(e, `Erreur: ${e.message || 'inconnue'}`);
      if (isRateLimit) {
        setRateLimitedUntil(Date.now() + 15000);
        const offlineAnswer = buildLocalFallbackAnswer(q, uploadedFiles);
        setHistory(h => [...h, { q: q || 'Upload fichiers', a: offlineAnswer }]);
      } else {
        setHistory(h => [...h, { q: q || 'Upload fichiers', a: friendlyError }]);
      }
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const SUGGESTIONS = [
    'Comment créer une SARL au Sénégal ?',
    'Comment calculer la TVA ?',
    'Meilleure stratégie marketing PME africaine',
    'Comment rédiger un contrat de travail OHADA ?',
    "Analyse SWOT d'une startup tech africaine",
    "Comment lever des fonds pour une startup ?",
  ];

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
      <div style={{ maxHeight: 'clamp(300px, 55vh, 520px)', overflowY: 'auto', marginBottom: '16px', paddingRight: 4, overscrollBehavior: 'contain' }}>
        {history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Posez votre question ou uploadez des fichiers pour les analyser</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setQuery(s)} style={{ padding: '7px 14px', borderRadius: '100px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Outfit,sans-serif' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((h, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <div style={{ maxWidth: '88%', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff', fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {h.q}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #F0B429, #e5a820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#070B0F', fontSize: '0.9rem' }}>A</div>
              <div style={{ flex: 1, padding: '16px', borderRadius: '4px 16px 16px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                <IAResponseDisplay text={h.a} accentColor="#3B82F6" docTitle="Recherche ABAWI IA" />
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #F0B429, #e5a820)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#070B0F', fontSize: '0.9rem' }}>A</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F0B429', animation: `abia-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          padding: '7px 14px', borderRadius: 10,
          border: `1px solid ${uploadedFiles.length > 0 ? 'rgba(59,130,246,0.5)' : 'var(--border)'}`,
          background: uploadedFiles.length > 0 ? 'rgba(59,130,246,0.1)' : 'transparent',
          color: uploadedFiles.length > 0 ? '#3B82F6' : 'var(--text-muted)',
          fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s',
        }}>
          📎 {fileLoading ? 'Lecture...' : uploadedFiles.length > 0 ? `${uploadedFiles.length} fichier(s)` : 'Joindre fichiers'}
          <input type="file" multiple accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls,.pptx,.ppt,.json,.html"
            onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
        </label>
        {uploadedFiles.length > 0 && (
          <>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{uploadedFiles.slice(0, 3).map(f => f.name).join(', ')}{uploadedFiles.length > 3 ? '...' : ''}</span>
            <button onClick={() => { setUploadedFiles([]); setFileContext('') }}
              style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '0.72rem' }}>✕ Effacer</button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); search() } }}
          placeholder="Posez votre question..."
          style={{
            flex: 1, padding: 'clamp(11px,2vw,14px) clamp(12px,2.5vw,18px)',
            borderRadius: '12px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', color: 'var(--text-primary)',
            fontSize: 'max(16px, 0.88rem)',
            outline: 'none', fontFamily: 'Outfit,sans-serif',
            minWidth: 0,
          }}
        />
        <button onClick={search} disabled={!query.trim() && !fileContext} style={{
          padding: 'clamp(11px,2vw,14px) clamp(16px,3vw,22px)',
          borderRadius: '12px', border: 'none', flexShrink: 0,
          background: (!query.trim() && !fileContext) ? 'var(--bg-card)' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
          color: (!query.trim() && !fileContext) ? 'var(--text-muted)' : '#fff',
          cursor: (!query.trim() && !fileContext) ? 'not-allowed' : 'pointer', fontWeight: 800,
          fontSize: 'clamp(0.9rem,2vw,1.1rem)',
          minWidth: 44, minHeight: 44,
        }}>→</button>
      </div>
    </div>
  );
}
