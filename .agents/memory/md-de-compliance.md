---
name: MD/DE credential compliance
description: Facilities are Rockville MD and Wilmington DE. All TN credentials replaced with Maryland BHA/ADAA and Delaware DSAMH/IC&RC pathways throughout the codebase.
---

## Facilities
- **Maryland**: Sunrise Recovery Center — 1300 Piccard Drive, Rockville, MD 20850. License: MD-BHA-SUD-2019-04821. (301) 882-4400.
- **Delaware**: Sunrise Recovery Center — Wilmington, DE. DSAMH-licensed.
- **HQ**: Rockville, MD. Executive, HR, IT, Finance, Billing.

## Maryland SUD Credential Pathway (MD BHA / ADAA, COMAR 10.63)
ADT → CSC-AD → CAC-AD → CPC-AD. Supervisor requires BAS (Board Approved Supervisor) designation.
- Must hold CAC-AD or CPC-AD to hold BAS.
- Licensing board for counselors: MBPCT (Maryland Board of Professional Counselors and Therapists).
- Key licenses: LPC, LCPC, LMFT. Nursing: MBON (Maryland Board of Nursing). Physicians: MBP (Maryland Board of Physicians).
- Medicaid: Maryland Medical Assistance — HealthChoice MCOs (CareFirst, Optum, UHC, Jai Medical, Priority Partners, MPC).
- HIE: CRISP (Chesapeake Regional Information System for our Patients).
- PDMP: Maryland PDMP via MDH.
- State reporting: MD BHA / BHAIS.

## Delaware SUD Credential Pathway (IC&RC / DSAMH)
DSAMH registration (ADT-equivalent) → CADC (IC&RC) → CAADC → LADC (DE DPR). Peer: PRS → CPRS.
- Licensing board for counselors: Delaware DPR (Board of Mental Health & Chemical Dependency Professionals). Key license: LPCMH.
- Medicaid: Diamond State Health Plan (Highmark).
- HIE: DHIN (Delaware Health Information Network).
- PDMP: DE PMP via PMPInterConnect.
- State reporting: DSAMH WITS.

## Staff Assignments (staff IDs)
| ID | Name | Credentials | Facility |
|----|------|-------------|----------|
| s8 | James Carter | LCPC, CAC-AD, BAS | Rockville MD |
| s1 | Sarah Jenkins | LPC, CAC-AD | Rockville MD |
| s2 | David Odom | LMFT | Rockville MD |
| s5 | Emily Stone | MD, FASAM, ABAM | Rockville MD |
| s4 | Robert Chen | MD | Rockville MD |
| s6 | Jessica Torres | RN, CARN | Rockville MD |
| s7 | Michael Boyd | ADT (DSAMH) | Wilmington DE |
| s10 | Kevin Wright | CADC, PRS | Wilmington DE |
| s9 | Amanda Lewis | — | Wilmington DE |
| s14 | Carlos Rivera | CADC, CPRS | Wilmington DE |
| s12 | Linda Vance | CPC | HQ Rockville |
| s3 | Maria Gonzales | CPA | HQ Rockville |
| s16 | Jordan Pierce | CADC | HQ Rockville |
| s11 | Allen Hughes | MD, FASAM | HQ Rockville |
| s13 | Tracy Williams | SHRM-CP | HQ Rockville |
| s15 | Alex Kim | CISSP | HQ Rockville |

## New file
`src/data/mockCompliance.ts` — comprehensive regulatory reference: RegulatoryBody[], CredentialDefinition[], MedicaidProgram[], AccreditationStandard[], STATE_ROLE_REQUIREMENTS. Available to import into any page.

## Key notes
- ClinicalSupervision.tsx: SuperviseeRole type now uses 'LPC-A (MD)', 'CSC-AD (MD)', 'ADT (DE)', 'CADC (DE)', 'BHT'. SV-002 is Michael Boyd (ADT/DE) supervised by Kevin Wright (CADC, BAS).
- BAS (Board Approved Supervisor) is facility-critical in MD: without one, ADT/CSC-AD staff cannot provide SUD services.
- Accreditation: CARF (triennial) and TJC BHCA (triennial) — both MD and DE facilities.
- MATE Act (Dec 2022): X-waiver eliminated; buprenorphine prescribing requires only standard DEA registration.
