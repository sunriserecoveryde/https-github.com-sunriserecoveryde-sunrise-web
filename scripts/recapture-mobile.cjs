/**
 * recapture-mobile.cjs — Re-captures screen 23 (Sunrise Staff mobile)
 * Loading directly from the Metro bundler port so bundle URLs resolve.
 */
const puppeteer    = require('puppeteer');
const path         = require('path');
const { execSync } = require('child_process');

const OUT_DIR   = path.join(__dirname, '..', 'Product Review');
const CHROMIUM  = execSync('which chromium 2>/dev/null || echo ""').toString().trim() || undefined;
const sleep     = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROMIUM,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Capture console errors for debugging
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0,120)); });

  // Load directly from the Metro dev server (bypasses proxy so bundle 404 is avoided)
  console.log('Loading Sunrise Staff from Metro port 20501...');
  await page.goto('http://localhost:20501', { waitUntil: 'networkidle0', timeout: 60000 });
  // Expo web with Hermes transform can be slow — give it generous render time
  await sleep(8000);

  const info = await page.evaluate(() => ({
    title: document.title,
    divCount: document.querySelectorAll('div').length,
    text: (document.body?.innerText || '').slice(0, 200),
  }));
  console.log('Page title:', info.title, '| divs:', info.divCount, '| text:', info.text.slice(0,80));
  if (errors.length) console.log('Console errors:', errors.slice(0,3).join(' | '));

  const file = path.join(OUT_DIR, '23-Mobile-View.png');
  await page.screenshot({ path: file, type: 'png' });
  console.log('Saved:', file);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
