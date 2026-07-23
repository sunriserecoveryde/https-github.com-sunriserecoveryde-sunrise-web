import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Bell, ClipboardList, HeartPulse, Wifi, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: <HeartPulse className="w-5 h-5 text-sunrise-orange" />,
    title: 'Bedside CIWA & COWS scoring',
    desc: 'Nurses complete withdrawal assessments directly at the bedside — no clipboard, no transcription.',
  },
  {
    icon: <Bell className="w-5 h-5 text-sunrise-orange" />,
    title: 'Real-time push alerts',
    desc: 'Score threshold breaches, overdue meds, and unsigned notes surface instantly — even with the screen locked.',
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-sunrise-orange" />,
    title: 'Shift handoff from anywhere',
    desc: 'Export a complete shift summary and send it to the oncoming team before you reach the nurses\' station.',
  },
  {
    icon: <Wifi className="w-5 h-5 text-sunrise-orange" />,
    title: 'Full census, always in your pocket',
    desc: 'Patient status, medication schedule, active orders, and flagged notes — the entire floor at a glance.',
  },
];

export const Mobile = () => {
  return (
    <section id="mobile" className="py-28 bg-[#0A0F1C] border-y border-slate-800/60 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Phone mockup — left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-start"
          >
            <div className="relative w-56">
              {/* Phone shell */}
              <div className="relative bg-[#0F172A] border-2 border-slate-700 rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden" style={{ aspectRatio: '9/19' }}>
                {/* Status bar */}
                <div className="bg-[#060B14] px-5 pt-3 pb-2 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-medium">9:41</span>
                  <div className="w-14 h-3 bg-[#0F172A] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                  <div className="flex gap-1 items-center">
                    <div className="w-3 h-1.5 border border-slate-500 rounded-sm relative">
                      <div className="absolute inset-0.5 bg-green-400 rounded-sm w-2/3" />
                    </div>
                  </div>
                </div>

                {/* App header */}
                <div className="bg-[#0F172A] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-white">Sunrise<span className="text-[#2563EB]">OS</span></span>
                  <div className="relative">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sunrise-orange" />
                  </div>
                </div>

                {/* Patient card */}
                <div className="px-3 pt-3 space-y-2">
                  <div className="text-[9px] font-semibold tracking-[0.15em] uppercase text-slate-500 px-1">Morning Census</div>

                  {[
                    { name: 'Alex R.', status: 'CIWA Alert', statusColor: 'text-sunrise-orange', dot: 'bg-sunrise-orange' },
                    { name: 'Maria T.', status: 'Stable', statusColor: 'text-green-400', dot: 'bg-green-400' },
                    { name: 'James K.', status: 'Med Due', statusColor: 'text-yellow-400', dot: 'bg-yellow-400' },
                    { name: 'Donna W.', status: 'Stable', statusColor: 'text-green-400', dot: 'bg-green-400' },
                  ].map((p, i) => (
                    <div key={i} className="bg-slate-800/60 rounded-lg px-3 py-2 flex items-center justify-between border border-slate-700/40">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.dot} shrink-0`} />
                        <span className="text-[10px] font-medium text-white">{p.name}</span>
                      </div>
                      <span className={`text-[9px] font-semibold ${p.statusColor}`}>{p.status}</span>
                    </div>
                  ))}

                  {/* CIWA quick-score panel */}
                  <div className="mt-2 bg-sunrise-orange/10 border border-sunrise-orange/25 rounded-lg px-3 py-2.5">
                    <div className="text-[9px] font-semibold text-sunrise-orange mb-1.5 tracking-wide uppercase">Alex R. — CIWA Score</div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] text-slate-400">Tremor</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5,6,7].map(n => (
                          <div key={n} className={`w-2 h-2 rounded-sm ${n <= 4 ? 'bg-sunrise-orange' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] text-slate-400">Anxiety</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5,6,7].map(n => (
                          <div key={n} className={`w-2 h-2 rounded-sm ${n <= 5 ? 'bg-sunrise-orange' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400">Total</span>
                      <span className="text-[11px] font-extrabold text-sunrise-orange">18 — Moderate</span>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#0F172A] border-t border-slate-800 flex justify-around py-2 px-2">
                  {['Census', 'Notes', 'Meds', 'Alerts'].map((label, i) => (
                    <div key={i} className={`flex flex-col items-center gap-0.5 ${i === 0 ? 'text-sunrise-orange' : 'text-slate-600'}`}>
                      <div className="w-3.5 h-3.5 rounded-sm bg-current opacity-70" />
                      <span className="text-[7px] font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating alert badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-12 top-16 bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sunrise-orange shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-white">Score updated</div>
                    <div className="text-[9px] text-slate-500">CIWA · Alex R.</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Copy — right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sunrise-orange mb-5">Sunrise Staff — Mobile App</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              The full platform.<br />
              In every clinician's pocket.
            </h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              Sunrise Staff brings the entire Sunrise OS platform to iOS and Android. Nurses score patients at the bedside. Counselors close notes between sessions. Supervisors review alerts from anywhere in the facility — without returning to a desktop.
            </p>

            <ul className="space-y-6">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-0.5 bg-slate-800/80 border border-slate-700/60 p-2 rounded-lg shrink-0">{f.icon}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">{f.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
