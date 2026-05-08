// Client OpenAI pour le Studio Design Pro
// La clé API n'est JAMAIS exposée côté client : tous les appels passent par
// la fonction Netlify `/.netlify/functions/openai-chat` qui détient la clé.

function normalizeError(status, text = '') {
  if (status === 401) return new Error('INVALID_OPENAI_KEY')
  if (status === 429) return new Error('OPENAI_RATE_LIMIT')
  if (status >= 500) return new Error('OPENAI_UPSTREAM_ERROR')
  return new Error(`OPENAI_HTTP_${status}${text ? `:${text.slice(0, 80)}` : ''}`)
}

// Appel via proxy Netlify (sécurisé)
async function callOpenAIProxy(messages, options = {}) {
  const res = await fetch('/.netlify/functions/openai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, options })
  })
  if (!res.ok) {
    const text = await res.text()
    throw normalizeError(res.status, text)
  }
  const data = await res.json()
  return data.content
}

export { callOpenAIProxy }
export const callOpenAI = callOpenAIProxy
export default callOpenAIProxy
