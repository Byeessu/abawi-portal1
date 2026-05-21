import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useThemedStyles, resolveVar } from '../lib/theme';
import QRCode from 'qrcode'
import {
  sendPayment, getAvailableProviders, getBalance, getTransactions, recordTransaction,
  getSavingsGoal, createSavingsGoal, updateSavingsGoal
} from '../lib/abawiPayService'
import { useAuth } from '../context/AuthContext'
import { Chart, registerables } from 'chart.js'
import { createInvoice, isPaydunyaConfigured, waLink } from '../config/paydunya'
import './AbawiPay.css'
import SEO from '../components/SEO'

Chart.register(...registerables)

/* ─── Icon — fond noir + icône dorée (filtre CSS, sans déformer) ─── */
function AbawiPayIcon({ size = 36 }) {
  const r = Math.round(size * 0.2)
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: '#0a0a0a', overflow: 'hidden',
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img
        src="/abawi-pay-icon.webp"
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        alt="AbawiPay"
        style={{
          display: 'block', objectFit: 'cover',
          filter: 'grayscale(1) invert(1) sepia(1) saturate(5) hue-rotate(5deg) brightness(1.35)',
        }}
      />
    </div>
  )
}

/* ─── Ticker supprimé — les infos sont dans la bannière globale du site ─── */

/* ─── Logos officiels réseaux ─── */
const NET_IMGS = {
  'Wave':             '/net-wave.jfif',
  'Orange Money':     '/net-orange-money.png',
  'Free Money':       '/net-free-money.png',
  'Expresso':         '/net-expresso.jfif',
  'orange':           '/net-orange-tel.png',
  'free':             '/net-free-money.png',
  'expresso':         '/net-expresso.jfif',
  'moov':             '/net-moov.png',
  'togocel':          '/net-togocel.png',
  'mtn':              '/net-mtn.webp',
  'Virement bancaire': '/net-bank.webp',
}

/* ─── Logos factures ─── */
const BILL_LOGOS = {
  'senelec': '/bill-senelec.png',
  'woyofal': '/bill-woyofal.jpg',
  'seneau':  '/bill-seneau.jpeg',
  'orange':  '/bill-orange.png',
  'canal':   '/bill-canal.jpg',
  'dstv':    '/bill-dstv.png',
}

const FACTURES_LIST = [
  { id:'senelec',  label:'SENELEC' },
  { id:'woyofal',  label:'Woyofal' },
  { id:'seneau',   label:'SenEau' },
  { id:'orange',   label:'Orange' },
  { id:'canal',    label:'Canal+' },
  { id:'dstv',     label:'DStv' },
  { id:'impots',   label:'Impôts', icon:'🏛️' },
  { id:'douanes',  label:'Douanes', icon:'🚢' },
  { id:'sn-eit',   label:'Frais scol.', icon:'🏫' },
  { id:'loyer',    label:'Loyer', icon:'🏠' },
]

function BillLogo({ id, size = 42 }) {
  const img = BILL_LOGOS[id]
  const item = FACTURES_LIST.find(f => f.id === id)
  const r = Math.round(size * 0.2)
  if (img) return (
    <div style={{ width: size, height: size, borderRadius: r, background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={img} alt={id} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  )
  return <div style={{ fontSize: size * 0.55, lineHeight: 1 }}>{item?.icon || '📄'}</div>
}

function NetLogo({ id, size = 34 }) {
  const s = size
  const r = Math.round(s * 0.22)
  const imgSrc = NET_IMGS[id]
  if (imgSrc) return (
    <div style={{ width:s, height:s, borderRadius:r, background: id === 'Virement bancaire' ? 'var(--bg-primary)' : 'var(--bg-secondary)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)' }}>
      <img src={imgSrc} alt={id} width={s} height={s} loading="lazy" decoding="async" style={{ display:'block', objectFit:'cover', width:'100%', height:'100%' }} />
    </div>
  )
  return <AbawiPayIcon size={s} />
}

/* ─── Contact colors palette ─── */
const CONTACT_COLORS = [
  { bg:'var(--green-glow)', color:'var(--green)' },
  { bg:'rgba(0,120,255,0.1)', color:'#0078FF' },
  { bg:'var(--gold-glow)', color:'var(--gold)' },
  { bg:'rgba(255,107,0,0.1)', color:'#FF6B00' },
  { bg:'rgba(27,168,245,0.1)', color:'#1BA8F5' },
  { bg:'rgba(168,85,247,0.1)', color:'#A855F7' },
  { bg:'rgba(236,72,153,0.1)', color:'#EC4899' },
  { bg:'rgba(20,184,166,0.1)', color:'#14B8A6' },
]

/* ─── Pill ─── */
function Pill({ label, color }) {
  const map = { green:'var(--ap-pill-green)', red:'var(--ap-pill-red)', yellow:'var(--ap-pill-yellow)', blue:'var(--ap-pill-blue)' }
  return <span className={`ap-pill ap-pill-${color}`}>{label}</span>
}

/* ─── QR Pay Icon SVG ─── */
function QRPayIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Top-left finder */}
      <rect x="1" y="1" width="9" height="9" rx="1.8" fill={color}/>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" fill="var(--bg-primary)"/>
      <rect x="4" y="4" width="3" height="3" rx="0.5" fill={color}/>
      {/* Top-right finder */}
      <rect x="14" y="1" width="9" height="9" rx="1.8" fill={color}/>
      <rect x="15.5" y="2.5" width="6" height="6" rx="1" fill="var(--bg-primary)"/>
      <rect x="17" y="4" width="3" height="3" rx="0.5" fill={color}/>
      {/* Bottom-left finder */}
      <rect x="1" y="14" width="9" height="9" rx="1.8" fill={color}/>
      <rect x="2.5" y="15.5" width="6" height="6" rx="1" fill="var(--bg-primary)"/>
      <rect x="4" y="17" width="3" height="3" rx="0.5" fill={color}/>
      {/* Data modules */}
      <rect x="14" y="14" width="2.2" height="2.2" rx="0.4" fill={color}/>
      <rect x="17.4" y="14" width="2.2" height="2.2" rx="0.4" fill={color}/>
      <rect x="20.8" y="14" width="2.2" height="2.2" rx="0.4" fill={color}/>
      <rect x="14" y="17.4" width="2.2" height="2.2" rx="0.4" fill={color}/>
      <rect x="20.8" y="17.4" width="2.2" height="2.2" rx="0.4" fill={color}/>
      <rect x="17.4" y="20.8" width="2.2" height="2.2" rx="0.4" fill={color}/>
      <rect x="14" y="20.8" width="5.6" height="2.2" rx="0.4" fill={color}/>
    </svg>
  )
}

/* ─── QR Canvas ─── */
async function drawQR(canvasId, data) {
  try {
    await QRCode.toCanvas(document.getElementById(canvasId), data || 'https://abawi.pay', {
      width: parseInt(canvasId === 'qr-main' ? 180 : 160, 10),
      margin: 1,
      color: { dark: resolveVar('--text-primary'), light: resolveVar('--bg-secondary') },
    })
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch (_) {}
}

/* ─── QR Scanner component ─── */
function QRScanner({ onResult }) {
  const videoRef = useRef(null)
  const rafRef = useRef(null)
  const streamRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState('')
  const [err, setErr] = useState('')
  const [manualCode, setManualCode] = useState('')

  function stopScan() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    streamRef.current?.getTracks?.().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) { videoRef.current.srcObject = null }
    setScanning(false)
  }

  useEffect(() => () => stopScan(), [])

  async function startScan() {
    setErr(''); setResult('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width:{ ideal:1280 }, height:{ ideal:720 } }, audio: false })
      streamRef.current = s
      setScanning(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play().catch(() => {})
      }
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const detect = async () => {
          if (!videoRef.current || !streamRef.current) return
          if (videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(detect); return }
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              const val = codes[0].rawValue
              setResult(val)
              stopScan()
              onResult?.(val)
              return
            }
          // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
          } catch (_) {}
          if (streamRef.current) rafRef.current = requestAnimationFrame(detect)
        }
        rafRef.current = requestAnimationFrame(detect)
      }
    } catch (e) {
      setErr('Caméra inaccessible : ' + (e?.message || 'vérifiez les permissions'))
    }
  }

  function handleManual() {
    if (!manualCode.trim()) return
    setResult(manualCode.trim())
    onResult?.(manualCode.trim())
  }

  return (
    <div>
      <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'var(--bg-primary)', aspectRatio:'4/3', maxHeight:280 }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ width:'100%', height:'100%', objectFit:'cover', display:scanning?'block':'none' }} />
        {!scanning && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
            <div className="ap-scan-box"><div className="ap-scan-line" /></div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:1 }}>CAMÉRA ÉTEINTE</div>
          </div>
        )}
        {scanning && (
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:180, height:180, border:'2px solid var(--gold)', borderRadius:12, boxShadow:'0 0 0 4000px rgba(0,0,0,0.45)', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, width:'100%', height:3, background:'var(--gold)', animation:'ap-scan-anim 2s ease-in-out infinite' }} />
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes ap-scan-anim { 0%,100%{top:0} 50%{top:calc(100% - 3px)} }`}</style>
      <div className="ap-share-row" style={{ marginTop:12 }}>
        {!scanning ? (
          <button className="ap-btn-primary" onClick={startScan} style={{ flex:1 }}>📷 ACTIVER LA CAMÉRA</button>
        ) : (
          <button className="ap-btn-secondary" onClick={stopScan} style={{ flex:1 }}>⏹ Arrêter</button>
        )}
      </div>
      {err && <div style={{ padding:'8px 12px', background:'var(--error-bg)', border:'1px solid var(--error-border)', borderRadius:8, color:'var(--error-text)', fontSize:'0.8rem', marginTop:10 }}>{err}</div>}
      {result && (
        <div className="ap-alert-success" style={{ marginTop:10 }}>
          ✅ QR lu : <strong>{result}</strong>
        </div>
      )}
      <div className="ap-input-group" style={{ marginTop:14 }}>
        <label>Ou saisir un code manuellement</label>
        <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
          <input value={manualCode} onChange={e=>setManualCode(e.target.value)} placeholder="Entrer le code de paiement" style={{ flex:1, minWidth:0 }} />
          <button className="ap-btn-green" onClick={handleManual} style={{ flexShrink:0, width:48, padding:0, borderRadius:10 }}>OK</button>
        </div>
      </div>
    </div>
  )
}

/* ─── TABS CONFIG ─── */
const TABS = [
  { id: 'accueil',       label: '🏠 Accueil' },
  { id: 'envoyer',       label: '📤 Envoyer' },
  { id: 'international', label: '🌍 International' },
  { id: 'recevoir',      label: '📥 Recevoir' },
  { id: 'qr',            label: 'QR Pay' },
  { id: 'code',          label: '🔑 Code' },
  { id: 'recharge',      label: '📱 Recharge' },
  { id: 'factures',      label: '⚡ Factures' },
  { id: 'carte',         label: '💳 Carte physique' },
  { id: 'epargne',       label: '💰 Épargne' },
  { id: 'historique',    label: '📋 Historique' },
  { id: 'stats',         label: '📊 Stats' },
]

/* ─── MAIN COMPONENT ─── */
export default function AbawiPay() {
  const stickyRef = useRef(null)
  const [navbarH, setNavbarH] = useState(60)
  const [stickyH, setStickyH] = useState(102)

  /* position: fixed escapes the page-content translateY animation that was pushing
     the header down 24px. We read the CSS variable after Navbar's useLayoutEffect
     has already set it (parent fires before child in depth-first order). */
  useLayoutEffect(() => {
    const cssVal = getComputedStyle(document.documentElement).getPropertyValue('--navbar-total-h').trim()
    const nh = parseInt(cssVal) || 60
    setNavbarH(nh)
    if (stickyRef.current) setStickyH(stickyRef.current.offsetHeight)
  }, [])

  const [tab, setTab] = useState('accueil')
  const [selectedNet, setSelectedNet] = useState('Abawi Pay')
  const [destInput, setDestInput] = useState('')
  const [montant, setMontant] = useState('')
  const [note, setNote] = useState('')
  const [fee, setFee] = useState(0)
  const [feeNote, setFeeNote] = useState('0% entre comptes Abawi Pay')
  const [feeWarn, setFeeWarn] = useState('')
  const [sendConfirmed, setSendConfirmed] = useState(null)
  const [intlCountry, setIntlCountry] = useState({ code:'CI', currency:'XOF', rate:1 })
  const [intlAmount, setIntlAmount] = useState('')
  const [intlRecv, setIntlRecv] = useState('')
  const [intlFee, setIntlFee] = useState(0)
  const [codeAmount, setCodeAmount] = useState('')
  const [codeDuration, setCodeDuration] = useState('5 minutes')
  const [generatedCode, setGeneratedCode] = useState(null)
  const [recvAmount, setRecvAmount] = useState('')
  const [recvMsg, setRecvMsg] = useState('')
  const [recvLink, setRecvLink] = useState('abawi.pay/r/—')
  const [recvDisplay, setRecvDisplay] = useState('Montant libre')
  const [qrCountdown, setQrCountdown] = useState(300)
  const [qrToken, setQrToken] = useState('')
  const [txFilter, setTxFilter] = useState('all')
  const [cardType, setCardType] = useState('standard')
  const [cardForm, setCardForm] = useState({ nom:'', prenom:'', adresse:'', ville:'', tel:'' })
  const [cardOrdered, setCardOrdered] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')
  const [rechargeNet, setRechargeNet] = useState('orange')
  const [rechargeTel, setRechargeTel] = useState('')
  const [rechargeAmt, setRechargeAmt] = useState('1000')
  const [facture, setFacture] = useState('senelec')
  const [factureRef, setFactureRef] = useState('')
  const [factureAmt, setFactureAmt] = useState('')
  const [bankNom, setBankNom] = useState('')
  const [bankIban, setBankIban] = useState('')
  const [bankSwift, setBankSwift] = useState('')
  const [bankBanque, setBankBanque] = useState('')
  const [bankRef, setBankRef] = useState('');
  const { themed } = useThemedStyles();

  /* ── Auth & Supabase data ── */
  const { membre } = useAuth()
  const userId = membre?.id || null
  const [balance, setBalance] = useState(0)
  const [txList, setTxList] = useState([])
  const [payDataLoading, setPayDataLoading] = useState(false)
  const [savings, setSavings] = useState(null)
  const [savingMode, setSavingMode] = useState('round_500')
  const [savingTarget, setSavingTarget] = useState(100000)
  const [savingLock, setSavingLock] = useState('none')
  const [withdrawAmt, setWithdrawAmt] = useState('')

  useEffect(() => {
    if (!userId) return
    setPayDataLoading(true)
    Promise.all([
      getBalance(userId).then(setBalance),
      getTransactions(userId, { limit: 50 }).then(setTxList),
      getSavingsGoal(userId).then(s => { if (s) { setSavings(s); setSavingMode(s.mode); setSavingTarget(s.target_amount); setSavingLock(s.lock_period) } }),
    ]).finally(() => setPayDataLoading(false))
  }, [userId])

  /* ── Contacts persistants ── */
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abawi_pay_contacts') || 'null') || [] } catch { return [] }
  })
  const [contactModal, setContactModal] = useState(null) // null | 'add' | contact object
  const [contactForm, setContactForm] = useState({ name:'', tel:'', reseau:'Abawi Pay', note:'' })

  const chartReseauRef = useRef(null)
  const chartMoisRef = useRef(null)
  const chartsDrawn = useRef(false)
  const qrTimerRef = useRef(null)

  /* ── Fee calc ── */
  useEffect(() => {
    const amt = parseInt(montant) || 0
    if (selectedNet === 'Abawi Pay') {
      setFee(0); setFeeNote('0% entre comptes Abawi Pay'); setFeeWarn('')
    } else if (selectedNet === 'Virement bancaire') {
      setFee(Math.max(500, Math.round(amt * 0.005)))
      setFeeNote('0,5% — min 500 XOF'); setFeeWarn('Délai virement bancaire : 24-48h ouvrables')
    } else {
      setFee(Math.round(amt * 0.003))
      setFeeNote(`0,3% — Interopérabilité ${selectedNet}`)
      setFeeWarn(`Frais réseau ${selectedNet} appliqués`)
    }
  }, [montant, selectedNet])

  /* ── Intl calc ── */
  useEffect(() => {
    const amt = parseInt(intlAmount) || 0
    const f = Math.round(amt * 0.007)
    const recv = ((amt - f) * intlCountry.rate).toFixed(intlCountry.currency === 'XOF' ? 0 : 2)
    setIntlFee(f)
    setIntlRecv(amt ? `${parseFloat(recv).toLocaleString('fr-FR')} ${intlCountry.currency}` : '')
  }, [intlAmount, intlCountry])

  /* ── QR timer ── */
  const refreshQR = useCallback(() => {
    const tok = Math.random().toString(36).substring(2, 8).toUpperCase()
    setQrToken(tok)
    setQrCountdown(300)
    drawQR('qr-main', `ABW:USER:${tok}:${Date.now()}:HMAC-SHA256`)
  }, [])

  useEffect(() => {
    if (tab !== 'qr') return
    refreshQR()
    qrTimerRef.current = setInterval(() => {
      setQrCountdown(c => {
        if (c <= 1) { refreshQR(); return 300 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(qrTimerRef.current)
  }, [tab, refreshQR])

  /* ── QR receive ── */
  useEffect(() => {
    if (tab !== 'recevoir') return
    drawQR('qr-recv', `https://abawi.pay/r/LA7X9K2${recvAmount ? '?amt=' + recvAmount : ''}`)
  }, [tab, recvAmount])

  /* ── Charts ── */
  useEffect(() => {
    if (tab !== 'stats' || chartsDrawn.current) return
    chartsDrawn.current = true
    setTimeout(() => {
      const reseau = chartReseauRef.current
      const mois = chartMoisRef.current
      if (!reseau || !mois) return
      new Chart(reseau, {
        type: 'doughnut',
        data: {
          labels: ['Wave', 'Orange Money', 'Free Money', 'Abawi Pay', 'Virement', 'Carte'],
          datasets: [{ data: [32, 25, 12, 20, 6, 5], backgroundColor: ['#0039cb','#ff6d00','#d50000',resolveVar('--gold'),'#37474f','#6200ea'], borderWidth: 3, borderColor: resolveVar('--bg-card') }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12, color: resolveVar('--text-muted') } } } }
      })
      new Chart(mois, {
        type: 'bar',
        data: {
          labels: ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr'],
          datasets: [
            { label: 'Reçu',   data: [195000,310000,342000,280000,390000,520000], backgroundColor: resolveVar('--green'), borderRadius: 6 },
            { label: 'Envoyé', data: [110000,200000,178000,150000,220000,310000], backgroundColor: resolveVar('--gold'), borderRadius: 6 },
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { font: { size: 11 }, color: resolveVar('--text-muted') } } },
          scales: {
            y: { ticks: { callback: v => Math.round(v/1000)+'k', color: resolveVar('--text-muted') }, grid: { color: resolveVar('--border') } },
            x: { ticks: { color: resolveVar('--text-muted') }, grid: { color: resolveVar('--border') } }
          }
        }
      })
    }, 100)
  }, [tab])

  /* ── Helpers ── */
  async function handleSend() {
    if (!destInput || !montant) return alert('Remplis le destinataire et le montant')
    setPayLoading(true); setPayError('')
    try {
      const result = await sendPayment({ amount: parseInt(montant), phone: destInput, network: selectedNet, description: note || `Envoi ABAWI · ${selectedNet}` })
      const ref = result?.reference || result?.token || ('ABW-' + Date.now().toString().slice(-6))

      // Record transaction in Supabase
      if (userId) {
        await recordTransaction({
          userId,
          type: 'send',
          amount: parseInt(montant),
          fee,
          status: result?.checkout_url ? 'pending' : 'completed',
          description: note || `Envoi ABAWI · ${selectedNet}`,
          reference: ref,
          recipientPhone: destInput,
          recipientName: '',
          network: selectedNet,
          metadata: { checkout_url: result?.checkout_url || null, simulated: !!result?.simulated }
        })
        // Refresh balance & transactions
        const newBal = await getBalance(userId)
        const newTx = await getTransactions(userId, { limit: 50 })
        setBalance(newBal)
        setTxList(newTx)
      }

      // If PayDunya checkout URL, redirect
      if (result?.checkout_url) {
        window.location.href = result.checkout_url
        return
      }
      setSendConfirmed({ dest: destInput, amt: parseInt(montant), fee, ref, simulated: result?.simulated })
    } catch (e) { setPayError(e.message) }
    finally { setPayLoading(false) }
  }

  function fillContact(num) {
    setTab('envoyer')
    setTimeout(() => setDestInput(num), 80)
  }

  function saveContacts(cs) {
    setContacts(cs)
    localStorage.setItem('abawi_pay_contacts', JSON.stringify(cs))
  }
  function addContact() {
    const { name, tel, reseau, note } = contactForm
    if (!name.trim() || !tel.trim()) return
    const c = CONTACT_COLORS[contacts.length % CONTACT_COLORS.length]
    const init = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const nc = { id: Date.now(), init, name: name.trim(), tel: tel.trim(), reseau, note, ...c, createdAt: new Date().toISOString() }
    saveContacts([...contacts, nc])
    setContactForm({ name:'', tel:'', reseau:'Abawi Pay', note:'' })
    setContactModal(null)
  }
  function deleteContact(id) {
    saveContacts(contacts.filter(c => c.id !== id))
    setContactModal(null)
  }

  function genRecvLink() {
    const code = 'ABW-' + Math.random().toString(36).substring(2, 7).toUpperCase()
    setRecvLink(`abawi.pay/r/${code}`)
    setRecvDisplay(recvAmount ? `${parseInt(recvAmount).toLocaleString('fr-FR')} XOF` : 'Montant libre')
    drawQR('qr-recv', `https://abawi.pay/r/${code}${recvAmount ? '?amt=' + recvAmount : ''}${recvMsg ? '&m=' + encodeURIComponent(recvMsg) : ''}`)
  }

  function genCode() {
    if (!codeAmount) return alert('Saisis un montant')
    const c = Math.floor(1000 + Math.random() * 9000)
    setGeneratedCode({ code: c, exp: `Valide ${codeDuration} · Usage unique · ${parseInt(codeAmount).toLocaleString('fr-FR')} XOF` })
  }

  function fmtCountdown(s) {
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`
  }

  async function handleCardOrder() {
    if (!cardForm.nom || !cardForm.prenom || !cardForm.adresse || !cardForm.tel) {
      return alert('Veuillez remplir tous les champs')
    }
    const prices = { standard: 2500, gold: 5000, premium: 9900 }
    const labels = { standard: 'Carte Abawi Pay Standard', gold: 'Carte Abawi Pay Gold', premium: 'Carte Abawi Pay Premium' }
    if (!await isPaydunyaConfigured()) {
      const wa = waLink(labels[cardType], prices[cardType])
      window.open(wa, '_blank')
      return
    }
    setPayLoading(true); setPayError('')
    try {
      const result = await createInvoice({
        title: labels[cardType], amount: prices[cardType], method: 'wave',
        productId: `card-${cardType}`, productType: 'physical-card',
        returnUrl: `${window.location.origin}/abawi-pay?card=success`,
        cancelUrl: window.location.href,
        customerPhone: cardForm.tel,
      })
      if (result?.url) window.location.href = result.url
    } catch (e) {
      setPayError(e.message || 'Erreur. Commande via WhatsApp ci-dessous.')
    }
    setPayLoading(false)
  }

  /* ── Stats pre-computation ── */
  const totalSent = txList.filter(t => t.type === 'send' && t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0)
  const totalReceived = txList.filter(t => t.type === 'receive' && t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0)
  const totalFees = txList.filter(t => t.status === 'completed').reduce((s, t) => s + Number(t.fee), 0)
  const completedCount = txList.filter(t => t.status === 'completed').length

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="ap-root" style={{ paddingTop: stickyH }}>
      <SEO
        title="ABAWI Pay — Portefeuille Mobile & Paiements"
        description="Portefeuille mobile ABAWI Pay : envoi et réception d'argent, paiement de factures, objectifs d'épargne, QR code et historique de transactions."
        keywords="mobile money, portefeuille mobile, paiement mobile Sénégal, Wave, Orange Money, Free Money, ABAWI Pay"
        image="/abawi-og-banner.jpg"
      />

      {/* Header + Nav — fixed to viewport, immune to page-content translateY animation */}
      <div ref={stickyRef} className="ap-sticky-top" style={{ position: 'fixed', top: navbarH, left: 0, right: 0, zIndex: 100 }}>
        <div className="ap-header">
          <div className="ap-logo-wrap">
            <AbawiPayIcon size={34} />
            <div className="ap-logo-text">
              Abawi<span className="ap-logo-accent">Pay</span>
              <span className="ap-badge">PREMIUM</span>
            </div>
          </div>
          <div className="ap-header-right">
            <button className="ap-notif-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div className="ap-notif-dot" />
            </button>
            <div className="ap-avatar" style={themed({background: 'var(--accent3)', color: 'var(--accent)'})}>LA</div>
          </div>
        </div>

        {/* Tabs nav */}
        <div className="ap-nav">
          {TABS.map(t => (
            <button key={t.id} className={`ap-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACCUEIL ── */}
      {tab === 'accueil' && (
        <div className="ap-section">
          <div className="ap-balance-card surface-dark">
            <div className="ap-bal-header">
              <div className="ap-bal-label">Solde disponible</div>
              <button className="ap-bal-eye" title="Masquer le solde">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div className="ap-bal-amount">{balance.toLocaleString('fr-FR')} <span className="ap-bal-currency">XOF</span></div>
            <div className="ap-bal-sub">Mis à jour il y a 2 min · <span style={{ color:'#22c55e' }}>0% frais Abawi↔Abawi</span></div>
            <div className="ap-bal-stats">
              <div><div className="ap-bal-stat-label">Reçu</div><div className="ap-bal-stat-val pos">+{txList.filter(t => t.type === 'receive' && t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0).toLocaleString('fr-FR')}</div></div>
              <div><div className="ap-bal-stat-label">Envoyé</div><div className="ap-bal-stat-val neg">-{txList.filter(t => t.type === 'send' && t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0).toLocaleString('fr-FR')}</div></div>
              <div><div className="ap-bal-stat-label">Épargne</div><div className="ap-bal-stat-val neutral">{balance.toLocaleString('fr-FR')}</div></div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="ap-quick-grid">
            {[
              { icon: '📤', label: 'Envoyer',  color: 'rgba(245,197,24,0.1)',  tab: 'envoyer' },
              { icon: '📥', label: 'Recevoir', color: 'rgba(0,200,83,0.1)',    tab: 'recevoir' },
              { icon: '🌍', label: 'Intl',     color: 'rgba(0,120,255,0.1)',   tab: 'international' },
              { icon: <QRPayIcon size={22} color="#FF6B00" />, label: 'QR Pay', color: 'rgba(255,107,0,0.1)', tab: 'qr' },
              { icon: '📱', label: 'Recharge', color: 'rgba(255,71,87,0.1)',   tab: 'recharge' },
              { icon: '⚡', label: 'Factures', color: 'rgba(245,197,24,0.1)',  tab: 'factures' },
              { icon: '💳', label: 'Carte',    color: 'rgba(98,0,234,0.1)',    tab: 'carte' },
              { icon: '💰', label: 'Épargne',  color: 'rgba(0,200,83,0.1)',    tab: 'epargne' },
            ].map(q => (
              <button key={q.tab} className="ap-quick-btn" onClick={() => setTab(q.tab)}>
                <div className="ap-quick-icon" style={themed({ background: q.color })}>{q.icon}</div>
                <p>{q.label}</p>
              </button>
            ))}
          </div>

          {/* Premium banner */}
          <div className="ap-premium-banner surface-dark">
            <div className="ap-premium-icon">👑</div>
            <div>
              <div className="ap-premium-title">Abawi Pay Premium</div>
              <div className="ap-premium-sub">Transferts illimités · QR chiffré · Épargne auto · Support prioritaire 24/7</div>
            </div>
            <span className="ap-pill ap-pill-yellow" style={themed({ marginLeft:'auto', flexShrink:0, background: 'var(--gold-glow)', color: 'var(--gold)' })}>Actif</span>
          </div>

          {/* Card visual — format crédit card (recto) */}
          <div className="ap-card-visual surface-dark">
            <div className="ap-card-top-row">
              <div className="ap-card-chip" />
              <span className="ap-card-nfc" title="Sans contact">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5a7 7 0 0 1 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M8 12.5a4 4 0 0 1 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="12" cy="12.5" r="1.2" fill="currentColor"/>
                </svg>
              </span>
            </div>
            <div className="ap-card-num">•••• •••• •••• 7842</div>
            <div className="ap-card-bottom-row">
              <div>
                <div style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.5)', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>Titulaire</div>
                <div className="ap-card-name">VOTRE NOM</div>
                <div style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.5)', letterSpacing:1, marginTop:2 }}>Exp. 04/29</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                <AbawiPayIcon size={26} />
                <div className="ap-card-brand">ABAWI PAY</div>
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="ap-section-label" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Contacts fréquents</span>
            {contacts.length > 0 && <span style={{ fontSize:'0.75rem', color:'var(--ap-grey)', fontWeight:600 }}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>}
          </div>
          <div className="ap-contacts-scroll">
            {contacts.map(c => (
              <div key={c.id} className="ap-contact-item-wrap">
                <button className="ap-contact-item" onClick={() => fillContact(c.tel)}>
                  <div className="ap-contact-avatar" style={{ background: c.bg, color: c.color }}>{c.init}</div>
                  <div className="ap-contact-name">{c.name.split(' ')[0]}</div>
                </button>
                <button className="ap-contact-more" onClick={() => setContactModal(c)} title="Voir profil">⋯</button>
              </div>
            ))}
            <button className="ap-contact-item" onClick={() => { setContactForm({ name:'', tel:'', reseau:'Abawi Pay', note:'' }); setContactModal('add') }}>
              <div className="ap-contact-avatar" style={{ background:'var(--ap-card)', color:'var(--ap-grey)', fontSize:22, border:'2px dashed var(--ap-border)' }}>+</div>
              <div className="ap-contact-name">Ajouter</div>
            </button>
          </div>

          {/* Recent transactions */}
          <div className="ap-section-label">Transactions récentes</div>
          <div className="ap-card">
            {payDataLoading && <div style={{padding:12,color:'var(--ap-grey)',fontSize:13}}>Chargement...</div>}
            {!payDataLoading && txList.length === 0 && (
              <div style={{padding:12,color:'var(--ap-grey)',fontSize:13}}>Aucune transaction. Connectez-vous pour voir votre historique.</div>
            )}
            {txList.slice(0, 4).map(tx => (
              <div key={tx.id} className="ap-tx-item">
                <div className="ap-tx-icon">
                  {tx.type === 'receive' ? '💰' : tx.type === 'send' ? '📤' : tx.type === 'marchand' ? '🛒' : tx.type === 'intl' ? '🌍' : '📱'}
                </div>
                <div className="ap-tx-info">
                  <div className="ap-tx-name">{tx.description || tx.type}</div>
                  <div className="ap-tx-meta">{tx.network || 'Abawi Pay'} · {new Date(tx.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="ap-tx-right">
                  <div className={`ap-tx-amount ${tx.type === 'receive' ? 'pos' : 'neg'}`}>
                    {tx.type === 'receive' ? '+' : '-'}{Number(tx.amount).toLocaleString('fr-FR')} XOF
                  </div>
                  <div className="ap-tx-fee">{tx.fee > 0 ? `${Number(tx.fee).toLocaleString('fr-FR')} XOF frais` : '0 XOF frais'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ENVOYER ── */}
      {tab === 'envoyer' && (
        <div className="ap-section">
          {!sendConfirmed ? (
            <>
              <div className="ap-steps">
                <div className="ap-step active">1</div>
                <div className="ap-step-line" />
                <div className="ap-step">2</div>
                <div className="ap-step-line" />
                <div className="ap-step">3</div>
              </div>
              <div className="ap-card">
                <div className="ap-card-title">📤 Envoyer de l'argent</div>
                <div className="ap-card-sub">Local · Instantané · Sans frais entre comptes Abawi</div>

                <div className="ap-section-label" style={{ marginBottom:10 }}>Réseau destinataire</div>
                <div className="ap-net-grid">
                  {[
                    { id:'Abawi Pay',      dot:'var(--gold)', label:'Abawi Pay',  textColor:'var(--text-on-gold)' },
                    { id:'Wave',           dot:'#0039cb', label:'Wave',        textColor:'#fff' },
                    { id:'Orange Money',   dot:'#ff6d00', label:'Orange Money', textColor:'#fff' },
                    { id:'Free Money',     dot:'#d50000', label:'Free Money',  textColor:'#fff' },
                    { id:'Expresso',       dot:'#6200ea', label:'Expresso',    textColor:'#fff' },
                    { id:'Virement bancaire', dot:'#37474f', label:'Banque',   textColor:'#fff' },
                  ].map(n => (
                    <button key={n.id} className={`ap-net-btn${selectedNet === n.id ? ' selected' : ''}`} onClick={() => setSelectedNet(n.id)}>
                      <NetLogo id={n.id} size={30} />
                      <p>{n.label}</p>
                    </button>
                  ))}
                </div>

                {selectedNet === 'Virement bancaire' ? (<>
                  <div className="ap-input-group">
                    <label>Nom du titulaire du compte</label>
                    <input value={bankNom} onChange={e => setBankNom(e.target.value)} placeholder="Ex: Lamine Diallo" />
                  </div>
                  <div className="ap-input-group">
                    <label>IBAN / Numéro de compte</label>
                    <input value={bankIban} onChange={e => setBankIban(e.target.value)} placeholder="Ex: SN76 XXXX XXXX XXXX XXXX XXXX" style={{ letterSpacing: '0.5px' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="ap-input-group">
                      <label>Code SWIFT / BIC</label>
                      <input value={bankSwift} onChange={e => setBankSwift(e.target.value.toUpperCase())} placeholder="Ex: CBSNSNDA" style={{ letterSpacing: '1px', fontFamily:'monospace' }} />
                    </div>
                    <div className="ap-input-group">
                      <label>Nom de la banque</label>
                      <input value={bankBanque} onChange={e => setBankBanque(e.target.value)} placeholder="Ex: Ecobank Sénégal" />
                    </div>
                  </div>
                  <div className="ap-input-group">
                    <label>Montant (XOF)</label>
                    <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 100 000" />
                  </div>
                  <div className="ap-input-group">
                    <label>Référence / Motif du virement</label>
                    <input value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="Ex: Facture 2024-042 — Prestation conseil" />
                  </div>
                </>) : (<>
                  <div className="ap-input-group">
                    <label>Destinataire (numéro, @tag ou nom)</label>
                    <input value={destInput} onChange={e => setDestInput(e.target.value)} placeholder="Ex: 77 123 45 67 ou @mamadou" />
                  </div>
                  <div className="ap-input-group">
                    <label>Montant (XOF)</label>
                    <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex: 25 000" />
                  </div>
                  <div className="ap-input-group">
                    <label>Note (optionnel)</label>
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Loyer avril" />
                  </div>
                </>)}

                <div className="ap-fee-box">
                  <div>
                    <div className="ap-fee-label">Frais de transaction</div>
                    <div className="ap-fee-note">{feeNote}</div>
                  </div>
                  <div className="ap-fee-val">{fee.toLocaleString('fr-FR')} XOF</div>
                </div>
                {feeWarn && (
                  <div className="ap-fee-warn">⚡ {feeWarn}</div>
                )}
                {payError && <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', fontSize:13 }}>{payError}</div>}
                {!getAvailableProviders().hasAny && <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>⚠️ Mode simulation — configurez PayDunya ou Wave dans Santé API pour activer les vrais paiements</div>}
                <button className="ap-btn-primary" onClick={handleSend} disabled={payLoading}>{payLoading ? '⏳ Traitement en cours...' : 'ENVOYER MAINTENANT →'}</button>
              </div>
              <div className="ap-ussd-card">
                <div className="ap-section-label" style={{ marginBottom:8 }}>Accès USSD (sans internet)</div>
                <div className="ap-ussd-code">*888#</div>
                <div style={{ fontSize:12, color:'var(--ap-grey)', marginTop:6 }}>Disponible sur tous les réseaux · Fonctionne sur tout téléphone</div>
              </div>
            </>
          ) : (
            <div className="ap-confirm-box">
              <div className="ap-confirm-icon">✅</div>
              <div className="ap-confirm-title">{sendConfirmed.amt.toLocaleString('fr-FR')} XOF envoyés à {sendConfirmed.dest}</div>
              <div className="ap-confirm-ref">Réf: {sendConfirmed.ref} · Frais: {sendConfirmed.fee?.toLocaleString('fr-FR') || 0} XOF{sendConfirmed.simulated ? ' · Mode simulation' : ''}</div>
              <button className="ap-btn-primary" onClick={() => { setSendConfirmed(null); setDestInput(''); setMontant(''); setNote('') }}>NOUVEAU TRANSFERT</button>
              <button className="ap-btn-secondary" onClick={() => setTab('historique')}>VOIR HISTORIQUE</button>
            </div>
          )}
        </div>
      )}

      {/* ── INTERNATIONAL ── */}
      {tab === 'international' && (
        <div className="ap-section">
          <div className="ap-card">
            <div className="ap-card-title">🌍 Transfert international</div>
            <div className="ap-card-sub">Taux concurrentiels · Livraison &lt;24h · Frais ≤ 0,7%</div>

            <div className="ap-section-label" style={{ marginBottom:10 }}>Pays destinataire</div>
            <div className="ap-flag-grid">
              {[
                { flag:'🇨🇮', name:'Côte d\'Ivoire', code:'CI', currency:'XOF', rate:1 },
                { flag:'🇲🇱', name:'Mali',           code:'ML', currency:'XOF', rate:1 },
                { flag:'🇬🇳', name:'Guinée',         code:'GN', currency:'GNF', rate:13.5 },
                { flag:'🇬🇭', name:'Ghana',          code:'GH', currency:'GHS', rate:0.0068 },
                { flag:'🇳🇬', name:'Nigeria',        code:'NG', currency:'NGN', rate:2.6 },
                { flag:'🇲🇦', name:'Maroc',          code:'MA', currency:'MAD', rate:0.018 },
                { flag:'🇫🇷', name:'France',         code:'FR', currency:'EUR', rate:0.00153 },
                { flag:'🇺🇸', name:'USA',            code:'US', currency:'USD', rate:0.00166 },
                { flag:'🇨🇦', name:'Canada',         code:'CA', currency:'CAD', rate:0.00225 },
                { flag:'🇬🇧', name:'Royaume-Uni',    code:'GB', currency:'GBP', rate:0.00131 },
                { flag:'🇨🇲', name:'Cameroun',       code:'CM', currency:'XAF', rate:1 },
                { flag:'🇸🇳', name:'Sénégal',        code:'SN', currency:'XOF', rate:1 },
              ].map(c => (
                <button key={c.code} className={`ap-flag-btn${intlCountry.code === c.code ? ' selected' : ''}`}
                  onClick={() => setIntlCountry(c)}>
                  <span className="ap-flag-emoji">{c.flag}</span>
                  <span className="ap-flag-name">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="ap-rate-box">
              <div>
                <div className="ap-rate-label">Taux de change</div>
                <div style={{ fontSize:12, color:'var(--ap-grey)', marginTop:3 }}>
                  1 XOF = {intlCountry.rate} {intlCountry.currency}
                </div>
              </div>
              <div className="ap-rate-val">{intlCountry.currency}</div>
            </div>

            <div className="ap-input-group">
              <label>Montant à envoyer (XOF)</label>
              <input type="number" value={intlAmount} onChange={e => setIntlAmount(e.target.value)} placeholder="Ex: 100 000" />
            </div>
            <div style={{ textAlign:'center', color:'var(--ap-yellow)', fontSize:20, margin:'8px 0' }}>⬇️</div>
            <div className="ap-input-group">
              <label>Le destinataire reçoit</label>
              <input value={intlRecv} readOnly placeholder="—"
                style={{ background:'#0f0f0f', color:'var(--ap-yellow)', fontWeight:700 }} />
            </div>
            <div className="ap-input-group">
              <label>Numéro / IBAN / Mobile Money destinataire</label>
              <input placeholder="Ex: +225 07 12 34 56 78" />
            </div>

            <div className="ap-fee-box">
              <div>
                <div className="ap-fee-label">Frais transfert international</div>
                <div className="ap-fee-note">0,7% — Taux le plus bas d'Afrique de l'Ouest</div>
              </div>
              <div className="ap-fee-val">{intlFee.toLocaleString('fr-FR')} XOF</div>
            </div>
            <div className="ap-fee-warn">ℹ️ Délai estimé : <strong>15 min à 24h</strong> selon pays et réseau</div>
            <button className="ap-btn-primary" onClick={() => alert('Transfert soumis ! Réf: INTL-ABW-' + Math.floor(Math.random()*99999))}>
              ENVOYER À L'INTERNATIONAL →
            </button>
          </div>

          <div className="ap-revenue-model">
            <div className="ap-section-label" style={{ marginBottom:12 }}>📊 Tarification transparente</div>
            {[
              ['Abawi → Abawi',         'Instantané · Illimité',         '0% GRATUIT'],
              ['Abawi → Wave / OM / FM','Interopérabilité locale',       '0,3%'],
              ['Paiement marchand',      'E-commerce · POS · QR',        '0,7%'],
              ['Transfert international','Zone UEMOA + monde',           '0,7%'],
              ['Recharge téléphone',     'Orange · Free · Expresso',     '0%'],
              ['Abawi Pay Premium',      'Abonnement mensuel',           '990 XOF/mois'],
            ].map(([type, note, rate]) => (
              <div key={type} className="ap-revenue-row">
                <div>
                  <div className="ap-revenue-type">{type}</div>
                  <div className="ap-revenue-note">{note}</div>
                </div>
                <div className="ap-revenue-rate">{rate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECEVOIR ── */}
      {tab === 'recevoir' && (
        <div className="ap-section">
          <div className="ap-card">
            <div className="ap-card-title">📥 Recevoir de l'argent</div>
            <div className="ap-card-sub">Génère un lien ou QR pour recevoir instantanément</div>
            <div className="ap-input-group">
              <label>Montant à recevoir (optionnel)</label>
              <input type="number" value={recvAmount} onChange={e => setRecvAmount(e.target.value)} placeholder="Laisser vide pour montant libre" />
            </div>
            <div className="ap-input-group">
              <label>Message (optionnel)</label>
              <input value={recvMsg} onChange={e => setRecvMsg(e.target.value)} placeholder="Ex: Remboursement repas" />
            </div>
            <button className="ap-btn-primary" onClick={genRecvLink} style={{ marginBottom:14 }}>GÉNÉRER MON LIEN →</button>

            <div className="ap-qr-wrap">
              <div className="ap-bal-label" style={{ marginBottom:14 }}>Votre QR de paiement</div>
              <div className="ap-qr-box"><canvas id="qr-recv" width="160" height="160" /></div>
              <div style={{ marginTop:14 }}>
                <div className="ap-bal-label">Montant</div>
                <div className="ap-bal-amount" style={{ fontSize:22, margin:'4px 0 10px' }}>{recvDisplay}</div>
                <div className="ap-qr-link">{recvLink}</div>
              </div>
              <div className="ap-share-row">
                {[
                  { label:'📋 Copier',       action: () => navigator.clipboard.writeText(recvLink).then(() => alert('Lien copié !')) },
                  { label:'💬 WhatsApp',     action: () => window.open(`https://wa.me/?text=${encodeURIComponent('Paiement Abawi Pay : https://' + recvLink)}`) },
                  { label:'📱 SMS',          action: () => alert('SMS envoyé !') },
                  { label:'⬇️ Télécharger', action: () => {
                    const c = document.getElementById('qr-recv')
                    if (!c) return
                    const a = document.createElement('a'); a.download='abawi-pay-qr.png'; a.href=c.toDataURL(); a.click()
                  }},
                ].map(s => (
                  <button key={s.label} className="ap-share-pill" onClick={s.action}>{s.label}</button>
                ))}
              </div>
            </div>

            <div className="ap-ussd-card">
              <div className="ap-section-label" style={{ marginBottom:8 }}>Mon identifiant Abawi Pay</div>
              <div className="ap-ussd-code" style={{ color:'var(--ap-yellow)' }}>@lamine.abawi</div>
              <div style={{ fontSize:12, color:'var(--ap-grey)', marginTop:6 }}>
                Partagez votre @tag ou votre numéro : 221 77 000 0000
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QR PAY ── */}
      {tab === 'qr' && (
        <div className="ap-section">
          <div className="ap-qr-wrap" style={{ marginBottom:16 }}>
            <div className="ap-card-title" style={{ marginBottom:4 }}>⬛ QR Code Personnel</div>
            <div style={{ fontSize:12, color:'var(--ap-grey)', marginBottom:18 }}>Chiffré AES-256 · HMAC-SHA256 · Renouvellement automatique</div>
            <div className="ap-qr-box"><canvas id="qr-main" width="180" height="180" /></div>
            <div className="ap-qr-refresh-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Renouvellement dans <span className="ap-qr-timer">{fmtCountdown(qrCountdown)}</span>
            </div>
            <div style={{ marginTop:10 }}>
              <div className="ap-bal-label" style={{ marginBottom:4 }}>Token actuel</div>
              <div className="ap-qr-token">{qrToken}</div>
            </div>
            <div className="ap-share-row" style={{ marginTop:14 }}>
              <button className="ap-share-pill" onClick={refreshQR}>🔄 Rafraîchir</button>
              <button className="ap-share-pill" onClick={() => {
                const c = document.getElementById('qr-main')
                if (!c) return
                const a = document.createElement('a'); a.download='abawi-pay-qr.png'; a.href=c.toDataURL(); a.click()
              }}>⬇️ Sauvegarder</button>
            </div>
          </div>

          <div className="ap-card">
            <div className="ap-card-title">📷 Scanner un QR</div>
            <div className="ap-card-sub">Pointez la caméra vers le QR Abawi Pay du destinataire — détection automatique</div>
            <QRScanner onResult={val => { if (val && val.length >= 4) alert('✅ QR validé : ' + val + '\nPaiement débité.') }} />
          </div>

          <div className="ap-card">
            <div className="ap-section-label" style={{ marginBottom:12 }}>🔐 Sécurité Abawi Pay</div>
            {[
              ['🛡️', 'Chiffrement AES-256',        'Chaque QR est chiffré de bout en bout'],
              ['⏱️', 'QR dynamique — 5 minutes',    'Impossible de rejouer une capture d\'écran'],
              ['🔑', 'HMAC-SHA256',                  'Signature cryptographique de chaque transaction'],
              ['✅', 'Certification PCI-DSS',        'Standard international de sécurité des paiements'],
              ['👁️', 'Anti-fraude en temps réel',    'Détection d\'anomalies par IA'],
              ['🔒', 'PIN + Biométrie',              'Double authentification pour chaque paiement'],
            ].map(([ic, title, sub]) => (
              <div key={title} className="ap-security-item">
                <div className="ap-sec-icon">{ic}</div>
                <div>
                  <div className="ap-sec-text">{title}</div>
                  <div className="ap-sec-sub">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CODE SECRET ── */}
      {tab === 'code' && (
        <div className="ap-section">
          <div className="ap-card">
            <div className="ap-card-title">🔑 Code de paiement secret</div>
            <div className="ap-card-sub">Code court valable sur Wave, OM, Free Money, USSD *888#</div>
            <div className="ap-input-group">
              <label>Montant (XOF)</label>
              <input type="number" value={codeAmount} onChange={e => setCodeAmount(e.target.value)} placeholder="Ex: 10 000" />
            </div>
            <div className="ap-input-group">
              <label>Durée de validité</label>
              <select value={codeDuration} onChange={e => setCodeDuration(e.target.value)}>
                {['5 minutes','15 minutes','30 minutes','1 heure','24 heures'].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="ap-input-group">
              <label>Restreindre à (optionnel)</label>
              <input placeholder="Numéro ou @tag du destinataire" />
            </div>
            <button className="ap-btn-primary" onClick={genCode}>GÉNÉRER MON CODE →</button>

            {generatedCode && (
              <div style={{ marginTop:16 }}>
                <div className="ap-alert-success">✅ Code généré avec succès</div>
                <div className="ap-code-display">{generatedCode.code}</div>
                <div style={{ textAlign:'center', fontSize:12, color:'var(--ap-grey)', marginBottom:14 }}>{generatedCode.exp}</div>
                <div className="ap-share-row">
                  {[
                    { label:'📋 Copier',    action: () => navigator.clipboard.writeText(String(generatedCode.code)).then(() => alert('Code copié !')) },
                    { label:'📱 SMS',       action: () => alert('Code envoyé par SMS !') },
                    { label:'💬 WhatsApp',  action: () => alert('Code partagé sur WhatsApp !') },
                  ].map(s => <button key={s.label} className="ap-share-pill" onClick={s.action}>{s.label}</button>)}
                </div>
                <div className="ap-ussd-card" style={{ marginTop:14 }}>
                  <div className="ap-bal-label">Validation USSD</div>
                  <div className="ap-ussd-code" style={{ fontSize:16, marginTop:4 }}>*888*2*{generatedCode.code}#</div>
                  <div style={{ fontSize:11, color:'var(--ap-grey)', marginTop:6 }}>Compatible tous réseaux · Fonctionne sans smartphone</div>
                </div>
              </div>
            )}
          </div>

          <div className="ap-card">
            <div className="ap-card-title">💳 Payer avec un code</div>
            <div className="ap-card-sub">Saisir le code fourni par l'envoyeur</div>
            <div className="ap-input-group">
              <label>Code de paiement (4 à 6 chiffres)</label>
              <input id="pay-code-2" type="number" placeholder="Ex: 7842" />
            </div>
            <button className="ap-btn-green" onClick={() => alert('✅ Paiement validé avec succès !')}>VALIDER LE CODE →</button>
          </div>
        </div>
      )}

      {/* ── RECHARGE MOBILE — Fallback WhatsApp ── */}
      {tab === 'recharge' && (
        <div className="ap-section">
          <div className="ap-card">
            <div className="ap-card-title">📱 Recharge téléphone</div>
            <div className="ap-card-sub">Service temporairement via WhatsApp — 0% frais</div>
            <div style={{ padding:'16px', background:'rgba(245,197,24,0.06)', borderRadius:12, border:'1px solid rgba(245,197,24,0.15)', marginBottom:16 }}>
              <div style={{ fontSize:13, color:'var(--ap-grey)', lineHeight:1.6 }}>
                ⚡ <strong style={{ color:'var(--ap-yellow)' }}>Recharge instantanée</strong> disponible via notre service WhatsApp.<br/>
                Envoyez : <em>Numéro + Montant + Opérateur</em> et nous rechargerons sous 2 min.
              </div>
            </div>
            <a href={waLink('Recharge téléphone', 0)} target="_blank" rel="noopener noreferrer" className="ap-btn-primary" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, textDecoration:'none' }}>
              💬 Commander via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── FACTURES — Fallback WhatsApp ── */}
      {tab === 'factures' && (
        <div className="ap-section">
          <div className="ap-card">
            <div className="ap-card-title">⚡ Paiement de factures</div>
            <div className="ap-card-sub">Service temporairement via WhatsApp — 0% frais</div>
            <div style={{ padding:'16px', background:'rgba(245,197,24,0.06)', borderRadius:12, border:'1px solid rgba(245,197,24,0.15)', marginBottom:16 }}>
              <div style={{ fontSize:13, color:'var(--ap-grey)', lineHeight:1.6 }}>
                📋 <strong style={{ color:'var(--ap-yellow)' }}>Paiement de factures</strong> disponible via WhatsApp.<br/>
                Envoyez : <em>Type (SENELEC/Woyofal/etc.) + Référence + Montant</em> et nous payons sous 5 min.
              </div>
            </div>
            <a href={waLink('Paiement facture', 0)} target="_blank" rel="noopener noreferrer" className="ap-btn-primary" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, textDecoration:'none' }}>
              💬 Payer via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── CARTE PHYSIQUE ── */}
      {tab === 'carte' && (
        <div className="ap-section">
          {!cardOrdered ? (
            <>
              <div className="ap-card">
                <div className="ap-card-title">💳 Commander votre carte Abawi Pay</div>
                <div className="ap-card-sub">Carte physique · Livraison à domicile · Acceptée partout</div>

                {/* Card options */}
                <div className="ap-section-label" style={{ marginBottom:10 }}>Choisir votre carte</div>
                <div style={{ display:'grid', gap:10, marginBottom:20 }}>
                  {[
                    { id:'standard', name:'Standard',  price:'2 500 XOF', features:['Paiements locaux','Retraits DAB','Paiements en ligne'], color:'#37474f', textColor:'#ccc' },
                    { id:'gold',     name:'Gold',       price:'5 000 XOF', features:['Tout Standard +','Paiements internationaux','Cashback 0,5%','Support prioritaire'], color:'#c8860a', textColor:'#ffe082', popular: true },
                    { id:'premium',  name:'Premium',    price:'9 900 XOF', features:['Tout Gold +','Assurance voyage incluse','Lounge aéroport','Cashback 1%','Métal brossé'], color:'#212121', textColor:'#f5c518' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setCardType(opt.id)} className="ap-card-option"
                      style={{ border:`2px solid ${cardType === opt.id ? 'var(--ap-yellow)' : 'var(--ap-border)'}`, background: cardType === opt.id ? 'var(--ap-yellow-soft)' : 'var(--ap-card)' }}>
                      {opt.popular && <span className="ap-pill ap-pill-yellow" style={{ position:'absolute', top:12, right:12 }}>Populaire</span>}
                      {/* Recto */}
                      <div className="ap-card-option-visual" style={{ background:`linear-gradient(135deg, ${opt.color}, #0a0a0a)` }}>
                        <div style={{ position:'absolute', top:'12%', left:'5%', right:'5%', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ width:'15%', aspectRatio:'1.3/1', background:'linear-gradient(135deg,#d4a017,#f5c518,#b8860b)', borderRadius:3, border:'1px solid rgba(255,255,255,0.15)' }} />
                          <AbawiPayIcon size={20} />
                        </div>
                        <div style={{ position:'absolute', top:'50%', left:'5%', transform:'translateY(-50%)', fontFamily:'Syne,monospace', fontSize:'clamp(6px,1.8vw,9px)', letterSpacing:2, color:'rgba(255,255,255,0.55)', fontWeight:700 }}>•••• •••• •••• 7842</div>
                        <div style={{ position:'absolute', bottom:'10%', left:'5%', right:'5%', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                          <div style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(6px,1.5vw,9px)', fontWeight:800, color:opt.textColor, letterSpacing:0.5, textTransform:'uppercase' }}>
                            {cardForm.prenom && cardForm.nom ? `${cardForm.prenom} ${cardForm.nom}`.toUpperCase() : 'VOTRE NOM'}
                          </div>
                          <div style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(5px,1.3vw,8px)', fontWeight:800, color:`${opt.textColor}99`, letterSpacing:1 }}>ABAWI {opt.name.toUpperCase()}</div>
                        </div>
                      </div>
                      {/* Verso */}
                      <div className="ap-card-option-visual" style={{ background:`linear-gradient(135deg, #0a0a0a, ${opt.color})`, marginTop:6 }}>
                        <div style={{ position:'absolute', top:'25%', left:0, right:0, height:'22%', background:'rgba(0,0,0,0.7)' }} />
                        <div style={{ position:'absolute', bottom:'18%', left:'5%', right:'5%', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.07)', borderRadius:3, marginRight:10 }} />
                          <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:4, padding:'2px 8px', fontFamily:'monospace', fontSize:'clamp(6px,1.5vw,9px)', color:'rgba(255,255,255,0.6)', letterSpacing:2 }}>CVV</div>
                        </div>
                        <div style={{ position:'absolute', bottom:'5%', left:'5%', right:'5%', fontSize:'clamp(4px,1vw,7px)', color:'rgba(255,255,255,0.25)', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:0.5 }}>ABAWI PAY · Visa / Mastercard · Acceptée partout</div>
                      </div>
                      <div className="ap-card-option-info">
                        <div>
                          <div style={{ fontWeight:800, color:'var(--ap-white)', marginBottom:4 }}>{opt.name}</div>
                          <div style={{ fontSize:13, color:'var(--ap-grey)' }}>{opt.features.join(' · ')}</div>
                        </div>
                        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'var(--ap-yellow)', whiteSpace:'nowrap' }}>{opt.price}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="ap-section-label" style={{ marginBottom:10 }}>Informations de livraison</div>
                {[
                  { label:'Prénom', key:'prenom', placeholder:'Ex: Lamine' },
                  { label:'Nom',    key:'nom',    placeholder:'Ex: Diallo' },
                  { label:'Adresse complète', key:'adresse', placeholder:'Ex: Rue 10, Almadies, Dakar' },
                  { label:'Ville', key:'ville', placeholder:'Ex: Dakar' },
                  { label:'Téléphone', key:'tel', placeholder:'Ex: 77 000 00 00' },
                ].map(f => (
                  <div key={f.key} className="ap-input-group">
                    <label>{f.label}</label>
                    <input value={cardForm[f.key]} onChange={e => setCardForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  </div>
                ))}

                <div className="ap-fee-box" style={{ marginTop:4 }}>
                  <div>
                    <div className="ap-fee-label">Livraison incluse dans le prix</div>
                    <div className="ap-fee-note">Délai : 3–5 jours ouvrables · Zone Dakar & Banlieue</div>
                  </div>
                  <div className="ap-fee-val">{cardType === 'standard' ? '2 500' : cardType === 'gold' ? '5 000' : '9 900'} XOF</div>
                </div>

                {payError && (
                  <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:16, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', fontSize:14 }}>{payError}</div>
                )}

                <button className="ap-btn-primary" onClick={handleCardOrder} disabled={payLoading}>
                  {payLoading ? '⏳ Traitement...' : 'COMMANDER MA CARTE →'}
                </button>
                <a href={waLink(`Carte Abawi Pay ${cardType}`, cardType === 'standard' ? 2500 : cardType === 'gold' ? 5000 : 9900)}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:12, borderRadius:10, background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.3)', color:'#25D366', fontWeight:700, fontSize:14, textDecoration:'none', marginTop:10 }}>
                  💬 Commander via WhatsApp
                </a>
              </div>

              <div className="ap-card">
                <div className="ap-section-label" style={{ marginBottom:12 }}>ℹ️ Informations carte</div>
                {[
                  ['🌐', 'Acceptée dans le monde entier', 'Réseau Visa/Mastercard · 50+ pays'],
                  ['💸', 'Retraits DAB', 'Tous les guichets automatiques du Sénégal et de l\'UEMOA'],
                  ['🛒', 'E-commerce', 'Paiements en ligne sécurisés avec 3D Secure'],
                  ['📱', 'Apple/Google Pay', 'Compatible NFC pour paiements sans contact'],
                  ['🔒', 'Blocage instantané', 'Bloquez et débloquez votre carte depuis l\'app en 1 clic'],
                  ['📊', 'Limites personnalisables', 'Définissez vos plafonds de dépenses'],
                ].map(([ic, title, sub]) => (
                  <div key={title} className="ap-security-item">
                    <div className="ap-sec-icon">{ic}</div>
                    <div>
                      <div className="ap-sec-text">{title}</div>
                      <div className="ap-sec-sub">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="ap-confirm-box">
              <div className="ap-confirm-icon">🎉</div>
              <div className="ap-confirm-title">Commande confirmée !</div>
              <div className="ap-confirm-ref">Votre carte Abawi Pay {cardType} est en route · Livraison 3–5 jours</div>
              <button className="ap-btn-primary" onClick={() => setCardOrdered(false)}>RETOUR</button>
            </div>
          )}
        </div>
      )}

      {/* ── ÉPARGNE ── */}
      {tab === 'epargne' && (
        <div className="ap-section">
          <div className="ap-epargne-card">
            <div className="ap-section-label" style={{ marginBottom:6 }}>💰 Mon Épargne Automatique</div>
            <div className="ap-bal-amount" style={{ fontSize:26, margin:'8px 0' }}>
              {(savings?.current_amount || 0).toLocaleString('fr-FR')} <span style={{ fontSize:14, color:'var(--ap-grey)' }}>XOF</span>
            </div>
            <div style={{ fontSize:11, color:'var(--ap-grey)' }}>
              Objectif : {(savingTarget || 100000).toLocaleString('fr-FR')} XOF · <span style={{ color:'var(--ap-green)' }}>{savings?.target_amount ? Math.min(100, Math.round((savings.current_amount / savings.target_amount) * 100)) : 0}% atteint</span>
            </div>
            <div className="ap-epargne-progress">
              <div className="ap-epargne-bar" style={{ width: `${savings?.target_amount ? Math.min(100, (savings.current_amount / savings.target_amount) * 100) : 0}%` }} />
            </div>
            <div style={{ display:'flex', gap:14, marginTop:8 }}>
              <div><div className="ap-bal-stat-label">Taux annuel</div><div className="ap-bal-stat-val neutral">{(savings?.interest_rate || 3.5).toFixed(1)}%</div></div>
              <div><div className="ap-bal-stat-label">Mode</div><div className="ap-bal-stat-val" style={{ color:'var(--ap-white)' }}>{savingMode === 'round_500' ? 'Arrondi 500' : savingMode === 'round_1000' ? 'Arrondi 1k' : savingMode === 'percent_5' ? '5%' : savingMode === 'percent_10' ? '10%' : 'Fixe'}</div></div>
              <div><div className="ap-bal-stat-label">Verrou</div><div className="ap-bal-stat-val" style={{ color:'var(--ap-white)' }}>{savingLock === 'none' ? 'Aucun' : savingLock}</div></div>
            </div>
          </div>

          <div className="ap-card">
            <div className="ap-card-title">Configurer l'épargne auto</div>
            <div className="ap-card-sub">Un montant est prélevé automatiquement à chaque transaction</div>
            <div className="ap-input-group">
              <label>Mode d'épargne</label>
              <select value={savingMode} onChange={e => setSavingMode(e.target.value)}>
                <option value="round_500">Arrondir à 500 XOF</option>
                <option value="round_1000">Arrondir à 1 000 XOF</option>
                <option value="percent_5">5% de chaque envoi</option>
                <option value="percent_10">10% de chaque envoi</option>
                <option value="fixed_monthly">Montant fixe mensuel</option>
              </select>
            </div>
            <div className="ap-input-group">
              <label>Objectif d'épargne (XOF)</label>
              <input type="number" value={savingTarget} onChange={e => setSavingTarget(Number(e.target.value))} placeholder="Ex: 500 000" />
            </div>
            <div className="ap-input-group">
              <label>Verrouillage (optionnel)</label>
              <select value={savingLock} onChange={e => setSavingLock(e.target.value)}>
                <option value="none">Disponible à tout moment</option>
                <option value="3m">Verrouillé 3 mois (+0.5%)</option>
                <option value="6m">Verrouillé 6 mois (+1%)</option>
                <option value="1y">Verrouillé 1 an (+2%)</option>
              </select>
            </div>
            <button className="ap-btn-primary" onClick={async () => {
              if (!userId) return alert('Connectez-vous pour configurer l\'épargne')
              if (savings?.id) {
                await updateSavingsGoal(savings.id, { mode: savingMode, target_amount: savingTarget, lock_period: savingLock })
              } else {
                const g = await createSavingsGoal({ userId, mode: savingMode, targetAmount: savingTarget, lockPeriod: savingLock })
                if (g) setSavings(g)
              }
              alert('Épargne automatique configurée !')
            }}>ACTIVER L'ÉPARGNE AUTO →</button>
          </div>

          <div className="ap-card">
            <div className="ap-card-title">Retirer mon épargne</div>
            <div className="ap-card-sub">Disponible à tout moment — sans pénalité</div>
            <div className="ap-input-group">
              <label>Montant à retirer</label>
              <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} placeholder={`Max ${(savings?.current_amount || 0).toLocaleString('fr-FR')} XOF disponibles`} />
            </div>
            <button className="ap-btn-secondary" onClick={async () => {
              if (!userId) return alert('Connectez-vous pour retirer')
              const amt = Number(withdrawAmt)
              if (!amt || amt > (savings?.current_amount || 0)) return alert('Montant invalide ou insuffisant')
              if (savings?.id) {
                await updateSavingsGoal(savings.id, { current_amount: savings.current_amount - amt })
                setSavings({ ...savings, current_amount: savings.current_amount - amt })
              }
              setWithdrawAmt('')
              alert('Retrait enregistré !')
            }}>RETIRER →</button>
          </div>
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {tab === 'historique' && (
        <div className="ap-section">
          <div className="ap-export-row">
            {[
              { label:'📄 Export PDF',     action: () => alert('Export PDF généré !') },
              { label:'📊 Export CSV',     action: () => alert('Export CSV généré !') },
              { label:'💬 WhatsApp',       action: () => alert('Rapport envoyé !') },
            ].map(b => <button key={b.label} className="ap-export-btn" onClick={b.action}>{b.label}</button>)}
          </div>

          <div className="ap-filter-tabs">
            {[
              { id:'all',      label:'Tout' },
              { id:'send',     label:'Envois' },
              { id:'recv',     label:'Reçus' },
              { id:'intl',     label:'International' },
              { id:'marchand', label:'Marchands' },
            ].map(f => (
              <button key={f.id} className={`ap-filter-tab${txFilter === f.id ? ' active' : ''}`} onClick={() => setTxFilter(f.id)}>{f.label}</button>
            ))}
          </div>

          <div className="ap-card" style={{ padding:'14px 16px' }}>
            {payDataLoading && <div style={{padding:12,color:'var(--ap-grey)',fontSize:13}}>Chargement...</div>}
            {!payDataLoading && txList.length === 0 && (
              <div style={{padding:12,color:'var(--ap-grey)',fontSize:13}}>Aucune transaction enregistrée.</div>
            )}
            {txList.filter(t => txFilter === 'all' || t.type === txFilter).map(tx => (
              <div key={tx.id} className="ap-tx-item">
                <div className="ap-tx-icon">
                  {tx.type === 'receive' ? '💰' : tx.type === 'send' ? '📤' : tx.type === 'marchand' ? '🛒' : tx.type === 'intl' ? '🌍' : '📱'}
                </div>
                <div className="ap-tx-info">
                  <div className="ap-tx-name">{tx.description || tx.type}</div>
                  <div className="ap-tx-meta">
                    {tx.network || 'Abawi Pay'} · {new Date(tx.created_at).toLocaleDateString('fr-FR')} <Pill label={tx.status} color={tx.status === 'completed' ? 'green' : tx.status === 'pending' ? 'yellow' : 'red'} />
                  </div>
                </div>
                <div className="ap-tx-right">
                  <div className={`ap-tx-amount ${tx.type === 'receive' ? 'pos' : 'neg'}`}>
                    {tx.type === 'receive' ? '+' : '-'}{Number(tx.amount).toLocaleString('fr-FR')} XOF
                  </div>
                  <div className="ap-tx-fee">{tx.fee > 0 ? `${Number(tx.fee).toLocaleString('fr-FR')} XOF frais` : '0 XOF frais'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {tab === 'stats' && (
        <div className="ap-section">
          <div className="ap-stat-grid">
            {[
              { label:'Volume envoyé', val:`${(totalSent/1000).toFixed(0)} k`, delta:'XOF total', color:'var(--ap-green)' },
              { label:'Transactions',  val:`${completedCount}`, delta:'terminées', color:'var(--ap-green)' },
              { label:'Frais payés', val:`${totalFees.toLocaleString('fr-FR')}`, delta:'XOF', color:'var(--ap-yellow)' },
              { label:'Reçu total', val:`${(totalReceived/1000).toFixed(0)} k`, delta:'XOF', color:'var(--ap-green)' },
            ].map(s => (
              <div key={s.label} className="ap-stat-card">
                <div className="ap-stat-label">{s.label}</div>
                <div className="ap-stat-val">{s.val}</div>
                <div style={{ fontSize:10, color:s.color, marginTop:4 }}>{s.delta}</div>
              </div>
            ))}
          </div>

          <div className="ap-card">
            <div className="ap-section-label" style={{ marginBottom:14 }}>Répartition par réseau</div>
            <canvas ref={chartReseauRef} height={180} />
          </div>
          <div className="ap-card">
            <div className="ap-section-label" style={{ marginBottom:14 }}>Activité mensuelle (XOF)</div>
            <canvas ref={chartMoisRef} height={180} />
          </div>
        </div>
      )}

      {/* ── Contact modal (add / view) ── */}
      {contactModal && (
        <div className="ap-overlay" onClick={() => setContactModal(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            {contactModal === 'add' ? (
              <>
                <div className="ap-modal-title">Nouveau contact</div>
                <div className="ap-modal-field">
                  <label>Nom complet *</label>
                  <input value={contactForm.name} onChange={e => setContactForm(p => ({...p, name: e.target.value}))} placeholder="Ex : Mamadou Diallo" />
                </div>
                <div className="ap-modal-field">
                  <label>Numéro / Compte *</label>
                  <input value={contactForm.tel} onChange={e => setContactForm(p => ({...p, tel: e.target.value}))} placeholder="Ex : 221771234567" />
                </div>
                <div className="ap-modal-field">
                  <label>Réseau préféré</label>
                  <select value={contactForm.reseau} onChange={e => setContactForm(p => ({...p, reseau: e.target.value}))}>
                    {['Abawi Pay','Wave','Orange Money','Free Money','MTN MoMo'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="ap-modal-field">
                  <label>Note (optionnel)</label>
                  <input value={contactForm.note} onChange={e => setContactForm(p => ({...p, note: e.target.value}))} placeholder="Ex : Fournisseur, ami…" />
                </div>
                <div className="ap-modal-actions">
                  <button className="ap-modal-btn ap-modal-btn--cancel" onClick={() => setContactModal(null)}>Annuler</button>
                  <button className="ap-modal-btn ap-modal-btn--save" onClick={addContact}>Enregistrer</button>
                </div>
              </>
            ) : (
              <>
                <div className="ap-modal-avatar" style={{ background: contactModal.bg, color: contactModal.color }}>{contactModal.init}</div>
                <div className="ap-modal-name">{contactModal.name}</div>
                <div className="ap-modal-sub">{contactModal.tel}</div>
                <span className="ap-modal-badge">{contactModal.reseau}</span>
                {contactModal.note && <p className="ap-modal-note">{contactModal.note}</p>}
                <div className="ap-modal-info-row">
                  <span>Ajouté le</span>
                  <span>{contactModal.createdAt ? new Date(contactModal.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
                </div>
                <div className="ap-modal-actions">
                  <button className="ap-modal-btn ap-modal-btn--danger" onClick={() => deleteContact(contactModal.id)}>Supprimer</button>
                  <button className="ap-modal-btn ap-modal-btn--save" onClick={() => { fillContact(contactModal.tel); setContactModal(null) }}>Envoyer →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
