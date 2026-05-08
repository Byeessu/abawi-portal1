const FONTS = [
  { id: 'outfit', label: 'Outfit', css: "'Outfit', sans-serif" },
  { id: 'georgia', label: 'Georgia', css: "'Georgia', serif" },
  { id: 'inter', label: 'Inter', css: "'Inter', sans-serif" },
  { id: 'montserrat', label: 'Montserrat', css: "'Montserrat', sans-serif" },
  { id: 'times', label: 'Times New Roman', css: "'Times New Roman', serif" },
]

const SIZES = [
  { id: 'sm', label: 'Petit', value: '0.85rem' },
  { id: 'md', label: 'Normal', value: '0.95rem' },
  { id: 'lg', label: 'Grand', value: '1.05rem' },
  { id: 'xl', label: 'Très grand', value: '1.15rem' },
]

export default function FontSelector({ font, size, onFontChange, onSizeChange }) {
  const selectStyle = {
    padding: '7px 12px', borderRadius: '8px',
    background: '#070B0F', border: '1px solid #1A2332',
    color: '#F0F2F5', fontSize: '0.82rem', outline: 'none', cursor: 'pointer',
  }
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
      <div>
        <label style={{ fontSize: '0.7rem', color: '#8B95A5', display: 'block', marginBottom: '4px' }}>Police</label>
        <select value={font} onChange={e => onFontChange(e.target.value)} style={selectStyle}>
          {FONTS.map(f => <option key={f.id} value={f.css}>{f.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '0.7rem', color: '#8B95A5', display: 'block', marginBottom: '4px' }}>Taille</label>
        <select value={size} onChange={e => onSizeChange(e.target.value)} style={selectStyle}>
          {SIZES.map(s => <option key={s.id} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  )
}
