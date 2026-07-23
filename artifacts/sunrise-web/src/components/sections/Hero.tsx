import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Activity, Clock, FileText } from 'lucide-react';
import logoImg from '@assets/SunriseOS_Logo_transparent.png';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

export const Hero = () => {
  return (
    <section id="hero" className="relative min-h-[100dvh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Subtle single-tone background gradient — no garish orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(249,115,22,0.07),transparent)] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">

          {/* Featured logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-10"
          >
            <img
              src={logoImg}
              alt="Sunrise OS"
              className="w-72 md:w-[22rem] h-auto"
              style={{ filter: 'drop-shadow(0 8px 32px rgba(249,115,22,0.22))' }}
            />
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-sm font-medium text-slate-400 mb-8 tracking-wide">
            <span className="flex h-1.5 w-1.5 rounded-full bg-sunrise-orange"></span>
            A new day for behavioral healthcare
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.05]"
          >
            The operating system for{' '}
            <br className="hidden md:block" />
            <span className="text-gradient">treatment centers.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.18)}
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Sunrise OS gives your clinical staff a single platform to replace the five broken legacy tools they use every day. Save 90 minutes per clinician per shift — and finally focus on care instead of compliance.
          </motion.p>

          <motion.div
            {...fadeUp(0.24)}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="mailto:demo@sunriseos.com"
              className="flex items-center justify-center w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-sunrise-orange hover:bg-orange-500 rounded-lg transition-all group"
            >
              Book a Demo
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="/sunrise-pitch/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700"
            >
              View Pitch Deck
              <Download className="w-4 h-4 ml-2 text-slate-500" />
            </a>
          </motion.div>

          {/* App mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-[#0A0F1C] shadow-[0_32px_80px_rgba(0,0,0,0.6)] aspect-video relative flex flex-col">
              {/* Window chrome */}
              <div className="h-10 border-b border-slate-800 flex items-center px-4 gap-4 bg-[#0F172A] shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded text-xs font-medium text-slate-400">
                  <Activity className="w-3 h-3 text-sunrise-teal" />
                  Live Census — Morning Shift
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 p-5 grid grid-cols-12 gap-5">
                <div className="col-span-3 space-y-3">
                  <div className="h-7 bg-slate-800/50 rounded w-full"></div>
                  <div className="h-7 bg-slate-800/50 rounded w-3/4"></div>
                  <div className="h-7 bg-slate-800/50 rounded w-5/6"></div>
                  <div className="h-7 bg-slate-800/50 rounded w-full"></div>
                  <div className="h-7 bg-sunrise-orange/15 border border-sunrise-orange/25 text-sunrise-orange flex items-center px-3 rounded w-full text-xs font-semibold">
                    Alex R. — CIWA Alert
                  </div>
                </div>
                <div className="col-span-9 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending Meds', value: '12' },
                      { icon: <FileText className="w-3.5 h-3.5" />, label: 'Draft Notes', value: '4' },
                      { icon: <Activity className="w-3.5 h-3.5" />, label: 'Active Detox', value: '8' },
                    ].map((stat, i) => (
                      <div key={i} className="h-20 bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 flex flex-col justify-between">
                        <div className="flex items-center text-slate-500 gap-1.5 text-xs">{stat.icon} {stat.label}</div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-40 bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                    <div className="h-3 w-1/4 bg-slate-700 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-slate-800 rounded"></div>
                      <div className="h-2 w-full bg-slate-800 rounded"></div>
                      <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom edge fade — grounds the mockup */}
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#0F172A] to-transparent pointer-events-none rounded-b-xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
