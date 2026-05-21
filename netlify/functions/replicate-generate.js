const REPLICATE_TOKEN =
  process.env.REPLICATE_API_TOKEN ||
  process.env.VITE_REPLICATE_API_TOKEN ||
  ''

const BASE = 'https://api.replicate.com/v1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

async function startPrediction(model, input) {
  const parts = model.split('/')
  // models with owner/name use the models endpoint (no version hash needed)
  const url = parts.length === 2
    ? `${BASE}/models/${parts[0]}/${parts[1]}/predictions`
    : `${BASE}/predictions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=20',
    },
    body: JSON.stringify({ input }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || err.error || `Replicate HTTP ${res.status}`)
  }

  return res.json()
}

async function pollPrediction(id, deadlineMs) {
  while (Date.now() < deadlineMs) {
    const res = await fetch(`${BASE}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
    })
    const data = await res.json()

    if (data.status === 'succeeded') return data
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Prediction ${data.status}: ${data.error || ''}`)
    }

    await new Promise(r => setTimeout(r, 1500))
  }
  throw new Error('Image generation timed out')
}

function normalizeOutput(output) {
  if (!output) return []
  if (typeof output === 'string') return [output]
  if (Array.isArray(output)) return output.filter(u => typeof u === 'string')
  if (output.url) return [output.url]
  return []
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!REPLICATE_TOKEN) {
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not set on this deployment' }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { model, input } = body
  if (!model || !input?.prompt) {
    return {
      statusCode: 400, headers: CORS,
      body: JSON.stringify({ error: 'model and input.prompt are required' }),
    }
  }

  try {
    const deadline = Date.now() + 23_000
    let prediction = await startPrediction(model, input)

    if (prediction.status !== 'succeeded') {
      prediction = await pollPrediction(prediction.id, deadline)
    }

    const output = normalizeOutput(prediction.output)

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, output, predictionId: prediction.id }),
    }
  } catch (err) {
    console.error('[replicate-generate]', err.message)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ success: false, error: err.message }),
    }
  }
}
