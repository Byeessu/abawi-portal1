import { useState } from 'react';

export default function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  if (!text) return null;
  return (
    <span className="cv-tooltip-wrap" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="cv-tooltip-btn"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 14, padding: '0 4px' }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label="Aide"
      >?</button>
      {visible && (
        <span style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card, #222)', color: 'var(--text, #fff)',
          border: '1px solid var(--border, #444)', borderRadius: 8,
          padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap', zIndex: 999,
          pointerEvents: 'none',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}
