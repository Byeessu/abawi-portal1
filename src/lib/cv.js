import { getProviderInfo } from './groqClient';

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || '';

async function groqChat(prompt, maxTokens = 1000) {
  const { baseUrl, model } = getProviderInfo();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model,
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

/**
 * Adapte un CV complet à une offre d'emploi.
 * @param {Object} cvData — { info, exps, formations, skills, langues }
 * @param {string} offerText — texte brut de l'offre (extrait de PDF, image OCR, ou texte collé)
 * @returns {Object|null} — cvData adapté ou null
 */
export async function adaptCVToOffer(cvData, offerText) {
  if (!offerText || offerText.length < 20) return null;
  const context = JSON.stringify({
    info: cvData.info,
    exps: cvData.exps.map(e => ({ poste: e.poste, entreprise: e.entreprise, desc: e.desc })),
    formations: cvData.formations.map(f => ({ diplome: f.diplome, ecole: f.ecole, ville: f.ville, annee: f.annee })),
    skills: cvData.skills.map(s => s.name),
    langues: cvData.langues.map(l => ({ langue: l.langue, niveau: l.niveau })),
  }, null, 2);

  const prompt = `Tu es un expert RH et rédacteur de CV senior pour le marché africain.

MISSION : Adapte le CV ci-dessous à l'offre d'emploi fournie.
Règles strictes :
- Reformule le titre professionnel pour matcher exactement le poste visé
- Réécrit le résumé professionnel pour mettre en avant les compétences et expériences les plus pertinentes pour l'offre
- Réorganise/reformule les descriptions d'expériences pour mettre en avant les réalisations liées au poste (verbes d'action + résultats chiffrés)
- Ajoute 3-5 compétences techniques manquantes qui sont demandées dans l'offre (si pertinent)
- Garde les formations inchangées sauf si une certification spécifique est demandée
- Ne supprime aucune expérience : reformule seulement
- Le ton doit être professionnel, rassurant, adapté au marché africain

RÉPONSE : UNIQUEMENT un JSON valide (sans markdown) avec cette structure exacte :
{
  "info": { "titre": "", "resume": "" },
  "exps": [{ "poste": "", "entreprise": "", "debut": "", "fin": "", "desc": "" }],
  "skills": ["skill1", "skill2"],
  "langues": [{ "langue": "", "niveau": "" }]
}

OFFRE D'EMPLOI :
${offerText.slice(0, 6000)}

CV ACTUEL :
${context.slice(0, 4000)}`;

  const raw = await groqChat(prompt, 2500);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        info: { ...cvData.info, ...parsed.info },
        exps: parsed.exps?.length ? parsed.exps.map((e, i) => ({ ...cvData.exps[i], ...e })) : cvData.exps,
        formations: cvData.formations,
        skills: parsed.skills?.length ? parsed.skills.map(s => (typeof s === 'string' ? { name: s, level: 'Intermédiaire' } : s)) : cvData.skills,
        langues: parsed.langues?.length ? parsed.langues : cvData.langues,
      };
    }
  } catch (e) {
    console.error('[cv] adaptCVToOffer parse error:', e);
  }
  return null;
}

/**
 * Extrait le texte d'une offre d'emploi depuis un texte brut (OCR ou copié/collé).
 * Nettoie et structure l'offre.
 */
export async function extractOfferText(rawText) {
  if (!rawText) return '';
  const prompt = `Nettoie et structure cette offre d'emploi. Supprime les éléments de mise en page inutiles, les en-têtes/pieds de page, et garde uniquement le contenu utile : titre, description, missions, profil recherché, compétences requises, type de contrat, lieu, salaire. Réponds en texte brut structuré (pas de markdown) :

${rawText.slice(0, 4000)}`;
  return groqChat(prompt, 1200);
}
