export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  class: 'MAT' | 'Psychiatric' | 'Medical' | 'PRN';
  dose: string;
  route: string;
  frequency: string;
  prescriber: string;
  startDate: string;
  status: 'Active' | 'Discontinued' | 'On Hold';
  indication: string;
  dcDate?: string;
  dcReason?: string;
  /**
   * Today's scheduled administration times in 24-h "HH:MM" format.
   * Empty / omitted for PRN, monthly, or discontinued meds.
   */
  scheduledTimes?: string[];
  /**
   * Scheduled slot identifiers (matching values from scheduledTimes) that have
   * been recorded as administered today.  Store the SLOT time, not the actual
   * wall-clock administration time, so getMARStatus can match them exactly.
   */
  administeredTimes?: string[];
}

/** Fixed "current" time used throughout the demo MAR (24-h). */
export const DEMO_MAR_TIME = '10:30';

export type MARStatus = { label: 'Given' | 'Due' | 'Overdue'; time?: string };

/**
 * Returns the most clinically relevant MAR badge for a medication at DEMO_MAR_TIME.
 * Returns null for inactive, discontinued, PRN, or unscheduled meds.
 */
export function getMARStatus(med: Medication): MARStatus | null {
  if (med.status !== 'Active') return null;
  if (!med.scheduledTimes || med.scheduledTimes.length === 0) return null;

  const now = DEMO_MAR_TIME;
  const administered = med.administeredTimes ?? [];

  // Any past-due dose that was not given → Overdue
  const overdue = med.scheduledTimes.find(t => t <= now && !administered.includes(t));
  if (overdue) return { label: 'Overdue', time: overdue };

  // Next upcoming scheduled dose today
  const nextDue = med.scheduledTimes.find(t => t > now);
  if (nextDue) return { label: 'Due', time: nextDue };

  // All scheduled times have passed and all were given
  return { label: 'Given' };
}

export const MOCK_MEDICATIONS: Record<string, Medication[]> = {
  p1: [
    { id: 'm1-1', name: 'Buprenorphine/Naloxone', genericName: 'Suboxone', class: 'MAT', dose: '16mg/4mg', route: 'Sublingual', frequency: 'Daily (AM)', prescriber: 'Dr. Robert Chen', startDate: '2023-10-14', status: 'Active', indication: 'OUD — MAT induction/stabilization', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
    { id: 'm1-2', name: 'Sertraline', genericName: 'Zoloft', class: 'Psychiatric', dose: '100mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Robert Chen', startDate: '2023-10-16', status: 'Active', indication: 'Major Depressive Disorder / PTSD', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
    { id: 'm1-3', name: 'Hydroxyzine', genericName: 'Vistaril', class: 'PRN', dose: '25mg', route: 'PO', frequency: 'Q6H PRN', prescriber: 'Dr. Robert Chen', startDate: '2023-10-14', status: 'Active', indication: 'Anxiety / insomnia' },
    { id: 'm1-4', name: 'Melatonin', class: 'Medical', dose: '5mg', route: 'PO', frequency: 'QHS', prescriber: 'Dr. Robert Chen', startDate: '2023-10-14', status: 'Active', indication: 'Sleep disturbance', scheduledTimes: ['21:00'], administeredTimes: [] },
    { id: 'm1-5', name: 'Clonidine', genericName: 'Catapres', class: 'MAT', dose: '0.1mg', route: 'PO', frequency: 'BID', prescriber: 'Dr. Robert Chen', startDate: '2023-10-14', status: 'Discontinued', indication: 'Opioid withdrawal symptoms', dcDate: '2023-10-18', dcReason: 'Suboxone at therapeutic level; withdrawal resolved' },
  ],
  p2: [
    { id: 'm2-1', name: 'Naltrexone ER', genericName: 'Vivitrol', class: 'MAT', dose: '380mg', route: 'IM', frequency: 'Monthly', prescriber: 'Dr. Emily Stone', startDate: '2023-09-22', status: 'Active', indication: 'AUD — relapse prevention (MAT)' },
    { id: 'm2-2', name: 'Escitalopram', genericName: 'Lexapro', class: 'Psychiatric', dose: '10mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Emily Stone', startDate: '2023-09-25', status: 'Active', indication: 'Generalized Anxiety Disorder', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
    { id: 'm2-3', name: 'Gabapentin', genericName: 'Neurontin', class: 'Medical', dose: '300mg', route: 'PO', frequency: 'TID', prescriber: 'Dr. Emily Stone', startDate: '2023-09-22', status: 'Active', indication: 'Anxiety / alcohol withdrawal support', scheduledTimes: ['08:00', '14:00', '20:00'], administeredTimes: ['08:00'] },
    { id: 'm2-4', name: 'Thiamine (B1)', class: 'Medical', dose: '100mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Emily Stone', startDate: '2023-09-22', status: 'Active', indication: 'Wernicke prophylaxis / nutritional', scheduledTimes: ['08:00'], administeredTimes: [] },
  ],
  p3: [
    { id: 'm3-1', name: 'Quetiapine', genericName: 'Seroquel', class: 'Psychiatric', dose: '50mg', route: 'PO', frequency: 'QHS', prescriber: 'Dr. Robert Chen', startDate: '2023-10-18', status: 'Active', indication: 'Psychosis / sleep disturbance', scheduledTimes: ['21:00'], administeredTimes: [] },
    { id: 'm3-2', name: 'Mixed Amphetamine Salts', genericName: 'Adderall — ON HOLD', class: 'PRN', dose: '10mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Robert Chen', startDate: '2023-10-18', status: 'On Hold', indication: 'ADHD — on hold pending 30d verified sobriety' },
    { id: 'm3-3', name: 'Hydroxyzine', genericName: 'Vistaril', class: 'PRN', dose: '50mg', route: 'PO', frequency: 'Q8H PRN', prescriber: 'Dr. Robert Chen', startDate: '2023-10-18', status: 'Active', indication: 'Agitation / anxiety' },
    { id: 'm3-4', name: 'Multivitamin', class: 'Medical', dose: '1 tab', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Robert Chen', startDate: '2023-10-18', status: 'Active', indication: 'Nutritional supplementation', scheduledTimes: ['08:00'], administeredTimes: ['08:30'] },
  ],
  p4: [
    { id: 'm4-1', name: 'Acamprosate', genericName: 'Campral', class: 'MAT', dose: '666mg', route: 'PO', frequency: 'TID', prescriber: 'Dr. Emily Stone', startDate: '2023-08-22', status: 'Active', indication: 'AUD — craving reduction (MAT)', scheduledTimes: ['08:00', '14:00', '20:00'], administeredTimes: ['08:00'] },
    { id: 'm4-2', name: 'Lithium Carbonate', class: 'Psychiatric', dose: '300mg', route: 'PO', frequency: 'BID', prescriber: 'Dr. Allen Hughes', startDate: '2023-08-22', status: 'Active', indication: 'Bipolar I Disorder — mood stabilization', scheduledTimes: ['08:00', '20:00'], administeredTimes: [] },
    { id: 'm4-3', name: 'Amlodipine', genericName: 'Norvasc', class: 'Medical', dose: '5mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Emily Stone', startDate: '2023-08-22', status: 'Active', indication: 'Hypertension monitoring', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
  ],
  p5: [
    { id: 'm5-1', name: 'Buprenorphine/Naloxone', genericName: 'Suboxone', class: 'MAT', dose: '8mg/2mg', route: 'Sublingual', frequency: 'BID', prescriber: 'Dr. Robert Chen', startDate: '2023-10-22', status: 'Active', indication: 'OUD — MAT induction', scheduledTimes: ['08:00', '20:00'], administeredTimes: ['08:00'] },
    { id: 'm5-2', name: 'Chlordiazepoxide', genericName: 'Librium (CIWA Taper)', class: 'MAT', dose: '50mg (tapering)', route: 'PO', frequency: 'Q6H per CIWA protocol', prescriber: 'Dr. Robert Chen', startDate: '2023-10-22', status: 'Active', indication: 'Benzodiazepine/alcohol withdrawal — CIWA protocol', scheduledTimes: ['06:00', '12:00', '18:00'], administeredTimes: ['06:00'] },
    { id: 'm5-3', name: 'Sertraline', genericName: 'Zoloft', class: 'Psychiatric', dose: '50mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Robert Chen', startDate: '2023-10-23', status: 'Active', indication: 'Major Depressive Disorder', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
    { id: 'm5-4', name: 'Cephalexin', genericName: 'Keflex', class: 'Medical', dose: '500mg', route: 'PO', frequency: 'QID × 10 days', prescriber: 'Dr. Robert Chen', startDate: '2023-10-22', status: 'Active', indication: 'Left arm abscess — antibiotic', scheduledTimes: ['08:00', '12:00', '16:00', '20:00'], administeredTimes: ['08:00'] },
  ],
  p6: [
    { id: 'm6-1', name: 'Disulfiram', genericName: 'Antabuse', class: 'MAT', dose: '500mg', route: 'PO', frequency: 'Daily (observed)', prescriber: 'Dr. Emily Stone', startDate: '2023-10-13', status: 'Active', indication: 'AUD — aversive therapy (MAT)', scheduledTimes: ['08:00'], administeredTimes: [] },
    { id: 'm6-2', name: 'Ondansetron', genericName: 'Zofran', class: 'PRN', dose: '4mg', route: 'PO/ODT', frequency: 'Q8H PRN nausea', prescriber: 'Dr. Emily Stone', startDate: '2023-10-11', status: 'Active', indication: 'Nausea (early withdrawal)' },
  ],
  p7: [
    { id: 'm7-1', name: 'Naltrexone', genericName: 'ReVia', class: 'MAT', dose: '50mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Robert Chen', startDate: '2023-10-04', status: 'Active', indication: 'Cocaine Use Disorder — craving reduction (off-label MAT)', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
    { id: 'm7-2', name: 'Bupropion XL', genericName: 'Wellbutrin XL', class: 'Psychiatric', dose: '300mg', route: 'PO', frequency: 'Daily (AM)', prescriber: 'Dr. Robert Chen', startDate: '2023-10-06', status: 'Active', indication: 'Depression / cocaine craving reduction', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
  ],
  p8: [
    { id: 'm8-1', name: 'Buprenorphine/Naloxone', genericName: 'Suboxone', class: 'MAT', dose: '8mg/2mg', route: 'Sublingual', frequency: 'Daily', prescriber: 'Dr. Emily Stone', startDate: '2023-10-20', status: 'Active', indication: 'OUD — MAT stabilization', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
    { id: 'm8-2', name: 'Fluoxetine', genericName: 'Prozac', class: 'Psychiatric', dose: '20mg', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Allen Hughes', startDate: '2023-10-22', status: 'Active', indication: 'MDD / Eating Disorder', scheduledTimes: ['08:00'], administeredTimes: ['08:00'] },
    { id: 'm8-3', name: 'Hydroxyzine', genericName: 'Vistaril', class: 'PRN', dose: '25mg', route: 'PO', frequency: 'Q8H PRN', prescriber: 'Dr. Allen Hughes', startDate: '2023-10-23', status: 'Active', indication: 'Anxiety' },
    { id: 'm8-4', name: 'Lorazepam', genericName: 'Ativan', class: 'PRN', dose: '0.5mg', route: 'PO', frequency: 'Q8H PRN — severe anxiety', prescriber: 'Dr. Allen Hughes', startDate: '2023-10-20', status: 'Discontinued', indication: 'Acute anxiety', dcDate: '2023-10-23', dcReason: 'Risk of misuse given OUD history; transitioned to hydroxyzine' },
  ],
};

export function getPatientMedications(patientId: string): Medication[] {
  return MOCK_MEDICATIONS[patientId] ?? [
    { id: `${patientId}-default`, name: 'Multivitamin', class: 'Medical', dose: '1 tab', route: 'PO', frequency: 'Daily', prescriber: 'Dr. Robert Chen', startDate: '2023-10-01', status: 'Active', indication: 'Nutritional supplementation' },
  ];
}
