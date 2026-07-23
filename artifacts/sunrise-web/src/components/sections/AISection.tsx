import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Clock, FileText, TrendingDown } from 'lucide-react';

const stats = [
  { icon: <Clock className="w-4 h-4" />, value: '90 min', label: 'saved per clinician, per shift' },
  { icon: <TrendingDown className="w-4 h-4" />, value: '40%→8%', label: 'of shift on documentation' },
  { icon: <Zap className="w-4 h-4" />, value: '<3 sec', label: 'to generate a complete clinical note' },
  { icon: <FileText className="w-4 h-4" />, value: '4 formats', label: 'BIRP · DAP · SOAP · GIRP' },
];

export const AISection = () => {
  return (
    <section id="solution" className="py-28 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-sunrise-orange/3 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-5 md:px-10">

        {/* Stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-24"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#080E1C] border border-slate-800 rounded-2xl p-5 flex flex-col gap-2.5 hover:border-slate-700 transition-colors"
            >
              <div className="text-sunrise-orange">{s.icon}</div>
              <div className="text-2xl font-black text-white tracking-tight">{s.value}</div>
              <div className="text-xs text-slate-500 leading-snug">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5">AI Note Engine</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.06]">
              Type two sentences.<br />
              Get a full clinical note.
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Documentation shouldn't be a creative writing exercise. The average counselor spends 3.5 hours per shift on notes. Sunrise OS compresses that to under 30 minutes — without sacrificing compliance or clinical quality.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                'Generates BIRP, DAP, SOAP, and GIRP formats on demand',
                'Automatically links to the patient\'s active treatment plan',
                'Flags missing clinical justifications before submission',
                'Supervisors co-sign in one click — no chasing staff down',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sunrise-orange shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>

            <div className="border-l-2 border-sunrise-orange/30 pl-5">
              <p className="text-slate-400 text-sm italic leading-relaxed">
                "I used to stay 45 minutes late every shift just to finish my notes. Now I'm done before handoff."
              </p>
              <p className="text-slate-600 text-xs mt-2">— Primary Counselor, 6-bed residential facility</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="bg-[#080E1C] rounded-2xl p-6 border border-slate-800 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-600">Counselor Input</div>
                <div className="px-2 py-0.5 bg-slate-800/80 rounded text-[10px] text-slate-500 border border-slate-700">Shorthand mode</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl font-mono text-sm text-slate-300 mb-6 border border-slate-700/40 leading-relaxed">
                "Pt triggered by family call. Talked about coping skills from last week. Seems stable now."
              </div>

              <div className="flex justify-center mb-6 relative">
                <div className="absolute top-1/2 left-0 w-full h-px bg-slate-800 -translate-y-1/2" />
                <div className="bg-slate-900 border border-slate-700/60 py-1.5 rounded-lg relative z-10 flex items-center gap-2 px-4">
                  <Zap className="w-3.5 h-3.5 text-sunrise-orange" />
                  <span className="text-xs text-slate-400 font-medium">Generated in 2.4 s</span>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-600">Generated Output</div>
                <div className="px-2 py-0.5 bg-sunrise-orange/10 text-sunrise-orange rounded text-[10px] border border-sunrise-orange/20 font-semibold">BIRP Note</div>
              </div>
              <div className="p-5 bg-[#040810] rounded-xl text-sm text-slate-300 border border-slate-800 space-y-4 relative overflow-hidden">
                <div>
                  <span className="block mb-1.5 text-[10px] tracking-widest uppercase text-slate-600 font-semibold">Behavior</span>
                  <p className="text-slate-400 text-sm leading-relaxed">Patient reported experiencing emotional dysregulation following a telephone interaction with family members. Presented with mild anxiety but maintained cooperative demeanor.</p>
                </div>
                <div>
                  <span className="block mb-1.5 text-[10px] tracking-widest uppercase text-slate-600 font-semibold">Intervention</span>
                  <p className="text-slate-400 text-sm leading-relaxed">Counselor processed the triggering event with patient. Reviewed and reinforced previously established coping mechanisms from treatment plan.</p>
                </div>
                <div className="h-12 bg-gradient-to-t from-[#040810] to-transparent absolute bottom-0 left-0 w-full" />
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -right-4 bg-[#0B1220] border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-semibold text-white">Co-signed</div>
                  <div className="text-[9px] text-slate-500">Clinical Supervisor</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
