import { useState, useEffect, useRef, useCallback } from 'react';
import * as QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import ToolHero from '../../components/ToolHero';
import ToolInfoPanel from '../../components/ToolInfoPanel';
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal';
import { useToolGuard } from '../../hooks/useToolGuard';

// ─── Constants ────────────────────────────────────────────────────────────────
const QR_HISTORY_KEY = 'qr_pro_history_v1';

const QR_TYPES = [
  { id: 'url',       label: 'URL / Site web',       icon: '🌐', placeholder: 'https://abawi.sn' },
  { id: 'text',      label: 'Texte libre',           icon: '📝', placeholder: 'Entrez votre texte ici…' },
  { id: 'vcard',     label: 'Carte de visite',       icon: '👤', placeholder: null },
  { id: 'wifi',      label: 'WiFi',                  icon: '📶', placeholder: null },
  { id: 'whatsapp',  label: 'WhatsApp',              icon: '💬', placeholder: '+221 77 000 00 00' },
  { id: 'email',     label: 'Email',                 icon: '✉️',  placeholder: null },
  { id: 'sms',       label: 'SMS',                   icon: '💬', placeholder: null },
  { id: 'tel',       label: 'Téléphone',             icon: '📞', placeholder: '+221 77 000 00 00' },
  { id: 'instagram', label: 'Instagram',             icon: '📸', placeholder: 'votrepseudo' },
  { id: 'linkedin',  label: 'LinkedIn',              icon: '💼', placeholder: 'votre-profil' },
  { id: 'payement',  label: 'Paiement Orange/Wave',  icon: '💳', placeholder: 'Numéro ou lien' },
  { id: 'pdf',       label: 'Document PDF',          icon: '📄', placeholder: 'https://lien-vers-votre-pdf.com' },
  { id: 'geo',       label: 'Localisation GPS',      icon: '📍', placeholder: null },
  { id: 'event',     label: 'Événement Calendrier',  icon: '📅', placeholder: null },
  { id: 'multilink', label: '🔗 Multi-liens',        icon: '🗂️', placeholder: null },
  { id: 'smart',     label: '🧠 Smart QR (appareils)',icon: '⚡', placeholder: null },
  { id: 'crypto',    label: 'Crypto / Bitcoin',      icon: '₿',  placeholder: 'bitcoin:...' },
  { id: 'youtube',   label: 'YouTube',               icon: '▶️',  placeholder: 'ID ou URL de la vidéo' },
  { id: 'tiktok',    label: 'TikTok',                icon: '🎵',  placeholder: '@votrepseudo' },
  { id: 'menu',      label: 'Menu Restaurant',       icon: '🍽️',  placeholder: 'URL du menu ou PDF' },
];

const STYLES = [
  { id: 'square',   label: 'Carré classique' },
  { id: 'round',    label: 'Modules ronds' },
  { id: 'dots',     label: 'Points' },
];

const EYE_SHAPES = [
  { id: 'square',       label: 'Carré' },
  { id: 'rounded',      label: 'Arrondi' },
  { id: 'extra-rounded',label: 'Très arrondi' },
  { id: 'circle',       label: 'Cercle' },
];

const PRESETS = [
  { id: 'classic',  label: 'Classique',   fg: '#000000', bg: '#ffffff', eye: '#000000' },
  { id: 'abawi',    label: 'ABAWI Gold',  fg: '#1a0d00', bg: '#fffbf0', eye: '#c9a84c' },
  { id: 'ocean',    label: 'Océan',       fg: '#0c2461', bg: '#dff9fb', eye: '#0652DD' },
  { id: 'forest',   label: 'Forêt',       fg: '#1B4332', bg: '#D8F3DC', eye: '#2D6A4F' },
  { id: 'sunset',   label: 'Sunset',      fg: '#6A040F', bg: '#FFF3B0', eye: '#D00000' },
  { id: 'purple',   label: 'Premium',     fg: '#1a0030', bg: '#f5e6ff', eye: '#7B2FBE' },
  { id: 'noir',     label: 'Noir élite',  fg: '#ffffff', bg: '#0a0a0a', eye: '#F0B429' },
  { id: 'brand',    label: 'Brand',       fg: '#003049', bg: '#fcbf49', eye: '#eae2b7' },
];

const FRAMES = [
  { id: 'none',     label: 'Aucun' },
  { id: 'scan',     label: 'Scannez-moi' },
  { id: 'follow',   label: 'Suivez-nous' },
  { id: 'contact',  label: 'Contactez-nous' },
  { id: 'visit',    label: 'Visitez notre site' },
  { id: 'download', label: 'Téléchargez' },
  { id: 'custom',   label: 'Texte personnalisé' },
];

const SIZES = [
  { id: 256,  label: '256×256 (web)' },
  { id: 512,  label: '512×512 (print MD)' },
  { id: 1024, label: '1024×1024 (haute res)' },
  { id: 2048, label: '2048×2048 (grand format)' },
];

const ERROR_LEVELS = [
  { id: 'L', label: 'L — 7% (plus dense)' },
  { id: 'M', label: 'M — 15% (recommandé)' },
  { id: 'Q', label: 'Q — 25% (avec logo)' },
  { id: 'H', label: 'H — 30% (max correction)' },
];

function load(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } }
function save(key, v)   { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }

// ─── QR Builder ───────────────────────────────────────────────────────────────
function buildMultiLinkPage(links, title) {
  const filtered = (links || []).filter(l => l.url);
  if (!filtered.length) return '';
  const items = filtered.map(l => `<a href="${l.url}">${l.label || l.url}</a>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1><style>*{box-sizing:border-box;margin:0;padding:0}body{font:15px/1.5 system-ui;background:#0a0a14;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 16px}h2{font-size:1.3rem;font-weight:800;margin:0 0 20px;text-align:center}a{display:block;padding:14px 18px;margin:7px 0;border-radius:14px;background:rgba(255,255,255,.12);color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.18);width:100%;max-width:340px;font-weight:600}a:hover{background:rgba(255,255,255,.22)}.by{margin-top:24px;font-size:.7rem;color:rgba(255,255,255,.3)}</style></head><body><h2>${title||'Mes liens'}</h2>${items}<p class=by>Créé avec ABAWI QR Pro</p></body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function buildSmartPage(ios, android, def) {
  const html = `<!DOCTYPE html><html><head><meta charset=utf-8></head><body><script>var u=navigator.userAgent;var r=/iPhone|iPad|iPod/.test(u)?'${ios||def}':/Android/.test(u)?'${android||def}':'${def}';if(r)window.location.href=r;else document.write('<a href="${def}">Ouvrir</a>')</script><noscript><a href="${def}">Ouvrir le lien</a></noscript></body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function parseQRResult(text) {
  if (!text) return null;
  const t = text.trim();
  if (/^https?:\/\//i.test(t)) return { type:'url', label:'URL Web', icon:'🌐', value:t, actions:[{label:'Ouvrir',fn:()=>window.open(t,'_blank')},{label:'Copier',fn:()=>navigator.clipboard?.writeText(t)}] };
  if (t.startsWith('tel:')) return { type:'tel', label:'Téléphone', icon:'📞', value:t.slice(4), actions:[{label:'Appeler',fn:()=>window.open(t)},{label:'WhatsApp',fn:()=>window.open(`https://wa.me/${t.slice(4).replace(/\D/g,'')}`)},{label:'Copier',fn:()=>navigator.clipboard?.writeText(t.slice(4))}] };
  if (t.startsWith('mailto:')) return { type:'email', label:'Email', icon:'✉️', value:t.slice(7).split('?')[0], actions:[{label:'Envoyer',fn:()=>window.open(t)},{label:'Copier',fn:()=>navigator.clipboard?.writeText(t.slice(7).split('?')[0])}] };
  if (t.startsWith('sms:')) return { type:'sms', label:'SMS', icon:'💬', value:t.slice(4), actions:[{label:'Envoyer SMS',fn:()=>window.open(t)},{label:'Copier',fn:()=>navigator.clipboard?.writeText(t.slice(4))}] };
  if (t.startsWith('WIFI:')) {
    const ssid = (t.match(/S:([^;]+)/)||[])[1]||'';
    const pass = (t.match(/P:([^;]+)/)||[])[1]||'';
    return { type:'wifi', label:'Réseau WiFi', icon:'📶', value:`SSID: ${ssid}${pass?` · Mot de passe: ${pass}`:''}`, actions:[{label:'Copier SSID',fn:()=>navigator.clipboard?.writeText(ssid)},{label:'Copier MDP',fn:()=>navigator.clipboard?.writeText(pass)}] };
  }
  if (t.startsWith('BEGIN:VCARD')) {
    const name = (t.match(/FN:(.+)/)||[])[1]||'Contact';
    return { type:'vcard', label:'Carte de visite', icon:'👤', value:name, actions:[{label:'Ajouter aux contacts',fn:()=>{ const b=new Blob([t],{type:'text/vcard'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='contact.vcf'; a.click(); }},{label:'Copier',fn:()=>navigator.clipboard?.writeText(t)}] };
  }
  if (t.startsWith('BEGIN:VEVENT')) {
    const summary = (t.match(/SUMMARY:(.+)/)||[])[1]||'Événement';
    return { type:'event', label:'Événement', icon:'📅', value:summary, actions:[{label:'Ajouter au calendrier',fn:()=>{ const b=new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\n${t}\nEND:VCALENDAR`],{type:'text/calendar'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='event.ics'; a.click(); }}] };
  }
  if (/^geo:/i.test(t)) { const coords=t.slice(4); return { type:'geo', label:'Localisation GPS', icon:'📍', value:coords, actions:[{label:'Ouvrir Maps',fn:()=>window.open(`https://maps.google.com/?q=${coords}`)},{label:'Copier coords',fn:()=>navigator.clipboard?.writeText(coords)}] }; }
  if (/^bitcoin:/i.test(t)||/^ethereum:/i.test(t)) return { type:'crypto', label:'Adresse Crypto', icon:'₿', value:t, actions:[{label:'Copier adresse',fn:()=>navigator.clipboard?.writeText(t)}] };
  if (t.includes('wa.me')||t.startsWith('whatsapp://')) return { type:'whatsapp', label:'WhatsApp', icon:'💬', value:t, actions:[{label:'Ouvrir WhatsApp',fn:()=>window.open(t,'_blank')},{label:'Copier',fn:()=>navigator.clipboard?.writeText(t)}] };
  return { type:'text', label:'Texte', icon:'📝', value:t, actions:[{label:'Copier',fn:()=>navigator.clipboard?.writeText(t)},{label:'Rechercher',fn:()=>window.open(`https://google.com/search?q=${encodeURIComponent(t)}`)},{label:'Créer QR',fn:null}] };
}

function buildQRContent(type, fields) {
  switch (type) {
    case 'url':       return fields.url || 'https://abawi.sn';
    case 'text':      return fields.text || '';
    case 'tel':       return `tel:${fields.tel || ''}`;
    case 'whatsapp':  return `https://wa.me/${(fields.whatsapp || '').replace(/\D/g, '')}`;
    case 'instagram': return `https://instagram.com/${fields.instagram || ''}`;
    case 'linkedin':  return `https://linkedin.com/in/${fields.linkedin || ''}`;
    case 'pdf':       return fields.pdf || '';
    case 'payement':  return fields.payement || '';
    case 'crypto':    return fields.crypto || '';
    case 'youtube':   return fields.youtube ? (fields.youtube.startsWith('http') ? fields.youtube : `https://youtu.be/${fields.youtube}`) : '';
    case 'tiktok':    return `https://tiktok.com/@${(fields.tiktok||'').replace(/^@/,'')}`;
    case 'menu':      return fields.menu || '';
    case 'geo':       return `geo:${fields.geo_lat||'14.6937'},${fields.geo_lng||'-17.4441'}${fields.geo_label?`?q=${encodeURIComponent(fields.geo_label)}`:''}`;
    case 'event':
      return [
        'BEGIN:VEVENT',
        `SUMMARY:${fields.event_title||''}`,
        `DTSTART:${(fields.event_start||'').replace(/[-:]/g,'').replace('T','T')}00Z`,
        `DTEND:${(fields.event_end||'').replace(/[-:]/g,'').replace('T','T')}00Z`,
        fields.event_location ? `LOCATION:${fields.event_location}` : '',
        fields.event_desc     ? `DESCRIPTION:${fields.event_desc}` : '',
        'END:VEVENT',
      ].filter(Boolean).join('\n');
    case 'multilink': return buildMultiLinkPage(fields.multi_links || [], fields.multi_title || 'Mes liens');
    case 'smart':     return buildSmartPage(fields.smart_ios || '', fields.smart_android || '', fields.smart_default || '');
    case 'email': {
      const subj = fields.email_subject ? `?subject=${encodeURIComponent(fields.email_subject)}` : '';
      const body = fields.email_body ? `${subj ? '&' : '?'}body=${encodeURIComponent(fields.email_body)}` : '';
      return `mailto:${fields.email || ''}${subj}${body}`;
    }
    case 'sms':  return `sms:${fields.sms_to || ''}${fields.sms_body ? `:${fields.sms_body}` : ''}`;
    case 'wifi': return `WIFI:T:${fields.wifi_security || 'WPA'};S:${fields.wifi_ssid || ''};P:${fields.wifi_pass || ''};;`;
    case 'vcard':
      return [
        'BEGIN:VCARD', 'VERSION:3.0',
        `FN:${fields.vcard_name || ''}`,
        `TEL:${fields.vcard_tel || ''}`,
        `EMAIL:${fields.vcard_email || ''}`,
        fields.vcard_org   ? `ORG:${fields.vcard_org}` : '',
        fields.vcard_title ? `TITLE:${fields.vcard_title}` : '',
        fields.vcard_url   ? `URL:${fields.vcard_url}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    default: return '';
  }
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────
async function renderQR({ content, size, fgColor, bgColor, eyeColor, moduleStyle, eyeShape, errorLevel, logoUrl, logoSize }) {
  if (!content) return null;

  // Generate raw QR matrix via qrcode lib (data URL first)
  const dataUrl = await QRCode.toDataURL(content, {
    width: size,
    margin: 2,
    color: { dark: fgColor, light: bgColor },
    errorCorrectionLevel: errorLevel,
  });
  return dataUrl;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QRCodePro() {
  const { membre } = useAuth();
  const canvasRef  = useRef(null);
  const logoRef    = useRef(null);

  const guard = useToolGuard('qr_code_pro', 'qr_code_pro');

  const [type,    setType]    = useState('url');
  const [fields,  setFields]  = useState({ url: 'https://abawi.sn' });
  // historyRef évite d'avoir history dans les deps de generate → casse le cycle
  const historyRef = useRef([]);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [eyeColor,setEyeColor]= useState('#000000');
  const [moduleStyle, setModuleStyle]   = useState('square');
  const [eyeShape,    setEyeShape]      = useState('square');
  const [errorLevel,  setErrorLevel]    = useState('M');
  const [size,        setSize]          = useState(512);
  const [frameType,   setFrameType]     = useState('none');
  const [frameText,   setFrameText]     = useState('');
  const [frameColor,  setFrameColor]    = useState('#000000');
  const [logoUrl,     setLogoUrl]       = useState('');
  const [logoSize,    setLogoSize]      = useState(20);
  const [qrDataUrl,   setQrDataUrl]     = useState('');
  const [generating,  setGenerating]    = useState(false);
  const [err,         setErr]           = useState('');
  const [activePreset,setActivePreset]  = useState('classic');
  const [history,     setHistory]       = useState(() => { const h = load(QR_HISTORY_KEY, []); historyRef.current = h; return h; });
  const [tab,         setTab]           = useState('create');
  const [batchList,   setBatchList]     = useState('');
  const [batchResults,setBatchResults]  = useState([]);
  const [batchLoading,setBatchLoading]  = useState(false);
  const [notif,       setNotif]         = useState('');
  // Scanner state
  const [scanResult,   setScanResult]   = useState(null);
  const [scanError,    setScanError]    = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanLoading,  setScanLoading]  = useState(false);
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const scanActiveRef = useRef(false);
  const fileInputRef  = useRef(null);

  useEffect(() => { if (notif) { const t = setTimeout(() => setNotif(''), 3500); return () => clearTimeout(t); } }, [notif]);

  // Stop camera on tab change
  useEffect(() => { if (tab !== 'scanner') stopCamera(); }, [tab]);

  const content = buildQRContent(type, fields);

  const generate = useCallback(async (saveToHistory = true) => {
    if (!content) { setErr('Contenu vide.'); return; }

    // Vérifier accès + débiter si nécessaire
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return

    setGenerating(true); setErr('');
    try {
      const dataUrl = await QRCode.toDataURL(content, {
        width: size, margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });

      // If logo requested, composite on canvas
      let finalUrl = dataUrl;
      if (logoUrl) {
        finalUrl = await compositeWithLogo(dataUrl, logoUrl, logoSize, size, bgColor);
      }

      setQrDataUrl(finalUrl);

      if (saveToHistory) {
        const entry = {
          id: Date.now(),
          type, content: content.slice(0, 80),
          dataUrl: finalUrl, fgColor, bgColor,
          label: getTypeLabel(type, fields),
          date: new Date().toISOString(),
        };
        // historyRef évite d'avoir history dans les deps → pas de cycle
        const next = [entry, ...historyRef.current].slice(0, 30);
        historyRef.current = next;
        setHistory(next);
        save(QR_HISTORY_KEY, next);
        setNotif('✓ QR code généré et sauvegardé');
      }
    } catch (e) {
      setErr('Erreur : ' + e.message);
    }
    setGenerating(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, fgColor, bgColor, errorLevel, size, logoUrl, logoSize, type, fields]);

  // Auto-generate on config change — silencieux si quota épuisé (pas de pop-up)
  useEffect(() => {
    if (!content) return;
    if (!guard.allowed) return;
    const t = setTimeout(() => generate(false), 400);
    return () => clearTimeout(t);
  }, [content, fgColor, bgColor, eyeColor, moduleStyle, eyeShape, errorLevel, size, logoUrl, logoSize, generate, guard.allowed]);

  // Logger l'usage uniquement quand le contenu change (pas juste les couleurs)
  const prevContentRef = useRef('');
  useEffect(() => {
    if (!content || content === prevContentRef.current) return;
    prevContentRef.current = content;
    guard.recordUsage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  async function compositeWithLogo(qrDataUrl, logoSrc, logoPercent, qrSize, bgCol) {
    return new Promise((resolve, reject) => {
      const canvas  = document.createElement('canvas');
      canvas.width  = qrSize;
      canvas.height = qrSize;
      const ctx     = canvas.getContext('2d');
      const qrImg   = new Image();
      qrImg.onload  = () => {
        ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          const lSize  = qrSize * (logoPercent / 100);
          const lx     = (qrSize - lSize) / 2;
          const ly     = (qrSize - lSize) / 2;
          const pad    = lSize * 0.08;
          ctx.fillStyle = bgCol;
          ctx.beginPath();
          ctx.roundRect(lx - pad, ly - pad, lSize + pad * 2, lSize + pad * 2, 8);
          ctx.fill();
          ctx.drawImage(logoImg, lx, ly, lSize, lSize);
          resolve(canvas.toDataURL('image/png'));
        };
        logoImg.onerror = () => resolve(qrDataUrl);
        logoImg.src = logoSrc;
      };
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });
  }

  function applyPreset(p) {
    setActivePreset(p.id);
    setFgColor(p.fg);
    setBgColor(p.bg);
    setEyeColor(p.eye);
  }

  function setField(k, v) {
    setFields(f => ({ ...f, [k]: v }));
  }

  function downloadPNG() {
    if (!qrDataUrl) return;
    const label = getTypeLabel(type, fields).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr_${label}_${Date.now()}.png`;
    a.click();
    setNotif('✓ PNG téléchargé');
  }

  async function downloadSVG() {
    if (!content) return;
    try {
      const svg = await QRCode.toString(content, {
        type: 'svg', width: size, margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `qr_${type}_${Date.now()}.svg`; a.click();
      URL.revokeObjectURL(url);
      setNotif('✓ SVG téléchargé');
    } catch (e) { setErr(e.message); }
  }

  function copyDataUrl() {
    if (!qrDataUrl) return;
    navigator.clipboard?.writeText(qrDataUrl).then(() => setNotif('✓ Data URL copiée'));
  }

  async function generateBatch() {
    const lines = batchList.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBatchLoading(true);
    const results = [];
    for (const line of lines.slice(0, 20)) {
      try {
        const url = await QRCode.toDataURL(line, {
          width: 256, margin: 2, color: { dark: fgColor, light: bgColor }, errorCorrectionLevel: errorLevel,
        });
        results.push({ line, url, ok: true });
      } catch (e) { results.push({ line, url: '', ok: false, err: e.message }); }
    }
    setBatchResults(results);
    setBatchLoading(false);
    setNotif(`✓ ${results.filter(r => r.ok).length} QR codes générés`);
  }

  function downloadAllBatch() {
    batchResults.filter(r => r.ok).forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = r.url;
        a.download = `qr_batch_${i + 1}.png`;
        a.click();
      }, i * 200);
    });
  }

  function clearHistory() {
    if (!confirm('Supprimer tout l\'historique ?')) return;
    setHistory([]); save(QR_HISTORY_KEY, []);
  }

  function getFrameLabel() {
    if (frameType === 'none') return '';
    if (frameType === 'custom') return frameText;
    return FRAMES.find(f => f.id === frameType)?.label || '';
  }

  // ── Scanner functions ──────────────────────────────────────────────────────
  async function startCameraScan() {
    setScanResult(null); setScanError(''); setScanLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment', width:{ideal:1280}, height:{ideal:720} } });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      streamRef.current = stream;
      scanActiveRef.current = true;
      setCameraActive(true);
      setScanLoading(false);
      requestAnimationFrame(scanLoop);
    } catch(e) {
      setScanError('Accès caméra refusé. ' + e.message);
      setScanLoading(false);
    }
  }

  async function scanLoop() {
    if (!scanActiveRef.current || !videoRef.current) return;
    if (!('BarcodeDetector' in window)) {
      setScanError('BarcodeDetector non supporté sur ce navigateur. Utilisez l\'import de fichier.');
      stopCamera(); return;
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code', 'pdf417', 'data_matrix'] });
      const results  = await detector.detect(videoRef.current);
      if (results.length > 0) {
        setScanResult(parseQRResult(results[0].rawValue));
        stopCamera(); return;
      }
    } catch { /* ignore */ }
    if (scanActiveRef.current) setTimeout(() => requestAnimationFrame(scanLoop), 200);
  }

  function stopCamera() {
    scanActiveRef.current = false;
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }

  async function scanFromFile(file) {
    if (!file) return;
    setScanResult(null); setScanError(''); setScanLoading(true);
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((res,rej) => { img.onload=res; img.onerror=rej; });

      let found = false;
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code', 'pdf417', 'data_matrix', 'code_128', 'ean_13'] });
        const results = await detector.detect(img);
        if (results.length > 0) { setScanResult(parseQRResult(results[0].rawValue)); found=true; }
        if (!found) {
          // Try via canvas
          const canvas = document.createElement('canvas');
          canvas.width=img.width; canvas.height=img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          const r2 = await detector.detect(canvas);
          if (r2.length > 0) { setScanResult(parseQRResult(r2[0].rawValue)); found=true; }
        }
      }
      URL.revokeObjectURL(img.src);
      if (!found) setScanError('QR code non détecté. Vérifiez que l\'image est nette et bien cadrée. BarcodeDetector requis (Chrome/Edge/Android).');
    } catch(e) { setScanError('Erreur lecture : ' + e.message); }
    setScanLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <SEO
        title="QR Code Pro — 12 types, logo intégré, export PNG/SVG"
        description="Générateur de QR codes professionnels : URL, vCard, WiFi, WhatsApp, Email, SMS, paiement, Instagram. Logo intégré, presets design, export haute résolution PNG/SVG, génération batch."
        keywords="QR code Sénégal, QR code pro, QR code WhatsApp, QR code WiFi, QR code vCard, QR code paiement, générateur QR"
        image="/og-tools/qr-code-pro.jpg"
      />
      <style>{CSS}</style>

      <ToolHero
        icon="⬛"
        badge="QR Code · Pro"
        title="QR Code"
        titleAccent="Pro"
        subtitle="20 types · Smart QR · Multi-liens · Scanner intégré · Lecture & décodage instantané — le QR professionnel complet."
        gradient="linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 45%, #16213e 100%)"
        glowColor="rgba(240,180,41,0.3)"
        accentColor="#F0B429"
        stats={[['🎨','20 types'],['🧠','Smart QR'],['🔍','Scanner/Décodeur'],['📦','PNG · SVG · Batch']]}
      />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 80px' }}>
        <ToolInfoPanel
          toolName="QR Code Pro"
          icon="⬛"
          description="Générateur de QR codes professionnel avec personnalisation avancée, logo, presets et export batch"
          benefits={[
            '12 types : URL, vCard, WiFi, WhatsApp, Email, SMS, Instagram, LinkedIn, PDF, Paiement, Téléphone, Texte',
            'Personnalisation complète : couleurs avant/arrière-plan, yeux, style des modules',
            'Intégration de logo au centre avec gestion automatique du contraste',
            '8 presets de design instantanés — classique, ABAWI Gold, Noir élite, Brand…',
            'Export haute résolution PNG (256→2048px), SVG vectoriel, génération batch jusqu\'à 20 QR',
          ]}
          howToUse={[
            'Choisissez le type de QR code (URL, vCard, WiFi, WhatsApp…)',
            'Renseignez les informations du contenu dans le formulaire',
            'Personnalisez les couleurs avec les presets ou manuellement',
            'Optionnel : ajoutez un logo URL pour l\'incruster au centre',
            'Le QR se génère automatiquement — téléchargez en PNG ou SVG',
          ]}
          tips={[
            'Choisissez Q ou H comme niveau de correction si vous intégrez un logo',
            'Testez toujours le QR scanné avant impression grande taille',
            'Mode Batch : collez jusqu\'à 20 URLs (une par ligne) pour générer en masse',
          ]}
        />

        {/* Info quota */}
        <div style={{ marginBottom: 16 }}>
          <ToolGuardBadge guard={guard} />
        </div>

        {/* Upsell modal */}
        <ToolUpsellModal
          isOpen={guard.upsellOpen}
          config={guard.upsellConfig}
          onClose={guard.closeUpsell}
          onUseCredit={async () => {
            const r = await guard.checkAndDebit()
            if (r.ok) generate(true)
          }}
        />

        {notif && <div className="qr-toast tp-fade-up">{notif}</div>}

        <div className="qr-tabs">
          {[['create','✏️ Créer'],['history',`🕒 Historique (${history.length})`],['batch','📦 Batch'],['scanner','🔍 Scanner']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`qr-tab ${tab === id ? 'active' : ''}`}>{label}</button>
          ))}
        </div>

        {/* ── CREATE ── */}
        {tab === 'create' && (
          <div className="qr-layout">

            {/* LEFT — Config */}
            <div className="qr-left">

              {/* Type selector */}
              <div className="qr-section">
                <h3 className="qr-section-title">Type de QR code</h3>
                <div className="qr-type-grid">
                  {QR_TYPES.map(t => (
                    <button key={t.id} onClick={() => { setType(t.id); setFields({}); }}
                      className={`qr-type-btn ${type === t.id ? 'active' : ''}`}>
                      <span className="qr-type-icon">{t.icon}</span>
                      <span className="qr-type-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content form */}
              <div className="qr-section">
                <h3 className="qr-section-title">Contenu</h3>
                <ContentForm type={type} fields={fields} setField={setField} />
              </div>

              {/* Presets */}
              <div className="qr-section">
                <h3 className="qr-section-title">Thème prédéfini</h3>
                <div className="qr-presets">
                  {PRESETS.map(p => (
                    <button key={p.id} onClick={() => applyPreset(p)}
                      className={`qr-preset ${activePreset === p.id ? 'active' : ''}`}
                      title={p.label}>
                      <span className="qr-preset-swatch" style={{ background: p.bg, border: `3px solid ${p.fg}` }} />
                      <span className="qr-preset-name">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="qr-section">
                <h3 className="qr-section-title">Couleurs</h3>
                <div className="qr-colors">
                  <ColorPicker label="Modules" value={fgColor} onChange={v => { setFgColor(v); setActivePreset(''); }} />
                  <ColorPicker label="Fond" value={bgColor} onChange={v => { setBgColor(v); setActivePreset(''); }} />
                  <ColorPicker label="Yeux" value={eyeColor} onChange={v => { setEyeColor(v); setActivePreset(''); }} />
                </div>
              </div>

              {/* Style */}
              <div className="qr-section">
                <h3 className="qr-section-title">Style & taille</h3>
                <div className="qr-row">
                  <div className="qr-field">
                    <label>Modules</label>
                    <select className="qr-select" value={moduleStyle} onChange={e => setModuleStyle(e.target.value)}>
                      {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="qr-field">
                    <label>Yeux</label>
                    <select className="qr-select" value={eyeShape} onChange={e => setEyeShape(e.target.value)}>
                      {EYE_SHAPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="qr-row" style={{ marginTop: 10 }}>
                  <div className="qr-field">
                    <label>Résolution</label>
                    <select className="qr-select" value={size} onChange={e => setSize(Number(e.target.value))}>
                      {SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="qr-field">
                    <label>Correction d'erreur</label>
                    <select className="qr-select" value={errorLevel} onChange={e => setErrorLevel(e.target.value)}>
                      {ERROR_LEVELS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="qr-section">
                <h3 className="qr-section-title">Logo (optionnel)</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  URL d'une image — sera incrustée au centre. Recommandez correction H ou Q.
                </p>
                <input className="qr-input" placeholder="https://… (URL du logo PNG/SVG)" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                {logoUrl && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Taille : {logoSize}%</label>
                    <input type="range" min={10} max={35} value={logoSize} onChange={e => setLogoSize(Number(e.target.value))} style={{ flex: 1 }} />
                  </div>
                )}
              </div>

              {/* Frame */}
              <div className="qr-section">
                <h3 className="qr-section-title">Cadre décoratif</h3>
                <select className="qr-select" value={frameType} onChange={e => setFrameType(e.target.value)} style={{ width: '100%', marginBottom: 8 }}>
                  {FRAMES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                {frameType !== 'none' && (
                  <div className="qr-row" style={{ marginTop: 8 }}>
                    {frameType === 'custom' && (
                      <input className="qr-input" placeholder="Votre texte de cadre" value={frameText} onChange={e => setFrameText(e.target.value)} style={{ flex: 1 }} />
                    )}
                    <ColorPicker label="Couleur" value={frameColor} onChange={setFrameColor} />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Preview */}
            <div className="qr-right">
              <div className="qr-preview-card">
                <h3 className="qr-section-title" style={{ marginBottom: 16 }}>Aperçu en temps réel</h3>

                <div className="qr-canvas-wrap" style={{ background: bgColor }}>
                  {/* Frame top */}
                  {frameType !== 'none' && (
                    <div className="qr-frame-label" style={{ color: frameColor, borderColor: frameColor }}>
                      {getFrameLabel()}
                    </div>
                  )}

                  {generating ? (
                    <div className="qr-loading"><div className="qr-spinner" /><span>Génération…</span></div>
                  ) : qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="qr-img" />
                  ) : (
                    <div className="qr-empty">
                      <span style={{ fontSize: '3rem' }}>⬛</span>
                      <p>Le QR s'affiche ici automatiquement</p>
                    </div>
                  )}

                  {/* Frame bottom */}
                  {frameType !== 'none' && (
                    <div className="qr-frame-bottom" style={{ borderColor: frameColor, color: frameColor }}>
                      <div className="qr-frame-corner" style={{ borderColor: frameColor }} />
                      <div className="qr-frame-corner right" style={{ borderColor: frameColor }} />
                    </div>
                  )}
                </div>

                {err && <p style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: 8, textAlign: 'center' }}>{err}</p>}

                {/* Content preview */}
                {content && (
                  <div className="qr-content-preview">
                    <span className="qr-content-label">{QR_TYPES.find(t => t.id === type)?.icon} Contenu :</span>
                    <span className="qr-content-val">{content.slice(0, 80)}{content.length > 80 ? '…' : ''}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="qr-actions">
                  <button onClick={downloadPNG} disabled={!qrDataUrl} className="qr-btn-primary">
                    ⬇️ PNG ({size}px)
                  </button>
                  <button onClick={downloadSVG} disabled={!content} className="qr-btn-secondary">
                    ⬇️ SVG
                  </button>
                  <button onClick={copyDataUrl} disabled={!qrDataUrl} className="qr-btn-ghost">
                    📋 Data URL
                  </button>
                </div>

                {/* QR Info */}
                <div className="qr-info-grid">
                  {[
                    ['Type', QR_TYPES.find(t => t.id === type)?.label || type],
                    ['Taille', `${size}×${size}px`],
                    ['Correction', errorLevel],
                    ['Caractères', content.length],
                  ].map(([k, v]) => (
                    <div key={k} className="qr-info-item">
                      <span className="qr-info-key">{k}</span>
                      <span className="qr-info-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div className="qr-anim">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Historique ({history.length})</h2>
              {history.length > 0 && <button onClick={clearHistory} className="qr-btn-ghost" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}>🗑 Tout supprimer</button>}
            </div>
            {history.length === 0 ? (
              <div className="qr-empty-state">
                <span style={{ fontSize: '3rem' }}>🕒</span>
                <p>Aucun QR code généré</p>
                <button onClick={() => setTab('create')} className="qr-btn-primary">Créer mon premier QR</button>
              </div>
            ) : (
              <div className="qr-history-grid">
                {history.map(h => (
                  <div key={h.id} className="qr-history-card">
                    <img src={h.dataUrl} alt={h.label} className="qr-history-img" style={{ background: h.bgColor || '#fff' }} />
                    <div className="qr-history-info">
                      <div className="qr-history-label">{h.label}</div>
                      <div className="qr-history-date">{new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="qr-history-content">{h.content}</div>
                    </div>
                    <div className="qr-history-actions">
                      <a href={h.dataUrl} download={`qr_${h.id}.png`} className="qr-btn-icon" title="Télécharger">⬇️</a>
                      <button onClick={() => setHistory(prev => { const n = prev.filter(x => x.id !== h.id); save(QR_HISTORY_KEY, n); return n; })} className="qr-btn-icon danger" title="Supprimer">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SCANNER ── */}
        {tab === 'scanner' && (
          <div className="qr-anim">
            <div className="qr-scanner-layout">

              {/* Camera / file input */}
              <div className="qr-scanner-card">
                <h2 className="qr-section-title" style={{ marginBottom: 16 }}>📷 Scanner un QR code</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
                  Utilisez votre caméra ou importez une image. Détection instantanée sans application tierce — fonctionne avec QR codes, PDF417, DataMatrix et codes-barres.
                </p>

                {/* Camera area */}
                <div className="qr-cam-wrap">
                  <video ref={videoRef} className={`qr-cam-video ${cameraActive ? 'active' : ''}`} playsInline muted autoPlay />
                  {!cameraActive && !scanLoading && (
                    <div className="qr-cam-placeholder">
                      <div className="qr-cam-finder">
                        <div className="qr-cam-corner tl" /><div className="qr-cam-corner tr" />
                        <div className="qr-cam-corner bl" /><div className="qr-cam-corner br" />
                        <span style={{ fontSize: '2.5rem' }}>📷</span>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>Caméra inactive</p>
                      </div>
                    </div>
                  )}
                  {cameraActive && (
                    <div className="qr-cam-overlay">
                      <div className="qr-scan-line" />
                      <div className="qr-cam-corner tl" /><div className="qr-cam-corner tr" />
                      <div className="qr-cam-corner bl" /><div className="qr-cam-corner br" />
                    </div>
                  )}
                  {scanLoading && (
                    <div className="qr-cam-loading">
                      <div className="qr-spinner" />
                      <span style={{ color: '#fff', fontSize: '0.82rem' }}>Initialisation caméra…</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  {!cameraActive ? (
                    <button onClick={startCameraScan} disabled={scanLoading} className="qr-btn-primary" style={{ flex: 1 }}>
                      {scanLoading ? '⏳ Initialisation…' : '📷 Démarrer la caméra'}
                    </button>
                  ) : (
                    <button onClick={stopCamera} className="qr-btn-ghost" style={{ flex: 1, borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444' }}>
                      ⏹ Arrêter la caméra
                    </button>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} disabled={scanLoading} className="qr-btn-secondary">
                    🖼 Importer image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) { stopCamera(); scanFromFile(e.target.files[0]); e.target.value=''; } }} />
                </div>

                {scanError && (
                  <div className="qr-scan-error">
                    <span>⚠️</span>
                    <div>
                      <strong>Erreur de scan</strong>
                      <p>{scanError}</p>
                      {scanError.includes('BarcodeDetector') && (
                        <p style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.8 }}>
                          Conseil : utilisez Chrome ou Edge sur Android/Windows/macOS pour bénéficier du scanner natif.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Result panel */}
              <div className="qr-scanner-result-wrap">
                {scanResult ? (
                  <div className="qr-scan-result qr-anim">
                    <div className="qr-scan-result-header">
                      <span className="qr-scan-result-icon">{scanResult.icon}</span>
                      <div>
                        <div className="qr-scan-result-type">{scanResult.label}</div>
                        <div className="qr-scan-result-detected">QR détecté avec succès</div>
                      </div>
                      <span style={{ marginLeft:'auto', fontSize:'1.4rem' }}>✅</span>
                    </div>

                    <div className="qr-scan-result-value">
                      <span className="qr-content-label">Contenu décodé</span>
                      <span className="qr-scan-value-text">{scanResult.value}</span>
                    </div>

                    {scanResult.actions?.length > 0 && (
                      <div className="qr-scan-actions">
                        {scanResult.actions.map((a, i) => a.fn && (
                          <button key={i} onClick={() => { a.fn(); setNotif(`✓ ${a.label}`); }} className={i === 0 ? 'qr-btn-primary' : 'qr-btn-secondary'} style={{ flex: 1 }}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => { setType('url'); setFields({ url: scanResult.value }); setTab('create'); }} className="qr-btn-ghost" style={{ flex: 1, fontSize: '0.75rem' }}>
                        🔁 Recréer ce QR
                      </button>
                      <button onClick={() => setScanResult(null)} className="qr-btn-ghost" style={{ fontSize: '0.75rem' }}>
                        🔄 Nouveau scan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="qr-scan-idle">
                    <div style={{ fontSize: '4rem', marginBottom: 12 }}>🔍</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--text-primary)' }}>Résultat du scan</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Scannez un QR code avec la caméra ou importez une image. Le contenu décodé apparaîtra ici avec des actions contextuelles.
                    </p>
                    <div className="qr-scan-types-hint">
                      {['🌐 URL','📶 WiFi','👤 vCard','✉️ Email','📞 Tél','💬 SMS','📅 Calendrier','₿ Crypto','📍 GPS'].map(t => (
                        <span key={t} className="qr-scan-type-pill">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BATCH ── */}
        {tab === 'batch' && (
          <div className="qr-anim">
            <div className="qr-section">
              <h2 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>📦 Génération en masse</h2>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Collez jusqu'à 20 URLs ou textes (une valeur par ligne). Le design actuel sera appliqué.</p>
              <textarea
                className="qr-input"
                rows={10}
                value={batchList}
                onChange={e => setBatchList(e.target.value)}
                placeholder={`https://abawi.sn\nhttps://abawi.sn/outils\nhttps://wa.me/221770000000\n…`}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <button onClick={generateBatch} disabled={batchLoading || !batchList.trim()} className="qr-btn-primary">
                  {batchLoading ? '⏳ Génération…' : `✨ Générer ${batchList.split('\n').filter(l => l.trim()).length} QR`}
                </button>
                {batchResults.length > 0 && (
                  <button onClick={downloadAllBatch} className="qr-btn-secondary">⬇️ Tout télécharger</button>
                )}
              </div>
            </div>

            {batchResults.length > 0 && (
              <div className="qr-batch-grid">
                {batchResults.map((r, i) => (
                  <div key={i} className={`qr-batch-item ${r.ok ? '' : 'error'}`}>
                    {r.ok
                      ? <>
                          <img src={r.url} alt={r.line} className="qr-batch-img" style={{ background: bgColor }} />
                          <div className="qr-batch-label" title={r.line}>{r.line.slice(0, 35)}{r.line.length > 35 ? '…' : ''}</div>
                          <a href={r.url} download={`qr_batch_${i + 1}.png`} className="qr-btn-icon">⬇️</a>
                        </>
                      : <>
                          <div className="qr-batch-error">❌</div>
                          <div className="qr-batch-label" style={{ color: '#EF4444' }}>{r.line.slice(0, 30)}</div>
                          <div style={{ fontSize: '0.7rem', color: '#EF4444' }}>{r.err}</div>
                        </>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ContentForm ──────────────────────────────────────────────────────────────
function ContentForm({ type, fields, setField }) {
  const t = QR_TYPES.find(t => t.id === type);
  const inp = (key, placeholder, inputType = 'text', required = false) => (
    <input
      key={key}
      className="qr-input"
      type={inputType}
      placeholder={placeholder}
      value={fields[key] || ''}
      onChange={e => setField(key, e.target.value)}
      required={required}
      style={{ marginBottom: 8 }}
    />
  );
  const area = (key, placeholder, rows = 2) => (
    <textarea key={key} className="qr-input" rows={rows} placeholder={placeholder} value={fields[key] || ''} onChange={e => setField(key, e.target.value)} style={{ resize: 'vertical', marginBottom: 8 }} />
  );

  if (type === 'url')       return inp('url', t.placeholder, 'url');
  if (type === 'text')      return area('text', t.placeholder, 3);
  if (type === 'tel')       return inp('tel', t.placeholder, 'tel');
  if (type === 'whatsapp')  return inp('whatsapp', t.placeholder, 'tel');
  if (type === 'instagram') return inp('instagram', t.placeholder);
  if (type === 'linkedin')  return inp('linkedin', t.placeholder);
  if (type === 'pdf')       return inp('pdf', t.placeholder, 'url');
  if (type === 'payement')  return inp('payement', t.placeholder);
  if (type === 'crypto')    return inp('crypto', t.placeholder);
  if (type === 'youtube')   return inp('youtube', t.placeholder, 'url');
  if (type === 'tiktok')    return inp('tiktok', t.placeholder);
  if (type === 'menu')      return inp('menu', t.placeholder, 'url');

  if (type === 'email') return (
    <>
      {inp('email', 'Adresse email *', 'email')}
      {inp('email_subject', 'Objet du message (optionnel)')}
      {area('email_body', 'Corps du message (optionnel)')}
    </>
  );

  if (type === 'sms') return (
    <>
      {inp('sms_to', 'Numéro de téléphone *', 'tel')}
      {area('sms_body', 'Message SMS (optionnel)')}
    </>
  );

  if (type === 'wifi') return (
    <>
      {inp('wifi_ssid', 'Nom du réseau WiFi (SSID) *')}
      {inp('wifi_pass', 'Mot de passe WiFi')}
      <select className="qr-select" value={fields.wifi_security || 'WPA'} onChange={e => setField('wifi_security', e.target.value)} style={{ marginBottom: 8, width: '100%' }}>
        {['WPA', 'WEP', 'nopass'].map(s => <option key={s} value={s}>{s === 'nopass' ? 'Sans mot de passe' : s}</option>)}
      </select>
    </>
  );

  if (type === 'vcard') return (
    <>
      {inp('vcard_name',  'Nom complet *')}
      {inp('vcard_tel',   'Téléphone *', 'tel')}
      {inp('vcard_email', 'Email', 'email')}
      {inp('vcard_org',   'Organisation / Entreprise')}
      {inp('vcard_title', 'Titre / Poste')}
      {inp('vcard_url',   'Site web', 'url')}
    </>
  );

  if (type === 'geo') return (
    <>
      <div className="qr-row">
        {inp('geo_lat', 'Latitude (ex: 14.6937)', 'text')}
        {inp('geo_lng', 'Longitude (ex: -17.4441)', 'text')}
      </div>
      {inp('geo_label', 'Nom du lieu (optionnel)')}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
        Astuce : copiez les coordonnées depuis Google Maps (clic droit sur un lieu).
      </p>
    </>
  );

  if (type === 'event') return (
    <>
      {inp('event_title', 'Titre de l\'événement *')}
      <div className="qr-row">
        {inp('event_start', 'Début (date+heure)', 'datetime-local')}
        {inp('event_end',   'Fin (date+heure)',   'datetime-local')}
      </div>
      {inp('event_location', 'Lieu (optionnel)')}
      {area('event_desc', 'Description (optionnel)')}
    </>
  );

  if (type === 'multilink') {
    const links = fields.multi_links || [{ label: '', url: '' }];
    const setLinks = (next) => setField('multi_links', next);
    return (
      <>
        {inp('multi_title', 'Titre de la page (ex: Mes liens)')}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input className="qr-input" placeholder={`Label lien ${i+1}`} value={l.label} onChange={e => { const n=[...links]; n[i]={...n[i],label:e.target.value}; setLinks(n); }} style={{ flex:'0 0 120px', marginBottom:0 }} />
              <input className="qr-input" placeholder={`https://…`} value={l.url} onChange={e => { const n=[...links]; n[i]={...n[i],url:e.target.value}; setLinks(n); }} style={{ flex:1, marginBottom:0 }} />
              {links.length > 1 && <button type="button" onClick={() => setLinks(links.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'#EF4444', cursor:'pointer', fontSize:'1.1rem', padding:'0 4px' }}>✕</button>}
            </div>
          ))}
        </div>
        {links.length < 10 && (
          <button type="button" onClick={() => setLinks([...links, { label:'', url:'' }])} className="qr-btn-ghost" style={{ marginTop: 8, width: '100%', fontSize: '0.78rem' }}>
            + Ajouter un lien
          </button>
        )}
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
          Génère une mini-page de liens encodée dans le QR. Max 10 liens.
        </p>
      </>
    );
  }

  if (type === 'smart') return (
    <>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
        Le QR détecte automatiquement l'appareil et redirige vers le bon lien — aucune app requise.
      </p>
      {inp('smart_ios',     '🍎 URL iOS (iPhone / iPad)')}
      {inp('smart_android', '🤖 URL Android')}
      {inp('smart_default', '🖥 URL par défaut (desktop + autres) *')}
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
        Exemple : App Store, Play Store, site web selon l'appareil.
      </p>
    </>
  );

  return null;
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────
function ColorPicker({ label, value, onChange }) {
  return (
    <div className="qr-color-picker">
      <label>{label}</label>
      <div className="qr-color-wrap">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="qr-color-input" />
        <span className="qr-color-hex">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTypeLabel(type, fields) {
  switch (type) {
    case 'url':       return fields.url?.replace(/https?:\/\//, '').slice(0, 30) || 'URL';
    case 'text':      return (fields.text || '').slice(0, 30) || 'Texte';
    case 'vcard':     return fields.vcard_name || 'Contact';
    case 'wifi':      return fields.wifi_ssid || 'WiFi';
    case 'email':     return fields.email || 'Email';
    case 'whatsapp':  return `WhatsApp ${fields.whatsapp || ''}`;
    case 'sms':       return `SMS ${fields.sms_to || ''}`;
    case 'instagram': return `@${fields.instagram || ''}`;
    case 'linkedin':  return `LinkedIn ${fields.linkedin || ''}`;
    default:          return type;
  }
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes qrFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.qr-anim { animation: qrFadeUp 0.3s ease-out; }

/* Toast */
.qr-toast {
  position: fixed; top: calc(var(--navbar-total-h,60px) + 16px); right: 20px; z-index: 9999;
  padding: 10px 18px; border-radius: 12px;
  background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); color: #10B981;
  font-weight: 600; font-size: 0.85rem; max-width: 280px;
  backdrop-filter: blur(10px); box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

/* Tabs */
.qr-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
.qr-tab {
  padding:9px 18px; border-radius:100px; border:1.5px solid var(--border);
  background:transparent; color:var(--text-secondary); cursor:pointer;
  font-size:0.82rem; font-weight:600; white-space:nowrap; font-family:inherit;
  transition:all 0.2s ease;
}
.qr-tab:hover { border-color:color-mix(in srgb,var(--accent) 40%,transparent); color:var(--accent); }
.qr-tab.active {
  border-color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent);
  color:var(--accent); font-weight:700;
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 10%,transparent);
}

/* Layout */
.qr-layout { display:grid; grid-template-columns:1fr 380px; gap:24px; align-items:start; }
@media(max-width:1024px) { .qr-layout { grid-template-columns:1fr; } }

.qr-left { display:flex; flex-direction:column; gap:20px; }
.qr-right { position:sticky; top:calc(var(--navbar-total-h,60px) + 20px); }

/* Section */
.qr-section {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:16px; padding:18px 20px;
  backdrop-filter:blur(8px);
}
.qr-section-title {
  font-size:0.75rem; font-weight:800; text-transform:uppercase;
  letter-spacing:1.2px; color:var(--text-muted); margin:0 0 14px;
}

/* Type grid */
.qr-type-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; }
.qr-type-btn {
  display:flex; flex-direction:column; align-items:center; gap:5px;
  padding:10px 8px; border-radius:12px; border:1.5px solid var(--border);
  background:transparent; cursor:pointer; font-family:inherit;
  transition:all 0.2s ease;
}
.qr-type-btn:hover { border-color:color-mix(in srgb,var(--accent) 40%,transparent); background:color-mix(in srgb,var(--accent) 6%,transparent); }
.qr-type-btn.active {
  border-color:var(--accent); background:color-mix(in srgb,var(--accent) 10%,transparent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 10%,transparent);
}
.qr-type-icon { font-size:1.3rem; }
.qr-type-label { font-size:0.7rem; font-weight:600; color:var(--text-secondary); text-align:center; line-height:1.3; }
.qr-type-btn.active .qr-type-label { color:var(--accent); }

/* Presets */
.qr-presets { display:flex; gap:8px; flex-wrap:wrap; }
.qr-preset {
  display:flex; flex-direction:column; align-items:center; gap:5px;
  padding:8px 10px; border-radius:10px; border:1.5px solid var(--border);
  background:transparent; cursor:pointer; font-family:inherit;
  transition:all 0.2s;
}
.qr-preset:hover { border-color:color-mix(in srgb,var(--accent) 40%,transparent); transform:translateY(-2px); }
.qr-preset.active { border-color:var(--accent); background:color-mix(in srgb,var(--accent) 8%,transparent); }
.qr-preset-swatch { width:28px; height:28px; border-radius:8px; display:block; box-shadow:0 2px 6px rgba(0,0,0,0.15); }
.qr-preset-name { font-size:0.65rem; font-weight:700; color:var(--text-muted); white-space:nowrap; }

/* Colors */
.qr-colors { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.qr-color-picker { display:flex; flex-direction:column; gap:5px; }
.qr-color-picker label { font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.8px; }
.qr-color-wrap { display:flex; align-items:center; gap:8px; }
.qr-color-input {
  width:36px; height:36px; border-radius:8px; border:1.5px solid var(--border);
  padding:2px; cursor:pointer; background:transparent;
}
.qr-color-hex { font-size:0.72rem; font-weight:700; color:var(--text-secondary); font-family:monospace; }

/* Row / field */
.qr-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media(max-width:480px) { .qr-row { grid-template-columns:1fr; } }
.qr-field { display:flex; flex-direction:column; gap:5px; }
.qr-field label { font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.8px; }

/* Inputs */
.qr-input {
  width:100%; padding:10px 14px; border-radius:10px;
  border:1px solid var(--border); background:var(--bg-card);
  color:var(--text-primary); font-size:0.88rem; outline:none;
  font-family:inherit; box-sizing:border-box;
  transition:border-color 0.2s ease,box-shadow 0.2s ease;
}
.qr-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 12%,transparent); }
.qr-input::placeholder { color:var(--text-muted); }
.qr-select {
  background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary);
  border-radius:10px; padding:9px 12px; font-size:0.82rem; outline:none;
  cursor:pointer; font-family:inherit;
}

/* Preview card */
.qr-preview-card {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:20px; padding:22px;
  backdrop-filter:blur(12px);
  box-shadow:0 8px 32px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.06);
}
.qr-canvas-wrap {
  border-radius:16px; padding:16px; position:relative; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; gap:0;
  border:1.5px solid var(--border);
  box-shadow:0 4px 20px rgba(0,0,0,0.1);
  min-height:220px; justify-content:center;
  transition:background 0.2s ease;
}
.qr-img { width:100%; max-width:280px; height:auto; display:block; border-radius:4px; }
.qr-loading { display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--text-muted); font-size:0.82rem; }
.qr-spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:qrSpin 0.8s linear infinite; }
@keyframes qrSpin { to{transform:rotate(360deg)} }
.qr-empty { text-align:center; color:var(--text-muted); padding:20px; }
.qr-empty p { font-size:0.82rem; margin-top:8px; }

/* Frame */
.qr-frame-label {
  font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:1.5px;
  padding:5px 14px; border:2px solid; border-radius:100px; margin-bottom:10px;
  background:transparent;
}
.qr-frame-bottom { position:relative; width:100%; height:12px; border-bottom:2px solid; margin-top:8px; }
.qr-frame-corner { position:absolute; width:12px; height:12px; border-bottom:2px solid; border-left:2px solid; bottom:-2px; left:-2px; }
.qr-frame-corner.right { left:auto; right:-2px; border-left:none; border-right:2px solid; }

/* Content preview */
.qr-content-preview {
  margin-top:12px; padding:8px 12px; border-radius:8px;
  background:var(--bg-primary); border:1px solid var(--border);
  display:flex; flex-direction:column; gap:2px;
}
.qr-content-label { font-size:0.68rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; }
.qr-content-val { font-size:0.75rem; color:var(--text-secondary); word-break:break-all; font-family:monospace; }

/* Buttons */
.qr-actions { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
.qr-btn-primary {
  flex:1; min-width:120px; padding:11px 16px; border-radius:10px; border:none;
  background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 80%,#000));
  color:#fff; font-size:0.82rem; font-weight:700; cursor:pointer;
  font-family:inherit; transition:all 0.2s ease;
  box-shadow:0 4px 12px color-mix(in srgb,var(--accent) 30%,transparent);
}
.qr-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px color-mix(in srgb,var(--accent) 45%,transparent); }
.qr-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
.qr-btn-secondary {
  padding:10px 14px; border-radius:10px;
  border:1.5px solid color-mix(in srgb,var(--accent) 35%,transparent);
  background:color-mix(in srgb,var(--accent) 8%,transparent);
  color:var(--accent); font-size:0.82rem; font-weight:700; cursor:pointer;
  font-family:inherit; transition:all 0.2s ease;
}
.qr-btn-secondary:hover:not(:disabled) { transform:translateY(-1px); }
.qr-btn-secondary:disabled { opacity:0.45; cursor:not-allowed; }
.qr-btn-ghost {
  padding:10px 14px; border-radius:10px; border:1.5px solid var(--border);
  background:transparent; color:var(--text-secondary); font-size:0.82rem;
  font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s ease;
}
.qr-btn-ghost:hover:not(:disabled) { border-color:var(--accent); color:var(--accent); }
.qr-btn-ghost:disabled { opacity:0.4; cursor:not-allowed; }
.qr-btn-icon {
  width:32px; height:32px; border-radius:8px; border:1px solid var(--border);
  background:transparent; cursor:pointer; font-size:0.85rem;
  display:flex; align-items:center; justify-content:center;
  transition:all 0.2s; text-decoration:none;
}
.qr-btn-icon:hover { background:var(--bg-card); border-color:var(--accent); }
.qr-btn-icon.danger:hover { border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.08); }

/* Info grid */
.qr-info-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:14px; }
.qr-info-item {
  padding:8px 12px; border-radius:8px;
  background:var(--bg-primary); border:1px solid var(--border);
  display:flex; flex-direction:column; gap:2px;
}
.qr-info-key { font-size:0.62rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; }
.qr-info-val { font-size:0.78rem; font-weight:700; color:var(--text-primary); }

/* History */
.qr-history-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
.qr-history-card {
  background:var(--bg-card); border:1px solid var(--border); border-radius:14px;
  padding:14px; display:flex; gap:12px; align-items:flex-start;
  transition:all 0.2s ease;
}
.qr-history-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.1); }
.qr-history-img { width:64px; height:64px; border-radius:8px; object-fit:contain; flex-shrink:0; border:1px solid var(--border); }
.qr-history-info { flex:1; min-width:0; }
.qr-history-label { font-weight:700; font-size:0.88rem; color:var(--text-primary); margin-bottom:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.qr-history-date { font-size:0.72rem; color:var(--text-muted); margin-bottom:4px; }
.qr-history-content { font-size:0.72rem; color:var(--text-secondary); font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.qr-history-actions { display:flex; flex-direction:column; gap:6px; flex-shrink:0; }

/* Batch */
.qr-batch-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:14px; margin-top:20px; }
.qr-batch-item {
  background:var(--bg-card); border:1px solid var(--border); border-radius:14px;
  padding:14px; display:flex; flex-direction:column; align-items:center; gap:8px;
  text-align:center; transition:all 0.2s;
}
.qr-batch-item.error { border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.05); }
.qr-batch-item:hover:not(.error) { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.1); }
.qr-batch-img { width:100px; height:100px; border-radius:8px; object-fit:contain; border:1px solid var(--border); }
.qr-batch-label { font-size:0.72rem; font-weight:600; color:var(--text-secondary); word-break:break-all; }
.qr-batch-error { font-size:2rem; }

/* Empty state */
.qr-empty-state { text-align:center; padding:60px 20px; color:var(--text-muted); }
.qr-empty-state p { font-size:0.9rem; color:var(--text-secondary); margin:8px 0 20px; }

/* ── Scanner ── */
.qr-scanner-layout { display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start; }
@media(max-width:900px) { .qr-scanner-layout { grid-template-columns:1fr; } }

.qr-scanner-card {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:20px; padding:22px;
  backdrop-filter:blur(12px);
}

.qr-cam-wrap {
  position:relative; border-radius:16px; overflow:hidden;
  background:#0a0a14; min-height:240px;
  display:flex; align-items:center; justify-content:center;
  border:1.5px solid rgba(255,255,255,0.1);
}
.qr-cam-video { width:100%; max-height:340px; object-fit:cover; display:block; border-radius:16px; }
.qr-cam-video:not(.active) { display:none; }

.qr-cam-placeholder {
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  background:linear-gradient(135deg,#0a0a14,#1a1a2e);
}
.qr-cam-finder {
  width:160px; height:160px; position:relative;
  display:flex; align-items:center; justify-content:center; flex-direction:column;
}

.qr-cam-overlay {
  position:absolute; inset:0; pointer-events:none;
}
.qr-scan-line {
  position:absolute; left:15%; right:15%; height:2px;
  background:linear-gradient(90deg,transparent,rgba(240,180,41,0.8),transparent);
  animation:scanMove 2s ease-in-out infinite; top:20%;
  box-shadow:0 0 8px rgba(240,180,41,0.5);
}
@keyframes scanMove {
  0%   { top:20%; opacity:1 }
  50%  { top:75%; opacity:1 }
  100% { top:20%; opacity:1 }
}

.qr-cam-corner {
  position:absolute; width:20px; height:20px;
  border-color:rgba(240,180,41,0.9); border-style:solid; border-width:0;
}
.qr-cam-corner.tl { top:12px; left:12px; border-top-width:3px; border-left-width:3px; border-radius:2px 0 0 0; }
.qr-cam-corner.tr { top:12px; right:12px; border-top-width:3px; border-right-width:3px; border-radius:0 2px 0 0; }
.qr-cam-corner.bl { bottom:12px; left:12px; border-bottom-width:3px; border-left-width:3px; border-radius:0 0 0 2px; }
.qr-cam-corner.br { bottom:12px; right:12px; border-bottom-width:3px; border-right-width:3px; border-radius:0 0 2px 0; }

.qr-cam-loading {
  position:absolute; inset:0; background:rgba(10,10,20,0.8);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
  backdrop-filter:blur(4px);
}

.qr-scan-error {
  margin-top:14px; padding:12px 14px; border-radius:12px;
  background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25);
  display:flex; gap:10px; align-items:flex-start;
}
.qr-scan-error span { font-size:1.2rem; flex-shrink:0; }
.qr-scan-error strong { font-size:0.82rem; font-weight:700; color:#EF4444; display:block; margin-bottom:2px; }
.qr-scan-error p { font-size:0.78rem; color:rgba(239,68,68,0.85); margin:0; }

/* Result */
.qr-scanner-result-wrap {
  background:color-mix(in srgb,var(--bg-card) 92%,transparent);
  border:1px solid var(--border); border-radius:20px; padding:22px;
  backdrop-filter:blur(12px); min-height:280px;
}
.qr-scan-result { display:flex; flex-direction:column; gap:14px; }
.qr-scan-result-header {
  display:flex; align-items:center; gap:12px; padding:14px;
  background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2);
  border-radius:14px;
}
.qr-scan-result-icon { font-size:2rem; }
.qr-scan-result-type { font-size:1rem; font-weight:800; color:var(--text-primary); }
.qr-scan-result-detected { font-size:0.72rem; color:#10B981; font-weight:600; }
.qr-scan-result-value {
  padding:12px 14px; border-radius:12px;
  background:var(--bg-primary); border:1px solid var(--border);
  display:flex; flex-direction:column; gap:4px;
}
.qr-scan-value-text {
  font-size:0.82rem; color:var(--text-primary); word-break:break-all;
  font-family:monospace; line-height:1.5;
  max-height:80px; overflow-y:auto;
}
.qr-scan-actions { display:flex; gap:8px; flex-wrap:wrap; }
.qr-scan-actions .qr-btn-primary, .qr-scan-actions .qr-btn-secondary { flex:1; min-width:100px; font-size:0.78rem; }

.qr-scan-idle {
  display:flex; flex-direction:column; align-items:center; text-align:center;
  padding:20px 0; color:var(--text-muted);
}
.qr-scan-idle p { margin:0; }
.qr-scan-types-hint { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-top:16px; }
.qr-scan-type-pill {
  padding:4px 10px; border-radius:100px; font-size:0.68rem; font-weight:600;
  background:color-mix(in srgb,var(--accent) 8%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 20%,transparent);
  color:var(--text-secondary);
}
`;
