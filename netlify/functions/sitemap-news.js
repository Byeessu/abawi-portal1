// Dynamic sitemap for news articles — fetches from Supabase at request time
// Called from sitemap index as /.netlify/functions/sitemap-news

const BASE = 'https://abawi.app'
const SUPABASE_URL  = process.env.VITE_SUPABASE_URL  || 'https://nqpfmnsecjhqxuvfkqhi.supabase.co'
const SUPABASE_KEY  = process.env.VITE_SUPABASE_ANON_KEY || ''

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Strips markdown/emoji from article title
function cleanTitle(t) {
  return String(t || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_`~#]/g, '')
    .replace(/^[\d\.\-\s]+/, '')
    .trim()
    .slice(0, 100)
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

exports.handler = async function() {
  const headers = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  }

  try {
    // Fetch published articles from Supabase
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=id,ti,su,created_at,updated_at,cover_url&pr=eq.true&order=created_at.desc&limit=500`,
      {
        headers: {
          apikey:        SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) throw new Error(`Supabase error: ${res.status}`)
    const articles = await res.json()

    const today = new Date().toISOString().split('T')[0]
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`

    for (const a of articles) {
      const title = cleanTitle(a.ti)
      if (!title) continue
      const slug     = slugify(title)
      const lastmod  = (a.updated_at || a.created_at || today).split('T')[0]
      const pubDate  = (a.created_at || today).split('T')[0]
      const desc     = String(a.su || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0, 200)
      const coverUrl = a.cover_url ? esc(a.cover_url) : ''

      xml += `
  <url>
    <loc>${BASE}/news/${esc(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
    <news:news>
      <news:publication>
        <news:name>ABAWI News</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${esc(title)}</news:title>
    </news:news>${coverUrl ? `
    <image:image>
      <image:loc>${coverUrl}</image:loc>
      <image:title>${esc(title)}</image:title>
    </image:image>` : ''}
  </url>`
    }

    xml += '\n</urlset>'

    return { statusCode: 200, headers, body: xml }
  } catch (err) {
    // Return empty valid sitemap on error — never block the sitemap index
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`
    return { statusCode: 200, headers, body: xml }
  }
}
