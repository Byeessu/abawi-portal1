exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return out(405, 'Method not allowed')
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || process.env.VITE_GROK_LLAMA_API_KEY || ''
    if (!apiKey) return out(500, 'Missing GROQ_API_KEY on server')

    const body = JSON.parse(event.body || '{}')
    const payload = {
      model: body.model || process.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: Array.isArray(body.messages) ? body.messages : [],
      max_tokens: body.max_tokens ?? 1200,
      temperature: body.temperature ?? 0.7,
      ...(body.response_format ? { response_format: body.response_format } : {}),
    }
    if (!payload.messages.length) return out(400, 'messages required')

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const txt = await upstream.text()
    if (!upstream.ok) return out(upstream.status, txt || `Groq error ${upstream.status}`)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: txt,
    }
  } catch (e) {
    return out(500, e.message || 'Internal error')
  }
}

function out(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: message,
  }
}

