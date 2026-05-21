// Edge function: inject event-specific OG meta tags for SenTicket share URLs.
// Social crawlers (WhatsApp, Facebook, etc.) don't run JS — they read only the
// static HTML. Without this, all shared event links show ABAWI's generic meta.
//
// Supabase anon key is PUBLIC — already embedded in the frontend JS bundle.

const SUPABASE_URL = 'https://nqpfmnsecjhqxuvfkqhi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno';

export default async function handler(request, context) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get('event');
  if (!eventId) return context.next();

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || SUPABASE_URL;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_KEY;

  let event = null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/senticket_events?id=eq.${encodeURIComponent(eventId)}&select=id,titre,description,ville,lieu,date,heure,cover_url`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (res.ok) {
      const rows = await res.json();
      event = rows?.[0] ?? null;
    }
  } catch { /* Supabase unreachable — fall through */ }

  if (!event) return context.next();

  const response = await context.next();
  let html = await response.text();

  const titre = esc(event.titre || 'Événement SenTicket');
  const dateStr = event.date
    ? new Date(event.date + 'T00:00:00').toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const rawDesc = [dateStr, event.heure, event.ville, event.lieu, event.description]
    .filter(Boolean).join(' · ').slice(0, 200);
  const desc = esc(rawDesc || 'Réservez vos billets sur SenTicket.');
  const eventUrl = esc(`${url.origin}/outils/senticket?event=${eventId}`);

  const hasCover = !!(event.cover_url && event.cover_url.trim());
  let imageUrl;
  if (hasCover) {
    const rawCover = event.cover_url.startsWith('http')
      ? event.cover_url
      : `${url.origin}${event.cover_url}`;
    // Netlify Image CDN: resize to 1200×630 JPEG ≤ ~150KB (WhatsApp limit ~300KB)
    imageUrl = `${url.origin}/.netlify/images?url=${encodeURIComponent(rawCover)}&w=1200&h=630&fit=cover&q=80&fm=jpg`;
  } else {
    // Netlify Image CDN converts SVG → JPEG (WhatsApp/Facebook don't support SVG)
    imageUrl = `${url.origin}/.netlify/images?url=%2Fsenticket-og-banner.svg&w=1200&h=630&q=80&fm=jpg`;
  }
  const imageEsc = esc(imageUrl);

  // Replace title
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${titre} | SenTicket</title>`)
    .replace(/<meta property="og:site_name"[^>]*>/, `<meta property="og:site_name" content="SenTicket" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${titre}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${eventUrl}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${titre}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${desc}" />`)
    .replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${imageEsc}" />`);

  // Netlify Image CDN guarantees 1200×630 for both cases — declare dimensions
  html = html
    .replace(/<meta property="og:image"(?!:)[^>]*>/, `<meta property="og:image" content="${imageEsc}" /><meta property="og:image:secure_url" content="${imageEsc}" />`)
    .replace(/<meta property="og:image:width"[^>]*>/, `<meta property="og:image:width" content="1200" />`)
    .replace(/<meta property="og:image:height"[^>]*>/, `<meta property="og:image:height" content="630" />`);

  return new Response(html, {
    status: response.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache, no-store',
    },
  });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const config = { path: '/outils/senticket' };
