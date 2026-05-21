// Edge function: inject tool-specific OG meta for PlaceOuvrier, EspaceOuvrier, RecruteMoiSN.
// These tools use localStorage so the edge function can't fetch data from a DB.
// Instead, the share URL embeds key metadata as query params (n, m, e, v, t, img)
// that this function reads to build the OG tags.

const TOOLS = {
  '/outils/place-ouvrier': {
    siteName: 'Place Ouvrier',
    defaultTitle: 'Place Ouvrier — Trouvez un ouvrier qualifié au Sénégal',
    defaultDesc: 'Trouvez le bon ouvrier qualifié au Sénégal — maçon, électricien, plombier, menuisier et plus.',
    buildTitle: p => (p.get('n') && p.get('m')) ? `${p.get('m')} — ${p.get('n')}` : null,
    buildDesc: p => {
      const parts = [p.get('m'), p.get('v')].filter(Boolean);
      return parts.length ? `${parts.join(' · ')} · Place Ouvrier` : null;
    },
  },
  '/outils/espace-ouvrier': {
    siteName: 'Espace Ouvrier',
    defaultTitle: 'Espace Ouvrier — Professionnel qualifié au Sénégal',
    defaultDesc: 'Découvrez ce professionnel qualifié sur Espace Ouvrier.',
    buildTitle: p => (p.get('n') && p.get('m')) ? `${p.get('m')} — ${p.get('n')}` : null,
    buildDesc: p => {
      const parts = [p.get('m'), p.get('v')].filter(Boolean);
      return parts.length ? `${parts.join(' · ')} · Espace Ouvrier` : null;
    },
  },
  '/outils/recrute-moi-sn': {
    siteName: 'Recrute-moi SN',
    defaultTitle: "Recrute-moi SN — Offres d'emploi au Sénégal",
    defaultDesc: "Parcourez les offres d'emploi au Sénégal sur Recrute-moi SN.",
    buildTitle: p => {
      const titre = p.get('n');
      const entreprise = p.get('e');
      if (!titre) return null;
      return entreprise ? `${titre} chez ${entreprise}` : titre;
    },
    buildDesc: p => {
      const parts = [p.get('t'), p.get('v')].filter(Boolean);
      return parts.length ? `${parts.join(' · ')} · Recrute-moi SN` : null;
    },
  },
};

export default async function handler(request, context) {
  const url = new URL(request.url);
  const tool = TOOLS[url.pathname];
  if (!tool) return context.next();

  const params = url.searchParams;
  const response = await context.next();
  let html = await response.text();

  const rawTitle = tool.buildTitle(params) || tool.defaultTitle;
  const rawDesc = (tool.buildDesc(params) || tool.defaultDesc).slice(0, 200);
  // Use shared image if provided via ?img=, otherwise Netlify CDN converts the SVG banner to JPEG
  const rawImg = params.get('img')?.startsWith('https://')
    ? params.get('img')
    : `${url.origin}/.netlify/images?url=%2Fsenticket-og-banner.svg&w=1200&h=630&q=80&fm=jpg`;
  const rawUrl = `${url.origin}${url.pathname}${url.search}`;

  const titre = esc(rawTitle);
  const desc = esc(rawDesc);
  const image = esc(rawImg);
  const pageUrl = esc(rawUrl);
  const siteName = esc(tool.siteName);

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${titre}</title>`)
    .replace(/<meta property="og:site_name"[^>]*>/, `<meta property="og:site_name" content="${siteName}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${titre}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(/<meta property="og:image"(?!:)[^>]*>/, `<meta property="og:image" content="${image}" /><meta property="og:image:secure_url" content="${image}" />`)
    .replace(/<meta property="og:image:width"[^>]*>/, `<meta property="og:image:width" content="1200" />`)
    .replace(/<meta property="og:image:height"[^>]*>/, `<meta property="og:image:height" content="630" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${titre}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${desc}" />`)
    .replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`);

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

export const config = {
  path: ['/outils/place-ouvrier', '/outils/espace-ouvrier', '/outils/recrute-moi-sn'],
};
