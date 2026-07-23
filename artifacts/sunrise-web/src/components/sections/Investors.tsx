import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, Target, BarChart3, Zap } from 'lucide-react';

export const Investors = () => {
  return (
    <section id="investors" className="py-28 relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sunrise-orange mb-5">Investor Opportunity</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            A massive, underserved market.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Behavioral healthcare is the fastest-growing sector in medicine, yet operators are forced to use software built a decade ago.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { value: "17,400", label: "Licensed SUD treatment facilities in the U.S." },
              { value: "42%", label: "Annual counselor turnover — the problem we're solving" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0A0F1C] p-6 rounded-xl border border-slate-800 flex flex-col justify-center">
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">{stat.value}</div>
                <div className="text-slate-400 text-sm leading-snug">{stat.label}</div>
              </div>
            ))}
            <div className="bg-[#0A0F1C] p-6 rounded-xl border border-slate-800 col-span-2">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-2.5 bg-sunrise-orange/10 rounded-lg text-sunrise-orange">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white tracking-tight">$4.2B</div>
                  <div className="text-slate-400 text-sm">SUD treatment software market (Grand View Research, 2025)</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Expanding into dual-diagnosis and mental health residential opens a broader behavioral health TAM exceeding $14B. Sunrise OS enters at the highest-fragmentation segment first.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="space-y-8"
          >
            <h3 className="text-xl font-semibold text-white">Our Moat</h3>

            {[
              {
                icon: <Target className="w-5 h-5 text-sunrise-orange" />,
                title: "Purpose-built, not retrofitted",
                desc: "General EHRs fail in rehab environments. We map directly to the ASAM criteria and distinct phases of detox and residential care."
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-sunrise-orange" />,
                title: "Compliance as a feature",
                desc: "We don't just store data — we actively prevent operators from making mistakes that lead to insurance clawbacks. 15% denial rates in behavioral health are the norm. We target sub-5%."
              },
              {
                icon: <Zap className="w-5 h-5 text-sunrise-orange" />,
                title: "Deep AI integration",
                desc: "Competitors are bolting on ChatGPT wrappers. Our AI engine is natively embedded into the clinical workflow, referencing the entire patient chart."
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="mt-0.5 bg-slate-800/80 border border-slate-700/60 p-2 rounded-lg shrink-0">{item.icon}</div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
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
          className="bg-[#0A0F1C] border border-slate-700/60 rounded-2xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div className="md:col-span-1">
              <div className="text-xs font-semibold text-sunrise-orange tracking-[0.18em] uppercase mb-3">Seed Round</div>
              <div className="text-5xl font-extrabold text-white mb-1 tracking-tight">$3.5M</div>
              <div className="text-slate-400 mb-2">Pre-money valuation on request</div>
              <div className="text-slate-500 text-sm mb-7">Target milestones: 8 pilot facilities, $500K ARR, SOC 2 Type II</div>
              <a href="mailto:investors@sunriseos.com" className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-sunrise-orange hover:bg-orange-500 rounded-lg transition-colors">
                Request Data Room
              </a>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-slate-300 tracking-wide mb-6 uppercase">Use of Funds</h4>
              <div className="space-y-5">
                {[
                  { label: "Product & Engineering", pct: "45%", w: "45%", color: "bg-sunrise-orange" },
                  { label: "Sales & Marketing", pct: "25%", w: "25%", color: "bg-sunrise-orange/70" },
                  { label: "Clinical Partnerships & Pilots", pct: "20%", w: "20%", color: "bg-sunrise-orange/50" },
                  { label: "Operations & Compliance", pct: "10%", w: "10%", color: "bg-sunrise-orange/30" },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="text-white font-semibold">{row.pct}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${row.color} rounded-full`} style={{ width: row.w }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
