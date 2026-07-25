import { Link } from 'wouter';
import { motion } from 'framer-motion';

export function CTABanner() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden bg-card border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-background to-accent/10 opacity-50" />
          
          <div className="relative z-10 p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
                Ready to Grow?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of individuals, clinicians, and organizations transforming behavioral health through education.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
              <Link href="/education" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto">
                Explore Resources
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors w-full sm:w-auto">
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
