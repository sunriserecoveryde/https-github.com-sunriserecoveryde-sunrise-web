export type RecoveryCategory =
  | 'Daily Readings'
  | 'Worksheets'
  | 'Journaling Prompts'
  | 'Meeting Preparation'
  | 'Gratitude Exercises'
  | 'Relapse Warning Signs'
  | 'Personal Inventory'
  | 'Coping Skills'
  | 'Family Conversations';

export interface RecoveryResource {
  id: string;
  title: string;
  description: string;
  category: RecoveryCategory;
  format: 'PDF' | 'Worksheet' | 'Audio Guide' | 'Checklist' | 'Reflection Prompt' | 'Exercise';
  pages?: number;
  duration?: string;
  featured?: boolean;
}

export const recoveryResources: RecoveryResource[] = [
  // Daily Readings
  {
    id: "rr1",
    title: "Morning Affirmations for Early Recovery",
    description: "A collection of 30 daily affirmations grounded in motivational interviewing principles. Each entry includes a short reflection question to set an intentional tone for the day.",
    category: "Daily Readings",
    format: "PDF",
    pages: 34,
    featured: true,
  },
  {
    id: "rr2",
    title: "One Day at a Time: Daily Meditations",
    description: "Ninety short meditations exploring acceptance, courage, and surrender — one for each day of early recovery. Based on the traditions of mutual-aid philosophy.",
    category: "Daily Readings",
    format: "PDF",
    pages: 96,
  },

  // Worksheets
  {
    id: "rr3",
    title: "HALT Check-In Worksheet",
    description: "A structured self-check asking whether you are Hungry, Angry, Lonely, or Tired — four states most associated with relapse vulnerability. Includes action planning for each.",
    category: "Worksheets",
    format: "Worksheet",
    pages: 2,
    featured: true,
  },
  {
    id: "rr4",
    title: "Values Clarification Exercise",
    description: "Identify and rank your personal values through a guided sorting activity. Understanding your core values helps rebuild a recovery identity and make value-aligned decisions.",
    category: "Worksheets",
    format: "Exercise",
    pages: 4,
  },

  // Journaling Prompts
  {
    id: "rr5",
    title: "Writing Through Cravings",
    description: "Fifteen structured prompts to help you process cravings in the moment through expressive writing. Based on emotion-regulation strategies from DBT research.",
    category: "Journaling Prompts",
    format: "Reflection Prompt",
    pages: 8,
    featured: true,
  },
  {
    id: "rr6",
    title: "My Recovery Story — A Narrative Journal",
    description: "Guided prompts spanning past, present, and future that help you author your own recovery narrative. Especially effective in early to mid-recovery as identity reconstruction begins.",
    category: "Journaling Prompts",
    format: "Reflection Prompt",
    pages: 20,
  },

  // Meeting Preparation
  {
    id: "rr7",
    title: "First Meeting Prep Guide",
    description: "A welcoming guide for those attending their first 12-step or SMART Recovery meeting. Covers what to expect, common phrases, and how to find the right meeting format.",
    category: "Meeting Preparation",
    format: "PDF",
    pages: 6,
    featured: true,
  },
  {
    id: "rr8",
    title: "Step Study Companion: Steps 1–3",
    description: "A workbook companion for those working the first three steps with a sponsor. Includes reflection questions, writing prompts, and space for personal notes.",
    category: "Meeting Preparation",
    format: "Worksheet",
    pages: 18,
  },

  // Gratitude Exercises
  {
    id: "rr9",
    title: "30-Day Gratitude Challenge",
    description: "Each day brings a new gratitude lens — people, experiences, personal strengths, unexpected gifts. Research shows that gratitude practices meaningfully support long-term sobriety.",
    category: "Gratitude Exercises",
    format: "Exercise",
    pages: 32,
  },
  {
    id: "rr10",
    title: "Gratitude Letter Template",
    description: "A structured template for writing a gratitude letter to someone who supported your recovery — whether or not you ever send it. Paired with a guided reflection on the experience.",
    category: "Gratitude Exercises",
    format: "Worksheet",
    pages: 3,
  },

  // Relapse Warning Signs
  {
    id: "rr11",
    title: "Relapse Warning Sign Checklist",
    description: "A clinician-reviewed checklist of emotional, behavioral, and cognitive warning signs that typically precede a relapse. Designed for regular self-monitoring and sponsor discussions.",
    category: "Relapse Warning Signs",
    format: "Checklist",
    pages: 4,
    featured: true,
  },
  {
    id: "rr12",
    title: "Personal Relapse Prevention Plan",
    description: "A fillable plan that captures your triggers, early warning signs, coping strategies, support contacts, and crisis steps. Laminate it — your sponsor and counselor should have a copy too.",
    category: "Relapse Warning Signs",
    format: "Worksheet",
    pages: 6,
  },

  // Personal Inventory
  {
    id: "rr13",
    title: "Daily Personal Inventory Worksheet",
    description: "An end-of-day reflection modeled on Step Ten. Reviews resentments, fears, harms done, and gifts from the day — keeping emotional accounts current so they don't accumulate.",
    category: "Personal Inventory",
    format: "Worksheet",
    pages: 2,
    featured: true,
  },
  {
    id: "rr14",
    title: "Character Strengths Inventory",
    description: "Identify the character strengths that carried you through hard times. Builds the asset side of self-knowledge alongside traditional Step Four-style inventory work.",
    category: "Personal Inventory",
    format: "Exercise",
    pages: 8,
  },

  // Coping Skills
  {
    id: "rr15",
    title: "5-4-3-2-1 Grounding Technique Card",
    description: "A printable pocket card with the 5-4-3-2-1 sensory grounding exercise for managing cravings and anxiety. Carry it in your wallet. Use it before you call your dealer.",
    category: "Coping Skills",
    format: "PDF",
    pages: 1,
    featured: true,
  },
  {
    id: "rr16",
    title: "Coping Skills Menu",
    description: "A comprehensive, categorized menu of healthy coping strategies organized by need: physical, social, creative, cognitive, and spiritual. Build your personal toolkit by highlighting what works for you.",
    category: "Coping Skills",
    format: "Checklist",
    pages: 3,
  },
  {
    id: "rr17",
    title: "Box Breathing Audio Guide",
    description: "A 10-minute guided audio exercise that teaches box breathing — a technique used by military special forces and trauma therapists alike to rapidly lower physiological arousal.",
    category: "Coping Skills",
    format: "Audio Guide",
    duration: "10 min",
  },

  // Family Conversations
  {
    id: "rr18",
    title: "How to Talk to Your Kids About Your Recovery",
    description: "Age-appropriate conversation starters and honest talking points for parents in recovery. Children need truth more than protection from it — this guide helps you offer both.",
    category: "Family Conversations",
    format: "PDF",
    pages: 10,
    featured: true,
  },
  {
    id: "rr19",
    title: "Setting Healthy Boundaries with Family",
    description: "A family boundaries workbook covering the difference between boundaries and ultimatums, scripts for common difficult conversations, and exercises for the whole family system.",
    category: "Family Conversations",
    format: "Worksheet",
    pages: 12,
  },
  {
    id: "rr20",
    title: "Rebuilding Trust After Addiction",
    description: "A guide for individuals and their families on the realistic timeline of trust repair, what makes amends meaningful, and how to avoid the trap of rushed forgiveness.",
    category: "Family Conversations",
    format: "PDF",
    pages: 14,
  },
];

export const RECOVERY_CATEGORIES: RecoveryCategory[] = [
  'Daily Readings',
  'Worksheets',
  'Journaling Prompts',
  'Meeting Preparation',
  'Gratitude Exercises',
  'Relapse Warning Signs',
  'Personal Inventory',
  'Coping Skills',
  'Family Conversations',
];
