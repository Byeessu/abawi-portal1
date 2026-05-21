// Capture la page d'accueil comme thumbnail OG.
// Nécessite le preview server Vite en cours (npm run preview).
// Usage : npm run build && npm run gen:og:screenshot

import puppeteer from 'puppeteer'
import { writeFileSync, statSync } from 'fs'
import { execSync } from 'child_process'

const PORT = 4174
const OUT  = new URL('../public/abawi-og-banner.jpg', import.meta.url).pathname

// Démarrer le preview en arrière-plan
const preview = execSync(`npx vite preview --port ${PORT} &`, { shell: true })
await new Promise(r => setTimeout(r, 3000))

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })

// Injecter le consentement cookies avant chargement pour éviter la bannière
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('abawi-cookie-consent', JSON.stringify({
    version: '1.0',
    savedAt: Date.now(),
    preferences: { necessary: true, analytics: false, marketing: false },
  }))
})

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 30000 })
await new Promise(r => setTimeout(r, 2500))

const buf = await page.screenshot({
  type: 'jpeg',
  quality: 90,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
})
await browser.close()
execSync(`pkill -f "vite preview"`, { shell: true })

writeFileSync(OUT, buf)
const kb = Math.round(statSync(OUT).size / 1024)
console.log(`✓ ${OUT}  (${kb} KB)`)
if (kb > 300) console.warn(`⚠ ${kb}KB > 300KB — WhatsApp peut rejeter`)
