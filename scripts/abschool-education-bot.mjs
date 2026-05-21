#!/usr/bin/env node
// =====================================================================
// Abschool Education News Bot
// Analyse chaque 6h, publie des news education Sénégal & Afrique
// Sources multiplies, connectable Grok / Llama / OpenAI
// =====================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.join(__dirname, '../public/data/abschool-news.json');
const LOG = msg => console.log(`[${new Date().toISOString()}] ${msg}`);

// ── Configuration ───────────────────────────────────────────────────
const SOURCES = [
  {
    name: 'Senego Éducation',
    url: 'https://senego.com/feed',
    parser: 'rss',
    category: 'general',
  },
  {
    name: 'Dakaractu Éducation',
    url: 'https://dakaractu.com/feed',
    parser: 'rss',
    category: 'general',
  },
  {
    name: 'Gouvernement Sénégal',
    url: 'https://www.gouv.sn/feed',
    parser: 'rss',
    category: 'politique',
  },
  {
    name: 'Campus-SN',
    url: 'https://campus-sn.com/feed',
    parser: 'rss',
    category: 'universite',
  },
  {
    name: 'AllAfrica Education',
    url: 'https://allafrica.com/education/feed',
    parser: 'rss',
    category: 'afrique',
  },
];

const KEYWORDS = [
  'éducation', 'école', 'université', 'enseignement', 'scolarité',
  'lycée', 'collège', 'primaire', 'maternelle', 'étudiant', 'professeur',
  'enseignant', 'directeur', 'bac', 'bfem', 'cfe', 'examen', 'concours',
  'bourse', 'formation', 'apprentissage', 'numerique', 'éducation nationale',
  'ministère', 'gratuité', 'scolaire', 'cantine', 'transport scolaire',
  'ucad', 'ugb', 'uasz', 'uvs', 'master', 'doctorat', 'licence',
  'afrique', 'cedeao', 'uema', 'unesco', 'african', 'education',
];

// ── AI Summarization (Grok / Llama / OpenAI) ────────────────────────
async function summarizeWithAI(title, content, sourceName) {
  const apiKey = process.env.GROK_API_KEY || process.env.OPENAI_API_KEY || process.env.LLAMA_API_KEY;
  const baseURL = process.env.AI_BASE_URL || 'https://api.x.ai/v1';
  const model = process.env.AI_MODEL || 'grok-2-latest';

  if (!apiKey) {
    LOG('⚠️  Aucune clé AI configurée. Retour titre brut.');
    return { title: `🎓 ${title}`, summary: content.slice(0, 200) + '...' };
  }

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Tu es un journaliste spécialisé en éducation au Sénégal et en Afrique. Résume les actualités en 1 phrase percutante, ajoute un emoji pertinent, et garde un ton professionnel. Réponds STRICTEMENT en JSON: {"title":"...", "summary":"...", "category":"examens|universite|numerique|politique|general|afrique"}`
          },
          {
            role: 'user',
            content: `Source: ${sourceName}\nTitre: ${title}\nContenu: ${content.slice(0, 1500)}`
          }
        ],
        temperature: 0.6,
        max_tokens: 200,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Try to extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || `🎓 ${title}`,
        summary: parsed.summary || content.slice(0, 200) + '...',
        category: parsed.category || 'general',
      };
    }
    return { title: `🎓 ${title}`, summary: content.slice(0, 200) + '...', category: 'general' };
  } catch (err) {
    LOG(`❌ Erreur AI: ${err.message}`);
    return { title: `🎓 ${title}`, summary: content.slice(0, 200) + '...', category: 'general' };
  }
}

// ── RSS Parser (simple XML → items) ─────────────────────────────────
async function fetchRSS(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'AbschoolBot/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();

    const items = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/gi;
    const itemsXml = xml.match(itemRegex) || [];

    for (const itemXml of itemsXml.slice(0, 5)) {
      const title = (itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.trim() || '';
      const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/i) || [])[1]?.trim() || '';
      const desc = (itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) || [])[1]?.trim() || '';
      const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1]?.trim() || '';
      if (title) items.push({ title, link, description: desc, pubDate });
    }
    return items;
  } catch (err) {
    LOG(`❌ RSS failed ${url}: ${err.message}`);
    return [];
  }
}

// ── Filter education-relevant items ────────────────────────────────
function isEducationRelevant(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return KEYWORDS.some(k => text.includes(k.toLowerCase()));
}

// ── Main Pipeline ─────────────────────────────────────────────────
async function run() {
  LOG('🚀 Démarrage Abschool Education Bot...');
  const allNews = [];

  for (const source of SOURCES) {
    LOG(`📡 Fetching ${source.name}...`);
    const items = await fetchRSS(source.url);
    const relevant = items.filter(isEducationRelevant);
    LOG(`   → ${relevant.length}/${items.length} articles pertinents`);

    for (const item of relevant.slice(0, 3)) {
      const enriched = await summarizeWithAI(item.title, item.description, source.name);
      allNews.push({
        id: `abs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: enriched.title,
        summary: enriched.summary,
        url: item.link,
        source: source.name,
        date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        category: enriched.category,
      });
      // Rate limit between AI calls
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = allNews.filter(n => {
    if (seen.has(n.url)) return false;
    seen.add(n.url);
    return true;
  });

  // Sort by date descending
  unique.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Keep last 50
  const final = unique.slice(0, 50);

  // Ensure output dir exists
  const outDir = path.dirname(OUT);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUT, JSON.stringify(final, null, 2), 'utf-8');
  LOG(`✅ ${final.length} articles sauvegardés dans ${OUT}`);
}

run().catch(err => {
  LOG(`💥 Erreur fatale: ${err.message}`);
  process.exit(1);
});
