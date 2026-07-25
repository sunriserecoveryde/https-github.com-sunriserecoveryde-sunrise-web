import { motion } from 'framer-motion';
import { Stethoscope, Pill, Bed, Activity, DollarSign, Smartphone } from 'lucide-react';

const pillars = [
  {
    title: 'Clinical Documentation',
    description: 'Streamlined notes with intelligent macros, treatment planning, and multi-signature workflows.',
    icon: Stethoscope,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    title: 'Nursing & MAR',
    description: 'Electronic medication administration records natively tied to the EHR and lab results.',
    icon: Pill,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10'
  },
  {
    title: 'Bed & Census',
    description: 'Real-time facility mapping, waitlists, and occupancy tracking to maximize utilization.',
    icon: Bed,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10'
  },
  {
    title: 'Risk & AI Alerts',
    description: 'Predictive modeling flags early signs of withdrawal, elopement risk, or vital instability.',
    icon: Activity,
    color: 'text-rose-400',
    bg: 'bg-rose-400/10'
  },
  {
    title: 'Operations & Billing',
    description: 'Automated claim generation tied directly to clinician sign-offs, reducing days in A/R.',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    title: 'Mobile Staff App',
    description: 'Secure shift communication, bedside vitals entry, and incident reporting on the go.',
    icon: Smartphone,
    color: 'text-primary',
    bg: 'bg-primary/10'
  }
];

export function Platform() {
  return (
    <section id="platform" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-bold tracking-widest text-primary uppercase mb-3"
          >
            The Sunrise Platform
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            One Unified Architecture
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                <pillar.icon className={`w-32 h-32 ${pillar.color}`} />
              </div>
              <div className={`w-12 h-12 rounded-lg ${pillar.bg} flex items-center justify-center mb-6`}>
                <pillar.icon className={`w-6 h-6 ${pillar.color}`} />
              </div>
              <h4 className="text-xl font-bold mb-3">{pillar.title}</h4>
              <p className="text-muted-foreground leading-relaxed relative z-10">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
