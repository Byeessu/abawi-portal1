import { getProviderInfo } from './groqClient';

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || '';

export async function generateDesc(g) {
  const { baseUrl, model } = getProviderInfo();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model,
        max_tokens: 150,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: `Description marketing en 1 phrase (100 car max) pour ce guide PDF africain : "${g.titre}" (${g.categorie}). Reponds juste la phrase.`
        }]
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error(e);
    return null;
  }
}
