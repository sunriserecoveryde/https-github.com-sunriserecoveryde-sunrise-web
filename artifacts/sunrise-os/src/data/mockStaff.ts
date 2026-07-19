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
}

export type ReportAccess = 'full' | 'department' | 'own' | 'none';

export interface StaffAccessFlags {
  diagnosticCodes: boolean;   // ICD-10 / DSM-5 lookup & assignment
  ePrescribe: boolean;        // Electronic prescribing (requires DEA)
  marAccess: boolean;         // Medication Administration Record
  billingCodes: boolean;      // CPT / HCPCS procedure code access
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
  email: string;
  phone: string;
  photoInitials: string;
  avatarBg: string;          // tailwind bg-* class
  npi?: string;
  deaNumber?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseType?: string;
  licenseExpiry?: string;
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
  // ── 1. James Carter — Clinical Supervisor ──────────────────────────────
  {
    id: 's8',
    firstName: 'James', lastName: 'Carter',
    credentials: ['LPC-MHSP', 'CADC-III'],
    title: 'Clinical Director',
    roleId: 'clinical_supervisor',
    department: 'Clinical',
    email: 'j.carter@sunriserecovery.org', phone: '(615) 555-0101',
    photoInitials: 'JC', avatarBg: 'bg-amber-500',
    npi: '1023456789',
    licenseNumber: 'LPC-12847', licenseState: 'TN',
    licenseType: 'Licensed Professional Counselor — Mental Health Service Provider',
    licenseExpiry: '2026-06-30',
    hireDate: '2019-03-15', lastLogin: '2026-07-19 08:12',
    status: 'active',
    certifications: [
      { id: 'c1', name: 'CADC-III', issuingBody: 'NAADAC', number: 'CADC-TN-8823', issueDate: '2017-05-01', expiryDate: '2027-05-01', status: 'active', ceuRequired: 60, ceuCompleted: 48 },
      { id: 'c2', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2024-01-10', expiryDate: '2026-01-10', status: 'expired' },
      { id: 'c3', name: 'ASAM Level of Care', issuingBody: 'ASAM', issueDate: '2021-09-01', expiryDate: '2025-09-01', status: 'pending-renewal', ceuRequired: 20, ceuCompleted: 20 },
    ],
    specializations: ['Trauma-Informed Care', 'Motivational Interviewing', 'Co-occurring Disorders'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 2. Sarah Jenkins — Certified Clinician ──────────────────────────────
  {
    id: 's1',
    firstName: 'Sarah', lastName: 'Jenkins',
    credentials: ['LPC', 'CADC-II'],
    title: 'Primary Counselor',
    roleId: 'certified_clinician',
    department: 'Clinical',
    email: 's.jenkins@sunriserecovery.org', phone: '(615) 555-0102',
    photoInitials: 'SJ', avatarBg: 'bg-blue-500',
    npi: '1034567890',
    licenseNumber: 'LPC-11342', licenseState: 'TN',
    licenseType: 'Licensed Professional Counselor',
    licenseExpiry: '2025-12-31',
    hireDate: '2021-06-01', lastLogin: '2026-07-19 07:48',
    status: 'active',
    certifications: [
      { id: 'c4', name: 'CADC-II', issuingBody: 'NAADAC', number: 'CADC-TN-7714', issueDate: '2019-07-01', expiryDate: '2025-07-01', status: 'pending-renewal', ceuRequired: 40, ceuCompleted: 38 },
      { id: 'c5', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2023-08-15', expiryDate: '2025-08-15', status: 'pending-renewal' },
      { id: 'c6', name: 'Trauma-Focused CBT', issuingBody: 'Medical University of SC', issueDate: '2022-03-01', expiryDate: '2027-03-01', status: 'active' },
    ],
    specializations: ['CBT', 'Trauma-Focused CBT', 'Family Systems'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ── 3. David Odom — Mental Health Therapist ────────────────────────────
  {
    id: 's2',
    firstName: 'David', lastName: 'Odom',
    credentials: ['LMFT'],
    title: 'Mental Health Therapist',
    roleId: 'mh_therapist',
    department: 'Clinical',
    email: 'd.odom@sunriserecovery.org', phone: '(615) 555-0103',
    photoInitials: 'DO', avatarBg: 'bg-purple-500',
    licenseNumber: 'LMFT-4421', licenseState: 'TN',
    licenseType: 'Licensed Marriage & Family Therapist',
    licenseExpiry: '2026-04-30',
    hireDate: '2022-01-10', lastLogin: '2026-07-18 16:22',
    status: 'active',
    certifications: [
      { id: 'c7', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2024-02-01', expiryDate: '2026-02-01', status: 'active' },
      { id: 'c8', name: 'EMDR Basic Training', issuingBody: 'EMDR International Association', issueDate: '2020-10-01', expiryDate: '2026-10-01', status: 'active' },
    ],
    specializations: ['EMDR', 'Couples Therapy', 'Grief & Loss'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ── 4. Dr. Emily Stone — CMO ────────────────────────────────────────────
  {
    id: 's5',
    firstName: 'Emily', lastName: 'Stone',
    credentials: ['MD', 'FASAM'],
    title: 'Chief Medical Officer',
    roleId: 'cmo',
    department: 'Medical',
    email: 'e.stone@sunriserecovery.org', phone: '(615) 555-0104',
    photoInitials: 'ES', avatarBg: 'bg-red-500',
    npi: '1045678901', deaNumber: 'BS1234567',
    licenseNumber: 'MD-TN-22447', licenseState: 'TN',
    licenseType: 'Medical Doctor — Active License',
    licenseExpiry: '2026-09-30',
    hireDate: '2018-11-01', lastLogin: '2026-07-19 06:55',
    status: 'active',
    certifications: [
      { id: 'c9', name: 'Board Certified — Addiction Medicine', issuingBody: 'ABPM', number: 'ABPM-10293', issueDate: '2020-01-01', expiryDate: '2030-01-01', status: 'active', ceuRequired: 40, ceuCompleted: 40 },
      { id: 'c10', name: 'DEA X-Waiver (DATA 2000)', issuingBody: 'DEA', issueDate: '2019-03-01', expiryDate: '2027-03-01', status: 'active' },
      { id: 'c11', name: 'ACLS', issuingBody: 'American Heart Association', issueDate: '2024-04-01', expiryDate: '2026-04-01', status: 'active' },
    ],
    specializations: ['Addiction Medicine', 'Buprenorphine / MAT', 'Pain Management', 'Toxicology'],
    accessFlags: { diagnosticCodes: true, ePrescribe: true, marAccess: true, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // ── 5. Dr. Robert Chen — Prescriber ────────────────────────────────────
  {
    id: 's4',
    firstName: 'Robert', lastName: 'Chen',
    credentials: ['MD'],
    title: 'Attending Physician',
    roleId: 'prescriber',
    department: 'Medical',
    email: 'r.chen@sunriserecovery.org', phone: '(615) 555-0105',
    photoInitials: 'RC', avatarBg: 'bg-green-600',
    npi: '1056789012', deaNumber: 'BC9876543',
    licenseNumber: 'MD-TN-18834', licenseState: 'TN',
    licenseType: 'Medical Doctor — Active License',
    licenseExpiry: '2027-03-31',
    hireDate: '2020-07-15', lastLogin: '2026-07-19 07:30',
    status: 'active',
    certifications: [
      { id: 'c12', name: 'Board Certified — Psychiatry', issuingBody: 'ABPN', issueDate: '2015-06-01', expiryDate: '2025-06-01', status: 'pending-renewal', ceuRequired: 30, ceuCompleted: 28 },
      { id: 'c13', name: 'DEA X-Waiver (DATA 2000)', issuingBody: 'DEA', issueDate: '2020-08-01', expiryDate: '2026-08-01', status: 'active' },
      { id: 'c14', name: 'BLS', issuingBody: 'American Heart Association', issueDate: '2024-01-10', expiryDate: '2026-01-10', status: 'active' },
    ],
    specializations: ['Psychiatry', 'Psychopharmacology', 'MAT / Buprenorphine'],
    accessFlags: { diagnosticCodes: true, ePrescribe: true, marAccess: true, billingCodes: true, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 6. Jessica Torres — Nursing ────────────────────────────────────────
  {
    id: 's6',
    firstName: 'Jessica', lastName: 'Torres',
    credentials: ['RN', 'CARN'],
    title: 'Charge Nurse',
    roleId: 'nursing',
    department: 'Nursing',
    email: 'j.torres@sunriserecovery.org', phone: '(615) 555-0106',
    photoInitials: 'JT', avatarBg: 'bg-teal-500',
    npi: '1067890123',
    licenseNumber: 'RN-TN-44129', licenseState: 'TN',
    licenseType: 'Registered Nurse',
    licenseExpiry: '2026-07-31',
    hireDate: '2021-02-01', lastLogin: '2026-07-19 06:00',
    status: 'active',
    certifications: [
      { id: 'c15', name: 'CARN — Certified Addictions RN', issuingBody: 'NNBA', issueDate: '2022-05-01', expiryDate: '2026-05-01', status: 'active', ceuRequired: 30, ceuCompleted: 24 },
      { id: 'c16', name: 'ACLS', issuingBody: 'American Heart Association', issueDate: '2024-03-01', expiryDate: '2026-03-01', status: 'active' },
      { id: 'c17', name: 'COWS / CIWA Proficiency', issuingBody: 'Sunrise Recovery', issueDate: '2021-03-01', expiryDate: '2027-03-01', status: 'active' },
      { id: 'c18', name: 'MAT Administration Training', issuingBody: 'SAMHSA', issueDate: '2022-01-01', expiryDate: '2026-01-01', status: 'active' },
    ],
    specializations: ['Detox / CIWA Protocol', 'COWS Assessment', 'IV Therapy', 'Medication Reconciliation'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: true, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ── 7. Michael Boyd — BHT ───────────────────────────────────────────────
  {
    id: 's7',
    firstName: 'Michael', lastName: 'Boyd',
    credentials: ['BHT'],
    title: 'Behavioral Health Technician',
    roleId: 'bht',
    department: 'Nursing',
    email: 'm.boyd@sunriserecovery.org', phone: '(615) 555-0107',
    photoInitials: 'MB', avatarBg: 'bg-gray-500',
    hireDate: '2023-04-01', lastLogin: '2026-07-18 22:45',
    status: 'active',
    certifications: [
      { id: 'c19', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2024-01-01', expiryDate: '2026-01-01', status: 'active' },
      { id: 'c20', name: 'BHT Certificate', issuingBody: 'IBHRE', issueDate: '2023-02-01', expiryDate: '2027-02-01', status: 'active' },
      { id: 'c21', name: 'Non-Violent Crisis Intervention', issuingBody: 'Crisis Prevention Institute', issueDate: '2023-06-01', expiryDate: '2025-06-01', status: 'expired' },
    ],
    specializations: ['Patient Observation', 'Group Facilitation', 'Safety Monitoring'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'none' },
    permissionOverrides: {},
  },

  // ── 8. Kevin Wright — BHT Supervisor ───────────────────────────────────
  {
    id: 's10',
    firstName: 'Kevin', lastName: 'Wright',
    credentials: ['CADC-I'],
    title: 'BHT Supervisor',
    roleId: 'bht_supervisor',
    department: 'Operations',
    email: 'k.wright@sunriserecovery.org', phone: '(615) 555-0108',
    photoInitials: 'KW', avatarBg: 'bg-zinc-500',
    hireDate: '2020-09-01', lastLogin: '2026-07-19 05:50',
    status: 'active',
    certifications: [
      { id: 'c22', name: 'CADC-I', issuingBody: 'NAADAC', issueDate: '2021-03-01', expiryDate: '2025-03-01', status: 'pending-renewal', ceuRequired: 20, ceuCompleted: 19 },
      { id: 'c23', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2024-01-01', expiryDate: '2026-01-01', status: 'active' },
      { id: 'c24', name: 'Non-Violent Crisis Intervention', issuingBody: 'Crisis Prevention Institute', issueDate: '2024-06-01', expiryDate: '2026-06-01', status: 'active' },
    ],
    specializations: ['Team Leadership', 'Incident De-escalation', 'Quality Monitoring'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 9. Amanda Lewis — Admin Staff ──────────────────────────────────────
  {
    id: 's9',
    firstName: 'Amanda', lastName: 'Lewis',
    credentials: [],
    title: 'Intake Coordinator',
    roleId: 'admin_staff',
    department: 'Admissions',
    email: 'a.lewis@sunriserecovery.org', phone: '(615) 555-0109',
    photoInitials: 'AL', avatarBg: 'bg-orange-500',
    hireDate: '2022-05-16', lastLogin: '2026-07-19 08:00',
    status: 'active',
    certifications: [
      { id: 'c25', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2024-05-01', expiryDate: '2026-05-01', status: 'active' },
      { id: 'c26', name: 'HIPAA Privacy & Security', issuingBody: 'Sunrise Recovery', issueDate: '2024-01-01', expiryDate: '2025-01-01', status: 'expired' },
    ],
    specializations: ['Admissions Process', 'Insurance Verification', 'Patient Intake'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'none' },
    permissionOverrides: {},
  },

  // ── 10. Linda Vance — Billing Staff ────────────────────────────────────
  {
    id: 's12',
    firstName: 'Linda', lastName: 'Vance',
    credentials: ['CPC'],
    title: 'Billing Specialist',
    roleId: 'billing_staff',
    department: 'Billing',
    email: 'l.vance@sunriserecovery.org', phone: '(615) 555-0110',
    photoInitials: 'LV', avatarBg: 'bg-yellow-500',
    hireDate: '2021-08-01', lastLogin: '2026-07-18 17:10',
    status: 'active',
    certifications: [
      { id: 'c27', name: 'Certified Professional Coder (CPC)', issuingBody: 'AAPC', number: 'CPC-TN-33812', issueDate: '2020-04-01', expiryDate: '2026-04-01', status: 'active', ceuRequired: 36, ceuCompleted: 36 },
      { id: 'c28', name: 'ICD-10 Specialist', issuingBody: 'AAPC', issueDate: '2021-01-01', expiryDate: '2027-01-01', status: 'active' },
    ],
    specializations: ['Revenue Cycle Management', 'ICD-10 Coding', 'Insurance Denials', 'CPT Coding'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 11. Maria Gonzales — Accounting ────────────────────────────────────
  {
    id: 's3',
    firstName: 'Maria', lastName: 'Gonzales',
    credentials: ['CPA'],
    title: 'Staff Accountant',
    roleId: 'accounting_staff',
    department: 'Finance',
    email: 'm.gonzales@sunriserecovery.org', phone: '(615) 555-0111',
    photoInitials: 'MG', avatarBg: 'bg-lime-600',
    hireDate: '2023-01-09', lastLogin: '2026-07-17 14:30',
    status: 'active',
    certifications: [
      { id: 'c29', name: 'CPA License', issuingBody: 'TN State Board of Accountancy', number: 'CPA-TN-7821', issueDate: '2018-06-01', expiryDate: '2026-06-01', status: 'active', ceuRequired: 40, ceuCompleted: 40 },
    ],
    specializations: ['Financial Reporting', 'GAAP Compliance', 'Budget Analysis'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // ── 12. Jordan Pierce — Business Development ───────────────────────────
  {
    id: 's16',
    firstName: 'Jordan', lastName: 'Pierce',
    credentials: ['CASC'],
    title: 'Community Outreach Director',
    roleId: 'business_development',
    department: 'Business Development',
    email: 'j.pierce@sunriserecovery.org', phone: '(615) 555-0116',
    photoInitials: 'JP', avatarBg: 'bg-emerald-500',
    hireDate: '2022-03-07', lastLogin: '2026-07-18 15:05',
    status: 'active',
    certifications: [
      { id: 'c38', name: 'Certified Addiction and Substance Abuse Counselor', issuingBody: 'AADC', issueDate: '2021-06-01', expiryDate: '2027-06-01', status: 'active', ceuRequired: 30, ceuCompleted: 22 },
      { id: 'c39', name: 'CPR / AED', issuingBody: 'American Red Cross', issueDate: '2024-03-01', expiryDate: '2026-03-01', status: 'active' },
    ],
    specializations: ['Referral Development', 'Community Outreach', 'Census Growth'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 13. Dr. Allen Hughes — Ownership ───────────────────────────────────
  {
    id: 's11',
    firstName: 'Allen', lastName: 'Hughes',
    credentials: ['MD', 'MBA'],
    title: 'Executive Owner / Medical Director',
    roleId: 'ownership',
    department: 'Executive',
    email: 'a.hughes@sunriserecovery.org', phone: '(615) 555-0112',
    photoInitials: 'AH', avatarBg: 'bg-rose-600',
    npi: '1078901234',
    licenseNumber: 'MD-TN-09921', licenseState: 'TN',
    licenseType: 'Medical Doctor — Active License',
    licenseExpiry: '2028-12-31',
    hireDate: '2015-01-01', lastLogin: '2026-07-16 11:20',
    status: 'active',
    certifications: [
      { id: 'c30', name: 'Board Certified — Internal Medicine', issuingBody: 'ABIM', issueDate: '2010-01-01', expiryDate: '2030-01-01', status: 'active' },
      { id: 'c31', name: 'FASAM Fellowship', issuingBody: 'ASAM', issueDate: '2018-01-01', expiryDate: '2030-01-01', status: 'active' },
    ],
    specializations: ['Executive Leadership', 'Healthcare Strategy', 'Addiction Medicine'],
    accessFlags: { diagnosticCodes: true, ePrescribe: false, marAccess: false, billingCodes: true, reportAccess: 'full' },
    permissionOverrides: {},
  },

  // ── 14. Tracy Williams — Human Resources ───────────────────────────────
  {
    id: 's13',
    firstName: 'Tracy', lastName: 'Williams',
    credentials: ['SHRM-CP'],
    title: 'HR Manager',
    roleId: 'human_resources',
    department: 'Human Resources',
    email: 't.williams@sunriserecovery.org', phone: '(615) 555-0113',
    photoInitials: 'TW', avatarBg: 'bg-pink-500',
    hireDate: '2020-02-17', lastLogin: '2026-07-18 09:40',
    status: 'active',
    certifications: [
      { id: 'c32', name: 'SHRM-CP', issuingBody: 'SHRM', number: 'SHRM-44891', issueDate: '2021-01-01', expiryDate: '2027-01-01', status: 'active', ceuRequired: 60, ceuCompleted: 55 },
      { id: 'c33', name: 'HIPAA Compliance Officer', issuingBody: 'AHIMA', issueDate: '2022-04-01', expiryDate: '2026-04-01', status: 'active' },
    ],
    specializations: ['Staff Recruitment', 'Credential Verification', 'HR Compliance', 'Benefits Administration'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'department' },
    permissionOverrides: {},
  },

  // ── 15. Carlos Rivera — Aftercare Staff ────────────────────────────────
  {
    id: 's14',
    firstName: 'Carlos', lastName: 'Rivera',
    credentials: ['CADC-I'],
    title: 'Aftercare Coordinator',
    roleId: 'aftercare_staff',
    department: 'Aftercare',
    email: 'c.rivera@sunriserecovery.org', phone: '(615) 555-0114',
    photoInitials: 'CR', avatarBg: 'bg-sky-500',
    hireDate: '2023-07-01', lastLogin: '2026-07-18 14:00',
    status: 'active',
    certifications: [
      { id: 'c34', name: 'CADC-I', issuingBody: 'NAADAC', issueDate: '2023-05-01', expiryDate: '2027-05-01', status: 'active', ceuRequired: 20, ceuCompleted: 14 },
      { id: 'c35', name: 'Peer Recovery Specialist', issuingBody: 'Tennessee Voices', issueDate: '2023-01-01', expiryDate: '2027-01-01', status: 'active' },
    ],
    specializations: ['Step-Down Planning', 'Alumni Outreach', 'Recovery Support'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'own' },
    permissionOverrides: {},
  },

  // ── 16. Alex Kim — Security Administrator ──────────────────────────────
  {
    id: 's15',
    firstName: 'Alex', lastName: 'Kim',
    credentials: ['CISSP'],
    title: 'IT Security Administrator',
    roleId: 'security_admin',
    department: 'Information Technology',
    email: 'a.kim@sunriserecovery.org', phone: '(615) 555-0115',
    photoInitials: 'AK', avatarBg: 'bg-indigo-600',
    hireDate: '2022-09-01', lastLogin: '2026-07-19 07:55',
    status: 'active',
    certifications: [
      { id: 'c36', name: 'CISSP', issuingBody: 'ISC²', number: 'CISSP-100429', issueDate: '2021-06-01', expiryDate: '2027-06-01', status: 'active', ceuRequired: 120, ceuCompleted: 89 },
      { id: 'c37', name: 'HIPAA Security Officer', issuingBody: 'AHIMA', issueDate: '2022-10-01', expiryDate: '2026-10-01', status: 'active' },
    ],
    specializations: ['HIPAA Compliance', 'Access Control', 'Security Auditing', 'EHR Administration'],
    accessFlags: { diagnosticCodes: false, ePrescribe: false, marAccess: false, billingCodes: false, reportAccess: 'full' },
    permissionOverrides: {},
  },
];

export function getStaffById(id: string): StaffMember | undefined {
  return STAFF_MEMBERS.find(s => s.id === id);
}

/** Backward-compat alias for pages that imported MOCK_STAFF */
export const MOCK_STAFF = STAFF_MEMBERS;
