// ── Claude Anthropic — sécurisé : validation + sanitisation ───────────────

const MAX_BODY_BYTES = 48_000
const MAX_MESSAGES   = 20
const MAX_MSG_CHARS  = 16_000
const MAX_TOKENS_CAP = 4000

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
  }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages
    .slice(0, MAX_MESSAGES)
    .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, MAX_MSG_CHARS),
    }))
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }
  if (!event.headers['content-type']?.includes('application/json')) return { statusCode: 415, headers: corsHeaders(), body: JSON.stringify({ error: 'Content-Type required' }) }

  const rawBody = event.body || ''
  if (rawBody.length > MAX_BODY_BYTES) return { statusCode: 413, headers: corsHeaders(), body: JSON.stringify({ error: 'Request too large' }) }

  let body
  try { body = JSON.parse(rawBody) } catch { return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || ''
  if (!CLAUDE_API_KEY) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Claude not configured' }) }

  const messages = sanitizeMessages(body.messages)
  if (!messages.length) return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'messages required' }) }

  const options = body.options || {}
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: Math.min(Number(options.maxTokens) || 2000, MAX_TOKENS_CAP),
        temperature: Math.max(0, Math.min(1, Number(options.temperature) || 0.7)),
        messages,
      }),
    })

    if (!r.ok) {
      const err = await r.text().catch(() => '')
      return { statusCode: r.status, headers: corsHeaders(), body: JSON.stringify({ error: `Claude error ${r.status}` }) }
    }

    const data = await r.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      body: JSON.stringify({ success: true, content: data.content?.[0]?.text || '', usage: data.usage }),
    }
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Claude service error' }) }
  }
}
