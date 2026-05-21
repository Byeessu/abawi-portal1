import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import http from 'http'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const outPath = join(__dirname, '..', 'public', 'abawi-og-banner.png')

// ── Start a tiny static server so Puppeteer can resolve /abawi-logo.png ──
const mime = { '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.css':'text/css', '.js':'application/javascript', '.json':'application/json' }
const server = http.createServer((req, res) => {
  const file = join(publicDir, req.url === '/' ? 'abawi-og-banner.svg' : req.url)
  const ct = mime[extname(file).toLowerCase()] || 'application/octet-stream'
  try { const buf = readFileSync(file); res.writeHead(200, { 'Content-Type': ct }); res.end(buf) }
  catch { res.writeHead(404); res.end('Not found') }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const bannerUrl = `http://127.0.0.1:${port}/abawi-og-banner.svg`

// ── Render with Puppeteer ──
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.goto(bannerUrl, { waitUntil: 'networkidle0' })
await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()
server.close()

console.log('✅ OG banner PNG generated:', outPath)
