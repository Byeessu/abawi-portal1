/**
 * Génère un thumbnail OG 1200×630 pour chaque outil ABAWI.
 * Sortie : public/og-tools/[tool-id].jpg
 * Run : node scripts/gen-tool-thumbnails.mjs
 *       node scripts/gen-tool-thumbnails.mjs cv          (un seul outil)
 */

import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync, readFileSync, statSync, unlinkSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dir   = dirname(fileURLToPath(import.meta.url))
const pubDir  = resolve(__dir, '../public')
const outDir  = resolve(pubDir, 'og-tools')
mkdirSync(outDir, { recursive: true })

// ── Palette accentuation par outil ─────────────────────────────────────────
const TOOL_THEMES = {
  'abawi-ia':           { icon:'🤖', badge:'IA EXPERT',       accent:'#18A84A', from:'#052010', to:'#0a3520' },
  'abawi-ia-vocal':     { icon:'🎤', badge:'IA VOCAL',        accent:'#18A84A', from:'#052010', to:'#0a3520' },
  'image-pro':          { icon:'🖼️', badge:'ÉDITION PHOTO',   accent:'#06B6D4', from:'#03111a', to:'#0a2030' },
  'photo-studio-pro':   { icon:'📷', badge:'STUDIO PHOTO',    accent:'#EC4899', from:'#1a0311', to:'#2d0820' },
  'cv':                 { icon:'📄', badge:'CV PRO ATS',       accent:'#3B82F6', from:'#051528', to:'#0a2548' },
  'lettre':             { icon:'✉️', badge:'LETTRE MOTIVATION',accent:'#8B5CF6', from:'#0d0520', to:'#1a0d38' },
  'facture':            { icon:'🧾', badge:'FACTURE & DEVIS',  accent:'#F0B429', from:'#1a1000', to:'#2e1e00' },
  'analyse-cv':         { icon:'🔍', badge:'ANALYSE CV IA',    accent:'#0EA5E9', from:'#031520', to:'#082535' },
  'pro-card-elite':     { icon:'💳', badge:'CARTE PRO ÉLITE',  accent:'#F59E0B', from:'#1a1000', to:'#2d1c00' },
  'qr-code-pro':        { icon:'⬛', badge:'QR CODE PRO',      accent:'#10B981', from:'#031810', to:'#051f14' },
  'smart-word-editor':  { icon:'📝', badge:'ÉDITEUR IA',       accent:'#6366F1', from:'#0a0520', to:'#160d38' },
  'format-converter':   { icon:'🔄', badge:'CONVERTISSEUR',   accent:'#14B8A6', from:'#031815', to:'#061f1a' },
  'dictionnaire-elite': { icon:'📖', badge:'DICTIONNAIRE PRO', accent:'#A855F7', from:'#0e0520', to:'#1c0a38' },
  'translator-elite':   { icon:'🌐', badge:'TRADUCTEUR ÉLITE', accent:'#22D3EE', from:'#031820', to:'#063040' },
  'business-plan':      { icon:'📊', badge:'BUSINESS PLAN',    accent:'#F0B429', from:'#1a1000', to:'#2e1e00' },
  'pitch':              { icon:'🎯', badge:'PITCH DECK',       accent:'#8B5CF6', from:'#0d0520', to:'#1c0d3a' },
  'finance':            { icon:'💰', badge:'FINANCE ÉLITE',    accent:'#10B981', from:'#031810', to:'#052818' },
  'juridique':          { icon:'⚖️', badge:'JURIDIQUE OHADA',  accent:'#F59E0B', from:'#1a1000', to:'#2d1c00' },
  'comptable':          { icon:'🧮', badge:'COMPTABLE ÉLITE',  accent:'#14B8A6', from:'#031815', to:'#062520' },
  'rh':                 { icon:'👥', badge:'RH ÉLITE',          accent:'#FB923C', from:'#1a0800', to:'#2d1200' },
  'immobilier':         { icon:'🏠', badge:'IMMOBILIER ÉLITE', accent:'#EC4899', from:'#1a0310', to:'#2d0820' },
  'consultant':         { icon:'💼', badge:'CONSULTANT ÉLITE', accent:'#3B82F6', from:'#051528', to:'#0a2548' },
  'smart-office':       { icon:'🖥️', badge:'SMART OFFICE',     accent:'#6366F1', from:'#0a0520', to:'#160d38' },
  'exegetika':          { icon:'📚', badge:'EXÉGÈTIKA',        accent:'#A855F7', from:'#0e0520', to:'#1c0a38' },
  'audio-studio':       { icon:'🎵', badge:'STUDIO AUDIO',     accent:'#F43F5E', from:'#1a0308', to:'#2d0510' },
  'infographie-pro':    { icon:'🎨', badge:'INFOGRAPHIE PRO',  accent:'#EC4899', from:'#1a0310', to:'#2d0820' },
  'studio-visuel-pro':  { icon:'🎬', badge:'STUDIO VISUEL',    accent:'#F43F5E', from:'#1a0308', to:'#2d0510' },
  'pitch-deck':         { icon:'🎯', badge:'PITCH DECK',       accent:'#8B5CF6', from:'#0d0520', to:'#1c0d3a' },
}

function getTheme(id) {
  return TOOL_THEMES[id] || { icon:'🛠️', badge:'OUTIL IA', accent:'#18A84A', from:'#052010', to:'#0a3520' }
}

function makeHtml(id, title, desc, theme, pubDir) {
  const { icon, badge, accent, from: bg1, to: bg2 } = theme
  const safe = (s='') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const shortDesc = (desc || '').length > 110 ? (desc || '').slice(0, 108) + '…' : (desc || '')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;font-family:'Arial',sans-serif;
       background:linear-gradient(135deg,${bg1} 0%,${bg2} 100%)}

  /* Grille */
  .grid{position:absolute;inset:0;
    background-image:linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px);
    background-size:36px 36px;pointer-events:none}

  /* Orbes */
  .orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(60px)}
  .orb1{width:400px;height:400px;top:-80px;right:-80px;
        background:radial-gradient(circle,${accent}44 0%,transparent 70%)}
  .orb2{width:260px;height:260px;bottom:-60px;left:15%;
        background:radial-gradient(circle,rgba(255,255,255,0.06) 0%,transparent 70%)}
  .orb3{width:200px;height:200px;top:30%;right:18%;filter:blur(40px);
        background:radial-gradient(circle,${accent}33 0%,transparent 70%)}

  /* Coins déco */
  .corner{position:absolute;width:44px;height:44px}
  .corner::before,.corner::after{content:'';position:absolute;background:${accent};opacity:0.7}
  .corner::before{width:100%;height:2px}
  .corner::after{width:2px;height:100%}
  .c-tl{top:20px;left:20px} .c-tl::before{top:0;left:0} .c-tl::after{top:0;left:0}
  .c-tr{top:20px;right:20px;transform:scaleX(-1)}
  .c-bl{bottom:52px;left:20px;transform:scaleY(-1)}
  .c-br{bottom:52px;right:20px;transform:scale(-1)}

  /* Logo ABAWI */
  .logo-wrap{position:absolute;top:22px;left:22px;display:flex;align-items:center;gap:12px;z-index:10}
  .logo-circle{width:52px;height:52px;border-radius:50%;background:#111;overflow:hidden;
    border:3px solid transparent;
    background-clip:padding-box;
    box-shadow:0 0 0 2px ${accent},0 0 18px ${accent}88,0 0 0 5px ${accent}22}
  .logo-circle img{width:100%;height:100%;object-fit:cover;border-radius:50%}
  .brand-name{display:flex;flex-direction:column;gap:2px}
  .brand-abawi{font-size:11px;font-weight:900;color:rgba(255,255,255,0.5);letter-spacing:2.5px;text-transform:uppercase}
  .brand-tool{font-size:14px;font-weight:800;color:rgba(255,255,255,0.92);letter-spacing:0.5px;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  /* Badge */
  .badge{position:absolute;top:22px;right:22px;z-index:10;
    display:flex;align-items:center;gap:6px;
    padding:5px 14px;border-radius:100px;
    background:rgba(255,255,255,0.1);
    border:1px solid rgba(255,255,255,0.2);
    font-size:11px;font-weight:800;color:#fff;letter-spacing:1.8px;text-transform:uppercase}
  .badge-dot{width:6px;height:6px;border-radius:50%;background:${accent};box-shadow:0 0 6px ${accent}}

  /* Corps principal */
  .main{position:absolute;top:100px;left:40px;right:40px;bottom:52px;
        display:flex;align-items:center;gap:40px;z-index:10}

  /* Icône outil */
  .tool-icon{width:140px;height:140px;border-radius:28px;flex-shrink:0;
    background:rgba(255,255,255,0.12);
    border:1.5px solid rgba(255,255,255,0.22);
    display:flex;align-items:center;justify-content:center;
    font-size:72px;
    box-shadow:0 12px 40px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.25);
    position:relative}
  .tool-icon-halo{position:absolute;inset:-16px;border-radius:36px;
    background:${accent}33;filter:blur(20px);pointer-events:none}

  /* Contenu texte */
  .text-block{flex:1;display:flex;flex-direction:column;gap:14px}
  .tool-title{font-size:52px;font-weight:900;color:#fff;line-height:1.08;letter-spacing:-1px;
    text-shadow:0 4px 20px rgba(0,0,0,0.4)}
  .tool-title span{color:${accent}}
  .separator{display:flex;gap:6px;align-items:center}
  .sep-line{height:3px;border-radius:2px}
  .tool-desc{font-size:16px;color:rgba(255,255,255,0.72);line-height:1.6;max-width:580px}

  /* Barre bas */
  .ticker-bar{position:absolute;bottom:0;left:0;right:0;height:42px;
    background:rgba(0,0,0,0.25);
    border-top:1px solid rgba(255,255,255,0.07);
    display:flex;align-items:center;padding:0 24px;gap:0;overflow:hidden}
  .ticker-text{font-size:11px;font-weight:700;letter-spacing:2px;
    color:${accent};text-transform:uppercase;opacity:0.85;white-space:nowrap}
</style>
</head><body>
  <div class="grid"></div>
  <div class="orb orb1"></div>
  <div class="orb orb2"></div>
  <div class="orb orb3"></div>

  <!-- Coins déco -->
  <div class="corner c-tl"></div>
  <div class="corner c-tr"></div>
  <div class="corner c-bl"></div>
  <div class="corner c-br"></div>

  <!-- Logo + nom outil -->
  <div class="logo-wrap">
    <div class="logo-circle">
      <img src="${pubDir}/favicon-symbol.png" alt="ABAWI"/>
    </div>
    <div class="brand-name">
      <span class="brand-abawi">ABAWI</span>
      <span class="brand-tool">${safe(title)}</span>
    </div>
  </div>

  <!-- Badge -->
  <div class="badge">
    <div class="badge-dot"></div>
    ${safe(badge)}
  </div>

  <!-- Corps -->
  <div class="main">
    <div class="tool-icon">
      <div class="tool-icon-halo"></div>
      ${icon}
    </div>
    <div class="text-block">
      <div class="tool-title">${safe(title)}</div>
      <div class="separator">
        <div class="sep-line" style="width:50px;background:${accent}"></div>
        <div class="sep-line" style="width:32px;background:#F0B429"></div>
        <div class="sep-line" style="width:24px;background:#8B5CF6"></div>
      </div>
      <div class="tool-desc">${safe(shortDesc)}</div>
    </div>
  </div>

  <!-- Barre bas ticker -->
  <div class="ticker-bar">
    <span class="ticker-text">
      ${safe(title)} · ABAWI DIGITAL · OUTIL IA · PORTAIL PREMIUM AFRICAIN · INTELLIGENCE ARTIFICIELLE · ${safe(badge)} · EXCELLENCE AFRICAINE
    </span>
  </div>
</body></html>`
}

// ── Liste des outils à générer ───────────────────────────────────────────────
// [id, title, description]
const TOOLS = [
  ['abawi-ia',          'ABAWI IA',              'Coach IA expert senior multilingue. Quiz, recherche, simulation, apprentissage, débat, assistant vocal — 7 modes 24h/24.'],
  ['abawi-ia-vocal',    'ABAWI IA Vocal',         'Coach vocal Annah : réponses stratégiques + lecture vocale instantanée en Français, Anglais et Wolof.'],
  ['image-pro',         'Image Pro',              'Éditeur photo ultra-complet : suppression fond IA, Chroma Key, tampon clonage, modes fusion, retouche, export PNG/JPEG/WebP.'],
  ['photo-studio-pro',  'Studio Photo ID Pro',    'Webcam HD, formats UE/USA/admin, filtres express, retouche auto, correction colorimétrique, export PNG/JPG.'],
  ['cv',                'Créateur de CV Pro',     'CV professionnel optimisé ATS, 8 thèmes premium, import fichier, variantes IA. Aperçu gratuit, export PDF/Word.'],
  ['lettre',            'Lettre de Motivation',   'Lettre personnalisée et professionnelle en 2 minutes. Générée par IA, personnalisée selon le poste.'],
  ['facture',           'Facture / Devis Pro',    'Factures et devis professionnels avec calcul automatique TVA, logo, coordonnées, export PDF.'],
  ['analyse-cv',        'Analyse de CV par IA',   "Score ATS, points forts/faibles, suggestions d'amelioration, rapport detaille pour booster votre CV."],
  ['pro-card-elite',    'Pro Card Élite',         'Cartes de visite physiques & numériques. 12 templates, recto/verso, QR code, export PDF print-ready.'],
  ['qr-code-pro',       'QR Code Pro',            '12 types de QR codes pro : URL, vCard, WiFi, WhatsApp, paiement, Instagram. Logo intégré, export PNG/SVG.'],
  ['smart-word-editor', 'Smart Word Editor',      'Éditeur de documents professionnel avec templates multiples, contrôle marges, polices variées.'],
  ['format-converter',  'Format Converter Pro',   'Convertisseur universel local : images, audio, vidéo, documents, données. Aucun upload serveur.'],
  ['dictionnaire-elite','Abawi Language Pro',     'Dictionnaire massif multilingue + auto-run IA (FR, EN, Wolof, 中文, ES, IT, AR).'],
  ['translator-elite',  'Abawi Translator Elite', 'Traduction avancée + explication exhaustive dans la langue de votre choix.'],
  ['business-plan',     'Business Plan Élite',    'Business plan exhaustif : executive summary, projections financières 3 ans, SWOT, analyse marché.'],
  ['pitch',             'Pitch Deck Investisseur','10 slides VC-grade générées par IA, design pro, données Africa-first, export PDF prêt à présenter.'],
  ['finance',           'Finance Élite',          'Analyse financière complète : ratios, DCF, score crédit, trésorerie, rapport IA personnalisé.'],
  ['juridique',         'Juridique Élite',        '12 types de documents juridiques OHADA : statuts, contrats, baux, NDA, PV AG. Conformite garantie.'],
  ['comptable',         'Comptable Élite',        'Journal SYSCOHADA, balance, TVA, paie SN, KPI comptables, rapport IA. Norme OHADA complète.'],
  ['rh',                'RH Élite',               'Grille salaires, évaluation 360°, paie SN, contrats, règlement intérieur, onboarding structuré.'],
  ['immobilier',        'Immobilier Élite',       'Simulation investissement, rendement locatif, financement, estimation, bail, business plan immo.'],
  ['consultant',        'Consultant Élite',       'Proposition commerciale, rapport de mission, étude de marché, SWOT, CR réunion, KPI dashboard.'],
  ['smart-office',      'Smart Office Pro',       'Éditeur intelligent avancé pour documents pro avec commandes rapides et IA intégrée.'],
  ['audio-studio',      'Audio Studio Élite',     'Enregistrement, mixage, effets, export MP3/WAV. Studio audio professionnel dans votre navigateur.'],
  ['infographie-pro',   'Infographie Pro',        'Créez des infographies et visuels professionnels en quelques clics. Templates premium, export HD.'],
  ['studio-visuel-pro', 'Studio Visuel Pro',      'Studio de création visuelle complet : affiches, bannières, posts réseaux sociaux, export multi-formats.'],
]

// Filtre si un ID spécifique est passé en argument
const targetId = process.argv[2]
const toolsToRun = targetId ? TOOLS.filter(([id]) => id === targetId) : TOOLS

console.log(`▶  Génération de ${toolsToRun.length} thumbnail(s) OG…\n`)

const browser = await puppeteer.launch({
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files'],
})

for (const [id, title, desc] of toolsToRun) {
  const theme   = getTheme(id)
  const html    = makeHtml(id, title, desc, theme, pubDir)
  const tmpPath = resolve(pubDir, `_og-tmp-${id}.html`)
  const outPath = resolve(outDir, `${id}.jpg`)

  writeFileSync(tmpPath, html)

  const page = await browser.newPage()
  await page.setViewport({ width:1200, height:630, deviceScaleFactor:1 })
  await page.goto(pathToFileURL(tmpPath).href, { waitUntil:'networkidle0' })
  await page.screenshot({ path:outPath, type:'jpeg', quality:88, clip:{x:0,y:0,width:1200,height:630} })
  await page.close()

  try { unlinkSync(tmpPath) } catch { /* ignore */ }

  const kb = Math.round(statSync(outPath).size / 1024)
  console.log(`  ✓  ${id.padEnd(24)} → ${kb} KB`)
}

await browser.close()
console.log('\n✅  Tous les thumbnails générés dans public/og-tools/')
