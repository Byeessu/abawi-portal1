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
  const [profiles, setProfiles] = useState({});
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!community) return;
    loadMessages();
    const channel = supabase.channel('community-msgs-' + community.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: 'community_id=eq.' + community.id },
        payload => setMessages(prev => [...prev, payload.new]))
      .subscribe();
    return () => supabase.removeChannel(channel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('community_messages')
      .select('*')
      .eq('community_id', community.id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) {
      setMessages(data);
      // Load sender profiles
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      if (senderIds.length) {
        const { data: users } = await supabase.from('profiles').select('id, nom, prenom').in('id', senderIds);
        const map = {};
        (users || []).forEach(u => { map[u.id] = u; });
        setProfiles(map);
      }
    }
    setLoading(false);
  }

  function senderName(id) {
    if (id === membre?.id) return 'Vous';
    const p = profiles[id];
    return p ? `${p.prenom || ''} ${p.nom || ''}`.trim() || 'Utilisateur' : 'Membre';
  }

  async function uploadFile(file) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `communities/${community.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('community-media').upload(path, file);
    setUploading(false);
    if (error) { alert('Erreur upload: ' + error.message); return null; }
    return supabase.storage.from('community-media').getPublicUrl(path).data.publicUrl;
  }

  async function send(content = text, type = 'text', fileUrl = null) {
    const trimmed = (content || '').trim();
    if (!trimmed && !fileUrl) return;
    if (!membre) return;
    const msg = {
      community_id: community.id,
      sender_id: membre.id,
      content: trimmed || (type === 'image' ? '📷 Image' : type === 'video' ? '🎥 Vidéo' : ''),
      type: type || 'text',
      file_url: fileUrl || null,
      created_at: new Date().toISOString(),
    };
    await supabase.from('community_messages').insert(msg);
    if (type === 'text') setText('');
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
    const url = await uploadFile(file);
    if (url) await send(file.name, type, url);
    e.target.value = '';
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
              <div className="abv-community-feed-meta">{community.description || 'Communauté publique'} · {messages.length} messages</div>
            </div>
          </div>
        </div>

        <div className="abv-community-feed-messages">
          {loading && <div className="abv-community-feed-loading">Chargement...</div>}
          {!loading && messages.length === 0 && (
            <div className="abv-community-feed-empty">Aucun message. Soyez le premier à écrire !</div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`abv-community-msg${m.sender_id === membre?.id ? ' abv-community-msg--me' : ''}`}>
              <div className="abv-community-msg-avatar" title={senderName(m.sender_id)}>{initials(senderName(m.sender_id))}</div>
              <div className="abv-community-msg-body">
                <div className="abv-community-msg-sender">{senderName(m.sender_id)}</div>
                {m.type === 'image' && m.file_url && (
                  <img src={m.file_url} alt="" className="abv-community-msg-image" loading="lazy" />
                )}
                {m.type === 'video' && m.file_url && (
                  <video src={m.file_url} controls className="abv-community-msg-video" />
                )}
                {m.content && <div className="abv-community-msg-content">{m.content}</div>}
                <div className="abv-community-msg-time">{formatTime(m.created_at)}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="abv-community-feed-input">
          <input type="file" ref={fileRef} onChange={handleFile} accept="image/*,video/*" style={{ display: 'none' }} />
          <button className="abv-community-attach" onClick={() => fileRef.current?.click()} disabled={uploading} title="Joindre un média">
            {uploading ? '⏳' : '📎'}
          </button>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Écrire un message..."
          />
          <button onClick={() => send()} disabled={!text.trim() || uploading}>
            {uploading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
