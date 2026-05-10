import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function CommunityFeed({ community, onClose }) {
  const { membre } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!community) return;
    loadMessages();
    const channel = supabase.channel('community-msgs-' + community.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: 'community_id=eq.' + community.id },
        payload => setMessages(prev => [...prev, payload.new]))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [community]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('community_messages')
      .select('*')
      .eq('community_id', community.id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data);
    setLoading(false);
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || !membre) return;
    const msg = {
      community_id: community.id,
      sender_id: membre.id,
      content: trimmed,
      type: 'text',
      created_at: new Date().toISOString(),
    };
    await supabase.from('community_messages').insert(msg);
    setText('');
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!community) return null;

  return (
    <div className="abv-community-feed-overlay" onClick={onClose}>
      <div className="abv-community-feed" onClick={e => e.stopPropagation()}>
        <div className="abv-community-feed-header">
          <button className="abv-back-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div className="abv-community-feed-title">
            <div className="abv-community-feed-avatar">{initials(community.name)}</div>
            <div>
              <div className="abv-community-feed-name">{community.name}</div>
              <div className="abv-community-feed-meta">{community.description || 'Communauté publique'}</div>
            </div>
          </div>
        </div>

        <div className="abv-community-feed-messages">
          {loading && <div className="abv-community-feed-loading">Chargement...</div>}
          {messages.map(m => (
            <div key={m.id} className={`abv-community-msg${m.sender_id === membre?.id ? ' abv-community-msg--me' : ''}`}>
              <div className="abv-community-msg-avatar">{initials(m.sender_id === membre?.id ? 'Vous' : 'User')}</div>
              <div className="abv-community-msg-body">
                <div className="abv-community-msg-content">{m.content}</div>
                <div className="abv-community-msg-time">{formatTime(m.created_at)}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="abv-community-feed-input">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Écrire un message..."
          />
          <button onClick={send} disabled={!text.trim()}>Envoyer</button>
        </div>
      </div>
    </div>
  );
}
