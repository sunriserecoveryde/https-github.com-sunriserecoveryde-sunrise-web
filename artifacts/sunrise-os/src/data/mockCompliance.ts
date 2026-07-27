/**
 * mockCompliance.ts
 *
 * Regulatory and credentialing reference data for Sunrise Recovery Center's
 * Maryland (Rockville) and Delaware (Wilmington) facilities.
 *
 * Maryland references: Code of Maryland Regulations (COMAR), Title 10 (Health)
 *   – COMAR 10.47  : Behavioral Health Administration — SUD program licensing & credentialing
 *   – COMAR 10.21  : Mental Hygiene Administration — mental health programs
 *   – COMAR 10.63  : Behavioral Health Programs (comprehensive, cross-LOC)
 *   – COMAR 10.09.80 : HealthChoice (Medicaid managed care)
 *
 * Delaware references: DSAMH Division Standards (Title 16 DSCR), IC&RC credential rules,
 *   DSAMH Provider Manual, and Delaware Medicaid (DMMA) billing guidelines.
 *
 * Covers:
 *   – State licensing, SUD credentialing pathways, and practitioner boards
 *   – Documentation timelines by level of care
 *   – Staffing ratios by level of care
 *   – Medicaid payers and managed care organizations
 *   – Accrediting bodies (CARF, The Joint Commission)
 *   – Federal oversight (SAMHSA, DEA, CMS, 42 CFR Part 2)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComplianceState = 'Maryland' | 'Delaware' | 'Federal' | 'Multi-State';
export type CredentialTier  = 'Trainee' | 'Supervised' | 'Associate' | 'Professional' | 'Licensed' | 'Supervisor';
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
  relevance: string;
  renewalCycle?: string;
  contactPhone?: string;
  comarCitation?: string;   // e.g. 'COMAR 10.47.01'
  dsamhCitation?: string;   // e.g. 'DSAMH Provider Manual §4.2'
}

export interface CredentialDefinition {
  id: string;
  abbreviation: string;
  fullName: string;
  state: ComplianceState;
  issuingBodyId: string;
  tier: CredentialTier;
  prerequisites: string[];
  practiceHoursRequired?: number;
  supervisionHoursRequired?: number;
  trainingHoursRequired?: number;
  ceuRequiredPerCycle?: number;
  renewalCycleYears?: number;
  scope: string;
  notes: string;
  regulatoryCitation?: string;
  qualifiesFor?: string[];
}

export interface DocumentationTimeline {
  id: string;
  levelOfCare: string;
  asamLevel: string;
  state: ComplianceState;
  regulatoryCitation: string;
  requirements: {
    label: string;
    timeline: string;
    regulatory?: string;
    notes?: string;
  }[];
}

export interface StaffingRatioRequirement {
  id: string;
  levelOfCare: string;
  asamLevel: string;
  state: ComplianceState;
  regulatoryCitation: string;
  ratios: {
    role: string;
    ratio: string;
    notes?: string;
  }[];
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

  // ── Maryland Licensing Boards ──────────────────────────────────────────────

  {
    id: 'mbpct',
    name: 'Maryland Board of Professional Counselors and Therapists',
    abbreviation: 'MBPCT',
    type: 'Licensing Board',
    state: 'Maryland',
    website: 'https://health.maryland.gov/mbpct',
    comarCitation: 'COMAR 10.58.01–10.58.16',
    description: 'Licenses LPCs, LCPCs, and LMFTs in Maryland under Health Occupations Article §17. LCPC is the entry-level license requiring master\'s degree and 3,000 post-graduate supervised hours; LCPC (clinical level) requires an additional 3,000 hours and qualifies the holder for independent practice and supervision of pre-licensed clinicians.',
    relevance: 'All licensed counselors and therapists at the Rockville facility must hold active MBPCT licensure. LCPC or LCADC is required for Clinical Director and clinical supervisor roles per COMAR 10.47.01.',
    renewalCycle: 'Biennial (every 2 years); 40 Category A/B CEUs required per cycle',
    contactPhone: '(410) 764-4732',
  },
  {
    id: 'mbswe',
    name: 'Maryland Board of Social Work Examiners',
    abbreviation: 'MBSWE',
    type: 'Licensing Board',
    state: 'Maryland',
    website: 'https://health.maryland.gov/mbswe',
    comarCitation: 'COMAR 10.42.01–10.42.09',
    description: 'Licenses LGSW (graduate level), LCADC (clinical), and LCADC (clinical with supervisor designation) in Maryland. LCADC is the highest social work license and qualifies for independent clinical practice, supervision, and serves as QBHP in SUD programs.',
    relevance: 'Social workers providing clinical services at Rockville must hold MBSWE licensure. LCADC is accepted as Clinical Supervisor credential in Maryland BHA-licensed SUD programs per COMAR 10.47.01.22.',
    renewalCycle: 'Biennial; 40 CEUs required (including 3 hrs ethics)',
    contactPhone: '(410) 764-4788',
  },
  {
    id: 'mbp',
    name: 'Maryland Board of Physicians',
    abbreviation: 'MBP',
    type: 'Licensing Board',
    state: 'Maryland',
    website: 'https://mbp.maryland.gov',
    comarCitation: 'COMAR 10.32.01–10.32.29; Health Occupations Article §14',
    description: 'Licenses MDs, DOs, CRNPs (including Psychiatric NPs), and Physician Assistants (PA-Cs) in Maryland. DEA registration required separately for controlled substance prescribing. MATE Act (Dec 2022) eliminated X-Waiver requirement for buprenorphine.',
    relevance: 'All prescribers and the Medical Director at Rockville must hold active MBP licensure. Failure to maintain current MBP license constitutes a Maryland COMAR 10.47 facility compliance violation.',
    renewalCycle: 'Biennial; 50 Category A CME hours required',
    contactPhone: '(410) 764-4777',
  },
  {
    id: 'mbon',
    name: 'Maryland Board of Nursing',
    abbreviation: 'MBON',
    type: 'Licensing Board',
    state: 'Maryland',
    website: 'https://mbon.maryland.gov',
    comarCitation: 'COMAR 10.27.01–10.27.21; Health Occupations Article §8',
    description: 'Licenses RNs, LPNs, CRNPs, and CNAs in Maryland. RNs with addiction nursing specialty may seek CARN certification (IntNSA). LPNs may administer medications only under RN supervision per COMAR 10.27.09.',
    relevance: 'All nursing staff at Rockville must hold active MBON licensure. Residential programs under COMAR 10.47.03 require an RN on-site during all hours of operation.',
    renewalCycle: 'Biennial; 30 continuing education hours or practice attestation',
    contactPhone: '(410) 585-1900',
  },
  {
    id: 'mdbha',
    name: 'Maryland Behavioral Health Administration',
    abbreviation: 'MD BHA',
    type: 'SUD Credentialing Body',
    state: 'Maryland',
    website: 'https://bha.health.maryland.gov',
    comarCitation: 'COMAR 10.47.01 (program certification); COMAR 10.47.02–10.47.09 (LOC-specific); COMAR 10.63 (comprehensive BH programs)',
    description: 'The Maryland Department of Health agency responsible for licensing all SUD and behavioral health treatment facilities and administering the ADAA (Alcohol and Drug Abuse Administration) counselor credentialing program. The ADAA credential ladder — ADT → CSC-AD → CAC-AD → CPC-AD — governs all SUD counselors working with publicly-funded Maryland clients. BHA also administers the Board Approved Supervisor (BAS) designation required for all facilities employing ADT or CSC-AD trainees.',
    relevance: 'Sunrise Rockville must hold current BHA facility certification under COMAR 10.47.01. All SUD counselors serving publicly-funded Maryland clients must hold an active BHA/ADAA credential. BAS must be identifiable on-site per COMAR 10.47.01.22E. Annual program reports and SMART outcome data submission required.',
    renewalCycle: 'Facility certification annual; credential tiers 2–3 years',
    contactPhone: '(410) 402-8600',
  },
  {
    id: 'mabpcb',
    name: 'Maryland Addiction and Behavioral Health Professional Certification Board',
    abbreviation: 'MABPCB',
    type: 'SUD Credentialing Body',
    state: 'Maryland',
    website: 'https://mabpcb.org',
    description: 'Maryland nonprofit credentialing board that issues the Certified Peer Recovery Specialist (ADT-MD) credential. ADT-MD is the Maryland-recognized peer support credential required for Medicaid reimbursement of peer recovery support services under HealthChoice.',
    relevance: 'Peer Recovery Specialists at Sunrise Rockville must hold MABPCB ADT-MD to bill peer services to Maryland Medicaid (HealthChoice). Peer support services are a billable LOC under COMAR 10.09.80.16 when provided by a ADT-MD holder under clinical supervision.',
    renewalCycle: 'Annual; 20 CEUs required',
    contactPhone: '(443) 524-9004',
  },
  {
    id: 'mdmedicaid',
    name: 'Maryland Department of Health — Medical Assistance (Medicaid)',
    abbreviation: 'MDH / Medical Assistance',
    type: 'Medicaid Oversight',
    state: 'Maryland',
    website: 'https://mmcp.health.maryland.gov',
    comarCitation: 'COMAR 10.09.80 (HealthChoice); COMAR 10.09.16 (Medicaid SUD services)',
    description: 'Administers Maryland Medicaid (Medical Assistance) through the HealthChoice mandatory managed care program. Covers SUD residential (ASAM 3.1/3.5/3.7), PHP (ASAM 2.5), IOP (ASAM 2.1), and OP (ASAM 1.0), MAT, and peer recovery support services. Behavioral health carve-out administered through Optum Maryland for most HealthChoice MCOs.',
    relevance: 'Billing, prior authorization, ASAM-based LOC determination, and SMART outcome reporting for all Maryland Medicaid patients. MCO contracts must be maintained. Provider enrollment and NPI credentialing required per MCO.',
    contactPhone: '1-800-492-5231',
  },
  {
    id: 'crisp',
    name: 'Chesapeake Regional Information System for our Patients',
    abbreviation: 'CRISP',
    type: 'HIE',
    state: 'Maryland',
    website: 'https://crisphealth.org',
    description: "Maryland's state-designated Health Information Exchange (HIE) under the Maryland Health Information Exchange Act. Provides real-time ADT (Admission, Discharge, Transfer) notifications, CCD (Continuity of Care Document) exchange, PDMP integration, and care coordination alerts to all participating Maryland providers.",
    relevance: 'Sunrise Rockville participation in CRISP is required for Maryland Medicaid value-based program participation and strongly encouraged for care coordination. CRISP ADT notifications enable same-day follow-up when a patient is admitted to or discharged from an ED or hospital.',
  },
  {
    id: 'mdpdmp',
    name: 'Maryland Prescription Drug Monitoring Program',
    abbreviation: 'MD PDMP',
    type: 'PDMP',
    state: 'Maryland',
    website: 'https://pdmp.maryland.gov',
    comarCitation: 'COMAR 10.47.08; Health-General Article §21-2A-01 et seq.',
    description: 'Maryland PDMP operated by the Maryland Department of Health. Provides real-time monitoring of Schedule II–V controlled substance prescriptions dispensed in Maryland. Mandatory query required before prescribing opioids or benzodiazepines and at each subsequent refill per Maryland law (Md. Code Ann., Health-General §21-2A-04.1).',
    relevance: 'All prescribers at Rockville must query MD PDMP before prescribing opioids, benzodiazepines, or other Schedule II–V substances. PDMP query results must be documented in the patient chart. Integrated via CRISP/PMPInterConnect gateway.',
  },

  // ── Delaware Licensing Boards & Regulatory Bodies ─────────────────────────

  {
    id: 'dsamh',
    name: 'Delaware Division of Substance Abuse and Mental Health',
    abbreviation: 'DSAMH',
    type: 'SUD Credentialing Body',
    state: 'Delaware',
    website: 'https://www.dhss.delaware.gov/dsamh',
    dsamhCitation: 'Title 16 DSCR §6600–6699 (SUD Treatment Standards); DSAMH Provider Manual',
    description: 'The Delaware agency under DHSS responsible for licensing all SUD and mental health treatment facilities and setting clinical standards. DSAMH recognizes IC&RC credentials (CADC, CAC-AD) as the counselor credentialing pathway. Entry-level counselors must register with DSAMH before providing any direct SUD services. DSAMH administers WITS (Web Infrastructure for Treatment Services) for outcome and encounter data. Peer support services are credentialed via PRS and ADT designations issued directly by DSAMH.',
    relevance: 'Sunrise Wilmington must hold current DSAMH facility license. All clinical staff must hold DSAMH-recognized credentials. WITS data submission required for all DSAMH-funded client encounters. Failure to maintain DSAMH license bars participation in Delaware Medicaid SUD services.',
    contactPhone: '(302) 255-9399',
  },
  {
    id: 'de_dpr',
    name: 'Delaware Division of Professional Regulation — Board of Mental Health and Chemical Dependency Professionals',
    abbreviation: 'DE DPR / BMHCDP',
    type: 'Licensing Board',
    state: 'Delaware',
    website: 'https://dpr.delaware.gov',
    dsamhCitation: 'Title 24 Del. C. §3001 et seq. (Board of Mental Health and Chemical Dependency Professionals)',
    description: 'Licenses LPCMHs (Licensed Professional Counselors of Mental Health) and LCSWs through the Board of Mental Health and Chemical Dependency Professionals. LPCMH is the primary counseling license in Delaware, equivalent to LCPC in Maryland. The board also licenses Alcohol and Drug Counselors (ADC/LADC) and recognizes IC&RC credentials at the state professional level.',
    relevance: 'All licensed counselors and therapists at Wilmington must hold active DE DPR licensure. LPCMH or LCADC with SUD experience is accepted as Clinical Director credential in DSAMH-licensed programs.',
    renewalCycle: 'Biennial; 40 CEUs required',
    contactPhone: '(302) 744-4500',
  },
  {
    id: 'de_bon',
    name: 'Delaware Board of Nursing',
    abbreviation: 'DE BON',
    type: 'Licensing Board',
    state: 'Delaware',
    website: 'https://dpr.delaware.gov/boards/nursing',
    description: 'Licenses RNs, LPNs, and APRNs in Delaware under Title 24 Del. C. §1901 et seq. LPN medication administration in SUD facilities is permitted under RN delegation and supervision.',
    relevance: 'All nursing staff at Wilmington must hold active Delaware Board of Nursing licensure.',
    renewalCycle: 'Biennial; 30 continuing education hours',
  },
  {
    id: 'demedicaid',
    name: 'Delaware Medicaid — Division of Medicaid and Medical Assistance',
    abbreviation: 'DMMA',
    type: 'Medicaid Oversight',
    state: 'Delaware',
    website: 'https://www.dhss.delaware.gov/dhss/dmma',
    dsamhCitation: 'DSAMH Provider Manual; DMMA Billing Guidelines for SUD Services',
    description: 'Administers Delaware Medicaid through the Diamond State Health Plan (DSHP) mandatory managed care program. SUD services (residential, PHP, IOP, outpatient, MAT, peer support) are covered for Medicaid-enrolled clients. DSAMH WITS reporting is required as a condition of Medicaid reimbursement for DSAMH-funded services.',
    relevance: 'Billing, prior authorization, and outcome reporting for all Delaware Medicaid patients. Diamond State Health Plan (Highmark) and AmeriHealth Caritas contracts must be maintained. DSAMH facility license required for Medicaid provider enrollment.',
    contactPhone: '(302) 255-9500',
  },
  {
    id: 'dhin',
    name: 'Delaware Health Information Network',
    abbreviation: 'DHIN',
    type: 'HIE',
    state: 'Delaware',
    website: 'https://www.dhin.org',
    description: "Delaware's state-designated Health Information Exchange. Provides ADT notifications, clinical document exchange, and care coordination alerts for Delaware providers. Participation supports care transitions and reduces duplicate testing.",
    relevance: 'Sunrise Wilmington participates in DHIN for care coordination and ADT alerts for Delaware patients. ADT notifications enable timely follow-up when clients are seen in ED or hospital settings.',
  },
  {
    id: 'depdmp',
    name: 'Delaware Prescription Monitoring Program',
    abbreviation: 'DE PMP',
    type: 'PDMP',
    state: 'Delaware',
    website: 'https://dpr.delaware.gov/boards/controlledsubstances',
    description: 'Delaware PMP operated by DE DPR via the PMPInterConnect interstate network. Mandatory query required before prescribing or dispensing Schedule II–V controlled substances (16 Del. Admin. C. §4470). Delaware participates in multi-state PMP data sharing.',
    relevance: 'All prescribers at Wilmington must query DE PMP before prescribing Schedule II–V substances. Query results documented in patient chart. Accessible via PMPInterConnect gateway.',
  },

  // ── Accrediting Bodies ────────────────────────────────────────────────────

  {
    id: 'carf',
    name: 'Commission on Accreditation of Rehabilitation Facilities',
    abbreviation: 'CARF',
    type: 'Accrediting Body',
    state: 'Multi-State',
    website: 'https://www.carf.org',
    description: 'International accrediting body for health, human, and behavioral health services. CARF accreditation signals quality, accountability, and continuous improvement. CARF standards require individualized treatment planning, measurable outcomes, qualified staff, and continuous quality improvement — and complement (not replace) state COMAR and DSAMH licensing requirements.',
    relevance: 'Sunrise Recovery Center holds CARF accreditation for SUD Residential and Outpatient services. Both MD and DE facilities must maintain CARF standards. CARF survey findings are reportable to MD BHA and DSAMH as part of facility license compliance.',
    renewalCycle: '3-year accreditation cycle with annual conformance reports',
  },
  {
    id: 'tjc',
    name: 'The Joint Commission',
    abbreviation: 'TJC',
    type: 'Accrediting Body',
    state: 'Multi-State',
    website: 'https://www.jointcommission.org',
    description: 'Accredits hospitals, behavioral health organizations, and SUD treatment programs. TJC Behavioral Health Care and Human Services (BHCA) accreditation is accepted by many payers and demonstrates clinical quality. TJC standards address medication management, clinical leadership, patient rights, and environment of care.',
    relevance: 'TJC accreditation qualifies Sunrise for participation in certain payer networks. TJC NPSG (National Patient Safety Goals) drive medication safety protocols including PDMP integration and naloxone dispensing.',
    renewalCycle: 'Triennial survey cycle with unannounced surveys possible',
  },

  // ── Federal ───────────────────────────────────────────────────────────────

  {
    id: 'samhsa',
    name: 'Substance Abuse and Mental Health Services Administration',
    abbreviation: 'SAMHSA',
    type: 'Federal Oversight',
    state: 'Federal',
    website: 'https://www.samhsa.gov',
    description: 'Federal agency overseeing SUD and mental health treatment. Administers OTP certification, TEDS (Treatment Episode Data Set) reporting, and state block grant oversight. Key guidance documents include TIP-63 (medications for OUD), TIP-61 (SBIRT), and TIP-57 (trauma-informed care). SAMHSA Zero Suicide initiative informs safety planning requirements.',
    relevance: 'TEDS data submitted through MD BHA and DSAMH gateways. 42 CFR Part 2 (confidentiality of SUD patient records) compliance required — stricter than HIPAA for SUD records. SAMHSA Evidence-Based Practice (EBP) requirements inform treatment approaches.',
  },
  {
    id: 'dea',
    name: 'Drug Enforcement Administration',
    abbreviation: 'DEA',
    type: 'Federal Oversight',
    state: 'Federal',
    website: 'https://www.dea.gov',
    description: 'Regulates prescribing and dispensing of Schedule II–V controlled substances. DEA registration required for all prescribers. MATE Act (December 2022) eliminated the X-Waiver requirement for buprenorphine — all DEA-registered practitioners with Schedule III authority may now prescribe buprenorphine for OUD, but completion of 8-hour MATE training is required for DEA registration renewal.',
    relevance: 'All prescribers must maintain active DEA registration in the state(s) of practice (MD and DE each require separate state-specific DEA registration). MATE training documentation required at next renewal. ARCOS reporting for CII substance ordering.',
  },
  {
    id: 'cms',
    name: 'Centers for Medicare & Medicaid Services',
    abbreviation: 'CMS',
    type: 'Federal Oversight',
    state: 'Federal',
    website: 'https://www.cms.gov',
    description: 'Federal agency setting Conditions of Participation (CoPs), quality reporting, and Medicare/Medicaid coverage policy. SUD treatment parity (Mental Health Parity and Addiction Equity Act — MHPAEA) compliance is enforced at the CMS level. CMS Interoperability Rule (21st Century Cures Act) drives EHR data exchange requirements.',
    relevance: 'CoPs apply to any Medicare/Medicaid-participating SUD providers. MHPAEA compliance required for all insurance payers. CMS Prior Authorization rules (effective 2026) affect response timeline requirements from MCOs.',
  },
];

// ─── Maryland SUD Credentialing Pathway (ADAA / MD BHA) ──────────────────────
// Regulatory authority: COMAR 10.47.01.22
// Issuing body: Maryland Behavioral Health Administration (BHA) / Alcohol and Drug Abuse Administration (ADAA)

export const MD_CREDENTIAL_PATHWAY: CredentialDefinition[] = [
  {
    id: 'md_adt',
    abbreviation: 'ADT',
    fullName: 'Alcohol and Drug Trainee',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Trainee',
    regulatoryCitation: 'COMAR 10.47.01.22A',
    prerequisites: [
      'Application to MD BHA/ADAA',
      'High school diploma or equivalent (GED accepted)',
      'Clear criminal background check',
      'Commitment to pursue CSC-AD within 3 years',
    ],
    practiceHoursRequired: 0,
    trainingHoursRequired: 180,
    supervisionHoursRequired: 0,
    ceuRequiredPerCycle: 0,
    renewalCycleYears: 1,
    scope: 'Entry-level direct SUD care exclusively under close supervision of a Board Approved Supervisor (BAS) or higher credential. May co-facilitate groups, conduct check-ins, and perform supportive counseling tasks. Cannot conduct intake assessments, sign progress notes, or provide independent counseling. All client contact must occur under BAS line-of-sight or immediate supervision.',
    notes: 'COMAR 10.47.01.22A requires 180 hours of structured training before ADT registration is granted. ADT registration is valid for 1 year with annual renewal. Maximum tenure at ADT level: 3 years — the registrant must advance to CSC-AD or forfeit eligibility to work in MD BHA-licensed programs. ADT staff must be listed on the facility\'s BHA-approved organizational chart with their designated BAS supervisor named.',
    qualifiesFor: ['Direct care under BAS supervision'],
  },
  {
    id: 'md_csc_ad',
    abbreviation: 'CSC-AD',
    fullName: 'Certified Supervised Counselor — Alcohol and Drug',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Supervised',
    regulatoryCitation: 'COMAR 10.47.01.22B',
    prerequisites: [
      'ADT registration (or equivalent training in another state)',
      '4,000 total supervised practice hours (documented)',
      '270 contact hours of SUD-specific education or training',
      'Board Approved Supervisor (BAS) attestation of competency',
      'Written examination administered by MD BHA',
    ],
    practiceHoursRequired: 4000,
    trainingHoursRequired: 270,
    supervisionHoursRequired: 100,
    ceuRequiredPerCycle: 20,
    renewalCycleYears: 2,
    scope: 'May provide SUD counseling — individual sessions, group co-facilitation, and treatment planning participation — under active BAS supervision. Cannot sign or co-sign treatment plans or discharge summaries independently. Progress notes require BAS counter-signature per COMAR 10.47.01.22B(4).',
    notes: 'COMAR 10.47.01.22B specifies 4,000 supervised practice hours total (not 2,000) and 270 education hours as prerequisites. The 100 documented supervision hours must include at least 50 individual hours with the BAS. CSC-AD must advance to CAC-AD within 5 years or credential lapses. Renewal requires 20 CEUs per 2-year cycle.',
    qualifiesFor: ['SUD counseling under BAS supervision', 'Group co-facilitation'],
  },
  {
    id: 'md_cac_ad',
    abbreviation: 'CAC-AD',
    fullName: 'Certified Associate Counselor — Alcohol and Drug',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Associate',
    regulatoryCitation: 'COMAR 10.47.01.22C',
    prerequisites: [
      'Active CSC-AD credential',
      '6,000 total supervised practice hours (cumulative from ADT through CSC-AD)',
      '300 total documented supervision hours',
      'BAS attestation of independent readiness',
      'MD BHA written and oral examination',
    ],
    practiceHoursRequired: 6000,
    supervisionHoursRequired: 300,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Independent SUD counseling with publicly-funded Maryland clients. May sign progress notes, group notes, and treatment plan updates. May independently conduct ASAM assessments, biopsychosocial evaluations, and discharge planning. Cannot independently serve as BAS (requires separate BAS application) or sign off as clinical supervisor unless also holding BAS designation.',
    notes: 'The primary working credential for SUD counselors in Maryland BHA-licensed programs. Required credential for BAS designation eligibility per COMAR 10.47.01.22E. Renewal requires 40 CEUs per 2-year cycle, of which at least 6 hours must be in ethics. Lapsed CAC-AD requires reinstatement application to MD BHA.',
    qualifiesFor: ['Independent SUD counseling', 'BAS designation eligibility', 'QBHP (when also holding LCPC/LCPC/LCADC)'],
  },
  {
    id: 'md_cpc_ad',
    abbreviation: 'CPC-AD',
    fullName: 'Certified Professional Counselor — Alcohol and Drug',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Professional',
    regulatoryCitation: 'COMAR 10.47.01.22D',
    prerequisites: [
      'Active CAC-AD credential',
      'Active LCPC, LCPC, LCADC, or LCADC Maryland license',
      'Continuing education: 40 CEUs within the prior 2 years',
      'MD BHA application and attestation',
    ],
    practiceHoursRequired: 6000,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Highest-tier SUD counselor credential in Maryland. Full independent SUD practice without supervision. May serve as program clinical director, supervise all credential levels (including BAS functions), and sign all clinical documentation. Dual credential with LCPC or LCADC required for highest-level clinical leadership roles.',
    notes: 'CPC-AD is a dual-credential: the holder must maintain both the CPC-AD and an active Maryland clinical license (LCPC/LCPC/LCADC/LCADC) continuously. Lapse of either cancels CPC-AD authority. Required for Program Director in BHA-licensed residential programs per COMAR 10.47.03.05.',
    qualifiesFor: ['Independent clinical practice', 'BAS designation', 'Program Director (residential)', 'Clinical Supervisor (all levels)'],
  },
  {
    id: 'md_bas',
    abbreviation: 'BAS',
    fullName: 'Board Approved Supervisor',
    state: 'Maryland',
    issuingBodyId: 'mdbha',
    tier: 'Supervisor',
    regulatoryCitation: 'COMAR 10.47.01.22E',
    prerequisites: [
      'Active CAC-AD or CPC-AD credential',
      '30 hours of BAS-specific supervisor training (approved curriculum)',
      'Minimum 1 year of clinical supervision experience',
      'MD BHA BAS application and attestation',
    ],
    ceuRequiredPerCycle: 10,
    renewalCycleYears: 2,
    scope: 'Authorized to provide individual and group supervision to ADT and CSC-AD staff toward their CAC-AD credential. COMAR 10.47.01.22E requires the BAS to be identifiable, on-site, and immediately accessible during all hours when ADT or CSC-AD staff are providing services. Must document all supervision hours in the required MD BHA supervision log.',
    notes: 'CRITICAL COMPLIANCE POINT: Any BHA-licensed facility employing ADT or CSC-AD counselors MUST have a designated BAS on the organizational chart. Without an identified BAS, trainee staff cannot lawfully provide direct SUD services to MD-funded clients (COMAR 10.47.01.22E(2)). BAS supervision logs are subject to BHA audit. BAS designation lapses if underlying CAC-AD/CPC-AD lapses.',
    qualifiesFor: ['Supervision of ADT staff', 'Supervision of CSC-AD staff', 'Clinical Supervisor designation in BHA-licensed programs'],
  },
  {
    id: 'md_cprs',
    abbreviation: 'ADT-MD',
    fullName: 'Certified Peer Recovery Specialist',
    state: 'Maryland',
    issuingBodyId: 'mabpcb',
    tier: 'Supervised',
    regulatoryCitation: 'COMAR 10.09.80.16 (HealthChoice peer support billing); MABPCB Standards',
    prerequisites: [
      'Lived experience with SUD or mental health recovery (self-attestation)',
      'Minimum 1 year of stable recovery',
      'MABPCB application',
      'Completion of state-approved ADT training (46 hours minimum)',
      'Competency examination administered by MABPCB',
    ],
    trainingHoursRequired: 46,
    ceuRequiredPerCycle: 20,
    renewalCycleYears: 1,
    scope: 'Provides peer recovery support services within BHA-licensed programs. Shares lived experience to foster hope, motivation, and recovery engagement. May lead peer support groups, conduct recovery check-ins, and assist with care navigation. Cannot provide clinical counseling or psychotherapy. Must work under the supervision of a licensed clinician.',
    notes: 'ADT-MD is the Maryland-recognized peer credential for Medicaid billing under HealthChoice (COMAR 10.09.80.16). Peer support services billed under HCPCS code H0038 require ADT-MD documentation in the provider record. Distinct from the Delaware PRS/ADT — Maryland MABPCB credential is not automatically recognized in Delaware and vice versa.',
    qualifiesFor: ['Peer recovery support services (MD)', 'HealthChoice peer support billing (H0038)', 'Group peer support co-facilitation'],
  },
  {
    id: 'md_lpc',
    abbreviation: 'LCPC',
    fullName: 'Licensed Professional Counselor',
    state: 'Maryland',
    issuingBodyId: 'mbpct',
    tier: 'Licensed',
    regulatoryCitation: 'COMAR 10.58.01; Health Occupations Article §17-302',
    prerequisites: [
      'Master\'s degree in counseling or related field (minimum 60 graduate credit hours)',
      '3,000 post-master\'s supervised clinical hours over at least 2 years',
      'National Counselor Examination (NCE) or NCMHCE',
      'MBPCT application and background check',
    ],
    practiceHoursRequired: 3000,
    supervisionHoursRequired: 100,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Licensed independent mental health counseling, diagnosis using DSM-5, individual and group psychotherapy. May provide SUD counseling in conjunction with BHA credential (CAC-AD or higher). Cannot supervise pre-licensed counselors toward LCPC (requires LCPC for supervisory functions).',
    notes: 'Gateway license; advancement to LCPC requires an additional 3,000 post-LCPC supervised hours under LCPC supervision and the NCMHCE examination. LCPC + CAC-AD is the minimum combined credential for a primary SUD counselor role in an MD BHA-licensed program.',
    qualifiesFor: ['Independent mental health counseling', 'DSM-5 diagnosis', 'QBHP (with CAC-AD or higher)'],
  },
  {
    id: 'md_lcpc',
    abbreviation: 'LCPC',
    fullName: 'Licensed Clinical Professional Counselor',
    state: 'Maryland',
    issuingBodyId: 'mbpct',
    tier: 'Licensed',
    regulatoryCitation: 'COMAR 10.58.01; Health Occupations Article §17-302(c)',
    prerequisites: [
      'Active LCPC (Maryland)',
      '3,000 additional post-LCPC supervised clinical hours under LCPC supervision',
      'NCMHCE examination',
      'MBPCT application',
    ],
    practiceHoursRequired: 6000,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Full independent clinical practice; may diagnose and treat all DSM-5 mental health and SUD conditions. Authorized to supervise LCPC-Associates, LPCs, and clinicians working toward LCPC. Qualifies as Clinical Director, Clinical Supervisor, and QBHP in Maryland BHA-licensed SUD programs. When combined with CAC-AD, satisfies highest-level clinical leadership requirements under COMAR 10.47.03.05.',
    notes: 'Highest licensed counseling credential in Maryland. LCPC + CAC-AD (or CPC-AD) is the standard combined credential for Clinical Director and Clinical Supervisor in BHA-licensed residential programs. LCPC alone (without BHA credential) is insufficient for supervising SUD-specific clinical work with publicly-funded clients.',
    qualifiesFor: ['Independent clinical practice', 'Clinical Supervision of pre-licensed counselors', 'Program Director', 'QBHP (MD)', 'BAS designation eligibility'],
  },
  {
    id: 'md_lcsw_c',
    abbreviation: 'LCADC',
    fullName: 'Licensed Clinical Social Worker — Clinical',
    state: 'Maryland',
    issuingBodyId: 'mbswe',
    tier: 'Licensed',
    regulatoryCitation: 'COMAR 10.42.01; Health Occupations Article §19-301',
    prerequisites: [
      'MSW from CSWE-accredited program',
      '3,000 post-MSW supervised clinical hours (LGSW → LCADC)',
      'LCADC designation requires additional supervisor training',
      'MBSWE application',
    ],
    practiceHoursRequired: 3000,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Full independent clinical social work practice. LCADC designation authorizes supervision of LGSW and LCADC candidates. Qualifies as QBHP, Clinical Director, and Clinical Supervisor in Maryland BHA-licensed SUD programs when combined with CAC-AD or CPC-AD.',
    notes: 'LCADC + CAC-AD is equivalent to LCPC + CAC-AD for BHA supervisor/director roles. The "-C" suffix denotes the Clinical level with supervision authority in Maryland.',
    qualifiesFor: ['Independent clinical social work', 'Supervision of LGSW/LCADC', 'Clinical Director (with CAC-AD)', 'QBHP (MD)'],
  },
  {
    id: 'md_lmft',
    abbreviation: 'LCADC',
    fullName: 'Licensed Marriage and Family Therapist',
    state: 'Maryland',
    issuingBodyId: 'mbpct',
    tier: 'Licensed',
    regulatoryCitation: 'COMAR 10.58.01; Health Occupations Article §17-302',
    prerequisites: [
      "Master's or doctoral degree in MFT from COAMFTE-accredited program",
      '1,000 direct client hours, including 500 relational/systemic hours',
      'AMFTRB examination',
      'MBPCT application',
    ],
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Licensed family and couples therapy, systems-based individual therapy, co-occurring MH treatment within SUD programs. Must hold MD BHA credential (CSC-AD or higher) to provide SUD-specific counseling to publicly-funded Maryland clients.',
    notes: 'LCADC + CAC-AD provides dual competency in both MFT systems therapy and SUD counseling — a strong combination for residential co-occurring disorder programs. Cannot independently supervise toward SUD credentials without BAS designation.',
    qualifiesFor: ['Family and couples therapy', 'Co-occurring MH treatment', 'QBHP (with CAC-AD)'],
  },
];

// ─── Delaware SUD Credentialing Pathway (IC&RC / DSAMH) ──────────────────────
// Regulatory authority: Title 16 DSCR §6600–6699 (DSAMH); Title 24 Del. C. §3001 (DE DPR/BMHCDP)
// Delaware recognizes IC&RC (International Certification and Reciprocity Consortium) credentials

export const DE_CREDENTIAL_PATHWAY: CredentialDefinition[] = [
  {
    id: 'de_dsamh_reg',
    abbreviation: 'DSAMH-Reg',
    fullName: 'DSAMH Registered Counselor (Entry Level)',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Trainee',
    regulatoryCitation: 'DSAMH Provider Manual §4.1; Title 16 DSCR §6610',
    prerequisites: [
      'Application to DSAMH',
      'High school diploma or equivalent',
      'Clear background check',
      'Employment at a DSAMH-licensed facility',
      'Supervised by CAC-AD or CAC-AD holder (DSAMH-recognized)',
    ],
    ceuRequiredPerCycle: 0,
    renewalCycleYears: 1,
    scope: 'Entry-level direct SUD service under continuous supervision of a DSAMH-recognized supervisor. Functionally equivalent to Maryland ADT. Cannot provide independent counseling, sign clinical documents, or conduct formal assessments. All service delivery must occur under supervisor oversight.',
    notes: 'DSAMH registration is required before any direct SUD service delivery to DSAMH-funded clients. Registrant must actively pursue CAC-AD. DSAMH registration does not transfer to Maryland — staff moving between DE and MD facilities must obtain the appropriate MD BHA credential.',
    qualifiesFor: ['Direct SUD care under supervision (DE)'],
  },
  {
    id: 'de_cadc',
    abbreviation: 'CADC',
    fullName: 'Certified Alcohol and Drug Counselor',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Associate',
    regulatoryCitation: 'DSAMH Provider Manual §4.2; IC&RC CADC Candidate Guide',
    prerequisites: [
      'IC&RC application',
      '6,000 total supervised practice hours (documented in DSAMH system)',
      '270 hours of SUD-specific education',
      '300 hours of documented clinical supervision',
      'IC&RC written examination',
      'Ethics attestation',
    ],
    practiceHoursRequired: 6000,
    supervisionHoursRequired: 300,
    trainingHoursRequired: 270,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'Primary working SUD counselor credential recognized by Delaware DSAMH. May provide independent SUD counseling, conduct ASAM-based assessments, sign progress notes and treatment plans, and participate in treatment team. Recognized for Medicaid billing under Diamond State Health Plan.',
    notes: 'Delaware DSAMH recognizes IC&RC CADC as the baseline credential for independent SUD counselor practice. Entry-level staff must register with DSAMH while accumulating hours toward CADC. Note: Delaware uses the IC&RC "CADC" abbreviation; Maryland uses "CAC-AD" for a similar credential through its own ADAA board — they are NOT interchangeable without reciprocity application.',
    qualifiesFor: ['Independent SUD counseling (DE)', 'QBHP (DE)', 'Medicaid billing (Diamond State)'],
  },
  {
    id: 'de_caadc',
    abbreviation: 'CAC-AD',
    fullName: 'Certified Advanced Alcohol and Drug Counselor',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Professional',
    regulatoryCitation: 'DSAMH Provider Manual §4.3; IC&RC CAC-AD Candidate Guide',
    prerequisites: [
      'Active CADC credential',
      '10,000 total practice hours (4,000 additional post-CADC)',
      '500 total supervision hours',
      '480 hours of advanced SUD-specific education',
      'Advanced IC&RC written and oral examination',
    ],
    practiceHoursRequired: 10000,
    supervisionHoursRequired: 500,
    trainingHoursRequired: 480,
    ceuRequiredPerCycle: 60,
    renewalCycleYears: 2,
    scope: 'Advanced SUD counseling. Authorized to supervise DSAMH-registered counselors and CADC candidates in DSAMH-licensed programs. May serve as program Clinical Director. Eligible for DSAMH-recognized supervisor designation.',
    notes: 'IC&RC CAC-AD is recognized by Delaware DSAMH as the advanced credential qualifying for clinical supervisory roles. Holders may apply for DSAMH supervisor recognition without separate application if CAC-AD is current. Required CEUs: 60 per 2-year cycle, including 6 hours ethics.',
    qualifiesFor: ['Advanced SUD counseling (DE)', 'Clinical Supervision (DE)', 'Program Director eligibility (DE)'],
  },
  {
    id: 'de_ladc',
    abbreviation: 'LADC',
    fullName: 'Licensed Alcohol and Drug Counselor',
    state: 'Delaware',
    issuingBodyId: 'de_dpr',
    tier: 'Licensed',
    regulatoryCitation: 'Title 24 Del. C. §3001; DE DPR Board of Mental Health and Chemical Dependency Professionals',
    prerequisites: [
      'Active CADC (IC&RC)',
      "Bachelor's degree (minimum) in behavioral health, psychology, or related field",
      'Delaware Board of Mental Health & Chemical Dependency Professionals application',
      'State oral examination',
      'Background check',
    ],
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: 'State-licensed SUD counselor in Delaware. Independent practice. Licensed by Delaware DPR through the Board of Mental Health and Chemical Dependency Professionals. Provides a state-issued license number (distinct from IC&RC certification number).',
    notes: "Delaware's state-licensed SUD counselor credential, issued by DE DPR rather than DSAMH. LADC provides a license under Delaware professional regulation law, while CADC is an IC&RC certification. Many Delaware SUD counselors hold both CADC and LADC. LADC is not a Maryland credential — does not satisfy MD BHA requirements.",
    qualifiesFor: ['Independent SUD counseling (DE licensed)', 'Supervision', 'QBHP (DE)'],
  },
  {
    id: 'de_prs',
    abbreviation: 'PRS',
    fullName: 'Peer Recovery Specialist',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Supervised',
    regulatoryCitation: 'DSAMH Provider Manual §4.5; 16 DSCR §6640',
    prerequisites: [
      'Lived experience with SUD or mental health recovery (self-attestation)',
      'DSAMH PRS application',
      'Completion of 40-hour DSAMH-approved PRS training curriculum',
      'Background check',
      'Supervised practice hours under DSAMH-recognized clinician',
    ],
    trainingHoursRequired: 40,
    ceuRequiredPerCycle: 20,
    renewalCycleYears: 2,
    scope: 'Peer support services within DSAMH-licensed programs. Shares lived recovery experience to provide hope, mentorship, and recovery navigation. May co-facilitate peer support groups. Cannot provide clinical counseling, psychotherapy, or sign clinical documents.',
    notes: 'Delaware DSAMH-issued. Entry credential for individuals in recovery to enter the behavioral health workforce. Must work under clinical supervision. DSAMH PRS differs from Maryland MABPCB ADT-MD — Delaware PRS is not automatically recognized in Maryland.',
    qualifiesFor: ['Peer support services (DE)', 'Group co-facilitation (peer component)'],
  },
  {
    id: 'de_cprs',
    abbreviation: 'ADT',
    fullName: 'Certified Peer Recovery Specialist',
    state: 'Delaware',
    issuingBodyId: 'dsamh',
    tier: 'Professional',
    regulatoryCitation: 'DSAMH Provider Manual §4.6; Diamond State Health Plan Billing Guidelines',
    prerequisites: [
      'Active DSAMH PRS credential',
      'Additional supervised peer support hours (minimum 500 total)',
      'DSAMH ADT competency examination',
      'CEU completion',
    ],
    ceuRequiredPerCycle: 20,
    renewalCycleYears: 2,
    scope: 'Advanced peer support services. May lead peer support groups, mentor PRS staff, and provide individualized peer recovery coaching. ADT services are billable to Delaware Medicaid (Diamond State Health Plan) under HCPCS code H0038 when provided in DSAMH-licensed programs.',
    notes: "Delaware's advanced peer credential. ADT Medicaid billing requires current DSAMH ADT credential, a DSAMH-licensed facility, and documentation of supervision by a licensed clinician. Distinct from Maryland MABPCB ADT-MD credential.",
    qualifiesFor: ['Advanced peer support (DE)', 'Group peer leadership', 'PRS mentorship', 'Diamond State Medicaid billing (H0038)'],
  },
  {
    id: 'de_lpcmh',
    abbreviation: 'LPCMH',
    fullName: 'Licensed Professional Counselor of Mental Health',
    state: 'Delaware',
    issuingBodyId: 'de_dpr',
    tier: 'Licensed',
    regulatoryCitation: 'Title 24 Del. C. §3001; DE DPR Board of Mental Health and Chemical Dependency Professionals',
    prerequisites: [
      "Master's degree in counseling or related field (minimum 60 credits)",
      '3,000 post-master\'s supervised hours over at least 2 years',
      'National Counselor Examination (NCE) or NCMHCE',
      'Delaware DPR application and background check',
    ],
    practiceHoursRequired: 3000,
    ceuRequiredPerCycle: 40,
    renewalCycleYears: 2,
    scope: "Licensed independent mental health counseling in Delaware. May diagnose mental health conditions using DSM-5. Delaware's primary counseling license, equivalent to LCPC in Maryland. May supervise pre-licensed counselors when approved by DE DPR.",
    notes: 'LPCMH + CADC is the standard combined credential for a primary SUD counselor in a Delaware DSAMH-licensed program. LPCMH alone (without CADC) is insufficient for SUD-specific services to DSAMH-funded clients under Delaware standards.',
    qualifiesFor: ['Independent MH counseling (DE)', 'DSM-5 diagnosis', 'QBHP (DE)', 'Supervision (with DE DPR approval)'],
  },
];

// ─── Documentation Timelines ─────────────────────────────────────────────────
// Sources: COMAR 10.47.03 (MD Residential), COMAR 10.47.04 (MD PHP),
//          COMAR 10.47.05 (MD IOP/OP), DSAMH Provider Manual §5 (DE all LOCs)

export const DOCUMENTATION_TIMELINES: DocumentationTimeline[] = [
  {
    id: 'md_residential',
    levelOfCare: 'Residential',
    asamLevel: 'ASAM 3.1 / 3.5 / 3.7',
    state: 'Maryland',
    regulatoryCitation: 'COMAR 10.47.03.08',
    requirements: [
      { label: 'Preliminary individualized care plan',  timeline: 'Within 24 hours of admission',          regulatory: 'COMAR 10.47.03.08B(1)',  notes: 'Must identify immediate presenting needs, risk factors, and initial goals. Signed by admitting counselor.' },
      { label: 'Comprehensive individualized treatment plan', timeline: 'Within 5 working days of admission', regulatory: 'COMAR 10.47.03.08B(2)', notes: 'Full biopsychosocial assessment, measurable goals, level-of-care justification. Co-signed by Clinical Supervisor (BAS or higher).' },
      { label: 'Treatment plan review / update',        timeline: 'Every 30 days',                          regulatory: 'COMAR 10.47.03.08B(3)',  notes: 'Documented review of progress toward goals, updated objectives. Must reflect ASAM LOC reassessment.' },
      { label: 'Progress notes — individual sessions',  timeline: 'Same session day',                       regulatory: 'COMAR 10.47.03.08C',    notes: 'Required for each individual counseling session. SOAP or DAP format. Signed by provider.' },
      { label: 'Progress notes — group sessions',       timeline: 'Within 24 hours of group',              regulatory: 'COMAR 10.47.03.08C',    notes: 'Group note must identify attendance, topic, and individual participation observation.' },
      { label: 'ASAM LOC reassessment (clinical)',      timeline: 'Every 7 days',                          regulatory: 'COMAR 10.47.03; MD BHA Provider Manual', notes: 'Required to support continued authorization at residential LOC for HealthChoice MCO. Documents continued medical necessity.' },
      { label: 'Discharge summary',                     timeline: 'Within 3 working days of discharge',    regulatory: 'COMAR 10.47.03.08D',    notes: 'Must include discharge diagnosis, medications at discharge, aftercare plan, and referrals. Signed by Clinical Supervisor.' },
      { label: 'UA drug screen documentation',          timeline: 'Within 24 hours of collection',         regulatory: 'COMAR 10.47.03.08C',    notes: 'Results and clinical response documented in chart. Chain of custody for any forensic specimens.' },
    ],
  },
  {
    id: 'md_php',
    levelOfCare: 'Partial Hospitalization Program',
    asamLevel: 'ASAM 2.5',
    state: 'Maryland',
    regulatoryCitation: 'COMAR 10.47.04',
    requirements: [
      { label: 'Initial assessment',                    timeline: 'First day of service',                  regulatory: 'COMAR 10.47.04.06',     notes: 'ASAM-based biopsychosocial assessment. Must establish LOC appropriateness.' },
      { label: 'Individualized treatment plan',         timeline: 'Within 5 working days of first service', regulatory: 'COMAR 10.47.04.06B',    notes: 'Must be individualized with measurable goals. Co-signed by qualified clinical supervisor.' },
      { label: 'Treatment plan review',                 timeline: 'Every 30 days',                         regulatory: 'COMAR 10.47.04.06B',    notes: 'Review of progress; updated goals as needed; ASAM LOC reassessment documented.' },
      { label: 'Progress notes',                        timeline: 'Each service date',                     regulatory: 'COMAR 10.47.04.06C',    notes: 'Required for each group and individual session on the date of service.' },
      { label: 'ASAM LOC reassessment',                 timeline: 'Every 14 days',                         regulatory: 'COMAR 10.47.04; MD BHA Provider Manual', notes: 'For HealthChoice MCO continued authorization at PHP level.' },
      { label: 'Discharge / step-down note',            timeline: 'Within 3 working days of last service', regulatory: 'COMAR 10.47.04.06D',    notes: 'Documents reason for step-down, aftercare referrals, and final status.' },
    ],
  },
  {
    id: 'md_iop',
    levelOfCare: 'Intensive Outpatient Program',
    asamLevel: 'ASAM 2.1',
    state: 'Maryland',
    regulatoryCitation: 'COMAR 10.47.05',
    requirements: [
      { label: 'Initial assessment',                    timeline: 'Within first service week',             regulatory: 'COMAR 10.47.05.05',     notes: 'ASAM-based assessment establishing LOC appropriateness.' },
      { label: 'Individualized treatment plan',         timeline: 'Within 14 calendar days of first service', regulatory: 'COMAR 10.47.05.05B', notes: 'Individualized goals. Clinical supervisor co-signature required within 5 days of plan creation.' },
      { label: 'Treatment plan review',                 timeline: 'Every 60 days',                         regulatory: 'COMAR 10.47.05.05B',    notes: 'Documented review with updated objectives reflecting client progress.' },
      { label: 'Progress notes',                        timeline: 'Each service date',                     regulatory: 'COMAR 10.47.05.05C',    notes: 'Required for each session on the date of service.' },
      { label: 'ASAM LOC reassessment',                 timeline: 'Every 30 days',                         regulatory: 'COMAR 10.47.05; MD BHA Provider Manual', notes: 'For continued HealthChoice MCO authorization.' },
    ],
  },
  {
    id: 'de_residential',
    levelOfCare: 'Residential',
    asamLevel: 'ASAM 3.1 / 3.5 / 3.7',
    state: 'Delaware',
    regulatoryCitation: 'DSAMH Provider Manual §5.2; Title 16 DSCR §6620',
    requirements: [
      { label: 'Initial biopsychosocial assessment',    timeline: 'Within 24 hours of admission',          regulatory: 'DSAMH Provider Manual §5.2.1', notes: 'Conducted by CADC or licensed clinician. Documents presenting problem, history, and initial LOC justification.' },
      { label: 'Individualized service plan (ISP)',     timeline: 'Within 5 business days of admission',   regulatory: 'DSAMH Provider Manual §5.2.2; 16 DSCR §6620', notes: 'Must be individualized, goal-directed, and co-signed by client and clinical supervisor. Distinct from preliminary assessment.' },
      { label: 'ISP review / update',                  timeline: 'Every 30 days',                         regulatory: 'DSAMH Provider Manual §5.2.3', notes: 'Formal review with client participation; updates reflect progress and barriers.' },
      { label: 'Progress notes',                        timeline: 'Within 24 hours of each service event', regulatory: 'DSAMH Provider Manual §5.2.4', notes: 'Each individual and group session requires a note. Must document client presentation, content, and response.' },
      { label: 'WITS encounter data submission',        timeline: 'Within 48 hours of service',            regulatory: 'DSAMH Provider Manual §9', notes: 'All service encounters must be entered into WITS (Web Infrastructure for Treatment Services) for DSAMH reporting.' },
      { label: 'Discharge summary',                     timeline: 'Within 5 business days of discharge',   regulatory: 'DSAMH Provider Manual §5.2.5', notes: 'Documents discharge status, plan, referrals, and medications. Client copy provided.' },
    ],
  },
  {
    id: 'de_iop',
    levelOfCare: 'IOP / Outpatient',
    asamLevel: 'ASAM 2.1 / 1.0',
    state: 'Delaware',
    regulatoryCitation: 'DSAMH Provider Manual §5.3',
    requirements: [
      { label: 'Initial assessment',                    timeline: 'First service date',                    regulatory: 'DSAMH Provider Manual §5.3.1' },
      { label: 'Individualized service plan',           timeline: 'Within 5 business days of first service', regulatory: 'DSAMH Provider Manual §5.3.2' },
      { label: 'ISP review',                            timeline: 'Every 60 days',                         regulatory: 'DSAMH Provider Manual §5.3.3' },
      { label: 'Progress notes',                        timeline: 'Within 24 hours of each contact',       regulatory: 'DSAMH Provider Manual §5.3.4' },
      { label: 'WITS encounter data',                   timeline: 'Within 48 hours of service',            regulatory: 'DSAMH Provider Manual §9' },
    ],
  },
];

// ─── Staffing Ratios ──────────────────────────────────────────────────────────
// Maryland: COMAR 10.47.03 (Residential), 10.47.04 (PHP), 10.47.05 (IOP/OP)
// Delaware: DSAMH Provider Manual §6 (Staffing Standards)

export const STAFFING_RATIOS: StaffingRatioRequirement[] = [
  {
    id: 'md_residential_staffing',
    levelOfCare: 'Residential',
    asamLevel: 'ASAM 3.1 / 3.5 / 3.7',
    state: 'Maryland',
    regulatoryCitation: 'COMAR 10.47.03.05',
    ratios: [
      { role: 'Program Director',          ratio: '1 FTE — LCPC/LCADC + CPC-AD or equivalent',            notes: 'Must hold both a Maryland clinical license and an MD BHA advanced SUD credential (COMAR 10.47.03.05A).' },
      { role: 'Primary SUD Counselor',     ratio: '1 FTE per 8 residential clients',                       notes: 'Each counselor may carry max 8 active residential clients. Must hold CAC-AD or higher (COMAR 10.47.03.05B).' },
      { role: 'Board Approved Supervisor', ratio: 'At least 1 BAS on-site during all operating hours',      notes: 'Required whenever ADT or CSC-AD staff are providing direct services (COMAR 10.47.01.22E).' },
      { role: 'Medical Director',           ratio: 'Minimum 4 hours per week on-site; on-call 24/7',        notes: 'Physician (MD/DO) required. Must hold MBP license and DEA registration (COMAR 10.47.03.05C).' },
      { role: 'Registered Nurse (RN)',      ratio: 'On-site during all program hours; on-call overnight',   notes: 'RN must be present during medication administration hours. Overnight: RN on-call minimum; LPN on-site acceptable per COMAR 10.47.03.05D.' },
      { role: 'Behavioral Health Technician (BHT)', ratio: 'Awake supervision 24/7; at least 1 BHT per 8 clients overnight', notes: 'BHT must hold ADT registration or equivalent training. 24/7 awake supervision required in residential (COMAR 10.47.03.05E).' },
      { role: 'Case Manager / Aftercare Planner', ratio: '1 FTE per 20 clients recommended',              notes: 'Discharge planning coordination required; not separately ratio-mandated in COMAR but CARF standard.' },
    ],
  },
  {
    id: 'md_php_staffing',
    levelOfCare: 'Partial Hospitalization Program',
    asamLevel: 'ASAM 2.5',
    state: 'Maryland',
    regulatoryCitation: 'COMAR 10.47.04.04',
    ratios: [
      { role: 'Clinical Director',         ratio: '1 FTE — LCPC/LCADC + CAC-AD',                         notes: 'Must oversee clinical operations. On-site during PHP hours.' },
      { role: 'Primary SUD Counselor',     ratio: '1 FTE per 10 PHP clients',                              notes: 'CAC-AD or higher required for group facilitation. Minimum 3 hours individual counseling per week per client per COMAR 10.47.04.' },
      { role: 'Medical oversight',          ratio: 'Physician available by phone; on-site ≥ 2 hrs/week',   notes: 'Higher availability required for medically complex PHP (e.g., PHP with MAT management).' },
      { role: 'Nursing',                   ratio: 'RN available during program hours (on-site or on-call)', notes: 'Required for medication observation and health monitoring. LPN acceptable under RN delegation.' },
    ],
  },
  {
    id: 'md_iop_staffing',
    levelOfCare: 'Intensive Outpatient / Outpatient',
    asamLevel: 'ASAM 2.1 / 1.0',
    state: 'Maryland',
    regulatoryCitation: 'COMAR 10.47.05.04',
    ratios: [
      { role: 'Clinical Supervisor',       ratio: '1 supervisor per 5 counselors (ADT/CSC-AD)',             notes: 'BAS required if ADT/CSC-AD staff are employed.' },
      { role: 'Primary SUD Counselor',     ratio: '1 FTE per 15 IOP clients',                              notes: 'CAC-AD or higher for individual counseling with publicly-funded clients.' },
      { role: 'Medical oversight',          ratio: 'Physician available by referral or on-call',            notes: 'On-site physician not required for non-MAT IOP. Required if MAT is delivered on-site.' },
    ],
  },
  {
    id: 'de_residential_staffing',
    levelOfCare: 'Residential',
    asamLevel: 'ASAM 3.1 / 3.5 / 3.7',
    state: 'Delaware',
    regulatoryCitation: 'DSAMH Provider Manual §6.2; Title 16 DSCR §6630',
    ratios: [
      { role: 'Program Director',          ratio: '1 FTE — CAC-AD or LPCMH/LCADC + CADC minimum',            notes: 'DSAMH requires clinical director to hold DSAMH-recognized advanced credential.' },
      { role: 'Primary SUD Counselor',     ratio: '1 FTE per 8 residential clients',                       notes: 'CADC or higher required. DSAMH-registered entry counselors must be supervised and do not count toward ratio independently.' },
      { role: 'Supervisor',                ratio: '1 CAC-AD or DSAMH-recognized supervisor on-site',         notes: 'Required when DSAMH-registered (entry-level) counselors are providing services.' },
      { role: 'Medical oversight',          ratio: 'Physician on-call 24/7; on-site minimum 4 hrs/week',   notes: 'Delaware medical license (DO/MD) required. DEA registration required for MAT.' },
      { role: 'Nursing',                   ratio: 'RN on-site during operating hours',                     notes: 'DE BON licensure required. 24/7 awake staff required for residential.' },
      { role: 'BHT / Direct Care',         ratio: 'Awake supervision 24/7',                               notes: 'DSAMH registration and training required per DSAMH Provider Manual §6.2.' },
    ],
  },
];

// ─── Medicaid Programs ─────────────────────────────────────────────────────────

export const MEDICAID_PROGRAMS: MedicaidProgram[] = [
  {
    id: 'md_healthchoice',
    state: 'Maryland',
    programName: 'Maryland Medical Assistance — HealthChoice',
    adminAgency: 'Maryland Department of Health (MDH) — Office of Health Services',
    deliveryModel: 'Mandatory Managed Care — HealthChoice MCOs; behavioral health carved out to Optum Maryland for most MCOs',
    mcos: [
      { name: 'CareFirst BlueCross BlueShield', abbreviation: 'CareFirst', phone: '1-800-730-8530', portalUrl: 'https://provider.carefirst.com' },
      { name: 'Optum Maryland (UHC)', abbreviation: 'Optum MD', phone: '1-800-888-1998', portalUrl: 'https://provider.optum.com', notes: 'Administers behavioral health carve-out for multiple HealthChoice MCOs under COMAR 10.09.80' },
      { name: 'UnitedHealthcare Community Plan', abbreviation: 'UHC', phone: '1-800-791-9233' },
      { name: 'Jai Medical Systems', abbreviation: 'Jai Medical', phone: '1-888-524-1999', notes: 'Serves Baltimore City and select counties' },
      { name: 'Priority Partners (Johns Hopkins)', abbreviation: 'Priority Partners', phone: '1-800-654-9728' },
      { name: 'Maryland Physicians Care', abbreviation: 'MPC', phone: '1-800-953-8854' },
    ],
    relevantServices: ['Residential SUD (ASAM 3.1/3.5/3.7)', 'PHP (ASAM 2.5)', 'IOP (ASAM 2.1)', 'OP (ASAM 1.0)', 'MAT (buprenorphine/naltrexone/methadone)', 'Peer Recovery Support Services (ADT-MD)'],
    priorAuthRequired: true,
    billableCredentials: ['LCPC', 'LCPC (supervised)', 'LCADC', 'CAC-AD', 'CPC-AD', 'MD/DO', 'CRNP', 'RN', 'ADT-MD (peer services, H0038)'],
    notes: 'Maryland HealthChoice (COMAR 10.09.80) requires prior authorization for all SUD LOCs. ASAM LOCA criteria mandatory for LOC determination and continued authorization. Billing NPI must be enrolled with each MCO. Annual provider credentialing required. SMART outcome data submitted through MD BHA gateway. SBIRT must be offered per COMAR 10.63.09 for Medicaid-funded SUD programs.',
  },
  {
    id: 'de_diamondstate',
    state: 'Delaware',
    programName: 'Delaware Medicaid — Diamond State Health Plan',
    adminAgency: 'Delaware Division of Medicaid and Medical Assistance (DMMA)',
    deliveryModel: 'Mandatory Managed Care — Diamond State Health Plan (DSHP)',
    mcos: [
      { name: 'Highmark Health Options (Diamond State)', abbreviation: 'Highmark DSHP', phone: '1-855-550-1997', portalUrl: 'https://www.highmarkhealthoptions.com', notes: 'Primary MCO for Diamond State Health Plan' },
      { name: 'AmeriHealth Caritas Delaware', abbreviation: 'AmeriHealth', phone: '1-855-355-3423', notes: 'DSHP Plus (long-term services and supports)' },
    ],
    relevantServices: ['Residential SUD', 'PHP', 'IOP', 'OP', 'MAT', 'Peer Support Services (ADT — H0038)'],
    priorAuthRequired: true,
    billableCredentials: ['LPCMH', 'LCADC', 'CADC', 'CAC-AD', 'LADC', 'MD/DO', 'RN', 'ADT (peer services, H0038)'],
    notes: 'Delaware Medicaid requires DSAMH facility license and DMMA provider enrollment. DSAMH WITS encounter reporting required for all DSAMH-funded services as condition of reimbursement. ADT peer services billable under H0038 with current DSAMH ADT credential and clinical supervision documentation. SBIRT required per DSAMH standards for all enrolled SUD programs.',
  },
];

// ─── Accreditation Standards ──────────────────────────────────────────────────

export const ACCREDITATION_STANDARDS: AccreditationStandard[] = [
  {
    id: 'carf_sud',
    body: 'CARF',
    program: 'Substance Use Disorder Treatment',
    abbreviation: 'CARF SUD',
    description: 'CARF accreditation for SUD residential, PHP, IOP, and OP programs. Standards complement and are interpreted alongside COMAR 10.47 (MD) and DSAMH regulations (DE). CARF accreditation findings must be disclosed to MD BHA and DSAMH as part of facility license compliance.',
    staffingRequirements: [
      'Medical Director: Physician with addiction medicine training (MD/DO; FASAM or ABAM preferred); must hold state license and DEA registration',
      'Clinical Director: Licensed behavioral health professional — in MD: LCPC or LCADC + CAC-AD/CPC-AD per COMAR 10.47.03.05; in DE: CAC-AD or LPCMH + CADC per DSAMH standards',
      'Primary SUD Counselors: State-recognized SUD credential required — CAC-AD (MD) or CADC (DE) — or supervised trainee (ADT/CSC-AD in MD; DSAMH-Reg in DE) with BAS/supervisor on-site',
      'Nursing: RN required for detox and residential medical monitoring (COMAR 10.47.03.05D for MD; DSAMH §6.2 for DE)',
      'BHT: CARF Qualified Direct Service Provider standards; ADT registration (MD) or DSAMH registration (DE) required for direct SUD service delivery',
      'All staff: Background checks, documented competency verification, and annual performance reviews per CARF 1.L standards',
    ],
    supervisoryRequirements: [
      'Clinical supervision documented for all pre-licensed and trainee staff (ADT, CSC-AD, DSAMH-Reg, LCPC-A)',
      'BAS on staff per COMAR 10.47.01.22E (MD) for any ADT/CSC-AD supervision; DSAMH-recognized supervisor per DSAMH Manual §6 (DE)',
      'Supervision frequency: minimum 1 hour/week individual or 2 hours/month group per CARF standards; MD BHA logs must document actual hours',
      'Supervisory agreements documented in personnel files and available for BHA/DSAMH audit',
      'Co-signature requirements per licensure board rules reflected in clinical documentation policy',
    ],
    qualityRequirements: [
      'Annual quality improvement plan with measurable outcomes aligned with SAMHSA NOMS indicators',
      'Standardized outcome measures at intake and discharge: AUDIT-C, DAST-10, PHQ-9, ASI or GAIN-SS; SBIRT protocol per COMAR 10.63.09 (MD) and DSAMH Manual §7 (DE)',
      'Consumer satisfaction surveys at discharge and 30-day follow-up',
      'Incident reporting system with root cause analysis for adverse events; reportable incidents submitted to MD BHA or DSAMH within required timeframes',
      'Annual program evaluation comparing outcomes to state and national benchmarks',
      'Continuous readiness for CARF triennial survey; survey findings reported to MD BHA and DSAMH',
    ],
    surveyFrequency: 'Triennial (every 3 years) with annual conformance reports',
    website: 'https://www.carf.org/standards/behavioral-health/sud',
  },
  {
    id: 'tjc_bhca',
    body: 'The Joint Commission',
    program: 'Behavioral Health Care and Human Services',
    abbreviation: 'TJC BHCA',
    description: 'TJC accreditation for behavioral health and SUD programs. Rigorous standards for patient rights, medication management, clinical leadership, and environment of care. TJC NPSG (National Patient Safety Goals) include PDMP integration and naloxone co-prescribing — both required under Maryland and Delaware law.',
    staffingRequirements: [
      'Medical Director: Physician licensed in state of practice; addiction specialty preferred (FASAM, ABAM)',
      'QBHP (Qualified Behavioral Health Professional): Licensed clinician (LCPC, LCADC, LCADC, MD) for clinical oversight; must hold BHA/DSAMH credential for SUD supervision',
      'All clinical staff: State-required licenses and SUD credentials verified, on file, and monitored for renewal',
      'Staffing ratios documented and maintained per COMAR 10.47 (MD) or DSAMH standards (DE)',
      'CPR, de-escalation, and medication administration training current for all applicable staff',
    ],
    supervisoryRequirements: [
      'Governing body oversight of medical staff credentialing and privilege delineation',
      'Peer review process for clinical documentation quality',
      'Medical staff bylaws governing credentialing, privileges, and corrective action',
      'Performance evaluations: at hire, 90 days, and annually thereafter',
    ],
    qualityRequirements: [
      'Patient safety plan and incident reporting system integrated with MD BHA / DSAMH reportable incident requirements',
      'Medication management per TJC NPSG 03: accurate medication reconciliation, PDMP query documentation, and naloxone co-prescribing protocol',
      'Restraint/seclusion policy: must comply with both TJC standards and COMAR 10.21.19 (MD) or DSAMH Policy (DE)',
      'Environment of care safety inspections quarterly',
      'Root cause analysis for sentinel events (TJC) with parallel reporting to MD BHA Critical Incident System (MD) or DSAMH Incident Report System (DE)',
      'Board-level quality committee review with documented minutes',
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

export function getDocumentationTimelinesByState(state: ComplianceState): DocumentationTimeline[] {
  return DOCUMENTATION_TIMELINES.filter(t => t.state === state);
}

export function getStaffingRatiosByState(state: ComplianceState): StaffingRatioRequirement[] {
  return STAFFING_RATIOS.filter(r => r.state === state);
}

// ─── State Role Requirements (minimum credentials by role) ────────────────────
// Maryland: COMAR 10.47.01.22 (credentials), COMAR 10.47.03.05 (residential staffing)
// Delaware: DSAMH Provider Manual §4, §6

export const STATE_ROLE_REQUIREMENTS: Record<string, Record<string, string>> = {
  Maryland: {
    'Clinical Director / Program Director':
      'LCPC or LCADC (Maryland MBPCT/MBSWE) + CAC-AD or CPC-AD (MD BHA) + Board Approved Supervisor (BAS) designation — per COMAR 10.47.03.05A',
    'Primary SUD Counselor':
      'CAC-AD (MD BHA/ADAA) for independent practice; CSC-AD under BAS supervision acceptable — per COMAR 10.47.01.22C. Must hold LCPC or higher if providing dual-diagnosis MH counseling.',
    'SUD Counselor Trainee':
      'ADT registration (MD BHA) required before any direct SUD service to publicly-funded clients; BAS designated and on-site — per COMAR 10.47.01.22A',
    'MH Therapist (SUD program)':
      'LCADC, LCPC, or LCADC (MBPCT or MBSWE) + CAC-AD or CSC-AD recommended for SUD-specific counseling with MD-funded clients — per COMAR 10.47.01',
    'Prescriber':
      'MD or DO (Maryland Board of Physicians); DEA registration (CII–CV); MATE Act training for buprenorphine (completed at next renewal)',
    'Nurse':
      'RN (Maryland Board of Nursing / MBON) — COMAR 10.27; residential programs require RN on-site during all operating hours per COMAR 10.47.03.05D',
    'BHT / Entry Direct Care':
      'ADT registration (MD BHA) required before direct SUD service delivery; must be supervised by BAS — per COMAR 10.47.01.22A(2)',
    'Peer Recovery Specialist':
      'ADT-MD (Maryland Addiction and Behavioral Health Professional Certification Board / MABPCB) — required for Maryland Medicaid (HealthChoice) peer support billing under COMAR 10.09.80.16 (HCPCS H0038)',
  },
  Delaware: {
    'Clinical Director / Program Director':
      'CAC-AD (IC&RC) or LPCMH/LCADC + CADC — DSAMH-recognized supervisor; per DSAMH Provider Manual §6.2 and Title 16 DSCR §6630',
    'Primary SUD Counselor':
      'CADC (IC&RC) — DSAMH recognized; entry-level staff must register with DSAMH before direct SUD service — per DSAMH Provider Manual §4.2 and 16 DSCR §6610',
    'SUD Counselor Trainee':
      'DSAMH registration required before any direct SUD service delivery; supervised by CAC-AD or CADC holder — per DSAMH Provider Manual §4.1',
    'MH Therapist (SUD program)':
      'LPCMH or LCADC — Delaware DPR (Board of Mental Health & Chemical Dependency Professionals); CADC recommended for SUD-specific services',
    'Prescriber':
      'MD or DO — Delaware Board of Medical Licensure (Title 24 Del. C. §1700); DEA registration; MATE Act training',
    'Nurse':
      'RN (Delaware Board of Nursing); residential programs require RN on-site per DSAMH Provider Manual §6.2',
    'BHT / Entry Direct Care':
      'DSAMH registration required before direct SUD service; working under supervision toward CADC — per DSAMH Provider Manual §4.1',
    'Peer Recovery Specialist':
      'PRS (Delaware DSAMH) required; ADT (Delaware DSAMH) for Diamond State Medicaid peer support billing (H0038) — per DSAMH Provider Manual §4.5–4.6',
  },
};
