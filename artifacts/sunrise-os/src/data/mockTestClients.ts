// ─── TEST ENVIRONMENT — FICTIONAL DATA ONLY ───────────────────────────────────
// These clients are entirely fictional and are used exclusively for workflow
// testing and demonstration. No real patient information is stored here.
// Do not use real PHI in this file or in any testing environment.
// ──────────────────────────────────────────────────────────────────────────────

export interface TestTreatmentObjective {
  id: string;
  text: string;
  status: 'Not Started' | 'In Progress' | 'Met';
}

export interface TestTreatmentGoal {
  id: string;
  problem: string;
  longTerm: string;
  shortTermObjectives: TestTreatmentObjective[];
  interventions: string[];
  status: 'Active' | 'Met' | 'Discontinued';
  targetDate: string;
  lastReviewed: string;
}

export interface TestClient {
  id: string;
  mrn: string;          // fictional MRN
  firstName: string;
  lastName: string;
  dob: string;
  age: number;
  gender: string;
  program: 'Residential' | 'PHP' | 'IOP' | 'OP';
  primaryDiagnosis: string;
  coOccurring: string[];
  counselor: string;
  counselorCredentials: string;
  los: number;          // days in treatment
  admitDate: string;
  levelOfCare: string;
  goals: TestTreatmentGoal[];
  isFictional: true;    // always true — enforced by type
}

export const TEST_CLIENTS: TestClient[] = [
  {
    id: 'test-001',
    mrn: 'TEST-10001',
    firstName: 'Thomas',
    lastName: 'Hargrove',
    dob: '1981-03-14',
    age: 45,
    gender: 'Male',
    program: 'Residential',
    primaryDiagnosis: 'Severe Alcohol Use Disorder (F10.20)',
    coOccurring: ['Major Depressive Disorder, recurrent, moderate (F33.1)'],
    counselor: 'Jordan Rivera, LCSW',
    counselorCredentials: 'LCSW, CADC-II',
    los: 18,
    admitDate: '2026-07-04',
    levelOfCare: 'Residential (ASAM 3.5)',
    isFictional: true,
    goals: [
      {
        id: 'tg-001-1',
        problem: 'Alcohol Use Disorder',
        longTerm: 'Client will maintain sobriety and develop sustainable relapse-prevention skills to support long-term recovery.',
        shortTermObjectives: [
          { id: 'obj-001-1a', text: 'Client will identify three personal high-risk situations for relapse within two weeks.', status: 'Met' },
          { id: 'obj-001-1b', text: 'Client will demonstrate use of at least two coping skills (e.g., urge surfing, HALT) in individual sessions.', status: 'In Progress' },
          { id: 'obj-001-1c', text: 'Client will attend all scheduled group and individual sessions without unexcused absences for 14 consecutive days.', status: 'In Progress' },
        ],
        interventions: ['Motivational Interviewing', 'Cognitive Behavioral Therapy', 'Relapse Prevention Planning', 'Psychoeducation'],
        status: 'Active',
        targetDate: '2026-08-15',
        lastReviewed: '2026-07-15',
      },
      {
        id: 'tg-001-2',
        problem: 'Major Depressive Disorder',
        longTerm: 'Client will demonstrate improved mood stability and identify connections between depression and substance use.',
        shortTermObjectives: [
          { id: 'obj-001-2a', text: 'Client will complete PHQ-9 weekly and review results with counselor.', status: 'In Progress' },
          { id: 'obj-001-2b', text: 'Client will verbalize connection between depressive episodes and alcohol use in at least two individual sessions.', status: 'Not Started' },
        ],
        interventions: ['Cognitive Behavioral Therapy', 'Behavioral Activation', 'Psychoeducation on co-occurring disorders'],
        status: 'Active',
        targetDate: '2026-08-15',
        lastReviewed: '2026-07-15',
      },
    ],
  },

  {
    id: 'test-002',
    mrn: 'TEST-10002',
    firstName: 'Diana',
    lastName: 'Reyes',
    dob: '1994-09-22',
    age: 31,
    gender: 'Female',
    program: 'PHP',
    primaryDiagnosis: 'Moderate Opioid Use Disorder (F11.20)',
    coOccurring: ['Generalized Anxiety Disorder (F41.1)', 'Chronic Pain (G89.29)'],
    counselor: 'Morgan Patel, LPC',
    counselorCredentials: 'LPC, CADC-I',
    los: 9,
    admitDate: '2026-07-13',
    levelOfCare: 'Partial Hospitalization Program (ASAM 2.5)',
    isFictional: true,
    goals: [
      {
        id: 'tg-002-1',
        problem: 'Opioid Use Disorder',
        longTerm: 'Client will sustain opioid abstinence and establish MAT compliance as a foundation for long-term recovery.',
        shortTermObjectives: [
          { id: 'obj-002-1a', text: 'Client will attend all MAT appointments and take prescribed buprenorphine as directed for 30 consecutive days.', status: 'In Progress' },
          { id: 'obj-002-1b', text: 'Client will identify three non-pharmacological strategies to manage opioid cravings.', status: 'In Progress' },
        ],
        interventions: ['MAT Support Counseling', 'Motivational Interviewing', 'Harm Reduction Psychoeducation'],
        status: 'Active',
        targetDate: '2026-08-22',
        lastReviewed: '2026-07-18',
      },
      {
        id: 'tg-002-2',
        problem: 'Generalized Anxiety Disorder',
        longTerm: 'Client will develop an individualized anxiety management plan and reduce anxiety-driven substance use triggers.',
        shortTermObjectives: [
          { id: 'obj-002-2a', text: 'Client will practice diaphragmatic breathing or progressive muscle relaxation daily and report in session.', status: 'Not Started' },
          { id: 'obj-002-2b', text: 'Client will identify three situations where anxiety triggered or intensified urges to use.', status: 'In Progress' },
        ],
        interventions: ['CBT for Anxiety', 'Mindfulness-Based Relapse Prevention', 'Relaxation Training'],
        status: 'Active',
        targetDate: '2026-08-22',
        lastReviewed: '2026-07-18',
      },
    ],
  },

  {
    id: 'test-003',
    mrn: 'TEST-10003',
    firstName: 'Marcus',
    lastName: 'Bellamy',
    dob: '1998-06-05',
    age: 28,
    gender: 'Male',
    program: 'IOP',
    primaryDiagnosis: 'Moderate Stimulant Use Disorder, Cocaine (F14.20)',
    coOccurring: ['Attention-Deficit/Hyperactivity Disorder, combined presentation (F90.2)'],
    counselor: 'Samira Okonkwo, LMFT',
    counselorCredentials: 'LMFT, ICADC',
    los: 5,
    admitDate: '2026-07-17',
    levelOfCare: 'Intensive Outpatient Program (ASAM 2.1)',
    isFictional: true,
    goals: [
      {
        id: 'tg-003-1',
        problem: 'Stimulant Use Disorder',
        longTerm: 'Client will abstain from cocaine and develop a structured daily routine that reduces exposure to use triggers.',
        shortTermObjectives: [
          { id: 'obj-003-1a', text: 'Client will complete a written functional analysis of cocaine use triggers within one week.', status: 'Not Started' },
          { id: 'obj-003-1b', text: 'Client will identify three prosocial activities to replace time previously spent using.', status: 'In Progress' },
          { id: 'obj-003-1c', text: 'Client will attend all three weekly IOP sessions without unexcused absence for two consecutive weeks.', status: 'In Progress' },
        ],
        interventions: ['Motivational Enhancement Therapy', 'Cognitive Behavioral Therapy', 'Contingency Management', 'Community Reinforcement Approach'],
        status: 'Active',
        targetDate: '2026-09-01',
        lastReviewed: '2026-07-19',
      },
      {
        id: 'tg-003-2',
        problem: 'ADHD — impact on recovery',
        longTerm: 'Client will develop compensatory strategies to manage ADHD symptoms without substance use.',
        shortTermObjectives: [
          { id: 'obj-003-2a', text: 'Client will implement one organizational strategy (planner, reminders) and review effectiveness weekly.', status: 'Not Started' },
          { id: 'obj-003-2b', text: 'Client will verbalize the relationship between ADHD impulsivity and relapse risk.', status: 'Not Started' },
        ],
        interventions: ['CBT for ADHD', 'Psychoeducation', 'Skills Training'],
        status: 'Active',
        targetDate: '2026-09-01',
        lastReviewed: '2026-07-19',
      },
    ],
  },

  {
    id: 'test-004',
    mrn: 'TEST-10004',
    firstName: 'Sandra',
    lastName: 'Chen',
    dob: '1975-11-30',
    age: 50,
    gender: 'Female',
    program: 'Residential',
    primaryDiagnosis: 'Severe Alcohol Use Disorder (F10.20)',
    coOccurring: ['Post-Traumatic Stress Disorder (F43.10)', 'Insomnia Disorder (G47.00)'],
    counselor: 'Devon Williams, LCSW',
    counselorCredentials: 'LCSW, EMDR Certified',
    los: 31,
    admitDate: '2026-06-21',
    levelOfCare: 'Residential (ASAM 3.5)',
    isFictional: true,
    goals: [
      {
        id: 'tg-004-1',
        problem: 'Alcohol Use Disorder',
        longTerm: 'Client will achieve and maintain sobriety, developing a relapse-prevention plan tailored to trauma-related triggers.',
        shortTermObjectives: [
          { id: 'obj-004-1a', text: 'Client will identify five trauma-related alcohol triggers and corresponding coping strategies.', status: 'Met' },
          { id: 'obj-004-1b', text: 'Client will attend all scheduled individual and group sessions for the duration of residential stay.', status: 'In Progress' },
          { id: 'obj-004-1c', text: 'Client will complete a written relapse prevention plan addressing PTSD triggers.', status: 'In Progress' },
        ],
        interventions: ['Seeking Safety', 'Motivational Interviewing', 'Relapse Prevention Planning', 'CBT'],
        status: 'Active',
        targetDate: '2026-08-01',
        lastReviewed: '2026-07-20',
      },
      {
        id: 'tg-004-2',
        problem: 'Post-Traumatic Stress Disorder',
        longTerm: 'Client will demonstrate reduced PTSD symptom severity and improved ability to tolerate distress without substance use.',
        shortTermObjectives: [
          { id: 'obj-004-2a', text: 'Client will use grounding techniques (5-4-3-2-1, safe-place imagery) during three documented distress episodes.', status: 'In Progress' },
          { id: 'obj-004-2b', text: 'Client will complete PCL-5 bi-weekly and review symptom trajectory with counselor.', status: 'In Progress' },
          { id: 'obj-004-2c', text: 'Client will verbalize understanding of trauma\'s role in substance use in at least two individual sessions.', status: 'Met' },
        ],
        interventions: ['Seeking Safety', 'Trauma-Informed CBT', 'Grounding Techniques', 'Psychoeducation on trauma & addiction'],
        status: 'Active',
        targetDate: '2026-08-01',
        lastReviewed: '2026-07-20',
      },
    ],
  },
];
