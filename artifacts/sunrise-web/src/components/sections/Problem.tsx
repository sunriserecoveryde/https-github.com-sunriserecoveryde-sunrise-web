import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Database, FileX } from 'lucide-react';

export const Problem = () => {
  return (
    <section id="problem" className="py-24 bg-[#0A0F1C] border-y border-slate-800">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Healthcare's <span className="text-red-400">Broken</span> Status Quo
          </h2>
          <p className="text-lg text-slate-400">
            Right now, your clinical staff is spending 40% of their shift fighting software instead of treating patients. 
            The behavioral health stack is a mess of patched-together legacy systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Clock className="w-8 h-8 text-red-400" />,
              title: "40% Time Wasted",
              desc: "Clinicians spend nearly half their shift on redundant documentation across multiple systems.",
              delay: 0.1
            },
            {
              icon: <Database className="w-8 h-8 text-orange-400" />,
              title: "Data Silos",
              desc: "Kipu for EHR, Excel for census, separate tools for scheduling. Nothing talks to each other.",
              delay: 0.2
            },
            {
              icon: <FileX className="w-8 h-8 text-amber-400" />,
              title: "Paper Binders",
              desc: "Despite paying thousands for an EHR, staff still rely on physical clipboards for daily workflows.",
              delay: 0.3
            },
            {
              icon: <AlertTriangle className="w-8 h-8 text-rose-400" />,
              title: "Compliance Risk",
              desc: "Missing signatures, late notes, and disconnected treatment plans lead to clawbacks.",
              delay: 0.4
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: item.delay }}
              className="bg-[#0F172A] p-8 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="mb-6 p-4 bg-slate-800/50 rounded-xl inline-block">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-2xl font-medium text-slate-300">
            We built Sunrise OS to replace <span className="line-through text-slate-500 mr-2">Kipu</span>
            <span className="line-through text-slate-500 mr-2">BestNotes</span>
            <span className="line-through text-slate-500">Valant</span>.
          </p>
        </div>
      </div>
    </section>
  );
};
