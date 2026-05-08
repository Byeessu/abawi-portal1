import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ForwardModal({ content, fileUrl, onClose, onForward }) {
  const { membre } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [membre.id])
      .order('updated_at', { ascending: false });
    if (data) setConversations(data);
  }

  async function forward() {
    if (selected.length === 0) return;
    setSending(true);
    for (const convId of selected) {
      await onForward?.(convId, content, fileUrl);
    }
    setSending(false);
    onClose?.();
  }

  const filtered = conversations.filter(c => {
    const name = c.is_group ? c.name : (c.other_user_name || c.name || 'Conversation');
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="abv-modal-overlay" onClick={onClose}>
      <div className="abv-modal abv-forward-modal" onClick={e => e.stopPropagation()}>
        <h4>➡️ Transférer</h4>
        <p className="abv-forward-preview">{content?.slice(0, 120)}{content?.length > 120 ? '…' : ''}</p>

        <input
          type="text"
          className="abv-group-input"
          placeholder="Chercher une conversation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <div className="abv-forward-list">
          {filtered.map(c => {
            const name = c.is_group ? c.name : (c.other_user_name || c.name || 'Conversation');
            const isSelected = selected.includes(c.id);
            return (
              <div
                key={c.id}
                className={`abv-forward-item${isSelected ? ' abv-forward-item--selected' : ''}`}
                onClick={() => {
                  setSelected(prev =>
                    isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                  );
                }}
              >
                <div className="abv-avatar abv-avatar--sm">{initials(name)}</div>
                <div className="abv-forward-info">
                  <span className="abv-forward-name">{name}</span>
                  <span className="abv-forward-meta">{c.is_group ? `${c.participants?.length || 2} membres` : 'Message privé'}</span>
                </div>
                <div className="abv-forward-check">
                  {isSelected ? '✅' : '⭕'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="abv-modal-actions">
          <button className="abv-modal-close" onClick={onClose}>Annuler</button>
          <button
            className="abv-btn-primary"
            onClick={forward}
            disabled={sending || selected.length === 0}
          >
            {sending ? 'Envoi…' : `Envoyer (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
