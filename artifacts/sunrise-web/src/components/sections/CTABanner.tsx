import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { DemoModal } from '../DemoModal';

export const CTABanner = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <section className="py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#080E1C]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sunrise-orange/6 rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(71,85,105,0.12) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="container mx-auto px-5 md:px-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5">
              Ready to start?
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.05]">
              A new day for behavioral healthcare starts here.
            </h2>
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
              See Sunrise OS live in 30 minutes. We'll walk through your facility's workflow and show you exactly what changes on day one.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setDemoOpen(true)}
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-4 text-base font-bold text-white bg-sunrise-orange hover:bg-orange-500 rounded-xl transition-all shadow-[0_0_48px_rgba(249,115,22,0.3)] hover:shadow-[0_0_64px_rgba(249,115,22,0.45)] group"
              >
                Book a Free Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="/sunrise-pitch/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-4 text-base font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-xl transition-colors border border-slate-700/60"
              >
                <Play className="w-4 h-4 text-slate-500" />
                View Pitch Deck
              </a>
            </div>

            <p className="mt-8 text-sm text-slate-600">
              Or email us directly:{' '}
              <a href="mailto:hello@getsunriseos.com" className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
                hello@getsunriseos.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
};
