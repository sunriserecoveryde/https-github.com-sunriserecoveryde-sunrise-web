/**
 * demoExpansion.ts — Demo account seed data
 *
 * Provides: EXTRA_STAFF (9 members), EXTRA_ACTIVE_PATIENTS (48),
 * DISCHARGED_PATIENTS (40).  All data is fictional — no real PHI.
 * Imported by mockStaff.ts and mockPatients.ts.
 */

import type { Patient, ProgressNote, TreatmentGoal, Flag } from './mockPatients';
import type { StaffMember } from './mockStaff';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function n(
  id: string, date: string, type: string,
  author: string, format: 'BIRP' | 'DAP' | 'SOAP' | 'GIRP',
  content: string,
  status: 'Signed' | 'Awaiting Co-sign' | 'Draft' = 'Signed'
): ProgressNote {
  return { id, date, type, author, content, status, format };
}

function g(
  id: string, category: string, problem: string,
  longTerm: string, shortTerm: string,
  status: 'Not Started' | 'In Progress' | 'Met',
  targetDate: string
): TreatmentGoal {
  return { id, category, problem, longTerm, shortTerm, status, targetDate };
}

function flag(type: Flag['type'], note: string): Flag {
  return { type, note };
}

// Common staff names (from existing + new)
const SARAH = 'Sarah Jenkins, LCPC';
const DAVID = 'David Odom, LCADC';
const MARIA = 'Maria Santos, LGPC';
const KEVIN = 'Kevin Wright, LCPC';
const TAMARA = 'Tamara Bell, LCADC';
const JAMES = 'James Collins, CAC-AD';
const DR_CHEN = 'Dr. Robert Chen';
const DR_STONE = 'Dr. Emily Stone';
const DR_PATEL = 'Dr. Priya Patel';
const DR_LEE = 'Dr. Marcus Lee';
const LISA_RN = 'Lisa Chen, RN';

// ─── Extra Staff ─────────────────────────────────────────────────────────────

export const EXTRA_STAFF: StaffMember[] = [

  // s17 — Maria Santos, Group Therapist, Silver Spring
  {
    id: 's17',
    firstName: 'Maria', lastName: 'Santos',
    credentials: ['LGPC', 'CAC-AD'],
    title: 'Group Therapist',
    roleId: 'certified_clinician',
    department: 'Clinical',
    facility: 'Sunrise PHP/IOP Center — Silver Spring, MD',
    email: 'm.santos@sunriserecovery.org', phone: '(301) 555-0117',
    photoInitials: 'MS', avatarBg: 'bg-pink-500',
    licenseNumber: 'MD-LGPC-7712', licenseState: 'MD',
    licenseType: 'Licensed Graduate Professional Counselor',
    licenseExpiry: '2027-10-01',
    hireDate: '2021-06-01', lastLogin: '2026-07-29 09:15',
    status: 'active',
    certifications: [
      { id: 'cs17a', name: 'CAC-AD', issuingBody: 'MD BHA / ADAA', number: 'MD-CAC-AD-4421', issueDate: '2020-01-01', expiryDate: '2026-12-31', status: 'active', ceuRequired: 40, ceuCompleted: 38 },
      { id: 'cs17b', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2025-03-01', expiryDate: '2027-03-01', status: 'active' },
    ],
    specializations: ['Group Therapy', 'Trauma-Informed Care', 'CBT', 'Co-occurring Disorders'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // s18 — Kevin Wright, Primary Counselor, Annapolis
  {
    id: 's18',
    firstName: 'Kevin', lastName: 'Wright',
    credentials: ['LCPC', 'NCC'],
    title: 'Primary Counselor',
    roleId: 'certified_clinician',
    department: 'Clinical',
    facility: 'Sunrise Recovery Center — Annapolis, MD',
    email: 'k.wright@sunriserecovery.org', phone: '(410) 555-0118',
    photoInitials: 'KW', avatarBg: 'bg-teal-600',
    licenseNumber: 'MD-LCPC-2298', licenseState: 'MD',
    licenseType: 'Licensed Clinical Professional Counselor',
    licenseExpiry: '2028-05-01',
    hireDate: '2020-09-14', lastLogin: '2026-07-29 08:45',
    status: 'active',
    certifications: [
      { id: 'cs18a', name: 'NCC — National Certified Counselor', issuingBody: 'NBCC', number: 'NCC-88341', issueDate: '2019-07-01', expiryDate: '2027-07-01', status: 'active', ceuRequired: 100, ceuCompleted: 92 },
      { id: 'cs18b', name: 'CPR / AED', issuingBody: 'American Heart Association', issueDate: '2025-06-01', expiryDate: '2027-06-01', status: 'active' },
    ],
    specializations: ['Individual Therapy', 'DBT', 'Motivational Interviewing', 'Opioid Use Disorder'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // s19 — Tamara Bell, Primary Counselor, Gaithersburg
  {
    id: 's19',
    firstName: 'Tamara', lastName: 'Bell',
    credentials: ['LCADC', 'CADC'],
    title: 'Primary Counselor',
    roleId: 'certified_clinician',
    department: 'Clinical',
    facility: 'Sunrise Wellness — Gaithersburg, MD',
    email: 't.bell@sunriserecovery.org', phone: '(301) 555-0119',
    photoInitials: 'TB', avatarBg: 'bg-orange-500',
    licenseNumber: 'MD-LCADC-5583', licenseState: 'MD',
    licenseType: 'Licensed Clinical Alcohol and Drug Counselor',
    licenseExpiry: '2027-08-01',
    hireDate: '2022-02-07', lastLogin: '2026-07-28 17:30',
    status: 'active',
    certifications: [
      { id: 'cs19a', name: 'CADC — Certified Alcohol & Drug Counselor', issuingBody: 'Maryland CAC Board', number: 'MD-CADC-3301', issueDate: '2018-04-01', expiryDate: '2026-10-01', status: 'active', ceuRequired: 40, ceuCompleted: 35 },
    ],
    specializations: ['Alcohol Use Disorder', 'Family Systems', 'Relapse Prevention', 'Motivational Enhancement Therapy'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // s20 — Marcus Johnson, Peer Support Specialist, Silver Spring
  {
    id: 's20',
    firstName: 'Marcus', lastName: 'Johnson',
    credentials: ['CPRS'],
    title: 'Peer Support Specialist',
    roleId: 'bht',
    department: 'Recovery Support',
    facility: 'Sunrise PHP/IOP Center — Silver Spring, MD',
    email: 'ma.johnson@sunriserecovery.org', phone: '(301) 555-0120',
    photoInitials: 'MJ', avatarBg: 'bg-lime-600',
    licenseNumber: 'MD-CPRS-1102', licenseState: 'MD',
    licenseType: 'Certified Peer Recovery Specialist',
    licenseExpiry: '2026-12-01',
    hireDate: '2023-04-03', lastLogin: '2026-07-29 10:00',
    status: 'active',
    certifications: [
      { id: 'cs20a', name: 'CPRS — Certified Peer Recovery Specialist', issuingBody: 'Maryland Behavioral Health Administration', number: 'MD-CPRS-1102', issueDate: '2023-03-01', expiryDate: '2026-12-01', status: 'active', ceuRequired: 12, ceuCompleted: 12 },
    ],
    specializations: ['Peer Mentorship', 'Recovery Coaching', 'Community Linkage', 'Harm Reduction'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // s21 — Lisa Chen, Staff Nurse (RN), Rockville
  {
    id: 's21',
    firstName: 'Lisa', lastName: 'Chen',
    credentials: ['RN'],
    title: 'Staff Nurse',
    roleId: 'nursing',
    department: 'Nursing',
    facility: 'Sunrise Recovery Center — Rockville, MD',
    email: 'l.chen@sunriserecovery.org', phone: '(301) 555-0121',
    photoInitials: 'LC', avatarBg: 'bg-cyan-600',
    npi: '1087654321',
    licenseNumber: 'MD-RN-44412', licenseState: 'MD',
    licenseType: 'Registered Nurse',
    licenseExpiry: '2027-04-01',
    hireDate: '2021-11-15', lastLogin: '2026-07-30 06:55',
    status: 'active',
    certifications: [
      { id: 'cs21a', name: 'CARN — Certified Addictions Registered Nurse', issuingBody: 'IntNSA', number: 'CARN-88211', issueDate: '2023-01-01', expiryDate: '2027-01-01', status: 'active', ceuRequired: 30, ceuCompleted: 30 },
      { id: 'cs21b', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2025-11-01', expiryDate: '2027-11-01', status: 'active' },
    ],
    specializations: ['Medication Administration', 'Withdrawal Management', 'Detox Protocols', 'MAT Support'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: true, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // s22 — Patricia Moore, Clinical Case Manager, Bethesda
  {
    id: 's22',
    firstName: 'Patricia', lastName: 'Moore',
    credentials: ['LCSW-C', 'CCM'],
    title: 'Clinical Case Manager',
    roleId: 'certified_clinician',
    department: 'Case Management',
    facility: 'Sunrise Outpatient — Bethesda, MD',
    email: 'p.moore@sunriserecovery.org', phone: '(301) 555-0122',
    photoInitials: 'PM', avatarBg: 'bg-violet-500',
    licenseNumber: 'MD-LCSW-C-3312', licenseState: 'MD',
    licenseType: 'Licensed Certified Social Worker – Clinical',
    licenseExpiry: '2027-11-01',
    hireDate: '2019-08-19', lastLogin: '2026-07-29 13:20',
    status: 'active',
    certifications: [
      { id: 'cs22a', name: 'CCM — Certified Case Manager', issuingBody: 'CCMC', number: 'CCM-77421', issueDate: '2021-05-01', expiryDate: '2027-05-01', status: 'active', ceuRequired: 80, ceuCompleted: 74 },
    ],
    specializations: ['Complex Case Management', 'Discharge Planning', 'Community Resources', 'Housing Navigation'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // s23 — Robert Davis, Utilization Review Coordinator, Rockville HQ
  {
    id: 's23',
    firstName: 'Robert', lastName: 'Davis',
    credentials: ['CPC-AD'],
    title: 'Utilization Review Coordinator',
    roleId: 'admin_staff',
    department: 'Utilization Management',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 'r.davis@sunriserecovery.org', phone: '(301) 555-0123',
    photoInitials: 'RD', avatarBg: 'bg-slate-500',
    licenseNumber: 'MD-CPC-AD-2201', licenseState: 'MD',
    licenseType: 'Certified Professional Counselor — Alcohol & Drug',
    licenseExpiry: '2026-09-01',
    hireDate: '2020-03-23', lastLogin: '2026-07-29 15:45',
    status: 'active',
    certifications: [
      { id: 'cs23a', name: 'CPC-AD', issuingBody: 'MD BHA / ADAA', number: 'MD-CPC-AD-2201', issueDate: '2019-09-01', expiryDate: '2026-09-01', status: 'pending-renewal', ceuRequired: 40, ceuCompleted: 40 },
    ],
    specializations: ['Insurance Authorization', 'Level of Care Criteria', 'ASAM Placement', 'Payer Relations'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // s24 — Jennifer Williams, Billing Manager, Rockville HQ
  {
    id: 's24',
    firstName: 'Jennifer', lastName: 'Williams',
    credentials: ['CPC', 'CPMA'],
    title: 'Billing & Revenue Cycle Manager',
    roleId: 'admin_staff',
    department: 'Billing & Finance',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 'j.williams@sunriserecovery.org', phone: '(301) 555-0124',
    photoInitials: 'JW', avatarBg: 'bg-amber-600',
    hireDate: '2018-05-07', lastLogin: '2026-07-30 08:10',
    status: 'active',
    certifications: [
      { id: 'cs24a', name: 'CPC — Certified Professional Coder', issuingBody: 'AAPC', number: 'CPC-501233', issueDate: '2017-06-01', expiryDate: '2027-06-01', status: 'active', ceuRequired: 36, ceuCompleted: 36 },
      { id: 'cs24b', name: 'CPMA — Certified Professional Medical Auditor', issuingBody: 'AAPC', number: 'CPMA-21244', issueDate: '2020-08-01', expiryDate: '2026-08-01', status: 'pending-renewal', ceuRequired: 36, ceuCompleted: 36 },
    ],
    specializations: ['Revenue Cycle Management', 'HealthChoice Billing', 'ICD-10/CPT Coding', 'Denial Management'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // s25 — Thomas Green, Quality Improvement Director, Rockville HQ
  {
    id: 's25',
    firstName: 'Thomas', lastName: 'Green',
    credentials: ['MHA', 'CPHQ'],
    title: 'Quality Improvement Director',
    roleId: 'admin_staff',
    department: 'Quality & Compliance',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 't.green@sunriserecovery.org', phone: '(301) 555-0125',
    photoInitials: 'TG', avatarBg: 'bg-emerald-600',
    hireDate: '2017-10-01', lastLogin: '2026-07-28 16:00',
    status: 'active',
    certifications: [
      { id: 'cs25a', name: 'CPHQ — Certified Professional in Healthcare Quality', issuingBody: 'NAHQ', number: 'CPHQ-30091', issueDate: '2019-01-01', expiryDate: '2027-01-01', status: 'active', ceuRequired: 30, ceuCompleted: 28 },
    ],
    specializations: ['CARF Accreditation', 'QAPI', 'Outcome Measurement', 'Regulatory Compliance'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'full' },
    permissionOverrides: {},
  },
];

// ─── Extra Active Patients (p27 – p74) ───────────────────────────────────────

export const EXTRA_ACTIVE_PATIENTS: Patient[] = [

  // p27
  {
    id: 'p27', mrn: 'MRN-24501', firstName: 'Terrence', lastName: 'Blake',
    dob: '1988-06-14', age: 38, gender: 'M',
    insurance: 'Priority Partners (Johns Hopkins)',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['PTSD', 'Major Depressive Disorder'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 38, amaRisk: 'High', los: 18,
    admitDate: '2026-07-12', expectedDischarge: '2026-08-11',
    counselor: KEVIN, physician: DR_CHEN,
    flags: [flag('AMA', 'Expressed desire to leave AMA on Day 14'), flag('Medical', 'Fentanyl detected in urine — high overdose risk')],
    lastUa: 'Positive (Fentanyl)', mood: 3, craving: 9,
    notes: [
      n('p27n1', '2026-07-29 14:00', 'Individual', KEVIN, 'BIRP', 'Client attended 50-min individual session. Behavior: guarded; avoided eye contact. Identified core trauma trigger (Motor Vehicle Accident 2019) for first time. Intervention: trauma-informed containment techniques; validated experience. Response: client tearful but remained. Plan: introduce EMDR preparation protocol next session; continue buprenorphine stabilization.'),
      n('p27n2', '2026-07-27 09:30', 'Group', JAMES, 'DAP', 'Attended morning process group. Participated minimally but shared a brief account of family estrangement. Peers responded with empathy. No safety concerns. Assessment: early-stage group engagement. Plan: encourage deeper participation in therapeutic group over next two sessions.'),
      n('p27n3', '2026-07-24 11:00', 'Medical', DR_CHEN, 'SOAP', 'S: Client reports reduced withdrawal symptoms. Persistent insomnia and night sweats. O: Buprenorphine 16mg/day stable. BP 128/82, HR 74. A: OUD in early stabilization; PTSD complicating sleep. P: Add hydroxyzine 25mg QHS for sleep; continue current MAT regimen. Follow-up Monday.'),
      n('p27n4', '2026-07-20 15:30', 'Nursing', LISA_RN, 'DAP', 'Administered AM medications without incident. Client verbalized understanding of MAT protocol. Vital signs within normal limits. Skin intact; no IV site concerns. Education provided on fentanyl test strips and naloxone use post-discharge.'),
    ],
    goals: [
      g('p27g1', 'Substance Use', 'Active fentanyl use with high overdose risk', 'Achieve 6 months continuous abstinence from illicit opioids', 'Complete detox stabilization; accept MAT for outpatient transition', 'In Progress', '2026-08-11'),
      g('p27g2', 'Trauma', 'Unresolved MVA trauma driving substance use', 'Process MVA trauma through EMDR; reduce PTSD symptoms by 50%', 'Complete 4 EMDR preparation sessions; identify 3 coping resources', 'Not Started', '2026-09-01'),
    ],
    nextAppointment: 'Tomorrow, 9:00 AM', bed: '2A', status: 'Occupied',
  },

  // p28
  {
    id: 'p28', mrn: 'MRN-22104', firstName: 'Fatima', lastName: 'Hassan',
    dob: '1995-03-08', age: 31, gender: 'F',
    insurance: 'Aetna Better Health of Maryland',
    program: 'PHP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Generalized Anxiety Disorder', 'Insomnia'],
    asam: { d1: 2, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 62, amaRisk: 'Med', los: 27,
    admitDate: '2026-07-03', expectedDischarge: '2026-09-10',
    counselor: TAMARA, physician: DR_STONE,
    flags: [flag('Success', '30-day sobriety milestone achieved'), flag('Behavioral', 'Attendance slip Day 19 — resolved')],
    lastUa: 'Negative', mood: 6, craving: 4,
    notes: [
      n('p28n1', '2026-07-28 13:00', 'Individual', TAMARA, 'BIRP', 'Client presents with improved mood. Reported using 4-7-8 breathing during anxiety spike at work. Behavior: engaged, making eye contact. Explored family-of-origin drinking patterns. Intervention: genogram exercise — client identified generational alcohol use spanning 3 generations. Response: insight-oriented; committed to breaking cycle for her children. Plan: assign family narrative journaling exercise.'),
      n('p28n2', '2026-07-25 10:30', 'Group', MARIA, 'DAP', 'PHP morning group — 8 participants. Fatima shared her 30-day milestone. Group responded with supportive affirmation. Demonstrated healthy peer connection. Assessment: progressing well in PHP milieu. Plan: begin Step 4 work with sponsor; introduce family week planning.'),
      n('p28n3', '2026-07-21 14:15', 'Medical', DR_STONE, 'SOAP', 'S: Denies cravings. Anxiety persisting especially evenings. O: Vitals stable. LFTs improving — AST 42 (was 118). A: AUD in sustained remission on structured program; GAD partially controlled. P: Reduce buspirone to 10mg BID given improvement; add sleep hygiene protocol. Next labs in 2 weeks.'),
      n('p28n4', '2026-07-15 09:00', 'Case Management', 'Patricia Moore, LCSW-C', 'DAP', 'Coordinated with employer EAP. Client approved for FMLA through August 31. Housing stable. Child care arranged with sister during PHP hours. Identified AA home group (Rockville Tuesday evening). Discharge planning on track — IOP transition planned for early September.'),
    ],
    goals: [
      g('p28g1', 'Substance Use', 'Daily alcohol use — longest prior sobriety 11 days', 'Maintain 12 months continuous sobriety from alcohol', 'Complete 60-day PHP; attend AA meetings 4×/week', 'In Progress', '2026-09-10'),
      g('p28g2', 'Mental Health', 'GAD driving anxiety-related relapse risk', 'Reduce GAD symptoms (GAD-7 < 5) and identify non-substance coping', 'Practice 2 anxiety coping skills daily; log triggers in journal', 'In Progress', '2026-08-15'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP Group',
  },

  // p29
  {
    id: 'p29', mrn: 'MRN-20388', firstName: 'Carlos', lastName: 'Rivera',
    dob: '1982-11-22', age: 43, gender: 'M',
    insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'IOP',
    primaryDiagnosis: 'Cocaine Use Disorder (Moderate) + Cannabis Use Disorder (Mild)',
    coOccurring: ['Bipolar II Disorder'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 70, amaRisk: 'Low', los: 41,
    admitDate: '2026-06-19', expectedDischarge: '2026-09-19',
    counselor: SARAH, physician: DR_CHEN,
    flags: [flag('Insurance', 'Prior auth renewal due Aug 1'), flag('Success', 'Enrolled in vocational training program')],
    lastUa: 'Negative', mood: 7, craving: 3,
    notes: [
      n('p29n1', '2026-07-29 17:00', 'Individual', SARAH, 'BIRP', 'Client arrived on time. Reported stable mood — hypomanic episode two weeks ago self-managed with sleep hygiene and exercise. Behavior: collaborative and goal-oriented. Reviewed vocational training progress — enrolled in HVAC certification (14 weeks). Intervention: relapse prevention planning around work stress. Response: client articulate about triggers. Plan: develop stress management toolkit for workplace re-entry.'),
      n('p29n2', '2026-07-26 18:00', 'Group', MARIA, 'DAP', 'Evening IOP group — 6 participants. Carlos led check-in with strong self-disclosure about managing Bipolar II while in recovery. Group dynamics excellent. Assessment: demonstrating peer leadership qualities. Plan: explore peer mentor role in future.'),
      n('p29n3', '2026-07-22 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Mood stable for 10 days. No cocaine use confirmed by UA. O: Lamotrigine 150mg QD — tolerating well. BP 124/78. A: Bipolar II in partial remission; CUD in remission. P: Continue Lamotrigine; increase therapy frequency during vocational training transition. RTC 3 weeks.'),
      n('p29n4', '2026-07-10 09:00', 'Case Management', 'Patricia Moore, LCSW-C', 'DAP', 'Connected client to MD Division of Rehabilitation Services (DORS) — vocational training grant approved for HVAC certification program. Housing stable with brother. Transportation arranged. Insurance authorization renewed through September 19.'),
    ],
    goals: [
      g('p29g1', 'Substance Use', 'Cocaine and cannabis use precipitating hypomanic episodes', 'Maintain abstinence from cocaine and cannabis; stable mood for 6 months', 'Complete IOP 3× weekly; provide clean UA monthly', 'In Progress', '2026-09-19'),
      g('p29g2', 'Employment', 'Unemployment increasing relapse risk and instability', 'Secure full-time employment in skilled trade by end of year', 'Complete HVAC certification program; attend 4 job fairs', 'In Progress', '2026-12-01'),
    ],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  // p30
  {
    id: 'p30', mrn: 'MRN-18771', firstName: 'Brittany', lastName: 'Simmons',
    dob: '2000-07-14', age: 26, gender: 'F',
    insurance: 'Maryland Medicaid / HealthChoice',
    program: 'Residential',
    primaryDiagnosis: 'Severe Methamphetamine Use Disorder',
    coOccurring: ['ADHD', 'Methamphetamine-Induced Psychosis (resolving)'],
    asam: { d1: 2, d2: 3, d3: 4, d4: 3, d5: 4, d6: 4 },
    recoveryScore: 28, amaRisk: 'High', los: 9,
    admitDate: '2026-07-21', expectedDischarge: '2026-08-20',
    counselor: KEVIN, physician: DR_LEE,
    flags: [flag('Psychiatric', 'Psychosis resolving — 72-hr psychiatric hold on Day 1'), flag('Medical', 'Amphetamine-induced tachycardia — cardiology consult completed'), flag('Risk', 'CIWA protocol discontinued Day 6')],
    lastUa: 'Positive (MAMP)', mood: 4, craving: 7,
    notes: [
      n('p30n1', '2026-07-29 11:00', 'Medical', DR_LEE, 'SOAP', 'S: Auditory hallucinations resolved per client report. Still experiencing paranoid ideation, less intense. O: BP 118/76, HR 92 (improving). No longer meeting criteria for acute psychosis. Risperidone 2mg QD. A: Meth-induced psychosis resolving; ADHD — defer stimulant treatment until 30 days clean. P: Reduce risperidone monitoring from BID to QD. Psych follow-up next Tuesday.'),
      n('p30n2', '2026-07-27 14:00', 'Individual', KEVIN, 'BIRP', 'First substantive individual session since admission. Client oriented ×4; affect more appropriate. Explored history — 3-year meth use, started with work colleagues. Intervention: psychoeducation on meth-induced psychosis and recovery timeline. Response: client expressed shock at severity of episode; motivated by fear. Plan: introduce SMART Recovery concepts; build rapport before deeper trauma work.'),
      n('p30n3', '2026-07-24 08:00', 'Nursing', LISA_RN, 'DAP', 'Patient sleeping 6-7 hours. Appetite returning — ate 80% of meals. Cooperative with medication administration. Vitals improving — HR trending down from admission high of 128. Explained medication purpose and side effects. Patient asking appropriate questions — good sign of cognitive clearing.'),
      n('p30n4', '2026-07-22 16:00', 'Group', JAMES, 'DAP', 'Attended first group session. Quiet observer throughout. Did not share but maintained eye contact and appeared to track conversation. No disruptive behaviors. Assessment: psychosis continuing to resolve — group attendance therapeutically appropriate at this stage. Plan: continue milieu participation; re-evaluate active participation in 5 days.'),
    ],
    goals: [
      g('p30g1', 'Substance Use', 'Severe meth use with psychosis and medical complications', 'Achieve 6-month abstinence from methamphetamine; prevent relapse', 'Complete medical stabilization; engage in 15 individual sessions', 'In Progress', '2026-08-20'),
      g('p30g2', 'Psychiatric', 'Meth-induced psychosis requiring medication management', 'Achieve and maintain psychiatric stability; ADHD managed without stimulants', 'Attend all psychiatric appointments; medication compliant for 30 days', 'In Progress', '2026-09-01'),
    ],
    nextAppointment: 'Today, 4:00 PM — Psychiatric Follow-up', bed: '3A', status: 'Occupied',
  },

  // p31
  {
    id: 'p31', mrn: 'MRN-17204', firstName: 'Raymond', lastName: 'Holloway',
    dob: '1974-04-30', age: 52, gender: 'M',
    insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'PHP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Generalized Anxiety Disorder', 'Hypertension'],
    asam: { d1: 1, d2: 2, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 55, amaRisk: 'Low', los: 22,
    admitDate: '2026-07-08', expectedDischarge: '2026-09-08',
    counselor: DAVID, physician: DR_STONE,
    flags: [flag('Medical', 'Hypertension — lisinopril initiated'), flag('Insurance', 'Auth approved through 9/8')],
    lastUa: 'Negative', mood: 6, craving: 3,
    notes: [
      n('p31n1', '2026-07-28 10:00', 'Individual', DAVID, 'BIRP', 'Session 9 of PHP individual track. Client shared weekend experience — attended nephew\'s graduation without drinking. First sober social event in 4 years. Behavior: proud, animated. Intervention: reinforced progress; explored what made the event manageable (arriving with sponsor, having exit plan). Response: client identifying protective factors independently. Plan: practice relapse prevention for upcoming work conference.'),
      n('p31n2', '2026-07-24 14:00', 'Group', TAMARA, 'DAP', 'PHP afternoon group. Raymond volunteered to lead check-in. Shared his success at the graduation. Group applauded. Several peers asked for his strategy — positive modeling occurring. Assessment: excellent peer integration. Plan: encourage sponsorship exploration.'),
      n('p31n3', '2026-07-20 11:00', 'Medical', DR_STONE, 'SOAP', 'S: No alcohol past 22 days. Blood pressure improving. Mild anxiety. O: BP 134/86 (down from 152/94 admission). HR 68. LFTs normalizing — ALT 34. A: AUD in sustained remission; hypertension improving with sobriety. P: Continue lisinopril 10mg; consider dose reduction at next visit if BP trend continues.'),
      n('p31n4', '2026-07-15 09:30', 'Case Management', 'Robert Davis, CPC-AD', 'DAP', 'Reviewed insurance authorization — approved through September 8 (62 days PHP). Employer EAP contacted — client approved for 90 days treatment leave. Coordinated with CFO regarding FMLA paperwork. Discharge plan: IOP transition September 8, AA service commitment established.'),
    ],
    goals: [
      g('p31g1', 'Substance Use', '15+ year alcohol dependence — multiple failed outpatient attempts', 'Achieve 1-year continuous sobriety; establish AA home group', 'Complete 60-day PHP; secure sponsor by Day 45', 'In Progress', '2026-09-08'),
      g('p31g2', 'Medical', 'Hypertension uncontrolled due to alcohol use', 'Achieve sustained blood pressure < 130/80 without dose escalation', 'Take medications daily; attend all cardiology follow-ups', 'In Progress', '2026-10-01'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP Group',
  },

  // p32
  {
    id: 'p32', mrn: 'MRN-15883', firstName: 'Destiny', lastName: 'Washington',
    dob: '2004-02-18', age: 22, gender: 'F',
    insurance: 'MedStar Family Choice',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['Major Depressive Disorder', 'Adverse Childhood Experiences'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 31, amaRisk: 'High', los: 14,
    admitDate: '2026-07-16', expectedDischarge: '2026-08-15',
    counselor: SARAH, physician: DR_CHEN,
    flags: [flag('AMA', 'Left AMA Day 5 — returned Day 7 voluntarily'), flag('Risk', 'ACE score 7 — trauma-informed care protocol active'), flag('Medication', 'Methadone induction — daily observed dosing')],
    lastUa: 'Positive (MET)', mood: 4, craving: 7,
    notes: [
      n('p32n1', '2026-07-29 13:00', 'Individual', SARAH, 'BIRP', 'Destiny attended session following 2-day AMA episode. Client returned voluntarily — significant therapeutic alliance indicator. Explored AMA trigger (phone call from using acquaintance). Intervention: safety planning reinforced; reviewed consequences of return to use. Response: client tearful — expressed relief at returning. Modified phone privileges per policy. Plan: daily check-ins for next 7 days; engage family support.'),
      n('p32n2', '2026-07-26 15:00', 'Group', JAMES, 'DAP', 'Group topic: Managing Relationships in Recovery. Destiny participated meaningfully — disclosed history of abusive relationship connected to opioid use. Group responded with appropriate support. No safety concerns raised. Assessment: therapeutic disclosure in safe container — productive. Plan: coordinate individual follow-up with Sarah.'),
      n('p32n3', '2026-07-23 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Methadone dose titrating. Reports improved withdrawal control. Depression persistent. O: Methadone 45mg QD (Day 7). PHQ-9: 17 (moderate-severe). BP 110/68. A: OUD on methadone stabilization; MDD requiring psychiatric evaluation. P: Refer to psychiatry for antidepressant consideration; increase to Methadone 55mg tomorrow.'),
      n('p32n4', '2026-07-18 08:00', 'Nursing', LISA_RN, 'DAP', 'Assisted with methadone daily dosing protocol. Observed medication ingestion. Client cooperative. Education on methadone safety, interactions, and overdose risk reviewed. Emergency contact updated in chart. Client expressed appreciation for nursing support.'),
    ],
    goals: [
      g('p32g1', 'Substance Use', 'IV opioid use — 3 prior overdoses; trauma-driven use', 'Remain in residential treatment; transition to methadone maintenance', 'Complete 30-day residential; attend methadone clinic daily', 'In Progress', '2026-08-15'),
      g('p32g2', 'Mental Health', 'MDD and complex trauma driving relapse cycle', 'Reduce PHQ-9 below 10; process core trauma in therapy', 'Attend 3 individual sessions/week; complete safety plan', 'In Progress', '2026-09-01'),
    ],
    nextAppointment: 'Today, 10:00 AM — Methadone dosing', bed: '1C', status: 'Occupied',
  },

  // p33
  {
    id: 'p33', mrn: 'MRN-14302', firstName: 'Patrick', lastName: "O'Brien",
    dob: '1985-09-07', age: 40, gender: 'M',
    insurance: 'Cigna',
    program: 'IOP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Major Depressive Disorder (Recurrent, Moderate)'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 72, amaRisk: 'Low', los: 55,
    admitDate: '2026-06-05', expectedDischarge: '2026-09-05',
    counselor: TAMARA, physician: DR_STONE,
    flags: [flag('Success', '45-day AA coin received'), flag('Insurance', 'Cigna auth through 9/5')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      n('p33n1', '2026-07-28 18:00', 'Individual', TAMARA, 'BIRP', 'Patrick shared that he has secured a new job offer — first employment in 18 months. Behavior: animated, confident. Expressed anxiety about managing work stress without alcohol. Intervention: developed specific workplace coping plan (scheduled breaks, sober colleague identified, 10-min mindfulness between meetings). Response: client engaged; wrote plan in journal. Plan: role-play difficult work social situations.'),
      n('p33n2', '2026-07-24 18:00', 'Group', MARIA, 'DAP', 'Evening IOP group — employment re-entry theme. Patrick shared job offer news. Group celebrated. Facilitated discussion on sobriety at work events. Patrick shared specific strategies with group. Assessment: strong peer modeling; meaningful contribution to group learning.'),
      n('p33n3', '2026-07-15 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 55 days sober — reports best stretch in 10 years. Depression lifting — PHQ-9 now 6 (down from 16 at admission). O: LFTs normal — GGT 28. Sertraline 100mg tolerating well. A: AUD in sustained remission; MDD responding to sertraline plus sobriety. P: Continue current regimen; return in 4 weeks.'),
      n('p33n4', '2026-07-01 09:00', 'Case Management', 'Patricia Moore, LCSW-C', 'DAP', 'Supported job search — resume reviewed, LinkedIn updated. Connected to MD Division of Labor job placement program. Coordinated with Cigna — IOP authorization extended to September 5. Identified IOP-compatible work schedule with new employer. Patient progressing toward discharge independence.'),
    ],
    goals: [
      g('p33g1', 'Substance Use', '10+ year AUD — multiple residential stays', 'Achieve 1-year continuous sobriety with IOP and AA support', 'Complete IOP 3× weekly; obtain 60-day AA coin', 'In Progress', '2026-09-05'),
      g('p33g2', 'Employment', 'Long-term unemployment exacerbating depression and relapse risk', 'Return to full-time employment; maintain job for 3 months', 'Accept job offer; disclose to HR per EAP guidance', 'In Progress', '2026-08-15'),
    ],
    nextAppointment: '2026-08-01, 6:00 PM — IOP Group',
  },

  // p34
  {
    id: 'p34', mrn: 'MRN-12915', firstName: 'Aaliyah', lastName: 'Grant',
    dob: '2007-05-03', age: 19, gender: 'F',
    insurance: 'Priority Partners (Johns Hopkins)',
    program: 'OP',
    primaryDiagnosis: 'Cannabis Use Disorder (Moderate)',
    coOccurring: ['ADHD', 'Social Anxiety Disorder'],
    asam: { d1: 1, d2: 0, d3: 1, d4: 2, d5: 2, d6: 2 },
    recoveryScore: 68, amaRisk: 'Low', los: 67,
    admitDate: '2026-05-24', expectedDischarge: '2026-10-24',
    counselor: MARIA, physician: DR_STONE,
    flags: [flag('Success', 'Enrolled in community college — first semester')],
    lastUa: 'Negative', mood: 7, craving: 3,
    notes: [
      n('p34n1', '2026-07-28 15:00', 'Individual', MARIA, 'BIRP', 'Aaliyah reports first week of college classes "overwhelming but manageable." Social anxiety triggered in large lecture hall — used 4-7-8 breathing in-seat. Cannabis craving arose on campus (peers smoking) — called sponsor. Behavior: self-aware, proactive coping. Intervention: reinforced approach. Response: client motivated by academic goals. Plan: create campus coping card for high-risk spots.'),
      n('p34n2', '2026-07-21 16:00', 'Individual', MARIA, 'BIRP', 'Pre-college session — explored fears and motivations. Identified academic success as primary motivation for sobriety. ADHD management discussed: Adderall 20mg XR on schedule, no sharing with peers (addressed directly). Completed AUDIT-C: score 1 (minimal alcohol risk). Canvas coping toolkit created.'),
      n('p34n3', '2026-07-07 10:00', 'Medical', DR_STONE, 'SOAP', 'S: Cannabis free 44 days. ADHD symptoms better managed with Adderall. Social anxiety persistent but improving with therapy. O: PHQ-A 4; GAD-7 8. Adderall 20mg XR — therapeutic effect. A: CUD in remission; ADHD controlled; social anxiety improving. P: Continue current plan; college transition monitoring.'),
    ],
    goals: [
      g('p34g1', 'Substance Use', 'Daily cannabis use since age 15 — interfering with education and development', 'Maintain cannabis abstinence through college first year', 'Attend OP weekly; provide clean UA monthly; call sponsor when craving', 'In Progress', '2026-10-24'),
      g('p34g2', 'Education', 'Cannabis use and ADHD disrupting academic progress', 'Complete first semester of community college with GPA ≥ 2.5', 'Attend all classes; use academic support center; disclose ADHD to disability office', 'In Progress', '2026-12-15'),
    ],
    nextAppointment: '2026-08-04, 3:00 PM — OP Session',
  },

  // p35
  {
    id: 'p35', mrn: 'MRN-11428', firstName: 'Henry', lastName: 'Fitzgerald',
    dob: '1968-01-25', age: 58, gender: 'M',
    insurance: 'BlueCross BlueShield',
    program: 'Residential',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Alcohol-Related Cirrhosis (Child-Pugh A)', 'Major Depressive Disorder'],
    asam: { d1: 2, d2: 3, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 42, amaRisk: 'Med', los: 21,
    admitDate: '2026-07-09', expectedDischarge: '2026-08-08',
    counselor: KEVIN, physician: DR_LEE,
    flags: [flag('Medical', 'Cirrhosis — hepatology co-management'), flag('Medical', 'Lactulose BID for hepatic encephalopathy prevention')],
    lastUa: 'Negative', mood: 5, craving: 5,
    notes: [
      n('p35n1', '2026-07-29 10:00', 'Medical', DR_LEE, 'SOAP', 'S: No alcohol cravings reported. Fatigue improving. Mild abdominal discomfort. O: Child-Pugh score A (5pts). Bilirubin 1.8, INR 1.3. BP 122/78. Lactulose effective — no asterixis. A: Alcohol-related cirrhosis, medically stable; AUD in remission. P: Continue lactulose BID; spironolactone 50mg for mild ascites; hepatology follow-up Aug 20.'),
      n('p35n2', '2026-07-25 14:00', 'Individual', KEVIN, 'BIRP', 'Henry explored the relationship between his liver diagnosis and motivation for sobriety. "The doctor said another drink could kill me — I finally believe it." Behavior: somber but engaged. Intervention: mortality salience as motivational tool — used compassionately. Explored living will and legacy. Response: client tearful; wrote letter to grandchildren. Plan: legacy-based values clarification work.'),
      n('p35n3', '2026-07-20 09:00', 'Group', TAMARA, 'DAP', 'Attended medical issues in recovery group. Henry shared his cirrhosis diagnosis with peers. Powerful disclosure — group responded with concern and support. Several peers disclosed their own medical consequences of drinking for first time. Assessment: Henry\'s vulnerability catalyzed meaningful group disclosure.'),
      n('p35n4', '2026-07-12 08:00', 'Nursing', LISA_RN, 'DAP', 'Medication reconciliation complete. Lactulose, spironolactone, thiamine 100mg administered. Patient educated on signs of hepatic encephalopathy — knows to report confusion, tremor, yellowing. Agreeable to daily nursing check-ins. Weight stable: 184 lbs. Mild pedal edema noted — reported to Dr. Lee.'),
    ],
    goals: [
      g('p35g1', 'Substance Use', '35-year AUD — cirrhosis requiring lifelong abstinence', 'Maintain lifelong abstinence from alcohol; accept medical reality of cirrhosis', 'Complete residential; establish hepatology follow-up in community; identify home AA group', 'In Progress', '2026-08-08'),
      g('p35g2', 'Medical', 'Cirrhosis requiring active monitoring and medication adherence', 'Stabilize liver function; prevent progression to Child-Pugh B', 'Attend all hepatology appointments; take prescribed medications daily', 'In Progress', '2026-12-01'),
    ],
    nextAppointment: 'Tomorrow, 10:00 AM — Medical rounds', bed: '4A', status: 'Occupied',
  },

  // p36
  {
    id: 'p36', mrn: 'MRN-10301', firstName: 'Kezia', lastName: 'Okonkwo',
    dob: '1991-08-14', age: 34, gender: 'F',
    insurance: 'Aetna Better Health of Maryland',
    program: 'PHP',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['PTSD (Intimate Partner Violence)', 'Major Depressive Disorder'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 44, amaRisk: 'Med', los: 19,
    admitDate: '2026-07-11', expectedDischarge: '2026-09-11',
    counselor: SARAH, physician: DR_CHEN,
    flags: [flag('Risk', 'IPV history — safety plan active; partner contact restricted'), flag('Medication', 'Buprenorphine 16mg QD — stable')],
    lastUa: 'Positive (BUP prescribed)', mood: 5, craving: 5,
    notes: [
      n('p36n1', '2026-07-29 11:00', 'Individual', SARAH, 'BIRP', 'Session focused on IPV safety planning. Client has obtained protective order — confirmed with case manager. Explored feelings of shame around IPV and OUD (both experienced as character flaws vs. trauma responses). Intervention: psychoeducation on trauma-addiction link; externalizing the problem. Response: client visibly relieved — "I\'m not weak, I was surviving." Plan: introduce trauma narrative work in 2 sessions.'),
      n('p36n2', '2026-07-25 10:00', 'Case Management', 'Patricia Moore, LCSW-C', 'DAP', 'Coordinated with Maryland Network Against Domestic Violence. Safe housing identified — transitional living approved post-discharge. Legal aid consultation completed. Protective order in place. Children (2) with maternal grandmother — stable. Discharge plan updated to include DV shelter linkage if transitional housing falls through.'),
      n('p36n3', '2026-07-20 14:00', 'Medical', DR_CHEN, 'SOAP', 'S: No illicit opioids — taking Buprenorphine as prescribed. PHQ-9: 14 (moderate). O: Vital signs stable. Buprenorphine 16mg QD confirmed by pill count. A: OUD on MAT, stable; MDD — sertraline 50mg initiated. P: Titrate sertraline to 100mg at 2 weeks; refer to trauma-focused therapy track.'),
      n('p36n4', '2026-07-14 09:00', 'Group', MARIA, 'DAP', 'Women\'s processing group (5 participants). Kezia listened attentively; did not share today. Made eye contact and nodded in response to peers discussing IPV. Assessment: engagement through witnessing — therapeutically appropriate given recent disclosure. Plan: encourage voluntary sharing when ready.'),
    ],
    goals: [
      g('p36g1', 'Substance Use', 'Opioid use intertwined with IPV escape and pain management', 'Maintain sobriety from illicit opioids; stable on MAT for 12 months', 'Attend PHP daily; take buprenorphine as prescribed; weekly MAT check-in', 'In Progress', '2026-09-11'),
      g('p36g2', 'Safety', 'Active IPV risk — housing instability post-separation', 'Establish safe, stable housing independent from abusive partner', 'Complete protective order; accept transitional housing placement', 'In Progress', '2026-08-01'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  // p37
  {
    id: 'p37', mrn: 'MRN-09144', firstName: 'Isaac', lastName: 'Morales',
    dob: '1997-12-11', age: 28, gender: 'M',
    insurance: 'Maryland Medicaid / HealthChoice',
    program: 'IOP',
    primaryDiagnosis: 'Stimulant Use Disorder (Amphetamine-Type, Moderate)',
    coOccurring: ['Bipolar II Disorder'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 65, amaRisk: 'Low', los: 48,
    admitDate: '2026-06-12', expectedDischarge: '2026-09-12',
    counselor: DAVID, physician: DR_STONE,
    flags: [flag('Insurance', 'Medicaid HealthChoice — prior auth active')],
    lastUa: 'Negative', mood: 7, craving: 3,
    notes: [
      n('p37n1', '2026-07-28 18:00', 'Individual', DAVID, 'BIRP', 'Isaac reports mood stable for 3 weeks — longest euthymic stretch since Bipolar II diagnosis. Amphetamine-free 48 days. Behavior: thoughtful, reflective. Exploring how amphetamines "self-medicated" hypomanic energy and crash cycles. Intervention: mood charting tool introduced — will track daily. Response: intellectually engaged; motivated by data. Plan: share mood chart with psychiatry at next appointment.'),
      n('p37n2', '2026-07-22 18:00', 'Group', MARIA, 'DAP', 'IOP evening group — managing mental health and recovery. Isaac shared his Bipolar II diagnosis with group for first time. Articulated how undiagnosed bipolar drove amphetamine use. Peers engaged — 2 others disclosed mental health diagnoses. Assessment: psychoeducation occurring naturally through peer disclosure.'),
      n('p37n3', '2026-07-10 11:00', 'Medical', DR_STONE, 'SOAP', 'S: Mood stable 2 weeks. No stimulant use. O: Lamotrigine 200mg QD — therapeutic. PHQ-9: 5. GAD-7: 3. A: Bipolar II well-managed; SUD in remission. P: Continue lamotrigine; lithium level check next visit. IOP continuation appropriate.'),
    ],
    goals: [
      g('p37g1', 'Substance Use', 'Amphetamine use cycling with bipolar episodes', 'Achieve 6-month stimulant abstinence with mood stability', 'Complete IOP; maintain medication compliance; weekly mood chart', 'In Progress', '2026-09-12'),
    ],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  // p38
  {
    id: 'p38', mrn: 'MRN-08022', firstName: 'Vanessa', lastName: 'Turner',
    dob: '1979-03-19', age: 47, gender: 'F',
    insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'Residential',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['PTSD (Combat-Related, Veteran)', 'Chronic Pain (Lower Back)'],
    asam: { d1: 2, d2: 2, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 47, amaRisk: 'Med', los: 11,
    admitDate: '2026-07-19', expectedDischarge: '2026-08-18',
    counselor: TAMARA, physician: DR_LEE,
    flags: [flag('Medical', 'Veteran — VA coordination active'), flag('Medical', 'Chronic pain — non-opioid pain management protocol')],
    lastUa: 'Negative', mood: 5, craving: 6,
    notes: [
      n('p38n1', '2026-07-29 14:00', 'Individual', TAMARA, 'BIRP', 'Vanessa disclosed combat experiences in Iraq (2004-2006) for first time in treatment. Night terrors waking her 2-3×/night. Behavior: guarded initially, opened with validation. Intervention: normalize trauma response; psychoeducation on PTSD-AUD link. Response: visible relief at being "believed." Plan: refer to Seeking Safety group track; coordinate with VA PTSD clinic.'),
      n('p38n2', '2026-07-26 10:00', 'Medical', DR_LEE, 'SOAP', 'S: Alcohol-free 11 days. Night terrors 2-3×/week. Chronic back pain 5-6/10. O: CIWA score 0 — detox complete. BP 126/80. Prazosin 2mg QHS initiated for PTSD nightmares. A: AUD in early remission; PTSD requiring treatment; chronic pain managed non-opioid. P: Increase prazosin to 4mg if tolerated; PT consult for back pain; VA liaison contacted.'),
      n('p38n3', '2026-07-22 15:00', 'Group', JAMES, 'DAP', 'Veterans-focused group (3 participants). Vanessa attended for first time. Listened. Did not disclose but connected with peers around service experiences. Group leader normalized trauma responses. Assessment: appropriate fit for this specialty track. Plan: continue weekly veterans group.'),
      n('p38n4', '2026-07-20 09:00', 'Case Management', 'Patricia Moore, LCSW-C', 'DAP', 'Coordinated with VA Maryland HCS (Baltimore). VA PTSD program has 3-week waitlist — application submitted. VA disability rating review pending. Identified VA housing support options post-discharge. Connected to Volunteers of America veteran housing program as backup. FMLA paperwork submitted to VA employer.'),
    ],
    goals: [
      g('p38g1', 'Substance Use', 'Alcohol use as primary PTSD self-medication strategy', 'Achieve sustained alcohol abstinence; engage in PTSD treatment', 'Complete residential; transition to VA PTSD program; attend AA weekly', 'In Progress', '2026-08-18'),
      g('p38g2', 'Trauma', 'Untreated combat PTSD driving AUD and social isolation', 'Complete evidence-based PTSD treatment; reduce PCL-5 by 30%', 'Enroll in VA PTSD program; complete Seeking Safety curriculum', 'In Progress', '2026-10-01'),
    ],
    nextAppointment: 'Tomorrow, 2:00 PM — Individual', bed: '1D', status: 'Occupied',
  },

  // p39
  {
    id: 'p39', mrn: 'MRN-07011', firstName: 'Darius', lastName: 'Mitchell',
    dob: '1993-07-04', age: 33, gender: 'M',
    insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'PHP',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['Hepatitis C (Genotype 1a — treatment eligible)', 'Major Depressive Disorder'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 52, amaRisk: 'Med', los: 31,
    admitDate: '2026-06-29', expectedDischarge: '2026-09-29',
    counselor: KEVIN, physician: DR_CHEN,
    flags: [flag('Medical', 'Hep C treatment initiated — Harvoni 8-week course'), flag('Insurance', 'United — HCV treatment auth approved')],
    lastUa: 'Positive (BUP prescribed)', mood: 6, craving: 4,
    notes: [
      n('p39n1', '2026-07-28 11:00', 'Individual', KEVIN, 'BIRP', 'Darius reports side effects from Harvoni minimal — mild fatigue. Mood improving with OUD stabilization. Behavior: engaged and curious. Explored what sobriety would look like at 1 year. Client described wanting to be "a father his son can count on." Intervention: future-self visualization exercise. Response: client emotional but focused. Plan: introduce parenting in recovery curriculum.'),
      n('p39n2', '2026-07-23 14:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 3 of Harvoni — fatigue minimal. Buprenorphine 16mg stable. No illicit opioids. O: HCV RNA pending (4-week viral load check). LFTs: ALT 38 (down from 89). Buprenorphine 16mg therapeutic. A: OUD on MAT; HCV Genotype 1a — responding to treatment. P: Continue HCV treatment 5 more weeks; recheck viral load.'),
      n('p39n3', '2026-07-17 10:00', 'Case Management', 'Robert Davis, CPC-AD', 'DAP', 'Insurance prior auth for Harvoni approved (UHC Community Plan). Coordinated with hepatology at UM Medical Center. Child support modifications paused pending treatment — attorney coordinating. SNAP and housing assistance applications submitted. PHP continuation authorized through September 29.'),
      n('p39n4', '2026-07-10 15:00', 'Group', JAMES, 'DAP', 'PHP process group. Darius shared his Hep C diagnosis with group — expressed shame. Group normalized; 2 peers disclosed their own HCV status. Powerful group moment. Assessment: stigma reduction occurring through peer disclosure. Plan: invite Darius to share treatment progress updates in future groups.'),
    ],
    goals: [
      g('p39g1', 'Substance Use', 'OUD with HCV complication — IV use history', 'Achieve 12-month OUD remission on MAT; prevent HCV transmission', 'Take buprenorphine daily; complete Harvoni course; safe use education', 'In Progress', '2026-09-29'),
      g('p39g2', 'Medical', 'HCV Genotype 1a requiring treatment to prevent liver disease', 'Achieve HCV SVR12 (sustained virologic response)', 'Complete 8-week Harvoni course; attend all hepatology appointments', 'In Progress', '2026-08-20'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  // p40
  {
    id: 'p40', mrn: 'MRN-05988', firstName: 'Samantha', lastName: 'Cruz',
    dob: '2002-04-27', age: 24, gender: 'F',
    insurance: 'Priority Partners (Johns Hopkins)',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['Major Depressive Disorder', 'ADHD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 3, d5: 4, d6: 4 },
    recoveryScore: 36, amaRisk: 'High', los: 7,
    admitDate: '2026-07-23', expectedDischarge: '2026-08-22',
    counselor: SARAH, physician: DR_CHEN,
    flags: [flag('AMA', 'AMA risk — assessed daily'), flag('Medication', 'Buprenorphine induction Day 3 — still titrating')],
    lastUa: 'Positive (BUP+OXY — last illicit use Day 1)', mood: 3, craving: 8,
    notes: [
      n('p40n1', '2026-07-29 10:00', 'Individual', SARAH, 'BIRP', 'Day 6 individual session. Samantha still expressing ambivalence — "I don\'t know if I want this." Behavior: flat affect, minimal eye contact. Intervention: decisional balance exercise — pros/cons of use vs. recovery. One clear pro of recovery emerged: younger brother. Response: client teared up mentioning her brother. Plan: involve family in treatment — contact mother for family session.'),
      n('p40n2', '2026-07-26 08:00', 'Nursing', LISA_RN, 'DAP', 'Buprenorphine titration: 8mg Day 1, 12mg Day 2, 16mg today — withdrawal adequately controlled (COWS 2). Patient sleeping 5-6 hours. Eating about 60% of meals. Cooperative but guarded with staff. Observed medication ingestion. No signs of diversion.'),
      n('p40n3', '2026-07-25 14:00', 'Medical', DR_CHEN, 'SOAP', 'S: Withdrawal symptoms controlled on Buprenorphine 16mg. Cravings high. Mood depressed. O: COWS 2. BP 112/70. PHQ-9: 19 (severe). A: OUD — early induction; MDD severe. P: Hold antidepressant initiation until 2 weeks stable; daily safety monitoring; ADHD evaluation deferred 30 days.'),
    ],
    goals: [
      g('p40g1', 'Substance Use', 'Severe OUD — recent near-overdose; multiple prior detox attempts', 'Complete residential and transition to PHP; 30-day sobriety milestone', 'Complete 30-day residential; accept MAT; engage in individual therapy', 'In Progress', '2026-08-22'),
    ],
    nextAppointment: 'Today, 2:00 PM — Nursing check-in', bed: '2B', status: 'Occupied',
  },

  // p41
  {
    id: 'p41', mrn: 'MRN-04831', firstName: 'Walter', lastName: 'Edmonds',
    dob: '1971-10-01', age: 54, gender: 'M',
    insurance: 'Self-Pay',
    program: 'IOP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Type 2 Diabetes', 'Peripheral Neuropathy'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 61, amaRisk: 'Low', los: 60,
    admitDate: '2026-05-31', expectedDischarge: '2026-09-30',
    counselor: DAVID, physician: DR_LEE,
    flags: [flag('Medical', 'DM2 — self-monitoring blood glucose per protocol'), flag('Insurance', 'Sliding scale fee — scholarship applied')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      n('p41n1', '2026-07-28 18:00', 'Individual', DAVID, 'BIRP', 'Walter shares 60 days sober today. First 60-day milestone in 20 years. Behavior: subdued but clearly pleased. Explored what is different this time — "I have a reason — my granddaughter was born last month." Intervention: values-clarification exercise connecting sobriety to grandfather role. Response: client committed to seeing granddaughter grow up sober. Plan: grandfather narrative exercise next session.'),
      n('p41n2', '2026-07-21 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 53 days alcohol-free. Blood glucose improving. Neuropathy tingling unchanged. O: HbA1c 7.1 (down from 9.3 at admission). Peripheral sensation testing: decreased in feet bilaterally. A: AUD in sustained remission; DM2 improving with sobriety; peripheral neuropathy — likely alcohol-related; may stabilize. P: Increase metformin to 1000mg BID; neurology consult for neuropathy.'),
      n('p41n3', '2026-07-10 18:00', 'Group', TAMARA, 'DAP', 'Medical challenges in recovery theme group. Walter shared DM2 story — how drinking raised his blood sugars dangerously. Peers engaged. Assessment: excellent personal narrative connecting medical consequences to behavior. Plan: invite Walter to lead a portion of next medical consequences group.'),
    ],
    goals: [
      g('p41g1', 'Substance Use', '20+ year AUD — medical consequences now driving motivation', 'Achieve 12-month sobriety; resolve alcohol-related medical complications', 'Complete IOP; attend AA twice weekly; diabetes self-management education', 'In Progress', '2026-09-30'),
    ],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  // p42
  {
    id: 'p42', mrn: 'MRN-03714', firstName: 'Alicia', lastName: 'Drummond',
    dob: '1987-06-08', age: 39, gender: 'F',
    insurance: 'Maryland Medicaid / HealthChoice',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['Borderline Personality Disorder', 'Major Depressive Disorder'],
    asam: { d1: 2, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 33, amaRisk: 'High', los: 16,
    admitDate: '2026-07-14', expectedDischarge: '2026-08-13',
    counselor: SARAH, physician: DR_CHEN,
    flags: [flag('Behavioral', 'BPD — staff splitting behavior documented; treatment team briefed'), flag('Risk', '3 prior suicide attempts — safety monitoring active')],
    lastUa: 'Positive (BUP prescribed)', mood: 4, craving: 6,
    notes: [
      n('p42n1', '2026-07-29 13:30', 'Individual', SARAH, 'BIRP', 'Session focused on emotion regulation. Alicia experienced intense anger toward roommate (staff mediated). Intervention: DBT TIPP skill practiced in real-time (cold water on face, paced breathing). Response: affect deescalated within 8 minutes. Client expressed surprise at effectiveness. "I didn\'t think this stuff would work." Plan: reinforce DBT diary card; add TIPP to crisis plan.'),
      n('p42n2', '2026-07-26 11:00', 'Group', JAMES, 'DAP', 'Attended DBT skills group. Participated in mindfulness exercise. Had brief disagreement with peer over group rules — resolved with staff facilitation. No escalation. Assessment: appropriate conflict resolution — improvement from Week 1 incident. Plan: continue DBT milieu.'),
      n('p42n3', '2026-07-22 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine stable. Mood labile — 3 emotional crises this week per nursing. No SI/HI currently. O: Buprenorphine 16mg QD. PHQ-9: 21 (severe). A: OUD stable on MAT; BPD — DBT milieu appropriate; MDD severe. P: Initiate sertraline 50mg; consult with psychiatry re: BPD and MDD management; safety contract daily.'),
      n('p42n4', '2026-07-18 15:00', 'Nursing', LISA_RN, 'DAP', 'Completed daily safety check. Patient denied SI/HI. Safety plan reviewed and verbalized. Medications administered — no refusal. Observed for medication ingestion. Milieu observation: patient had 2 positive peer interactions today. Behavioral contract signed. Notified treatment team.'),
    ],
    goals: [
      g('p42g1', 'Substance Use', 'OUD using heroin/fentanyl to manage BPD emotional dysregulation', 'Maintain sobriety on MAT; apply DBT skills during crises', 'Complete residential; daily DBT diary card; safety plan activation practice', 'In Progress', '2026-08-13'),
      g('p42g2', 'Mental Health', 'BPD and MDD creating high relapse and safety risk', 'Complete DBT skills curriculum; reduce crisis frequency to < 1/week', 'Attend all DBT groups; practice 1 skill daily; safety plan active', 'In Progress', '2026-09-01'),
    ],
    nextAppointment: 'Today, 3:30 PM — DBT Skills Group', bed: '2C', status: 'Occupied',
  },

  // p43
  {
    id: 'p43', mrn: 'MRN-02597', firstName: 'Fredrick', lastName: 'Hawkins',
    dob: '1980-09-30', age: 45, gender: 'M',
    insurance: 'Aetna Better Health of Maryland',
    program: 'PHP',
    primaryDiagnosis: 'Cocaine Use Disorder (Severe)',
    coOccurring: ['Major Depressive Disorder', 'Hypertension'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 58, amaRisk: 'Low', los: 25,
    admitDate: '2026-07-05', expectedDischarge: '2026-09-05',
    counselor: KEVIN, physician: DR_STONE,
    flags: [flag('Medical', 'HTN — amlodipine 5mg initiated at admission'), flag('Insurance', 'Aetna Better Health auth through 9/5')],
    lastUa: 'Negative', mood: 6, craving: 4,
    notes: [
      n('p43n1', '2026-07-28 10:00', 'Individual', KEVIN, 'BIRP', 'Fredrick reports strong week — no cocaine cravings since Day 20. Explored correlation with improved sleep (7 hours vs. 3-4 hours in active use). Behavior: focused, clear-eyed. Reviewed how cocaine use enabled him to mask depression while believing he was "high-functioning." Intervention: depression psychoeducation — cocaine crash worsening MDD. Response: insight-oriented; connecting dots between substances and mood.'),
      n('p43n2', '2026-07-22 14:00', 'Medical', DR_STONE, 'SOAP', 'S: Cocaine free 17 days. Blood pressure controlled. Sleep improving. O: BP 128/82 (admission 158/96). PHQ-9: 10 (down from 18). Amlodipine 5mg effective. A: CUD in remission; HTN controlled; MDD improving. P: Add bupropion SR 150mg for MDD and cocaine craving reduction (dual indication); increase to 300mg if tolerated.'),
      n('p43n3', '2026-07-14 11:00', 'Group', TAMARA, 'DAP', 'PHP morning group. Fredrick shared insight about cocaine enabling his professional persona — "I thought coke made me better at my job. I was wrong." Group engaged deeply. Several peers connected to similar performance-enhancement narratives. Assessment: valuable group contribution.'),
    ],
    goals: [
      g('p43g1', 'Substance Use', 'Cocaine use masked MDD and fueled false high-performance belief', 'Achieve 12-month cocaine abstinence; manage depression without substances', 'Complete PHP; attend NA weekly; medication compliance', 'In Progress', '2026-09-05'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  // p44
  {
    id: 'p44', mrn: 'MRN-01482', firstName: 'Yolanda', lastName: 'Pierce',
    dob: '1996-01-14', age: 30, gender: 'F',
    insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'IOP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Panic Disorder', 'Social Anxiety Disorder'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 2, d5: 2, d6: 2 },
    recoveryScore: 74, amaRisk: 'Low', los: 50,
    admitDate: '2026-06-10', expectedDischarge: '2026-09-10',
    counselor: MARIA, physician: DR_STONE,
    flags: [flag('Success', '45-day chip received — first milestone ever')],
    lastUa: 'Negative', mood: 8, craving: 2,
    notes: [
      n('p44n1', '2026-07-28 17:30', 'Individual', MARIA, 'BIRP', 'Session 12 of IOP individual track. Yolanda attended a work happy hour and drank sparkling water without difficulty. "I practiced the conversation in my head beforehand like we talked about." Behavior: proud, energized. Intervention: positive reinforcement; reviewed what made the event successful. Plan: gradually increase social exposure while maintaining coping skills.'),
      n('p44n2', '2026-07-21 11:00', 'Medical', DR_STONE, 'SOAP', 'S: 45 days sober. Panic attacks now 1-2/week (vs. daily at admission). O: PHQ-9: 3. GAD-7: 7. Buspirone 15mg BID effective. A: AUD in sustained remission; panic disorder improving; social anxiety — continued CBT exposure work. P: Discuss SSRI addition if GAD-7 does not continue declining.'),
      n('p44n3', '2026-07-15 18:00', 'Group', TAMARA, 'DAP', 'Evening IOP group on social situations in recovery. Yolanda led a discussion about her strategies for sober social events. Peers engaged — requested more specific tactics. Assessment: natural peer educator emerging. Plan: consider alumni peer mentor role at 6 months.'),
    ],
    goals: [
      g('p44g1', 'Substance Use', 'Alcohol used to manage panic and social anxiety for 8 years', 'Achieve 6-month sobriety; manage anxiety with CBT and medication', 'Complete IOP; weekly AA; anxiety coping skills practice daily', 'In Progress', '2026-09-10'),
    ],
    nextAppointment: '2026-08-01, 5:30 PM — IOP',
  },

  // p45
  {
    id: 'p45', mrn: 'MRN-00421', firstName: 'Jerome', lastName: 'Butler',
    dob: '1983-05-18', age: 43, gender: 'M',
    insurance: 'MedStar Family Choice',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['PTSD (Multiple Trauma)', 'Chronic Pain Syndrome'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 40, amaRisk: 'Med', los: 13,
    admitDate: '2026-07-17', expectedDischarge: '2026-08-16',
    counselor: TAMARA, physician: DR_CHEN,
    flags: [flag('Medical', 'Chronic pain — pain management team consulted; non-opioid protocol'), flag('Medication', 'Methadone 65mg QD — dose stable')],
    lastUa: 'Positive (MET prescribed)', mood: 5, craving: 5,
    notes: [
      n('p45n1', '2026-07-29 14:00', 'Individual', TAMARA, 'BIRP', 'Jerome engaged in trauma narrative work for first time. Disclosed childhood sexual abuse and later assault — never previously disclosed in treatment. Behavior: guarded but deliberate in disclosure. Intervention: titrated trauma exposure; maintained window of tolerance. Response: client managed affect appropriately; no dissociation. Plan: continue Seeking Safety curriculum; explore EMDR readiness.'),
      n('p45n2', '2026-07-25 11:00', 'Medical', DR_CHEN, 'SOAP', 'S: Methadone dose stable. Chronic pain 4/10 (down from 7/10 with gabapentin). Sleep 5-6 hours. O: Methadone 65mg QD observed. BP 134/84. Gabapentin 600mg TID for pain. A: OUD on MMT; chronic pain partially controlled. P: Refer to PT for TENS therapy; acupuncture consult offered (VA covered); pain psychology eval requested.'),
      n('p45n3', '2026-07-20 09:00', 'Group', JAMES, 'DAP', 'Trauma-informed group — 6 participants. Jerome shared that his chronic pain started after an injury connected to trauma. Group responded with empathy. Assessment: trauma disclosure in therapeutic context — appropriate. Plan: ensure individual follow-up occurs within 24 hours of any group disclosure.'),
      n('p45n4', '2026-07-18 14:00', 'Case Management', 'Patricia Moore, LCSW-C', 'DAP', 'Pain management plan formalized — no opioid prescriptions; gabapentin, TENS, PT authorized. Coordinated with Workers\' Compensation for chronic pain claim. Identified housing — current rental secure. Children with ex-wife — visitation schedule compliant. Discharge planning initiated: OTP enrollment confirmed for post-discharge MMT.'),
    ],
    goals: [
      g('p45g1', 'Substance Use', 'OUD driven by chronic pain and unresolved trauma', 'Achieve stable MMT and 6-month sobriety from illicit opioids', 'Complete residential; enroll in OTP for MMT; non-opioid pain protocol', 'In Progress', '2026-08-16'),
      g('p45g2', 'Trauma', 'Multiple unresolved traumas driving relapse cycle and pain amplification', 'Process core trauma through EMDR; reduce PTSD avoidance behaviors', 'Complete Seeking Safety curriculum; assess EMDR readiness', 'In Progress', '2026-09-15'),
    ],
    nextAppointment: 'Tomorrow, 2:00 PM — Pain Psychology', bed: '3B', status: 'Occupied',
  },

  // p46
  {
    id: 'p46', mrn: 'MRN-99204', firstName: 'Christina', lastName: 'Park',
    dob: '1999-11-03', age: 26, gender: 'F',
    insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'PHP',
    primaryDiagnosis: 'Severe Methamphetamine Use Disorder',
    coOccurring: ['ADHD (Combined Type)', 'Insomnia'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 49, amaRisk: 'Med', los: 20,
    admitDate: '2026-07-10', expectedDischarge: '2026-09-10',
    counselor: MARIA, physician: DR_LEE,
    flags: [flag('Medical', 'ADHD — stimulant therapy deferred until 30 days meth-free'), flag('Medication', 'Hydroxyzine 50mg QHS for sleep')],
    lastUa: 'Negative', mood: 6, craving: 5,
    notes: [
      n('p46n1', '2026-07-28 10:00', 'Individual', MARIA, 'BIRP', 'Christina reports first 20 consecutive meth-free days — longest stretch since age 21. Reports sluggishness and difficulty concentrating ("brain fog"). Educated on post-acute withdrawal syndrome (PAWS) — validated difficulty. Behavior: frustrated with slow recovery but engaged. Intervention: cognitive rehabilitation exercises introduced. Plan: coordinate with Dr. Lee on ADHD evaluation timeline.'),
      n('p46n2', '2026-07-23 14:00', 'Medical', DR_LEE, 'SOAP', 'S: Meth-free 13 days confirmed UA. Sleep improving with hydroxyzine — 6 hours. Concentration difficulty — PAWS vs. ADHD unclear. O: PHQ-9: 9. BP 118/74. A: MUD in remission (PHP); ADHD evaluation deferred — too early to distinguish from PAWS; insomnia improving. P: ADHD eval at 30-day mark; continue hydroxyzine; caffeine reduction counseled.'),
      n('p46n3', '2026-07-16 10:00', 'Group', JAMES, 'DAP', 'PHP morning group on managing meth cravings. Christina shared her "trigger map" — identified 6 high-risk situations. Group praised her specificity. Assessment: good insight into personal risk landscape. Plan: develop coping response for each trigger.'),
    ],
    goals: [
      g('p46g1', 'Substance Use', 'Severe MUD — daily use since age 21; self-medicating ADHD', 'Achieve 90 days meth abstinence; address ADHD with appropriate non-stimulant treatment', 'Complete PHP; provide clean UA at 30/60/90 days; ADHD eval at Day 30', 'In Progress', '2026-09-10'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  // p47
  {
    id: 'p47', mrn: 'MRN-98011', firstName: 'Reginald', lastName: 'Foster',
    dob: '1976-02-14', age: 50, gender: 'M',
    insurance: 'Cigna',
    program: 'IOP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: [],
    asam: { d1: 1, d2: 0, d3: 1, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 79, amaRisk: 'Low', los: 70,
    admitDate: '2026-05-21', expectedDischarge: '2026-09-21',
    counselor: DAVID, physician: DR_STONE,
    flags: [flag('Success', '60-day AA coin — home group commitment established')],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [
      n('p47n1', '2026-07-27 18:00', 'Individual', DAVID, 'BIRP', 'Session 14 — Reginald is the strongest progressor in current IOP cohort. Discussing step 9 work — making amends to adult children. Planning amends letter to eldest son. Behavior: humble, reflective. Intervention: supported amends planning; discussed expectations vs. outcomes. Response: client demonstrates mature sobriety thinking. Plan: draft amends letter this week; share in session.'),
      n('p47n2', '2026-07-20 18:00', 'Group', TAMARA, 'DAP', 'IOP group — Reginald shared his 60-day chip with pride. Described home group experience — becoming secretary. Positive modeling for newer group members. Assessment: approaching readiness for step-down to OP. Plan: discuss transition timeline with treatment team.'),
      n('p47n3', '2026-07-07 11:00', 'Medical', DR_STONE, 'SOAP', 'S: 70 days sober. No cravings. Sleep excellent. O: LFTs normal. GGT 18. BP 122/76. A: AUD in sustained remission — excellent response. P: Continue plan; discuss step-down to OP at 90-day mark. RTC 6 weeks.'),
    ],
    goals: [
      g('p47g1', 'Substance Use', 'Recurrent AUD — 2 prior residential stays; this attempt motivated by family', 'Achieve 12-month sobriety; complete 12 steps with sponsor', 'Complete IOP 3× weekly; AA home group weekly service commitment', 'In Progress', '2026-09-21'),
    ],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  // p48
  {
    id: 'p48', mrn: 'MRN-96888', firstName: 'Natalie', lastName: 'Greene',
    dob: '1992-07-22', age: 34, gender: 'F',
    insurance: 'Maryland Medicaid / HealthChoice',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['Bipolar I Disorder (Most Recent Episode: Depressed)', 'PTSD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 30, amaRisk: 'High', los: 6,
    admitDate: '2026-07-24', expectedDischarge: '2026-08-23',
    counselor: KEVIN, physician: DR_CHEN,
    flags: [flag('Psychiatric', 'Bipolar I — mood stabilizer initiated; psychiatry co-managing'), flag('Medical', 'Buprenorphine 8mg QD — Day 2 of induction')],
    lastUa: 'Positive (BUP+FENT)', mood: 2, craving: 9,
    notes: [
      n('p48n1', '2026-07-29 11:00', 'Medical', DR_CHEN, 'SOAP', 'S: Day 5 buprenorphine induction. Mood depressed. Suicidal ideation passive — no plan. O: Buprenorphine 16mg QD (titrated from 8mg). COWS 2. PHQ-9: 22 (severe). Valproate 500mg BID (Bipolar I). A: OUD in early induction; Bipolar I depressed — valproate loading. P: Check valproate level tomorrow; increase PHQ monitoring; safe environment maintained in residential.'),
      n('p48n2', '2026-07-28 14:00', 'Individual', KEVIN, 'BIRP', 'Brief supportive session — Natalie exhausted. Explored what brought her in ("I don\'t want to die — I have two kids"). Behavior: minimal but present. Intervention: motivational support; safety contract signed. Response: client accepted contract. Plan: increase session frequency to daily while stabilizing.'),
      n('p48n3', '2026-07-25 08:00', 'Nursing', LISA_RN, 'DAP', 'Safety check completed. Passive SI — no plan or intent verbalized. Room checked — no items of concern. Medications administered and observed. Patient slept 4 hours. Eating minimally. Vital signs stable. Notified Dr. Chen per SI monitoring protocol. Increased observation per plan.'),
    ],
    goals: [
      g('p48g1', 'Substance Use', 'Severe OUD with fentanyl — recent near-fatal overdose', 'Complete medical stabilization; achieve 30 days buprenorphine adherence', 'Complete residential; daily medication observation; safety contract active', 'In Progress', '2026-08-23'),
      g('p48g2', 'Psychiatric', 'Bipolar I depression and PTSD driving high-risk opioid use', 'Achieve mood stabilization; reduce passive SI; PHQ-9 < 10', 'Medication compliance; daily psychiatric monitoring; individual therapy 3×/week', 'In Progress', '2026-09-01'),
    ],
    nextAppointment: 'Today, 4:00 PM — Psychiatric check-in', bed: '3C', status: 'Occupied',
  },

  // p49
  {
    id: 'p49', mrn: 'MRN-95711', firstName: 'Elijah', lastName: 'Barnes',
    dob: '2005-03-01', age: 21, gender: 'M',
    insurance: 'Priority Partners (Johns Hopkins)',
    program: 'OP',
    primaryDiagnosis: 'Cannabis Use Disorder (Moderate)',
    coOccurring: ['Generalized Anxiety Disorder', 'Adjustment Disorder'],
    asam: { d1: 1, d2: 0, d3: 1, d4: 2, d5: 2, d6: 1 },
    recoveryScore: 72, amaRisk: 'Low', los: 84,
    admitDate: '2026-05-07', expectedDischarge: '2026-10-07',
    counselor: MARIA, physician: DR_STONE,
    flags: [flag('Success', 'First university semester completed sober')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      n('p49n1', '2026-07-29 16:00', 'Individual', MARIA, 'BIRP', 'Elijah reports finishing his first semester with a 3.2 GPA — significant milestone given cannabis was disrupting academic performance before. Behavior: proud; reflective on change. Intervention: celebrate achievement; connect to core values (education, family, career). Response: client articulated specific connection between sobriety and academic success. Plan: prepare for fall semester with updated relapse prevention plan.'),
      n('p49n2', '2026-07-15 16:00', 'Individual', MARIA, 'BIRP', 'Elijah navigated his first cannabis exposure at a party — left early per plan. Called sponsor on the way home. Behavior: confident. Intervention: debriefed the event; reinforced his response. Plan: develop campus resource toolkit for next semester.'),
      n('p49n3', '2026-07-01 10:00', 'Medical', DR_STONE, 'SOAP', 'S: Cannabis free 55 days. Anxiety manageable. O: GAD-7: 5 (down from 14 at intake). PHQ-A: 3. A: CUD in remission; GAD improving significantly with therapy plus sobriety. P: Continue current plan; consider therapy step-down to biweekly at 90-day mark.'),
    ],
    goals: [
      g('p49g1', 'Substance Use', 'Daily cannabis use interfering with academic performance and development', 'Achieve 6-month cannabis abstinence; maintain academic enrollment', 'Weekly OP sessions; UA monthly; identify campus sober support resources', 'In Progress', '2026-10-07'),
    ],
    nextAppointment: '2026-08-05, 4:00 PM — OP',
  },

  // p50
  {
    id: 'p50', mrn: 'MRN-94588', firstName: 'Monica', lastName: 'Harrington',
    dob: '1981-10-16', age: 44, gender: 'F',
    insurance: 'BlueCross BlueShield',
    program: 'PHP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['PTSD (Domestic Violence)', 'Somatic Symptom Disorder'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 45, amaRisk: 'Med', los: 17,
    admitDate: '2026-07-13', expectedDischarge: '2026-09-13',
    counselor: SARAH, physician: DR_STONE,
    flags: [flag('Risk', 'DV history — safety planning active; ex-partner restraining order'), flag('Medical', 'Somatic complaints — full medical workup negative; psychosomatic etiology')],
    lastUa: 'Negative', mood: 5, craving: 5,
    notes: [
      n('p50n1', '2026-07-29 10:30', 'Individual', SARAH, 'BIRP', 'Monica reported body pain 3/10 today (down from 7/10 at admission). Explored connection between trauma processing and somatic symptom reduction. Behavior: curious about mind-body connection. Intervention: somatic therapy psychoeducation; introduced body scan. Response: client tolerating body awareness exercises. Plan: progress to trauma-focused somatic therapy next session.'),
      n('p50n2', '2026-07-24 14:00', 'Group', TAMARA, 'DAP', 'Women\'s group — body image and trauma. Monica shared somatic experience for first time in group. Peers validated connection between DV trauma and physical symptoms. Assessment: meaningful peer support around body-held trauma. Plan: continue women\'s group track.'),
      n('p50n3', '2026-07-18 11:00', 'Medical', DR_STONE, 'SOAP', 'S: Somatic pain 4/10 — improving. Alcohol-free 5 days. O: Full medical workup complete — cardiac, GI, rheumatologic: all WNL. PHQ-9: 13. PCL-5: 48 (moderate-severe PTSD). A: AUD in early remission; PTSD with somatic presentation. P: Continue PHP; add sertraline 50mg; refer to EMDR-trained therapist within PHP.'),
    ],
    goals: [
      g('p50g1', 'Substance Use', 'Alcohol use as primary PTSD coping mechanism — DV survivor', 'Achieve sustained alcohol abstinence with PTSD treatment', 'Complete PHP 60 days; attend weekly EMDR sessions; safety plan active', 'In Progress', '2026-09-13'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  // p51 - p74: compact entries with 3 notes each
  {
    id: 'p51', mrn: 'MRN-93401', firstName: 'Bernard', lastName: 'Knight',
    dob: '1988-12-05', age: 37, gender: 'M', insurance: 'Aetna Better Health of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Antisocial Features (subthreshold)'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 35, amaRisk: 'High', los: 8, admitDate: '2026-07-22', expectedDischarge: '2026-08-21',
    counselor: DAVID, physician: DR_CHEN, flags: [flag('Legal', 'Pending possession charge — attorney contact authorized'), flag('Medication', 'Buprenorphine 16mg — Day 4 induction')],
    lastUa: 'Positive (BUP+OPI)', mood: 4, craving: 8,
    notes: [
      n('p51n1', '2026-07-29 14:00', 'Individual', DAVID, 'BIRP', 'Day 7 individual session. Bernard minimally engaged — classic pre-contemplation features. Motivated only by legal pressure. Behavior: guarded, monosyllabic. Intervention: motivational interviewing — explored discrepancy between stated values (family) and current behavior. One genuine moment: "My son asks for me." Plan: leverage family connection; request family session.'),
      n('p51n2', '2026-07-26 15:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine titrating — withdrawal controlled. Craving high. O: COWS 3. BP 118/76. A: OUD early induction; subthreshold antisocial features — behavioral limit-setting in milieu. P: Increase buprenorphine to 20mg; re-evaluate at 2 weeks.'),
      n('p51n3', '2026-07-23 09:00', 'Nursing', LISA_RN, 'DAP', 'Medication administered — observed ingestion. Patient reluctant but compliant. Vital signs stable. Oriented ×4. Patient asked about legal rights regarding treatment — information provided and attorney number given. Behavioral contract reviewed.'),
    ],
    goals: [g('p51g1', 'Substance Use', 'Court-ordered treatment — pre-contemplation stage', 'Complete residential treatment; meet legal requirements', 'Attend all programming; medication compliant; family session ×1', 'In Progress', '2026-08-21')],
    nextAppointment: 'Tomorrow, 2:00 PM — Individual', bed: '4B', status: 'Occupied',
  },

  {
    id: 'p52', mrn: 'MRN-92214', firstName: 'Shanice', lastName: 'Robinson',
    dob: '1998-04-19', age: 28, gender: 'F', insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Major Depressive Disorder', 'PTSD (Childhood Trauma)'],
    asam: { d1: 3, d2: 2, d3: 4, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 27, amaRisk: 'High', los: 4, admitDate: '2026-07-26', expectedDischarge: '2026-08-25',
    counselor: SARAH, physician: DR_CHEN, flags: [flag('Risk', 'Day 1: SI with plan — inpatient psychiatric eval completed; returned Day 2 on voluntary basis'), flag('Medication', 'Methadone 40mg — induction')],
    lastUa: 'Positive (FENT+BENZ)', mood: 2, craving: 9,
    notes: [
      n('p52n1', '2026-07-29 13:00', 'Individual', SARAH, 'BIRP', 'Day 3 post-psychiatric return. Shanice more stable — denies active SI. Engaged in brief check-in. Shared that her daughter is staying with grandmother — "that\'s why I came back." Behavior: exhausted but present. Intervention: safety contract signed; build on daughter-based motivation. Plan: daily individual check-ins for first 2 weeks.'),
      n('p52n2', '2026-07-28 09:00', 'Medical', DR_CHEN, 'SOAP', 'S: Methadone Day 2. Withdrawal symptoms controlled. Mood depressed — SI passive/no plan. O: COWS 4. Methadone 40mg. PHQ-9: 24 (severe). Benzo detected — benzodiazepine monitoring protocol active. A: OUD induction; severe MDD; PTSD. P: Psychiatry consult tomorrow; antidepressant deferred pending psychiatric eval. Close monitoring.'),
      n('p52n3', '2026-07-27 07:00', 'Nursing', LISA_RN, 'DAP', 'Post-psychiatric return. Safety checks every 2 hours per protocol. Patient cooperative. Methadone administered under observation. Environment cleared per protocol. Vital signs stable. Notified treatment team of successful readmission. Family contact authorized — mother called.'),
    ],
    goals: [g('p52g1', 'Safety', 'Active SI on admission — complex trauma driving high-risk behavior', 'Achieve psychiatric stability; eliminate active SI; engage in trauma treatment', 'Daily safety contracts; psychiatric evaluation; medication compliance', 'In Progress', '2026-08-25')],
    nextAppointment: 'Today, 3:00 PM — Psychiatry consult', bed: '1B', status: 'Occupied',
  },

  {
    id: 'p53', mrn: 'MRN-91027', firstName: 'Theodore', lastName: 'Marsh',
    dob: '1965-08-12', age: 60, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'IOP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Type 2 Diabetes', 'Coronary Artery Disease (s/p stent 2023)'],
    asam: { d1: 1, d2: 2, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 60, amaRisk: 'Low', los: 43, admitDate: '2026-06-17', expectedDischarge: '2026-09-17',
    counselor: DAVID, physician: DR_LEE, flags: [flag('Medical', 'CAD — cardiology co-management; cardiac rehab completing')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      n('p53n1', '2026-07-28 18:00', 'Individual', DAVID, 'BIRP', 'Theodore reports completing cardiac rehab last week — graduated as a "sober patient." Behavior: proud, motivated. Explored connection between alcohol use and cardiac event — client clearly understands the causal link. "This time it\'s different. I saw the inside of my own chest." Plan: introduce stress cardiac management education for high-risk scenarios.'),
      n('p53n2', '2026-07-21 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 43 days sober. HbA1c 6.8 — improved. Cardiac symptoms resolved. O: BP 126/80. Metformin 1000mg BID. Carvedilol 12.5mg BID. A: AUD in sustained remission; DM2 well-controlled; CAD stable s/p stent. P: Cardiology signed off — routine follow-up only. Continue current plan.'),
      n('p53n3', '2026-07-10 18:00', 'Group', TAMARA, 'DAP', 'IOP group on medical consequences of alcohol. Theodore shared his cardiac stent story. Group profoundly affected — several younger members visibly shaken. Assessment: powerful health-risk modeling for group cohort. Plan: invite Theodore to continue sharing health narrative.'),
    ],
    goals: [g('p53g1', 'Substance Use', 'AUD causing cardiac and metabolic disease requiring immediate cessation', 'Achieve 12-month sobriety; normalize cardiac and diabetic biomarkers', 'Complete IOP; cardiac rehab graduate; AA twice weekly', 'In Progress', '2026-09-17')],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  {
    id: 'p54', mrn: 'MRN-89840', firstName: 'Brianna', lastName: 'Copeland',
    dob: '2003-01-29', age: 23, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Major Depressive Disorder'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 29, amaRisk: 'High', los: 5, admitDate: '2026-07-25', expectedDischarge: '2026-08-24',
    counselor: KEVIN, physician: DR_CHEN, flags: [flag('Medication', 'Buprenorphine induction Day 3'), flag('AMA', 'Expressed AMA intent Day 2 — safety plan updated')],
    lastUa: 'Positive (FENT+OXY)', mood: 3, craving: 8,
    notes: [
      n('p54n1', '2026-07-29 11:00', 'Individual', KEVIN, 'BIRP', 'Brianna wavering on commitment to treatment. Explored AMA ambivalence — "My boyfriend is out there." Intervention: decisional balance on consequences of leaving. Client identified 2 reasons to stay: her mother and "not wanting to die at 23." Behavior: tearful but engaged. Plan: increase family contact; update safety plan; daily check-ins.'),
      n('p54n2', '2026-07-27 09:00', 'Nursing', LISA_RN, 'DAP', 'Buprenorphine 12mg administered (Day 3 of induction). COWS 3 — improving. Patient cooperative. Ate 50% of breakfast. Vital signs stable. Safety check completed — denies SI. Updated safety plan confirmed with patient. Notified counselor of reduced AMA ideation.'),
      n('p54n3', '2026-07-26 14:00', 'Medical', DR_CHEN, 'SOAP', 'S: Withdrawal symptoms controlled on Buprenorphine. Mood depressed. O: COWS 4. PHQ-9: 18 (moderately severe). BP 108/68. A: OUD on induction; MDD moderate-severe. P: Titrate Buprenorphine to 16mg; psychiatry consult Day 7 for MDD.'),
    ],
    goals: [g('p54g1', 'Substance Use', 'Fentanyl OUD — 2 prior overdoses; relationship with active user complicating recovery', 'Complete residential; establish healthy recovery community; relationship boundary education', 'Complete 30 days residential; attend group daily; family engagement session', 'In Progress', '2026-08-24')],
    nextAppointment: 'Today, 3:00 PM — Safety check-in', bed: '2D', status: 'Occupied',
  },

  {
    id: 'p55', mrn: 'MRN-88653', firstName: 'Malcolm', lastName: 'Reed',
    dob: '1989-05-21', age: 37, gender: 'M', insurance: 'Maryland Medicaid / HealthChoice',
    program: 'PHP', primaryDiagnosis: 'Polysubstance Use Disorder (Opioid + Cocaine + Cannabis)', coOccurring: ['Bipolar II Disorder'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 43, amaRisk: 'Med', los: 24, admitDate: '2026-07-06', expectedDischarge: '2026-09-06',
    counselor: TAMARA, physician: DR_CHEN, flags: [flag('Medical', 'Bipolar II — lamotrigine initiated'), flag('Medication', 'Buprenorphine 8mg QD')],
    lastUa: 'Positive (BUP prescribed)', mood: 6, craving: 5,
    notes: [
      n('p55n1', '2026-07-29 10:30', 'Individual', TAMARA, 'BIRP', 'Malcolm describes "best 3 weeks of his 30s" — mood stable, no illicit substances. Exploring how Bipolar II created the pattern of stimulant use during hypomania and opioid use during depression. Behavior: analytical and insightful. Intervention: mood cycle education mapped to substance use history. Plan: create personalized mood-substance use timeline for psychoeducation.'),
      n('p55n2', '2026-07-22 14:00', 'Medical', DR_CHEN, 'SOAP', 'S: Clean from cocaine and cannabis 24 days. Buprenorphine stable. Mood stable 3 weeks. O: Lamotrigine 150mg QD — therapeutic. PHQ-9: 6. HDS: 7 (mild). A: Polysubstance in remission; Bipolar II — lamotrigine effective. P: Continue plan; check lamotrigine level. PHP continuing as appropriate.'),
      n('p55n3', '2026-07-14 11:00', 'Group', JAMES, 'DAP', 'PHP group — dual diagnosis theme. Malcolm facilitated a peer discussion on managing Bipolar II in recovery with minimal prompting. Demonstrated strong knowledge and peer leadership skills. Assessment: excellent dual-diagnosis group asset. Plan: invite to co-facilitate group with staff.'),
    ],
    goals: [
      g('p55g1', 'Substance Use', 'Polysubstance use cycling with Bipolar II episodes', 'Achieve 6-month sobriety from all illicit substances while stable on mood stabilizer', 'Complete PHP; medication compliant; weekly mood charting', 'In Progress', '2026-09-06'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  {
    id: 'p56', mrn: 'MRN-87466', firstName: 'Iris', lastName: 'Nakamura',
    dob: '1994-09-14', age: 31, gender: 'F', insurance: 'Cigna',
    program: 'IOP', primaryDiagnosis: 'Alcohol Use Disorder (Severe)', coOccurring: ['Social Anxiety Disorder', 'Persistent Depressive Disorder (Dysthymia)'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 2, d5: 2, d6: 2 },
    recoveryScore: 68, amaRisk: 'Low', los: 52, admitDate: '2026-06-08', expectedDischarge: '2026-09-08',
    counselor: MARIA, physician: DR_STONE, flags: [flag('Insurance', 'Cigna auth through 9/8')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      n('p56n1', '2026-07-28 17:30', 'Individual', MARIA, 'BIRP', 'Iris practicing social engagement at work without alcohol as social lubricant. Used structured conversation techniques from CBT module — reported first alcohol-free team lunch "actually enjoyable." Behavior: proud, surprised. Intervention: reinforced progress; challenged catastrophic thinking about social situations. Plan: graduation from IOP planned for September — begin transition conversation.'),
      n('p56n2', '2026-07-21 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 52 days sober. Social anxiety improving. O: GAD-7: 6 (admission 14). PHQ-9: 7 (admission 16). Sertraline 100mg — tolerating well. A: AUD in sustained remission; social anxiety and dysthymia responding to treatment and sobriety. P: Continue plan; discuss IOP step-down at 90-day mark.'),
      n('p56n3', '2026-07-12 18:00', 'Group', TAMARA, 'DAP', 'IOP group. Iris volunteered to share a success story for first time. Previously always declined. Described making a work friend who does not drink. Group celebrated her growth. Assessment: social anxiety making significant progress through group exposure therapy.'),
    ],
    goals: [g('p56g1', 'Substance Use', 'AUD developed as social anxiety management tool in workplace culture', 'Achieve sustained sobriety; develop authentic social skills without alcohol', 'Complete IOP; weekly therapy; workplace coping toolkit implemented', 'In Progress', '2026-09-08')],
    nextAppointment: '2026-08-01, 5:30 PM — IOP',
  },

  {
    id: 'p57', mrn: 'MRN-86279', firstName: 'Derrick', lastName: 'Chambers',
    dob: '1977-11-08', age: 48, gender: 'M', insurance: 'MedStar Family Choice',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Chronic Pain (Failed Back Surgery Syndrome)', 'Major Depressive Disorder'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 38, amaRisk: 'Med', los: 15, admitDate: '2026-07-15', expectedDischarge: '2026-08-14',
    counselor: KEVIN, physician: DR_LEE, flags: [flag('Medical', 'FBSS — neurosurgery case — pain management complex'), flag('Medication', 'Buprenorphine 24mg QD — pain and OUD dual indication')],
    lastUa: 'Positive (BUP prescribed)', mood: 5, craving: 5,
    notes: [
      n('p57n1', '2026-07-29 14:00', 'Individual', KEVIN, 'BIRP', 'Derrick exploring grief around what chronic pain has taken from him — career as a contractor, physical identity, role as provider. Behavior: mournful but engaged. Intervention: acceptance-based approach to chronic pain; values clarification. Response: client identified "being present for my wife" as core value. Plan: explore pain psychology resources; introduce ACT for chronic pain.'),
      n('p57n2', '2026-07-25 10:00', 'Medical', DR_LEE, 'SOAP', 'S: Pain 5/10 (down from 9/10 at admission with buprenorphine dual indication). Mood improved. O: Buprenorphine 24mg QD — therapeutic for both OUD and pain. COWS 0. BP 130/82. A: OUD on MAT with pain indication; FBSS — pain improving on high-dose buprenorphine; MDD moderate. P: Physical therapy consult; pain psychology evaluation; buprenorphine maintenance post-discharge.'),
      n('p57n3', '2026-07-19 09:00', 'Case Management', 'Patricia Moore, LCSW-C', 'DAP', 'Pain management team consultation completed — neurosurgery recommends no further surgical intervention. Coordinating with Workers\' Compensation long-term disability claim. OTP enrollment confirmed for Buprenorphine maintenance post-discharge. Wife engaged in family therapy planning.'),
    ],
    goals: [
      g('p57g1', 'Substance Use', 'OUD developed from post-surgical opioid prescription — iatrogenic origin', 'Maintain OUD on Buprenorphine maintenance; pain controlled at ≤ 5/10', 'Complete residential; OTP enrollment; pain management protocol compliance', 'In Progress', '2026-08-14'),
    ],
    nextAppointment: 'Tomorrow, 2:00 PM — Pain psychology', bed: '4C', status: 'Occupied',
  },

  {
    id: 'p58', mrn: 'MRN-85092', firstName: 'Tanya', lastName: 'Singleton',
    dob: '1985-07-27', age: 40, gender: 'F', insurance: 'Aetna Better Health of Maryland',
    program: 'PHP', primaryDiagnosis: 'Cocaine Use Disorder (Severe)', coOccurring: ['ADHD (Inattentive Type)', 'Generalized Anxiety Disorder'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 56, amaRisk: 'Low', los: 28, admitDate: '2026-07-02', expectedDischarge: '2026-09-02',
    counselor: DAVID, physician: DR_STONE, flags: [flag('Medical', 'ADHD — non-stimulant treatment (Strattera) initiated')],
    lastUa: 'Negative', mood: 7, craving: 3,
    notes: [
      n('p58n1', '2026-07-28 10:30', 'Individual', DAVID, 'BIRP', 'Tanya reports Strattera helping concentration for first time without cocaine. "I used to need coke just to get through a workday — this medication lets me focus legally." Behavior: energized and insightful. Explored ADHD-cocaine use pattern — cocaine provided stimulation that treated undiagnosed ADHD. Intervention: psychoeducation; normalize the pattern; celebrate finding appropriate treatment. Plan: monitor Strattera efficacy; maintain cocaine abstinence.'),
      n('p58n2', '2026-07-21 11:00', 'Medical', DR_STONE, 'SOAP', 'S: Cocaine free 28 days. ADHD symptoms improving on Strattera 80mg. Anxiety manageable. O: PHQ-9: 5. GAD-7: 6. Strattera 80mg — tolerating well. A: CUD in remission; ADHD responding to Strattera; GAD improving. P: Continue plan; check Strattera therapeutic effect at 6-week mark.'),
      n('p58n3', '2026-07-14 14:00', 'Group', MARIA, 'DAP', 'PHP group on dual diagnosis. Tanya shared her ADHD diagnosis history — recognized in PHP evaluation as first clinical assessment ever. Group surprised and engaged — several members requested ADHD screening. Assessment: Tanya\'s disclosure opening important discussion about undiagnosed co-occurring conditions.'),
    ],
    goals: [g('p58g1', 'Substance Use', 'Cocaine use self-medicating undiagnosed ADHD for 15 years', 'Achieve cocaine abstinence; manage ADHD with Strattera; 12-month sobriety', 'Complete PHP; Strattera compliance; cocaine UA monthly', 'In Progress', '2026-09-02')],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  {
    id: 'p59', mrn: 'MRN-83905', firstName: 'Clarence', lastName: 'Hunt',
    dob: '1970-03-11', age: 56, gender: 'M', insurance: 'Self-Pay',
    program: 'IOP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Gout', 'Hypertension'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 65, amaRisk: 'Low', los: 46, admitDate: '2026-06-14', expectedDischarge: '2026-09-14',
    counselor: TAMARA, physician: DR_LEE, flags: [flag('Insurance', 'Self-pay — reduced-fee agreement signed'), flag('Medical', 'Gout — allopurinol; alcohol exacerbating uric acid levels')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      n('p59n1', '2026-07-27 18:00', 'Individual', TAMARA, 'BIRP', 'Clarence had first gout-free month in 3 years — directly attributable to alcohol cessation. Using this as motivational anchor. "No flare means no cane — I can walk without pain." Behavior: motivated, grateful. Intervention: health recovery narrative; connecting sobriety to quality of life gains. Plan: maintain motivation through health milestones.'),
      n('p59n2', '2026-07-21 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 46 days alcohol-free. No gout flare. O: Uric acid 5.2 (down from 9.1 at admission). BP 128/80 (down from 148/92). Allopurinol 300mg effective. A: AUD in sustained remission; gout in excellent control with sobriety and allopurinol; HTN improving. P: Continue; recheck labs in 6 weeks.'),
      n('p59n3', '2026-07-09 18:00', 'Group', MARIA, 'DAP', 'Evening IOP group. Clarence shared his gout story as a motivational narrative. Group engaged — health consequences as concrete motivators resonating with cohort. Assessment: health-based motivation very effective for this age cohort.'),
    ],
    goals: [g('p59g1', 'Substance Use', 'AUD causing gout and hypertension — health consequences driving motivation', 'Achieve 12-month sobriety; maintain uric acid < 6mg/dL; control BP', 'Complete IOP; medication compliance; weekly AA attendance', 'In Progress', '2026-09-14')],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  {
    id: 'p60', mrn: 'MRN-82718', firstName: 'Adriana', lastName: 'Vega',
    dob: '2001-06-17', age: 25, gender: 'F', insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Major Depressive Disorder', 'Grief (Perinatal Loss)'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 31, amaRisk: 'High', los: 10, admitDate: '2026-07-20', expectedDischarge: '2026-08-19',
    counselor: SARAH, physician: DR_CHEN, flags: [flag('Risk', 'Complicated grief — stillbirth 4 months ago; opioid use escalated post-loss'), flag('Medication', 'Buprenorphine 16mg QD — Day 6')],
    lastUa: 'Positive (BUP prescribed)', mood: 3, craving: 7,
    notes: [
      n('p60n1', '2026-07-29 13:00', 'Individual', SARAH, 'BIRP', 'Adriana spoke of her daughter (stillborn March 2026) for first time in treatment. Used her name. Behavior: significant therapeutic progress — intense grief but present. Intervention: grief-informed approach; validated magnitude of loss; normalized opioid escalation as grief response. Response: client described "using heroin to stop feeling everything." Plan: grief specialist referral; continue individual trauma work.'),
      n('p60n2', '2026-07-25 09:00', 'Nursing', LISA_RN, 'DAP', 'Morning medication administration. Adriana compliant with Buprenorphine. Eating improving — 70% of meals. Slept 6 hours last night per self-report. Emotional — mentioned her daughter to the nurse; appropriate therapeutic response offered. Notified counselor. Safety check: denies SI/HI.'),
      n('p60n3', '2026-07-22 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine stabilizing withdrawal. Grief-related depression severe. O: PHQ-9: 23. COWS 2. BP 106/68. A: OUD in early MAT; severe grief-related MDD. P: Psychiatry consult urgent — complicated grief and MDD; sertraline initiation pending psych eval; continue Buprenorphine.'),
    ],
    goals: [
      g('p60g1', 'Substance Use', 'Opioid use escalated following perinatal loss as grief numbing mechanism', 'Achieve OUD remission on MAT; engage grief-specific treatment', 'Complete residential; MAT compliance; grief support group enrollment', 'In Progress', '2026-08-19'),
    ],
    nextAppointment: 'Today, 1:00 PM — Psychiatry consult', bed: '3D', status: 'Occupied',
  },

  {
    id: 'p61', mrn: 'MRN-81531', firstName: 'Nathaniel', lastName: 'Cross',
    dob: '1982-02-23', age: 44, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'PHP', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['PTSD (Combat — Army, 2 Tours Iraq)', 'TBI (Mild, 2007)'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 41, amaRisk: 'Med', los: 23, admitDate: '2026-07-07', expectedDischarge: '2026-09-07',
    counselor: TAMARA, physician: DR_LEE, flags: [flag('Medical', 'TBI — cognitive testing shows processing speed deficits'), flag('Medical', 'VA dual enrollment — care coordination active')],
    lastUa: 'Positive (BUP prescribed)', mood: 5, craving: 5,
    notes: [
      n('p61n1', '2026-07-28 11:00', 'Individual', TAMARA, 'BIRP', 'Nathaniel made significant disclosure — described mortar attack in 2007 Fallujah that caused TBI and killed 2 teammates. First time discussing in therapy setting. Behavior: deliberate, controlled. Intervention: titrated trauma approach; gratitude for disclosure; validated courage. Response: client expressed relief at "finally saying it out loud." Plan: coordinate with VA PTSD program for CPT (Cognitive Processing Therapy) — TBI-adapted protocol.'),
      n('p61n2', '2026-07-22 10:00', 'Medical', DR_LEE, 'SOAP', 'S: MAT stable. Nightmares 3-4×/week. O: Buprenorphine 16mg QD. PCL-5: 52. Neuropsych consult completed — mild TBI with processing speed deficits, no major cognitive impairment. A: OUD on MAT; PTSD (PCL-5 high); TBI mild. P: Prazosin 3mg QHS for nightmares; coordinate with VA TBI clinic; CPT referral placed.'),
      n('p61n3', '2026-07-14 14:00', 'Group', JAMES, 'DAP', 'Veterans group. Nathaniel shared his TBI story. Group of 3 veterans deeply connected. Two others disclosed TBI experiences. Assessment: peer normalization of TBI-PTSD-SUD nexus is therapeutically powerful. Plan: continue veterans group weekly.'),
    ],
    goals: [g('p61g1', 'Substance Use', 'OUD developed to manage combat PTSD and TBI-related symptoms', 'Achieve 12-month OUD remission on MAT; complete trauma treatment', 'PHP daily; VA PTSD program enrollment; Buprenorphine compliance', 'In Progress', '2026-09-07')],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  {
    id: 'p62', mrn: 'MRN-80344', firstName: 'Diamond', lastName: 'Fletcher',
    dob: '2006-10-09', age: 19, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)',
    program: 'OP', primaryDiagnosis: 'Cannabis Use Disorder (Mild)', coOccurring: ['Major Depressive Disorder (Mild)', 'Learning Disability (Dyslexia)'],
    asam: { d1: 0, d2: 0, d3: 1, d4: 2, d5: 1, d6: 1 },
    recoveryScore: 78, amaRisk: 'Low', los: 71, admitDate: '2026-05-20', expectedDischarge: '2026-10-20',
    counselor: MARIA, physician: DR_STONE, flags: [flag('Success', 'Enrolled in Job Corps — first vocational training')],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [
      n('p62n1', '2026-07-28 16:00', 'Individual', MARIA, 'BIRP', 'Diamond excited about Job Corps enrollment starting next month. First week cannabis-free in 4 years. Behavior: hopeful, energized. Intervention: strengths-based approach — highlighted her resilience and self-advocacy. Response: client planning to disclose dyslexia to Job Corps for accommodations. Plan: support accommodation self-advocacy; develop coping plan for Job Corps stress.'),
      n('p62n2', '2026-07-14 16:00', 'Individual', MARIA, 'BIRP', 'Diamond using cannabis to manage learning frustration and depressive symptoms. Motivational interviewing focused on education goals. Explored academic dream despite learning disability. "I\'ve always been smart — the words just don\'t line up." Intervention: validated intelligence; psychoeducation on dyslexia as neurological difference.'),
      n('p62n3', '2026-07-01 10:00', 'Medical', DR_STONE, 'SOAP', 'S: Cannabis use reducing — 3 days between uses (admission: daily). Depression mild. O: PHQ-9: 6. A: CUD early intervention, good trajectory; MDD mild — mood improving with reduced cannabis. P: Continue OP; monitor depression trajectory; Job Corps transition planning.'),
    ],
    goals: [g('p62g1', 'Substance Use', 'Cannabis use reinforcing depressive avoidance in young adult', 'Achieve cannabis abstinence; engage in vocational training', 'Weekly OP; UA monthly; Job Corps enrollment; dyslexia accommodations', 'In Progress', '2026-10-20')],
    nextAppointment: '2026-08-04, 4:00 PM — OP',
  },

  {
    id: 'p63', mrn: 'MRN-79157', firstName: 'Edwin', lastName: 'Ramsey',
    dob: '1973-06-04', age: 53, gender: 'M', insurance: 'BlueCross BlueShield',
    program: 'IOP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Peripheral Neuropathy (Alcohol-Related)', 'Hypertension'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 63, amaRisk: 'Low', los: 57, admitDate: '2026-06-03', expectedDischarge: '2026-09-03',
    counselor: DAVID, physician: DR_LEE, flags: [flag('Medical', 'Peripheral neuropathy — neurology follow-up; thiamine supplementation')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      n('p63n1', '2026-07-27 18:00', 'Individual', DAVID, 'BIRP', 'Edwin reports neuropathy pain reduced from 7/10 to 3/10 with 57 days sobriety. "My feet stopped burning — for the first time in 2 years." Behavior: grateful, motivated by tangible physical improvement. Intervention: reinforced health-based motivation; explored what else might recover with continued sobriety. Plan: document recovery milestones for relapse prevention.'),
      n('p63n2', '2026-07-21 10:00', 'Medical', DR_LEE, 'SOAP', 'S: Peripheral neuropathy improving — pain 3/10 (admission 7/10). Alcohol-free 57 days. O: Thiamine 100mg QD. B12 normal. Neuropathy exam: sensation improving bilaterally in feet. BP 130/82. A: AUD in sustained remission; alcohol-related neuropathy — reversible changes occurring. P: Continue thiamine; neurology follow-up Sept. Excellent progress.'),
      n('p63n3', '2026-07-10 18:00', 'Group', TAMARA, 'DAP', 'IOP group. Edwin shared his neuropathy recovery as evidence of sobriety\'s healing power. Group moved — physical recovery stories very motivating. Assessment: Edwin becoming a natural group elder. Plan: encourage continued sharing.'),
    ],
    goals: [g('p63g1', 'Substance Use', 'AUD causing progressive neuropathy — reversal possible with sobriety', 'Achieve 12-month sobriety; full neuropathy remission', 'Complete IOP; thiamine compliance; AA home group established', 'In Progress', '2026-09-03')],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  {
    id: 'p64', mrn: 'MRN-77970', firstName: 'Jasmine', lastName: 'Thornton',
    dob: '1997-01-31', age: 29, gender: 'F', insurance: 'Maryland Medicaid / HealthChoice',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Borderline Personality Disorder', 'PTSD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 32, amaRisk: 'High', los: 12, admitDate: '2026-07-18', expectedDischarge: '2026-08-17',
    counselor: SARAH, physician: DR_CHEN, flags: [flag('Behavioral', 'BPD — treatment team DBT-informed milieu; splitting documented'), flag('Risk', 'SI history — safety monitoring daily')],
    lastUa: 'Positive (BUP prescribed)', mood: 4, craving: 6,
    notes: [
      n('p64n1', '2026-07-29 13:00', 'Individual', SARAH, 'BIRP', 'Jasmine practicing DEAR MAN skill after conflict with peer yesterday. Role-played assertive communication vs. previous aggressive response. Behavior: engaged, eager to try new approach. Intervention: reinforced skill use; explored what made yesterday different. Response: client identifying pre-crisis warning signs. Plan: expand crisis prevention inventory.'),
      n('p64n2', '2026-07-25 15:00', 'Group', JAMES, 'DAP', 'DBT skills group. Jasmine participated actively — shared her diary card without prompting. First time volunteering. Excellent participation. Assessment: therapeutic alliance forming in group. Plan: reinforce milestone next individual session.'),
      n('p64n3', '2026-07-21 11:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine 16mg — stable. Emotional crises 2 this week vs. 6 Week 1. O: PHQ-9: 18. COWS 0. A: OUD on MAT; BPD — DBT milieu showing early progress; PTSD — deferred trauma work. P: Initiate sertraline 50mg; continue safety monitoring; BPD medication options discussed — defer antipsychotic for now.'),
    ],
    goals: [
      g('p64g1', 'Substance Use', 'OUD driven by BPD emotional dysregulation and trauma avoidance', 'Maintain sobriety on MAT; apply DBT skills to manage OUD triggers', 'Complete residential; daily DBT diary card; medication compliance', 'In Progress', '2026-08-17'),
    ],
    nextAppointment: 'Today, 3:00 PM — DBT Skills Group', bed: '1A', status: 'Occupied',
  },

  {
    id: 'p65', mrn: 'MRN-76783', firstName: 'Curtis', lastName: 'Freeman',
    dob: '1990-08-17', age: 35, gender: 'M', insurance: 'Aetna Better Health of Maryland',
    program: 'PHP', primaryDiagnosis: 'Severe Methamphetamine Use Disorder', coOccurring: ['Major Depressive Disorder', 'Insomnia (Meth-related)'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 45, amaRisk: 'Med', los: 21, admitDate: '2026-07-09', expectedDischarge: '2026-09-09',
    counselor: KEVIN, physician: DR_LEE, flags: [flag('Medical', 'Meth-related cardiomyopathy — cardiology clearance obtained'), flag('Medication', 'Mirtazapine 30mg QHS for sleep and depression')],
    lastUa: 'Negative', mood: 6, craving: 5,
    notes: [
      n('p65n1', '2026-07-28 10:00', 'Individual', KEVIN, 'BIRP', 'Curtis sleeping 7 hours on mirtazapine — "I forgot what sleep feels like." Energy improving. Meth cravings present but not overwhelming. Behavior: engaged, optimistic. Explored how meth "replaced sleep" for him during binge cycles. Intervention: sleep hygiene education; sleep recovery timeline for meth users. Plan: introduce SMART Recovery tools.'),
      n('p65n2', '2026-07-22 11:00', 'Medical', DR_LEE, 'SOAP', 'S: Meth-free 21 days. Sleep 7 hours on mirtazapine. Mood improving. O: PHQ-9: 9 (down from 19). ECHO at 3 months showing improved EF (42% vs. 35% admission). BP 120/76. A: MUD in remission; MDD improving; meth-related cardiomyopathy — recovering. P: Cardiology follow-up Oct; continue mirtazapine; PHP appropriate.'),
      n('p65n3', '2026-07-15 14:00', 'Group', MARIA, 'DAP', 'PHP group — meth-specific psychoeducation. Curtis shared cardiac consequences of meth use — group visibly affected. Several members unaware of cardiac risks. Assessment: Curtis\'s story filling a critical education gap.'),
    ],
    goals: [g('p65g1', 'Substance Use', 'Severe MUD with cardiac complication — health consequences driving motivation', 'Achieve 90-day meth abstinence; normalize cardiac function', 'Complete PHP; cardiology compliance; SMART Recovery weekly', 'In Progress', '2026-09-09')],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  {
    id: 'p66', mrn: 'MRN-75596', firstName: 'Monique', lastName: 'Alexander',
    dob: '1993-12-04', age: 32, gender: 'F', insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Generalized Anxiety Disorder', 'Major Depressive Disorder', 'PCOS (Alcohol Worsening)'],
    asam: { d1: 2, d2: 1, d3: 2, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 44, amaRisk: 'Med', los: 8, admitDate: '2026-07-22', expectedDischarge: '2026-08-21',
    counselor: TAMARA, physician: DR_STONE, flags: [flag('Medical', 'PCOS exacerbated by alcohol — endocrinology referral placed')],
    lastUa: 'Negative', mood: 5, craving: 6,
    notes: [
      n('p66n1', '2026-07-29 11:00', 'Individual', TAMARA, 'BIRP', 'Monique sharing about PCOS diagnosis — learned today that alcohol significantly worsens insulin resistance and hormonal regulation. "Nobody told me that." Behavior: motivated by new medical information. Intervention: health motivation link; PCOS-alcohol education. Response: client determined to address PCOS through sobriety. Plan: endocrinology appointment scheduled; integrate PCOS into recovery motivation.'),
      n('p66n2', '2026-07-26 09:00', 'Nursing', LISA_RN, 'DAP', 'CIWA Day 8 — score 0. Detox complete. Patient cooperative, improving mood. Medications administered. Discussing PCOS with nursing staff — educated on lifestyle factors including alcohol avoidance. Patient asking intelligent health questions — excellent engagement.'),
      n('p66n3', '2026-07-24 11:00', 'Medical', DR_STONE, 'SOAP', 'S: Detox complete. Alcohol-free 2 days prior to admission + 8 days here. Anxiety improving. O: CIWA 0. PHQ-9: 11. GAD-7: 10. A1c 6.1 (PCOS-related insulin resistance; alcohol worsening). A: AUD in early remission; GAD/MDD; PCOS. P: Initiate sertraline 50mg; endocrinology referral; metformin discussion deferred to endocrine.'),
    ],
    goals: [g('p66g1', 'Substance Use', 'AUD exacerbating PCOS and mental health; health consequences motivating', 'Achieve sobriety; improve PCOS biomarkers; treat co-occurring depression/anxiety', 'Complete residential; endocrinology follow-up; medication compliance', 'In Progress', '2026-08-21')],
    nextAppointment: 'Tomorrow, 9:00 AM — Medical rounds', bed: '2A', status: 'Occupied',
  },

  {
    id: 'p67', mrn: 'MRN-74409', firstName: 'Lionel', lastName: 'Brooks',
    dob: '1978-04-02', age: 48, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'IOP', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Hepatitis C (SVR — treatment completed)', 'Lumbar Radiculopathy'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 73, amaRisk: 'Low', los: 63, admitDate: '2026-05-28', expectedDischarge: '2026-09-28',
    counselor: DAVID, physician: DR_LEE, flags: [flag('Success', 'HCV SVR12 confirmed — curative treatment complete'), flag('Medication', 'Buprenorphine 8mg QD — maintenance')],
    lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 1,
    notes: [
      n('p67n1', '2026-07-28 18:00', 'Individual', DAVID, 'BIRP', 'Lionel received HCV SVR12 confirmation — cured. "They told me 5 years ago I\'d have cirrhosis by 50. I\'m 48 and cured." Behavior: elated, emotional. Intervention: process meaning of cure; connect to recovery journey. Response: client describing feeling "given a second chance." Plan: develop legacy narrative around Hep C cure and sobriety.'),
      n('p67n2', '2026-07-21 10:00', 'Medical', DR_LEE, 'SOAP', 'S: HCV SVR12 confirmed today — curative. Buprenorphine maintenance going well. Back pain 2/10. O: HCV RNA undetectable. LFTs normal. Buprenorphine 8mg QD. A: OUD in sustained remission on MAT; HCV — curative SVR12; lumbar radiculopathy improving with PT. P: Annual HCV monitoring only now. Continue MAT; discharge planning beginning.'),
      n('p67n3', '2026-07-08 18:00', 'Group', TAMARA, 'DAP', 'IOP group. Lionel shared about waiting for HCV results — group supportive. Assessment: Lionel using group as positive support network. Plan: invite to share cure news with group next session.'),
    ],
    goals: [g('p67g1', 'Substance Use', 'OUD in sustained remission on MAT; HCV cured', 'Achieve 12-month sobriety on buprenorphine maintenance; transition to OP', 'Continue IOP; buprenorphine compliance; OTP enrollment for maintenance', 'In Progress', '2026-09-28')],
    nextAppointment: '2026-08-01, 6:00 PM — IOP',
  },

  {
    id: 'p68', mrn: 'MRN-73222', firstName: 'Tamika', lastName: 'Powell',
    dob: '2000-09-26', age: 25, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['PTSD', 'Major Depressive Disorder'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 28, amaRisk: 'High', los: 3, admitDate: '2026-07-27', expectedDischarge: '2026-08-26',
    counselor: SARAH, physician: DR_CHEN, flags: [flag('Medication', 'Buprenorphine Day 1 — induction today'), flag('Risk', 'Active PTSD symptoms — trauma-informed environment active')],
    lastUa: 'Positive (FENT+OPI)', mood: 2, craving: 9,
    notes: [
      n('p68n1', '2026-07-29 10:00', 'Individual', SARAH, 'BIRP', 'Day 2 brief supportive session. Tamika in significant withdrawal distress despite Buprenorphine. Behavior: tearful, scared. Intervention: psychoeducation on induction timeline; reassurance; present-moment grounding. Response: client tolerated session — stated "I\'ll try." Plan: daily brief check-ins; safety monitoring.'),
      n('p68n2', '2026-07-28 08:00', 'Nursing', LISA_RN, 'DAP', 'Buprenorphine 8mg Day 1 administered. COWS 12 at start — tolerated well, COWS 6 at 2 hours. Second dose 4mg at 4 hours — COWS 3. Eating minimally. Safety check — denies SI. Vital signs stable. Notified Dr. Chen of COWS trajectory. Family consent for treatment in chart.'),
      n('p68n3', '2026-07-27 15:00', 'Medical', DR_CHEN, 'SOAP', 'S: Day 1 admission. Active opioid withdrawal. Fentanyl + opioid on UA. O: COWS 12 at admission. BP 138/88. HR 104. A: Severe OUD — fentanyl predominant; acute withdrawal; PTSD and MDD per history. P: Buprenorphine induction per protocol; COWS monitoring Q4H; trauma-informed environment activated; psychiatry consult Day 3.'),
    ],
    goals: [g('p68g1', 'Substance Use', 'Severe fentanyl OUD — just admitted; acute stabilization phase', 'Complete medical stabilization; engage in treatment; accept MAT', 'Complete induction; safety monitoring; daily check-ins', 'Not Started', '2026-08-26')],
    nextAppointment: 'Today, 2:00 PM — Medical check-in', bed: '4D', status: 'Occupied',
  },

  {
    id: 'p69', mrn: 'MRN-72035', firstName: 'Gregory', lastName: 'Sanders',
    dob: '1975-12-08', age: 50, gender: 'M', insurance: 'Cigna',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Hypertension', 'Obstructive Sleep Apnea'],
    asam: { d1: 2, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 57, amaRisk: 'Low', los: 26, admitDate: '2026-07-04', expectedDischarge: '2026-09-04',
    counselor: KEVIN, physician: DR_LEE, flags: [flag('Medical', 'OSA — CPAP compliance improving with sobriety'), flag('Insurance', 'Cigna auth through 9/4')],
    lastUa: 'Negative', mood: 7, craving: 3,
    notes: [
      n('p69n1', '2026-07-28 11:00', 'Individual', KEVIN, 'BIRP', 'Gregory reports CPAP compliance 85% this week — best since diagnosis. Alcohol was preventing CPAP use. Sleep dramatically improved. Behavior: rested, focused. Intervention: connect sleep improvement to sobriety; reinforce health-based motivation. Plan: review relapse prevention for upcoming family reunion.'),
      n('p69n2', '2026-07-21 10:00', 'Medical', DR_LEE, 'SOAP', 'S: CPAP compliance improving. BP controlled. Sleep quality vastly improved per self-report and partner. O: BP 128/82 (admission 152/96). AHI on CPAP: 3 events/hour (previously 28 without CPAP due to poor compliance with alcohol). A: AUD in remission — excellent response; HTN controlled; OSA — CPAP now effective with sobriety. P: Continue; sleep specialist follow-up in 3 months.'),
      n('p69n3', '2026-07-12 14:00', 'Group', TAMARA, 'DAP', 'PHP group. Gregory shared how alcohol had him "too drunk to wear my CPAP." Group laughed — he used humor well to illustrate serious point. Assessment: Gregory using self-deprecating humor productively to engage group.'),
    ],
    goals: [g('p69g1', 'Substance Use', 'AUD worsening OSA and hypertension; CPAP compliance impossible while drinking', 'Achieve sobriety; normalize BP; maintain CPAP compliance > 70%', 'Complete PHP; CPAP use nightly; BP monitoring; AA attendance', 'In Progress', '2026-09-04')],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  {
    id: 'p70', mrn: 'MRN-70848', firstName: 'Rochelle', lastName: 'Quinn',
    dob: '1988-02-14', age: 38, gender: 'F', insurance: 'Maryland Medicaid / HealthChoice',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['PTSD', 'Major Depressive Disorder', 'Chronic Pain (Fibromyalgia)'],
    asam: { d1: 3, d2: 2, d3: 4, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 26, amaRisk: 'High', los: 7, admitDate: '2026-07-23', expectedDischarge: '2026-08-22',
    counselor: TAMARA, physician: DR_CHEN, flags: [flag('Medical', 'Fibromyalgia — pain management protocol; no opioids'), flag('Risk', 'High AMA risk — daily safety assessments'), flag('Medication', 'Buprenorphine 16mg QD — Day 5')],
    lastUa: 'Positive (BUP+FENT)', mood: 3, craving: 8,
    notes: [
      n('p70n1', '2026-07-29 13:00', 'Individual', TAMARA, 'BIRP', 'Rochelle in pain (fibromyalgia 6/10) and emotionally distressed. Explored connection between pain, PTSD hypervigilance, and fentanyl use. Behavior: tearful but present. Intervention: validation; pain-trauma link psychoeducation; grounding techniques. Response: client tolerated session. Plan: non-opioid pain management consult; EMDR readiness assessment at 2 weeks.'),
      n('p70n2', '2026-07-26 09:00', 'Nursing', LISA_RN, 'DAP', 'Buprenorphine administered. Fibromyalgia pain reported 7/10 — Dr. Chen notified. Warm compress applied. Gabapentin 300mg PRN administered per order. Patient resting comfortably at 1 hour. Safety check: denies SI. Notified counselor of pain management concern.'),
      n('p70n3', '2026-07-24 11:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine titrating. Fibromyalgia pain 6-7/10. PTSD nightmares nightly. O: Buprenorphine 16mg QD. COWS 2. PHQ-9: 22. Duloxetine 60mg initiated (fibromyalgia + depression dual indication). Gabapentin 300mg TID for pain. A: OUD early MAT; fibromyalgia; severe MDD; PTSD. P: Pain psychology consult; PTSD assessment at 2 weeks; close monitoring.'),
    ],
    goals: [
      g('p70g1', 'Substance Use', 'Fentanyl OUD driven by fibromyalgia pain and PTSD — complex presentation', 'Achieve OUD remission on MAT; manage fibromyalgia without opioids', 'Complete residential; duloxetine and gabapentin compliance; pain psychology', 'In Progress', '2026-08-22'),
    ],
    nextAppointment: 'Today, 2:00 PM — Pain psychology consult', bed: '3A', status: 'Occupied',
  },

  {
    id: 'p71', mrn: 'MRN-69661', firstName: 'Antoine', lastName: 'Jefferson',
    dob: '1996-05-22', age: 30, gender: 'M', insurance: 'MedStar Family Choice',
    program: 'IOP', primaryDiagnosis: 'Cocaine Use Disorder (Moderate)', coOccurring: ['Generalized Anxiety Disorder'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 2, d5: 2, d6: 1 },
    recoveryScore: 71, amaRisk: 'Low', los: 54, admitDate: '2026-06-06', expectedDischarge: '2026-09-06',
    counselor: MARIA, physician: DR_STONE, flags: [flag('Success', 'Promoted at work — first promotion in recovery')],
    lastUa: 'Negative', mood: 8, craving: 2,
    notes: [
      n('p71n1', '2026-07-28 17:30', 'Individual', MARIA, 'BIRP', 'Antoine received promotion — first major life success in recovery. Behavior: confident, proud. Explored what made the promotion possible — sobriety, clarity, showing up consistently. Intervention: reinforce sobriety-success connection; develop plan for managing new workplace stress. Response: client motivated; attributes success to recovery. Plan: workplace coping plan update.'),
      n('p71n2', '2026-07-21 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 54 days cocaine-free. Anxiety minimal. O: GAD-7: 3 (admission 12). PHQ-9: 2. A: CUD in sustained remission; GAD — significantly improved with sobriety and therapy. P: Continue plan; discuss IOP step-down at 90 days.'),
      n('p71n3', '2026-07-10 18:00', 'Group', TAMARA, 'DAP', 'IOP group. Antoine shared work promotion story. Group celebrated. Assessment: strong positive modeling for cohort. Plan: encourage continued leadership in group.'),
    ],
    goals: [g('p71g1', 'Substance Use', 'Cocaine use disrupting career and anxiety management', 'Achieve 6-month cocaine abstinence; advance career in sobriety', 'Complete IOP; weekly NA; workplace relapse prevention plan', 'In Progress', '2026-09-06')],
    nextAppointment: '2026-08-01, 5:30 PM — IOP',
  },

  {
    id: 'p72', mrn: 'MRN-68474', firstName: 'Veronica', lastName: 'Mills',
    dob: '1984-08-19', age: 41, gender: 'F', insurance: 'Aetna Better Health of Maryland',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Bipolar I Disorder (Mixed Features)'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 41, amaRisk: 'Med', los: 18, admitDate: '2026-07-12', expectedDischarge: '2026-09-12',
    counselor: KEVIN, physician: DR_LEE, flags: [flag('Psychiatric', 'Bipolar I Mixed — lithium initiated; levels monitoring weekly'), flag('Medical', 'Fall risk during mixed episode at admission — resolved')],
    lastUa: 'Negative', mood: 6, craving: 4,
    notes: [
      n('p72n1', '2026-07-29 10:00', 'Individual', KEVIN, 'BIRP', 'Veronica describes 7 days euthymic — "the longest I\'ve felt like myself in years." Lithium stabilizing mixed episode. Exploring alcohol\'s role in Bipolar dysregulation — alcohol was making both poles worse. Behavior: reflective, calm. Intervention: mood disorder education; alcohol-Bipolar link. Plan: mood charting; relapse prevention for manic phase triggers.'),
      n('p72n2', '2026-07-23 11:00', 'Medical', DR_LEE, 'SOAP', 'S: Mood stabilizing — 5 days euthymic. Alcohol-free 18 days. O: Lithium level 0.9 mEq/L — therapeutic. PHQ-9: 10. HDS: 6. A: Bipolar I mixed — lithium achieving stability; AUD in remission. P: Continue lithium; recheck level in 2 weeks; add valproate if mixed features return.'),
      n('p72n3', '2026-07-16 14:00', 'Group', TAMARA, 'DAP', 'PHP group. Veronica shared her Bipolar I diagnosis for first time in group. Explored how alcohol seemed to "fix" her moods short-term but worsened them long-term. Peers resonated. Assessment: psychoeducation through personal narrative — valuable for group.'),
    ],
    goals: [
      g('p72g1', 'Substance Use', 'AUD worsening Bipolar I cycling — dangerous interaction', 'Achieve alcohol sobriety; stabilize Bipolar I on lithium; 12-month plan', 'Complete PHP; lithium compliance; mood charting; DBSA support group', 'In Progress', '2026-09-12'),
    ],
    nextAppointment: '2026-07-31, 9:00 AM — PHP',
  },

  {
    id: 'p73', mrn: 'MRN-67287', firstName: 'Darryl', lastName: 'Hayes',
    dob: '1981-11-14', age: 44, gender: 'M', insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Major Depressive Disorder', 'Chronic Viral Hepatitis B'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 35, amaRisk: 'Med', los: 9, admitDate: '2026-07-21', expectedDischarge: '2026-08-20',
    counselor: DAVID, physician: DR_CHEN, flags: [flag('Medical', 'Chronic HBV — entecavir initiated; hepatology co-managing'), flag('Medication', 'Buprenorphine 16mg QD — Day 7')],
    lastUa: 'Positive (BUP prescribed)', mood: 5, craving: 5,
    notes: [
      n('p73n1', '2026-07-29 14:00', 'Individual', DAVID, 'BIRP', 'Darryl learning that sobriety is the most important thing he can do for his Hepatitis B. "I didn\'t know drinking made it worse — nobody explained that." Behavior: motivated by new health information. Intervention: HBV-alcohol interaction education; health-based recovery narrative. Plan: hepatology education materials; connect sobriety to liver health goals.'),
      n('p73n2', '2026-07-26 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine stabilizing. Mood improving. O: HBV DNA 450 IU/mL (monitoring; entecavir Day 4). LFTs: ALT 68 (elevated). Buprenorphine 16mg stable. A: OUD on MAT; Chronic HBV — entecavir initiated; MDD. P: Hepatology in 4 weeks for HBV DNA recheck; sertraline 50mg for MDD; continue Buprenorphine.'),
      n('p73n3', '2026-07-23 09:00', 'Nursing', LISA_RN, 'DAP', 'Medications administered — Buprenorphine and entecavir. Patient cooperative. Educated on HBV transmission prevention (protected sex, not sharing personal items). Patient receptive. Vital signs stable. Sleep improving per report — 5-6 hours.'),
    ],
    goals: [g('p73g1', 'Substance Use', 'OUD with HBV complication — sobriety essential for liver health', 'Achieve OUD remission on MAT; HBV controlled on antiviral', 'Complete residential; entecavir compliance; hepatology follow-up; MAT continuation', 'In Progress', '2026-08-20')],
    nextAppointment: 'Tomorrow, 10:00 AM — Medical rounds', bed: '4A', status: 'Occupied',
  },

  {
    id: 'p74', mrn: 'MRN-66100', firstName: 'Stephanie', lastName: 'Norris',
    dob: '1992-03-06', age: 34, gender: 'F', insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['PTSD (Sexual Assault)', 'Major Depressive Disorder'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 33, amaRisk: 'High', los: 11, admitDate: '2026-07-19', expectedDischarge: '2026-08-18',
    counselor: SARAH, physician: DR_CHEN, flags: [flag('Risk', 'Sexual assault trauma — trauma-informed protocol; no male staff alone'), flag('Medication', 'Buprenorphine 16mg QD — stabilized'), flag('Risk', 'PTSD hypervigilance — environment modifications in place')],
    lastUa: 'Positive (BUP prescribed)', mood: 4, craving: 6,
    notes: [
      n('p74n1', '2026-07-29 11:00', 'Individual', SARAH, 'BIRP', 'Stephanie engaged well today — first session without dissociation. Processing sexual assault trauma in a paced, titrated approach. Behavior: grounded, making eye contact. Intervention: titrated trauma exposure; somatic grounding; validation. Response: client stayed present throughout 45-min session. Plan: introduce EMDR preparation; coordinate with psychiatry regarding nightmares.'),
      n('p74n2', '2026-07-25 14:00', 'Group', MARIA, 'DAP', 'Women\'s group. Stephanie attended but did not share. Observed with visible emotional engagement during discussion of recovery and safety. Assessment: processing through witnessing — appropriate for trauma stage. Plan: continue attendance; no pressure to share.'),
      n('p74n3', '2026-07-22 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine stable. PTSD nightmares 4-5×/week. Mood depressed. O: PHQ-9: 18. PCL-5: 55 (severe). Buprenorphine 16mg QD. A: OUD on MAT; PTSD severe; MDD. P: Prazosin 2mg QHS for nightmares; sertraline 50mg initiated; EMDR referral placed within facility; trauma protocol activated.'),
      n('p74n4', '2026-07-20 08:00', 'Nursing', LISA_RN, 'DAP', 'Trauma protocol review with patient — confirmed comfort with all female staff for personal care. Privacy preferences documented. Medications administered. Ate 60% of meals. Vital signs stable. Safety check — denies SI/HI. Room comfortable per patient report.'),
    ],
    goals: [
      g('p74g1', 'Substance Use', 'Opioid use as primary sexual trauma coping mechanism', 'Achieve OUD remission on MAT; engage in trauma-focused therapy', 'Complete residential; MAT compliance; EMDR preparation; safety plan active', 'In Progress', '2026-08-18'),
      g('p74g2', 'Trauma', 'Severe PTSD (sexual assault) driving high-risk opioid use', 'Complete EMDR protocol; PCL-5 score reduction of 30%', 'Attend all individual sessions; EMDR preparation complete; prazosin compliance', 'In Progress', '2026-09-15'),
    ],
    nextAppointment: 'Today, 3:00 PM — Individual therapy', bed: '1C', status: 'Occupied',
  },
];

// ─── Discharged Patients (pd1 – pd40) ────────────────────────────────────────

export const DISCHARGED_PATIENTS: Patient[] = [

  {
    id: 'pd1', mrn: 'MRN-65000', firstName: 'Lawrence', lastName: 'Ingram',
    dob: '1975-01-18', age: 51, gender: 'M', insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Major Depressive Disorder'],
    asam: { d1: 2, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 82, amaRisk: 'Low', los: 35,
    admitDate: '2026-04-15', expectedDischarge: '2026-05-20',
    counselor: SARAH, physician: DR_STONE,
    flags: [flag('Success', 'DISCHARGED — Completed residential; transitioned to IOP')],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [
      n('pd1n1', '2026-05-19 10:00', 'Discharge Summary', SARAH, 'DAP', 'Lawrence completed 35-day residential treatment. Achieved all treatment goals. Transitioned to IOP 3×/week at Silver Spring facility. AA home group established — Thursday evenings. Employer EAP coordinated. Discharge plan signed and reviewed.'),
      n('pd1n2', '2026-05-10 14:00', 'Individual', SARAH, 'BIRP', 'Pre-discharge session. Lawrence confident and prepared. 35-day milestone achieved. Relapse prevention plan finalized — 8 triggers identified with coping responses. Family support session completed with wife.'),
      n('pd1n3', '2026-04-28 10:00', 'Medical', DR_STONE, 'SOAP', 'S: Excellent progress — LFTs normalized. PHQ-9: 5. O: GGT 22. BP 120/78. A: AUD — responding excellently; MDD in full remission with sertraline plus sobriety. P: Continue sertraline; follow-up with outpatient prescriber post-discharge.'),
    ],
    goals: [
      g('pd1g1', 'Substance Use', 'Severe AUD — residential treatment', 'Complete residential; transition to IOP', 'Complete 35 days; establish IOP; AA home group', 'Met', '2026-05-20'),
    ],
    nextAppointment: 'Discharged to IOP — 2026-05-20',
  },

  {
    id: 'pd2', mrn: 'MRN-64000', firstName: 'Christine', lastName: 'Lawson',
    dob: '1990-07-11', age: 35, gender: 'F', insurance: 'Aetna Better Health of Maryland',
    program: 'PHP', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['PTSD', 'GAD'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 76, amaRisk: 'Low', los: 60,
    admitDate: '2026-03-01', expectedDischarge: '2026-04-30',
    counselor: KEVIN, physician: DR_CHEN,
    flags: [flag('Success', 'DISCHARGED — PHP completed; IOP ongoing')],
    lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 2,
    notes: [
      n('pd2n1', '2026-04-29 11:00', 'Discharge Summary', KEVIN, 'DAP', 'Christine completed 60-day PHP. Strong progress — PTSD symptoms significantly reduced. Buprenorphine 12mg maintained. Transitioning to IOP 3×/week and ongoing EMDR therapy. OTP enrolled for continued MAT. Discharge plan comprehensive.'),
      n('pd2n2', '2026-04-20 10:00', 'Individual', KEVIN, 'BIRP', 'Pre-discharge planning session. Christine confident about transition. EMDR has processed core trauma — PCL-5 reduced from 61 to 28. Identified 3 protective factors: sponsor, sober living, continued therapy.'),
      n('pd2n3', '2026-03-20 14:00', 'Medical', DR_CHEN, 'SOAP', 'S: PHP Week 3 — excellent progress. Buprenorphine stable. PTSD symptoms reducing. O: PCL-5: 42 (was 61 at admission). GAD-7: 5. A: OUD on MAT; PTSD improving on EMDR track; GAD resolved. P: Continue plan; advance EMDR protocol.'),
    ],
    goals: [g('pd2g1', 'Substance Use', 'OUD with PTSD — PHP completion', 'Complete PHP; stable on MAT; PTSD treatment engaged', 'PHP 60 days; EMDR engagement; OTP enrollment', 'Met', '2026-04-30')],
    nextAppointment: 'Discharged to IOP — 2026-04-30',
  },

  {
    id: 'pd3', mrn: 'MRN-63000', firstName: 'Marcus', lastName: 'Owens',
    dob: '1984-03-25', age: 42, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'IOP', primaryDiagnosis: 'Alcohol Use Disorder (Severe)', coOccurring: ['Hypertension', 'Type 2 Diabetes'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 84, amaRisk: 'Low', los: 90,
    admitDate: '2025-12-01', expectedDischarge: '2026-03-01',
    counselor: TAMARA, physician: DR_LEE,
    flags: [flag('Success', 'DISCHARGED — Completed IOP; transitioned to OP')],
    lastUa: 'Negative', mood: 9, craving: 1,
    notes: [
      n('pd3n1', '2026-02-28 11:00', 'Discharge Summary', TAMARA, 'DAP', 'Marcus completed 90-day IOP. Exemplary participation — peer mentor candidate. HbA1c 6.4, BP 122/78 — both improved with sobriety. AA home group (Rockville Tuesday) — 3-month commitment as group treasurer. Transitioning to biweekly OP.'),
      n('pd3n2', '2026-02-15 18:00', 'Individual', TAMARA, 'BIRP', 'Pre-discharge — Marcus discussing 90-day journey. Credits IOP group as transformative. Making amends to wife and adult children. Step 9 progressing. Relapse prevention plan comprehensive.'),
      n('pd3n3', '2026-01-10 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 40 days sober. DM2 and HTN significantly improved. O: HbA1c 6.8 (was 9.1). BP 126/80 (was 152/96). A: AUD in sustained remission; DM2 and HTN markedly improved. P: Continue plan; medication adjustments pending with PCP.'),
    ],
    goals: [g('pd3g1', 'Substance Use', 'AUD with medical complications — IOP completion', 'Complete IOP; improve metabolic health', 'IOP 90 days; AA weekly; medical compliance', 'Met', '2026-03-01')],
    nextAppointment: 'Discharged to OP — 2026-03-01',
  },

  {
    id: 'pd4', mrn: 'MRN-62000', firstName: 'Denise', lastName: 'Coleman',
    dob: '1978-11-30', age: 47, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['Bipolar II Disorder', 'PTSD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 72, amaRisk: 'Low', los: 30,
    admitDate: '2026-05-10', expectedDischarge: '2026-06-09',
    counselor: SARAH, physician: DR_CHEN,
    flags: [flag('Success', 'DISCHARGED — Completed residential; stable on buprenorphine')],
    lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 2,
    notes: [
      n('pd4n1', '2026-06-08 10:00', 'Discharge Summary', SARAH, 'DAP', 'Denise completed 30-day residential. Buprenorphine 14mg stable. Bipolar II — lamotrigine 150mg effective. PTSD — Seeking Safety curriculum completed. Sober living arranged. OTP enrolled for continued MAT. PHP transition tomorrow.'),
      n('pd4n2', '2026-05-28 14:00', 'Individual', SARAH, 'BIRP', 'Week 3 session — excellent therapeutic progress. Denise processing trauma with EMDR preparation complete. Mood stable 12 days. Making concrete plans for sober living and PHP. Strong motivation.'),
      n('pd4n3', '2026-05-15 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine stable. Mood stabilizing on lamotrigine. PTSD symptoms reducing. O: Lamotrigine 150mg therapeutic. PHQ-9: 9. A: OUD on MAT; Bipolar II controlled; PTSD improving. P: Continue plan; discharge to PHP with continued MAT.'),
    ],
    goals: [g('pd4g1', 'Substance Use', 'OUD with Bipolar II and PTSD — residential completion', 'Complete residential; stable on MAT and mood stabilizer', 'Residential 30 days; OTP enrollment; PHP transition', 'Met', '2026-06-09')],
    nextAppointment: 'Discharged to PHP — 2026-06-09',
  },

  {
    id: 'pd5', mrn: 'MRN-61000', firstName: 'Raymond', lastName: 'Curtis',
    dob: '1965-09-15', age: 60, gender: 'M', insurance: 'BlueCross BlueShield',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Cirrhosis (Child-Pugh A)', 'Peripheral Neuropathy'],
    asam: { d1: 2, d2: 2, d3: 3, d4: 4, d5: 4, d6: 3 },
    recoveryScore: 71, amaRisk: 'Low', los: 60,
    admitDate: '2026-02-15', expectedDischarge: '2026-04-15',
    counselor: DAVID, physician: DR_LEE,
    flags: [flag('Success', 'DISCHARGED — PHP completed; cirrhosis medically stable')],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [
      n('pd5n1', '2026-04-14 11:00', 'Discharge Summary', DAVID, 'DAP', 'Raymond completed 60-day PHP. Cirrhosis Child-Pugh A maintained — no progression. Peripheral neuropathy improving. AA home group established. Hepatology follow-up scheduled. Excellent discharge prognosis.'),
      n('pd5n2', '2026-04-01 10:00', 'Individual', DAVID, 'BIRP', 'Pre-discharge session. Raymond describing sobriety as "giving himself a fighting chance." Cirrhosis knowledge motivating continued abstinence. Family relationship improving. Discharge plan detailed and accepted.'),
      n('pd5n3', '2026-03-10 11:00', 'Medical', DR_LEE, 'SOAP', 'S: Excellent progress. Alcohol-free 23 days. O: Child-Pugh A (5pts) — unchanged. Peripheral neuropathy pain 3/10 (was 7/10 admission). A: AUD in sustained remission; cirrhosis stable; neuropathy improving. P: Hepatology follow-up May; continue thiamine.'),
    ],
    goals: [g('pd5g1', 'Substance Use', 'AUD with cirrhosis — lifelong abstinence required', 'Complete PHP; maintain liver stability; establish lifelong sobriety support', 'PHP 60 days; hepatology compliance; AA home group', 'Met', '2026-04-15')],
    nextAppointment: 'Discharged to OP — 2026-04-15',
  },

  {
    id: 'pd6', mrn: 'MRN-60000', firstName: 'Angela', lastName: 'Booker',
    dob: '1993-04-07', age: 33, gender: 'F', insurance: 'MedStar Family Choice',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['MDD', 'ADHD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 },
    recoveryScore: 69, amaRisk: 'Low', los: 28,
    admitDate: '2026-05-20', expectedDischarge: '2026-06-17',
    counselor: KEVIN, physician: DR_CHEN,
    flags: [flag('Success', 'DISCHARGED — Residential complete; MAT initiated; PHP transition')],
    lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 2,
    notes: [
      n('pd6n1', '2026-06-16 10:00', 'Discharge Summary', KEVIN, 'DAP', 'Angela completed 28-day residential. Buprenorphine 12mg stable. ADHD managed with Strattera 80mg. Depression resolving. Transitioning to PHP Monday. OTP enrolled. Strong motivation — "I did it for my daughter."'),
      n('pd6n2', '2026-06-10 14:00', 'Individual', KEVIN, 'BIRP', 'Final week session. Angela confident, engaged. Relapse prevention plan reviewed with her mother present. Family support excellent. ADHD symptoms well-controlled.'),
      n('pd6n3', '2026-05-28 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine stabilizing. ADHD — Strattera initiated. O: PHQ-9: 10 (was 18). COWS 0. A: OUD on MAT; MDD improving; ADHD — Strattera early response. P: Continue plan; PHP transition at 28 days.'),
    ],
    goals: [g('pd6g1', 'Substance Use', 'OUD with MDD and ADHD — residential completion', 'Complete residential; MAT stable; ADHD treated', 'Residential 28 days; OTP; PHP transition', 'Met', '2026-06-17')],
    nextAppointment: 'Discharged to PHP — 2026-06-17',
  },

  // Compact discharged patients pd7 - pd40
  {
    id: 'pd7', mrn: 'MRN-59000', firstName: 'Shawn', lastName: 'Parrish',
    dob: '1980-06-18', age: 45, gender: 'M', insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'IOP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['GAD'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 2, d5: 3, d6: 2 }, recoveryScore: 88, amaRisk: 'Low', los: 90,
    admitDate: '2025-11-01', expectedDischarge: '2026-01-29',
    counselor: DAVID, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED — IOP completed; 90-day AA milestone')],
    lastUa: 'Negative', mood: 9, craving: 1,
    notes: [n('pd7n1', '2026-01-28 18:00', 'Discharge Summary', DAVID, 'DAP', 'Shawn completed 90-day IOP with perfect attendance. 90-day AA milestone. Sponsoring 2 newcomers. Transitioning to OP monthly check-ins. Exceptional recovery trajectory.'), n('pd7n2', '2026-01-10 14:00', 'Individual', DAVID, 'BIRP', 'Pre-discharge. Shawn leading Monday AA meeting. GAD resolved. Family relationships restored. Step 10 daily practice established.'), n('pd7n3', '2025-12-01 11:00', 'Medical', DR_STONE, 'SOAP', 'S: 30 days sober. GAD minimal. O: GAD-7: 2. LFTs normal. A: AUD in sustained remission; GAD resolved. P: Continue plan.')],
    goals: [g('pd7g1', 'Substance Use', 'AUD — IOP completion', 'Complete IOP 90 days; AA home group', 'IOP 3× weekly; AA; sponsor', 'Met', '2026-01-29')],
    nextAppointment: 'Discharged to OP — 2026-01-29',
  },

  {
    id: 'pd8', mrn: 'MRN-58000', firstName: 'Gloria', lastName: 'Watts',
    dob: '1986-02-14', age: 40, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder', coOccurring: ['PTSD', 'MDD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 74, amaRisk: 'Low', los: 30,
    admitDate: '2026-04-01', expectedDischarge: '2026-05-01',
    counselor: SARAH, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — Residential complete; transitioned to PHP')],
    lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 2,
    notes: [n('pd8n1', '2026-04-30 10:00', 'Discharge Summary', SARAH, 'DAP', 'Gloria completed 30-day residential. Buprenorphine stable. PTSD Seeking Safety completed. MDD remitting. PHP starts Monday. Sober living confirmed.'), n('pd8n2', '2026-04-22 14:00', 'Individual', SARAH, 'BIRP', 'Final week — Gloria strong and prepared. Family session completed. Relapse prevention plan thorough.'), n('pd8n3', '2026-04-10 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Buprenorphine stable. Mood improving. O: PHQ-9: 8. COWS 0. A: OUD on MAT; MDD improving; PTSD processing well. P: Continue to discharge.')],
    goals: [g('pd8g1', 'Substance Use', 'OUD — residential', 'Complete residential; PHP transition', 'Residential 30 days; OTP', 'Met', '2026-05-01')],
    nextAppointment: 'Discharged to PHP — 2026-05-01',
  },

  {
    id: 'pd9', mrn: 'MRN-57000', firstName: 'Kevin', lastName: 'Holland',
    dob: '1971-09-22', age: 54, gender: 'M', insurance: 'Cigna',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Major Depressive Disorder'],
    asam: { d1: 2, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 }, recoveryScore: 79, amaRisk: 'Low', los: 60,
    admitDate: '2026-02-01', expectedDischarge: '2026-04-02',
    counselor: TAMARA, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED — PHP complete')],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [n('pd9n1', '2026-04-01 10:00', 'Discharge Summary', TAMARA, 'DAP', 'Kevin completed 60-day PHP. Exceptional progress. MDD in full remission. AA home group secretary. IOP transition for 4 more weeks, then OP.'), n('pd9n2', '2026-03-20 14:00', 'Individual', TAMARA, 'BIRP', 'Pre-discharge planning. Kevin confident and clear-eyed. Family amends in progress. Step 8 list complete.'), n('pd9n3', '2026-02-20 10:00', 'Medical', DR_STONE, 'SOAP', 'S: Strong progress. 19 days sober. O: PHQ-9: 6. LFTs normal. A: AUD in remission; MDD improving rapidly with sobriety. P: Continue PHP.')],
    goals: [g('pd9g1', 'Substance Use', 'AUD with MDD — PHP completion', 'Complete PHP; AA home group', 'PHP 60 days; AA; sponsor', 'Met', '2026-04-02')],
    nextAppointment: 'Discharged to IOP — 2026-04-02',
  },

  {
    id: 'pd10', mrn: 'MRN-56000', firstName: 'Tonya', lastName: 'Manning',
    dob: '1988-12-01', age: 37, gender: 'F', insurance: 'Aetna Better Health of Maryland',
    program: 'Residential', primaryDiagnosis: 'Cocaine Use Disorder (Severe)', coOccurring: ['Bipolar I Disorder'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 68, amaRisk: 'Low', los: 28,
    admitDate: '2026-05-01', expectedDischarge: '2026-05-29',
    counselor: KEVIN, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — Residential complete; lithium stable')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [n('pd10n1', '2026-05-28 10:00', 'Discharge Summary', KEVIN, 'DAP', 'Tonya completed 28-day residential. Cocaine-free. Lithium 0.9 mEq/L — therapeutic. Bipolar I stable. PHP starts tomorrow. DBSA group joined.'), n('pd10n2', '2026-05-20 14:00', 'Individual', KEVIN, 'BIRP', 'Final week. Tonya insightful about Bipolar-cocaine cycle. Mood stable 10 days. Lithium compliance — no challenges.'), n('pd10n3', '2026-05-10 10:00', 'Medical', DR_LEE, 'SOAP', 'S: Cocaine free 9 days. Mood stabilizing. O: Lithium 0.8 mEq/L. PHQ-9: 8. A: CUD in remission; Bipolar I — lithium titrating. P: Increase lithium to 600mg BID.')],
    goals: [g('pd10g1', 'Substance Use', 'CUD with Bipolar I — residential', 'Complete residential; Bipolar I stable on lithium', 'Residential 28 days; lithium compliance', 'Met', '2026-05-29')],
    nextAppointment: 'Discharged to PHP — 2026-05-29',
  },

  {
    id: 'pd11', mrn: 'MRN-55000', firstName: 'Darrell', lastName: 'Norwood',
    dob: '1979-07-14', age: 46, gender: 'M', insurance: 'Maryland Medicaid / HealthChoice',
    program: 'IOP', primaryDiagnosis: 'Severe Alcohol Use Disorder', coOccurring: ['Hypertension', 'Gout'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 2, d5: 3, d6: 2 }, recoveryScore: 85, amaRisk: 'Low', los: 90,
    admitDate: '2025-10-15', expectedDischarge: '2026-01-13',
    counselor: DAVID, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — IOP complete; gout resolved')],
    lastUa: 'Negative', mood: 9, craving: 1,
    notes: [n('pd11n1', '2026-01-12 18:00', 'Discharge Summary', DAVID, 'DAP', 'Darrell completed 90-day IOP. AUD in sustained remission. Gout resolved — uric acid 5.0. BP 122/78. Outstanding peer contribution. Transitioning to OP.'), n('pd11n2', '2025-12-20 14:00', 'Individual', DAVID, 'BIRP', 'Session 10 — Darrell describing best health of his adult life. Gout-free 45 days. BP controlled. Strong recovery trajectory.'), n('pd11n3', '2025-11-10 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 26 days sober. Gout improving. O: Uric acid 6.1. BP 130/84. A: AUD in remission; gout improving; HTN improving. P: Continue allopurinol; lisinopril.')],
    goals: [g('pd11g1', 'Substance Use', 'AUD with gout and HTN', 'IOP completion; health improvement', '90-day IOP; medical compliance', 'Met', '2026-01-13')],
    nextAppointment: 'Discharged to OP — 2026-01-13',
  },

  {
    id: 'pd12', mrn: 'MRN-54000', firstName: 'Carolyn', lastName: 'Ellison',
    dob: '1992-05-09', age: 34, gender: 'F', insurance: 'CareFirst BlueCross BlueShield of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['PTSD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 70, amaRisk: 'Low', los: 30,
    admitDate: '2026-03-15', expectedDischarge: '2026-04-14',
    counselor: TAMARA, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — Residential complete')],
    lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 2,
    notes: [n('pd12n1', '2026-04-13 10:00', 'Discharge Summary', TAMARA, 'DAP', 'Carolyn completed 30-day residential. Buprenorphine 16mg stable. PTSD Seeking Safety completed. PHP starts Monday. Sober housing secured.'), n('pd12n2', '2026-04-05 14:00', 'Individual', TAMARA, 'BIRP', 'Final week. Strong progress on trauma work. Relapse prevention solid.'), n('pd12n3', '2026-03-25 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2 — excellent. O: COWS 0. Buprenorphine stable. A: OUD on MAT; PTSD processing. P: Continue to discharge.')],
    goals: [g('pd12g1', 'Substance Use', 'OUD — residential', 'Complete residential; PHP transition', 'Residential 30 days', 'Met', '2026-04-14')],
    nextAppointment: 'Discharged to PHP — 2026-04-14',
  },

  {
    id: 'pd13', mrn: 'MRN-53000', firstName: 'James', lastName: 'Thornton',
    dob: '1968-11-03', age: 57, gender: 'M', insurance: 'BlueCross BlueShield',
    program: 'PHP', primaryDiagnosis: 'Severe AUD', coOccurring: ['CAD', 'T2DM'],
    asam: { d1: 2, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 77, amaRisk: 'Low', los: 60,
    admitDate: '2026-01-10', expectedDischarge: '2026-03-10',
    counselor: SARAH, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — PHP complete; cardiac stable')],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [n('pd13n1', '2026-03-09 10:00', 'Discharge Summary', SARAH, 'DAP', 'James completed 60-day PHP. CAD stable. HbA1c 6.6. AUD in sustained remission. AA home group established. Excellent outcome.'), n('pd13n2', '2026-02-25 14:00', 'Individual', SARAH, 'BIRP', 'Pre-discharge. James describing transformed health. Cardiac rehab graduate. Sponsoring 1 newcomer.'), n('pd13n3', '2026-02-01 10:00', 'Medical', DR_LEE, 'SOAP', 'S: Excellent. 21 days sober. O: HbA1c 7.0. BP 124/80. A: AUD in remission; cardiac stable; DM2 improving. P: Continue plan.')],
    goals: [g('pd13g1', 'Substance Use', 'AUD with cardiac and metabolic disease', 'PHP completion; cardiac and metabolic improvement', 'PHP 60 days; medical compliance', 'Met', '2026-03-10')],
    nextAppointment: 'Discharged to IOP — 2026-03-10',
  },

  {
    id: 'pd14', mrn: 'MRN-52000', firstName: 'Sabrina', lastName: 'Holt',
    dob: '1995-08-22', age: 30, gender: 'F', insurance: 'Aetna Better Health of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['MDD', 'BPD'],
    asam: { d1: 3, d2: 2, d3: 4, d4: 4, d5: 4, d6: 4 }, recoveryScore: 62, amaRisk: 'Low', los: 35,
    admitDate: '2026-04-20', expectedDischarge: '2026-05-25',
    counselor: KEVIN, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — Residential; DBT milieu completed')],
    lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2,
    notes: [n('pd14n1', '2026-05-24 10:00', 'Discharge Summary', KEVIN, 'DAP', 'Sabrina completed 35-day residential DBT milieu. BPD — crisis frequency markedly reduced. Buprenorphine 12mg stable. DBT skills consolidated. PHP starts tomorrow.'), n('pd14n2', '2026-05-15 14:00', 'Individual', KEVIN, 'BIRP', 'Pre-discharge. Sabrina demonstrating consistent DBT skill use. No crises past 10 days. Major progress.'), n('pd14n3', '2026-05-01 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. Mood improving. O: PHQ-9: 10. COWS 0. A: OUD on MAT; MDD improving; BPD — DBT effective. P: Continue plan.')],
    goals: [g('pd14g1', 'Substance Use', 'OUD with BPD and MDD — DBT residential', 'Complete residential DBT; PHP transition', 'Residential 35 days; DBT skills', 'Met', '2026-05-25')],
    nextAppointment: 'Discharged to PHP — 2026-05-25',
  },

  {
    id: 'pd15', mrn: 'MRN-51000', firstName: 'Brandon', lastName: 'Garrett',
    dob: '1983-03-17', age: 43, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland',
    program: 'IOP', primaryDiagnosis: 'Cocaine Use Disorder (Moderate)', coOccurring: ['GAD'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 2, d5: 2, d6: 1 }, recoveryScore: 86, amaRisk: 'Low', los: 90,
    admitDate: '2025-10-01', expectedDischarge: '2025-12-30',
    counselor: MARIA, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED — IOP 90 days; full employment')],
    lastUa: 'Negative', mood: 9, craving: 1,
    notes: [n('pd15n1', '2025-12-29 18:00', 'Discharge Summary', MARIA, 'DAP', 'Brandon completed 90-day IOP. Cocaine free 90 days. GAD resolved. Promoted at work. AA home group. Transitioning to OP.'), n('pd15n2', '2025-12-15 14:00', 'Individual', MARIA, 'BIRP', 'Pre-discharge. Brandon describing best professional and personal year. Cocaine-free, anxiety-free, promoted.'), n('pd15n3', '2025-11-01 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 30 days cocaine-free. O: GAD-7: 3. A: CUD in remission; GAD resolving. P: Continue IOP.')],
    goals: [g('pd15g1', 'Substance Use', 'CUD with GAD', 'IOP completion; anxiety resolved', '90-day IOP; NA; workplace plan', 'Met', '2025-12-30')],
    nextAppointment: 'Discharged to OP — 2025-12-30',
  },

  {
    id: 'pd16', mrn: 'MRN-50000', firstName: 'Wanda', lastName: 'Pearson',
    dob: '1976-07-04', age: 49, gender: 'F', insurance: 'MedStar Family Choice',
    program: 'Residential', primaryDiagnosis: 'Severe AUD', coOccurring: ['PTSD (DV)', 'MDD'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 4, d5: 4, d6: 3 }, recoveryScore: 73, amaRisk: 'Low', los: 30,
    admitDate: '2026-03-01', expectedDischarge: '2026-03-31',
    counselor: TAMARA, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED — Safe housing; PHP transition')],
    lastUa: 'Negative', mood: 8, craving: 2,
    notes: [n('pd16n1', '2026-03-30 10:00', 'Discharge Summary', TAMARA, 'DAP', 'Wanda completed 30-day residential. AUD in remission. DV safety plan active. Transitional housing confirmed. PHP starts Monday. Excellent therapeutic engagement.'), n('pd16n2', '2026-03-22 14:00', 'Individual', TAMARA, 'BIRP', 'Pre-discharge. Wanda in safe housing. PTSD improving. Protective order confirmed.'), n('pd16n3', '2026-03-10 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 10 days sober. O: PHQ-9: 12. A: AUD in remission; PTSD in treatment; MDD improving. P: Continue plan.')],
    goals: [g('pd16g1', 'Substance Use', 'AUD with DV trauma', 'Residential completion; safe housing', 'Residential 30 days; safety plan', 'Met', '2026-03-31')],
    nextAppointment: 'Discharged to PHP — 2026-03-31',
  },

  {
    id: 'pd17', mrn: 'MRN-49000', firstName: 'Terrell', lastName: 'Jackson',
    dob: '1987-10-28', age: 38, gender: 'M', insurance: 'Cigna',
    program: 'PHP', primaryDiagnosis: 'Severe OUD', coOccurring: ['Bipolar II', 'HCV (SVR)'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 78, amaRisk: 'Low', los: 60,
    admitDate: '2026-01-15', expectedDischarge: '2026-03-15',
    counselor: DAVID, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — PHP complete; HCV cured')],
    lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 2,
    notes: [n('pd17n1', '2026-03-14 11:00', 'Discharge Summary', DAVID, 'DAP', 'Terrell completed 60-day PHP. Buprenorphine stable. HCV SVR confirmed. Bipolar II — lamotrigine effective. IOP transition. DBSA group joined.'), n('pd17n2', '2026-03-01 14:00', 'Individual', DAVID, 'BIRP', 'Pre-discharge. Terrell describing himself as "healthy for the first time." HCV cured. Mood stable 3 weeks.'), n('pd17n3', '2026-02-01 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: OUD stable on MAT. HCV SVR12 pending. Mood stable. O: Lamotrigine therapeutic. A: OUD on MAT; Bipolar II controlled; HCV treatment complete. P: Continue.')],
    goals: [g('pd17g1', 'Substance Use', 'OUD with Bipolar II — PHP', 'PHP completion; mood stable; HCV treated', 'PHP 60 days; MAT; mood charting', 'Met', '2026-03-15')],
    nextAppointment: 'Discharged to IOP — 2026-03-15',
  },

  {
    id: 'pd18', mrn: 'MRN-48000', firstName: 'Michelle', lastName: 'Cannon',
    dob: '1991-02-14', age: 35, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)',
    program: 'Residential', primaryDiagnosis: 'Meth Use Disorder (Severe)', coOccurring: ['MDD', 'Insomnia'],
    asam: { d1: 2, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 66, amaRisk: 'Low', los: 30,
    admitDate: '2026-05-05', expectedDischarge: '2026-06-04',
    counselor: KEVIN, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — Residential complete; sleep restored')],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [n('pd18n1', '2026-06-03 10:00', 'Discharge Summary', KEVIN, 'DAP', 'Michelle completed 30-day residential. Meth-free. Sleep 7-8 hours on mirtazapine. MDD improving significantly. PHP starts tomorrow.'), n('pd18n2', '2026-05-25 14:00', 'Individual', KEVIN, 'BIRP', 'Final week. Michelle sleeping well — cognitive clearing impressive. SMART Recovery enrolled.'), n('pd18n3', '2026-05-15 10:00', 'Medical', DR_LEE, 'SOAP', 'S: Week 2. Sleep improving. O: PHQ-9: 9 (was 17). A: MUD in remission; MDD improving; sleep improving on mirtazapine. P: Continue plan.')],
    goals: [g('pd18g1', 'Substance Use', 'Meth UD with MDD', 'Residential completion; sleep restored; depression treated', 'Residential 30 days; mirtazapine compliance', 'Met', '2026-06-04')],
    nextAppointment: 'Discharged to PHP — 2026-06-04',
  },

  {
    id: 'pd19', mrn: 'MRN-47000', firstName: 'Robert', lastName: 'Haynes',
    dob: '1972-04-05', age: 54, gender: 'M', insurance: 'BlueCross BlueShield',
    program: 'IOP', primaryDiagnosis: 'Severe AUD', coOccurring: ['Peripheral Neuropathy', 'HTN'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 2, d5: 3, d6: 2 }, recoveryScore: 83, amaRisk: 'Low', los: 90,
    admitDate: '2025-09-01', expectedDischarge: '2025-11-30',
    counselor: TAMARA, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — IOP complete; neuropathy improving')],
    lastUa: 'Negative', mood: 9, craving: 1,
    notes: [n('pd19n1', '2025-11-29 18:00', 'Discharge Summary', TAMARA, 'DAP', 'Robert completed 90-day IOP. Alcohol-free. Peripheral neuropathy significantly reduced. BP controlled. Outstanding recovery. Transitioning to OP.'), n('pd19n2', '2025-11-15 14:00', 'Individual', TAMARA, 'BIRP', 'Pre-discharge. Robert describing neuropathy pain at 1/10. Sobriety transforming his health. AA sponsor relationship strong.'), n('pd19n3', '2025-10-01 11:00', 'Medical', DR_LEE, 'SOAP', 'S: 30 days sober. Neuropathy improving. O: Pain 4/10 (was 8/10). BP 126/82. A: AUD in remission; neuropathy reversing. P: Continue.')],
    goals: [g('pd19g1', 'Substance Use', 'AUD with neuropathy', 'IOP completion; neuropathy reversal', '90-day IOP; AA; medical compliance', 'Met', '2025-11-30')],
    nextAppointment: 'Discharged to OP — 2025-11-30',
  },

  {
    id: 'pd20', mrn: 'MRN-46000', firstName: 'Crystal', lastName: 'Barnett',
    dob: '1994-09-16', age: 31, gender: 'F', insurance: 'Aetna Better Health of Maryland',
    program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['PTSD', 'MDD', 'ADHD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 68, amaRisk: 'Low', los: 28,
    admitDate: '2026-06-01', expectedDischarge: '2026-06-29',
    counselor: SARAH, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — Residential; OTP enrolled')],
    lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2,
    notes: [n('pd20n1', '2026-06-28 10:00', 'Discharge Summary', SARAH, 'DAP', 'Crystal completed 28-day residential. Buprenorphine 14mg stable. ADHD — Strattera initiated. PTSD work begun. OTP enrolled. PHP starts Monday.'), n('pd20n2', '2026-06-20 14:00', 'Individual', SARAH, 'BIRP', 'Final week. Crystal confident. ADHD improvement noted on Strattera. PTSD processing engaged.'), n('pd20n3', '2026-06-10 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. O: COWS 0. PHQ-9: 12. Strattera started. A: OUD on MAT; ADHD early response; MDD improving; PTSD treatment engaged. P: Continue.')],
    goals: [g('pd20g1', 'Substance Use', 'OUD with PTSD, MDD, ADHD', 'Residential completion; MAT; ADHD treated', 'Residential 28 days; OTP; Strattera', 'Met', '2026-06-29')],
    nextAppointment: 'Discharged to PHP — 2026-06-29',
  },

  // pd21 - pd40: very compact discharged patient records
  { id: 'pd21', mrn: 'MRN-45000', firstName: 'Victor', lastName: 'Cruz', dob: '1980-01-20', age: 46, gender: 'M', insurance: 'Maryland Medicaid / HealthChoice', program: 'IOP', primaryDiagnosis: 'Severe AUD', coOccurring: ['GAD', 'Hypertension'], asam: { d1: 1, d2: 1, d3: 2, d4: 2, d5: 3, d6: 2 }, recoveryScore: 81, amaRisk: 'Low', los: 90, admitDate: '2025-08-01', expectedDischarge: '2025-10-30', counselor: DAVID, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd21n1', '2025-10-29 18:00', 'Discharge Summary', DAVID, 'DAP', 'Victor completed 90-day IOP. AUD in sustained remission. GAD resolved. BP normalized. AA home group secretary.'), n('pd21n2', '2025-10-01 14:00', 'Individual', DAVID, 'BIRP', '60-day check: Victor thriving. Health improved dramatically.'), n('pd21n3', '2025-09-01 11:00', 'Medical', DR_STONE, 'SOAP', 'S: 30 days sober. O: GAD-7: 2. BP 122/78. A: AUD in remission; GAD resolving. P: Continue.')], goals: [g('pd21g1', 'Substance Use', 'AUD — IOP', 'Complete IOP', '90-day IOP', 'Met', '2025-10-30')], nextAppointment: 'Discharged to OP — 2025-10-30' },

  { id: 'pd22', mrn: 'MRN-44000', firstName: 'Sherry', lastName: 'McBride', dob: '1986-05-12', age: 40, gender: 'F', insurance: 'CareFirst BlueCross BlueShield of Maryland', program: 'PHP', primaryDiagnosis: 'Severe OUD', coOccurring: ['PTSD', 'GAD'], asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 75, amaRisk: 'Low', los: 60, admitDate: '2025-11-15', expectedDischarge: '2026-01-14', counselor: TAMARA, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Positive (BUP prescribed)', mood: 8, craving: 2, notes: [n('pd22n1', '2026-01-13 11:00', 'Discharge Summary', TAMARA, 'DAP', 'Sherry completed 60-day PHP. OUD on MAT stable. PTSD — EMDR progressing well. GAD resolving. IOP transition confirmed.'), n('pd22n2', '2025-12-20 14:00', 'Individual', TAMARA, 'BIRP', 'Pre-discharge. Strong progress in EMDR. Buprenorphine compliant.'), n('pd22n3', '2025-12-01 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 3. O: COWS 0. GAD-7: 4. A: OUD stable; PTSD improving; GAD resolving. P: Continue.')], goals: [g('pd22g1', 'Substance Use', 'OUD with PTSD — PHP', 'PHP completion; EMDR progress', 'PHP 60 days; MAT; EMDR', 'Met', '2026-01-14')], nextAppointment: 'Discharged to IOP — 2026-01-14' },

  { id: 'pd23', mrn: 'MRN-43000', firstName: 'Tony', lastName: 'Whitfield', dob: '1977-08-31', age: 48, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland', program: 'Residential', primaryDiagnosis: 'Severe AUD', coOccurring: ['T2DM', 'CAD'], asam: { d1: 2, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 74, amaRisk: 'Low', los: 30, admitDate: '2026-04-10', expectedDischarge: '2026-05-10', counselor: KEVIN, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd23n1', '2026-05-09 10:00', 'Discharge Summary', KEVIN, 'DAP', 'Tony completed 30-day residential. AUD in remission. Cardiac and metabolic markers improving. PHP starts Monday.'), n('pd23n2', '2026-05-01 14:00', 'Individual', KEVIN, 'BIRP', 'Pre-discharge. Tony confident. Cardiac rehab enrolled. AA sponsor identified.'), n('pd23n3', '2026-04-20 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 10 days sober. O: HbA1c 7.2. BP 128/82. A: AUD in remission; T2DM improving; CAD stable. P: Continue.')], goals: [g('pd23g1', 'Substance Use', 'AUD with medical comorbidities', 'Residential completion; health improvement', 'Residential 30 days; medical compliance', 'Met', '2026-05-10')], nextAppointment: 'Discharged to PHP — 2026-05-10' },

  { id: 'pd24', mrn: 'MRN-42000', firstName: 'Patricia', lastName: 'Jordan', dob: '1989-12-25', age: 36, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)', program: 'IOP', primaryDiagnosis: 'CUD (Moderate)', coOccurring: ['Social Anxiety', 'MDD (Mild)'], asam: { d1: 1, d2: 0, d3: 1, d4: 2, d5: 2, d6: 2 }, recoveryScore: 84, amaRisk: 'Low', los: 90, admitDate: '2025-09-15', expectedDischarge: '2025-12-14', counselor: MARIA, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd24n1', '2025-12-13 18:00', 'Discharge Summary', MARIA, 'DAP', 'Patricia completed 90-day IOP. Cannabis-free. Social anxiety markedly improved. MDD resolved. Transitioning to OP.'), n('pd24n2', '2025-11-20 14:00', 'Individual', MARIA, 'BIRP', '75-day check. Patricia now leading peer support check-ins in group.'), n('pd24n3', '2025-10-15 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 30 days sober. O: GAD-7: 3. PHQ-9: 2. A: CUD in remission; anxiety and depression resolving. P: Continue.')], goals: [g('pd24g1', 'Substance Use', 'CUD with anxiety and depression', 'IOP completion; anxiety resolved', '90-day IOP; therapy', 'Met', '2025-12-14')], nextAppointment: 'Discharged to OP — 2025-12-14' },

  { id: 'pd25', mrn: 'MRN-41000', firstName: 'Leonard', lastName: 'Simms', dob: '1973-02-07', age: 53, gender: 'M', insurance: 'Cigna', program: 'PHP', primaryDiagnosis: 'Severe AUD', coOccurring: ['Cirrhosis (Child-Pugh A)', 'Peripheral Neuropathy'], asam: { d1: 2, d2: 2, d3: 3, d4: 4, d5: 4, d6: 3 }, recoveryScore: 72, amaRisk: 'Low', los: 60, admitDate: '2025-12-01', expectedDischarge: '2026-01-30', counselor: SARAH, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — Liver stable')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd25n1', '2026-01-29 11:00', 'Discharge Summary', SARAH, 'DAP', 'Leonard completed 60-day PHP. Cirrhosis stable. Neuropathy 2/10 (was 7/10). AUD in sustained remission. AA home group.'), n('pd25n2', '2026-01-15 14:00', 'Individual', SARAH, 'BIRP', 'Pre-discharge. Leonard describing best health in decade. Hepatology follow-up confirmed.'), n('pd25n3', '2025-12-20 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 19 days sober. Cirrhosis stable. O: Child-Pugh A (5pts). Neuropathy 4/10. A: AUD in remission; liver stable; neuropathy improving. P: Continue.')], goals: [g('pd25g1', 'Substance Use', 'AUD with cirrhosis', 'PHP; liver stability', 'PHP 60 days; hepatology', 'Met', '2026-01-30')], nextAppointment: 'Discharged to IOP — 2026-01-30' },

  { id: 'pd26', mrn: 'MRN-40000', firstName: 'Nina', lastName: 'Watkins', dob: '1997-06-14', age: 29, gender: 'F', insurance: 'Maryland Medicaid / HealthChoice', program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['BPD', 'MDD'], asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 63, amaRisk: 'Low', los: 35, admitDate: '2026-05-15', expectedDischarge: '2026-06-19', counselor: KEVIN, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — DBT milieu completed')], lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2, notes: [n('pd26n1', '2026-06-18 10:00', 'Discharge Summary', KEVIN, 'DAP', 'Nina completed 35-day residential DBT milieu. BPD crisis frequency reduced 80%. Buprenorphine 12mg stable. PHP starts tomorrow.'), n('pd26n2', '2026-06-10 14:00', 'Individual', KEVIN, 'BIRP', 'Final week. Nina applying DBT skills consistently. No crises past 12 days.'), n('pd26n3', '2026-05-25 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. O: COWS 0. PHQ-9: 11. A: OUD on MAT; BPD improving with DBT; MDD improving. P: Continue.')], goals: [g('pd26g1', 'Substance Use', 'OUD with BPD and MDD', 'Residential DBT completion; PHP transition', 'Residential 35 days; DBT skills', 'Met', '2026-06-19')], nextAppointment: 'Discharged to PHP — 2026-06-19' },

  { id: 'pd27', mrn: 'MRN-39000', firstName: 'Harold', lastName: 'Patterson', dob: '1966-10-18', age: 59, gender: 'M', insurance: 'BlueCross BlueShield', program: 'IOP', primaryDiagnosis: 'Severe AUD', coOccurring: ['HTN', 'OSA'], asam: { d1: 1, d2: 1, d3: 2, d4: 2, d5: 3, d6: 2 }, recoveryScore: 82, amaRisk: 'Low', los: 90, admitDate: '2025-07-01', expectedDischarge: '2025-09-29', counselor: DAVID, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 9, craving: 1, notes: [n('pd27n1', '2025-09-28 18:00', 'Discharge Summary', DAVID, 'DAP', 'Harold completed 90-day IOP. AUD in sustained remission. CPAP compliance excellent. BP controlled. Transitioning to OP.'), n('pd27n2', '2025-09-01 14:00', 'Individual', DAVID, 'BIRP', '60-day check. Harold describing transformed sleep and BP. Sponsoring 2 newcomers.'), n('pd27n3', '2025-08-01 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 30 days sober. CPAP compliance 90%. O: BP 124/80. AHI 3. A: AUD in remission; OSA controlled; HTN improving. P: Continue.')], goals: [g('pd27g1', 'Substance Use', 'AUD with OSA and HTN', 'IOP completion; health improvement', '90-day IOP; CPAP; medical compliance', 'Met', '2025-09-29')], nextAppointment: 'Discharged to OP — 2025-09-29' },

  { id: 'pd28', mrn: 'MRN-38000', firstName: 'Renee', lastName: 'Chambers', dob: '1990-03-22', age: 36, gender: 'F', insurance: 'Aetna Better Health of Maryland', program: 'Residential', primaryDiagnosis: 'Meth UD (Severe)', coOccurring: ['Meth-induced psychosis (resolved)', 'MDD'], asam: { d1: 2, d2: 2, d3: 4, d4: 3, d5: 4, d6: 4 }, recoveryScore: 65, amaRisk: 'Low', los: 30, admitDate: '2026-03-20', expectedDischarge: '2026-04-19', counselor: TAMARA, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — Psychosis resolved; PHP')], lastUa: 'Negative', mood: 7, craving: 2, notes: [n('pd28n1', '2026-04-18 10:00', 'Discharge Summary', TAMARA, 'DAP', 'Renee completed 30-day residential. Meth-induced psychosis fully resolved. Risperidone d/c at Week 4. MDD — mirtazapine effective. PHP starts tomorrow.'), n('pd28n2', '2026-04-10 14:00', 'Individual', TAMARA, 'BIRP', 'Final week. Renee cognitively clear. SMART Recovery enrolled. PHP schedule confirmed.'), n('pd28n3', '2026-04-01 10:00', 'Medical', DR_LEE, 'SOAP', 'S: Meth free 12 days. Psychosis resolved. O: PHQ-9: 8. No hallucinations or paranoia. A: MUD in remission; psychosis resolved; MDD improving. P: D/c risperidone; continue mirtazapine.')], goals: [g('pd28g1', 'Substance Use', 'Meth UD with psychosis', 'Residential; psychosis resolution; PHP', 'Residential 30 days; medication compliance', 'Met', '2026-04-19')], nextAppointment: 'Discharged to PHP — 2026-04-19' },

  { id: 'pd29', mrn: 'MRN-37000', firstName: 'Andre', lastName: 'Fleming', dob: '1985-11-07', age: 40, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland', program: 'PHP', primaryDiagnosis: 'Cocaine UD (Severe)', coOccurring: ['Bipolar II', 'ADHD'], asam: { d1: 2, d2: 0, d3: 2, d4: 3, d5: 3, d6: 2 }, recoveryScore: 76, amaRisk: 'Low', los: 60, admitDate: '2025-12-15', expectedDischarge: '2026-02-13', counselor: SARAH, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd29n1', '2026-02-12 11:00', 'Discharge Summary', SARAH, 'DAP', 'Andre completed 60-day PHP. CUD in remission. Bipolar II stable on lamotrigine. ADHD — Strattera effective. IOP transition.'), n('pd29n2', '2026-02-01 14:00', 'Individual', SARAH, 'BIRP', 'Pre-discharge. Andre describing mood stability never experienced before proper treatment.'), n('pd29n3', '2026-01-10 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 26 days cocaine-free. Mood stable. ADHD improving on Strattera. O: Lamotrigine therapeutic. A: CUD in remission; Bipolar II stable; ADHD improving. P: Continue.')], goals: [g('pd29g1', 'Substance Use', 'CUD with Bipolar II and ADHD', 'PHP; mood stable; ADHD treated', 'PHP 60 days; medication compliance', 'Met', '2026-02-13')], nextAppointment: 'Discharged to IOP — 2026-02-13' },

  { id: 'pd30', mrn: 'MRN-36000', firstName: 'Latoya', lastName: 'Bridges', dob: '1993-08-28', age: 32, gender: 'F', insurance: 'MedStar Family Choice', program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['PTSD (IPV)', 'MDD'], asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 70, amaRisk: 'Low', los: 30, admitDate: '2026-04-25', expectedDischarge: '2026-05-25', counselor: KEVIN, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — Safe housing; PHP')], lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2, notes: [n('pd30n1', '2026-05-24 10:00', 'Discharge Summary', KEVIN, 'DAP', 'Latoya completed 30-day residential. Buprenorphine stable. Safe housing confirmed — DV transitional shelter. PHP starts Monday. EMDR referral placed.'), n('pd30n2', '2026-05-15 14:00', 'Individual', KEVIN, 'BIRP', 'Pre-discharge. Latoya strong and prepared. Protective order confirmed.'), n('pd30n3', '2026-05-05 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. O: COWS 0. PHQ-9: 12. A: OUD on MAT; MDD improving; PTSD in treatment. P: Continue.')], goals: [g('pd30g1', 'Substance Use', 'OUD with IPV trauma', 'Residential; safe housing; PHP', 'Residential 30 days; safety plan; OTP', 'Met', '2026-05-25')], nextAppointment: 'Discharged to PHP — 2026-05-25' },

  { id: 'pd31', mrn: 'MRN-35000', firstName: 'Timothy', lastName: 'Burgess', dob: '1970-05-14', age: 56, gender: 'M', insurance: 'Cigna', program: 'IOP', primaryDiagnosis: 'Severe AUD', coOccurring: ['Peripheral Neuropathy', 'T2DM'], asam: { d1: 1, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 }, recoveryScore: 80, amaRisk: 'Low', los: 90, admitDate: '2025-10-01', expectedDischarge: '2025-12-30', counselor: TAMARA, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 9, craving: 1, notes: [n('pd31n1', '2025-12-29 18:00', 'Discharge Summary', TAMARA, 'DAP', 'Timothy completed 90-day IOP. Alcohol-free. Neuropathy 2/10. DM2 HbA1c 6.6. Health transformed by sobriety.'), n('pd31n2', '2025-12-01 14:00', 'Individual', TAMARA, 'BIRP', '60-day. Timothy describing life without alcohol-induced pain.'), n('pd31n3', '2025-11-01 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 30 days sober. O: HbA1c 7.0. Neuropathy 4/10. A: AUD in remission; health improving. P: Continue.')], goals: [g('pd31g1', 'Substance Use', 'AUD with neuropathy and T2DM', 'IOP; health improvement', '90-day IOP; medical compliance', 'Met', '2025-12-30')], nextAppointment: 'Discharged to OP — 2025-12-30' },

  { id: 'pd32', mrn: 'MRN-34000', firstName: 'Monique', lastName: 'Banks', dob: '1996-01-11', age: 30, gender: 'F', insurance: 'Priority Partners (Johns Hopkins)', program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['MDD', 'PTSD'], asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 67, amaRisk: 'Low', los: 28, admitDate: '2026-06-25', expectedDischarge: '2026-07-23', counselor: SARAH, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — PHP started 7/23')], lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2, notes: [n('pd32n1', '2026-07-22 10:00', 'Discharge Summary', SARAH, 'DAP', 'Monique completed 28-day residential. Buprenorphine 14mg stable. PTSD Seeking Safety complete. PHP starts today. Strong therapeutic engagement.'), n('pd32n2', '2026-07-14 14:00', 'Individual', SARAH, 'BIRP', 'Pre-discharge. Monique prepared and confident. Sober living confirmed.'), n('pd32n3', '2026-07-05 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. O: COWS 0. PHQ-9: 10. A: OUD on MAT; MDD improving; PTSD — Seeking Safety responding. P: Continue.')], goals: [g('pd32g1', 'Substance Use', 'Severe OUD — residential', 'Residential completion; PHP', 'Residential 28 days; OTP; sober living', 'Met', '2026-07-23')], nextAppointment: 'Discharged to PHP — 2026-07-23' },

  { id: 'pd33', mrn: 'MRN-33000', firstName: 'Glenn', lastName: 'Stephens', dob: '1979-04-25', age: 47, gender: 'M', insurance: 'CareFirst BlueCross BlueShield of Maryland', program: 'PHP', primaryDiagnosis: 'Severe AUD', coOccurring: ['HTN', 'Gout'], asam: { d1: 2, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 }, recoveryScore: 79, amaRisk: 'Low', los: 60, admitDate: '2026-02-01', expectedDischarge: '2026-04-02', counselor: DAVID, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd33n1', '2026-04-01 10:00', 'Discharge Summary', DAVID, 'DAP', 'Glenn completed 60-day PHP. AUD in sustained remission. Gout resolved. BP normalized. AA service commitment.'), n('pd33n2', '2026-03-15 14:00', 'Individual', DAVID, 'BIRP', 'Pre-discharge. Glenn in best health of his 40s. AA sponsor relationship strong.'), n('pd33n3', '2026-02-20 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 19 days sober. Gout 1/10. O: Uric acid 5.1. BP 126/80. A: AUD in remission; gout resolved. P: Continue.')], goals: [g('pd33g1', 'Substance Use', 'AUD with gout and HTN', 'PHP; health improvement', 'PHP 60 days; medical compliance', 'Met', '2026-04-02')], nextAppointment: 'Discharged to IOP — 2026-04-02' },

  { id: 'pd34', mrn: 'MRN-32000', firstName: 'Keisha', lastName: 'Spencer', dob: '1991-09-03', age: 34, gender: 'F', insurance: 'Aetna Better Health of Maryland', program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['Bipolar I', 'PTSD'], asam: { d1: 3, d2: 2, d3: 4, d4: 4, d5: 4, d6: 4 }, recoveryScore: 65, amaRisk: 'Low', los: 35, admitDate: '2026-03-10', expectedDischarge: '2026-04-14', counselor: TAMARA, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — Lithium stable; PHP')], lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2, notes: [n('pd34n1', '2026-04-13 10:00', 'Discharge Summary', TAMARA, 'DAP', 'Keisha completed 35-day residential. Buprenorphine stable. Bipolar I — lithium therapeutic. PTSD — Seeking Safety completed. PHP starts Monday.'), n('pd34n2', '2026-04-05 14:00', 'Individual', TAMARA, 'BIRP', 'Final week. Keisha confident. Mood stable 14 days — longest in years.'), n('pd34n3', '2026-03-22 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. O: Lithium 0.9 mEq/L. COWS 0. A: OUD on MAT; Bipolar I stabilizing. P: Continue.')], goals: [g('pd34g1', 'Substance Use', 'OUD with Bipolar I and PTSD', 'Residential; Bipolar stable; PHP', 'Residential 35 days; lithium; OTP', 'Met', '2026-04-14')], nextAppointment: 'Discharged to PHP — 2026-04-14' },

  { id: 'pd35', mrn: 'MRN-31000', firstName: 'Marcus', lastName: 'Simmons', dob: '1974-12-21', age: 51, gender: 'M', insurance: 'BlueCross BlueShield', program: 'IOP', primaryDiagnosis: 'Severe AUD', coOccurring: ['Cirrhosis (Child-Pugh A)'], asam: { d1: 2, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 74, amaRisk: 'Low', los: 60, admitDate: '2026-01-05', expectedDischarge: '2026-03-05', counselor: KEVIN, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED — Cirrhosis stable')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd35n1', '2026-03-04 11:00', 'Discharge Summary', KEVIN, 'DAP', 'Marcus completed 60 days IOP. AUD in sustained remission. Cirrhosis Child-Pugh A stable. Hepatology engaged. AA home group.'), n('pd35n2', '2026-02-20 14:00', 'Individual', KEVIN, 'BIRP', 'Pre-discharge. Marcus describing health revival. Hepatology reports liver improving slowly.'), n('pd35n3', '2026-01-25 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 20 days sober. O: Child-Pugh A stable. Thiamine compliance. A: AUD in remission; cirrhosis stable. P: Continue.')], goals: [g('pd35g1', 'Substance Use', 'AUD with cirrhosis', 'IOP; liver stability', 'IOP 60 days; hepatology', 'Met', '2026-03-05')], nextAppointment: 'Discharged to OP — 2026-03-05' },

  { id: 'pd36', mrn: 'MRN-30000', firstName: 'Tiffany', lastName: 'Coleman', dob: '1998-07-16', age: 28, gender: 'F', insurance: 'Maryland Medicaid / HealthChoice', program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['MDD', 'ADHD'], asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 66, amaRisk: 'Low', los: 28, admitDate: '2026-06-10', expectedDischarge: '2026-07-08', counselor: SARAH, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — 7/8')], lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2, notes: [n('pd36n1', '2026-07-07 10:00', 'Discharge Summary', SARAH, 'DAP', 'Tiffany completed 28-day residential. Buprenorphine 12mg stable. ADHD — Strattera effective. MDD improving. PHP starts tomorrow.'), n('pd36n2', '2026-06-29 14:00', 'Individual', SARAH, 'BIRP', 'Final week. Tiffany prepared. ADHD focus dramatically improved on Strattera.'), n('pd36n3', '2026-06-18 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. O: COWS 0. PHQ-9: 11. Strattera starting. A: OUD on MAT; MDD improving; ADHD early response. P: Continue.')], goals: [g('pd36g1', 'Substance Use', 'OUD with MDD and ADHD', 'Residential; OTP; PHP', 'Residential 28 days; Strattera; OTP', 'Met', '2026-07-08')], nextAppointment: 'Discharged to PHP — 2026-07-08' },

  { id: 'pd37', mrn: 'MRN-29000', firstName: 'Barry', lastName: 'Underwood', dob: '1969-03-31', age: 57, gender: 'M', insurance: 'UnitedHealthcare Community Plan of Maryland', program: 'PHP', primaryDiagnosis: 'Severe AUD', coOccurring: ['CAD', 'T2DM', 'OSA'], asam: { d1: 2, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 }, recoveryScore: 73, amaRisk: 'Low', los: 60, admitDate: '2025-11-01', expectedDischarge: '2025-12-31', counselor: DAVID, physician: DR_LEE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 8, craving: 1, notes: [n('pd37n1', '2025-12-30 11:00', 'Discharge Summary', DAVID, 'DAP', 'Barry completed 60-day PHP. Triple medical comorbidity — all improving with sobriety. CPAP compliance excellent. BP controlled. AA home group.'), n('pd37n2', '2025-12-15 14:00', 'Individual', DAVID, 'BIRP', 'Pre-discharge. Barry calling sobriety "a medical necessity and a gift."'), n('pd37n3', '2025-11-20 10:00', 'Medical', DR_LEE, 'SOAP', 'S: 19 days sober. O: HbA1c 7.2. BP 128/82. CPAP 88%. A: AUD in remission; triple comorbidity improving. P: Continue.')], goals: [g('pd37g1', 'Substance Use', 'AUD with multiple medical comorbidities', 'PHP; health improvement', 'PHP 60 days; medical compliance; CPAP', 'Met', '2025-12-31')], nextAppointment: 'Discharged to IOP — 2025-12-31' },

  { id: 'pd38', mrn: 'MRN-28000', firstName: 'Pamela', lastName: 'Dixon', dob: '1987-10-10', age: 38, gender: 'F', insurance: 'CareFirst BlueCross BlueShield of Maryland', program: 'Residential', primaryDiagnosis: 'Cocaine UD (Severe)', coOccurring: ['GAD', 'Insomnia'], asam: { d1: 2, d2: 0, d3: 2, d4: 2, d5: 3, d6: 2 }, recoveryScore: 75, amaRisk: 'Low', los: 28, admitDate: '2026-05-25', expectedDischarge: '2026-06-22', counselor: TAMARA, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 8, craving: 2, notes: [n('pd38n1', '2026-06-21 10:00', 'Discharge Summary', TAMARA, 'DAP', 'Pamela completed 28-day residential. Cocaine-free. Sleep restored on trazodone. GAD — buspirone effective. PHP starts Monday.'), n('pd38n2', '2026-06-13 14:00', 'Individual', TAMARA, 'BIRP', 'Final week. Sleep 7-8 hours. Anxiety 3/10. Cocaine cravings minimal.'), n('pd38n3', '2026-06-03 10:00', 'Medical', DR_STONE, 'SOAP', 'S: Week 2. Sleep improving. O: GAD-7: 5. A: CUD in remission; GAD improving; sleep normalized. P: Continue.')], goals: [g('pd38g1', 'Substance Use', 'CUD with anxiety and insomnia', 'Residential; sleep restored; anxiety treated', 'Residential 28 days; medication compliance', 'Met', '2026-06-22')], nextAppointment: 'Discharged to PHP — 2026-06-22' },

  { id: 'pd39', mrn: 'MRN-27000', firstName: 'Edward', lastName: 'Poole', dob: '1976-02-19', age: 50, gender: 'M', insurance: 'Priority Partners (Johns Hopkins)', program: 'IOP', primaryDiagnosis: 'Severe AUD', coOccurring: ['MDD', 'HTN'], asam: { d1: 1, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 }, recoveryScore: 81, amaRisk: 'Low', los: 90, admitDate: '2025-08-15', expectedDischarge: '2025-11-13', counselor: KEVIN, physician: DR_STONE, flags: [flag('Success', 'DISCHARGED')], lastUa: 'Negative', mood: 9, craving: 1, notes: [n('pd39n1', '2025-11-12 18:00', 'Discharge Summary', KEVIN, 'DAP', 'Edward completed 90-day IOP. AUD in sustained remission. MDD in full remission with sertraline + sobriety. BP normalized. Sponsoring 1 newcomer.'), n('pd39n2', '2025-10-20 14:00', 'Individual', KEVIN, 'BIRP', '60-day. Edward thriving. Depression fully resolved. Amends to adult children progressing.'), n('pd39n3', '2025-09-15 10:00', 'Medical', DR_STONE, 'SOAP', 'S: 30 days sober. O: PHQ-9: 3. BP 122/78. A: AUD in remission; MDD resolving; HTN controlled. P: Continue.')], goals: [g('pd39g1', 'Substance Use', 'AUD with MDD and HTN', 'IOP 90 days; health improvement', '90-day IOP; AA; medical compliance', 'Met', '2025-11-13')], nextAppointment: 'Discharged to OP — 2025-11-13' },

  { id: 'pd40', mrn: 'MRN-26000', firstName: 'Loretta', lastName: 'Manning', dob: '1994-04-27', age: 32, gender: 'F', insurance: 'Aetna Better Health of Maryland', program: 'Residential', primaryDiagnosis: 'Severe OUD', coOccurring: ['PTSD (Sexual Trauma)', 'MDD'], asam: { d1: 3, d2: 2, d3: 3, d4: 4, d5: 4, d6: 4 }, recoveryScore: 69, amaRisk: 'Low', los: 30, admitDate: '2026-06-15', expectedDischarge: '2026-07-15', counselor: SARAH, physician: DR_CHEN, flags: [flag('Success', 'DISCHARGED — 7/15; PHP confirmed')], lastUa: 'Positive (BUP prescribed)', mood: 7, craving: 2, notes: [n('pd40n1', '2026-07-14 10:00', 'Discharge Summary', SARAH, 'DAP', 'Loretta completed 30-day residential. Buprenorphine 14mg stable. PTSD — trauma processing begun; EMDR referral placed. MDD responding to sertraline. PHP starts tomorrow. Excellent engagement.'), n('pd40n2', '2026-07-06 14:00', 'Individual', SARAH, 'BIRP', 'Final week. Loretta strong. Engaged in trauma work. Sober living confirmed.'), n('pd40n3', '2026-06-25 10:00', 'Medical', DR_CHEN, 'SOAP', 'S: Week 2. O: COWS 0. PHQ-9: 10. A: OUD on MAT; MDD improving; PTSD in treatment. P: Continue.')], goals: [g('pd40g1', 'Substance Use', 'Severe OUD with sexual trauma', 'Residential; PHP; EMDR', 'Residential 30 days; OTP; EMDR referral', 'Met', '2026-07-15')], nextAppointment: 'Discharged to PHP — 2026-07-15' },
];
