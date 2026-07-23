/**
 * quickCaptureParser.ts
 *
 * Parses a clinician's free-text session description (1-4 sentences, plain English)
 * into a structured ProgressNoteInput — no external LLM, pure TypeScript heuristics.
 *
 * Strategy: keyword matching + simple regex extraction, with confidence scoring
 * for each detected field so the UI can show the clinician what was understood.
 */

import type { ProgressNoteInput } from './aiNoteEngine';

// ─── Detected signal record ───────────────────────────────────────────────────

export interface ParsedSignal {
  field: keyof ProgressNoteInput;
  label: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface QuickCaptureResult {
  input: Partial<ProgressNoteInput>;
  signals: ParsedSignal[];
  /** 0–100 overall parse confidence */
  parseScore: number;
}

// ─── Vocabulary tables ────────────────────────────────────────────────────────

const PRESENTATION_MAP: Array<[RegExp, string]> = [
  [/\b(calm(ed)?|cooperative|settled|composed|relaxed)\b/i, 'calm and cooperative'],
  [/\b(anxious|nervous|worried|on\s+edge|keyed\s+up)\b/i, 'anxious and mildly agitated'],
  [/\b(tearful|crying|weeping|emotional|broke\s+down)\b/i, 'tearful and emotionally activated'],
  [/\b(guarded|closed\s+off|defensive|resistant|evasive)\b/i, 'guarded and minimally expressive'],
  [/\b(open|forthcoming|engaged|motivated|enthusiastic|bright)\b/i, 'open and engaged with strong therapeutic presence'],
  [/\b(depress(ed)?|flat\s+affect|hopeless|despondent|down)\b/i, 'depressed with flat affect and low energy'],
  [/\b(agitated|irritabl(e|y)|hostile|angry|aggress)\b/i, 'visibly agitated with labile affect'],
  [/\b(hopeful|optimistic|positive|encouraged)\b/i, 'hopeful and forward-looking'],
  [/\b(labile|mood\s+swings?|unstable\s+mood)\b/i, 'emotionally labile with variable affect'],
  [/\b(dissociat|spac(ed|ing)\s+out|zoned?\s+out|distant)\b/i, 'mildly dissociative at times during session'],
  [/\b(shame|guilt|ashamed|guilty)\b/i, 'shame-laden affect with visible remorse'],
  [/\b(focused|clear|goal\s*-?\s*directed|articulate)\b/i, 'focused and goal-directed'],
];

const MOOD_MAP: Array<[RegExp, string]> = [
  [/\bmood\s*(?:was|is|rated|described\s+as|appeared?)\s+([\w\s/-]+)/i, '$1'],
  [/\b(euthymic)\b/i, 'euthymic'],
  [/\b(dysphoric|dysthymic)\b/i, 'dysphoric'],
  [/\b(anxious|anxi)\b/i, 'anxious'],
  [/\b(depress(ed)?)\b/i, 'depressed'],
  [/\b(elevated|expansive|hypomanic)\b/i, 'elevated/hypomanic'],
  [/\b(irritabl(e|y))\b/i, 'irritable'],
  [/\b(neutral|stable|ok|okay|alright)\b/i, 'neutral/stable'],
];

const MOOD_RATING: RegExp = /(?:mood|rating)[\s:]+(\d(?:\.\d)?)\s*(?:\/\s*10|out\s+of\s+10)?/i;

const MODALITY_MAP: Array<[RegExp, string]> = [
  [/\bcbt\b|cognitive[\s-]?behav/i, 'Cognitive-Behavioral Therapy (CBT)'],
  [/\bdbt\b|dialectical/i, 'Dialectical Behavior Therapy (DBT)'],
  [/\bmi\b|motivational\s+interview/i, 'Motivational Interviewing (MI)'],
  [/\bact\b|acceptance\s+and\s+commit/i, 'Acceptance and Commitment Therapy (ACT)'],
  [/\bemdr\b/i, 'Eye Movement Desensitization and Reprocessing (EMDR)'],
  [/\bcpt\b|cognitive\s+processing/i, 'Cognitive Processing Therapy (CPT)'],
  [/\bseeking\s+safety\b/i, 'Seeking Safety'],
  [/\bpsychoeduc/i, 'Psychoeducation'],
  [/\b12[\s-]?step\b|twelve[\s-]?step\b|tsf\b/i, 'Twelve-Step Facilitation (TSF)'],
  [/\bsmart\s+recovery\b/i, 'SMART Recovery'],
  [/\bgrief\s+therapy\b|complicated\s+grief\b/i, 'Grief Therapy'],
  [/\bsomatic\b|body[\s-]?based\b/i, 'Somatic Experiencing'],
  [/\bperson[\s-]?cent(ered|red)\b/i, 'Person-Centered Therapy'],
  [/\brelapse\s+prev/i, 'Relapse Prevention Therapy'],
  [/\btrauma[\s-]?inform/i, 'Trauma-Informed Care'],
  [/\bnarrative\s+ther/i, 'Narrative Therapy'],
  [/\bsolution[\s-]?focus/i, 'Solution-Focused Brief Therapy (SFBT)'],
  [/\bcase\s+manag/i, 'Case Management'],
];

const INTERVENTION_MAP: Array<[RegExp, string]> = [
  [/\b(explore[ds]?|exploring)\b/i, 'Explored presenting concerns using open-ended inquiry'],
  [/\b(process(ed)?|processing)\b/i, 'Processed emotional content through reflective listening'],
  [/\b(discuss(ed)?|discussing)\b/i, 'Therapeutic discussion of session themes'],
  [/\b(practic(ed)?|practicing)\b/i, 'Skills practice in session'],
  [/\b(challeng(ed)?|reframe[ds]?|restructur)\b/i, 'Cognitive restructuring and reframing of maladaptive thoughts'],
  [/\b(grounding)\b/i, 'Grounding exercises to manage emotional dysregulation'],
  [/\b(breath\w+)\b/i, 'Breathing exercises for anxiety and craving management'],
  [/\b(role[\s-]?play\w*)\b/i, 'Role-play for skills rehearsal'],
  [/\b(psychoeducat\w+)\b/i, 'Psychoeducation on clinical concepts'],
  [/\b(safety\s+plan\w*)\b/i, 'Safety plan review and update'],
  [/\b(trigger\w*)\b/i, 'Trigger identification and mapping'],
  [/\b(craving\w*)\b/i, 'Craving management strategies'],
  [/\b(mindful\w*)\b/i, 'Mindfulness-based intervention'],
  [/\b(journal\w*)\b/i, 'Journaling as therapeutic homework'],
  [/\b(reflect\w+)\b/i, 'Reflective listening and summarizing'],
  [/\b(validate[ds]?|validation)\b/i, 'Validation of client experience and feelings'],
  [/\b(motivat\w+)\b/i, 'Motivational enhancement and change talk elicitation'],
  [/\b(values?\s+clarif\w+)\b/i, 'Values clarification exercise'],
  [/\b(decis\w+\s+balanc\w+)\b/i, 'Decisional balance exercise'],
];

const ENGAGEMENT_HIGH = /\b(very\s+engaged|highly\s+engaged|excellent\s+engagement|fully\s+engaged|active\s+participation|enthusiastic\w*|very\s+responsive|opened\s+up)\b/i;
const ENGAGEMENT_MODERATE = /\b(?<!\bnot?\s)(engaged|participat\w+|responsive|receptive|cooperat\w+|involved|articulat\w+)\b/i;
const ENGAGEMENT_PASSIVE = /\b(passiv\w+|minimal\w*\s+engagement|minimally\s+engaged|requir\w+\s+prompting|reluctant|withdrawn|quiet\s+throughout|guarded)\b/i;
const ENGAGEMENT_MINIMAL = /\b(refus\w+|disengag\w+|no\s+engagement|did\s+not\s+engage|shut\s+down|left\s+session|hostile)\b/i;

const SAFETY_PATTERNS: Array<[RegExp, { siHi?: string; sp?: string }]> = [
  [/deni(es?|ed)\s+(?:any\s+)?(?:suicidal|si\b|self[\s-]?harm)/i, { siHi: 'None' }],
  [/no\s+(?:si|hi|suicidal|homicidal)/i, { siHi: 'None' }],
  [/si\s*\/\s*hi\s+(?:denied|absent|clear|none)/i, { siHi: 'None' }],
  [/safety\s+plan\s+(?:intact|in\s+place|current|reviewed|maintained)/i, { sp: 'Current' }],
  [/safety\s+plan\s+(updated|revised|modified)/i, { sp: 'Updated' }],
  [/updated\s+(?:the\s+)?safety\s+plan/i, { sp: 'Updated' }],
  [/passive\s+(?:si|suicidal\s+ideation)/i, { siHi: 'Passive suicidal ideation without plan or intent' }],
  [/active\s+(?:si|suicidal)/i, { siHi: 'Active suicidal ideation — full safety assessment documented separately' }],
  [/(?:homicidal|hi)\b/i, { siHi: 'HI assessed — see risk documentation in clinical record' }],
  [/no\s+acute\s+safety|no\s+safety\s+concerns/i, { siHi: 'None' }],
];

// Plan extraction patterns
const PLAN_PATTERNS: RegExp[] = [
  /(?:plan(?:ned)?(?:\s+to)?|will)\s+(?:continue|focus|follow|return|meet|schedule|assign|practice)\s+([^.;]+)/i,
  /next\s+session(?:\s+will)?\s*[:\-–]?\s*([^.;]+)/i,
  /(?:assigned?|homework)\s*[:\-–]?\s*([^.;]+)/i,
  /follow[\s-]?up\s*[:\-–]?\s*([^.;]+)/i,
];

const HOMEWORK_PATTERNS: RegExp[] = [
  /(?:assigned?|homework|take[\s-]?home)\s*[:\-–]?\s*([^.;]{10,})/i,
  /(?:asked?\s+(?:client|patient|them|her|him)\s+to)\s+([^.;]{5,})/i,
  /(?:journal|worksheet|complete|practice)\s+([^.;]{5,})(?:\s+(?:at|between|this)\s+home)?/i,
];

const PRESENTING_CONCERN_PATTERNS: RegExp[] = [
  /(?:client|patient|she|he|they)\s+(?:came\s+in|presented?(?:\s+with)?|reports?(?:ing)?|brought|focused\s+on|talked\s+about|discussed|shared)\s+([^.;]{8,})/i,
  /session\s+(?:focused|centered|addressed)\s+(?:on|around)\s+([^.;]+)/i,
  /presenting\s+(?:concern|issue|problem)\s*[:\-]?\s*([^.;]+)/i,
  /(?:explored|processed)\s+([^.;]{8,})/i,
];

const RESPONSE_PATTERNS: RegExp[] = [
  /(?:client|patient|she|he|they)\s+(?:was|appeared?|seemed?|responded?(?:\s+(?:well|positively|negatively))?|demonstrated?|showed?|expressed?)\s+([^.;]{5,})/i,
  /(?:receptive|resistant|insight\w*|tearful|emotional|engag\w+)\s+(?:to|about|when|with)\s+([^.;]+)/i,
];

// ─── Core parser ─────────────────────────────────────────────────────────────

export function parseQuickCapture(text: string): QuickCaptureResult {
  const signals: ParsedSignal[] = [];
  const input: Partial<ProgressNoteInput> = {};

  if (!text.trim()) return { input, signals, parseScore: 0 };

  // 1. Presentation
  for (const [pattern, value] of PRESENTATION_MAP) {
    if (pattern.test(text)) {
      input.presentation = value;
      signals.push({ field: 'presentation', label: 'Presentation', value, confidence: 'high' });
      break;
    }
  }

  // 2. Mood
  const moodRatingMatch = text.match(MOOD_RATING);
  if (moodRatingMatch) {
    input.moodRating = `${moodRatingMatch[1]}/10`;
    signals.push({ field: 'moodRating', label: 'Mood Rating', value: `${moodRatingMatch[1]}/10`, confidence: 'high' });
  }
  for (const [pattern, mood] of MOOD_MAP) {
    if (pattern.test(text)) {
      const m = text.match(pattern);
      const detected = mood.startsWith('$') && m ? m[1].trim() : mood;
      if (detected && detected.length < 40) {
        input.mood = detected;
        signals.push({ field: 'mood', label: 'Mood', value: detected, confidence: 'medium' });
        break;
      }
    }
  }

  // 3. Modality
  for (const [pattern, modality] of MODALITY_MAP) {
    if (pattern.test(text)) {
      input.modality = modality;
      signals.push({ field: 'modality', label: 'Modality', value: modality, confidence: 'high' });
      break;
    }
  }

  // 4. Interventions (collect multiple)
  const matchedInterventions: string[] = [];
  for (const [pattern, intervention] of INTERVENTION_MAP) {
    if (pattern.test(text) && !matchedInterventions.includes(intervention)) {
      matchedInterventions.push(intervention);
      if (matchedInterventions.length >= 4) break;
    }
  }
  if (matchedInterventions.length > 0) {
    input.interventions = matchedInterventions.slice(0, 3).join('; ');
    signals.push({ field: 'interventions', label: 'Interventions', value: matchedInterventions.slice(0, 2).join('; '), confidence: 'medium' });
  }

  // 5. Engagement level
  if (ENGAGEMENT_MINIMAL.test(text)) {
    input.engagementLevel = 'Minimal';
    signals.push({ field: 'engagementLevel', label: 'Engagement', value: 'Minimal', confidence: 'high' });
  } else if (ENGAGEMENT_PASSIVE.test(text)) {
    input.engagementLevel = 'Passive';
    signals.push({ field: 'engagementLevel', label: 'Engagement', value: 'Passive', confidence: 'high' });
  } else if (ENGAGEMENT_HIGH.test(text)) {
    input.engagementLevel = 'Active';
    signals.push({ field: 'engagementLevel', label: 'Engagement', value: 'Active', confidence: 'high' });
  } else if (ENGAGEMENT_MODERATE.test(text)) {
    input.engagementLevel = 'Moderate';
    signals.push({ field: 'engagementLevel', label: 'Engagement', value: 'Moderate', confidence: 'medium' });
  }

  // 6. Safety
  let detectedSiHi = false;
  let detectedSp = false;
  for (const [pattern, result] of SAFETY_PATTERNS) {
    if (pattern.test(text)) {
      if (result.siHi && !detectedSiHi) {
        input.siHiStatus = result.siHi;
        signals.push({ field: 'siHiStatus', label: 'SI/HI', value: result.siHi === 'None' ? 'Denied' : result.siHi, confidence: 'high' });
        detectedSiHi = true;
      }
      if (result.sp && !detectedSp) {
        input.safetyPlanStatus = result.sp as ProgressNoteInput['safetyPlanStatus'];
        signals.push({ field: 'safetyPlanStatus', label: 'Safety Plan', value: result.sp, confidence: 'high' });
        detectedSp = true;
      }
    }
  }

  // 7. Presenting concern
  for (const pattern of PRESENTING_CONCERN_PATTERNS) {
    const m = text.match(pattern);
    if (m && m[1] && m[1].trim().length > 8) {
      input.presentingConcern = m[1].trim().replace(/\s+/g, ' ');
      signals.push({ field: 'presentingConcern', label: 'Presenting Concern', value: input.presentingConcern.slice(0, 60) + (input.presentingConcern.length > 60 ? '…' : ''), confidence: 'medium' });
      break;
    }
  }

  // 8. Client response
  for (const pattern of RESPONSE_PATTERNS) {
    const m = text.match(pattern);
    if (m && m[1] && m[1].trim().length > 5) {
      const response = m[0].trim();
      if (response.length < 200) {
        input.clientResponse = response;
        signals.push({ field: 'clientResponse', label: 'Client Response', value: response.slice(0, 60) + (response.length > 60 ? '…' : ''), confidence: 'low' });
        break;
      }
    }
  }

  // 9. Plan
  for (const pattern of PLAN_PATTERNS) {
    const m = text.match(pattern);
    if (m && m[1] && m[1].trim().length > 5) {
      const planText = m[1].trim();
      if (!input.plan) {
        input.plan = `Continue ${planText}`;
        signals.push({ field: 'plan', label: 'Plan', value: planText.slice(0, 60) + (planText.length > 60 ? '…' : ''), confidence: 'medium' });
      }
      break;
    }
  }

  // 10. Homework
  for (const pattern of HOMEWORK_PATTERNS) {
    const m = text.match(pattern);
    if (m && m[1] && m[1].trim().length > 5 && !input.homework) {
      input.homework = m[1].trim();
      signals.push({ field: 'homework', label: 'Homework', value: input.homework.slice(0, 60), confidence: 'low' });
      break;
    }
  }

  // 11. Parse score — sum confidence weights
  const weights: Record<string, number> = {
    presentation: 15, modality: 10, interventions: 15, engagementLevel: 10,
    siHiStatus: 20, safetyPlanStatus: 5, presentingConcern: 15, plan: 10, mood: 5, clientResponse: 5, homework: 5, moodRating: 5,
  };
  const totalPossible = Object.values(weights).reduce((a, b) => a + b, 0);
  const earned = signals.reduce((sum, s) => {
    const w = weights[s.field as string] ?? 5;
    return sum + (s.confidence === 'high' ? w : s.confidence === 'medium' ? w * 0.7 : w * 0.4);
  }, 0);
  const parseScore = Math.round(Math.min(100, (earned / totalPossible) * 100));

  return { input, signals, parseScore };
}

// ─── Note quality scorer ──────────────────────────────────────────────────────

export interface NoteQualityResult {
  score: number; // 0–100
  label: string;
  color: string;
  issues: string[];
  strengths: string[];
}

export function scoreNoteQuality(values: Record<string, string>): NoteQualityResult {
  const all = Object.values(values).join(' ');
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 0;

  // Presenting concern / first section populated
  const firstValue = Object.values(values)[0] ?? '';
  if (firstValue.length > 60) {
    score += 20;
    strengths.push('Behavioral observation documented');
  } else if (firstValue.length > 20) {
    score += 10;
    issues.push('Expand the opening section with more clinical detail');
  } else {
    issues.push('Opening section is empty or too brief');
  }

  // Intervention section
  const hasIntervention = /\b(CBT|DBT|MI|therapy|psychoeducation|explored|discussed|practic|worked|intervention|technique|skill|approach|modality)\b/i.test(all);
  if (hasIntervention) {
    score += 20;
    strengths.push('Intervention documented');
  } else {
    issues.push('Specify the therapeutic modality or technique used');
  }

  // Client response / Assessment
  const hasResponse = /\b(client|patient)\s+(was|responded?|demonstrated?|verbalized?|express\w+|appear\w+|showed?|stated?)\b/i.test(all);
  if (hasResponse) {
    score += 15;
    strengths.push('Client response captured');
  } else {
    issues.push('Document how the client responded to interventions');
  }

  // Safety documentation
  const hasSafety = /\b(SI|HI|suicid|homicid|safety\s+plan|no\s+acute|deni\w+\s+(?:SI|suicid))\b/i.test(all);
  if (hasSafety) {
    score += 20;
    strengths.push('Safety status documented');
  } else {
    issues.push('Safety (SI/HI) assessment must be documented');
  }

  // Plan section
  const lastValue = Object.values(values).slice(-1)[0] ?? '';
  if (lastValue.length > 40) {
    score += 15;
    strengths.push('Plan is specific');
  } else if (lastValue.length > 10) {
    score += 7;
    issues.push('Make the plan more specific with next session goals');
  } else {
    issues.push('Plan section is missing');
  }

  // Clinical specificity bonus
  const hasSpecificity = /\b(PHQ|GAD|COWS|CIWA|ASAM|DSM|ICD|MAT|Suboxone|naltrexone|mg|BID|CBT|BIRP|DAP|SOAP|GIRP|weekly|bi-weekly|daily|Residential|PHP|IOP)\b/i.test(all);
  if (hasSpecificity) {
    score += 10;
    strengths.push('Clinical specificity present');
  } else {
    issues.push('Add specific clinical details (scores, medications, frequency)');
  }

  const label =
    score >= 90 ? 'Excellent' :
    score >= 75 ? 'Strong' :
    score >= 55 ? 'Good' :
    score >= 35 ? 'Fair' :
    'Needs work';

  const color =
    score >= 90 ? 'text-green-600' :
    score >= 75 ? 'text-teal-600' :
    score >= 55 ? 'text-blue-600' :
    score >= 35 ? 'text-amber-600' :
    'text-red-500';

  return { score, label, color, issues, strengths };
}

// ─── Goal → topic suggestion map ─────────────────────────────────────────────

const GOAL_CATEGORY_TO_TOPICS: Record<string, string[]> = {
  'Relapse Prevention':   ['craving-triggers', 'relapse-warning-signs', 'halt'],
  'Substance Use':        ['craving-triggers', 'lapse-processing', 'relapse-warning-signs'],
  'Coping Skills':        ['halt', 'cognitive-distortions', 'self-compassion'],
  'Trauma':               ['trauma-stabilization', 'ptsd-symptoms', 'grounding-techniques'],
  'PTSD':                 ['ptsd-symptoms', 'trauma-stabilization', 'grounding-techniques'],
  'Family':               ['codependency', 'boundaries', 'relationship-repair'],
  'Relationships':        ['boundaries', 'relationship-repair', 'codependency'],
  'Mental Health':        ['depression-sud', 'anxiety-sud', 'self-compassion'],
  'Depression':           ['depression-sud', 'self-compassion', 'cognitive-distortions'],
  'Anxiety':              ['anxiety-sud', 'grounding-techniques', 'cognitive-distortions'],
  'Motivation':           ['ambivalence-mi', 'treatment-resistance', 'values-recovery'],
  'Spirituality':         ['twelve-step', 'values-recovery'],
  'Support Network':      ['twelve-step', 'smart-recovery', 'sober-social-network'],
  'Life Skills':          ['employment-financial', 'housing-needs'],
  'Employment':           ['employment-financial'],
  'Housing':              ['housing-needs'],
  'Grief':                ['grief-processing', 'recovery-loss'],
  'Discharge':            ['discharge-planning', 'continuing-care'],
  'Safety':               ['si-safety-planning'],
  'Medical':              ['mat-education', 'pain-management'],
  'Medication':           ['mat-education', 'overdose-education'],
};

export function getTopicSuggestionsFromGoals(goals: Array<{ category: string; status: string }>): string[] {
  const suggested = new Set<string>();
  goals
    .filter(g => g.status === 'In Progress')
    .forEach(g => {
      const cat = g.category;
      for (const [key, topicIds] of Object.entries(GOAL_CATEGORY_TO_TOPICS)) {
        if (cat.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cat.toLowerCase())) {
          topicIds.forEach(id => suggested.add(id));
          break;
        }
      }
    });
  return Array.from(suggested).slice(0, 5);
}

// ─── Format suggestion by staff role ─────────────────────────────────────────

export function suggestFormat(staffTitle: string): { format: string; reason: string } {
  const t = staffTitle.toLowerCase();
  if (t.includes('physician') || t.includes('md') || t.includes('do') || t.includes('medical') || t.includes('psychiatr')) {
    return { format: 'SOAP', reason: 'SOAP is the standard medical format for your role' };
  }
  if (t.includes('nurse') || t.includes('rn') || t.includes('lpn')) {
    return { format: 'DAP', reason: 'DAP is the standard nursing note format' };
  }
  if (t.includes('therapist') || t.includes('lmft') || t.includes('lcsw') || t.includes('lpc')) {
    return { format: 'GIRP', reason: 'GIRP keeps documentation goal-focused for therapy' };
  }
  if (t.includes('supervisor') || t.includes('director')) {
    return { format: 'DAP', reason: 'DAP is concise and standard for supervisor documentation' };
  }
  // Default counselor
  return { format: 'BIRP', reason: 'BIRP is the standard SUD counseling format' };
}
