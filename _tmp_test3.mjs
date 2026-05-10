import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const captures = [];
page.on('request', req => {
  const u = req.url();
  if (u.includes('chat/completions') || u.includes('groq-chat') || u.includes('generativelanguage')) {
    captures.push({ type: 'REQ', url: u.slice(0, 100), method: req.method(), auth: (req.headers().authorization || '').slice(0, 20) });
  }
});
page.on('response', async res => {
  const u = res.url();
  if (u.includes('chat/completions') || u.includes('groq-chat') || u.includes('generativelanguage')) {
    let body = '';
    try { body = (await res.text()).slice(0, 250); } catch {}
    captures.push({ type: 'RES', url: u.slice(0, 100), status: res.status(), body });
  }
});
page.on('console', m => {
  const t = m.text();
  if (t.includes('[AI') || t.includes('error') || t.includes('Error') || t.includes('HTTP_') || t.includes('inattendue')) {
    console.log('[CONSOLE]', t.slice(0, 250));
  }
});
page.on('pageerror', e => console.log('[PAGE_ERROR]', e.message));

await page.goto('https://abawi-portal.netlify.app/outils/abawi-ia?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// Cherche textarea du chat
const ta = await page.$('textarea, [contenteditable="true"]');
console.log('Textarea trouvé:', !!ta);
if (ta) {
  await ta.fill('Réponds juste OK');
  await page.waitForTimeout(300);
  // Trouve bouton submit ou tape Enter
  const btns = await page.$$('button');
  console.log('Boutons:', btns.length);
  // Tente Enter
  await ta.press('Enter');
  console.log('Enter envoyé, attente réponse...');
  await page.waitForTimeout(10000);
}

console.log('\n=== CAPTURES (' + captures.length + ') ===');
captures.forEach(c => console.log(JSON.stringify(c)));

await browser.close();
