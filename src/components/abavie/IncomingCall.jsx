import { useState, useEffect } from 'react';

export default function IncomingCall({ callerName, callerInitials, type = 'audio', onAccept, onDecline }) {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="abv-incoming-call-overlay">
      <div className="abv-incoming-call-backdrop" />
      <div className="abv-incoming-call-content">
        <div className="abv-incoming-call-avatar">
          <img src="/logo-icon.svg" alt="AbTalk" width="64" height="64" style={{ display: 'block', filter: 'drop-shadow(0 0 8px rgba(76,175,80,0.4))' }} />
        </div>
        <h3 className="abv-incoming-call-name">{callerName || 'Appel entrant'}</h3>
        <p className="abv-incoming-call-type">
          {type === 'video' ? '📹 Appel vidéo' : '📞 Appel vocal'}{dots}
        </p>
        <div className="abv-incoming-call-actions">
          <button className="abv-incoming-call-decline" onClick={onDecline} title="Refuser">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <button className="abv-incoming-call-accept" onClick={onAccept} title="Répondre">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.09 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.91 10a16 16 0 0 0 6 6l.44-.44a2 2 0 0 1 2.11-.45c.9.36 1.84.6 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
