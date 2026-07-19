export type Acuity = 'Critical' | 'High' | 'Moderate' | 'Routine';
export type Program = 'Residential' | 'PHP' | 'IOP' | 'OP';
export type BedStatus = 'Occupied' | 'Available' | 'Cleaning' | 'Hold';
export type MedClass = 'MAT' | 'Psychiatric' | 'Medical' | 'PRN';
export type MedStatus = 'Active' | 'Discontinued' | 'On Hold';

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

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  class: MedClass;
  dose: string;
  route: string;
  frequency: string;
  times: string[];
  status: MedStatus;
}

export interface VitalEntry {
  id: string;
  date: string;
  time: string;
  bp: string;
  hr: number;
  temp: number;
  o2: number;
  pain: number;
  cows?: number;
  ciwa?: number;
  recordedBy: string;
}

export const BEDS = [
  { id: '1A', status: 'Occupied' as BedStatus },
  { id: '1B', status: 'Occupied' as BedStatus },
  { id: '2A', status: 'Occupied' as BedStatus },
  { id: '2B', status: 'Occupied' as BedStatus },
  { id: '3A', status: 'Occupied' as BedStatus },
  { id: '3B', status: 'Occupied' as BedStatus },
  { id: '4A', status: 'Occupied' as BedStatus },
  { id: '4B', status: 'Occupied' as BedStatus },
  { id: '5A', status: 'Cleaning' as BedStatus },
  { id: '5B', status: 'Available' as BedStatus },
  { id: '6A', status: 'Available' as BedStatus },
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

export const RESIDENTIAL_PATIENTS = PATIENTS.filter(p => p.program === 'Residential');

export const MEDICATIONS: Record<string, Medication[]> = {
  p1: [
    { id: 'm1-1', name: 'Buprenorphine/Naloxone', genericName: 'Suboxone', class: 'MAT', dose: '16mg/4mg', route: 'SL', frequency: 'Daily AM', times: ['06:00'], status: 'Active' },
    { id: 'm1-2', name: 'Sertraline', genericName: 'Zoloft', class: 'Psychiatric', dose: '100mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
    { id: 'm1-3', name: 'Hydroxyzine', genericName: 'Vistaril', class: 'PRN', dose: '25mg', route: 'PO', frequency: 'Q6H PRN', times: ['06:00', '12:00', '18:00', '22:00'], status: 'Active' },
    { id: 'm1-4', name: 'Melatonin', class: 'Medical', dose: '5mg', route: 'PO', frequency: 'QHS', times: ['22:00'], status: 'Active' },
  ],
  p2: [
    { id: 'm2-1', name: 'Naltrexone ER', genericName: 'Vivitrol', class: 'MAT', dose: '380mg', route: 'IM', frequency: 'Monthly', times: [], status: 'Active' },
    { id: 'm2-2', name: 'Escitalopram', genericName: 'Lexapro', class: 'Psychiatric', dose: '10mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
    { id: 'm2-3', name: 'Gabapentin', genericName: 'Neurontin', class: 'Medical', dose: '300mg', route: 'PO', frequency: 'TID', times: ['08:00', '14:00', '20:00'], status: 'Active' },
    { id: 'm2-4', name: 'Thiamine (B1)', class: 'Medical', dose: '100mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
  ],
  p3: [
    { id: 'm3-1', name: 'Quetiapine', genericName: 'Seroquel', class: 'Psychiatric', dose: '50mg', route: 'PO', frequency: 'QHS', times: ['22:00'], status: 'Active' },
    { id: 'm3-2', name: 'Hydroxyzine', genericName: 'Vistaril', class: 'PRN', dose: '50mg', route: 'PO', frequency: 'Q8H PRN', times: ['08:00', '16:00', '22:00'], status: 'Active' },
    { id: 'm3-3', name: 'Multivitamin', class: 'Medical', dose: '1 tab', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
  ],
  p4: [
    { id: 'm4-1', name: 'Buprenorphine/Naloxone', genericName: 'Suboxone', class: 'MAT', dose: '8mg/2mg', route: 'SL', frequency: 'BID', times: ['06:00', '18:00'], status: 'Active' },
    { id: 'm4-2', name: 'Doxycycline', class: 'Medical', dose: '100mg', route: 'PO', frequency: 'BID', times: ['08:00', '20:00'], status: 'Active' },
    { id: 'm4-3', name: 'Lorazepam', genericName: 'Ativan', class: 'PRN', dose: '1mg', route: 'PO', frequency: 'Q6H PRN CIWA', times: ['06:00', '12:00', '18:00', '22:00'], status: 'Active' },
  ],
  p5: [
    { id: 'm5-1', name: 'Naltrexone', genericName: 'ReVia', class: 'MAT', dose: '50mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
    { id: 'm5-2', name: 'Gabapentin', genericName: 'Neurontin', class: 'Medical', dose: '600mg', route: 'PO', frequency: 'TID', times: ['08:00', '14:00', '20:00'], status: 'Active' },
    { id: 'm5-3', name: 'Thiamine (B1)', class: 'Medical', dose: '100mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
  ],
  p6: [
    { id: 'm6-1', name: 'Buprenorphine/Naloxone', genericName: 'Suboxone', class: 'MAT', dose: '8mg/2mg', route: 'SL', frequency: 'Daily AM', times: ['06:00'], status: 'Active' },
    { id: 'm6-2', name: 'Prazosin', class: 'Psychiatric', dose: '1mg', route: 'PO', frequency: 'QHS', times: ['22:00'], status: 'Active' },
    { id: 'm6-3', name: 'Sertraline', genericName: 'Zoloft', class: 'Psychiatric', dose: '50mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
  ],
  p7: [
    { id: 'm7-1', name: 'Methadone', class: 'MAT', dose: '40mg', route: 'PO', frequency: 'Daily', times: ['06:00'], status: 'Active' },
    { id: 'm7-2', name: 'Ledipasvir/Sofosbuvir', genericName: 'Harvoni', class: 'Medical', dose: '90/400mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
    { id: 'm7-3', name: 'Folic Acid', class: 'Medical', dose: '1mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
  ],
  p8: [
    { id: 'm8-1', name: 'Acamprosate', genericName: 'Campral', class: 'MAT', dose: '666mg', route: 'PO', frequency: 'TID', times: ['08:00', '14:00', '20:00'], status: 'Active' },
    { id: 'm8-2', name: 'Amlodipine', genericName: 'Norvasc', class: 'Medical', dose: '5mg', route: 'PO', frequency: 'Daily', times: ['08:00'], status: 'Active' },
    { id: 'm8-3', name: 'Metoprolol', genericName: 'Toprol', class: 'Medical', dose: '25mg', route: 'PO', frequency: 'BID', times: ['08:00', '20:00'], status: 'Active' },
    { id: 'm8-4', name: 'Chlordiazepoxide', genericName: 'Librium', class: 'PRN', dose: '25mg', route: 'PO', frequency: 'Q6H PRN CIWA', times: ['06:00', '12:00', '18:00', '22:00'], status: 'Active' },
  ],
};

export const VITALS: Record<string, VitalEntry[]> = {
  p1: [
    { id: 'v1-1', date: '10/26', time: '06:00', bp: '138/88', hr: 92, temp: 98.6, o2: 98, pain: 5, cows: 4, recordedBy: 'J. Torres, RN' },
    { id: 'v1-2', date: '10/25', time: '06:00', bp: '142/90', hr: 98, temp: 99.1, o2: 97, pain: 7, cows: 8, recordedBy: 'M. Boyd, RN' },
    { id: 'v1-3', date: '10/24', time: '06:00', bp: '148/94', hr: 105, temp: 99.4, o2: 96, pain: 7, cows: 12, recordedBy: 'J. Torres, RN' },
  ],
  p4: [
    { id: 'v4-1', date: '10/26', time: '06:00', bp: '144/92', hr: 96, temp: 98.8, o2: 97, pain: 7, cows: 10, ciwa: 8, recordedBy: 'J. Torres, RN' },
    { id: 'v4-2', date: '10/25', time: '06:00', bp: '150/94', hr: 102, temp: 99.2, o2: 96, pain: 8, cows: 14, ciwa: 12, recordedBy: 'M. Boyd, RN' },
  ],
  p5: [
    { id: 'v5-1', date: '10/26', time: '06:00', bp: '124/80', hr: 78, temp: 98.4, o2: 98, pain: 3, ciwa: 6, recordedBy: 'J. Torres, RN' },
    { id: 'v5-2', date: '10/25', time: '06:00', bp: '128/84', hr: 82, temp: 98.8, o2: 98, pain: 4, ciwa: 9, recordedBy: 'M. Boyd, RN' },
  ],
  p8: [
    { id: 'v8-1', date: '10/26', time: '06:00', bp: '158/96', hr: 88, temp: 98.6, o2: 97, pain: 4, ciwa: 9, recordedBy: 'J. Torres, RN' },
    { id: 'v8-2', date: '10/25', time: '06:00', bp: '162/98', hr: 94, temp: 98.8, o2: 96, pain: 5, ciwa: 12, recordedBy: 'M. Boyd, RN' },
  ],
};

export function acuityColor(acuity: Acuity): { text: string; bg: string; border: string } {
  switch (acuity) {
    case 'Critical': return { text: '#DC2626', bg: '#FEF2F2', border: '#DC2626' };
    case 'High':     return { text: '#EA580C', bg: '#FFF7ED', border: '#EA580C' };
    case 'Moderate': return { text: '#D97706', bg: '#FFFBEB', border: '#D97706' };
    case 'Routine':  return { text: '#2563EB', bg: '#EFF6FF', border: '#2563EB' };
  }
}

export function acuitySortOrder(acuity: Acuity): number {
  return { Critical: 0, High: 1, Moderate: 2, Routine: 3 }[acuity];
}
