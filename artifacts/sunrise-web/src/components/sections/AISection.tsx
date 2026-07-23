import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Clock, FileText, TrendingDown } from 'lucide-react';

const stats = [
  { icon: <Clock className="w-5 h-5" />, value: '90 min', label: 'saved per clinician, per shift' },
  { icon: <TrendingDown className="w-5 h-5" />, value: '40% → 8%', label: 'of shift spent on documentation' },
  { icon: <Zap className="w-5 h-5" />, value: '< 3 sec', label: 'to generate a complete clinical note' },
  { icon: <FileText className="w-5 h-5" />, value: '4 formats', label: 'BIRP · DAP · SOAP · GIRP' },
];

export const AISection = () => {
  return (
    <section id="solution" className="py-28 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">

        {/* Stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((s, i) => (
            <div key={i} className="bg-[#0A0F1C] border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="text-sunrise-orange">{s.icon}</div>
              <div className="text-2xl font-extrabold text-white tracking-tight">{s.value}</div>
              <div className="text-xs text-slate-500 leading-snug">{s.label}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sunrise-orange mb-5">AI Note Engine</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Type two sentences.<br />
              Get a full clinical note.
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Documentation shouldn't be a creative writing exercise. The average counselor spends 3.5 hours per shift on notes. Sunrise OS compresses that to under 30 minutes — without sacrificing compliance or clinical quality.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Generates BIRP, DAP, SOAP, and GIRP formats on demand",
                "Automatically links to the patient's active treatment plan",
                "Flags missing clinical justifications before submission",
                "Supervisors co-sign in one click — no chasing staff down",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sunrise-orange shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>

            {/* Pull quote */}
            <div className="border-l-2 border-sunrise-orange/40 pl-5">
              <p className="text-slate-400 text-sm italic leading-relaxed">
                "I used to stay 45 minutes late every shift just to finish my notes. Now I'm done before handoff."
              </p>
              <p className="text-slate-600 text-xs mt-2 tracking-wide">— Primary Counselor, 6-bed residential facility</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="bg-[#0A0F1C] rounded-xl p-6 border border-slate-700/60 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-semibold tracking-widest uppercase text-slate-500">Counselor Input</div>
                <div className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-500 border border-slate-700">Shorthand</div>
              </div>
              <div className="p-4 bg-slate-800/60 rounded-lg font-mono text-sm text-slate-300 mb-6 border border-slate-700/50 leading-relaxed">
                "Pt triggered by family call. Talked about coping skills from last week. Seems stable now."
              </div>

              <div className="flex justify-center mb-6 relative">
                <div className="absolute top-1/2 left-0 w-full h-px bg-slate-800 -translate-y-1/2"></div>
                <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg relative z-10 flex items-center gap-2 px-3">
                  <Zap className="w-3.5 h-3.5 text-sunrise-orange" />
                  <span className="text-xs text-slate-400">Generated in 2.4 s</span>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-semibold tracking-widest uppercase text-slate-500">Generated Output</div>
                <div className="px-2 py-0.5 bg-sunrise-orange/10 text-sunrise-orange rounded text-xs border border-sunrise-orange/20">BIRP Note</div>
              </div>
              <div className="p-5 bg-[#060B14] rounded-lg text-sm text-slate-300 border border-slate-800 space-y-4 relative overflow-hidden">
                <div>
                  <span className="block mb-1 text-xs tracking-widest uppercase text-slate-500">Behavior</span>
                  Patient reported experiencing emotional dysregulation following a telephone interaction with family members. Patient presented with mild anxiety but maintained cooperative demeanor.
                </div>
                <div>
                  <span className="block mb-1 text-xs tracking-widest uppercase text-slate-500">Intervention</span>
                  Counselor processed the triggering event with patient. Reviewed and reinforced previously established coping mechanisms from the treatment plan, focusing on emotional grounding techniques.
                </div>
                <div className="h-10 bg-gradient-to-t from-[#060B14] to-transparent absolute bottom-0 left-0 w-full" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
