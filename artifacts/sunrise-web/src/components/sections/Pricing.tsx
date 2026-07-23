import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing.
          </h2>
          <p className="text-lg text-slate-400">
            No hidden implementation fees. No surprise per-user charges. You pay for the capacity of your facility.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          
          {/* Starter Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-3xl border border-slate-700/50"
          >
            <h3 className="text-xl font-medium text-slate-300 mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">$299</span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Up to 30 beds', 'Up to 5 clinical staff', 'Core EHR workflows', 'Basic census management'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-slate-500" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:sales@sunriseos.com" className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-center rounded-xl font-medium transition-colors">
              Get Started
            </a>
          </motion.div>

          {/* Growth Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] p-8 rounded-3xl border-2 border-sunrise-orange relative transform md:-translate-y-4 shadow-2xl shadow-sunrise-orange/10"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sunrise-orange text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              Most Popular
            </div>
            <h3 className="text-xl font-medium text-sunrise-orange mb-2">Growth</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">$699</span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Up to 75 beds', 'Up to 15 clinical staff', 'AI Note Generation Engine', 'Compliance Dashboards', 'Priority Support'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white text-sm">
                  <Check className="w-4 h-4 text-sunrise-orange" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:demo@sunriseos.com" className="block w-full py-3 px-4 bg-sunrise-orange hover:bg-orange-500 text-white text-center rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/20">
              Book a Demo
            </a>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-3xl border border-slate-700/50"
          >
            <h3 className="text-xl font-medium text-slate-300 mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">Custom</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Unlimited beds & staff', 'Multi-facility management', 'Dedicated compliance officer', 'White-label patient portal', 'Custom API integrations'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-slate-500" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:sales@sunriseos.com" className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-center rounded-xl font-medium transition-colors">
              Contact Sales
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
