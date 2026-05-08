exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return out(405, 'Method not allowed')

  try {
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || ''
    if (!apiKey) return out(500, 'Missing ELEVENLABS_API_KEY on server')

    const body = JSON.parse(event.body || '{}')
    const voiceId = String(body.voiceId || '')
    const text = String(body.text || '')
    const modelId = String(body.modelId || 'eleven_multilingual_v2')
    const voiceSettings = body.voiceSettings || {}
    const speed = body.speed

    if (!voiceId || !text) return out(400, 'voiceId and text are required')

    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
        ...(speed ? { speed } : {}),
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '')
      return out(upstream.status, errText || `Upstream error ${upstream.status}`)
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
      body: buffer.toString('base64'),
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

