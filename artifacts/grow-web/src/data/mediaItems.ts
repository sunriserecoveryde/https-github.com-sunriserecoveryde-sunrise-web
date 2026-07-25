export type MediaType = 'Podcast' | 'Documentary' | 'Video' | 'Article' | 'Recovery Story';
export type MediaAudience = 'Recovery' | 'Families' | 'Professionals' | 'Leadership' | 'Mental Health' | 'Personal Development' | 'SunriseOS' | 'Treatment Innovation';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  audience: MediaAudience[];
  episodeInfo?: string;
  description: string;
  duration: string;
  date: string;
  thumbnail?: string; // color class for placeholder
  featured?: boolean;
}

export const mediaItems: MediaItem[] = [
  // Podcasts — Recovery Conversation
  {
    id: "m1",
    title: "The Recovery Conversation — Ep. 48: What Does Long-Term Recovery Actually Look Like?",
    type: "Podcast",
    audience: ["Recovery", "Families"],
    episodeInfo: "Ep. 48",
    description: "Four people with ten or more years of continuous recovery share the moments that tested them most — and what kept them going. A rare, unfiltered conversation about the years nobody talks about.",
    duration: "61 min",
    date: "July 18, 2026",
    thumbnail: "from-violet-900 to-purple-800",
    featured: true,
  },
  {
    id: "m2",
    title: "The Recovery Conversation — Ep. 42: Understanding Co-Occurring Disorders",
    type: "Podcast",
    audience: ["Professionals", "Mental Health"],
    episodeInfo: "Ep. 42",
    description: "Dr. Sarah Chen and Marcus Johnson discuss the clinical challenges and triumphs of treating individuals with dual diagnoses, and why integrated treatment changes outcomes.",
    duration: "48 min",
    date: "June 6, 2026",
    thumbnail: "from-blue-900 to-sky-800",
  },
  {
    id: "m3",
    title: "The Recovery Conversation — Ep. 38: Medication-Assisted Treatment Myths",
    type: "Podcast",
    audience: ["Recovery", "Families", "Professionals"],
    episodeInfo: "Ep. 38",
    description: "Breaking down common misconceptions surrounding MAT, featuring stories from individuals in long-term recovery and clinicians who've witnessed its impact firsthand.",
    duration: "52 min",
    date: "May 2, 2026",
    thumbnail: "from-emerald-900 to-teal-800",
  },
  {
    id: "m4",
    title: "The Recovery Conversation — Ep. 35: The Family Disease Model",
    type: "Podcast",
    audience: ["Families"],
    episodeInfo: "Ep. 35",
    description: "Exploring how addiction reshapes the entire family system — the roles family members take on, the rules that keep secrets, and what healthy family recovery looks like.",
    duration: "44 min",
    date: "April 11, 2026",
    thumbnail: "from-orange-900 to-amber-800",
  },
  {
    id: "m5",
    title: "The Recovery Conversation — Ep. 29: Burnout in Behavioral Healthcare",
    type: "Podcast",
    audience: ["Professionals", "Leadership"],
    episodeInfo: "Ep. 29",
    description: "A candid conversation with three clinical directors about the workforce crisis in addiction treatment — why people leave, and what organizations doing it right look like.",
    duration: "55 min",
    date: "March 7, 2026",
    thumbnail: "from-red-900 to-rose-800",
  },
  {
    id: "m6",
    title: "The Recovery Conversation — Ep. 22: Trauma-Informed Care in Practice",
    type: "Podcast",
    audience: ["Professionals", "Treatment Innovation"],
    episodeInfo: "Ep. 22",
    description: "Dr. Serena Park walks through what TIC looks like in intake, group facilitation, documentation, and staff supervision — and why most programs underestimate its scope.",
    duration: "49 min",
    date: "January 24, 2026",
    thumbnail: "from-cyan-900 to-blue-800",
  },

  // Documentary — Voices of Recovery
  {
    id: "m7",
    title: "Voices of Recovery — Episode 1: Beginnings",
    type: "Documentary",
    audience: ["Recovery", "Families"],
    episodeInfo: "Episode 1",
    description: "An intimate look into the first 30 days of treatment for three individuals at Sunrise Recovery — exploring the fear, vulnerability, and fragile hope of early recovery.",
    duration: "28 min",
    date: "May 15, 2026",
    thumbnail: "from-slate-900 to-gray-800",
    featured: true,
  },
  {
    id: "m8",
    title: "Voices of Recovery — Episode 2: The Work",
    type: "Documentary",
    audience: ["Recovery", "Families"],
    episodeInfo: "Episode 2",
    description: "Six months in. Therapy, step work, relationships tested and rebuilt. Three people confront the reasons they used — and find out whether they can face them without substances.",
    duration: "31 min",
    date: "June 12, 2026",
    thumbnail: "from-zinc-900 to-slate-800",
  },

  // Videos — SunriseOS
  {
    id: "m9",
    title: "SunriseOS Platform Demo: AI-Assisted Clinical Documentation",
    type: "Video",
    audience: ["SunriseOS", "Treatment Innovation"],
    description: "A comprehensive walk-through showing how SunriseOS ambient documentation saves clinicians 2 hours per shift — and how the AI note engine produces accurate, billable notes.",
    duration: "12 min",
    date: "July 10, 2026",
    thumbnail: "from-sky-900 to-blue-800",
    featured: true,
  },
  {
    id: "m10",
    title: "SunriseOS: Census & Patient Flow Overview",
    type: "Video",
    audience: ["SunriseOS", "Leadership"],
    description: "A guided walkthrough of the census management system: admission, discharge, room assignments, level-of-care tracking, and real-time floor visibility for charge nurses and administrators.",
    duration: "9 min",
    date: "June 28, 2026",
    thumbnail: "from-indigo-900 to-violet-800",
  },
  {
    id: "m11",
    title: "How Motivational Interviewing Changes the First Session",
    type: "Video",
    audience: ["Professionals", "Treatment Innovation"],
    description: "A training video demonstrating MI micro-skills in a simulated intake session. Covers OARS in action, eliciting change talk, and responding to resistance — with annotated analysis.",
    duration: "22 min",
    date: "May 30, 2026",
    thumbnail: "from-teal-900 to-emerald-800",
  },

  // Articles
  {
    id: "m12",
    title: "Why Most Relapse Prevention Plans Fail — And What to Do Instead",
    type: "Article",
    audience: ["Professionals", "Recovery"],
    description: "A clinician-authored analysis of the most common failure modes in relapse prevention planning, with evidence-based alternatives drawn from CBT, MBRP, and ROSC research.",
    duration: "12 min read",
    date: "July 5, 2026",
    thumbnail: "from-amber-900 to-orange-800",
    featured: true,
  },
  {
    id: "m13",
    title: "The Business Case for Trauma-Informed Organizational Culture",
    type: "Article",
    audience: ["Leadership", "Treatment Innovation"],
    description: "How TIC adoption affects staff retention, incident rates, client outcomes, and survey readiness — with data from programs that have implemented it organization-wide.",
    duration: "10 min read",
    date: "June 22, 2026",
    thumbnail: "from-rose-900 to-pink-800",
  },
  {
    id: "m14",
    title: "ROSC vs. The Episode-of-Care Model: What the Evidence Says",
    type: "Article",
    audience: ["Leadership", "Professionals", "Treatment Innovation"],
    description: "A clear-eyed comparison of recovery-oriented systems of care and traditional episode-based treatment — examining outcomes, cost, readmissions, and long-term recovery rates.",
    duration: "15 min read",
    date: "May 18, 2026",
    thumbnail: "from-green-900 to-teal-800",
  },

  // Recovery Stories
  {
    id: "m15",
    title: "Maria's Story: From the ICU to Five Years Sober",
    type: "Recovery Story",
    audience: ["Recovery", "Families"],
    description: "Maria woke up in an ICU on her 34th birthday with no memory of the previous night. This is the story of how she rebuilt her life — and what she wishes she'd known in year one.",
    duration: "8 min read",
    date: "July 22, 2026",
    thumbnail: "from-fuchsia-900 to-violet-800",
    featured: true,
  },
  {
    id: "m16",
    title: "James's Story: Recovery at 62 — It's Never Too Late",
    type: "Recovery Story",
    audience: ["Recovery", "Personal Development"],
    description: "James drank for 40 years before his son gave him an ultimatum. He entered treatment at 62 convinced it was too late. Three years later, he runs a peer support group for men over 50.",
    duration: "7 min read",
    date: "June 30, 2026",
    thumbnail: "from-orange-900 to-yellow-800",
  },
  {
    id: "m17",
    title: "A Nurse's Story: Addiction, Licensing, and the Road Back to Practice",
    type: "Recovery Story",
    audience: ["Professionals", "Recovery"],
    description: "Healthcare professionals in recovery face unique challenges: licensing boards, stigma from colleagues, and the question of whether they can ever return to the work they love. One nurse did.",
    duration: "9 min read",
    date: "June 15, 2026",
    thumbnail: "from-sky-900 to-cyan-800",
  },
];

export const MEDIA_AUDIENCES: MediaAudience[] = [
  'Recovery',
  'Families',
  'Professionals',
  'Leadership',
  'Mental Health',
  'Personal Development',
  'SunriseOS',
  'Treatment Innovation',
];
