import React from 'react';
import { motion } from 'framer-motion';

export const Team = () => {
  return (
    <section className="py-28 border-t border-slate-800/60">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sunrise-orange mb-5">Leadership</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Built by operators.
          </h2>
          <p className="text-lg text-slate-400">
            We felt the pain of legacy software firsthand, so we built the solution.
          </p>
        </div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#0A0F1C] border border-slate-800 rounded-xl p-10 flex flex-col items-center text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 mb-6 flex items-center justify-center text-xl font-bold text-white tracking-tight">
              JC
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">Jim Collins</h3>
            <div className="text-sunrise-orange text-xs font-semibold tracking-[0.15em] uppercase mb-5">CEO & Founder</div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Clinical Supervisor and Counselor across all levels of care in addiction treatment for 17 years. Built Sunrise OS from the inside out — because he lived the problem every single day.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
