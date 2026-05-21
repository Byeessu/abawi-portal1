// Scheduled: runs every 3 hours to analyze new job offers
// Netlify config: cron = "0 */3 * * *"

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function groqAnalyze(offer) {
  const prompt = `Analyse cette offre d'emploi et retourne UNIQUEMENT un JSON strict :
{
  "title": "titre propre et court",
  "summary": "résumé accrocheur 2-3 lignes",
  "requirements": ["exigence 1", "exigence 2", "exigence 3"],
  "tags": ["CDI/CDD/Stage/Freelance", "secteur", "ville/pays", "niveau"],
  "contract_type": "CDI/CDD/Stage/Freelance",
  "location": "ville, pays"
}

Offre brute :
Titre: ${offer.title || ''}
Description: ${(offer.description || '').slice(0, 3000)}
Source: ${offer.source || ''}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.3, max_tokens: 1200, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '';
  try { return JSON.parse(raw); } catch { return null; }
}

exports.handler = async function(event, context) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: rawOffers } = await supabase.from('job_offers').select('*').eq('analyzed', false).limit(20);
  if (!rawOffers?.length) return { statusCode: 200, body: JSON.stringify({ ok: true, processed: 0 }) };

  let processed = 0;
  for (const offer of rawOffers) {
    const enriched = await groqAnalyze(offer);
    if (enriched) {
      await supabase.from('job_offers').update({
        title: enriched.title || offer.title,
        summary: enriched.summary || offer.summary,
        requirements: enriched.requirements || offer.requirements,
        tags: enriched.tags || offer.tags,
        contract_type: enriched.contract_type || offer.contract_type,
        location: enriched.location || offer.location,
        analyzed: true,
      }).eq('id', offer.id);
      processed++;
    }
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true, processed }) };
};
