import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { AbavieLogoSVG } from './AbavieLogoSVG';
import StatusViewer from './StatusViewer';
import StatusCreator from './StatusCreator';
import ContactsList from './ContactsList';
import CommunitiesPanel from './CommunitiesPanel';
import CommunityFeed from './CommunityFeed';
import { abavieSettings } from '../../lib/abavieSettings';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'maintenant';
  if (diff < 3600) return Math.floor(diff / 60) + 'min';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ChatSidebar({ activeChat, onSelectChat, hidden, onOpenGlobalSearch }) {
  const { membre } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abavie_contacts') || 'null') || [] } catch { return [] }
  });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [archivedConvs, setArchivedConvs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('abavie_archived') || '[]')) } catch { return new Set() }
  });
  const [mutedConvs, setMutedConvs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('abavie_muted') || '[]')) } catch { return new Set() }
  });
  const [pinnedConvs, setPinnedConvs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('abavie_pinned') || '[]')) } catch { return new Set() }
  });
  const [showProfile, setShowProfile] = useState(false);
  const [e2eEnabled, setE2eEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abavie_e2e') || 'false') } catch { return false }
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageStats, setStorageStats] = useState(null);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [statusViewerUserId, setStatusViewerUserId] = useState(null);
  const [showStatusCreator, setShowStatusCreator] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => abavieSettings.get());
  const [statuses, setStatuses] = useState([]);
  const [showCommunities, setShowCommunities] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const csvRef = useRef(null);
  const backupFileRef = useRef(null);

  useEffect(() => {
    if (!membre) return;
    loadConversations();
    loadUsers();
    const channel = supabase.channel('abavie-convs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadConversations)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [membre]);

  // Online / offline status
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // Storage stats
  useEffect(() => {
    if (!showProfile && !showSettings) return;
    import('../../lib/abavieIndexedDB').then(m => {
      m.getStorageStats().then(setStorageStats).catch(() => {});
    });
  }, [showProfile, showSettings]);

  // Load statuses
  useEffect(() => {
    if (!membre) return;
    loadStatuses();
    const channel = supabase.channel('abavie-statuses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, loadStatuses)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [membre]);

  async function loadStatuses() {
    const { data: sb } = await supabase
      .from('statuses')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    const local = JSON.parse(localStorage.getItem('abavie_statuses') || '[]')
      .filter(s => new Date(s.expires_at) > new Date());

    // Merge Supabase + localStorage (prefer Supabase)
    const byId = new Map();
    (sb || []).forEach(s => byId.set(s.id, s));
    local.forEach(s => { if (!byId.has(s.id)) byId.set(s.id, s); });

    const merged = Array.from(byId.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setStatuses(merged);
  }

  // Settings listener
  useEffect(() => {
    const handler = () => {
      setSettings(abavieSettings.get());
    };
    window.addEventListener('abavie-settings-change', handler);
    return () => window.removeEventListener('abavie-settings-change', handler);
  }, []);

  // E2E toggle
  function toggleE2E() {
    const next = !e2eEnabled;
    setE2eEnabled(next);
    localStorage.setItem('abavie_e2e', JSON.stringify(next));
    // Generate identity key and publish if enabling
    if (next) {
      import('../../lib/abavieE2EIntegration').then(m => {
        m.getOrCreateKeyPair().then(() => {
          if (membre?.id) m.publishPublicKey(membre.id);
        }).catch(() => {});
      });
    }
  }

  // Push notifications subscription
  async function subscribePush() {
    try {
      const { subscribePush: doSub, isPushConfigured, unsubscribePush, isPushEnabled: checkEnabled } =
        await import('../../lib/abaviePush');
      if (!isPushConfigured()) {
        alert('Notifications push non configurées sur ce serveur (VAPID manquant).');
        return;
      }
      const enabled = await checkEnabled();
      if (enabled) {
        await unsubscribePush(membre?.id);
        setPushEnabled(false);
        return;
      }
      await doSub(membre?.id);
      setPushEnabled(true);
    } catch (e) {
      console.error('Push subscription failed', e);
      alert(`Erreur notifications: ${e.message}`);
    }
  }

  async function loadConversations() {
    const { data } = await supabase.from('conversations').select('*').contains('participants', [membre.id]).order('updated_at', { ascending: false });
    if (data) setConversations(data);
  }

  function toggleArchive(convId) {
    const next = new Set(archivedConvs);
    next.has(convId) ? next.delete(convId) : next.add(convId);
    setArchivedConvs(next);
    localStorage.setItem('abavie_archived', JSON.stringify([...next]));
  }

  function toggleMute(convId) {
    const next = new Set(mutedConvs);
    next.has(convId) ? next.delete(convId) : next.add(convId);
    setMutedConvs(next);
    localStorage.setItem('abavie_muted', JSON.stringify([...next]));
  }

  function togglePin(convId) {
    const next = new Set(pinnedConvs);
    next.has(convId) ? next.delete(convId) : next.add(convId);
    setPinnedConvs(next);
    localStorage.setItem('abavie_pinned', JSON.stringify([...next]));
  }

  async function createGroup() {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    const { data } = await supabase.from('conversations').insert({
      participants: [membre.id, ...selectedMembers],
      is_group: true,
      group_name: groupName.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
    if (data) {
      setConversations(prev => [data, ...prev]);
      onSelectChat(data);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedMembers([]);
    }
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('id, nom, email, avatar_url').neq('id', membre.id).limit(50);
    if (data) setUsers(data);
  }

  function saveContacts(cs) {
    setContacts(cs);
    localStorage.setItem('abavie_contacts', JSON.stringify(cs));
  }

  function deleteContact(id) {
    saveContacts(contacts.filter(c => c.id !== id));
  }

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const [nom, email, tel] = lines[i].split(/[,;]/).map(s => s.trim());
        if (nom || email) imported.push({ id: Date.now() + i, nom, email, tel, importedAt: new Date().toISOString() });
      }
      saveContacts([...contacts, ...imported]);
    };
    reader.readAsText(file);
  }

  async function startConversation(userId) {
    const existing = conversations.find(c => !c.is_group && c.participants.includes(userId));
    if (existing) { onSelectChat(existing); setShowNewChat(false); return; }
    const { data } = await supabase.from('conversations').insert({
      participants: [membre.id, userId],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();
    if (data) { setConversations(prev => [data, ...prev]); onSelectChat(data); }
    setShowNewChat(false);
  }

  const visibleConvs = conversations.filter(c => {
    if (tab === 'groups') return c.is_group;
    if (tab === 'unread') return c.unread_count > 0;
    return true;
  });

  const sortedConvs = [...visibleConvs].sort((a, b) => {
    const aPinned = pinnedConvs.has(a.id) ? 1 : 0;
    const bPinned = pinnedConvs.has(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  const filtered = showNewChat
    ? users.filter(u => (u.nom || u.email || '').toLowerCase().includes(search.toLowerCase()))
    : sortedConvs.filter(c => {
        if (tab === 'archive') return archivedConvs.has(c.id);
        if (archivedConvs.has(c.id)) return false;
        if (c.is_group) return (c.group_name || '').toLowerCase().includes(search.toLowerCase());
        const other = users.find(u => u.id === c.participants.find(p => p !== membre?.id));
        return (other?.nom || other?.email || '').toLowerCase().includes(search.toLowerCase());
      });

  return (
    <aside className={`abv-sidebar${hidden ? ' abv-sidebar--hidden' : ''}`}>
      {/* Header */}
      <div className="abv-sidebar-header">
        <div className="abv-logo">
          <div className="abv-logo-mark">
            <AbavieLogoSVG size={22} color="var(--text-on-accent, #fff)" />
          </div>
          <span className="abv-logo-text">Ab<span>avie</span></span>
        </div>
        <div className="abv-sidebar-actions">
          <button className="abv-icon-btn" title="Recherche globale" onClick={onOpenGlobalSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button className="abv-icon-btn" title="Communautés" onClick={() => setShowCommunities(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          <button className="abv-icon-btn" title="Contacts" onClick={() => setShowContacts(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          <button className="abv-icon-btn" title="Importer contacts" onClick={() => setShowImport(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </button>
          <button className="abv-icon-btn" title="Nouveau message" onClick={() => { setShowNewChat(v => !v); setSearch(''); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="abv-icon-btn" title="Paramètres" onClick={() => setShowProfile(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.54 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.54 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.54a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.54 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="abv-search-wrap">
        <div className="abv-search">
          <span className="abv-search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input
            placeholder={showNewChat ? 'Chercher un contact…' : 'Rechercher…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="abv-import-panel">
          <h4>📥 Importer des contacts</h4>
          <input type="file" ref={csvRef} onChange={handleCSV} accept=".csv" style={{ display: 'none' }} />
          <button className="abv-import-btn" onClick={() => csvRef.current?.click()}>📄 CSV (Nom, Email, Tel)</button>
          <button className="abv-import-btn" onClick={() => {
            const nom = prompt('Nom :'); if (!nom) return;
            const email = prompt('Email (optionnel) :') || '';
            const tel = prompt('Téléphone (optionnel) :') || '';
            saveContacts([...contacts, { id: Date.now(), nom, email, tel, importedAt: new Date().toISOString() }]);
          }}>✏️ Ajouter manuellement</button>
          {contacts.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 700 }}>
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {contacts.map(c => (
                  <div key={c.id || c.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '4px 8px' }}>
                    <span style={{ fontWeight: 600 }}>{c.nom}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{c.tel || c.email || ''}</span>
                    <button onClick={() => deleteContact(c.id || c.email)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0 4px', fontSize: 13, lineHeight: 1 }} title="Supprimer">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Stories bar */}
      {!showNewChat && (
        <div className="abv-status-bar">
          {/* My status */}
          <button className="abv-status-circle abv-status-circle--mine" onClick={() => {
            const myStatuses = statuses.filter(s => s.user_id === membre?.id);
            if (myStatuses.length > 0) {
              setStatusViewerUserId(membre?.id);
              setShowStatusViewer(true);
            } else {
              setShowStatusCreator(true);
            }
          }}>
            <div className="abv-status-ring">
              <div className="abv-status-inner abv-status-inner--logo">
                <AbavieLogoSVG size={28} />
              </div>
            </div>
            <span className="abv-status-label">+</span>
          </button>
          {/* Other statuses */}
          {statuses.length > 0 ? (
            statuses.slice(0, 10).map(s => (
              <button
                key={s.id}
                className={`abv-status-circle${s.seen ? ' abv-status-circle--seen' : ''}`}
                onClick={() => { setStatusViewerUserId(s.user_id); setShowStatusViewer(true); }}
              >
                <div className="abv-status-ring">
                  <div className="abv-status-inner abv-status-inner--logo">
                    <AbavieLogoSVG size={28} />
                  </div>
                </div>
                <span className="abv-status-label">{s.user_name?.split(' ')[0] || 'User'}</span>
              </button>
            ))
          ) : (
            <span className="abv-status-hint">Aucun statut</span>
          )}
        </div>
      )}

      {/* Tabs (only in normal mode) */}
      {!showNewChat && (
        <div className="abv-tabs">
          {[['all', 'Tous'], ['unread', 'Non lus'], ['groups', 'Groupes'], ['status', 'Statuts']].map(([k, l]) => (
            <button key={k} className={`abv-tab${tab === k ? ' abv-tab--active' : ''}`} onClick={() => { setTab(k); if (k === 'status') { setStatusViewerUserId(null); setShowStatusViewer(true); } }}>{l}</button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="abv-conv-list">
        {showNewChat ? (
          <>
            <div style={{ display: 'flex', gap: 8, padding: '8px 16px' }}>
              <button className="abv-new-chat-tab" onClick={() => setShowGroupModal(true)}>👥 Nouveau groupe</button>
            </div>
            {filtered.length === 0
              ? <div className="abv-empty"><div className="abv-empty-icon">👤</div><p className="abv-empty-text">Aucun contact trouvé</p></div>
              : filtered.map(u => (
                <div key={u.id} className="abv-user-item" onClick={() => startConversation(u.id)}>
                  <div className="abv-avatar">{initials(u.nom || u.email)} {onlineUsers.has(u.id) && <span className="abv-avatar-online" />}</div>
                  <div className="abv-conv-info">
                    <div className="abv-conv-name">{u.nom || 'Sans nom'}</div>
                    <div className="abv-conv-preview">{u.email} {onlineUsers.has(u.id) ? '● En ligne' : ''}</div>
                  </div>
                </div>
              ))}
            {/* Group creation modal */}
            {showGroupModal && (
              <div className="abv-modal-overlay" onClick={() => setShowGroupModal(false)}>
                <div className="abv-modal abv-modal--sidebar" onClick={e => e.stopPropagation()}>
                  <h4>👥 Nouveau groupe</h4>
                  <input
                    className="abv-group-input"
                    placeholder="Nom du groupe..."
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    autoFocus
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '8px 0' }}>Sélectionnez les membres :</p>
                  <div className="abv-group-members">
                    {users.map(u => (
                      <label key={u.id} className="abv-group-member-item">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedMembers(prev => [...prev, u.id]);
                            else setSelectedMembers(prev => prev.filter(id => id !== u.id));
                          }}
                        />
                        <div className="abv-avatar abv-avatar--sm">{initials(u.nom || u.email)}</div>
                        <span>{u.nom || u.email}</span>
                      </label>
                    ))}
                  </div>
                  <div className="abv-modal-actions">
                    <button onClick={() => setShowGroupModal(false)}>Annuler</button>
                    <button className="abv-btn-primary" onClick={createGroup} disabled={!groupName.trim() || selectedMembers.length === 0}>Créer</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : filtered.length === 0 ? (
          <div className="abv-empty">
            <div className="abv-empty-icon">💬</div>
            <p className="abv-empty-text">Aucune conversation.<br/>Cliquez sur le crayon pour commencer.</p>
          </div>
        ) : (
          filtered.map(c => {
            const otherId = c.participants?.find(p => p !== membre?.id);
            const other = users.find(u => u.id === otherId);
            const name = c.is_group ? (c.group_name || `Groupe (${c.participants?.length || 2})`) : (other?.nom || other?.email?.split('@')[0] || 'Inconnu');
            const isMuted = mutedConvs.has(c.id);
            const isPinned = pinnedConvs.has(c.id);
            const isArchived = archivedConvs.has(c.id);
            return (
              <div key={c.id}
                className={`abv-conv-item${activeChat?.id === c.id ? ' abv-conv-item--active' : ''}${isPinned ? ' abv-conv-item--pinned' : ''}${isMuted ? ' abv-conv-item--muted' : ''}`}
                onClick={() => onSelectChat(c)}
              >
                <div className="abv-avatar">
                  {initials(name)}
                  {!c.is_group && onlineUsers.has(otherId) && <span className="abv-avatar-online" />}
                </div>
                <div className="abv-conv-info">
                  <div className="abv-conv-name">
                    {name}
                    {isMuted && <span className="abv-conv-badge-icon">🔇</span>}
                    {isPinned && <span className="abv-conv-badge-icon">📌</span>}
                  </div>
                  <div className="abv-conv-preview">
                    {isMuted ? '🔇 ' : ''}
                    {c.last_message || 'Nouvelle conversation'}
                  </div>
                </div>
                <div className="abv-conv-meta">
                  <span className="abv-conv-time">{timeAgo(c.updated_at)}</span>
                  {c.unread_count > 0 && !isMuted && <span className="abv-conv-badge">{c.unread_count}</span>}
                </div>
                {/* Hover actions */}
                <div className="abv-conv-actions">
                  <button title="Épingler" onClick={(e) => { e.stopPropagation(); togglePin(c.id); }}>{isPinned ? '📌' : '📍'}</button>
                  <button title={isMuted ? 'Activer son' : 'Silencieux'} onClick={(e) => { e.stopPropagation(); toggleMute(c.id); }}>{isMuted ? '🔔' : '🔇'}</button>
                  <button title="Archiver" onClick={(e) => { e.stopPropagation(); toggleArchive(c.id); }}>🗃️</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Profile / Settings */}
      {showProfile && (
        <div className="abv-profile-panel">
          <div className="abv-profile-header">
            <button className="abv-icon-btn" onClick={() => setShowProfile(false)}>✕</button>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="abv-settings-logo"><AbavieLogoSVG size={22} /></span>
              Paramètres
            </h4>
          </div>
          <div className="abv-profile-body">
            <div className="abv-profile-avatar abv-profile-avatar--abavie">
              <AbavieLogoSVG size={48} />
            </div>
            <div className="abv-profile-name">{membre?.nom || 'Utilisateur'}</div>
            <div className="abv-profile-email">{membre?.email}</div>
            <div className="abv-profile-stats">
              <div><strong>{conversations.length}</strong> conversations</div>
              <div><strong>{contacts.length}</strong> contacts</div>
              <div><strong>{mutedConvs.size}</strong> silencieux</div>
            </div>
            <div className="abv-profile-status">
              <div className={`abv-status-dot${isOnline ? ' abv-status-dot--online' : ''}`} />
              <span>{isOnline ? '🌐 En ligne' : '🔴 Hors ligne — mode sync'}</span>
              {storageStats && <span className="abv-profile-storage">{Object.values(storageStats).reduce((a,b)=>a+b,0)} éléments stockés</span>}
            </div>
            <div className="abv-profile-actions">
              <button className="abv-profile-btn" onClick={() => { setShowSettings(true); setShowProfile(false); }}>⚙️ Paramètres avancés</button>
              <button className="abv-profile-btn" onClick={() => { setTab('archive'); setShowProfile(false); }}>🗃️ Archives ({archivedConvs.size})</button>
              <button className="abv-profile-btn" onClick={subscribePush}>
                {pushEnabled ? '🔔 Notifications activées' : '🔕 Activer les notifications push'}
              </button>
              <button className="abv-profile-btn abv-profile-btn--toggle" onClick={toggleE2E}>
                {e2eEnabled ? '🔒 Chiffrement E2E activé' : '🔓 Activer le chiffrement E2E'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Panel */}
      {showSettings && (
        <div className="abv-profile-panel">
          <div className="abv-profile-header">
            <button className="abv-icon-btn" onClick={() => setShowSettings(false)}>←</button>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="abv-settings-logo"><AbavieLogoSVG size={22} /></span>
              Paramètres
            </h4>
          </div>
          <div className="abv-profile-body abv-settings-body">
            {/* Notifications */}
            <div className="abv-settings-section">
              <h5>🔔 Notifications</h5>
              <label className="abv-settings-row">
                <span>Son de notification</span>
                <input type="checkbox" checked={settings.notifications_sound} onChange={() => { abavieSettings.toggle('notifications_sound'); setSettings(abavieSettings.get()); }} />
              </label>
              <label className="abv-settings-row">
                <span>Aperçu message</span>
                <input type="checkbox" checked={settings.notifications_preview} onChange={() => { abavieSettings.toggle('notifications_preview'); setSettings(abavieSettings.get()); }} />
              </label>
              <label className="abv-settings-row">
                <span>Ne pas déranger</span>
                <input type="checkbox" checked={settings.do_not_disturb} onChange={() => { abavieSettings.toggle('do_not_disturb'); setSettings(abavieSettings.get()); }} />
              </label>
            </div>

            {/* Privacy */}
            <div className="abv-settings-section">
              <h5>🔐 Confidentialité</h5>
              <label className="abv-settings-row">
                <span>Dernière connexion</span>
                <select value={settings.last_seen_visibility} onChange={e => { abavieSettings.set('last_seen_visibility', e.target.value); setSettings(abavieSettings.get()); }}>
                  <option value="all">Tout le monde</option>
                  <option value="contacts">Mes contacts</option>
                  <option value="nobody">Personne</option>
                </select>
              </label>
              <label className="abv-settings-row">
                <span>Photo de profil</span>
                <select value={settings.profile_photo_visibility} onChange={e => { abavieSettings.set('profile_photo_visibility', e.target.value); setSettings(abavieSettings.get()); }}>
                  <option value="all">Tout le monde</option>
                  <option value="contacts">Mes contacts</option>
                  <option value="nobody">Personne</option>
                </select>
              </label>
              <label className="abv-settings-row">
                <span>Accusés de lecture</span>
                <input type="checkbox" checked={settings.read_receipts} onChange={() => { abavieSettings.toggle('read_receipts'); setSettings(abavieSettings.get()); }} />
              </label>
              <label className="abv-settings-row">
                <span>Indicateur de saisie</span>
                <input type="checkbox" checked={settings.typing_indicators} onChange={() => { abavieSettings.toggle('typing_indicators'); setSettings(abavieSettings.get()); }} />
              </label>
            </div>

            {/* Data */}
            <div className="abv-settings-section">
              <h5>💾 Données et stockage</h5>
              <label className="abv-settings-row">
                <span>Téléchargement auto images</span>
                <input type="checkbox" checked={settings.auto_download_images} onChange={() => { abavieSettings.toggle('auto_download_images'); setSettings(abavieSettings.get()); }} />
              </label>
              <label className="abv-settings-row">
                <span>Téléchargement auto vidéos</span>
                <input type="checkbox" checked={settings.auto_download_videos} onChange={() => { abavieSettings.toggle('auto_download_videos'); setSettings(abavieSettings.get()); }} />
              </label>
              <label className="abv-settings-row">
                <span>Téléchargement auto audio</span>
                <input type="checkbox" checked={settings.auto_download_audio} onChange={() => { abavieSettings.toggle('auto_download_audio'); setSettings(abavieSettings.get()); }} />
              </label>
              <button className="abv-profile-btn" onClick={async () => {
                const { cleanupMediaCache } = await import('../../lib/abavieIndexedDB');
                const { removed, remaining } = await cleanupMediaCache();
                alert(`${removed} médias nettoyés — ${remaining} restants`);
              }}>🧹 Nettoyer le cache média</button>
              <button className="abv-profile-btn" onClick={() => { abavieSettings.reset(); setSettings(abavieSettings.get()); }}>🔄 Réinitialiser les paramètres</button>
            </div>

            {/* Backup */}
            <div className="abv-settings-section">
              <h5>📦 Sauvegarde</h5>
              <button className="abv-profile-btn" onClick={async () => {
                if (!membre?.id) { alert('Connecte-toi pour exporter'); return; }
                try {
                  const { exportAllConversations } = await import('../../lib/abavieBackup');
                  const res = await exportAllConversations(membre.id);
                  alert(`✅ Export réussi\n${res.conversationsCount} conversations\n${res.messagesCount} messages`);
                } catch (e) {
                  alert(`❌ Erreur export: ${e.message}`);
                }
              }}>⬇️ Exporter mes conversations</button>
              <input
                ref={backupFileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const { importBackup } = await import('../../lib/abavieBackup');
                    const res = await importBackup(file, { membreId: membre?.id });
                    alert(`✅ Import réussi\n${res.conversationsCount} conversations\n${res.messagesCount} messages restaurés en local`);
                  } catch (err) {
                    alert(`❌ Erreur import: ${err.message}`);
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
              <button className="abv-profile-btn" onClick={() => backupFileRef.current?.click()}>
                ⬆️ Importer une sauvegarde
              </button>
              <p className="abv-settings-hint" style={{ fontSize: 12, opacity: 0.7, margin: '8px 0 0' }}>
                Les sauvegardes sont des fichiers JSON. L'import restaure dans le cache local.
              </p>
            </div>

            {/* Appearance */}
            <div className="abv-settings-section">
              <h5>🎨 Apparence</h5>
              <label className="abv-settings-row">
                <span>Thème</span>
                <select value={settings.theme} onChange={e => { abavieSettings.set('theme', e.target.value); setSettings(abavieSettings.get()); }}>
                  <option value="system">Système</option>
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </label>
              <label className="abv-settings-row">
                <span>Couleur d'accent</span>
                <div className="abv-theme-colors">
                  {[
                    { id: 'green', label: 'Abavie', hex: '#18A84A' },
                    { id: 'blue', label: 'Océan', hex: '#2563EB' },
                    { id: 'purple', label: 'Royal', hex: '#7C3AED' },
                    { id: 'orange', label: 'Soleil', hex: '#EA580C' },
                    { id: 'pink', label: 'Rose', hex: '#DB2777' },
                    { id: 'teal', label: 'Turquoise', hex: '#0D9488' },
                    { id: 'gold', label: 'Or', hex: '#CA8A04' },
                  ].map(c => (
                    <button
                      key={c.id}
                      className={`abv-theme-color${settings.theme_color === c.id ? ' abv-theme-color--active' : ''}`}
                      style={{ background: c.hex }}
                      title={c.label}
                      onClick={() => { abavieSettings.set('theme_color', c.id); setSettings(abavieSettings.get()); }}
                    />
                  ))}
                </div>
              </label>
              <label className="abv-settings-row">
                <span>Fond de chat</span>
                <div className="abv-wallpapers">
                  <button
                    className={`abv-wallpaper-thumb${!settings.chat_wallpaper ? ' abv-wallpaper-thumb--active' : ''}`}
                    onClick={() => { abavieSettings.set('chat_wallpaper', null); setSettings(abavieSettings.get()); }}
                    title="Aucun"
                  >
                    <span>✕</span>
                  </button>
                  {[
                    { id: 'gradient-1', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                    { id: 'gradient-2', style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                    { id: 'gradient-3', style: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
                    { id: 'dots', style: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)' },
                    { id: 'lines', style: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)' },
                    { id: 'mesh', style: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)' },
                    { id: 'abstract-1', style: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
                    { id: 'abstract-2', style: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
                    { id: 'abstract-3', style: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)' },
                  ].map(w => (
                    <button
                      key={w.id}
                      className={`abv-wallpaper-thumb${settings.chat_wallpaper === w.id ? ' abv-wallpaper-thumb--active' : ''}`}
                      style={{ background: w.style }}
                      onClick={() => { abavieSettings.set('chat_wallpaper', w.id); setSettings(abavieSettings.get()); }}
                      title={w.id}
                    />
                  ))}
                </div>
              </label>
              <label className="abv-settings-row">
                <span>Taille du texte</span>
                <select value={settings.font_size} onChange={e => { abavieSettings.set('font_size', e.target.value); setSettings(abavieSettings.get()); }}>
                  <option value="small">Petit</option>
                  <option value="medium">Moyen</option>
                  <option value="large">Grand</option>
                </select>
              </label>
              <label className="abv-settings-row">
                <span>Réduire les animations</span>
                <input type="checkbox" checked={settings.reduce_motion} onChange={() => { abavieSettings.toggle('reduce_motion'); setSettings(abavieSettings.get()); }} />
              </label>
            </div>

            {/* Account */}
            <div className="abv-settings-section">
              <h5>👤 Compte</h5>
              <div className="abv-settings-row">
                <span>Nom</span>
                <span className="abv-settings-value">{membre?.nom || '—'}</span>
              </div>
              <div className="abv-settings-row">
                <span>Email</span>
                <span className="abv-settings-value">{membre?.email || '—'}</span>
              </div>
              <div className="abv-settings-row">
                <span>Langue</span>
                <select value={settings.language} onChange={e => { abavieSettings.set('language', e.target.value); setSettings(abavieSettings.get()); }}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Viewer — portal to escape aside transform stacking context */}
      {showStatusViewer && createPortal(
        <StatusViewer onClose={() => setShowStatusViewer(false)} initialUserId={statusViewerUserId} />,
        document.body
      )}

      {/* Status Creator — portal to escape aside transform stacking context */}
      {showStatusCreator && createPortal(
        <StatusCreator
          onClose={() => setShowStatusCreator(false)}
          onPublished={() => { loadStatuses(); }}
        />,
        document.body
      )}

      {/* Contacts List */}
      {showContacts && (
        <ContactsList
          onClose={() => setShowContacts(false)}
          onStartConversation={convId => {
            const conv = conversations.find(c => c.id === convId);
            if (conv) onSelectChat(conv);
            setShowContacts(false);
          }}
          onInvite={() => {
            const link = `${window.location.origin}/abavie?join=invite&ref=${membre?.id}`;
            navigator.clipboard.writeText(`Rejoins-moi sur Abavie ! ${link}`);
            alert('Lien copié !');
          }}
        />
      )}

      {/* Communities */}
      {showCommunities && (
        <CommunitiesPanel
          onClose={() => setShowCommunities(false)}
          onSelectCommunity={c => {
            setActiveCommunity(c);
            setShowCommunities(false);
          }}
        />
      )}
      {activeCommunity && (
        <CommunityFeed
          community={activeCommunity}
          onClose={() => setActiveCommunity(null)}
        />
      )}
    </aside>
  );
}
