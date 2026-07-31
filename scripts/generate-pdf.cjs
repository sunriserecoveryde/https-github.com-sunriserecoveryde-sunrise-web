/**
 * Sunrise OS Product Review — PDF Generator (pdfkit, no browser needed)
 */
const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'Product Review');
const PDF_PATH = path.join(OUT_DIR, 'Sunrise OS — Product Review.pdf');

// ── Screen metadata ────────────────────────────────────────────────────────────
const SCREENS = [
  { file: '01-Login — Login.jpg',                            num: '01', label: 'Login',                              desc: 'The Sunrise OS login screen where staff select their profile. Features a demo credentials flow (email + password) for evaluators and a search bar to quickly locate any staff account.' },
  { file: '02-Dashboard — Dashboard.jpg',                    num: '02', label: 'Dashboard',                          desc: 'The clinical home screen. Displays today\'s census, acuity alerts, pending co-sign requests, upcoming appointments, and key performance metrics for the current facility and shift.' },
  { file: '03-CommandCenter — Command Center.jpg',           num: '03', label: 'Command Center',                     desc: 'Executive operational hub providing a real-time Kanban of open alerts by priority (Critical → Routine), shift overview, quality metrics, capacity forecast, and critical-event log across all facilities.' },
  { file: '04-CensusBedBoard — Bed Board Census.jpg',        num: '04', label: 'Census & Bed Board',                 desc: 'Interactive bed board showing every room and bed across all programs. Color-coded by occupancy status, acuity, and CIWA/COWS protocol. Supports rapid patient placement and transfer workflows.' },
  { file: '05-PatientList — Patient Search.jpg',             num: '05', label: 'Patient Search',                     desc: 'Searchable, filterable patient roster with 115 active patients. Sortable by acuity, length of stay, program, clinician, craving score, and risk flags. One click jumps to any full chart.' },
  { file: '06-PatientDetail — Patient Profile.jpg',          num: '06', label: 'Patient Profile',                    desc: 'Comprehensive patient chart: demographics, insurance, diagnoses, allergies, medications, vitals, care team, ASAM dimensions summary, recent clinical notes, and linked documents — all in one view.' },
  { file: '07-ASAMAssessments — ASAM Assessments.jpg',       num: '07', label: 'ASAM Assessments',                   desc: 'Structured ASAM criteria assessment tool covering all 6 dimensions with colour-coded severity scores. Shows overdue reviews, high-risk flags, and generates placement recommendations for audit documentation.' },
  { file: '08-TreatmentPlans — Treatment Plans.jpg',         num: '08', label: 'Treatment Plans',                    desc: 'Problem-based treatment planning with goals, objectives, interventions, and target dates. AI-assisted goal builder, ASAM goal library, co-signature workflow, version history, and compliance checklist.' },
  { file: '09-ProgressNotes — Progress Notes.jpg',           num: '09', label: 'Progress Notes',                     desc: 'Individual session documentation queue — 305 total notes across all clinicians. Supports BIRP, DAP, SOAP, and GIRP formats with AI-assisted note drafting, template library, and wet-signature capture.' },
  { file: '10-GroupNotes — Group Notes.jpg',                 num: '10', label: 'Group Notes',                        desc: 'Group therapy session documentation. Write one facilitation note, then generate individualised participation notes for each attending patient in one workflow — with attendance tracking and curriculum mapping.' },
  { file: '11-NursingMAR — Medication Administration.jpg',   num: '11', label: 'Medication Administration Record',   desc: 'Electronic MAR for nursing staff. Tracks scheduled, PRN, and stat medications with administration timestamps, refusal capture, two-nurse witness documentation for controlled substances, and inventory alerts.' },
  { file: '12-UADrugTesting — Drug Screens.jpg',             num: '12', label: 'UA / Drug Screens',                  desc: 'Urinalysis and drug screen management across 83 monitored patients. Tracks specimen collection, panel results, chain of custody, confirmatory testing, and pushes results directly to each patient\'s chart.' },
  { file: '13-AppointmentCalendar — Appointment Calendar.jpg', num: '13', label: 'Appointment Calendar',             desc: 'Multi-view clinical calendar (week shown) for scheduling individual sessions, medical appointments, and group therapy. Colour-coded by appointment type with conflict detection and a No-Show Tracker.' },
  { file: '14-Admissions — Admissions.jpg',                  num: '14', label: 'Admissions / Intake',                desc: 'End-to-end admissions pipeline: referral intake, insurance verification, ASAM pre-screen, bed assignment, and LOC criteria — all in one Kanban view. Shows real-time pipeline status for each referral.' },
  { file: '15-RevenueCycle — Billing Revenue Cycle.jpg',     num: '15', label: 'Billing & Revenue Cycle',            desc: 'Billing dashboard with YTD revenue analytics, payer mix breakdown, claims status, denial management, accounts receivable aging, and an alert for 5 authorisations expiring imminently.' },
  { file: '16-InsuranceAuth — Insurance Authorization Claims.jpg', num: '16', label: 'Insurance Authorization / UR', desc: 'Prior authorisation tracking and concurrent review management. Monitors expiry dates across 11 active authorisations, shows 8 expiring within 7 days, and tracks the full appeal pipeline by payer.' },
  { file: '17-PopulationAnalytics — Population Analytics.jpg', num: '17', label: 'Population Analytics',            desc: 'Census trends, clinical outcomes, and programme performance metrics. 30-day census by programme, occupancy by level of care, avg. length-of-stay, recovery scores, craving index, and MAT utilisation.' },
  { file: '18-AIAssistant — AI Clinical Assistant.jpg',      num: '18', label: 'Sunrise AI — Clinical Copilot',      desc: 'Sunrise AI hub: AI-assisted progress note drafting (SOAP/BIRP/DAP/GIRP), risk stratification summaries, treatment plan goal generation, clinical Q&A, and a review queue — all under Human-in-the-Loop policy.' },
  { file: '19-StaffAdmin — Staff Management.jpg',            num: '19', label: 'Staff Management',                   desc: 'Staff directory and administration panel for 26 active employees. Manage profiles, NPI/DEA/license numbers, credential expiry alerts, facility assignments, roles, and system-access permissions.' },
  { file: '20-Settings — Organization Settings.jpg',         num: '20', label: 'Organization & Facility Settings',   desc: 'Organisation-level configuration: facility details (name, NPI, EIN, address), clinical defaults, users & roles, notification preferences, system toggles, and third-party integration connectors.' },
  { file: '21-WorkforceCompliance — Compliance Accreditation.jpg', num: '21', label: 'Workforce Compliance & Development', desc: 'Credentialing, background screening, onboarding, performance reviews, and offboarding — all in one dashboard. Shows 70% audit score, 3 credential alerts expiring, and 84% org-wide training compliance.' },
  { file: '22-RoleExplorer — Roles and Permissions.jpg',     num: '22', label: 'Roles & Permissions',                desc: 'Visual role-permission matrix mapping 17 roles × 55 screens. Compare access levels side-by-side, drill into each role\'s full vs. read-only vs. no-access breakdown, and inspect the Access Summary tab.' },
  { file: '23-MeasurementBasedCare — Measurement-Based Care.jpg', num: '23', label: 'Measurement-Based Care',        desc: 'Outcome measure tracking for PHQ-9 (depression), GAD-7 (anxiety), and PCL-5 (PTSD). Flags patients at clinical thresholds, shows score trends over time, and schedules weekly re-administration.' },
  { file: '24-WithdrawalMonitor — Withdrawal Monitor.jpg',   num: '24', label: 'Withdrawal Monitor (CIWA / COWS)',   desc: 'Structured CIWA-Ar and COWS withdrawal assessment tool for nursing. Tracks 7 active protocols, graphs severity trends, surfaces escalation alerts, and triggers PRN medication thresholds at the bedside.' },
  { file: '25-MobileView — Mobile Responsive View.jpg',      num: '25', label: 'Mobile / Responsive View',           desc: 'Sunrise OS fully responsive at 390 × 844 (iPhone 15 viewport). Clinical staff access the dashboard, patient list, and documentation on any phone or tablet — no separate app required.' },
];

// ── PDF layout constants ───────────────────────────────────────────────────────
const W = 841.89;   // A4 landscape width  (pt)
const H = 595.28;   // A4 landscape height (pt)
const MARGIN = 36;

const ORANGE  = '#F97316';
const NAVY    = '#0B1524';
const SLATE   = '#94A3B8';
const WHITE   = '#F8FAFC';
const DARK_BG = '#0F1E33';

function drawBackground(doc, color = NAVY) {
  doc.rect(0, 0, W, H).fill(color);
}

function drawFooter(doc, text = 'SunriseOS · Confidential Product Evaluation · Fictitious Data Only · Not for Clinical Use') {
  doc.fontSize(8).fillColor('#334155').font('Helvetica').text(text, MARGIN, H - 20, { width: W - MARGIN * 2, align: 'center' });
}

// ── Build PDF ──────────────────────────────────────────────────────────────────
const doc = new PDFDocument({ size: 'A4', layout: 'landscape', autoFirstPage: false, margin: 0 });
const stream = fs.createWriteStream(PDF_PATH);
doc.pipe(stream);

// ── COVER PAGE ─────────────────────────────────────────────────────────────────
doc.addPage();
drawBackground(doc);

// Orange gradient bar at top
doc.rect(0, 0, W, 6).fill(ORANGE);

// Logo / wordmark
const logoY = H * 0.28;
doc.fontSize(52).font('Helvetica-Bold').fillColor(ORANGE).text('SunriseOS', 0, logoY, { align: 'center' });
doc.fontSize(16).font('Helvetica').fillColor(SLATE).text('Behavioral Health EHR & Operating System', 0, logoY + 62, { align: 'center' });

// Divider
const divX = W / 2 - 32;
doc.rect(divX, logoY + 96, 64, 3).fill(ORANGE);

// Title
doc.fontSize(28).font('Helvetica-Bold').fillColor(WHITE).text('Screen-by-Screen Product Review', 0, logoY + 116, { align: 'center' });

// Subtitle
doc.fontSize(13).font('Helvetica').fillColor(SLATE)
  .text('A complete visual walkthrough of all 25 major modules —\nfrom clinical documentation and billing to AI-assisted charting and compliance.', 0, logoY + 158, { align: 'center', lineGap: 4 });

// Badge
const badgeText = 'PRODUCT EVALUATION PACKAGE';
const badgeW = 220, badgeH = 26, badgeX = (W - badgeW) / 2, badgeY = logoY + 218;
doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 13).stroke(ORANGE);
doc.fontSize(11).font('Helvetica').fillColor(ORANGE).text(badgeText, badgeX, badgeY + 7, { width: badgeW, align: 'center' });

// Meta line
doc.fontSize(11).fillColor('#475569').text('Sunrise Recovery Center · Rockville, MD (HQ) · Confidential Demo', 0, H - 56, { align: 'center' });

drawFooter(doc);

// ── TABLE OF CONTENTS ──────────────────────────────────────────────────────────
doc.addPage();
drawBackground(doc);
doc.rect(0, 0, W, 6).fill(ORANGE);

doc.fontSize(22).font('Helvetica-Bold').fillColor(WHITE).text('Table of Contents', MARGIN, 32);
doc.rect(MARGIN, 60, 60, 2).fill(ORANGE);

const colW = (W - MARGIN * 2 - 20) / 2;
const rowH = 19;
const startY = 76;

SCREENS.forEach((s, i) => {
  const col  = i < 13 ? 0 : 1;
  const row  = col === 0 ? i : i - 13;
  const x    = MARGIN + col * (colW + 20);
  const y    = startY + row * rowH;

  doc.fontSize(9).font('Helvetica-Bold').fillColor(ORANGE).text(s.num, x, y, { width: 22 });
  doc.fontSize(9).font('Helvetica').fillColor('#CBD5E1').text(s.label, x + 26, y, { width: colW - 26 });
  doc.rect(x, y + rowH - 2, colW, 0.5).fill('#1E3A5F');
});

drawFooter(doc);

// ── SCREEN PAGES ───────────────────────────────────────────────────────────────
for (const s of SCREENS) {
  const imgPath = path.join(OUT_DIR, s.file);
  if (!fs.existsSync(imgPath)) {
    console.warn('  ⚠ missing:', s.file);
    continue;
  }

  doc.addPage();
  drawBackground(doc);
  doc.rect(0, 0, W, 6).fill(ORANGE);

  // Header bar
  doc.rect(0, 6, W, 44).fill(DARK_BG);

  // Number badge
  doc.roundedRect(MARGIN, 14, 28, 28, 4).fill(ORANGE);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(NAVY).text(s.num, MARGIN, 20, { width: 28, align: 'center' });

  // Screen title
  doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE).text(s.label, MARGIN + 36, 19, { width: W - MARGIN * 2 - 36 });

  // Screenshot image — fill available area
  const imgY   = 58;
  const imgH   = H - imgY - 62;  // leave room for description + footer
  const imgW   = W - MARGIN * 2;

  // Draw a dark background box first
  doc.rect(MARGIN, imgY, imgW, imgH).fill(DARK_BG);

  try {
    // Fit image inside the box, maintaining aspect ratio
    doc.image(imgPath, MARGIN, imgY, { width: imgW, height: imgH, fit: [imgW, imgH], align: 'center', valign: 'center' });
  } catch (e) {
    console.warn('  ⚠ image error:', s.file, e.message);
  }

  // Description bar
  const descY = imgY + imgH + 4;
  doc.rect(MARGIN, descY, 3, 40).fill(ORANGE);
  doc.fontSize(9).font('Helvetica').fillColor(SLATE)
    .text(s.desc, MARGIN + 10, descY + 2, { width: imgW - 10, lineGap: 2 });

  drawFooter(doc);
}

doc.end();

stream.on('finish', () => {
  const size = (fs.statSync(PDF_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`✅  PDF saved: ${PDF_PATH}  (${size} MB)`);
});
stream.on('error', e => { console.error('PDF error:', e); process.exit(1); });
