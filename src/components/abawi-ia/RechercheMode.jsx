import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { cleanIAText, cleanIATextLight } from '../../lib/cleanText';
import { callGroq, extractTextFromAnyFile } from '../../lib/abawi-ia';
import { toUserFriendlyAIError } from '../../lib/aiErrorMessages';
import { buildSystemPrompt } from '../../lib/abawi-persona';
import IAResponseDisplay from '../IAResponseDisplay';

// =====================================================================
// Stockage multi-conversations (ChatGPT/Claude-like)
// =====================================================================
// Schéma:
//   {
//     conversations: [{ id, title, history: [{q,a}], createdAt, updatedAt }],
//     activeId: string | null
//   }
// Limite: 50 conversations (FIFO sur les plus anciennes).

const STORE_KEY = 'abawi_recherche_conversations'
const LEGACY_KEY = 'abawi_recherche_history'
const MAX_CONVERSATIONS = 50

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function makeConversation(history = []) {
  const now = Date.now()
  return {
    id: newId(),
    title: history[0]?.q?.slice(0, 60) || 'Nouvelle conversation',
    history,
    createdAt: now,
    updatedAt: now,
  }
}

function loadStore() {
  // 1) Lire le nouveau format
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.conversations)) {
        return {
          conversations: parsed.conversations,
          activeId: parsed.activeId || parsed.conversations[0]?.id || null,
        }
      }
    }
  } catch {}
  // 2) Migration depuis l'ancienne clé (historique unique)
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')
    if (Array.isArray(legacy) && legacy.length > 0) {
      const conv = makeConversation(legacy)
      return { conversations: [conv], activeId: conv.id }
    }
  } catch {}
  return { conversations: [], activeId: null }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    // Nettoie la legacy après migration réussie
    localStorage.removeItem(LEGACY_KEY)
  } catch {}
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts
  const min = 60 * 1000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < min) return "à l'instant"
  if (diff < hour) return `il y a ${Math.floor(diff / min)} min`
  if (diff < day) return `il y a ${Math.floor(diff / hour)} h`
  if (diff < 7 * day) return `il y a ${Math.floor(diff / day)} j`
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// =====================================================================
// Fallback local quand l'IA est indispo
// =====================================================================

function buildLocalFallbackAnswer(question, files = []) {
  const cleanQuestion = (question || 'Analyse stratégique demandée').trim()
  const normalized = cleanQuestion.toLowerCase()
  const shortPolite = ['ok', 'merci', 'thanks', 'thx', 'daccord', "d'accord", 'oui', 'non', 'test']
  if (shortPolite.includes(normalized) || cleanQuestion.length < 12) {
    return `Service IA temporairement limité (quota). Message bien reçu : "${cleanQuestion}". Réessayez dans quelques secondes avec une question plus précise (objectif + contexte) pour obtenir une réponse complète.`
  }
  const filesNote = files.length
    ? `\n\n**Documents reçus** : ${files.map(f => f.name).join(', ')}.`
    : ''
  return `## Synthèse rapide
Le service IA distant est momentanément indisponible (quota ou rate-limit). Voici une trame d'analyse à activer dès que la connexion revient.

## Cadrage proposé
- **Question** : ${cleanQuestion}
- **Angle d'analyse** : enjeux ABAWI / contexte africain / OHADA si pertinent.
- **Livrables attendus** : note synthétique structurée + recommandations actionnables.${filesNote}

## Action recommandée
Réessayez dans 1 à 2 minutes. Si l'erreur persiste, simplifiez la question ou réduisez les pièces jointes.`
}

// =====================================================================
// Composant principal
// =====================================================================

export default function RechercheMode() {
  const location = useLocation();
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // Store complet
  const [store, setStore] = useState(() => loadStore());
  const [showSidebar, setShowSidebar] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // État de la conversation courante
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileContext, setFileContext] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  // Conversation active dérivée du store
  const activeConv = useMemo(
    () => store.conversations.find(c => c.id === store.activeId) || null,
    [store]
  );
  const history = activeConv?.history || [];

  // Persistance + tri par updatedAt desc
  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);

  // Pré-remplit la question via location.state (ex: depuis Hero)
  useEffect(() => {
    const stateQuery = location.state?.query;
    if (stateQuery) {
      setQuery(stateQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [location.state]);

  // ── Helpers store ───────────────────────────────────────────────────
  function startNewConversation(focus = true) {
    const conv = makeConversation([]);
    setStore(s => ({
      conversations: [conv, ...s.conversations].slice(0, MAX_CONVERSATIONS),
      activeId: conv.id,
    }));
    setQuery('');
    setUploadedFiles([]);
    setFileContext('');
    setShowSidebar(false);
    if (focus) setTimeout(() => inputRef.current?.focus(), 100);
  }

  function selectConversation(id) {
    setStore(s => ({ ...s, activeId: id }));
    setShowSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function deleteConversation(id) {
    if (!confirm('Supprimer définitivement cette conversation ?')) return;
    setStore(s => {
      const conversations = s.conversations.filter(c => c.id !== id);
      const activeId = s.activeId === id
        ? (conversations[0]?.id || null)
        : s.activeId;
      return { conversations, activeId };
    });
  }

  function deleteAllConversations() {
    if (!confirm('Supprimer TOUTES les conversations ? Cette action est irréversible.')) return;
    setStore({ conversations: [], activeId: null });
  }

  function startRename(id, currentTitle) {
    setRenamingId(id);
    setRenameValue(currentTitle);
  }
  function commitRename() {
    if (!renamingId) return;
    const title = renameValue.trim().slice(0, 100) || 'Sans titre';
    setStore(s => ({
      ...s,
      conversations: s.conversations.map(c =>
        c.id === renamingId ? { ...c, title, updatedAt: Date.now() } : c
      ),
    }));
    setRenamingId(null);
    setRenameValue('');
  }
  function cancelRename() {
    setRenamingId(null);
    setRenameValue('');
  }

  // ── Pièces jointes ──────────────────────────────────────────────────
  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setFileLoading(true);
    try {
      const arr = Array.from(files);
      setUploadedFiles(arr);
      const contents = await Promise.all(arr.map(async (f) => {
        try {
          const text = await extractTextFromAnyFile(f);
          return `--- ${f.name} ---\n${text.slice(0, 8000)}`;
        } catch {
          return `--- ${f.name} ---\n[impossible de lire ce fichier]`;
        }
      }));
      setFileContext(contents.join('\n\n'));
    } catch {}
    setFileLoading(false);
  }

  // ── Recherche IA ────────────────────────────────────────────────────
  async function search() {
    const q = (query || '').trim();
    if (!q && !fileContext) return;
    setLoading(true);

    // Si pas de conversation active, en créer une à la volée
    let convId = store.activeId;
    if (!convId) {
      const conv = makeConversation([]);
      convId = conv.id;
      setStore(s => ({
        conversations: [conv, ...s.conversations].slice(0, MAX_CONVERSATIONS),
        activeId: conv.id,
      }));
    }

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
      const newEntry = { q: q || `Analyse: ${uploadedFiles.map(f => f.name).join(', ')}`, a: answer };
      appendToConversation(convId, newEntry);
      if (fileContext) { setFileContext(''); setUploadedFiles([]); }
    } catch (err) {
      const friendly = toUserFriendlyAIError(err);
      const fallback = friendly && friendly.length > 0
        ? `${friendly}\n\n---\n\n${buildLocalFallbackAnswer(q, uploadedFiles)}`
        : buildLocalFallbackAnswer(q, uploadedFiles);
      appendToConversation(convId, { q: q || `Analyse: ${uploadedFiles.map(f => f.name).join(', ')}`, a: cleanIAText(fallback) });
    }
    setLoading(false);
  }

  function appendToConversation(convId, entry) {
    setStore(s => {
      const conversations = s.conversations.map(c => {
        if (c.id !== convId) return c;
        const history = [...c.history, entry];
        const title = c.history.length === 0 && entry.q
          ? entry.q.slice(0, 60)
          : c.title;
        return { ...c, history, title, updatedAt: Date.now() };
      });
      return { ...s, conversations };
    });
  }

  // Conversations triées par updatedAt desc pour la sidebar
  const sortedConversations = useMemo(
    () => [...store.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [store.conversations]
  );

  const SUGGESTIONS = [
    "Comment créer une SARL au Sénégal ?",
    "Comment calculer la TVA ?",
    "Meilleure stratégie marketing PME africaine",
    "Comment rédiger un contrat de travail OHADA ?",
    "Analyse SWOT d'une startup tech africaine",
    "Comment lever des fonds pour une startup ?",
  ];

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
      {/* ── Barre d'actions conversations ─────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        marginBottom: 12, padding: '8px 12px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <button
          onClick={() => startNewConversation()}
          style={{
            padding: '8px 14px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff',
            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
          title="Démarrer une nouvelle conversation"
        >
          ＋ Nouvelle conversation
        </button>

        <button
          onClick={() => setShowSidebar(v => !v)}
          style={{
            padding: '8px 12px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-primary)', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
          title="Voir l'historique de mes conversations"
        >
          🗂️ Historique ({store.conversations.length})
        </button>

        {activeConv && (
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)', fontSize: '0.78rem',
            paddingLeft: 8, borderLeft: '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Active :</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeConv.title}
            </span>
            <button
              onClick={() => startRename(activeConv.id, activeConv.title)}
              style={{ padding: '2px 6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem' }}
              title="Renommer"
            >✏️</button>
            <button
              onClick={() => deleteConversation(activeConv.id)}
              style={{ padding: '2px 6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', fontSize: '0.78rem' }}
              title="Supprimer cette conversation"
            >🗑️</button>
          </div>
        )}
      </div>

      {/* ── Sidebar / liste des conversations (déroulant) ──────────── */}
      {showSidebar && (
        <div style={{
          marginBottom: 12, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 12,
          maxHeight: 320, overflowY: 'auto',
        }}>
          {sortedConversations.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucune conversation enregistrée. Posez une question pour démarrer.
            </div>
          ) : (
            <>
              {sortedConversations.map(c => {
                const isActive = c.id === store.activeId;
                const isRenaming = renamingId === c.id;
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border)',
                      background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                      cursor: isRenaming ? 'default' : 'pointer',
                    }}
                    onClick={() => !isRenaming && selectConversation(c.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename();
                            else if (e.key === 'Escape') cancelRename();
                          }}
                          onBlur={commitRename}
                          onClick={e => e.stopPropagation()}
                          style={{
                            width: '100%', padding: '6px 8px', borderRadius: 6,
                            border: '1px solid #3B82F6', background: 'var(--bg-primary)',
                            color: 'var(--text-primary)', fontSize: '0.85rem',
                          }}
                        />
                      ) : (
                        <>
                          <div style={{
                            fontSize: '0.86rem', fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {c.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {c.history.length} message{c.history.length > 1 ? 's' : ''} · {formatRelativeTime(c.updatedAt)}
                          </div>
                        </>
                      )}
                    </div>

                    {!isRenaming && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); startRename(c.id, c.title); }}
                          style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                          title="Renommer"
                        >✏️</button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                          style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', fontSize: '0.85rem' }}
                          title="Supprimer"
                        >🗑️</button>
                      </>
                    )}
                  </div>
                );
              })}
              <div style={{ padding: 10, textAlign: 'center' }}>
                <button
                  onClick={deleteAllConversations}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                    color: '#EF4444', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                  }}
                >
                  🗑️ Supprimer toutes les conversations
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Fil de la conversation active ─────────────────────────── */}
      <div style={{ maxHeight: 'clamp(300px, 55vh, 520px)', overflowY: 'auto', marginBottom: '16px', paddingRight: 4, overscrollBehavior: 'contain' }}>
        {history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Posez votre question ou uploadez des fichiers pour les analyser
            </p>
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

      {/* ── Pièces jointes ────────────────────────────────────────── */}
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

      {/* ── Champ de saisie ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); search() } }}
          placeholder={activeConv ? "Continuez la conversation..." : "Posez votre question..."}
          style={{
            flex: 1, padding: 'clamp(11px,2vw,14px) clamp(12px,2.5vw,18px)',
            borderRadius: '12px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', color: 'var(--text-primary)',
            fontSize: 'max(16px, 0.88rem)',
            outline: 'none', fontFamily: 'Outfit,sans-serif',
            minWidth: 0,
          }}
        />
        <button onClick={search} disabled={loading || (!query.trim() && !fileContext)} style={{
          padding: 'clamp(11px,2vw,14px) clamp(16px,3vw,22px)',
          borderRadius: '12px', border: 'none', flexShrink: 0,
          background: (loading || (!query.trim() && !fileContext)) ? 'var(--bg-card)' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
          color: (loading || (!query.trim() && !fileContext)) ? 'var(--text-muted)' : '#fff',
          cursor: (loading || (!query.trim() && !fileContext)) ? 'not-allowed' : 'pointer', fontWeight: 800,
          fontSize: 'clamp(0.9rem,2vw,1.1rem)',
          minWidth: 44, minHeight: 44,
        }}>{loading ? '…' : '→'}</button>
      </div>
    </div>
  );
}
