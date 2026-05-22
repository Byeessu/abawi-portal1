/* ToolMockup — mini window preview for each tool type */

const W = (children, bg = '#0F172A') => (
  <div style={{ width: '100%', height: 130, borderRadius: '10px 10px 0 0', overflow: 'hidden', background: bg, position: 'relative', flexShrink: 0 }}>
    {/* Window chrome */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', opacity: 0.8 }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', opacity: 0.8 }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', opacity: 0.8 }} />
    </div>
    <div style={{ padding: '8px 10px', height: 'calc(100% - 26px)', overflow: 'hidden', position: 'relative' }}>
      {children}
    </div>
  </div>
)

const Line = ({ w = '80%', h = 6, color = 'rgba(255,255,255,0.12)', mt = 5, radius = 3 }) => (
  <div style={{ width: w, height: h, background: color, borderRadius: radius, marginTop: mt }} />
)

const Bar = ({ h, color, w = '18%' }) => (
  <div style={{ width: w, height: h, background: color, borderRadius: '3px 3px 0 0', alignSelf: 'flex-end' }} />
)

/* ── Mockup types ── */

function MockupCV() {
  return W(
    <div style={{ display: 'flex', gap: 8, height: '100%' }}>
      <div style={{ width: 28, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)' }} />
        <Line w="100%" h={4} mt={6} />
        <Line w="85%" h={4} mt={4} />
        <Line w="90%" h={4} mt={4} />
      </div>
      <div style={{ flex: 1 }}>
        <Line w="70%" h={7} color="rgba(255,255,255,0.25)" mt={0} />
        <Line w="45%" h={5} mt={5} />
        <div style={{ marginTop: 8, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <Line w="90%" h={4} mt={6} />
        <Line w="85%" h={4} mt={4} />
        <Line w="75%" h={4} mt={4} />
        <Line w="60%" h={4} mt={4} />
      </div>
    </div>,
    '#F8FAFC'
  )
}

function MockupChart({ accent = '#3B82F6' }) {
  const bars = [
    { h: 42, color: accent + 'AA', w: '18%' },
    { h: 55, color: accent, w: '18%' },
    { h: 38, color: accent + 'AA', w: '18%' },
    { h: 65, color: accent, w: '18%' },
    { h: 50, color: accent + 'AA', w: '18%' },
  ]
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Line w="55%" h={5} color="rgba(255,255,255,0.18)" mt={0} />
      <Line w="35%" h={4} mt={4} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3%', paddingBottom: 4, marginTop: 6 }}>
        {bars.map((b, i) => <Bar key={i} {...b} />)}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 2 }} />
    </div>
  )
}

function MockupLineChart() {
  const pts = [[0,60],[15,45],[30,50],[45,30],[60,35],[75,18],[90,25],[100,12]]
  const pathD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + `${p[0]} ${p[1]}`).join(' ')
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <Line w="30%" h={5} color="#F59E0B99" mt={0} />
        <Line w="25%" h={5} color="#10B98199" mt={0} />
        <Line w="20%" h={5} color="#EF444499" mt={0} />
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 70" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={pathD + ' L100 70 L0 70 Z'} fill="url(#lg1)" />
          <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function MockupWaveform() {
  const bars = [3,7,12,18,22,28,35,32,26,20,28,35,40,38,30,25,18,22,28,32,26,20,14,10,6,4]
  const maxH = 40
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
        <Line w="60%" h={4} color="rgba(255,255,255,0.15)" mt={0} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${(h / maxH) * 100}%`, background: i < 10 ? '#14B8A6' : 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Line w="15%" h={4} color="#14B8A622" mt={0} />
        <Line w="25%" h={4} color="rgba(255,255,255,0.1)" mt={0} />
        <Line w="12%" h={4} color="rgba(255,255,255,0.1)" mt={0} />
      </div>
    </div>,
    '#070D1A'
  )
}

function MockupSlides() {
  return W(
    <div style={{ height: '100%', display: 'flex', gap: 6 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(220,38,38,0.4)', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Line w="65%" h={6} color="rgba(255,255,255,0.3)" mt={0} />
        <Line w="45%" h={4} mt={2} />
        <Line w="80%" h={4} mt={6} />
        <Line w="70%" h={4} mt={3} />
        <Line w="55%" h={4} mt={3} />
      </div>
      <div style={{ width: 50, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ flex: 1, background: i === 1 ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.04)', borderRadius: 4, border: `1px solid ${i === 1 ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}` }} />
        ))}
      </div>
    </div>,
    '#0A0A0A'
  )
}

function MockupDoc({ light = false }) {
  const bg = light ? '#F9FAFB' : '#0F172A'
  const lineC = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
  const headC = light ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Line w="50%" h={7} color={headC} mt={0} />
      <Line w="35%" h={5} mt={4} color={lineC} />
      <div style={{ marginTop: 8, height: 1, background: lineC }} />
      <Line w="90%" h={4} mt={6} color={lineC} />
      <Line w="85%" h={4} mt={4} color={lineC} />
      <Line w="75%" h={4} mt={4} color={lineC} />
      <Line w="80%" h={4} mt={4} color={lineC} />
      <Line w="60%" h={4} mt={4} color={lineC} />
    </div>,
    bg
  )
}

function MockupTable({ light = false }) {
  const bg = light ? '#FFFFFF' : '#0A1220'
  const lineC = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'
  const rowBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'
  return W(
    <div style={{ height: '100%' }}>
      <div style={{ display: 'flex', gap: 4, padding: '0 0 4px', borderBottom: `1px solid ${lineC}` }}>
        {['40%','30%','30%'].map((w, i) => (
          <div key={i} style={{ width: w, height: 5, background: i === 0 ? 'rgba(255,255,255,0.2)' : lineC, borderRadius: 2 }} />
        ))}
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ display: 'flex', gap: 4, padding: '4px 0', background: i % 2 === 0 ? rowBg : 'transparent', borderBottom: `1px solid ${lineC}` }}>
          <div style={{ width: '40%', height: 4, background: lineC, borderRadius: 2 }} />
          <div style={{ width: '30%', height: 4, background: 'rgba(16,185,129,0.4)', borderRadius: 2 }} />
          <div style={{ width: '30%', height: 4, background: lineC, borderRadius: 2 }} />
        </div>
      ))}
    </div>,
    bg
  )
}

function MockupSWOT() {
  const labels = [['S','#10B981'],['W','#EF4444'],['O','#3B82F6'],['T','#F59E0B']]
  return W(
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4 }}>
      {labels.map(([l, c]) => (
        <div key={l} style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 6, display: 'flex', flexDirection: 'column', padding: '4px 6px', gap: 3 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: c, lineHeight: 1 }}>{l}</div>
          <div style={{ height: 3, background: `${c}55`, borderRadius: 2 }} />
          <div style={{ height: 3, background: `${c}33`, borderRadius: 2, width: '70%' }} />
        </div>
      ))}
    </div>
  )
}

function MockupChat() {
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(99,102,241,0.6)', flexShrink: 0 }} />
        <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '10px 10px 10px 2px', padding: '5px 8px', flex: 1 }}>
          <Line w="90%" h={4} color="rgba(255,255,255,0.35)" mt={0} />
          <Line w="70%" h={4} mt={3} color="rgba(255,255,255,0.25)" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px 10px 2px 10px', padding: '5px 8px', maxWidth: '75%' }}>
          <Line w="80%" h={4} color="rgba(255,255,255,0.2)" mt={0} />
        </div>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(99,102,241,0.6)', flexShrink: 0 }} />
        <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '10px 10px 10px 2px', padding: '5px 8px', flex: 1 }}>
          <Line w="100%" h={4} color="rgba(255,255,255,0.35)" mt={0} />
          <Line w="55%" h={4} mt={3} color="rgba(255,255,255,0.25)" />
        </div>
      </div>
    </div>
  )
}

function MockupMap() {
  const dots = [[20,30],[45,50],[65,25],[30,65],[75,55],[55,75]]
  return W(
    <div style={{ height: '100%', position: 'relative', background: '#0F1A2E', borderRadius: 6, overflow: 'hidden' }}>
      {/* Grid lines */}
      {[20,40,60,80].map(y => <div key={y} style={{ position: 'absolute', top: `${y}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.04)' }} />)}
      {[25,50,75].map(x => <div key={x} style={{ position: 'absolute', left: `${x}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.04)' }} />)}
      {/* Dots */}
      {dots.map(([x, y], i) => (
        <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: i === 2 ? 12 : 8, height: i === 2 ? 12 : 8, borderRadius: '50%', background: i === 2 ? '#EF4444' : '#3B82F6', transform: 'translate(-50%,-50%)', opacity: 0.9, boxShadow: `0 0 ${i === 2 ? 8 : 4}px ${i === 2 ? '#EF444488' : '#3B82F688'}` }} />
      ))}
    </div>,
    '#0F1A2E'
  )
}

function MockupPhotoId() {
  return W(
    <div style={{ height: '100%', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 30, height: 38, borderRadius: 4, background: i === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${i === 1 ? 'rgba(234,88,12,0.6)' : 'rgba(255,255,255,0.1)'}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', bottom: 6, left: '10%', right: '10%', height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
          {i === 1 && <>
            <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: 'rgba(234,88,12,0.3)' }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: 'rgba(234,88,12,0.3)' }} />
          </>}
        </div>
      ))}
    </div>,
    '#0A0F1A'
  )
}

function MockupPhotoEditor() {
  return W(
    <div style={{ height: '100%', display: 'flex', gap: 6 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 8, borderRadius: 4, background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(236,72,153,0.2))' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, height: 14, background: 'rgba(0,0,0,0.3)', borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />)}
        </div>
      </div>
      <div style={{ width: 28, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[0.9,0.7,1,0.6,0.8].map((o, i) => (
          <div key={i} style={{ height: 14, background: `rgba(99,102,241,${o * 0.4})`, borderRadius: 4, border: '1px solid rgba(99,102,241,0.3)' }} />
        ))}
      </div>
    </div>
  )
}

function MockupInvoice() {
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ width: 30, height: 14, background: 'rgba(180,83,9,0.5)', borderRadius: 3 }} />
        <Line w="35%" h={5} color="rgba(180,83,9,0.4)" mt={0} />
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 5 }} />
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Line w="50%" h={4} mt={0} />
          <Line w="20%" h={4} mt={0} color="rgba(180,83,9,0.4)" />
        </div>
      ))}
      <div style={{ marginTop: 'auto', height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 4 }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: 'rgba(180,83,9,0.25)', border: '1px solid rgba(180,83,9,0.4)', borderRadius: 4, padding: '2px 8px' }}>
          <Line w="60px" h={5} color="rgba(180,83,9,0.6)" mt={0} />
        </div>
      </div>
    </div>
  )
}

function MockupScore() {
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle cx="26" cy="26" r="22" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray={`${0.82 * 138.2} ${138.2}`} strokeDashoffset="34.6" strokeLinecap="round" transform="rotate(-90 26 26)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#10B981' }}>82</div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[['ATS', '88%','#10B981'],['Mots-clés','75%','#3B82F6'],['Format','90%','#10B981']].map(([l,v,c])=>(
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', width: 36 }}>{l}</div>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: v, height: '100%', background: c, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupCard() {
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
      <div style={{ border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ width: 18, height: 12, background: 'rgba(212,175,55,0.5)', borderRadius: 2 }} />
        <Line w="70%" h={6} color="rgba(255,255,255,0.25)" mt={0} />
        <Line w="50%" h={4} mt={0} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          <div style={{ width: 18, height: 12, borderRadius: '50%', background: 'rgba(212,175,55,0.3)', marginRight: -6 }} />
          <div style={{ width: 18, height: 12, borderRadius: '50%', background: 'rgba(212,175,55,0.5)' }} />
        </div>
      </div>
    </div>
  )
}

function MockupQR() {
  return W(
    <div style={{ height: '100%', display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ width: 72, height: 72, background: '#FFFFFF', borderRadius: 6, padding: 4, flexShrink: 0 }}>
        <svg viewBox="0 0 21 21" width="100%" height="100%" style={{ display: 'block' }}>
          {[[0,0],[0,1],[0,2],[1,0],[2,0],[1,2],[2,1],[2,2],[0,3],[0,4],[0,5],[1,5],[2,5],[2,4],[2,3],
            [4,0],[5,0],[6,0],[4,1],[6,1],[4,2],[5,2],[6,2],[4,4],[5,4],[6,5],[4,5],[4,6],[5,5],[6,4],[6,6],
            [8,0],[9,1],[10,2],[8,2],[9,0],[10,1],[8,4],[10,4],[9,5],[8,6],[10,6],
            [12,1],[13,0],[14,0],[15,1],[14,2],[13,3],[15,3],[12,4],[14,4],[15,5],[13,5],[12,6],[14,6]
          ].map(([x,y],i) => <rect key={i} x={x} y={y} width={1} height={1} fill="#111" />)}
        </svg>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Line w="85%" h={5} color="rgba(255,255,255,0.2)" mt={0} />
        <Line w="65%" h={4} />
        <Line w="75%" h={4} />
        <div style={{ marginTop: 4, height: 18, background: 'rgba(21,128,61,0.3)', borderRadius: 4, border: '1px solid rgba(21,128,61,0.5)' }} />
      </div>
    </div>
  )
}

function MockupDict() {
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 6, padding: '4px 8px', border: '1px solid rgba(99,102,241,0.3)' }}>
        <Line w="55%" h={6} color="rgba(99,102,241,0.6)" mt={0} />
      </div>
      <Line w="30%" h={4} color="rgba(255,255,255,0.15)" />
      <Line w="90%" h={4} />
      <Line w="85%" h={4} />
      <Line w="70%" h={4} />
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        {['syn','ant','etym'].map(t => (
          <div key={t} style={{ padding: '2px 6px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 4, fontSize: 8, color: 'rgba(99,102,241,0.7)' }}>{t}</div>
        ))}
      </div>
    </div>
  )
}

function MockupTranslate() {
  return W(
    <div style={{ height: '100%', display: 'flex', gap: 6 }}>
      {['Français','Anglais'].map((lang, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{lang}</div>
          <Line w="80%" h={4} color="rgba(255,255,255,0.15)" mt={0} />
          <Line w="65%" h={4} />
          <Line w="70%" h={4} />
          <Line w="50%" h={4} />
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: 'rgba(14,165,233,0.7)' }}>⇄</div>
      </div>
    </div>
  )
}

function MockupConvert() {
  const types = ['🖼','🎵','📹','📄','📊']
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {types.map((t, i) => (
          <div key={i} style={{ flex: 1, height: 22, background: i === 0 ? 'rgba(194,65,12,0.3)' : 'rgba(255,255,255,0.05)', borderRadius: 4, border: `1px solid ${i === 0 ? 'rgba(194,65,12,0.5)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
            {t}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 22, background: 'rgba(255,255,255,0.06)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
          <Line w="70%" h={4} mt={0} />
        </div>
        <div style={{ fontSize: 14, color: 'rgba(194,65,12,0.7)' }}>→</div>
        <div style={{ flex: 1, height: 22, background: 'rgba(194,65,12,0.1)', borderRadius: 4, border: '1px solid rgba(194,65,12,0.3)', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
          <Line w="60%" h={4} mt={0} color="rgba(194,65,12,0.5)" />
        </div>
      </div>
    </div>
  )
}

function MockupAnalysis() {
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {['Origines','Contextes','Niveaux'].map((t, i) => (
          <div key={i} style={{ flex: 1, height: 14, background: i === 0 ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.05)', borderRadius: 4, border: `1px solid ${i === 0 ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
            <div style={{ fontSize: 7, color: i === 0 ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t}</div>
          </div>
        ))}
      </div>
      <Line w="45%" h={5} color="rgba(168,85,247,0.5)" mt={0} />
      <Line w="90%" h={4} color="rgba(255,255,255,0.12)" />
      <Line w="80%" h={4} color="rgba(255,255,255,0.08)" />
      <Line w="85%" h={4} color="rgba(255,255,255,0.08)" />
      <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
        <div style={{ flex: 1, height: 16, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 4 }} />
        <div style={{ flex: 1, height: 16, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 4 }} />
      </div>
    </div>,
    '#0D0D1A'
  )
}

function MockupForum() {
  return W(
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: ['rgba(99,102,241,0.5)','rgba(16,185,129,0.5)','rgba(245,158,11,0.5)'][i-1], flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <Line w="80%" h={4} color="rgba(255,255,255,0.2)" mt={0} />
            <Line w="60%" h={3} mt={3} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MockupTicket() {
  return W(
    <div style={{ height: '100%', display: 'flex', gap: 6 }}>
      <div style={{ flex: 1, background: 'linear-gradient(135deg,rgba(190,24,93,0.2),rgba(124,58,237,0.15))', borderRadius: 8, border: '1px solid rgba(190,24,93,0.3)', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Line w="75%" h={5} color="rgba(255,255,255,0.3)" mt={0} />
        <Line w="50%" h={4} color="rgba(255,255,255,0.15)" />
        <div style={{ marginTop: 4, height: 1, borderTop: '1px dashed rgba(255,255,255,0.15)' }} />
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.9)', borderRadius: 3 }}>
            <svg viewBox="0 0 10 10" width="100%" height="100%">
              {[[0,0],[0,1],[1,0],[2,1],[2,0],[1,2],[3,0],[4,0],[4,1],[3,2],[4,2],[0,3],[1,3],[2,3],[3,3],[0,4],[2,4],[4,4]].map(([x,y],i) => (
                <rect key={i} x={x*2} y={y*2} width={2} height={2} fill="#000" />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupCanvas() {
  return W(
    <div style={{ height: '100%', display: 'flex', gap: 5 }}>
      <div style={{ width: 35, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {['#6366F1','#EC4899','#10B981','#F59E0B'].map((c,i) => (
          <div key={i} style={{ height: 16, background: `${c}33`, border: `1px solid ${c}55`, borderRadius: 4 }} />
        ))}
      </div>
      <div style={{ flex: 1, position: 'relative', background: 'repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 45, height: 35, background: 'linear-gradient(135deg,#6366F1,#EC4899)', borderRadius: 6, top: 10, left: 10 }} />
        <div style={{ position: 'absolute', width: 30, height: 30, borderRadius: '50%', background: 'rgba(16,185,129,0.7)', top: 25, right: 15 }} />
        <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, height: 8, background: 'rgba(245,158,11,0.5)', borderRadius: 3 }} />
      </div>
    </div>
  )
}

/* ── Main export ── */
const MOCKUP_MAP = {
  'cv':           () => <MockupCV />,
  'chart':        (t) => <MockupChart accent={t || '#3B82F6'} />,
  'linechart':    () => <MockupLineChart />,
  'waveform':     () => <MockupWaveform />,
  'slides':       () => <MockupSlides />,
  'doc':          () => <MockupDoc />,
  'table':        () => <MockupTable />,
  'swot':         () => <MockupSWOT />,
  'chat':         () => <MockupChat />,
  'map':          () => <MockupMap />,
  'photo-id':     () => <MockupPhotoId />,
  'photo-editor': () => <MockupPhotoEditor />,
  'invoice':      () => <MockupInvoice />,
  'score':        () => <MockupScore />,
  'card':         () => <MockupCard />,
  'qr':           () => <MockupQR />,
  'dict':         () => <MockupDict />,
  'translate':    () => <MockupTranslate />,
  'convert':      () => <MockupConvert />,
  'analysis':     () => <MockupAnalysis />,
  'forum':        () => <MockupForum />,
  'ticket':       () => <MockupTicket />,
  'canvas':       () => <MockupCanvas />,
}

export default function ToolMockup({ type, accent }) {
  const render = MOCKUP_MAP[type]
  if (!render) return null
  return render(accent)
}
