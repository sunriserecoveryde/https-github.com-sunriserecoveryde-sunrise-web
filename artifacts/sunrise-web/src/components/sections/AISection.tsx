import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Zap } from 'lucide-react';

export const AISection = () => {
  return (
    <section id="solution" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sunrise-blue/10 border border-sunrise-blue/20 text-sm font-medium text-sunrise-blue mb-6">
              <Sparkles className="w-4 h-4" />
              AI Note Engine
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Type two sentences. <br />
              <span className="text-sunrise-blue">Get a full clinical note.</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8">
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
                  <CheckCircle2 className="w-6 h-6 text-sunrise-blue shrink-0" />
                  <span className="text-slate-300">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card rounded-2xl p-6 relative z-10 border border-slate-700/50 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-400">Counselor Shorthand</div>
                <div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">Input</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl font-mono text-sm text-slate-300 mb-6 border border-slate-700">
                "Pt triggered by family call. Talked about coping skills from last week. Seems stable now."
              </div>

              <div className="flex justify-center mb-6 relative">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-700 -translate-y-1/2"></div>
                <div className="bg-sunrise-blue p-2 rounded-full relative z-10 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-sunrise-blue">Generated BIRP Note</div>
                <div className="px-2 py-1 bg-sunrise-blue/20 text-sunrise-blue rounded text-xs">Output</div>
              </div>
              <div className="p-5 bg-slate-900 rounded-xl text-sm text-slate-300 border border-slate-700 space-y-4">
                <div>
                  <span className="text-white font-bold block mb-1">Behavior:</span>
                  Patient reported experiencing emotional dysregulation following a telephone interaction with family members. Patient presented with mild anxiety but maintained cooperative demeanor.
                </div>
                <div>
                  <span className="text-white font-bold block mb-1">Intervention:</span>
                  Counselor processed the triggering event with patient. Reviewed and reinforced previously established coping mechanisms from the treatment plan, specifically focusing on emotional grounding techniques.
                </div>
                <div className="h-10 bg-gradient-to-b from-slate-900/0 to-slate-900 absolute bottom-0 left-0 w-full rounded-b-xl flex items-end justify-center pb-2">
                  <span className="text-xs text-sunrise-blue font-medium">Scroll to see full note</span>
                </div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-sunrise-blue/10 rounded-full blur-[80px] -z-10"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
