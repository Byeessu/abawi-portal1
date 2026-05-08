import { useState, useEffect } from 'react';
import { exportToPDF } from '../../lib/generatePDF';
import SEO from '../../components/SEO';
import ToolInfoPanel from '../../components/ToolInfoPanel';

const LS_KEY = 'abawi_facture_v2'

const THEMES = {
  classic:   { label: 'Classique',     headerBg: '#1a1a2e', accent: '#e94560',  text: '#fff', sub: '#e3e3e3' },
  minimal:   { label: 'Minimaliste',   headerBg: '#212529', accent: '#6c757d',  text: '#fff', sub: '#ced4da' },
  premium:   { label: 'Premium Gold',  headerBg: '#0f0c29', accent: '#d4af37',  text: '#fff', sub: '#ffe180' },
  corporate: { label: 'Corporate',     headerBg: '#003566', accent: '#ffd166',  text: '#fff', sub: '#cce4ff' },
  nature:    { label: 'Vert Naturel',  headerBg: '#1b4332', accent: '#52b788',  text: '#fff', sub: '#b7e4c7' },
  tech:      { label: 'Violet Tech',   headerBg: '#240046', accent: '#c77dff',  text: '#fff', sub: '#e0aaff' },
  africa:    { label: 'Rouge Africain',headerBg: '#6a040f', accent: '#f48c06',  text: '#fff', sub: '#ffe08a' },
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
}

const DEFAULT_META = {
  type: 'facture',
  numero: `FAC-${Date.now().toString().slice(-6)}`,
  date: new Date().toISOString().slice(0, 10),
  echeance: '',
  emetteur: '',
  emetteur_detail: '',
  client: '',
  client_detail: '',
  objet: '',
  conditions: 'Paiement à réception',
  mention: 'Document électronique — valable sans signature physique si envoyé par e-mail sécurisé.',
}

export default function FactureCreator() {
  const saved = loadSaved()

  const [meta, setMeta] = useState(saved?.meta || DEFAULT_META)
  const [lines, setLines] = useState(saved?.lines || [{ desc: 'Prestation de service', qty: 1, pu: 0 }])
  const [factureTheme, setFactureTheme] = useState(saved?.factureTheme || 'classic')

  // Optional fields
  const [useTVA, setUseTVA] = useState(saved?.useTVA ?? false)
  const [tvaPct, setTvaPct] = useState(saved?.tvaPct ?? 18)
  const [useSignature, setUseSignature] = useState(saved?.useSignature ?? false)
  const [signatureUrl, setSignatureUrl] = useState(saved?.signatureUrl || '')
  const [useCachet, setUseCachet] = useState(saved?.useCachet ?? false)
  const [cachetUrl, setCachetUrl] = useState(saved?.cachetUrl || '')
  const [useObjet, setUseObjet] = useState(saved?.useObjet ?? true)
  const [useConditions, setUseConditions] = useState(saved?.useConditions ?? true)
  const [useMention, setUseMention] = useState(saved?.useMention ?? true)
  const [useEcheance, setUseEcheance] = useState(saved?.useEcheance ?? false)

  // Persist (skip large base64 images for storage size)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        meta, lines, factureTheme,
        useTVA, tvaPct,
        useSignature, signatureUrl: signatureUrl.length < 50000 ? signatureUrl : '',
        useCachet, cachetUrl: cachetUrl.length < 50000 ? cachetUrl : '',
        useObjet, useConditions, useMention, useEcheance,
      }))
    } catch {}
  }, [meta, lines, factureTheme, useTVA, tvaPct, useSignature, signatureUrl, useCachet, cachetUrl, useObjet, useConditions, useMention, useEcheance])

  function updateMeta(k, v) { setMeta(m => ({ ...m, [k]: v })) }
  function updateLine(i, k, v) { setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l)) }
  function addLine() { setLines(ls => [...ls, { desc: '', qty: 1, pu: 0 }]) }
  function removeLine(i) { setLines(ls => ls.filter((_, idx) => idx !== i)) }
  function readImage(file, setter) {
    if (!file) return
    const r = new FileReader()
    r.onload = ev => setter(ev.target.result)
    r.readAsDataURL(file)
  }

  const totalHT = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.pu)), 0)
  const tva = useTVA ? totalHT * (tvaPct / 100) : 0
  const totalTTC = totalHT + tva

  const t = THEMES[factureTheme] || THEMES.classic
  const exportPDF = () => exportToPDF('facture-export', meta.type + '-' + meta.numero, { includeHeader: false, includeFooter: false })

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'Outfit,sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const sectionStyle = { marginBottom: 24 }
  const sectionTitleStyle = { fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }
  const toggleRow = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }
  const toggleLabel = { fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', color: 'var(--text-primary)' }}>
      <SEO title="Facture / Devis Pro" description="Créez vos factures et devis professionnels." />
      <ToolInfoPanel toolName="Facture / Devis Pro" icon="🧾" description="Créez vos factures et devis professionnels en quelques clics" benefits={[]} howToUse={[]} tips={[]} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

        {/* ── FORMULAIRE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Type + Numéro + Date */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>📋 Général</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={meta.type} onChange={e => updateMeta('type', e.target.value)}>
                  <option value="facture">Facture</option>
                  <option value="devis">Devis</option>
                  <option value="proforma">Proforma</option>
                  <option value="avoir">Avoir</option>
                  <option value="bon_commande">Bon de commande</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Numéro</label>
                <input style={inputStyle} value={meta.numero} onChange={e => updateMeta('numero', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input style={inputStyle} type="date" value={meta.date} onChange={e => updateMeta('date', e.target.value)} />
              </div>
              {useEcheance && (
                <div>
                  <label style={labelStyle}>Échéance</label>
                  <input style={inputStyle} type="date" value={meta.echeance} onChange={e => updateMeta('echeance', e.target.value)} />
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[
                [useEcheance, setUseEcheance, "Date d'échéance"],
              ].map(([val, set, lbl]) => (
                <label key={lbl} style={toggleRow}>
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                  <span style={toggleLabel}>{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Émetteur */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🏢 Émetteur</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input style={inputStyle} value={meta.emetteur} onChange={e => updateMeta('emetteur', e.target.value)} placeholder="Nom / Raison sociale" />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={meta.emetteur_detail} onChange={e => updateMeta('emetteur_detail', e.target.value)} placeholder="Adresse, NINEA, RCCM, téléphone, email…" />
            </div>
          </div>

          {/* Client */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>👤 Client</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input style={inputStyle} value={meta.client} onChange={e => updateMeta('client', e.target.value)} placeholder="Nom / Raison sociale du client" />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={meta.client_detail} onChange={e => updateMeta('client_detail', e.target.value)} placeholder="Adresse, contact, NINEA / RCCM si applicable" />
            </div>
          </div>

          {/* Lignes */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>📦 Lignes de détail</div>
            {lines.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 70px 28px', gap: 6, marginBottom: 7, alignItems: 'center' }}>
                <input style={inputStyle} value={l.desc} onChange={e => updateLine(i, 'desc', e.target.value)} placeholder="Description" />
                <input style={{ ...inputStyle, textAlign: 'center' }} type="number" min="0" value={l.qty} onChange={e => updateLine(i, 'qty', e.target.value)} placeholder="Qté" />
                <input style={{ ...inputStyle, textAlign: 'right' }} type="number" min="0" value={l.pu} onChange={e => updateLine(i, 'pu', e.target.value)} placeholder="P.U." />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', fontWeight: 700 }}>
                  {(Number(l.qty) * Number(l.pu)).toLocaleString()}
                </span>
                <button type="button" onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '1rem', padding: 0 }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addLine} style={{ marginTop: 4, padding: '7px 16px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>+ Ajouter une ligne</button>
          </div>

          {/* Totaux + TVA optionnelle */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>💰 Totaux</div>
            <label style={toggleRow}>
              <input type="checkbox" checked={useTVA} onChange={e => setUseTVA(e.target.checked)} />
              <span style={toggleLabel}>Appliquer la TVA</span>
            </label>
            {useTVA && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>Taux TVA (%)</label>
                <input style={{ ...inputStyle, width: 80 }} type="number" min="0" max="100" value={tvaPct} onChange={e => setTvaPct(Number(e.target.value))} />
              </div>
            )}
            <div style={{ display: 'grid', gap: 6, fontSize: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total HT</span><strong>{totalHT.toLocaleString()} FCFA</strong></div>
              {useTVA && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TVA ({tvaPct}%)</span><strong>{tva.toLocaleString()} FCFA</strong></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: 8, color: t.accent }}>
                <span>{useTVA ? 'Total TTC' : 'TOTAL'}</span><span>{totalTTC.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Options facultatives */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>⚙️ Options</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
              {[
                [useObjet, setUseObjet, 'Objet'],
                [useConditions, setUseConditions, 'Conditions de paiement'],
                [useMention, setUseMention, 'Mention légale'],
                [useSignature, setUseSignature, 'Signature'],
                [useCachet, setUseCachet, 'Cachet'],
              ].map(([val, set, lbl]) => (
                <label key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                  <span style={toggleLabel}>{lbl}</span>
                </label>
              ))}
            </div>

            {useObjet && (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Objet</label>
                <input style={inputStyle} value={meta.objet} onChange={e => updateMeta('objet', e.target.value)} placeholder="Ex: Prestation de conseil en stratégie digitale" />
              </div>
            )}
            {useConditions && (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Conditions de paiement</label>
                <input style={inputStyle} value={meta.conditions} onChange={e => updateMeta('conditions', e.target.value)} placeholder="Paiement à réception / 30 jours fin de mois…" />
              </div>
            )}
            {useMention && (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Mention légale</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={meta.mention} onChange={e => updateMeta('mention', e.target.value)} />
              </div>
            )}
            {useSignature && (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Signature (image)</label>
                <input style={inputStyle} type="file" accept="image/*" onChange={e => readImage(e.target.files[0], setSignatureUrl)} />
                {signatureUrl && <img src={signatureUrl} alt="sig" style={{ maxHeight: 50, marginTop: 6, borderRadius: 4 }} />}
              </div>
            )}
            {useCachet && (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Cachet / Tampon (image)</label>
                <input style={inputStyle} type="file" accept="image/*" onChange={e => readImage(e.target.files[0], setCachetUrl)} />
                {cachetUrl && <img src={cachetUrl} alt="cachet" style={{ maxHeight: 50, marginTop: 6, borderRadius: 4 }} />}
              </div>
            )}
          </div>

          {/* Thème */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🎨 Thème</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(THEMES).map(([k, th]) => (
                <button key={k} type="button" onClick={() => setFactureTheme(k)} style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: `2px solid ${factureTheme === k ? th.accent : 'var(--border)'}`,
                  background: factureTheme === k ? th.headerBg : 'var(--bg-card)',
                  color: factureTheme === k ? th.text : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                  transition: 'all .18s',
                }}>{th.label}</button>
              ))}
            </div>
          </div>

          {/* Export */}
          <button type="button" onClick={exportPDF} style={{
            padding: '13px 24px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${t.headerBg}, ${t.accent}30)`,
            borderLeft: `3px solid ${t.accent}`,
            color: t.text, cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem',
            fontFamily: 'Syne, sans-serif', letterSpacing: '0.3px',
          }}>
            📥 Exporter en PDF
          </button>
        </div>

        {/* ── PRÉVISUALISATION ── */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Aperçu</div>
          <div id="facture-export" style={{ background: '#ffffff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', fontSize: '12px', lineHeight: 1.5 }}>

            {/* En-tête coloré */}
            <div style={{ background: t.headerBg, color: t.text, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: t.accent }}>{meta.type}</div>
                <div style={{ fontSize: '0.72rem', color: t.sub, marginTop: 2, opacity: 0.85 }}>{meta.emetteur || 'Votre entreprise'}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: t.sub }}>
                <div style={{ fontWeight: 700, color: t.text }}>N° {meta.numero}</div>
                <div style={{ marginTop: 2 }}>Émis le {meta.date}</div>
                {useEcheance && meta.echeance && <div>Échéance : {meta.echeance}</div>}
              </div>
            </div>

            {/* Émetteur / Client */}
            <div style={{ padding: '14px 22px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, color: '#222' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Émetteur</div>
                <div style={{ fontWeight: 700, color: '#111' }}>{meta.emetteur || '—'}</div>
                <div style={{ whiteSpace: 'pre-line', color: '#555', fontSize: '0.72rem', lineHeight: 1.5 }}>{meta.emetteur_detail}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Client</div>
                <div style={{ fontWeight: 700, color: '#111' }}>{meta.client || '—'}</div>
                <div style={{ whiteSpace: 'pre-line', color: '#555', fontSize: '0.72rem', lineHeight: 1.5 }}>{meta.client_detail}</div>
              </div>
            </div>

            {useObjet && meta.objet && (
              <div style={{ padding: '4px 22px 10px', color: '#333' }}>
                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: '#555' }}>Objet : </span>
                <span style={{ fontSize: '0.78rem' }}>{meta.objet}</span>
              </div>
            )}

            {/* Tableau */}
            <div style={{ padding: '0 10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#222' }}>
                <thead>
                  <tr style={{ background: t.headerBg, color: t.text }}>
                    {['Description','Qté','P.U.','Total'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: i === 0 ? 'left' : 'right', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: t.sub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e9ecef', background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '8px 10px', color: '#222' }}>{l.desc || '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#444' }}>{l.qty}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#444' }}>{Number(l.pu).toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#222' }}>{(Number(l.qty)*Number(l.pu)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div style={{ padding: '10px 22px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 220, fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 5, color: '#333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total HT</span><strong>{totalHT.toLocaleString()} FCFA</strong></div>
                {useTVA && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TVA ({tvaPct}%)</span><strong>{tva.toLocaleString()} FCFA</strong></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 900, borderTop: `2px solid ${t.accent}`, paddingTop: 7, color: t.accent }}>
                  <span>{useTVA ? 'Total TTC' : 'TOTAL'}</span>
                  <span>{totalTTC.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Conditions + mention */}
            {(useConditions || useMention) && (
              <div style={{ padding: '8px 22px', borderTop: '1px solid #dee2e6', fontSize: '0.68rem', color: '#666', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {useConditions && meta.conditions && <div>💳 {meta.conditions}</div>}
                {useMention && meta.mention && <div style={{ fontStyle: 'italic' }}>{meta.mention}</div>}
              </div>
            )}

            {/* Signature + Cachet */}
            {(useSignature || useCachet) && (
              <div style={{ padding: '10px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #dee2e6' }}>
                {useSignature && (
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: 4 }}>Signature autorisée</div>
                    {signatureUrl
                      ? <img src={signatureUrl} alt="signature" style={{ maxHeight: 48, maxWidth: 120 }} />
                      : <div style={{ width: 100, borderBottom: '1px solid #bbb', marginTop: 24, fontSize: '0.65rem', color: '#aaa', textAlign: 'center' }}>_____________</div>
                    }
                  </div>
                )}
                {useCachet && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: 4 }}>Cachet / Tampon</div>
                    {cachetUrl
                      ? <img src={cachetUrl} alt="cachet" style={{ maxHeight: 48, maxWidth: 120 }} />
                      : <div style={{ width: 80, height: 48, border: '1px dashed #bbb', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#aaa', marginLeft: 'auto' }}>Cachet</div>
                    }
                  </div>
                )}
              </div>
            )}

            {/* Pied coloré */}
            <div style={{ background: t.headerBg, padding: '8px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: t.sub, opacity: 0.7 }}>{meta.emetteur || 'ABAWI Portal'}</div>
              <div style={{ fontSize: '0.65rem', color: t.accent, fontWeight: 700, opacity: 0.9 }}>abawi-portal.netlify.app</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
