/**
 * Sunrise OS Product Review — PDF Generator v2 (pdfkit, PNG sources)
 */
const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');

const OUT_DIR  = path.join(process.cwd(), 'Product Review');
const PDF_PATH = path.join(OUT_DIR, 'Sunrise OS — Product Review.pdf');

// ── Screen catalogue ───────────────────────────────────────────────────────────
const SCREENS = [
  // ── Onboarding ──
  { file: '01-Login.png',                num: '01', label: 'Login',
    desc: 'Staff select their profile from the directory or expand the demo-credentials form to sign in with email and password. Session is protected and authorized-users-only, with secure-access indicators in the footer.' },

  // ── Overview ──
  { file: '02-Dashboard.png',            num: '02', label: 'Dashboard',
    desc: 'The clinical home screen for the CMO role. Shows active census (18/22, 81.8% occupancy), AMA risk alerts, pending co-sign requests, avg. LOS, discharges this week, program utilisation breakdown, and an AI Clinical Brief summarising today\'s critical action items.' },

  { file: '03-Command-Center.png',       num: '03', label: 'Command Center',
    desc: 'Executive alert hub surfacing open items across all priority tiers — Critical, High, Medium, Routine. Offers a shift overview, aggregate quality metrics, capacity forecast, and a timestamped critical-event log across all facilities.' },

  // ── Admissions / Intake ──
  { file: '04-Admissions.png',           num: '04', label: 'Admissions & Intake',
    desc: 'End-to-end referral pipeline: intake form, insurance verification, ASAM pre-screen, bed assignment, and LOC determination — all in a single Kanban. Shows real-time status for every referral from first call through admit.' },

  // ── Patient Management ──
  { file: '05-Patient-List.png',         num: '05', label: 'Patient Search',
    desc: 'Searchable, sortable roster across all 115+ active patients. Filterable by acuity, LOS, program, clinician, risk flags, and craving score. One click jumps to the full chart.' },

  { file: '06-Patient-Profile.png',      num: '06', label: 'Patient Profile',
    desc: 'Comprehensive chart: demographics, insurance, diagnoses, allergies, active medications, vitals, care team, ASAM dimension summary, recent notes, and all linked documents in a single scrollable view.' },

  // ── Clinical Documentation ──
  { file: '07a-ASAM-Assessments.png',    num: '07a', label: 'ASAM Assessments',
    desc: 'Structured ASAM criteria assessment across all 6 dimensions with colour-coded severity scores. Flags overdue reviews and high-risk dimensions, and generates placement recommendations for payer audits.' },

  { file: '07b-Biopsychosocial-Intake.png', num: '07b', label: 'Biopsychosocial Intake',
    desc: 'Full BPS intake assessment capturing presenting problem, mental health history, trauma, family system, social support, spiritual factors, and preliminary treatment goals — required at admission for licensure.' },

  { file: '08-Treatment-Plans.png',      num: '08', label: 'Treatment Plans',
    desc: 'Problem-based planning with goals, objectives, interventions, and target dates. AI-assisted goal builder, ASAM goal library, co-signature workflow, version history, and a compliance checklist aligned to CARF/JCAHO standards.' },

  { file: '09-Progress-Notes.png',       num: '09', label: 'Progress Notes',
    desc: 'Individual session documentation queue — 305 notes across all clinicians. Supports BIRP, DAP, SOAP, and GIRP formats with AI-assisted drafting, wet-signature capture, and a pending co-sign workflow.' },

  { file: '10-Group-Notes.png',          num: '10', label: 'Group Notes',
    desc: 'Write one group facilitation note, then generate individualised participation notes for every attending patient in a single workflow — with attendance tracking, group type, and curriculum mapping.' },

  // ── Nursing & Medical ──
  { file: '11a-Nursing-MAR.png',         num: '11a', label: 'Medication Administration Record',
    desc: 'Electronic MAR for nursing. Tracks scheduled, PRN, and stat medications with administration timestamps, refusal capture, two-nurse witness documentation for controlled substances, and inventory alerts.' },

  { file: '11b-Formulary-Management.png', num: '11b', label: 'Formulary Management',
    desc: 'Facility formulary editor: add or retire medications, set dosage defaults, manage substitution rules, and control which medications appear on prescriber order sets.' },

  { file: '12-Drug-Screens.png',         num: '12', label: 'UA / Drug Screens',
    desc: 'Urinalysis and drug screen management across 83 monitored patients. Tracks specimen collection, panel results, chain of custody, confirmatory testing, and pushes results directly to each patient\'s chart.' },

  // ── Scheduling ──
  { file: '13a-Appointment-Calendar.png', num: '13a', label: 'Appointment Calendar',
    desc: 'Multi-view clinical calendar for individual sessions, medical appointments, and group therapy. Colour-coded by type with conflict detection and a no-show tracker.' },

  { file: '13b-Group-Schedule.png',      num: '13b', label: 'Group Schedule',
    desc: 'Weekly group therapy schedule across all programmes. Drag-and-drop session creation, facilitator assignment, room booking, and real-time attendance counts per group.' },

  // ── Census & Beds ──
  { file: '14a-Census-Bed-Board.png',    num: '14a', label: 'Census & Bed Board',
    desc: 'Interactive bed board showing every room across all programmes. Colour-coded by occupancy, acuity, and CIWA/COWS protocol. Supports rapid patient placement, room transfer, and hold-bed workflows.' },

  { file: '14b-Bed-Management.png',      num: '14b', label: 'Bed Management',
    desc: 'Configuration view for the physical bed inventory — add or retire beds, set maintenance holds, adjust capacity by programme, and view occupancy forecasts for the next 7 days.' },

  // ── Billing & Revenue ──
  { file: '15a-Revenue-Cycle.png',       num: '15a', label: 'Revenue Cycle',
    desc: 'Billing dashboard with YTD revenue analytics, payer mix breakdown, claims status, denial management, accounts receivable aging, and alerts for authorisations expiring imminently.' },

  { file: '15b-Financial-Counseling.png', num: '15b', label: 'Financial Counseling',
    desc: 'Patient financial services: self-pay agreements, sliding scale calculations, payment plan setup, out-of-pocket estimates, and documentation of financial counselling sessions for compliance.' },

  { file: '16-Insurance-Auth.png',       num: '16', label: 'Insurance Authorization / UR',
    desc: 'Prior authorisation tracking and concurrent review management. Monitors expiry across active authorisations, flags those expiring within 7 days, and tracks the full appeal pipeline by payer.' },

  // ── Analytics ──
  { file: '17a-Clinical-Intelligence.png', num: '17a', label: 'Clinical Intelligence',
    desc: 'AI-powered clinical analytics: predictive risk scores, early-warning flags, population health trends, and insight cards surfacing patterns across the active caseload for clinical leadership review.' },

  { file: '17b-Outcome-Tracking.png',    num: '17b', label: 'Outcome Tracking',
    desc: 'Longitudinal outcomes dashboard measuring treatment effectiveness: discharge disposition, 30/60/90-day follow-up rates, sobriety milestones, re-admission rates, and programme comparison.' },

  { file: '17c-Population-Analytics.png', num: '17c', label: 'Population Analytics',
    desc: 'Census trends, programme performance, avg. LOS, recovery scores, craving index, and MAT utilisation across the entire active and historical patient population.' },

  // ── AI ──
  { file: '18a-AI-Assistant.png',        num: '18a', label: 'Sunrise AI — Clinical Copilot',
    desc: 'AI-assisted progress note drafting (SOAP/BIRP/DAP/GIRP), risk summaries, treatment plan goal generation, clinical Q&A, and a review queue — all under a mandatory Human-in-the-Loop policy requiring clinician approval before any AI output is saved.' },

  { file: '18b-DAP-Note-Workflow.png',   num: '18b', label: 'DAP Note Workflow',
    desc: 'Step-by-step AI note drafting in DAP format: patient context auto-loaded, clinician reviews and edits the generated Data/Assessment/Plan sections, then approves and applies a wet signature — logged for audit.' },

  // ── Staff & HR ──
  { file: '19a-Staff-Administration.png', num: '19a', label: 'Staff Administration',
    desc: 'Staff directory and access management for 26 active employees. Manage profiles, NPI/DEA/license numbers, credential expiry alerts, facility assignments, roles, and system-access permissions.' },

  { file: '19b-Staff-Scheduling.png',    num: '19b', label: 'Staff Scheduling',
    desc: 'Shift scheduling and staffing-ratio management. View weekly schedules by role, flag under-staffed shifts, manage time-off requests, and ensure COMAR-compliant supervision coverage across all programmes.' },

  { file: '19c-Workforce-Compliance.png', num: '19c', label: 'Workforce Compliance & Development',
    desc: 'Credentialing, background screening, onboarding, performance reviews, and offboarding in one dashboard. Shows audit score, active credential alerts, overdue performance reviews, and org-wide training compliance.' },

  // ── Settings ──
  { file: '20-Settings-Organization.png', num: '20', label: 'Organization Settings',
    desc: 'Organisation-level configuration: legal name, NPI, EIN, primary address, billing address, clinical defaults, notification preferences, and third-party integration connectors.' },

  { file: '21-Settings-Facility.png',    num: '21', label: 'Facility Settings',
    desc: 'Per-facility configuration including licence numbers, CARF/JCAHO accreditation status, programme types, staffing ratios, operating hours, and bed-capacity parameters.' },

  // ── Roles & Compliance ──
  { file: '22-Role-Explorer.png',        num: '22', label: 'Roles & Permissions',
    desc: 'Visual role-permission matrix mapping 17 roles × 55 screens. Compare full, read-only, and no-access levels side-by-side across every clinical, administrative, and leadership role in the system.' },

  // ── Mobile ──
  { file: '23-Mobile-View.png',          num: '23', label: 'Mobile / Responsive View',
    desc: 'Sunrise OS fully responsive at mobile viewport. Clinical staff access the dashboard, patient list, and documentation from any phone or tablet — no separate app required.' },

  // ── Notifications ──
  { file: '24-Notifications.png',        num: '24', label: 'Notifications & Alerts',
    desc: 'Unified notification centre surfacing clinical alerts, co-sign requests, authorisation expirations, credential warnings, and system messages — with read/unread tracking and priority badges.' },

  // ── Measurement & Clinical Tools ──
  { file: '25a-Measurement-Based-Care.png', num: '25a', label: 'Measurement-Based Care',
    desc: 'Outcome measure tracking for PHQ-9 (depression), GAD-7 (anxiety), and PCL-5 (PTSD). Flags patients at clinical thresholds, shows score trends, and schedules weekly re-administration per evidence-based protocol.' },

  { file: '25b-Recovery-Engagement-Score.png', num: '25b', label: 'Recovery Engagement Score',
    desc: 'Proprietary Recovery Engagement Score (RES) combining attendance, participation, goal progress, peer support, and aftercare planning into a single longitudinal metric per patient and programme.' },

  { file: '25c-Withdrawal-Monitor.png',  num: '25c', label: 'Withdrawal Monitor (CIWA / COWS)',
    desc: 'Structured CIWA-Ar and COWS withdrawal assessment tool for nursing. Tracks active protocols, graphs severity trends, surfaces escalation alerts, and triggers PRN medication thresholds at the bedside.' },
];

// ── PDF layout constants ───────────────────────────────────────────────────────
const W = 841.89;   // A4 landscape
const H = 595.28;
const MARGIN = 32;

const ORANGE  = '#F97316';
const NAVY    = '#0B1524';
const SLATE   = '#94A3B8';
const WHITE   = '#F8FAFC';
const DARK_BG = '#0F1E33';
const MID_BG  = '#111F35';

function drawBackground(doc, color) {
  doc.rect(0, 0, W, H).fill(color || NAVY);
}
function drawTopBar(doc) {
  doc.rect(0, 0, W, 5).fill(ORANGE);
}
function drawFooter(doc) {
  doc.fontSize(7.5).fillColor('#334155').font('Helvetica')
    .text('SunriseOS  ·  Confidential Product Evaluation  ·  Fictitious Data Only  ·  Not for Clinical Use',
          MARGIN, H - 16, { width: W - MARGIN * 2, align: 'center' });
}

// ── Build document ─────────────────────────────────────────────────────────────
const doc = new PDFDocument({ size: 'A4', layout: 'landscape', autoFirstPage: false, margin: 0 });
const stream = fs.createWriteStream(PDF_PATH);
doc.pipe(stream);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COVER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
doc.addPage();
drawBackground(doc);
drawTopBar(doc);

const cY = H * 0.27;
doc.fontSize(54).font('Helvetica-Bold').fillColor(ORANGE).text('SunriseOS', 0, cY, { align: 'center' });
doc.fontSize(15).font('Helvetica').fillColor(SLATE)
  .text('Behavioral Health EHR & Operating System', 0, cY + 64, { align: 'center' });

const divX = W / 2 - 28;
doc.rect(divX, cY + 96, 56, 3).fill(ORANGE);

doc.fontSize(28).font('Helvetica-Bold').fillColor(WHITE)
  .text('Screen-by-Screen Product Review', 0, cY + 112, { align: 'center' });
doc.fontSize(12.5).font('Helvetica').fillColor(SLATE)
  .text(`A visual walkthrough of all ${SCREENS.length} major modules — clinical documentation,\nbilling, AI-assisted charting, compliance, and analytics.`,
        0, cY + 152, { align: 'center', lineGap: 4 });

const bW = 230, bH = 26, bX = (W - bW) / 2, bY = cY + 210;
doc.roundedRect(bX, bY, bW, bH, 13).stroke(ORANGE);
doc.fontSize(10.5).font('Helvetica').fillColor(ORANGE)
  .text('PRODUCT EVALUATION PACKAGE', bX, bY + 7, { width: bW, align: 'center' });

doc.fontSize(10).fillColor('#475569')
  .text('Sunrise Recovery Center  ·  Rockville, MD  ·  Confidential Demo', 0, H - 52, { align: 'center' });
drawFooter(doc);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TOC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
doc.addPage();
drawBackground(doc);
drawTopBar(doc);

doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE).text('Table of Contents', MARGIN, 28);
doc.rect(MARGIN, 54, 56, 2).fill(ORANGE);

// 3 columns
const cols = 3;
const colW = (W - MARGIN * 2 - 20) / cols;
const rowH = 18;
const tocY = 66;
const half = Math.ceil(SCREENS.length / cols);

SCREENS.forEach((s, i) => {
  const col = Math.floor(i / half);
  const row = i - col * half;
  const x   = MARGIN + col * (colW + 10);
  const y   = tocY + row * rowH;

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(ORANGE).text(s.num, x, y, { width: 26 });
  doc.fontSize(8.5).font('Helvetica').fillColor('#CBD5E1').text(s.label, x + 28, y, { width: colW - 28, ellipsis: true });
  doc.rect(x, y + rowH - 2, colW, 0.4).fill('#1E3A5F');
});

drawFooter(doc);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SCREEN PAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let missing = 0;
for (const s of SCREENS) {
  const imgPath = path.join(OUT_DIR, s.file);
  if (!fs.existsSync(imgPath)) {
    console.warn('  ⚠ missing:', s.file);
    missing++;
    continue;
  }

  doc.addPage();
  drawBackground(doc);
  drawTopBar(doc);

  // Header bar
  doc.rect(0, 5, W, 38).fill(DARK_BG);

  // Number pill
  doc.roundedRect(MARGIN, 11, 30, 24, 4).fill(ORANGE);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(NAVY)
    .text(s.num, MARGIN, 17, { width: 30, align: 'center' });

  // Screen label
  doc.fontSize(15).font('Helvetica-Bold').fillColor(WHITE)
    .text(s.label, MARGIN + 38, 16, { width: W - MARGIN * 2 - 38 });

  // Screenshot area
  const imgY = 50;
  const descH = 46;
  const imgH  = H - imgY - descH - 14;
  const imgW  = W - MARGIN * 2;

  doc.rect(MARGIN, imgY, imgW, imgH).fill(MID_BG);

  try {
    doc.image(imgPath, MARGIN, imgY, {
      width: imgW, height: imgH,
      fit: [imgW, imgH],
      align: 'center', valign: 'center',
    });
  } catch (e) {
    console.warn('  ⚠ image error:', s.file, e.message);
  }

  // Description strip
  const descY = imgY + imgH + 5;
  doc.rect(MARGIN, descY, 3, descH - 8).fill(ORANGE);
  doc.fontSize(8.5).font('Helvetica').fillColor(SLATE)
    .text(s.desc, MARGIN + 10, descY + 2, { width: imgW - 12, lineGap: 2.5, height: descH - 8, ellipsis: true });

  drawFooter(doc);
}

doc.end();

stream.on('finish', () => {
  const mb = (fs.statSync(PDF_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`✅  PDF → ${PDF_PATH}  (${mb} MB)  |  ${SCREENS.length - missing}/${SCREENS.length} screens`);
});
stream.on('error', e => { console.error('PDF error:', e); process.exit(1); });
