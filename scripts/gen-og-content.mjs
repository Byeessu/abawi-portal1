/**
 * Génère des bannières OG 1200×630 pour guides, podcasts et fascicules.
 *
 * Sortie :
 *   public/og-content/guides/[id].jpg
 *   public/og-content/podcasts/[id].jpg
 *   public/og-content/fascicules/[id].jpg
 *
 * Usage :
 *   node scripts/gen-og-content.mjs              (tout générer)
 *   node scripts/gen-og-content.mjs guides        (seulement les guides)
 *   node scripts/gen-og-content.mjs podcasts      (seulement les podcasts)
 *   node scripts/gen-og-content.mjs fascicules    (seulement les fascicules)
 *   node scripts/gen-og-content.mjs --force       (regénérer même si le fichier existe)
 */

import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync, existsSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const ROOT   = resolve(__dir, '..')
const PUB    = resolve(ROOT, 'public')

const args   = process.argv.slice(2)
const FORCE  = args.includes('--force')
const FILTER = args.filter(a => !a.startsWith('--'))[0] || 'all'

// ── Palette par catégorie/matière ───────────────────────────────────────────
const GUIDE_ACCENT = {
  'Business & Digital': { accent: '#18A84A', from: '#031a0c', to: '#052e15' },
  'Finance & Compta':   { accent: '#F0B429', from: '#1a0e00', to: '#2e1c00' },
  'Juridique':          { accent: '#F59E0B', from: '#1a1000', to: '#2d1c00' },
  'Marketing':          { accent: '#EC4899', from: '#1a0311', to: '#2d0820' },
  'RH & Management':    { accent: '#FB923C', from: '#1a0800', to: '#2d1200' },
  'Immobilier':         { accent: '#06B6D4', from: '#031018', to: '#061e2d' },
  'Tech & Digital':     { accent: '#6366F1', from: '#0a0520', to: '#160d38' },
  'Academy Bac':        { accent: '#3B82F6', from: '#041025', to: '#08203f' },
  default:              { accent: '#18A84A', from: '#031a0c', to: '#052e15' },
}

const MATIERE_ACCENT = {
  'Maths':          { accent: '#EAB308', from: '#180e00', to: '#2d1c00' },
  'Physique':       { accent: '#06B6D4', from: '#03111a', to: '#062230' },
  'Chimie':         { accent: '#A855F7', from: '#0e0520', to: '#1c0a38' },
  'SVT':            { accent: '#22C55E', from: '#031a0c', to: '#052e18' },
  'Anglais':        { accent: '#3B82F6', from: '#041025', to: '#08203f' },
  'Philo':          { accent: '#F43F5E', from: '#1a0308', to: '#2d0510' },
  'Histoire-Géo':   { accent: '#F97316', from: '#180600', to: '#2d1000' },
  'Français':       { accent: '#8B5CF6', from: '#0d0520', to: '#1a0d38' },
  'Economie':       { accent: '#10B981', from: '#031810', to: '#051f14' },
  'Comptabilité':   { accent: '#F0B429', from: '#1a0e00', to: '#2e1c00' },
  default:          { accent: '#6366F1', from: '#0a0520', to: '#160d38' },
}

const PODCAST_THEME = { accent: '#F43F5E', from: '#1a0308', to: '#2d0510' }

// ── Helpers ─────────────────────────────────────────────────────────────────
function safe(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function trunc(s = '', n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
function getGuideTheme(cat = '') {
  return GUIDE_ACCENT[cat] || GUIDE_ACCENT.default
}
function getMatiereTheme(mat = '') {
  const key = Object.keys(MATIERE_ACCENT).find(k => mat.toLowerCase().startsWith(k.toLowerCase()))
  return key ? MATIERE_ACCENT[key] : MATIERE_ACCENT.default
}

// ── HTML template ────────────────────────────────────────────────────────────
function makeHtml({ title, badge, sub, icon, accent, from: bg1, to: bg2, extra = '' }) {
  const lineCount = title.length > 48 ? 3 : title.length > 28 ? 2 : 1
  const fontSize = lineCount === 1 ? '62px' : lineCount === 2 ? '52px' : '42px'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px;overflow:hidden;font-family:'Segoe UI','Arial',sans-serif}
  body{background:linear-gradient(135deg,${bg1} 0%,${bg2} 100%);
       display:flex;flex-direction:column;justify-content:space-between;padding:52px 64px}

  /* Grille de fond */
  .grid{position:absolute;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);
    background-size:40px 40px}

  /* Orbes lumineux */
  .orb{position:absolute;border-radius:50%;pointer-events:none;z-index:0}
  .orb1{width:480px;height:480px;top:-120px;right:-100px;filter:blur(80px);
        background:radial-gradient(circle,${accent}55 0%,transparent 65%)}
  .orb2{width:300px;height:300px;bottom:-80px;left:10%;filter:blur(70px);
        background:radial-gradient(circle,${accent}25 0%,transparent 65%)}
  .orb3{width:180px;height:180px;top:40%;left:55%;filter:blur(50px);
        background:radial-gradient(circle,rgba(255,255,255,0.04) 0%,transparent 65%)}

  /* Lignes latérales déco */
  .side-line{position:absolute;top:0;bottom:0;width:3px;
    background:linear-gradient(to bottom,transparent,${accent}88,transparent);
    z-index:0}
  .side-line-l{left:0}
  .side-line-r{right:0}

  /* Contenu */
  .content{position:relative;z-index:1;display:flex;flex-direction:column;gap:28px;flex:1;justify-content:center}

  /* Badge type */
  .badge-wrap{display:flex;align-items:center;gap:12px}
  .badge{display:inline-flex;align-items:center;gap:8px;
    padding:8px 18px;border-radius:100px;
    background:${accent}25;border:1px solid ${accent}60;
    font-size:14px;font-weight:800;letter-spacing:1.5px;
    color:${accent};text-transform:uppercase}
  .badge-dot{width:8px;height:8px;border-radius:50%;background:${accent};
    box-shadow:0 0 10px ${accent}cc;flex-shrink:0}

  /* Titre */
  .title{font-size:${fontSize};font-weight:900;line-height:1.12;
    color:#F0F4F8;letter-spacing:-0.02em;
    text-shadow:0 2px 20px rgba(0,0,0,0.6)}

  /* Sous-titre */
  .sub{font-size:20px;font-weight:600;color:rgba(200,220,240,0.75);
    display:flex;align-items:center;gap:10px;margin-top:4px}
  .sub-dot{width:4px;height:4px;border-radius:50%;background:${accent};flex-shrink:0}

  /* Footer */
  .footer{position:relative;z-index:1;
    display:flex;align-items:center;justify-content:space-between;
    padding-top:24px;border-top:1px solid rgba(255,255,255,0.08)}
  .brand{display:flex;align-items:center;gap:14px}
  .brand-circle{width:44px;height:44px;border-radius:50%;
    background:conic-gradient(${accent},#F0B429 120deg,${accent} 240deg,#F0B429);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 20px ${accent}55;flex-shrink:0}
  .brand-logo{font-size:18px;font-weight:900;color:#0a0a0a;letter-spacing:-0.5px}
  .brand-name{font-size:22px;font-weight:900;color:#F0F4F8;letter-spacing:0.5px}
  .brand-sub{font-size:13px;color:rgba(200,220,240,0.55);letter-spacing:0.2px;margin-top:1px}
  .site-url{font-size:16px;font-weight:700;color:${accent};letter-spacing:0.5px;
    opacity:0.85}
  .icon-big{font-size:80px;position:absolute;right:64px;top:50%;transform:translateY(-50%);
    opacity:0.12;z-index:0;pointer-events:none}
</style>
</head><body>
  <div class="grid"></div>
  <div class="orb orb1"></div><div class="orb orb2"></div><div class="orb orb3"></div>
  <div class="side-line side-line-l"></div>
  <div class="side-line side-line-r"></div>
  <div class="icon-big">${icon}</div>

  <div class="content">
    <div class="badge-wrap">
      <div class="badge"><span class="badge-dot"></span>${safe(badge)}</div>
    </div>
    <div class="title">${safe(trunc(title, 90))}</div>
    ${sub ? `<div class="sub"><span class="sub-dot"></span>${safe(sub)}</div>` : ''}
    ${extra}
  </div>

  <div class="footer">
    <div class="brand">
      <div class="brand-circle"><span class="brand-logo">A</span></div>
      <div>
        <div class="brand-name">ABAWI</div>
        <div class="brand-sub">Portail Premium Africain</div>
      </div>
    </div>
    <div class="site-url">abawi.app</div>
  </div>
</body></html>`
}

// ── Capture via Puppeteer ────────────────────────────────────────────────────
async function capture(page, html, outPath) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  const buf = await page.screenshot({
    type: 'jpeg', quality: 90,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  })
  writeFileSync(outPath, buf)
  const kb = Math.round(statSync(outPath).size / 1024)
  return kb
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Charger les données depuis products.js (import dynamique ESM)
  const dataUrl = pathToFileURL(resolve(ROOT, 'src/data/products.js')).href
  const { guides, podcasts, allFascicules } = await import(dataUrl)

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })

  let total = 0, skipped = 0

  // ── GUIDES ──────────────────────────────────────────────────────────────
  if (FILTER === 'all' || FILTER === 'guides') {
    const dir = resolve(PUB, 'og-content/guides')
    mkdirSync(dir, { recursive: true })
    console.log(`\n📚 Génération des guides (${guides.length})…`)
    for (const guide of guides) {
      const out = resolve(dir, `${guide.id}.jpg`)
      if (!FORCE && existsSync(out)) { skipped++; continue }
      const theme = getGuideTheme(guide.categorie)
      const html = makeHtml({
        title: guide.titre,
        badge: `Guide PDF — ${guide.categorie || 'Premium'}`,
        sub: guide.prix > 0 ? `${guide.prix.toLocaleString('fr-FR')} F CFA` : 'Gratuit',
        icon: '📚',
        ...theme,
      })
      const kb = await capture(page, html, out)
      total++
      process.stdout.write(`  ✓ ${guide.id} (${kb}KB)\n`)
    }
  }

  // ── PODCASTS ─────────────────────────────────────────────────────────────
  if (FILTER === 'all' || FILTER === 'podcasts') {
    const dir = resolve(PUB, 'og-content/podcasts')
    mkdirSync(dir, { recursive: true })
    console.log(`\n🎙️  Génération des podcasts (${podcasts.length})…`)
    for (const ep of podcasts) {
      const out = resolve(dir, `${ep.id}.jpg`)
      if (!FORCE && existsSync(out)) { skipped++; continue }
      const html = makeHtml({
        title: ep.titre,
        badge: `Podcast — ${ep.serie || 'Business & Digital'}`,
        sub: ep.prix > 0 ? `${ep.prix.toLocaleString('fr-FR')} F CFA · ${ep.premium ? 'Premium' : 'Gratuit'}` : 'Gratuit',
        icon: '🎙️',
        ...PODCAST_THEME,
      })
      const kb = await capture(page, html, out)
      total++
      process.stdout.write(`  ✓ ${ep.id} (${kb}KB)\n`)
    }
  }

  // ── FASCICULES ───────────────────────────────────────────────────────────
  if (FILTER === 'all' || FILTER === 'fascicules') {
    const dir = resolve(PUB, 'og-content/fascicules')
    mkdirSync(dir, { recursive: true })
    console.log(`\n📖 Génération des fascicules (${allFascicules.length})…`)
    for (const fasc of allFascicules) {
      const out = resolve(dir, `${fasc.id}.jpg`)
      if (!FORCE && existsSync(out)) { skipped++; continue }
      const theme = getMatiereTheme(fasc.matiere)
      const html = makeHtml({
        title: fasc.titre,
        badge: `Fascicule BAC ${fasc.serie || ''} — ${fasc.matiere || 'Académique'}`,
        sub: fasc.chapitre ? `Chapitre ${fasc.chapitre}` : (fasc.serie || ''),
        icon: '📖',
        ...theme,
      })
      const kb = await capture(page, html, out)
      total++
      process.stdout.write(`  ✓ ${fasc.id} (${kb}KB)\n`)
    }
  }

  await browser.close()
  console.log(`\n✅ Terminé — ${total} cartes générées, ${skipped} ignorées (déjà existantes).`)
  if (skipped > 0) console.log(`   Utiliser --force pour regénérer les fichiers existants.`)
}

main().catch(err => { console.error(err); process.exit(1) })
