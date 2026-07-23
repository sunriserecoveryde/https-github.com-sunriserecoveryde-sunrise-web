import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { DemoModal } from '../DemoModal';

export const Investors = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
    <section id="investors" className="py-28 bg-[#080E1C] border-y border-slate-800/50">
      <div className="container mx-auto px-5 md:px-10">

        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5"
          >
            Investor Opportunity
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-black text-white mb-5 leading-[1.08]"
          >
            A massive, underserved market.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Behavioral healthcare is the fastest-growing sector in medicine, yet operators are forced to use software built a decade ago.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-10">

          {/* Market stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { value: '17,400', label: 'Licensed SUD treatment facilities in the U.S.' },
              { value: '42%', label: 'Annual counselor turnover — the problem we solve' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0B1220] p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                <div className="text-4xl font-black text-white mb-2 tracking-tight">{stat.value}</div>
                <div className="text-slate-500 text-sm leading-snug">{stat.label}</div>
              </div>
            ))}
            <div className="bg-[#0B1220] p-6 rounded-2xl border border-slate-800 col-span-2">
              <div className="flex items-start gap-4 mb-3">
                <div className="p-2.5 bg-sunrise-orange/10 rounded-xl text-sunrise-orange shrink-0 mt-0.5">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white tracking-tight">$4.2B</div>
                  <div className="text-slate-500 text-sm">SUD treatment software market — Grand View Research, 2025</div>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">Expanding into dual-diagnosis and mental health residential opens a broader behavioral health TAM exceeding $14B. Sunrise OS enters at the highest-fragmentation segment first.</p>
            </div>
          </motion.div>

          {/* Moat */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="space-y-5"
          >
            <h3 className="text-base font-bold text-slate-300 uppercase tracking-widest mb-6">Our Moat</h3>
            {[
              {
                icon: <Target className="w-4 h-4 text-sunrise-orange" />,
                title: 'Purpose-built, not retrofitted',
                desc: 'General EHRs fail in rehab environments. We map directly to ASAM criteria and the distinct phases of detox and residential care.',
              },
              {
                icon: <ShieldCheck className="w-4 h-4 text-sunrise-orange" />,
                title: 'Compliance as a feature',
                desc: 'We actively prevent operators from making mistakes that lead to insurance clawbacks. 15% denial rates are the norm. We target sub-5%.',
              },
              {
                icon: <Zap className="w-4 h-4 text-sunrise-orange" />,
                title: 'Deep AI integration',
                desc: "Competitors bolt on ChatGPT wrappers. Our AI engine is natively embedded in the clinical workflow, referencing the entire patient chart.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start p-5 rounded-2xl bg-[#0B1220] border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="mt-0.5 bg-sunrise-orange/10 border border-sunrise-orange/20 p-2 rounded-lg shrink-0">{item.icon}</div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* The Raise */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-[#0B1220] border border-slate-700/60 rounded-2xl p-8 md:p-12 relative overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-sunrise-orange/6 rounded-full blur-3xl pointer-events-none" />

          <div className="grid md:grid-cols-3 gap-10 items-start relative">
            <div>
              <div className="text-xs font-bold text-sunrise-orange tracking-[0.2em] uppercase mb-3">Seed Round</div>
              <div className="text-6xl font-black text-white mb-1 tracking-tight">$3.5M</div>
              <div className="text-slate-500 text-sm mb-2">Pre-money valuation on request</div>
              <div className="text-slate-600 text-sm mb-8 leading-relaxed">Target: 8 pilot facilities · $500K ARR · SOC 2 Type II</div>
              <button
                onClick={() => setDemoOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-sunrise-orange hover:bg-orange-500 rounded-xl transition-all shadow-[0_0_24px_rgba(249,115,22,0.2)] hover:shadow-[0_0_36px_rgba(249,115,22,0.35)]"
              >
                Request Data Room <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-slate-500 tracking-[0.2em] uppercase mb-6">Use of Funds</h4>
              <div className="space-y-5">
                {[
                  { label: 'Product & Engineering', pct: '45%', w: '45%', color: 'bg-sunrise-orange' },
                  { label: 'Sales & Marketing', pct: '25%', w: '25%', color: 'bg-sunrise-orange/75' },
                  { label: 'Clinical Partnerships & Pilots', pct: '20%', w: '20%', color: 'bg-sunrise-orange/50' },
                  { label: 'Operations & Compliance', pct: '10%', w: '10%', color: 'bg-sunrise-orange/30' },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="text-white font-bold">{row.pct}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: row.w }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full ${row.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
    <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} defaultPlan="Investor" />
    </>
  );
};
