/**
 * topicLibrary.ts
 *
 * Comprehensive catalog of common addiction-treatment session subjects,
 * organized by clinical category and staff role.
 *
 * Each topic carries pre-filled ProgressNoteInput values that the aiNoteEngine
 * uses to generate BIRP / DAP / SOAP / GIRP drafts automatically when a
 * clinician selects a topic — no manual form-filling required.
 */

import type { ProgressNoteInput } from './aiNoteEngine';

// ─── Role mapping ─────────────────────────────────────────────────────────────

/** Department strings as stored in mockStaff.ts */
export type StaffDepartment = 'Clinical' | 'Medical' | 'Nursing' | 'Executive' | 'Admissions' | 'Aftercare' | string;

/** Which staff titles "own" a topic (shown first in the picker) */
export type StaffTitleFragment =
  | 'Counselor'
  | 'Therapist'
  | 'Supervisor'
  | 'Physician'
  | 'Medical'
  | 'Nurse'
  | 'Technician'
  | 'Case Manager'
  | 'Intake'
  | 'Aftercare'
  | 'All';

// ─── Data structures ──────────────────────────────────────────────────────────

export interface TopicTemplate {
  id: string;
  label: string;
  category: string;
  emoji: string;
  description: string;
  /** Subset of staff title fragments that see this topic prominently */
  primaryRoles: StaffTitleFragment[];
  /** Input fields pre-populated for the AI engine */
  input: Partial<ProgressNoteInput>;
  /** For group sessions — replaces the Group Narrative field */
  groupNarrative?: string;
}

export interface TopicCategory {
  id: string;
  label: string;
  emoji: string;
  /** Topics sorted by relevance per role */
  topics: TopicTemplate[];
}

// ─── Categories & Topics ──────────────────────────────────────────────────────

export const TOPIC_CATEGORIES: TopicCategory[] = [

  // ══════════════════════════════════════════════════════════════
  //  1. CRAVING MANAGEMENT & RELAPSE PREVENTION
  // ══════════════════════════════════════════════════════════════
  {
    id: 'craving',
    label: 'Craving & Relapse Prevention',
    emoji: '🔥',
    topics: [
      {
        id: 'craving-triggers',
        label: 'Craving Triggers & Urge Surfing',
        category: 'Craving & Relapse Prevention',
        emoji: '🌊',
        description: 'Identifying internal/external triggers; urge-surfing technique',
        primaryRoles: ['Counselor', 'Therapist', 'Supervisor'],
        groupNarrative: 'Group session focused on identifying craving triggers and practicing urge-surfing techniques. Participants shared personal trigger profiles and practiced mindful observation of craving sensations without acting on them. The group explored the transient nature of cravings using the "wave" metaphor.',
        input: {
          presentingConcern: 'craving episodes and difficulty identifying underlying triggers precipitating urges to use',
          modality: 'Cognitive-Behavioral Therapy (CBT) with Mindfulness-Based Relapse Prevention (MBRP)',
          interventions: 'Trigger identification worksheet; urge-surfing mindfulness exercise; ABC (Antecedent-Behavior-Consequence) functional analysis of recent craving episode',
          interventionDetail: 'Client was guided through a body-scan urge surfing exercise. External triggers (people, places, things) and internal triggers (emotions, physical states) were catalogued collaboratively on a trigger map.',
          clientResponse: 'Client was able to identify three primary external triggers (specific neighborhood, former using peers, Friday evenings) and two internal triggers (boredom, loneliness). Reported feeling "less afraid" of cravings after practicing urge surfing.',
          clinicalAssessment: 'Client demonstrates emerging insight into their craving cycle. The ability to name and observe triggers without immediately reacting is a significant early recovery skill. Risk of relapse remains elevated in identified high-risk environments.',
          goalAddressed: 'Client will identify personal craving triggers and demonstrate at least one evidence-based coping strategy to manage urges without substance use.',
          plan: 'Continue relapse prevention focus. Assign trigger log for the coming week.',
          nextSessionGoal: 'Review trigger log; introduce HALT framework as secondary craving check',
          homework: 'Complete daily trigger log noting time, situation, intensity (0–10), and coping strategy used',
        },
      },
      {
        id: 'relapse-warning-signs',
        label: 'High-Risk Situations & Warning Signs',
        category: 'Craving & Relapse Prevention',
        emoji: '⚠️',
        description: 'Mapping the relapse warning sign sequence before use occurs',
        primaryRoles: ['Counselor', 'Therapist', 'Supervisor'],
        groupNarrative: 'Group focused on the relapse warning sign continuum — from emotional relapse through mental relapse to physical relapse. Members shared personal early warning signs and developed individual "red flag" checklists. Peer accountability strategies were introduced.',
        input: {
          presentingConcern: 'concerns about recognizing the early warning signs of relapse and difficulty distinguishing emotional from mental relapse signals',
          modality: 'Gorski CENAPS Relapse Prevention Model; Cognitive Restructuring',
          interventions: 'Relapse warning sign continuum mapping; personal red-flag checklist development; identification of recovery capital to counter high-risk triggers',
          interventionDetail: 'Reviewed the three-phase relapse model (emotional → mental → physical). Client mapped their own historical warning sequence based on prior relapse(s).',
          clientResponse: 'Client identified emotional relapse signs (isolation, skipping meetings, not talking about feelings) as occurring 2–3 weeks prior to past relapses. Demonstrated good recall and self-awareness regarding their personal pattern.',
          clinicalAssessment: 'Client is building self-knowledge of the relapse cycle which is essential for sustained recovery. The ability to recognize emotional relapse as the earliest stage represents meaningful insight. Continued monitoring of social isolation warranted.',
          goalAddressed: 'Client will identify personal relapse warning signs across the emotional, mental, and physical relapse continuum and develop a written response plan for each stage.',
          plan: 'Continue relapse prevention work. Develop personalized recovery action plan.',
          nextSessionGoal: 'Create written relapse prevention plan including emergency contacts and coping steps',
          homework: 'Complete personal warning sign inventory; discuss with sponsor or support person',
        },
      },
      {
        id: 'lapse-processing',
        label: 'Lapse / Relapse Processing',
        category: 'Craving & Relapse Prevention',
        emoji: '🔄',
        description: 'Post-lapse clinical review; preventing abstinence violation effect',
        primaryRoles: ['Counselor', 'Therapist', 'Supervisor'],
        input: {
          presentingConcern: 'a recent lapse/relapse to substance use and associated feelings of shame, guilt, and fear about treatment outcomes',
          modality: 'Motivational Interviewing; Cognitive Restructuring; Relapse Prevention',
          interventions: 'Non-judgmental lapse review using the "slip analysis" framework; exploration of antecedents (thoughts, emotions, situations); addressing abstinence violation effect; recommitment to recovery goals',
          interventionDetail: 'Clinician used a collaborative, non-shaming approach to examine the chain of events leading to the lapse. Client and clinician identified decision points where a different choice was available.',
          clientResponse: 'Client expressed significant shame and discouragement. Was receptive to reframing the lapse as information rather than failure. Identified two missed decision points prior to the lapse where they could have engaged their coping plan.',
          clinicalAssessment: 'Client is at elevated risk for continued use secondary to shame and demoralization. The abstinence violation effect is present and must be actively countered. Motivational level remains sufficient for treatment engagement. Level of care considerations are being evaluated.',
          goalAddressed: 'Client will process recent lapse without self-destructive shame, identify specific decision points, and recommit to individualized recovery plan.',
          plan: 'Increase session frequency. Review and revise safety and relapse prevention plan. Consider level-of-care adjustment if use continues.',
          nextSessionGoal: 'Review revised coping plan; assess for ongoing craving and level of care appropriateness',
          homework: 'Write a brief "lapse letter" identifying what happened, what can be learned, and one concrete change to the recovery plan',
        },
      },
      {
        id: 'halt',
        label: 'HALT — Hunger, Anger, Loneliness, Tiredness',
        category: 'Craving & Relapse Prevention',
        emoji: '✋',
        description: 'HALT check-in as daily relapse prevention self-monitoring',
        primaryRoles: ['Counselor', 'Supervisor'],
        groupNarrative: 'Group focused on the HALT model as a daily self-check to identify unmet basic needs that increase relapse vulnerability. Members practiced applying HALT to recent high-risk moments and shared strategies for addressing each state before it escalates.',
        input: {
          presentingConcern: 'difficulty recognizing when basic physical and emotional needs are unmet and how this increases craving and relapse risk',
          modality: 'Psychoeducation; Cognitive-Behavioral Techniques',
          interventions: 'HALT psychoeducation and self-monitoring introduction; identification of client\'s most common HALT state; individualized HALT response plan development',
          interventionDetail: 'Client learned to use HALT as a daily check-in tool — pausing to assess Hunger, Anger, Loneliness, and Tiredness before making decisions in recovery.',
          clientResponse: 'Client identified loneliness as the most common and underacknowledged HALT state. Shared several recent instances where loneliness preceded craving. Expressed interest in building sober social connections.',
          clinicalAssessment: 'Client is beginning to connect emotional and physical states with craving spikes — a foundational insight for self-regulatory recovery. Loneliness and social isolation represent key treatment targets going forward.',
          goalAddressed: 'Client will use the HALT framework daily to identify unmet needs and employ targeted coping strategies before cravings escalate.',
          plan: 'Continue relapse prevention and skills-building work.',
          nextSessionGoal: 'Review HALT log; explore sober social connection strategies',
          homework: 'Complete HALT self-check three times daily for one week; note what need was present and how it was addressed',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  2. MOTIVATION & READINESS TO CHANGE
  // ══════════════════════════════════════════════════════════════
  {
    id: 'motivation',
    label: 'Motivation & Readiness to Change',
    emoji: '💡',
    topics: [
      {
        id: 'ambivalence-mi',
        label: 'Ambivalence & Decisional Balancing',
        category: 'Motivation & Readiness to Change',
        emoji: '⚖️',
        description: 'Exploring pros/cons of change using Motivational Interviewing',
        primaryRoles: ['Counselor', 'Therapist', 'Supervisor'],
        groupNarrative: 'Group session used a decisional balance exercise to help participants explore their ambivalence about recovery. Members shared both the costs and perceived benefits of continued substance use alongside the benefits of sobriety, normalizing ambivalence as a common experience in early recovery.',
        input: {
          presentingConcern: 'significant ambivalence about sustained sobriety and commitment to treatment; reports uncertainty about whether recovery is "worth it"',
          modality: 'Motivational Interviewing (MI)',
          interventions: 'Decisional balance matrix (pros/cons of use vs. sobriety); reflective listening; change talk elicitation using DARN-CAT (Desire, Ability, Reasons, Need, Commitment, Activation, Taking Steps); rolling with resistance',
          interventionDetail: 'Used open-ended questions to explore the client\'s ambivalence without confrontation. Reflected and amplified change talk while avoiding argumentation around sustaining talk.',
          clientResponse: 'Client identified meaningful "reasons for change" including health, family relationships, and financial stability. Sustaining talk noted but decreased in frequency during session. Client rated importance of change at 6/10 and confidence at 4/10.',
          clinicalAssessment: 'Client is in the Contemplation stage per the Transtheoretical Model. Ambivalence is normative and expected at this stage. Motivational interviewing is the evidence-based approach indicated. Directive confrontation would likely increase resistance.',
          goalAddressed: 'Client will verbalize at least three personal reasons for pursuing sustained recovery as identified through structured decisional balancing.',
          plan: 'Continue MI approach. Focus on developing discrepancy between current behavior and stated values.',
          nextSessionGoal: 'Explore change talk further; begin identifying small, concrete action steps consistent with Preparation stage',
          homework: 'Write a "values card" listing the top three things sobriety would allow them to do or become',
        },
      },
      {
        id: 'treatment-resistance',
        label: 'Treatment Resistance & Reluctance',
        category: 'Motivation & Readiness to Change',
        emoji: '🧱',
        description: 'Court-ordered or externally motivated clients; building internal motivation',
        primaryRoles: ['Counselor', 'Therapist', 'Supervisor'],
        input: {
          presentingConcern: 'externally motivated treatment attendance (legal/family pressure) with minimal internal motivation for change; expressed desire to "get through treatment" rather than engage therapeutically',
          modality: 'Motivational Interviewing; Person-Centered Therapy',
          interventions: 'Exploration of personal values not yet connected to recovery; validation of external pressures while finding internal anchors for change; building therapeutic alliance without confronting resistance',
          interventionDetail: 'Clinician avoided the "righting reflex" and focused on building rapport. Used affirmation and reflection to highlight client strengths and moments of authentic engagement.',
          clientResponse: 'Client remained somewhat guarded but engaged briefly when discussion turned to family relationships and career aspirations. First evidence of internal motivation language (\'I don\'t want to be like this\') observed.',
          clinicalAssessment: 'Client is in Precontemplation/early Contemplation stage. External mandate is current motivator. Internal motivation is present but not yet primary. Alliance-building and values exploration are the priorities before skill-based work can occur.',
          goalAddressed: 'Client will identify at least one personally meaningful reason for engaging in treatment beyond external requirements.',
          plan: 'Continue alliance-building. Maintain MI stance. Avoid confrontation and psychoeducation heavy approaches until motivation is stronger.',
          nextSessionGoal: 'Explore life-areas most affected by substance use; continue change talk elicitation',
          homework: 'Think about one area of life (relationships, work, health) they would most like to improve and bring that topic to next session',
        },
      },
      {
        id: 'values-recovery',
        label: 'Values Clarification & Recovery Vision',
        category: 'Motivation & Readiness to Change',
        emoji: '🌟',
        description: 'Connecting long-term values and life vision to recovery commitment',
        primaryRoles: ['Counselor', 'Therapist'],
        groupNarrative: 'Group session focused on values clarification as a foundation for recovery motivation. Members completed a values card sort activity and identified their top five core values. Discussion centered on how active substance use conflicted with those values and how sobriety realigns with what matters most.',
        input: {
          presentingConcern: 'difficulty sustaining motivation for recovery due to loss of a clear sense of purpose and direction; reports feeling "like I don\'t know who I am without using"',
          modality: 'Acceptance and Commitment Therapy (ACT); Values-Based Motivational Interviewing',
          interventions: 'Values clarification card sort; recovery vision narrative exercise; committed action planning aligned with core values; cognitive defusion from addiction-identity narratives',
          interventionDetail: 'Client selected top five personal values from a card sort and explored how substance use served and conflicted with those values. A "recovery vision statement" was drafted.',
          clientResponse: 'Client identified family, integrity, and purpose as top values. Became visibly emotional when connecting current behavior to the gap between lived reality and stated values. Expressed renewed motivation.',
          clinicalAssessment: 'Values clarification exercise produced meaningful emotional engagement and a shift toward change talk. The gap between values and behavior is a powerful motivational lever for this client. Recovery vision work should continue.',
          goalAddressed: 'Client will articulate a clear connection between their core values and their commitment to sustained recovery, and will use this values-recovery link to sustain motivation during high-risk moments.',
          plan: 'Continue ACT-based recovery vision development.',
          nextSessionGoal: 'Refine recovery vision statement; begin translating values into concrete behavioral commitments',
          homework: 'Write a one-paragraph "recovery vision" describing life 2 years from now if recovery goals are achieved',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  3. TRAUMA & PTSD
  // ══════════════════════════════════════════════════════════════
  {
    id: 'trauma',
    label: 'Trauma & PTSD',
    emoji: '🛡️',
    topics: [
      {
        id: 'trauma-stabilization',
        label: 'Trauma Stabilization & Safety Skills',
        category: 'Trauma & PTSD',
        emoji: '⚓',
        description: 'Phase-1 trauma work: grounding, window of tolerance, safety',
        primaryRoles: ['Therapist', 'Counselor'],
        groupNarrative: 'Trauma-informed group session focused on stabilization skills. Members practiced grounding techniques (5-4-3-2-1 sensory method, box breathing) and learned about the window of tolerance. No trauma narrative sharing occurred; session remained skill-focused.',
        input: {
          presentingConcern: 'trauma history contributing to substance use as self-medication; reports hypervigilance, intrusive memories, and emotional dysregulation impacting recovery',
          modality: 'Seeking Safety; Trauma-Informed Care; Grounding Techniques',
          interventions: 'Psychoeducation on trauma-substance use connection; window of tolerance concept; 5-4-3-2-1 grounding exercise; safe-place visualization; body-based grounding (feet on floor, breath)',
          interventionDetail: 'Stabilization-phase trauma work conducted. No trauma narrative explored this session — focus was on building a reliable coping toolkit before processing work begins.',
          clientResponse: 'Client tolerated grounding techniques well. Reported 5-4-3-2-1 exercise reduced distress from 8/10 to 5/10. Identified smell and sound as most effective sensory anchors.',
          clinicalAssessment: 'Client is in Phase 1 (Stabilization) of trauma-informed treatment. Grounding skills are building. Readiness for Phase 2 trauma processing will be assessed after client demonstrates consistent use of stabilization tools without decompensation.',
          goalAddressed: 'Client will develop and practice a minimum of three grounding techniques to manage trauma-related distress without resorting to substance use.',
          plan: 'Continue Phase 1 Seeking Safety work. Practice grounding between sessions.',
          nextSessionGoal: 'Review grounding practice; introduce distress tolerance (TIPP skill); continue safety assessment',
          homework: 'Practice 5-4-3-2-1 grounding daily, especially when noticing trauma symptoms (hypervigilance, intrusive thoughts, body tension)',
        },
      },
      {
        id: 'ptsd-symptoms',
        label: 'PTSD Symptom Management',
        category: 'Trauma & PTSD',
        emoji: '🌪️',
        description: 'Addressing hyperarousal, avoidance, intrusions in SUD context',
        primaryRoles: ['Therapist', 'Counselor'],
        input: {
          presentingConcern: 'active PTSD symptoms including nightmares, flashbacks, hypervigilance, and avoidance behaviors that are directly interfering with treatment engagement and recovery',
          modality: 'Cognitive Processing Therapy (CPT); Trauma-Informed CBT',
          interventions: 'PTSD symptom mapping (intrusion, avoidance, negative cognition, hyperarousal clusters); psychoeducation on trauma memory consolidation; stuck point identification; sleep hygiene for nightmare disruption',
          interventionDetail: 'Clinician and client reviewed the four PTSD symptom clusters and mapped client-specific symptoms to each. A primary "stuck point" (trauma-related maladaptive belief) was identified: "I am damaged and cannot recover."',
          clientResponse: 'Client was able to identify the stuck point as a driving belief underlying both trauma avoidance and substance use. Showed moderate distress during discussion but remained within window of tolerance.',
          clinicalAssessment: 'PTSD symptoms are significant and require structured trauma processing. Client is demonstrating sufficient stabilization for beginning CPT stuck point work. Close monitoring for dissociation and decompensation warranted.',
          goalAddressed: 'Client will identify and begin challenging at least two stuck points related to trauma that are maintaining PTSD symptoms and contributing to substance use as self-medication.',
          plan: 'Continue CPT stuck point work. Coordinate with prescriber regarding medication support for nightmares if indicated.',
          nextSessionGoal: 'Review ABC worksheet on primary stuck point; introduce impact statement concept',
          homework: 'Complete Impact Statement: written description of why the trauma occurred and what it means about self, others, and the world',
          coordinationNote: 'prescribing physician regarding prazosin for nightmares if sleep disruption continues',
        },
      },
      {
        id: 'aces',
        label: 'Adverse Childhood Experiences (ACEs)',
        category: 'Trauma & PTSD',
        emoji: '🧒',
        description: 'ACEs psychoeducation and connection to current health and SUD',
        primaryRoles: ['Therapist', 'Counselor', 'Supervisor'],
        input: {
          presentingConcern: 'significant adverse childhood experiences (ACEs) including abuse, neglect, and household dysfunction that form the developmental backdrop for current substance use disorder',
          modality: 'Trauma-Informed Care; Psychoeducation; Narrative Therapy',
          interventions: 'ACEs survey review and psychoeducation on dose-response relationship; reframing SUD as an adaptive response to early adversity; exploration of resilience factors; identifying the child who survived',
          interventionDetail: 'Used a non-pathologizing ACEs framework to help client understand their SUD as a response to pain rather than a character defect. Emphasis placed on survivor strengths.',
          clientResponse: 'Client responded with visible relief upon hearing SUD framed as a learned coping response rather than moral failure. ACE score of 6 contextualized. Expressed: "I never thought about it that way."',
          clinicalAssessment: 'ACE psychoeducation is producing shame reduction and a shift from self-blame to self-compassion — a key therapeutic milestone. Client\'s high ACE burden (score 6) indicates significant developmental trauma requiring ongoing trauma-informed treatment.',
          goalAddressed: 'Client will understand the relationship between adverse childhood experiences and current substance use disorder, and will begin to reframe their SUD as a response to pain rather than a personal failing.',
          plan: 'Continue trauma-informed treatment. Explore childhood resilience and protective factors in subsequent sessions.',
          nextSessionGoal: 'Explore protective childhood factors and early resilience; identify a "wise adult self" perspective toward the child who experienced adversity',
          homework: 'Write a letter of compassion to your childhood self — what would you want that child to know?',
        },
      },
      {
        id: 'grounding-techniques',
        label: 'Grounding Techniques for Dissociation',
        category: 'Trauma & PTSD',
        emoji: '🌱',
        description: 'Sensory, cognitive, and somatic grounding for trauma dissociation',
        primaryRoles: ['Therapist', 'Counselor'],
        groupNarrative: 'Trauma-informed skills group focused on grounding techniques to manage dissociation. Three grounding methods were practiced: sensory (5-4-3-2-1), cognitive (naming objects in the room), and somatic (feet on floor, hand on heart). Group members shared which methods felt most accessible.',
        input: {
          presentingConcern: 'dissociative episodes occurring during treatment activities and daily life, increasing vulnerability to impulsive substance use behaviors',
          modality: 'Somatic Experiencing; Trauma-Informed Stabilization',
          interventions: 'Sensory grounding (5-4-3-2-1 method); cognitive grounding (present-moment orientation); somatic grounding (physical containment, breath work); dissociation psychoeducation; dissociation log introduction',
          interventionDetail: 'Practiced three grounding techniques in session. Identified client\'s most effective method (tactile — holding ice cube) as their primary go-to strategy.',
          clientResponse: 'Client was able to return to present-moment awareness within 3 minutes using cold-water/ice technique after demonstrating mild dissociation early in session. Showed increased groundedness through remainder of session.',
          clinicalAssessment: 'Grounding skills are developing. Dissociation is decreasing in intensity with practice. Continued skill practice and monitoring of dissociation severity are warranted before trauma processing work begins.',
          goalAddressed: 'Client will independently apply a minimum of two grounding techniques to interrupt dissociative episodes and maintain present-moment awareness during treatment.',
          plan: 'Continue stabilization-phase work. Introduce dissociation log.',
          nextSessionGoal: 'Review dissociation log; practice grounding in simulated mildly activating context',
          homework: 'Use dissociation log to track: time, trigger, duration, grounding method used, and effectiveness rating (0–10)',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  4. SHAME, GUILT & COGNITIVE PATTERNS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'shame-cognition',
    label: 'Shame, Guilt & Cognitive Patterns',
    emoji: '🧠',
    topics: [
      {
        id: 'shame-guilt',
        label: 'Shame vs. Guilt Processing',
        category: 'Shame, Guilt & Cognitive Patterns',
        emoji: '💔',
        description: 'Differentiating toxic shame from productive guilt in recovery',
        primaryRoles: ['Counselor', 'Therapist'],
        groupNarrative: 'Group explored the clinical distinction between shame ("I am bad") and guilt ("I did something bad"), and how shame fuels relapse while productive guilt motivates repair. Members shared personal shame messages and practiced re-authoring them with a guilt-based, action-oriented perspective.',
        input: {
          presentingConcern: 'pervasive shame regarding past behavior during active addiction that is functioning as a relapse driver and barrier to treatment engagement',
          modality: 'Shame Resilience Theory (Brown); Cognitive Restructuring',
          interventions: 'Shame vs. guilt psychoeducation; identification of core shame messages; externalizing the addiction identity; self-compassion practices; reframing past behavior in the context of addiction as a disease',
          interventionDetail: 'Used Brené Brown\'s shame resilience framework. Client identified the primary shame message: "I\'m a terrible mother." Worked to separate the person from the addiction-driven behavior.',
          clientResponse: 'Client was tearful when articulating shame narrative. Made initial shift from "I am a terrible mother" to "I did things I regret while sick with addiction — and I\'m changing that now." Visible emotional relief noted.',
          clinicalAssessment: 'Shame is a significant relapse risk and treatment barrier for this client. Initial shift from shame to accountable guilt was observed this session — a meaningful therapeutic milestone. Continued work is needed to consolidate this reframe.',
          goalAddressed: 'Client will distinguish between shame and guilt, reduce toxic shame through cognitive restructuring, and develop a self-compassionate narrative about their addiction that supports accountability without self-destruction.',
          plan: 'Continue shame resilience work. Introduce self-compassion practices.',
          nextSessionGoal: 'Practice self-compassion break exercise; explore amends process through the lens of guilt-based accountability',
          homework: 'Write down three shame messages and beside each, rewrite it as an accountable guilt statement that points toward action',
        },
      },
      {
        id: 'cognitive-distortions',
        label: 'Cognitive Distortions in Addiction',
        category: 'Shame, Guilt & Cognitive Patterns',
        emoji: '🔍',
        description: 'Identifying all-or-nothing thinking, minimizing, permission-giving beliefs',
        primaryRoles: ['Counselor', 'Therapist'],
        groupNarrative: 'CBT-based group session on cognitive distortions common in addiction. Members learned to identify all-or-nothing thinking, minimization, rationalization, and permission-giving thoughts ("just this once"). Each member shared one addiction-related cognitive distortion and the group collaboratively challenged it.',
        input: {
          presentingConcern: 'persistent cognitive distortions including all-or-nothing thinking, catastrophizing, and permission-giving beliefs that are undermining recovery and increasing relapse vulnerability',
          modality: 'Cognitive-Behavioral Therapy (CBT); Rational Emotive Behavior Therapy (REBT)',
          interventions: 'Cognitive distortion identification and labeling; thought records (Situation-Thought-Emotion-Behavior chain); Socratic questioning; cognitive restructuring to balanced thinking',
          interventionDetail: 'Worked through two specific cognitive distortions: (1) "If I can\'t do recovery perfectly, I might as well not try" (all-or-nothing), and (2) "One drink won\'t hurt" (permission-giving). Used thought record to challenge and reframe.',
          clientResponse: 'Client was able to identify both distortions and generate more balanced alternative thoughts. Acknowledged the habitual nature of these thinking patterns. Expressed willingness to use thought records between sessions.',
          clinicalAssessment: 'CBT cognitive restructuring work is progressing. Client is developing metacognitive awareness of their thought patterns. Consistency in applying these skills outside session is the current challenge.',
          goalAddressed: 'Client will identify and challenge a minimum of three addiction-related cognitive distortions using CBT thought records, replacing them with balanced, recovery-supportive thinking.',
          plan: 'Continue CBT thought record practice. Address new distortions as they arise.',
          nextSessionGoal: 'Review thought records completed between sessions; introduce "hot thought" identification technique',
          homework: 'Complete thought record for any moment this week when you felt a strong urge to use or had a distorted thought about recovery',
        },
      },
      {
        id: 'self-compassion',
        label: 'Self-Compassion & Inner Critic',
        category: 'Shame, Guilt & Cognitive Patterns',
        emoji: '💛',
        description: 'Kristin Neff self-compassion model applied to recovery identity',
        primaryRoles: ['Therapist', 'Counselor'],
        input: {
          presentingConcern: 'harsh self-criticism and an overactive inner critic that intensifies shame, undermines recovery confidence, and mirrors the self-critical voice that historically preceded substance use',
          modality: 'Mindful Self-Compassion (MSC); Acceptance and Commitment Therapy (ACT)',
          interventions: 'Self-compassion break (mindfulness, common humanity, self-kindness); inner critic externalization exercise; compassionate letter to self; loving-kindness meditation adapted for recovery',
          interventionDetail: 'Client practiced the self-compassion break in response to a specific self-critical thought that arose in session. The three components (mindfulness, common humanity, self-kindness) were practiced sequentially.',
          clientResponse: 'Client found "common humanity" component most impactful — realizing they are not alone in struggling with addiction reduced isolation. Initially resistant to self-kindness ("I don\'t deserve it") but showed openness by end of session.',
          clinicalAssessment: 'Self-compassion is an evidence-based protective factor for sustained recovery. Client\'s resistance to self-kindness reflects the depth of internalized shame and will require consistent therapeutic cultivation. Progress was meaningful this session.',
          goalAddressed: 'Client will practice self-compassion skills to counter the inner critic, replacing self-destructive shame with compassionate self-accountability that supports rather than undermines recovery.',
          plan: 'Continue MSC-based work. Assign daily self-compassion practice.',
          nextSessionGoal: 'Review compassionate letter; explore the relationship between self-criticism and past substance use',
          homework: 'Write a compassionate letter to yourself from the perspective of a wise, caring friend who knows your full story and wants the best for you',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  5. FAMILY DYNAMICS & RELATIONSHIPS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'family',
    label: 'Family Dynamics & Relationships',
    emoji: '👨‍👩‍👧',
    topics: [
      {
        id: 'codependency',
        label: 'Codependency & Enabling Patterns',
        category: 'Family Dynamics & Relationships',
        emoji: '🪢',
        description: 'Identifying enabling, people-pleasing, and enmeshment in recovery',
        primaryRoles: ['Therapist', 'Counselor'],
        groupNarrative: 'Group focused on codependency and enabling patterns in family systems affected by addiction. Members explored the difference between support and enabling, identified roles they played in family systems (enabler, hero, scapegoat, lost child), and discussed how these roles affect their own recovery.',
        input: {
          presentingConcern: 'relationship patterns characterized by codependency, people-pleasing, and difficulty setting limits with others, which are directly undermining recovery environment and stability',
          modality: 'Codependency Recovery Framework; Family Systems Theory; DBT Interpersonal Effectiveness',
          interventions: 'Codependency psychoeducation and self-assessment; exploration of family roles; distinction between supporting and enabling; interpersonal effectiveness skill introduction (DEAR MAN)',
          interventionDetail: 'Identified family-of-origin dynamics that shaped codependent patterns. Client recognized enabling role played by spouse as a current treatment challenge requiring family involvement.',
          clientResponse: 'Client demonstrated good insight into the enabling dynamic in their primary relationship. Expressed ambivalence about addressing it directly out of fear of conflict. Identified this as a key treatment target.',
          clinicalAssessment: 'Codependency patterns represent a significant recovery risk factor. The enabling relationship must be addressed through either conjoint family work or continued individual processing of healthy limits. Family therapy referral is being considered.',
          goalAddressed: 'Client will identify codependent relationship patterns and begin developing healthy interdependence skills that support recovery rather than enabling continued problematic dynamics.',
          plan: 'Continue family systems work. Assess for family therapy involvement.',
          nextSessionGoal: 'Practice one assertive communication statement using DEAR MAN; explore readiness for conjoint family session',
          homework: 'Keep a relationship log this week noting any interactions where you felt you "gave yourself away" or said yes when you wanted to say no',
          coordinationNote: 'family therapist or family program regarding conjoint session inclusion',
        },
      },
      {
        id: 'boundaries',
        label: 'Boundary Setting in Recovery',
        category: 'Family Dynamics & Relationships',
        emoji: '🚧',
        description: 'Establishing healthy personal boundaries with family, peers, and partners',
        primaryRoles: ['Counselor', 'Therapist'],
        groupNarrative: 'Group session on the role of boundaries in recovery. Members discussed what healthy limits look like, the fear of conflict that often prevents limit-setting, and practiced limit-setting language using the DEAR MAN framework. Role-plays included saying no to offers of substances and to enabling family members.',
        input: {
          presentingConcern: 'difficulty setting and maintaining healthy personal limits with family members and peers, resulting in overextension, resentment, and increased relapse risk',
          modality: 'DBT Interpersonal Effectiveness; Assertiveness Training',
          interventions: 'Boundary continuum psychoeducation (porous, rigid, healthy); DEAR MAN skill practice; role-play of limit-setting conversations; exploration of fear of abandonment or conflict underlying difficulty with limits',
          interventionDetail: 'Practiced a specific limit-setting conversation with family member who continues to offer alcohol in client\'s presence. Client identified the underlying fear (rejection) maintaining the pattern.',
          clientResponse: 'Client was able to articulate a clear limit statement in role-play: "I need you not to drink around me for now — it\'s important for my recovery." Moderate anxiety during role-play; decreased with rehearsal.',
          clinicalAssessment: 'Limit-setting skills are developing. The connection between people-pleasing patterns and relapse risk is becoming clearer to the client. Skill generalization to real-life contexts is the next challenge.',
          goalAddressed: 'Client will identify at least three personal limits necessary for recovery and demonstrate the ability to communicate them clearly and calmly using assertive communication skills.',
          plan: 'Continue interpersonal effectiveness skills training.',
          nextSessionGoal: 'Debrief any limit-setting attempts; address obstacles encountered; extend practice to workplace context',
          homework: 'Identify one limit that needs to be set this week and practice the conversation using DEAR MAN script before having it',
        },
      },
      {
        id: 'relationship-repair',
        label: 'Relationship Rebuilding Post-Addiction',
        category: 'Family Dynamics & Relationships',
        emoji: '🌉',
        description: 'Trust repair, amends, and healthy communication with affected loved ones',
        primaryRoles: ['Counselor', 'Therapist'],
        input: {
          presentingConcern: 'significant relational damage resulting from active addiction including broken trust, hurtful behavior, and estranged family relationships; desire to repair these relationships as a recovery motivator',
          modality: 'Narrative Therapy; 12-Step Step-8/9 Integration; Relational Therapy',
          interventions: 'Relationship inventory completion; amends readiness assessment; direct vs. indirect amends psychoeducation; communication skills for repair conversations; managing rejection in amends process',
          interventionDetail: 'Explored client\'s readiness for direct amends and identified two relationships where repair attempts would be most impactful and safe. Discussed the difference between making amends and seeking forgiveness.',
          clientResponse: 'Client is highly motivated to repair relationship with adult child. Expressed appropriate ambiguity about whether forgiveness will be forthcoming, showing realistic expectations. Made meaningful distinction between amends and apology.',
          clinicalAssessment: 'Client is approaching the amends process with appropriate emotional readiness and realistic expectations. Continued preparation for direct amends conversations is warranted. Clinician will monitor for shame-driven impulsivity in the repair process.',
          goalAddressed: 'Client will prepare and deliver a meaningful amends to at least one affected person, demonstrating accountability without expectation of immediate forgiveness.',
          plan: 'Continue amends preparation work. Schedule family session if indicated.',
          nextSessionGoal: 'Practice amends conversation using role-play; process anticipatory anxiety and expectations',
          homework: 'Write a draft amends letter (not to be sent yet) — include acknowledgment of harm, expression of accountability, and statement of changed behavior',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  6. CO-OCCURRING MENTAL HEALTH
  // ══════════════════════════════════════════════════════════════
  {
    id: 'cooccurring',
    label: 'Co-occurring Mental Health',
    emoji: '🧩',
    topics: [
      {
        id: 'depression-sud',
        label: 'Depression & SUD (Dual Diagnosis)',
        category: 'Co-occurring Mental Health',
        emoji: '🌧️',
        description: 'Addressing MDD or dysthymia co-occurring with substance use disorder',
        primaryRoles: ['Therapist', 'Physician', 'Supervisor'],
        input: {
          presentingConcern: 'persistent depressive symptoms co-occurring with substance use disorder including low mood, anhedonia, fatigue, cognitive slowing, and hopelessness about recovery outcomes',
          modality: 'Integrated Dual Diagnosis Treatment; Behavioral Activation; CBT for Depression',
          interventions: 'PHQ-9 administration and review; behavioral activation planning (scheduling pleasurable and mastery activities); cognitive restructuring of hopelessness; medication compliance review; sleep hygiene assessment',
          interventionDetail: 'PHQ-9 administered: score 14 (moderate depression). Explored temporal relationship between depression onset and substance use. Introduced behavioral activation as an antidepressant intervention.',
          clientResponse: 'Client engaged thoughtfully with behavioral activation scheduling. Identified walking and brief social contact as accessible initial activities. Depression relief through activity is a novel concept the client responded well to.',
          clinicalAssessment: 'Moderate depression is present and must be addressed as a co-primary treatment target — not merely as a consequence of substance use. Dual-diagnosis integrated care is indicated. Psychiatric medication evaluation to be discussed.',
          goalAddressed: 'Client will engage in behavioral activation activities to address depression symptoms, understand the bidirectional relationship between depression and substance use, and participate in psychiatric evaluation if indicated.',
          plan: 'Continue integrated dual-diagnosis treatment. Assess for psychiatric medication evaluation.',
          nextSessionGoal: 'Review behavioral activation log; assess PHQ-9 change; continue CBT for depression',
          homework: 'Complete behavioral activation log — schedule and engage in one pleasurable and one mastery activity each day',
          coordinationNote: 'psychiatry for medication evaluation of major depressive disorder',
          patientReports: 'low mood rated 3/10, anhedonia, poor sleep, difficulty concentrating, and occasional passive suicidal ideation without plan or intent',
          objectiveFindings: 'PHQ-9: 14 (moderate). Affect constricted. Psychomotor slowing noted. Speech: slow pace but adequate volume. SI: passive, no plan, safety plan reviewed and intact.',
        },
      },
      {
        id: 'anxiety-sud',
        label: 'Anxiety & SUD Management',
        category: 'Co-occurring Mental Health',
        emoji: '💨',
        description: 'GAD, social anxiety, or panic co-occurring with substance use',
        primaryRoles: ['Therapist', 'Physician'],
        input: {
          presentingConcern: 'significant anxiety symptoms co-occurring with substance use disorder; history of using substances to manage anxiety; concern that anxiety without substances is intolerable',
          modality: 'CBT for Anxiety; Acceptance and Commitment Therapy (ACT); Relaxation Training',
          interventions: 'GAD-7 administration; anxiety psychoeducation (fight-or-flight, anxiety cycle); diaphragmatic breathing; progressive muscle relaxation (PMR); cognitive restructuring of anxious predictions; substance-anxiety cycle education',
          interventionDetail: 'GAD-7 score: 12 (moderate anxiety). Explored the anxiety-substance cycle: anxiety → substance use for relief → withdrawal anxiety → more use. Client recognized this cycle clearly.',
          clientResponse: 'Client was receptive to understanding anxiety as a treatable condition rather than a permanent state. Practiced diaphragmatic breathing and reported subjective anxiety decrease from 7/10 to 4/10.',
          clinicalAssessment: 'Anxiety is both a trigger for substance use and an expected feature of early recovery. Integrated treatment targeting both is essential. Non-pharmacological anxiety management must be developed before any benzodiazepine considerations arise.',
          goalAddressed: 'Client will develop non-pharmacological anxiety management skills and understand the substance-anxiety cycle to prevent anxiety from triggering relapse.',
          plan: 'Continue anxiety management skill development. Assess for SSRI/SNRI evaluation through psychiatry if anxiety remains severe.',
          nextSessionGoal: 'Review anxiety management skill practice; introduce worry time technique; discuss social anxiety specifically',
          homework: 'Practice diaphragmatic breathing for 5 minutes twice daily; rate anxiety before and after on 0–10 scale',
          coordinationNote: 'psychiatry regarding SSRI evaluation for anxiety management if symptoms persist',
          patientReports: 'persistent worry, muscle tension, difficulty sleeping, avoidance of social situations, and increased anxiety since reducing substance use',
          objectiveFindings: 'GAD-7: 12 (moderate anxiety). Affect anxious. Motor: slight restlessness. No panic attack reported today. SI/HI: denied.',
        },
      },
      {
        id: 'bipolar-sud',
        label: 'Bipolar Disorder & Substance Use',
        category: 'Co-occurring Mental Health',
        emoji: '🔀',
        description: 'Mood cycling, medication adherence, and substance use in bipolar SUD',
        primaryRoles: ['Physician', 'Therapist', 'Supervisor'],
        input: {
          presentingConcern: 'bipolar spectrum disorder co-occurring with substance use disorder; history of using substances during mood episodes; medication non-adherence; difficulty distinguishing mood states from intoxication/withdrawal',
          modality: 'Integrated Dual Diagnosis Treatment; Psychoeducation; DBT Emotion Regulation',
          interventions: 'Mood charting introduction; bipolar-SUD interaction psychoeducation; medication adherence motivational interview; identifying prodromal mood episode signs; substance use as mood episode trigger education',
          interventionDetail: 'Reviewed the bidirectional relationship between mood episodes and substance use: stimulants can trigger manic episodes; depressives can worsen depressive phases; both complicate mood stabilizer effectiveness.',
          clientResponse: 'Client demonstrated awareness that cannabis use preceded their last manic episode but had not previously connected the two. Agreed to begin mood charting. Expressed ambivalence about medication but agreed to continue current regimen for 30 days.',
          clinicalAssessment: 'Bipolar disorder and SUD are interacting in a complex, high-risk pattern. Mood stabilizer adherence is critical. Substance use cessation is the highest clinical priority alongside mood stabilization. Close collaboration with psychiatry is essential.',
          goalAddressed: 'Client will demonstrate understanding of the bipolar-SUD interaction, maintain medication adherence, and use mood charting to identify early episode warning signs.',
          plan: 'Continue integrated dual-diagnosis treatment. Coordinate closely with psychiatry.',
          nextSessionGoal: 'Review mood chart; assess for emerging hypomania or depression signs; reinforce medication adherence',
          homework: 'Complete mood chart daily — note mood (0–10), energy, sleep hours, substance use, and any notable events',
          coordinationNote: 'psychiatry regarding mood stabilizer optimization and monitoring',
          patientReports: 'describes feeling "stable" currently but expresses fear of future mood episodes; history of three hospitalizations for manic episodes while in active substance use',
          objectiveFindings: 'MSE: Mood subjectively euthymic. Affect congruent. Thought process linear. Speech rate and volume normal. No evidence of current mood episode.',
        },
      },
      {
        id: 'adhd-addiction',
        label: 'ADHD & Addiction Patterns',
        category: 'Co-occurring Mental Health',
        emoji: '⚡',
        description: 'ADHD-SUD overlap; impulsivity, executive function, and stimulant history',
        primaryRoles: ['Physician', 'Therapist'],
        input: {
          presentingConcern: 'ADHD symptoms significantly impacting treatment engagement — including difficulty following through on assignments, impulsive decision-making in high-risk situations, and history of stimulant misuse',
          modality: 'ADHD-Informed CBT; Executive Function Skill Building; Psychoeducation',
          interventions: 'ADHD-SUD interaction psychoeducation; executive function skill building (planning, time management, working memory strategies); impulsivity interrupt techniques (STOP-THINK-ACT); medication considerations discussion',
          interventionDetail: 'Explored the executive function deficits that increase relapse risk in ADHD: impulsivity, poor delay discounting, difficulty sustaining attention to future consequences.',
          clientResponse: 'Client found ADHD-SUD connection normalizing and validating. Showed engagement when discussing practical executive function strategies rather than abstract concepts.',
          clinicalAssessment: 'ADHD represents a significant treatment complication requiring adapted clinical approaches including shorter tasks, visual prompts, more frequent check-ins, and executive function scaffolding. Non-stimulant medication options should be evaluated by psychiatry.',
          goalAddressed: 'Client will develop ADHD-informed coping strategies to manage impulsivity and executive function challenges that are increasing relapse risk.',
          plan: 'Continue ADHD-informed CBT. Refer to psychiatry for non-stimulant medication evaluation.',
          nextSessionGoal: 'Review ADHD strategies implemented; assess impact on treatment task completion; introduce external memory system',
          homework: 'Use a written daily schedule with two planned recovery activities built in as structured anchors',
          coordinationNote: 'psychiatry for non-stimulant ADHD medication evaluation (Strattera, Wellbutrin, or Intuniv)',
          patientReports: 'chronic distractibility, racing thoughts, difficulty completing tasks, impulsive urges that "bypass my thinking brain," and history of misusing stimulants both for ADHD management and recreational use',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  7. MEDICAL, MAT & WITHDRAWAL
  // ══════════════════════════════════════════════════════════════
  {
    id: 'medical',
    label: 'Medical / MAT / Withdrawal',
    emoji: '💊',
    topics: [
      {
        id: 'mat-education',
        label: 'MAT Initiation & Education',
        category: 'Medical / MAT / Withdrawal',
        emoji: '💉',
        description: 'Buprenorphine, naltrexone, or methadone initiation; MAT stigma',
        primaryRoles: ['Physician', 'Nurse'],
        input: {
          presentingConcern: 'opioid use disorder requiring evaluation for medication-assisted treatment; patient expressing questions and stigma-related concerns about MAT',
          modality: 'Motivational Interviewing; Psychoeducation; Medical Management',
          interventions: 'ASAM criteria-based MAT candidate evaluation; buprenorphine/naltrexone/methadone education; MAT stigma discussion and normalization; informed consent for MAT; opioid receptor pharmacology education in lay terms',
          interventionDetail: 'Reviewed all three FDA-approved OUD medications. Discussed mechanism of action, expected benefits, and common patient concerns. Addressed "substituting one drug for another" misconception.',
          clientResponse: 'Patient asked informed questions about Suboxone dosing and duration. Expressed initial reluctance rooted in stigma but moved toward acceptance after pharmacology education and discussion of recovery outcomes research.',
          clinicalAssessment: 'Patient is a good MAT candidate per ASAM criteria. OUD severity warrants pharmacotherapy. Education reduced stigma and increased patient buy-in. Informed consent process initiated.',
          goalAddressed: 'Patient will demonstrate understanding of MAT options and make an informed decision about medication-assisted treatment for OUD.',
          plan: 'Initiate MAT as agreed. Schedule follow-up in 72 hours for induction assessment. Coordinate with counseling team.',
          nextSessionGoal: 'Assess induction experience, side effects, and early response at 72-hour follow-up',
          homework: 'Review MAT education materials; contact provider if withdrawal symptoms emerge before induction date',
          coordinationNote: 'counseling team regarding MAT initiation and integrated care coordination',
          patientReports: 'active opioid use, withdrawal symptoms, strong craving, and desire to stop opioid use; questions about "how the medication works" and whether it is "just replacing one addiction with another"',
          objectiveFindings: 'COWS administered: score relevant to clinical status. Vital signs recorded. Physical examination completed. No acute medical contraindications to MAT identified.',
        },
      },
      {
        id: 'opioid-withdrawal',
        label: 'Opioid Withdrawal Management (COWS)',
        category: 'Medical / MAT / Withdrawal',
        emoji: '🌡️',
        description: 'COWS scoring, comfort measures, and withdrawal protocol management',
        primaryRoles: ['Physician', 'Nurse'],
        input: {
          presentingConcern: 'opioid withdrawal syndrome requiring assessment, monitoring, and clinical management',
          modality: 'Medical Management; Withdrawal Protocol',
          interventions: 'COWS scoring and documentation; vital sign assessment; withdrawal comfort medication administration per protocol; patient education on withdrawal timeline and management; MAT initiation planning',
          interventionDetail: 'COWS administered with documentation of all 11 clinical signs. Comfort medications administered per standing order protocol. Patient educated on expected withdrawal timeline and what to report to nursing staff.',
          clientResponse: 'Patient is tolerating withdrawal protocol with moderate discomfort. Cooperative with monitoring and comfort measures. Reports the most distressing symptoms are muscle aches and GI upset.',
          clinicalAssessment: 'Opioid withdrawal is progressing within expected parameters. Protocol medications are providing partial relief. COWS trajectory is being monitored for appropriate protocol response. MAT initiation to be evaluated at 24-hour mark.',
          goalAddressed: 'Patient will complete opioid detoxification safely with adequate symptom management and transition to MAT evaluation.',
          plan: 'Continue COWS monitoring per protocol. Reassess every 4–6 hours or with symptom change. MAT evaluation scheduled.',
          nextSessionGoal: 'Reassess COWS in 4 hours; evaluate MAT candidacy as withdrawal clears',
          patientReports: 'nausea, muscle aches, sweating, and anxiety characteristic of opioid withdrawal; states "I\'ve never done this before without using something"',
          objectiveFindings: 'COWS score documented. VS: documented per flow sheet. Skin: diaphoretic. GI: nausea without emesis. Musculoskeletal: visible restlessness and piloerection. Pupils: dilated.',
        },
      },
      {
        id: 'alcohol-withdrawal',
        label: 'Alcohol Withdrawal Protocol (CIWA)',
        category: 'Medical / MAT / Withdrawal',
        emoji: '⚕️',
        description: 'CIWA-Ar scoring, benzodiazepine protocol, seizure prevention',
        primaryRoles: ['Physician', 'Nurse'],
        input: {
          presentingConcern: 'alcohol use disorder with clinically significant alcohol withdrawal syndrome requiring structured medical management to prevent severe complications including seizure and delirium tremens',
          modality: 'Medical Management; CIWA-Ar Protocol',
          interventions: 'CIWA-Ar assessment (10-item) with documentation; vital sign monitoring; benzodiazepine administration per CIWA protocol; seizure precautions; thiamine and electrolyte replacement; fall risk assessment; orientation and safety checks',
          interventionDetail: 'CIWA-Ar administered. Protocol medications given as indicated by score. Patient placed on seizure precautions per facility protocol. Fluid and nutritional support ongoing.',
          clientResponse: 'Patient is tolerating protocol. Cooperative with assessments. Reports improvement in tremor with medication. Oriented to person and place; some difficulty with date.',
          clinicalAssessment: 'Alcohol withdrawal is being managed within protocol parameters. CIWA trajectory is being closely monitored. Risk for seizure and delirium tremens remains clinically significant until patient is stable for 24+ hours.',
          goalAddressed: 'Patient will complete alcohol detoxification safely with prevention of severe withdrawal complications and transition to continuing addiction treatment.',
          plan: 'Continue CIWA-Ar monitoring per protocol. MD notification parameters in place. Transition to residential treatment track upon CIWA stabilization.',
          nextSessionGoal: 'CIWA reassessment per protocol schedule; electrolyte panel review',
          coordinationNote: 'attending physician for any CIWA score change above protocol threshold',
          patientReports: 'tremor, diaphoresis, anxiety, and nausea; states last drink was approximately 24–36 hours ago; history of alcohol withdrawal seizure',
          objectiveFindings: 'CIWA-Ar score documented. VS: documented per flow sheet. Neurological: tremor present. Orientation: partially intact. Skin: diaphoretic. GI: nausea present.',
        },
      },
      {
        id: 'overdose-education',
        label: 'Overdose Prevention & Naloxone Education',
        category: 'Medical / MAT / Withdrawal',
        emoji: '🚑',
        description: 'Narcan training, overdose risk reduction, and harm reduction planning',
        primaryRoles: ['Physician', 'Nurse', 'Counselor'],
        groupNarrative: 'Group session on overdose prevention and naloxone (Narcan) education. All members received hands-on training in naloxone nasal spray administration. Overdose risk factors were reviewed including tolerance reduction after any period of abstinence. Harm reduction planning was completed.',
        input: {
          presentingConcern: 'elevated risk for opioid overdose due to tolerance changes, history of high-dose use, or anticipated return to the community with access to illicit opioids',
          modality: 'Harm Reduction; Psychoeducation',
          interventions: 'Overdose risk factor education (reduced tolerance post-abstinence, fentanyl contamination); naloxone nasal spray administration training; overdose response protocol education (call 911, rescue breathing, lateral recovery position); Good Samaritan Law education; harm reduction planning',
          interventionDetail: 'Patient completed return demonstration of naloxone administration on training manikin. Reviewed scenarios where overdose risk is highest, particularly immediately after discharge when tolerance is at lowest.',
          clientResponse: 'Patient engaged seriously with overdose risk education. Demonstrated correct naloxone administration technique. Expressed motivation to equip family members with naloxone as well.',
          clinicalAssessment: 'Overdose education is a critical harm reduction and safety intervention for this patient. Post-discharge period represents the highest overdose risk window. Family naloxone distribution is strongly encouraged.',
          goalAddressed: 'Patient will demonstrate ability to administer naloxone and verbalize personal overdose risk factors and harm reduction strategies.',
          plan: 'Dispense naloxone kit at discharge. Coordinate family naloxone education session.',
          nextSessionGoal: 'Confirm naloxone kit receipt; verify family member education plan',
          homework: 'Share naloxone training information with one trusted person in the home environment',
          coordinationNote: 'pharmacy for naloxone prescription; discharge planner regarding naloxone kit distribution at discharge',
        },
      },
      {
        id: 'pain-management',
        label: 'Pain Management in Recovery',
        category: 'Medical / MAT / Withdrawal',
        emoji: '🩺',
        description: 'Non-opioid pain management strategies for patients with OUD',
        primaryRoles: ['Physician', 'Nurse', 'Therapist'],
        input: {
          presentingConcern: 'chronic or acute pain co-occurring with opioid use disorder, requiring development of a recovery-compatible pain management plan that does not jeopardize sobriety',
          modality: 'Integrative Pain Management; Psychoeducation; Medical Management',
          interventions: 'Comprehensive pain assessment (type, location, intensity, duration, functional impact); non-opioid pharmacological options review; non-pharmacological pain management modalities (PT, acupuncture, TENS, heat/cold); pain-substance relationship psychoeducation; activity pacing techniques',
          interventionDetail: 'Discussed the challenge of pain management in recovery without returning to opioids. Explored non-opioid analgesics (NSAIDs, Tylenol, topical agents, SNRIs for neuropathic pain) and physical therapy referral.',
          clientResponse: 'Patient was receptive to non-opioid pain management framework. Expressed concern about adequacy of pain control but agreed to trial non-opioid approach with structured reassessment in 2 weeks.',
          clinicalAssessment: 'Pain management in the context of OUD requires a highly individualized approach balancing adequate pain relief with recovery protection. Multi-modal non-opioid approach is strongly preferred. Interdisciplinary team involvement is essential.',
          goalAddressed: 'Patient will develop and implement a recovery-compatible pain management plan that effectively manages pain without jeopardizing sobriety.',
          plan: 'Initiate non-opioid pain management plan. Physical therapy referral placed. Reassess pain and medication response in 2 weeks.',
          nextSessionGoal: 'Review pain management plan effectiveness; assess for PT engagement; adjust plan as needed',
          coordinationNote: 'physical therapy; pain management specialist if non-opioid approach provides inadequate relief',
          patientReports: 'chronic low back pain rated 6/10, worsening with extended standing, limiting daily activities; history of prescribed opioids prior to OUD development; concerned that pain will lead to relapse',
          objectiveFindings: 'Physical exam of affected area completed. Gait assessment performed. Functional mobility assessed. No acute surgical emergency identified.',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  8. RECOVERY SKILLS & LIFE SKILLS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'recovery-skills',
    label: 'Recovery Skills & Life Skills',
    emoji: '🧰',
    topics: [
      {
        id: 'twelve-step',
        label: '12-Step Engagement & Spirituality',
        category: 'Recovery Skills & Life Skills',
        emoji: '📖',
        description: 'AA/NA engagement, sponsor relationships, step work, spirituality',
        primaryRoles: ['Counselor', 'Supervisor'],
        groupNarrative: 'Group session focused on 12-step philosophy and community engagement. Members shared experiences with AA/NA, discussed the concept of a Higher Power in non-religious terms, and explored the value of sponsor relationships. New members were guided through how to find a meeting and what to expect.',
        input: {
          presentingConcern: 'resistance to or difficulty engaging with 12-step programming and peer support communities; questions about the spiritual component of AA/NA',
          modality: 'Twelve-Step Facilitation (TSF) Therapy; Psychoeducation',
          interventions: '12-step philosophy and structure review; addressing resistance to spiritual concepts (higher power broadened to any greater-than-self concept); sponsor role and function discussion; meeting types and how to find a home group; Big Book/Basic Text introduction',
          interventionDetail: 'Addressed client\'s concern about "the God thing" by reviewing the full range of Higher Power concepts available in 12-step work (nature, group, love, recovery community itself).',
          clientResponse: 'Client showed reduction in resistance after learning that Higher Power is personally defined. Identified "the recovery community" as a possible Higher Power concept they could accept. Agreed to attend one open AA meeting this week.',
          clinicalAssessment: 'Twelve-step resistance has been partially addressed through conceptual broadening of the spiritual component. AA/NA attendance is an evidence-based recovery support with strong outcome data. Engagement is strongly encouraged.',
          goalAddressed: 'Client will engage with 12-step community as a recovery support resource, identifying a potential home group and initiating contact with a temporary sponsor.',
          plan: 'Support 12-step engagement as part of comprehensive recovery plan.',
          nextSessionGoal: 'Debrief first meeting experience; identify next steps (home group, sponsor contact)',
          homework: 'Attend one AA or NA meeting this week — write down one thing heard that resonated',
        },
      },
      {
        id: 'smart-recovery',
        label: 'SMART Recovery & Secular Peer Support',
        category: 'Recovery Skills & Life Skills',
        emoji: '🔬',
        description: 'SMART Recovery tools for clients preferring a secular approach',
        primaryRoles: ['Counselor', 'Therapist'],
        groupNarrative: 'SMART Recovery-oriented group using the 4-Point Program. Group practiced the Cost-Benefit Analysis (CBA) tool for urges and explored self-empowerment in recovery. SMART\'s non-spiritual, science-based framework was welcomed by group members who have struggled with 12-step spirituality.',
        input: {
          presentingConcern: 'preference for a secular, science-based recovery support pathway; difficulty connecting with 12-step programming due to spiritual or philosophical concerns',
          modality: 'SMART Recovery 4-Point Program; CBT; Motivational Enhancement',
          interventions: 'SMART Recovery overview (Building Motivation, Coping with Urges, Managing Thoughts/Behaviors/Emotions, Living a Balanced Life); Cost-Benefit Analysis (CBA) tool practice; DISARM technique for urge reduction; SMART meeting resources provided',
          interventionDetail: 'Introduced the four-point program structure and completed a CBA worksheet together, rating the short and long-term costs and benefits of both substance use and recovery.',
          clientResponse: 'Client responded very positively to SMART\'s science-based, self-empowerment framework. Completed CBA worksheet with clarity. Expressed interest in attending a SMART Recovery meeting.',
          clinicalAssessment: 'SMART Recovery is an evidence-supported peer recovery program that is well-suited for this client\'s secular orientation. Engaging client in peer support through a pathway that fits their values will improve long-term recovery outcomes.',
          goalAddressed: 'Client will engage with SMART Recovery as their primary peer support program and apply SMART tools (CBA, DISARM) to manage urges and build motivation.',
          plan: 'Support SMART Recovery engagement. Provide meeting resources.',
          nextSessionGoal: 'Debrief SMART meeting experience; review CBA tool application to recent urge',
          homework: 'Attend one SMART Recovery meeting (online or in-person); complete one CBA worksheet for a real urge situation',
        },
      },
      {
        id: 'employment-financial',
        label: 'Employment & Financial Stability',
        category: 'Recovery Skills & Life Skills',
        emoji: '💼',
        description: 'Employment barriers, resume gaps, and financial stability in recovery',
        primaryRoles: ['Counselor', 'Supervisor'],
        input: {
          presentingConcern: 'employment instability and financial stress as significant relapse risk factors; resume gaps due to active addiction period and criminal justice involvement',
          modality: 'Case Management; Motivational Interviewing; Solution-Focused Therapy',
          interventions: 'Employment barrier inventory; resume gap addressing strategies; vocational rehabilitation and workforce development resource referral; financial stability planning; connection to recovery-friendly employer networks',
          interventionDetail: 'Explored employment history, gaps, and barriers including a prior felony conviction. Reviewed sober living community job placement resources and vocational rehabilitation eligibility.',
          clientResponse: 'Client expressed significant anxiety about employment prospects given criminal background. Was receptive to information about EEOC protections and recovery-friendly employers. Made initial steps toward vocational rehab referral.',
          clinicalAssessment: 'Employment instability is a major recovery threat factor. The stress of unemployment and financial insecurity will need to be addressed as part of a comprehensive recovery plan. Client\'s motivation to work is strong — channeling this toward realistic, achievable employment goals is the clinical task.',
          goalAddressed: 'Client will take concrete steps toward employment stability including vocational rehabilitation referral and development of a realistic employment plan.',
          plan: 'Connect client with vocational rehabilitation and workforce development resources. Address employment barriers in ongoing sessions.',
          nextSessionGoal: 'Review vocational rehab appointment outcome; explore additional employment resources',
          homework: 'Contact vocational rehabilitation office for intake appointment; identify three job skills from the last 10 years to list on an updated resume',
          coordinationNote: 'case management team for vocational rehabilitation and workforce development referral',
        },
      },
      {
        id: 'housing-needs',
        label: 'Housing & Basic Needs in Recovery',
        category: 'Recovery Skills & Life Skills',
        emoji: '🏠',
        description: 'Housing instability, sober living, and social determinants of health',
        primaryRoles: ['Counselor', 'Supervisor', 'Aftercare'],
        input: {
          presentingConcern: 'housing instability representing a critical recovery threat; limited social support network; housing environment with active substance users compromising sobriety',
          modality: 'Case Management; Solution-Focused Therapy',
          interventions: 'Housing needs assessment; sober living home evaluation and referral; recovery housing eligibility review; community resource identification (food pantry, clothing bank, public transportation); safety planning regarding unsafe housing environment',
          interventionDetail: 'Explored current housing situation in detail. Identified primary concern: current home includes a family member who is actively using opioids. Reviewed sober living options as a bridge recovery environment.',
          clientResponse: 'Client expressed ambivalence about sober living due to cost and preference for privacy, but acknowledged the danger of returning to the current environment. Agreed to tour one sober living facility before discharge.',
          clinicalAssessment: 'Return to current housing environment represents a significant and immediate relapse risk. Sober living placement is the clinically recommended discharge option. Client safety and recovery stability depend on adequate housing support.',
          goalAddressed: 'Client will secure stable, recovery-supportive housing prior to program discharge.',
          plan: 'Facilitate sober living tour and application. Coordinate with case management and discharge planning.',
          nextSessionGoal: 'Debrief sober living tour; finalize discharge housing plan',
          homework: 'Complete sober living application; gather required documentation (ID, insurance card, any required financial information)',
          coordinationNote: 'discharge planner and case management for housing placement coordination',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  9. GRIEF & LOSS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'grief',
    label: 'Grief & Loss',
    emoji: '🕊️',
    topics: [
      {
        id: 'grief-processing',
        label: 'Grief Processing in Recovery',
        category: 'Grief & Loss',
        emoji: '💜',
        description: 'Unresolved grief as a relapse driver; loss connected to addiction',
        primaryRoles: ['Therapist', 'Counselor'],
        groupNarrative: 'Group session focused on grief and loss in the context of recovery — including loss of loved ones, loss of years lost to addiction, loss of identity, and loss of relationships damaged by substance use. Members shared losses and identified how grief contributed to substance use. Grief normalization and healthy mourning practices were introduced.',
        input: {
          presentingConcern: 'unresolved grief related to loss of a significant person/relationship that is functioning as a primary driver of substance use and emotional dysregulation',
          modality: 'Grief Therapy; Narrative Therapy; Meaning-Making Approach',
          interventions: 'Grief assessment (type of loss, time since loss, grief trajectory); Worden\'s Tasks of Mourning psychoeducation; narrative retelling of loss with therapeutic presence; continuing bonds concept; meaning-making from loss',
          interventionDetail: 'Created space for full expression of grief. Explored multiple losses including the person who died and the future relationship that will not be. Used "continuing bonds" model to explore maintaining connection without impeding grief.',
          clientResponse: 'Client was tearful throughout much of the session. Expressed relief at being "allowed to talk about it." Made a meaningful statement connecting substance use onset to the date of the loss.',
          clinicalAssessment: 'Unresolved grief is a clear precipitant to substance use for this client. The direct temporal connection between the loss and escalated use confirms grief as a primary clinical target. Grief work must proceed alongside relapse prevention.',
          goalAddressed: 'Client will process grief related to significant loss through structured therapeutic work, developing healthy mourning practices and meaning-making that support rather than undermine recovery.',
          plan: 'Continue grief therapy as an integrated component of addiction treatment.',
          nextSessionGoal: 'Continue grief narrative; introduce letter to the deceased if clinically indicated; explore meaning-making from loss',
          homework: 'Write about a favorite memory of who/what was lost; allow yourself to feel the emotion that comes up without using substances to suppress it',
        },
      },
      {
        id: 'recovery-loss',
        label: 'Losses Due to Addiction (Recovery Grief)',
        category: 'Grief & Loss',
        emoji: '🧩',
        description: 'Mourning years lost, relationships damaged, and opportunities missed',
        primaryRoles: ['Counselor', 'Therapist'],
        input: {
          presentingConcern: 'grief and anger over the losses attributed to years of active addiction — including time, career, relationships, and self — accompanied by difficulty accepting these losses as part of the recovery process',
          modality: 'Grief Therapy; Acceptance and Commitment Therapy (ACT); Narrative Therapy',
          interventions: 'Recovery loss inventory (mapping losses across domains: relationships, career, health, time, identity); validation of grief without minimization; ACT-based acceptance practice; finding post-traumatic growth potential; re-authoring the recovery narrative',
          interventionDetail: 'Used a structured loss inventory exercise to acknowledge the full scope of what addiction cost the client. Avoided minimization while introducing the possibility of a meaningful recovery story.',
          clientResponse: 'Client was initially very angry and despairing. Slowly shifted to a more nuanced stance by session end — acknowledging both the losses and the fact that recovery is creating new possibilities. Showed a first glimpse of post-traumatic growth.',
          clinicalAssessment: 'Recovery grief is a necessary and normal part of the healing process. Client\'s anger and despair are appropriate responses to real losses. The clinical goal is to honor the grief while building forward momentum rather than getting stuck in rumination.',
          goalAddressed: 'Client will acknowledge and process the losses caused by active addiction while developing a forward-looking recovery narrative that holds both grief and possibility.',
          plan: 'Continue integrated recovery grief and forward-narrative work.',
          nextSessionGoal: 'Explore one domain where recovery is already creating new possibilities; continue processing losses as they arise',
          homework: 'Write two lists: (1) What addiction took from me; (2) What recovery is giving back, or could give back. Bring both to next session.',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 10. DISCHARGE & CONTINUING CARE
  // ══════════════════════════════════════════════════════════════
  {
    id: 'discharge',
    label: 'Discharge & Continuing Care',
    emoji: '🚀',
    topics: [
      {
        id: 'discharge-planning',
        label: 'Discharge Readiness & Aftercare Planning',
        category: 'Discharge & Continuing Care',
        emoji: '📋',
        description: 'Level-of-care step-down, aftercare linkage, and community resources',
        primaryRoles: ['Supervisor', 'Counselor', 'Aftercare'],
        input: {
          presentingConcern: 'preparation for program discharge and transition to a lower level of care; expressed anxiety about maintaining recovery without the structure of residential treatment',
          modality: 'Motivational Interviewing; Discharge Planning; Solution-Focused Therapy',
          interventions: 'ASAM-based level-of-care discharge criteria review; aftercare resource identification (IOP, PHP, outpatient therapist, psychiatrist); relapse prevention plan finalization; continuing care commitment contract; peer support connection (AA/NA, recovery coach)',
          interventionDetail: 'Completed comprehensive discharge readiness assessment. Confirmed IOP placement. Reviewed final relapse prevention plan and emergency contact sheet. Connected client with alumni network.',
          clientResponse: 'Client expressed anxiety about discharge mixed with appropriate readiness. Demonstrated solid knowledge of their relapse warning signs, coping strategies, and emergency contacts. Discharged with full aftercare plan in place.',
          clinicalAssessment: 'Client is meeting discharge criteria. Aftercare plan is comprehensive and individually tailored. Risk of relapse post-discharge is being mitigated by strong aftercare linkage, peer support engagement, and medication management continuity.',
          goalAddressed: 'Client will complete program discharge with a comprehensive, individualized aftercare plan including step-down level of care, peer support engagement, and community resource connections.',
          plan: 'Discharge to IOP per plan. All aftercare linkages confirmed. Follow-up call at 7 days post-discharge.',
          nextSessionGoal: '7-day post-discharge check-in call',
          homework: 'Attend first IOP session within 72 hours of discharge; contact sponsor or peer support person within 24 hours of discharge',
          coordinationNote: 'IOP/outpatient program, prescribing physician for medication continuity, and alumni coordinator',
        },
      },
      {
        id: 'continuing-care',
        label: 'Continuing Care & Relapse Prevention Plan',
        category: 'Discharge & Continuing Care',
        emoji: '🗺️',
        description: 'Building the individualized long-term recovery maintenance plan',
        primaryRoles: ['Supervisor', 'Counselor'],
        input: {
          presentingConcern: 'development of a personalized, written continuing care and relapse prevention plan to guide recovery maintenance after discharge from primary treatment',
          modality: 'Relapse Prevention Therapy; Solution-Focused Therapy',
          interventions: 'Continuing care plan development (housing, support meetings, therapy, medications, employment); personalized relapse prevention plan (warning signs, coping steps, emergency contacts); crisis plan and 24-hour resources; personal recovery capital inventory',
          interventionDetail: 'Completed the full continuing care plan including 5 domains: (1) living environment, (2) peer support/meetings, (3) professional support/therapy, (4) medications/medical care, (5) employment/daily structure.',
          clientResponse: 'Client actively participated in plan development and expressed genuine ownership of the final document. Stated: "This is the first time I\'ve had a real plan, not just good intentions."',
          clinicalAssessment: 'Comprehensive continuing care planning is a well-evidenced predictor of sustained recovery. Client\'s active engagement in plan development enhances commitment to implementation. All five domains are addressed in the final plan.',
          goalAddressed: 'Client will develop and commit to a written continuing care plan addressing all five recovery support domains.',
          plan: 'Finalize and sign continuing care plan. Distribute copies to client, clinical record, and aftercare coordinator.',
          nextSessionGoal: 'Final plan review and signature; discharge appointment',
          homework: 'Review continuing care plan with one trusted support person or sponsor before discharge',
          coordinationNote: 'aftercare coordinator for plan continuity and 30-day follow-up scheduling',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 11. RISK & SAFETY
  // ══════════════════════════════════════════════════════════════
  {
    id: 'risk-safety',
    label: 'Risk & Safety',
    emoji: '🛑',
    topics: [
      {
        id: 'si-safety-planning',
        label: 'Suicidal Ideation & Safety Planning',
        category: 'Risk & Safety',
        emoji: '🆘',
        description: 'Columbia protocol, safety planning, lethal means counseling',
        primaryRoles: ['All'],
        input: {
          presentingConcern: 'suicidal ideation requiring assessment, safety planning, and clinical management in the context of substance use disorder',
          modality: 'Columbia Suicide Severity Rating Scale (C-SSRS); Stanley-Brown Safety Planning Intervention',
          interventions: 'C-SSRS structured suicide risk assessment; safety plan development (warning signs, coping strategies, reasons for living, support contacts, 988 and crisis line, means restriction); treatment intensification evaluation; direct supervisor notification per protocol',
          interventionDetail: 'C-SSRS completed. Safety plan developed with client including all six components. Lethal means counseling conducted. Supervisor and treatment team notified per protocol. Level-of-care evaluation initiated.',
          clientResponse: 'Client was cooperative with safety assessment. Identified three reasons for living (children, not wanting to disappoint parents, belief things can get better). Safety plan was collaboratively developed and signed.',
          clinicalAssessment: 'Risk assessment complete per Columbia Protocol. Risk level determined and documented. Safety plan is in place and client demonstrated understanding of plan components. Clinical team has been notified. Level of care evaluation ongoing.',
          goalAddressed: 'Client will demonstrate understanding of their safety plan and commit to using plan components before engaging in any self-harm behavior.',
          plan: 'Safety plan in place. Intensify monitoring. Supervisor and treatment team notified. Level-of-care evaluation pending. Next clinical contact within 24 hours.',
          nextSessionGoal: 'Safety plan review; reassess C-SSRS; evaluate ongoing risk and level of care appropriateness',
          siHiStatus: 'Present — see C-SSRS documentation and safety plan in clinical record',
          safetyPlanStatus: 'Updated',
          coordinationNote: 'clinical supervisor (notified), medical staff, and on-call crisis counselor',
          patientReports: 'suicidal ideation requiring full documentation per facility protocol and C-SSRS scoring',
          objectiveFindings: 'C-SSRS completed and scored. MSE: SI present — see C-SSRS for severity classification. Affect: congruent with distress. Thought content: suicidal ideation noted without active plan at time of assessment. Safety plan reviewed and signed.',
        },
      },
      {
        id: 'domestic-violence',
        label: 'Domestic Violence & IPV in Recovery',
        category: 'Risk & Safety',
        emoji: '🚨',
        description: 'IPV screening, safety planning, and trauma-informed DV response',
        primaryRoles: ['Counselor', 'Therapist', 'Supervisor'],
        input: {
          presentingConcern: 'disclosure or indicators of intimate partner violence occurring in the context of active or past substance use, requiring safety assessment, trauma-informed response, and resource connection',
          modality: 'Trauma-Informed Care; Safety Planning; Empowerment Model',
          interventions: 'IPV screening using validated tool; safety assessment (danger level, lethality indicators); mandatory reporting obligations review; DV resource provision (hotline, shelter, legal aid); trauma-informed, non-judgmental engagement; empowerment-based approach to options counseling',
          interventionDetail: 'Conducted IPV screening in a private, safe setting. Client disclosed current intimate partner violence. Safety assessment completed. Mandatory reporting obligations reviewed. Client provided with local DV resources.',
          clientResponse: 'Client demonstrated mixed emotions including fear, shame, and relief at being able to talk about the situation. Was receptive to receiving DV resource information while not yet ready to take action. Safety plan developed for immediate protection.',
          clinicalAssessment: 'IPV is both a direct safety concern and a significant substance use trigger and relapse risk. Client is not yet ready to leave the relationship but has been provided with resources and safety information. Empowerment approach is essential — the client controls the timeline of any action.',
          goalAddressed: 'Client will develop a personal safety plan addressing immediate safety in the context of intimate partner violence and receive connection to appropriate community resources.',
          plan: 'Ongoing safety monitoring. Resources provided. Mandatory reporting evaluated and addressed per protocol. Continue trauma-informed, client-paced DV work.',
          nextSessionGoal: 'Check-in on safety; revisit safety plan; assess readiness for additional resource engagement',
          safetyPlanStatus: 'Updated',
          coordinationNote: 'clinical supervisor per facility IPV/mandatory reporting protocol; DV advocate if client consents',
        },
      },
    ],
  },

];

// ─── Flat topic index ─────────────────────────────────────────────────────────

export const ALL_TOPICS: TopicTemplate[] = TOPIC_CATEGORIES.flatMap(c => c.topics);

export function getTopicById(id: string): TopicTemplate | undefined {
  return ALL_TOPICS.find(t => t.id === id);
}

/** Returns topics ordered by relevance to a given staff title */
export function getTopicsForStaff(staffTitle: string): TopicTemplate[] {
  const titleLower = staffTitle.toLowerCase();

  function roleMatch(t: TopicTemplate): number {
    if (t.primaryRoles.includes('All')) return 2;
    const fragment = t.primaryRoles.find(r => {
      switch (r) {
        case 'Counselor':    return titleLower.includes('counselor') || titleLower.includes('cac') || titleLower.includes('cadc');
        case 'Therapist':   return titleLower.includes('therapist') || titleLower.includes('lmft') || titleLower.includes('lcsw') || titleLower.includes('lpc');
        case 'Supervisor':  return titleLower.includes('supervisor') || titleLower.includes('director') || titleLower.includes('clinical supervisor');
        case 'Physician':   return titleLower.includes('physician') || titleLower.includes('md') || titleLower.includes('do') || titleLower.includes('medical');
        case 'Medical':     return titleLower.includes('medical') || titleLower.includes('md') || titleLower.includes('nurse') || titleLower.includes('rn');
        case 'Nurse':       return titleLower.includes('nurse') || titleLower.includes('rn') || titleLower.includes('lpn') || titleLower.includes('carn');
        case 'Technician':  return titleLower.includes('technician') || titleLower.includes('bht');
        case 'Case Manager':return titleLower.includes('case') || titleLower.includes('aftercare') || titleLower.includes('discharge');
        case 'Intake':      return titleLower.includes('intake') || titleLower.includes('admissions');
        case 'Aftercare':   return titleLower.includes('aftercare') || titleLower.includes('alumni') || titleLower.includes('discharge');
        default: return false;
      }
    });
    return fragment ? 2 : 1;
  }

  return [...ALL_TOPICS].sort((a, b) => roleMatch(b) - roleMatch(a));
}
