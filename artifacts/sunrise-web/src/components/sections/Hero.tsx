import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Activity, Clock, FileText, ShieldCheck, LayoutTemplate } from 'lucide-react';
import logoImg from '@assets/SunriseOS_Logo_transparent.png';
import { DemoModal } from '../DemoModal';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
});

const socialProof = [
  { value: '90 min', label: 'saved per shift' },
  { value: '40%→8%', label: 'documentation time' },
  { value: '$150', label: 'per bed / month' },
];

export const Hero = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <section id="hero" className="relative min-h-[100dvh] flex items-center pt-28 pb-20 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-sunrise-orange/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/4 rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(71,85,105,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="container mx-auto px-5 md:px-10 relative z-10">
          <div className="max-w-4xl mx-auto text-center">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center mb-10"
            >
              <img
                src={logoImg}
                alt="Sunrise OS"
                width={320}
                height={320}
                className="w-64 md:w-80 h-auto"
                style={{ filter: 'drop-shadow(0 8px 40px rgba(249,115,22,0.28))' }}
              />
            </motion.div>

            {/* Label */}
            <motion.div {...fadeUp(0.05)} className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/60 text-xs font-semibold text-slate-400 mb-8 tracking-widest uppercase">
              <span className="flex h-1.5 w-1.5 rounded-full bg-sunrise-orange animate-pulse" />
              Purpose-built for SUD treatment
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.1)}
              className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.03]"
            >
              The operating system<br className="hidden md:block" /> for{' '}
              <span className="text-gradient">treatment centers.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              {...fadeUp(0.18)}
              className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Sunrise OS replaces the five broken legacy tools your clinical staff uses every day — so they can focus on care, not compliance.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.26)}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
            >
              <button
                onClick={() => setDemoOpen(true)}
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 text-sm font-bold text-white bg-sunrise-orange hover:bg-orange-500 rounded-xl transition-all shadow-[0_0_32px_rgba(249,115,22,0.25)] hover:shadow-[0_0_48px_rgba(249,115,22,0.4)] group"
              >
                Book a Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="/sunrise-pitch/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-xl transition-colors border border-slate-700/60 group"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 transition-colors" />
                View Pitch Deck
              </a>
              <a
                href="/sunrise-video/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-xl transition-colors border border-slate-700/60 group"
              >
                <Play className="w-3.5 h-3.5 text-sunrise-orange group-hover:text-orange-400 transition-colors" />
                Watch Demo Video
              </a>
            </motion.div>

            {/* Social proof bar */}
            <motion.div
              {...fadeUp(0.32)}
              className="flex items-center justify-center gap-0 mb-20"
            >
              {socialProof.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="px-6 md:px-10 text-center">
                    <div className="text-2xl md:text-3xl font-black text-white tracking-tight">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
                  </div>
                  {i < socialProof.length - 1 && (
                    <div className="w-px h-10 bg-slate-800" />
                  )}
                </React.Fragment>
              ))}
            </motion.div>

            {/* App mockup */}
            <motion.div
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto max-w-5xl"
            >
              <div className="rounded-2xl overflow-hidden border border-slate-700/40 bg-[#080E1C] shadow-[0_48px_120px_rgba(0,0,0,0.7)]">
                {/* Window chrome */}
                <div className="h-10 border-b border-slate-800/80 flex items-center px-4 gap-4 bg-[#0B1220] shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/40 rounded-lg text-xs font-medium text-slate-400">
                    <Activity className="w-3 h-3 text-sunrise-teal" />
                    Sunrise OS — Live Census · Morning Shift
                  </div>
                  <div className="ml-auto flex items-center gap-2 px-2.5 py-1 bg-sunrise-orange/10 border border-sunrise-orange/20 rounded-lg text-xs font-semibold text-sunrise-orange">
                    <span className="w-1.5 h-1.5 rounded-full bg-sunrise-orange animate-pulse" />
                    2 Active Alerts
                  </div>
                </div>

                {/* Body */}
                <div className="flex" style={{ minHeight: '320px' }}>
                  {/* Sidebar */}
                  <div className="w-48 border-r border-slate-800/60 bg-[#060C18] p-3 space-y-1 shrink-0 hidden sm:block">
                    {['Census', 'Notes', 'MAR', 'CIWA/COWS', 'Billing', 'Reports'].map((item, i) => (
                      <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        i === 0
                          ? 'bg-sunrise-orange/12 text-sunrise-orange border border-sunrise-orange/20'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-sunrise-orange' : 'bg-slate-700'}`} />
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-5 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending Meds', value: '12', color: 'text-yellow-400' },
                        { icon: <FileText className="w-3.5 h-3.5" />, label: 'Unsigned Notes', value: '4', color: 'text-slate-300' },
                        { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Active Detox', value: '8', color: 'text-sunrise-teal' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-slate-800/30 rounded-xl border border-slate-700/40 p-3.5 flex flex-col justify-between gap-2">
                          <div className={`flex items-center gap-1.5 text-[10px] text-slate-500 ${stat.color}`}>
                            {stat.icon}
                            <span className="text-slate-500">{stat.label}</span>
                          </div>
                          <div className="text-2xl font-black text-white">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Patient list */}
                    <div className="bg-slate-800/20 rounded-xl border border-slate-700/30 overflow-hidden">
                      <div className="grid grid-cols-4 px-4 py-2 border-b border-slate-800/60 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                        <span>Patient</span>
                        <span>Room</span>
                        <span>Status</span>
                        <span>Alert</span>
                      </div>
                      {[
                        { name: 'Alex R.', room: 'Bed 3A', status: 'Detox Day 2', alert: 'CIWA Alert', alertColor: 'text-sunrise-orange bg-sunrise-orange/10 border-sunrise-orange/30' },
                        { name: 'Maria T.', room: 'Bed 1B', status: 'Residential', alert: 'Stable', alertColor: 'text-green-400 bg-green-400/8 border-green-400/20' },
                        { name: 'James K.', room: 'Bed 2A', status: 'Detox Day 4', alert: 'Med Due', alertColor: 'text-yellow-400 bg-yellow-400/8 border-yellow-400/20' },
                        { name: 'Donna W.', room: 'Bed 4C', status: 'PHP', alert: 'Stable', alertColor: 'text-green-400 bg-green-400/8 border-green-400/20' },
                      ].map((p, i) => (
                        <div key={i} className="grid grid-cols-4 px-4 py-2.5 border-b border-slate-800/30 last:border-0 items-center hover:bg-slate-800/20 transition-colors">
                          <span className="text-xs font-semibold text-white">{p.name}</span>
                          <span className="text-xs text-slate-500">{p.room}</span>
                          <span className="text-xs text-slate-400">{p.status}</span>
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border w-fit ${p.alertColor}`}>
                            {p.alert}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0B1120] to-transparent pointer-events-none rounded-b-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
};
