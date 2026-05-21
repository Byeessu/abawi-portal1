import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function MeetingRoom({ roomId, isVideo = true, onClose }) {
  const { membre } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [layout, setLayout] = useState('grid'); // 'grid' | 'spotlight'
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [reactions, setReactions] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [activePoll, setActivePoll] = useState(null);
  const localVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pcMap = useRef(new Map());

  useEffect(() => {
    if (!roomId) return;
    const link = `${window.location.origin}/abtalk?meeting=${roomId}`;
    setJoinLink(link);
    startLocalStream();
    joinRoom();
    const interval = setInterval(pingPresence, 5000);
    return () => {
      clearInterval(interval);
      leaveRoom();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  async function startLocalStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { width: 640, height: 480 } : false,
        audio: true,
      });
      setLocalStream(stream);
    } catch (e) {
      console.warn('Media access denied', e);
    }
  }

  async function joinRoom() {
    // Insert presence
    await supabase.from('meeting_participants').upsert({
      room_id: roomId,
      user_id: membre.id,
      user_name: membre.nom || membre.email,
      joined_at: new Date().toISOString(),
      is_muted: false,
      is_video_off: false,
    }, { onConflict: ['room_id', 'user_id'] });

    // Subscribe to room
    const channel = supabase.channel(`meeting-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map(p => p.user);
        setParticipants(users);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setChatMessages(prev => [...prev, payload]);
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        setReactions(prev => [...prev, payload]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== payload.id)), 3000);
      })
      .on('broadcast', { event: 'hand' }, ({ payload }) => {
        if (payload.raised) {
          setRaisedHands(prev => [...prev.filter(h => h.user_id !== payload.user_id), payload]);
        } else {
          setRaisedHands(prev => prev.filter(h => h.user_id !== payload.user_id));
        }
      })
      .on('broadcast', { event: 'poll' }, ({ payload }) => {
        setActivePoll(payload);
      })
      .on('broadcast', { event: 'poll_vote' }, ({ payload }) => {
        setActivePoll(prev => {
          if (!prev || prev.id !== payload.poll_id) return prev;
          const votes = { ...(prev.votes || {}), [payload.option]: (prev.votes?.[payload.option] || 0) + 1 };
          const userVotes = [...(prev.userVotes || []), payload.user_id];
          return { ...prev, votes, userVotes };
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: { id: membre.id, name: membre.nom || membre.email } });
        }
      });

    // Load existing participants
    const { data } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('room_id', roomId)
      .gt('last_seen', new Date(Date.now() - 30000).toISOString());
    if (data) {
      setParticipants(data.map(p => ({ id: p.user_id, name: p.user_name, is_muted: p.is_muted, is_video_off: p.is_video_off })));
    }
  }

  async function pingPresence() {
    await supabase.from('meeting_participants')
      .update({ last_seen: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', membre.id);
  }

  async function leaveRoom() {
    await supabase.from('meeting_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', membre.id);
    localStream?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    pcMap.current.forEach(pc => pc.close());
    pcMap.current.clear();
  }

  function toggleMute() {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  }

  function toggleVideo() {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  }

  async function toggleScreenShare() {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      // Restore camera
      startLocalStream();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startLocalStream();
        };
      } catch (e) {
        console.warn('Screen share cancelled');
      }
    }
  }

  function sendChatMessage() {
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now(),
      user_id: membre.id,
      user_name: membre.nom || membre.email,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
    // Broadcast to room
    supabase.channel(`meeting-${roomId}`).send({
      type: 'broadcast',
      event: 'chat',
      payload: msg,
    });
  }

  function sendReaction(emoji) {
    const r = { id: Date.now(), user_id: membre.id, emoji, user_name: membre.nom || membre.email };
    setReactions(prev => [...prev, r]);
    setTimeout(() => setReactions(prev => prev.filter(x => x.id !== r.id)), 3000);
    supabase.channel(`meeting-${roomId}`).send({ type: 'broadcast', event: 'reaction', payload: r });
  }

  function toggleHand() {
    const raised = !handRaised;
    setHandRaised(raised);
    const h = { user_id: membre.id, user_name: membre.nom || membre.email, raised };
    if (raised) {
      setRaisedHands(prev => [...prev.filter(x => x.user_id !== membre.id), h]);
    } else {
      setRaisedHands(prev => prev.filter(x => x.user_id !== membre.id));
    }
    supabase.channel(`meeting-${roomId}`).send({ type: 'broadcast', event: 'hand', payload: h });
  }

  function createPoll() {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    const poll = {
      id: Date.now(),
      question: pollQuestion.trim(),
      options: pollOptions.filter(o => o.trim()),
      created_by: membre.nom || membre.email,
      votes: {},
      userVotes: [],
    };
    setActivePoll(poll);
    setShowPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    supabase.channel(`meeting-${roomId}`).send({ type: 'broadcast', event: 'poll', payload: poll });
  }

  function votePoll(option) {
    if (!activePoll || activePoll.userVotes?.includes(membre.id)) return;
    const v = { poll_id: activePoll.id, option, user_id: membre.id };
    supabase.channel(`meeting-${roomId}`).send({ type: 'broadcast', event: 'poll_vote', payload: v });
    setActivePoll(prev => {
      if (!prev) return prev;
      const votes = { ...(prev.votes || {}), [option]: (prev.votes?.[option] || 0) + 1 };
      const userVotes = [...(prev.userVotes || []), membre.id];
      return { ...prev, votes, userVotes };
    });
  }

  const activeParticipants = participants.filter(p => p.id !== membre?.id);
  const totalCount = participants.length;

  return (
    <div className="abv-meeting-overlay">
      <div className="abv-meeting-room">
        {/* Video Grid */}
        <div className={`abv-meeting-grid${layout === 'spotlight' ? ' abv-meeting-grid--spotlight' : ''}`}>
          {/* Local video */}
          <div className="abv-meeting-tile abv-meeting-tile--local">
            {isVideoOff || !localStream ? (
              <div className="abv-meeting-avatar">{initials(membre?.nom || membre?.email)}</div>
            ) : (
              <video ref={localVideoRef} autoPlay muted playsInline className="abv-meeting-video" />
            )}
            <div className="abv-meeting-tile-label">
              Vous {isMuted && '🔇'} {handRaised && '🙋'}
            </div>
          </div>

          {/* Floating reactions */}
          {reactions.map(r => (
            <div key={r.id} className="abv-meeting-reaction" style={{ left: `${20 + Math.random() * 60}%`, top: `${20 + Math.random() * 50}%` }}>
              {r.emoji}
            </div>
          ))}

          {/* Remote participants (placeholder - real WebRTC would connect here) */}
          {activeParticipants.map(p => {
            const raised = raisedHands.find(h => h.user_id === p.id);
            return (
              <div key={p.id} className="abv-meeting-tile">
                <div className="abv-meeting-avatar">{initials(p.name)}</div>
                <div className="abv-meeting-tile-label">
                  {p.name} {p.is_muted && '🔇'} {raised && '🙋'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat sidebar */}
        {chatOpen && (
          <div className="abv-meeting-chat">
            <div className="abv-meeting-chat-header">
              <h4>💬 Chat</h4>
              <button className="abv-icon-btn" onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className="abv-meeting-chat-messages">
              {chatMessages.length === 0 ? (
                <div className="abv-meeting-chat-empty">Messages de la réunion...</div>
              ) : (
                chatMessages.map(m => (
                  <div key={m.id} className={`abv-meeting-chat-msg${m.user_id === membre?.id ? ' abv-meeting-chat-msg--me' : ''}`}>
                    <span className="abv-meeting-chat-sender">{m.user_name}</span>
                    <span className="abv-meeting-chat-text">{m.text}</span>
                    <span className="abv-meeting-chat-time">{m.time}</span>
                  </div>
                ))
              )}
            </div>
            <div className="abv-meeting-chat-input-bar">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Message..."
              />
              <button onClick={sendChatMessage}>➤</button>
            </div>
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="abv-meeting-toolbar">
          <div className="abv-meeting-toolbar-left">
            <span className="abv-meeting-info">
              🟢 {totalCount} participant{totalCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="abv-meeting-toolbar-center">
            <button
              className={`abv-meeting-btn${isMuted ? ' abv-meeting-btn--active' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Activer micro' : 'Couper micro'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button
              className={`abv-meeting-btn${isVideoOff ? ' abv-meeting-btn--active' : ''}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'Activer caméra' : 'Couper caméra'}
            >
              {isVideoOff ? '🚫📹' : '📹'}
            </button>
            <button
              className={`abv-meeting-btn${isScreenSharing ? ' abv-meeting-btn--active' : ''}`}
              onClick={toggleScreenShare}
              title="Partage d'écran"
            >
              🖥️
            </button>
            <button
              className={`abv-meeting-btn${chatOpen ? ' abv-meeting-btn--active' : ''}`}
              onClick={() => setChatOpen(!chatOpen)}
              title="Chat"
            >
              💬
            </button>
            <button
              className="abv-meeting-btn"
              onClick={() => setLayout(l => l === 'grid' ? 'spotlight' : 'grid')}
              title="Disposition"
            >
              {layout === 'grid' ? '▦' : '◫'}
            </button>
            <button
              className={`abv-meeting-btn${handRaised ? ' abv-meeting-btn--active' : ''}`}
              onClick={toggleHand}
              title="Lever la main"
            >
              🙋
            </button>
            <div className="abv-meeting-reactions">
              {['👍', '❤️', '🔥', '👏', '😂'].map(e => (
                <button key={e} className="abv-meeting-btn abv-meeting-btn--reaction" onClick={() => sendReaction(e)} title={e}>
                  {e}
                </button>
              ))}
            </div>
            <button
              className={`abv-meeting-btn${showPoll ? ' abv-meeting-btn--active' : ''}`}
              onClick={() => setShowPoll(v => !v)}
              title="Sondage"
            >
              📊
            </button>
          </div>

          <div className="abv-meeting-toolbar-right">
            {raisedHands.length > 0 && (
              <span className="abv-meeting-info" title="Mains levées">
                🙋 {raisedHands.length}
              </span>
            )}
            <button
              className="abv-meeting-btn abv-meeting-btn--invite"
              onClick={() => navigator.clipboard.writeText(joinLink)}
              title="Copier le lien"
            >
              🔗
            </button>
            <button
              className="abv-meeting-btn abv-meeting-btn--danger"
              onClick={onClose}
              title="Quitter"
            >
              📞 Raccrocher
            </button>
          </div>
        </div>

        {/* Poll overlay */}
        {showPoll && (
          <div className="abv-meeting-poll-overlay" onClick={() => setShowPoll(false)}>
            <div className="abv-meeting-poll-panel" onClick={e => e.stopPropagation()}>
              <h4>📊 Nouveau sondage</h4>
              <input
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                placeholder="Question..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: '#2a2a2a', color: '#fff', marginBottom: 10, fontFamily: 'inherit' }}
              />
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={e => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: '#2a2a2a', color: '#fff', marginBottom: 8, fontFamily: 'inherit' }}
                />
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="abv-profile-btn" style={{ flex: 1 }} onClick={() => setPollOptions(prev => [...prev, ''])}>+ Option</button>
                <button className="abv-profile-btn" style={{ flex: 1, opacity: (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) ? 0.5 : 1 }} onClick={createPoll} disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}>Créer</button>
              </div>
            </div>
          </div>
        )}

        {/* Active poll results */}
        {activePoll && !showPoll && (
          <div className="abv-meeting-poll-overlay" onClick={() => setActivePoll(null)}>
            <div className="abv-meeting-poll-panel abv-meeting-poll-panel--results" onClick={e => e.stopPropagation()}>
              <h4>{activePoll.question}</h4>
              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 12 }}>Créé par {activePoll.created_by}</div>
              {activePoll.options.map(opt => {
                const votes = activePoll.votes?.[opt] || 0;
                const total = Object.values(activePoll.votes || {}).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                const hasVoted = activePoll.userVotes?.includes(membre?.id);
                return (
                  <div key={opt} className="abv-meeting-poll-option" onClick={() => !hasVoted && votePoll(opt)}>
                    <div className="abv-meeting-poll-bar" style={{ width: `${pct}%` }} />
                    <span className="abv-meeting-poll-opt-label">{opt}</span>
                    <span className="abv-meeting-poll-opt-count">{votes} ({pct}%)</span>
                  </div>
                );
              })}
              <button className="abv-profile-btn" style={{ marginTop: 12, width: '100%' }} onClick={() => setActivePoll(null)}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
