export interface MediaItem {
  id: string;
  title: string;
  type: 'Podcast' | 'Documentary' | 'Video';
  episodeInfo?: string;
  description: string;
  duration: string;
}

export const mediaItems: MediaItem[] = [
  {
    id: "m1",
    title: "The Recovery Conversation Podcast — Ep. 42: Understanding Co-Occurring Disorders",
    type: "Podcast",
    episodeInfo: "Ep. 42",
    description: "Dr. Sarah Chen and Marcus Johnson discuss the clinical challenges and triumphs of treating individuals with dual diagnoses.",
    duration: "48 min"
  },
  {
    id: "m2",
    title: "The Recovery Conversation Podcast — Ep. 38: Medication-Assisted Treatment Myths",
    type: "Podcast",
    episodeInfo: "Ep. 38",
    description: "Breaking down common misconceptions surrounding MAT, featuring stories from individuals in long-term recovery.",
    duration: "52 min"
  },
  {
    id: "m3",
    title: "Voices of Recovery Documentary Series — Episode 1: Beginnings",
    type: "Documentary",
    episodeInfo: "Episode 1",
    description: "An intimate look into the first 30 days of treatment for three individuals at Sunrise Recovery, exploring vulnerability and hope.",
    duration: "28 min"
  },
  {
    id: "m4",
    title: "SunriseOS Platform Demo: AI-Assisted Clinical Documentation",
    type: "Video",
    description: "A comprehensive walk-through showing how SunriseOS ambient documentation saves clinicians 2 hours per shift.",
    duration: "12 min"
  }
];
