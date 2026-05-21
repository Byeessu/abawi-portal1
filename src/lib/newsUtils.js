import { TAG_COLORS, TAG_EMOJI } from '../data/news';
import { cleanIAText } from './cleanText';

export function tagStyle(tag) {
  return TAG_COLORS[tag] || { bg: '#6366F1', text: '#fff' };
}

function escapeXml(value) {
  if (!value) return '';
  return String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F\uFFFD\u200B-\u200D\uFEFF\u2060-\u206F]/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '')
    .replace(/[\u2800-\u28FF]/g, '')
    .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
    .replace(/[\u202A-\u202E\u0600-\u0605\u06DD\u070F\u200E\u200F]/g, '')
    .replace(/[\u2028\u2029\u0085]/g, ' ')
    .replace(/[\uFFF0-\uFFFB]/g, '')
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/[\s\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]+/g, ' ')
    .trim();
}

export function makeIllustration(article) {
  if (article?.cover_url) return article.cover_url;
  const ts = tagStyle(article?.tag);
  const emoji = TAG_EMOJI[article?.tag] || '📰';
  const title = String(article?.ti || 'ABAWI NEWS').slice(0, 48);
  const lines = title.match(/.{1,42}/g) || [title];
  const PATTERNS = {
    finance: 'M0,350 Q300,280 600,350 T1200,350 L1200,700 L0,700Z',
    tech: 'M0,300 L400,200 L800,350 L1200,250 L1200,700 L0,700Z',
    business: 'M0,380 Q200,320 400,380 Q600,440 800,360 Q1000,280 1200,340 L1200,700 L0,700Z',
    default: 'M0,400 Q400,300 800,400 T1600,400 L1600,700 L0,700Z',
  };
  const SVG_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const tagLow = (article?.tag || '').toLowerCase();
  const wave = PATTERNS[tagLow] || PATTERNS.default;
  const y1 = 130 + (lines.length > 1 ? 0 : 20);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${ts.bg}"/>
        <stop offset="100%" stop-color="#070B0F"/>
      </linearGradient>
      <linearGradient id="wave" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.05)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <rect width="1200" height="700" fill="url(#bg)"/>
    <circle cx="980" cy="120" r="180" fill="${ts.bg}" opacity="0.18" filter="url(#blur)"/>
    <circle cx="100" cy="580" r="120" fill="${ts.bg}" opacity="0.12" filter="url(#blur)"/>
    <path d="${wave}" fill="url(#wave)"/>
    <rect x="70" y="60" width="6" height="60" rx="3" fill="rgba(255,255,255,0.8)"/>
    <text x="96" y="90" fill="rgba(255,255,255,0.6)" font-family="${SVG_FONT}" font-size="16" font-weight="700" letter-spacing="2">${escapeXml((article?.tag || 'ACTUALITE').toUpperCase())} ABAWI NEWS</text>
    <text x="96" y="116" fill="rgba(255,255,255,0.35)" font-family="${SVG_FONT}" font-size="13">${escapeXml(article?.dt || '')}</text>
    <text x="70" y="${y1}" fill="rgba(255,255,255,0.95)" font-family="${SVG_FONT}" font-size="48" font-weight="800">${escapeXml(lines[0] || '')}</text>
    ${lines[1] ? `<text x="70" y="${y1 + 58}" fill="rgba(255,255,255,0.90)" font-family="${SVG_FONT}" font-size="44" font-weight="700">${escapeXml(lines[1])}</text>` : ''}
    ${lines[2] ? `<text x="70" y="${y1 + 116}" fill="rgba(255,255,255,0.85)" font-family="${SVG_FONT}" font-size="40" font-weight="700">${escapeXml(lines[2])}</text>` : ''}
    <text x="70" y="615" fill="rgba(255,255,255,0.55)" font-family="${SVG_FONT}" font-size="18" font-weight="500">${emoji} ${escapeXml(article?.su?.slice(0, 70) || '')}</text>
    <rect x="0" y="650" width="1200" height="50" fill="rgba(7,11,15,0.65)"/>
    <text x="70" y="682" fill="rgba(255,255,255,0.7)" font-family="${SVG_FONT}" font-size="18" font-weight="700">ABAWI NEWS</text>
    <text x="240" y="682" fill="rgba(255,255,255,0.4)" font-family="${SVG_FONT}" font-size="16">Business Finance Tech Afrique</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const normalizeArticle = (a) => {
  let base = a;
  if (typeof a?.ti === 'string' && a.ti.trim().startsWith('{')) {
    try { const p = JSON.parse(a.ti); base = { ...a, ...p }; } catch { /* ignore */ }
  }

  const parseField = (val, field) => {
    if (!val) return '';
    let s = String(val).trim();
    for (let depth = 0; depth < 4; depth++) {
      if (!s.startsWith('{') && !s.startsWith('[')) break;
      try {
        const obj = JSON.parse(s);
        const next = obj[field] ?? obj.ti ?? obj.su ?? null;
        if (next == null) break;
        s = String(next).trim();
      } catch {
        break;
      }
    }
    return s;
  };

  const smartTruncate = (text, maxLen) => {
    if (!text || text.length <= maxLen) return text;
    const truncated = text.slice(0, maxLen);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLen * 0.8) return truncated.slice(0, lastSpace) + '...';
    return truncated + '...';
  };

  // Strip HTML tags from RSS content (Google News returns raw HTML in title/description)
  const stripHtml = (text) => {
    return text
      // Remove <font color=...>...</font> entirely — Google News uses this for source attribution
      .replace(/<font\b[^>]*>[\s\S]*?<\/font>/gi, '')
      // Extract link text: <a href=...>TEXT</a> → TEXT
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
      // Strip remaining tags (b, i, em, span, p, br, div, etc.)
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]{2,6};/gi, ' ')
      // Strip "• Source Name" attribution at end of string (Google News title pattern)
      .replace(/\s*•\s*[^•\n]{1,80}$/g, '')
      // Strip leading bullet/dash
      .replace(/^[•·\-–—]\s*/g, '')
  };

  const stripJsonArtifacts = (text) => {
    return text
      .replace(/\{"ti":"/g, '')
      .replace(/","su":"/g, ' ')
      .replace(/"\}/g, '')
      .replace(/\\[ti\\]/gi, '')
      .replace(/\\[su\\]/gi, '')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\/g, '');
  };

  const cleanTitle = stripJsonArtifacts(stripHtml(parseField(base?.ti, 'ti')))
    .replace(/[\u2800-\u28FF]/g, '')
    .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // eslint-disable-next-line no-useless-escape
    .replace(/["{}\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanSub = stripJsonArtifacts(stripHtml(parseField(base?.su, 'su')))
    .replace(/[\u2800-\u28FF]/g, '')
    .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // eslint-disable-next-line no-useless-escape
    .replace(/["{}\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    ...base,
    ti: smartTruncate(cleanIAText(cleanTitle), 90),
    su: smartTruncate(cleanIAText(cleanSub), 280),
  };
};
