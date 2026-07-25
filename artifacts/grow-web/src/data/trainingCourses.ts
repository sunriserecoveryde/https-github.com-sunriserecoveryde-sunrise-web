export type TrainingCategory =
  | 'Ethics'
  | 'Clinical Documentation'
  | 'Motivational Interviewing'
  | 'Relapse Prevention'
  | 'Group Facilitation'
  | 'Trauma-Informed Care'
  | 'Case Management'
  | 'Family Engagement'
  | 'ROSC'
  | 'Clinical Leadership'
  | 'Staff Development'
  | 'Compliance & QA';

export type DeliveryFormat = 'Live Webinar' | 'Self-Paced' | 'Certificate Program' | 'CEU Program' | 'On-Site';

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  delivery: DeliveryFormat;
  ceuCredits?: number;
  duration: string;
  level: 'Foundational' | 'Intermediate' | 'Advanced' | 'All Levels';
  instructor?: string;
  nextSession?: string;
  featured?: boolean;
}

export const trainingCourses: TrainingCourse[] = [
  {
    id: "tc1",
    title: "Ethics in Behavioral Health: Dual Relationships, Confidentiality & Scope",
    description: "A foundational ethics course covering the NAADAC Code of Ethics, dual relationship management, limits of confidentiality under 42 CFR Part 2, mandated reporting obligations, and maintaining appropriate therapeutic boundaries in residential settings.",
    category: "Ethics",
    delivery: "CEU Program",
    ceuCredits: 6,
    duration: "6 hours",
    level: "Foundational",
    instructor: "Dr. Angela Reeves, LCSW",
    featured: true,
  },
  {
    id: "tc2",
    title: "Clinical Documentation Mastery: BIRP, DAP & SOAP Notes",
    description: "A deep-dive into the three most common clinical note formats used in addiction treatment. Covers how to write defensible notes, avoid common audit pitfalls, document medical necessity, and meet ASAM criteria in every record.",
    category: "Clinical Documentation",
    delivery: "Self-Paced",
    ceuCredits: 4,
    duration: "4 hours",
    level: "Intermediate",
    instructor: "Marcus Webb, CADC-II",
    featured: true,
  },
  {
    id: "tc3",
    title: "Motivational Interviewing: Core Skills Intensive",
    description: "The foundational MI training for counselors entering the field or seeking refresher credit. Covers OARS (Open questions, Affirmations, Reflective listening, Summaries), change talk identification, and rolling with resistance.",
    category: "Motivational Interviewing",
    delivery: "Live Webinar",
    ceuCredits: 6,
    duration: "6 hours",
    level: "Foundational",
    instructor: "Dr. Nkechi Okafor, LPC",
    nextSession: "August 14, 2026",
    featured: true,
  },
  {
    id: "tc4",
    title: "Advanced Motivational Interviewing: Complex Cases",
    description: "Designed for experienced practitioners, this course tackles MI in the context of ambivalence around MAT, dual diagnoses, court-mandated treatment, and reluctant family members. Includes live practice with standardized clients.",
    category: "Motivational Interviewing",
    delivery: "Live Webinar",
    ceuCredits: 4,
    duration: "4 hours",
    level: "Advanced",
    instructor: "Dr. Nkechi Okafor, LPC",
    nextSession: "September 11, 2026",
  },
  {
    id: "tc5",
    title: "Relapse Prevention Planning: From Theory to Practice",
    description: "Covers Marlatt & Gordon's cognitive-behavioral model, high-risk situation identification, coping skills building, and the apparently irrelevant decision chain. Includes tools for developing individualized relapse prevention plans.",
    category: "Relapse Prevention",
    delivery: "Self-Paced",
    ceuCredits: 3,
    duration: "3 hours",
    level: "Intermediate",
    instructor: "Patricia Holloway, CDCA",
  },
  {
    id: "tc6",
    title: "Group Facilitation Skills for Addiction Counselors",
    description: "Practical training on running effective process, psychoeducational, and topic-specific groups in residential and outpatient settings. Covers managing difficult dynamics, working with silence, and handling disclosures in group.",
    category: "Group Facilitation",
    delivery: "Certificate Program",
    ceuCredits: 12,
    duration: "12 hours",
    level: "Intermediate",
    instructor: "James Thornton, LPC, LCDC",
    featured: true,
  },
  {
    id: "tc7",
    title: "Trauma-Informed Care: Organizational Implementation",
    description: "Goes beyond individual practice to help organizations embed TIC across intake, documentation, staff supervision, physical environment, and peer culture. Includes a facility readiness assessment tool.",
    category: "Trauma-Informed Care",
    delivery: "On-Site",
    duration: "Full Day",
    level: "All Levels",
    instructor: "Dr. Serena Park, PhD",
  },
  {
    id: "tc8",
    title: "Case Management in Addiction Treatment: Coordination & Continuity",
    description: "Equips case managers with practical skills for care coordination, insurance navigation, step-down planning, community resource linkage, and maintaining therapeutic boundaries while managing complex psychosocial factors.",
    category: "Case Management",
    delivery: "Self-Paced",
    ceuCredits: 5,
    duration: "5 hours",
    level: "Foundational",
    instructor: "Rosa Martinez, CCM",
  },
  {
    id: "tc9",
    title: "Family Engagement in Addiction Treatment",
    description: "Trains counselors and case managers in best practices for family systems assessment, engaging resistant family members, facilitating family sessions, and connecting families to Al-Anon, Nar-Anon, and SMART Family & Friends.",
    category: "Family Engagement",
    delivery: "Live Webinar",
    ceuCredits: 3,
    duration: "3 hours",
    level: "Intermediate",
    instructor: "Patricia Holloway, CDCA",
    nextSession: "August 28, 2026",
  },
  {
    id: "tc10",
    title: "Building a Recovery-Oriented System of Care (ROSC)",
    description: "A systems-level training for program directors and community leaders on implementing ROSC principles — person-centered, community-based, continuous care that supports long-term recovery beyond acute treatment.",
    category: "ROSC",
    delivery: "Certificate Program",
    ceuCredits: 8,
    duration: "8 hours",
    level: "Advanced",
    instructor: "Dr. Angela Reeves, LCSW",
  },
  {
    id: "tc11",
    title: "Clinical Leadership Essentials for Addiction Professionals",
    description: "Designed for supervisors, program directors, and aspiring clinical leads. Covers supervision models, managing countertransference in staff, building team culture, quality improvement cycles, and workforce retention strategies.",
    category: "Clinical Leadership",
    delivery: "Certificate Program",
    ceuCredits: 16,
    duration: "16 hours",
    level: "Advanced",
    instructor: "Dr. Serena Park, PhD",
    featured: true,
  },
  {
    id: "tc12",
    title: "Staff Development & Burnout Prevention in Behavioral Health",
    description: "Addresses the high burnout and turnover rates in addiction treatment. Covers vicarious trauma, compassion fatigue, peer supervision models, self-care planning, and organizational strategies that actually move the needle.",
    category: "Staff Development",
    delivery: "Live Webinar",
    ceuCredits: 2,
    duration: "2 hours",
    level: "All Levels",
    nextSession: "July 31, 2026",
  },
  {
    id: "tc13",
    title: "Compliance & Quality Assurance for Treatment Programs",
    description: "Prepares QA coordinators and administrators for state licensing surveys, CARF/Joint Commission preparation, incident reporting systems, clinical record audits, and continuous quality improvement planning.",
    category: "Compliance & QA",
    delivery: "Self-Paced",
    ceuCredits: 6,
    duration: "6 hours",
    level: "Advanced",
    instructor: "James Thornton, LPC, LCDC",
  },
];

export const TRAINING_CATEGORIES: TrainingCategory[] = [
  'Ethics',
  'Clinical Documentation',
  'Motivational Interviewing',
  'Relapse Prevention',
  'Group Facilitation',
  'Trauma-Informed Care',
  'Case Management',
  'Family Engagement',
  'ROSC',
  'Clinical Leadership',
  'Staff Development',
  'Compliance & QA',
];

export const DELIVERY_FORMATS: DeliveryFormat[] = [
  'Live Webinar',
  'Self-Paced',
  'Certificate Program',
  'CEU Program',
  'On-Site',
];
