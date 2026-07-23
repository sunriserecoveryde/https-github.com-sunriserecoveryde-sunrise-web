import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    price: '$1,500',
    sub: 'Up to 10 beds · billed annually',
    highlight: false,
    badge: null,
    cta: { label: 'Get Started', href: 'mailto:hello@getsunriseos.com' },
    features: [
      'Up to 10 beds',
      'Unlimited clinical staff logins',
      'Core EHR & census management',
      'Shift handoff & progress notes',
      'Sunrise Staff mobile app',
      'Standard onboarding support',
    ],
  },
  {
    name: 'Growth',
    price: '$6,000',
    sub: 'Up to 40 beds · billed annually',
    highlight: true,
    badge: 'Most Popular',
    cta: { label: 'Book a Demo', href: 'mailto:demo@getsunriseos.com' },
    features: [
      'Up to 40 beds',
      'Unlimited clinical staff logins',
      'AI Note Generation Engine',
      'CIWA / COWS digital scoring',
      'Compliance & billing dashboards',
      'Priority support & CSM',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    sub: '75+ beds · volume discounts',
    highlight: false,
    badge: null,
    cta: { label: 'Contact Sales', href: 'mailto:sales@getsunriseos.com' },
    features: [
      'Unlimited beds & staff',
      'Multi-facility management',
      'Dedicated compliance officer',
      'White-label patient portal',
      'Custom API & EHR integrations',
    ],
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-28">
      <div className="container mx-auto px-5 md:px-10">

        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5"
          >
            Pricing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-black text-white mb-4 leading-[1.08]"
          >
            Transparent, per-bed pricing.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            $150 per bed per month, billed annually. No per-user fees. No surprise implementation charges. You pay for the capacity of your facility.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl p-8 border transition-all ${
                tier.highlight
                  ? 'bg-[#0B1220] border-sunrise-orange/50 shadow-[0_0_60px_rgba(249,115,22,0.1)]'
                  : 'bg-[#0B1220] border-slate-800 hover:border-slate-700'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sunrise-orange text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-lg">
                  {tier.badge}
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${tier.highlight ? 'text-sunrise-orange' : 'text-slate-500'}`}>
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-white tracking-tight">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-slate-500 text-sm">/mo</span>}
                </div>
                <div className="text-slate-600 text-xs">{tier.sub}</div>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {tier.features.map((f, j) => (
                  <li key={j} className={`flex items-center gap-3 text-sm ${tier.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
                    <Check className={`w-4 h-4 shrink-0 ${tier.highlight ? 'text-sunrise-orange' : 'text-slate-700'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={tier.cta.href}
                className={`flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all ${
                  tier.highlight
                    ? 'bg-sunrise-orange hover:bg-orange-500 text-white shadow-[0_0_24px_rgba(249,115,22,0.25)] hover:shadow-[0_0_36px_rgba(249,115,22,0.4)]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {tier.cta.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center text-slate-600 text-sm"
        >
          All plans include Sunrise Staff mobile, shift exports, and onboarding support.{' '}
          <a href="mailto:sales@getsunriseos.com" className="text-sunrise-orange hover:text-orange-400 transition-colors">
            Talk to sales
          </a>{' '}
          for a custom quote.
        </motion.p>
      </div>
    </section>
  );
};
