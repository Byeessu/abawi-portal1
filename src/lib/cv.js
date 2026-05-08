const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || '';
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

async function groqChat(prompt, maxTokens = 1000) {
  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.error('[cv] groqChat error:', e);
    return '';
  }
}

export async function aiImprove(text, instruction) {
  if (!text) return text;
  const prompt = `${instruction} :\n\n${text}\n\nRéponds uniquement avec le texte amélioré, sans commentaire.`;
  return groqChat(prompt, 500);
}

export async function extractFromFile(rawText) {
  if (!rawText) return null;
  const prompt = `Extrais les informations de ce CV et retourne un JSON avec la structure suivante (uniquement le JSON, sans markdown) :
{
  "info": { "prenom": "", "nom": "", "email": "", "tel": "", "ville": "", "pays": "", "titre": "", "resume": "" },
  "exps": [{ "poste": "", "entreprise": "", "debut": "", "fin": "", "desc": "" }],
  "formations": [{ "diplome": "", "etablissement": "", "annee": "" }],
  "skills": [],
  "langues": [{ "langue": "", "niveau": "" }]
}

Texte du CV :
${rawText.slice(0, 4000)}`;

  const raw = await groqChat(prompt, 1500);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[cv] extractFromFile parse error:', e);
  }
  return null;
}

export async function proposeVariants(info, exps) {
  const context = `Titre visé : ${info.titre || 'professionnel'}\nExpériences : ${exps.map(e => e.poste + ' @ ' + e.entreprise).join(', ')}`;
  const prompt = `Propose 3 variantes de titre professionnel pour un CV basées sur ce profil :
${context}

Retourne uniquement un tableau JSON de 3 chaînes, sans commentaire. Ex: ["Titre 1", "Titre 2", "Titre 3"]`;

  const raw = await groqChat(prompt, 200);
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error('[cv] proposeVariants parse error:', e);
  }
  return [];
}
