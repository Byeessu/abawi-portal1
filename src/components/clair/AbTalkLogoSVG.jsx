export function AbTalkLogoSVG({ size = 32 }) {
  const id = `abtalk-grad-${size}`

  // Zone centrale de la bulle de message
  const symbolSize = size * 0.32
  const cx = size * 0.515
  const cy = size * 0.415

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="AbTalk"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Fond dégradé sky-blue */}
      <rect width={size} height={size} rx={size * 0.25} fill={`url(#${id})`} />

      {/* Bulle de message blanche avec queue bas-gauche */}
      <path
        d={`
          M ${size*0.325} ${size*0.2}
          H ${size*0.7}
          Q ${size*0.8} ${size*0.2} ${size*0.8} ${size*0.3}
          V ${size*0.55}
          Q ${size*0.8} ${size*0.65} ${size*0.7} ${size*0.65}
          H ${size*0.525}
          L ${size*0.35} ${size*0.825}
          V ${size*0.65}
          H ${size*0.325}
          Q ${size*0.225} ${size*0.65} ${size*0.225} ${size*0.55}
          V ${size*0.3}
          Q ${size*0.225} ${size*0.2} ${size*0.325} ${size*0.2}
          Z
        `}
        fill="white"
        fillOpacity="0.97"
      />

      {/* Symbole ABAWI — PNG original, recolorisé en bleu AbTalk via filtre CSS */}
      <image
        href="/favicon-symbol.png"
        x={cx - symbolSize / 2}
        y={cy - symbolSize / 2}
        width={symbolSize}
        height={symbolSize}
        style={{
          filter: 'brightness(0) saturate(100%) invert(59%) sepia(97%) saturate(658%) hue-rotate(174deg) brightness(104%)',
        }}
      />
    </svg>
  )
}
