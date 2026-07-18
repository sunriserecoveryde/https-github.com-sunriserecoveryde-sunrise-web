export type Acuity = 'Critical' | 'High' | 'Moderate' | 'Routine';
export type Program = 'Residential' | 'PHP' | 'IOP' | 'OP';
export type FlagType = 'Medical' | 'Behavioral' | 'Legal' | 'Insurance' | 'Success' | 'Psychiatric' | 'AMA' | 'Medication';

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
  format: 'BIRP' | 'DAP';
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
    admitDate: '2023-10-14',
    expectedDischarge: '2023-11-13',
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
      { id: 'n1', date: '2023-10-25 14:30', type: 'Individual', author: 'Sarah Jenkins, LPC', status: 'Signed', format: 'BIRP', content: 'Client attended 1:1 session. Expressed high cravings and desire to leave AMA. Processed consequences of leaving. Client agreed to stay for next 24 hours.' },
      { id: 'n2', date: '2023-10-24 09:00', type: 'Medical', author: 'Dr. Robert Chen', status: 'Signed', format: 'DAP', content: 'Suboxone stabilized at 16mg/day. Client reports reduced withdrawal symptoms but persistent cravings.' }
    ],
    goals: [
      { id: 'g1', category: 'Substance Use', problem: 'Inability to maintain abstinence from opioids', longTerm: 'Achieve 1 year continuous sobriety', shortTerm: 'Identify 3 craving triggers', status: 'In Progress', targetDate: '2023-11-01' }
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
    admitDate: '2023-09-22',
    expectedDischarge: '2023-12-22',
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
    admitDate: '2023-10-18',
    expectedDischarge: '2023-11-17',
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
    admitDate: '2023-08-22',
    expectedDischarge: '2023-12-01',
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
    admitDate: '2023-10-22',
    expectedDischarge: '2023-11-21',
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
    admitDate: '2023-10-11',
    expectedDischarge: '2023-11-10',
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
    admitDate: '2023-10-04',
    expectedDischarge: '2023-11-24',
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
    admitDate: '2023-10-20',
    expectedDischarge: '2023-11-19',
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

// Add 12 more mock patients dynamically to reach 20
for (let i = 9; i <= 20; i++) {
  MOCK_PATIENTS.push({
    id: `p${i}`,
    mrn: `MRN-${10000 + i * 317}`,
    firstName: `Patient${i}`,
    lastName: `Mock${i}`,
    dob: '1990-01-01',
    age: 34,
    gender: i % 2 === 0 ? 'M' : 'F',
    insurance: 'Aetna',
    program: i % 3 === 0 ? 'IOP' : (i % 2 === 0 ? 'PHP' : 'Residential'),
    primaryDiagnosis: 'Moderate Substance Use Disorder',
    coOccurring: [],
    asam: { d1: 1, d2: 1, d3: 1, d4: 2, d5: 2, d6: 2 },
    recoveryScore: 60 + (i * 2),
    amaRisk: 'Low',
    los: 10 + i,
    admitDate: '2023-10-01',
    expectedDischarge: '2023-11-30',
    counselor: 'David Odom, LMFT',
    physician: 'Dr. Robert Chen',
    flags: [],
    lastUa: 'Negative',
    mood: 6,
    craving: 3,
    notes: [],
    goals: [],
    nextAppointment: 'Tomorrow',
    bed: i % 2 !== 0 ? `${i}B` : undefined,
    status: i % 2 !== 0 ? 'Occupied' : undefined
  });
}
