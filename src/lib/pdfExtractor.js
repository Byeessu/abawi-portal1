import { supabase } from './supabase'

// Use pdf.js for client-side PDF extraction
let pdfjsLib = null

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib
  pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  return pdfjsLib
}

/**
 * Extract text content from a PDF URL
 * Supports: local /files/ URLs, Google Drive, Supabase Storage
 */
export async function extractPdfContent(url) {
  if (!url) return null

  try {
    const pdfjs = await getPdfJs()

    // For Google Drive URLs, convert to direct download
    let fetchUrl = url
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([^/]+)/)
      if (match) fetchUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`
    }

    const pdf = await pdfjs.getDocument(fetchUrl).promise
    const totalPages = pdf.numPages
    const pages = []

    for (let i = 1; i <= Math.min(totalPages, 30); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map((item) => item.str).join(' ')
      pages.push(text)
    }

    const fullText = pages.join('\n\n')
    const totalMots = fullText.split(/\s+/).length

    // Try to detect chapters from headings (lines in CAPS or short lines followed by long text)
    const lines = fullText.split('\n').filter((l) => l.trim().length > 0)
    const chapitres = detectChapters(lines)

    return {
      titre: detectTitle(lines),
      fullText: fullText.substring(0, 30000), // Cap at 30K chars
      chapitres,
      totalPages,
      totalMots,
    }
  } catch (e) {
    console.error('[PDFExtractor] Error:', e.message)
    return null
  }
}

function detectTitle(lines) {
  // First non-empty line that's short enough to be a title
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim()
    if (trimmed.length > 5 && trimmed.length < 100) return trimmed
  }
  return ''
}

function detectChapters(lines) {
  const chapters = []
  let currentTitle = 'Introduction'
  let currentContent = []

  for (const line of lines) {
    const trimmed = line.trim()
    // Detect chapter headings: short lines, possibly uppercase, or starting with numbers
    const isHeading = (
      (trimmed.length < 80 && trimmed.length > 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
      /^(chapitre|partie|section|module)\s+\d/i.test(trimmed) ||
      // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
      /^\d+[\.\)]\s+[A-Z]/.test(trimmed)
    )

    if (isHeading && currentContent.length > 0) {
      chapters.push({ titre: currentTitle, contenu: currentContent.join(' ').substring(0, 3000) })
      currentTitle = trimmed
      currentContent = []
    } else {
      currentContent.push(trimmed)
    }
  }

  if (currentContent.length > 0) {
    chapters.push({ titre: currentTitle, contenu: currentContent.join(' ').substring(0, 3000) })
  }

  return chapters.length > 0 ? chapters : [{ titre: 'Contenu', contenu: lines.join(' ').substring(0, 6000) }]
}

/**
 * Get cached extract from Supabase, or extract and cache
 */
export async function getOrExtractPdf(productId, pdfUrl) {
  // Check cache first
  try {
    const { data } = await supabase
      .from('pdf_extracts')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle()

    if (data && data.contenu_extrait) {
      return {
        fullText: data.contenu_extrait,
        chapitres: data.chapitres || [],
        totalPages: data.total_pages || 0,
        totalMots: data.total_mots || 0,
        cached: true,
      }
    }
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  } catch { /* ignore */ }

  // Extract from PDF
  const result = await extractPdfContent(pdfUrl)
  if (!result) return null

  // Cache in Supabase
  try {
    await supabase.from('pdf_extracts').insert({
      product_id: productId,
      contenu_extrait: result.fullText.substring(0, 50000),
      chapitres: result.chapitres,
      total_pages: result.totalPages,
      total_mots: result.totalMots,
    })
  } catch (e) {
    console.log('[PDFExtractor] Cache save failed:', e.message)
  }

  return result
}

/**
 * Get content for AI narration/video generation
 * Returns a truncated version suitable for Groq prompt (max ~6000 tokens)
 */
export async function getContentForAI(productId, pdfUrl, fallbackTitre, fallbackCategorie) {
  const extract = await getOrExtractPdf(productId, pdfUrl)

  if (extract && extract.fullText && extract.fullText.length > 200) {
    // Truncate to ~6000 tokens (~24000 chars)
    const truncated = extract.fullText.substring(0, 12000)
    return {
      hasRealContent: true,
      content: truncated,
      chapitres: extract.chapitres,
      totalPages: extract.totalPages,
    }
  }

  // Fallback: just title + category
  return {
    hasRealContent: false,
    content: `Guide: ${fallbackTitre}. Categorie: ${fallbackCategorie}.`,
    chapitres: [],
    totalPages: 0,
  }
}
