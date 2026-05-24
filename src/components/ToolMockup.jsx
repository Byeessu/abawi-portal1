/* ToolMockup — small circular illustration per tool, theme-aware */

// Circle wrapper — uses CSS vars so it adapts to light/dark theme
const C = ({ accent = '#6366F1', children }) => (
  <div style={{
    width: 76, height: 76, borderRadius: '50%',
    background: `color-mix(in srgb, ${accent} 13%, var(--bg-card-hover, #131A23))`,
    border: `1.5px solid color-mix(in srgb, ${accent} 30%, var(--border, #1A2332))`,
    boxShadow: `0 0 0 4px color-mix(in srgb, ${accent} 6%, var(--bg-card, #0D1117))`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '14px auto 6px',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
  }}>
    {children}
  </div>
)

// Thin bar — uses accent or border var
const B = ({ pct, color, delay = 0 }) => (
  <div style={{ flex: 1, height: `${pct}%`, borderRadius: '2px 2px 0 0', background: color, alignSelf: 'flex-end' }} />
)

export default function ToolMockup({ type, accent = '#6366F1' }) {
  switch (type) {

    case 'cv': return (
      <C accent={accent}>
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <rect x="6" y="4" width="26" height="30" rx="3" fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <circle cx="16" cy="13" r="4" fill={`${accent}66`}/>
          <rect x="10" y="20" width="18" height="2.5" rx="1.2" fill={`${accent}44`}/>
          <rect x="10" y="24.5" width="14" height="2" rx="1" fill={`${accent}33`}/>
          <rect x="10" y="28.5" width="16" height="2" rx="1" fill={`${accent}33`}/>
        </svg>
      </C>
    )

    case 'score': return (
      <C accent={accent}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="17" stroke={`${accent}22`} strokeWidth="4"/>
          <circle cx="22" cy="22" r="17" stroke={accent} strokeWidth="4"
            strokeDasharray={`${0.78 * 106.8} 106.8`} strokeDashoffset="26.7"
            strokeLinecap="round" transform="rotate(-90 22 22)"/>
          <text x="22" y="26" textAnchor="middle" fill={accent} fontSize="11" fontWeight="800">82</text>
        </svg>
      </C>
    )

    case 'chart': return (
      <C accent={accent}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 38, padding: '0 4px' }}>
          {[55, 75, 45, 85, 60].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', background: i % 2 === 0 ? `${accent}88` : accent }} />
          ))}
        </div>
      </C>
    )

    case 'linechart': return (
      <C accent={accent}>
        <svg width="42" height="36" viewBox="0 0 42 36" fill="none">
          <defs>
            <linearGradient id={`lc${accent.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35"/>
              <stop offset="100%" stopColor={accent} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M2 28 L8 22 L15 24 L22 14 L29 16 L36 6 L40 8 L40 34 L2 34 Z" fill={`url(#lc${accent.replace('#','')})`}/>
          <path d="M2 28 L8 22 L15 24 L22 14 L29 16 L36 6 L40 8" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </C>
    )

    case 'swot': return (
      <C accent={accent}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: 44, height: 44 }}>
          {[['#10B981','S'],['#EF4444','W'],['#3B82F6','O'],['#F59E0B','T']].map(([c, l]) => (
            <div key={l} style={{ background: `${c}22`, border: `1px solid ${c}44`, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: c }}>{l}</span>
            </div>
          ))}
        </div>
      </C>
    )

    case 'table': return (
      <C accent={accent}>
        <svg width="42" height="36" viewBox="0 0 42 36" fill="none">
          <rect x="2" y="2" width="38" height="8" rx="2" fill={`${accent}33`}/>
          {[12,20,28].map(y => (
            <rect key={y} x="2" y={y} width="38" height="6" rx="1.5" fill={`${accent}11`} stroke={`${accent}22`} strokeWidth="0.8"/>
          ))}
          {[14,28].map(x => (
            <line key={x} x1={x} y1="2" x2={x} y2="34" stroke={`${accent}22`} strokeWidth="0.8"/>
          ))}
        </svg>
      </C>
    )

    case 'doc': return (
      <C accent={accent}>
        <svg width="36" height="40" viewBox="0 0 36 40" fill="none">
          <path d="M4 4 H24 L32 12 V36 A2 2 0 0 1 30 38 H6 A2 2 0 0 1 4 36 V6 A2 2 0 0 1 4 4Z" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <path d="M24 4 V12 H32" fill="none" stroke={`${accent}44`} strokeWidth="1.5"/>
          <rect x="9" y="17" width="18" height="2.5" rx="1.2" fill={`${accent}55`}/>
          <rect x="9" y="22" width="14" height="2" rx="1" fill={`${accent}33`}/>
          <rect x="9" y="27" width="16" height="2" rx="1" fill={`${accent}33`}/>
        </svg>
      </C>
    )

    case 'slides': return (
      <C accent={accent}>
        <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
          <rect x="2" y="4" width="30" height="28" rx="3" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <rect x="6" y="8" width="18" height="3" rx="1.5" fill={`${accent}66`}/>
          <rect x="6" y="14" width="22" height="2" rx="1" fill={`${accent}33`}/>
          <rect x="6" y="18" width="18" height="2" rx="1" fill={`${accent}25`}/>
          <rect x="6" y="22" width="20" height="2" rx="1" fill={`${accent}25`}/>
          <rect x="34" y="4" width="8" height="8" rx="1.5" fill={`${accent}33`} stroke={`${accent}55`} strokeWidth="1"/>
          <rect x="34" y="14" width="8" height="8" rx="1.5" fill={`${accent}15`} stroke={`${accent}25`} strokeWidth="1"/>
          <rect x="34" y="24" width="8" height="8" rx="1.5" fill={`${accent}15`} stroke={`${accent}25`} strokeWidth="1"/>
        </svg>
      </C>
    )

    case 'chat': return (
      <C accent={accent}>
        <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
          <rect x="2" y="2" width="28" height="18" rx="9" fill={`${accent}33`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <rect x="6" y="8" width="14" height="2.5" rx="1.2" fill={`${accent}88`}/>
          <rect x="6" y="13" width="10" height="2" rx="1" fill={`${accent}55`}/>
          <rect x="14" y="22" width="28" height="16" rx="8" fill={`${accent}18`} stroke={`${accent}33`} strokeWidth="1.5"/>
          <rect x="18" y="27" width="12" height="2.5" rx="1.2" fill={`${accent}44`}/>
          <rect x="18" y="32" width="8" height="2" rx="1" fill={`${accent}33`}/>
        </svg>
      </C>
    )

    case 'waveform': return (
      <C accent={accent}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 42, padding: '0 2px' }}>
          {[20,35,55,70,85,100,90,75,60,80,95,70,50,35,20].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: i < 8 ? accent : `${accent}44` }} />
          ))}
        </div>
      </C>
    )

    case 'map': return (
      <C accent={accent}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="4" y="4" width="36" height="36" rx="4" fill={`${accent}10`} stroke={`${accent}22`} strokeWidth="1"/>
          {[[12,18],[22,12],[32,20],[18,28],[28,30],[22,36]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 2 ? 4 : 3} fill={i === 2 ? '#EF4444' : accent} opacity={i === 2 ? 0.9 : 0.7}/>
          ))}
        </svg>
      </C>
    )

    case 'photo-id': return (
      <C accent={accent}>
        <svg width="42" height="44" viewBox="0 0 42 44" fill="none">
          <rect x="4" y="4" width="34" height="36" rx="3" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <circle cx="21" cy="16" r="7" fill={`${accent}44`}/>
          <path d="M8 38 Q14 28 21 28 Q28 28 34 38" fill={`${accent}33`}/>
          <line x1="21" y1="4" x2="21" y2="40" stroke={`${accent}33`} strokeWidth="0.8" strokeDasharray="2 2"/>
          <line x1="4" y1="22" x2="38" y2="22" stroke={`${accent}33`} strokeWidth="0.8" strokeDasharray="2 2"/>
        </svg>
      </C>
    )

    case 'photo-editor': return (
      <C accent={accent}>
        <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
          <rect x="2" y="4" width="30" height="32" rx="3" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <circle cx="10" cy="12" r="4" fill={`${accent}33`}/>
          <path d="M2 28 L10 20 L16 24 L22 16 L32 28Z" fill={`${accent}33`}/>
          <rect x="35" y="4" width="8" height="6" rx="1.5" fill={`${accent}44`}/>
          <rect x="35" y="12" width="8" height="6" rx="1.5" fill={`${accent}33`}/>
          <rect x="35" y="20" width="8" height="6" rx="1.5" fill={`${accent}22`}/>
          <rect x="35" y="28" width="8" height="6" rx="1.5" fill={`${accent}22`}/>
        </svg>
      </C>
    )

    case 'invoice': return (
      <C accent={accent}>
        <svg width="38" height="44" viewBox="0 0 38 44" fill="none">
          <rect x="4" y="2" width="30" height="40" rx="3" fill={`${accent}15`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <rect x="8" y="8" width="12" height="3" rx="1.5" fill={`${accent}66`}/>
          <line x1="8" y1="15" x2="30" y2="15" stroke={`${accent}33`} strokeWidth="1"/>
          {[20,25,30].map(y => (
            <g key={y}>
              <rect x="8" y={y} width="14" height="2.5" rx="1" fill={`${accent}22`}/>
              <rect x="24" y={y} width="6" height="2.5" rx="1" fill={`${accent}44`}/>
            </g>
          ))}
          <line x1="8" y1="36" x2="30" y2="36" stroke={`${accent}44`} strokeWidth="1"/>
          <rect x="20" y="38" width="10" height="3" rx="1.5" fill={`${accent}66`}/>
        </svg>
      </C>
    )

    case 'card': return (
      <C accent={accent}>
        <svg width="48" height="34" viewBox="0 0 48 34" fill="none">
          <rect x="2" y="4" width="44" height="26" rx="4" fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <rect x="2" y="10" width="44" height="7" fill={`${accent}18`}/>
          <rect x="8" y="21" width="10" height="5" rx="1.5" fill={`${accent}55`}/>
          <circle cx="34" cy="24" r="5" fill={`${accent}33`}/>
          <circle cx="39" cy="24" r="5" fill={`${accent}55`}/>
        </svg>
      </C>
    )

    case 'qr': return (
      <C accent={accent}>
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <rect x="2" y="2" width="17" height="17" rx="2" fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <rect x="5" y="5" width="11" height="11" rx="1" fill={`${accent}44`}/>
          <rect x="23" y="2" width="17" height="17" rx="2" fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <rect x="26" y="5" width="11" height="11" rx="1" fill={`${accent}44`}/>
          <rect x="2" y="23" width="17" height="17" rx="2" fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <rect x="5" y="26" width="11" height="11" rx="1" fill={`${accent}44`}/>
          <rect x="25" y="25" width="5" height="5" rx="1" fill={`${accent}55`}/>
          <rect x="33" y="25" width="5" height="5" rx="1" fill={`${accent}55`}/>
          <rect x="25" y="33" width="5" height="5" rx="1" fill={`${accent}55`}/>
          <rect x="33" y="33" width="5" height="5" rx="1" fill={`${accent}55`}/>
        </svg>
      </C>
    )

    case 'dict': return (
      <C accent={accent}>
        <svg width="42" height="40" viewBox="0 0 42 40" fill="none">
          <rect x="4" y="4" width="28" height="32" rx="3" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <line x1="4" y1="12" x2="32" y2="12" stroke={`${accent}33`} strokeWidth="1"/>
          <rect x="8" y="15" width="16" height="3" rx="1.5" fill={`${accent}66`}/>
          <rect x="8" y="21" width="20" height="2" rx="1" fill={`${accent}33`}/>
          <rect x="8" y="25" width="16" height="2" rx="1" fill={`${accent}25`}/>
          <rect x="8" y="29" width="18" height="2" rx="1" fill={`${accent}25`}/>
          <circle cx="34" cy="30" r="7" fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <line x1="39" y1="35" x2="42" y2="38" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </C>
    )

    case 'translate': return (
      <C accent={accent}>
        <svg width="46" height="36" viewBox="0 0 46 36" fill="none">
          <rect x="2" y="2" width="18" height="28" rx="3" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <rect x="5" y="6" width="10" height="2.5" rx="1.2" fill={`${accent}66`}/>
          <rect x="5" y="11" width="12" height="2" rx="1" fill={`${accent}33`}/>
          <rect x="5" y="15" width="9" height="2" rx="1" fill={`${accent}25`}/>
          <path d="M22 16 L24 13 L26 16" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="24" y1="13" x2="24" y2="23" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="28" y="2" width="18" height="28" rx="3" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <rect x="31" y="6" width="10" height="2.5" rx="1.2" fill={`${accent}66`}/>
          <rect x="31" y="11" width="12" height="2" rx="1" fill={`${accent}33`}/>
          <rect x="31" y="15" width="9" height="2" rx="1" fill={`${accent}25`}/>
        </svg>
      </C>
    )

    case 'convert': return (
      <C accent={accent}>
        <svg width="44" height="38" viewBox="0 0 44 38" fill="none">
          <rect x="2" y="8" width="14" height="16" rx="3" fill={`${accent}22`} stroke={`${accent}55`} strokeWidth="1.5"/>
          <rect x="28" y="8" width="14" height="16" rx="3" fill={`${accent}44`} stroke={accent} strokeWidth="1.5"/>
          <path d="M18 16 L26 13" stroke={accent} strokeWidth="2" strokeLinecap="round" markerEnd={`url(#arr${type})`}/>
          <path d="M18 22 L26 25" stroke={`${accent}77`} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
        </svg>
      </C>
    )

    case 'analysis': return (
      <C accent={accent}>
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <circle cx="18" cy="18" r="14" fill={`${accent}15`} stroke={`${accent}44`} strokeWidth="2"/>
          <rect x="10" y="14" width="14" height="2.5" rx="1.2" fill={`${accent}55`}/>
          <rect x="10" y="19" width="10" height="2" rx="1" fill={`${accent}33`}/>
          <rect x="10" y="24" width="12" height="2" rx="1" fill={`${accent}25`}/>
          <line x1="28" y1="28" x2="40" y2="40" stroke={accent} strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </C>
    )

    case 'forum': return (
      <C accent={accent}>
        <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
          <rect x="2" y="2" width="30" height="14" rx="6" fill={`${accent}22`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <rect x="6" y="7" width="14" height="2.5" rx="1.2" fill={`${accent}66`}/>
          <rect x="12" y="20" width="30" height="14" rx="6" fill={`${accent}18`} stroke={`${accent}33`} strokeWidth="1.5"/>
          <rect x="16" y="25" width="14" height="2.5" rx="1.2" fill={`${accent}44`}/>
        </svg>
      </C>
    )

    case 'ticket': return (
      <C accent={accent}>
        <svg width="46" height="30" viewBox="0 0 46 30" fill="none">
          <path d="M2 8 Q2 2 8 2 H38 Q44 2 44 8 V22 Q44 28 38 28 H8 Q2 28 2 22 Z" fill={`${accent}18`} stroke={`${accent}44`} strokeWidth="1.5"/>
          <line x1="16" y1="2" x2="16" y2="28" stroke={`${accent}33`} strokeWidth="1" strokeDasharray="3 3"/>
          <rect x="5" y="10" width="7" height="10" rx="1.5" fill={`${accent}33`}/>
          <rect x="20" y="9" width="20" height="3" rx="1.5" fill={`${accent}55`}/>
          <rect x="20" y="15" width="14" height="2.5" rx="1.2" fill={`${accent}33`}/>
          <rect x="20" y="20" width="10" height="2" rx="1" fill={`${accent}22`}/>
        </svg>
      </C>
    )

    case 'canvas': return (
      <C accent={accent}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="4" y="4" width="36" height="36" rx="4" fill={`${accent}10`} stroke={`${accent}33`} strokeWidth="1.5"
            style={{ fill: 'color-mix(in srgb, var(--bg-card-hover) 60%, transparent)' }}/>
          <rect x="10" y="10" width="14" height="12" rx="3" fill={`${accent}44`}/>
          <circle cx="30" cy="16" r="7" fill={`${accent}33`}/>
          <rect x="10" y="26" width="24" height="10" rx="3" fill={`${accent}22`}/>
        </svg>
      </C>
    )

    default: return null
  }
}
