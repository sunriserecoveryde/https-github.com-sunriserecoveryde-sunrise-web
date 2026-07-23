import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ClipboardList, HeartPulse, Wifi } from 'lucide-react';

const features = [
  {
    icon: <HeartPulse className="w-5 h-5 text-sunrise-orange" />,
    title: 'Bedside CIWA & COWS scoring',
    desc: 'Nurses complete withdrawal assessments at the bedside — no clipboard, no transcription errors.',
  },
  {
    icon: <Bell className="w-5 h-5 text-sunrise-orange" />,
    title: 'Real-time push alerts',
    desc: 'Score threshold breaches, overdue meds, and unsigned notes surface instantly — even with the screen locked.',
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-sunrise-orange" />,
    title: 'Shift handoff from anywhere',
    desc: "Export a complete shift summary and send it to the oncoming team before you reach the nurses' station.",
  },
  {
    icon: <Wifi className="w-5 h-5 text-sunrise-orange" />,
    title: 'Full census, always in your pocket',
    desc: 'Patient status, meds, active orders, and flagged notes — the entire floor at a glance.',
  },
];

export const Mobile = () => {
  return (
    <section id="mobile" className="py-28 overflow-hidden">
      <div className="container mx-auto px-5 md:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-start"
          >
            <div className="relative w-60">
              {/* Phone shell */}
              <div
                className="relative bg-[#0B1220] border-[2.5px] border-slate-700 rounded-[2.8rem] shadow-[0_40px_100px_rgba(0,0,0,0.75)] overflow-hidden"
                style={{ aspectRatio: '9/19.5' }}
              >
                {/* Dynamic island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#040810] rounded-full z-10" />

                {/* Status bar */}
                <div className="bg-[#040810] px-5 pt-8 pb-2 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-semibold">9:41</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-3.5 h-1.5 border border-slate-500 rounded-sm relative">
                      <div className="absolute inset-[1px] bg-green-400 rounded-[2px] w-3/4" />
                    </div>
                  </div>
                </div>

                {/* App header */}
                <div className="bg-[#0B1220] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[12px] font-black text-white">Sunrise<span className="text-sunrise-orange">OS</span></span>
                  <div className="relative">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sunrise-orange animate-pulse" />
                  </div>
                </div>

                {/* Content */}
                <div className="px-3 pt-3 space-y-1.5">
                  <div className="text-[8px] font-bold tracking-[0.15em] uppercase text-slate-600 px-1 pb-1">Morning Census</div>

                  {[
                    { name: 'Alex R.', status: 'CIWA Alert', dot: 'bg-sunrise-orange', badge: 'text-sunrise-orange bg-sunrise-orange/10 border-sunrise-orange/30' },
                    { name: 'Maria T.', status: 'Stable', dot: 'bg-green-400', badge: 'text-green-400 bg-green-400/8 border-green-400/20' },
                    { name: 'James K.', status: 'Med Due', dot: 'bg-yellow-400', badge: 'text-yellow-400 bg-yellow-400/8 border-yellow-400/20' },
                    { name: 'Donna W.', status: 'Stable', dot: 'bg-green-400', badge: 'text-green-400 bg-green-400/8 border-green-400/20' },
                  ].map((p, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-700/30">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.dot} shrink-0`} />
                        <span className="text-[10px] font-semibold text-white">{p.name}</span>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${p.badge}`}>{p.status}</span>
                    </div>
                  ))}

                  {/* CIWA score panel */}
                  <div className="mt-1 bg-sunrise-orange/8 border border-sunrise-orange/20 rounded-xl px-3 py-2.5">
                    <div className="text-[8px] font-bold text-sunrise-orange mb-2 tracking-widest uppercase">Alex R. — CIWA Score</div>
                    {[
                      { label: 'Tremor', score: 4 },
                      { label: 'Anxiety', score: 5 },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center mb-1.5">
                        <span className="text-[8px] text-slate-500">{row.label}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5,6,7].map(n => (
                            <div key={n} className={`w-2 h-2 rounded-sm ${n <= row.score ? 'bg-sunrise-orange' : 'bg-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1 border-t border-sunrise-orange/15 mt-1.5">
                      <span className="text-[8px] text-slate-500">Total</span>
                      <span className="text-[10px] font-black text-sunrise-orange">18 — Moderate</span>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#0B1220] border-t border-slate-800 flex justify-around py-2.5 px-2">
                  {['Census', 'Notes', 'Meds', 'Alerts'].map((label, i) => (
                    <div key={i} className={`flex flex-col items-center gap-0.5 ${i === 0 ? 'text-sunrise-orange' : 'text-slate-700'}`}>
                      <div className="w-3.5 h-3.5 rounded bg-current opacity-80" />
                      <span className="text-[6px] font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating alert */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-14 top-20 bg-[#0B1220] border border-slate-700 rounded-2xl px-3.5 py-2.5 shadow-2xl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-sunrise-orange animate-pulse shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Score updated</div>
                    <div className="text-[9px] text-slate-500">CIWA · Alex R.</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating co-sign badge */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -left-12 bottom-32 bg-[#0B1220] border border-green-500/30 rounded-2xl px-3.5 py-2.5 shadow-2xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Note signed</div>
                    <div className="text-[9px] text-green-500/70">Supervisor approved</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5">Sunrise Staff — Mobile App</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.06]">
              The full platform.<br />
              In every pocket.
            </h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              Sunrise Staff brings the entire Sunrise OS platform to iOS and Android. Nurses score patients at the bedside. Counselors close notes between sessions. Supervisors review alerts from anywhere in the facility — without returning to a desktop.
            </p>

            <ul className="space-y-6">
              {features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-0.5 bg-slate-800/80 border border-slate-700/50 p-2.5 rounded-xl shrink-0">{f.icon}</div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{f.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
