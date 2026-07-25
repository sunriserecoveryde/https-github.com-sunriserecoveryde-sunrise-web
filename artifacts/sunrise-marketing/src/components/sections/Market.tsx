import { motion } from 'framer-motion';
import { CountUp } from '@/components/ui/count-up';
import { ArrowRight } from 'lucide-react';

export function Market() {
  return (
    <section id="market" className="py-24 bg-gradient-to-b from-[#0A1020] to-[#0F1A30] border-y border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-bold tracking-widest text-accent uppercase mb-3"
          >
            Market Opportunity
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            A Vast, Underserved Sector
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center p-8 bg-card/50 rounded-2xl border border-border"
          >
            <div className="text-5xl md:text-6xl text-white mb-4">
              <CountUp end={17400} />
            </div>
            <div className="text-lg font-medium text-muted-foreground">Licensed SUD Facilities in the US</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center text-center p-8 bg-card/50 rounded-2xl border border-primary/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/5" />
            <div className="text-5xl md:text-6xl text-primary mb-4 relative z-10">
              <CountUp end={4.2} prefix="$" suffix="B" decimals={1} />
            </div>
            <div className="text-lg font-medium text-primary-foreground/80 relative z-10">Behavioral Health Software Market</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center text-center p-8 bg-card/50 rounded-2xl border border-border"
          >
            <div className="text-5xl md:text-6xl text-white mb-4">
              <CountUp end={5} />-<CountUp end={8} />
            </div>
            <div className="text-lg font-medium text-muted-foreground">Disconnected Systems per Facility</div>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h4 className="text-xl font-semibold mb-8 text-center">Platform Expansion Path</h4>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 -translate-y-1/2" />
            
            {['SUD Residential', 'Dual Diagnosis', 'Mental Health', 'Broader BH'].map((step, i) => (
              <motion.div 
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center md:flex-col gap-4 w-full md:w-auto"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#0F1A30] shadow-xl ${i === 0 ? 'bg-primary text-white' : 'bg-card text-muted-foreground'}`}>
                  {i + 1}
                </div>
                <div className={`font-medium ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step}
                </div>
                {i < 3 && <ArrowRight className="md:hidden text-muted-foreground ml-auto" />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
