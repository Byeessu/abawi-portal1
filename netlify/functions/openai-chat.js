const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ''
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { messages, options = {} } = JSON.parse(event.body)
    
    const {
      maxTokens = 4000,
      temperature = 0.9,
      model = 'gpt-4-turbo-preview',
      responseFormat = { type: 'json_object' }
    } = options

    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        response_format,
        seed: Math.floor(Math.random() * 1000000)
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('OpenAI API error:', errorText)
      
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({
          error: `OpenAI API error: ${res.status}`,
          details: errorText
        })
      }
    }

    const data = await res.json()
    const content = data.choices[0]?.message?.content || ''

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, content })
    }

  } catch (error) {
    console.error('OpenAI function error:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    }
  }
}
