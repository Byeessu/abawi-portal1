#!/usr/bin/env node
/**
 * generate-sitemap.mjs — Génère un sitemap index + sous-sitemaps complets
 *
 *   /sitemap.xml           ← sitemap index
 *   /sitemap-pages.xml     ← pages statiques
 *   /sitemap-digital.xml   ← guides
 *   /sitemap-academy.xml   ← fascicules
 *   /sitemap-podcasts.xml  ← podcasts
 *   /sitemap-store.xml     ← produits tech
 *   /sitemap-abavie.xml    ← produits santé
 *   /.netlify/functions/sitemap-news ← articles Supabase (dynamique)
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const DIST  = path.resolve('dist')
const BASE  = 'https://abawi.app'
const TODAY = new Date().toISOString().split('T')[0]

function slugify(s) {
  return String(s||'').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

// ── Supabase for store products ───────────────────────────────────────────────
let storeProducts = []
let abavieProducts = []

try {
  const { createClient } = await import('@supabase/supabase-js')
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const [{ data: sp }, { data: ap }] = await Promise.all([
      supabase.from('store_products').select('id,nom,updated_at').eq('actif', true).limit(300),
      supabase.from('abavie_products').select('id,nom,updated_at').eq('actif', true).limit(300),
    ])
    storeProducts = sp || []
    abavieProducts = ap || []
    console.log(`📦 Store: ${storeProducts.length} produits tech, ${abavieProducts.length} produits santé`)
  }
} catch(e) {
  console.warn('⚠ Supabase store fetch failed:', e.message?.slice(0,80))
}

let guides = [], allFascicules = [], podcasts = []

try {
  const productsPath = path.resolve('src/data/products.js').replace(/\\/g, '/')
  const snippet = `
import { guides, allFascicules, podcasts } from '${productsPath}'
process.stdout.write(JSON.stringify({
  guides:     guides.map(g=>({id:g.id,titre:g.titre,gratuit:g.gratuit})),
  fascicules: allFascicules.map(f=>({id:f.id,titre:f.titre,gratuit:f.gratuit})),
  podcasts:   podcasts.map(p=>({id:p.id,titre:p.titre,gratuit:p.gratuit})),
}))
`
  const tmp = path.resolve('scripts/_tmp_sitemap_dump.mjs')
  fs.writeFileSync(tmp, snippet)
  const json = execSync(`node "${tmp}"`, { encoding: 'utf8', timeout: 20000 })
  fs.unlinkSync(tmp)
  const d = JSON.parse(json)
  guides = d.guides; allFascicules = d.fascicules; podcasts = d.podcasts
} catch (e) {
  console.warn('⚠ products fallback (regex):', e.message.slice(0, 80))
  const src = fs.readFileSync(path.resolve('src/data/products.js'), 'utf8')
  const re  = /"titre":\s*"([^"]+)"/g
  const all = []; let m
  while ((m = re.exec(src)) !== null) all.push(m[1])
  guides        = all.slice(0,  83).map((t, i) => ({ id:`g${i}`, titre:t }))
  allFascicules = all.slice(83, 413).map((t, i) => ({ id:`f${i}`, titre:t }))
  podcasts      = all.slice(413).map((t, i) => ({ id:`p${i}`, titre:t }))
}

console.log(`📊 Products: ${guides.length} guides, ${allFascicules.length} fascicules, ${podcasts.length} podcasts`)

// ── XML helpers ───────────────────────────────────────────────────────────────
const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

const urlEntry = ({ loc, lastmod = TODAY, changefreq = 'monthly', priority = '0.7', image } = {}) => `
  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${image ? `
    <image:image>
      <image:loc>${esc(image.loc)}</image:loc>
      <image:title>${esc(image.title)}</image:title>
    </image:image>` : ''}
  </url>`

const urlsetOpen  = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`
const urlsetClose = `\n</urlset>`
const indexOpen   = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
const indexClose  = `\n</sitemapindex>`
const smEntry = (loc) => `\n  <sitemap>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`

// ── 1. sitemap-pages.xml ─────────────────────────────────────────────────────
const STATIC_PAGES = [
  { loc:`${BASE}/`,                     changefreq:'daily',   priority:'1.0', image:{loc:`${BASE}/abawi-og-banner.jpg`,title:'ABAWI — Portail premium africain'} },
  { loc:`${BASE}/outils`,               changefreq:'weekly',  priority:'0.95' },
  { loc:`${BASE}/news`,                 changefreq:'daily',   priority:'0.9'  },
  { loc:`${BASE}/digital`,              changefreq:'weekly',  priority:'0.9'  },
  { loc:`${BASE}/academy`,              changefreq:'weekly',  priority:'0.9'  },
  { loc:`${BASE}/podcasts`,             changefreq:'weekly',  priority:'0.85' },
  { loc:`${BASE}/store`,                changefreq:'weekly',  priority:'0.8'  },
  { loc:`${BASE}/boutique-sante`,       changefreq:'weekly',  priority:'0.75' },
  { loc:`${BASE}/plans`,                changefreq:'monthly', priority:'0.8'  },
  { loc:`${BASE}/digital/pack/abawi-plus`, changefreq:'monthly', priority:'0.85' },
  { loc:`${BASE}/abavie`,               changefreq:'weekly',  priority:'0.85' },
  { loc:`${BASE}/abawi360`,             changefreq:'monthly', priority:'0.8'  },
  { loc:`${BASE}/a-propos`,             changefreq:'yearly',  priority:'0.5'  },
  ...['cv','lettre','business-plan','pitch','facture','analyse-cv','finance','juridique',
      'comptable','rh','immobilier','consultant','image-pro','format-converter','qr-code-pro',
      'pro-card-elite','photo-studio-pro','infographie-pro','audio-studio-elite',
      'studio-visuel-pro','abawi-ia','exegetika','dictionnaire-elite','translator-elite',
      'sante','abspacegps','abzone','maxavis','tontine','autoroute','editeur-pro',
      'smart-word-editor','smart-office','recrute-moi-sn','place-ouvrier','espace-ouvrier',
      'arkel-up-center','abtalk'].map(slug => ({
        loc:`${BASE}/outils/${slug}`, changefreq:'monthly', priority:'0.8'
      })),
  { loc:`${BASE}/mentions-legales`,          changefreq:'yearly', priority:'0.3' },
  { loc:`${BASE}/cgu`,                       changefreq:'yearly', priority:'0.3' },
  { loc:`${BASE}/politique-confidentialite`, changefreq:'yearly', priority:'0.3' },
]
fs.writeFileSync(path.join(DIST, 'sitemap-pages.xml'), urlsetOpen + STATIC_PAGES.map(urlEntry).join('') + urlsetClose)
console.log(`✓ sitemap-pages.xml — ${STATIC_PAGES.length} URLs`)

// ── 2. sitemap-digital.xml ────────────────────────────────────────────────────
const guideUrls = guides.map(g => urlEntry({ loc:`${BASE}/digital/${slugify(g.titre)}`, priority: g.gratuit ? '0.85' : '0.8' }))
fs.writeFileSync(path.join(DIST, 'sitemap-digital.xml'), urlsetOpen + guideUrls.join('') + urlsetClose)
console.log(`✓ sitemap-digital.xml — ${guides.length} guides`)

// ── 3. sitemap-academy.xml ────────────────────────────────────────────────────
const fascUrls = allFascicules.map(f => urlEntry({ loc:`${BASE}/academy/${slugify(f.titre)}`, priority: f.gratuit ? '0.85' : '0.75' }))
fs.writeFileSync(path.join(DIST, 'sitemap-academy.xml'), urlsetOpen + fascUrls.join('') + urlsetClose)
console.log(`✓ sitemap-academy.xml — ${allFascicules.length} fascicules`)

// ── 4. sitemap-podcasts.xml ───────────────────────────────────────────────────
const podUrls = podcasts.map(p => urlEntry({ loc:`${BASE}/podcasts/${slugify(p.titre)}`, priority: p.gratuit ? '0.85' : '0.75' }))
fs.writeFileSync(path.join(DIST, 'sitemap-podcasts.xml'), urlsetOpen + podUrls.join('') + urlsetClose)
console.log(`✓ sitemap-podcasts.xml — ${podcasts.length} podcasts`)

// ── 5. sitemap-store.xml ──────────────────────────────────────────────────────
const storeUrls = storeProducts.map(p => urlEntry({
  loc: `${BASE}/store/${p.id}`,
  lastmod: (p.updated_at || TODAY).split('T')[0],
  changefreq: 'weekly',
  priority: '0.75',
}))
fs.writeFileSync(path.join(DIST, 'sitemap-store.xml'), urlsetOpen + storeUrls.join('') + urlsetClose)
console.log(`✓ sitemap-store.xml — ${storeProducts.length} produits tech`)

// ── 6. sitemap-abavie.xml ─────────────────────────────────────────────────────
const abavieUrls = abavieProducts.map(p => urlEntry({
  loc: `${BASE}/abavie/produit/${p.id}`,
  lastmod: (p.updated_at || TODAY).split('T')[0],
  changefreq: 'weekly',
  priority: '0.75',
}))
fs.writeFileSync(path.join(DIST, 'sitemap-abavie.xml'), urlsetOpen + abavieUrls.join('') + urlsetClose)
console.log(`✓ sitemap-abavie.xml — ${abavieProducts.length} produits santé`)

// ── 7. sitemap.xml — index ────────────────────────────────────────────────────
const sitemapIndex = indexOpen
  + smEntry(`${BASE}/sitemap-pages.xml`)
  + smEntry(`${BASE}/sitemap-digital.xml`)
  + smEntry(`${BASE}/sitemap-academy.xml`)
  + smEntry(`${BASE}/sitemap-podcasts.xml`)
  + smEntry(`${BASE}/sitemap-store.xml`)
  + smEntry(`${BASE}/sitemap-abavie.xml`)
  + smEntry(`${BASE}/.netlify/functions/sitemap-news`)
  + indexClose
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapIndex)
fs.writeFileSync(path.resolve('public/sitemap.xml'), sitemapIndex)
console.log(`✓ sitemap.xml — index (7 sitemaps)`)

const total = STATIC_PAGES.length + guides.length + allFascicules.length + podcasts.length + storeProducts.length + abavieProducts.length
console.log(`\n✅ ${total} URLs statiques + articles Supabase dynamiques`)
