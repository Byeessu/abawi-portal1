/**
 * ABAWI ROBUST PDF EXPORT ENGINE
 * 
 * Objectif :
 * - Remplacer le système fragile par RobustExportEngine
 * - Simplifier les exports PDF/Word/Excel/Image
 * - Maintenir la compatibilité avec l'existant
 * - Ajouter retry intelligent et monitoring
 * - Nettoyage automatique et memory optimization
 * 
 * @version 2.0.0 - Robust Architecture
 */

import robustExportEngine from './RobustExportEngine'

const DOC_PROFILE_KEY = 'abawi_doc_profile'

function migrateLegacyDocProfile(obj) {
  if (!obj || typeof obj !== 'object') return {}
  const next = { ...obj }
  if (next.headerText === 'Document ABAWI') {
    next.headerText = ''
    next.includeHeader = false
  }
  if (next.footerText === 'Document généré avec ABAWI') {
    next.footerText = ''
    next.includeFooter = false
  }
  return next
}

function getDocumentProfileDefaults() {
  return robustExportEngine.execute(
    () => {
      try {
        const raw = localStorage.getItem(DOC_PROFILE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        const base = typeof parsed === 'object' && parsed ? parsed : {}
        return migrateLegacyDocProfile(base)
      } catch {
        return {}
      }
    },
    {
      timeout: 2000,
      operationType: 'get_document_profile'
    }
  )
}

function withDocumentMetaLines(lines = [], options = {}) {
  const cfg = { ...getDocumentProfileDefaults(), ...options }
  const out = []
  if (cfg.includeHeader && cfg.headerText) out.push(cfg.headerText, '')
  out.push(...lines)
  if (cfg.includeFooter && cfg.footerText) out.push('', cfg.footerText)
  return out
}

function buildExportWrapper(sourceElement, options = {}) {
  return robustExportEngine.execute(
    () => {
      const {
        includeHeader = false,
        includeFooter = false,
        headerText = '',
        footerText = '',
        logoUrl = '',
        profilePhotoUrl = '',
        signatureUrl = '',
        cachetUrl = '',
      } = options

      const wrapper = document.createElement('div')
      wrapper.style.background = '#ffffff'
      wrapper.style.color = '#111827'
      wrapper.style.padding = '16px'
      wrapper.style.fontFamily = 'Inter, Arial, sans-serif'
      wrapper.style.maxWidth = '100%'

      if (includeHeader) {
        const header = document.createElement('div')
        header.style.display = 'flex'
        header.style.alignItems = 'center'
        header.style.justifyContent = 'space-between'
        header.style.gap = '12px'
        header.style.borderBottom = '1px solid #E5E7EB'
        header.style.paddingBottom = '10px'
        header.style.marginBottom = '12px'

        const left = document.createElement('div')
        left.style.display = 'flex'
        left.style.alignItems = 'center'
        left.style.gap = '10px'

        if (logoUrl) {
          const logo = document.createElement('img')
          logo.src = logoUrl
          logo.alt = 'Logo'
          logo.style.width = '42px'
          logo.style.height = '42px'
          logo.style.objectFit = 'contain'
          left.appendChild(logo)
        }

        const title = document.createElement('div')
        title.textContent = (headerText && String(headerText).trim()) || 'Document'
        title.style.fontSize = '14px'
        title.style.fontWeight = '700'
        title.style.color = '#111827'
        left.appendChild(title)
        header.appendChild(left)

        if (profilePhotoUrl) {
          const profile = document.createElement('img')
          profile.src = profilePhotoUrl
          profile.alt = 'Profil'
          profile.style.width = '36px'
          profile.style.height = '36px'
          profile.style.borderRadius = '999px'
          profile.style.objectFit = 'cover'
          header.appendChild(profile)
        }

        wrapper.appendChild(header)
      }

      const content = sourceElement.cloneNode(true)
      // Force light theme on cloned content for PDF readability
      function forceLightTheme(el) {
        if (!(el instanceof HTMLElement)) return
        const cs = window.getComputedStyle(el)
        const bg = cs.backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          const [r, g, b] = bg.match(/\d+/g) || [255, 255, 255]
          const brightness = (parseInt(r) * 299 + parseInt(g) * 587 + parseInt(b) * 114) / 1000
          if (brightness < 128) el.style.background = 'transparent'
        }
        const col = cs.color
        if (col) {
          const [r, g, b] = col.match(/\d+/g) || [0, 0, 0]
          const brightness = (parseInt(r) * 299 + parseInt(g) * 587 + parseInt(b) * 114) / 1000
          if (brightness > 180) el.style.color = '#111827'
        }
        el.querySelectorAll('*').forEach(child => forceLightTheme(child))
      }
      forceLightTheme(content)
      wrapper.appendChild(content)

      if (includeFooter && (footerText && String(footerText).trim())) {
        const footer = document.createElement('div')
        footer.style.borderTop = '1px solid #E5E7EB'
        footer.style.paddingTop = '10px'
        footer.style.marginTop = '12px'
        footer.style.fontSize = '12px'
        footer.style.color = '#4B5563'
        footer.style.textAlign = 'center'
        footer.textContent = String(footerText).trim()
        wrapper.appendChild(footer)
      }

      if (signatureUrl || cachetUrl) {
        const legal = document.createElement('div')
        legal.style.marginTop = '14px'
        legal.style.paddingTop = '10px'
        legal.style.borderTop = '1px dashed #D1D5DB'
        legal.style.display = 'flex'
        legal.style.justifyContent = 'flex-end'
        legal.style.alignItems = 'flex-end'
        legal.style.gap = '24px'
        legal.style.flexWrap = 'wrap'

        if (signatureUrl) {
          const sWrap = document.createElement('div')
          sWrap.style.textAlign = 'center'
          const sImg = document.createElement('img')
          sImg.src = signatureUrl
          sImg.alt = 'Signature'
          sImg.style.maxWidth = '180px'
          sImg.style.maxHeight = '70px'
          sImg.style.objectFit = 'contain'
          const sLbl = document.createElement('div')
          sLbl.textContent = 'Signature'
          sLbl.style.fontSize = '11px'
          sLbl.style.color = '#6B7280'
          sWrap.appendChild(sImg)
          sWrap.appendChild(sLbl)
          legal.appendChild(sWrap)
        }

        if (cachetUrl) {
          const cWrap = document.createElement('div')
          cWrap.style.textAlign = 'center'
          const cImg = document.createElement('img')
          cImg.src = cachetUrl
          cImg.alt = 'Cachet'
          cImg.style.maxWidth = '110px'
          cImg.style.maxHeight = '90px'
          cImg.style.objectFit = 'contain'
          const cLbl = document.createElement('div')
          cLbl.textContent = 'Cachet'
          cLbl.style.fontSize = '11px'
          cLbl.style.color = '#6B7280'
          cWrap.appendChild(cImg)
          cWrap.appendChild(cLbl)
          legal.appendChild(cWrap)
        }

        wrapper.appendChild(legal)
      }

      return wrapper
    },
    {
      timeout: 5000,
      operationType: 'build_export_wrapper'
    }
  )
}

function safeJSON(str, fallback = {}) {
  return robustExportEngine.execute(
    () => {
      try {
        return JSON.parse(str)
      } catch {
        return fallback
      }
    },
    {
      timeout: 2000,
      operationType: 'safe_json_parse'
    }
  )
}

function exportTextFile(content = '', filename = 'document') {
  return robustExportEngine.execute(
    () => {
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
      return { success: true, filename: link.download }
    },
    {
      timeout: 4000,
      operationType: 'export_text'
    }
  )
}

function resolveExportElement(target) {
  if (target instanceof HTMLElement) return target
  if (typeof target === 'string') {
    const byId = document.getElementById(target)
    if (byId) return byId
    const byQuery = document.querySelector(target)
    if (byQuery instanceof HTMLElement) return byQuery
  }
  return null
}

function exportToPDF(elementOrId, optionsOrFilename = {}) {
  return robustExportEngine.execute(
    async () => {
      const element = resolveExportElement(elementOrId)
      if (!element) {
        throw new Error('Element PDF introuvable pour export')
      }

      // Compat legacy:
      // - exportToPDF('element-id', 'file-slug')
      // - exportToPDF('element-id', { ...options })
      const options = typeof optionsOrFilename === 'string'
        ? { filename: `${optionsOrFilename}.pdf` }
        : (optionsOrFilename || {})

      const wrapper = buildExportWrapper(element, options)
      
      const exportOptions = {
        margin: 10,
        filename: options.filename || 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreaks: { mode: ['avoid-all', 'css', 'legacy'] },
        ...options
      }

      return await robustExportEngine.exportToPDF(wrapper, exportOptions)
    },
    {
      timeout: 30000, // 30 secondes max
      operationType: 'export_pdf',
      retryCount: 2,
      onRetry: (attempt, error) => {
        console.warn(`[ROBUST_PDF_ENGINE] Retry export PDF tentative ${attempt}:`, error)
      },
      onTimeout: () => {
        console.warn('[ROBUST_PDF_ENGINE] Timeout export PDF - fallback vers window.print()')
        // Fallback vers print natif
        window.print()
      }
    }
  )
}

function exportExcel(data, filename = 'export.xlsx') {
  return robustExportEngine.execute(
    async () => {
      return await robustExportEngine.exportToExcel(data, { filename })
    },
    {
      timeout: 15000, // 15 secondes max
      operationType: 'export_excel',
      retryCount: 2,
      onRetry: (attempt, error) => {
        console.warn(`[ROBUST_PDF_ENGINE] Retry export Excel tentative ${attempt}:`, error)
      }
    }
  )
}

function exportWord(element, filename = 'document.docx') {
  return robustExportEngine.execute(
    async () => {
      const wrapper = buildExportWrapper(element, { includeHeader: true, includeFooter: true })
      return await robustExportEngine.exportToWord(wrapper, { filename })
    },
    {
      timeout: 20000, // 20 secondes max
      operationType: 'export_word',
      retryCount: 2,
      onRetry: (attempt, error) => {
        console.warn(`[ROBUST_PDF_ENGINE] Retry export Word tentative ${attempt}:`, error)
      }
    }
  )
}

function exportToImage(element, format = 'png', filename = 'image', options = {}) {
  return robustExportEngine.execute(
    async () => {
      const wrapper = buildExportWrapper(element)
      const imageOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        format: format,
        filename: `${filename}.${format}`,
        ...options
      }

      return await robustExportEngine.exportToImage(wrapper, imageOptions)
    },
    {
      timeout: 15000, // 15 secondes max
      operationType: 'export_image',
      retryCount: 2,
      onRetry: (attempt, error) => {
        console.warn(`[ROBUST_PDF_ENGINE] Retry export Image tentative ${attempt}:`, error)
      }
    }
  )
}

// Fonction utilitaire pour le nettoyage
function cleanupExportElements() {
  return robustExportEngine.execute(
    () => {
      // Nettoyer tous les wrappers temporaires
      const wrappers = document.querySelectorAll('[data-robust-export-wrapper]')
      wrappers.forEach(wrapper => {
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper)
        }
      })
      
      // Nettoyer les URLs temporaires
      const tempUrls = document.querySelectorAll('[data-robust-export-url]')
      tempUrls.forEach(url => {
        URL.revokeObjectURL(url.getAttribute('data-robust-export-url'))
      })
      
      console.log('[ROBUST_PDF_ENGINE] Nettoyage des éléments d\'export complété')
    },
    {
      timeout: 5000,
      operationType: 'cleanup_export_elements'
    }
  )
}

// Fonction pour vérifier la santé du système d'export
function checkExportHealth() {
  return robustExportEngine.execute(
    () => {
      const health = {
        html2pdf: typeof html2pdf !== 'undefined',
        html2canvas: typeof html2canvas !== 'undefined',
        // In a Vite ESM bundle xlsx is consumed via a static `import 'xlsx'`,
        // not via require — so we probe the global UMD attachment instead.
        xlsx: typeof globalThis !== 'undefined' && typeof globalThis.XLSX !== 'undefined',
        htmlDocx: typeof htmlDocx !== 'undefined',
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        } : null
      }
      
      console.log('[ROBUST_PDF_ENGINE] Health check:', health)
      return health
    },
    {
      timeout: 3000,
      operationType: 'export_health_check'
    }
  )
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
  checkExportHealth
}
