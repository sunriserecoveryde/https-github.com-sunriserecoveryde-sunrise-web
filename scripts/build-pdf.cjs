/**
 * build-pdf.js
 * Reads all PNGs from "Product Review/" and assembles a polished PDF with:
 *   • A cover page (Sunrise OS branding + date)
 *   • One section per screen: page-width screenshot + 2-4 sentence description
 *   • Consistent header/footer on every content page
 */

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
const OUT_DIR  = path.join(__dirname, '..', 'Product Review');
const PDF_PATH = path.join(OUT_DIR, 'Sunrise OS — Product Review.pdf');

// ── Brand colours (Sunrise OS palette) ───────────────────────────────────────
const NAVY    = '#0f2342';
const ORANGE  = '#f97316';
const WHITE   = '#ffffff';
const SLATE   = '#64748b';
const LIGHT   = '#f1f5f9';

// ── Screen metadata (must match capture-screenshots.js order) ─────────────────
const SCREENS = [
  { num: '01', name: 'Login', title: 'Login', description: 'The Sunrise OS login screen. Staff select their profile from a searchable card grid — no passwords are used in the demo; production builds authenticate via SSO or PIN.' },
  { num: '02', name: 'Dashboard', title: 'Dashboard', description: 'The main clinical dashboard gives every shift-leader an instant floor snapshot: active census, pending tasks, compliance alerts, outcome trend lines, and quick-action shortcuts across all modules.' },
  { num: '03', name: 'Command-Center', title: 'Executive Dashboard — Command Center', description: 'The Command Center is the executive real-time nerve centre. It aggregates census, revenue-per-bed, payer mix, staff-to-patient ratios, and compliance pulse into a single decision-support view for leadership.' },
  { num: '04', name: 'Admissions', title: 'Admissions / Intake', description: 'The Admissions module manages the full intake workflow: pre-admission screening, referral source logging, LOC placement, consent capture, and handoff to clinical documentation — all in a single guided flow.' },
  { num: '05', name: 'Patient-List', title: 'Patient Search — Patient List', description: 'The Patient List is the primary roster view for the active census. Clinicians can search, filter by program or counselor, view acuity flags, and navigate directly into any patient\'s full clinical record.' },
  { num: '06', name: 'Patient-Profile', title: 'Patient Profile', description: 'The Patient Profile consolidates the complete clinical picture: demographics, LOC history, active diagnoses, treatment team, engagement scores, and quick-launch buttons for notes, assessments, and MAR review.' },
  { num: '07a', name: 'ASAM-Assessments', title: 'Assessments — ASAM Criteria', description: 'ASAM Assessments guides clinicians through the six dimensions of the ASAM Patient Placement Criteria, auto-calculates the recommended level of care, and stores the completed assessment in the patient\'s chart.' },
  { num: '07b', name: 'Biopsychosocial-Intake', title: 'Assessments — Biopsychosocial Intake', description: 'The Biopsychosocial Intake screen captures the comprehensive intake assessment covering medical history, substance use, mental health, social determinants, trauma history, and legal involvement — required at admission.' },
  { num: '08', name: 'Treatment-Plans', title: 'Treatment Plans', description: 'Treatment Plans lets counselors build SMART-goal care plans mapped to DSM diagnoses, assign responsible staff, set review dates, and track goal progress over the episode of care.' },
  { num: '09', name: 'Progress-Notes', title: 'Progress Notes', description: 'Progress Notes supports BIRP, DAP, SOAP, and GIRP note formats with AI-assisted draft generation, co-sign routing, and integration to the patient chart and billing engine.' },
  { num: '10', name: 'Group-Notes', title: 'Group Notes', description: 'Group Notes allows facilitators to document a single session for multiple attendees simultaneously, capturing individual participation ratings, interventions, and objectives addressed for each patient in the group.' },
  { num: '11a', name: 'Nursing-MAR', title: 'Medication Management — Nursing MAR', description: 'The Medication Administration Record (MAR) gives nurses a live, time-sorted view of all scheduled medications, PRN orders, and administered doses — with one-tap documentation and missed-dose escalation alerts.' },
  { num: '11b', name: 'Formulary-Management', title: 'Medication Management — Formulary', description: 'Formulary Management maintains the facility\'s approved drug list, MAT protocols, and drug reference cards. Medical staff can add or retire formulary items and set default dosing guidelines per level of care.' },
  { num: '12', name: 'Drug-Screens', title: 'Drug Screens — UA / Drug Testing', description: 'The UA / Drug Testing screen manages specimen collection scheduling, chain-of-custody logging, result entry, and result notification. Patterns are surfaced on the patient profile and Risk Dashboard automatically.' },
  { num: '13a', name: 'Appointment-Calendar', title: 'Calendar — Appointment Calendar', description: 'The Appointment Calendar is a full-facility scheduling surface: individual sessions, group times, telehealth links, and external appointments. Conflict detection and automated reminder messaging are built in.' },
  { num: '13b', name: 'Group-Schedule', title: 'Calendar — Group Schedule', description: 'Group Schedule manages the recurring group therapy timetable — session type, facilitator, room, capacity limits, and real-time attendance. Links directly to the Group Notes workflow after each session.' },
  { num: '14a', name: 'Census-Bed-Board', title: 'Bed Tracker — Census & Bed Board', description: 'Census & Bed Board gives a real-time map of every bed, patient assignment, LOC, acuity indicator, and estimated discharge date — the single source of truth for bed utilisation and shift planning.' },
  { num: '14b', name: 'Bed-Management', title: 'Bed Tracker — Bed Management', description: 'Bed Management exposes the operational controls behind the census: room configuration, level-of-care assignments, maintenance holds, and transfer queuing — used by directors to optimise occupancy and throughput.' },
  { num: '15a', name: 'Revenue-Cycle', title: 'Billing — Revenue Cycle', description: 'Revenue Cycle provides end-to-end billing management: charge capture from clinical documentation, claims generation, payer-specific rule validation, remittance posting, and A/R ageing dashboards.' },
  { num: '15b', name: 'Financial-Counseling', title: 'Billing — Financial Counseling', description: 'Financial Counseling helps staff work through patient responsibility estimates, sliding-scale eligibility, payment plans, and Medicaid/CHIP enrolment — reducing financial barriers before admission.' },
  { num: '16', name: 'Insurance-Auth', title: 'Claims — Insurance Authorization / UR', description: 'Insurance Authorization tracks concurrent review requests, prior-auth approvals, peer-to-peer submissions, denial management, and appeals — keeping authorisation status in sync with clinical stay length.' },
  { num: '17a', name: 'Clinical-Intelligence', title: 'Reports — Clinical Intelligence', description: 'Clinical Intelligence surfaces predictive risk signals across the census: readmission probability, early-engagement alerts, COWS trajectory anomalies, and care-gap flags — generated nightly by the analytics engine.' },
  { num: '17b', name: 'Outcome-Tracking', title: 'Reports — Outcome Tracking', description: 'Outcome Tracking aggregates post-discharge follow-up data, sobriety milestones, step-down adherence, and 30/60/90-day re-engagement rates into a longitudinal quality dashboard for clinical leadership.' },
  { num: '17c', name: 'Population-Analytics', title: 'Reports — Population Analytics', description: 'Population Analytics provides macro-level insight across all patients and programmes: payer mix trends, LOS distribution, acuity heatmaps, and benchmarks against state and national SUD recovery outcomes.' },
  { num: '18a', name: 'AI-Assistant', title: 'AI Features — Sunrise AI (HITL)', description: 'Sunrise AI (Human-in-the-Loop) is a clinical co-pilot that drafts progress notes, flags potential treatment plan gaps, suggests CPT codes, and surfaces relevant research — with staff always in final control.' },
  { num: '18b', name: 'DAP-Note-Workflow', title: 'AI Features — DAP Note Workflow', description: 'The DAP Note Workflow is an AI-powered documentation assistant: the clinician records a session summary, the engine drafts a structured DAP note, and staff review and sign off before the note enters the chart.' },
  { num: '19a', name: 'Staff-Administration', title: 'Staff Management — Staff Administration', description: 'Staff Administration is the HIPAA Security Officer\'s control panel: managing user accounts, assigning roles, setting per-screen permission overrides, and maintaining a full audit trail of all access changes.' },
  { num: '19b', name: 'Staff-Scheduling', title: 'Staff Management — Staff Scheduling', description: 'Staff Scheduling manages shift rosters, PTO requests, credential-to-shift matching, and overtime alerts — ensuring every shift meets the minimum staffing ratios required by CARF and state licensure.' },
  { num: '19c', name: 'Workforce-Compliance', title: 'Staff Management — Workforce Compliance', description: 'Workforce Compliance tracks every credential, licence renewal, background check, and mandatory training expiry date against CARF, TJC, and state SUD-provider requirements — with automated re-certification reminders.' },
  { num: '20', name: 'Settings-Organization', title: 'Organization Settings (System)', description: 'The System tab of Settings exposes organisation-wide configuration: EHR/FHIR integrations, lab and pharmacy interfaces, insurance eligibility verification, HIE connectivity, and data-retention policies — the control layer that ties Sunrise OS into the broader care ecosystem.' },
  { num: '21', name: 'Settings-Facility', title: 'Facility Settings', description: 'The Facility Settings tab configures per-site parameters: bed capacity by level of care, nursing unit layout, formulary defaults, shift definitions, and facility-specific compliance programme selections.' },
  { num: '22', name: 'Role-Explorer', title: 'Permissions — Role Explorer', description: 'Role Explorer gives buyers and administrators a full matrix of every role\'s screen-level permissions (Full / Read-only / No access), making HIPAA minimum-necessary and role-design decisions transparent.' },
  { num: '23', name: 'Mobile-View', title: 'Mobile View — Sunrise Staff Companion App', description: 'Sunrise Staff is the companion mobile app for on-the-floor clinicians and nurses: quick vitals entry, shift checklists, secure messaging, MAR review, and patient flags — optimised for phones and tablets.' },
  { num: '24', name: 'Notifications', title: 'Notifications Panel', description: 'The Notifications panel is a real-time alert hub accessible from any screen. It surfaces clinical alerts, co-sign requests, compliance deadlines, and secure messages — with priority triage and one-tap navigation.' },
  { num: '25a', name: 'Measurement-Based-Care', title: 'Analytics — Measurement-Based Care', description: 'Measurement-Based Care delivers standardised outcome instruments (PHQ-9, GAD-7, AUDIT-C, DAST-10, PCL-5) on a structured cadence, auto-scoring results and plotting symptom trajectories over the episode of care.' },
  { num: '25b', name: 'Recovery-Engagement-Score', title: 'Analytics — Recovery Engagement Score', description: 'The Recovery Engagement Score is a proprietary composite metric derived from attendance adherence, medication compliance, group participation, and therapeutic task completion — updated daily per patient.' },
  { num: '25c', name: 'Withdrawal-Monitor', title: 'Analytics — Withdrawal Monitor', description: 'Withdrawal Monitor tracks COWS and CIWA-Ar assessments on a configurable schedule, plots score trajectories, flags rapid deterioration, and escalates to the on-call prescriber when thresholds are breached.' },
];

// ── PDF dimensions (A3 landscape = 1190 × 842 pt, US Letter landscape = 792 × 612)
// We'll use letter landscape to get a wide canvas for the 1440-wide screenshots.
const PAGE_W = 1190;   // A3 landscape width
const PAGE_H = 842;    // A3 landscape height
const MARGIN = 40;
const HEADER_H = 50;
const FOOTER_H = 30;
const CONTENT_Y = MARGIN + HEADER_H;
const CONTENT_H = PAGE_H - CONTENT_Y - FOOTER_H - MARGIN;

// ── Build PDF ─────────────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: [PAGE_W, PAGE_H],
  margin: 0,
  autoFirstPage: false,
  info: {
    Title:    'Sunrise OS — Product Review',
    Author:   'The Sunrise Grp., Inc.',
    Subject:  'Sunrise OS Platform — Complete Screen Reference',
    Keywords: 'Sunrise OS, SUD, EHR, addiction treatment, clinical software',
    Creator:  'Sunrise OS Product Team',
  },
});

doc.pipe(fs.createWriteStream(PDF_PATH));

// ─── Cover page ───────────────────────────────────────────────────────────────
doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });

// Background gradient (navy)
doc.rect(0, 0, PAGE_W, PAGE_H).fill(NAVY);

// Orange accent bar at top
doc.rect(0, 0, PAGE_W, 8).fill(ORANGE);

// Decorative circle (sunrise motif)
doc.circle(PAGE_W / 2, PAGE_H * 0.38, 140)
   .lineWidth(2)
   .strokeColor(ORANGE)
   .fillAndStroke('#0f2342', ORANGE)
   .opacity(0.3);

// Sun rays (simple lines)
doc.opacity(0.15);
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  const cx = PAGE_W / 2, cy = PAGE_H * 0.38;
  const r1 = 155, r2 = 220;
  doc.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
     .lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
     .lineWidth(1)
     .strokeColor(ORANGE)
     .stroke();
}
doc.opacity(1);

// Title
doc.font('Helvetica-Bold')
   .fontSize(48)
   .fillColor(WHITE)
   .text('Sunrise OS', 0, PAGE_H * 0.22, { align: 'center', width: PAGE_W });

doc.font('Helvetica')
   .fontSize(22)
   .fillColor(ORANGE)
   .text('Product Review', 0, PAGE_H * 0.22 + 64, { align: 'center', width: PAGE_W });

// Subtitle line
doc.moveDown(0.5)
   .fontSize(13)
   .fillColor('#94a3b8')
   .text('Platform Screen Reference  ·  Confidential', 0, PAGE_H * 0.22 + 64 + 38, { align: 'center', width: PAGE_W });

// Date
const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
doc.fontSize(11)
   .fillColor('#64748b')
   .text(`Generated ${generated}`, 0, PAGE_H * 0.22 + 64 + 38 + 28, { align: 'center', width: PAGE_W });

// Stats bar
const statY = PAGE_H * 0.72;
doc.rect(MARGIN * 2, statY, PAGE_W - MARGIN * 4, 90).fillColor('#162d50').fill();
const stats = [
  { label: 'Screens Documented', value: `${SCREENS.length}` },
  { label: 'Clinical Modules', value: '12+' },
  { label: 'User Roles Supported', value: '17' },
  { label: 'Compliance Standards', value: 'CARF · TJC · HIPAA' },
];
const statCellW = (PAGE_W - MARGIN * 4) / stats.length;
stats.forEach((s, i) => {
  const sx = MARGIN * 2 + i * statCellW + statCellW / 2;
  doc.font('Helvetica-Bold').fontSize(26).fillColor(ORANGE)
     .text(s.value, sx - statCellW / 2, statY + 14, { width: statCellW, align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
     .text(s.label, sx - statCellW / 2, statY + 50, { width: statCellW, align: 'center' });
});

// Footer note
doc.font('Helvetica').fontSize(9).fillColor('#475569')
   .text(
     'This document contains confidential and proprietary information of The Sunrise Grp., Inc. · For authorised recipients only.',
     MARGIN, PAGE_H - MARGIN - 14, { width: PAGE_W - MARGIN * 2, align: 'center' }
   );

// ─── Content pages ────────────────────────────────────────────────────────────
let pageNum = 0;

function addHeader(doc, title) {
  // Navy header bar
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(NAVY);
  // Orange accent
  doc.rect(0, 0, PAGE_W, 4).fill(ORANGE);
  // Logo text
  doc.font('Helvetica-Bold').fontSize(12).fillColor(ORANGE)
     .text('SUNRISE OS', MARGIN, 17, { lineBreak: false });
  // Screen title
  doc.font('Helvetica').fontSize(12).fillColor(WHITE)
     .text(title, MARGIN + 90, 17, { lineBreak: false, width: PAGE_W - MARGIN * 2 - 90 });
}

function addFooter(doc, pageNum, total) {
  const fy = PAGE_H - FOOTER_H;
  doc.rect(0, fy, PAGE_W, FOOTER_H).fill('#0a1a2e');
  doc.rect(0, fy, PAGE_W, 1).fill(ORANGE);
  doc.font('Helvetica').fontSize(8).fillColor('#64748b')
     .text('Sunrise OS  —  Confidential', MARGIN, fy + 10, { lineBreak: false });
  doc.font('Helvetica').fontSize(8).fillColor('#64748b')
     .text(`Page ${pageNum} of ${total}`, 0, fy + 10,
           { width: PAGE_W - MARGIN, align: 'right', lineBreak: false });
}

const totalContentPages = SCREENS.length;

SCREENS.forEach((screen, idx) => {
  pageNum++;
  const pngFile = `${screen.num}-${screen.name}.png`;
  const pngPath = path.join(OUT_DIR, pngFile);

  doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });

  // Background
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(LIGHT);

  // Header
  addHeader(doc, screen.title);

  // Screenshot
  const IMG_Y   = CONTENT_Y + 6;
  const MAX_IMG_H = CONTENT_H - 70;  // reserve space for description
  const IMG_W   = PAGE_W - MARGIN * 2;

  if (fs.existsSync(pngPath)) {
    try {
      // Calculate scaled dimensions preserving aspect ratio
      const { width: origW, height: origH } = getImageDimensions(pngPath);
      const scale = Math.min(IMG_W / origW, MAX_IMG_H / origH);
      const drawW = origW * scale;
      const drawH = origH * scale;
      const imgX = MARGIN + (IMG_W - drawW) / 2;

      // Drop shadow
      doc.rect(imgX + 3, IMG_Y + 3, drawW, drawH).fill('#00000020');
      // Image
      doc.image(pngPath, imgX, IMG_Y, { width: drawW, height: drawH });
      // Border
      doc.rect(imgX, IMG_Y, drawW, drawH).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      // Description area
      const descY = IMG_Y + drawH + 14;
      doc.rect(MARGIN, descY, IMG_W, 60).fill(NAVY);
      doc.rect(MARGIN, descY, 4, 60).fill(ORANGE);

      // Screen number badge
      doc.font('Helvetica-Bold').fontSize(10).fillColor(ORANGE)
         .text(screen.num.toUpperCase(), MARGIN + 10, descY + 8, { lineBreak: false });

      // Description text
      doc.font('Helvetica').fontSize(10).fillColor('#cbd5e1')
         .text(screen.description, MARGIN + 48, descY + 8,
               { width: IMG_W - 58, lineBreak: true });

    } catch (e) {
      // If image load fails, show placeholder
      doc.rect(MARGIN, IMG_Y, IMG_W, MAX_IMG_H).fill('#e2e8f0').stroke();
      doc.font('Helvetica').fontSize(14).fillColor(SLATE)
         .text(`[Screenshot not available: ${pngFile}]`, MARGIN, IMG_Y + MAX_IMG_H / 2 - 10,
               { width: IMG_W, align: 'center' });
    }
  } else {
    doc.rect(MARGIN, IMG_Y, IMG_W, MAX_IMG_H).fill('#e2e8f0');
    doc.font('Helvetica').fontSize(14).fillColor(SLATE)
       .text(`[Screenshot not found: ${pngFile}]`, MARGIN, IMG_Y + MAX_IMG_H / 2 - 10,
             { width: IMG_W, align: 'center' });
  }

  // Footer
  addFooter(doc, pageNum, totalContentPages);
});

doc.end();
doc.on('end', () => {
  console.log(`\n✅ PDF saved to: ${PDF_PATH}`);
  console.log(`   Pages: ${pageNum + 1} (cover + ${pageNum} screen pages)`);
});

// ── Utility: read PNG dimensions from file header ─────────────────────────────
function getImageDimensions(filePath) {
  // PNG header: bytes 16-20 = width, 20-24 = height (big-endian)
  const buf = Buffer.alloc(24);
  const fd  = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  const sig = buf.slice(0, 8).toString('hex');
  if (sig === '89504e470d0a1a0a') {
    // PNG
    return {
      width:  buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  }
  // Fallback for non-PNG (JPEG etc.)
  return { width: 1440, height: 900 };
}
