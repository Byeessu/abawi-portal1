import { resolveRuntimeApiKey } from './runtimeApiKeys'

function getElevenLabsBrowserKey() {
  return resolveRuntimeApiKey({
    envKeys: [import.meta.env.VITE_ELEVENLABS_API_KEY, import.meta.env.VITE_ELEVEN_KEY],
    providerId: 'elevenlabs',
    includeAlias: true,
  })
}

function mapError(status, text = '') {
  if (status === 401) return new Error('INVALID_KEY')
  if (status === 429) return new Error('QUOTA_EXHAUSTED')
  if (status >= 500) return new Error('ELEVENLABS_UPSTREAM_ERROR')
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
      const transient = code.includes('QUOTA_EXHAUSTED') || code.includes('UPSTREAM_ERROR') || code.includes('HTTP_5')
      if (!transient || i === attempts - 1) break
      const delay = 700 * (i + 1)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}

async function callViaProxy(payload) {
  const res = await fetch('/.netlify/functions/elevenlabs-tts', {
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

async function callDirect(payload, apiKey) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${payload.voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: payload.text,
      model_id: payload.modelId || 'eleven_multilingual_v2',
      voice_settings: payload.voiceSettings || {},
      ...(payload.speed ? { speed: payload.speed } : {}),
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw mapError(res.status, txt)
  }
  return await res.blob()
}

export async function requestElevenLabsTTS(payload, preferredApiKey = '') {
  // 1) Preferred secure path: Netlify proxy with server key
  try {
    return await withRetry(() => callViaProxy(payload))
  } catch (e) {
    // 2) Fallback: direct browser call if key exists locally
    const key = preferredApiKey || getElevenLabsBrowserKey() || ''
    if (!key) throw e.message === 'INVALID_KEY' ? e : new Error('NO_KEY')
    return await withRetry(() => callDirect(payload, key))
  }
}

