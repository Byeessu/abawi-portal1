function mapError(status, text = '') {
  if (status === 401 || status === 403) return new Error('AZURE_INVALID_KEY')
  if (status === 429) return new Error('AZURE_RATE_LIMIT')
  if (status >= 500) return new Error('AZURE_UPSTREAM_ERROR')
  return new Error(`HTTP_${status}${text ? `:${text.slice(0, 80)}` : ''}`)
}

async function withRetry(fn, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const code = String(e?.message || '')
      const transient = code.includes('AZURE_RATE_LIMIT') || code.includes('AZURE_UPSTREAM') || code.includes('HTTP_5')
      if (!transient || i === attempts - 1) break
      await new Promise((r) => setTimeout(r, 600 * (i + 1)))
    }
  }
  throw lastErr
}

async function callProxy(payload) {
  const res = await fetch('/.netlify/functions/azure-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw mapError(res.status, txt)
  }
  return await res.blob()
}

/**
 * Synthèse vocale Azure (neural) via proxy Netlify — clé uniquement côté serveur.
 * @param {{ text: string, voiceName?: string }} payload
 */
export async function requestAzureTTS(payload) {
  return await withRetry(() => callProxy(payload))
}
