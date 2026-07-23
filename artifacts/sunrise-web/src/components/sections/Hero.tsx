import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Activity, Clock, FileText } from 'lucide-react';
import logoImg from '@assets/SunriseOS_Logo_transparent.png';

export const Hero = () => {
  return (
    <section id="hero" className="relative min-h-[100dvh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sunrise-orange/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sunrise-blue/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Featured logo — hero centerpiece */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-10"
          >
            <motion.img
              src={logoImg}
              alt="Sunrise OS"
              className="w-72 md:w-96 h-auto drop-shadow-[0_0_60px_rgba(249,115,22,0.45)]"
              animate={{ filter: ['drop-shadow(0 0 40px rgba(249,115,22,0.35))', 'drop-shadow(0 0 70px rgba(249,115,22,0.6))', 'drop-shadow(0 0 40px rgba(249,115,22,0.35))'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-sm font-medium text-slate-300 mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-sunrise-orange"></span>
            A new day for behavioral healthcare
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
          >
            The operating system for <br className="hidden md:block" />
            <span className="text-gradient">treatment centers.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Sunrise OS gives your clinical staff a single platform to replace the 5 broken legacy tools they use every day. Save 90 minutes per clinician per shift, and finally focus on care instead of compliance.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="mailto:demo@sunriseos.com" 
              className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-sunrise-orange hover:bg-orange-500 rounded-full transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] group"
            >
              Book a Demo
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#investors" 
              className="flex items-center justify-center w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors border border-slate-700 backdrop-blur-sm"
            >
              Download Pitch Deck
              <Download className="w-5 h-5 ml-2 text-slate-400" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            {/* Abstract UI representation */}
            <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-[#0A0F1C]/80 shadow-2xl backdrop-blur-xl aspect-video relative flex flex-col">
              {/* Header */}
              <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-4 bg-[#0F172A]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-md text-xs font-medium text-slate-400">
                  <Activity className="w-3 h-3 text-sunrise-teal" />
                  Live Census
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 p-6 grid grid-cols-12 gap-6">
                <div className="col-span-3 space-y-4">
                  <div className="h-8 bg-slate-800/50 rounded-md w-full"></div>
                  <div className="h-8 bg-slate-800/50 rounded-md w-3/4"></div>
                  <div className="h-8 bg-slate-800/50 rounded-md w-5/6"></div>
                  <div className="h-8 bg-slate-800/50 rounded-md w-full"></div>
                  <div className="h-8 bg-sunrise-orange/20 border border-sunrise-orange/30 text-sunrise-orange flex items-center px-3 rounded-md w-full text-xs font-semibold">
                    Alex R. — CIWA Alert
                  </div>
                </div>
                <div className="col-span-9 space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="h-24 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex flex-col justify-between">
                      <div className="flex items-center text-slate-400 gap-2 text-sm"><Clock className="w-4 h-4"/> Pending Meds</div>
                      <div className="text-2xl font-bold text-white">12</div>
                    </div>
                    <div className="h-24 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex flex-col justify-between">
                      <div className="flex items-center text-slate-400 gap-2 text-sm"><FileText className="w-4 h-4"/> Draft Notes</div>
                      <div className="text-2xl font-bold text-white">4</div>
                    </div>
                    <div className="h-24 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex flex-col justify-between">
                      <div className="flex items-center text-slate-400 gap-2 text-sm"><Activity className="w-4 h-4"/> Active Detux</div>
                      <div className="text-2xl font-bold text-white">8</div>
                    </div>
                  </div>
                  <div className="h-48 bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                    <div className="h-4 w-1/4 bg-slate-700 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-slate-800 rounded"></div>
                      <div className="h-2 w-full bg-slate-800 rounded"></div>
                      <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative floaters */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-12 top-20 glass-card p-4 rounded-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Note Generated</div>
                <div className="text-xs text-slate-400">in 2.4 seconds</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
