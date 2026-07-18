export type LabFlag = 'Normal' | 'High' | 'Low' | 'Critical' | 'Positive' | 'Negative' | 'Pending';

export interface LabResult {
  id: string;
  panel: string;
  test: string;
  result: string;
  unit: string;
  refRange: string;
  flag: LabFlag;
  date: string;
  orderedBy: string;
}

const cmpBase = (patientId: string, date: string, doc: string, alt?: number, ast?: number): LabResult[] => [
  { id: `${patientId}-cmp-na`, panel: 'CMP', test: 'Sodium', result: '138', unit: 'mEq/L', refRange: '136–145', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-k`, panel: 'CMP', test: 'Potassium', result: '3.8', unit: 'mEq/L', refRange: '3.5–5.0', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-bun`, panel: 'CMP', test: 'BUN', result: '14', unit: 'mg/dL', refRange: '7–20', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-cr`, panel: 'CMP', test: 'Creatinine', result: '0.9', unit: 'mg/dL', refRange: '0.6–1.2', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-glu`, panel: 'CMP', test: 'Glucose', result: '95', unit: 'mg/dL', refRange: '70–100', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-alt`, panel: 'LFTs', test: 'ALT (SGPT)', result: String(alt ?? 32), unit: 'U/L', refRange: '7–56', flag: (alt ?? 32) > 56 ? 'High' : 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-ast`, panel: 'LFTs', test: 'AST (SGOT)', result: String(ast ?? 28), unit: 'U/L', refRange: '10–40', flag: (ast ?? 28) > 40 ? 'High' : 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-tb`, panel: 'LFTs', test: 'Total Bilirubin', result: '0.8', unit: 'mg/dL', refRange: '0.2–1.2', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cmp-alp`, panel: 'LFTs', test: 'Alkaline Phosphatase', result: '72', unit: 'U/L', refRange: '44–147', flag: 'Normal', date, orderedBy: doc },
];

const cbcBase = (patientId: string, date: string, doc: string): LabResult[] => [
  { id: `${patientId}-cbc-wbc`, panel: 'CBC', test: 'WBC', result: '7.2', unit: '×10³/µL', refRange: '4.5–11.0', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cbc-hgb`, panel: 'CBC', test: 'Hemoglobin', result: '13.8', unit: 'g/dL', refRange: '13.5–17.5', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cbc-plt`, panel: 'CBC', test: 'Platelets', result: '210', unit: '×10³/µL', refRange: '150–400', flag: 'Normal', date, orderedBy: doc },
  { id: `${patientId}-cbc-mcv`, panel: 'CBC', test: 'MCV', result: '88', unit: 'fL', refRange: '80–100', flag: 'Normal', date, orderedBy: doc },
];

export const MOCK_LABS: Record<string, LabResult[]> = {
  p1: [
    ...cmpBase('p1', '2023-10-14', 'Dr. Robert Chen', 28, 24),
    ...cbcBase('p1', '2023-10-14', 'Dr. Robert Chen'),
    { id: 'p1-hcv', panel: 'Infectious Disease', test: 'Hepatitis C Ab', result: 'Reactive', unit: '', refRange: 'Non-reactive', flag: 'Critical', date: '2023-10-14', orderedBy: 'Dr. Robert Chen' },
    { id: 'p1-hbv', panel: 'Infectious Disease', test: 'Hepatitis B sAg', result: 'Non-reactive', unit: '', refRange: 'Non-reactive', flag: 'Normal', date: '2023-10-14', orderedBy: 'Dr. Robert Chen' },
    { id: 'p1-hiv', panel: 'Infectious Disease', test: 'HIV 1/2 Ag/Ab', result: 'Non-reactive', unit: '', refRange: 'Non-reactive', flag: 'Normal', date: '2023-10-14', orderedBy: 'Dr. Robert Chen' },
    { id: 'p1-ua1', panel: 'Drug Screen (UDS)', test: 'Opiates', result: 'Positive', unit: '', refRange: 'Negative', flag: 'Positive', date: '2023-10-14', orderedBy: 'Dr. Robert Chen' },
    { id: 'p1-ua2', panel: 'Drug Screen (UDS)', test: 'Buprenorphine', result: 'Positive', unit: '', refRange: 'Negative (therapeutic)', flag: 'Normal', date: '2023-10-26', orderedBy: 'Dr. Robert Chen' },
    { id: 'p1-ua3', panel: 'Drug Screen (UDS)', test: 'Cocaine', result: 'Negative', unit: '', refRange: 'Negative', flag: 'Normal', date: '2023-10-26', orderedBy: 'Dr. Robert Chen' },
    { id: 'p1-tsh', panel: 'Thyroid', test: 'TSH', result: '2.1', unit: 'mIU/L', refRange: '0.4–4.0', flag: 'Normal', date: '2023-10-14', orderedBy: 'Dr. Robert Chen' },
  ],
  p2: [
    ...cmpBase('p2', '2023-09-22', 'Dr. Emily Stone', 88, 72),
    ...cbcBase('p2', '2023-09-22', 'Dr. Emily Stone'),
    { id: 'p2-ggtp', panel: 'LFTs', test: 'GGT', result: '142', unit: 'U/L', refRange: '9–48', flag: 'High', date: '2023-09-22', orderedBy: 'Dr. Emily Stone' },
    { id: 'p2-hcv', panel: 'Infectious Disease', test: 'Hepatitis C Ab', result: 'Non-reactive', unit: '', refRange: 'Non-reactive', flag: 'Normal', date: '2023-09-22', orderedBy: 'Dr. Emily Stone' },
    { id: 'p2-hiv', panel: 'Infectious Disease', test: 'HIV 1/2 Ag/Ab', result: 'Non-reactive', unit: '', refRange: 'Non-reactive', flag: 'Normal', date: '2023-09-22', orderedBy: 'Dr. Emily Stone' },
    { id: 'p2-ua1', panel: 'Drug Screen (UDS)', test: 'Ethanol', result: 'Negative', unit: '', refRange: 'Negative', flag: 'Normal', date: '2023-10-26', orderedBy: 'Dr. Emily Stone' },
    { id: 'p2-ua2', panel: 'Drug Screen (UDS)', test: 'Benzodiazepines', result: 'Negative', unit: '', refRange: 'Negative', flag: 'Normal', date: '2023-10-26', orderedBy: 'Dr. Emily Stone' },
  ],
  p5: [
    ...cmpBase('p5', '2023-10-22', 'Dr. Robert Chen', 54, 48),
    ...cbcBase('p5', '2023-10-22', 'Dr. Robert Chen'),
    { id: 'p5-ua1', panel: 'Drug Screen (UDS)', test: 'Opiates', result: 'Positive', unit: '', refRange: 'Negative', flag: 'Positive', date: '2023-10-22', orderedBy: 'Dr. Robert Chen' },
    { id: 'p5-ua2', panel: 'Drug Screen (UDS)', test: 'Cocaine metabolite', result: 'Positive', unit: '', refRange: 'Negative', flag: 'Positive', date: '2023-10-22', orderedBy: 'Dr. Robert Chen' },
    { id: 'p5-ua3', panel: 'Drug Screen (UDS)', test: 'Benzodiazepines', result: 'Positive', unit: '', refRange: 'Negative', flag: 'Positive', date: '2023-10-22', orderedBy: 'Dr. Robert Chen' },
    { id: 'p5-hcv', panel: 'Infectious Disease', test: 'Hepatitis C Ab', result: 'Reactive', unit: '', refRange: 'Non-reactive', flag: 'Critical', date: '2023-10-22', orderedBy: 'Dr. Robert Chen' },
    { id: 'p5-hiv', panel: 'Infectious Disease', test: 'HIV 1/2 Ag/Ab', result: 'Pending', unit: '', refRange: 'Non-reactive', flag: 'Pending', date: '2023-10-22', orderedBy: 'Dr. Robert Chen' },
    { id: 'p5-wbc-high', panel: 'CBC', test: 'WBC (elevated)', result: '12.8', unit: '×10³/µL', refRange: '4.5–11.0', flag: 'High', date: '2023-10-22', orderedBy: 'Dr. Robert Chen' },
  ],
  p8: [
    ...cmpBase('p8', '2023-10-20', 'Dr. Emily Stone', 22, 19),
    ...cbcBase('p8', '2023-10-20', 'Dr. Emily Stone'),
    { id: 'p8-preg', panel: 'Reproductive', test: 'Urine hCG (Pregnancy)', result: 'Negative', unit: '', refRange: 'Negative', flag: 'Normal', date: '2023-10-20', orderedBy: 'Dr. Emily Stone' },
    { id: 'p8-ua1', panel: 'Drug Screen (UDS)', test: 'Opiates', result: 'Positive', unit: '', refRange: 'Negative', flag: 'Positive', date: '2023-10-20', orderedBy: 'Dr. Emily Stone' },
    { id: 'p8-ua2', panel: 'Drug Screen (UDS)', test: 'Buprenorphine', result: 'Positive (therapeutic)', unit: '', refRange: 'Therapeutic', flag: 'Normal', date: '2023-10-26', orderedBy: 'Dr. Emily Stone' },
    { id: 'p8-hcv', panel: 'Infectious Disease', test: 'Hepatitis C Ab', result: 'Non-reactive', unit: '', refRange: 'Non-reactive', flag: 'Normal', date: '2023-10-20', orderedBy: 'Dr. Emily Stone' },
  ],
};

const defaultLabs = (patientId: string): LabResult[] => [
  ...cmpBase(patientId, '2023-10-01', 'Dr. Robert Chen', 30, 25),
  ...cbcBase(patientId, '2023-10-01', 'Dr. Robert Chen'),
  { id: `${patientId}-ua-neg`, panel: 'Drug Screen (UDS)', test: 'Multi-panel UDS', result: 'Negative', unit: '', refRange: 'Negative', flag: 'Normal', date: '2023-10-14', orderedBy: 'Dr. Robert Chen' },
];

export function getPatientLabs(patientId: string): LabResult[] {
  return MOCK_LABS[patientId] ?? defaultLabs(patientId);
}

export const LAB_PANEL_ORDER = ['Drug Screen (UDS)', 'CMP', 'LFTs', 'CBC', 'Infectious Disease', 'Thyroid', 'Reproductive'];
