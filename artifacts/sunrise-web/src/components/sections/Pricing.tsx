import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const Pricing = () => {
  return (
    <section id="pricing" className="py-28 bg-[#0A0F1C] border-t border-slate-800/60">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sunrise-orange mb-5">Pricing</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Transparent, facility-based pricing.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            No hidden implementation fees. No surprise per-user charges. You pay for the capacity of your facility.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">

          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#0F172A] p-8 rounded-xl border border-slate-800 flex flex-col"
          >
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Starter</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white tracking-tight">$299</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
            </div>
            <ul className="space-y-3.5 mb-8 flex-1">
              {['Up to 30 beds', 'Up to 5 clinical staff', 'Core EHR workflows', 'Basic census management'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                  <Check className="w-4 h-4 text-slate-600 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:sales@sunriseos.com" className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-center rounded-lg text-sm font-medium transition-colors border border-slate-700">
              Get Started
            </a>
          </motion.div>

          {/* Growth — featured */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="bg-[#0F172A] p-8 rounded-xl border border-sunrise-orange/50 flex flex-col relative shadow-[0_0_40px_rgba(249,115,22,0.08)]"
          >
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-sunrise-orange text-white px-3 py-0.5 rounded text-xs font-semibold tracking-wider uppercase">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-sunrise-orange uppercase tracking-widest mb-4">Growth</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white tracking-tight">$699</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
            </div>
            <ul className="space-y-3.5 mb-8 flex-1">
              {['Up to 75 beds', 'Up to 15 clinical staff', 'AI Note Generation Engine', 'Compliance Dashboards', 'Priority Support'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white text-sm">
                  <Check className="w-4 h-4 text-sunrise-orange shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:demo@sunriseos.com" className="block w-full py-3 px-4 bg-sunrise-orange hover:bg-orange-500 text-white text-center rounded-lg text-sm font-semibold transition-colors">
              Book a Demo
            </a>
          </motion.div>

          {/* Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="bg-[#0F172A] p-8 rounded-xl border border-slate-800 flex flex-col"
          >
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Enterprise</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white tracking-tight">Custom</span>
              </div>
            </div>
            <ul className="space-y-3.5 mb-8 flex-1">
              {['Unlimited beds & staff', 'Multi-facility management', 'Dedicated compliance officer', 'White-label patient portal', 'Custom API integrations'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                  <Check className="w-4 h-4 text-slate-600 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:sales@sunriseos.com" className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-center rounded-lg text-sm font-medium transition-colors border border-slate-700">
              Contact Sales
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
