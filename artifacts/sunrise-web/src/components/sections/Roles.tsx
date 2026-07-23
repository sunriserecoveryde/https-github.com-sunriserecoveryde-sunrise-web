import React from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, HeartPulse, FileBadge, UserCircle, BriefcaseMedical } from 'lucide-react';

const roles = [
  {
    title: "Primary Counselors",
    icon: <Users className="w-6 h-6" />,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    features: ["One-click group notes", "AI-assisted individual sessions", "Automated treatment plan reminders"]
  },
  {
    title: "Nurses",
    icon: <HeartPulse className="w-6 h-6" />,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    features: ["Digital CIWA/COWS scoring", "Automated MAR workflows", "Instant provider alerts"]
  },
  {
    title: "Clinical Supervisors",
    icon: <FileBadge className="w-6 h-6" />,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    features: ["Mass chart sign-offs", "Compliance dashboards", "Staff utilization metrics"]
  },
  {
    title: "Physicians",
    icon: <Stethoscope className="w-6 h-6" />,
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    border: "border-teal-400/20",
    features: ["Streamlined order entry", "Remote detox monitoring", "H&P templates"]
  },
  {
    title: "Case Managers",
    icon: <UserCircle className="w-6 h-6" />,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    features: ["Discharge planning tracking", "FMLA/Disability document gen", "Alumni coordination"]
  },
  {
    title: "Billing Staff",
    icon: <BriefcaseMedical className="w-6 h-6" />,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    features: ["Pre-scrubbed claims", "Missing documentation alerts", "UR review summaries"]
  }
];

export const Roles = () => {
  return (
    <section id="roles" className="py-24 bg-[#0A0F1C] border-y border-slate-800">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            A single system for the <span className="text-sunrise-orange">entire facility.</span>
          </h2>
          <p className="text-lg text-slate-400">
            Stop buying disjointed software for different departments. Sunrise OS gives every role a purpose-built view of the same single source of truth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`p-6 rounded-2xl bg-[#0F172A] border ${role.border} hover:bg-slate-800/50 transition-colors group`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.bg} ${role.color} mb-6 group-hover:scale-110 transition-transform`}>
                {role.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{role.title}</h3>
              <ul className="space-y-3">
                {role.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${role.bg.replace('/10', '')} shrink-0`}></div>
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
