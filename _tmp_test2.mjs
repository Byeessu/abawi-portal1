import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const reqs = [];
page.on('request', req => {
  const url = req.url();
  if (url.includes('chat/completions') || url.includes('groq-chat') || url.includes('generativelanguage')) {
    reqs.push({ url, method: req.method(), headers: req.headers() });
  }
});
page.on('response', async (res) => {
  const url = res.url();
  if (url.includes('chat/completions') || url.includes('groq-chat') || url.includes('generativelanguage')) {
    let body = '';
    try { body = (await res.text()).slice(0, 200); } catch {}
    console.log('RESP', res.status(), url.slice(0, 80), '→', body);
  }
});

await page.goto('https://abawi-portal.netlify.app/outils/abawi-ia?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Inspect getProviderInfo
const info = await page.evaluate(async () => {
  // Cherche le module groqClient via import dynamique du bundle
  const scripts = Array.from(document.scripts).map(s => s.src).filter(s => s && s.includes('groqClient'));
  if (!scripts.length) return { error: 'no groqClient script found' };
  try {
    const mod = await import(scripts[0]);
    const info = mod.getProviderInfo ? mod.getProviderInfo() : null;
    return { exports: Object.keys(mod), info: info ? { baseUrl: info.baseUrl, model: info.model, keyPrefix: (info.key || '').slice(0, 10) } : null };
  } catch (e) {
    return { error: e.message };
  }
});
console.log('Provider info:', JSON.stringify(info, null, 2));

// Test envoi message via UI
console.log('\n--- Tentative d\'envoi via UI ---');
const inputs = await page.$$('textarea, input[type="text"]');
console.log('Inputs trouvés:', inputs.length);
if (inputs.length) {
  await inputs[0].fill('Réponds OK');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(8000);
}

console.log('\nRequêtes capturées:', reqs.length);
reqs.forEach(r => {
  const auth = r.headers.authorization || '';
  console.log('-', r.method, r.url.slice(0, 80), 'auth:', auth.slice(0, 20));
});

await browser.close();
