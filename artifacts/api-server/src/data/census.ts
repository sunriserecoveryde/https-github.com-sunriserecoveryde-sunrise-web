export type Acuity = 'Critical' | 'High' | 'Moderate' | 'Routine';
export type Program = 'Residential' | 'PHP' | 'IOP' | 'OP';
export type BedStatus = 'Occupied' | 'Available' | 'Cleaning' | 'Hold';

export interface Bed {
  id: string;
  status: BedStatus;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'M' | 'F';
  program: Program;
  primaryDiagnosis: string;
  acuity: Acuity;
  bed?: string;
  bedStatus?: BedStatus;
  flags: string[];
  admitDate: string;
  los: number;
  counselor: string;
  cows?: number;
  ciwa?: number;
  mood: number;
  cravings: number;
  lastUa: string;
  nextAppointment: string;
  handoffNote?: string;
}

export const BEDS: Bed[] = [
  { id: '1A', status: 'Occupied' },
  { id: '1B', status: 'Occupied' },
  { id: '2A', status: 'Occupied' },
  { id: '2B', status: 'Occupied' },
  { id: '3A', status: 'Occupied' },
  { id: '3B', status: 'Occupied' },
  { id: '4A', status: 'Occupied' },
  { id: '4B', status: 'Occupied' },
  { id: '5A', status: 'Cleaning' },
  { id: '5B', status: 'Available' },
  { id: '6A', status: 'Available' },
];

export const PATIENTS: Patient[] = [
  {
    id: 'p1', mrn: 'MRN-83921', firstName: 'Marcus', lastName: 'Webb',
    age: 36, gender: 'M', program: 'Residential',
    primaryDiagnosis: 'Opioid Use Disorder', acuity: 'Critical',
    bed: '1A', bedStatus: 'Occupied',
    flags: ['AMA Risk', 'MAT Induction', 'High Cravings'],
    admitDate: '10/14', los: 12, counselor: 'S. Jenkins, LPC',
    cows: 4, mood: 4, cravings: 8, lastUa: 'Positive (BUP)',
    nextAppointment: 'Today 2:00 PM',
    handoffNote: 'COWS trending down. Suboxone at 16mg. Expressed AMA desire in AM group — counselor notified. Monitor q4h.',
  },
  {
    id: 'p2', mrn: 'MRN-72819', firstName: 'Angela', lastName: 'Reyes',
    age: 29, gender: 'F', program: 'Residential',
    primaryDiagnosis: 'Alcohol Use Disorder', acuity: 'Routine',
    bed: '1B', bedStatus: 'Occupied',
    flags: ['30-Day Milestone'],
    admitDate: '09/22', los: 34, counselor: 'D. Odom, LMFT',
    ciwa: 0, mood: 7, cravings: 2, lastUa: 'Negative',
    nextAppointment: 'Tomorrow 10:00 AM',
    handoffNote: 'Stable. 30-day chip ceremony tomorrow. Vivitrol injection due this week.',
  },
  {
    id: 'p3', mrn: 'MRN-99321', firstName: 'Devon', lastName: 'Patel',
    age: 23, gender: 'M', program: 'Residential',
    primaryDiagnosis: 'Methamphetamine Use Disorder', acuity: 'High',
    bed: '2A', bedStatus: 'Occupied',
    flags: ['Behavioral', 'Mild Paranoia'],
    admitDate: '10/18', los: 8, counselor: 'S. Jenkins, LPC',
    cows: 2, mood: 5, cravings: 6, lastUa: 'Positive (METH)',
    nextAppointment: 'Today 4:00 PM',
    handoffNote: 'Paranoid ideation decreased. No incidents this shift. Psychiatry f/u at 4pm.',
  },
  {
    id: 'p4', mrn: 'MRN-55422', firstName: 'Jamal', lastName: 'Foster',
    age: 32, gender: 'M', program: 'Residential',
    primaryDiagnosis: 'Polysubstance Use Disorder', acuity: 'High',
    bed: '2B', bedStatus: 'Occupied',
    flags: ['Court Ordered', 'Medical — Abscess'],
    admitDate: '10/22', los: 4, counselor: 'D. Odom, LMFT',
    cows: 10, ciwa: 8, mood: 3, cravings: 7, lastUa: 'Positive (OPI, COC)',
    nextAppointment: 'Today 1:00 PM',
    handoffNote: 'Dual withdrawal protocol active. COWS 10 / CIWA 8. Wound care to left arm at 1400. MD aware.',
  },
  {
    id: 'p5', mrn: 'MRN-88211', firstName: 'Elena', lastName: 'Vasquez',
    age: 39, gender: 'F', program: 'Residential',
    primaryDiagnosis: 'Alcohol Use Disorder', acuity: 'Moderate',
    bed: '3A', bedStatus: 'Occupied',
    flags: ['CIWA Protocol'],
    admitDate: '10/20', los: 6, counselor: 'M. Gonzales, LCSW',
    ciwa: 6, mood: 6, cravings: 4, lastUa: 'Negative',
    nextAppointment: 'Tomorrow 11:00 AM',
    handoffNote: 'CIWA 6, improving. Continue q4h checks. Denies tremors. Eating well.',
  },
  {
    id: 'p6', mrn: 'MRN-44102', firstName: 'Robert', lastName: 'Kim',
    age: 45, gender: 'M', program: 'Residential',
    primaryDiagnosis: 'Opioid Use Disorder / PTSD', acuity: 'Moderate',
    bed: '3B', bedStatus: 'Occupied',
    flags: ['PTSD', 'Nightmares'],
    admitDate: '10/16', los: 10, counselor: 'S. Jenkins, LPC',
    cows: 1, mood: 6, cravings: 3, lastUa: 'Positive (BUP)',
    nextAppointment: 'Today 3:30 PM',
    handoffNote: 'COWS minimal. Prazosin started for nightmares — first dose tonight. Trauma group at 1500.',
  },
  {
    id: 'p7', mrn: 'MRN-31190', firstName: 'Destiny', lastName: 'Williams',
    age: 28, gender: 'F', program: 'Residential',
    primaryDiagnosis: 'Heroin Use Disorder', acuity: 'Moderate',
    bed: '4A', bedStatus: 'Occupied',
    flags: ['Hep C Active', 'MAT — Methadone'],
    admitDate: '10/15', los: 11, counselor: 'M. Gonzales, LCSW',
    cows: 2, mood: 6, cravings: 4, lastUa: 'Positive (BUP)',
    nextAppointment: 'Nov 2, 9:00 AM',
    handoffNote: 'Methadone 40mg given at 0600. HCV medication day 11/84. No complaints.',
  },
  {
    id: 'p8', mrn: 'MRN-62877', firstName: 'Carlos', lastName: 'Mendez',
    age: 52, gender: 'M', program: 'Residential',
    primaryDiagnosis: 'Alcohol Use Disorder', acuity: 'High',
    bed: '4B', bedStatus: 'Occupied',
    flags: ['Hypertension', 'CIWA Protocol'],
    admitDate: '10/21', los: 5, counselor: 'D. Odom, LMFT',
    ciwa: 17, mood: 4, cravings: 6, lastUa: 'Negative',
    nextAppointment: 'Today 5:00 PM',
    handoffNote: 'CIWA 17 — MD notified. Librium 25mg PRN given x2. BP 162/100. Hold oral fluids. Repeat CIWA q1h.',
  },
  {
    id: 'p9', mrn: 'MRN-11029', firstName: 'Christine', lastName: "O'Brien",
    age: 48, gender: 'F', program: 'PHP',
    primaryDiagnosis: 'Alcohol Use Disorder', acuity: 'Routine',
    flags: ['Bipolar I — Stable'],
    admitDate: '08/22', los: 65, counselor: 'M. Gonzales, LCSW',
    mood: 8, cravings: 1, lastUa: 'Negative',
    nextAppointment: 'Nov 2, 9:00 AM',
    handoffNote: 'Stable. Lithium levels WNL.',
  },
  {
    id: 'p10', mrn: 'MRN-78234', firstName: 'James', lastName: 'Fletcher',
    age: 61, gender: 'M', program: 'IOP',
    primaryDiagnosis: 'Alcohol Use Disorder', acuity: 'Routine',
    flags: [],
    admitDate: '10/01', los: 25, counselor: 'D. Odom, LMFT',
    mood: 7, cravings: 2, lastUa: 'Negative',
    nextAppointment: 'Today 6:00 PM',
    handoffNote: 'No concerns. Stepping down to OP next week.',
  },
  {
    id: 'p11', mrn: 'MRN-44561', firstName: 'Sofia', lastName: 'Martinez',
    age: 33, gender: 'F', program: 'PHP',
    primaryDiagnosis: 'Cocaine Use Disorder', acuity: 'Moderate',
    flags: ['Depression Co-occurring'],
    admitDate: '10/10', los: 16, counselor: 'S. Jenkins, LPC',
    mood: 5, cravings: 5, lastUa: 'Negative',
    nextAppointment: 'Tomorrow 2:00 PM',
    handoffNote: 'PHQ-9 elevated. Psychiatry referral in process.',
  },
  {
    id: 'p12', mrn: 'MRN-22980', firstName: 'Noah', lastName: 'Thompson',
    age: 25, gender: 'M', program: 'OP',
    primaryDiagnosis: 'Cannabis Use Disorder', acuity: 'Routine',
    flags: [],
    admitDate: '09/15', los: 41, counselor: 'M. Gonzales, LCSW',
    mood: 9, cravings: 1, lastUa: 'Positive (THC)',
    nextAppointment: 'Today 7:00 PM',
    handoffNote: 'Progressing well.',
  },
];
