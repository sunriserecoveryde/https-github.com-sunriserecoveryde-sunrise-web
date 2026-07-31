/**
 * capture-screenshots.js
 * Launches a headless Chromium, logs into the Sunrise OS demo app, navigates
 * to every major screen, and saves 1440×900 PNGs to "Product Review/".
 */

const puppeteer  = require('puppeteer');
const path       = require('path');
const fs         = require('fs');
const { execSync } = require('child_process');

// ── Output folder ─────────────────────────────────────────────────────────────
const OUT_DIR = path.join(__dirname, '..', 'Product Review');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── App URLs ──────────────────────────────────────────────────────────────────
// Use the direct Vite dev-server URL so that dynamic ES-module imports of
// source files (e.g. /app/src/data/permissionStore.ts) resolve correctly.
const VITE_PORT  = 22957;
const BASE_URL   = `http://localhost:${VITE_PORT}/app/`;
const STAFF_URL  = 'http://localhost:80/sunrise-staff/';

// ── Demo staff IDs ────────────────────────────────────────────────────────────
// s5  = Emily Stone   (CMO)            – broadest clinical + operational access
// s12 = Linda Vance   (billing_staff)  – RevenueCycle / InsuranceAuth / FinancialCounseling
// s15 = Alex Kim      (security_admin) – StaffAdmin
const STAFF = {
  cmo:       's5',
  billing:   's12',
  security:  's15',
};

const SESSION_KEY = 'sunrise_demo_session_v1';

// ── Screen definitions ────────────────────────────────────────────────────────
const SCREENS = [
  { num: '01', name: 'Login',                    special: 'login',           description: 'The Sunrise OS login screen. Staff select their profile from a searchable card grid — no passwords required in demo mode; production builds support SSO and PIN authentication.' },
  { num: '02', name: 'Dashboard',                hash: 'Dashboard',          staffId: STAFF.cmo,     description: 'The main clinical dashboard gives every shift leader an instant floor snapshot: active census, pending tasks, compliance alerts, outcome trend lines, and quick-action shortcuts across all modules.' },
  { num: '03', name: 'Command-Center',           hash: 'CommandCenter',      staffId: STAFF.cmo,     description: 'The Command Center is the executive real-time nerve centre. It aggregates census, revenue-per-bed, payer mix, staff-to-patient ratios, and compliance pulse into a single decision-support view for leadership.' },
  { num: '04', name: 'Admissions',               hash: 'Admissions',         staffId: STAFF.cmo,     description: 'The Admissions module manages the full intake workflow: pre-admission screening, referral source logging, LOC placement, consent capture, and handoff to clinical documentation — all in one guided flow.' },
  { num: '05', name: 'Patient-List',             hash: 'PatientList',        staffId: STAFF.cmo,     description: 'The Patient List is the primary roster view for the active census. Clinicians can search, filter by program or counselor, view acuity flags, and navigate directly into any patient\'s full clinical record.' },
  { num: '06', name: 'Patient-Profile',          hash: 'DemoPatientDetail',  staffId: STAFF.cmo,     description: 'The Patient Profile consolidates the complete clinical picture: demographics, LOC history, active diagnoses, treatment team, engagement scores, and quick-launch buttons for notes, assessments, and MAR review.' },
  { num: '07a', name: 'ASAM-Assessments',        hash: 'ASAMAssessments',    staffId: STAFF.cmo,     description: 'ASAM Assessments guides clinicians through the six dimensions of the ASAM Patient Placement Criteria, auto-calculates the recommended level of care, and stores the completed assessment in the patient\'s chart.' },
  { num: '07b', name: 'Biopsychosocial-Intake',  hash: 'BiopsychosocialAssessment', staffId: STAFF.cmo, description: 'The Biopsychosocial Intake screen captures the comprehensive intake assessment covering medical history, substance use, mental health, social determinants, trauma history, and legal involvement — required at admission.' },
  { num: '08', name: 'Treatment-Plans',          hash: 'TreatmentPlans',     staffId: STAFF.cmo,     description: 'Treatment Plans lets counselors build SMART-goal care plans mapped to DSM diagnoses, assign responsible staff, set review dates, and track goal progress over the episode of care.' },
  { num: '09', name: 'Progress-Notes',           hash: 'ProgressNotes',      staffId: STAFF.cmo,     description: 'Progress Notes supports BIRP, DAP, SOAP, and GIRP note formats with AI-assisted draft generation, co-sign routing, and full integration with the patient chart and billing engine.' },
  { num: '10', name: 'Group-Notes',              hash: 'GroupNotes',         staffId: STAFF.cmo,     description: 'Group Notes allows facilitators to document a single session for multiple attendees simultaneously, capturing individual participation ratings, interventions, and objectives addressed for each patient in the group.' },
  { num: '11a', name: 'Nursing-MAR',             hash: 'NursingMAR',         staffId: STAFF.cmo,     description: 'The Medication Administration Record (MAR) gives nurses a live, time-sorted view of all scheduled medications, PRN orders, and administered doses — with one-tap documentation and missed-dose escalation alerts.' },
  { num: '11b', name: 'Formulary-Management',    hash: 'FormularyManagement',staffId: STAFF.cmo,     description: 'Formulary Management maintains the facility\'s approved drug list, MAT protocols, and drug reference cards. Medical staff can add or retire items and set default dosing guidelines per level of care.' },
  { num: '12', name: 'Drug-Screens',             hash: 'UADrugTesting',      staffId: STAFF.cmo,     description: 'The UA / Drug Testing screen manages specimen collection scheduling, chain-of-custody logging, result entry, and result notification. Patterns are surfaced on the patient profile and Risk Dashboard automatically.' },
  { num: '13a', name: 'Appointment-Calendar',    hash: 'AppointmentCalendar',staffId: STAFF.cmo,     description: 'The Appointment Calendar is a full-facility scheduling surface: individual sessions, group times, telehealth links, and external appointments. Conflict detection and automated reminder messaging are built in.' },
  { num: '13b', name: 'Group-Schedule',          hash: 'GroupSchedule',      staffId: STAFF.cmo,     description: 'Group Schedule manages the recurring group therapy timetable — session type, facilitator, room, capacity limits, and real-time attendance. Links directly to the Group Notes workflow after each session.' },
  { num: '14a', name: 'Census-Bed-Board',        hash: 'CensusBedBoard',     staffId: STAFF.cmo,     description: 'Census & Bed Board gives a real-time map of every bed, patient assignment, LOC, acuity indicator, and estimated discharge date — the single source of truth for bed utilisation and shift planning.' },
  { num: '14b', name: 'Bed-Management',          hash: 'BedManagement',      staffId: STAFF.cmo,     description: 'Bed Management exposes the operational controls behind the census: room configuration, level-of-care assignments, maintenance holds, and transfer queuing — used by directors to optimise occupancy and throughput.' },
  { num: '15a', name: 'Revenue-Cycle',           hash: 'RevenueCycle',       staffId: STAFF.billing, description: 'Revenue Cycle provides end-to-end billing management: charge capture from clinical documentation, claims generation, payer-specific rule validation, remittance posting, and A/R ageing dashboards.' },
  { num: '15b', name: 'Financial-Counseling',    hash: 'FinancialCounseling',staffId: STAFF.billing, description: 'Financial Counseling helps staff work through patient responsibility estimates, sliding-scale eligibility, payment plans, and Medicaid/CHIP enrolment — reducing financial barriers before admission.' },
  { num: '16', name: 'Insurance-Auth',           hash: 'InsuranceAuthorization', staffId: STAFF.cmo, description: 'Insurance Authorization tracks concurrent review requests, prior-auth approvals, peer-to-peer submissions, denial management, and appeals — keeping authorisation status in sync with clinical stay length.' },
  { num: '17a', name: 'Clinical-Intelligence',   hash: 'ClinicalIntelligence',   staffId: STAFF.cmo, special: 'inject-perm', description: 'Clinical Intelligence surfaces predictive risk signals across the census: readmission probability, early-engagement alerts, COWS trajectory anomalies, and care-gap flags — generated nightly by the analytics engine.' },
  { num: '17b', name: 'Outcome-Tracking',        hash: 'OutcomeTracking',    staffId: STAFF.cmo,     description: 'Outcome Tracking aggregates post-discharge follow-up data, sobriety milestones, step-down adherence, and 30/60/90-day re-engagement rates into a longitudinal quality dashboard for clinical leadership.' },
  { num: '17c', name: 'Population-Analytics',    hash: 'PopulationAnalytics',staffId: STAFF.cmo,     description: 'Population Analytics provides macro-level insight across all patients and programmes: payer mix trends, LOS distribution, acuity heatmaps, and benchmarks against state and national SUD recovery outcomes.' },
  { num: '18a', name: 'AI-Assistant',            hash: 'AIAssistant',        staffId: STAFF.cmo, special: 'inject-perm', description: 'Sunrise AI (Human-in-the-Loop) is a clinical co-pilot that drafts progress notes, flags potential treatment plan gaps, suggests CPT codes, and surfaces relevant research — with staff always in final control.' },
  { num: '18b', name: 'DAP-Note-Workflow',       hash: 'DAPNoteWorkflow',    staffId: STAFF.cmo, special: 'inject-perm', description: 'The DAP Note Workflow is an AI-powered documentation assistant: the clinician records a session summary, the engine drafts a structured DAP note, and staff review and sign off before it enters the chart.' },
  { num: '19a', name: 'Staff-Administration',    hash: 'StaffAdmin',         staffId: STAFF.security, description: 'Staff Administration is the HIPAA Security Officer\'s control panel: managing user accounts, assigning roles, setting per-screen permission overrides, and maintaining a full audit trail of all access changes.' },
  { num: '19b', name: 'Staff-Scheduling',        hash: 'StaffScheduling',    staffId: STAFF.cmo,     description: 'Staff Scheduling manages shift rosters, PTO requests, credential-to-shift matching, and overtime alerts — ensuring every shift meets the minimum staffing ratios required by CARF and state licensure.' },
  { num: '19c', name: 'Workforce-Compliance',    hash: 'WorkforceCompliance',staffId: STAFF.cmo, special: 'inject-perm', description: 'Workforce Compliance tracks every credential, licence renewal, background check, and mandatory training expiry date against CARF, TJC, and state SUD-provider requirements — with automated re-certification reminders.' },
  { num: '20', name: 'Settings-Organization',    hash: 'Settings',           staffId: STAFF.cmo, special: 'settings-system',   description: 'The System Settings tab lets administrators configure organisation-wide preferences: data retention rules, audit log depth, system integrations (EHR, lab, pharmacy), and security policies applied across all facilities.' },
  { num: '21', name: 'Settings-Facility',        hash: 'Settings',           staffId: STAFF.cmo, special: 'settings-facility',  description: 'The Facility Settings tab configures per-site parameters: bed capacity by level of care, nursing unit layout, formulary defaults, shift definitions, and facility-specific compliance programme selections.' },
  { num: '22', name: 'Role-Explorer',            hash: 'RoleExplorer',       staffId: STAFF.cmo,     description: 'Role Explorer gives buyers and administrators a full matrix of every role\'s screen-level permissions (Full / Read-only / No access), making HIPAA minimum-necessary and role-design decisions transparent.' },
  { num: '23', name: 'Mobile-View',              special: 'mobile',                                   description: 'Sunrise Staff is the companion mobile app for on-the-floor clinicians and nurses: quick vitals entry, shift checklists, secure messaging, MAR review, and patient flags — optimised for phones and tablets.' },
  { num: '24', name: 'Notifications',            hash: 'Dashboard',          staffId: STAFF.cmo, special: 'notifications', description: 'The Notifications panel is a real-time alert hub accessible from any screen. It surfaces clinical alerts, co-sign requests, compliance deadlines, and secure messages — with priority triage and one-tap navigation.' },
  { num: '25a', name: 'Measurement-Based-Care',  hash: 'MeasurementBasedCare',staffId: STAFF.cmo, special: 'inject-perm', description: 'Measurement-Based Care delivers standardised outcome instruments (PHQ-9, GAD-7, AUDIT-C, DAST-10, PCL-5) on a structured cadence, auto-scoring results and plotting symptom trajectories over the episode of care.' },
  { num: '25b', name: 'Recovery-Engagement-Score', hash: 'RecoveryEngagementScore', staffId: STAFF.cmo, description: 'The Recovery Engagement Score is a proprietary composite metric derived from attendance adherence, medication compliance, group participation, and therapeutic task completion — updated daily per patient.' },
  { num: '25c', name: 'Withdrawal-Monitor',      hash: 'WithdrawalMonitor',  staffId: STAFF.cmo, special: 'inject-perm', description: 'Withdrawal Monitor tracks COWS and CIWA-Ar assessments on a configurable schedule, plots score trajectories, flags rapid deterioration, and escalates to the on-call prescriber when thresholds are breached.' },
];

// Screens not yet wired into any role — inject 'full' permission at runtime
const EXTRA_PERMS = [
  'ClinicalIntelligence',
  'AIAssistant',
  'WorkforceCompliance',
  'MeasurementBasedCare',
  'WithdrawalMonitor',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function setAuth(page, staffId) {
  await page.evaluate((key, id) => {
    localStorage.setItem(key, id);
  }, SESSION_KEY, staffId);
}

/**
 * Inject 'full' permission for screens that aren't wired into any standard
 * role yet. Works by using Vite's native ES module dynamic import so we can
 * call setScreenOverride() directly on the live module singleton.
 * Source files are served at /app/src/... from the Vite dev server.
 */
async function injectPermissions(page, staffId, screens) {
  const result = await page.evaluate(async (sId, screenList) => {
    try {
      const mod = await import('/app/src/data/permissionStore.ts');
      for (const screen of screenList) {
        mod.setScreenOverride(sId, screen, 'full');
      }
      return { ok: true, count: screenList.length };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, staffId, screens);
  if (!result.ok) {
    console.warn(`  [perm-inject] failed: ${result.error}`);
  } else {
    console.log(`  [perm-inject] granted ${result.count} extra screens for ${staffId}`);
  }
}

/**
 * Navigate using history.pushState + synthetic popstate event.
 * The React app's handlePop listener updates activeScreen when it
 * receives a popstate event whose state contains { screen, patientId }.
 */
async function navigateTo(page, hash) {
  await page.evaluate((h) => {
    const state = { screen: h, patientId: null };
    window.history.pushState(state, '', '#' + h);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, hash);
}

async function waitForContent(page) {
  await sleep(2000);
}

async function screenshot(page, filename) {
  const filepath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: filepath, type: 'png' });
  console.log(`  saved: ${filename}`);
  return filepath;
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const CHROMIUM_PATH = execSync('which chromium 2>/dev/null || echo ""')
    .toString().trim() || undefined;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Disable animations for crisper screenshots
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0ms !important;
      transition-duration: 0ms !important;
    }
  ` });

  // Track state to avoid unnecessary reloads
  let currentStaffId = null;
  let permInjected   = false;

  for (const screen of SCREENS) {
    const filename = `${screen.num}-${screen.name}.png`;
    console.log(`\n[${screen.num}] ${screen.name}`);

    // ── Mobile screenshot ───────────────────────────────────────────────────
    if (screen.special === 'mobile') {
      await page.setViewport({ width: 390, height: 844 });
      try {
        const resp = await page.goto(STAFF_URL, { waitUntil: 'networkidle2', timeout: 15000 });
        if (!resp || resp.status() >= 400) throw new Error(`HTTP ${resp?.status()}`);
      } catch (e) {
        console.warn('  [mobile] sunrise-staff unavailable, using grow-web mobile fallback');
        await page.goto('http://localhost:80/grow-web/', { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      }
      await waitForContent(page);
      await screenshot(page, filename);
      await page.setViewport({ width: 1440, height: 900 });
      // Reset state so next screen gets a fresh load
      currentStaffId = null;
      permInjected   = false;
      continue;
    }

    // ── Login screenshot (before auth) ──────────────────────────────────────
    if (screen.special === 'login') {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.evaluate((key) => localStorage.removeItem(key), SESSION_KEY);
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await waitForContent(page);
      await screenshot(page, filename);
      currentStaffId = null;
      permInjected   = false;
      continue;
    }

    // ── Switch user if needed ───────────────────────────────────────────────
    if (screen.staffId !== currentStaffId) {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await setAuth(page, screen.staffId);
      // Reload so React picks up the new session from localStorage
      await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
      currentStaffId = screen.staffId;
      permInjected   = false;
    }

    // ── Inject extra permissions once per session ───────────────────────────
    if (!permInjected) {
      await injectPermissions(page, currentStaffId, EXTRA_PERMS);
      permInjected = true;
    }

    // ── Navigate to the screen ──────────────────────────────────────────────
    await navigateTo(page, screen.hash);
    await waitForContent(page);

    // ── Special interactions ────────────────────────────────────────────────
    if (screen.special === 'notifications') {
      // Try to open the notification bell / drawer
      const clickedBell = await page.evaluate(() => {
        // The bell button is in the Topbar; look for a button with a bell icon or badge
        const allBtns = Array.from(document.querySelectorAll('button'));
        const bell = allBtns.find(b =>
          b.innerHTML.includes('Bell') ||
          b.innerHTML.includes('bell') ||
          b.getAttribute('aria-label')?.toLowerCase().includes('notification') ||
          b.title?.toLowerCase().includes('notification')
        );
        if (bell) { bell.click(); return true; }
        return false;
      });
      if (!clickedBell) console.warn('  [notifications] bell button not found, screenshotting as-is');
      await sleep(600);
    }

    if (screen.special === 'settings-facility') {
      // Click the Facility tab inside Settings (it's the default, but click explicitly)
      const clicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
        const tab  = tabs.find(t => (t.textContent || '').trim() === 'Facility');
        if (tab) { tab.click(); return true; }
        return false;
      });
      if (!clicked) console.warn('  [settings-facility] facility tab not found');
      await sleep(600);
    }

    if (screen.special === 'settings-system') {
      // Click the System tab inside Settings (organisation-wide config)
      const clicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
        const tab  = tabs.find(t => (t.textContent || '').trim() === 'System');
        if (tab) { tab.click(); return true; }
        return false;
      });
      if (!clicked) console.warn('  [settings-system] system tab not found');
      await sleep(600);
    }

    await screenshot(page, filename);
  }

  await browser.close();
  console.log('\n✅ All screenshots saved to:', OUT_DIR);
})().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
