import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, Target, BarChart3, Zap } from 'lucide-react';

export const Investors = () => {
  return (
    <section id="investors" className="py-24 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-[#0F172A] to-[#0F172A] -z-10"></div>
      
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sunrise-amber/10 border border-sunrise-amber/20 text-sm font-medium text-sunrise-amber mb-6">
            <TrendingUp className="w-4 h-4" />
            Investor Opportunity
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            A massive, <span className="text-sunrise-amber">underserved</span> market.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl">
            Behavioral healthcare is the fastest-growing sector in medicine, yet operators are forced to use software built a decade ago.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
              <div className="text-4xl font-extrabold text-white mb-2">2.1M+</div>
              <div className="text-slate-400 text-sm">Americans in treatment annually</div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
              <div className="text-4xl font-extrabold text-white mb-2">14,500</div>
              <div className="text-slate-400 text-sm">Treatment facilities in the US</div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center col-span-2 bg-gradient-to-br from-slate-800/50 to-sunrise-amber/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-sunrise-amber/20 rounded-xl text-sunrise-amber">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">$14B+</div>
                  <div className="text-slate-400 text-sm">TAM for specialized EHR software</div>
                </div>
              </div>
              <p className="text-slate-300 text-sm">Driven by regulatory changes and the explosion of private equity roll-ups demanding better operational data.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-white">Our Moat</h3>
            
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-slate-800 p-2 rounded-lg text-sunrise-amber"><Target className="w-5 h-5"/></div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Purpose-built, not retrofitted</h4>
                <p className="text-slate-400 text-sm">General EHRs fail in rehab environments. We map directly to the ASAM criteria and distinct phases of detox/residential care.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-slate-800 p-2 rounded-lg text-sunrise-amber"><ShieldCheck className="w-5 h-5"/></div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Compliance as a feature</h4>
                <p className="text-slate-400 text-sm">We don't just store data; we actively prevent operators from making mistakes that lead to insurance clawbacks.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-slate-800 p-2 rounded-lg text-sunrise-amber"><Zap className="w-5 h-5"/></div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Deep AI integration</h4>
                <p className="text-slate-400 text-sm">Competitors are bolting on ChatGPT wrappers. Our AI engine is natively embedded into the clinical workflow, referencing the entire patient chart.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* The Raise */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-sunrise-amber/10 to-sunrise-orange/10 border border-sunrise-orange/20 rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1">
              <div className="text-sm font-bold text-sunrise-orange tracking-widest uppercase mb-2">Seed Round</div>
              <div className="text-4xl font-extrabold text-white mb-2">$2.5M</div>
              <div className="text-slate-300">at $10M Post-Money Cap</div>
              <a href="mailto:investors@sunriseos.com" className="mt-6 inline-flex items-center px-6 py-3 text-sm font-semibold text-slate-900 bg-sunrise-amber hover:bg-yellow-400 rounded-full transition-colors">
                Request Data Room
              </a>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-lg font-semibold text-white mb-4">Use of Funds</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Engineering & Product</span>
                    <span className="text-white font-bold">40%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sunrise-orange w-[40%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Go-to-Market & Sales</span>
                    <span className="text-white font-bold">35%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sunrise-amber w-[35%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Security & Compliance</span>
                    <span className="text-white font-bold">25%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sunrise-teal w-[25%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
