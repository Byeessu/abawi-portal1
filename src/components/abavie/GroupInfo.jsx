import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function GroupInfo({ conversation, onClose }) {
  const { membre } = useAuth();
  const [members, setMembers] = useState([]);
  const [inviteLink, setInviteLink] = useState(conversation?.invite_link || '');
  const [description, setDescription] = useState(conversation?.description || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  useEffect(() => {
    if (!conversation?.id) return;
    loadMembers();
    checkAdmin();
  }, [conversation]);

  async function loadMembers() {
    if (!conversation?.participants) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, nom, email')
      .in('id', conversation.participants);
    if (data) setMembers(data);
  }

  function checkAdmin() {
    const admins = conversation?.group_admin || [];
    setIsAdmin(admins.includes(membre?.id) || conversation?.created_by === membre?.id);
  }

  async function generateInviteLink() {
    const link = `${window.location.origin}/abavie?join=${conversation.id}&token=${btoa(conversation.id).slice(0, 12)}`;
    setInviteLink(link);
    await supabase.from('conversations').update({ invite_link: link }).eq('id', conversation.id);
  }

  async function saveDescription() {
    await supabase.from('conversations').update({ description }).eq('id', conversation.id);
    setEditingDesc(false);
  }

  async function removeMember(userId) {
    if (!isAdmin) return;
    const nextParticipants = conversation.participants.filter(id => id !== userId);
    await supabase.from('conversations').update({ participants: nextParticipants }).eq('id', conversation.id);
    setMembers(prev => prev.filter(m => m.id !== userId));
  }

  async function addAdmin(userId) {
    if (!isAdmin) return;
    const admins = new Set(conversation.group_admin || []);
    admins.add(userId);
    await supabase.from('conversations').update({ group_admin: Array.from(admins) }).eq('id', conversation.id);
  }

  async function leaveGroup() {
    const nextParticipants = conversation.participants.filter(id => id !== membre?.id);
    await supabase.from('conversations').update({ participants: nextParticipants }).eq('id', conversation.id);
    onClose?.();
  }

  if (!conversation?.is_group) return null;

  return (
    <div className="abv-group-info-overlay" onClick={onClose}>
      <div className="abv-group-info" onClick={e => e.stopPropagation()}>
        <div className="abv-group-info-header">
          <button className="abv-icon-btn" onClick={onClose}>←</button>
          <h3>👥 {conversation.name || 'Groupe'}</h3>
          <div style={{ width: 36 }} />
        </div>

        <div className="abv-group-info-body">
          {/* Avatar */}
          <div className="abv-group-info-avatar">
            {initials(conversation.name)}
          </div>
          <div className="abv-group-info-count">{members.length} membre{members.length > 1 ? 's' : ''}</div>

          {/* Description */}
          <div className="abv-group-info-section">
            <h4>📝 Description</h4>
            {editingDesc && isAdmin ? (
              <div className="abv-group-info-edit">
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description du groupe..."
                />
                <button onClick={saveDescription}>✓</button>
              </div>
            ) : (
              <p onClick={() => isAdmin && setEditingDesc(true)}>
                {description || 'Aucune description'}
                {isAdmin && <span className="abv-group-info-edit-hint"> ✏️</span>}
              </p>
            )}
          </div>

          {/* Invite link */}
          {isAdmin && (
            <div className="abv-group-info-section">
              <h4>🔗 Lien d'invitation</h4>
              {inviteLink ? (
                <div className="abv-group-info-link">
                  <input readOnly value={inviteLink} />
                  <button onClick={() => navigator.clipboard.writeText(inviteLink)}>📋</button>
                </div>
              ) : (
                <button className="abv-profile-btn" onClick={generateInviteLink}>Générer un lien</button>
              )}
            </div>
          )}

          {/* Members */}
          <div className="abv-group-info-section">
            <h4>👤 Membres</h4>
            <div className="abv-group-info-members">
              {members.map(m => {
                const isGroupAdmin = (conversation.group_admin || []).includes(m.id);
                const isMe = m.id === membre?.id;
                return (
                  <div key={m.id} className="abv-group-info-member">
                    <div className="abv-avatar abv-avatar--sm">{initials(m.nom || m.email)}</div>
                    <div className="abv-group-info-member-info">
                      <span>{m.nom || m.email} {isMe && '(Vous)'}</span>
                      {isGroupAdmin && <span className="abv-group-info-badge">Admin</span>}
                    </div>
                    {isAdmin && !isMe && (
                      <div className="abv-group-info-member-actions">
                        {!isGroupAdmin && (
                          <button title="Promouvoir admin" onClick={() => addAdmin(m.id)}>⬆️</button>
                        )}
                        <button title="Retirer" onClick={() => removeMember(m.id)}>🚫</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger zone */}
          <div className="abv-group-info-section abv-group-info-danger">
            <button className="abv-profile-btn abv-profile-btn--danger" onClick={leaveGroup}>
              🚪 Quitter le groupe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
