import React, { useState } from 'react';
import { FadeIn } from '@/components/ui/fade-in';
import { CheckCircle2, AlertCircle, Printer, Mail, ChevronDown, ChevronUp } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-primary/20">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold font-serif">
        {number}
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-wide uppercase text-sm">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldRow({ label, sublabel, children, required }: { label: string; sublabel?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-foreground mb-1">
        {label}{required && <span className="text-primary ml-1">*</span>}
        {sublabel && <span className="font-normal text-muted-foreground ml-2 text-xs">({sublabel})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-border rounded-sm px-3 py-2 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50";
const textareaCls = `${inputCls} resize-none`;

function TextInput({ placeholder, name }: { placeholder?: string; name?: string }) {
  return <input type="text" name={name} placeholder={placeholder} className={inputCls} />;
}
function DateInput({ name }: { name?: string }) {
  return <input type="date" name={name} className={inputCls} />;
}
function PhoneInput({ name }: { name?: string }) {
  return <input type="tel" name={name} placeholder="(___) ___-____" className={inputCls} />;
}
function EmailInput({ name }: { name?: string }) {
  return <input type="email" name={name} placeholder="email@example.com" className={inputCls} />;
}
function Textarea({ rows = 3, placeholder, name }: { rows?: number; placeholder?: string; name?: string }) {
  return <textarea name={name} rows={rows} placeholder={placeholder} className={textareaCls} />;
}
function Select({ options, name }: { options: string[]; name?: string }) {
  return (
    <select name={name} className={inputCls}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function DocCheckbox({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group mb-3">
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30 flex-shrink-0" />
      <div>
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
    </label>
  );
}

function ConsentCheckbox({ label }: { label: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group mb-3">
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30 flex-shrink-0" />
      <span className="text-sm text-foreground group-hover:text-primary/80 transition-colors leading-relaxed">{label}</span>
    </label>
  );
}

function NoteBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' }) {
  const styles = variant === 'warning'
    ? 'bg-amber-50 border-amber-300 text-amber-800'
    : 'bg-teal-50 border-teal-300 text-teal-800';
  const Icon = variant === 'warning' ? AlertCircle : CheckCircle2;
  return (
    <div className={`flex items-start gap-3 border rounded-md p-4 mb-6 text-sm ${styles}`}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false);

  const handlePrint = () => window.print();

  return (
    <div className="w-full bg-gray-50 min-h-screen print:bg-white">

      {/* Page Header — visible on screen only */}
      <div className="bg-foreground text-white py-14 text-center print:hidden">
        <FadeIn>
          <img
            src={`${BASE}/logos/foundation-logo-transparent.png`}
            alt="The Sunrise Foundation"
            className="h-20 w-auto mx-auto mb-6 opacity-90"
          />
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Grant Application</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light">
            Financial assistance for individuals in early recovery. Reviewed individually. Disbursed directly to providers.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/30 text-white text-sm font-medium rounded-sm hover:bg-white/10 transition-colors"
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
            <a
              href="mailto:grants@sunrisefoundation.health?subject=Grant Application Submission"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
            >
              <Mail size={16} /> Submit by Email
            </a>
          </div>
        </FadeIn>
      </div>

      {/* Application Document */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 print:py-0 print:px-0 print:max-w-none">
        <div className="bg-white rounded-xl shadow-sm border border-border print:shadow-none print:border-none print:rounded-none">

          {/* Document Header */}
          <div className="p-8 border-b border-border print:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <img
                src={`${BASE}/logos/foundation-logo-light.png`}
                alt="The Sunrise Foundation"
                className="h-20 w-auto"
              />
              <div className="sm:text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Financial Assistance Application</p>
                <p className="text-xs text-muted-foreground">Recovery Access · Housing · Workforce</p>
                <p className="text-xs text-muted-foreground mt-2">grants@sunrisefoundation.health</p>
                <div className="mt-3 flex sm:justify-end gap-4">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Application #:</span>{' '}
                    <span className="border-b border-dashed border-muted-foreground/50 inline-block w-24">&nbsp;</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Date:</span>{' '}
                    <span className="border-b border-dashed border-muted-foreground/50 inline-block w-24">&nbsp;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preamble */}
          <div className="px-8 pt-8 pb-2 print:px-6">
            <NoteBox variant="info">
              <strong>Our Commitment:</strong> We believe in people. We also believe in accountability. Every application is reviewed individually by our grants committee. Funds are disbursed directly to treatment providers, landlords, or educational institutions — never in cash to applicants. Your support network will be contacted for verification. Providing false information will disqualify your application and may result in reporting to relevant parties.
            </NoteBox>
            <NoteBox variant="warning">
              <strong>Required before submission:</strong> You must attach supporting documentation for each section that requests it. Incomplete applications will not be reviewed. See Section 6 for the full documentation checklist.
            </NoteBox>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); setSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="px-8 pb-8 print:px-6 print:pb-6 space-y-10"
          >

            {/* ── SECTION 1: PERSONAL INFORMATION ── */}
            <section>
              <SectionHeader number="1" title="Applicant Information" subtitle="All fields are required. Information will be verified against submitted documentation." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <FieldRow label="Legal First Name" required><TextInput name="first_name" /></FieldRow>
                <FieldRow label="Legal Last Name" required><TextInput name="last_name" /></FieldRow>
                <FieldRow label="Date of Birth" required><DateInput name="dob" /></FieldRow>
                <FieldRow label="Phone Number" required><PhoneInput name="phone" /></FieldRow>
                <FieldRow label="Email Address" required><EmailInput name="email" /></FieldRow>
                <FieldRow label="Government-Issued ID Type" required>
                  <Select name="id_type" options={["State Driver's License", "State ID Card", "U.S. Passport", "Military ID", "Tribal ID"]} />
                </FieldRow>
                <FieldRow label="ID Number" sublabel="will be kept confidential" required><TextInput name="id_number" /></FieldRow>
                <FieldRow label="ID Issuing State / Country" required><TextInput name="id_state" /></FieldRow>
              </div>
              <FieldRow label="Current Mailing Address" required>
                <TextInput name="address_line1" placeholder="Street address" />
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <TextInput name="city" placeholder="City" />
                  <TextInput name="state" placeholder="State" />
                  <TextInput name="zip" placeholder="ZIP" />
                </div>
              </FieldRow>
              <FieldRow label="County / Jurisdiction" sublabel="required for service area eligibility" required><TextInput name="county" /></FieldRow>
              <FieldRow label="Are you currently experiencing homelessness or housing instability?" required>
                <Select name="housing_instability" options={["No — I have stable housing", "Yes — I am in recovery housing", "Yes — I am staying with family/friends temporarily", "Yes — I have no stable housing"]} />
              </FieldRow>
            </section>

            {/* ── SECTION 2: RECOVERY STATUS & VERIFICATION ── */}
            <section>
              <SectionHeader
                number="2"
                title="Recovery Status & Verification"
                subtitle="Your recovery pathway is yours — we do not require any specific program or religious affiliation. We do require a verifiable, structured commitment."
              />
              <NoteBox>Your treatment provider or recovery support organization will be contacted directly to verify the information in this section.</NoteBox>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <FieldRow label="Date of Most Recent Sobriety / Recovery Start" required><DateInput name="sobriety_date" /></FieldRow>
                <FieldRow label="Primary Substance(s) Addressed in Recovery" required>
                  <Select name="primary_substance" options={["Alcohol", "Opioids (prescription or heroin)", "Stimulants (meth, cocaine, crack)", "Benzodiazepines", "Cannabis", "Multiple substances", "Other"]} />
                </FieldRow>
                <FieldRow label="Current Recovery Phase" required>
                  <Select name="recovery_phase" options={["Detox / Stabilization (0–30 days)", "Early Recovery (31–90 days)", "Early Recovery (91–180 days)", "Sustained Recovery (6–12 months)", "Sustained Recovery (12+ months)"]} />
                </FieldRow>
                <FieldRow label="Primary Recovery Pathway" required>
                  <Select name="recovery_pathway" options={["Twelve-Step (AA / NA / CA)", "SMART Recovery", "Medication-Assisted Treatment (MAT)", "Faith-Based Program", "Non-12-Step Residential Program", "Outpatient / IOP", "Self-directed with professional support", "Other structured pathway"]} />
                </FieldRow>
              </div>
              <FieldRow label="Name of Current Treatment Program or Recovery Organization" required><TextInput name="treatment_org" placeholder="e.g., Serenity Outpatient Services" /></FieldRow>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <FieldRow label="Treatment Program Contact Name" required><TextInput name="treatment_contact_name" placeholder="Counselor, case manager, or director" /></FieldRow>
                <FieldRow label="Treatment Program Contact Phone" required><PhoneInput name="treatment_contact_phone" /></FieldRow>
                <FieldRow label="Treatment Program Address / Location" required><TextInput name="treatment_address" /></FieldRow>
                <FieldRow label="Treatment Program License or Accreditation" sublabel="CARF, JCAHO, state license #" required><TextInput name="treatment_license" /></FieldRow>
              </div>
              <FieldRow
                label="Describe your current recovery plan and the structure that supports it"
                sublabel="e.g., weekly individual therapy, daily MAT, three meetings per week, house rules, check-ins"
                required
              >
                <Textarea rows={4} name="recovery_plan_description" placeholder="Describe your structured recovery program, how often you meet with support professionals, what requirements you're following, and what milestones you're working toward." />
              </FieldRow>
              <FieldRow label="Have you had any relapses in the past 12 months?" required>
                <Select name="relapse_history" options={["No", "Yes — I will explain in the notes below"]} />
              </FieldRow>
              <FieldRow label="Additional context on recovery history (optional but encouraged)">
                <Textarea rows={3} name="recovery_notes" placeholder="You may use this space to provide additional context the committee should know. Honesty strengthens your application." />
              </FieldRow>
            </section>

            {/* ── SECTION 3: GRANT REQUEST ── */}
            <section>
              <SectionHeader
                number="3"
                title="Grant Request"
                subtitle="Be specific. Vague requests will not be approved. Funds are paid directly to the provider, landlord, or institution — not to you."
              />
              <NoteBox variant="warning">
                <strong>Direct disbursement policy:</strong> The Sunrise Foundation does not issue cash or reimbursements to applicants. All approved funds are sent directly to the service provider, landlord, or educational institution named in this section. You must be able to provide their contact information and a current invoice or estimate.
              </NoteBox>
              <FieldRow label="Type of Assistance Requested" required>
                <Select name="grant_type" options={[
                  "Recovery Access Grant — up to $2,500 (treatment costs, assessments, medications, transportation)",
                  "Recovery Housing Scholarship — $1,500–$4,500 (recovery residence fees, rent, deposits)",
                  "Recovery Workforce Scholarship — up to $3,000–$5,000 (certifications, education, exam fees)",
                  "Recovery Stability Microgrant — $100–$1,000 (license reinstatement, tools, utilities, phone)",
                ]} />
              </FieldRow>
              <FieldRow label="Specific Expense or Service Requested" required>
                <Textarea rows={2} name="expense_description" placeholder="e.g., First month's rent and security deposit at Oxford House — Main St., first 60-day MAT copay at Community Recovery Clinic" />
              </FieldRow>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <FieldRow label="Exact Amount Requested ($)" required>
                  <input type="number" name="amount_requested" min="1" step="1" placeholder="0.00" className={inputCls} />
                </FieldRow>
                <FieldRow label="Date Funds Are Needed By" sublabel="we cannot guarantee same-day approval" required><DateInput name="funds_needed_by" /></FieldRow>
              </div>
              <FieldRow label="Provider / Vendor / Landlord Name" sublabel="entity to whom funds will be sent" required><TextInput name="provider_name" placeholder="Legal name of organization or individual" /></FieldRow>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <FieldRow label="Provider Contact Name" required><TextInput name="provider_contact" /></FieldRow>
                <FieldRow label="Provider Phone Number" required><PhoneInput name="provider_phone" /></FieldRow>
                <FieldRow label="Provider Email" required><EmailInput name="provider_email" /></FieldRow>
                <FieldRow label="Provider Mailing Address" sublabel="where check or EFT should be directed" required><TextInput name="provider_address" /></FieldRow>
              </div>
              <FieldRow
                label="Explain why this specific assistance is critical to your recovery right now"
                sublabel="What happens if this barrier is not removed? Be direct and specific."
                required
              >
                <Textarea rows={4} name="urgency_explanation" placeholder="Describe the exact barrier, what you have already tried, and what the consequence would be if you do not receive assistance. Specificity demonstrates accountability." />
              </FieldRow>
            </section>

            {/* ── SECTION 4: FINANCIAL CIRCUMSTANCES ── */}
            <section>
              <SectionHeader number="4" title="Financial Circumstances" subtitle="We understand that early recovery often means financial hardship. We ask these questions to confirm need and ensure we're targeting the right people." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <FieldRow label="Current Monthly Income (all sources, $)" required>
                  <input type="number" name="monthly_income" min="0" step="1" placeholder="0" className={inputCls} />
                </FieldRow>
                <FieldRow label="Primary Source of Income" required>
                  <Select name="income_source" options={["Employment (full-time)", "Employment (part-time)", "Disability / SSI / SSDI", "Public Assistance / SNAP / TANF", "Support from family or friends", "No current income", "Other"]} />
                </FieldRow>
                <FieldRow label="Number of Dependents" required>
                  <Select name="dependents" options={["0", "1", "2", "3", "4 or more"]} />
                </FieldRow>
                <FieldRow label="Current Monthly Housing Cost ($)" required>
                  <input type="number" name="monthly_housing" min="0" step="1" placeholder="0" className={inputCls} />
                </FieldRow>
              </div>
              <FieldRow label="Are you currently receiving any other financial assistance?" required>
                <Select name="other_assistance" options={["No", "Yes — state benefits or Medicaid", "Yes — another nonprofit or charitable organization", "Yes — family support", "Yes — multiple sources (describe below)"]} />
              </FieldRow>
              <FieldRow label="If yes, describe other assistance (amounts, sources, duration)">
                <Textarea rows={2} name="other_assistance_detail" placeholder="e.g., Receiving $400/month TANF, Medicaid covers my MAT medications" />
              </FieldRow>
              <FieldRow
                label="Explain why you cannot cover this expense yourself or through other resources"
                required
              >
                <Textarea rows={3} name="financial_need_explanation" placeholder="Be specific about your financial situation. What resources have you already exhausted or pursued? Why does this particular expense fall outside your ability to manage right now?" />
              </FieldRow>
            </section>

            {/* ── SECTION 5: RECOVERY SUPPORT NETWORK ── */}
            <section>
              <SectionHeader
                number="5"
                title="Recovery Support Network"
                subtitle="All contacts listed here will be reached out to as part of our verification process. Do not list people who are unaware of your application."
              />
              <NoteBox variant="warning">
                <strong>Verification notice:</strong> By listing a contact below, you confirm they are aware of this application and have agreed to speak with a Sunrise Foundation representative. Contacts who cannot verify your recovery status or are unaware of your application will disqualify your submission.
              </NoteBox>

              {/* Sponsor / Peer Mentor */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-border">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4">Recovery Sponsor or Peer Support Mentor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <FieldRow label="Full Name" required><TextInput name="sponsor_name" /></FieldRow>
                  <FieldRow label="Phone Number" required><PhoneInput name="sponsor_phone" /></FieldRow>
                  <FieldRow label="Relationship to You" required>
                    <Select name="sponsor_relationship" options={["AA/NA Sponsor", "Peer Recovery Specialist", "Recovery Coach", "Peer Mentor (other program)", "Other peer support role"]} />
                  </FieldRow>
                  <FieldRow label="How Long Have They Known You in Recovery?" required>
                    <Select name="sponsor_duration" options={["Less than 1 month", "1–3 months", "3–6 months", "6–12 months", "More than 1 year"]} />
                  </FieldRow>
                </div>
                <FieldRow label="What can this person speak to about your recovery commitment?">
                  <Textarea rows={2} name="sponsor_context" placeholder="e.g., meets with me weekly, attends meetings with me, aware of my housing situation" />
                </FieldRow>
              </div>

              {/* Clinical Contact */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-border">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4">Primary Counselor, Case Manager, or Treatment Professional</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <FieldRow label="Full Name" required><TextInput name="counselor_name" /></FieldRow>
                  <FieldRow label="Professional Title / Credentials" required><TextInput name="counselor_title" placeholder="e.g., LCPC, CPRS, LCSW, Case Manager" /></FieldRow>
                  <FieldRow label="Organization / Practice" required><TextInput name="counselor_org" /></FieldRow>
                  <FieldRow label="Phone Number" required><PhoneInput name="counselor_phone" /></FieldRow>
                </div>
                <FieldRow label="Email Address"><EmailInput name="counselor_email" /></FieldRow>
                <FieldRow label="This person can verify:" sublabel="check all that apply">
                  <div className="space-y-1 mt-1">
                    {["My current treatment plan and progress", "My sobriety / recovery dates", "The specific financial need described in this application", "My overall readiness and commitment to recovery"].map(item => (
                      <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded border-border text-primary" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </FieldRow>
              </div>

              {/* Third Reference */}
              <div className="bg-gray-50 rounded-lg p-5 border border-border">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4">Additional Support Contact (Not a Family Member)</h3>
                <p className="text-xs text-muted-foreground mb-4">This may be a house manager, employer, pastor, recovery housing staff member, or other individual who can speak to your accountability and character. Family members are not eligible for this reference.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <FieldRow label="Full Name" required><TextInput name="ref_name" /></FieldRow>
                  <FieldRow label="Phone Number" required><PhoneInput name="ref_phone" /></FieldRow>
                  <FieldRow label="Role / Relationship" required><TextInput name="ref_role" placeholder="e.g., Oxford House manager, employer, pastor" /></FieldRow>
                  <FieldRow label="How Long Have They Known You?" required>
                    <Select name="ref_duration" options={["Less than 1 month", "1–3 months", "3–6 months", "6–12 months", "More than 1 year"]} />
                  </FieldRow>
                </div>
              </div>
            </section>

            {/* ── SECTION 6: REQUIRED DOCUMENTATION ── */}
            <section>
              <SectionHeader number="6" title="Required Documentation Checklist" subtitle="Check each item you are submitting with this application. Applications missing required documents will not be reviewed." />
              <NoteBox variant="warning">
                Submit documents by email to <strong>grants@sunrisefoundation.health</strong> with subject line: <em>"Grant Application — [Your Last Name] — [Date]"</em>. If printing, attach physical copies.
              </NoteBox>
              <div className="space-y-1">
                <DocCheckbox
                  label="Government-issued photo ID (front and back)"
                  sublabel="Must match name and date of birth provided in Section 1"
                />
                <DocCheckbox
                  label="Proof of income — last 30 days"
                  sublabel="Pay stubs, benefit award letters, bank statements, or zero-income declaration signed by a verifying party"
                />
                <DocCheckbox
                  label="Current invoice or written estimate from provider / vendor / landlord"
                  sublabel="Must be on official letterhead or platform statement; must include provider contact information"
                />
                <DocCheckbox
                  label="Written recovery or treatment plan signed by a licensed provider"
                  sublabel="Must be dated within the last 60 days; must include provider's name, credentials, and contact information"
                />
                <DocCheckbox
                  label="Proof of enrollment or admission (if applicable)"
                  sublabel="Recovery housing acceptance letter, treatment program enrollment confirmation, or educational institution acceptance"
                />
                <DocCheckbox
                  label="Letter of support from counselor or case manager (strongly recommended)"
                  sublabel="Should speak to your progress, commitment, and the specific need addressed in this application"
                />
              </div>
            </section>

            {/* ── SECTION 7: ACCOUNTABILITY & OUTCOME AGREEMENT ── */}
            <section>
              <SectionHeader
                number="7"
                title="Accountability & Outcome Agreement"
                subtitle="Read each item carefully and check the box to confirm your understanding and agreement."
              />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-3">
                <ConsentCheckbox label="I understand that if my application is approved, all funds will be disbursed directly to the provider, landlord, or institution named in Section 3. No cash or reimbursement will be issued to me." />
                <ConsentCheckbox label="I consent to The Sunrise Foundation contacting all three individuals listed in Section 5 for verification purposes, including asking them to confirm specific details about my recovery and this application." />
                <ConsentCheckbox label="I agree to participate in 30-day, 90-day, and 180-day follow-up check-ins conducted by a Foundation representative. These will ask about my recovery progress and the impact of the assistance." />
                <ConsentCheckbox label="I agree to notify the Foundation within 14 days if there is a significant change in my recovery status, housing, employment, or the circumstances described in this application." />
                <ConsentCheckbox label="I understand that providing false, misleading, or materially incomplete information on this application will result in immediate disqualification, revocation of any approved funding, and may be reported to the treatment provider and appropriate authorities." />
                <ConsentCheckbox label="I understand that receipt of a grant does not create an ongoing entitlement to future assistance, and that each application is evaluated independently." />
                <ConsentCheckbox label="I acknowledge that the Sunrise Foundation's decision is final and that the Foundation reserves the right to deny any application without cause." />
              </div>
            </section>

            {/* ── SECTION 8: CERTIFICATION & SIGNATURE ── */}
            <section>
              <SectionHeader number="8" title="Certification & Signature" />
              <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-6 mb-6 text-sm text-foreground leading-relaxed">
                <p>
                  By signing below, I certify under penalty of disqualification that all information provided in this application is true, complete, and accurate to the best of my knowledge. I authorize The Sunrise Foundation to verify any information submitted, including contacting all individuals and organizations listed herein. I understand that this application does not guarantee funding and that my personal information will be handled in accordance with the Foundation's privacy policy.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <FieldRow label="Printed Full Legal Name" required>
                  <TextInput name="cert_name" />
                </FieldRow>
                <FieldRow label="Date" required>
                  <DateInput name="cert_date" />
                </FieldRow>
                <FieldRow label="Signature (type your full name to sign electronically)" required>
                  <input
                    type="text"
                    name="signature"
                    placeholder="Type your full legal name"
                    className={`${inputCls} font-serif italic text-lg`}
                  />
                </FieldRow>
                <FieldRow label="How did you hear about The Sunrise Foundation?">
                  <Select name="referral_source" options={["Treatment program / counselor", "Recovery housing / sober living", "Peer / word of mouth", "Internet search", "Social media", "Healthcare provider", "Community organization", "Other"]} />
                </FieldRow>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
              <p className="text-xs text-muted-foreground max-w-sm">
                Submitting this form sends your responses to our grants team. You should receive a confirmation reply within 3 business days. For questions, email <strong>grants@sunrisefoundation.health</strong>.
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-10 py-3 bg-primary text-white text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
              >
                Submit Application
              </button>
            </div>

          </form>

          {/* Footer of document */}
          <div className="px-8 pb-8 pt-4 border-t border-border print:px-6">
            <p className="text-xs text-muted-foreground text-center">
              The Sunrise Foundation · 501(c)(3) Independent Charitable Organization · grants@sunrisefoundation.health<br />
              Funding decisions are made solely on the basis of documented need, recovery status, and program availability. The Foundation does not preferentially refer to or require affiliation with any Sunrise Grp. entity.
            </p>
          </div>
        </div>

        {/* Print action */}
        <div className="mt-8 flex justify-center gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-border text-foreground text-sm font-medium rounded-sm hover:bg-foreground/5 transition-colors"
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
          <a
            href="mailto:grants@sunrisefoundation.health?subject=Grant Application Submission"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
          >
            <Mail size={16} /> Email Completed Application
          </a>
        </div>
      </div>

      {/* Submission Confirmation */}
      {submitted && (
        <div className="fixed inset-0 bg-foreground/70 z-50 flex items-center justify-center p-6 print:hidden">
          <div className="bg-white rounded-xl max-w-md w-full p-8 text-center shadow-2xl">
            <CheckCircle2 size={52} className="text-teal-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-foreground mb-3">Application Received</h2>
            <p className="text-muted-foreground mb-2">
              Thank you. Our grants team will review your submission and respond within <strong>3 business days</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Please ensure you have emailed all required documentation to <strong>grants@sunrisefoundation.health</strong> with the subject line: <em>"Grant Application — [Your Last Name] — [Today's Date]"</em>
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
