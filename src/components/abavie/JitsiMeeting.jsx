import { useEffect, useRef, useState } from 'react';

export default function JitsiMeeting({ roomId, displayName, onClose }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomId)}` +
    `#config.prejoinPageEnabled=false` +
    `&config.startWithAudioMuted=true` +
    `&config.startWithVideoMuted=false` +
    `&config.disableDeepLinking=true` +
    `&userInfo.displayName="${encodeURIComponent(displayName || 'Invité')}"` +
    `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
    `&interfaceConfig.SHOW_BRAND_WATERMARK=false` +
    `&interfaceConfig.DEFAULT_BACKGROUND="#1a1a1a"` +
    `&interfaceConfig.TOOLBAR_BUTTONS="microphone,camera,closedcaptions,desktop,fullscreen,fodeviceselection,hangup,profile,chat,recording,livestreaming,etherpad,sharedvideo,settings,raisehand,videoquality,filmstrip,invite,feedback,stats,shortcuts,tileview,select-background,download"`;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: '#111', display: 'flex', flexDirection: 'column' }}>
      {/* Header overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', pointerEvents: 'none' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
          🎥 Visioconférence · {roomId}
        </div>
        <button
          onClick={onClose}
          style={{ pointerEvents: 'auto', padding: '8px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📞 Quitter la réunion
        </button>
      </div>

      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: '#111', color: '#fff' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Connexion à la salle {roomId}…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 3, background: '#111', color: '#fff', padding: 24 }}>
          <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={jitsiUrl}
        allow="camera; microphone; fullscreen; display-capture"
        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError('Impossible de charger Jitsi Meet.'); }}
      />
    </div>
  );
}
