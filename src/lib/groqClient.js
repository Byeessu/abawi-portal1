const GROQ_BROWSER_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_DEFAULT_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

function normalizeError(status, text = '') {
  if (status === 401) return new Error('INVALID_KEY')
  if (status === 429) return new Error('RATE_LIMIT')
  if (status >= 500) return new Error('GROQ_UPSTREAM_ERROR')
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
      const transient = code.includes('RATE_LIMIT') || code.includes('UPSTREAM_ERROR') || code.includes('HTTP_5')
      if (!transient || i === attempts - 1) break
      const delay = 600 * (i + 1)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}

async function callProxy(payload) {
  const res = await fetch('/.netlify/functions/groq-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw normalizeError(res.status, txt)
  }
  return await res.json()
}

async function callDirect(payload, apiKey) {
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw normalizeError(res.status, txt)
  }
  return await res.json()
}

export async function groqChatCompletion(payload, preferredKey = '') {
  const key = preferredKey || GROQ_BROWSER_KEY || ''

  // En dev Vite, le proxy Netlify n'est pas servi — aller directement à l'API
  if (import.meta.env.DEV) {
    if (!key) throw new Error('NO_KEY')
    return await withRetry(() => callDirect(payload, key))
  }

  try {
    return await withRetry(() => callProxy(payload))
  } catch {
    if (!key) throw new Error('NO_KEY')
    return await withRetry(() => callDirect(payload, key))
  }
}

// Access can come from proxy (server-side key) or browser key. We assume proxy
// is reachable in prod and let callers catch NO_KEY/INVALID_KEY if neither works.
export function hasGroqAccess() {
  return true
}

// Universal Groq caller. Accepts:
//   callGroq(promptString, { maxTokens, temperature, system, jsonMode, model })
//   callGroq(messagesArray, { ... })
export async function callGroq(promptOrMessages, options = {}) {
  const {
    maxTokens = 1500,
    temperature = 0.7,
    model = GROQ_DEFAULT_MODEL,
    jsonMode = false,
    system,
  } = options

  const messages = typeof promptOrMessages === 'string'
    ? (system
        ? [{ role: 'system', content: system }, { role: 'user', content: promptOrMessages }]
        : [{ role: 'user', content: promptOrMessages }])
    : promptOrMessages

  const payload = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  }

  const data = await groqChatCompletion(payload)
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// Convenience: JSON-mode Groq call, returns parsed JSON or null on failure.
export async function callGroqJSON(promptOrMessages, options = {}) {
  const raw = await callGroq(promptOrMessages, { ...options, jsonMode: true, temperature: options.temperature ?? 0.1 })
  try {
    return JSON.parse(raw)
  } catch {
    // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
    const match = raw.match(/[\[{][\s\S]*[\]}]/)
    if (match) { try { return JSON.parse(match[0]) } catch { /* ignore */ } }
    return null
  }
}
