import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import MessageInput from './MessageInput';
import { AbavieLogoSVG } from './AbavieLogoSVG';
import { AbavieCall } from '../../lib/abavieWebRTC';
import { runBotCommand, sendBotReply } from '../../lib/abavieBots';
import { cacheMessages, getCachedMessages, queuePendingMessage, flushPending, cacheMedia, getCachedMedia, unindexMedia } from '../../lib/abavieIndexedDB';
import IncomingCall from './IncomingCall';
import ForwardModal from './ForwardModal';
import PollMessage from './PollMessage';
import GroupInfo from './GroupInfo';
import MeetingRoom from './MeetingRoom';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import LocationMessage from './LocationMessage';
import GiftPanel from './GiftPanel';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderMentions(text) {
  if (!text) return text;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="abv-mention">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

const CONTEXT_MENU_ITEMS = [
  { id: 'reply', label: '↩️ Répondre', icon: '↩️' },
  { id: 'copy', label: '📋 Copier', icon: '📋' },
  { id: 'edit', label: '✏️ Modifier', icon: '✏️', condition: m => m.sender_id === m._membreId },
  { id: 'pin', label: '📌 Épingler', icon: '📌' },
  { id: 'forward', label: '↗️ Transférer', icon: '↗️' },
  { id: 'star', label: '⭐ Favori', icon: '⭐' },
  { id: 'timer', label: '⏳ Auto-destruct', icon: '⏳' },
  { id: 'delete', label: '🗑️ Supprimer', icon: '🗑️', danger: true },
  { id: 'info', label: 'ℹ️ Infos', icon: 'ℹ️' },
];

export default function ChatWindow({ conversation, visible, onBack, onOpenExternal }) {
  const { membre } = useAuth();
  const [messages, setMessages] = useState([]);
  const [mediaSrc, setMediaSrc] = useState({});
  const [otherUser, setOtherUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showReactionsFor, setShowReactionsFor] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showMsgInfo, setShowMsgInfo] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);

  // WebRTC call state
  const [callState, setCallState] = useState({ active: false, type: null, status: 'idle' });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const callRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Incoming call
  const [incomingCall, setIncomingCall] = useState(null);

  // Forward modal
  const [forwardMessage, setForwardMessage] = useState(null);

  // Gift panel
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  // Disappearing messages timer (per conversation)
  const [disappearingTimer, setDisappearingTimer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abavie_disappearing') || '{}') } catch { return {} }
  });

  // Scheduled send
  const [scheduledSend, setScheduledSend] = useState(false);

  // Polls cache
  const [pollsMap, setPollsMap] = useState({});

  // Group info
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // Meeting room
  const [showMeetingRoom, setShowMeetingRoom] = useState(false);
  const [meetingRoomId, setMeetingRoomId] = useState(null);

  useEffect(() => {
    if (!conversation || !membre) return;
    loadMessages();
    loadOtherUser();
    loadPinnedMessage();
    loadPolls();
    // Pre-cache media URLs in background
    cacheMediaForConversation();
    const channel = supabase.channel('abavie-msgs-' + conversation.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + conversation.id },
        async payload => {
          const msg = payload.new;
          // Detect incoming call messages
          if ((msg.type === 'audio_call' || msg.type === 'video_call') && msg.sender_id !== membre.id && msg.metadata?.status === 'ringing') {
            setIncomingCall({ type: msg.type === 'video_call' ? 'video' : 'audio', callerName: name, offerSdp: msg.metadata?.offerSdp });
          }
          // E2E decrypt
          const [decrypted] = await decryptE2EMessages([msg]);
          setMessages(prev => {
            const exists = prev.find(m => m.id === decrypted.id);
            return exists ? prev : [...prev, decrypted];
          });
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + conversation.id },
        async payload => {
          const [decrypted] = await decryptE2EMessages([payload.new]);
          setMessages(prev => prev.map(m => m.id === decrypted.id ? decrypted : m));
        })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [conversation, membre]);

  async function loadPolls() {
    const { data } = await supabase.from('polls').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: false });
    if (data) {
      const map = {};
      data.forEach(p => { map[p.id] = p; });
      setPollsMap(map);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Resolve cached media URLs
  useEffect(() => {
    if (!messages.length) return;
    let cancelled = false;
    const mediaMessages = messages.filter(m => m.file_url && (m.type === 'image' || m.type === 'video' || m.type === 'audio'));
    const resolveAll = async () => {
      const next = {};
      for (const m of mediaMessages) {
        const src = await resolveMediaSrc(m.file_url);
        next[m.id] = src;
      }
      if (!cancelled) setMediaSrc(prev => ({ ...prev, ...next }));
    };
    resolveAll();
    return () => { cancelled = true; };
  }, [messages]);

  // Media cache helpers
  async function resolveMediaSrc(url) {
    if (!url) return null;
    const cached = await getCachedMedia(url);
    return cached || url;
  }

  async function cacheMediaForConversation() {
    if (!conversation?.id || !messages.length) return;
    const { abavieSettings } = await import('../../lib/abavieSettings');
    const autoImg = abavieSettings.get('auto_download_images');
    const autoVid = abavieSettings.get('auto_download_videos');
    const autoAud = abavieSettings.get('auto_download_audio');
    for (const m of messages) {
      if (!m.file_url) continue;
      const shouldCache = (m.type === 'image' && autoImg) || (m.type === 'video' && autoVid) || (m.type === 'audio' && autoAud);
      if (!shouldCache) continue;
      // Check if already cached
      const alreadyCached = await getCachedMedia(m.file_url);
      if (alreadyCached) continue;
      cacheMedia({ url: m.file_url, messageId: m.id, conversationId: conversation.id, type: m.type }).catch(() => {});
    }
  }

  async function loadMessages() {
    // Try IndexedDB first for instant display
    const cached = await getCachedMessages(conversation.id)
    if (cached.length > 0) setMessages(await decryptE2EMessages(cached))

    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: true });
    if (data) {
      const decrypted = await decryptE2EMessages(data)
      setMessages(decrypted)
      markAsRead(data)
      loadReads(data.map(m => m.id))
      cacheMessages(decrypted)
    }
  }

  // E2E decryption helper
  async function decryptE2EMessages(msgs) {
    try {
      const { isE2EEnabled, decryptMessageContent } = await import('../../lib/abavieE2EIntegration');
      if (!isE2EEnabled()) return msgs;
      return Promise.all(msgs.map(async (m) => {
        if (m.e2e_payload?.ciphertext) {
          const decrypted = await decryptMessageContent(m.e2e_payload, m.sender_id);
          if (decrypted) return { ...m, content: decrypted, _e2eDecrypted: true };
        }
        return m;
      }));
    } catch { return msgs; }
  }

  const [readsMap, setReadsMap] = useState({});

  async function markAsRead(data) {
    const unread = data.filter(m => m.sender_id !== membre.id);
    if (unread.length === 0) return;
    const now = new Date().toISOString();
    const rows = unread.map(m => ({ message_id: m.id, user_id: membre.id, read_at: now }));
    await supabase.from('message_reads').upsert(rows, { onConflict: 'message_id, user_id' });
  }

  async function loadReads(messageIds) {
    if (!messageIds.length) return;
    const { data } = await supabase
      .from('message_reads')
      .select('message_id, user_id, read_at')
      .in('message_id', messageIds);
    if (data) {
      const map = {};
      data.forEach(r => {
        if (!map[r.message_id]) map[r.message_id] = [];
        map[r.message_id].push(r);
      });
      setReadsMap(prev => ({ ...prev, ...map }));
    }
  }

  async function loadOtherUser() {
    const otherId = conversation.participants.find(p => p !== membre.id);
    if (!otherId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', otherId).single();
    if (data) setOtherUser(data);
  }

  async function loadPinnedMessage() {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversation.id).eq('pinned', true).order('created_at', { ascending: false }).limit(1).single();
    if (data) setPinnedMessage(data);
    else setPinnedMessage(null);
  }

  async function handleSend(text, type, fileUrl, opts = {}) {
    if (editMessage) {
      await supabase.from('messages').update({ content: text, edited: true }).eq('id', editMessage.id);
      setEditMessage(null);
      return;
    }

    // Bot command detection
    if (type === 'text' && text.trim().startsWith('/')) {
      const botReply = await runBotCommand(text.trim());
      if (botReply) {
        await sendBotReply(conversation.id, botReply, membre.id);
        return;
      }
    }

    // Poll creation (/poll)
    if (type === 'text' && text.trim().startsWith('/poll')) {
      const args = text.trim().slice(5).trim().match(/(?:"[^"]*"|\S+)/g)?.map(a => a.replace(/^"|"$/g, '')) || [];
      const question = args[0] || 'Sondage';
      const options = args.slice(1).length > 0 ? args.slice(1).map((o, i) => ({ id: `opt-${i}`, text: o, count: 0 })) : [{ id: 'opt-0', text: 'Oui', count: 0 }, { id: 'opt-1', text: 'Non', count: 0 }];
      await supabase.from('polls').insert({ conversation_id: conversation.id, sender_id: membre.id, question, options, is_anonymous: true });
      await supabase.from('messages').insert({
        conversation_id: conversation.id, sender_id: membre.id, type: 'poll', content: question, metadata: { pollId: 'pending' }, created_at: new Date().toISOString(), read: false
      });
      return;
    }

    const now = new Date();
    const sendAt = opts.scheduledAt ? new Date(opts.scheduledAt) : null;
    const expiresAt = opts.expiresAt ? new Date(opts.expiresAt) : null;

    if (sendAt && sendAt > now) {
      // Schedule for later
      await supabase.from('scheduled_messages').insert({
        conversation_id: conversation.id,
        sender_id: membre.id,
        content: text,
        type: type || 'text',
        file_url: fileUrl || null,
        scheduled_at: sendAt.toISOString(),
      });
      return;
    }

    const msg = {
      conversation_id: conversation.id,
      sender_id: membre.id,
      content: text,
      type: type || 'text',
      file_url: fileUrl || null,
      reply_to_id: replyTo?.id || null,
      created_at: now.toISOString(),
      read: false,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    };

    // E2E encryption
    try {
      const { isE2EEnabled, encryptMessageContent } = await import('../../lib/abavieE2EIntegration');
      if (isE2EEnabled() && type === 'text' && text) {
        const otherId = conversation.participant_1 === membre.id ? conversation.participant_2 : conversation.participant_1;
        const e2ePayload = await encryptMessageContent(text, otherId);
        if (e2ePayload) {
          msg.e2e_payload = e2ePayload;
          msg.e2e_recipient_key = otherId;
          msg.content = '[Message chiffré 🔒]';
        }
      }
    } catch { /* E2E non disponible */ }

    try {
      await supabase.from('messages').insert(msg);
    } catch (e) {
      await queuePendingMessage(msg);
      setMessages(prev => [...prev, { ...msg, id: 'pending-' + Date.now() }]);
    }

    await supabase.from('conversations').update({
      last_message: (text || '[Media]').slice(0, 80),
      updated_at: now.toISOString(),
    }).eq('id', conversation.id);
    setReplyTo(null);
    setScheduledSend(false);
  }

  async function handleForward(convId, content, fileUrl) {
    const fwd = {
      conversation_id: convId,
      sender_id: membre.id,
      content,
      type: 'text',
      file_url: fileUrl || null,
      forwarded_from: conversation.id,
      created_at: new Date().toISOString(),
      read: false,
    };
    await supabase.from('messages').insert(fwd);
    await supabase.from('conversations').update({
      last_message: ('➡️ ' + content).slice(0, 80),
      updated_at: new Date().toISOString(),
    }).eq('id', convId);
  }

  async function toggleStar(msg) {
    if (!msg.id?.startsWith('pending')) {
      if (msg.starred) {
        await supabase.from('starred_messages').delete().match({ user_id: membre.id, message_id: msg.id });
      } else {
        await supabase.from('starred_messages').insert({ user_id: membre.id, message_id: msg.id }).catch(() => {});
      }
    }
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, starred: !m.starred } : m));
  }

  function toggleDisappearingTimer() {
    const timers = [null, 5, 60, 60 * 60, 24 * 60 * 60]; // off, 5s, 1min, 1h, 24h
    const current = disappearingTimer[conversation.id] || 0;
    const idx = timers.indexOf(current);
    const next = timers[(idx + 1) % timers.length];
    const nextMap = { ...disappearingTimer, [conversation.id]: next };
    setDisappearingTimer(nextMap);
    localStorage.setItem('abavie_disappearing', JSON.stringify(nextMap));
  }

  // ── WebRTC call handlers ────────────────────────────────────

  async function startCall(video = false) {
    if (callState.active) return;
    setCallState({ active: true, type: video ? 'video' : 'audio', status: 'calling' });
    callRef.current = new AbavieCall(conversation.id, membre.id, (status) => {
      setCallState(prev => ({ ...prev, status }));
    }, (kind, stream) => {
      if (kind === 'local') {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } else {
        setRemoteStream(stream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      }
    }, (phase, err) => {
      console.error('WebRTC error:', phase, err);
      setCallState(prev => ({ ...prev, status: 'error' }));
    });
    await callRef.current.startCall({ audio: true, video });
  }

  function endCall() {
    callRef.current?.hangup();
    setLocalStream(null);
    setRemoteStream(null);
    setCallState({ active: false, type: null, status: 'idle' });
  }

  function toggleMuteCall() {
    const enabled = callRef.current?.toggleMute();
    return enabled;
  }

  function toggleVideoCall() {
    const enabled = callRef.current?.toggleVideo();
    return enabled;
  }

  // ── Notifications ─────────────────────────────────────────

  useEffect(() => {
    if (!conversation || !membre) return;
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    // Listen for push from SW
    const handler = (e) => {
      if (e.data?.type === 'ABAVIE_NOTIFICATION_CLICK') {
        // Focus conversation
        if (e.data.conversationId) {
          // Could route to specific conversation
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, [conversation, membre]);

  // Show desktop notification for new messages when tab hidden
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.sender_id === membre?.id) return;
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Abavie', {
        body: lastMsg.content?.slice(0, 100) || 'Nouveau message',
        icon: '/logo-icon.svg',
        tag: `abavie-msg-${lastMsg.id}`,
      });
    }
  }, [messages, membre]);

  const handleReaction = useCallback(async (messageId, emoji) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const reactions = msg.reactions || {};
    const current = reactions[emoji] || [];
    const hasReacted = current.includes(membre.id);
    const updated = { ...reactions, [emoji]: hasReacted ? current.filter(id => id !== membre.id) : [...current, membre.id] };
    // Remove empty arrays
    Object.keys(updated).forEach(k => { if (updated[k].length === 0) delete updated[k]; });
    await supabase.from('messages').update({ reactions: updated }).eq('id', messageId);
    setShowReactionsFor(null);
  }, [messages, membre]);

  const handleContextAction = useCallback(async (action, msg) => {
    setContextMenu(null);
    switch (action) {
      case 'reply':
        setReplyTo(msg);
        break;
      case 'copy':
        if (msg.content) navigator.clipboard.writeText(msg.content);
        break;
      case 'edit':
        if (msg.sender_id === membre?.id) setEditMessage(msg);
        break;
      case 'pin':
        await supabase.from('messages').update({ pinned: true }).eq('id', msg.id);
        setPinnedMessage(msg);
        break;
      case 'forward':
        setForwardMessage(msg);
        break;
      case 'star':
        await toggleStar(msg);
        break;
      case 'delete':
        if (msg.sender_id === membre?.id) {
          await supabase.from('messages').update({ deleted: true, content: 'Message supprimé' }).eq('id', msg.id);
          // Unindex media from local cache
          if (msg.file_url) unindexMedia({ messageId: msg.id, url: msg.file_url }).catch(() => {});
        }
        break;
      case 'info':
        setShowMsgInfo(msg);
        break;
      case 'timer':
        toggleDisappearingTimer();
        break;
    }
  }, [membre, onOpenExternal]);

  const handleContextMenu = useCallback((e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
  }, []);

  const filteredMessages = showSearch && searchQuery
    ? messages.filter(m => (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Simulated typing indicator
  useEffect(() => {
    if (!conversation) return;
    const interval = setInterval(() => {
      // Randomly show typing from other user (simulated for demo)
      if (Math.random() > 0.85 && otherUser) {
        setTypingUsers([{ name: otherUser.nom || 'Utilisateur', time: Date.now() }]);
        setTimeout(() => setTypingUsers([]), 3000);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [conversation, otherUser]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  if (!conversation) {
    return (
      <main className={`abv-chat${visible ? ' abv-chat--visible' : ''}`}>
        <div className="abv-chat-empty">
          <div className="abv-chat-empty-logo">
            <AbavieLogoSVG size={44} color="var(--accent)" />
          </div>
          <h3>Bienvenue sur Abavie</h3>
          <p>Sélectionnez une conversation ou démarrez-en une nouvelle pour commencer à échanger.</p>
          <div className="abv-features-grid">
            <div className="abv-feature-card"><span className="abv-feature-icon">🔐</span><span>Chiffrement E2E</span></div>
            <div className="abv-feature-card"><span className="abv-feature-icon">📞</span><span>Appels HD</span></div>
            <div className="abv-feature-card"><span className="abv-feature-icon">📁</span><span>Fichiers jusqu'à 5Go</span></div>
            <div className="abv-feature-card"><span className="abv-feature-icon">👥</span><span>Groupes illimités</span></div>
            <div className="abv-feature-card"><span className="abv-feature-icon">🤖</span><span>Bots & API</span></div>
            <div className="abv-feature-card"><span className="abv-feature-icon">☁️</span><span>Sync multi-appareils</span></div>
          </div>
        </div>
      </main>
    );
  }

  const name = otherUser?.nom || otherUser?.email?.split('@')[0] || 'Chargement…';
  const isGroup = conversation.participants?.length > 2;

  // Group messages by day
  const grouped = [];
  let lastDay = null;
  filteredMessages.forEach(m => {
    const day = formatDay(m.created_at);
    if (day !== lastDay) { grouped.push({ type: 'sep', day }); lastDay = day; }
    grouped.push({ type: 'msg', msg: m });
  });

  return (
    <main className={`abv-chat${visible ? ' abv-chat--visible' : ''}`}>
      {/* Header */}
      <div className="abv-chat-header">
        <button className="abv-back-btn" onClick={onBack} aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="abv-avatar abv-avatar--sm">{initials(name)} {isGroup && <span className="abv-avatar-badge">{conversation.participants?.length || 2}</span>}</div>
        <div className="abv-chat-header-info">
          <div className="abv-chat-header-name">
            {name}
            {disappearingTimer[conversation?.id] && (
              <span className="abv-disappearing-badge" title="Messages auto-destruct">
                ⏳ {disappearingTimer[conversation.id] < 60 ? `${disappearingTimer[conversation.id]}s` : `${Math.floor(disappearingTimer[conversation.id]/60)}min`}
              </span>
            )}
          </div>
          <div className="abv-chat-header-status">
            {typingUsers.length > 0
              ? <span className="abv-typing-indicator">en train d'écrire<span className="abv-typing-dots"><span/><span/><span/></span></span>
              : `● En ligne${otherUser?.last_seen ? ' — vu ' + formatTime(otherUser.last_seen) : ''}`
            }
          </div>
        </div>
        <div className="abv-chat-header-actions">
          <button className={`abv-icon-btn${showSearch ? ' abv-icon-btn--active' : ''}`} title="Rechercher" onClick={() => { setShowSearch(v => !v); setSearchQuery(''); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button className="abv-icon-btn" title="Appel vocal" onClick={() => startCall(false)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.09 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.91 10a16 16 0 0 0 6 6l.44-.44a2 2 0 0 1 2.11-.45c.9.36 1.84.6 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button className="abv-icon-btn" title="Appel vidéo" onClick={() => startCall(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
          <button className="abv-icon-btn" title="Réunion" onClick={() => {
            const roomId = `meeting-${conversation.id}-${Date.now()}`;
            setMeetingRoomId(roomId);
            setShowMeetingRoom(true);
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          {isGroup && (
            <button className="abv-icon-btn" title="Infos groupe" onClick={() => setShowGroupInfo(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </button>
          )}
          <button className="abv-icon-btn" title="Envoyer un cadeau" onClick={() => setShowGiftPanel(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 15v7"/><circle cx="12" cy="5" r="3"/><path d="M17 5h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2"/></svg>
          </button>
          <button className="abv-icon-btn" title="Plus" onClick={() => setSelectionMode(v => !v)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="abv-search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Rechercher dans la conversation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          <span className="abv-search-count">{searchQuery ? `${filteredMessages.filter(m => (m.content || '').toLowerCase().includes(searchQuery.toLowerCase())).length} résultat(s)` : ''}</span>
          <button className="abv-icon-btn" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>✕</button>
        </div>
      )}

      {/* Pinned message */}
      {pinnedMessage && !showSearch && (
        <div className="abv-pinned-banner" onClick={() => {
          const el = document.getElementById('msg-' + pinnedMessage.id);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <div className="abv-pinned-content">
            <span className="abv-pinned-label">Message épinglé</span>
            <span className="abv-pinned-text">{pinnedMessage.content || '[Media]'}</span>
          </div>
          <button className="abv-icon-btn" onClick={(e) => { e.stopPropagation(); supabase.from('messages').update({ pinned: false }).eq('id', pinnedMessage.id); setPinnedMessage(null); }}>✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="abv-messages" ref={messagesRef}>
        {grouped.map((item, i) => {
          if (item.type === 'sep') return (
            <div key={'sep-' + i} className="abv-date-sep">
              <span>{item.day}</span>
            </div>
          );
          const m = item.msg;
          const isMine = m.sender_id === membre?.id;
          const isHighlighted = showSearch && searchQuery && (m.content || '').toLowerCase().includes(searchQuery.toLowerCase());
          const replyToMsg = m.reply_to_id ? messages.find(x => x.id === m.reply_to_id) : null;
          const reactions = m.reactions || {};
          const hasReactions = Object.keys(reactions).length > 0;

          return (
            <div
              key={m.id || i}
              id={'msg-' + m.id}
              className={`abv-msg-row${isMine ? ' abv-msg-row--me' : ''}${isHighlighted ? ' abv-msg-row--highlight' : ''}${m.pinned ? ' abv-msg-row--pinned' : ''}${m.deleted ? ' abv-msg-row--deleted' : ''}${m.starred ? ' abv-msg-row--starred' : ''}`}
              onContextMenu={(e) => !m.deleted && handleContextMenu(e, m)}
              onClick={() => {
                if (selectionMode) {
                  const next = new Set(selectedMessages);
                  next.has(m.id) ? next.delete(m.id) : next.add(m.id);
                  setSelectedMessages(next);
                }
              }}
            >
              {!isMine && <div className="abv-avatar abv-avatar--sm">{initials(name)}</div>}
              <div className={`abv-bubble${isMine ? ' abv-bubble--me' : ' abv-bubble--other'}`}>
                {/* Reply indicator */}
                {replyToMsg && (
                  <div className="abv-reply-preview">
                    <div className="abv-reply-bar" />
                    <div className="abv-reply-content">
                      <div className="abv-reply-name">{replyToMsg.sender_id === membre?.id ? 'Vous' : name}</div>
                      <div className="abv-reply-text">{replyToMsg.content || '[Media]'}</div>
                    </div>
                  </div>
                )}

                {m.type === 'image' && (mediaSrc[m.id] || m.file_url) && (
                  <img src={mediaSrc[m.id] || m.file_url} alt="image" className="abv-msg-image" loading="lazy" />
                )}
                {m.type === 'audio' && (mediaSrc[m.id] || m.file_url) && (
                  m.metadata?.isVoice ? (
                    <VoiceMessagePlayer src={mediaSrc[m.id] || m.file_url} duration={m.metadata?.duration || 0} />
                  ) : (
                    <audio controls src={mediaSrc[m.id] || m.file_url} className="abv-msg-audio" />
                  )
                )}
                {m.type === 'video' && (mediaSrc[m.id] || m.file_url) && (
                  <video controls src={mediaSrc[m.id] || m.file_url} className="abv-msg-video" />
                )}
                {m.type === 'document' && m.file_url && (
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="abv-msg-doc">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{m.content || 'Document'}</span>
                  </a>
                )}
                {m.type === 'location' && m.metadata?.lat != null && m.metadata?.lng != null && (
                  <LocationMessage lat={m.metadata.lat} lng={m.metadata.lng} address={m.metadata.address} />
                )}
                {m.type === 'poll' && pollsMap[m.metadata?.pollId] && (
                  <PollMessage
                    poll={pollsMap[m.metadata?.pollId]}
                    conversationId={conversation.id}
                    onVote={(updated) => setPollsMap(prev => ({ ...prev, [updated.id]: updated }))}
                  />
                )}
                {(m.type === 'text' || !m.type || m.type === 'bot') && (
                  <div className="abv-msg-text">
                    {renderMentions(m.content)}{m.edited && <span className="abv-edited-tag"> (modifié)</span>}
                  </div>
                )}

                {/* Reactions bar */}
                {hasReactions && (
                  <div className="abv-reactions-bar">
                    {Object.entries(reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        className={`abv-reaction-chip${users.includes(membre?.id) ? ' abv-reaction-chip--mine' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleReaction(m.id, emoji); }}
                        title={`${users.length} réaction${users.length > 1 ? 's' : ''}`}
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                  </div>
                )}

                <div className="abv-bubble-footer">
                  <div className="abv-bubble-time">
                    {formatTime(m.created_at)}
                    {isMine && (() => {
                      const others = (conversation.participants || []).filter(p => p !== m.sender_id);
                      const readers = (readsMap[m.id] || []).map(r => r.user_id);
                      const allRead = others.length > 0 && others.every(p => readers.includes(p));
                      const someRead = others.some(p => readers.includes(p));
                      return (
                        <span className={`abv-read-status${allRead ? ' abv-read-status--read' : ''}`}>
                          {allRead ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/><polyline points="15 6 9 17 4 12"/></svg>
                          ) : someRead ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/><polyline points="15 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                  {/* Quick reaction on hover */}
                  <div className="abv-quick-reactions">
                    {EMOJI_REACTIONS.slice(0, 4).map(emoji => (
                      <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(m.id, emoji); }}>{emoji}</button>
                    ))}
                    <button onClick={(e) => { e.stopPropagation(); setShowReactionsFor(showReactionsFor === m.id ? null : m.id); }}>+</button>
                  </div>
                </div>

                {/* Full reaction picker */}
                {showReactionsFor === m.id && (
                  <div className="abv-reaction-picker">
                    {EMOJI_REACTIONS.map(emoji => (
                      <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(m.id, emoji); }}>{emoji}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="abv-msg-row">
            <div className="abv-avatar abv-avatar--sm">{initials(name)}</div>
            <div className="abv-bubble abv-bubble--other abv-bubble--typing">
              <span className="abv-typing-dots"><span/><span/><span/></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="abv-reply-bar-outer">
          <div className="abv-reply-bar-inner">
            <div className="abv-reply-bar-line" />
            <div>
              <div className="abv-reply-bar-label">Répondre à {replyTo.sender_id === membre?.id ? 'vous-même' : name}</div>
              <div className="abv-reply-bar-text">{replyTo.content || '[Media]'}</div>
            </div>
          </div>
          <button className="abv-icon-btn" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* Edit preview bar */}
      {editMessage && (
        <div className="abv-reply-bar-outer abv-edit-bar-outer">
          <div className="abv-reply-bar-inner">
            <div className="abv-reply-bar-line" style={{ background: 'var(--accent)' }} />
            <div>
              <div className="abv-reply-bar-label">Modifier le message</div>
              <div className="abv-reply-bar-text">{editMessage.content}</div>
            </div>
          </div>
          <button className="abv-icon-btn" onClick={() => setEditMessage(null)}>✕</button>
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        replyTo={replyTo}
        editMessage={editMessage}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditMessage(null)}
        scheduledSend={scheduledSend}
        disappearingTimer={disappearingTimer[conversation?.id] || null}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div className="abv-context-menu" style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 200) }}>
          {CONTEXT_MENU_ITEMS.filter(item => !item.condition || item.condition({ ...contextMenu.message, _membreId: membre?.id })).map(item => (
            <button
              key={item.id}
              className={`abv-context-item${item.danger ? ' abv-context-item--danger' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleContextAction(item.id, contextMenu.message); }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Message Info Modal */}
      {showMsgInfo && (
        <div className="abv-modal-overlay" onClick={() => setShowMsgInfo(null)}>
          <div className="abv-modal" onClick={e => e.stopPropagation()}>
            <h4>ℹ️ Informations du message</h4>
            <div className="abv-modal-body">
              <p><strong>Envoyé :</strong> {new Date(showMsgInfo.created_at).toLocaleString('fr-FR')}</p>
              <p><strong>Type :</strong> {showMsgInfo.type || 'texte'}</p>
              {showMsgInfo.edited && <p><strong>Modifié :</strong> Oui</p>}
              <p><strong>Lu :</strong> {showMsgInfo.read ? '✅ Oui' : '⏳ Non'}</p>
              {showMsgInfo.file_url && <p><strong>Fichier :</strong> <a href={showMsgInfo.file_url} target="_blank" rel="noopener noreferrer">Voir</a></p>}
            </div>
            <button className="abv-modal-close" onClick={() => setShowMsgInfo(null)}>Fermer</button>
          </div>
        </div>
      )}

      {/* Selection mode bar */}
      {selectionMode && selectedMessages.size > 0 && (
        <div className="abv-selection-bar">
          <span>{selectedMessages.size} message{selectedMessages.size > 1 ? 's' : ''} sélectionné{selectedMessages.size > 1 ? 's' : ''}</span>
          <div>
            <button onClick={() => setSelectedMessages(new Set())}>Annuler</button>
            <button className="abv-btn-danger" onClick={async () => {
              for (const id of selectedMessages) {
                const msg = messages.find(m => m.id === id);
                await supabase.from('messages').update({ deleted: true, content: 'Message supprimé' }).eq('id', id);
                if (msg?.file_url) unindexMedia({ messageId: msg.id, url: msg.file_url }).catch(() => {});
              }
              setSelectedMessages(new Set());
              setSelectionMode(false);
            }}>Supprimer</button>
          </div>
        </div>
      )}

      {/* WebRTC Call Overlay */}
      {callState.active && (
        <div className="abv-call-overlay">
          <div className="abv-call-backdrop" />
          <div className="abv-call-container">
            <div className="abv-call-header">
              <span className="abv-call-status">
                {callState.status === 'calling' ? '📞 Appel en cours…' : callState.status === 'connected' ? '✅ Connecté' : '⚠️ Erreur'}
              </span>
              <button className="abv-icon-btn" onClick={endCall}>✕</button>
            </div>
            <div className="abv-call-videos">
              {callState.type === 'video' && (
                <>
                  <video ref={remoteVideoRef} autoPlay playsInline className="abv-call-video abv-call-video--remote" />
                  <video ref={localVideoRef} autoPlay playsInline muted className="abv-call-video abv-call-video--local" />
                </>
              )}
              {callState.type === 'audio' && (
                <div className="abv-call-audio-visual">
                  <div className="abv-call-avatar-large">{initials(name)}</div>
                  <p>Appel audio avec {name}</p>
                  <audio ref={remoteVideoRef} autoPlay playsInline className="abv-call-audio-element" />
                  <audio ref={localVideoRef} autoPlay playsInline muted className="abv-call-audio-element" />
                </div>
              )}
            </div>
            <div className="abv-call-controls">
              <button className="abv-call-btn" onClick={toggleMuteCall} title="Micro">
                🎤
              </button>
              <button className="abv-call-btn abv-call-btn--end" onClick={endCall} title="Raccrocher">
                📞
              </button>
              {callState.type === 'video' && (
                <button className="abv-call-btn" onClick={toggleVideoCall} title="Caméra">
                  📹
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Incoming call */}
      {incomingCall && (
        <IncomingCall
          callerName={incomingCall.callerName}
          type={incomingCall.type}
          onAccept={() => {
            setIncomingCall(null);
            startCall(incomingCall.type === 'video');
          }}
          onDecline={() => {
            setIncomingCall(null);
            // Mark call message as missed/declined
            supabase.from('messages').update({ metadata: { status: 'declined' } }).eq('conversation_id', conversation.id).eq('type', incomingCall.type === 'video' ? 'video_call' : 'audio_call').eq('metadata->>status', 'ringing');
          }}
        />
      )}

      {/* Forward modal */}
      {forwardMessage && (
        <ForwardModal
          content={forwardMessage.content}
          fileUrl={forwardMessage.file_url}
          onClose={() => setForwardMessage(null)}
          onForward={handleForward}
        />
      )}

      {/* Group Info */}
      {showGroupInfo && (
        <GroupInfo
          conversation={conversation}
          onClose={() => setShowGroupInfo(false)}
        />
      )}

      {/* Meeting Room */}
      {showMeetingRoom && meetingRoomId && (
        <MeetingRoom
          roomId={meetingRoomId}
          isVideo={true}
          onClose={() => {
            setShowMeetingRoom(false);
            setMeetingRoomId(null);
          }}
        />
      )}

      {/* Gift Panel */}
      {showGiftPanel && (
        <GiftPanel
          recipientId={otherUser?.id || conversation?.participants?.find(p => p !== membre?.id)}
          onClose={() => setShowGiftPanel(false)}
        />
      )}
    </main>
  );
}
