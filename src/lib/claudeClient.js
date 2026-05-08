// Client Claude Anthropic pour le Studio Design Pro
// La clé API est gérée côté serveur via la fonction Netlify (sécurité)

// Appel à Claude via Netlify function
export async function callClaude(prompt, options = {}) {
  try {
    const response = await fetch('/.netlify/functions/claude-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          maxTokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.9,
          model: options.model || 'claude-3-sonnet-20240229'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}
