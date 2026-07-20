import type { Permission } from './mockRoles';

export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  number?: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending-renewal';
  ceuRequired?: number;
  ceuCompleted?: number;
  notes?: string;
}

export type ReportAccess = 'full' | 'department' | 'own' | 'none';

export interface StaffAccessFlags {
  diagnosticCodes: boolean;
  ePrescribe: boolean;
  marAccess: boolean;
  billingCodes: boolean;
  reportAccess: ReportAccess;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  credentials: string[];
  title: string;
  roleId: string;
  department: string;
  facility: string;           // e.g. 'Sunrise Recovery Center — Rockville, MD'
  email: string;
  phone: string;
  photoInitials: string;
  avatarBg: string;
  npi?: string;
  deaNumber?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseType?: string;
  licenseExpiry?: string;
  supervisorId?: string;      // required for ADT / CSC-AD under BAS supervision
  hireDate: string;
  lastLogin?: string;
  status: 'active' | 'inactive' | 'on-leave';
  certifications: Certification[];
  specializations: string[];
  accessFlags: StaffAccessFlags;
  permissionOverrides: Record<string, Permission>;
}

export function getDisplayName(s: StaffMember): string {
  const creds = s.credentials.length > 0 ? `, ${s.credentials.join(', ')}` : '';
  return `${s.firstName} ${s.lastName}${creds}`;
}

export const STAFF_MEMBERS: StaffMember[] = [

  // ─────────────────────────────────────────────────────────────────────────────
  // MARYLAND — Sunrise Recovery Center, Rockville, MD
  // Licensing: Maryland Board of Professional Counselors & Therapists (MBPCT)
  // SUD Credentialing: MD BHA / ADAA (Alcohol and Drug Abuse Administration)
  // Medicaid: Maryland Medical Assistance — HealthChoice MCOs
  // Accreditation: CARF / The Joint Commission
  // ─────────────────────────────────────────────────────────────────────────────

  // ── 1. James S. Collins III — Clinical Supervisor (Maryland) ──────────────────────
  {
    id: 's8',
    firstName: 'James', lastName: 'S. Collins III',
    credentials: ['CAC-AD', 'BAS'],
    title: 'Clinical Supervisor',
    roleId: 'clinical_supervisor',
    department: 'Clinical',
    facility: 'Sunrise Recovery Center — Rockville, MD',
    email: 'j.collins@sunriserecovery.org', phone: '(301) 555-0101',
    photoInitials: 'JC', avatarBg: 'bg-amber-500',
    npi: '1023456789',
    licenseNumber: 'MD-CAC-AD-3891', licenseState: 'MD',
    licenseType: 'Certified Associate Counselor — Alcohol & Drug (CAC-AD)',
    licenseExpiry: '2027-03-01',
    hireDate: '2019-03-15', lastLogin: '2026-07-19 08:12',
    status: 'active',
    certifications: [
      {
        id: 'c2',
        name: 'CAC-AD — Certified Associate Counselor, Alcohol & Drug',
        issuingBody: 'Maryland Behavioral Health Administration (MD BHA) / ADAA',
        number: 'MD-CAC-AD-3891',
        issueDate: '2015-03-01', expiryDate: '2027-03-01', status: 'active',
        ceuRequired: 40, ceuCompleted: 40,
        notes: 'Required for direct SUD service delivery to publicly-funded MD clients. Issued by MD BHA/ADAA under COMAR 10.63.',
      },
      {
        id: 'c3',
        name: 'Board Approved Supervisor (BAS)',
        issuingBody: 'Maryland Behavioral Health Administration (MD BHA) / ADAA',
        number: 'BAS-MD-441',
        issueDate: '2018-05-01', expiryDate: '2026-05-01', status: 'pending-renewal',
        ceuRequired: 10, ceuCompleted: 10,
        notes: 'Required to supervise ADT and CSC-AD staff toward CAC-AD. Must hold CAC-AD or CPC-AD and complete BAS-specific training. Renewal pending — application submitted 4/15/2026.',
      },
      {
        id: 'c3b',
        name: 'ASAM Level of Care Certification',
        issuingBody: 'American Society of Addiction Medicine (ASAM)',
        issueDate: '2021-09-01', expiryDate: '2025-09-01', status: 'pending-renewal',
        ceuRequired: 20, ceuCompleted: 20,
      },
      {
        id: 'c3c',
        name: 'CPR / AED',
        issuingBody: 'American Red Cross',
        issueDate: '2025-01-10', expiryDate: '2027-01-10', status: 'active',
      },
    ],
    specializations: ['Trauma-Informed Care', 'Motivational Interviewing', 'Co-occurring Disorders', 'Clinical Supervision (BAS)'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 2. Sarah Jenkins — Primary Counselor (Maryland) ────────────────────────
  {
    id: 's1',
    firstName: 'Sarah', lastName: 'Jenkins',
    credentials: ['LPC', 'CAC-AD'],
    title: 'Primary Counselor',
    roleId: 'certified_clinician',
    department: 'Clinical',
    facility: 'Sunrise Recovery Center — Rockville, MD',
    email: 's.jenkins@sunriserecovery.org', phone: '(301) 555-0102',
    photoInitials: 'SJ', avatarBg: 'bg-blue-500',
    npi: '1034567890',
    licenseNumber: 'LPC-MD-11342', licenseState: 'MD',
    licenseType: 'Licensed Professional Counselor',
    licenseExpiry: '2025-12-31',
    supervisorId: 's8',   // supervised by James S. Collins III (BAS)
    hireDate: '2021-06-01', lastLogin: '2026-07-19 07:48',
    status: 'active',
    certifications: [
      {
        id: 'c4',
        name: 'Licensed Professional Counselor (LPC)',
        issuingBody: 'Maryland Board of Professional Counselors and Therapists (MBPCT)',
        number: 'LPC-MD-11342',
        issueDate: '2019-07-01', expiryDate: '2025-12-31', status: 'pending-renewal',
        ceuRequired: 40, ceuCompleted: 38,
        notes: 'LPC requires 2 years post-master\'s supervised experience (3,000 hrs) before LCPC upgrade. Renews biennially — renewal due 12/31/2025.',
      },
      {
        id: 'c4b',
        name: 'CAC-AD — Certified Associate Counselor, Alcohol & Drug',
        issuingBody: 'Maryland Behavioral Health Administration (MD BHA) / ADAA',
        number: 'MD-CAC-AD-2218',
        issueDate: '2021-04-01', expiryDate: '2027-04-01', status: 'active',
        ceuRequired: 40, ceuCompleted: 35,
        notes: 'Required for SUD services to MD-funded clients. 6,000 supervised practice hours completed. Supervised by James S. Collins III, CAC-AD, BAS.',
      },
      {
        id: 'c5',
        name: 'Trauma-Focused CBT Certification',
        issuingBody: 'Medical University of South Carolina / TF-CBT Network',
        issueDate: '2022-03-01', expiryDate: '2027-03-01', status: 'active',
      },
      {
        id: 'c5b',
        name: 'CPR / AED',
        issuingBody: 'American Red Cross',
        issueDate: '2024-08-15', expiryDate: '2026-08-15', status: 'active',
      },
    ],
    specializations: ['CBT', 'Trauma-Focused CBT', 'Family Systems', 'OUD Treatment'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ── 3. David Odom — Mental Health Therapist (Maryland) ─────────────────────
  {
    id: 's2',
    firstName: 'David', lastName: 'Odom',
    credentials: ['LMFT'],
    title: 'Mental Health Therapist',
    roleId: 'mh_therapist',
    department: 'Clinical',
    facility: 'Sunrise Recovery Center — Rockville, MD',
    email: 'd.odom@sunriserecovery.org', phone: '(301) 555-0103',
    photoInitials: 'DO', avatarBg: 'bg-purple-500',
    licenseNumber: 'LMFT-MD-4421', licenseState: 'MD',
    licenseType: 'Licensed Marriage & Family Therapist',
    licenseExpiry: '2026-04-30',
    hireDate: '2022-01-10', lastLogin: '2026-07-18 16:22',
    status: 'active',
    certifications: [
      {
        id: 'c7',
        name: 'Licensed Marriage & Family Therapist (LMFT)',
        issuingBody: 'Maryland Board of Professional Counselors and Therapists (MBPCT)',
        number: 'LMFT-MD-4421',
        issueDate: '2020-05-01', expiryDate: '2026-04-30', status: 'active',
        ceuRequired: 40, ceuCompleted: 34,
        notes: 'Renews biennially. 40 CEUs required. MBPCT licenses LMFTs alongside LPCs and LCPCs under same board.',
      },
      {
        id: 'c8',
        name: 'EMDR Basic Training',
        issuingBody: 'EMDR International Association (EMDRIA)',
        issueDate: '2020-10-01', expiryDate: '2026-10-01', status: 'active',
      },
      {
        id: 'c7b',
        name: 'CPR / AED',
        issuingBody: 'American Red Cross',
        issueDate: '2024-02-01', expiryDate: '2026-02-01', status: 'active',
      },
    ],
    specializations: ['EMDR', 'Couples & Family Therapy', 'Grief & Loss', 'Co-occurring MH/SUD'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ── 4. Dr. Emily Stone — Chief Medical Officer (Maryland) ──────────────────
  {
    id: 's5',
    firstName: 'Emily', lastName: 'Stone',
    credentials: ['MD', 'FASAM', 'ABAM'],
    title: 'Chief Medical Officer',
    roleId: 'cmo',
    department: 'Medical',
    facility: 'Sunrise Recovery Center — Rockville, MD',
    email: 'e.stone@sunriserecovery.org', phone: '(301) 555-0104',
    photoInitials: 'ES', avatarBg: 'bg-red-500',
    npi: '1045678901', deaNumber: 'BS1234567',
    licenseNumber: 'MD-22447', licenseState: 'MD',
    licenseType: 'Medical Doctor — Full License',
    licenseExpiry: '2026-09-30',
    hireDate: '2018-11-01', lastLogin: '2026-07-19 06:55',
    status: 'active',
    certifications: [
      {
        id: 'c9',
        name: 'Maryland Medical License',
        issuingBody: 'Maryland Board of Physicians (MBP)',
        number: 'MD-22447',
        issueDate: '2010-06-01', expiryDate: '2026-09-30', status: 'active',
        ceuRequired: 50, ceuCompleted: 50,
        notes: 'Maryland physicians renew every 2 years (50 CME hrs). MBP licensure required for all clinical practice in Maryland.',
      },
      {
        id: 'c10',
        name: 'Board Certified — Addiction Medicine (ABAM)',
        issuingBody: 'American Board of Addiction Medicine (ABAM / ABPM)',
        number: 'ABAM-10293',
        issueDate: '2020-01-01', expiryDate: '2030-01-01', status: 'active',
        ceuRequired: 40, ceuCompleted: 40,
        notes: 'ABAM certification recognized by Maryland and CARF as qualification for Medical Director of SUD facility.',
      },
      {
        id: 'c10b',
        name: 'Fellow, American Society of Addiction Medicine (FASAM)',
        issuingBody: 'American Society of Addiction Medicine (ASAM)',
        issueDate: '2018-01-01', expiryDate: '2030-01-01', status: 'active',
      },
      {
        id: 'c11',
        name: 'DEA Registration (CII–CV Controlled Substances)',
        issuingBody: 'US Drug Enforcement Administration (DEA)',
        number: 'BS1234567',
        issueDate: '2024-01-01', expiryDate: '2027-01-01', status: 'active',
        notes: 'Authorizes prescribing buprenorphine for OUD per MATE Act (no waiver required post-Dec 2022).',
      },
      {
        id: 'c11b',
        name: 'ACLS',
        issuingBody: 'American Heart Association',
        issueDate: '2024-04-01', expiryDate: '2026-04-01', status: 'active',
      },
    ],
    specializations: ['Addiction Medicine', 'Buprenorphine / MAT', 'ASAM LOCA', 'CARF / TJC Medical Standards'],
    accessFlags: { diagnosticCodes: true, ePrescribe: true, marAccess: true, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // ── 5. Dr. Robert Chen — Prescriber / Psychiatrist (Maryland) ──────────────
  {
    id: 's4',
    firstName: 'Robert', lastName: 'Chen',
    credentials: ['MD'],
    title: 'Attending Physician — Psychiatry',
    roleId: 'prescriber',
    department: 'Medical',
    facility: 'Sunrise Recovery Center — Rockville, MD',
    email: 'r.chen@sunriserecovery.org', phone: '(301) 555-0105',
    photoInitials: 'RC', avatarBg: 'bg-green-600',
    npi: '1056789012', deaNumber: 'BC9876543',
    licenseNumber: 'MD-18834', licenseState: 'MD',
    licenseType: 'Medical Doctor — Full License',
    licenseExpiry: '2027-03-31',
    hireDate: '2020-07-15', lastLogin: '2026-07-19 07:30',
    status: 'active',
    certifications: [
      {
        id: 'c12',
        name: 'Maryland Medical License',
        issuingBody: 'Maryland Board of Physicians (MBP)',
        number: 'MD-18834',
        issueDate: '2015-07-01', expiryDate: '2027-03-31', status: 'active',
        ceuRequired: 50, ceuCompleted: 50,
      },
      {
        id: 'c12b',
        name: 'Board Certified — Psychiatry & Neurology',
        issuingBody: 'American Board of Psychiatry and Neurology (ABPN)',
        number: 'ABPN-44510',
        issueDate: '2018-05-01', expiryDate: '2028-05-01', status: 'active',
        ceuRequired: 30, ceuCompleted: 28,
      },
      {
        id: 'c13',
        name: 'DEA Registration (CII–CV Controlled Substances)',
        issuingBody: 'US Drug Enforcement Administration (DEA)',
        number: 'BC9876543',
        issueDate: '2024-06-01', expiryDate: '2027-06-01', status: 'active',
      },
      {
        id: 'c14',
        name: 'BLS',
        issuingBody: 'American Heart Association',
        issueDate: '2024-01-10', expiryDate: '2026-01-10', status: 'active',
      },
    ],
    specializations: ['Psychiatry', 'Psychopharmacology', 'MAT / Buprenorphine', 'Dual Diagnosis'],
    accessFlags: { diagnosticCodes: true, ePrescribe: true, marAccess: true, billingCodes: true, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 6. Jessica Torres — Charge Nurse (Maryland) ────────────────────────────
  {
    id: 's6',
    firstName: 'Jessica', lastName: 'Torres',
    credentials: ['RN', 'CARN'],
    title: 'Charge Nurse',
    roleId: 'nursing',
    department: 'Nursing',
    facility: 'Sunrise Recovery Center — Rockville, MD',
    email: 'j.torres@sunriserecovery.org', phone: '(301) 555-0106',
    photoInitials: 'JT', avatarBg: 'bg-teal-500',
    npi: '1067890123',
    licenseNumber: 'RN-MD-44129', licenseState: 'MD',
    licenseType: 'Registered Nurse',
    licenseExpiry: '2026-10-31',
    hireDate: '2021-02-01', lastLogin: '2026-07-19 06:00',
    status: 'active',
    certifications: [
      {
        id: 'c15',
        name: 'Registered Nurse (RN) License',
        issuingBody: 'Maryland Board of Nursing (MBON)',
        number: 'RN-MD-44129',
        issueDate: '2015-11-01', expiryDate: '2026-10-31', status: 'active',
        ceuRequired: 30, ceuCompleted: 24,
        notes: 'Maryland RN license renews every 2 years. MBON requires 30 CEUs or practice hours attestation.',
      },
      {
        id: 'c16',
        name: 'CARN — Certified Addictions Registered Nurse',
        issuingBody: 'International Nurses Society on Addictions (IntNSA)',
        number: 'CARN-8821',
        issueDate: '2022-05-01', expiryDate: '2026-05-01', status: 'active',
        ceuRequired: 30, ceuCompleted: 24,
        notes: 'Recognized by CARF and TJC as addictions nursing specialty credential.',
      },
      {
        id: 'c17',
        name: 'ACLS',
        issuingBody: 'American Heart Association',
        issueDate: '2024-03-01', expiryDate: '2026-03-01', status: 'active',
      },
      {
        id: 'c18',
        name: 'COWS / CIWA-Ar Proficiency',
        issuingBody: 'Sunrise Recovery Center — Internal Competency',
        issueDate: '2021-03-01', expiryDate: '2027-03-01', status: 'active',
      },
    ],
    specializations: ['Detox / CIWA-Ar Protocol', 'COWS Assessment', 'IV Therapy', 'Medication Reconciliation'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: true, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DELAWARE — Sunrise Recovery Center, Wilmington, DE
  // Licensing: Delaware Division of Professional Regulation / DSAMH
  // SUD Credentialing: IC&RC (via DSAMH) — CADC, CAADC, LADC
  // Medicaid: Delaware Medicaid — Diamond State Health Plan (Highmark)
  // State oversight: DSAMH (Division of Substance Abuse and Mental Health)
  // ─────────────────────────────────────────────────────────────────────────────

  // ── 7. Michael Boyd — BHT / ADT-Registered (Delaware) ──────────────────────
  {
    id: 's7',
    firstName: 'Michael', lastName: 'Boyd',
    credentials: ['ADT'],
    title: 'Behavioral Health Technician — ADT Registrant',
    roleId: 'bht',
    department: 'Nursing',
    facility: 'Sunrise Recovery Center — Wilmington, DE',
    email: 'm.boyd@sunriserecovery.org', phone: '(302) 555-0107',
    photoInitials: 'MB', avatarBg: 'bg-gray-500',
    supervisorId: 's10',   // supervised by Kevin Wright (CADC / DE-BAS)
    hireDate: '2023-04-01', lastLogin: '2026-07-18 22:45',
    status: 'active',
    certifications: [
      {
        id: 'c19',
        name: 'Alcohol and Drug Trainee (ADT) — Delaware Registration',
        issuingBody: 'Delaware Division of Substance Abuse and Mental Health (DSAMH)',
        number: 'DSAMH-ADT-2023-0447',
        issueDate: '2023-04-15', expiryDate: '2025-04-15', status: 'pending-renewal',
        notes: 'DSAMH requires all SUD direct-care staff to hold ADT registration while accumulating hours toward CADC (IC&RC). Working under supervision of Kevin Wright (CADC, BAS-DE). Must accrue 6,000 hours for CADC eligibility.',
      },
      {
        id: 'c20',
        name: 'CPR / AED',
        issuingBody: 'American Red Cross',
        issueDate: '2024-01-01', expiryDate: '2026-01-01', status: 'active',
      },
      {
        id: 'c21',
        name: 'Non-Violent Crisis Intervention (NCI)',
        issuingBody: 'Crisis Prevention Institute (CPI)',
        issueDate: '2024-06-01', expiryDate: '2026-06-01', status: 'active',
      },
    ],
    specializations: ['Patient Observation', 'Group Co-facilitation', 'Safety Monitoring'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'none' },
    permissionOverrides: {},
  },

  // ── 8. Kevin Wright — BHT Supervisor / CADC (Delaware) ─────────────────────
  {
    id: 's10',
    firstName: 'Kevin', lastName: 'Wright',
    credentials: ['CADC', 'PRS'],
    title: 'BHT Supervisor',
    roleId: 'bht_supervisor',
    department: 'Operations',
    facility: 'Sunrise Recovery Center — Wilmington, DE',
    email: 'k.wright@sunriserecovery.org', phone: '(302) 555-0108',
    photoInitials: 'KW', avatarBg: 'bg-zinc-500',
    hireDate: '2020-09-01', lastLogin: '2026-07-19 05:50',
    status: 'active',
    certifications: [
      {
        id: 'c22',
        name: 'CADC — Certified Alcohol and Drug Counselor',
        issuingBody: 'IC&RC (International Certification & Reciprocity Consortium) — DSAMH recognized',
        number: 'DE-CADC-7831',
        issueDate: '2021-03-01', expiryDate: '2025-03-01', status: 'pending-renewal',
        ceuRequired: 40, ceuCompleted: 39,
        notes: 'Delaware DSAMH recognizes IC&RC CADC as required credential for SUD counselors. Working toward CAADC (advanced). Renewal application submitted 2/10/2025.',
      },
      {
        id: 'c22b',
        name: 'PRS — Peer Recovery Specialist',
        issuingBody: 'Delaware Division of Substance Abuse and Mental Health (DSAMH)',
        number: 'DSAMH-PRS-1122',
        issueDate: '2021-11-01', expiryDate: '2025-11-01', status: 'active',
        ceuRequired: 20, ceuCompleted: 18,
        notes: 'Delaware DSAMH-issued Peer Recovery Specialist credential. Required for peer-informed roles in DSAMH-funded programs.',
      },
      {
        id: 'c23',
        name: 'CPR / AED',
        issuingBody: 'American Red Cross',
        issueDate: '2024-01-01', expiryDate: '2026-01-01', status: 'active',
      },
      {
        id: 'c24',
        name: 'Non-Violent Crisis Intervention (NCI)',
        issuingBody: 'Crisis Prevention Institute (CPI)',
        issueDate: '2024-06-01', expiryDate: '2026-06-01', status: 'active',
      },
    ],
    specializations: ['Team Leadership', 'Peer-Informed Care', 'Incident De-escalation', 'DSAMH Compliance'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 9. Amanda Lewis — Intake Coordinator (Delaware) ────────────────────────
  {
    id: 's9',
    firstName: 'Amanda', lastName: 'Lewis',
    credentials: [],
    title: 'Intake Coordinator',
    roleId: 'admin_staff',
    department: 'Admissions',
    facility: 'Sunrise Recovery Center — Wilmington, DE',
    email: 'a.lewis@sunriserecovery.org', phone: '(302) 555-0109',
    photoInitials: 'AL', avatarBg: 'bg-orange-500',
    hireDate: '2022-05-16', lastLogin: '2026-07-19 08:00',
    status: 'active',
    certifications: [
      {
        id: 'c25',
        name: 'CPR / AED',
        issuingBody: 'American Red Cross',
        issueDate: '2024-05-01', expiryDate: '2026-05-01', status: 'active',
      },
      {
        id: 'c26',
        name: 'HIPAA Privacy & Security Training',
        issuingBody: 'Sunrise Recovery Center — Internal',
        issueDate: '2025-01-01', expiryDate: '2026-01-01', status: 'active',
      },
      {
        id: 'c26b',
        name: 'Delaware Medicaid (Diamond State Health Plan) — Eligibility Verification',
        issuingBody: 'Delaware DSAMH / DHSS Training',
        issueDate: '2023-06-01', expiryDate: '2027-06-01', status: 'active',
        notes: 'Required competency for staff processing DE Medicaid admissions and Diamond State Health Plan authorizations.',
      },
    ],
    specializations: ['Admissions Process', 'DE Medicaid Eligibility', 'Insurance Verification', 'DSAMH Intake Documentation'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'none' },
    permissionOverrides: {},
  },

  // ── 10. Carlos Rivera — Aftercare Coordinator (Delaware) ───────────────────
  {
    id: 's14',
    firstName: 'Carlos', lastName: 'Rivera',
    credentials: ['CADC', 'CPRS'],
    title: 'Aftercare Coordinator',
    roleId: 'aftercare_staff',
    department: 'Aftercare',
    facility: 'Sunrise Recovery Center — Wilmington, DE',
    email: 'c.rivera@sunriserecovery.org', phone: '(302) 555-0114',
    photoInitials: 'CR', avatarBg: 'bg-sky-500',
    hireDate: '2023-07-01', lastLogin: '2026-07-18 14:00',
    status: 'active',
    certifications: [
      {
        id: 'c34',
        name: 'CADC — Certified Alcohol and Drug Counselor',
        issuingBody: 'IC&RC — Delaware DSAMH recognized',
        number: 'DE-CADC-4419',
        issueDate: '2023-05-01', expiryDate: '2027-05-01', status: 'active',
        ceuRequired: 40, ceuCompleted: 14,
        notes: 'IC&RC CADC credential approved by Delaware DSAMH for SUD counselor roles in DSAMH-funded programs.',
      },
      {
        id: 'c35',
        name: 'CPRS — Certified Peer Recovery Specialist',
        issuingBody: 'Delaware Division of Substance Abuse and Mental Health (DSAMH)',
        number: 'CPRS-DE-0891',
        issueDate: '2023-01-01', expiryDate: '2027-01-01', status: 'active',
        ceuRequired: 20, ceuCompleted: 12,
        notes: 'Delaware CPRS credential. Recognizes lived experience + formal training. Required for peer support roles in DSAMH-licensed programs.',
      },
    ],
    specializations: ['Step-Down Planning', 'Alumni Outreach', 'Peer Recovery Support', 'DSAMH Aftercare Documentation'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MULTI-STATE / ADMINISTRATIVE — HQ (Rockville, MD)
  // ─────────────────────────────────────────────────────────────────────────────

  // ── 11. Linda Vance — Billing Specialist ───────────────────────────────────
  {
    id: 's12',
    firstName: 'Linda', lastName: 'Vance',
    credentials: ['CPC'],
    title: 'Billing Specialist',
    roleId: 'billing_staff',
    department: 'Billing',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 'l.vance@sunriserecovery.org', phone: '(301) 555-0110',
    photoInitials: 'LV', avatarBg: 'bg-yellow-500',
    hireDate: '2021-08-01', lastLogin: '2026-07-18 17:10',
    status: 'active',
    certifications: [
      {
        id: 'c27',
        name: 'Certified Professional Coder (CPC)',
        issuingBody: 'American Academy of Professional Coders (AAPC)',
        number: 'CPC-33812',
        issueDate: '2020-04-01', expiryDate: '2026-04-01', status: 'active',
        ceuRequired: 36, ceuCompleted: 36,
        notes: 'AAPC national credential recognized in Maryland and Delaware for facility billing.',
      },
      {
        id: 'c28',
        name: 'ICD-10 Specialist',
        issuingBody: 'AAPC',
        issueDate: '2021-01-01', expiryDate: '2027-01-01', status: 'active',
      },
      {
        id: 'c28b',
        name: 'Maryland Medicaid (HealthChoice) Provider Enrollment Training',
        issuingBody: 'Maryland Department of Health — Medical Assistance',
        issueDate: '2022-06-01', expiryDate: '2026-06-01', status: 'active',
        notes: 'Required for staff managing MD HealthChoice MCO billing (CareFirst, Optum, UHC, Jai Medical).',
      },
    ],
    specializations: ['Revenue Cycle Management', 'ICD-10 Coding', 'MD HealthChoice MCO Billing', 'DE Medicaid Claims', 'Insurance Denials'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 12. Maria Gonzales — Staff Accountant ──────────────────────────────────
  {
    id: 's3',
    firstName: 'Maria', lastName: 'Gonzales',
    credentials: ['CPA'],
    title: 'Staff Accountant',
    roleId: 'accounting_staff',
    department: 'Finance',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 'm.gonzales@sunriserecovery.org', phone: '(301) 555-0111',
    photoInitials: 'MG', avatarBg: 'bg-lime-600',
    hireDate: '2023-01-09', lastLogin: '2026-07-17 14:30',
    status: 'active',
    certifications: [
      {
        id: 'c29',
        name: 'CPA License',
        issuingBody: 'Maryland Board of Public Accountancy',
        number: 'CPA-MD-7821',
        issueDate: '2018-06-01', expiryDate: '2026-06-01', status: 'active',
        ceuRequired: 40, ceuCompleted: 40,
      },
    ],
    specializations: ['Financial Reporting', 'GAAP Compliance', 'Budget Analysis', 'CARF Financial Standards'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // ── 13. Jordan Pierce — Community Outreach Director ────────────────────────
  {
    id: 's16',
    firstName: 'Jordan', lastName: 'Pierce',
    credentials: ['CADC'],
    title: 'Community Outreach Director',
    roleId: 'business_development',
    department: 'Business Development',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 'j.pierce@sunriserecovery.org', phone: '(301) 555-0116',
    photoInitials: 'JP', avatarBg: 'bg-emerald-500',
    hireDate: '2022-03-07', lastLogin: '2026-07-18 15:05',
    status: 'active',
    certifications: [
      {
        id: 'c38',
        name: 'CADC — Certified Alcohol and Drug Counselor',
        issuingBody: 'IC&RC — Recognized in Maryland and Delaware',
        number: 'IC-CADC-44910',
        issueDate: '2021-06-01', expiryDate: '2027-06-01', status: 'active',
        ceuRequired: 40, ceuCompleted: 22,
        notes: 'IC&RC CADC credential valid in MD (via ADAA recognition) and DE (via DSAMH recognition).',
      },
      {
        id: 'c39',
        name: 'CPR / AED',
        issuingBody: 'American Red Cross',
        issueDate: '2024-03-01', expiryDate: '2026-03-01', status: 'active',
      },
    ],
    specializations: ['Referral Development', 'Community Outreach', 'Census Growth', 'MD/DE Provider Relations'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 14. Dr. Allen Hughes — Executive Owner / Medical Director ───────────────
  {
    id: 's11',
    firstName: 'Allen', lastName: 'Hughes',
    credentials: ['MD', 'FASAM'],
    title: 'Executive Owner / Medical Director',
    roleId: 'ownership',
    department: 'Executive',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 'a.hughes@sunriserecovery.org', phone: '(301) 555-0112',
    photoInitials: 'AH', avatarBg: 'bg-rose-600',
    npi: '1078901234',
    licenseNumber: 'MD-09921', licenseState: 'MD',
    licenseType: 'Medical Doctor — Full License',
    licenseExpiry: '2028-12-31',
    hireDate: '2015-01-01', lastLogin: '2026-07-16 11:20',
    status: 'active',
    certifications: [
      {
        id: 'c30',
        name: 'Maryland Medical License',
        issuingBody: 'Maryland Board of Physicians (MBP)',
        number: 'MD-09921',
        issueDate: '2008-06-01', expiryDate: '2028-12-31', status: 'active',
      },
      {
        id: 'c31',
        name: 'Fellow, American Society of Addiction Medicine (FASAM)',
        issuingBody: 'American Society of Addiction Medicine (ASAM)',
        issueDate: '2018-01-01', expiryDate: '2030-01-01', status: 'active',
        notes: 'Qualifies as Medical Director for CARF-accredited SUD facility and meets TJC physician leadership standards.',
      },
      {
        id: 'c31b',
        name: 'Board Certified — Internal Medicine',
        issuingBody: 'American Board of Internal Medicine (ABIM)',
        issueDate: '2010-01-01', expiryDate: '2030-01-01', status: 'active',
      },
    ],
    specializations: ['Executive Leadership', 'Healthcare Strategy', 'Addiction Medicine', 'CARF / TJC Governance'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // ── 15. Tracy Williams — HR Manager ────────────────────────────────────────
  {
    id: 's13',
    firstName: 'Tracy', lastName: 'Williams',
    credentials: ['SHRM-CP'],
    title: 'HR Manager',
    roleId: 'human_resources',
    department: 'Human Resources',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 't.williams@sunriserecovery.org', phone: '(301) 555-0113',
    photoInitials: 'TW', avatarBg: 'bg-pink-500',
    hireDate: '2020-02-17', lastLogin: '2026-07-18 09:40',
    status: 'active',
    certifications: [
      {
        id: 'c32',
        name: 'SHRM-CP — SHRM Certified Professional',
        issuingBody: 'Society for Human Resource Management (SHRM)',
        number: 'SHRM-44891',
        issueDate: '2021-01-01', expiryDate: '2027-01-01', status: 'active',
        ceuRequired: 60, ceuCompleted: 55,
      },
      {
        id: 'c33',
        name: 'HIPAA Compliance Officer Certification',
        issuingBody: 'AHIMA',
        issueDate: '2022-04-01', expiryDate: '2026-04-01', status: 'active',
      },
      {
        id: 'c33b',
        name: 'MD & DE Credential Verification Training',
        issuingBody: 'Sunrise Recovery Center — Internal / CARF Standards',
        issueDate: '2023-09-01', expiryDate: '2027-09-01', status: 'active',
        notes: 'Covers MBPCT (MD), MBON (MD), ADAA/BHA (MD), DSAMH (DE), and IC&RC credential verification workflows per CARF HR standards.',
      },
    ],
    specializations: ['Staff Recruitment', 'MD/DE Credential Verification', 'HR Compliance', 'CARF HR Standards'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 16. Alex Kim — IT Security Administrator ────────────────────────────────
  {
    id: 's15',
    firstName: 'Alex', lastName: 'Kim',
    credentials: ['CISSP'],
    title: 'IT Security Administrator',
    roleId: 'security_admin',
    department: 'Information Technology',
    facility: 'Sunrise Recovery Center — Rockville, MD (HQ)',
    email: 'a.kim@sunriserecovery.org', phone: '(301) 555-0115',
    photoInitials: 'AK', avatarBg: 'bg-indigo-600',
    hireDate: '2022-09-01', lastLogin: '2026-07-19 07:55',
    status: 'active',
    certifications: [
      {
        id: 'c36',
        name: 'CISSP — Certified Information Systems Security Professional',
        issuingBody: 'ISC²',
        number: 'CISSP-100429',
        issueDate: '2021-06-01', expiryDate: '2027-06-01', status: 'active',
        ceuRequired: 120, ceuCompleted: 89,
      },
      {
        id: 'c37',
        name: 'HIPAA Security Officer Certification',
        issuingBody: 'AHIMA',
        issueDate: '2022-10-01', expiryDate: '2026-10-01', status: 'active',
      },
      {
        id: 'c37b',
        name: 'CRISP (MD) HIE Security Administrator Training',
        issuingBody: 'Chesapeake Regional Information System for our Patients (CRISP)',
        issueDate: '2023-04-01', expiryDate: '2027-04-01', status: 'active',
        notes: 'Required for organizations participating in Maryland CRISP HIE network.',
      },
    ],
    specializations: ['HIPAA Compliance', 'Access Control', 'Security Auditing', 'EHR Administration', 'CRISP / DHIN HIE'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'full' },
    permissionOverrides: {},
  },
];

export function getStaffById(id: string): StaffMember | undefined {
  return STAFF_MEMBERS.find(s => s.id === id);
}

/** Backward-compat alias for pages that imported MOCK_STAFF */
export const MOCK_STAFF = STAFF_MEMBERS;
