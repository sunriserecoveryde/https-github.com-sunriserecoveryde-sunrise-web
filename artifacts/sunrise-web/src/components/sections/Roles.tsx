import React from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, HeartPulse, FileBadge, UserCircle, BriefcaseMedical } from 'lucide-react';

const roles = [
  {
    title: 'Primary Counselors',
    icon: <Users className="w-5 h-5" />,
    color: 'from-orange-500/20 to-orange-500/5',
    features: [
      'One-click group notes for every participant',
      'AI-assisted individual session documentation',
      'Automated treatment plan reminders',
    ],
  },
  {
    title: 'Nurses',
    icon: <HeartPulse className="w-5 h-5" />,
    color: 'from-rose-500/20 to-rose-500/5',
    features: [
      'Digital CIWA / COWS scoring at the bedside',
      'Automated MAR workflows with override alerts',
      'Instant MD notification on threshold breach',
    ],
  },
  {
    title: 'Clinical Supervisors',
    icon: <FileBadge className="w-5 h-5" />,
    color: 'from-blue-500/20 to-blue-500/5',
    features: [
      'Mass chart co-sign in one click',
      'Compliance dashboard with denial risk flags',
      'Staff utilization and productivity metrics',
    ],
  },
  {
    title: 'Physicians',
    icon: <Stethoscope className="w-5 h-5" />,
    color: 'from-teal-500/20 to-teal-500/5',
    features: [
      'Streamlined order entry and countersign',
      'Remote detox monitoring via mobile',
      'H&P templates mapped to ASAM criteria',
    ],
  },
  {
    title: 'Case Managers',
    icon: <UserCircle className="w-5 h-5" />,
    color: 'from-purple-500/20 to-purple-500/5',
    features: [
      'Discharge planning with tracked milestones',
      'FMLA / disability document generation',
      'Alumni coordination and follow-up tracking',
    ],
  },
  {
    title: 'Billing Staff',
    icon: <BriefcaseMedical className="w-5 h-5" />,
    color: 'from-amber-500/20 to-amber-500/5',
    features: [
      'Pre-scrubbed claims before submission',
      'Missing documentation alerts in real time',
      'Utilization review summaries for payers',
    ],
  },
];

export const Roles = () => {
  return (
    <section id="roles" className="py-28 bg-[#080E1C] border-y border-slate-800/50">
      <div className="container mx-auto px-5 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-[0.2em] uppercase text-sunrise-orange mb-5"
          >
            For Every Role
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-black text-white mb-5 leading-[1.08]"
          >
            One platform for the entire facility.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Stop buying disjointed tools for each department. Every role gets a purpose-built view of the same single source of truth.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="group p-6 rounded-2xl bg-[#0B1220] border border-slate-800 hover:border-slate-700 transition-all hover:bg-[#0E1628]"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${role.color} text-white mb-5 border border-white/5 group-hover:scale-105 transition-transform`}>
                {role.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-3">{role.title}</h3>
              <ul className="space-y-2.5">
                {role.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-slate-500">
                    <div className="mt-2 w-1 h-1 rounded-full bg-sunrise-orange/50 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
