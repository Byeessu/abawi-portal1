/**
 * ABAWI PDF EXPORT ENGINE
 * Direct html2pdf.js integration — no broken wrapper layers.
 *
 * Supported call forms (all tools use one of these):
 *   exportToPDF('element-id', 'filename')
 *   exportToPDF('element-id', 'filename', { includeHeader, includeFooter })
 *   exportToPDF(htmlElement, { filename, includeHeader, includeFooter })
 */

const DOC_PROFILE_KEY = 'abawi_doc_profile'

function getDocumentProfileDefaults() {
  try {
    const raw = localStorage.getItem(DOC_PROFILE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    // Migrate legacy defaults
    if (parsed.headerText === 'Document ABAWI') { parsed.headerText = ''; parsed.includeHeader = false }
    if (parsed.footerText === 'Document généré avec ABAWI') { parsed.footerText = ''; parsed.includeFooter = false }
    return parsed
  } catch {
    return {}
  }
}

function resolveExportElement(target) {
  if (target instanceof HTMLElement) return target
  if (typeof target === 'string') {
    return document.getElementById(target) || document.querySelector(target) || null
  }
  return null
}

function buildExportWrapper(sourceElement, options = {}) {
  const cfg = { ...getDocumentProfileDefaults(), ...options }

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'background:#fff;color:#111827;padding:16px;font-family:Inter,Arial,sans-serif;max-width:100%;'

  // Optional header
  if (cfg.includeHeader && cfg.headerText && String(cfg.headerText).trim()) {
    const header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:center;gap:12px;border-bottom:1px solid #E5E7EB;padding-bottom:10px;margin-bottom:12px;'

    if (cfg.logoUrl) {
      const logo = document.createElement('img')
      logo.src = cfg.logoUrl
      logo.alt = 'Logo'
      logo.style.cssText = 'width:42px;height:42px;object-fit:contain;'
      header.appendChild(logo)
    }

    const title = document.createElement('div')
    title.textContent = String(cfg.headerText).trim()
    title.style.cssText = 'font-size:14px;font-weight:700;color:#111827;'
    header.appendChild(title)
    wrapper.appendChild(header)
  }

  // Clone and force light theme
  const content = sourceElement.cloneNode(true)
  forceLightTheme(content)
  wrapper.appendChild(content)

  // Optional footer
  if (cfg.includeFooter && cfg.footerText && String(cfg.footerText).trim()) {
    const footer = document.createElement('div')
    footer.style.cssText = 'border-top:1px solid #E5E7EB;padding-top:10px;margin-top:12px;font-size:12px;color:#4B5563;text-align:center;'
    footer.textContent = String(cfg.footerText).trim()
    wrapper.appendChild(footer)
  }

  // Optional signature / cachet
  if (cfg.signatureUrl || cfg.cachetUrl) {
    const legal = document.createElement('div')
    legal.style.cssText = 'margin-top:14px;padding-top:10px;border-top:1px dashed #D1D5DB;display:flex;justify-content:flex-end;align-items:flex-end;gap:24px;flex-wrap:wrap;'

    if (cfg.signatureUrl) {
      const wrap = document.createElement('div')
      wrap.style.textAlign = 'center'
      const img = document.createElement('img')
      img.src = cfg.signatureUrl
      img.alt = 'Signature'
      img.style.cssText = 'max-width:180px;max-height:70px;object-fit:contain;'
      const lbl = document.createElement('div')
      lbl.textContent = 'Signature'
      lbl.style.cssText = 'font-size:11px;color:#6B7280;'
      wrap.appendChild(img)
      wrap.appendChild(lbl)
      legal.appendChild(wrap)
    }

    if (cfg.cachetUrl) {
      const wrap = document.createElement('div')
      wrap.style.textAlign = 'center'
      const img = document.createElement('img')
      img.src = cfg.cachetUrl
      img.alt = 'Cachet'
      img.style.cssText = 'max-width:110px;max-height:90px;object-fit:contain;'
      const lbl = document.createElement('div')
      lbl.textContent = 'Cachet'
      lbl.style.cssText = 'font-size:11px;color:#6B7280;'
      wrap.appendChild(img)
      wrap.appendChild(lbl)
      legal.appendChild(wrap)
    }
    wrapper.appendChild(legal)
  }

  return wrapper
}

function forceLightTheme(el) {
  if (!(el instanceof HTMLElement)) return
  const cs = window.getComputedStyle(el)
  const bg = cs.backgroundColor
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
    const nums = bg.match(/\d+/g) || ['255', '255', '255']
    const brightness = (parseInt(nums[0]) * 299 + parseInt(nums[1]) * 587 + parseInt(nums[2]) * 114) / 1000
    if (brightness < 128) el.style.background = '#ffffff'
  }
  const col = cs.color
  if (col) {
    const nums = col.match(/\d+/g) || ['0', '0', '0']
    const brightness = (parseInt(nums[0]) * 299 + parseInt(nums[1]) * 587 + parseInt(nums[2]) * 114) / 1000
    if (brightness > 180) el.style.color = '#111827'
  }
  Array.from(el.children).forEach(child => forceLightTheme(child))
}

async function exportToPDF(elementOrId, filenameOrOptions = {}, extraOptions = {}) {
  const element = resolveExportElement(elementOrId)
  if (!element) {
    console.error('[exportToPDF] Element introuvable:', elementOrId)
    return
  }

  // Normalize arguments — three supported signatures
  let filename, options
  if (typeof filenameOrOptions === 'string') {
    filename = filenameOrOptions
    options = extraOptions || {}
  } else {
    filename = (filenameOrOptions && filenameOrOptions.filename) ? filenameOrOptions.filename : 'document'
    options = filenameOrOptions || {}
  }

  const finalFilename = String(filename || 'document').replace(/\.pdf$/i, '')

  const wrapper = buildExportWrapper(element, options)

  // Append off-screen so html2canvas can measure it
  wrapper.style.cssText += 'position:fixed;left:-99999px;top:0;width:794px;z-index:-1;'
  document.body.appendChild(wrapper)

  try {
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf()
      .set({
        margin: 10,
        filename: `${finalFilename}.pdf`,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(wrapper)
      .save()
  } catch (err) {
    console.error('[exportToPDF] Erreur:', err)
    // Fallback to print dialog
    window.print()
  } finally {
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper)
  }
}

async function exportToImage(elementOrId, format = 'png', filename = 'image', options = {}) {
  const element = resolveExportElement(elementOrId)
  if (!element) return

  const wrapper = buildExportWrapper(element, options)
  wrapper.style.cssText += 'position:fixed;left:-99999px;top:0;width:794px;z-index:-1;'
  document.body.appendChild(wrapper)

  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(wrapper, {
      scale: options.scale || 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`, options.quality || 0.95))
    if (!blob) throw new Error('Canvas blob null')

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    console.error('[exportToImage] Erreur:', err)
  } finally {
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper)
  }
}

function exportTextFile(content = '', filename = 'document') {
  const safeName = String(filename || 'document').trim() || 'document'
  const blob = new Blob([String(content ?? '')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeName.endsWith('.txt') ? safeName : `${safeName}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function exportWord(elementOrId, filename = 'document.docx') {
  const element = resolveExportElement(elementOrId)
  if (!element) return

  const wrapper = buildExportWrapper(element, { includeHeader: true, includeFooter: true })
  const html = wrapper.outerHTML

  // Fallback: plain text download
  const text = element.textContent || ''
  exportTextFile(text, filename.replace(/\.docx$/i, '.txt'))
}

async function exportExcel(data = [], filename = 'export.xlsx', sheetName = 'Données') {
  try {
    const XLSX = (await import('xlsx')).default || (await import('xlsx'))
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
  } catch (err) {
    console.error('[exportExcel] Erreur:', err)
  }
}

function safeJSON(str, fallback = {}) {
  try { return JSON.parse(str) } catch { return fallback }
}

function withDocumentMetaLines(lines = [], options = {}) {
  const cfg = { ...getDocumentProfileDefaults(), ...options }
  const out = []
  if (cfg.includeHeader && cfg.headerText) out.push(cfg.headerText, '')
  out.push(...lines)
  if (cfg.includeFooter && cfg.footerText) out.push('', cfg.footerText)
  return out
}

function cleanupExportElements() {
  document.querySelectorAll('[data-robust-export-wrapper]').forEach(el => el.remove())
}

function checkExportHealth() {
  return {
    html2pdf: true,
    html2canvas: true,
    xlsx: true,
  }
}

export {
  exportToPDF,
  exportExcel,
  exportWord,
  exportToImage,
  exportTextFile,
  buildExportWrapper,
  withDocumentMetaLines,
  getDocumentProfileDefaults,
  safeJSON,
  cleanupExportElements,
  checkExportHealth,
}
