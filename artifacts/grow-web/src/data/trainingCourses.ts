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
  provider?: string;
  url?: string;
  cost?: 'Free' | 'Free for Members' | 'Paid';
  status?: 'Available Now' | 'Upcoming' | 'Recorded';
}

export const trainingCourses: TrainingCourse[] = [
  // ─── NAADAC FREE WEBINAR SERIES ────────────────────────────────────────────

  {
    id: "naadac-ethics-supervision-docs",
    title: "Considering Ethics in Documentation of Clinical Supervision",
    description: "This free NAADAC webinar explores the ethical obligations supervisors and supervisees face when documenting clinical supervision sessions. Covers confidentiality, dual roles, scope of practice concerns, and documentation standards that protect both clinician and client.",
    category: "Ethics",
    delivery: "Live Webinar",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/considering-ethics-in-documentation-of-clinical-supervision",
    cost: "Free",
    nextSession: "December 9, 2026",
    status: "Upcoming",
    featured: true,
  },
  {
    id: "naadac-ethical-issues-best-practices",
    title: "Ethical Issues and Best Practices in Substance Use Disorder Treatment",
    description: "Presents real-world ethical dilemmas commonly encountered in SUD treatment, including dual relationships, informed consent challenges, mandated reporting gray areas, and documentation ethics. Includes guided case studies and group discussion prompts.",
    category: "Ethics",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "All Levels",
    provider: "NAADAC",
    url: "https://www.naadac.org/ethical-issues-and-best-practices-in-substance-use-disorder-treatment",
    cost: "Free",
    status: "Recorded",
    featured: true,
  },
  {
    id: "naadac-ethical-boundaries-peer-support",
    title: "Navigating Ethical Boundaries: Decision Making for Peer Support Specialists and Addiction Counselors",
    description: "Guides peer support specialists and addiction counselors through a practical ethical decision-making framework. Addresses role boundaries, self-disclosure, dual relationships specific to lived-experience practitioners, and how to seek supervision when boundaries feel unclear.",
    category: "Ethics",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Foundational",
    provider: "NAADAC",
    url: "https://www.naadac.org/navigating-ethical-boundaries-decision-making",
    cost: "Free",
    status: "Recorded",
  },
  {
    id: "naadac-strengthening-helping-professionals",
    title: "Strengthening Helping Professionals: Ethics, Resilience, & Attachment-Informed Approaches",
    description: "Explores the intersection of professional ethics and personal resilience for behavioral health workers. Covers attachment theory as applied to the therapeutic relationship, ethical obligations around self-care, and how compassion fatigue distorts clinical judgment.",
    category: "Ethics",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/strengthening-helping-professionals",
    cost: "Free",
    status: "Recorded",
  },

  // ─── CLINICAL DOCUMENTATION ───────────────────────────────────────────────

  {
    id: "naadac-transforming-documentation",
    title: "Transforming Documentation: From Pitfalls to Best Practices",
    description: "A practical, case-based training that walks counselors through the most common documentation errors — vague progress notes, missing medical necessity language, ASAM criteria gaps, and audit vulnerabilities. Includes before/after note examples and a documentation self-audit tool.",
    category: "Clinical Documentation",
    delivery: "Live Webinar",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "All Levels",
    provider: "NAADAC",
    url: "https://www.naadac.org/transforming-documentation-from-pitfalls-to-best-practices",
    cost: "Free",
    nextSession: "September 30, 2026",
    status: "Upcoming",
    featured: true,
  },
  {
    id: "naadac-quality-substance-use-evaluation",
    title: "How to Conduct a Quality Substance Use Evaluation",
    description: "Covers the key components of a comprehensive substance use disorder evaluation — from biopsychosocial history and DSM-5-TR diagnostic criteria, to ASAM dimensional assessment and referral recommendations. Includes sample assessment templates and documentation guidance.",
    category: "Clinical Documentation",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Foundational",
    provider: "NAADAC",
    url: "https://www.naadac.org/how-to-conduct-a-quality-substance-use-evaluation",
    cost: "Free",
    status: "Recorded",
  },

  // ─── MOTIVATIONAL INTERVIEWING ────────────────────────────────────────────

  {
    id: "attc-exploring-mi-series",
    title: "Exploring Motivational Interviewing Series",
    description: "A 4-part virtual training series from the Central East ATTC covering MI from the ground up. Session 1: What is MI and What Makes it Work (OARS, MI Spirit). Session 2: Open-Ended Questions & Affirmations. Session 3: Reflective Listening & Change Talk. Session 4: Integration and practice with complex client scenarios. CE credit available.",
    category: "Motivational Interviewing",
    delivery: "Live Webinar",
    ceuCredits: 6,
    duration: "4 sessions (1.5 hrs each)",
    level: "Foundational",
    provider: "Central East ATTC",
    url: "https://attcnetwork.org/event/exploring-motivational-interviewing-series/",
    cost: "Free",
    status: "Available Now",
    featured: true,
  },

  // ─── RELAPSE PREVENTION ───────────────────────────────────────────────────

  {
    id: "naadac-chasing-other-dragons",
    title: "Chasing Other Dragons – Atypical Intoxicants",
    description: "Explores the rising use of atypical and emerging intoxicants — including novel synthetic cannabinoids, kratom, nitrous oxide, and other substances not traditionally covered in counselor training. Covers pharmacology, behavioral patterns, withdrawal risks, and clinical response strategies.",
    category: "Relapse Prevention",
    delivery: "Live Webinar",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/chasing-other-dragons-atypical-intoxicants",
    cost: "Free",
    nextSession: "September 16, 2026",
    status: "Upcoming",
    featured: true,
  },
  {
    id: "naadac-process-addictions",
    title: "Process Addictions: Maladaptive Coping Across the Ages",
    description: "Examines behavioral and process addictions — gambling, internet/gaming, sex, food, and work — through a developmental lens. Covers assessment, co-occurrence with substance use disorders, treatment integration, and age-specific considerations from adolescence through older adulthood.",
    category: "Relapse Prevention",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/process-addictions-maladaptive-coping-across-the-ages",
    cost: "Free",
    status: "Recorded",
  },
  {
    id: "naadac-dbt-12-steps",
    title: "The Skill of Taking Steps: Using DBT in Conjunction with 12 Steps",
    description: "Bridges Dialectical Behavior Therapy (DBT) skills training with traditional 12-step recovery pathways. Covers how distress tolerance, emotional regulation, and mindfulness skills complement Step work, and how counselors can integrate both modalities without creating client confusion.",
    category: "Relapse Prevention",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/the-skill-of-taking-steps-using-dbt-in-conjunction-with-12-steps",
    cost: "Free",
    status: "Recorded",
  },
  {
    id: "naadac-vape-landscape",
    title: "The New Vape Landscape: Dual Use and What to Know",
    description: "An up-to-date clinical primer on vaping and e-cigarette use among clients in SUD treatment. Covers nicotine and cannabis vaping, dual use with combustible products, unique withdrawal presentations, and evidence-based cessation approaches appropriate for behavioral health settings.",
    category: "Relapse Prevention",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Foundational",
    provider: "NAADAC",
    url: "https://www.naadac.org/the-new-vape-landscape-dual-use-and-what-to-know",
    cost: "Free",
    status: "Recorded",
  },

  // ─── TRAUMA-INFORMED CARE ─────────────────────────────────────────────────

  {
    id: "naadac-adult-children-parental-addiction",
    title: "Adult Children of Parental Addiction: Trauma and Healing",
    description: "Examines the lasting psychological, relational, and neurobiological impact of growing up in a home affected by addiction. Covers ACE research, attachment disruption, shame-based identity, and practical trauma-informed clinical approaches for working with this population in SUD settings.",
    category: "Trauma-Informed Care",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/adult-children-of-parental-addiction-trauma-and-healing",
    cost: "Free",
    status: "Recorded",
    featured: true,
  },
  {
    id: "naadac-toxic-shame-sud",
    title: "Understanding the Role of Toxic Shame in Substance Use Disorders",
    description: "Presents toxic shame as a core driver of both addiction and treatment resistance. Covers Brené Brown and Bradshaw's shame frameworks as applied to SUD, the neuroscience of shame, clinical strategies for working with shame-bound clients, and how to avoid shame-inducing language in documentation and groups.",
    category: "Trauma-Informed Care",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/understanding-the-role-of-toxic-shame-in-substance-use-disorders",
    cost: "Free",
    status: "Recorded",
  },
  {
    id: "naadac-lgbtqia2s-co-occurring",
    title: "From Insight to Action: Affirming Clinical Strategies for LGBTQIA2S+ Clients with Co-Occurring Disorders",
    description: "Provides behavioral health counselors with evidence-based, affirming clinical frameworks for working with LGBTQIA2S+ clients who present with co-occurring mental health and substance use disorders. Covers minority stress theory, trauma-informed assessment, affirming language, and navigating systems that are not yet fully inclusive.",
    category: "Trauma-Informed Care",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/from-insight-to-action",
    cost: "Free",
    status: "Recorded",
  },

  // ─── CASE MANAGEMENT ──────────────────────────────────────────────────────

  {
    id: "attc-msr-mat-stigma",
    title: "Medicated Supported Recovery (MSR): Moving Past Stigma to Inspire Hope",
    description: "A four-hour interactive training from the Northeast & Caribbean ATTC covering MAT/MSR for opioid use disorder (OUD) and alcohol use disorder (AUD). Reviews buprenorphine, methadone, and naltrexone; addresses provider bias and stigma; and includes language practice activities for recovery-oriented communication. Approved for CARC/CRPA initial certification hours. Presented by Diana Padilla, MCPC, CTSS, CARC.",
    category: "Case Management",
    delivery: "Live Webinar",
    ceuCredits: 4,
    duration: "4 hours",
    level: "All Levels",
    instructor: "Diana Padilla, MCPC, CTSS, CARC",
    provider: "Northeast & Caribbean ATTC",
    url: "https://attcnetwork.org/event/medicated-supported-recovery-msr-moving-past-stigma-to-inspire-hope-july2026/",
    cost: "Free",
    nextSession: "July 28, 2026",
    status: "Upcoming",
    featured: true,
  },
  {
    id: "naadac-opioid-treatment-peers",
    title: "Supporting Individuals Engaged in Opioid Use Disorder Treatment for Peers",
    description: "Designed specifically for peer support specialists and recovery coaches working alongside people in opioid use disorder treatment. Covers how to support clients on medication-assisted treatment, address stigma from within peer networks, maintain appropriate boundaries, and connect individuals to community recovery supports.",
    category: "Case Management",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Foundational",
    provider: "NAADAC",
    url: "https://www.naadac.org/supporting-individuals-engaged-in-opioid-use-disorder-treatment-for-peers",
    cost: "Free",
    status: "Recorded",
  },

  // ─── FAMILY ENGAGEMENT ────────────────────────────────────────────────────

  {
    id: "naadac-breaking-cycle-children-youth",
    title: "Breaking the Cycle: Preventing Substance Use Disorders in Children and Youth",
    description: "Covers evidence-based prevention science for behavioral health professionals working with or adjacent to children and adolescents. Topics include ACEs and resilience factors, family-based prevention approaches, early identification of at-risk youth, and how to communicate risk effectively with families in treatment.",
    category: "Family Engagement",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Foundational",
    provider: "NAADAC",
    url: "https://www.naadac.org/breaking-the-cycle-preventing-substance-use-disorders-in-children-and-youth",
    cost: "Free",
    status: "Recorded",
  },

  // ─── ROSC ─────────────────────────────────────────────────────────────────

  {
    id: "naadac-unseen-unheard-untreated",
    title: "Unseen, Unheard, Untreated: A Disconnected System's Call for the Medicine of Connection",
    description: "Examines the systemic gaps that leave people with addiction and mental illness disconnected from care. Explores the therapeutic power of genuine human connection as a recovery support mechanism, the role of peer-centered services in bridging access gaps, and practical strategies for building connection-focused treatment environments.",
    category: "ROSC",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "All Levels",
    provider: "NAADAC",
    url: "https://www.naadac.org/unseen-unheard-untreated-a-disconnected-systems-call-for-the-medicine-of-connection",
    cost: "Free",
    status: "Recorded",
  },

  // ─── CLINICAL LEADERSHIP ──────────────────────────────────────────────────

  {
    id: "naadac-building-iop-otp",
    title: "Building an Intensive Outpatient Program (IOP) in an OTP Setting",
    description: "Practical guidance for program directors and clinical leaders on developing and operationalizing an IOP within an Opioid Treatment Program. Covers regulatory requirements, staffing models, group scheduling, documentation standards, billing considerations, and coordination between methadone/buprenorphine services and IOP counseling.",
    category: "Clinical Leadership",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Advanced",
    provider: "NAADAC",
    url: "https://www.naadac.org/building-an-intensive-outpatient-program-iop-in-an-otp-setting",
    cost: "Free",
    status: "Recorded",
    featured: true,
  },

  // ─── COMPLIANCE & QA ──────────────────────────────────────────────────────

  {
    id: "naadac-accreditation-minority-led",
    title: "The Role of Accreditation in Elevating Minority-Led Social Service Agencies",
    description: "Explores how CARF and Joint Commission accreditation can strengthen the credibility, funding access, and sustainability of minority-led behavioral health organizations. Covers the accreditation preparation process, common barriers for smaller agencies, and how quality standards align with culturally responsive care.",
    category: "Compliance & QA",
    delivery: "Self-Paced",
    ceuCredits: 1.5,
    duration: "1.5 hours",
    level: "Intermediate",
    provider: "NAADAC",
    url: "https://www.naadac.org/the-role-of-accreditation-in-elevating-minority-led-social-service-agencies",
    cost: "Free",
    status: "Recorded",
  },

  // ─── NCADD MARYLAND ───────────────────────────────────────────────────────

  {
    id: "ncadd-md-tuerk-conference",
    title: "Annual Tuerk Conference on Mental Health and Addiction Treatment",
    description: "The largest one-day addiction conference on the East Coast, co-sponsored by NCADD Maryland and the University of Maryland School of Medicine. Each April, over 1,600 clinicians, counselors, researchers, and policymakers convene at the Baltimore Convention Center for plenary sessions, breakout workshops, and networking covering the full spectrum of addiction and mental health treatment. CME and CEU credits are offered. Registration typically opens in January; the conference sells out annually.",
    category: "Clinical Leadership",
    delivery: "On-Site",
    duration: "Full day (8:00 am – 6:00 pm)",
    level: "All Levels",
    provider: "NCADD Maryland & UMD School of Medicine",
    url: "https://www.ncaddmaryland.org/events",
    cost: "Paid",
    nextSession: "April 2027 (date TBA)",
    status: "Upcoming",
    featured: true,
  },

  // ─── STAFF DEVELOPMENT ────────────────────────────────────────────────────

  {
    id: "attc-contingency-management",
    title: "Contingency Management: Implementation for Counselors",
    description: "Introduces contingency management (CM) as one of the most evidence-supported behavioral interventions for stimulant and cocaine use disorders. Covers the science of reinforcement-based treatment, practical implementation in outpatient settings, addressing client and staff skepticism, and the latest SAMHSA guidance on CM rollout in community programs.",
    category: "Staff Development",
    delivery: "Live Webinar",
    ceuCredits: 2,
    duration: "2 hours",
    level: "Intermediate",
    provider: "ATTC Network",
    url: "https://attcnetwork.org/event/contingency-management-july-2026/",
    cost: "Free",
    status: "Upcoming",
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
