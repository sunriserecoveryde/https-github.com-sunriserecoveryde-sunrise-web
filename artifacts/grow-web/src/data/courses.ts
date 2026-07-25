export interface Course {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  modulesCount: number;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
}

export const courses: Course[] = [
  {
    id: "c1",
    title: "Foundations of Addiction Medicine",
    instructor: "Dr. Sarah Chen, MD, FASAM",
    duration: "12 hours",
    modulesCount: 8,
    description: "A rigorous overview of the neurobiology of addiction, pharmacotherapy, and evidence-based clinical interventions.",
    level: "Advanced",
    category: "Clinical Practice"
  },
  {
    id: "c2",
    title: "Early Recovery Skills for Clients",
    instructor: "James Wilson, LADC",
    duration: "6 hours",
    modulesCount: 6,
    description: "Actionable strategies for navigating triggers, managing cravings, and establishing a healthy daily routine in the first 90 days.",
    level: "Beginner",
    category: "Individual Recovery"
  },
  {
    id: "c3",
    title: "Family Systems and Addiction",
    instructor: "Dr. Elena Rodriguez, PhD, LMFT",
    duration: "5 hours",
    modulesCount: 5,
    description: "Understanding how substance use impacts the family unit, with tools for establishing healthy boundaries and fostering collective healing.",
    level: "Beginner",
    category: "Family Support"
  },
  {
    id: "c4",
    title: "Clinical Supervision in Behavioral Health",
    instructor: "Marcus Johnson, LCSW",
    duration: "10 hours",
    modulesCount: 7,
    description: "Essential training for clinical supervisors focusing on ethical practice, staff retention, and developing clinical competencies in supervisees.",
    level: "Advanced",
    category: "Leadership"
  },
  {
    id: "c5",
    title: "Motivational Interviewing Essentials",
    instructor: "Dr. Rachel Kim, PsyD",
    duration: "4 hours",
    modulesCount: 4,
    description: "Core principles of MI: expressing empathy, developing discrepancy, rolling with resistance, and supporting self-efficacy.",
    level: "Intermediate",
    category: "Clinical Practice"
  },
  {
    id: "c6",
    title: "Recovery Coaching Fundamentals",
    instructor: "David Thompson, CPRS",
    duration: "8 hours",
    modulesCount: 6,
    description: "The foundational framework for peer recovery coaching, including ethical boundaries, sharing lived experience safely, and resource brokering.",
    level: "Beginner",
    category: "Peer Support"
  }
];
