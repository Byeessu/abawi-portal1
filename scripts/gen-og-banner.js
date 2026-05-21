// Regenerate public/abawi-og-banner.png from the SVG source.
// Run: npm run gen:og
// Required after any change to public/abawi-og-banner.svg.

import puppeteer from 'puppeteer'
import { writeFileSync, statSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dir   = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dir, '../public/abawi-og-banner.svg')
const outPath = resolve(__dir, '../public/abawi-og-banner.jpg')
const pubDir  = resolve(__dir, '../public')

// Wrap SVG in a minimal HTML page so that relative asset paths
// (like /favicon-abawi.png) resolve correctly via file:// protocol.
// Fix absolute paths → relative for file:// context
const svg  = readFileSync(svgPath, 'utf8')
              .replace(/href="\/favicon-abawi\.png"/g, 'href="favicon-abawi.png"')
              .replace(/href="\/favicon-symbol\.png"/g, 'href="favicon-symbol.png"')
const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>*{margin:0;padding:0}body{width:1200px;height:630px;overflow:hidden;background:#04080E}</style>
</head><body>${svg}</body></html>`

const htmlPath = resolve(pubDir, '_og-tmp.html')
writeFileSync(htmlPath, html)
const fileUrl = pathToFileURL(htmlPath).href

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
         '--allow-file-access-from-files'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.goto(fileUrl, { waitUntil: 'networkidle0' })
await page.screenshot({
  path: outPath,
  type: 'jpeg',
  quality: 88,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
})
await browser.close()

// Cleanup temp file
import { unlinkSync } from 'fs'
try { unlinkSync(htmlPath) } catch { /* ignore */ }

const kb = Math.round(statSync(outPath).size / 1024)
console.log(`✓ ${outPath}  (${kb} KB)`)
if (kb > 300) console.warn(`⚠ ${kb}KB > 300KB — consider lowering JPEG quality`)
