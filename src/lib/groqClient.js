import { resolveRuntimeApiKey } from './runtimeApiKeys'

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_MODEL_FALLBACKS = ['llama-3.1-8b-instant', 'mixtral-8x7b-32768']

function normalizeModelId(value, fallback = DEFAULT_GROQ_MODEL) {
  if (!value || typeof value !== 'string') return fallback
  let model = value.trim()
  if (!model) return fallback
  // Corrige les formats saisis avec espaces: "llama-3.3-70b - versatile"
  model = model.replace(/\s*-\s*/g, '-')
  // Corrige les copier-coller type "models/llama-..."
  model = model.replace(/^models\//i, '')
  return model || fallback
}

// ── Détection automatique du fournisseur selon le format de clé ────────────
// • "AIzaSy..." → Google AI Studio (OpenAI-compatible) → modèle Gemini
// • "gsk_..."   → Groq Cloud → llama-3.3-70b-versatile
// • xai-...     → xAI Grok → grok-3
// • Autre       → Groq par défaut
function resolveProvider(key) {
  if (!key) return { baseUrl: DEFAULT_GROQ_BASE_URL, model: DEFAULT_GROQ_MODEL }

  // Google AI Studio — modèle Gemini indépendant de VITE_GROQ_MODEL
  if (key.startsWith('AIzaSy')) {
    return {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: normalizeModelId(import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash', 'gemini-2.0-flash'),
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
    baseUrl: import.meta.env.VITE_GROQ_BASE_URL || DEFAULT_GROQ_BASE_URL,
    model: normalizeModelId(import.meta.env.VITE_GROQ_MODEL || DEFAULT_GROQ_MODEL),
  }
}

function getGroqBrowserKey() {
  return resolveRuntimeApiKey({
    envKeys: [
      import.meta.env.VITE_GROQ_API_KEY,
      import.meta.env.GROQ_API_KEY,
      import.meta.env.VITE_GROK_LLAMA_API_KEY,
      import.meta.env.GROK_LLAMA_API_KEY,
    ],
    providerId: 'groq',
    includeAlias: true,
  })
}

function normalizeError(status, text = '') {
  const upperText = String(text || '').toUpperCase()
  if (status === 401) return new Error('INVALID_KEY')
  if (status === 403) return new Error('INVALID_KEY')
  if (status === 429) return new Error('RATE_LIMIT')
  if (status === 413) return new Error('REQUEST_TOO_LARGE')
  if (status === 400 && upperText.includes('MESSAGE')) return new Error('INVALID_PROMPT')
  if (status === 404 && (upperText.includes('MODEL') || upperText.includes('MODELS/'))) return new Error('MODEL_NOT_FOUND')
  if (status === 500 && upperText.includes('NOT CONFIGURED')) return new Error('NO_KEY')
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
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)))
    }
  }
  throw lastErr
}

function normalizePayloadModel(payload, fallbackModel) {
  return {
    ...payload,
    model: normalizeModelId(payload?.model, fallbackModel),
  }
}

function isModel404(error) {
  const code = String(error?.message || '').toUpperCase()
  return code.includes('MODEL_NOT_FOUND') || (code.includes('HTTP_404') && (code.includes('MODEL') || code.includes('MODELS/')))
}

function isRateLimited(error) {
  return String(error?.message || '').toUpperCase().includes('RATE_LIMIT')
}

function getProviderFallbackModels(baseUrl, baseModel) {
  const normalizedBaseUrl = String(baseUrl || '').toLowerCase()
  if (normalizedBaseUrl.includes('api.groq.com')) {
    return [baseModel, ...GROQ_MODEL_FALLBACKS]
  }
  // Pour xAI/Gemini (ou autres), on évite des IDs Groq incompatibles.
  return [baseModel]
}

async function tryWithRateLimitFallback(payload, requestFn, fallbackModels = []) {
  const triedModels = new Set()
  const modelCandidates = fallbackModels.length
    ? fallbackModels
    : [normalizeModelId(payload?.model, DEFAULT_GROQ_MODEL)]

  let lastError = null
  for (const model of modelCandidates) {
    const normalizedModel = normalizeModelId(model, DEFAULT_GROQ_MODEL)
    if (triedModels.has(normalizedModel)) continue
    triedModels.add(normalizedModel)

    try {
      const candidatePayload = normalizePayloadModel({ ...payload, model: normalizedModel }, normalizedModel)
      return await requestFn(candidatePayload)
    } catch (error) {
      lastError = error
      // Si ce n'est pas une limitation de débit, on renvoie immédiatement.
      if (!isRateLimited(error)) throw error
    }
  }
  throw lastError || new Error('RATE_LIMIT')
}

async function callProxy(payload) {
  // Utiliser l'URL absolue pour éviter les problèmes de routing SPA
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const res = await fetch(`${base}/.netlify/functions/groq-chat?t=${Date.now()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw normalizeError(res.status, txt)
  }
  return await res.json()
}

async function callDirect(payload, apiKey, baseUrl) {
  const url = `${baseUrl || DEFAULT_GROQ_BASE_URL}/chat/completions`
  if (typeof window !== 'undefined') {
    try { console.log('[AI direct]', url, 'model:', payload?.model, 'key:', String(apiKey).slice(0, 8) + '…') } catch {}
  }
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
    if (typeof window !== 'undefined') {
      try { console.log('[AI direct] ERROR', res.status, txt.slice(0, 300)) } catch {}
    }
    throw normalizeError(res.status, txt)
  }
  return await res.json()
}

export async function groqChatCompletion(payload, preferredKey = '') {
  const key = preferredKey || getGroqBrowserKey() || ''
  const { baseUrl, model: resolvedModel } = resolveProvider(key)
  const normalizedPayload = normalizePayloadModel(payload, resolvedModel)
  const fallbackModels = getProviderFallbackModels(baseUrl, resolvedModel)

  // Si une clé API est disponible côté client, on l'utilise EN PRIORITÉ
  // (appel direct à api.groq.com, autorisé par le CSP, garanti de fonctionner
  // même si le proxy Netlify est bloqué par service worker / cache / CDN).
  if (key) {
    try {
      return await tryWithRateLimitFallback(normalizedPayload, (candidatePayload) =>
        withRetry(() => callDirect(candidatePayload, key, baseUrl))
      , fallbackModels)
    } catch (error) {
      if (isModel404(error)) {
        const fallbackPayload = normalizePayloadModel({ ...normalizedPayload, model: resolvedModel }, resolvedModel)
        try {
          return await tryWithRateLimitFallback(fallbackPayload, (candidatePayload) =>
            withRetry(() => callDirect(candidatePayload, key, baseUrl))
          , fallbackModels)
        } catch { /* fallback sur proxy ci-dessous */ }
      }
      // Direct a échoué (INVALID_KEY, RATE_LIMIT, réseau…) → tentative via le proxy Netlify.
      try {
        return await tryWithRateLimitFallback(normalizedPayload, (candidatePayload) =>
          withRetry(() => callProxy(candidatePayload))
        , fallbackModels)
      } catch {
        throw error
      }
    }
  }

  // Pas de clé côté client → proxy Netlify uniquement.
  try {
    return await tryWithRateLimitFallback(normalizedPayload, (candidatePayload) =>
      withRetry(() => callProxy(candidatePayload))
    , fallbackModels)
  } catch (error) {
    if (isModel404(error)) {
      const fallbackPayload = normalizePayloadModel({ ...normalizedPayload, model: resolvedModel }, resolvedModel)
      return await tryWithRateLimitFallback(fallbackPayload, (candidatePayload) =>
        withRetry(() => callProxy(candidatePayload))
      , fallbackModels)
    }
    throw error
  }
}

export function hasGroqAccess() { return true }

// Retourne l'URL de base et le modèle actuellement actifs (pour healthCheck)
export function getProviderInfo() {
  const key = getGroqBrowserKey()
  const { baseUrl, model } = resolveProvider(key)
  return { baseUrl, model, key }
}

export async function callGroq(promptOrMessages, options = {}) {
  const { model: resolvedModel } = resolveProvider(getGroqBrowserKey())
  const {
    maxTokens = 1500,
    temperature = 0.7,
    model = resolvedModel,
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
