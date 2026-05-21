import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const MEETING_MODES = [
  { id: 'meeting', label: 'Réunion', emoji: '🤝', desc: 'Discussion collaborative avec chat et partage d\'écran.', color: '#0EA5E9' },
  { id: 'interview', label: 'Entretien', emoji: '🎤', desc: 'Mode structuré : notes, timer, évaluation candidat.', color: '#8B5CF6' },
  { id: 'conference', label: 'Conférence', emoji: '🏢', desc: 'Présentation principale + Q&A, levée de main, sondages.', color: '#F59E0B' },
  { id: 'webinar', label: 'Webinaire', emoji: '📡', desc: 'Diffusion en direct, chat modéré, enregistrement.', color: '#EC4899' },
  { id: 'training', label: 'Formation', emoji: '🎓', desc: 'Mode apprentissage : quiz, partage documents, breakout rooms.', color: '#10B981' },
  { id: 'podcast', label: 'Podcast', emoji: '🎙️', desc: 'Audio haute qualité, transcription auto, export.', color: '#6366F1' },
];

export default function GoMeetPanel({ onStartMeeting }) {
  const { membre } = useAuth();
  const [meetings, setMeetings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abtalk_meetings') || '[]'); } catch { return []; }
  });
  const [view, setView] = useState('list'); // 'list' | 'schedule' | 'room'
  const [activeRoom, setActiveRoom] = useState(null);

  // Schedule form
  const [mode, setMode] = useState('meeting');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('30');
  const [participants, setParticipants] = useState('');
  const [description, setDescription] = useState('');
  const [record, setRecord] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    localStorage.setItem('abtalk_meetings', JSON.stringify(meetings));
  }, [meetings]);

  function scheduleMeeting() {
    if (!subject.trim() || !date) return;
    const m = {
      id: 'meet-' + Date.now(),
      mode,
      subject: subject.trim(),
      date,
      duration: Number(duration),
      participants: participants.split(',').map(p => p.trim()).filter(Boolean),
      description: description.trim(),
      record,
      waitingRoom,
      password: password.trim(),
      roomId: `abtalk-${mode}-${Date.now()}`,
      createdBy: membre?.id,
      createdAt: new Date().toISOString(),
      status: 'scheduled',
    };
    setMeetings(prev => [...prev, m].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setSubject(''); setDate(''); setDuration('30'); setParticipants(''); setDescription(''); setRecord(false); setWaitingRoom(true); setPassword('');
    setView('list');
  }

  function deleteMeeting(id) {
    setMeetings(prev => prev.filter(m => m.id !== id));
  }

  function startNow(selectedMode) {
    const roomId = `abtalk-${selectedMode}-${Date.now()}`;
    const m = {
      id: 'meet-' + Date.now(),
      mode: selectedMode,
      subject: 'Réunion instantanée',
      date: new Date().toISOString(),
      duration: 60,
      participants: [],
      description: '',
      record: false,
      waitingRoom: false,
      password: '',
      roomId,
      createdBy: membre?.id,
      createdAt: new Date().toISOString(),
      status: 'live',
    };
    setMeetings(prev => [...prev, m]);
    launchMeeting(m);
  }

  function launchMeeting(m) {
    setActiveRoom(m);
    setView('room');
    onStartMeeting?.(m);
    // Update status
    setMeetings(prev => prev.map(x => x.id === m.id ? { ...x, status: 'live' } : x));
  }

  function endMeeting(m) {
    setMeetings(prev => prev.map(x => x.id === m.id ? { ...x, status: 'ended' } : x));
    setActiveRoom(null);
    setView('list');
  }

  function shareMeeting(m) {
    const link = `${window.location.origin}/abtalk?meeting=${m.roomId}`;
    const text = `📅 *${m.subject}* (${MEETING_MODES.find(x => x.id === m.mode)?.label || m.mode})\n🗓️ ${new Date(m.date).toLocaleString('fr-FR')}\n🔗 ${link}${m.password ? '\n🔑 Mot de passe: ' + m.password : ''}`;
    window.dispatchEvent(new CustomEvent('abtalk-insert-template', { detail: text }));
  }

  const now = new Date();
  const upcoming = meetings.filter(m => m.status === 'scheduled' && new Date(m.date) > now);
  const live = meetings.filter(m => m.status === 'live');
  const past = meetings.filter(m => m.status === 'ended' || (m.status === 'scheduled' && new Date(m.date) <= now));

  // ── Live Room View ──
  if (view === 'room' && activeRoom) {
    const modeInfo = MEETING_MODES.find(m => m.id === activeRoom.mode);
    return (
      <div className="abv-gomeet-room">
        <div className="abv-gomeet-room-header" style={{ borderLeftColor: modeInfo?.color }}>
          <div>
            <span className="abv-gomeet-live-badge">🔴 EN DIRECT</span>
            <h4>{activeRoom.subject}</h4>
            <p>{modeInfo?.emoji} {modeInfo?.label} · ID: {activeRoom.roomId.slice(-8)}</p>
          </div>
          <button className="abv-gomeet-end-btn" onClick={() => endMeeting(activeRoom)}>📞 Quitter</button>
        </div>

        <div className="abv-gomeet-room-body">
          {/* Simulated video area */}
          <div className="abv-gomeet-video-grid">
            <div className="abv-gomeet-video-tile abv-gomeet-video-tile--local">
              <div className="abv-gomeet-avatar">👤</div>
              <span>Vous (Organisateur)</span>
            </div>
            <div className="abv-gomeet-video-tile abv-gomeet-video-tile--waiting">
              <span>⏳ Salle d'attente</span>
              <p>Les participants arrivent…</p>
            </div>
          </div>

          {/* Meeting tools based on mode */}
          <div className="abv-gomeet-tools">
            {activeRoom.mode === 'interview' && (
              <div className="abv-gomeet-tool-panel">
                <div className="abv-biz-label">📝 Notes d'entretien</div>
                <textarea className="abv-gomeet-notes" placeholder="Compétences, impressions, score…" rows={4} />
                <div className="abv-gomeet-score">
                  <span>Note :</span>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} className="abv-gomeet-star">⭐</button>
                  ))}
                </div>
              </div>
            )}
            {activeRoom.mode === 'conference' && (
              <div className="abv-gomeet-tool-panel">
                <div className="abv-biz-label">❓ Q&A / Levée de main</div>
                <div className="abv-gomeet-qa-list">
                  <div className="abv-gomeet-qa-item">🙋 Aucune question pour l'instant</div>
                </div>
                <button className="abv-catalog-btn abv-catalog-btn--primary">📊 Lancer un sondage</button>
              </div>
            )}
            {activeRoom.mode === 'training' && (
              <div className="abv-gomeet-tool-panel">
                <div className="abv-biz-label">🎓 Outils formation</div>
                <div className="abv-gomeet-training-tools">
                  <button className="abv-catalog-btn">📤 Partager document</button>
                  <button className="abv-catalog-btn">📝 Quiz rapide</button>
                  <button className="abv-catalog-btn">👥 Breakout rooms</button>
                </div>
              </div>
            )}
            {activeRoom.mode === 'webinar' && (
              <div className="abv-gomeet-tool-panel">
                <div className="abv-biz-label">📡 Webinaire</div>
                <div className="abv-gomeet-webinar-stats">
                  <span>👥 0 spectateurs</span>
                  <span>💬 0 messages</span>
                  {activeRoom.record && <span>🔴 Enregistrement actif</span>}
                </div>
              </div>
            )}
            {activeRoom.mode === 'podcast' && (
              <div className="abv-gomeet-tool-panel">
                <div className="abv-biz-label">🎙️ Podcast</div>
                <div className="abv-gomeet-podcast-controls">
                  <span>⏱️ 00:00:00</span>
                  <button className="abv-catalog-btn abv-catalog-btn--primary">⏸️ Pause</button>
                  <button className="abv-catalog-btn">📝 Transcription</button>
                  <button className="abv-catalog-btn">💾 Export MP3</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="abv-gomeet-toolbar">
          <button className="abv-gomeet-tool-btn" title="Micro">🎤</button>
          <button className="abv-gomeet-tool-btn" title="Caméra">📹</button>
          <button className="abv-gomeet-tool-btn" title="Partage écran">🖥️</button>
          <button className="abv-gomeet-tool-btn" title="Chat">💬</button>
          <button className="abv-gomeet-tool-btn" title="Participants">👥</button>
          <button className="abv-gomeet-tool-btn abv-gomeet-tool-btn--reaction" title="Réactions">👍</button>
          <button className="abv-gomeet-tool-btn abv-gomeet-tool-btn--reaction" title="Réactions">❤️</button>
          <button className="abv-gomeet-tool-btn abv-gomeet-tool-btn--reaction" title="Réactions">🔥</button>
          <button className="abv-gomeet-tool-btn" title="Copier lien" onClick={() => { const link = `${window.location.origin}/abtalk?meeting=${activeRoom.roomId}`; navigator.clipboard.writeText(link); }}>🔗</button>
        </div>
      </div>
    );
  }

  // ── Schedule View ──
  if (view === 'schedule') {
    const modeInfo = MEETING_MODES.find(m => m.id === mode);
    return (
      <div className="abv-gomeet-schedule">
        <div className="abv-catalog-detail-header">
          <button className="abv-biz-back" onClick={() => setView('list')}>← Retour</button>
        </div>
        <div className="abv-biz-label">Planifier une réunion</div>

        <div className="abv-gomeet-mode-selector">
          {MEETING_MODES.map(m => (
            <button key={m.id} className={`abv-gomeet-mode-card${mode === m.id ? ' is-active' : ''}`} onClick={() => setMode(m.id)} style={{ '--mode-color': m.color }}>
              <span className="abv-gomeet-mode-emoji">{m.emoji}</span>
              <span className="abv-gomeet-mode-name">{m.label}</span>
              <span className="abv-gomeet-mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>

        <div className="abv-gomeet-form">
          <label>Sujet <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Réunion hebdomadaire équipe…" /></label>
          <div className="abv-gomeet-form-row">
            <label>Date & Heure <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label>Durée (min)
              <select value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1h</option>
                <option value="90">1h30</option>
                <option value="120">2h</option>
                <option value="180">3h</option>
              </select>
            </label>
          </div>
          <label>Participants (emails séparés par virgule)
            <input value={participants} onChange={e => setParticipants(e.target.value)} placeholder="jean@email.com, marie@email.com…" />
          </label>
          <label>Description <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ordre du jour, liens utiles…" rows={3} /></label>
          <div className="abv-gomeet-form-toggles">
            <label className="abv-gomeet-toggle">
              <input type="checkbox" checked={record} onChange={e => setRecord(e.target.checked)} />
              <span>🔴 Enregistrer la réunion</span>
            </label>
            <label className="abv-gomeet-toggle">
              <input type="checkbox" checked={waitingRoom} onChange={e => setWaitingRoom(e.target.checked)} />
              <span>🚪 Salle d'attente</span>
            </label>
          </div>
          <label>Mot de passe (optionnel) <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Laisser vide = ouvert" /></label>
          <button className="abv-catalog-btn abv-catalog-btn--primary" onClick={scheduleMeeting} disabled={!subject.trim() || !date}>
            📅 Planifier
          </button>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="abv-gomeet">
      {/* Quick start modes */}
      <div className="abv-biz-section">
        <div className="abv-biz-label">Démarrer maintenant</div>
        <div className="abv-gomeet-quick">
          {MEETING_MODES.map(m => (
            <button key={m.id} className="abv-gomeet-quick-btn" onClick={() => startNow(m.id)} style={{ '--mode-color': m.color }}>
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule button */}
      <div className="abv-biz-section" style={{ display: 'flex', gap: 8 }}>
        <button className="abv-catalog-btn abv-catalog-btn--primary" style={{ flex: 1 }} onClick={() => setView('schedule')}>
          📅 Planifier une réunion
        </button>
      </div>

      {/* Live meetings */}
      {live.length > 0 && (
        <div className="abv-biz-section">
          <div className="abv-biz-label">🔴 En direct</div>
          {live.map(m => {
            const mi = MEETING_MODES.find(x => x.id === m.mode);
            return (
              <div key={m.id} className="abv-gomeet-card abv-gomeet-card--live">
                <div className="abv-gomeet-card-badge" style={{ background: mi?.color }}>{mi?.emoji} {mi?.label}</div>
                <div className="abv-gomeet-card-title">{m.subject}</div>
                <div className="abv-gomeet-card-meta">ID: {m.roomId.slice(-8)}</div>
                <div className="abv-gomeet-card-actions">
                  <button className="abv-catalog-btn abv-catalog-btn--primary" onClick={() => launchMeeting(m)}>Rejoindre</button>
                  <button className="abv-catalog-btn" onClick={() => shareMeeting(m)}>📤 Partager</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming meetings */}
      {upcoming.length > 0 && (
        <div className="abv-biz-section">
          <div className="abv-biz-label">📅 À venir ({upcoming.length})</div>
          {upcoming.map(m => {
            const mi = MEETING_MODES.find(x => x.id === m.mode);
            const d = new Date(m.date);
            const isSoon = (d - now) < 15 * 60 * 1000; // < 15 min
            return (
              <div key={m.id} className={`abv-gomeet-card${isSoon ? ' abv-gomeet-card--soon' : ''}`}>
                <div className="abv-gomeet-card-header">
                  <span className="abv-gomeet-card-mode">{mi?.emoji} {mi?.label}</span>
                  <span className="abv-gomeet-card-time">{d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="abv-gomeet-card-title">{m.subject}</div>
                {m.description && <div className="abv-gomeet-card-desc">{m.description}</div>}
                <div className="abv-gomeet-card-meta">
                  {m.duration} min · {m.participants.length} participant{m.participants.length > 1 ? 's' : ''}
                  {m.record && ' · 🔴 Enreg.'}{m.waitingRoom && ' · 🚪 Attente'}{m.password && ' · 🔑'}
                </div>
                <div className="abv-gomeet-card-actions">
                  {isSoon && <button className="abv-catalog-btn abv-catalog-btn--primary" onClick={() => launchMeeting(m)}>Rejoindre</button>}
                  <button className="abv-catalog-btn" onClick={() => shareMeeting(m)}>📤 Partager</button>
                  <button className="abv-catalog-btn abv-catalog-btn--danger" onClick={() => deleteMeeting(m.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past meetings */}
      {past.length > 0 && (
        <div className="abv-biz-section">
          <div className="abv-biz-label">🕐 Historique</div>
          {past.slice(0, 5).map(m => {
            const mi = MEETING_MODES.find(x => x.id === m.mode);
            return (
              <div key={m.id} className="abv-gomeet-card abv-gomeet-card--past">
                <div className="abv-gomeet-card-header">
                  <span className="abv-gomeet-card-mode">{mi?.emoji} {mi?.label}</span>
                  <span className="abv-gomeet-card-time">{new Date(m.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div className="abv-gomeet-card-title">{m.subject}</div>
                <div className="abv-gomeet-card-meta">{m.status === 'ended' ? '✅ Terminée' : '❌ Manquée'}</div>
              </div>
            );
          })}
        </div>
      )}

      {upcoming.length === 0 && live.length === 0 && past.length === 0 && (
        <div className="abv-catalog-empty">
          Aucune réunion planifiée. Cliquez sur "Planifier" ou démarrez instantanément.
        </div>
      )}
    </div>
  );
}
