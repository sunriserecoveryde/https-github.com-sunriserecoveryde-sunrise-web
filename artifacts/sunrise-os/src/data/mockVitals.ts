export interface VitalEntry {
  id: string;
  date: string;
  time: string;
  bp: string;
  hr: number;
  temp: number;
  o2: number;
  rr: number;
  weight?: number;
  ciwa?: number;   // Clinical Institute Withdrawal Assessment (alcohol)
  cows?: number;   // Clinical Opiate Withdrawal Scale
  pain: number;
  recordedBy: string;
}

const nurses = ['Jessica Torres, RN', 'Michael Boyd, RN'];

function rn(i: number) { return nurses[i % 2]; }

export const MOCK_VITALS: Record<string, VitalEntry[]> = {
  p1: [
    { id: 'v1-1', date: '2023-10-26', time: '06:00', bp: '138/88', hr: 92, temp: 98.6, o2: 98, rr: 16, weight: 178, cows: 4, pain: 5, recordedBy: rn(0) },
    { id: 'v1-2', date: '2023-10-25', time: '06:00', bp: '142/90', hr: 98, temp: 99.1, o2: 97, rr: 18, cows: 8, pain: 7, recordedBy: rn(1) },
    { id: 'v1-3', date: '2023-10-24', time: '06:00', bp: '148/94', hr: 105, temp: 99.4, o2: 96, rr: 20, cows: 12, pain: 7, recordedBy: rn(0) },
    { id: 'v1-4', date: '2023-10-23', time: '06:00', bp: '152/96', hr: 110, temp: 99.8, o2: 96, rr: 20, cows: 16, pain: 8, recordedBy: rn(1) },
    { id: 'v1-5', date: '2023-10-22', time: '06:00', bp: '156/98', hr: 114, temp: 100.1, o2: 95, rr: 22, cows: 19, pain: 9, recordedBy: rn(0) },
    { id: 'v1-6', date: '2023-10-20', time: '14:00', bp: '148/96', hr: 112, temp: 99.6, o2: 96, rr: 19, cows: 22, pain: 8, recordedBy: rn(1) },
    { id: 'v1-7', date: '2023-10-18', time: '14:00', bp: '158/100', hr: 118, temp: 100.4, o2: 94, rr: 22, weight: 182, cows: 27, pain: 9, recordedBy: rn(0) },
  ],
  p2: [
    { id: 'v2-1', date: '2023-10-26', time: '07:00', bp: '118/76', hr: 72, temp: 98.4, o2: 99, rr: 14, weight: 142, ciwa: 0, pain: 1, recordedBy: rn(0) },
    { id: 'v2-2', date: '2023-10-24', time: '07:00', bp: '120/78', hr: 74, temp: 98.2, o2: 99, rr: 14, ciwa: 0, pain: 1, recordedBy: rn(1) },
    { id: 'v2-3', date: '2023-10-22', time: '07:00', bp: '122/80', hr: 76, temp: 98.6, o2: 99, rr: 14, ciwa: 0, pain: 2, recordedBy: rn(0) },
    { id: 'v2-4', date: '2023-10-20', time: '07:00', bp: '124/82', hr: 78, temp: 98.6, o2: 98, rr: 16, ciwa: 2, pain: 2, recordedBy: rn(1) },
    { id: 'v2-5', date: '2023-10-18', time: '07:00', bp: '128/84', hr: 82, temp: 98.8, o2: 98, rr: 16, ciwa: 5, pain: 3, recordedBy: rn(0) },
  ],
  p3: [
    { id: 'v3-1', date: '2023-10-26', time: '06:00', bp: '132/84', hr: 88, temp: 98.4, o2: 98, rr: 16, weight: 165, cows: 2, pain: 4, recordedBy: rn(1) },
    { id: 'v3-2', date: '2023-10-24', time: '06:00', bp: '136/86', hr: 94, temp: 98.8, o2: 97, rr: 18, cows: 6, pain: 5, recordedBy: rn(0) },
    { id: 'v3-3', date: '2023-10-22', time: '06:00', bp: '140/88', hr: 100, temp: 99.2, o2: 97, rr: 18, cows: 9, pain: 6, recordedBy: rn(1) },
    { id: 'v3-4', date: '2023-10-20', time: '06:00', bp: '138/90', hr: 96, temp: 99.0, o2: 97, rr: 17, cows: 11, pain: 6, recordedBy: rn(0) },
    { id: 'v3-5', date: '2023-10-18', time: '06:00', bp: '142/92', hr: 104, temp: 99.6, o2: 96, rr: 20, weight: 168, cows: 14, pain: 7, recordedBy: rn(1) },
  ],
  p5: [
    { id: 'v5-1', date: '2023-10-26', time: '06:00', bp: '144/92', hr: 96, temp: 98.8, o2: 97, rr: 18, ciwa: 8, cows: 10, pain: 7, recordedBy: rn(0) },
    { id: 'v5-2', date: '2023-10-25', time: '06:00', bp: '150/94', hr: 102, temp: 99.2, o2: 96, rr: 19, ciwa: 12, cows: 14, pain: 8, recordedBy: rn(1) },
    { id: 'v5-3', date: '2023-10-24', time: '06:00', bp: '154/98', hr: 106, temp: 99.6, o2: 96, rr: 20, ciwa: 16, cows: 18, pain: 8, recordedBy: rn(0) },
    { id: 'v5-4', date: '2023-10-23', time: '06:00', bp: '158/100', hr: 112, temp: 100.0, o2: 95, rr: 22, ciwa: 20, cows: 22, pain: 9, recordedBy: rn(1) },
    { id: 'v5-5', date: '2023-10-22', time: '14:00', bp: '162/102', hr: 118, temp: 100.4, o2: 95, rr: 22, weight: 195, ciwa: 24, cows: 24, pain: 9, recordedBy: rn(0) },
  ],
  p8: [
    { id: 'v8-1', date: '2023-10-26', time: '07:00', bp: '108/68', hr: 86, temp: 97.8, o2: 98, rr: 16, weight: 115, cows: 3, pain: 6, recordedBy: rn(0) },
    { id: 'v8-2', date: '2023-10-24', time: '07:00', bp: '112/70', hr: 90, temp: 98.0, o2: 98, rr: 16, cows: 6, pain: 7, recordedBy: rn(1) },
    { id: 'v8-3', date: '2023-10-22', time: '07:00', bp: '110/72', hr: 94, temp: 98.4, o2: 97, rr: 18, cows: 10, pain: 7, recordedBy: rn(0) },
    { id: 'v8-4', date: '2023-10-20', time: '07:00', bp: '114/74', hr: 98, temp: 98.8, o2: 97, rr: 18, weight: 118, cows: 14, pain: 8, recordedBy: rn(1) },
  ],
};

const defaultVitals = (id: string): VitalEntry[] => [
  { id: `${id}-v1`, date: '2023-10-26', time: '07:00', bp: '120/78', hr: 74, temp: 98.6, o2: 99, rr: 14, weight: 155, pain: 2, recordedBy: rn(0) },
  { id: `${id}-v2`, date: '2023-10-24', time: '07:00', bp: '118/76', hr: 72, temp: 98.4, o2: 99, rr: 14, pain: 2, recordedBy: rn(1) },
  { id: `${id}-v3`, date: '2023-10-22', time: '07:00', bp: '122/78', hr: 76, temp: 98.6, o2: 98, rr: 14, pain: 3, recordedBy: rn(0) },
];

export function getPatientVitals(patientId: string): VitalEntry[] {
  return MOCK_VITALS[patientId] ?? defaultVitals(patientId);
}
