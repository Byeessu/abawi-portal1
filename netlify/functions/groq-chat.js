// ── Sécurité : validation + détection endpoint + rate-limit basique ────────

const MAX_BODY_BYTES = 5_000_000       // ~5 MB — plafond AWS Lambda sous-jacent à Netlify
const MAX_MESSAGES   = 20
const MAX_MSG_CHARS  = 500_000         // par message — supporte de gros documents
const MAX_TOKENS_CAP = 32000           // max_tokens — llama-3.3-70b-versatile supporte 32K sortie

// ── Détection endpoint + modèle selon format de clé ──────────────
// Détecte les valeurs masquées (Netlify Secrets Scanner remplace par ****)
const PLACEHOLDERS = new Set(['undefined', 'null', '', 'your_key_here', 'xxx', '***', 'sk-', 'gsk-'])
function isMasked(v) { return !v || typeof v !== 'string' || /\*{4,}/.test(v) || !v.trim() }
function isPlaceholder(v) { return !v || typeof v !== 'string' || PLACEHOLDERS.has(v.trim().toLowerCase()) || PLACEHOLDERS.has(v.trim()) }
function safe(v, fallback) { return isMasked(v) || isPlaceholder(v) ? fallback : v }

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
    if (!upstream.ok) {
      // Ne jamais renvoyer le JSON brut de l'upstream (contient parfois la clé masquée ou des détails sensibles)
      const status = upstream.status
      if (status === 401 || status === 403) {
        return out(status, 'Clé API invalide. Vérifiez la variable d’environnement GROQ_API_KEY (ou VITE_GROQ_API_KEY) dans le dashboard Netlify.')
      }
      if (status === 429) {
        return out(status, 'Limite de débit atteinte. Réessayez dans quelques secondes.')
      }
      if (status === 404) {
        return out(status, 'Modèle IA non trouvé. Vérifiez le nom du modèle.')
      }
      return out(status, txt ? `Erreur IA ${status}` : `Erreur IA ${status}`)
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: txt }
  } catch (e) {
    return out(500, 'Service IA temporairement indisponible. Réessayez plus tard.')
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
