import { useState } from 'react'
import { ELEVENLABS_VOICES, VOICE_SETTINGS_PRESETS } from '../data/voices'

const FILTERS = ['Tous', 'Femme', 'Homme', 'Recommandés']

export default function VoiceSelector({ selectedVoice, selectedPreset, onVoiceChange, onPresetChange, compact = false }) {
  const [filter, setFilter] = useState('Recommandés')

  const filtered = ELEVENLABS_VOICES.filter(v => {
    if (filter === 'Femme') return v.gender === 'Femme'
    if (filter === 'Homme') return v.gender === 'Homme'
    if (filter === 'Recommandés') return v.recommended
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 600,
            background: filter === f ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filter === f ? '#F0B429' : '#1A2332'}`,
            color: filter === f ? '#F0B429' : '#8B95A5', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Voice grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 8,
      }}>
        {filtered.map(v => {
          const isSelected = selectedVoice === v.id
          return (
            <button key={v.id} onClick={() => onVoiceChange(v.id)} style={{
              padding: '12px', borderRadius: 12, textAlign: 'left',
              background: isSelected ? 'rgba(240,180,41,0.1)' : 'rgba(255,255,255,0.02)',
              border: `2px solid ${isSelected ? '#F0B429' : '#1A2332'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: v.gender === 'Femme'
                    ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                    : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', flexShrink: 0,
                }}>
                  {v.gender === 'Femme' ? '👩' : '👨'}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#F0B429' : '#F0F2F5' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{v.accent}</div>
                </div>
              </div>
              {!compact && (
                <div style={{ fontSize: '0.72rem', color: '#8B95A5', lineHeight: 1.4 }}>
                  {v.description}
                </div>
              )}
              {v.recommended && (
                <div style={{
                  display: 'inline-block', marginTop: 6,
                  fontSize: '0.62rem', fontWeight: 700, color: '#18A84A',
                  background: 'rgba(24,168,74,0.1)', border: '1px solid rgba(24,168,74,0.25)',
                  borderRadius: 4, padding: '2px 6px',
                }}>
                  ✓ Recommandé
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Preset buttons */}
      {onPresetChange && (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 8 }}>
            Style de narration
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(VOICE_SETTINGS_PRESETS).map(([key, preset]) => {
              const isSelected = selectedPreset === key
              return (
                <button key={key} onClick={() => onPresetChange(key)} style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                  background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? '#8B5CF6' : '#1A2332'}`,
                  color: isSelected ? '#8B5CF6' : '#8B95A5', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}>
                  <span>{preset.icon}</span> {preset.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
