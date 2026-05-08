// One-shot PDF text extractor using the project's already-installed pdfjs-dist.
// Usage: node scripts/extract-pdf.mjs "<absolute path>"
import { readFileSync } from 'fs'
import { argv } from 'process'

const path = argv[2]
if (!path) {
  console.error('Usage: node scripts/extract-pdf.mjs <pdf-path>')
  process.exit(1)
}

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
pdfjs.GlobalWorkerOptions.workerSrc = await import.meta.resolve(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
)

const data = new Uint8Array(readFileSync(path))
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
const pages = doc.numPages
console.log(`# Pages: ${pages}\n`)

for (let i = 1; i <= Math.min(pages, 8); i++) {
  const page = await doc.getPage(i)
  const text = await page.getTextContent()
  const lines = []
  let lastY = null
  let buf = []
  for (const item of text.items) {
    const y = Math.round(item.transform[5])
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      lines.push(buf.join(' '))
      buf = []
    }
    buf.push(item.str)
    lastY = y
  }
  if (buf.length) lines.push(buf.join(' '))
  console.log(`\n===== PAGE ${i} =====`)
  console.log(lines.filter((l) => l.trim()).join('\n'))
}
