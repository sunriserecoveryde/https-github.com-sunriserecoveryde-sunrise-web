/**
 * recapture-fixes.cjs — re-captures only the three problem screens:
 *   20-Settings-Organization (System tab)
 *   21-Settings-Facility     (Facility tab)
 *   23-Mobile-View           (Sunrise Staff)
 */

const puppeteer    = require('puppeteer');
const path         = require('path');
const fs           = require('fs');
const { execSync } = require('child_process');

const OUT_DIR     = path.join(__dirname, '..', 'Product Review');
const VITE_PORT   = 22957;
const BASE_URL    = `http://localhost:${VITE_PORT}/app/`;
const STAFF_URL   = 'http://localhost:80/sunrise-staff/';
const SESSION_KEY = 'sunrise_demo_session_v1';
const CMO_ID      = 's5';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const CHROMIUM_PATH = execSync('which chromium 2>/dev/null || echo ""').toString().trim() || undefined;

async function injectPermissions(page, staffId) {
  await page.evaluate(async (sId, screens) => {
    try {
      const mod = await import('/app/src/data/permissionStore.ts');
      for (const s of screens) mod.setScreenOverride(sId, s, 'full');
    } catch (e) { console.warn('perm-inject:', e.message); }
  }, staffId, ['ClinicalIntelligence','AIAssistant','WorkforceCompliance','MeasurementBasedCare','WithdrawalMonitor']);
}

async function navigateTo(page, hash) {
  await page.evaluate((h) => {
    const state = { screen: h, patientId: null };
    window.history.pushState(state, '', '#' + h);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, hash);
}

async function clickTab(page, label) {
  const ok = await page.evaluate((lbl) => {
    const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
    const tab  = tabs.find(t => (t.textContent || '').trim() === lbl);
    if (tab) { tab.click(); return true; }
    return false;
  }, label);
  if (!ok) console.warn(`  [tab] "${label}" not found`);
  await sleep(700);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--window-size=1440,900'],
  });

  // ── 20 + 21: Settings tabs ────────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }' });

    // Load app as CMO
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate((k, id) => localStorage.setItem(k, id), SESSION_KEY, CMO_ID);
    await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
    await injectPermissions(page, CMO_ID);

    // Navigate to Settings
    await navigateTo(page, 'Settings');
    await sleep(2000);

    // ── 20: System tab (org-level config) ───────────────────────────────────
    console.log('\n[20] Settings-Organization (System tab)');
    await clickTab(page, 'System');
    await sleep(800);
    const f20 = path.join(OUT_DIR, '20-Settings-Organization.png');
    await page.screenshot({ path: f20, type: 'png' });
    console.log('  saved: 20-Settings-Organization.png');

    // ── 21: Facility tab ─────────────────────────────────────────────────────
    console.log('\n[21] Settings-Facility (Facility tab)');
    await clickTab(page, 'Facility');
    await sleep(800);
    const f21 = path.join(OUT_DIR, '21-Settings-Facility.png');
    await page.screenshot({ path: f21, type: 'png' });
    console.log('  saved: 21-Settings-Facility.png');

    await page.close();
  }

  // ── 23: Sunrise Staff mobile ──────────────────────────────────────────────
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }' });

    console.log('\n[23] Mobile-View (Sunrise Staff)');
    const resp = await page.goto(STAFF_URL, { waitUntil: 'networkidle2', timeout: 25000 });
    const status = resp?.status() ?? 0;
    if (status >= 400) {
      console.warn(`  Sunrise Staff returned ${status} — page may be loading`);
    }
    await sleep(3000); // Extra wait for Expo web to hydrate
    const f23 = path.join(OUT_DIR, '23-Mobile-View.png');
    await page.screenshot({ path: f23, type: 'png' });
    console.log('  saved: 23-Mobile-View.png');
    await page.close();
  }

  await browser.close();
  console.log('\n✅ Fix screenshots saved.');
})().catch(err => { console.error(err); process.exit(1); });
