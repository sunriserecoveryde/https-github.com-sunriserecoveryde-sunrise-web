import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function Invest() {
  return (
    <section id="invest" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-secondary/10 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            >
              The Investment Case
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground mb-8"
            >
              SunriseOS represents a highly retentive, mission-critical workflow tool in a space seeing unprecedented regulatory tailwinds. 
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card/50 border border-border p-6 rounded-xl mb-8"
            >
              <h4 className="font-semibold text-xl mb-3 text-white">Why Now?</h4>
              <p className="text-muted-foreground leading-relaxed">
                The CARES Act and mental health parity regulations mandate stricter compliance, outcome reporting, and data interoperability. Legacy systems cannot adapt to these new federal requirements. Facilities must modernize or lose reimbursements.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold text-lg mb-4 text-white">Core Retention Drivers</h4>
              <ul className="space-y-3">
                {[
                  'Deeply embedded in daily clinical workflows',
                  'High switching costs for historical EHR data',
                  'Staff training creates natural moats',
                  'Integrated billing ensures predictable cashflow'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="space-y-4">
            {[
              {
                tier: 'Core Platform',
                desc: 'Full clinical & operational suite',
                price: '$1,800/bed/yr',
                highlight: true
              },
              {
                tier: 'AI Analytics Module',
                desc: 'Add-on predictive risk modeling & documentation assist',
                price: '+$400/bed/yr',
                highlight: false
              },
              {
                tier: 'Enterprise API Tier',
                desc: 'Custom health system interoperability & SLAs',
                price: 'Custom Pricing',
                highlight: false
              }
            ].map((tier, i) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15 }}
                className={`p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  tier.highlight ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
                }`}
              >
                <div>
                  <h4 className={`text-xl font-bold mb-1 ${tier.highlight ? 'text-primary' : 'text-white'}`}>{tier.tier}</h4>
                  <p className="text-sm text-muted-foreground">{tier.desc}</p>
                </div>
                <div className={`text-lg font-mono whitespace-nowrap ${tier.highlight ? 'text-white' : 'text-muted-foreground'}`}>
                  {tier.price}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
