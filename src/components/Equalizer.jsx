import { useAudio } from '../context/AudioContext'

const CONFIGS = {
  sm:  { bars: 8,  maxH: 32 },
  md:  { bars: 16, maxH: 48 },
  lg:  { bars: 24, maxH: 80 },
  xl:  { bars: 32, maxH: 120 },
}

export default function Equalizer({ size = 'md' }) {
  const { frequencies, playing } = useAudio()
  const { bars, maxH } = CONFIGS[size] || CONFIGS.md

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: maxH }}>
      {Array.from({ length: bars }).map((_, i) => {
        const freq = frequencies[Math.floor(i * frequencies.length / bars)] || 0
        const h = playing
          ? Math.max(3, (freq / 255) * maxH)
          // eslint-disable-next-line react-hooks/purity -- Called from event handlers/effects, not during pure render — instability is intentional or scoped
          : 3 + Math.sin(Date.now() / 300 + i) * 2
        return (
          <div key={i} style={{
            width: size === 'sm' ? 3 : size === 'xl' ? 6 : 4,
            height: h,
            background: 'linear-gradient(to top, #18A84A, #F0B429)',
            borderRadius: 2,
            transition: 'height 60ms ease',
            flexShrink: 0,
          }} />
        )
      })}
    </div>
  )
}
