import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const captures = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('chat/completions') || u.includes('groq-chat') || u.includes('generativelanguage')) {
    captures.push({ type: 'REQ', url: u.slice(0, 110), method: req.method(), auth: (req.headers().authorization || '').slice(0, 18) });
  }
});
page.on('response', async res => {
  const u = res.url();
  if (u.includes('chat/completions') || u.includes('groq-chat') || u.includes('generativelanguage')) {
    let body = '';
    try { body = (await res.text()).slice(0, 300); } catch {}
    captures.push({ type: 'RES', url: u.slice(0, 110), status: res.status(), body });
  }
});
page.on('console', m => {
  const t = m.text();
  if (t.includes('[AI') || t.includes('HTTP_') || t.includes('inattendue') || (t.includes('error') && !t.includes('PayDunya'))) {
    console.log('[CONSOLE]', t.slice(0, 350));
  }
});

await page.goto('https://abawi-portal.netlify.app/outils/abawi-ia?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

// Ferme cookie banner si présent
try {
  await page.evaluate(() => {
    document.querySelectorAll('.cookie-banner, .cookie-backdrop').forEach(el => el.remove());
  });
} catch {}

// Clique sur "Recherche IA"
await page.click('button:has-text("Recherche IA")', { force: true });
await page.waitForTimeout(2500);

// Liste tous les éléments saisissables visibles
const inputs = await page.$$eval('input, textarea, [contenteditable]', els => 
  els.filter(e => e.offsetParent !== null).map((e, i) => ({
    i, tag: e.tagName, type: e.type || '', placeholder: e.placeholder || '', 
    classes: (e.className || '').slice(0, 50)
  }))
);
console.log('Inputs visibles après clic:', JSON.stringify(inputs, null, 2));

// Cherche le 1er input visible (placeholder "Posez" ou similaire)
const ta = await page.$('input[placeholder*="osez"], input[placeholder*="uestion"], textarea[placeholder*="osez"], textarea');
console.log('Input chat trouvé:', !!ta);
if (ta) {
  await ta.fill('Réponds juste OK');
  await page.waitForTimeout(300);
  await ta.press('Enter');
  console.log('Message envoyé, attente 12s...');
  await page.waitForTimeout(12000);
}

// Cherche le message d'erreur affiché
const errorText = await page.evaluate(() => {
  const all = document.body.innerText || '';
  const lines = all.split('\n').filter(l => l.includes('inattendue') || l.includes('Erreur') || l.includes('rate'));
  return lines.slice(0, 5);
});
console.log('Messages d\'erreur dans le DOM:', errorText);

console.log('\n=== CAPTURES (' + captures.length + ') ===');
captures.forEach(c => console.log(JSON.stringify(c)));

await browser.close();
