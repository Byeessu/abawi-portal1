import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function CommunitiesPanel({ onClose, onSelectCommunity }) {
  const { membre } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadCommunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCommunities() {
    setLoading(true);
    const { data: all } = await supabase.from('communities').select('*').eq('is_public', true).order('created_at', { ascending: false });
    const { data: memberships } = await supabase.from('community_members').select('community_id').eq('user_id', membre?.id);
    if (all) {
      // Enrich with member count and message count
      const enriched = await Promise.all(all.map(async c => {
        const { count: memberCount } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', c.id);
        const { count: msgCount } = await supabase.from('community_messages').select('*', { count: 'exact', head: true }).eq('community_id', c.id);
        return { ...c, memberCount: memberCount || 0, msgCount: msgCount || 0 };
      }));
      setCommunities(enriched);
    }
    if (memberships) setJoined(memberships.map(m => m.community_id));
    setLoading(false);
  }

  async function joinCommunity(communityId) {
    await supabase.from('community_members').insert({ community_id: communityId, user_id: membre?.id });
    setJoined(prev => [...prev, communityId]);
  }

  async function leaveCommunity(communityId) {
    await supabase.from('community_members').delete().match({ community_id: communityId, user_id: membre?.id });
    setJoined(prev => prev.filter(id => id !== communityId));
  }

  async function createCommunity() {
    if (!newName.trim()) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
    const { data } = await supabase.from('communities').insert({
      name: newName.trim(),
      slug,
      description: newDesc.trim(),
      owner_id: membre?.id,
      is_public: true,
    }).select().single();
    if (data) {
      await supabase.from('community_members').insert({ community_id: data.id, user_id: membre?.id, role: 'admin' });
      setCommunities(prev => [data, ...prev]);
      setJoined(prev => [...prev, data.id]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    }
  }

  return (
    <div className="abv-communities-overlay" onClick={onClose}>
      <div className="abv-communities-modal" onClick={e => e.stopPropagation()}>
        <div className="abv-communities-header">
          <h3>🌍 Communautés</h3>
          <button className="abv-icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="abv-communities-actions">
          <button className="abv-btn-primary" onClick={() => setShowCreate(true)}>+ Créer</button>
        </div>

        {showCreate && (
          <div className="abv-communities-create">
            <input
              placeholder="Nom de la communauté"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <textarea
              placeholder="Description"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={2}
            />
            <div className="abv-communities-create-actions">
              <button onClick={() => setShowCreate(false)}>Annuler</button>
              <button className="abv-btn-primary" onClick={createCommunity}>Créer</button>
            </div>
          </div>
        )}

        <div className="abv-communities-list">
          {loading && <div className="abv-communities-loading">Chargement...</div>}
          {!loading && communities.length === 0 && (
            <div className="abv-communities-empty">Aucune communauté publique pour le moment.</div>
          )}
          {communities.map(c => {
            const isJoined = joined.includes(c.id);
            return (
              <div key={c.id} className="abv-community-card">
                <div className="abv-community-avatar">{initials(c.name)}</div>
                <div className="abv-community-info">
                  <div className="abv-community-name">{c.name}</div>
                  <div className="abv-community-desc">{c.description || 'Pas de description'}</div>
                  <div className="abv-community-stats">
                    <span>👥 {c.memberCount || 0} membre{(c.memberCount || 0) > 1 ? 's' : ''}</span>
                    <span>💬 {c.msgCount || 0} message{(c.msgCount || 0) > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="abv-community-actions">
                  {isJoined ? (
                    <>
                      <button className="abv-btn-sm" onClick={() => onSelectCommunity?.(c)}>Ouvrir</button>
                      <button className="abv-btn-sm abv-btn--secondary" onClick={() => leaveCommunity(c.id)}>Quitter</button>
                    </>
                  ) : (
                    <button className="abv-btn-sm abv-btn-primary" onClick={() => joinCommunity(c.id)}>Rejoindre</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
