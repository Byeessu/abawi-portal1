export default function Logo360({ size = 40, color = "#F0B429" }) {
  const mini = size < 26
  const sw = mini ? 7 : 4

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden
    >
      {/* Dashed orbit — only at larger sizes */}
      {!mini && (
        <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Main arc (3/4 circle) */}
      <path
        d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Arrow tip */}
      <path d="M42 78 L51 85 L42 92" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />

      {/* "360" text — only at larger sizes */}
      {!mini && (
        <text
          x="50" y="58"
          fill={color}
          fontSize="24"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="Outfit, Syne, sans-serif"
        >
          360
        </text>
      )}
    </svg>
  )
}
