import React, { useState } from 'react';
import { Screen } from '../App';
import { MOCK_PATIENTS } from '../data/mockPatients';
import { CheckCircle, ChevronDown, ChevronRight, AlertTriangle, FileText, Save, Printer } from 'lucide-react';
import { LockedButton } from '../components/common/LockedButton';

interface Props { navigate: (s: Screen, patientId?: string) => void; readOnly?: boolean; }

type SectionKey = 'presenting' | 'substances' | 'medical' | 'psychiatric' | 'legal' | 'family' | 'social' | 'trauma' | 'strengths' | 'diagnostic' | 'summary';

const SECTION_LABELS: Record<SectionKey, string> = {
  presenting:  'Presenting Problem & Chief Complaint',
  substances:  'Substance Use History',
  medical:     'Medical History',
  psychiatric: 'Psychiatric & Mental Health History',
  legal:       'Legal History',
  family:      'Family & Relationship History',
  social:      'Social & Environmental History',
  trauma:      'Trauma & Adverse Childhood Experiences',
  strengths:   'Strengths, Resources & Protective Factors',
  diagnostic:  'DSM-5 Diagnoses & Severity Specifiers',
  summary:     'Clinical Summary & Recommendations',
};

const SECTIONS_ORDER: SectionKey[] = [
  'presenting', 'substances', 'medical', 'psychiatric', 'legal',
  'family', 'social', 'trauma', 'strengths', 'diagnostic', 'summary',
];

// Pre-filled data for the demo patient (p1 — Marcus Webb)
const DEMO_DATA: Record<string, string> = {
  chiefComplaint: 'Patient presents voluntarily for residential treatment for opioid use disorder and co-occurring PTSD. Reports daily heroin use IV x3 years. States "I want to stop before I kill myself."',
  presentingProblem: 'Marcus Webb is a 38-year-old white male presenting as a voluntary admission to Sunrise Recovery Center Residential (ASAM 3.7). Patient was referred by his primary care physician following an ED visit on 7/5/2026 for accidental fentanyl overdose managed with naloxone administration x2. Patient reports escalating opioid use over past 18 months. Patient employed as HVAC technician — currently on FMLA leave.',
  currentCrisis: 'No active SI/HI at time of assessment. History of passive SI (2021). No current psychotic symptoms. No active withdrawal requiring immediate medical intervention (COWS 4 at intake). Mood: 4/10. Affect: restricted, appropriate.',

  substancesPrimary: 'Heroin (IV) — age of first use 24, daily use x3 years. Current quantity: 1-2g/day. Last use: 7/7/2026 (2 days prior to admission). Multiple attempts to quit; longest sobriety 8 months (2021, jail). Tolerance HIGH. Withdrawal: moderate (COWS 6 at intake).',
  substancesSecondary: 'Alcohol — social use age 17-24, intermittent heavy use x5 years, then abstinent 6 years. Now occasional (1-2x/week, 2-4 beers). Methamphetamine — used briefly age 21-22, not current. Cannabis — daily use age 15-23, currently occasional (1-2x/month). Benzodiazepines — prescribed Xanax 0.5mg PRN x1 year; using 2-4mg/day above prescribed dose.',
  substancesTreatment: 'Inpatient detox x1 (2019, Vanderbilt, opioid withdrawal). Residential x1 (2021, 28 days, completed, relapsed at 8 months). No MAT history. Not currently prescribed MAT. Patient open to Suboxone.',

  medicalHistory: 'Active: Hypertension (Lisinopril 10mg), GERD (omeprazole 20mg), chronic low back pain (non-opioid management only per current plan). HCV antibody positive 2024 — treatment-naïve, not engaged with GI. HIV negative (2024). Hepatitis B immune.\nAllergies: PCN (rash).\nSurgeries: Appendectomy 2011.\nLast physical exam: April 2026 (PCP Dr. Martinez).',
  medicalConcerns: 'Blood pressure 148/92 at intake — elevated. IV IVDU history — vein condition poor, no active abscesses. HCV treatment candidacy evaluation recommended. COWS score 6 at admission — initiate buprenorphine induction protocol per physician order.',

  psychiatricHistory: 'Diagnoses: PTSD (combat-related, diagnosed 2015 at VA); Major Depressive Disorder, recurrent, moderate (diagnosed 2018). Anxiety NOS. Prior psychiatric hospitalizations: none. Outpatient therapy: 2015-2018 (VA, CBT/PE for PTSD), discontinued due to relapse and transportation barriers. Current medications: none psychiatric. Past medication trials: Zoloft (discontinued — GI side effects), Effexor (discontinued — sexual side effects).',
  currentPsych: 'On structured clinical interview: PHQ-9 = 17 (moderately severe depression). PCL-5 = 51 (PTSD probable). Passive suicidal ideation present ("I\'ve thought I\'d be better off dead") — no plan, no intent, no means identified beyond substances. Safety plan completed. C-SSRS baseline: Ideation Type 2 (passive). Hamilton Anxiety = 28 (severe).',

  legalHistory: 'Current legal matters: None pending at admission. History: DUI x1 (2018, fines paid); drug possession (2021, diversion to treatment — completed). Veterans Court participant 2021 — successfully discharged. No probation/parole currently. Patient expresses concern about employment/licensure if record expunged.',

  familyHistory: 'Parents: Father — deceased 2022, alcohol use disorder and PTSD (Vietnam veteran). Mother — alive, history of anxiety, benzodiazepine dependence (current, age 68). Siblings: 1 brother, healthy, no SUD. Marital status: Separated x1 year from wife (Emily Webb). Two children: ages 8 and 11, currently residing with wife. Wife supportive of treatment — CRAFFT scores indicate significant family impact. Children in therapy per wife\'s report.\nFamily history of SUD: Father (AUD), Mother (BZD dependence), Paternal uncle (opioid OD death).',
  familyRelationships: 'Primary support: wife (despite separation), mother, older brother. Estrangement from father\'s side of family. Children\'s welfare is primary stated motivation for seeking treatment. Limited current social network — isolation over past 2 years. Sponsor: none currently.',

  socialHistory: 'Housing: Currently residing in wife\'s home (separated but not yet divorced — amicable). Long-term housing stable if sobriety maintained. Employment: HVAC technician x12 years, currently on FMLA leave — job secure per patient report. Education: High school diploma + HVAC certification. Financial: Some medical debt; on wife\'s insurance. Military: US Army 2005-2012, OIF veteran, honorable discharge. VA benefits eligible — VA-connected care not currently active.',
  socialSupports: 'Strengths of social environment: stable housing (potential), employed, children as protective factor, wife supportive of treatment. Barriers: marital separation, social isolation, limited recovery community connections, HCV stigma.',

  traumaHistory: 'ACEs score: 5/10. Identified traumas: Combat exposure x2 deployments (Iraq); witnessed IED death of close fellow soldier 2008. Physical abuse by father (age 8-14). Alcohol-related household chaos throughout childhood. Adverse adult experiences: DUI, marital conflict, OD event 2026.\nTrauma symptoms: hypervigilance, nightmares (3-4x/week), avoidance of Veterans\' gatherings, emotional numbing, startle response. PTSD symptoms pre-date opioid use — opioids reported as primary coping mechanism for PTSD symptoms.',
  traumaInformed: 'Trauma-informed care approach indicated. EMDR or CPT appropriate pending stabilization. Patient reports substances used to manage trauma symptoms — psychoeducation on trauma-SUD connection essential. No current DV. Safety confirmed.',

  strengths: 'Motivation: HIGH — self-initiated, OD event as turning point. Insight: GOOD — patient demonstrates understanding of addiction as chronic disease. Employment: stable, supportive employer. Family: children and wife as strong motivators. Military background: discipline, structure, resilience. Prior sobriety: 8 months demonstrates capacity for recovery. Accepts MAT — open to Suboxone. Accepts therapy — prior CBT experience.',
  protectiveFactors: 'Stable housing potential. Employment (FMLA protection). Family support (wife, mother). Financial stability. Children. Intelligence and insight. Willingness to engage in treatment. Health insurance. VA benefits available.',

  diagnoses: `295.90 [F20.9] — Not Applicable
F11.20 — Opioid Use Disorder, Severe (with physiological dependence)
F14.20 — Cocaine Use Disorder — NOT PRESENT (no current use)
F10.20 — Alcohol Use Disorder, Mild (in early remission)
F13.20 — Sedative/Hypnotic/Anxiolytic Use Disorder, Moderate (benzodiazepine)
F43.10 — Posttraumatic Stress Disorder, with delayed expression
F33.1  — Major Depressive Disorder, Recurrent, Moderate
Z91.19 — Other Personal History of Noncompliance with Medical Treatment
Z63.0  — Relationship Distress with Spouse or Intimate Partner`,

  clinicalSummary: 'Marcus Webb is a 38-year-old Army veteran presenting with severe OUD, co-occurring PTSD and MDD, and a recent life-threatening opioid overdose. His opioid use disorder developed in the context of undertreated combat PTSD — substances have been the primary coping mechanism for hyperarousal, nightmares, and emotional numbing. Buprenorphine/naloxone (Suboxone) is medically indicated and patient consents. Trauma-focused therapy (EMDR or CPT) following stabilization is the evidence-based recommendation for co-occurring PTSD.\n\nRisk factors include high COWS at admission (withdrawal severity), passive SI, AMA risk (restlessness reported), history of relapse after treatment, and limited recovery network. Protective factors are substantial: strong internal motivation, employment, family support, prior 8-month sobriety, and VA benefits eligibility.',
  treatmentRecommendations: 'Level of Care: Residential (ASAM 3.7) — medically necessary per ASAM D1:3, D3:3, D4:2, D5:4, D6:2.\n\nImmediate:\n1. Buprenorphine induction (Dr. Chen to write orders)\n2. Psychiatric evaluation within 72h for PTSD/MDD pharmacotherapy\n3. Safety planning — passive SI monitoring daily\n4. HCV treatment candidacy evaluation (GI referral)\n\nShort-Term (Weeks 1-2):\n5. Individual trauma-informed counseling — 3x/week\n6. Group therapy — morning process, relapse prevention, trauma psychoeducation\n7. Family session with wife — 42 CFR Part 2 consent required\n8. Veterans\' group — VA peer support\n\nLong-Term / Discharge Planning:\n9. Suboxone maintenance (community MAT provider)\n10. EMDR or CPT intensive (post-stabilization)\n11. AA/NA with veteran-specific meeting group\n12. VA re-enrollment for VA mental health services\n13. Couples counseling (if wife willing)\n14. Aftercare: sober living recommended if marital home unavailable',
  assessmentCompleted: 'Assessment completed by Sarah Jenkins, LPC (Primary Counselor) with co-assessment by Dr. James Carter, CADC-III (Clinical Director). Reviewed and signed by Dr. Robert Chen, MD (Medical Director).',
};

export function BiopsychosocialAssessment({ navigate, readOnly }: Props) {
  const [selectedPatient, setSelectedPatient] = useState('p1');
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['presenting']));
  const [completedSections, setCompletedSections] = useState<Set<SectionKey>>(new Set(['presenting', 'substances', 'medical', 'psychiatric', 'legal', 'family', 'social', 'trauma', 'strengths', 'diagnostic', 'summary']));
  const [saved, setSaved] = useState(false);
  const [bpsTab, setBpsTab] = useState<'Assessment' | 'Population Summary' | 'SUD Epidemiology' | 'Diagnostic Coding' | 'Assessment Quality'>('Assessment');

  const p = MOCK_PATIENTS.find(pt => pt.id === selectedPatient) ?? MOCK_PATIENTS[0];

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const completedCount = completedSections.size;
  const totalSections = SECTIONS_ORDER.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Biopsychosocial Assessment</h1>
          <p className="text-slate text-sm mt-0.5">Comprehensive intake assessment — addiction-specific with ASAM, trauma, and DSM-5 integration</p>
        </div>
        <div className="flex gap-2">
          <button className="border border-border text-slate rounded-lg px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Printer className="w-4 h-4" /> Print / PDF</button>
          <LockedButton locked={readOnly} onClick={() => !readOnly && setSaved(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2"><Save className="w-4 h-4" />{saved ? 'Saved ✓' : 'Save Assessment'}</LockedButton>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(['Assessment', 'Population Summary', 'SUD Epidemiology', 'Diagnostic Coding', 'Assessment Quality'] as const).map(t => (
          <button key={t} onClick={() => setBpsTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${bpsTab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {bpsTab === 'Population Summary' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Assessments Completed', value: 18, sub: 'Current census', color: 'text-navy' },
              { label: 'Completed Within 72h', value: 16, sub: '89% compliance rate', color: 'text-green-600' },
              { label: 'Awaiting Co-sign', value: 2, sub: 'Clinical director review', color: 'text-amber-600' },
              { label: 'Next Scheduled', value: 'Today 3PM', sub: 'Thomas Reilly — intake', color: 'text-blue-600' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Primary Substance — Census Breakdown</h3>
              <div className="space-y-2.5">
                {[
                  { substance: 'Opioid (Heroin / Fentanyl)', n: 7, pct: 39, color: 'bg-red-500' },
                  { substance: 'Alcohol', n: 5, pct: 28, color: 'bg-amber-400' },
                  { substance: 'Methamphetamine', n: 3, pct: 17, color: 'bg-blue-500' },
                  { substance: 'Polysubstance', n: 2, pct: 11, color: 'bg-purple-500' },
                  { substance: 'Cocaine / Stimulants', n: 1, pct: 5, color: 'bg-pink-400' },
                ].map(r => (
                  <div key={r.substance}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{r.substance}</span>
                      <span className="font-bold text-navy">{r.n} ({r.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">Co-occurring Disorders — Census</h3>
              <div className="space-y-2.5">
                {[
                  { dx: 'Major Depressive Disorder', n: 11, pct: 61, color: 'bg-blue-400' },
                  { dx: 'PTSD', n: 8, pct: 44, color: 'bg-purple-400' },
                  { dx: 'Anxiety Disorder', n: 9, pct: 50, color: 'bg-teal-400' },
                  { dx: 'ADHD', n: 4, pct: 22, color: 'bg-green-400' },
                  { dx: 'Bipolar Disorder', n: 2, pct: 11, color: 'bg-orange-400' },
                  { dx: 'Eating Disorder (co-occurring)', n: 2, pct: 11, color: 'bg-pink-400' },
                ].map(r => (
                  <div key={r.dx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate">{r.dx}</span>
                      <span className="font-bold text-navy">{r.n} ({r.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">ACE Score Distribution & Trauma Profile</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-slate mb-2">ACE (Adverse Childhood Experiences) score distribution — current census</div>
                <div className="space-y-2">
                  {[
                    { range: '0–2 (Low)', n: 3, pct: 17, color: 'bg-green-400' },
                    { range: '3–4 (Moderate)', n: 5, pct: 28, color: 'bg-amber-400' },
                    { range: '5–6 (High)', n: 6, pct: 33, color: 'bg-orange-400' },
                    { range: '7–10 (Very High)', n: 4, pct: 22, color: 'bg-red-500' },
                  ].map(r => (
                    <div key={r.range}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate">{r.range}</span>
                        <span className="font-bold text-navy">{r.n} ({r.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold text-navy mt-3">Average ACE Score: <span className="text-orange">4.9</span> (vs. 2.0 in general population)</div>
              </div>

              <div>
                <div className="text-xs text-slate mb-2">Trauma types present in BPS assessments</div>
                <div className="space-y-1.5">
                  {[
                    { type: 'Physical or sexual abuse (childhood)', pct: 67 },
                    { type: 'Parental substance use disorder', pct: 72 },
                    { type: 'Combat / Military trauma', pct: 22 },
                    { type: 'Domestic violence (intimate partner)', pct: 44 },
                    { type: 'Overdose (self or witnessed)', pct: 56 },
                    { type: 'Incarceration', pct: 39 },
                    { type: 'Housing instability / homelessness', pct: 33 },
                  ].map(r => (
                    <div key={r.type} className="flex items-center justify-between text-xs">
                      <span className="text-slate">{r.type}</span>
                      <span className={`font-bold ${r.pct >= 60 ? 'text-red-600' : r.pct >= 40 ? 'text-amber-600' : 'text-green-600'}`}>{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {bpsTab === 'Assessment' && (
      <>
      {/* Patient selector + progress */}
      <div className="card flex items-center gap-6">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Select Patient</label>
          <select className="border border-border rounded-lg px-3 py-2 text-sm w-full max-w-xs" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
            {MOCK_PATIENTS.map(pt => <option key={pt.id} value={pt.id}>{pt.firstName} {pt.lastName} — {pt.mrn}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-navy">{completedCount}/{totalSections}</div>
            <div className="text-xs text-slate">Sections Complete</div>
          </div>
          <div className="w-24">
            <div className="flex justify-between text-xs text-slate mb-1">
              <span>{Math.round(completedCount/totalSections*100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="h-2.5 bg-green-500 rounded-full transition-all" style={{ width: `${completedCount/totalSections*100}%` }} />
            </div>
          </div>
        </div>
        <div className="border-l border-border pl-6 text-sm space-y-1">
          <div className="text-xs text-slate"><span className="font-semibold text-navy">DOB:</span> {p.dob} · <span className="font-semibold text-navy">Age:</span> {p.age}</div>
          <div className="text-xs text-slate"><span className="font-semibold text-navy">Program:</span> {p.program} · <span className="font-semibold text-navy">LOS:</span> Day {p.los}</div>
          <div className="text-xs text-slate"><span className="font-semibold text-navy">Dx:</span> {p.primaryDiagnosis}</div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800">
        <FileText className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong>CARF Standard 3.A.8:</strong> Biopsychosocial assessment must be completed within 72 hours of admission. Assessments must be signed by a credentialed counselor and co-signed by the clinical director or supervising physician.
          <span className="ml-2 text-green-700 font-medium">✓ Completed {p.id === 'p1' ? '2026-07-08' : 'pending'}</span>
        </div>
      </div>

      {/* Section accordion */}
      <div className="space-y-2">
        {SECTIONS_ORDER.map((key, idx) => {
          const isOpen = expandedSections.has(key);
          const isDone = completedSections.has(key);

          return (
            <div key={key} className={`border rounded-xl overflow-hidden ${isDone ? 'border-green-200' : 'border-border'}`}>
              <button
                onClick={() => toggleSection(key)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${isOpen ? 'bg-navy text-white' : isDone ? 'bg-green-50 hover:bg-green-100/60' : 'bg-white hover:bg-gray-50'}`}
              >
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${isOpen ? 'bg-white text-navy' : isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {isDone && !isOpen ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </span>
                <span className={`font-semibold text-sm flex-1 ${isOpen ? 'text-white' : isDone ? 'text-green-800' : 'text-navy'}`}>{SECTION_LABELS[key]}</span>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isOpen && (
                <div className="px-6 py-5 border-t border-border bg-white space-y-4">
                  {key === 'presenting' && <PresentingSection data={DEMO_DATA} />}
                  {key === 'substances' && <SubstancesSection data={DEMO_DATA} />}
                  {key === 'medical' && <MedicalSection data={DEMO_DATA} />}
                  {key === 'psychiatric' && <PsychiatricSection data={DEMO_DATA} />}
                  {key === 'legal' && <LegalSection data={DEMO_DATA} />}
                  {key === 'family' && <FamilySection data={DEMO_DATA} />}
                  {key === 'social' && <SocialSection data={DEMO_DATA} />}
                  {key === 'trauma' && <TraumaSection data={DEMO_DATA} />}
                  {key === 'strengths' && <StrengthsSection data={DEMO_DATA} />}
                  {key === 'diagnostic' && <DiagnosticSection data={DEMO_DATA} />}
                  {key === 'summary' && <SummarySection data={DEMO_DATA} />}
                  <div className="flex justify-end gap-3 pt-2 border-t border-border">
                    <button onClick={() => toggleSection(key)} className="text-sm border border-border text-slate px-4 py-2 rounded-lg hover:bg-gray-50">Close</button>
                    <LockedButton
                      locked={readOnly}
                      onClick={() => {
                        if (readOnly) return;
                        setCompletedSections(prev => new Set([...prev, key]));
                        toggleSection(key);
                        const nextIdx = SECTIONS_ORDER.indexOf(key) + 1;
                        if (nextIdx < SECTIONS_ORDER.length) {
                          setTimeout(() => toggleSection(SECTIONS_ORDER[nextIdx]), 100);
                        }
                      }}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Complete & Next
                    </LockedButton>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completedCount === totalSections && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <div className="font-bold text-green-800">Assessment Complete</div>
            <div className="text-sm text-green-700 mt-0.5">
              All sections completed. Ready for co-signer review. Assessment must be co-signed by clinical director within 24 hours of completion.
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <LockedButton locked={readOnly} onClick={() => !readOnly && navigate('CosignQueue')} className="text-sm border border-green-300 text-green-700 bg-white px-4 py-2 rounded-lg hover:bg-green-50">Send to Co-sign Queue</LockedButton>
            <button className="btn-primary text-sm px-4 py-2">Print Assessment</button>
          </div>
        </div>
      )}
      </>
      )}

      {bpsTab === 'SUD Epidemiology' && (
        <div className="space-y-5">
          <div className="text-sm text-slate">Reference data for clinicians — national and Tennessee-specific SUD prevalence, trends, and population benchmarks relevant to treatment planning.</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Americans with SUD (2023)', value: '48.7M', color: 'text-navy', sub: 'SAMHSA NSDUH 2023' },
              { label: 'Received Tx in Past Year', value: '13%', color: 'text-amber-600', sub: '6.3M of 48.7M affected' },
              { label: 'TN Opioid Deaths (2023)', value: '3,281', color: 'text-red-600', sub: '~9/day · TDMHSAS' },
              { label: 'TN SUD Tx Capacity Gap', value: '~70%', color: 'text-amber-600', sub: 'Unmet need statewide' },
            ].map(k => (
              <div key={k.label} className="card">
                <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
                <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-navy text-sm mb-3">National SUD Prevalence by Substance (2023)</h3>
              <div className="space-y-2 text-xs">
                {[
                  { sub: 'Alcohol Use Disorder', prev: '29.5M', pct: 10.8, color: 'bg-amber-500' },
                  { sub: 'Cannabis Use Disorder', prev: '16.3M', pct: 6.0, color: 'bg-green-500' },
                  { sub: 'Opioid Use Disorder', prev: '6.1M', pct: 2.2, color: 'bg-red-500' },
                  { sub: 'Stimulant Use Disorder (Meth/Cocaine)', prev: '5.3M', pct: 1.9, color: 'bg-orange-500' },
                  { sub: 'Nicotine/Tobacco Use Disorder', prev: '59.1M', pct: 21.6, color: 'bg-gray-500' },
                  { sub: 'Benzodiazepine Use Disorder', prev: '1.8M', pct: 0.7, color: 'bg-purple-500' },
                  { sub: 'Co-occurring MH + SUD', prev: '21.5M', pct: 7.9, color: 'bg-blue-500' },
                ].map(s => (
                  <div key={s.sub}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate">{s.sub}</span>
                      <span className="font-semibold text-navy">{s.prev} ({s.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${Math.min(s.pct * 4, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-slate italic mt-2">Source: SAMHSA National Survey on Drug Use and Health (NSDUH) 2023</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Tennessee-Specific Highlights</h3>
                <div className="space-y-2 text-xs text-slate">
                  {[
                    { label: 'Opioid overdose deaths (2023)', value: '3,281 · 5th highest per capita in US' },
                    { label: 'TN buprenorphine prescribers', value: '~2,800 DATA-waiver providers statewide' },
                    { label: 'TN Medicaid (TennCare) SUD coverage', value: 'Residential + MAT covered; PHP/IOP carved in as of 2022' },
                    { label: 'Alcohol-related deaths (TN, 2022)', value: '1,847 · liver disease + poisoning combined' },
                    { label: 'Stimulant (meth) tx admissions, TN', value: '38% of all TN SUD tx admissions involve stimulants' },
                    { label: 'Rural access gap', value: '72% of TN counties have no licensed SUD tx facility' },
                  ].map(r => (
                    <div key={r.label} className="border border-border rounded p-2">
                      <span className="font-semibold text-navy">{r.label}: </span>
                      <span>{r.value}</span>
                    </div>
                  ))}
                  <div className="text-[10px] italic">Sources: TDMHSAS, TN Dept. of Health, SAMHSA TEDS</div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-navy text-sm mb-3">Treatment Effectiveness Evidence Base</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { tx: 'MAT (buprenorphine)', evidence: 'Reduces OUD mortality by 50-60%. Gold-standard per ASAM, SAMHSA, and WHO. Continuous treatment dramatically outperforms detox-only.' },
                    { tx: 'Residential (≥90 days)', evidence: 'Longer treatment duration consistently associated with better outcomes. NIDA: 90 days threshold for meaningful recovery benefit.' },
                    { tx: 'Cognitive Behavioral Therapy (CBT)', evidence: 'Strong evidence for AUD, OUD, stimulant SUD. Skill transfer and relapse prevention persist years post-treatment.' },
                    { tx: 'Motivational Interviewing (MI)', evidence: 'Meta-analyses: 74% of studies show MI superior to no treatment. Particularly effective in early-stage ambivalence.' },
                    { tx: '12-Step / Mutual Aid (AA/NA)', evidence: 'Cochrane review: AA at least as effective as CBT for AUD at 1 year, with stronger social support outcomes.' },
                  ].map(e => (
                    <div key={e.tx} className="border border-border rounded-lg p-2.5">
                      <div className="font-semibold text-navy mb-0.5">{e.tx}</div>
                      <div className="text-slate leading-relaxed">{e.evidence}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {bpsTab === 'Diagnostic Coding' && <DiagnosticCodingTab />}
      {bpsTab === 'Assessment Quality' && <AssessmentQualityTab />}
    </div>
  );
}

function Field({ label, value, multiline = true }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate uppercase tracking-wide mb-1">{label}</label>
      {multiline ? (
        <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-orange/30 focus:border-orange" defaultValue={value ?? ''} />
      ) : (
        <input className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange/30 focus:border-orange" defaultValue={value ?? ''} />
      )}
    </div>
  );
}

function PresentingSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Chief Complaint (Patient's Own Words)" value={data.chiefComplaint} />
      <Field label="Presenting Problem & Circumstances of Referral" value={data.presentingProblem} />
      <Field label="Current Mental Status & Crisis Assessment" value={data.currentCrisis} />
    </div>
  );
}

function SubstancesSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        Document each substance separately. Include: age of first use, route, frequency, quantity, date of last use, withdrawal history, and longest period of abstinence.
      </div>
      <Field label="Primary Substance (Current / Primary Reason for Admission)" value={data.substancesPrimary} />
      <Field label="Secondary / Co-occurring Substances" value={data.substancesSecondary} />
      <Field label="Prior Treatment History (Detox, Residential, IOP, MAT, etc.)" value={data.substancesTreatment} />
    </div>
  );
}

function MedicalSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Current Medical Conditions, Medications & Allergies" value={data.medicalHistory} />
      <Field label="Immediate Medical Concerns & Treatment Needs" value={data.medicalConcerns} />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">HIV Status</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm"><option>Negative (2024)</option><option>Positive</option><option>Unknown / Declined</option></select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">HCV Status</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm"><option>Antibody Positive — treatment naïve</option><option>Negative</option><option>Active HCV — on treatment</option><option>Unknown</option></select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Hepatitis B</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm"><option>Immune (vaccinated)</option><option>Active HBV</option><option>Susceptible — needs vaccine</option><option>Unknown</option></select>
        </div>
      </div>
    </div>
  );
}

function PsychiatricSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Psychiatric History (Diagnoses, Hospitalizations, Prior Treatment, Medications)" value={data.psychiatricHistory} />
      <Field label="Current Psychiatric Status & Standardized Screening Results" value={data.currentPsych} />
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'PHQ-9 Score', val: '17 — Moderately Severe' },
          { label: 'PCL-5 Score', val: '51 — PTSD Probable' },
          { label: 'GAD-7 Score', val: '18 — Severe' },
          { label: 'C-SSRS Ideation', val: 'Type 2 — Passive' },
        ].map(s => (
          <div key={s.label}>
            <label className="block text-xs font-semibold text-slate uppercase mb-1">{s.label}</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" defaultValue={s.val} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LegalSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Legal History & Current Legal Involvement" value={data.legalHistory} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Currently Court-Ordered to Treatment?</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="court" defaultChecked={false} /> Yes</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="court" defaultChecked /> No — voluntary</label>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Probation / Parole Officer</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Name and contact" defaultValue="N/A — no current P/P" />
        </div>
      </div>
    </div>
  );
}

function FamilySection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Family History (SUD, Mental Health, Medical) & Relationships" value={data.familyHistory} />
      <Field label="Current Relationships & Primary Support System" value={data.familyRelationships} />
    </div>
  );
}

function SocialSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Social & Environmental History (Housing, Employment, Education, Military, Financial)" value={data.socialHistory} />
      <Field label="Social Supports & Barriers to Recovery Environment" value={data.socialSupports} />
    </div>
  );
}

function TraumaSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
        <strong>Trauma-Informed Approach:</strong> Ask about trauma history in a safe, non-pressuring way. Patients are not required to disclose details. Documentation should support care planning without re-traumatization.
      </div>
      <Field label="Trauma History & Adverse Childhood Experiences (ACEs)" value={data.traumaHistory} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">ACE Score</label>
          <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" defaultValue="5/10" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate uppercase mb-1">Current DV Safety</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm"><option>Safe — no current DV</option><option>DV concern — safety plan active</option><option>Declined to answer</option></select>
        </div>
      </div>
      <Field label="Trauma-Informed Treatment Considerations" value={data.traumaInformed} />
    </div>
  );
}

function StrengthsSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
        Strengths-based assessment is essential. Document motivation level (URICA stage of change), internal resources, and protective factors that support treatment engagement and long-term recovery.
      </div>
      <Field label="Patient Strengths, Motivation & Readiness for Change" value={data.strengths} />
      <Field label="Protective Factors & Recovery Capital" value={data.protectiveFactors} />
    </div>
  );
}

function DiagnosticSection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        Use DSM-5 codes and severity specifiers. For SUDs, specify severity (Mild/Moderate/Severe) based on symptom count. Note "In Early Remission" if applicable.
      </div>
      <Field label="DSM-5 Diagnoses (ICD-10 codes required for billing)" value={data.diagnoses} />
    </div>
  );
}

function SummarySection({ data }: { data: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <Field label="Clinical Summary & Formulation" value={data.clinicalSummary} />
      <Field label="Treatment Recommendations & ASAM Level of Care Justification" value={data.treatmentRecommendations} />
      <Field label="Clinician Attestation & Co-signature Plan" value={data.assessmentCompleted} multiline={false} />
    </div>
  );
}

function DiagnosticCodingTab() {
  return (
    <div className="space-y-5">
      <div className="text-sm text-slate">DSM-5-TR and ICD-10-CM reference for common SUD and co-occurring diagnoses — for BPS assessment completion and billing documentation.</div>
      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold text-navy text-sm mb-3">Common SUD Diagnoses — ICD-10-CM Quick Reference</h3>
          <div className="space-y-1 text-xs">
            {[
              { code: 'F10.20', dx: 'Alcohol Use Disorder, Moderate/Severe' },
              { code: 'F10.230', dx: 'AUD, Severe, with Withdrawal' },
              { code: 'F11.20', dx: 'Opioid Use Disorder, Moderate/Severe' },
              { code: 'F11.23', dx: 'OUD, Severe, with Withdrawal' },
              { code: 'F11.90', dx: 'Opioid Use, Unspecified, Uncomplicated' },
              { code: 'F14.20', dx: 'Cocaine Use Disorder, Moderate/Severe' },
              { code: 'F15.20', dx: 'Amphetamine-type SUD, Moderate/Severe' },
              { code: 'F12.20', dx: 'Cannabis Use Disorder, Moderate/Severe' },
              { code: 'F19.20', dx: 'Other Psychoactive SUD, Moderate/Severe' },
              { code: 'F13.20', dx: 'Sedative/Hypnotic/Anxiolytic Use Disorder' },
            ].map(d => (
              <div key={d.code} className="flex gap-3 border-b border-border py-1.5">
                <span className="font-mono font-bold text-navy shrink-0 w-16">{d.code}</span>
                <span className="text-slate">{d.dx}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-navy text-sm mb-3">Common Co-occurring Diagnoses</h3>
            <div className="space-y-1 text-xs">
              {[
                { code: 'F33.1', dx: 'Major Depressive Disorder, Recurrent, Moderate' },
                { code: 'F41.1', dx: 'Generalized Anxiety Disorder' },
                { code: 'F43.10', dx: 'PTSD, Unspecified' },
                { code: 'F31.81', dx: 'Bipolar II Disorder' },
                { code: 'F20.9', dx: 'Schizophrenia, Unspecified' },
                { code: 'F90.9', dx: 'ADHD, Unspecified' },
                { code: 'F60.3', dx: 'Borderline Personality Disorder' },
                { code: 'F43.22', dx: 'Adjustment Disorder with Anxiety' },
              ].map(d => (
                <div key={d.code} className="flex gap-3 border-b border-border py-1.5">
                  <span className="font-mono font-bold text-purple-600 shrink-0 w-14">{d.code}</span>
                  <span className="text-slate">{d.dx}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <strong>Note:</strong> Substance-induced disorders (e.g., F10.94 — AUD with induced depressive disorder) should be distinguished from independent co-occurring diagnoses. DSM-5-TR requires ≥30 days abstinence to confirm primary psychiatric diagnosis in most cases.
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessmentQualityTab() {
  const metrics = [
    { clinician: 'A. Brooks, LPC', completed: 12, avgDays: 1.1, sigRate: '100%', score: 96, trend: 'up' },
    { clinician: 'T. Jackson, CADC', completed: 9, avgDays: 1.4, sigRate: '100%', score: 93, trend: 'stable' },
    { clinician: 'M. Rivera, MS', completed: 7, avgDays: 2.1, sigRate: '86%', score: 84, trend: 'down' },
    { clinician: 'R. Torres, LPC-MHSP', completed: 5, avgDays: 1.0, sigRate: '100%', score: 98, trend: 'up' },
  ];
  return (
    <div className="space-y-5">
      <div className="text-sm text-slate">BPS assessment completion quality metrics — timeliness, co-signature compliance, and clinical supervisor quality scores (30-day rolling).</div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Avg Completion Time', value: '1.4d', color: 'text-green-600', sub: 'Target: ≤2 business days' },
          { label: 'Co-sign Rate', value: '96%', color: 'text-blue-600', sub: '47 of 49 assessments' },
          { label: 'Supervisor Score Avg', value: '93/100', color: 'text-navy', sub: '30-day rolling mean' },
          { label: 'Assessments (30d)', value: 49, color: 'text-teal-600', sub: 'All programs combined' },
        ].map(k => (
          <div key={k.label} className="card">
            <div className="text-xs font-semibold text-slate uppercase tracking-wide">{k.label}</div>
            <div className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 className="font-semibold text-navy text-sm mb-3">Clinician-Level Assessment Quality</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-slate">
              <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider">Clinician</th>
              <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Completed</th>
              <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Avg Days</th>
              <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Co-sign Rate</th>
              <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Quality Score</th>
              <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {metrics.map(m => (
              <tr key={m.clinician} className="hover:bg-gray-50">
                <td className="py-2 font-medium text-navy">{m.clinician}</td>
                <td className="py-2 text-center text-slate">{m.completed}</td>
                <td className="py-2 text-center text-slate">{m.avgDays}d</td>
                <td className="py-2 text-center font-semibold text-blue-600">{m.sigRate}</td>
                <td className="py-2 text-center"><span className={`font-bold ${m.score >= 90 ? 'text-green-600' : 'text-amber-600'}`}>{m.score}/100</span></td>
                <td className="py-2 text-center text-lg">{m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
