/**
 * Extraction de 3 valeurs CA (N-2, N-1, N) depuis CSV ou données tableur.
 */
function parseNumberCell(v) {
  if (v == null || v === '') return NaN
  const s = String(v).replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(s.replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

function rowNumbers(row) {
  if (!Array.isArray(row)) return []
  return row.map(parseNumberCell).filter((n) => Number.isFinite(n) && n >= 0)
}

/**
 * @param {string} text - contenu CSV brut
 * @returns {number[] | null} [caN2, caN1, caN] ou null
 */
export function parseCAFromCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
  if (!lines.length) return null

  const caRowRegex = /^(ca|chiffre|chiffre\s*d['']?affaires|ventes|revenue|sales|turnover)/i

  for (const line of lines) {
    const delim = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ','
    const parts = line.split(delim).map((p) => p.trim())
    const first = parts[0] || ''
    const nums = parts.slice(1).map(parseNumberCell).filter((n) => Number.isFinite(n))
    if (caRowRegex.test(first.replace(/\s+/g, ' ')) && nums.length >= 3) {
      return [nums[nums.length - 3], nums[nums.length - 2], nums[nums.length - 1]]
    }
  }

  for (const line of lines) {
    const delim = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ','
    const parts = line.split(delim)
    const nums = parts.map(parseNumberCell).filter((n) => Number.isFinite(n) && n > 0)
    if (nums.length >= 3) return nums.slice(-3)
  }

  return null
}

/**
 * @param {ArrayBuffer} buffer - fichier .xlsx
 * @returns {number[] | null}
 */
export async function parseCAFromExcelBuffer(buffer) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  const caRowRegex = /ca|chiffre|affaires|ventes|revenue|sales/i

  for (const row of data) {
    if (!Array.isArray(row) || !row.length) continue
    const headRaw = String(row[0] ?? '').trim()
    if (headRaw.startsWith('#')) continue
    const head = headRaw.toLowerCase()
    if (caRowRegex.test(head)) {
      const nums = rowNumbers(row.slice(1))
      if (nums.length >= 3) return nums.slice(-3)
    }
  }

  for (const row of data) {
    if (!Array.isArray(row)) continue
    if (String(row[0] ?? '').trim().startsWith('#')) continue
    const nums = rowNumbers(row)
    if (nums.length >= 3) return nums.slice(0, 3)
  }

  return null
}
