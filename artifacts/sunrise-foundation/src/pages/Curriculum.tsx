import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Printer, BookOpen, Users, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/* ── helpers ── */
type FieldProps = { label: string; sublabel?: string; rows?: number; placeholder?: string };

const inputCls = "w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-500 transition-colors placeholder:text-gray-400";

function Field({ label, sublabel, rows = 0, placeholder }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
        {label}{sublabel && <span className="font-normal normal-case ml-1 text-gray-500">— {sublabel}</span>}
      </label>
      {rows > 1
        ? <textarea rows={rows} placeholder={placeholder} className={inputCls + " resize-none"} />
        : <input type="text" placeholder={placeholder} className={inputCls} />}
    </div>
  );
}

function InlineField({ label, short }: { label: string; short?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      <span className="text-sm text-gray-700">{label}</span>
      <input type="text" className={`border-b border-gray-400 bg-transparent focus:outline-none focus:border-teal-500 text-sm ${short ? 'w-24' : 'w-48'}`} />
    </span>
  );
}

function RatingField({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <input type="number" min={1} max={10} placeholder="1–10" className="border border-gray-300 rounded px-2 py-1 text-sm w-16 text-center" />
    </div>
  );
}

function NumberedItem({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{n}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Callout({ title, children, color = 'teal' }: { title: string; children: React.ReactNode; color?: 'teal' | 'amber' | 'orange' | 'navy' }) {
  const styles: Record<string, string> = {
    teal:   'bg-teal-50  border-teal-400  text-teal-900',
    amber:  'bg-amber-50 border-amber-400 text-amber-900',
    orange: 'bg-orange-50 border-orange-400 text-orange-900',
    navy:   'bg-slate-50 border-slate-400 text-slate-900',
  };
  return (
    <div className={`border-l-4 rounded-r-md p-4 mb-4 text-sm leading-relaxed ${styles[color]}`}>
      {title && <p className="font-bold mb-1">{title}</p>}
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3 mt-5 border-b border-teal-100 pb-1">{children}</h3>;
}

function ExerciseBox({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4">
      <div className="flex items-center gap-3 mb-3">
        {badge && <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full">{badge}</span>}
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/* ── accordion ── */
function Accordion({ title, icon, badge, children, defaultOpen = false }: {
  title: string; icon?: React.ReactNode; badge?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl mb-3 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-teal-600">{icon}</span>}
          <span className="font-semibold text-gray-900 text-sm md:text-base">{title}</span>
          {badge && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
        {open ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-5 pb-6 pt-2 border-t border-gray-100 bg-white">{children}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════
   CLIENT WORKBOOK SECTIONS
════════════════════════════════════════════════ */

function ModuleRecoverySnapshot() {
  return (
    <>
      <Callout title="Purpose" color="teal">Establish your baseline, set goals, and build your personal motivation statement. This snapshot is the foundation everything else builds on.</Callout>
      <SectionLabel>My Details</SectionLabel>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" />
        <Field label="Date of Birth" />
        <Field label="Age" short />
        <Field label="Date" />
        <Field label="Primary Substances" placeholder="Opiates / Stimulants / Other" />
        <Field label="Length of Use" />
        <Field label="Current Treatment & Medications" />
        <Field label="Last Use (date)" />
        <Field label="Number of Past Relapses (estimate)" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <Field label="Current Diagnoses" />
        <Field label="Prescriber / Clinic" />
        <Field label="Therapist / Counselor" />
      </div>

      <SectionLabel>Recovery Goals</SectionLabel>
      <ExerciseBox title="Exercise 1.1 — My Recovery Statement" badge="Exercise 1.1">
        <p className="text-xs text-gray-500 mb-2">Complete this sentence to anchor your purpose:</p>
        <Field label='"My recovery is important because…"' rows={2} placeholder="Write 1–2 sentences in your own words." />
        <SectionLabel>Top 3 Reasons I Want to Stay Sober</SectionLabel>
        <NumberedItem n={1}><Field label="" placeholder="Reason 1" /></NumberedItem>
        <NumberedItem n={2}><Field label="" placeholder="Reason 2" /></NumberedItem>
        <NumberedItem n={3}><Field label="" placeholder="Reason 3" /></NumberedItem>
      </ExerciseBox>

      <ExerciseBox title="Exercise 1.2 — My 3-Month and 12-Month Goals" badge="Exercise 1.2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">3-Month Goals (small, concrete)</p>
            {[1,2,3].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`3-month goal ${n}`} /></NumberedItem>)}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">12-Month Goals (bigger picture)</p>
            {[1,2,3].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`12-month goal ${n}`} /></NumberedItem>)}
          </div>
        </div>
        <Field label="Short-term (30 days) — specific, measurable" rows={2} />
        <Field label="Long-term (6–12 months)" rows={2} />
        <Field label="What I want to change this month (3 actions)" rows={3} />
      </ExerciseBox>

      <ExerciseBox title="Exercise 1.3 — Values Check" badge="Exercise 1.3">
        <p className="text-xs text-gray-500 mb-3">Circle or mark up to 5 values that matter most to you right now:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {["Family","Health","Safety","Honesty","Work","Education","Spirituality","Friends","Fun","Creativity","Service"].map(v => (
            <label key={v} className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" className="rounded text-teal-600" />
              <span className="text-sm text-gray-700">{v}</span>
            </label>
          ))}
        </div>
        <Field label="My top values (write them here)" rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Action I will take this week" placeholder="One small step" />
          <Field label="When" />
          <Field label="Who supports me" />
        </div>
      </ExerciseBox>

      <ExerciseBox title="Motivation Statements" badge="Exercise">
        <p className="text-xs text-gray-500 mb-2">Complete these honestly. Return to them when doubt creeps in.</p>
        <Field label="Why I want to stay drug-free (list top 5 reasons)" rows={4} />
        <Field label="If I relapse, here is what I worry will happen" rows={2} />
        <Field label="Successes I'm proud of (recovery wins)" rows={2} />
      </ExerciseBox>

      <ExerciseBox title="Weekly Check-In" badge="Quick Worksheet">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="This week I did one thing to support recovery" />
          <Field label="One barrier I faced" />
          <Field label="One person I reached out to" />
          <Field label="Next small step" />
        </div>
      </ExerciseBox>
    </>
  );
}

function ModuleRelapse() {
  return (
    <>
      <Callout title="What to Know" color="teal">
        Relapse often follows a three-stage process. Catching early signs — before physical relapse — is where you have the most power to change course.
      </Callout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[
          { stage: "Stage 1 — Emotional", desc: "Stress, isolation, fatigue, anger. Feelings build before thoughts.", color: "bg-teal-50 border-teal-300" },
          { stage: "Stage 2 — Mental", desc: "Thinking about using, bargaining, \"just once\" thoughts, rationalizing.", color: "bg-amber-50 border-amber-300" },
          { stage: "Stage 3 — Physical", desc: "Seeking out people/places, then using. This is the result of stages 1 & 2.", color: "bg-red-50 border-red-300" },
        ].map(s => (
          <div key={s.stage} className={`border rounded-lg p-4 text-sm ${s.color}`}>
            <p className="font-bold mb-1">{s.stage}</p>
            <p className="text-gray-700">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm">
        <p className="font-bold text-gray-800 mb-2">Relapse Myths vs. Facts</p>
        <div className="space-y-2">
          <div><span className="font-semibold text-red-600">Myth:</span> Relapse means failure. <span className="font-semibold text-teal-700 ml-2">Fact:</span> Relapse is a learning opportunity. It means parts of the plan need change.</div>
          <div><span className="font-semibold text-red-600">Myth:</span> I can handle it alone. <span className="font-semibold text-teal-700 ml-2">Fact:</span> People repeatedly improve with structured support.</div>
        </div>
      </div>

      <ExerciseBox title="Exercise 2.1 — Personal Relapse Timeline" badge="Exercise 2.1">
        <p className="text-xs text-gray-500 mb-3">Think about a past relapse or slip. Walk through what happened step by step.</p>
        <Field label="Earliest feeling / sign I remember" placeholder="What was the first emotional change?" />
        <Field label="Common situations before past relapses" />
        <Field label="Typical thoughts at that time" />
        <Field label="Who was present or who did I contact?" />
        <Field label="What did I tell myself to justify use?" />
        <Field label="Actions that followed (step by step)" rows={3} placeholder="What did I do next, and next, leading up to use?" />
        <Field label="Immediate consequences" />
        <Field label="What I learned from this" rows={2} />
      </ExerciseBox>

      <ExerciseBox title="Worksheet — Mapping a Recent Relapse or Near-Relapse" badge="Worksheet">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Date" />
          <Field label="Situation" rows={2} placeholder="Who, where, what time" />
          <Field label="Thoughts" rows={2} />
          <Field label="Emotions" placeholder="Name emotions and rate each 1–10" />
          <Field label="Action Taken" rows={2} />
          <Field label="Outcome & What I Learned" rows={3} />
        </div>
      </ExerciseBox>

      <ExerciseBox title="Exercise 2.2 — Warning Signs List" badge="Exercise 2.2">
        <p className="text-xs text-gray-500 mb-3">Build your personal list. Rate each 1–5 (1 = mild, 5 = strong).</p>
        {[["Feeling","text"],["Thought","text"],["Behavior","text"]].map(([label]) => (
          <div key={label} className="flex items-center gap-3 mb-2">
            <span className="w-20 text-sm font-medium text-gray-700">{label}:</span>
            <input type="text" className={inputCls + " flex-1"} placeholder={`Describe the ${label.toLowerCase()}`} />
            <span className="text-sm text-gray-500">Rating:</span>
            <input type="number" min={1} max={5} className="border border-gray-300 rounded px-2 py-1 text-sm w-16 text-center" />
          </div>
        ))}
      </ExerciseBox>

      <ExerciseBox title="Relapse Risk Check (Quick)" badge="Quick Check">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Today's risk level (0–10):</span>
          <input type="number" min={0} max={10} className="border border-gray-300 rounded px-3 py-1 text-sm w-20 text-center" />
        </div>
        <p className="text-xs text-gray-500 mb-2">If your score is <strong>4 or higher</strong>, list 3 things you will do right now:</p>
        {[1,2,3].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`Action ${n}`} /></NumberedItem>)}
      </ExerciseBox>
    </>
  );
}

function ModuleTriggers() {
  return (
    <>
      <Callout title="Types of Triggers" color="teal">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1 text-xs">
          {[
            ["Situational","Places, times, being alone, certain calls"],
            ["Emotional","Loneliness, anxiety, anger, shame"],
            ["Social","Specific friends or partners"],
            ["Internal","Hunger, sleep deprivation, withdrawal"],
          ].map(([t,d]) => (
            <div key={t} className="bg-white/60 rounded p-2">
              <p className="font-bold text-teal-800">{t}</p>
              <p className="text-gray-600">{d}</p>
            </div>
          ))}
        </div>
      </Callout>

      <ExerciseBox title="My Top 10 Triggers" badge="Exercise">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {["Trigger","Type","Intensity (1–10)","Usual Response","Alternative Healthy Response"].map(h => (
                  <th key={h} className="text-left p-2 text-xs font-bold text-gray-600 border border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({length:10}).map((_,i) => (
                <tr key={i} className="border-b border-gray-100">
                  {[150, 100, 80, 150, 150].map((w, j) => (
                    <td key={j} className="p-1 border border-gray-200">
                      <input type="text" className="w-full text-sm border-none bg-transparent focus:outline-none focus:bg-teal-50 px-1 py-0.5 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ExerciseBox>

      <SectionLabel>Action Plan for Top 3 Triggers</SectionLabel>
      {[1,2,3].map(n => (
        <ExerciseBox key={n} title={`Trigger ${n} Action Plan`} badge={`Trigger ${n}`}>
          <Field label={`Trigger ${n} — describe it`} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Immediate strategy (0–10 min)" placeholder="What will I do right now?" />
            <Field label="Secondary strategy (10–60 min)" placeholder="If still struggling..." />
            <Field label="Longer strategy (60+ min)" placeholder="If it persists..." />
          </div>
          <Field label="How I will notice it early" />
        </ExerciseBox>
      ))}
    </>
  );
}

function ModuleWarnings() {
  const warnings = [
    "Skipping meetings or appointments",
    "Working longer hours to avoid feelings",
    "Avoiding friends who support recovery",
    "Increased secrecy",
    "Mood swings, irritability",
    "Trouble sleeping",
    "Craving frequency increasing",
    "Glamorizing past use",
    "Reconnecting with people who use",
    "Financial stress or thinking about money for drugs",
  ];
  return (
    <>
      <Callout title="Warning Signs Checklist" color="teal">Mark the signs you commonly experience. These are your early signal system.</Callout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
        {warnings.map(w => (
          <label key={w} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
            <input type="checkbox" className="rounded text-teal-600" />
            <span className="text-sm text-gray-700">{w}</span>
          </label>
        ))}
      </div>

      <SectionLabel>Decision Points — What to Do When You Notice a Warning Sign</SectionLabel>
      <div className="space-y-3 mb-5">
        {[
          ["Step 1","Pause and rate urgency 1–10."],
          ["Step 2","Use your immediate craving strategy (see Craving Toolbox)."],
          ["Step 3","Notify at least one support person (text or call)."],
          ["Step 4","Adjust routine — leave the situation, go to a public place, or attend a recovery activity."],
        ].map(([s,d]) => (
          <div key={s} className="flex gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <span className="flex-shrink-0 font-bold text-teal-700 text-sm w-14">{s}</span>
            <span className="text-sm text-gray-700">{d}</span>
          </div>
        ))}
      </div>

      <ExerciseBox title="Decision Record — Practice Log" badge="Worksheet">
        {[1,2].map(n => (
          <div key={n} className={`${n>1 ? 'mt-4 pt-4 border-t border-gray-200' : ''}`}>
            <p className="text-xs font-bold text-gray-500 mb-2">Entry {n}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" />
              <Field label="Warning sign noticed" />
              <Field label="My immediate action" />
              <Field label="Who I contacted" />
              <Field label="Outcome" />
              <Field label="What I'll do differently next time" />
            </div>
          </div>
        ))}
      </ExerciseBox>
    </>
  );
}

function ModuleCravings() {
  return (
    <>
      <Callout title="What to Know" color="teal">Cravings usually peak within 10–20 minutes and then pass. Your job is not to eliminate cravings — it's to outlast them with the right tools.</Callout>

      <SectionLabel>Immediate Strategies (0–10 Minutes)</SectionLabel>
      <div className="space-y-3 mb-5">
        {[
          ["Urge Surfing","Sit with the urge without acting. Notice the sensations in your body. Breathe slowly for 1–2 minutes. Say: \"This will pass.\" Wait 10 minutes and check again."],
          ["5-Minute Physical Reset","Pushups or squats, cold water on your face, or walk briskly outside for 5 minutes."],
          ["5-4-3-2-1 Grounding","Name 5 things you see · 4 you can touch · 3 you hear · 2 you smell · 1 you taste or one positive sentence about yourself."],
          ["Delay Script","\"I will wait 15 minutes. If I still feel like using after trying these steps, I will contact [support person].\""],
          ["Safe Environment","Leave the place. Go to a café, clinic, library, or other public space."],
        ].map(([title, desc]) => (
          <div key={title} className="flex gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="text-sm font-bold text-gray-800">{title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Short-Term Strategies (10–60 Minutes)</SectionLabel>
      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-5 pl-2">
        <li>Contact a support person (text or call) — pre-written scripts in the Appendix</li>
        <li>Distraction list: play a song, clean one shelf, walk the block, watch a specific show</li>
        <li>Mindfulness or guided meditation — 10 minutes body scan</li>
        <li>Physical activity: 20–30 min walk, gym, cycling</li>
        <li>Task with visible progress: laundry, dishes, yard work</li>
      </ul>

      <SectionLabel>Medium-Term Strategies (60+ Minutes)</SectionLabel>
      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-5 pl-2">
        <li>Attend a SMART Recovery or peer support group</li>
        <li>Contact prescriber if cravings persist or MAT dose is in question</li>
        <li>Schedule an activity with a friend or volunteer at a local program</li>
        <li>Revisit your long-term goals and update your action plan</li>
      </ul>

      <ExerciseBox title="Exercise 4.1 — My Craving Action Plan" badge="Exercise 4.1">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Field label="Urge rating right now (0–10)" />
          <Field label="What I feel (emotion)" />
        </div>
        <Field label="Top 3 immediate coping steps" rows={3} placeholder="List 2–3 specific strategies you will use" />
        <SectionLabel>People I Can Call or Text</SectionLabel>
        {[1,2].map(n => (
          <div key={n} className="grid grid-cols-2 gap-3 mb-2">
            <Field label={`Contact ${n} — Name`} />
            <Field label="Phone / Text" />
          </div>
        ))}
        <Field label="Place I can go if I need to leave" placeholder="Address or description" />
        <Callout title="If urge stays above 7 for 60+ minutes:" color="amber">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Field label="Clinician / Peer name" />
            <Field label="Phone number" />
            <Field label="Crisis line / ER" />
          </div>
        </Callout>
      </ExerciseBox>

      <ExerciseBox title="Skill 4.2 — Urge Surfing Practice Steps" badge="Skill">
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
          <li>Notice the urge without acting on it.</li>
          <li>Breathe slowly for 1–2 minutes.</li>
          <li>Notice where the urge lives in your body (chest, stomach, throat).</li>
          <li>Say to yourself: "This will pass."</li>
          <li>Wait 10 minutes and check your rating again.</li>
        </ol>
      </ExerciseBox>

      <ExerciseBox title="7-Day Daily Practice Plan" badge="Exercise">
        <p className="text-xs text-gray-500 mb-3">Each day, commit to one small coping action (walk, call, meeting, breathing exercise).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => (
            <Field key={d} label={d} placeholder="Today's coping action" />
          ))}
        </div>
      </ExerciseBox>
    </>
  );
}

function ModuleMotivation() {
  return (
    <>
      <Callout title="What to Know" color="teal">Mixed feelings about sobriety are normal. Listing the real pros and cons helps you choose the path that matches what you actually value — not just what feels easy.</Callout>

      <ExerciseBox title="Exercise 3.1 — Decisional Balance" badge="Exercise 3.1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-red-600 mb-2">Pros of Using</p>
            {[1,2].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`Pro of using ${n}`} /></NumberedItem>)}
          </div>
          <div>
            <p className="text-xs font-bold text-red-600 mb-2">Cons of Using</p>
            {[1,2].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`Con of using ${n}`} /></NumberedItem>)}
          </div>
          <div>
            <p className="text-xs font-bold text-teal-700 mb-2">Pros of Staying Sober</p>
            {[1,2].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`Pro of sobriety ${n}`} /></NumberedItem>)}
          </div>
          <div>
            <p className="text-xs font-bold text-teal-700 mb-2">Cons of Staying Sober</p>
            {[1,2].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`Challenge of sobriety ${n}`} /></NumberedItem>)}
          </div>
        </div>
      </ExerciseBox>

      <ExerciseBox title="Exercise 3.2 — Personal Motivation Plan" badge="Exercise 3.2">
        <p className="text-xs text-gray-500 mb-3">My top 3 reasons for recovery (keep these short — make them stick):</p>
        {[1,2,3].map(n => <NumberedItem key={n} n={n}><Field label="" placeholder={`Reason ${n}`} /></NumberedItem>)}
        <div className="grid grid-cols-2 gap-4 mt-3">
          <Field label="How I will remind myself" placeholder="Phone note, photo, wallet card..." />
          <Field label="When doubt appears, I will call/text" placeholder="Name & number" />
        </div>
      </ExerciseBox>

      <ExerciseBox title="Recovery Network Map" badge="Exercise">
        <p className="text-xs text-gray-500 mb-3">List people in your life based on how they affect your recovery.</p>
        <Field label="People who support recovery" rows={2} />
        <Field label="People who make use more likely (limit contact)" rows={2} />
        <SectionLabel>One New Recovery Contact to Make This Week</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Who" />
          <Field label="Action (call/visit/text)" />
          <Field label="By when" />
        </div>
      </ExerciseBox>
    </>
  );
}

function ModuleCopingSkills() {
  return (
    <>
      <SectionLabel>Behavioral Skills</SectionLabel>
      <ExerciseBox title="Structured Routine" badge="Skill">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Morning Routine</p>
            {["Wake time","10 min movement / stretch","Medication as prescribed","Breakfast","Review daily goals (3 items)"].map(item => (
              <label key={item} className="flex items-center gap-2 mb-1">
                <input type="checkbox" className="rounded text-teal-600" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Evening Routine</p>
            {["Wind-down 60 mins before bed","No caffeine/stimulants after ___","10-minute reflection / breathing"].map(item => (
              <label key={item} className="flex items-center gap-2 mb-1">
                <input type="checkbox" className="rounded text-teal-600" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </ExerciseBox>

      <ExerciseBox title="Weekly Activity Schedule" badge="Exercise">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border border-gray-200 text-left w-20">Time</th>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                  <th key={d} className="p-2 border border-gray-200 text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Morning","Midday","Afternoon","Evening"].map(t => (
                <tr key={t}>
                  <td className="p-2 border border-gray-200 font-medium text-gray-600">{t}</td>
                  {Array.from({length:7}).map((_,i) => (
                    <td key={i} className="p-1 border border-gray-100">
                      <input type="text" className="w-full text-xs border-none bg-transparent focus:outline-none focus:bg-teal-50 p-0.5 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ExerciseBox>

      <SectionLabel>Emotional Skills</SectionLabel>
      <ExerciseBox title="Distress Tolerance — TIPP Method" badge="Skill">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["T — Temperature","Cold water, cold pack on face or neck"],
            ["I — Intense Exercise","30–60 seconds of maximum exertion"],
            ["P — Paced Breathing","Inhale 4 counts, exhale 4 counts"],
            ["P — Paired Muscle Relaxation","Tense + release each muscle group"],
          ].map(([t,d]) => (
            <div key={t} className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm">
              <p className="font-bold text-teal-800 mb-1">{t}</p>
              <p className="text-gray-600 text-xs">{d}</p>
            </div>
          ))}
        </div>
      </ExerciseBox>

      <ExerciseBox title="Cognitive Reframing Worksheet" badge="Exercise">
        <p className="text-xs text-gray-500 mb-3">Catch an automatic thought and challenge it with evidence.</p>
        <div className="space-y-3">
          <Field label="Automatic Thought" placeholder={"e.g., \"One use won't matter.\""} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Evidence FOR this thought" rows={2} />
            <Field label="Evidence AGAINST this thought" rows={2} />
          </div>
          <Field label="Balanced / Realistic Thought" rows={2} placeholder="A more balanced way to see the situation..." />
        </div>
      </ExerciseBox>

      <ExerciseBox title="Skill Practice Log (2-Week Sample)" badge="Log">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {["Date","Skill Used","Time","Situation","Outcome","Notes"].map(h => (
                  <th key={h} className="p-2 border border-gray-200 text-left font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({length:7}).map((_,i) => (
                <tr key={i} className="border-b border-gray-100">
                  {Array.from({length:6}).map((_,j) => (
                    <td key={j} className="p-1 border border-gray-200">
                      <input type="text" className="w-full text-xs border-none bg-transparent focus:outline-none focus:bg-teal-50 px-1 py-0.5 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ExerciseBox>
    </>
  );
}

function ModuleCommunity() {
  return (
    <>
      <Callout title="Options Beyond 12-Step Programs" color="teal">
        Recovery support looks different for everyone. The goal is connection to people and activities that reinforce your life in sobriety — on your terms.
      </Callout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {[
          ["SMART Recovery","Evidence-based, skill-focused meetings. smartrecovery.org"],
          ["Refuge Recovery","Mindfulness-based, Buddhist-inspired recovery."],
          ["Secular Therapy Groups","Outpatient group therapy without spiritual components."],
          ["Peer Recovery Coaches","One-on-one support from someone with lived experience."],
          ["Faith Communities","Recovery ministries and faith-based groups (if desired)."],
          ["Hobby & Volunteer Groups","Sports, art classes, soup kitchens, community centers."],
        ].map(([t,d]) => (
          <div key={t} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <p className="font-bold text-gray-800">{t}</p>
            <p className="text-gray-500 text-xs mt-0.5">{d}</p>
          </div>
        ))}
      </div>

      <ExerciseBox title="Engagement Plan" badge="Exercise">
        <p className="text-xs text-gray-500 mb-3">This month, I will try at least three different types of community:</p>
        {[["A recovery group","e.g., SMART Recovery meeting, peer drop-in"],["A volunteer or service activity","e.g., shelter, food bank"],["A hobby or social event","e.g., sports league, art class"]].map(([label, placeholder]) => (
          <div key={label} className="grid grid-cols-2 gap-3 mb-2">
            <Field label={label} placeholder={placeholder} />
            <Field label="When" />
          </div>
        ))}
        <SectionLabel>After Attending, Reflect:</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <Field label="What did I like?" rows={2} />
          <Field label="What felt stressful?" rows={2} />
          <Field label="Would I go back? Why?" rows={2} />
        </div>
      </ExerciseBox>

      <ExerciseBox title="Community Contact Log" badge="Log">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {["Group / Organization","Contact Info","Date Attended","What Helped","Next Step"].map(h => (
                  <th key={h} className="p-2 border border-gray-200 text-left font-bold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({length:5}).map((_,i) => (
                <tr key={i}>
                  {Array.from({length:5}).map((_,j) => (
                    <td key={j} className="p-1 border border-gray-200">
                      <input type="text" className="w-full text-xs border-none bg-transparent focus:outline-none focus:bg-teal-50 px-1 py-0.5 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ExerciseBox>
    </>
  );
}

function ModuleProblemSolving() {
  return (
    <>
      <ExerciseBox title="Problem-Solving Steps — SODAS Method" badge="Framework">
        <div className="space-y-2">
          {[
            ["S — Situation","Define exactly what the problem is."],
            ["O — Options","List as many possible actions as you can."],
            ["D — Disadvantages & Advantages","Weigh each option honestly."],
            ["A — Act","Choose one option and commit."],
            ["S — See What Happens","Review the result and adjust."],
          ].map(([t,d]) => (
            <div key={t} className="flex gap-3 p-2 border-b border-gray-100 last:border-0">
              <span className="font-bold text-primary text-sm w-44 flex-shrink-0">{t}</span>
              <span className="text-sm text-gray-600">{d}</span>
            </div>
          ))}
        </div>
      </ExerciseBox>

      <ExerciseBox title="SODAS Practice Worksheet" badge="Worksheet">
        <Field label="Situation" rows={2} />
        <SectionLabel>Options</SectionLabel>
        {[1,2,3].map(n => <NumberedItem key={n} n={n}><Field label={`Option ${n}`} /></NumberedItem>)}
        <Field label="Pros & Cons of Each Option" rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Chosen Action" />
          <Field label="Review Date" />
          <Field label="Outcome" rows={2} />
          <Field label="Lessons Learned" rows={2} />
        </div>
      </ExerciseBox>

      <ExerciseBox title="Stress Management Plan" badge="Exercise">
        <p className="text-xs text-gray-500 mb-3">For each of your top stressors, identify one short-term and one long-term coping action.</p>
        {[1,2,3,4,5].map(n => (
          <div key={n} className="grid grid-cols-3 gap-3 mb-2 pb-2 border-b border-gray-100 last:border-0">
            <Field label={`Stressor ${n}`} />
            <Field label="Short-term action" placeholder="Right now / this week" />
            <Field label="Long-term action" placeholder="This month / ongoing" />
          </div>
        ))}
      </ExerciseBox>

      <ExerciseBox title="Relaxation Exercises" badge="Skills">
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <p className="font-bold mb-1">Box Breathing (4-4-4-4)</p>
            <p className="text-gray-600">Inhale 4 counts → Hold 4 counts → Exhale 4 counts → Hold 4 counts. Repeat 4–6 cycles.</p>
          </div>
          <div>
            <p className="font-bold mb-1">Progressive Muscle Relaxation (PMR)</p>
            <p className="text-gray-600">Starting from your feet: tense each muscle group for 5 seconds, then fully release. Move upward through calves, thighs, abdomen, hands, arms, shoulders, face.</p>
          </div>
          <div>
            <p className="font-bold mb-1">Safe Place Imagery</p>
            <p className="text-gray-600">Close your eyes. Picture a safe, calm place. Name 3 things you see, 2 you hear, 1 you feel. Stay for 5 minutes.</p>
          </div>
        </div>
      </ExerciseBox>
    </>
  );
}

function ModuleMAT() {
  return (
    <>
      <Callout title="MAT Facts" color="teal">
        Buprenorphine, methadone, and naltrexone are evidence-based medications that reduce cravings and withdrawal, and significantly lower overdose risk. Taking them as prescribed is part of your treatment — not a substitute for it.
      </Callout>

      <SectionLabel>Harm Reduction Reminders</SectionLabel>
      <div className="space-y-2 mb-5">
        {[
          "Never use alone. Use in supervised settings or with someone who can call EMS.",
          "Carry naloxone and know how to use it.",
          "Test substances if possible (fentanyl test strips where legal).",
          "Avoid mixing depressants — benzodiazepines, alcohol — with opiates.",
          "If you plan to use, use a small amount first. Tolerance drops quickly in recovery.",
          "Continue MAT as prescribed. Missing doses increases your risk significantly.",
        ].map(r => (
          <div key={r} className="flex gap-2 p-2 text-sm text-gray-700">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{r}</span>
          </div>
        ))}
      </div>

      <SectionLabel>When to Call Medical Help Immediately</SectionLabel>
      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-5 pl-2">
        <li>Suspected overdose: unresponsive, shallow or absent breathing, pinpoint pupils → <strong>Call 911</strong></li>
        <li>Feeling physically unsafe or severe withdrawal symptoms</li>
        <li>Suicidal thoughts or unsafe behaviors</li>
      </ul>

      <ExerciseBox title="Emergency Numbers" badge="Fill In">
        <div className="grid grid-cols-2 gap-3">
          {["Emergency (911)","Local Clinic","Prescriber","Naloxone Access","After-Hours Crisis","Nearest Emergency Room"].map(f => (
            <Field key={f} label={f} placeholder="Fill in number" />
          ))}
        </div>
      </ExerciseBox>
    </>
  );
}

function ModulePreventionPlan() {
  return (
    <>
      <Callout title="Purpose" color="teal">This is your master plan. Complete each step with your counselor or support person. Review it weekly and update it after any high-risk event.</Callout>

      {[
        { step: "Step 1", title: "Review Snapshot & Top Triggers", content: (
          <Field label="Summarize your top 3 triggers" rows={3} placeholder="1) ___  2) ___  3) ___" />
        )},
        { step: "Step 2", title: "Protective Factors — Strengths & Supports", content: (
          <div className="grid grid-cols-3 gap-3">
            <Field label="My personal strengths" rows={3} />
            <Field label="People who support me" rows={3} />
            <Field label="Activities that help" rows={3} />
          </div>
        )},
        { step: "Step 3", title: "Specific Strategies Matched to Triggers", content: (
          <>
            {[1,2,3].map(n => (
              <div key={n} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                <Field label={`Trigger ${n}`} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prevention strategies" rows={2} />
                  <Field label="If I feel overwhelmed" rows={2} />
                </div>
              </div>
            ))}
          </>
        )},
        { step: "Step 4", title: "Weekly Recovery Commitments", content: (
          <div className="space-y-2">
            {["Attend a meeting or group","Schedule appointment with counselor/prescriber","Exercise 3x a week","Volunteer or social activity 1x week"].map(c => (
              <div key={c} className="flex items-center gap-3">
                <input type="checkbox" className="rounded text-teal-600" />
                <span className="text-sm text-gray-700 flex-1">{c}</span>
                <Field label="Day / time" />
              </div>
            ))}
          </div>
        )},
        { step: "Step 5", title: "Safe Environment Actions", content: (
          <>
            <p className="text-xs text-gray-500 mb-3">Remove paraphernalia, block high-risk contacts, avoid high-risk places.</p>
            <Field label="People to avoid or limit contact with" rows={2} />
            <Field label="Places to avoid" rows={2} />
            <Field label="Steps I have already taken to make my environment safer" rows={2} />
          </>
        )},
        { step: "Step 6", title: "Review & Revise Dates", content: (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan review date with counselor" />
            <Field label="Next update after a high-risk event" />
            <Field label="Adjustments I'm making this week" rows={3} />
          </div>
        )},
      ].map(({ step, title, content }) => (
        <ExerciseBox key={step} title={`${step} — ${title}`} badge={step}>
          {content}
        </ExerciseBox>
      ))}
    </>
  );
}

function ModuleEmergencyPlan() {
  return (
    <>
      <Callout title="Keep this accessible at all times." color="amber">Print the wallet-size version, photograph it, or save a screenshot on your phone. This plan is for moments when you can't think clearly — make it automatic before you need it.</Callout>

      <div className="bg-white border-2 border-gray-800 rounded-xl p-6 max-w-sm mx-auto shadow-lg">
        <div className="text-center mb-4">
          <img src={`${BASE}/logos/foundation-logo-light.png`} alt="The Sunrise Foundation" className="h-12 w-auto mx-auto mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Emergency Relapse Action Plan</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Field label="My Name" />
            <Field label="Date Written" />
          </div>
          <Field label="Warning signs I notice:" rows={2} />
          <SectionLabel>If I Am at Risk of Using Right Now:</SectionLabel>
          <Field label="Leave and go to:" />
          <Field label="Immediate strategy I'll use:" />
          <Field label="Call or text (1):" />
          <Field label="Call or text (2):" />
          <div className="bg-red-50 border border-red-300 rounded p-2 text-xs text-red-800 font-medium">If suspected overdose or medical emergency → Call 911 immediately.</div>
          <SectionLabel>Crisis Contacts</SectionLabel>
          {["After-hours clinic","Prescriber","Local crisis line","Nearest emergency room"].map(f => (
            <Field key={f} label={f} />
          ))}
          <p className="text-xs text-gray-400 text-center mt-2">SAMHSA: 1-800-662-4357 · Crisis Text: Text HOME to 741741 · Lifeline: 988</p>
        </div>
      </div>
    </>
  );
}

function ModuleProgressLogs() {
  return (
    <>
      <ExerciseBox title="Weekly Progress Log" badge="Weekly">
        <Field label="Week of" />
        <Field label="Weekly goals (3)" rows={3} />
        <SectionLabel>Daily Practice — Skill Used Each Day</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <Field key={d} label={d} placeholder="Skill used" />)}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Meetings / community activities attended" />
          <Field label="High-risk situations & response" rows={2} />
          <Field label="Wins this week" rows={2} />
          <Field label="Challenges and plan for next week" rows={2} />
          <Field label="Mood rating average (1–10)" />
          <Field label="Substance use — any slips/relapses?" placeholder="Yes / No — if yes, plan to address" />
        </div>
      </ExerciseBox>

      <ExerciseBox title="Monthly Review" badge="Monthly">
        <Field label="Month" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Goals achieved this month" rows={3} />
          <Field label="Wins" rows={3} />
          <Field label="Setbacks & what I learned" rows={3} />
          <Field label="Adjustments for next month" rows={3} />
        </div>
        <Field label="New community activities I will try next month" rows={2} />
      </ExerciseBox>
    </>
  );
}

function ModuleResources() {
  return (
    <>
      <SectionLabel>National Resources</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {[
          ["SAMHSA National Helpline","1-800-662-HELP (4357) — free, confidential, 24/7"],
          ["SAMHSA Treatment Locator","findtreatment.gov"],
          ["SMART Recovery","smartrecovery.org"],
          ["Refuge Recovery","refugerecovery.org"],
          ["Crisis Text Line","Text HOME to 741741 (US)"],
          ["National Suicide & Crisis Lifeline","Call or text 988 (US)"],
        ].map(([name, detail]) => (
          <div key={name} className="p-3 border border-gray-200 rounded-lg">
            <p className="font-bold text-sm text-gray-800">{name}</p>
            <p className="text-xs text-gray-500">{detail}</p>
          </div>
        ))}
      </div>

      <ExerciseBox title="Local Resources — Fill In" badge="Fillable">
        <div className="grid grid-cols-2 gap-3">
          {["Clinic Name","Prescriber","Counselor","Local SMART Recovery","Peer Recovery Coach","Naloxone Access Point","After-Hours Crisis Line","Nearest Emergency Room"].map(f => <Field key={f} label={f} />)}
        </div>
      </ExerciseBox>

      <ExerciseBox title="Next Steps" badge="Action">
        <div className="grid grid-cols-3 gap-3">
          <Field label="My next counseling appointment" />
          <Field label="My next medical appointment" />
          <Field label="My recovery goal for the next 30 days" />
        </div>
      </ExerciseBox>

      <SectionLabel>Call / Text Scripts — Appendix</SectionLabel>
      <div className="space-y-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
          <p className="font-bold text-gray-700 mb-1">When calling a support person with a craving:</p>
          <p className="text-gray-600 italic">"Hi [Name], I'm having a strong craving and need some support. I'm going to [step]. Can you check in with me for 15 minutes?"</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
          <p className="font-bold text-gray-700 mb-1">When setting a boundary with a partner:</p>
          <p className="text-gray-600 italic">"I need time for treatment, which means [X]. I'd like your support with this. If you can't, I understand, but I'll need to protect my recovery."</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
          <p className="font-bold text-gray-700 mb-1">When declining a high-risk social invitation:</p>
          <p className="text-gray-600 italic">"Thanks for inviting me. I'm focusing on my recovery right now and won't be going. I'd like to get together another time for [coffee / a walk]."</p>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════
   FACILITATOR GUIDE
════════════════════════════════════════════════ */
function FacilitatorGuide() {
  const modules = [
    {
      title: "Module 1 — Welcome, Goals & Recovery Vision",
      goals: ["Elicit client reasons for change and create a short recovery vision.","Set 1–3 achievable short-term goals."],
      scripts: [
        '"Tell me in your own words why recovery matters to you."',
        '"What would a good week look like for you in three months?"',
        '"Which value here feels most important? How would you like to act on it this week?"',
      ],
      tips: [
        "Use the Recovery Statement as a standing agenda item each week.",
        "Set one small behavioral homework per session (e.g., contact one support person, attend one meeting).",
        "If client lists court-ordered substance tests or court conditions, align goals with those requirements.",
        "Document goal-setting in clinical notes and confirm client consent before sharing.",
      ],
    },
    {
      title: "Module 2 — Understanding Relapse",
      goals: ["Teach relapse as a process.","Complete a functional analysis of a past relapse or near-miss."],
      scripts: [
        '"Walk me through what happened before you used. What was the first change you noticed?"',
        '"What triggered strong emotions that day?"',
      ],
      tips: [
        "Functional analysis: identify situation (who, where, when) → thoughts & beliefs → feelings & intensity → actions & consequences → alternative responses.",
        "Use anonymized examples in group settings. Encourage peer feedback on coping ideas.",
        "Watch for shame and self-blame. Reframe with strengths: 'What did you do that helped at any step?'",
        "If client reports recent use or violent behavior, follow agency risk and safety protocols immediately.",
      ],
    },
    {
      title: "Module 3 — Motivation & Ambivalence",
      goals: ["Resolve ambivalence and increase commitment to community supports."],
      scripts: [
        '"What are the best things that could happen if you stay sober? What worries you about that?"',
        '"Who in your life would support this change? Who might make it harder?"',
      ],
      tips: [
        "Role-play calling a peer, entering a meeting, or asking for a ride.",
        "Use graded exposure: first homework is low-demand (read meeting schedule), then call a peer, then attend a meeting.",
        "Offer a range of supports: 12-step, SMART Recovery, faith-based, peer-run groups, recovery coaches.",
        "Some clients may be nervous about groups — offer alternatives: one-on-one peer support, online meetings, LGBTQ+-specific meetings.",
        "For LGBTQ+ clients: ensure referral lists and meeting suggestions are inclusive and safe.",
      ],
    },
    {
      title: "Module 4 — Coping with Cravings & Urges",
      goals: ["Teach and practice 2–3 urge-coping skills.","Create a personalized Craving Plan."],
      scripts: [
        '"Let\'s try urge surfing together. Rate your urge before and after."',
        '"If your urge remains high, who can you call? Let\'s practice what you will say."',
      ],
      tips: [
        "Skill practice structure: explain (1–2 min) → model the skill → invite client to practice in session → debrief.",
        "Homework: use the 7-day plan, track urges and coping used, bring to next session.",
        "If urges include suicidal thoughts or unsafe behaviors, use clinical safety protocols immediately.",
        "If client is actively intoxicated in session, postpone skill practice and follow agency intoxication policy.",
        "Record client's risk rating, coping plan, and any safety concerns in the chart.",
        "Note all referrals and client agreements for follow-up.",
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <Callout title="Facilitation Style" color="navy">
        <ul className="list-disc list-inside space-y-1 text-sm mt-1">
          <li>Use a warm, nonjudgmental tone throughout.</li>
          <li>Apply Motivational Interviewing: open questions, affirmations, reflective listening, summaries.</li>
          <li>Sessions may run 30–60 minutes. Modules can cover one or more sessions. Adapt to client pace.</li>
          <li>For justice-involved clients: check supervision/probation conditions before recommending contacts or activities.</li>
          <li>For LGBTQ+ clients: verify referral lists are inclusive and physically safe.</li>
        </ul>
      </Callout>

      {modules.map((m) => (
        <Accordion key={m.title} title={m.title} icon={<Users size={18} />}>
          <SectionLabel>Session Goals</SectionLabel>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-4">
            {m.goals.map(g => <li key={g}>{g}</li>)}
          </ul>
          <SectionLabel>Suggested Script Prompts</SectionLabel>
          <div className="space-y-2 mb-4">
            {m.scripts.map(s => (
              <div key={s} className="bg-amber-50 border-l-4 border-amber-400 px-4 py-2 text-sm text-amber-900 italic">{s}</div>
            ))}
          </div>
          <SectionLabel>Teaching Tips & Safety Considerations</SectionLabel>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {m.tips.map(t => <li key={t}>{t}</li>)}
          </ul>
        </Accordion>
      ))}

      <Callout title="Materials & Handouts Checklist" color="amber">
        <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
          {["My Recovery Statement sheet","Relapse Timeline worksheet","Personal Warning Signs list","Decisional Balance worksheet","Craving Coping Plan","Community Contact Log","7-Day Daily Practice Plan","Emergency Relapse Action Plan (wallet card)","Local resource templates (left blank for agency insertion)"].map(i => (
            <li key={i} className="flex items-center gap-2">
              <input type="checkbox" className="rounded text-amber-600" /> {i}
            </li>
          ))}
        </ul>
      </Callout>

      <Callout title="Documentation Notes" color="navy">
        <ul className="list-disc list-inside text-sm mt-1 space-y-1">
          <li>Record the client's risk rating, coping plan, and any safety concerns in the chart every session.</li>
          <li>Note all referrals made and client agreements for follow-up.</li>
          <li>Confirm client consent before sharing goal documentation with third parties.</li>
          <li>If client is justice-involved, align documentation with probation/supervision reporting requirements.</li>
        </ul>
      </Callout>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
const clientModules = [
  { title: "Module 1 — Welcome, Goals & Recovery Snapshot", badge: "Foundation", icon: <BookOpen size={18} />, component: <ModuleRecoverySnapshot />, defaultOpen: true },
  { title: "Module 2 — Understanding Relapse: Process & Patterns", badge: "Core Skill", icon: <BookOpen size={18} />, component: <ModuleRelapse /> },
  { title: "Module 3 — Triggers: Identify, Rate, Replace", badge: "Core Skill", icon: <BookOpen size={18} />, component: <ModuleTriggers /> },
  { title: "Module 4 — Early Warning Signs & Decision Points", badge: "Core Skill", icon: <BookOpen size={18} />, component: <ModuleWarnings /> },
  { title: "Module 5 — Motivation & Ambivalence", badge: "Core Skill", icon: <BookOpen size={18} />, component: <ModuleMotivation /> },
  { title: "Module 6 — Craving Management Toolbox", badge: "Core Skill", icon: <BookOpen size={18} />, component: <ModuleCravings /> },
  { title: "Module 7 — Coping Skills Practice: Behavioral & Emotional", badge: "Practice", icon: <BookOpen size={18} />, component: <ModuleCopingSkills /> },
  { title: "Module 8 — Building Community Supports (Non-12-Step)", badge: "Community", icon: <BookOpen size={18} />, component: <ModuleCommunity /> },
  { title: "Module 9 — Problem Solving & Stress Management", badge: "Practice", icon: <BookOpen size={18} />, component: <ModuleProblemSolving /> },
  { title: "Module 10 — MAT & Harm Reduction", badge: "Medical", icon: <BookOpen size={18} />, component: <ModuleMAT /> },
  { title: "Module 11 — Personalized Relapse Prevention Plan", badge: "Master Plan", icon: <FileText size={18} />, component: <ModulePreventionPlan /> },
  { title: "Module 12 — Emergency Relapse Action Plan", badge: "Emergency", icon: <AlertCircle size={18} />, component: <ModuleEmergencyPlan /> },
  { title: "Weekly & Monthly Progress Logs", badge: "Ongoing", icon: <BookOpen size={18} />, component: <ModuleProgressLogs /> },
  { title: "Resources, Crisis Contacts & Scripts", badge: "Reference", icon: <CheckCircle2 size={18} />, component: <ModuleResources /> },
];

export default function CurriculumPage() {
  const [tab, setTab] = useState<'client' | 'facilitator'>('client');

  return (
    <div className="w-full bg-gray-50 min-h-screen print:bg-white">

      {/* Header */}
      <div className="bg-foreground text-white py-16 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <img src={`${BASE}/logos/foundation-logo-transparent.png`} alt="The Sunrise Foundation" className="h-16 w-auto mx-auto mb-5 opacity-90" />
          <h1 className="text-4xl md:text-5xl font-serif mb-3">Relapse Prevention Curriculum</h1>
          <p className="text-gray-300 text-lg font-light max-w-2xl mx-auto">
            A clinical, motivational workbook for individuals in early recovery. Covers opiates, stimulants, and multiple substances. Non-12-step friendly.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white text-sm font-medium rounded-sm hover:bg-white/10 transition-colors"
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[96px] z-30 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex">
          {[
            { id: 'client', label: 'Client Workbook', icon: <BookOpen size={16} /> },
            { id: 'facilitator', label: "Facilitator Guide", icon: <Users size={16} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'client' | 'facilitator')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {tab === 'client' && (
          <div>
            <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-800">
              <p className="font-bold mb-1">How to Use This Workbook</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Work through one module at a time — with your counselor, a peer, or on your own.</li>
                <li>Fill out the exercises honestly. They are designed to guide real change, not just paperwork.</li>
                <li>Bring completed sections to your sessions. Your recovery team will use them to spot risk and plan better.</li>
                <li>Keep your Emergency Relapse Action Plan (Module 12) accessible at all times — phone photo, wallet card, or both.</li>
              </ul>
            </div>
            {clientModules.map(m => (
              <Accordion key={m.title} title={m.title} icon={m.icon} badge={m.badge} defaultOpen={m.defaultOpen}>
                {m.component}
              </Accordion>
            ))}
          </div>
        )}

        {tab === 'facilitator' && (
          <div>
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-bold mb-1">For Clinical Use Only</p>
              This guide is for counselors, peer recovery specialists, case managers, and group facilitators using this curriculum. It is not intended for direct distribution to clients.
            </div>
            <FacilitatorGuide />
          </div>
        )}

        {/* Print button bottom */}
        <div className="mt-10 flex justify-center gap-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-border text-foreground text-sm font-medium rounded-sm hover:bg-foreground/5 transition-colors"
          >
            <Printer size={16} /> Print Full Curriculum
          </button>
        </div>
      </div>
    </div>
  );
}
