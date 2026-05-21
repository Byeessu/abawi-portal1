// ─── Course PDF storage ───────────────────────────────────────────────────────
// PDFs stored per course in localStorage.
// Each entry: { id, courseId, title, description, fileName, fileSize, fileData (base64), accessLevel, uploadedAt }
// accessLevel: 'admin' | 'enrolled'  (admin = admin only; enrolled = all approved students)

const KEY = 'arkelup_course_pdfs_v1'
const MAX_LOCAL_SIZE = 4 * 1024 * 1024 // 4 MB per file warning threshold

export function getAllPDFs() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function getCoursePDFs(courseId) {
  return (getAllPDFs()[courseId] || [])
}

function saveAll(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      throw new Error('Espace de stockage local plein. Supprimez des fichiers existants.')
    }
    throw e
  }
}

export function addPDF(courseId, { title, description, fileName, fileSize, fileData, accessLevel }) {
  const map = getAllPDFs()
  if (!map[courseId]) map[courseId] = []
  const pdf = {
    id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    courseId,
    title,
    description: description || '',
    fileName,
    fileSize,
    fileData,
    accessLevel: accessLevel || 'admin',
    uploadedAt: new Date().toISOString(),
  }
  map[courseId].push(pdf)
  saveAll(map)
  return pdf
}

export function updatePDF(courseId, pdfId, updates) {
  const map = getAllPDFs()
  if (map[courseId]) {
    map[courseId] = map[courseId].map(p => p.id === pdfId ? { ...p, ...updates } : p)
    saveAll(map)
  }
}

export function deletePDF(courseId, pdfId) {
  const map = getAllPDFs()
  if (map[courseId]) {
    map[courseId] = map[courseId].filter(p => p.id !== pdfId)
    saveAll(map)
  }
}

export function getPDFsForUser(courseId, { isAdmin, isEnrolled }) {
  const all = getCoursePDFs(courseId)
  if (isAdmin) return all
  if (isEnrolled) return all.filter(p => p.accessLevel === 'enrolled')
  return []
}

export function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export async function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export { MAX_LOCAL_SIZE }
