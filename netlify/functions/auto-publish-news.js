/**
 * auto-publish-news.js
 * Scheduled every 3 hours — scrape RSS feeds, rewrite with Groq, publish to Supabase.
 * Remplace le bot client-side de NewsAdmin.jsx par une exécution serveur autonome.
 */

exports.config = { schedule: '0 */3 * * *' }

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_PER_RUN = 6 // articles max par exécution (Groq rate limit)

const RSS_SOURCES = [
  // Google News RSS — topics économie africaine
  { name: 'Google News · Économie Afrique',  url: 'https://news.google.com/rss/search?q=economie+afrique+subsaharienne&hl=fr&gl=SN&ceid=SN:fr', cat: 'eco' },
  { name: 'Google News · Sénégal Business',  url: 'https://news.google.com/rss/search?q=senegal+economie+entreprise&hl=fr&gl=SN&ceid=SN:fr',    cat: 'eco' },
  { name: 'Google News · BRVM Bourse',       url: 'https://news.google.com/rss/search?q=BRVM+bourse+afrique+ouest&hl=fr&gl=SN&ceid=SN:fr',        cat: 'eco' },
  { name: 'Google News · Finance Investis.', url: 'https://news.google.com/rss/search?q=investissement+financement+afrique&hl=fr&gl=SN&ceid=SN:fr', cat: 'eco' },
  { name: 'Google News · Pétrole Gaz',       url: 'https://news.google.com/rss/search?q=petrole+gaz+sangomar+senegal&hl=fr&gl=SN&ceid=SN:fr',      cat: 'mat' },
  { name: 'Google News · Tech Startup',      url: 'https://news.google.com/rss/search?q=tech+startup+fintech+afrique&hl=fr&gl=SN&ceid=SN:fr',       cat: 'tech' },
  { name: 'Google News · Géopolitique',      url: 'https://news.google.com/rss/search?q=geopolitique+afrique+cedeao&hl=fr&gl=SN&ceid=SN:fr',        cat: 'geo' },
  { name: 'Google News · IA Numérique',      url: 'https://news.google.com/rss/search?q=intelligence+artificielle+afrique+numerique&hl=fr&gl=SN&ceid=SN:fr', cat: 'ai' },
  // Médias directs
  { name: 'Financial Afrik',                 url: 'https://www.financialafrik.com/feed/',                                                             cat: 'eco' },
  { name: 'Agence Ecofin',                   url: 'https://www.agenceecofin.com/index.php?format=feed&type=rss',                                      cat: 'eco' },
  { name: 'Lejecos',                         url: 'https://www.lejecos.com/feed/',                                                                    cat: 'eco' },
]

// ── Supabase helpers ──────────────────────────────────────────────────────────

function sbEnv() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!url || !key) throw new Error('Supabase env missing')
  return { url, key }
}

function sbHead(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extra }
}

async function getKnownTitles(url, key) {
  const res = await fetch(`${url}/rest/v1/articles?select=ti&order=created_at.desc&limit=300`, {
    headers: sbHead(key),
  })
  if (!res.ok) return new Set()
  const data = await res.json()
  return new Set((data || []).map(a => a.ti?.substring(0, 40).toLowerCase()))
}

async function insertArticle(article, url, key) {
  const res = await fetch(`${url}/rest/v1/articles`, {
    method: 'POST',
    headers: sbHead(key, { Prefer: 'return=minimal' }),
    body: JSON.stringify(article),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Insert failed (${res.status}): ${err.slice(0, 120)}`)
  }
}

// ── RSS parsing ───────────────────────────────────────────────────────────────

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1] : ''
}

function stripHtml(raw) {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'ABAWI-NewsBot/3.0 (+https://abawi.app)', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()

    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let m
    while ((m = itemRegex.exec(xml)) !== null) {
      const block = m[1]
      const title = stripHtml(extractTag(block, 'title'))
      const desc  = stripHtml(extractTag(block, 'description'))
      const link  = stripHtml(extractTag(block, 'link') || extractTag(block, 'guid'))
      if (title && title.length > 10) items.push({ title, desc, link, source: source.name })
    }
    return items
  } catch {
    return []
  }
}

// ── Article classification (porté du bot client) ──────────────────────────────

const SEC_RULES = [
  { keys: ['dette','budget','deficit','fmi','banque mondiale','fiscal','tresor','eurobond','obligation','emprunt','inflation','pib','croissance'], sec: 'ma' },
  { keys: ['bceao','monetaire','taux directeur','liquidite','reserve'], sec: 'ma' },
  { keys: ['brvm','bourse','action','indice','capitalisation','dividende','marche financier'], sec: 'mk' },
  { keys: ['petrole','gaz','sangomar','yakaar','hydrocarbure','brent','barrel'], sec: 'se' },
  { keys: ['mine','or ','gold','kedougou','saraya','orpaillage'], sec: 'se' },
  { keys: ['agriculture','arachide','peche','elevage','riz ','fonio','karite','cacao'], sec: 'se' },
  { keys: ['energie','solaire','eolien','electri','renouvelable','senelec'], sec: 'se' },
  { keys: ['tech','startup','fintech','digital','numerique','innovation','plateforme'], sec: 'en' },
  { keys: ['telecom','orange','free ','starlink','5g','4g','mobile money','wave','fibre'], sec: 'en' },
  { keys: ['intelligence artificielle','ia ','chatgpt','openai','claude','llm'], sec: 'en' },
  { keys: ['automobile','voiture','vehicule','tesla','byd','electrique'], sec: 'en' },
  { keys: ['guerre','conflit','iran','israel','armee','missile','frappe','geopolitique'], sec: 'wo' },
  { keys: ['chine','usa','trump','europe','russie','onu','otan','cedeao','union africaine'], sec: 'wo' },
  { keys: ['export','import','commerce','douane','tarif','balance commerciale'], sec: 'ma' },
]

const SCENE_RULES = [
  { keys: ['dette','fmi','eurobond','emprunt','tresor','deficit'], sc: 'debt' },
  { keys: ['petrole','gaz','sangomar','brent','barrel'], sc: 'brvm' },
  { keys: ['brvm','bourse','action','indice'], sc: 'brvm' },
  { keys: ['chine','china','beijing','focac'], sc: 'china' },
  { keys: ['guerre','iran','israel','conflit','missile'], sc: 'war' },
  { keys: ['greve','paralysie','transport','arret'], sc: 'strike' },
  { keys: ['export','import','commerce','balance'], sc: 'exp' },
  { keys: ['tech','startup','digital','starlink','5g','ia ','intelligence artificielle'], sc: 'star' },
  { keys: ['europe','wallonie','france','espagne'], sc: 'wallonie' },
  { keys: ['or ','gold','mine','kedougou'], sc: 'label' },
  { keys: ['agriculture','arachide','karite','peche'], sc: 'label' },
  { keys: ['bceao','monetaire','taux directeur'], sc: 'bceao' },
]

function classify(ti, su) {
  const c = `${ti} ${su || ''}`.toLowerCase()
  const s = SEC_RULES.find(r => r.keys.some(k => c.includes(k)))?.sec || 'ma'
  const sc = SCENE_RULES.find(r => r.keys.some(k => c.includes(k)))?.sc || 'def'
  return { s, sc }
}

function guessTag(ti) {
  const t = ti.toLowerCase()
  if (t.includes('dette') || t.includes('fmi') || t.includes('deficit')) return 'DETTE & FINANCES'
  if (t.includes('brvm') || t.includes('bourse')) return 'BRVM & MARCHES'
  if (t.includes('petrole') || t.includes('gaz') || t.includes('brent')) return 'ENERGIE'
  if (t.includes('or ') || t.includes('gold') || t.includes('mine')) return 'OR & MINES'
  if (t.includes('banque') || t.includes('bceao')) return 'BANQUE & CREDIT'
  if (t.includes('export') || t.includes('import') || t.includes('commerce')) return 'COMMERCE'
  if (t.includes('chine') || t.includes('china')) return 'CHINE-AFRIQUE'
  if (t.includes('guerre') || t.includes('conflit') || t.includes('geopolitique')) return 'GEOPOLITIQUE'
  if (t.includes('telecom') || t.includes('5g') || t.includes('starlink')) return 'TELECOM'
  if (t.includes('ia ') || t.includes('intelligence artificielle') || t.includes('chatgpt')) return 'IA & TECH'
  if (t.includes('tech') || t.includes('startup') || t.includes('digital') || t.includes('fintech')) return 'TECH & STARTUP'
  if (t.includes('automobile') || t.includes('voiture') || t.includes('tesla')) return 'AUTOMOBILE'
  if (t.includes('phosphate') || t.includes('cacao') || t.includes('cafe')) return 'MATIERES PREMIERES'
  if (t.includes('agriculture') || t.includes('arachide') || t.includes('peche')) return 'AGRICULTURE'
  if (t.includes('faye') || t.includes('sonko') || t.includes('politique')) return 'POLITIQUE ECONOMIQUE'
  return 'ECONOMIE'
}

// ── Groq AI rewrite ───────────────────────────────────────────────────────────

async function rewriteWithGroq(item) {
  const key = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
  if (!key) return null

  const prompt = `Tu es rédacteur en chef d'ABAWI NEWS, portail business premium africain.
Réécris cet article en français professionnel adapté au contexte Afrique de l'Ouest.
Donne des chiffres concrets (FCFA/USD), l'impact pour le Sénégal et la sous-région.

Source: ${item.source}
Titre: ${item.title}
Contenu: ${item.desc?.substring(0, 800) || item.title}

Réponds UNIQUEMENT avec du JSON valide (pas de markdown, pas de \`\`\`):
{"ti":"Titre accrocheur max 85 chars","su":"Résumé 150-200 chars","tag":"UN_TAG","bd":[{"t":"p","v":"Paragraphe 80-120 mots"},{"t":"p","v":"Paragraphe contexte africain 80-120 mots"},{"t":"p","v":"Impact et perspectives 60-100 mots"}]}

Tags valides: ECONOMIE|DETTE & FINANCES|BRVM & MARCHES|ENERGIE|OR & MINES|BANQUE & CREDIT|COMMERCE|CHINE-AFRIQUE|GEOPOLITIQUE|TELECOM|IA & TECH|TECH & STARTUP|AUTOMOBILE|MATIERES PREMIERES|AGRICULTURE|POLITIQUE ECONOMIQUE`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 900,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const txt = data.choices?.[0]?.message?.content?.trim() || ''
    const clean = txt.replace(/^```json\s*/i, '').replace(/```\s*$/,'').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function frDate(d = new Date()) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function frTime(d = new Date()) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async function handler() {
  if (String(process.env.AUTO_NEWS_PAUSED || '').toLowerCase() === 'true') {
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'Auto-news paused.' }) }
  }

  let sbUrl, sbKey
  try {
    const env = sbEnv()
    sbUrl = env.url
    sbKey = env.key
  } catch (e) {
    console.error('[auto-news] Supabase env missing:', e.message)
    return { statusCode: 200, body: JSON.stringify({ processed: 0, error: e.message }) }
  }

  // 1. Charger les titres connus (anti-doublon)
  const knownTitles = await getKnownTitles(sbUrl, sbKey).catch(() => new Set())
  console.log(`[auto-news] Anti-doublon: ${knownTitles.size} titres connus`)

  // 2. Scraper toutes les sources RSS
  const allItems = []
  for (const src of RSS_SOURCES) {
    const items = await fetchRSS(src)
    console.log(`[auto-news] ${src.name}: ${items.length} articles`)
    allItems.push(...items)
    await new Promise(r => setTimeout(r, 300))
  }

  // 3. Dédupliquer
  const seen = new Set()
  const unique = allItems.filter(item => {
    const key = item.title.substring(0, 40).toLowerCase()
    if (seen.has(key) || knownTitles.has(key)) return false
    seen.add(key)
    return true
  })
  console.log(`[auto-news] ${allItems.length} bruts → ${unique.length} uniques`)

  if (unique.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'No new articles.' }) }
  }

  // 4. Traiter les N premiers
  const toProcess = unique.slice(0, MAX_PER_RUN)
  const results = []
  const now = new Date()

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i]
    if (i > 0) await new Promise(r => setTimeout(r, 2500)) // respect Groq rate limit

    let rewritten = await rewriteWithGroq(item).catch(() => null)

    // Fallback si l'IA échoue
    if (!rewritten) {
      const paras = (item.desc || item.title).split(/[.!?]\s+|\n\n/).filter(s => s.trim().length > 30)
      rewritten = {
        ti: item.title,
        su: (item.desc || item.title).substring(0, 200),
        tag: guessTag(item.title),
        bd: paras.length >= 2
          ? [{ t: 'p', v: paras.slice(0, 3).join('. ') + '.' }]
          : [{ t: 'p', v: item.desc || item.title }],
      }
    }

    const { s, sc } = classify(rewritten.ti || item.title, rewritten.su || '')
    const readMins = Math.max(3, Math.ceil((rewritten.bd?.length || 1) * 1.5)) + ' min'

    const article = {
      id: Date.now() + i + Math.floor(Math.random() * 9999),
      s,
      pr: true, // auto-publié
      tag: rewritten.tag || guessTag(item.title),
      dt: frDate(now),
      tm: frTime(now),
      rt: readMins,
      au: 'ABAWI NEWS',
      sc,
      ti: (rewritten.ti || item.title).substring(0, 200),
      su: (rewritten.su || item.desc || '').substring(0, 500),
      bd: JSON.stringify(rewritten.bd || [{ t: 'p', v: item.desc || item.title }]),
      created_at: now.toISOString(),
    }

    try {
      await insertArticle(article, sbUrl, sbKey)
      results.push({ status: 'ok', ti: article.ti.substring(0, 60) })
      console.log(`[auto-news] ✓ ${article.ti.substring(0, 60)}`)
    } catch (e) {
      results.push({ status: 'error', ti: item.title.substring(0, 60), error: e.message })
      console.error(`[auto-news] ✗ ${item.title.substring(0, 60)}: ${e.message}`)
    }
  }

  // 5. Log dans ai_jobs
  try {
    await fetch(`${sbUrl}/rest/v1/ai_jobs`, {
      method: 'POST',
      headers: sbHead(sbKey, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        tool: 'auto-publish-news',
        job_type: 'scheduled_scrape',
        payload: { results, processedAt: now.toISOString(), sourcesScanned: RSS_SOURCES.length },
        owner_email: 'system@abawi.app',
      }),
    })
  } catch { /* non-fatal */ }

  const ok = results.filter(r => r.status === 'ok').length
  const ko = results.filter(r => r.status === 'error').length
  console.log(`[auto-news] Terminé: ${ok} publiés, ${ko} erreurs`)

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: results.length, published: ok, errors: ko, results }),
  }
}
