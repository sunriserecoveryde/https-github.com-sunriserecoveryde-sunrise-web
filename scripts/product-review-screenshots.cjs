/**
 * Sunrise OS — Product Review Screenshot Script
 * Captures 25 high-resolution screens + generates PDF
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:22957/app/';
const OUT = path.join(process.cwd(), 'Product Review');
const W = 1440, H = 900;

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SCREENS = [
  // id, hash (null = login page), label, description
  { id: '01-Login',               hash: null,                     label: 'Login',                   desc: 'The Sunrise OS login screen where staff select their profile. Features a demo credentials flow for evaluators and a search bar to quickly find staff accounts.' },
  { id: '02-Dashboard',           hash: 'Dashboard',              label: 'Dashboard',               desc: 'The clinical home screen. Displays today\'s census, acuity alerts, upcoming appointments, recent activity, and key performance indicators for the facility.' },
  { id: '03-CommandCenter',       hash: 'CommandCenter',          label: 'Command Center',          desc: 'Executive command center providing a real-time operational overview across all facilities, including capacity, staffing, compliance alerts, and revenue status.' },
  { id: '04-CensusBedBoard',      hash: 'CensusBedBoard',         label: 'Bed Board / Census',      desc: 'Interactive bed board showing every room and bed at a glance. Color-coded by occupancy, acuity, and cleaning status. Supports drag-and-drop patient placement.' },
  { id: '05-PatientList',         hash: 'PatientList',            label: 'Patient Search',          desc: 'Searchable, filterable patient roster. Staff can sort by acuity, length of stay, clinician, program, or discharge status and jump directly to any chart.' },
  { id: '06-PatientDetail',       hash: 'DemoPatientDetail',      label: 'Patient Profile',         desc: 'Comprehensive patient chart: demographics, insurance, diagnoses, allergies, medications, vitals, care team, appointment history, and linked clinical documents.' },
  { id: '07-ASAMAssessments',     hash: 'ASAMAssessments',        label: 'ASAM Assessments',        desc: 'Structured ASAM criteria intake and level-of-care assessment tool. Scores all six dimensions and generates placement recommendations with audit-ready documentation.' },
  { id: '08-TreatmentPlans',      hash: 'TreatmentPlans',         label: 'Treatment Plans',         desc: 'Problem-based treatment planning with goals, objectives, interventions, and target dates. Supports co-signature workflows, version history, and plan reviews.' },
  { id: '09-ProgressNotes',       hash: 'ProgressNotes',          label: 'Progress Notes',          desc: 'Individual session documentation hub. Supports BIRP, DAP, SOAP, and GIRP formats with AI-assisted note generation, template library, and wet-signature capture.' },
  { id: '10-GroupNotes',          hash: 'GroupNotes',             label: 'Group Notes',             desc: 'Group therapy documentation allowing clinicians to write a single facilitation note and generate individualized participation notes for each patient in one workflow.' },
  { id: '11-NursingMAR',          hash: 'NursingMAR',             label: 'Medication Administration Record',  desc: 'Electronic MAR for nursing staff. Tracks scheduled, PRN, and stat medications with administration timestamps, refusal capture, and inventory alerts.' },
  { id: '12-UADrugTesting',       hash: 'UADrugTesting',          label: 'Drug Screens (UA)',       desc: 'Urine analysis and drug screen management. Logs specimen collection, panel results, chain-of-custody, confirmatory testing, and sends results directly to the patient chart.' },
  { id: '13-AppointmentCalendar', hash: 'AppointmentCalendar',    label: 'Appointment Calendar',    desc: 'Multi-view clinical calendar (day/week/month/provider) for scheduling individual sessions, medical appointments, and group therapy with conflict detection.' },
  { id: '14-Admissions',          hash: 'Admissions',             label: 'Admissions',              desc: 'End-to-end admissions pipeline: referral intake, insurance pre-authorization, bed assignment, consent forms, and financial counseling in a single workflow.' },
  { id: '15-RevenueCycle',        hash: 'RevenueCycle',           label: 'Billing & Revenue Cycle', desc: 'Billing dashboard showing claims status, denial management, accounts receivable aging, ERA posting, and revenue trend analytics by payer and service line.' },
  { id: '16-InsuranceAuthorization', hash: 'InsuranceAuthorization', label: 'Insurance Authorization / Claims', desc: 'Prior authorization tracking and claims management. Monitors authorization expiry dates, concurrent review submissions, and appeal status across all payers.' },
  { id: '17-PopulationAnalytics', hash: 'PopulationAnalytics',    label: 'Population Analytics',   desc: 'Outcomes and population health reporting. Tracks PHQ-9/GAD-7 trends, length-of-stay benchmarks, readmission rates, and program completion across the full census.' },
  { id: '18-AIAssistant',         hash: 'AIAssistant',            label: 'AI Clinical Assistant',   desc: 'Sunrise AI hub: conversational clinical assistant, AI-generated progress note drafting, risk stratification summaries, and smart documentation suggestions.' },
  { id: '19-StaffAdmin',          hash: 'StaffAdmin',             label: 'Staff Management',        desc: 'Staff directory and administration panel. Manage profiles, credentials, license expiry alerts, facility assignments, roles, and system-access permissions.' },
  { id: '20-Settings',            hash: 'Settings',               label: 'Organization Settings',   desc: 'Organization-level configuration: facility details, branding, notification preferences, EHR integrations, billing setup, and system-wide defaults.' },
  { id: '21-WorkforceCompliance', hash: 'WorkforceCompliance',    label: 'Compliance & Accreditation', desc: 'CARF, Joint Commission, and SAMHSA compliance tracker. Maps requirements to evidence, shows readiness scores, flags gaps, and exports audit packages.' },
  { id: '22-RoleExplorer',        hash: 'RoleExplorer',           label: 'Roles & Permissions',     desc: 'Visual role-permission matrix. Compare access levels across all clinical, administrative, and executive roles; customize overrides per staff member.' },
  { id: '23-MeasurementBasedCare',hash: 'MeasurementBasedCare',   label: 'Measurement-Based Care',  desc: 'Outcome measure administration and trending. Delivers PHQ-9, GAD-7, AUDIT-C, CSSRS, and PCL-5 to patients; graphs score trajectories over the episode of care.' },
  { id: '24-WithdrawalMonitor',   hash: 'WithdrawalMonitor',      label: 'Withdrawal Monitor (CIWA/COWS)', desc: 'Structured CIWA-Ar and COWS withdrawal assessment tool for nursing. Graphs severity scores over time with escalation alerts and PRN medication triggers.' },
  { id: '25-MobileView',          hash: 'Dashboard',              label: 'Mobile / Responsive View',desc: 'Sunrise OS fully responsive on mobile devices. Clinical staff can view the dashboard, patient lists, and documentation on any phone or tablet without a separate app.' },
];

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function dismissOverlays(page) {
  // Close any tour overlays, modals, or toasts
  try { await page.keyboard.press('Escape'); } catch(e) {}
  await wait(400);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── Login and get a context with session ──────────────────────────────────
  console.log('→ Logging in as demo_admin…');
  const loginCtx = await browser.newContext({ viewport: { width: W, height: H } });
  const loginPage = await loginCtx.newPage();
  await loginPage.goto(BASE, { waitUntil: 'networkidle' });
  await wait(1200);

  // Take login screenshot BEFORE signing in
  const loginScreenMeta = SCREENS.find(s => s.id === '01-Login');
  await loginPage.screenshot({ path: path.join(OUT, `${loginScreenMeta.id} — ${loginScreenMeta.label}.png`), fullPage: false });
  console.log('  ✓ 01-Login');

  // Click "Sign in with demo credentials" toggle
  await loginPage.click('button:has-text("Sign in with demo credentials")');
  await wait(600);
  // Fill email
  await loginPage.fill('input[type="email"]', 'demo@sunriseos.com');
  // Fill password
  await loginPage.fill('input[type="password"]', 'SunriseDemo2026!');
  await wait(300);
  // Submit
  await loginPage.click('button:has-text("Sign in to Demo")');
  await wait(2500);

  // ── Capture all remaining screens ─────────────────────────────────────────
  for (const screen of SCREENS.slice(1)) {
    try {
      const isMobile = screen.id === '25-MobileView';
      const vp = isMobile ? { width: 390, height: 844 } : { width: W, height: H };

      const ctx = isMobile
        ? await browser.newContext({
            viewport: vp,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          })
        : loginCtx;

      const pg = isMobile ? await ctx.newPage() : loginPage;

      if (isMobile) {
        // Re-login on fresh mobile context
        await pg.goto(BASE, { waitUntil: 'networkidle' });
        await wait(1000);
        await pg.click('button:has-text("Sign in with demo credentials")');
        await wait(500);
        await pg.fill('input[type="email"]', 'demo@sunriseos.com');
        await pg.fill('input[type="password"]', 'SunriseDemo2026!');
        await pg.click('button:has-text("Sign in to Demo")');
        await wait(2000);
      }

      // Navigate to hash screen
      await pg.goto(`${BASE}#${screen.hash}`, { waitUntil: 'networkidle' });
      await wait(1800);
      await dismissOverlays(pg);
      await wait(500);

      const fname = `${screen.id} — ${screen.label}.png`;
      await pg.screenshot({ path: path.join(OUT, fname), fullPage: false });
      console.log(`  ✓ ${screen.id} ${screen.label}`);

      if (isMobile) {
        await pg.close();
        await ctx.close();
      }
    } catch (err) {
      console.error(`  ✗ ${screen.id} ${screen.label}: ${err.message}`);
    }
  }

  await loginCtx.close();

  // ── Generate HTML → PDF ───────────────────────────────────────────────────
  console.log('\n→ Generating PDF…');
  const pdfCtx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const pdfPage = await pdfCtx.newPage();

  // Build HTML with cover page + one page per screen
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).sort();

  let slides = '';
  for (const screen of SCREENS) {
    const fname = `${screen.id} — ${screen.label}.png`;
    const fpath = path.join(OUT, fname);
    if (!fs.existsSync(fpath)) continue;
    const b64 = fs.readFileSync(fpath).toString('base64');
    slides += `
    <div class="page">
      <div class="screen-header">
        <span class="screen-num">${screen.id.split('-')[0]}</span>
        <h2>${screen.label}</h2>
      </div>
      <div class="screenshot-wrap">
        <img src="data:image/png;base64,${b64}" alt="${screen.label}" />
      </div>
      <p class="description">${screen.desc}</p>
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; background: #0B1524; color: #F8FAFC; }

  .cover {
    width: 100vw; height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0B1524 0%, #0F2140 50%, #0B1524 100%);
    page-break-after: always;
  }
  .cover-logo {
    font-size: 52px; font-weight: 700; letter-spacing: -1px;
    background: linear-gradient(90deg, #F97316, #FBBF24);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
  }
  .cover-sub {
    font-size: 20px; font-weight: 400; color: #94A3B8;
    margin-bottom: 48px; letter-spacing: 0.5px;
  }
  .cover-title {
    font-size: 36px; font-weight: 700; color: #F8FAFC;
    text-align: center; margin-bottom: 16px; max-width: 680px;
  }
  .cover-meta {
    font-size: 15px; color: #64748B; margin-top: 40px;
  }
  .cover-badge {
    display: inline-block; padding: 8px 20px;
    border: 1px solid rgba(249,115,22,0.35);
    border-radius: 999px; font-size: 13px; color: #F97316;
    letter-spacing: 0.5px; margin-bottom: 16px;
  }
  .divider {
    width: 64px; height: 3px;
    background: linear-gradient(90deg, #F97316, #FBBF24);
    border-radius: 2px; margin: 20px auto;
  }

  .toc-page {
    padding: 64px 72px;
    page-break-after: always;
    min-height: 100vh;
  }
  .toc-title { font-size: 28px; font-weight: 700; color: #F8FAFC; margin-bottom: 32px; }
  .toc-item {
    display: flex; align-items: baseline; gap: 12px;
    padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .toc-num { font-size: 13px; color: #F97316; font-weight: 600; min-width: 28px; }
  .toc-name { font-size: 15px; color: #CBD5E1; flex: 1; }
  .toc-dots { flex: 1; border-bottom: 1px dotted rgba(255,255,255,0.15); margin: 0 8px; align-self: flex-end; padding-bottom: 4px; }

  .page {
    padding: 48px 56px 40px;
    page-break-after: always;
    min-height: 100vh;
    display: flex; flex-direction: column;
    background: #0B1524;
  }
  .screen-header {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 24px; flex-shrink: 0;
  }
  .screen-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 8px;
    background: linear-gradient(135deg, #F97316, #FBBF24);
    font-size: 13px; font-weight: 700; color: #0B1524;
  }
  .screen-header h2 { font-size: 22px; font-weight: 700; color: #F8FAFC; }
  .screenshot-wrap {
    flex: 1; display: flex; align-items: center; justify-content: center;
    background: #0F1E33; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 20px;
  }
  .screenshot-wrap img {
    width: 100%; height: auto; display: block;
    max-height: 560px; object-fit: contain;
  }
  .description {
    font-size: 14px; line-height: 1.7; color: #94A3B8;
    border-left: 3px solid #F97316; padding-left: 16px;
    flex-shrink: 0;
  }
  .footer {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 56px;
    font-size: 11px; color: #334155;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: #0B1524;
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-badge">PRODUCT EVALUATION PACKAGE</div>
  <div class="cover-logo">SunriseOS</div>
  <div class="cover-sub">Behavioral Health EHR &amp; Operating System</div>
  <div class="divider"></div>
  <div class="cover-title">Screen-by-Screen Product Review</div>
  <p style="color:#64748B;font-size:15px;text-align:center;max-width:520px;line-height:1.7;margin-top:16px;">
    A complete visual walkthrough of all major modules—from clinical documentation
    and billing to AI-assisted charting and compliance management.
  </p>
  <div class="cover-meta">Sunrise Recovery Center · Rockville, MD (HQ) · Confidential Demo</div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc-page">
  <div class="toc-title">Table of Contents</div>
  ${SCREENS.map(s => `
  <div class="toc-item">
    <span class="toc-num">${s.id.split('-')[0]}</span>
    <span class="toc-name">${s.label}</span>
    <span class="toc-dots"></span>
  </div>`).join('')}
</div>

${slides}

<div class="footer">
  <span>SunriseOS — Confidential Product Evaluation · Demo Account Only</span>
  <span>Fictitious Data · Not for Clinical Use</span>
</div>

</body>
</html>`;

  await pdfPage.setContent(html, { waitUntil: 'networkidle' });
  await wait(2000);

  const pdfPath = path.join(OUT, 'Sunrise OS — Product Review.pdf');
  await pdfPage.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });
  console.log('  ✓ PDF saved:', pdfPath);

  await pdfCtx.close();
  await browser.close();

  // Summary
  const pngs = fs.readdirSync(OUT).filter(f => f.endsWith('.png'));
  console.log(`\n✅ Done — ${pngs.length} screenshots + PDF in "${OUT}"`);
  pngs.sort().forEach(f => console.log('  ', f));
})();
