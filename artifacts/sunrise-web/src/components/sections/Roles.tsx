import React from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, HeartPulse, FileBadge, UserCircle, BriefcaseMedical } from 'lucide-react';

const roles = [
  {
    title: "Primary Counselors",
    icon: <Users className="w-5 h-5" />,
    features: ["One-click group notes", "AI-assisted individual sessions", "Automated treatment plan reminders"]
  },
  {
    title: "Nurses",
    icon: <HeartPulse className="w-5 h-5" />,
    features: ["Digital CIWA/COWS scoring", "Automated MAR workflows", "Instant provider alerts"]
  },
  {
    title: "Clinical Supervisors",
    icon: <FileBadge className="w-5 h-5" />,
    features: ["Mass chart sign-offs", "Compliance dashboards", "Staff utilization metrics"]
  },
  {
    title: "Physicians",
    icon: <Stethoscope className="w-5 h-5" />,
    features: ["Streamlined order entry", "Remote detox monitoring", "H&P templates"]
  },
  {
    title: "Case Managers",
    icon: <UserCircle className="w-5 h-5" />,
    features: ["Discharge planning tracking", "FMLA/Disability document generation", "Alumni coordination"]
  },
  {
    title: "Billing Staff",
    icon: <BriefcaseMedical className="w-5 h-5" />,
    features: ["Pre-scrubbed claims", "Missing documentation alerts", "UR review summaries"]
  }
];

export const Roles = () => {
  return (
    <section id="roles" className="py-28 bg-[#0A0F1C] border-y border-slate-800/60">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sunrise-orange mb-5">For Every Role</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            One system for the entire facility.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Stop buying disjointed software for different departments. Every role gets a purpose-built view of the same single source of truth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-6 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sunrise-orange/10 text-sunrise-orange mb-5 group-hover:bg-sunrise-orange/15 transition-colors">
                {role.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-3">{role.title}</h3>
              <ul className="space-y-2.5">
                {role.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <div className="mt-2 w-1 h-1 rounded-full bg-sunrise-orange/60 shrink-0"></div>
                    {feature}
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
