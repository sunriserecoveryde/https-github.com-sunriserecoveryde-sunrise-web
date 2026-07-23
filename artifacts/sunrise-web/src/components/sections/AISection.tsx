import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';

export const AISection = () => {
  return (
    <section id="solution" className="py-28 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
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
              Documentation shouldn't be a creative writing exercise. Sunrise OS uses a fine-tuned clinical AI to instantly expand shorthand into fully structured, compliant notes.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Generates BIRP, DAP, SOAP, and GIRP formats",
                "Automatically links to the patient's active treatment plan",
                "Flags missing clinical justifications for billing",
                "Cuts documentation time from 40% to under 10% of a shift"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sunrise-orange shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
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
                <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg relative z-10">
                  <Zap className="w-4 h-4 text-sunrise-orange" />
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-semibold tracking-widest uppercase text-slate-500">Generated Output</div>
                <div className="px-2 py-0.5 bg-sunrise-orange/10 text-sunrise-orange rounded text-xs border border-sunrise-orange/20">BIRP Note</div>
              </div>
              <div className="p-5 bg-[#060B14] rounded-lg text-sm text-slate-300 border border-slate-800 space-y-4 relative">
                <div>
                  <span className="text-white font-semibold block mb-1 text-xs tracking-widest uppercase text-slate-400">Behavior</span>
                  Patient reported experiencing emotional dysregulation following a telephone interaction with family members. Patient presented with mild anxiety but maintained cooperative demeanor.
                </div>
                <div>
                  <span className="text-white font-semibold block mb-1 text-xs tracking-widest uppercase text-slate-400">Intervention</span>
                  Counselor processed the triggering event with patient. Reviewed and reinforced previously established coping mechanisms from the treatment plan, focusing on emotional grounding techniques.
                </div>
                <div className="h-8 bg-gradient-to-t from-[#060B14] to-transparent absolute bottom-0 left-0 w-full rounded-b-lg" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
