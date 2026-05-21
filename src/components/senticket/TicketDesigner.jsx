import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as QRCode from 'qrcode';

// ─── Templates prédéfinis ───────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'standard',
    label: 'Standard',
    bgColor: '#ffffff',
    accentColor: '#F0B429',
    textColor: '#1a1a1a',
    fontFamily: 'system-ui, sans-serif',
    layout: 'horizontal',
    showBarcode: true,
    showSeat: true,
    showPrice: true,
  },
  {
    id: 'minimal',
    label: 'Minimal',
    bgColor: '#f8f9fa',
    accentColor: '#000000',
    textColor: '#212529',
    fontFamily: 'Georgia, serif',
    layout: 'vertical',
    showBarcode: false,
    showSeat: false,
    showPrice: true,
  },
  {
    id: 'vip',
    label: 'VIP Gold',
    bgColor: '#0a0a0a',
    accentColor: '#F0B429',
    textColor: '#ffffff',
    fontFamily: 'system-ui, sans-serif',
    layout: 'horizontal',
    showBarcode: true,
    showSeat: true,
    showPrice: true,
  },
  {
    id: 'concert',
    label: 'Concert Live',
    bgColor: '#1a0a2e',
    accentColor: '#e040fb',
    textColor: '#ffffff',
    fontFamily: 'system-ui, sans-serif',
    layout: 'vertical',
    showBarcode: true,
    showSeat: true,
    showPrice: true,
  },
  {
    id: 'gala',
    label: 'Gala Élégance',
    bgColor: '#fff8f0',
    accentColor: '#c9a84c',
    textColor: '#1a1a1a',
    fontFamily: 'Georgia, serif',
    layout: 'horizontal',
    showBarcode: true,
    showSeat: true,
    showPrice: true,
  },
];

const SIZES = [
  { id: 'digital', label: 'Numérique (600×300)', width: 600, height: 300 },
  { id: 'print', label: 'Print (1200×400)', width: 1200, height: 400 },
  { id: 'square', label: 'Carré (600×600)', width: 600, height: 600 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function genTicketNumber(eventId, index) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const seq = String(index + 1).padStart(3, '0');
  return `STK-${date}-${seq}-${rand}`;
}

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────
async function renderTicketToCanvas({
  canvas,
  template,
  eventData,
  buyerData,
  ticketNumber,
  qrDataUrl,
  logoUrl,
  size,
}) {
  const ctx = canvas.getContext('2d');
  const { width, height } = size;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);

  const { bgColor, accentColor, textColor, fontFamily, layout, showBarcode, showSeat, showPrice } = template;
  const isDark = bgColor === '#0a0a0a' || bgColor === '#1a0a2e';
  const lightColor = isDark ? '#ffffff' : textColor;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Accent stripe
  ctx.fillStyle = accentColor;
  if (layout === 'horizontal') {
    ctx.fillRect(0, 0, 8, height);
    ctx.fillRect(width - 8, 0, 8, height);
  } else {
    ctx.fillRect(0, 0, width, 8);
    ctx.fillRect(0, height - 8, width, 8);
  }

  // Subtle pattern for VIP
  if (template.id === 'vip') {
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = accentColor;
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath();
        ctx.arc(i, j, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Helper text
  const drawText = (text, x, y, opts = {}) => {
    ctx.font = `${opts.weight || 600} ${opts.size || 16}px ${fontFamily}`;
    ctx.fillStyle = opts.color || lightColor;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'top';
    if (opts.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    ctx.fillText(text, x, y);
    ctx.shadowColor = 'transparent';
  };

  // Logo
  let logoY = 20;
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl);
      const logoW = layout === 'horizontal' ? 80 : 100;
      const logoH = (logo.height / logo.width) * logoW;
      const logoX = layout === 'horizontal' ? 24 : (width - logoW) / 2;
      logoY = logoX === (width - logoW) / 2 ? 30 : 20;
      ctx.drawImage(logo, logoX, 20, logoW, logoH);
      logoY = 20 + logoH + 12;
    } catch { /* ignore */ }
  }

  // Layout calculations
  const leftX = layout === 'horizontal' ? 24 : 24;
  const contentW = layout === 'horizontal' ? width * 0.55 : width - 48;
  const qrX = layout === 'horizontal' ? width - 160 : (width - 140) / 2;
  const qrY = layout === 'horizontal' ? (height - 140) / 2 : height - 160;
  const qrSize = layout === 'horizontal' ? 140 : 120;

  // Event title
  drawText(eventData.titre || 'Événement', leftX, logoY, { size: 24, weight: 800, color: accentColor });

  // Event info
  const infoY = logoY + 36;
  const infos = [];
  if (eventData.date) infos.push(`📅 ${new Date(eventData.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  if (eventData.heure) infos.push(`🕐 ${eventData.heure}`);
  if (eventData.lieu) infos.push(`📍 ${eventData.lieu}`);
  if (eventData.ville) infos.push(`🏙️ ${eventData.ville}`);

  infos.forEach((info, i) => {
    drawText(info, leftX, infoY + i * 22, { size: 13, weight: 500, color: lightColor });
  });

  const buyerY = infoY + infos.length * 22 + 20;

  // Buyer section with background
  if (buyerData.nom || buyerData.email) {
    ctx.fillStyle = hexToRgba(accentColor, 0.08);
    const boxH = showSeat ? 90 : 60;
    roundRect(ctx, leftX - 8, buyerY - 8, contentW + 16, boxH, 8);
    ctx.fill();

    drawText('👤 ' + (buyerData.nom || 'Invité'), leftX, buyerY, { size: 15, weight: 700, color: lightColor });
    if (buyerData.email) {
      drawText(buyerData.email, leftX, buyerY + 22, { size: 12, weight: 400, color: lightColor });
    }
  }

  // Seat / Category
  let seatY = buyerY + 60;
  if (showSeat && buyerData.categorie) {
    drawText(`🎫 ${buyerData.categorie}`, leftX, seatY, { size: 13, weight: 600, color: accentColor });
    seatY += 24;
  }
  if (showSeat && buyerData.siege) {
    drawText(`💺 Siège : ${buyerData.siege}`, leftX, seatY, { size: 13, weight: 600, color: lightColor });
  }

  // Price
  if (showPrice && buyerData.prix !== undefined) {
    const priceY = layout === 'horizontal' ? height - 50 : height - 180;
    const priceX = layout === 'horizontal' ? leftX : width / 2;
    const align = layout === 'horizontal' ? 'left' : 'center';
    drawText(`${buyerData.prix.toLocaleString('fr-FR')} FCFA`, priceX, priceY, { size: 20, weight: 800, color: accentColor, align });
  }

  // Ticket number (prominent)
  const numY = layout === 'horizontal' ? height - 24 : height - 50;
  const numX = layout === 'horizontal' ? leftX : width / 2;
  const numAlign = layout === 'horizontal' ? 'left' : 'center';
  drawText(`N° ${ticketNumber}`, numX, numY, { size: 11, weight: 600, color: hexToRgba(lightColor, 0.5), align: numAlign });

  // QR Code
  if (qrDataUrl) {
    try {
      const qrImg = await loadImage(qrDataUrl);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.restore();

      // QR label
      drawText('SCANNEZ-MOI', qrX + qrSize / 2, qrY + qrSize + 20, { size: 10, weight: 700, color: hexToRgba(lightColor, 0.4), align: 'center' });
    } catch { /* ignore */ }
  }

  // Barcode line (visual only)
  if (showBarcode) {
    const bcY = layout === 'horizontal' ? height - 24 : height - 24;
    const bcX = layout === 'horizontal' ? qrX - 20 : 24;
    const bcW = layout === 'horizontal' ? qrSize + 40 : width - 48;
    drawBarcode(ctx, ticketNumber, bcX + bcW / 2, bcY, bcW, 16, lightColor);
  }

  // Watermark
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.font = `700 48px ${fontFamily}`;
  ctx.fillStyle = lightColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillText('SENTICKET', 0, 0);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBarcode(ctx, text, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let px = x - w / 2;
  const step = w / 60;
  for (let i = 0; i < 60; i++) {
    const barW = step * ((seed + i * 7) % 3 + 1) * 0.6;
    if ((seed + i * 13) % 2 === 0) {
      ctx.fillRect(px, y - h / 2, barW, h);
    }
    px += step;
  }
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TicketDesigner({ event, orders = [], onClose }) {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [logoUrl, setLogoUrl] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const canvasRef = useRef(null);
  const previewWrapRef = useRef(null);

  const sampleBuyer = useMemo(() => ({
    nom: 'Amadou Diallo',
    email: 'amadou.diallo@email.com',
    categorie: event?.billets?.[0]?.nom || 'Standard',
    siege: 'A-12',
    prix: event?.billets?.[0]?.prix || 5000,
  }), [event]);

  const ticketNumber = useMemo(() => genTicketNumber(event?.id, previewIndex), [event?.id, previewIndex]);

  const qrData = useMemo(() => {
    const base = JSON.stringify({
      eventId: event?.id,
      ticketNumber,
      type: 'senticket',
      ts: Date.now(),
    });
    return btoa(base);
  }, [event?.id, ticketNumber]);

  // Render preview
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!canvasRef.current) return;
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1, errorCorrectionLevel: 'H' });
      if (cancelled) return;
      await renderTicketToCanvas({
        canvas: canvasRef.current,
        template,
        eventData: {
          titre: event?.titre || 'Mon Événement',
          date: event?.date,
          heure: event?.heure,
          lieu: event?.lieu,
          ville: event?.ville,
        },
        buyerData: sampleBuyer,
        ticketNumber,
        qrDataUrl,
        logoUrl: logoUrl || event?.cover_url || '',
        size,
      });
    }
    draw();
    return () => { cancelled = true; };
  }, [template, size, logoUrl, qrData, ticketNumber, sampleBuyer, event]);

  const downloadPNG = useCallback(async () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `ticket_${ticketNumber}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [ticketNumber]);

  const downloadBatchPDF = useCallback(async () => {
    if (!canvasRef.current || !event) return;
    setGenerating(true);
    try {
      const pages = [];
      for (let i = 0; i < batchCount; i++) {
        const num = genTicketNumber(event.id, i);
        const qr = await QRCode.toDataURL(btoa(JSON.stringify({ eventId: event.id, ticketNumber: num, type: 'senticket', ts: Date.now() })), { width: 200, margin: 1, errorCorrectionLevel: 'H' });

        const c = document.createElement('canvas');
        await renderTicketToCanvas({
          canvas: c,
          template,
          eventData: { titre: event.titre, date: event.date, heure: event.heure, lieu: event.lieu, ville: event.ville },
          buyerData: { ...sampleBuyer, nom: `Invité ${i + 1}` },
          ticketNumber: num,
          qrDataUrl: qr,
          logoUrl: logoUrl || event.cover_url || '',
          size: SIZES[1], // Use print size for PDF
        });
        pages.push({ image: c.toDataURL('image/png'), ticketNumber: num });
      }

      // Generate PDF with multiple tickets per page
      await generateTicketPDF(pages, event.titre);
    } catch (e) {
      alert('Erreur PDF : ' + e.message);
    }
    setGenerating(false);
  }, [template, event, logoUrl, sampleBuyer, batchCount]);

  return (
    <div className="td-overlay" onClick={onClose}>
      <div className="td-modal" onClick={e => e.stopPropagation()}>
        <div className="td-header">
          <h2>🎨 Designer de tickets</h2>
          <button className="td-close" onClick={onClose}>✕</button>
        </div>

        <div className="td-body">
          {/* Left: Controls */}
          <div className="td-controls">
            {/* Template */}
            <div className="td-section">
              <label>Template</label>
              <div className="td-templates">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className={`td-tpl-btn ${template.id === t.id ? 'active' : ''}`}
                    onClick={() => setTemplate(t)}
                    style={{ borderColor: t.accentColor }}
                  >
                    <span className="td-tpl-swatch" style={{ background: t.bgColor, borderColor: t.accentColor }} />
                    <span className="td-tpl-name">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="td-section">
              <label>Format</label>
              <select value={size.id} onChange={e => setSize(SIZES.find(s => s.id === e.target.value))}>
                {SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {/* Colors */}
            <div className="td-section">
              <label>Personnalisation</label>
              <div className="td-colors">
                <div className="td-color">
                  <span>Fond</span>
                  <input type="color" value={template.bgColor} onChange={e => setTemplate({ ...template, bgColor: e.target.value })} />
                </div>
                <div className="td-color">
                  <span>Accent</span>
                  <input type="color" value={template.accentColor} onChange={e => setTemplate({ ...template, accentColor: e.target.value })} />
                </div>
                <div className="td-color">
                  <span>Texte</span>
                  <input type="color" value={template.textColor} onChange={e => setTemplate({ ...template, textColor: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Layout toggle */}
            <div className="td-section">
              <label>Disposition</label>
              <div className="td-toggle">
                <button className={template.layout === 'horizontal' ? 'active' : ''} onClick={() => setTemplate({ ...template, layout: 'horizontal' })}>Horizontal</button>
                <button className={template.layout === 'vertical' ? 'active' : ''} onClick={() => setTemplate({ ...template, layout: 'vertical' })}>Vertical</button>
              </div>
            </div>

            {/* Options */}
            <div className="td-section">
              <label>Options</label>
              <div className="td-checks">
                <label><input type="checkbox" checked={template.showPrice} onChange={e => setTemplate({ ...template, showPrice: e.target.checked })} /> Prix</label>
                <label><input type="checkbox" checked={template.showSeat} onChange={e => setTemplate({ ...template, showSeat: e.target.checked })} /> Siège/Catégorie</label>
                <label><input type="checkbox" checked={template.showBarcode} onChange={e => setTemplate({ ...template, showBarcode: e.target.checked })} /> Code-barre</label>
              </div>
            </div>

            {/* Logo */}
            <div className="td-section">
              <label>Logo / Cover (URL)</label>
              <input
                type="text"
                placeholder="https://..."
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="td-input"
              />
              {event?.cover_url && !logoUrl && (
                <button className="td-link" onClick={() => setLogoUrl(event.cover_url)}>
                  Utiliser la cover de l'événement
                </button>
              )}
            </div>

            {/* Batch */}
            <div className="td-section">
              <label>Génération batch</label>
              <input
                type="number"
                min={1}
                max={100}
                value={batchCount}
                onChange={e => setBatchCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="td-input"
              />
              <span className="td-hint">Nombre de tickets à générer en PDF</span>
            </div>

            {/* Actions */}
            <div className="td-actions">
              <button className="td-btn-primary" onClick={downloadPNG}>
                ⬇️ PNG
              </button>
              <button className="td-btn-gold" onClick={downloadBatchPDF} disabled={generating}>
                {generating ? '⏳ Génération…' : '📄 PDF Batch'}
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="td-preview" ref={previewWrapRef}>
            <div className="td-preview-inner">
              <canvas ref={canvasRef} className="td-canvas" />
            </div>
            <div className="td-preview-info">
              <span>#{previewIndex + 1}</span>
              <div className="td-preview-nav">
                <button onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}>←</button>
                <button onClick={() => setPreviewIndex(previewIndex + 1)}>→</button>
              </div>
              <span className="td-tnum">{ticketNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .td-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .td-modal {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px;
          width: 100%; max-width: 1400px; max-height: 90vh; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.3);
        }
        .td-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; border-bottom: 1px solid var(--border);
        }
        .td-header h2 { margin: 0; font-size: 1.1rem; color: var(--text-primary); }
        .td-close {
          background: none; border: none; color: var(--text-muted); font-size: 1.3rem; cursor: pointer;
        }
        .td-body {
          display: grid; grid-template-columns: 320px 1fr; gap: 0;
          overflow: hidden; flex: 1;
        }
        @media (max-width: 768px) {
          .td-body { grid-template-columns: 1fr; overflow-y: auto; }
          .td-preview { min-height: 300px; }
        }
        .td-controls {
          padding: 20px; overflow-y: auto; border-right: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 16px;
        }
        .td-section label {
          display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 1px; color: var(--text-muted); margin-bottom: 8px;
        }
        .td-section select, .td-input {
          width: 100%; padding: 10px 12px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--bg-primary);
          color: var(--text-primary); font-size: 0.85rem; outline: none;
        }
        .td-templates {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
        }
        .td-tpl-btn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 8px; border-radius: 10px; border: 1.5px solid var(--border);
          background: transparent; cursor: pointer; transition: all 0.2s;
        }
        .td-tpl-btn.active {
          border-color: var(--accent); box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.15);
        }
        .td-tpl-swatch {
          width: 32px; height: 32px; border-radius: 8px; border: 2px solid;
        }
        .td-tpl-name { font-size: 0.65rem; font-weight: 600; color: var(--text-secondary); }
        .td-colors { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .td-color {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .td-color span { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; }
        .td-color input[type="color"] {
          width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border);
          background: none; cursor: pointer; padding: 2px;
        }
        .td-toggle { display: flex; gap: 6px; }
        .td-toggle button {
          flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border);
          background: transparent; color: var(--text-secondary); font-size: 0.78rem; cursor: pointer;
        }
        .td-toggle button.active {
          border-color: var(--accent); background: rgba(var(--accent-rgb), 0.1); color: var(--accent); font-weight: 700;
        }
        .td-checks { display: flex; flex-direction: column; gap: 8px; }
        .td-checks label {
          display: flex; align-items: center; gap: 8px; font-size: 0.82rem; text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--text-secondary);
        }
        .td-checks input { accent-color: var(--accent); }
        .td-link {
          margin-top: 6px; font-size: 0.75rem; color: var(--accent); background: none; border: none; cursor: pointer; text-decoration: underline;
        }
        .td-hint { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; display: block; }
        .td-actions {
          display: flex; gap: 8px; margin-top: 8px;
        }
        .td-btn-primary, .td-btn-gold {
          flex: 1; padding: 12px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
        }
        .td-btn-primary {
          background: var(--accent); color: #fff;
        }
        .td-btn-gold {
          background: linear-gradient(135deg, #F0B429, #D4A017); color: #1a0d00;
        }
        .td-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
        .td-preview {
          padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: var(--bg-primary); position: relative; overflow: auto;
        }
        .td-preview-inner {
          border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 1px solid var(--border);
        }
        .td-canvas { display: block; max-width: 100%; height: auto; }
        .td-preview-info {
          margin-top: 16px; display: flex; align-items: center; gap: 12px;
          color: var(--text-muted); font-size: 0.82rem;
        }
        .td-preview-nav { display: flex; gap: 6px; }
        .td-preview-nav button {
          padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border);
          background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-weight: 700;
        }
        .td-tnum { font-family: monospace; font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

// ─── PDF Generator ──────────────────────────────────────────────────────────────
async function generateTicketPDF(pages, eventTitle) {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 10;
  const ticketsPerPage = 4;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && i % ticketsPerPage === 0) pdf.addPage();
    const pageIndex = i % ticketsPerPage;
    const row = Math.floor(pageIndex / 2);
    const col = pageIndex % 2;
    const ticketW = (pageW - margin * 3) / 2;
    const ticketH = (pageH - margin * 5) / 2;
    const x = margin + col * (ticketW + margin);
    const y = margin + row * (ticketH + margin);

    pdf.setDrawColor(200);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, ticketW, ticketH);

    // Insert image
    try {
      pdf.addImage(pages[i].image, 'PNG', x + 2, y + 2, ticketW - 4, ticketH - 10, undefined, 'FAST');
    } catch {
      pdf.setFontSize(10);
      pdf.text('Ticket ' + (i + 1), x + 5, y + 10);
    }

    // Number below
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(pages[i].ticketNumber, x + 2, y + ticketH - 2);
  }

  pdf.save(`tickets_${eventTitle?.replace(/\s+/g, '_') || 'event'}.pdf`);
}
