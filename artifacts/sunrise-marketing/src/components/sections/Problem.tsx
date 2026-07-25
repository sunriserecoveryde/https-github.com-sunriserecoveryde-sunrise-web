import { motion } from 'framer-motion';
import { Database, FileText, Calendar, Users, Shield, FlaskConical, Link2Off } from 'lucide-react';

const legacySystems = [
  { name: 'EHR', icon: FileText },
  { name: 'Billing', icon: Database },
  { name: 'Scheduling', icon: Calendar },
  { name: 'HR/Payroll', icon: Users },
  { name: 'Compliance', icon: Shield },
  { name: 'Lab/Rx', icon: FlaskConical },
];

export function Problem() {
  return (
    <section id="problem" className="py-24 bg-[#0A1020]/50 relative border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Behavioral Health Runs on <br className="hidden sm:block" />
            <span className="text-destructive">Digital Duct Tape.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            The average facility patches together separate tools that don't communicate. This causes data silos, billing leaks, and life-threatening clinical blind spots.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto relative">
          {legacySystems.map((sys, idx) => (
            <motion.div
              key={sys.name}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-destructive/20 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-destructive/40 transition-colors"
            >
              <sys.icon className="w-10 h-10 text-muted-foreground mb-4 group-hover:text-foreground transition-colors" />
              <h3 className="font-semibold text-lg">{sys.name}</h3>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
                <Link2Off className="w-3.5 h-3.5" />
                No connection
              </div>
            </motion.div>
          ))}
          
          {/* Visual separator/overlay for "Chaos" */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#0A1020]/20 to-[#0A1020]/80 -bottom-10" />
        </div>
      </div>
    </section>
  );
}
