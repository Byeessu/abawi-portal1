// ── Détection automatique du fournisseur selon le format de clé ────────────
// • "AIzaSy..." → Google AI Studio (OpenAI-compatible) → modèle Gemini
// • "gsk_..."   → Groq Cloud → llama-3.3-70b-versatile
// • xai-...     → xAI Grok → grok-3
// • Autre       → Groq par défaut
function resolveProvider(key) {
  if (!key) return { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' }

  // Google AI Studio — modèle Gemini indépendant de VITE_GROQ_MODEL
  if (key.startsWith('AIzaSy')) {
    return {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash',
    }
  }

  // xAI Grok
  if (key.startsWith('xai-')) {
    return {
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-3',
    }
  }

  // Groq (gsk_...) ou clé inconnue → Groq par défaut
  return {
    baseUrl: import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
  }
}

const GROQ_BROWSER_KEY = import.meta.env.VITE_GROQ_API_KEY || 
               import.meta.env.GROQ_API_KEY || 
               import.meta.env.VITE_GROK_LLAMA_API_KEY ||
               import.meta.env.GROK_LLAMA_API_KEY || 
               ''
const { baseUrl: RESOLVED_BASE_URL, model: RESOLVED_MODEL } = resolveProvider(GROQ_BROWSER_KEY)

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
      await new Promise((r) => setTimeout(r, 600 * (i + 1)))
    }
  }
  throw lastErr
}

async function callProxy(payload) {
  const res = await fetch('/.netlify/functions/groq-chat?t=' + Date.now(), {
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

async function callDirect(payload, apiKey, baseUrl) {
  const url = `${baseUrl || RESOLVED_BASE_URL}/chat/completions`
  const res = await fetch(url, {
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
  const { baseUrl } = resolveProvider(key)

  if (import.meta.env.DEV) {
    if (!key) throw new Error('NO_KEY')
    return await withRetry(() => callDirect(payload, key, baseUrl))
  }

  try {
    return await withRetry(() => callProxy(payload))
  } catch {
    if (!key) throw new Error('NO_KEY')
    return await withRetry(() => callDirect(payload, key, baseUrl))
  }
}

export function hasGroqAccess() { return true }

// Retourne l'URL de base et le modèle actuellement actifs (pour healthCheck)
export function getProviderInfo() {
  return { baseUrl: RESOLVED_BASE_URL, model: RESOLVED_MODEL, key: GROQ_BROWSER_KEY }
}

export async function callGroq(promptOrMessages, options = {}) {
  const {
    maxTokens = 1500,
    temperature = 0.7,
    model = RESOLVED_MODEL,
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

export async function callGroqJSON(promptOrMessages, options = {}) {
  const raw = await callGroq(promptOrMessages, { ...options, jsonMode: true, temperature: options.temperature ?? 0.1 })
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/[\[{][\s\S]*[\]}]/)
    if (match) { try { return JSON.parse(match[0]) } catch { /* ignore */ } }
    return null
  }
}
