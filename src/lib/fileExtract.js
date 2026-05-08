/**
 * Shared file text extraction utility
 * Supports: PDF, DOCX/DOC, XLSX/XLS, PPTX/PPT, TXT, JSON, CSV, MD, HTML
 */

export async function extractFileText(file) {
  if (!file) return ''
  const ext = String(file.name || '').split('.').pop()?.toLowerCase() || ''

  // Plain text formats
  if (['txt', 'md', 'csv', 'rtf', 'html', 'htm'].includes(ext)) {
    try { return String(await file.text()).trim() } catch { return '' }
  }

  // JSON
  if (ext === 'json') {
    try {
      const t = String(await file.text())
      try { return JSON.stringify(JSON.parse(t), null, 2) } catch { return t.trim() }
    } catch { return '' }
  }

  // Excel
  if (['xlsx', 'xls'].includes(ext)) {
    try {
      const buffer = await file.arrayBuffer()
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buffer, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      return JSON.stringify(XLSX.utils.sheet_to_json(sheet, { defval: '' }), null, 2)
    } catch { return '' }
  }

  // Word DOCX/DOC
  if (['docx', 'doc'].includes(ext)) {
    try {
      const mammoth = await import('mammoth')
      const data = await file.arrayBuffer()
      const out = await mammoth.extractRawText({ arrayBuffer: data })
      return String(out?.value || '').trim()
    } catch { return '' }
  }

  // PDF
  if (ext === 'pdf') {
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const data = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((it) => it.str).join(' ') + '\n'
      }
      return text.trim()
    } catch { return '' }
  }

  // PowerPoint (text extraction not supported in browser, warn user)
  if (['pptx', 'ppt'].includes(ext)) {
    return `[PowerPoint: ${file.name} — ${(file.size / 1024).toFixed(0)} KB. Collez le texte manuellement ou exportez en PDF.]`
  }

  // Fallback: try reading as text
  try { return String(await file.text()).trim() } catch { return '' }
}

/**
 * Extract and combine text from multiple files.
 * Returns a single string with each file's content labelled.
 */
export async function extractFilesText(files) {
  const list = Array.from(files || [])
  if (!list.length) return ''

  const parts = await Promise.all(
    list.map(async (f, i) => {
      const text = await extractFileText(f)
      return `--- DOCUMENT ${i + 1}/${list.length} : ${f.name} ---\n${text || '(contenu non extrait)'}`
    })
  )
  return parts.join('\n\n').trim()
}
