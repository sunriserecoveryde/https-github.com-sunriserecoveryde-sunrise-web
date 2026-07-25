export type ResourceFormat = 'Course' | 'Workbook' | 'Guide' | 'Podcast' | 'Video' | 'Assessment Tool';
export type Audience = 'Individuals' | 'Families' | 'Clinicians' | 'Organizations' | 'All';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  audience: Audience;
  format: ResourceFormat;
  duration?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  featured?: boolean;
}

export const resources: Resource[] = [
  {
    id: "r1",
    title: "Understanding Addiction: A Family Guide",
    description: "A comprehensive handbook for families navigating a loved one's addiction. Learn about the science of dependency and practical communication strategies.",
    category: "Family Support",
    audience: "Families",
    format: "Guide",
    duration: "45 pages",
    level: "Beginner",
    featured: true
  },
  {
    id: "r2",
    title: "CIWA Protocol Training for Nurses",
    description: "In-depth training on administering the Clinical Institute Withdrawal Assessment for Alcohol. Covers accurate scoring, symptom recognition, and medical escalation.",
    category: "CIWA Protocol",
    audience: "Clinicians",
    format: "Course",
    duration: "6 hours",
    level: "Intermediate"
  },
  {
    id: "r3",
    title: "Mindfulness in Early Recovery",
    description: "Daily exercises and journaling prompts to help ground individuals experiencing post-acute withdrawal symptoms.",
    category: "Mindfulness & Wellness",
    audience: "Individuals",
    format: "Workbook",
    duration: "60 pages",
    level: "Beginner",
    featured: true
  },
  {
    id: "r4",
    title: "Building a Recovery-Ready Workplace",
    description: "Actionable frameworks for HR professionals and organizational leaders to support employees in recovery and build inclusive policies.",
    category: "Professional Development",
    audience: "Organizations",
    format: "Course",
    duration: "3 hours",
    level: "Intermediate"
  },
  {
    id: "r5",
    title: "Trauma-Informed Care Fundamentals",
    description: "Core principles of trauma-informed behavioral healthcare. Learn how to create psychological safety in clinical settings.",
    category: "Trauma & PTSD",
    audience: "Clinicians",
    format: "Course",
    duration: "8 hours",
    level: "Intermediate",
    featured: true
  },
  {
    id: "r6",
    title: "COWS Assessment: Clinical Guide",
    description: "Standardized protocols for using the Clinical Opiate Withdrawal Scale. Includes case studies and interactive scoring exercises.",
    category: "COWS Assessment",
    audience: "Clinicians",
    format: "Assessment Tool",
    duration: "30 pages",
    level: "Advanced"
  },
  {
    id: "r7",
    title: "Talking to Teens About Addiction",
    description: "Evidence-based talking points and conversation starters for parents and guardians to discuss substance use with adolescents.",
    category: "Family Support",
    audience: "Families",
    format: "Guide",
    duration: "20 pages",
    level: "Beginner"
  },
  {
    id: "r8",
    title: "MAT: What Patients Need to Know",
    description: "An accessible guide explaining Medication-Assisted Treatment (MAT), destigmatizing its use, and setting proper expectations for care.",
    category: "Medication-Assisted Treatment",
    audience: "Individuals",
    format: "Guide",
    duration: "25 pages",
    level: "Beginner"
  },
  {
    id: "r9",
    title: "Co-Occurring Disorders: Integrated Treatment",
    description: "Advanced clinical models for treating SUD and co-occurring psychiatric disorders concurrently rather than sequentially.",
    category: "Co-Occurring Disorders",
    audience: "Clinicians",
    format: "Course",
    duration: "10 hours",
    level: "Advanced"
  },
  {
    id: "r10",
    title: "Peer Support Specialist Certification Prep",
    description: "Comprehensive study materials and practice modules for individuals pursuing state certification as a Peer Recovery Specialist.",
    category: "Peer Support Specialist Training",
    audience: "Individuals",
    format: "Course",
    duration: "12 hours",
    level: "Intermediate",
    featured: true
  },
  {
    id: "r11",
    title: "Cultural Humility in Addiction Counseling",
    description: "Strategies for providing culturally responsive care, acknowledging implicit bias, and improving therapeutic alliances with diverse populations.",
    category: "Cultural Competency",
    audience: "Clinicians",
    format: "Course",
    duration: "4 hours",
    level: "Intermediate"
  },
  {
    id: "r12",
    title: "Recovery Capital Assessment Workbook",
    description: "A self-guided tool for individuals to measure and build their internal and external resources to sustain long-term recovery.",
    category: "Addiction Recovery",
    audience: "Individuals",
    format: "Workbook",
    duration: "80 pages",
    level: "Beginner"
  }
];
