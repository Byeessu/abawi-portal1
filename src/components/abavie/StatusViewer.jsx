import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { AbTalkLogoSVG } from '../clair/AbTalkLogoSVG';

const DEMO_STATUSES = [
  { id: 'demo-1', user_id: 'demo', user_name: 'AbTalk Officiel', user_initials: 'AO', color: '#18a84a', type: 'text', content: '🎉 AbTalk est disponible ! Découvrez les nouvelles fonctionnalités.', created_at: new Date(Date.now() - 3600000).toISOString(), duration: 5000, seen: false },
  { id: 'demo-2', user_id: 'demo', user_name: 'AbTalk Officiel', user_initials: 'AO', color: '#1e40af', type: 'text', content: '💬 Appels vidéo HD, chiffrement E2E, bots intégrés.', created_at: new Date(Date.now() - 7200000).toISOString(), duration: 5000, seen: false },
  { id: 'demo-3', user_id: 'demo2', user_name: 'Équipe Tech', user_initials: 'ET', color: '#dc2626', type: 'text', content: '🔧 Maintenance terminée. Tous les systèmes sont opérationnels.', created_at: new Date(Date.now() - 10800000).toISOString(), duration: 5000, seen: true },
]

function timeAgoShort(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'maintenant';
  if (diff < 3600) return Math.floor(diff / 60) + ' min';
  if (diff < 86400) return Math.floor(diff / 3600) + ' h';
  return Math.floor(diff / 86400) + ' j';
}

export default function StatusViewer({ onClose, initialUserId = null }) {
  const { membre } = useAuth();
  const [statuses, setStatuses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    loadStatuses();
    // Push history state so back button closes viewer instead of leaving page
    history.pushState({ statusViewer: true }, '');
    const handlePop = (e) => {
      if (e.state?.statusViewer) {
        onClose?.();
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      // If still on our pushed state (manual close), pop it to clean history
      if (history.state?.statusViewer) {
        history.back();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId]);

  async function loadStatuses() {
    setLoading(true);
    // Collect from Supabase + localStorage + merge
    const { data: sb } = await supabase
      .from('statuses')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    const local = JSON.parse(localStorage.getItem('abtalk_statuses') || '[]')
      .filter(s => new Date(s.expires_at) > new Date());

    // Merge: prefer Supabase entries, keep local ones not in Supabase
    const byId = new Map();
    (sb || []).forEach(s => byId.set(s.id, s));
    local.forEach(s => { if (!byId.has(s.id)) byId.set(s.id, s); });

    const merged = Array.from(byId.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (merged.length > 0) {
      const grouped = groupByUser(merged);
      setStatuses(grouped);
      if (initialUserId) {
        const idx = grouped.findIndex(g => g.user_id === initialUserId);
        setCurrentIndex(idx >= 0 ? idx : 0);
      }
    } else {
      const grouped = groupByUser(DEMO_STATUSES);
      setStatuses(grouped);
    }
    setLoading(false);
  }

  function groupByUser(items) {
    const map = {};
    for (const s of items) {
      if (!map[s.user_id]) map[s.user_id] = { ...s, statuses: [] };
      map[s.user_id].statuses.push(s);
    }
    return Object.values(map);
  }

  const currentUser = statuses[currentIndex];
  const currentStatus = currentUser?.statuses?.[0];

  const nextStatus = useCallback(() => {
    setProgress(0);
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      onClose?.();
    }
  }, [currentIndex, statuses.length, onClose]);

  const prevStatus = useCallback(() => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  // Ref always points to the latest nextStatus — avoids stale closure in rAF
  const nextStatusRef = useRef(nextStatus);
  nextStatusRef.current = nextStatus;

  useEffect(() => {
    if (!currentStatus || paused || loading) return;
    const duration = currentStatus.duration || 5000;
    let raf;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        nextStatusRef.current();
      } else {
        raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentIndex, currentStatus, paused, loading]);

  // Mark as seen
  useEffect(() => {
    if (!currentStatus || !membre) return;
    if (!currentStatus.seen && currentStatus.id && !currentStatus.id.startsWith('demo') && !currentStatus.id.startsWith('local')) {
      supabase.from('status_views').insert({
        status_id: currentStatus.id,
        user_id: membre.id,
        viewed_at: new Date().toISOString(),
      }).then(() => {}).catch?.(() => {});
    }
  }, [currentStatus, membre]);

  // Touch handlers for swipe
  function handleTouchStart(e) {
    setTouchStart(e.touches[0].clientX);
    setPaused(true);
  }
  function handleTouchMove(e) {
    if (touchStart === null) return;
    const diff = touchStart - e.touches[0].clientX;
    if (Math.abs(diff) > 50) {
      setPaused(true);
    }
  }
  function handleTouchEnd(e) {
    if (touchStart === null) { setPaused(false); return; }
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) nextStatus();
    else if (diff < -50) prevStatus();
    setTouchStart(null);
    setPaused(false);
  }

  if (loading) {
    return (
      <div className="abv-status-overlay" onClick={onClose}>
        <div className="abv-status-loading">Chargement...</div>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="abv-status-overlay" onClick={onClose}>
        <div className="abv-status-empty">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <p>Aucun statut disponible</p>
          <button className="abv-modal-close" onClick={onClose} style={{ marginTop: 20 }}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="abv-status-overlay"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      {/* Progress bars */}
      <div className="abv-status-progress-container">
        {statuses.map((_, i) => (
          <div key={i} className="abv-status-progress-track">
            <div
              className="abv-status-progress-fill"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="abv-status-header">
        <button className="abv-status-back" onClick={onClose}>←</button>
        {currentUser && (
          <div className="abv-status-user">
            <div className="abv-status-avatar" style={{ background: '#18A84A', overflow: 'hidden' }}>
              <AbTalkLogoSVG size={36} />
            </div>
            <div className="abv-status-info">
              <span className="abv-status-name">{currentUser.user_name}</span>
              <span className="abv-status-time">{timeAgoShort(currentStatus?.created_at)}</span>
            </div>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button className="abv-status-more" onClick={() => setPaused(!paused)}>{paused ? '▶' : '❚❚'}</button>
        <button className="abv-status-close" onClick={onClose}>✕</button>
      </div>

      {/* Content area */}
      <div className="abv-status-content">
        <div className="abv-status-left" onClick={prevStatus} />
        <div className="abv-status-center" onClick={() => setPaused(!paused)}>
          {currentStatus?.type === 'text' && (
            <div
              className="abv-status-text-card"
              style={{ background: currentStatus.color || '#18a84a' }}
            >
              <p>{currentStatus.content}</p>
            </div>
          )}
          {currentStatus?.type === 'image' && (
            <img src={currentStatus.media_url} alt="status" className="abv-status-media" />
          )}
          {currentStatus?.type === 'video' && (
            <video src={currentStatus.media_url} autoPlay muted className="abv-status-media" />
          )}
        </div>
        <div className="abv-status-right" onClick={nextStatus} />
      </div>

      {/* Reply bar */}
      <div className="abv-status-reply-bar">
        <input
          type="text"
          placeholder={`Répondre à ${currentUser?.user_name || ''}...`}
          className="abv-status-reply-input"
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              // In real app: send reply as message
              e.target.value = '';
              setPaused(false);
            }
          }}
        />
        <button className="abv-status-reply-btn">➤</button>
      </div>
    </div>
  );
}
