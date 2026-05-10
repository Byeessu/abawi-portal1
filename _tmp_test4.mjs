import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://abawi-portal.netlify.app/outils/abawi-ia?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

// Snapshot du DOM
const html = await page.content();
console.log('Title:', await page.title());
console.log('URL final:', page.url());
const inputs = await page.$$eval('input, textarea, button', els => els.map(e => ({
  tag: e.tagName,
  type: e.type || '',
  placeholder: e.placeholder || '',
  text: (e.innerText || '').slice(0, 40),
  classes: (e.className || '').slice(0, 60),
})));
console.log('Inputs/buttons:', JSON.stringify(inputs.slice(0, 20), null, 2));

await page.screenshot({ path: '/tmp/abawi_ia.png', fullPage: false });
console.log('Screenshot saved');
await browser.close();
