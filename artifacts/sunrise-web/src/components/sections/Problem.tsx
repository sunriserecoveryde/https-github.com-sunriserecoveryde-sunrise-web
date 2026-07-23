import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Database, FileX, TrendingDown } from 'lucide-react';

const problems = [
  {
    icon: <Clock className="w-6 h-6" />,
    title: '40% of Every Shift Wasted',
    desc: 'Clinicians spend nearly half their shift on redundant documentation across multiple disconnected systems.',
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: 'Five Tools, Zero Integration',
    desc: 'Kipu for EHR, Excel for census, separate scheduling, clipboards for vitals. Nothing talks to each other.',
  },
  {
    icon: <FileX className="w-6 h-6" />,
    title: 'Paper Still Everywhere',
    desc: "Despite paying thousands per month for an EHR, staff still rely on physical clipboards for daily workflows.",
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: '15% Insurance Denial Rate',
    desc: 'Missing signatures, late notes, and disconnected treatment plans create direct clawback exposure on every claim.',
  },
];

export const Problem = () => {
  return (
    <section id="problem" className="py-28 bg-[#080E1C] border-y border-slate-800/50">
      <div className="container mx-auto px-5 md:px-10">

        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5"
          >
            The Problem
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-black text-white mb-5 leading-[1.08]"
          >
            The behavioral health stack is broken.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Your clinical staff is spending 40% of their shift fighting software instead of treating patients.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {problems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group relative bg-[#0B1220] p-7 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all hover:bg-[#0E1628]"
            >
              <div className="mb-5 p-3 bg-slate-800/60 rounded-xl inline-block text-slate-400 group-hover:text-sunrise-orange group-hover:bg-sunrise-orange/10 transition-all">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-2.5 leading-snug">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-16 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12"
        >
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-1">42%</div>
            <div className="text-xs text-slate-500 font-medium">Annual counselor turnover</div>
          </div>
          <div className="w-px h-10 bg-slate-800 hidden md:block" />
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-1">$4,200</div>
            <div className="text-xs text-slate-500 font-medium">Revenue leakage per bed per year</div>
          </div>
          <div className="w-px h-10 bg-slate-800 hidden md:block" />
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-1">70%</div>
            <div className="text-xs text-slate-500 font-medium">Of sentinel events are documentation failures</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="mt-16 text-center"
        >
          <p className="text-lg font-medium text-slate-400">
            We built Sunrise OS to replace{' '}
            <span className="line-through text-slate-700 decoration-slate-600">Kipu</span>{' '}
            <span className="line-through text-slate-700 decoration-slate-600">BestNotes</span>{' '}
            <span className="line-through text-slate-700 decoration-slate-600">Valant</span>{' '}
            — for good.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
