export type PublicationCategory =
  | 'Books'
  | 'Workbooks'
  | 'Journals'
  | 'Group Curricula'
  | 'Treatment Manuals'
  | 'Family Guides'
  | 'Professional Resources'
  | 'Recovery Residence Materials'
  | 'Digital Downloads';

export type PublicationAudience = 'Individuals in Recovery' | 'Families' | 'Clinicians' | 'Organizations' | 'Peer Specialists' | 'All';

export interface Publication {
  id: string;
  title: string;
  description: string;
  author: string;
  category: PublicationCategory;
  audience: PublicationAudience;
  format: 'Softcover' | 'Hardcover' | 'PDF' | 'Softcover + PDF' | 'Curriculum Kit';
  pages?: number;
  price: number;
  featured?: boolean;
  coverColor?: string; // Tailwind gradient classes for placeholder cover
  isbn?: string;
}

export const publications: Publication[] = [
  // Books
  {
    id: "pub1",
    title: "The Long Road Back: A Recovery Memoir and Practical Guide",
    description: "Part memoir, part manual — Sunrise co-founder David Chen recounts his seventeen years in active addiction and the five years since, weaving evidence-based guidance throughout his personal story. An honest, unsentimental account of what long-term recovery actually looks like.",
    author: "David Chen, CADC-II",
    category: "Books",
    audience: "Individuals in Recovery",
    format: "Softcover + PDF",
    pages: 284,
    price: 24.99,
    featured: true,
    coverColor: "from-sky-900 to-blue-700",
    isbn: "978-0-000-00001-1",
  },
  {
    id: "pub2",
    title: "Motivational Interviewing in Practice: A Field Guide",
    description: "A practitioner's desk reference for MI in addiction counseling. Organized around real clinical scenarios, it gives counselors ready-made phrasings, session structures, and troubleshooting guides for the most common MI challenges.",
    author: "Dr. Nkechi Okafor, LPC",
    category: "Books",
    audience: "Clinicians",
    format: "Softcover",
    pages: 198,
    price: 34.99,
    featured: true,
    coverColor: "from-emerald-900 to-teal-700",
    isbn: "978-0-000-00002-2",
  },

  // Workbooks
  {
    id: "pub3",
    title: "Recovery Capital Workbook",
    description: "A structured, 90-page workbook guiding individuals through a comprehensive assessment of their internal and external recovery capital — relationships, housing, employment, spirituality, and more — and a concrete plan to build on each.",
    author: "Grow Motivational Editorial Team",
    category: "Workbooks",
    audience: "Individuals in Recovery",
    format: "Softcover",
    pages: 96,
    price: 18.99,
    featured: true,
    coverColor: "from-violet-900 to-purple-700",
    isbn: "978-0-000-00003-3",
  },
  {
    id: "pub4",
    title: "DBT Skills for Addiction Recovery",
    description: "A workbook adaptation of Dialectical Behavior Therapy's four skills modules — mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness — specifically translated for the addiction recovery context.",
    author: "Dr. Serena Park, PhD",
    category: "Workbooks",
    audience: "Individuals in Recovery",
    format: "Softcover",
    pages: 148,
    price: 22.99,
    coverColor: "from-rose-900 to-pink-700",
    isbn: "978-0-000-00004-4",
  },

  // Journals
  {
    id: "pub5",
    title: "Daily Recovery Journal: 90-Day Edition",
    description: "Ninety days of guided journaling for individuals in early recovery. Each day includes a morning intention prompt, an evening gratitude reflection, and space for free writing. Spiral-bound for flat desk use.",
    author: "Grow Motivational Editorial Team",
    category: "Journals",
    audience: "Individuals in Recovery",
    format: "Softcover",
    pages: 200,
    price: 16.99,
    coverColor: "from-amber-900 to-yellow-700",
    isbn: "978-0-000-00005-5",
  },

  // Group Curricula
  {
    id: "pub6",
    title: "Foundations of Recovery: 12-Week Group Curriculum",
    description: "A facilitator-ready 12-week curriculum for residential or intensive outpatient settings. Includes session-by-session lesson plans, participant handouts, discussion guides, and take-home assignments. Licensed for site use.",
    author: "James Thornton, LPC, LCDC & Patricia Holloway, CDCA",
    category: "Group Curricula",
    audience: "Clinicians",
    format: "Curriculum Kit",
    pages: 320,
    price: 149.99,
    featured: true,
    coverColor: "from-cyan-900 to-sky-700",
    isbn: "978-0-000-00006-6",
  },
  {
    id: "pub7",
    title: "Family Systems and Addiction: 6-Week Psychoeducation Group",
    description: "A turnkey six-week curriculum for family programming. Each session explores a core concept — enabling, codependency, the family disease model, setting limits, rebuilding trust, and long-term support — with experiential exercises throughout.",
    author: "Rosa Martinez, CCM",
    category: "Group Curricula",
    audience: "Clinicians",
    format: "Curriculum Kit",
    pages: 180,
    price: 99.99,
    coverColor: "from-green-900 to-emerald-700",
    isbn: "978-0-000-00007-7",
  },

  // Treatment Manuals
  {
    id: "pub8",
    title: "Integrated Dual Diagnosis Treatment Manual",
    description: "A comprehensive treatment manual for programs managing co-occurring SUD and psychiatric disorders. Covers integrated assessment, stage-wise treatment, medication coordination, and discharge planning within a ROSC framework.",
    author: "Dr. Angela Reeves, LCSW",
    category: "Treatment Manuals",
    audience: "Clinicians",
    format: "Softcover + PDF",
    pages: 412,
    price: 79.99,
    coverColor: "from-indigo-900 to-blue-800",
    isbn: "978-0-000-00008-8",
  },

  // Family Guides
  {
    id: "pub9",
    title: "When Someone You Love Has an Addiction",
    description: "A compassionate, plain-language guide for families who are just learning that a loved one has a substance use disorder. Answers the most common questions honestly, avoids jargon, and points families toward their own support resources.",
    author: "Dr. Angela Reeves, LCSW",
    category: "Family Guides",
    audience: "Families",
    format: "Softcover",
    pages: 132,
    price: 14.99,
    featured: true,
    coverColor: "from-orange-900 to-amber-700",
    isbn: "978-0-000-00009-9",
  },

  // Professional Resources
  {
    id: "pub10",
    title: "Clinical Supervision in Addiction Treatment: A Supervisor's Handbook",
    description: "Practical guidance for clinical supervisors on supervision models, documentation of supervision hours, addressing countertransference in staff, managing critical incidents, and building a reflective practice culture in your team.",
    author: "Dr. Serena Park, PhD",
    category: "Professional Resources",
    audience: "Clinicians",
    format: "Softcover",
    pages: 224,
    price: 44.99,
    coverColor: "from-slate-800 to-gray-700",
    isbn: "978-0-000-00010-0",
  },

  // Recovery Residence Materials
  {
    id: "pub11",
    title: "Oxford House & Recovery Residence Operations Manual",
    description: "A practical operations guide for recovery residence managers and house managers. Covers resident intake, house rules development, meeting requirements, conflict resolution, financial sustainability, and reintegration planning.",
    author: "Marcus Webb, CADC-II",
    category: "Recovery Residence Materials",
    audience: "Organizations",
    format: "PDF",
    pages: 88,
    price: 29.99,
    coverColor: "from-teal-900 to-cyan-700",
    isbn: "978-0-000-00011-1",
  },

  // Digital Downloads
  {
    id: "pub12",
    title: "Peer Support Specialist Toolkit (Digital Bundle)",
    description: "Everything a new Peer Recovery Specialist needs in their first year: disclosure guidelines, engagement scripts, boundary-setting frameworks, self-care plans, and a state-by-state certification resource list. Immediate PDF download.",
    author: "Grow Motivational Editorial Team",
    category: "Digital Downloads",
    audience: "Peer Specialists",
    format: "PDF",
    price: 19.99,
    featured: true,
    coverColor: "from-fuchsia-900 to-violet-700",
  },
];

export const PUBLICATION_CATEGORIES: PublicationCategory[] = [
  'Books',
  'Workbooks',
  'Journals',
  'Group Curricula',
  'Treatment Manuals',
  'Family Guides',
  'Professional Resources',
  'Recovery Residence Materials',
  'Digital Downloads',
];
