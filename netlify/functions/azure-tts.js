const ALLOWED_VOICE = /^fr-[A-Z]{2}-[A-Za-z0-9]+(?:Multilingual)?Neural$/

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Method not allowed' }
  }

  try {
    const apiKey = process.env.AZURE_SPEECH_KEY || ''
    const region = (process.env.AZURE_SPEECH_REGION || 'westeurope').replace(/[^a-z0-9-]/gi, '')
    if (!apiKey) {
      return { statusCode: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Missing AZURE_SPEECH_KEY on server' }
    }

    const body = JSON.parse(event.body || '{}')
    let voiceName = String(body.voiceName || 'fr-FR-DeniseNeural')
    const text = String(body.text || '')
    if (!text.trim()) {
      return { statusCode: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'text is required' }
    }
    if (!ALLOWED_VOICE.test(voiceName)) {
      voiceName = 'fr-FR-DeniseNeural'
    }

    const safeText = escapeXml(text.slice(0, 9000))
    const ssml = `<?xml version="1.0" encoding="UTF-8"?><speak version="1.0" xml:lang="fr-FR"><voice name="${voiceName}">${safeText}</voice></speak>`

    const upstream = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'AbawiPortal/1.0',
      },
      body: ssml,
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '')
      return {
        statusCode: upstream.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: errText || `Upstream Azure error ${upstream.status}`,
      }
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: e.message || 'Internal error',
    }
  }
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
