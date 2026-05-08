/**
 * ABAWI ROBUST EXPORT ENGINE
 * 
 * Objectif :
 * - Export PDF/Word/Image robuste et fiable
 * - Gestion centralisée des erreurs et fallbacks
 * - Memory optimization pour gros documents
 * - Progress tracking et cancellation
 * - Multiple formats et options avancées
 * - Error recovery et retry automatique
 * 
 * @version 1.0.0 - Production Ready
 */

import robustAsync from './RobustAsyncWrapper'

// ========================================
// CONFIGURATION EXPORT
// ========================================

const EXPORT_CONFIG = {
  // Timeout par type d'export
  TIMEOUTS: {
    pdf: 60000,        // 60 secondes
    word: 45000,       // 45 secondes
    image: 30000,       // 30 secondes
    excel: 40000,       // 40 secondes
    json: 10000         // 10 secondes
  },
  
  // Tailles maximales
  MAX_FILE_SIZES: {
    pdf: 50 * 1024 * 1024,     // 50MB
    word: 25 * 1024 * 1024,    // 25MB
    image: 10 * 1024 * 1024,    // 10MB
    excel: 20 * 1024 * 1024     // 20MB
  },
  
  // Options HTML2PDF
  PDF_OPTIONS: {
    margin: [10, 10, 10, 10],
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      letterRendering: true,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.scrollWidth,
      logging: false,
      removeContainer: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['tr', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    }
  }
}

// ========================================
// EXPORT ERROR TYPES
// ========================================

const EXPORT_ERRORS = {
  TIMEOUT: 'timeout',
  MEMORY: 'memory',
  NETWORK: 'network',
  PERMISSION: 'permission',
  INVALID_FORMAT: 'invalid_format',
  FILE_TOO_LARGE: 'file_too_large',
  BROWSER_NOT_SUPPORTED: 'browser_not_supported',
  CANVAS_ERROR: 'canvas_error',
  PDF_GENERATION_FAILED: 'pdf_generation_failed',
  WORD_GENERATION_FAILED: 'word_generation_failed'
}

// ========================================
// PROGRESS TRACKER
// ========================================

class ExportProgressTracker {
  constructor() {
    this.activeExports = new Map()
    this.progressCallbacks = new Map()
  }

  startExport(exportId, metadata = {}) {
    this.activeExports.set(exportId, {
      startTime: Date.now(),
      status: 'starting',
      progress: 0,
      metadata,
      error: null,
      result: null
    })

    this.notifyProgress(exportId)
  }

  updateProgress(exportId, progress, status = 'processing') {
    const export_ = this.activeExports.get(exportId)
    if (!export_) return

    export_.progress = Math.min(100, Math.max(0, progress))
    export_.status = status
    export_.lastUpdate = Date.now()

    this.notifyProgress(exportId)
  }

  completeExport(exportId, result) {
    const export_ = this.activeExports.get(exportId)
    if (!export_) return

    export_.status = 'completed'
    export_.progress = 100
    export_.result = result
    export_.completedAt = Date.now()

    this.notifyProgress(exportId)
  }

  failExport(exportId, error) {
    const export_ = this.activeExports.get(exportId)
    if (!export_) return

    export_.status = 'failed'
    export_.error = error
    export_.failedAt = Date.now()

    this.notifyProgress(exportId)
  }

  onProgress(exportId, callback) {
    this.progressCallbacks.set(exportId, callback)
  }

  notifyProgress(exportId) {
    const export_ = this.activeExports.get(exportId)
    const callback = this.progressCallbacks.get(exportId)
    
    if (export_ && callback) {
      try {
        callback(export_)
      } catch (error) {
        console.error(`[EXPORT] Error in progress callback for ${exportId}:`, error)
      }
    }
  }

  getExport(exportId) {
    return this.activeExports.get(exportId)
  }

  cancelExport(exportId) {
    const export_ = this.activeExports.get(exportId)
    if (export_) {
      export_.status = 'cancelled'
      export_.cancelledAt = Date.now()
      this.notifyProgress(exportId)
    }
  }

  cleanup(exportId) {
    this.activeExports.delete(exportId)
    this.progressCallbacks.delete(exportId)
  }
}

// ========================================
// MEMORY MANAGER
// ========================================

class ExportMemoryManager {
  constructor() {
    this.chunks = new Map()
    this.maxChunkSize = 5 * 1024 * 1024 // 5MB par chunk
  }

  async processLargeContent(content, processor) {
    const contentSize = new Blob([content]).size
    
    if (contentSize <= this.maxChunkSize) {
      return await processor(content)
    }

    // Diviser en chunks pour gros contenus
    const chunks = this.createChunks(content)
    const results = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const chunkResult = await processor(chunk)
      results.push(chunkResult)
      
      // Forcer le garbage collection entre chunks
      if (i % 3 === 0 && window.gc) {
        window.gc()
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return this.combineResults(results)
  }

  createChunks(content) {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const chunks = []

    for (let i = 0; i < data.length; i += this.maxChunkSize) {
      const chunk = data.slice(i, i + this.maxChunkSize)
      chunks.push(new TextDecoder().decode(chunk))
    }

    return chunks
  }

  combineResults(results) {
    // Combiner les résultats - à adapter selon le type d'export
    return results.join('')
  }

  optimizeForExport(element) {
    // Optimiser l'élément pour l'export
    const cloned = element.cloneNode(true)
    
    // Nettoyer les attributs problématiques
    cloned.removeAttribute('data-reactroot')
    cloned.removeAttribute('data-reactid')
    
    // Forcer le thème clair pour l'export
    this.forceLightTheme(cloned)
    
    // Optimiser les images
    this.optimizeImages(cloned)
    
    return cloned
  }

  forceLightTheme(element) {
    const elements = element.querySelectorAll('*')
    elements.forEach(el => {
      const computedStyle = window.getComputedStyle(el)
      
      // Forcer le fond blanc
      if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
          computedStyle.backgroundColor !== 'transparent') {
        el.style.backgroundColor = '#ffffff'
      }
      
      // Forcer le texte noir
      const textColor = computedStyle.color
      if (textColor && this.isLightColor(textColor)) {
        el.style.color = '#000000'
      }
    })
  }

  isLightColor(color) {
    // Vérifier si une couleur est claire
    const rgb = color.match(/\d+/g)
    if (!rgb || rgb.length < 3) return false
    
    const [r, g, b] = rgb.map(Number)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 186
  }

  optimizeImages(element) {
    const images = element.querySelectorAll('img')
    images.forEach(img => {
      // S'assurer que les images sont chargées
      if (!img.complete) {
        img.crossOrigin = 'anonymous'
      }
    })
  }
}

// ========================================
// MAIN EXPORT ENGINE
// ========================================

class RobustExportEngine {
  constructor() {
    this.progressTracker = new ExportProgressTracker()
    this.memoryManager = new ExportMemoryManager()
    this.activeExports = new Set()
  }

  async exportToPDF(elementId, options = {}) {
    const exportId = this.generateExportId('pdf')
    this.activeExports.add(exportId)

    try {
      this.progressTracker.startExport(exportId, { type: 'pdf', elementId, options })

      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element #${elementId} non trouvé`)
      }

      // Préparer l'élément pour l'export
      const optimizedElement = this.memoryManager.optimizeForExport(element)
      
      // Créer le conteneur d'export
      const exportContainer = this.createExportContainer(optimizedElement)
      document.body.appendChild(exportContainer)

      const result = await robustAsync.memorySafeOperation(
        async () => {
          return await this.generatePDF(exportContainer, options, exportId)
        },
        {
          timeout: EXPORT_CONFIG.TIMEOUTS.pdf,
          metadata: { type: 'pdf', elementId }
        }
      )

      this.progressTracker.completeExport(exportId, result)
      return result

    } catch (error) {
      const standardError = this.standardizeError(error, 'pdf')
      this.progressTracker.failExport(exportId, standardError)
      throw standardError
    } finally {
      this.cleanup(exportId)
    }
  }

  async generatePDF(element, options, exportId) {
    const filename = options.filename || 'document'
    const pdfOptions = { ...EXPORT_CONFIG.PDF_OPTIONS, ...options }

    // Importer html2pdf.js dynamiquement
    const html2pdf = await this.importHTML2PDF()

    // Configurer html2pdf avec retry
    const worker = html2pdf().set(pdfOptions).from(element)

    // Suivre la progression
    if (options.onProgress) {
      this.progressTracker.onProgress(exportId, options.onProgress)
    }

    // Générer le PDF avec retry
    const pdf = await robustAsync.execute(
      async () => {
        return await worker.toPdf().get('pdf')
      },
      {
        timeout: EXPORT_CONFIG.TIMEOUTS.pdf,
        retries: 2,
        operationType: 'pdf_generation',
        onProgress: (progress) => {
          this.progressTracker.updateProgress(exportId, progress.attempt / progress.maxAttempts * 50)
        }
      }
    )

    // Ajouter la numérotation des pages si demandé
    if (options.includePageNumbers) {
      this.addPageNumbers(pdf, options)
    }

    // Sauvegarder le PDF
    await robustAsync.execute(
      async () => {
        await worker.save()
      },
      {
        timeout: 15000,
        operationType: 'pdf_save'
      }
    )

    return {
      success: true,
      filename: `${filename}.pdf`,
      size: pdf.output('blob').size,
      pages: pdf.getNumberOfPages()
    }
  }

  async exportToWord(elementId, options = {}) {
    const exportId = this.generateExportId('word')
    this.activeExports.add(exportId)

    try {
      this.progressTracker.startExport(exportId, { type: 'word', elementId, options })

      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element #${elementId} non trouvé`)
      }

      const optimizedElement = this.memoryManager.optimizeForExport(element)
      const content = optimizedElement.innerHTML

      const result = await robustAsync.memorySafeOperation(
        async () => {
          return await this.generateWord(content, options, exportId)
        },
        {
          timeout: EXPORT_CONFIG.TIMEOUTS.word,
          metadata: { type: 'word', elementId }
        }
      )

      this.progressTracker.completeExport(exportId, result)
      return result

    } catch (error) {
      const standardError = this.standardizeError(error, 'word')
      this.progressTracker.failExport(exportId, standardError)
      throw standardError
    } finally {
      this.cleanup(exportId)
    }
  }

  async generateWord(content, options, exportId) {
    const filename = options.filename || 'document'

    // Créer le contenu Word avec retry
    const wordContent = await robustAsync.execute(
      async () => {
        return this.createWordContent(content, options)
      },
      {
        timeout: EXPORT_CONFIG.TIMEOUTS.word,
        retries: 2,
        operationType: 'word_generation',
        onProgress: (progress) => {
          this.progressTracker.updateProgress(exportId, progress.attempt / progress.maxAttempts * 80)
        }
      }
    )

    // Créer et télécharger le fichier
    const blob = new Blob([wordContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    await this.downloadFile(blob, `${filename}.docx`)
    this.progressTracker.updateProgress(exportId, 100)

    return {
      success: true,
      filename: `${filename}.docx`,
      size: blob.size
    }
  }

  async exportToImage(elementId, options = {}) {
    const exportId = this.generateExportId('image')
    this.activeExports.add(exportId)

    try {
      this.progressTracker.startExport(exportId, { type: 'image', elementId, options })

      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element #${elementId} non trouvé`)
      }

      const optimizedElement = this.memoryManager.optimizeForExport(element)

      const result = await robustAsync.memorySafeOperation(
        async () => {
          return await this.generateImage(optimizedElement, options, exportId)
        },
        {
          timeout: EXPORT_CONFIG.TIMEOUTS.image,
          metadata: { type: 'image', elementId }
        }
      )

      this.progressTracker.completeExport(exportId, result)
      return result

    } catch (error) {
      const standardError = this.standardizeError(error, 'image')
      this.progressTracker.failExport(exportId, standardError)
      throw standardError
    } finally {
      this.cleanup(exportId)
    }
  }

  async generateImage(element, options, exportId) {
    const format = options.format || 'png'
    const quality = options.quality || 0.9
    const filename = options.filename || 'image'

    // Importer html2canvas dynamiquement
    const html2canvas = await this.importHTML2Canvas()

    const canvas = await robustAsync.execute(
      async () => {
        return await html2canvas(element, {
          scale: options.scale || 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          removeContainer: true
        })
      },
      {
        timeout: EXPORT_CONFIG.TIMEOUTS.image,
        retries: 2,
        operationType: 'image_generation',
        onProgress: (progress) => {
          this.progressTracker.updateProgress(exportId, progress.attempt / progress.maxAttempts * 90)
        }
      }
    )

    // Convertir en blob et télécharger
    const blob = await robustAsync.execute(
      async () => {
        return new Promise((resolve) => {
          canvas.toBlob(resolve, `image/${format}`, quality)
        })
      },
      {
        timeout: 10000,
        operationType: 'image_conversion'
      }
    )

    await this.downloadFile(blob, `${filename}.${format}`)
    this.progressTracker.updateProgress(exportId, 100)

    return {
      success: true,
      filename: `${filename}.${format}`,
      size: blob.size,
      width: canvas.width,
      height: canvas.height
    }
  }

  // Méthodes utilitaires
  createExportContainer(element) {
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: -99999px;
      top: 0;
      width: 210mm;
      background: white;
      z-index: -1;
      padding: 20px;
    `
    container.appendChild(element)
    return container
  }

  async importHTML2PDF() {
    try {
      const module = await import('html2pdf.js')
      return module.default
    } catch (error) {
      throw new Error('html2pdf.js non disponible. Importez la bibliothèque.')
    }
  }

  async importHTML2Canvas() {
    try {
      const module = await import('html2canvas')
      return module.default
    } catch (error) {
      throw new Error('html2canvas non disponible. Importez la bibliothèque.')
    }
  }

  createWordContent(html, options = {}) {
    // Créer un document Word basique
    const title = options.title || 'Document'
    const author = options.author || 'ABAWI'
    
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
<w:documentProperties>
<w:title>${title}</w:title>
<w:author>${author}</w:author>
</w:documentProperties>
<w:body>
<w:p>
<w:pPr>
<w:jc w:val="center"/>
<w:rPr>
<w:b/>
<w:sz w:val="28"/>
</w:rPr>
</w:pPr>
<w:r>
<w:t>${title}</w:t>
</w:r>
</w:p>
<w:br/>
<w:p>
<w:r>
<w:t>${html.replace(/<[^>]*>/g, '')}</w:t>
</w:r>
</w:p>
</w:body>
</w:wordDocument>`
  }

  addPageNumbers(pdf, options) {
    const start = Number(options.pageNumberStart || 1) || 1
    const totalPages = pdf.getNumberOfPages()
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    pdf.setFontSize(10)
    pdf.setTextColor(75, 85, 99) // #4B5563

    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p)
      const pageNumber = start + (p - 1)
      pdf.text(String(pageNumber), pageW / 2, pageH - 8, { align: 'center' })
    }
  }

  async downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Nettoyer l'URL après un délai
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  generateExportId(type) {
    return `export_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  standardizeError(error, exportType) {
    // Standardiser les erreurs d'export
    if (error.name === 'AbortError') {
      return {
        type: EXPORT_ERRORS.TIMEOUT,
        message: `L'export ${exportType} a pris trop de temps.`,
        userMessage: 'L\'export a échoué en raison d\'un timeout. Essayez avec un contenu plus petit.'
      }
    }

    if (error.message?.includes('out of memory')) {
      return {
        type: EXPORT_ERRORS.MEMORY,
        message: `Mémoire insuffisante pour l'export ${exportType}.`,
        userMessage: 'Mémoire insuffisante. Essayez de fermer d\'autres onglets ou de réduire le contenu.'
      }
    }

    if (error.message?.includes('html2pdf') || error.message?.includes('html2canvas')) {
      return {
        type: exportType === 'pdf' ? EXPORT_ERRORS.PDF_GENERATION_FAILED : EXPORT_ERRORS.CANVAS_ERROR,
        message: `Échec de génération ${exportType}: ${error.message}`,
        userMessage: `L'export ${exportType} a échoué. Vérifiez le contenu et réessayez.`
      }
    }

    return {
      type: 'unknown',
      message: error.message || `Erreur inconnue lors de l'export ${exportType}`,
      userMessage: `Une erreur est survenue lors de l'export ${exportType}.`
    }
  }

  cleanup(exportId) {
    // Nettoyer les conteneurs d'export
    const containers = document.querySelectorAll('[data-export-container]')
    containers.forEach(container => {
      if (container.dataset.exportId === exportId) {
        container.remove()
      }
    })

    this.progressTracker.cleanup(exportId)
    this.activeExports.delete(exportId)
  }

  // Méthodes publiques
  onProgress(exportId, callback) {
    this.progressTracker.onProgress(exportId, callback)
  }

  cancelExport(exportId) {
    this.progressTracker.cancelExport(exportId)
    this.cleanup(exportId)
  }

  getExportStatus(exportId) {
    return this.progressTracker.getExport(exportId)
  }

  getActiveExports() {
    return Array.from(this.activeExports).map(id => this.progressTracker.getExport(id))
  }

  // Fallback methods
  async fallbackPrint(elementId) {
    try {
      const element = document.getElementById(elementId)
      if (!element) return false

      // Créer une version imprimable
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <html>
          <head>
            <title>ABAWI Export</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${element.innerHTML}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      
      return true
    } catch (error) {
      console.error('[EXPORT] Fallback print failed:', error)
      return false
    }
  }
}

// ========================================
// INSTANCE GLOBALE
// ========================================

const robustExportEngine = new RobustExportEngine()

export default robustExportEngine
export { EXPORT_CONFIG, EXPORT_ERRORS, ExportProgressTracker, ExportMemoryManager, RobustExportEngine }
