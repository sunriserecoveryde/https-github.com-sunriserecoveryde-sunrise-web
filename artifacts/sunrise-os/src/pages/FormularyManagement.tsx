import React, { useState } from 'react';
import { Screen } from '../App';
import { Search, AlertTriangle, CheckCircle, Info, Shield, Pill, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { navigate: (s: Screen, patientId?: string) => void; }

type DrugClass = 'MAT / OUD' | 'MAT / AUD' | 'Opioid Analgesic' | 'Benzodiazepine' | 'Stimulant' | 'Antidepressant' | 'Antipsychotic' | 'Mood Stabilizer' | 'Sleep Aid' | 'Muscle Relaxant' | 'Pain / NSAID' | 'Antibiotic' | 'Antiviral';
type InteractionSeverity = 'Major' | 'Moderate' | 'Minor' | 'Contraindicated';
type FormularyStatus = 'Formulary' | 'Non-formulary' | 'Restricted (MD only)' | 'Contraindicated in SUD';

interface Drug {
  id: string;
  genericName: string;
  brandName: string;
  drugClass: DrugClass;
  formularyStatus: FormularyStatus;
  schedule: 'Schedule II' | 'Schedule III' | 'Schedule IV' | 'Schedule V' | 'Non-scheduled';
  sudConsiderations: string;
  monitoringRequired: string;
  interactions: DrugInteraction[];
  commonDoseRange: string;
  notes?: string;
}

interface DrugInteraction {
  drug: string;
  severity: InteractionSeverity;
  mechanism: string;
  clinicalEffect: string;
  management: string;
}

const FORMULARY: Drug[] = [
  {
    id: 'D-001', genericName: 'Buprenorphine / Naloxone', brandName: 'Suboxone', drugClass: 'MAT / OUD',
    formularyStatus: 'Formulary', schedule: 'Schedule III',
    sudConsiderations: 'First-line MAT for OUD. Prescribers must have completed MATE Act training (as of Dec 2022). Opioid-tolerant patients only — naloxone component causes precipitated withdrawal in opioid-dependent patients if given too early. Wait until COWS ≥ 8.',
    monitoringRequired: 'COWS at induction, daily monitoring first 3 days, urine drug screen weekly, liver enzymes at baseline and q6 months, QTc if concern.',
    commonDoseRange: 'Induction: 2-4mg sublingually q1-2h. Maintenance: 8-24mg/day in 1-2 divided doses. Max: 32mg/day.',
    interactions: [
      { drug: 'Benzodiazepines (all)', severity: 'Contraindicated', mechanism: 'Additive CNS/respiratory depression', clinicalEffect: 'Respiratory depression, sedation, death. Risk dramatically increased with opioids + benzos.', management: 'Avoid concurrent use. If absolutely necessary, use lowest effective dose, shortest duration, close monitoring, naloxone Rx to patient.' },
      { drug: 'Alcohol', severity: 'Major', mechanism: 'Additive CNS depression', clinicalEffect: 'Enhanced sedation, respiratory depression, increased overdose risk', management: 'Counsel patient to avoid alcohol. If active AUD: consider naltrexone addition or referral.' },
      { drug: 'QTc-prolonging agents (e.g., quetiapine, certain antibiotics)', severity: 'Moderate', mechanism: 'Additive QTc prolongation', clinicalEffect: 'Risk of Torsades de Pointes at high doses', management: 'Baseline EKG. Avoid combinations with QTc > 450ms.' },
    ],
    notes: 'MATE Act (2022): DEA no longer requires X-Waiver; any DEA-registered prescriber may prescribe buprenorphine for OUD after completing 8-hour training.',
  },
  {
    id: 'D-002', genericName: 'Naltrexone', brandName: 'Vivitrol / ReVia', drugClass: 'MAT / OUD',
    formularyStatus: 'Formulary', schedule: 'Non-scheduled',
    sudConsiderations: 'Non-addictive opioid antagonist for OUD and AUD. Must be opioid-free for 7-10 days before first dose (oral) or 14+ days before injection — precipitated withdrawal risk. Excellent for patients not committed to abstinence from all substances. Monthly injection (Vivitrol) improves adherence.',
    monitoringRequired: 'LFTs at baseline and periodically (hepatotoxic at supratherapeutic doses). Confirm opioid-free by urine screen before dosing. Pain management: discuss alternative pain strategies.',
    commonDoseRange: 'Oral (ReVia): 50mg/day. IM injection (Vivitrol): 380mg IM gluteal q4 weeks.',
    interactions: [
      { drug: 'Opioids (all)', severity: 'Contraindicated', mechanism: 'Competitive antagonism — blocks opioid receptors completely', clinicalEffect: 'Precipitated withdrawal if opioid-dependent. Blocks therapeutic effect of opioid analgesics.', management: 'Must confirm opioid-free before first dose. Alert all treating physicians — surgical emergencies may require high-dose opioids.' },
      { drug: 'Disulfiram (Antabuse)', severity: 'Minor', mechanism: 'Additive hepatotoxicity concern', clinicalEffect: 'Increased liver toxicity risk', management: 'Monitor LFTs if used concurrently.' },
    ],
  },
  {
    id: 'D-003', genericName: 'Acamprosate', brandName: 'Campral', drugClass: 'MAT / AUD',
    formularyStatus: 'Formulary', schedule: 'Non-scheduled',
    sudConsiderations: 'GABA/glutamate modulator for AUD. Reduces protracted withdrawal-related craving. Does NOT work for active drinking — for post-detox maintenance only. No hepatic metabolism — safe for liver disease. Renally cleared — dose adjust for CrCl < 30.',
    monitoringRequired: 'Renal function (Cr/BUN) at baseline. Assess suicidal ideation (rare). Monitor treatment adherence.',
    commonDoseRange: '666mg TID (3x/day) with meals. Dose adjust: CrCl 30-50: 333mg TID. Avoid if CrCl < 30.',
    interactions: [
      { drug: 'Naltrexone', severity: 'Minor', mechanism: 'Pharmacokinetic: naltrexone increases acamprosate Cmax', clinicalEffect: 'Acamprosate levels increased — generally beneficial (COMBINE study)', management: 'No dose adjustment needed. Combination is evidence-based.' },
    ],
  },
  {
    id: 'D-004', genericName: 'Disulfiram', brandName: 'Antabuse', drugClass: 'MAT / AUD',
    formularyStatus: 'Restricted (MD only)', schedule: 'Non-scheduled',
    sudConsiderations: 'Aversive therapy — inhibits ALDH causing acetaldehyde accumulation with alcohol use (flushing, nausea, vomiting, hypotension). Only effective when patient takes it consistently. Must be abstinent from ALL alcohol (including mouthwash, cooking wine, hand sanitizer). Hepatotoxic — use with caution in liver disease. Not first-line per ASAM.',
    monitoringRequired: 'LFTs baseline and monthly x3, then quarterly. EKG if cardiac history. Full allergy history — rubber allergy associated with cross-reaction. Complete AUD history before prescribing.',
    commonDoseRange: '500mg/day x2 weeks, then 250mg/day maintenance. Max 500mg/day.',
    interactions: [
      { drug: 'Alcohol', severity: 'Contraindicated', mechanism: 'Mechanism of action — ALDH inhibition causing acetaldehyde accumulation', clinicalEffect: 'Disulfiram-ethanol reaction: flushing, nausea/vomiting, headache, palpitations, hypotension. Can be fatal.', management: 'Therapeutic mechanism. Patient must be fully informed and voluntarily consent. Must have 12-24h abstinence before first dose.' },
      { drug: 'Phenytoin (Dilantin)', severity: 'Major', mechanism: 'Disulfiram inhibits phenytoin metabolism', clinicalEffect: 'Phenytoin toxicity (nystagmus, ataxia, confusion)', management: 'Avoid or monitor phenytoin levels closely.' },
      { drug: 'Warfarin', severity: 'Moderate', mechanism: 'Disulfiram inhibits warfarin metabolism', clinicalEffect: 'Increased anticoagulation, bleeding risk', management: 'Monitor INR weekly if used concurrently.' },
    ],
  },
  {
    id: 'D-005', genericName: 'Clonidine', brandName: 'Catapres', drugClass: 'MAT / OUD',
    formularyStatus: 'Formulary', schedule: 'Non-scheduled',
    sudConsiderations: 'Alpha-2 agonist — adjunct for opioid withdrawal symptom management (anxiety, autonomic symptoms, sweating, GI symptoms). NOT an opioid — does not address craving or treat addiction. Useful off-label for opioid withdrawal when buprenorphine not available or refused.',
    monitoringRequired: 'BP monitoring (risk of hypotension — especially with standing). Heart rate. Not recommended if SBP < 90 or HR < 60.',
    commonDoseRange: '0.1-0.3mg q6-8h for withdrawal symptoms. Max 1.2mg/day in divided doses.',
    interactions: [
      { drug: 'Antihypertensives (beta-blockers, calcium channel blockers)', severity: 'Moderate', mechanism: 'Additive hypotensive effect', clinicalEffect: 'Hypotension, bradycardia', management: 'Monitor BP and HR. Hold clonidine if SBP < 90.' },
    ],
  },
  {
    id: 'D-006', genericName: 'Quetiapine', brandName: 'Seroquel', drugClass: 'Antipsychotic',
    formularyStatus: 'Restricted (MD only)', schedule: 'Non-scheduled',
    sudConsiderations: 'HIGH ABUSE POTENTIAL IN SUD POPULATION. Quetiapine is commonly crushed and snorted ("Susie Q") for sedation. Restrict access — do not prescribe for insomnia alone in SUD patients without psychiatric diagnosis. Legitimate use: psychosis, bipolar disorder, augmentation in refractory depression. Requires psychiatric evaluation before prescribing.',
    monitoringRequired: 'QTc (baseline and if dose escalation), metabolic panel (glucose, lipids, weight), EPS screening, AIMS for tardive dyskinesia.',
    commonDoseRange: 'Psychiatric indication: 25-800mg/day in divided doses. Off-label sleep: 25-50mg HS (avoid in SUD per policy).',
    interactions: [
      { drug: 'Buprenorphine', severity: 'Moderate', mechanism: 'Additive QTc prolongation; additive CNS depression', clinicalEffect: 'Increased QTc, sedation', management: 'Baseline EKG. Avoid if QTc > 450ms. Monitor closely.' },
      { drug: 'Alcohol / Benzodiazepines', severity: 'Major', mechanism: 'Additive CNS/respiratory depression', clinicalEffect: 'Excessive sedation, respiratory depression', management: 'Avoid combination. If necessary, lowest dose quetiapine only.' },
    ],
    notes: 'Sunrise Policy: Quetiapine for SUD patients requires clinical director approval and documented psychiatric indication.',
  },
  {
    id: 'D-007', genericName: 'Benzodiazepines (lorazepam, diazepam, chlordiazepoxide)', brandName: 'Ativan / Valium / Librium', drugClass: 'Benzodiazepine',
    formularyStatus: 'Restricted (MD only)', schedule: 'Schedule IV',
    sudConsiderations: 'HIGH ABUSE POTENTIAL. SUD patients (especially those with AUD, benzo use, or polysubstance use) are at elevated risk for dependence and diversion. PRIMARY legitimate use in SUD: alcohol/benzo withdrawal management (CIWA-guided protocol). NOT for anxiety management in SUD patients — use non-addictive alternatives (buspirone, SSRIs, hydroxyzine, gabapentin).',
    monitoringRequired: 'CIWA score q4h during withdrawal management. Level of sedation scale. Respiratory rate and O2 sat. Count tablets daily on MAR. Check in — check out documentation.',
    commonDoseRange: 'CIWA protocol: lorazepam 1-2mg PO/IM q4-6h PRN (CIWA ≥ 8). Diazepam loading: 10-20mg q6h for 24-48h then taper.',
    interactions: [
      { drug: 'Buprenorphine / Opioids', severity: 'Contraindicated', mechanism: 'Additive respiratory depression', clinicalEffect: 'Respiratory arrest, death. FDA Black Box Warning.', management: 'Avoid concurrent use outside of CIWA protocol. If both required: physician-supervised, monitor continuously, naloxone on unit.' },
    ],
    notes: 'Sunrise Policy: Benzodiazepines ONLY for CIWA protocol or documented benzo taper. Requires MD order. Not available PRN for anxiety in SUD program.',
  },
];

const SEVERITY_STYLE: Record<InteractionSeverity, string> = {
  'Contraindicated': 'bg-red-900 text-white',
  'Major':           'bg-red-100 text-red-800 border-red-300',
  'Moderate':        'bg-amber-100 text-amber-800 border-amber-300',
  'Minor':           'bg-blue-100 text-blue-800 border-blue-300',
};

const FORMULARY_STYLE: Record<FormularyStatus, string> = {
  'Formulary':                   'bg-green-100 text-green-700',
  'Non-formulary':               'bg-gray-100 text-gray-600',
  'Restricted (MD only)':        'bg-amber-100 text-amber-700',
  'Contraindicated in SUD':      'bg-red-100 text-red-700',
};

export function FormularyManagement({ navigate: _navigate }: Props) {
  const [tab, setTab] = useState<'Formulary' | 'Interactions' | 'Policy'>('Formulary');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<DrugClass | 'All'>('All');
  const [expandedDrug, setExpandedDrug] = useState<string | null>('D-001');
  const [interactionQuery, setInteractionQuery] = useState('');

  const filtered = FORMULARY.filter(d =>
    (filterClass === 'All' || d.drugClass === filterClass) &&
    (searchQuery === '' || d.genericName.toLowerCase().includes(searchQuery.toLowerCase()) || d.brandName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const classes = Array.from(new Set(FORMULARY.map(d => d.drugClass)));

  const interactionResults = interactionQuery.length > 2
    ? FORMULARY.flatMap(d => d.interactions
        .filter(i => i.drug.toLowerCase().includes(interactionQuery.toLowerCase()) || d.genericName.toLowerCase().includes(interactionQuery.toLowerCase()))
        .map(i => ({ drug: d, interaction: i }))
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Formulary & Drug Reference</h1>
        <p className="text-slate text-sm mt-0.5">SUD formulary · Drug interactions · Prescribing policy · MAT protocols</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Formulary Drugs', value: FORMULARY.filter(d => d.formularyStatus === 'Formulary').length, sub: 'Available on-formulary', color: 'text-green-600' },
          { label: 'Restricted', value: FORMULARY.filter(d => d.formularyStatus === 'Restricted (MD only)').length, sub: 'Require MD approval', color: 'text-amber-600' },
          { label: 'MAT Agents', value: FORMULARY.filter(d => d.drugClass.includes('MAT')).length, sub: 'Buprenorphine, naltrexone, others', color: 'text-navy' },
          { label: 'Drug Interactions', value: FORMULARY.reduce((a, d) => a + d.interactions.length, 0), sub: 'Documented in database', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-slate font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['Formulary', 'Interactions', 'Policy'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange text-orange' : 'border-transparent text-slate hover:text-navy'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Formulary' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
              <input className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm" placeholder="Search drugs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="border border-border rounded-lg px-3 py-2 text-sm" value={filterClass} onChange={e => setFilterClass(e.target.value as DrugClass | 'All')}>
              <option value="All">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {filtered.map(drug => {
            const isExpanded = expandedDrug === drug.id;
            const hasWarning = drug.formularyStatus === 'Restricted (MD only)' || drug.formularyStatus === 'Contraindicated in SUD';
            const hasContraindicated = drug.interactions.some(i => i.severity === 'Contraindicated');
            return (
              <div key={drug.id} className={`border rounded-xl overflow-hidden ${hasContraindicated ? 'border-red-200' : hasWarning ? 'border-amber-200' : 'border-border'}`}>
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedDrug(isExpanded ? null : drug.id)}>
                  <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center shrink-0"><Pill className="w-5 h-5 text-navy" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-navy text-sm">{drug.genericName}</span>
                      <span className="text-xs text-slate">({drug.brandName})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${FORMULARY_STYLE[drug.formularyStatus]}`}>{drug.formularyStatus}</span>
                      <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{drug.drugClass}</span>
                      {drug.schedule !== 'Non-scheduled' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{drug.schedule}</span>}
                      {hasContraindicated && <span className="text-[10px] bg-red-900 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />Contraindicated Interactions</span>}
                    </div>
                    <div className="text-xs text-slate mt-0.5">{drug.commonDoseRange}</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 bg-white space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">SUD Considerations</div>
                        <p className="text-sm text-navy leading-relaxed">{drug.sudConsiderations}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-1">Monitoring Required</div>
                        <p className="text-sm text-navy leading-relaxed">{drug.monitoringRequired}</p>
                        {drug.notes && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">{drug.notes}</div>
                        )}
                      </div>
                    </div>
                    {drug.interactions.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate uppercase mb-2">Interactions</div>
                        <div className="space-y-2">
                          {drug.interactions.map((intx, i) => (
                            <div key={i} className={`p-3 rounded-lg border text-xs ${SEVERITY_STYLE[intx.severity]} ${intx.severity === 'Contraindicated' ? '' : 'bg-white'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${intx.severity === 'Contraindicated' ? 'text-white' : intx.severity === 'Major' ? 'text-red-600' : 'text-amber-600'}`} />
                                <strong>{intx.drug}</strong>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${intx.severity === 'Contraindicated' ? 'bg-white text-red-900' : ''}`}>{intx.severity}</span>
                              </div>
                              <div><span className="font-semibold">Effect:</span> {intx.clinicalEffect}</div>
                              <div className="mt-0.5"><span className="font-semibold">Management:</span> {intx.management}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Interactions' && (
        <div className="space-y-4 max-w-2xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input className="w-full pl-10 pr-3 py-2.5 border border-border rounded-xl text-sm"
              placeholder="Search drug interactions (e.g. 'buprenorphine', 'benzodiazepine', 'alcohol')"
              value={interactionQuery}
              onChange={e => setInteractionQuery(e.target.value)} />
          </div>
          {interactionQuery.length > 2 && interactionResults.length === 0 && (
            <div className="text-center text-slate py-6 text-sm">No interactions found for "{interactionQuery}"</div>
          )}
          {interactionResults.map((r, i) => (
            <div key={i} className={`p-4 rounded-xl border ${r.interaction.severity === 'Contraindicated' ? 'bg-red-50 border-red-400' : r.interaction.severity === 'Major' ? 'bg-red-50/50 border-red-200' : 'border-amber-200 bg-amber-50/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-4 h-4 text-navy shrink-0" />
                <span className="font-bold text-navy">{r.drug.genericName}</span>
                <span className="text-slate">↔</span>
                <span className="font-bold text-navy">{r.interaction.drug}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${SEVERITY_STYLE[r.interaction.severity]}`}>{r.interaction.severity}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div><span className="font-semibold text-slate">Mechanism:</span> <span className="text-navy">{r.interaction.mechanism}</span></div>
                <div><span className="font-semibold text-slate">Clinical Effect:</span> <span className="text-navy">{r.interaction.clinicalEffect}</span></div>
                <div><span className="font-semibold text-slate">Management:</span> <span className="text-navy">{r.interaction.management}</span></div>
              </div>
            </div>
          ))}
          {interactionQuery.length <= 2 && (
            <div className="card">
              <h3 className="font-semibold text-navy mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" />Critical Interactions in SUD Treatment</h3>
              <div className="space-y-2 text-sm">
                {[
                  ['Opioids + Benzodiazepines', 'Contraindicated — respiratory arrest risk', 'text-red-700'],
                  ['Buprenorphine + Alcohol', 'Major — enhanced CNS/respiratory depression', 'text-red-600'],
                  ['Naltrexone + Active Opioids', 'Contraindicated — precipitated withdrawal', 'text-red-700'],
                  ['Disulfiram + Alcohol', 'Contraindicated — disulfiram-ethanol reaction (therapeutic mechanism)', 'text-amber-700'],
                  ['Quetiapine + Buprenorphine', 'Moderate — QTc prolongation, additive sedation', 'text-amber-700'],
                ].map(([pair, effect, color]) => (
                  <div key={pair} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                    <div>
                      <span className={`font-semibold ${color}`}>{pair}:</span>
                      <span className="text-slate ml-1">{effect}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Policy' && (
        <div className="max-w-2xl space-y-4">
          {[
            {
              title: 'Controlled Substance Policy',
              icon: <Shield className="w-5 h-5 text-orange" />,
              items: [
                'All Schedule II-IV medications require a valid DEA-registered physician order',
                'Benzodiazepines: use restricted to CIWA protocol management only',
                'Quetiapine: requires clinical director approval and documented psychiatric indication',
                'No PRN benzodiazepines or opioids outside of medical detox protocol',
                'Double-count all Schedule II medications at shift change — two nurses required',
                'Controlled substance discrepancies: report to DON and clinical director within 1 hour',
              ],
            },
            {
              title: 'MAT Prescribing Policy',
              icon: <Pill className="w-5 h-5 text-orange" />,
              items: [
                'Buprenorphine: any DEA-registered physician may prescribe (MATE Act, 2022)',
                'Naltrexone: must confirm opioid-free ≥ 7 days (oral) or ≥ 14 days (Vivitrol) before first dose',
                'MAT decisions made jointly by MD and clinical team at morning rounds',
                'Patient has the right to MAT — staff must not use personal bias to deny access',
                'MAT patients are not "on drugs" — address stigma immediately in training and practice',
              ],
            },
            {
              title: 'High-Risk Drug Monitoring',
              icon: <AlertTriangle className="w-5 h-5 text-orange" />,
              items: [
                'Suicide risk: quetiapine, antidepressants — monitor for increased suicidal ideation in first 2 weeks',
                'QTc monitoring: buprenorphine + QTc-prolonging agents (antipsychotics, fluoroquinolones)',
                'Liver monitoring: disulfiram, naltrexone — LFTs at baseline and periodically',
                'Respiratory monitoring: any opioid + CNS depressant combination requires O2 monitoring',
                'Naloxone access: all patients on buprenorphine or any opioid-containing medication — Narcan on unit',
              ],
            },
          ].map(section => (
            <div key={section.title} className="card">
              <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">{section.icon}{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-navy">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
