# Sunrise OS — Open Questions
## Items That Cannot Be Confirmed From the Codebase or Application

**Audit Date:** 2026-08-01

These items require external input, vendor confirmation, legal review, or production environment access that is not available through code inspection or demo usage.

---

## Infrastructure & Hosting

1. **What hosting environment is targeted for production?** (Replit Deployments, AWS, Azure, GCP, on-premise?) The Vite config uses `PORT` and `BASE_PATH` env vars but no cloud-specific config is present.
2. **Is there a production environment separate from the development/demo environment?** No `.env.production` or environment separation evidence found.
3. **What is the disaster recovery plan?** No backup, restore, or DR documentation exists in the codebase.
4. **Are there uptime SLAs defined?** No monitoring configuration found.
5. **Is there a CDN for static asset delivery?** No CDN config found; the 4.8 MB bundle will be slow without one.
6. **Is the application deployed with HTTPS enforced?** No TLS/HTTPS enforcement config found in the codebase.

---

## Database & Persistence

7. **What database is planned for production?** The codebase has no ORM, migration files, or database schema. The api-server artifact has a separate Replit DB connection but Sunrise OS does not consume it.
8. **Has a data migration plan been developed to move from mock data to real patients?** No migration tooling found.
9. **Will patient data be stored in a Replit-hosted database or a dedicated HIPAA-eligible cloud database?** Replit's database offerings and their HIPAA status need confirmation.
10. **Is there a Business Associate Agreement (BAA) with the hosting provider?** Not determinable from code.

---

## Security & Compliance

11. **Has a formal HIPAA Risk Analysis been performed?** No documentation found.
12. **Is there a signed BAA with any technology vendor (hosting, database, email, SMS)?** Not determinable from code.
13. **Has a penetration test been performed?** No evidence found.
14. **Are there HIPAA Privacy and Security policies in place?** No documentation found in the repo.
15. **Has a 42 CFR Part 2 legal review been performed on the consent workflow?** The UI implements 42 CFR references but no legal sign-off is present.
16. **Is there a CARF or Joint Commission accreditation for the target facilities?** The compliance module supports both but facility accreditation status is unknown.
17. **Are there state-specific licensing requirements for the operating states?** The app is Maryland-specific per code comments but no license filings are referenced.
18. **Is there a data retention and deletion policy?** No technical implementation or documentation found.
19. **Is there a breach notification procedure?** No documentation found.
20. **Has vulnerability scanning been configured for dependencies?** `pnpm audit` is not in CI; no dependency scanning config found.

---

## External Integrations

21. **Which clearinghouse vendor is planned?** (Change Healthcare, Availity, Waystar?) No selection or contracts evident.
22. **Which eligibility/VOB vendor is planned?** (Availity, Waystar, Experian Health?) No selection evident.
23. **Which e-prescribing network is planned?** (Surescripts, DrFirst?) No selection evident.
24. **Which pharmacy integration is planned?** No selection evident.
25. **Which laboratory integration is planned?** (Quest, LabCorp, in-house?) No selection evident.
26. **Is there a contract with a drug-testing laboratory?** No evidence.
27. **Which telehealth platform is planned?** (Doxy.me, Zoom for Healthcare, Teams?) TelehealthConsults page is a placeholder.
28. **Which payment processor is planned for patient payments?** (Stripe, Square, instaMed?) No selection evident.
29. **Is there an SMS/messaging vendor for appointment reminders?** (Twilio, Bandwidth?) No selection evident.
30. **Is there an email vendor for clinical communications?** (SendGrid, SES?) No selection evident.
31. **Which identity provider is planned for SSO?** (Azure AD, Okta, Google Workspace?) No selection evident.
32. **Is PDMP (Prescription Drug Monitoring Program) integration required?** Not implemented; state laws vary.
33. **Are real payer contracts in place for direct payer integration?** No selection evident.

---

## Clinical & Regulatory

34. **Which evidence-based practices does the AI documentation assist claim to support?** The rule engine is locally authored — no clinical review or literature citations found.
35. **Has the AI Clinical Documentation Review pipeline been reviewed by a licensed clinician?** No clinical sign-off in documentation.
36. **Is the Recovery Engagement Score validated by a clinical or psychometric expert?** No validation evidence found.
37. **Which standardized instruments does the Measurement-Based Care module use?** (PHQ-9, GAD-7, AUDIT, DAST?) UI exists but instrument license requirements are unknown.
38. **Are there clinician license verification procedures planned?** CertificationTracker UI exists but no real verification API integration.
39. **What is the plan for clinical training and onboarding of staff?** Training page exists but no real LMS integration.

---

## Commercial & Go-To-Market

40. **What is the pricing model?** (Per-seat, per-facility, per-bed?) Not determinable.
41. **What is the implementation process?** No implementation guide found.
42. **What customer support structure is planned?** HelpSupport page exists but support infrastructure is unknown.
43. **Are there real customer pilots or beta facilities planned?** Not determinable.
44. **What is the contract structure for multi-facility organizations?** Multi-org architecture is not implemented.
45. **Is there a customer success or account management function?** Not determinable.

---

## AI Governance

46. **Has the AI clinical documentation engine been reviewed by a clinical AI ethics or safety committee?** No evidence found.
47. **Is there a model monitoring or drift detection plan?** No evidence found.
48. **What is the process for updating clinical rules if a safety issue is identified?** Deployment and hotfix process not documented.
49. **Is there a human-review requirement policy documented for AI output?** Code enforces explicit clinician acceptance but no formal policy document exists.
50. **Are there plans for external model use (GPT-4, Claude, etc.) in future versions?** Not specified; would require significant governance review before clinical deployment.
