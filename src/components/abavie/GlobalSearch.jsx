import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function GlobalSearch({ visible, onClose, onJumpToMessage }) {
  const { membre } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
      loadConversations();
    }
  }, [visible]);

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [membre?.id]);
    if (data) setConversations(data);
  }

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('id, content, type, file_url, created_at, conversation_id, sender_id')
      .ilike('content', `%${q}%`)
      .in('conversation_id', conversations.map(c => c.id))
      .order('created_at', { ascending: false })
      .limit(50);

    // Enrich with conversation info
    if (data) {
      const enriched = data.map(m => {
        const conv = conversations.find(c => c.id === m.conversation_id);
        const otherId = conv?.participants?.find(p => p !== membre?.id);
        return { ...m, convName: conv?.group_name || `Conversation ${otherId?.slice(0, 6)}` };
      });
      setResults(enriched);
    } else {
      setResults([]);
    }
    setLoading(false);
  }, [conversations, membre?.id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  if (!visible) return null;

  return (
    <div className="abv-global-search-overlay" onClick={onClose}>
      <div className="abv-global-search-modal" onClick={e => e.stopPropagation()}>
        <div className="abv-global-search-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher dans toutes les conversations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="abv-icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="abv-global-search-body">
          {loading && <div className="abv-search-loading">Recherche...</div>}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="abv-search-empty">Aucun résultat pour « {query} »</div>
          )}
          {results.map(r => (
            <button
              key={r.id}
              className="abv-search-result"
              onClick={() => {
                onJumpToMessage?.(r.conversation_id, r.id);
                onClose();
              }}
            >
              <div className="abv-search-result-meta">
                <span className="abv-search-result-conv">{r.convName}</span>
                <span className="abv-search-result-time">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="abv-search-result-text">
                {r.type === 'image' && '📷 Image'}
                {r.type === 'video' && '🎥 Vidéo'}
                {r.type === 'audio' && (r.metadata?.isVoice ? '🎤 Vocal' : '🔊 Audio')}
                {r.type === 'location' && '📍 Localisation'}
                {(r.type === 'text' || !r.type) && (
                  <span dangerouslySetInnerHTML={{
                    __html: (r.content || '').replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>')
                  }} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
