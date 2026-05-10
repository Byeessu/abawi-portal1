// ── Sécurité : validation + détection endpoint + rate-limit basique ────────

const MAX_BODY_BYTES = 48_000          // ~48 KB max par requête
const MAX_MESSAGES   = 20
const MAX_MSG_CHARS  = 16_000          // par message
const MAX_TOKENS_CAP = 4000

// ── Détection endpoint + modèle selon format de clé ──────────────
// Détecte les valeurs masquées (Netlify Secrets Scanner remplace par ****)
function isMasked(v) { return !v || typeof v !== 'string' || /\*{4,}/.test(v) || !v.trim() }
function safe(v, fallback) { return isMasked(v) ? fallback : v }

function resolveEndpoint(key) {
  if (!key) return 'https://api.groq.com/openai/v1/chat/completions'
  if (key.startsWith('AIzaSy')) return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  if (key.startsWith('xai-'))   return 'https://api.x.ai/v1/chat/completions'
  return 'https://api.groq.com/openai/v1/chat/completions'
}

function defaultModel(key) {
  if (!key) return 'llama-3.3-70b-versatile'
  if (key.startsWith('AIzaSy')) return safe(process.env.VITE_GEMINI_MODEL, 'gemini-2.0-flash')
  if (key.startsWith('xai-'))   return 'grok-3'
  return safe(process.env.VITE_GROQ_MODEL, 'llama-3.3-70b-versatile')
}

function out(statusCode, message, json = false) {
  return {
    statusCode,
    headers: {
      'Content-Type': json ? 'application/json' : 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
    body: message,
  }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages
    .slice(0, MAX_MESSAGES)
    .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
    .map(m => ({
      role: m.role === 'system' || m.role === 'assistant' ? m.role : 'user',
      content: String(m.content).slice(0, MAX_MSG_CHARS),
    }))
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }
  if (event.httpMethod !== 'POST') return out(405, 'Method not allowed')
  if (!event.headers['content-type']?.includes('application/json')) return out(415, 'Content-Type must be application/json')

  const rawBody = event.body || ''
  if (rawBody.length > MAX_BODY_BYTES) return out(413, 'Request too large')

  let body
  try { body = JSON.parse(rawBody) } catch { return out(400, 'Invalid JSON') }

  const messages = sanitizeMessages(body.messages)
  if (!messages.length) return out(400, 'messages required')

  const apiKey = safe(process.env.GROQ_API_KEY, '') || safe(process.env.VITE_GROQ_API_KEY, '') || safe(process.env.VITE_GROK_LLAMA_API_KEY, '') || ''
  if (!apiKey) return out(500, 'AI service not configured')

  const endpoint = resolveEndpoint(apiKey)
  const payload = {
    model: safe(body.model, defaultModel(apiKey)),
    messages,
    max_tokens: Math.min(Number(body.max_tokens) || 1200, MAX_TOKENS_CAP),
    temperature: Math.max(0, Math.min(2, Number(body.temperature) || 0.7)),
    ...(body.response_format?.type === 'json_object' ? { response_format: { type: 'json_object' } } : {}),
  }

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const txt = await upstream.text()
    if (!upstream.ok) return out(upstream.status, txt || `AI error ${upstream.status}`)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: txt }
  } catch (e) {
    return out(500, 'AI service error')
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
