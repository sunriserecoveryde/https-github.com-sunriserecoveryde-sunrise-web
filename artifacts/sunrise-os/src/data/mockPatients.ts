export type Acuity = 'Critical' | 'High' | 'Moderate' | 'Routine';
export type Program = 'Residential' | 'PHP' | 'IOP' | 'OP';
export type FlagType = 'Medical' | 'Behavioral' | 'Legal' | 'Insurance' | 'Success' | 'Psychiatric' | 'AMA' | 'Medication' | 'Risk';

export interface Flag {
  type: FlagType;
  note: string;
}

export interface ProgressNote {
  id: string;
  date: string;
  type: string;
  author: string;
  content: string;
  status: 'Signed' | 'Awaiting Co-sign' | 'Draft';
  format: 'BIRP' | 'DAP' | 'SOAP' | 'GIRP';
}

export interface TreatmentGoal {
  id: string;
  category: string;
  problem: string;
  longTerm: string;
  shortTerm: string;
  status: 'Not Started' | 'In Progress' | 'Met';
  targetDate: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  age: number;
  gender: string;
  insurance: string;
  program: Program;
  primaryDiagnosis: string;
  coOccurring: string[];
  asam: {
    d1: number;
    d2: number;
    d3: number;
    d4: number;
    d5: number;
    d6: number;
  };
  recoveryScore: number;
  amaRisk: 'High' | 'Med' | 'Low';
  los: number;
  admitDate: string;
  expectedDischarge: string;
  counselor: string;
  physician: string;
  flags: Flag[];
  lastUa: string;
  mood: number;
  craving: number;
  notes: ProgressNote[];
  goals: TreatmentGoal[];
  nextAppointment: string;
  bed?: string;
  status?: 'Occupied' | 'Available' | 'Cleaning' | 'Hold' | 'Blocked';
}

// Anonymized demo patients shown to buyer roles in the interactive demo search
export const DEMO_PATIENTS: Patient[] = [
  {
    id: 'demo-a', mrn: 'DEMO-001', firstName: 'Patient', lastName: 'A',
    dob: '1988-04-12', age: 36, gender: 'M', insurance: 'BlueCross',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['PTSD', 'Major Depressive Disorder'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 2, d5: 4, d6: 3 },
    recoveryScore: 42, amaRisk: 'High', los: 12,
    admitDate: '2026-07-14', expectedDischarge: '2026-08-13',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [{ type: 'AMA', note: 'Expressed desire to leave during morning group' }, { type: 'Risk', note: 'Overdose history × 2 — Narcan on hand in room' }, { type: 'Medication', note: 'MAT induction phase — dose not yet stabilized' }],
    lastUa: 'Positive (BUP)', mood: 4, craving: 8,
    notes: [
      { id: 'dn1a', date: '2026-07-25 14:30', type: 'Individual', author: 'Counselor (anonymized)', status: 'Signed', format: 'BIRP', content: 'Patient attended 1:1 session. Expressed high cravings and desire to leave AMA. Processed consequences of leaving. Patient agreed to stay for next 24 hours and commit to morning group. Safety plan reviewed and updated.' },
      { id: 'dn1b', date: '2026-07-24 09:00', type: 'Medical', author: 'Physician (anonymized)', status: 'Signed', format: 'DAP', content: 'MAT stabilized at therapeutic dose. Patient reports reduced withdrawal symptoms but persistent cravings. Vitals stable. Continue current regimen. Follow-up in 48 hours.' },
    ],
    goals: [
      { id: 'dg1a', category: 'Substance Use', problem: 'Inability to maintain abstinence from opioids', longTerm: 'Achieve 1 year continuous sobriety', shortTerm: 'Identify 3 craving triggers this week', status: 'In Progress', targetDate: '2026-08-01' },
      { id: 'dg1b', category: 'Safety', problem: 'AMA risk and impulsive exit-seeking behavior', longTerm: 'Complete full residential episode without AMA', shortTerm: 'Attend all scheduled groups for 7 consecutive days', status: 'In Progress', targetDate: '2026-07-31' },
    ],
    nextAppointment: 'Today, 2:00 PM', bed: '1A', status: 'Occupied'
  },
  {
    id: 'demo-b', mrn: 'DEMO-002', firstName: 'Patient', lastName: 'B',
    dob: '1995-08-22', age: 29, gender: 'F', insurance: 'Aetna',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Generalized Anxiety Disorder'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 3, d5: 2, d6: 2 },
    recoveryScore: 78, amaRisk: 'Low', los: 34,
    admitDate: '2026-06-22', expectedDischarge: '2026-09-22',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [{ type: 'Success', note: '30-day milestone reached' }],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [
      { id: 'dn2a', date: '2026-07-23 11:00', type: 'Individual', author: 'Counselor (anonymized)', status: 'Signed', format: 'DAP', content: 'Patient celebrated 30-day milestone in session. Demonstrated significant progress in identifying triggers and building sober support network. Discussed Vivitrol maintenance and long-term aftercare planning. Highly motivated and engaged. Outstanding therapeutic progress this week.' },
    ],
    goals: [
      { id: 'dg2a', category: 'Abstinence', problem: 'Alcohol use as emotional regulation', longTerm: '6 months continuous sobriety', shortTerm: 'Attend AA 3x/week and identify a sponsor', status: 'In Progress', targetDate: '2026-09-01' },
      { id: 'dg2b', category: 'Anxiety Management', problem: 'GAD symptoms interfering with recovery engagement', longTerm: 'Maintain GAD-7 score below 8 for 60 days', shortTerm: 'Practice mindfulness exercise daily', status: 'Met', targetDate: '2026-07-15' },
    ],
    nextAppointment: 'Tomorrow, 10:00 AM'
  },
  {
    id: 'demo-c', mrn: 'DEMO-003', firstName: 'Patient', lastName: 'C',
    dob: '2001-02-15', age: 23, gender: 'M', insurance: 'Cigna',
    program: 'Residential', primaryDiagnosis: 'Severe Methamphetamine Use Disorder',
    coOccurring: ['ADHD', 'Substance-Induced Psychosis'],
    asam: { d1: 1, d2: 2, d3: 3, d4: 1, d5: 4, d6: 3 },
    recoveryScore: 55, amaRisk: 'Med', los: 8,
    admitDate: '2026-07-18', expectedDischarge: '2026-08-17',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [{ type: 'Behavioral', note: 'Disruptive in evening group' }, { type: 'Psychiatric', note: 'Mild paranoia reported' }],
    lastUa: 'Positive (METH)', mood: 5, craving: 6,
    notes: [
      { id: 'dn3a', date: '2026-07-22 15:45', type: 'Behavioral', author: 'Counselor (anonymized)', status: 'Signed', format: 'BIRP', content: 'Patient became verbally disruptive during evening process group. Redirected by facilitator with limited success. Patient removed from group for de-escalation. Individual check-in completed afterward — patient endorsed mild paranoid ideation but denied SI/HI. Psychiatric team notified. Safety monitoring increased to q2h.' },
    ],
    goals: [
      { id: 'dg3a', category: 'Psychiatric Stability', problem: 'Substance-induced psychosis', longTerm: 'Remain free of psychotic symptoms for 30 days', shortTerm: 'Attend daily psychiatric check-in without refusal', status: 'In Progress', targetDate: '2026-08-17' },
      { id: 'dg3b', category: 'Abstinence', problem: 'Severe methamphetamine dependence', longTerm: 'Achieve 90 days abstinence from stimulants', shortTerm: 'Engage in SMART Recovery group 3x/week', status: 'Not Started', targetDate: '2026-10-01' },
    ],
    nextAppointment: 'Today, 4:00 PM', bed: '2B', status: 'Occupied'
  },
  {
    id: 'demo-d', mrn: 'DEMO-004', firstName: 'Patient', lastName: 'D',
    dob: '1976-11-30', age: 48, gender: 'F', insurance: 'Medicare',
    program: 'IOP', primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Bipolar I Disorder'],
    asam: { d1: 0, d2: 1, d3: 2, d4: 3, d5: 1, d6: 1 },
    recoveryScore: 85, amaRisk: 'Low', los: 65,
    admitDate: '2026-05-22', expectedDischarge: '2026-09-01',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [{ type: 'Medical', note: 'Hypertension monitoring' }],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [], goals: [], nextAppointment: 'Nov 2, 9:00 AM'
  },
  {
    id: 'demo-e', mrn: 'DEMO-005', firstName: 'Patient', lastName: 'E',
    dob: '1992-05-18', age: 32, gender: 'M', insurance: 'UnitedHealthcare',
    program: 'Residential', primaryDiagnosis: 'Severe Polysubstance Use Disorder',
    coOccurring: ['Major Depressive Disorder'],
    asam: { d1: 3, d2: 2, d3: 2, d4: 2, d5: 3, d6: 4 },
    recoveryScore: 62, amaRisk: 'Med', los: 4,
    admitDate: '2026-07-22', expectedDischarge: '2026-08-21',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [{ type: 'Legal', note: 'Court mandated treatment' }, { type: 'Medical', note: 'Active wound care' }],
    lastUa: 'Positive (OPI, COC, BZO)', mood: 3, craving: 7,
    notes: [], goals: [], nextAppointment: 'Today, 1:00 PM', bed: '3A', status: 'Occupied'
  },
  {
    id: 'demo-f', mrn: 'DEMO-006', firstName: 'Patient', lastName: 'F',
    dob: '1985-09-04', age: 39, gender: 'F', insurance: 'Self-Pay',
    program: 'Residential', primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: [],
    asam: { d1: 2, d2: 3, d3: 1, d4: 3, d5: 2, d6: 2 },
    recoveryScore: 71, amaRisk: 'Low', los: 15,
    admitDate: '2026-07-11', expectedDischarge: '2026-08-10',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [{ type: 'Insurance', note: 'Self-pay balance due' }],
    lastUa: 'Negative', mood: 6, craving: 4,
    notes: [], goals: [], nextAppointment: 'Tomorrow, 2:00 PM', bed: '4B', status: 'Occupied'
  },
  {
    id: 'demo-g', mrn: 'DEMO-007', firstName: 'Patient', lastName: 'G',
    dob: '1970-12-12', age: 53, gender: 'M', insurance: 'BlueCross',
    program: 'PHP', primaryDiagnosis: 'Severe Cocaine Use Disorder',
    coOccurring: ['Antisocial Personality Traits'],
    asam: { d1: 0, d2: 1, d3: 2, d4: 2, d5: 3, d6: 3 },
    recoveryScore: 48, amaRisk: 'Med', los: 22,
    admitDate: '2026-07-04', expectedDischarge: '2026-08-24',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [],
    lastUa: 'Negative', mood: 5, craving: 5,
    notes: [], goals: [], nextAppointment: 'Today, 11:00 AM'
  },
  {
    id: 'demo-h', mrn: 'DEMO-008', firstName: 'Patient', lastName: 'H',
    dob: '1998-03-25', age: 26, gender: 'F', insurance: 'Cigna',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['Eating Disorder', 'Severe Anxiety'],
    asam: { d1: 1, d2: 2, d3: 4, d4: 2, d5: 3, d6: 3 },
    recoveryScore: 39, amaRisk: 'High', los: 6,
    admitDate: '2026-07-20', expectedDischarge: '2026-08-19',
    counselor: 'Counselor (anonymized)', physician: 'Physician (anonymized)',
    flags: [{ type: 'Behavioral', note: 'Restricting meals' }, { type: 'Psychiatric', note: 'Severe anxiety' }],
    lastUa: 'Positive (BUP)', mood: 2, craving: 9,
    notes: [], goals: [], nextAppointment: 'Today, 3:30 PM', bed: '5A', status: 'Occupied'
  },
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    mrn: 'MRN-83921',
    firstName: 'Marcus',
    lastName: 'Webb',
    dob: '1988-04-12',
    age: 36,
    gender: 'M',
    insurance: 'BlueCross',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['PTSD', 'Major Depressive Disorder'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 2, d5: 4, d6: 3 },
    recoveryScore: 42,
    amaRisk: 'High',
    los: 12,
    admitDate: '2026-07-14',
    expectedDischarge: '2026-08-13',
    counselor: 'Sarah Jenkins, LPC',
    physician: 'Dr. Robert Chen',
    flags: [
      { type: 'AMA', note: 'Expressed desire to leave during morning group' },
      { type: 'Medication', note: 'Suboxone induction phase' }
    ],
    lastUa: 'Positive (BUP)',
    mood: 4,
    craving: 8,
    notes: [
      { id: 'n1', date: '2026-07-25 14:30', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'BIRP', content: 'Client attended 1:1 session. Expressed high cravings and desire to leave AMA. Processed consequences of leaving. Client agreed to stay for next 24 hours.' },
      { id: 'n2', date: '2026-07-24 09:00', type: 'Medical', author: 'Dr. Robert Chen', status: 'Signed', format: 'DAP', content: 'Suboxone stabilized at 16mg/day. Client reports reduced withdrawal symptoms but persistent cravings.' }
    ],
    goals: [
      { id: 'g1', category: 'Substance Use', problem: 'Inability to maintain abstinence from opioids', longTerm: 'Achieve 1 year continuous sobriety', shortTerm: 'Identify 3 craving triggers', status: 'In Progress', targetDate: '2026-08-01' }
    ],
    nextAppointment: 'Today, 2:00 PM',
    bed: '1A',
    status: 'Occupied'
  },
  {
    id: 'p2',
    mrn: 'MRN-72819',
    firstName: 'Angela',
    lastName: 'Reyes',
    dob: '1995-08-22',
    age: 29,
    gender: 'F',
    insurance: 'Aetna',
    program: 'PHP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Generalized Anxiety Disorder'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 3, d5: 2, d6: 2 },
    recoveryScore: 78,
    amaRisk: 'Low',
    los: 34,
    admitDate: '2026-06-22',
    expectedDischarge: '2026-09-22',
    counselor: 'David Odom, LMFT',
    physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Success', note: '30-day chip received' }
    ],
    lastUa: 'Negative',
    mood: 7,
    craving: 2,
    notes: [],
    goals: [],
    nextAppointment: 'Tomorrow, 10:00 AM'
  },
  {
    id: 'p3',
    mrn: 'MRN-99321',
    firstName: 'Devon',
    lastName: 'Patel',
    dob: '2001-02-15',
    age: 23,
    gender: 'M',
    insurance: 'Cigna',
    program: 'Residential',
    primaryDiagnosis: 'Severe Methamphetamine Use Disorder',
    coOccurring: ['ADHD'],
    asam: { d1: 1, d2: 2, d3: 3, d4: 1, d5: 4, d6: 3 },
    recoveryScore: 55,
    amaRisk: 'Med',
    los: 8,
    admitDate: '2026-07-18',
    expectedDischarge: '2026-08-17',
    counselor: 'Sarah Jenkins, LPC',
    physician: 'Dr. Robert Chen',
    flags: [
      { type: 'Behavioral', note: 'Disruptive in evening process group' },
      { type: 'Psychiatric', note: 'Mild paranoia reported' }
    ],
    lastUa: 'Positive (METH)',
    mood: 5,
    craving: 6,
    notes: [],
    goals: [],
    nextAppointment: 'Today, 4:00 PM',
    bed: '2B',
    status: 'Occupied'
  },
  {
    id: 'p4',
    mrn: 'MRN-11029',
    firstName: 'Christine',
    lastName: 'O\'Brien',
    dob: '1976-11-30',
    age: 48,
    gender: 'F',
    insurance: 'Medicare',
    program: 'IOP',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Bipolar I Disorder'],
    asam: { d1: 0, d2: 1, d3: 2, d4: 3, d5: 1, d6: 1 },
    recoveryScore: 85,
    amaRisk: 'Low',
    los: 65,
    admitDate: '2026-05-22',
    expectedDischarge: '2026-09-01',
    counselor: 'Maria Gonzales, LCSW',
    physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Medical', note: 'Hypertension monitoring' }
    ],
    lastUa: 'Negative',
    mood: 8,
    craving: 1,
    notes: [],
    goals: [],
    nextAppointment: 'Nov 2, 9:00 AM'
  },
  {
    id: 'p5',
    mrn: 'MRN-55422',
    firstName: 'Jamal',
    lastName: 'Foster',
    dob: '1992-05-18',
    age: 32,
    gender: 'M',
    insurance: 'UnitedHealthcare',
    program: 'Residential',
    primaryDiagnosis: 'Severe Polysubstance Use Disorder',
    coOccurring: ['Major Depressive Disorder'],
    asam: { d1: 3, d2: 2, d3: 2, d4: 2, d5: 3, d6: 4 },
    recoveryScore: 62,
    amaRisk: 'Med',
    los: 4,
    admitDate: '2026-07-22',
    expectedDischarge: '2026-08-21',
    counselor: 'David Odom, LMFT',
    physician: 'Dr. Robert Chen',
    flags: [
      { type: 'Legal', note: 'Court mandated treatment' },
      { type: 'Medical', note: 'Abscess on left arm' }
    ],
    lastUa: 'Positive (OPI, COC, BZO)',
    mood: 3,
    craving: 7,
    notes: [],
    goals: [],
    nextAppointment: 'Today, 1:00 PM',
    bed: '3A',
    status: 'Occupied'
  },
  {
    id: 'p6',
    mrn: 'MRN-88211',
    firstName: 'Elena',
    lastName: 'Vasquez',
    dob: '1985-09-04',
    age: 39,
    gender: 'F',
    insurance: 'Self-Pay',
    program: 'Residential',
    primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: [],
    asam: { d1: 2, d2: 3, d3: 1, d4: 3, d5: 2, d6: 2 },
    recoveryScore: 71,
    amaRisk: 'Low',
    los: 15,
    admitDate: '2026-07-11',
    expectedDischarge: '2026-08-10',
    counselor: 'Maria Gonzales, LCSW',
    physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Insurance', note: 'Self-pay balance due' }
    ],
    lastUa: 'Negative',
    mood: 6,
    craving: 4,
    notes: [],
    goals: [],
    nextAppointment: 'Tomorrow, 2:00 PM',
    bed: '4B',
    status: 'Occupied'
  },
  {
    id: 'p7',
    mrn: 'MRN-33991',
    firstName: 'Thomas',
    lastName: 'Keller',
    dob: '1970-12-12',
    age: 53,
    gender: 'M',
    insurance: 'BlueCross',
    program: 'PHP',
    primaryDiagnosis: 'Severe Cocaine Use Disorder',
    coOccurring: ['Antisocial Personality Traits'],
    asam: { d1: 0, d2: 1, d3: 2, d4: 2, d5: 3, d6: 3 },
    recoveryScore: 48,
    amaRisk: 'Med',
    los: 22,
    admitDate: '2026-07-04',
    expectedDischarge: '2026-08-24',
    counselor: 'Sarah Jenkins, LPC',
    physician: 'Dr. Robert Chen',
    flags: [],
    lastUa: 'Negative',
    mood: 5,
    craving: 5,
    notes: [],
    goals: [],
    nextAppointment: 'Today, 11:00 AM'
  },
  {
    id: 'p8',
    mrn: 'MRN-22104',
    firstName: 'Samantha',
    lastName: 'Choi',
    dob: '1998-03-25',
    age: 26,
    gender: 'F',
    insurance: 'Cigna',
    program: 'Residential',
    primaryDiagnosis: 'Severe Opioid Use Disorder',
    coOccurring: ['Eating Disorder'],
    asam: { d1: 1, d2: 2, d3: 4, d4: 2, d5: 3, d6: 3 },
    recoveryScore: 39,
    amaRisk: 'High',
    los: 6,
    admitDate: '2026-07-20',
    expectedDischarge: '2026-08-19',
    counselor: 'Maria Gonzales, LCSW',
    physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Behavioral', note: 'Restricting meals' },
      { type: 'Psychiatric', note: 'Severe anxiety' }
    ],
    lastUa: 'Positive (BUP)',
    mood: 2,
    craving: 9,
    notes: [],
    goals: [],
    nextAppointment: 'Today, 3:30 PM',
    bed: '5A',
    status: 'Occupied'
  }
];

// Patients p9–p20 — fully fleshed out
MOCK_PATIENTS.push(
  {
    id: 'p9', mrn: 'MRN-71204', firstName: 'Devon', lastName: 'Patel',
    dob: '1993-08-14', age: 32, gender: 'M', insurance: 'United',
    program: 'Residential', primaryDiagnosis: 'Severe Methamphetamine Use Disorder',
    coOccurring: ['Substance-Induced Psychosis', 'ADHD'],
    asam: { d1: 2, d2: 2, d3: 4, d4: 3, d5: 3, d6: 3 },
    recoveryScore: 41, amaRisk: 'High', los: 8,
    admitDate: '2026-07-10', expectedDischarge: '2026-08-07',
    counselor: 'Maria Gonzales, LCSW', physician: 'Dr. Allen Hughes',
    flags: [{ type: 'Behavioral', note: 'Paranoid ideation during groups — monitor closely' }, { type: 'Psychiatric', note: 'Substance-induced psychosis; daily psych check-in ordered' }],
    lastUa: 'Positive (METH)', mood: 4, craving: 7,
    notes: [{ id: 'n9a', date: '2026-07-17', type: 'Individual', author: 'Maria Gonzales, LCSW', status: 'Signed', format: 'BIRP', content: 'Client presented with mild paranoid ideation — believed another resident was "spying" on him. Behavioral redirection used; client redirectable. Psych notified. Safety plan reviewed. Client denied SI/HI. Agreed to stay engaged in treatment.' }],
    goals: [
      { id: 'g9a', category: 'Psychiatric Stability', problem: 'Substance-induced psychosis', longTerm: 'Remain free of psychotic symptoms for 60 days', shortTerm: 'Attend daily psychiatric check-ins', status: 'In Progress', targetDate: '2026-08-07' },
      { id: 'g9b', category: 'Abstinence', problem: 'Active methamphetamine use', longTerm: 'Achieve 90 days abstinence', shortTerm: 'Engage in MAT evaluation with Dr. Hughes', status: 'Not Started', targetDate: '2026-09-01' },
    ],
    nextAppointment: 'Today, 2:30 PM', bed: '2A', status: 'Occupied'
  },
  {
    id: 'p10', mrn: 'MRN-68452', firstName: 'Angela', lastName: 'Morrison',
    dob: '1979-03-22', age: 47, gender: 'F', insurance: 'Cigna',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Major Depressive Disorder', 'Generalized Anxiety Disorder'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 63, amaRisk: 'Low', los: 15,
    admitDate: '2026-07-03', expectedDischarge: '2026-07-31',
    counselor: 'David Odom, LMFT', physician: 'Dr. Robert Chen',
    flags: [{ type: 'Psychiatric', note: 'On antidepressant — monitor for serotonin syndrome with Naltrexone' }],
    lastUa: 'Negative', mood: 6, craving: 3,
    notes: [{ id: 'n10a', date: '2026-07-16', type: 'Individual', author: 'David Odom, LMFT', status: 'Signed', format: 'DAP', content: 'Client engaged in MI session exploring her relationship with alcohol and depression. Identified "drinking to cope with loneliness" as core trigger. Discussed Vivitrol as adjunct to Naltrexone. Client open to exploring it. Assigned journaling exercise: 3 alcohol-free coping strategies.' }],
    goals: [
      { id: 'g10a', category: 'Depression Management', problem: 'MDD with suicidal ideation history', longTerm: 'Maintain PHQ-9 score below 5 for 90 days', shortTerm: 'Attend individual therapy 3x/week', status: 'In Progress', targetDate: '2026-09-30' },
      { id: 'g10b', category: 'Abstinence', problem: 'Alcohol use as emotional regulation', longTerm: '6 months continuous sobriety', shortTerm: 'Identify 3 alcohol-free coping strategies', status: 'In Progress', targetDate: '2026-08-01' },
    ],
    nextAppointment: 'Tomorrow, 10:00 AM'
  },
  {
    id: 'p11', mrn: 'MRN-65890', firstName: 'Carlos', lastName: 'Rivera',
    dob: '1996-11-05', age: 29, gender: 'M', insurance: 'Maryland Medicaid',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder (Fentanyl)',
    coOccurring: ['Hepatitis C', 'PTSD'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 2, d5: 3, d6: 3 },
    recoveryScore: 52, amaRisk: 'Med', los: 11,
    admitDate: '2026-07-07', expectedDischarge: '2026-08-04',
    counselor: 'Sarah Jenkins, LPC', physician: 'Dr. Robert Chen',
    flags: [{ type: 'Medical', note: 'Hepatitis C — GI consult ordered; Harvoni evaluation pending' }, { type: 'Medication', note: 'Suboxone 16mg/day — induction complete, stable' }],
    lastUa: 'Positive (BUP)', mood: 6, craving: 4,
    notes: [{ id: 'n11a', date: '2026-07-15', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'BIRP', content: 'Client discussed trauma history (childhood physical abuse) for first time in group. Exhibited emotional flooding — grounding techniques utilized. Client stabilized within session. Referred for trauma-focused individual track with Dr. Hughes. Significant therapeutic milestone.' }],
    goals: [
      { id: 'g11a', category: 'MAT Compliance', problem: 'Fentanyl dependence', longTerm: 'Stable on MAT with no illicit opioid use for 6 months', shortTerm: 'Attend daily MAT administration and nursing check-in', status: 'In Progress', targetDate: '2027-01-07' },
      { id: 'g11b', category: 'Trauma Processing', problem: 'Unresolved childhood trauma driving use', longTerm: 'Complete Phase 2 EMDR trauma processing', shortTerm: 'Engage in weekly trauma-focused therapy', status: 'Not Started', targetDate: '2026-10-01' },
    ],
    nextAppointment: 'Today, 3:00 PM', bed: '3B', status: 'Occupied'
  },
  {
    id: 'p12', mrn: 'MRN-63018', firstName: 'Tasha', lastName: 'Freeman',
    dob: '1986-06-18', age: 40, gender: 'F', insurance: 'BlueCross',
    program: 'IOP', primaryDiagnosis: 'Moderate Prescription Opioid Use Disorder',
    coOccurring: ['Generalized Anxiety Disorder', 'Chronic Pain (lumbar)'],
    asam: { d1: 1, d2: 2, d3: 1, d4: 2, d5: 2, d6: 1 },
    recoveryScore: 71, amaRisk: 'Low', los: 19,
    admitDate: '2026-06-29', expectedDischarge: '2026-07-28',
    counselor: 'Maria Gonzales, LCSW', physician: 'Dr. Robert Chen',
    flags: [{ type: 'Medical', note: 'Chronic lumbar pain — non-opioid pain management plan in place' }],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [{ id: 'n12a', date: '2026-07-14', type: 'Individual', author: 'Maria Gonzales, LCSW', status: 'Signed', format: 'DAP', content: 'Client progressing well. Reported two high-risk situations over weekend — successfully utilized HALT strategy both times. Denied use. Pain levels managed with PT and non-opioid medications per pain specialist. Employment returning next month — discharge plan in progress.' }],
    goals: [
      { id: 'g12a', category: 'Pain Management', problem: 'Opioid use initiated for pain management', longTerm: 'Maintain sobriety while managing chronic pain non-opioid', shortTerm: 'Attend PT 2x/week; pain management physician consult monthly', status: 'In Progress', targetDate: '2026-09-01' },
      { id: 'g12b', category: 'Anxiety Management', problem: 'Anxiety driving prescription drug misuse', longTerm: 'Maintain GAD-7 score below 8', shortTerm: 'Practice mindfulness 15 min daily', status: 'In Progress', targetDate: '2026-08-01' },
    ],
    nextAppointment: 'Tomorrow, 9:00 AM'
  },
  {
    id: 'p13', mrn: 'MRN-60471', firstName: 'Gregory', lastName: 'Mills',
    dob: '1969-01-30', age: 57, gender: 'M', insurance: 'Humana',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Benzodiazepine Use Disorder', 'Hypertension', 'Type 2 Diabetes'],
    asam: { d1: 2, d2: 3, d3: 2, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 58, amaRisk: 'Med', los: 17,
    admitDate: '2026-07-01', expectedDischarge: '2026-07-29',
    counselor: 'David Odom, LMFT', physician: 'Dr. Emily Stone',
    flags: [{ type: 'Medical', note: 'HTN + T2DM — daily vitals; Dr. Stone managing medically' }, { type: 'Medication', note: 'Librium taper complete — stable; off benzo as of day 7' }],
    lastUa: 'Negative', mood: 6, craving: 4,
    notes: [{ id: 'n13a', date: '2026-07-17', type: 'Group Note', author: 'David Odom, LMFT', status: 'Awaiting Co-sign', format: 'BIRP', content: 'Client engaged appropriately in relapse prevention group. Shared his "rock bottom" story for the first time — emotional and impactful for group. Peers responded with strong support. Client noted he has never discussed this with family. Referred for family therapy track.' }],
    goals: [
      { id: 'g13a', category: 'Medical Stabilization', problem: 'HTN and diabetes complicated by alcohol use', longTerm: 'Maintain BP <130/80 and A1C <7.0 in sobriety', shortTerm: 'Take medications as prescribed; attend medical check daily', status: 'In Progress', targetDate: '2026-09-01' },
      { id: 'g13b', category: 'Family Relationships', problem: 'Damaged family relationships due to alcohol use', longTerm: 'Rebuild trust with spouse through 6 months consistent sobriety', shortTerm: 'Agree to family therapy sessions with David Odom', status: 'Not Started', targetDate: '2026-08-15' },
    ],
    nextAppointment: 'Today, 4:00 PM'
  },
  {
    id: 'p14', mrn: 'MRN-57823', firstName: 'Nicole', lastName: 'Washington',
    dob: '1999-09-12', age: 26, gender: 'F', insurance: 'Aetna',
    program: 'Residential', primaryDiagnosis: 'Severe Cocaine Use Disorder',
    coOccurring: ['Bipolar I Disorder', 'Insomnia'],
    asam: { d1: 2, d2: 1, d3: 3, d4: 3, d5: 3, d6: 3 },
    recoveryScore: 44, amaRisk: 'Med', los: 13,
    admitDate: '2026-07-05', expectedDischarge: '2026-08-02',
    counselor: 'Sarah Jenkins, LPC', physician: 'Dr. Allen Hughes',
    flags: [{ type: 'Psychiatric', note: 'Bipolar I — Lithium titration ongoing with Dr. Hughes' }, { type: 'Behavioral', note: 'Hypomanic episode day 5 — now stabilizing' }],
    lastUa: 'Negative', mood: 7, craving: 5,
    notes: [{ id: 'n14a', date: '2026-07-16', type: 'Psychiatric Note', author: 'Dr. Allen Hughes', status: 'Signed', format: 'DAP', content: 'Client in post-hypomanic stabilization phase. Lithium 600mg BID — level 0.7 mEq/L, therapeutic. Sleep improving. Insight into illness improving. Cocaine use previously used to manage depressive episodes. Psychoeducation on mood-SUD connection delivered. Client receptive.' }],
    goals: [
      { id: 'g14a', category: 'Mood Stabilization', problem: 'Untreated Bipolar I contributing to cocaine use', longTerm: 'Maintain euthymic mood with medication management for 90 days', shortTerm: 'Lithium level therapeutic; attend psych weekly', status: 'In Progress', targetDate: '2026-10-05' },
      { id: 'g14b', category: 'Abstinence', problem: 'Cocaine use as mood modulation', longTerm: '6 months cocaine abstinence', shortTerm: 'Identify mood triggers for cocaine craving', status: 'In Progress', targetDate: '2026-08-02' },
    ],
    nextAppointment: 'Tomorrow, 1:30 PM', bed: '4C', status: 'Occupied'
  },
  {
    id: 'p15', mrn: 'MRN-55010', firstName: 'Aaron', lastName: 'Fletcher',
    dob: '1982-04-07', age: 44, gender: 'M', insurance: 'United',
    program: 'IOP', primaryDiagnosis: 'Cannabis Use Disorder (Severe)',
    coOccurring: ['ADHD', 'Social Anxiety Disorder'],
    asam: { d1: 0, d2: 0, d3: 1, d4: 2, d5: 2, d6: 1 },
    recoveryScore: 78, amaRisk: 'Low', los: 22,
    admitDate: '2026-06-26', expectedDischarge: '2026-07-24',
    counselor: 'Maria Gonzales, LCSW', physician: 'Dr. Robert Chen',
    flags: [{ type: 'Success', note: '22 days continuous abstinence — personal record' }],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [{ id: 'n15a', date: '2026-07-17', type: 'Individual', author: 'Maria Gonzales, LCSW', status: 'Signed', format: 'DAP', content: 'Client thriving. 22 days abstinence. ADHD medication (Strattera) significantly improving focus and reducing compulsive cannabis use. Vocational goal set: pursuing promotion at work that requires drug-free status. Client highly motivated. Near-discharge planning initiated.' }],
    goals: [
      { id: 'g15a', category: 'Abstinence', problem: 'Daily cannabis use masking ADHD symptoms', longTerm: '90 days cannabis abstinence', shortTerm: 'Pass weekly UDS; engage in ADHD management strategies', status: 'In Progress', targetDate: '2026-09-25' },
      { id: 'g15b', category: 'Vocational', problem: 'Cannabis use threatening employment', longTerm: 'Maintain employment and pursue promotion', shortTerm: 'Disclose treatment to HR through EAP confidentiality protections', status: 'In Progress', targetDate: '2026-07-25' },
    ],
    nextAppointment: 'Monday, 9:00 AM'
  },
  {
    id: 'p16', mrn: 'MRN-52388', firstName: 'Priya', lastName: 'Mehta',
    dob: '1991-02-28', age: 35, gender: 'F', insurance: 'BlueCross',
    program: 'PHP', primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['Anorexia Nervosa (partial remission)', 'Perfectionism/OCD traits'],
    asam: { d1: 1, d2: 2, d3: 2, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 66, amaRisk: 'Low', los: 14,
    admitDate: '2026-07-04', expectedDischarge: '2026-08-01',
    counselor: 'Sarah Jenkins, LPC', physician: 'Dr. Emily Stone',
    flags: [{ type: 'Medical', note: 'BMI 17.8 on admit — nutritional counseling integrated into treatment' }, { type: 'Psychiatric', note: 'Anorexia in partial remission — collaborative care with eating disorder specialist' }],
    lastUa: 'Negative', mood: 7, craving: 2,
    notes: [{ id: 'n16a', date: '2026-07-15', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'BIRP', content: 'Client making meaningful connections between restricting food and restricting alcohol use as parallel control behaviors. Expressed surprise at the insight. Agreed to add eating disorder track to treatment plan. BMI up to 18.2 — nutritional progress noted. Family supportive and engaged.' }],
    goals: [
      { id: 'g16a', category: 'Nutrition & Medical', problem: 'Low BMI with active alcohol use disrupting metabolism', longTerm: 'Achieve BMI 19–21 and maintain for 90 days', shortTerm: 'Meet with dietitian 3x/week; 3 structured meals daily', status: 'In Progress', targetDate: '2026-10-01' },
      { id: 'g16b', category: 'Abstinence', problem: 'Alcohol used as substitute for food restriction', longTerm: '6 months abstinence with healthy coping', shortTerm: 'Complete CBT module on perfectionism and control', status: 'In Progress', targetDate: '2026-08-01' },
    ],
    nextAppointment: 'Tomorrow, 11:00 AM'
  },
  {
    id: 'p17', mrn: 'MRN-49902', firstName: 'Devon', lastName: 'Price',
    dob: '1974-07-04', age: 52, gender: 'M', insurance: 'Cigna',
    program: 'Residential', primaryDiagnosis: 'Polysubstance Use Disorder (Alcohol + Methamphetamine)',
    coOccurring: ['Major Depressive Disorder', 'Homelessness / Housing Instability'],
    asam: { d1: 3, d2: 2, d3: 3, d4: 2, d5: 3, d6: 4 },
    recoveryScore: 31, amaRisk: 'High', los: 6,
    admitDate: '2026-07-12', expectedDischarge: '2026-08-09',
    counselor: 'David Odom, LMFT', physician: 'Dr. Robert Chen',
    flags: [{ type: 'Legal', note: 'Pending DUI court date 8/15 — legal liaison contacted' }, { type: 'AMA', note: 'Verbalized wanting to leave 7/16 — safety plan updated' }],
    lastUa: 'Positive (METH, ALC)', mood: 3, craving: 8,
    notes: [{ id: 'n17a', date: '2026-07-16', type: 'Individual', author: 'David Odom, LMFT', status: 'Awaiting Co-sign', format: 'BIRP', content: 'Client expressed strong ambivalence about treatment. "I have nowhere to go when I leave here." Housing instability is a primary driver of AMA risk. Social worker contacted regarding transitional housing options. Motivational interviewing employed — client agreed to stay through the weekend. Safety plan signed.' }],
    goals: [
      { id: 'g17a', category: 'Housing Stability', problem: 'Homelessness driving relapse cycle', longTerm: 'Secure permanent supportive housing within 60 days', shortTerm: 'Meet with social worker for housing referrals', status: 'In Progress', targetDate: '2026-09-12' },
      { id: 'g17b', category: 'Legal', problem: 'DUI charges pending — treatment compliance required', longTerm: 'Complete treatment program per court agreement', shortTerm: 'Attend all scheduled groups and sessions', status: 'In Progress', targetDate: '2026-08-15' },
    ],
    nextAppointment: 'Today, 1:00 PM', bed: '5B', status: 'Occupied'
  },
  {
    id: 'p18', mrn: 'MRN-47213', firstName: 'Carol', lastName: 'Sutton',
    dob: '1963-12-15', age: 62, gender: 'F', insurance: 'BlueCross',
    program: 'Residential', primaryDiagnosis: 'Severe Alcohol Use Disorder',
    coOccurring: ['COPD', 'Peripheral Neuropathy', 'Late-Onset Depression'],
    asam: { d1: 2, d2: 3, d3: 2, d4: 2, d5: 2, d6: 2 },
    recoveryScore: 67, amaRisk: 'Low', los: 8,
    admitDate: '2026-07-10', expectedDischarge: '2026-08-07',
    counselor: 'Sarah Jenkins, LPC', physician: 'Dr. Emily Stone',
    flags: [{ type: 'Medical', note: 'COPD — O2 sats monitored; no smoking on premises' }],
    lastUa: 'Negative', mood: 7, craving: 3,
    notes: [{ id: 'n18a', date: '2026-07-14', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'DAP', content: 'Client shared that this is her third treatment attempt. First two were court-mandated; this one is self-initiated — significant shift in readiness. Very insightful about alcohol\'s role in her late husband\'s illness and her subsequent grief drinking. Referred for grief counseling track.' }],
    goals: [
      { id: 'g18a', category: 'Grief Processing', problem: 'Alcohol use as grief coping after spousal loss', longTerm: 'Process grief through structured counseling without alcohol', shortTerm: 'Begin grief counseling sessions twice weekly', status: 'Not Started', targetDate: '2026-09-01' },
      { id: 'g18b', category: 'Medical', problem: 'COPD exacerbated by alcohol and smoking', longTerm: 'Maintain abstinence and achieve non-smoking status for 90 days', shortTerm: 'Nicotine replacement therapy initiated', status: 'In Progress', targetDate: '2026-08-07' },
    ],
    nextAppointment: 'Today, 2:00 PM', bed: '6A', status: 'Occupied'
  },
  {
    id: 'p19', mrn: 'MRN-44512', firstName: 'Tyler', lastName: 'Brooks',
    dob: '2001-05-22', age: 25, gender: 'M', insurance: 'Aetna',
    program: 'PHP', primaryDiagnosis: 'Severe Opioid Use Disorder (Fentanyl)',
    coOccurring: ['Fentanyl-related overdose history (x2)', 'PTSD (combat-related, NG)'],
    asam: { d1: 1, d2: 1, d3: 2, d4: 3, d5: 3, d6: 2 },
    recoveryScore: 60, amaRisk: 'Low', los: 18,
    admitDate: '2026-06-30', expectedDischarge: '2026-07-28',
    counselor: 'Maria Gonzales, LCSW', physician: 'Dr. Robert Chen',
    flags: [{ type: 'Medication', note: 'Suboxone 8mg/day — stable; compliance excellent' }, { type: 'Success', note: 'Completed Phase 1 EMDR for combat-related PTSD' }],
    lastUa: 'Positive (BUP)', mood: 7, craving: 2,
    notes: [{ id: 'n19a', date: '2026-07-15', type: 'Group Note', author: 'Maria Gonzales, LCSW', status: 'Signed', format: 'BIRP', content: 'Client shared his overdose story in group for the first time. Powerful moment — peers visibly moved. Client received strong support and encouragement. His disclosure opened conversation about naloxone access and fentanyl test strips. Therapeutic milestone. Dr. Chen to discuss extended Suboxone maintenance plan.' }],
    goals: [
      { id: 'g19a', category: 'MAT Compliance', problem: 'Fentanyl OUD with two prior overdoses', longTerm: 'Maintain MAT (Suboxone) for minimum 12 months; no illicit opioid use', shortTerm: 'Daily attendance at PHP; MAT compliance 100%', status: 'In Progress', targetDate: '2027-01-01' },
      { id: 'g19b', category: 'PTSD', problem: 'Combat PTSD driving opioid use for pain and anxiety', longTerm: 'Complete full EMDR protocol for PTSD', shortTerm: 'Continue weekly trauma sessions with Dr. Hughes', status: 'In Progress', targetDate: '2026-10-01' },
    ],
    nextAppointment: 'Tomorrow, 2:00 PM'
  },
  {
    id: 'p20', mrn: 'MRN-41887', firstName: 'Michelle', lastName: 'Park',
    dob: '1976-10-09', age: 49, gender: 'F', insurance: 'Humana',
    program: 'IOP', primaryDiagnosis: 'Cocaine Use Disorder (Moderate)',
    coOccurring: ['Alcohol Use Disorder (mild)', 'PTSD (domestic violence)'],
    asam: { d1: 0, d2: 0, d3: 1, d4: 2, d5: 2, d6: 1 },
    recoveryScore: 74, amaRisk: 'Low', los: 26,
    admitDate: '2026-06-22', expectedDischarge: '2026-07-22',
    counselor: 'Sarah Jenkins, LPC', physician: 'Dr. Emily Stone',
    flags: [{ type: 'Legal', note: 'Protective order in place — no contact from ex-partner; staff aware' }, { type: 'Success', note: 'Completed DV safety planning; new residence secured' }],
    lastUa: 'Negative', mood: 8, craving: 1,
    notes: [{ id: 'n20a', date: '2026-07-17', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'BIRP', content: 'Client presenting at her strongest yet. Craving score 1/10. New apartment secured — transition from DV shelter. Identified 5 solid sober supports. Completing IOP this week. Discharge planning complete: outpatient therapist engaged, AA sponsor confirmed, safety plan updated with new address. Excellent prognosis.' }],
    goals: [
      { id: 'g20a', category: 'Safety & Housing', problem: 'DV history creating relapse-risk environment', longTerm: 'Maintain safe, stable housing for 12 months', shortTerm: 'Confirm new residence and protective order compliance', status: 'Met', targetDate: '2026-07-18' },
      { id: 'g20b', category: 'Abstinence', problem: 'Cocaine/alcohol use linked to DV relationship', longTerm: '12 months abstinence from all substances', shortTerm: 'Identify 5 sober supports; begin step work with sponsor', status: 'In Progress', targetDate: '2026-06-22' },
    ],
    nextAppointment: 'Monday, 9:00 AM'
  },
  {
    id: 'p21', mrn: 'MRN-39284', firstName: 'Rafael', lastName: 'Moreno',
    dob: '1996-03-14', age: 30, gender: 'M', insurance: 'Medicaid',
    program: 'Residential', primaryDiagnosis: 'Severe Opioid Use Disorder (Fentanyl)',
    coOccurring: ['Hepatitis C (untreated)', 'Antisocial Personality Disorder traits'],
    asam: { d1: 3, d2: 3, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 24, amaRisk: 'High', los: 3,
    admitDate: '2026-07-15', expectedDischarge: '2026-08-12',
    counselor: 'David Odom, LMFT', physician: 'Dr. Robert Chen',
    flags: [
      { type: 'Medical', note: 'HCV antibody positive — gastroenterology referral placed; Suboxone induction in progress' },
      { type: 'AMA', note: 'Attempted to leave Day 2; de-escalated by BHT; safety plan signed' },
      { type: 'Legal', note: 'Pending felony possession charge — legal aid referral initiated' }
    ],
    lastUa: 'Positive (FENT, BUP)', mood: 3, craving: 9,
    notes: [{ id: 'n21a', date: '2026-07-17', type: 'Individual', author: 'David Odom, LMFT', status: 'Awaiting Co-sign', format: 'BIRP', content: 'Client extremely guarded. Disclosed prior treatment discharge AMA x3. Primary motivation is avoiding jail time. Utilized MI to explore intrinsic values — client mentioned wanting to "be present" for his son. Small but meaningful opening. COWS 9 on assessment. Medical monitoring ongoing. Discussed HCV treatment trajectory with Dr. Chen.' }],
    goals: [
      { id: 'g21a', category: 'Withdrawal & Medical', problem: 'Fentanyl physical dependence with HCV complication', longTerm: 'Complete MAT stabilization and begin HCV treatment', shortTerm: 'Maintain COWS below 8; attend all medical appointments', status: 'In Progress', targetDate: '2026-08-01' },
      { id: 'g21b', category: 'Engagement', problem: 'Extreme treatment resistance and AMA history', longTerm: 'Complete 28-day residential episode', shortTerm: 'Attend 5 consecutive groups without avoidance', status: 'In Progress', targetDate: '2026-07-22' }
    ],
    nextAppointment: 'Today, 3:00 PM', bed: '3B', status: 'Occupied'
  },
  {
    id: 'p22', mrn: 'MRN-36751', firstName: 'Jasmine', lastName: 'Carter',
    dob: '1989-09-03', age: 36, gender: 'F', insurance: 'United',
    program: 'Residential', primaryDiagnosis: 'Stimulant Use Disorder (Methamphetamine, Severe)',
    coOccurring: ['Bipolar I Disorder', 'Psychosis NOS (stimulant-induced, resolving)'],
    asam: { d1: 2, d2: 2, d3: 3, d4: 3, d5: 4, d6: 3 },
    recoveryScore: 35, amaRisk: 'Med', los: 10,
    admitDate: '2026-07-08', expectedDischarge: '2026-08-05',
    counselor: 'Maria Gonzales, LCSW', physician: 'Dr. Allen Hughes',
    flags: [
      { type: 'Psychiatric', note: 'Stimulant-induced psychosis: auditory hallucinations resolving on Risperdal 2mg QHS — psychiatry monitoring' },
      { type: 'Behavioral', note: 'Boundary issues with male peers — single-gender group recommended' }
    ],
    lastUa: 'Positive (METH)', mood: 5, craving: 6,
    notes: [{ id: 'n22a', date: '2026-07-16', type: 'Psychiatric Eval', author: 'Dr. Allen Hughes', status: 'Signed', format: 'DAP', content: 'Follow-up psychiatric evaluation Day 8. Auditory hallucinations reduced from "constant" to "occasional whispers" since Risperdal initiation. No active delusions. Affect improving — brighter than Day 1. Mood cycling consistent with Bipolar I. Will continue Risperdal 2mg QHS and initiate Lamictal titration. Risk: not imminent. Manic episode screening negative.' }],
    goals: [
      { id: 'g22a', category: 'Psychiatric Stability', problem: 'Bipolar I + stimulant psychosis destabilizing functioning', longTerm: 'Achieve psychiatric stability and maintain for 6 months off METH', shortTerm: 'Medication compliance 100%; hallucinations resolved before discharge', status: 'In Progress', targetDate: '2026-08-05' },
      { id: 'g22b', category: 'Abstinence', problem: 'METH as primary substance — 5-year daily use', longTerm: '12 months METH abstinence with ongoing MAT support', shortTerm: 'Complete all 3 weekly gender-specific process groups', status: 'In Progress', targetDate: '2026-09-01' }
    ],
    nextAppointment: 'Tomorrow, 10:00 AM', bed: '4A', status: 'Occupied'
  },
  {
    id: 'p23', mrn: 'MRN-34128', firstName: 'William', lastName: 'Greer',
    dob: '1958-01-29', age: 68, gender: 'M', insurance: 'Medicare',
    program: 'Residential', primaryDiagnosis: 'Severe Alcohol Use Disorder (Relapse)',
    coOccurring: ['Cirrhosis (Child-Pugh A)', 'Type 2 Diabetes', 'Coronary Artery Disease'],
    asam: { d1: 2, d2: 3, d3: 2, d4: 2, d5: 2, d6: 2 },
    recoveryScore: 55, amaRisk: 'Low', los: 5,
    admitDate: '2026-07-13', expectedDischarge: '2026-08-10',
    counselor: 'Sarah Jenkins, LPC', physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Medical', note: 'Cirrhosis — LFTs elevated; no acetaminophen products; daily vitals; fall risk' },
      { type: 'Medical', note: 'Diabetes — carb-controlled meals ordered; glucose monitoring TID' }
    ],
    lastUa: 'Negative', mood: 6, craving: 4,
    notes: [{ id: 'n23a', date: '2026-07-15', type: 'Medical', author: 'Dr. Emily Stone', status: 'Signed', format: 'DAP', content: 'Day 3 admission. CIWA protocol complete — score dropped from 18 to 4. Librium taper completed. LFTs trending down. AST 188 (was 410 on admit). Glucose 142 — dietary adjustments working. Fall risk remains Moderate — bed alarm in place. Echo results from last year reviewed: EF 50%, no contraindication to current medication plan.' }],
    goals: [
      { id: 'g23a', category: 'Medical', problem: 'Cirrhosis risk escalation with continued alcohol use', longTerm: 'Abstain from alcohol — liver function stabilization', shortTerm: 'Complete medical detox; liver enzyme normalization within 2 weeks', status: 'In Progress', targetDate: '2026-07-29' },
      { id: 'g23b', category: 'Relapse Prevention', problem: 'Fourth relapse in 10 years — pattern of abstinence followed by isolation', longTerm: 'Engage with AA home group for 12+ months post-discharge', shortTerm: 'Identify specific triggers from this relapse episode in session', status: 'Not Started', targetDate: '2026-08-10' }
    ],
    nextAppointment: 'Today, 4:00 PM', bed: '6B', status: 'Occupied'
  },
  {
    id: 'p24', mrn: 'MRN-31602', firstName: 'Keisha', lastName: 'Watkins',
    dob: '1993-06-17', age: 33, gender: 'F', insurance: 'Cigna',
    program: 'PHP', primaryDiagnosis: 'Prescription Opioid Use Disorder (Moderate)',
    coOccurring: ['Fibromyalgia', 'Somatic Symptom Disorder', 'Depression'],
    asam: { d1: 1, d2: 1, d3: 1, d4: 2, d5: 2, d6: 2 },
    recoveryScore: 69, amaRisk: 'Low', los: 21,
    admitDate: '2026-06-27', expectedDischarge: '2026-07-25',
    counselor: 'Maria Gonzales, LCSW', physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Medical', note: 'Fibromyalgia — pain management integrated into treatment plan; non-opioid pain protocol active' },
      { type: 'Medication', note: 'Buprenorphine 4mg/day — stable; pain management goals being addressed concurrently' }
    ],
    lastUa: 'Positive (BUP)', mood: 7, craving: 3,
    notes: [{ id: 'n24a', date: '2026-07-14', type: 'Individual', author: 'Maria Gonzales, LCSW', status: 'Signed', format: 'BIRP', content: 'Client making strong connections between somatic pain flares and emotional distress. Identified 3 body-based coping strategies from mindfulness module. Reports pain at 4/10 today without opioids — first time in 4 years. Motivated and engaged. Discharge in ~10 days — aftercare planning initiated. Outpatient pain specialist referral sent.' }],
    goals: [
      { id: 'g24a', category: 'Pain Management', problem: 'Opioid use intertwined with fibromyalgia pain — difficulty distinguishing dependence from pain relief', longTerm: 'Manage fibromyalgia without opioids for 6 months', shortTerm: 'Complete pain management module; implement 2 non-pharmacological strategies daily', status: 'In Progress', targetDate: '2026-09-27' },
      { id: 'g24b', category: 'MAT Taper', problem: 'Buprenorphine initiated for opioid dependence; taper planned', longTerm: 'Complete buprenorphine taper over 6–12 months as pain permits', shortTerm: 'Maintain stable dose and 100% compliance through discharge', status: 'In Progress', targetDate: '2026-07-25' }
    ],
    nextAppointment: 'Monday, 10:00 AM'
  },
  {
    id: 'p25', mrn: 'MRN-29157', firstName: 'Antoine', lastName: 'Marshall',
    dob: '1985-11-02', age: 40, gender: 'M', insurance: 'BlueCross',
    program: 'IOP', primaryDiagnosis: 'Opioid Use Disorder (Heroin, Moderate — stable on MAT)',
    coOccurring: ['HIV+ (undetectable)', 'Generalized Anxiety Disorder'],
    asam: { d1: 0, d2: 1, d3: 1, d4: 2, d5: 2, d6: 1 },
    recoveryScore: 82, amaRisk: 'Low', los: 35,
    admitDate: '2026-06-13', expectedDischarge: '2026-07-18',
    counselor: 'David Odom, LMFT', physician: 'Dr. Robert Chen',
    flags: [
      { type: 'Medical', note: 'HIV+ undetectable — infectious disease clinic coordinating care; ART continued' },
      { type: 'Success', note: 'Longest sober streak in 12 years: 35 days' }
    ],
    lastUa: 'Negative', mood: 9, craving: 1,
    notes: [{ id: 'n25a', date: '2026-07-14', type: 'Individual', author: 'David Odom, LMFT', status: 'Signed', format: 'DAP', content: 'Final week of IOP. Client in exceptional shape — mood 9/10, cravings nearly absent. HIV viral load undetectable; infectious disease team satisfied. Employment restored: returning to logistics coordinator role next week. Five-year chip ceremony planned at AA home group. Discharge summary initiated; outpatient therapy with Dr. Patel confirmed. Outstanding outcome.' }],
    goals: [
      { id: 'g25a', category: 'Abstinence', problem: 'Heroin OUD — 12-year history; multiple treatment episodes', longTerm: '1 year heroin-free on MAT', shortTerm: 'Complete IOP program; attend AA 4x/week', status: 'In Progress', targetDate: '2026-06-13' },
      { id: 'g25b', category: 'Medical Integration', problem: 'HIV care coordination historically disrupted by active use', longTerm: 'Maintain undetectable viral load with consistent ART compliance', shortTerm: 'Attend all infectious disease appointments; ART compliance 100%', status: 'Met', targetDate: '2026-07-18' }
    ],
    nextAppointment: 'Today (Discharge), 11:00 AM'
  },
  {
    id: 'p26', mrn: 'MRN-26803', firstName: 'Sandra', lastName: 'Dupree',
    dob: '1971-07-30', age: 54, gender: 'F', insurance: 'Humana',
    program: 'PHP', primaryDiagnosis: 'Alcohol Use Disorder (Severe) + Benzodiazepine Use Disorder',
    coOccurring: ['Panic Disorder', 'Insomnia Disorder', 'Hypertension'],
    asam: { d1: 2, d2: 2, d3: 2, d4: 2, d5: 3, d6: 2 },
    recoveryScore: 58, amaRisk: 'Low', los: 12,
    admitDate: '2026-07-06', expectedDischarge: '2026-08-03',
    counselor: 'Sarah Jenkins, LPC', physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Medical', note: 'Benzo taper: Valium equivalent taper protocol — Week 2 of 4; vitals stable' },
      { type: 'Psychiatric', note: 'Panic disorder — benzodiazepine use began as self-medication; CBT for panic now primary treatment' }
    ],
    lastUa: 'Negative', mood: 7, craving: 3,
    notes: [{ id: 'n26a', date: '2026-07-16', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'BIRP', content: 'Client making strong progress in Week 2. Benzo taper on schedule. Panic attacks reduced from daily to 2 in past week using diaphragmatic breathing and progressive muscle relaxation. Client described feeling "like myself again for the first time in 5 years." Alcohol cravings minimal — primary challenge remains anxiety management. Sleep improving: 5.5 hours without medication last night.' }],
    goals: [
      { id: 'g26a', category: 'Detox', problem: 'Dual alcohol and benzo dependence — cross-tolerance complicates taper', longTerm: 'Complete medically supervised benzo taper without seizure or rebound', shortTerm: 'Complete Week 2 of Valium taper; vitals checked BID', status: 'In Progress', targetDate: '2026-07-28' },
      { id: 'g26b', category: 'Anxiety Management', problem: 'Panic disorder driving benzodiazepine use — need non-pharmacological replacement', longTerm: 'Manage panic disorder with CBT techniques; no benzodiazepines for 6 months', shortTerm: 'Complete CBT Panic Module (10 sessions); use coping skills during 2 panic episodes', status: 'In Progress', targetDate: '2026-08-03' }
    ],
    nextAppointment: 'Tomorrow, 9:30 AM'
  },

  // ── Demo patient — IOP pending intake for live walkthroughs ──────────────
  {
    id: 'p_demo', mrn: 'MRN-00001', firstName: 'Jonny', lastName: 'Quest',
    dob: '1990-01-15', age: 36, gender: 'M', insurance: 'CareFirst BlueCross BlueShield',
    program: 'IOP',
    primaryDiagnosis: 'Alcohol Use Disorder (Moderate)',
    coOccurring: ['Generalized Anxiety Disorder'],
    asam: { d1: 1, d2: 0, d3: 2, d4: 2, d5: 2, d6: 1 },
    recoveryScore: 55, amaRisk: 'Low', los: 0,
    admitDate: '2026-07-20', expectedDischarge: '2026-10-20',
    counselor: 'Sarah Jenkins, LPC, CAC-AD',
    physician: 'Dr. Emily Stone',
    flags: [
      { type: 'Behavioral', note: '🧪 Demo patient — intake complete. Complete the clinical chart in-session. All entered data resets on page refresh.' },
    ],
    lastUa: '— Pending at Intake —', mood: 6, craving: 4,
    notes: [],
    goals: [],
    nextAppointment: '2026-07-22, 10:00 AM — IOP Orientation',
    status: 'Occupied',
  }
);
