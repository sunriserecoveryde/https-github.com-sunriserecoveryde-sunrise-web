/**
 * mockCompliance.ts
 *
 * Regulatory and credentialing reference data for Sunrise Recovery Center's
 * Maryland (Rockville) and Delaware (Wilmington) facilities.
 *
 * Covers:
 *   - State licensing & SUD credentialing pathways (MD BHA / DE DSAMH)
 *   - Medicaid oversight and payers
 *   - Accrediting bodies (CARF, The Joint Commission)
 *   - Federal oversight (SAMHSA, DEA, CMS)
 *   - Reporting requirements
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComplianceState = 'Maryland' | 'Delaware' | 'Federal' | 'Multi-State';
export type CredentialTier = 'Trainee' | 'Supervised' | 'Associate' | 'Professional' | 'Licensed' | 'Supervisor';
export type EntityType =
  | 'Licensing Board'
  | 'SUD Credentialing Body'
  | 'Medicaid Oversight'
  | 'Managed Care Organization'
  | 'Accrediting Body'
  | 'Federal Oversight'
  | 'HIE'
  | 'PDMP';

export interface RegulatoryBody {
  id: string;
  name: string;
  abbreviation: string;
  type: EntityType;
  state: ComplianceState;
  website: string;
  description: string;
  relevance: string;           // why Sunrise staff or facility interacts with this body
  renewalCycle?: string;
  contactPhone?: string;
}

export interface CredentialDefinition {
  id: string;
  abbreviation: string;
  fullName: string;
  state: ComplianceState;
  issuingBodyId: string;        // references RegulatoryBody.id
  tier: CredentialTier;
  prerequisites: string[];
  practiceHoursRequired?: number;
  supervisionHoursRequired?: number;
  ceuRequiredPerCycle?: number;
  renewalCycleYears?: number;
  scope: string;
  notes: string;
  qualifiesFor?: string[];      // e.g., ['QBHP', 'Clinical Supervisor']
}

export interface MedicaidProgram {
  id: string;
  state: ComplianceState;
  programName: string;
  adminAgency: string;
  deliveryModel: string;
  mcos: ManagedCareOrg[];
  relevantServices: string[];
  priorAuthRequired: boolean;
  billableCredentials: string[];
  notes: string;
}

export interface ManagedCareOrg {
  name: string;
  abbreviation?: string;
  phone?: string;
  portalUrl?: string;
  notes?: string;
}

export interface AccreditationStandard {
  id: string;
  body: string;
  program: string;
  abbreviation: string;
  description: string;
  staffingRequirements: string[];
  supervisoryRequirements: string[];
  qualityRequirements: string[];
  surveyFrequency: string;
  website: string;
}

// ─── Regulatory Bodies ─────────────────────────────────────────────────────────

export const REGULATORY_BODIES: RegulatoryBody[] = [

  // ── Maryland ──────────────────────────────────────────────────────────────

  {
    id: 'mbpct',
    name: 'Maryland Board of Professional Counselors and Therapists',
    abbreviation: 'MBPCT',
    type: 'Licensing Board',
    state: 'Maryland',
    website: 'https://health.maryland.gov/mbpct',
    description: 'Licenses LPCs, LCPCs, LMFTs, and LADCs in Maryland.',
    relevance: 'All clinical counselors, therapists, and licensed drug counselors at the Rockville facility must hold active MBPCT licensure.',
    renewalCycle: 'Biennial (every 2 years), 40 CEUs required',
  },
  {
    id: 'mbp',
    name: 'Maryland Board of Physicians',
    abbreviation: 'MBP',
    type: 'Licensing Board',
    state: 'Maryland',
    website: 'https://mbp.maryland.gov',
    description: 'Licenses MDs, DOs, CRNPs, and PAs in Maryland.',
    relevance: 'All prescribers and the medical director at the Rockville facility must hold active MBP licensure.',
    renewalCycle: 'Biennial, 50 CME hrs required',
  },
  {
    id: 'mbon',
    name: 'Maryland Board of Nursing',
    abbreviation: 'MBON',
    type: 'Licensing Board',
    state: 'Maryland',
    website: 'https://mbon.maryland.gov',
    description: 'Licenses RNs, LPNs, CRNPs, and CNAs in Maryland.',
    relevance: 'All nursing staff at the Rockville facility must hold active MBON licensure.',
    renewalCycle: 'Biennial, 30 CEU hrs or practice attestation',
  },
  {
    id: 'mdbha',
    name: 'Maryland Behavioral Health Administration',
    abbreviation: 'MD BHA',
    type: 'SUD Credentialing Body',
    state: 'Maryland',
    website: 'https://bha.health.maryland.gov',
    description: 'Oversees SUD and mental health service delivery in Maryland. Administers ADAA (Alcohol and Drug Abuse Administration) credentialing: ADT, CSC-AD, CAC-AD, CPC-AD, and Board Approved Supervisor (BAS).',
    relevance: 'All SUD counselors providing services to Maryland publicly-funded clients must hold current MD BHA/ADAA credential. Facility must be licensed by BHA. BAS designation required for supervisors of ADT and CSC-AD staff.',
    renewalCycle: 'Varies by credential tier (2–3 years)',
    contactPhone: '(410) 402-8600',
  },
  {
    id: 'mdmedicaid',
    name: 'Maryland Department of Health — Medical Assistance (Medicaid)',
    abbreviation: 'MDH / Medical Assistance',
    type: 'Medicaid Oversight',
    state: 'Maryland',
    website: 'https://mmcp.health.maryland.gov',
    description: 'Administers Maryland Medicaid (Medical Assistance) through the HealthChoice managed care program. Covers SUD residential, PHP, IOP, and OP levels of care.',
    relevance: 'Billing, prior authorization, and outcome reporting for all Maryland Medicaid patients. MCO contracts with CareFirst, Optum, UHC, and Jai Medical must be maintained.',
    contactPhone: '1-800-492-5231',
  },
  {
    id: 'crisp',
    name: 'Chesapeake Regional Information System for our Patients',
    abbreviation: 'CRISP',
    type: 'HIE',
    state: 'Maryland',
    website: 'https://crisphealth.org',
    description: 'Maryland's state-designated Health Information Exchange (HIE). Provides ADT notifications, CCD exchange, and care coordination alerts.',
    relevance: 'Sunrise Rockville is connected to CRISP for bi-directional record exchange and ADT alerts. Required for Maryland Medicaid value-based programs.',
  },
  {
    id: 'mdpdmp',
    name: 'Maryland Prescription Drug Monitoring Program',
    abbreviation: 'MD PDMP',
    type: 'PDMP',
    state: 'Maryland',
    website: 'https://pdmp.maryland.gov',
    description: 'Maryland PDMP operated by MDH. Real-time monitoring of CII–CV controlled substance prescriptions. Mandatory check before prescribing opioids or benzodiazepines.',
    relevance: 'All prescribers at Rockville facility must check MD PDMP prior to prescribing controlled substances. Integrated into Sunrise OS prescriber workflow.',
  },

  // ── Delaware ──────────────────────────────────────────────────────────────

  {
    id: 'dsamh',
    name: 'Delaware Division of Substance Abuse and Mental Health',
    abbreviation: 'DSAMH',
    type: 'SUD Credentialing Body',
    state: 'Delaware',
    website: 'https://www.dhss.delaware.gov/dsamh',
    description: 'Primary oversight body for SUD and mental health services in Delaware. Licenses SUD treatment facilities, recognizes IC&RC credentials (CADC, CAADC, LADC), and certifies Peer Recovery Specialists (PRS/CPRS). Administers ADT-equivalent registration for entry-level SUD staff.',
    relevance: 'All SUD clinical staff at the Wilmington facility must hold DSAMH-recognized credentials. Facility license issued by DSAMH. WITS reporting required for all publicly-funded DE clients.',
    contactPhone: '(302) 255-9399',
  },
  {
    id: 'de_dpr',
    name: 'Delaware Division of Professional Regulation',
    abbreviation: 'DE DPR',
    type: 'Licensing Board',
    state: 'Delaware',
    website: 'https://dpr.delaware.gov',
    description: 'Licenses LPCMHs (Licensed Professional Counselors of Mental Health), LCSWs, LMFTs, and LADCs in Delaware through the Board of Mental Health and Chemical Dependency Professionals.',
    relevance: 'Clinical counselors and therapists at the Wilmington facility must hold active DE DPR licensure. LADC requires CADC + 6,000 supervised hours.',
    renewalCycle: 'Biennial',
  },
  {
    id: 'de_bon',
    name: 'Delaware Board of Nursing',
    abbreviation: 'DE BON',
    type: 'Licensing Board',
    state: 'Delaware',
    website: 'https://dpr.delaware.gov/boards/nursing',
    description: 'Licenses RNs and LPNs in Delaware.',
    relevance: 'Any nursing staff at the Wilmington facility must hold active DE Board of Nursing licensure.',
    renewalCycle: 'Biennial',
  },
  {
    id: 'demedicaid',
    name: 'Delaware Medicaid — Division of Medicaid & Medical Assistance',
    abbreviation: 'DMMA',
    type: 'Medicaid Oversight',
    state: 'Delaware',
    website: 'https://www.dhss.delaware.gov/dhss/dmma',
    description: 'Administers Delaware Medicaid through the Diamond State Health Plan (managed by Highmark). Covers SUD residential, PHP, IOP levels of care for Medicaid-enrolled patients.',
    relevance: 'Billing, prior authorization, and outcome reporting for all Delaware Medicaid patients. Diamond State Health Plan (Highmark) contracts must be maintained.',
    contactPhone: '(302) 255-9500',
  },
  {
    id: 'dhin',
    name: 'Delaware Health Information Network',
    abbreviation: 'DHIN',
    type: 'HIE',
    state: 'Delaware',
    website: 'https://www.dhin.org',
    description: 'Delaware's state-designated Health Information Exchange. Provides ADT notifications and clinical document exchange for Delaware providers.',
    relevance: 'Sunrise Wilmington participates in DHIN for care coordination and ADT alerts for Delaware patients.',
  },
  {
    id: 'depdmp',
    name: 'Delaware Prescription Monitoring Program',
    abbreviation: 'DE PMP',
    type: 'PDMP',
    state: 'Delaware',
    website: 'https://dpr.delaware.gov/boards/controlledsubstances',
    description: 'Delaware PDMP via PMPInterConnect. Mandatory check for prescribers before dispensing CII–CV controlled substances.',
    relevance: 'All prescribers at Wilmington facility must check DE PMP. Integrated via PMPInterConnect gateway.',
  },

  // ── Accrediting Bodies ────────────────────────────────────────────────────

  {
    id: 'carf',
    name: 'Commission on Accreditation of Rehabilitation Facilities',
    abbreviation: 'CARF',
    type: 'Accrediting Body',
    state: 'Multi-State',
    website: 'https://www.carf.org',
    description: 'International accrediting body for health, human, and behavioral health services. CARF accreditation signals quality, accountability, and continuous improvement.',
    relevance: 'Sunrise Recovery Center holds CARF accreditation for SUD Residential and Outpatient services. Standards govern staff qualifications, supervision, clinical records, and quality improvement. Both MD and DE facilities must maintain CARF standards.',
    renewalCycle: '3-year accreditation cycle with annual conformance reports',
  },
  {
    id: 'tjc',
    name: 'The Joint Commission',
    abbreviation: 'TJC',
    type: 'Accrediting Body',
    state: 'Multi-State',
    website: 'https://www.jointcommission.org',
    description: 'Accredits hospitals, behavioral health organizations, and SUD treatment programs. TJC Behavioral Health Care and Human Services (BHCA) accreditation widely accepted by payers.',
    relevance: 'Qualifies Sunrise for participation in certain payer networks and demonstrates clinical quality. TJC standards cover medication management, clinical leadership, and patient rights.',
    renewalCycle: 'Triennial survey cycle',
  },

  // ── Federal ───────────────────────────────────────────────────────────────

  {
    id: 'samhsa',
    name: 'Substance Abuse and Mental Health Services Administration',
    abbreviation: 'SAMHSA',
    type: 'Federal Oversight',
    state: 'Federal',
    website: 'https://www.samhsa.gov',
    description: 'Federal agency overseeing SUD and mental health treatment. Administers OTP certification, TEDS (Treatment Episode Data Set) reporting, and state block grant oversight.',
    relevance: 'Sunrise must comply with SAMHSA regulations for any federally-funded programs. TEDS reporting submitted through MD BHA and DSAMH gateways. 42 CFR Part 2 (patient privacy) compliance required.',
  },
  {
    id: 'dea',
    name: 'Drug Enforcement Administration',
    abbreviation: 'DEA',
    type: 'Federal Oversight',
    state: 'Federal',
    website: 'https://www.dea.gov',
    description: 'Regulates prescribing and dispensing of controlled substances (CII–CV). DEA registration required for all prescribers. ARCOS reporting for CII substances.',
    relevance: 'All prescribers must maintain active DEA registration. MATE Act (Dec 2022) eliminated X-waiver requirement for buprenorphine. DEA CSOS for electronic Schedule II ordering.',
  },
  {
    id: 'cms',
    name: 'Centers for Medicare & Medicaid Services',
    abbreviation: 'CMS',
    type: 'Federal Oversight',
    state: 'Federal',
    website: 'https://www.cms.gov',
    description: 'Federal agency overseeing Medicare, Medicaid, and CHIP. Sets COPs (Conditions of Participation) and quality reporting requirements.',
    relevance: 'CMS Conditions of Participation apply to any Medicare/Medicaid-participating SUD providers. Value-based care and quality reporting requirements.',
  },
];

// ─── Maryland SUD Credentialing Pathway (MD BHA / ADAA) ──────────────────────

export const MD_CREDENTIAL_PATHWAY: CredentialDefinition[] = [
  {
    id: 'md_adt',
    abbreviation: 'ADT',
    fullName: 'Alcohol and Drug Trainee',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Trainee',
    prerequisites: ['Application to MD BHA/ADAA', 'High school diploma or equivalent', 'Background check'],
    practiceHoursRequired: 0,
    supervisionHoursRequired: 0,
    ceuRequiredPerCycle: 0,
    renewalCycleYears: 1,
    scope: 'Entry-level SUD direct care under close supervision of BAS. Must be supervised at all times by BAS or CAC-AD/CPC-AD. Cannot provide independent counseling.',
    notes: 'Starting point for all MD SUD counselor trainees. Requires registration before any direct SUD service delivery to publicly-funded clients. Must be on the path toward CSC-AD.',
    qualifiesFor: ['Direct care under supervision'],
  },
  {
    id: 'md_csc_ad',
    abbreviation: 'CSC-AD',
    fullName: 'Certified Supervised Counselor — Alcohol and Drug',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Supervised',
    prerequisites: ['ADT registration', '2,000 supervised practice hours', 'Board Approved Supervisor (BAS) attestation', 'Written examination'],
    practiceHoursRequired: 2000,
    supervisionHoursRequired: 100,
    ceuRequiredPerCycle: 20,
    renewalCycleYears: 2,
    scope: 'Can provide SUD counseling under supervision of BAS. Cannot sign off on treatment plans or discharge summaries independently.',
    notes: 'Intermediate credential. Requires active supervision by Board Approved Supervisor (BAS). 100 supervision hours must be documented. Must continue toward CAC-AD within 5 years.',
    qualifiesFor: ['SUD counseling under supervision'],
  },
  {
    id: 'md_cac_ad',
    abbreviation: 'CAC-AD',
    fullName: 'Certified Associate Counselor — Alcohol and Drug',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Associate',
    prerequisites: ['CSC-AD credential', '6,000 total supervised practice hours', 'BAS attestation', 'Written and oral examination'],
    practiceHoursRequired: 6000,
    supervisionHoursRequired: 300,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Independent SUD counseling with MD-funded clients. Can sign progress notes and treatment plan updates. Cannot independently sign treatment plans without co-signature from LCPC/LCSW-C until CPC-AD.',
    notes: 'Primary working credential for SUD counselors in Maryland BHA-licensed programs. Also required credential for Board Approved Supervisor (BAS) designation.',
    qualifiesFor: ['Independent SUD counseling', 'BAS designation eligibility', 'QBHP (with supervision)'],
  },
  {
    id: 'md_cpc_ad',
    abbreviation: 'CPC-AD',
    fullName: 'Certified Professional Counselor — Alcohol and Drug',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Professional',
    prerequisites: ['CAC-AD credential', 'Active LPC/LCPC/LCSW/LCSW-C license (Maryland)', 'Continuing education requirements'],
    practiceHoursRequired: 6000,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Highest SUD counseling credential in Maryland. Full independent practice. Can serve as supervisor and sign all clinical documentation.',
    notes: 'Dual-credential (CPC-AD + LPC/LCPC or LCSW) required for highest-level clinical positions in Maryland BHA-licensed programs.',
    qualifiesFor: ['Independent clinical practice', 'BAS designation', 'Program Director', 'Clinical Supervisor'],
  },
  {
    id: 'md_bas',
    abbreviation: 'BAS',
    fullName: 'Board Approved Supervisor',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Supervisor',
    prerequisites: ['Active CAC-AD or CPC-AD', 'BAS-specific training (minimum 30 hours)', 'Demonstrated supervision experience', 'Application to MD BHA'],
    ceuRequiredPerCycle: 10,
    renewalCycleYears: 2,
    scope: 'Authorized to supervise ADT and CSC-AD staff toward CAC-AD. Required for all supervisors of SUD trainees in MD BHA-funded programs. Must be identified on-site and accessible.',
    notes: 'CRITICAL: Any facility employing ADT or CSC-AD staff MUST have a BAS on staff. BAS must document supervision hours. Without BAS, trainee staff cannot provide SUD services.',
    qualifiesFor: ['Supervision of ADT staff', 'Supervision of CSC-AD staff', 'Clinical Supervisor designation'],
  },
  {
    id: 'md_lpc',
    abbreviation: 'LPC',
    fullName: 'Licensed Professional Counselor',
    state: 'Maryland',
    issuingBodyId: 'mbpct',
    tier: 'Licensed',
    prerequisites: ['Master\'s degree in counseling or related field (60 credit hours)', '2 years post-master\'s supervised experience (3,000 hours)', 'NCE or NCMHCE examination', 'MBPCT application'],
    practiceHoursRequired: 3000,
    supervisionHoursRequired: 100,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Licensed counseling practice. Can diagnose mental health conditions. Cannot independently supervise pre-licensed counselors (requires LCPC for supervisory functions).',
    notes: 'Gateway license; upgrade to LCPC requires additional 3,000 hours and 2 more years under LCPC supervision.',
    qualifiesFor: ['Independent mental health counseling', 'Diagnosis (DSM-5)', 'QBHP'],
  },
  {
    id: 'md_lcpc',
    abbreviation: 'LCPC',
    fullName: 'Licensed Clinical Professional Counselor',
    state: 'Maryland',
    issuingBodyId: 'mbpct',
    tier: 'Licensed',
    prerequisites: ['Active LPC (Maryland)', '3,000 additional post-LPC supervised hours', 'NCMHCE examination', 'MBPCT application'],
    practiceHoursRequired: 6000,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Full independent clinical practice. Can supervise LPC-Associates and LPCs toward LCPC licensure. Qualifies as Clinical Director in Maryland BHA-licensed SUD programs.',
    notes: 'Highest counseling license in Maryland. Required for clinical supervisor role in most Maryland SUD programs.',
    qualifiesFor: ['Independent clinical practice', 'Clinical Supervision', 'Program Director', 'BAS eligibility'],
  },
  {
    id: 'md_lmft',
    abbreviation: 'LMFT',
    fullName: 'Licensed Marriage & Family Therapist',
    state: 'Maryland',
    issuingBodyId: 'mbpct',
    tier: 'Licensed',
    prerequisites: ['Master\'s or doctoral degree in MFT', 'Supervised experience (2 years, 1,000 direct client hours)', 'AMFTRB examination', 'MBPCT application'],
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Licensed family and couples therapy. Co-occurring mental health treatment. Not a primary SUD credential — must hold CAC-AD/CSC-AD for SUD counseling in MD-funded programs.',
    notes: 'Licensed by MBPCT. Can treat co-occurring disorders but should hold MD BHA credential for SUD-specific services.',
    qualifiesFor: ['Family/couples therapy', 'Co-occurring MH treatment', 'QBHP'],
  },
];

// ─── Delaware SUD Credentialing Pathway (IC&RC / DSAMH) ──────────────────────

export const DE_CREDENTIAL_PATHWAY: CredentialDefinition[] = [
  {
    id: 'de_cadc',
    abbreviation: 'CADC',
    fullName: 'Certified Alcohol and Drug Counselor',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Associate',
    prerequisites: ['IC&RC application', '6,000 supervised practice hours', 'Supervision documentation', 'IC&RC written examination', 'Ethics attestation'],
    practiceHoursRequired: 6000,
    supervisionHoursRequired: 300,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Primary working SUD counselor credential in Delaware DSAMH-licensed programs. Can provide independent SUD counseling services to DSAMH-funded clients.',
    notes: 'Delaware DSAMH recognizes IC&RC CADC as the baseline credential for SUD counselor practice. Entry-level staff must register with DSAMH while accumulating hours toward CADC.',
    qualifiesFor: ['SUD counseling (DE)', 'QBHP (DE)', 'BAS eligibility (DE)'],
  },
  {
    id: 'de_caadc',
    abbreviation: 'CAADC',
    fullName: 'Certified Advanced Alcohol and Drug Counselor',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Professional',
    prerequisites: ['Active CADC', 'Additional 4,000 practice hours (total 10,000)', 'Advanced IC&RC examination', 'Supervision documentation'],
    practiceHoursRequired: 10000,
    ceuRequiredPerCycle: 60,
    renewalCycleYears: 2,
    scope: 'Advanced SUD counseling. Can serve as supervisor in DE DSAMH-licensed programs. Elevated clinical documentation authority.',
    notes: 'IC&RC CAADC recognized by DSAMH as advanced SUD credential. Qualifies for clinical supervisory roles.',
    qualifiesFor: ['Advanced SUD counseling', 'Clinical Supervision (DE)', 'Program Director eligibility'],
  },
  {
    id: 'de_ladc',
    abbreviation: 'LADC',
    fullName: 'Licensed Alcohol and Drug Counselor',
    state: 'Delaware',
    issuingBodyId: 'de_dpr',
    tier: 'Licensed',
    prerequisites: ['Active CADC (IC&RC)', 'Bachelor\'s or master\'s degree', 'Delaware Board of Mental Health & Chemical Dependency Professionals application', 'State examination'],
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Licensed SUD counselor in Delaware. Independent practice. Licensed by Delaware Division of Professional Regulation.',
    notes: 'Delaware\'s state-licensed SUD counselor credential. Issued by Delaware DPR (Board of Mental Health & Chemical Dependency Professionals).',
    qualifiesFor: ['Independent SUD counseling (DE)', 'Supervision', 'QBHP (DE)'],
  },
  {
    id: 'de_prs',
    abbreviation: 'PRS',
    fullName: 'Peer Recovery Specialist',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Supervised',
    prerequisites: ['Lived experience with SUD or mental health recovery', 'DSAMH application', 'PRS training (40 hrs)', 'Supervised practice'],
    ceuRequiredPerCycle: 20,
    renewalCycleYears: 2,
    scope: 'Peer support services within DSAMH-licensed programs. Shares lived experience; provides hope, motivation, and navigation support. Cannot provide clinical counseling.',
    notes: 'Delaware DSAMH-issued. Entry point for people in recovery to enter the behavioral health workforce. Must work under clinical supervision.',
    qualifiesFor: ['Peer support services (DE)', 'Group co-facilitation'],
  },
  {
    id: 'de_cprs',
    abbreviation: 'CPRS',
    fullName: 'Certified Peer Recovery Specialist',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Professional',
    prerequisites: ['Active PRS (Delaware)', 'Additional supervised hours', 'DSAMH CPRS examination', 'CEU completion'],
    ceuRequiredPerCycle: 20,
    renewalCycleYears: 2,
    scope: 'Advanced peer support. Can lead peer support groups and mentor PRS staff. Recognized by DSAMH and some payers for reimbursement.',
    notes: 'Delaware\'s advanced peer credential. CPRS services may be billable to DE Medicaid (Diamond State Health Plan) under certain program types.',
    qualifiesFor: ['Advanced peer support (DE)', 'Group leadership', 'PRS mentorship'],
  },
  {
    id: 'de_lpcmh',
    abbreviation: 'LPCMH',
    fullName: 'Licensed Professional Counselor of Mental Health',
    state: 'Delaware',
    issuingBodyId: 'de_dpr',
    tier: 'Licensed',
    prerequisites: ['Master\'s degree (60 credits)', '3,000 post-master\'s supervised hours', 'NCE or NCMHCE examination', 'Delaware DPR application'],
    practiceHoursRequired: 3000,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Licensed mental health counseling in Delaware. Can diagnose mental health conditions. Delaware\'s equivalent of LPC/LCPC in other states.',
    notes: 'Primary counseling license in Delaware. Board of Mental Health and Chemical Dependency Professionals under Delaware DPR.',
    qualifiesFor: ['Independent MH counseling (DE)', 'Diagnosis (DSM-5)', 'QBHP (DE)'],
  },
];

// ─── Medicaid Programs ─────────────────────────────────────────────────────────

export const MEDICAID_PROGRAMS: MedicaidProgram[] = [
  {
    id: 'md_healthchoice',
    state: 'Maryland',
    programName: 'Maryland Medical Assistance — HealthChoice',
    adminAgency: 'Maryland Department of Health (MDH) — Office of Health Services',
    deliveryModel: 'Mandatory Managed Care — HealthChoice MCOs',
    mcos: [
      { name: 'CareFirst BlueCross BlueShield', abbreviation: 'CareFirst', phone: '1-800-730-8530', portalUrl: 'https://provider.carefirst.com' },
      { name: 'Optum Maryland (UHC)', abbreviation: 'Optum MD', phone: '1-800-888-1998', portalUrl: 'https://provider.optum.com', notes: 'Handles HealthChoice behavioral health carve-out for many MCOs' },
      { name: 'UnitedHealthcare Community Plan', abbreviation: 'UHC', phone: '1-800-791-9233' },
      { name: 'Jai Medical Systems', abbreviation: 'Jai Medical', phone: '1-888-524-1999', notes: 'Serves Baltimore City and select counties' },
      { name: 'Priority Partners (Johns Hopkins)', abbreviation: 'Priority Partners', phone: '1-800-654-9728' },
      { name: 'Maryland Physicians Care', abbreviation: 'MPC', phone: '1-800-953-8854' },
    ],
    relevantServices: ['Residential SUD (ASAM 3.1/3.5/3.7)', 'PHP (ASAM 2.5)', 'IOP (ASAM 2.1)', 'OP (ASAM 1.0)', 'MAT', 'Peer Support Services'],
    priorAuthRequired: true,
    billableCredentials: ['LCPC', 'LPC', 'CAC-AD', 'CPC-AD', 'MD', 'LCSW-C', 'LMFT', 'RN'],
    notes: 'Maryland HealthChoice requires prior authorization for all levels of care. ASAM LOCA criteria mandatory for level-of-care determination. Billing NPI must be enrolled with each MCO. Annual credentialing required.',
  },
  {
    id: 'de_diamondstate',
    state: 'Delaware',
    programName: 'Delaware Medicaid — Diamond State Health Plan',
    adminAgency: 'Delaware Division of Medicaid and Medical Assistance (DMMA)',
    deliveryModel: 'Mandatory Managed Care — Diamond State Health Plan (DSHP)',
    mcos: [
      { name: 'Highmark Health Options (Diamond State)', abbreviation: 'Highmark DSHP', phone: '1-855-550-1997', portalUrl: 'https://www.highmarkhealthoptions.com', notes: 'Primary MCO for Diamond State Health Plan' },
      { name: 'AmeriHealth Caritas Delaware', abbreviation: 'AmeriHealth', phone: '1-855-355-3423', notes: 'DSHP Plus (long-term services & supports)' },
    ],
    relevantServices: ['Residential SUD', 'PHP', 'IOP', 'OP', 'MAT', 'Peer Support Services (CPRS)'],
    priorAuthRequired: true,
    billableCredentials: ['LPCMH', 'LADC', 'CADC', 'MD', 'LCSW', 'RN', 'CPRS (peer services)'],
    notes: 'Delaware Medicaid requires DSAMH facility license and provider enrollment with DMMA. DSAMH WITS reporting required for all DSAMH-funded services. CPRS peer services billable under certain program types.',
  },
];

// ─── Accreditation Standards ──────────────────────────────────────────────────

export const ACCREDITATION_STANDARDS: AccreditationStandard[] = [
  {
    id: 'carf_sud',
    body: 'CARF',
    program: 'Substance Use Disorder Treatment',
    abbreviation: 'CARF SUD',
    description: 'CARF accreditation for SUD residential, PHP, IOP, and OP programs. Covers organizational leadership, clinical records, service delivery, and quality improvement.',
    staffingRequirements: [
      'Medical Director: Physician with addiction medicine training (MD/DO; FASAM or ABAM preferred)',
      'Clinical Director: Licensed behavioral health professional (LCPC, LCSW-C, LMFT, or equivalent) with SUD experience',
      'Primary Counselors: Must hold state-recognized SUD credential (CAC-AD in MD; CADC in DE) or be in supervised training (ADT/CSC-AD with BAS on staff)',
      'Nursing: RN required for detox and medical services; LPN under RN supervision',
      'BHT: Must meet CARF Qualified Direct Service Provider standards; ADT or equivalent training required',
      'All staff: Background checks, documented competency verification, annual performance reviews',
    ],
    supervisoryRequirements: [
      'Clinical supervision documented for all pre-licensed and trainee staff (ADT, CSC-AD, LPC-A)',
      'BAS on staff for all Maryland ADT/CSC-AD supervision',
      'Supervision frequency: minimum 1 hour per week (individual) or 2 hrs/month (group) per CARF standards',
      'Supervisory agreements documented in personnel files',
      'Co-signature requirements per licensure board rules must be reflected in clinical documentation policy',
    ],
    qualityRequirements: [
      'Annual quality improvement plan with measurable outcomes',
      'Standardized outcome measures (AUDIT, DAST, ASI, GAIN) at intake and discharge',
      'Consumer satisfaction surveys',
      'Incident reporting and adverse event review',
      'Annual program evaluation comparing outcomes to benchmarks',
      'Continuous readiness for CARF survey (triennial)',
    ],
    surveyFrequency: 'Triennial (every 3 years) with annual conformance reports',
    website: 'https://www.carf.org/standards/behavioral-health/sud',
  },
  {
    id: 'tjc_bhca',
    body: 'The Joint Commission',
    program: 'Behavioral Health Care and Human Services',
    abbreviation: 'TJC BHCA',
    description: 'TJC accreditation for behavioral health and SUD programs. Rigorous standards for patient rights, medication management, clinical leadership, and environment of care.',
    staffingRequirements: [
      'Medical Director: Physician licensed in state of operation; addiction specialty preferred',
      'Qualified Behavioral Health Professional (QBHP): Licensed clinician (LCPC, LCSW-C, LMFT, MD) for clinical oversight',
      'All clinical staff: State-required licenses and credentials verified and on file',
      'Staffing ratios documented for each level of care',
      'Training records (CPR, de-escalation, medication administration) current for all staff',
    ],
    supervisoryRequirements: [
      'Governing body oversight of medical staff credentialing',
      'Peer review process for clinical staff documentation',
      'Medical staff bylaws governing credentialing, privileges, and corrective action',
      'Performance evaluations at hire, 90 days, and annually',
    ],
    qualityRequirements: [
      'Patient safety plan and incident reporting system',
      'Medication management policies per TJC NPSG (National Patient Safety Goals)',
      'Restraint/seclusion policy compliant with TJC standards',
      'Environment of care safety inspections',
      'Root cause analysis for sentinel events',
      'Board-level quality committee review',
    ],
    surveyFrequency: 'Triennial with unannounced surveys possible',
    website: 'https://www.jointcommission.org/accreditation-and-certification/health-care-settings/behavioral-health-care',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRegulatoryBodyById(id: string): RegulatoryBody | undefined {
  return REGULATORY_BODIES.find(b => b.id === id);
}

export function getCredentialsByState(state: ComplianceState): CredentialDefinition[] {
  const md = MD_CREDENTIAL_PATHWAY.filter(c => c.state === state);
  const de = DE_CREDENTIAL_PATHWAY.filter(c => c.state === state);
  return [...md, ...de];
}

export function getMedicaidByState(state: ComplianceState): MedicaidProgram | undefined {
  return MEDICAID_PROGRAMS.find(p => p.state === state);
}

export function getRegulatoryBodiesByState(state: ComplianceState): RegulatoryBody[] {
  return REGULATORY_BODIES.filter(b => b.state === state || b.state === 'Multi-State' || b.state === 'Federal');
}

/** Minimum credentials required for a given role in a given state */
export const STATE_ROLE_REQUIREMENTS: Record<string, Record<string, string>> = {
  Maryland: {
    'Clinical Director / Supervisor': 'LCPC or LCSW-C + CAC-AD or CPC-AD + Board Approved Supervisor (BAS)',
    'Primary SUD Counselor': 'LPC or higher + CAC-AD (or CSC-AD under BAS supervision)',
    'MH Therapist (SUD program)': 'LMFT, LCPC, or LCSW + CAC-AD recommended for SUD services',
    'Prescriber': 'MD or DO — Maryland Board of Physicians; DEA registration for controlled substances',
    'Nurse': 'RN — Maryland Board of Nursing (MBON)',
    'BHT / Entry Counselor': 'ADT registration (MD BHA) required before direct SUD service; supervised by BAS',
    'Peer Recovery': 'Not a state-regulated credential in MD; PRSS recommended for reimbursement',
  },
  Delaware: {
    'Clinical Director / Supervisor': 'CAADC or LADC + DSAMH supervisor recognition; or LPCMH/LCSW with SUD experience',
    'Primary SUD Counselor': 'CADC (IC&RC) — DSAMH recognized; entry-level staff must register with DSAMH',
    'MH Therapist (SUD program)': 'LPCMH or LCSW — Delaware DPR; CADC recommended for SUD services',
    'Prescriber': 'MD or DO — Delaware Board of Medical Licensure; DEA registration',
    'Nurse': 'RN — Delaware Board of Nursing',
    'BHT / Entry Counselor': 'DSAMH registration required before direct SUD service; working toward CADC',
    'Peer Recovery': 'PRS (Delaware DSAMH) required; CPRS preferred; CPRS billable to Diamond State Health Plan',
  },
};
