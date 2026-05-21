const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const GROQ_KEY = process.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const CATEGORY_MAP = {
  'Religion': { label: 'Religion — Église catholique', cat: 'Culture' },
  'Conférence': { label: 'Conférence', cat: 'Conférence' },
  'Impact': { label: 'Impact social & humanitaire', cat: 'Impact' },
  'Entrepreneuriat': { label: 'Entrepreneuriat & Startup', cat: 'Entrepreneuriat' },
  'Business': { label: 'Business & Networking', cat: 'Business' },
  'Economie': { label: 'Économie & Développement', cat: 'Economie' },
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function groqGenerateEvents(categoryKey, count) {
  const info = CATEGORY_MAP[categoryKey];
  const startDate = todayStr();
  const endDate = futureDate(180); // 6 months ahead

  const prompt = `Tu es un expert événementiel au Sénégal. Génère ${count} événements réalistes et imminents pour la catégorie "${info.label}" se déroulant au Sénégal entre ${startDate} et ${endDate}.

RÈGLES IMPORTANTES :
- Pour la catégorie "Religion", inclue UNIQUEMENT des événements de l'ÉGLISE CATHOLIQUE (messes, pèlerinages, processions, veillées, retraites). Pas d'événements musulmans ou d'autres religions.
- Les événements doivent être réalistes : vraies villes (Dakar, Thiès, Saint-Louis, Kaolack, Ziguinchor, Mbour, Popenguine, Touba, etc.), vrais lieux ou lieux plausibles.
- Les événements catholiques doivent être cohérents avec le calendrier liturgique (Pentecôte, Assomption, Avent, Noël, Carême, Pâques, etc.).
- La date doit être au format YYYY-MM-DD.
- L'heure au format HH:MM.
- Pour les billets : si l'événement est gratuit (entrée libre), renvoie un tableau vide []. Si payant, renvoie un tableau d'objets avec { nom, prix (FCFA), places }.
- "featured" : true uniquement pour les événements les plus importants (1 sur 3 max).
- Description détaillée en français avec le programme, speakers/celebrants, et infos pratiques.

Retourne UNIQUEMENT un JSON strict sous ce format (pas de markdown, pas de texte avant/après) :
{
  "events": [
    {
      "titre": "...",
      "description": "...",
      "date": "YYYY-MM-DD",
      "heure": "HH:MM",
      "ville": "...",
      "lieu": "...",
      "billets": [{ "nom": "Standard", "prix": 5000, "places": 200 }],
      "featured": false
    }
  ]
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || '';
  try {
    const parsed = JSON.parse(raw);
    return (parsed.events || []).map(ev => ({
      ...ev,
      categorie: info.cat,
      image: categoryEmoji(categoryKey),
      statut: 'actif',
      createur: 'ABAWI-BOT',
      cover_url: '',
    }));
  } catch (e) {
    console.error('[event-bot] parse error:', e, 'raw:', raw.slice(0, 500));
    return [];
  }
}

function categoryEmoji(key) {
  const map = { 'Religion': '⛪', 'Conférence': '🎤', 'Impact': '🌍', 'Entrepreneuriat': '🚀', 'Business': '💼', 'Economie': '📈' };
  return map[key] || '📅';
}

async function insertEvents(supabase, events) {
  let created = 0;
  let failed = 0;
  for (const ev of events) {
    const billets = ev.billets || [];
    const { id: _, billets: __, ...eventPayload } = ev;
    const { data: inserted, error } = await supabase
      .from('senticket_events')
      .insert(eventPayload)
      .select()
      .single();

    if (error) {
      console.error('[event-bot] insert error:', error);
      failed++;
      continue;
    }

    if (billets.length > 0) {
      await supabase.from('senticket_tickets').insert(
        billets.map(b => ({ event_id: inserted.id, nom: b.nom, prix: b.prix, places: b.places, vendus: 0 }))
      );
    }
    created++;
  }
  return { created, failed };
}

exports.handler = async function(event) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let categories = ['Religion', 'Conférence', 'Impact', 'Entrepreneuriat', 'Business', 'Economie'];
  let countPerCat = 2;
  let runType = 'scheduled';

  if (event.httpMethod === 'POST' && event.body) {
    try {
      const body = JSON.parse(event.body);
      if (body.categories) categories = body.categories;
      if (body.count) countPerCat = Math.min(parseInt(body.count, 10) || 2, 5);
      runType = 'manual';
    } catch {}
  }

  const allEvents = [];
  for (const cat of categories) {
    if (!CATEGORY_MAP[cat]) continue;
    const generated = await groqGenerateEvents(cat, countPerCat);
    allEvents.push(...generated);
  }

  const { created, failed } = await insertEvents(supabase, allEvents);

  await supabase.from('senticket_bot_logs').insert({
    run_type: runType,
    categories,
    events_created: created,
    events_failed: failed,
    details: { totalGenerated: allEvents.length },
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, created, failed, total: allEvents.length, categories }),
  };
};
