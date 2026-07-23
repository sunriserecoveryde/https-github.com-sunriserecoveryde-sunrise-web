import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Database, FileX } from 'lucide-react';

const problems = [
  {
    icon: <Clock className="w-6 h-6 text-sunrise-orange" />,
    title: "40% of Shift Wasted",
    desc: "Clinicians spend nearly half their shift on redundant documentation across multiple disconnected systems.",
    delay: 0.05
  },
  {
    icon: <Database className="w-6 h-6 text-sunrise-orange" />,
    title: "Fragmented Data",
    desc: "Kipu for EHR, Excel for census, separate tools for scheduling. Nothing talks to each other.",
    delay: 0.1
  },
  {
    icon: <FileX className="w-6 h-6 text-sunrise-orange" />,
    title: "Paper Still Everywhere",
    desc: "Despite paying thousands per month for an EHR, staff still rely on physical clipboards for daily workflows.",
    delay: 0.15
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-sunrise-orange" />,
    title: "Compliance Exposure",
    desc: "Missing signatures, late notes, and disconnected treatment plans create direct insurance clawback risk.",
    delay: 0.2
  }
];

export const Problem = () => {
  return (
    <section id="problem" className="py-28 bg-[#0A0F1C] border-y border-slate-800/60">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sunrise-orange mb-5">The Problem</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            The behavioral health stack is broken.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Your clinical staff is spending 40% of their shift fighting software instead of treating patients.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: item.delay }}
              className="bg-[#0F172A] p-7 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="mb-5 p-3 bg-sunrise-orange/8 rounded-lg inline-block">
                {item.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-xl font-medium text-slate-300">
            We built Sunrise OS to replace{' '}
            <span className="line-through text-slate-600">Kipu</span>{' '}
            <span className="line-through text-slate-600">BestNotes</span>{' '}
            <span className="line-through text-slate-600">Valant</span>.
          </p>
        </div>
      </div>
    </section>
  );
};
