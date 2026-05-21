import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ContactsList({ onClose, onStartConversation, onInvite }) {
  const { membre } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('abavie'); // 'abavie' | 'phone' | 'invited'

  useEffect(() => {
    if (!membre) return;
    loadContacts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membre]);

  async function loadContacts() {
    setLoading(true);
    // Load Abavie users (profiles excluding self)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nom, email, avatar_url, last_seen')
      .neq('id', membre.id)
      .order('nom', { ascending: true });

    // Load user's saved contacts (phone book synced)
    const saved = JSON.parse(localStorage.getItem('abtalk_contacts') || '[]');

    // Mark which saved contacts have Abavie accounts
    const enriched = saved.map(c => {
      const match = (profiles || []).find(p =>
        p.email === c.email || p.nom?.toLowerCase() === c.name?.toLowerCase()
      );
      return { ...c, hasAccount: !!match, profile: match || null };
    });

    setContacts({
      abavie: (profiles || []).map(p => ({ ...p, type: 'abavie' })),
      phone: enriched.filter(c => !c.hasAccount),
      invited: enriched.filter(c => c.hasAccount),
    });
    setLoading(false);
  }

  async function addContact(name, email, phone) {
    const saved = JSON.parse(localStorage.getItem('abtalk_contacts') || '[]');
    const existing = saved.find(c => c.email === email || c.phone === phone);
    if (existing) return;
    saved.push({ id: `contact-${Date.now()}`, name, email, phone, invitedAt: null });
    localStorage.setItem('abtalk_contacts', JSON.stringify(saved));
    loadContacts();
  }

  async function inviteContact(contact) {
    const link = `${window.location.origin}/abavie?join=invite&ref=${membre?.id}`;
    const body = `Bonjour ! Rejoins-moi sur Abavie pour discuter en toute sécurité. ${link}`;

    // Try WhatsApp first, then SMS, then email
    if (contact.phone) {
      const wa = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`;
      window.open(wa, '_blank');
    } else if (contact.email) {
      window.location.href = `mailto:${contact.email}?subject=Rejoins%20Abavie&body=${encodeURIComponent(body)}`;
    }

    // Mark as invited
    const saved = JSON.parse(localStorage.getItem('abtalk_contacts') || '[]');
    const idx = saved.findIndex(c => c.id === contact.id);
    if (idx >= 0) {
      saved[idx].invitedAt = new Date().toISOString();
      localStorage.setItem('abtalk_contacts', JSON.stringify(saved));
      loadContacts();
    }
    onInvite?.(contact);
  }

  async function startChat(profile) {
    // Find or create 1:1 conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('is_group', false)
      .contains('participants', [membre.id, profile.id])
      .maybeSingle();

    if (existing) {
      onStartConversation?.(existing.id);
    } else {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          participants: [membre.id, profile.id],
          created_by: membre.id,
        })
        .select('id')
        .single();
      if (conv) onStartConversation?.(conv.id);
    }
    onClose?.();
  }

  const currentList = contacts[tab] || [];
  const filtered = search.trim()
    ? currentList.filter(c =>
        (c.nom || c.name || c.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : currentList;

  return (
    <div className="abv-contacts-overlay" onClick={onClose}>
      <div className="abv-contacts-panel" onClick={e => e.stopPropagation()}>
        <div className="abv-contacts-header">
          <h3>👥 Contacts</h3>
          <button className="abv-icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="abv-contacts-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un contact..."
          />
        </div>

        <div className="abv-contacts-tabs">
          {[
            ['abavie', `Sur Abavie (${contacts.abavie?.length || 0})`],
            ['phone', `Téléphone (${contacts.phone?.length || 0})`],
            ['invited', `Invités (${contacts.invited?.length || 0})`],
          ].map(([k, l]) => (
            <button key={k} className={`abv-contacts-tab${tab === k ? ' abv-contacts-tab--active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="abv-contacts-list">
          {loading ? (
            <div className="abv-contacts-empty">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="abv-contacts-empty">
              {tab === 'phone' ? (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📱</div>
                  <p>Aucun contact enregistré</p>
                  <button className="abv-profile-btn" style={{ marginTop: 12 }} onClick={() => {
                    const name = prompt('Nom du contact');
                    const phone = prompt('Numéro de téléphone');
                    const email = prompt('Email (optionnel)');
                    if (name && (phone || email)) addContact(name, email, phone);
                  }}>+ Ajouter un contact</button>
                </>
              ) : tab === 'abavie' ? (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌐</div>
                  <p>Personne de ton réseau sur Abavie</p>
                  <button className="abv-profile-btn" style={{ marginTop: 12 }} onClick={() => onInvite?.()}>Inviter des amis</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📨</div>
                  <p>Aucune invitation envoyée</p>
                </>
              )}
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="abv-contact-row">
                <div className="abv-avatar abv-avatar--sm">{initials(c.nom || c.name || c.email)}</div>
                <div className="abv-contact-info">
                  <div className="abv-contact-name">{c.nom || c.name || c.email}</div>
                  <div className="abv-contact-detail">{c.email || c.phone || (c.last_seen ? 'Vu récemment' : 'Sur Abavie')}</div>
                </div>
                {tab === 'abavie' ? (
                  <button className="abv-contact-action" onClick={() => startChat(c)}>
                    💬
                  </button>
                ) : tab === 'phone' ? (
                  <button className="abv-contact-action" onClick={() => inviteContact(c)}>
                    📨 Inviter
                  </button>
                ) : (
                  <span className="abv-contact-status">✅ Déjà sur Abavie</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="abv-contacts-footer">
          <button className="abv-profile-btn" onClick={() => onInvite?.()}>🔗 Copier mon lien d'invitation</button>
        </div>
      </div>
    </div>
  );
}
