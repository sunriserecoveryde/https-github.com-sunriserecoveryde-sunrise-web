import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'wouter';

interface HeroSectionProps {
  headline: string | ReactNode;
  subheadline: string | ReactNode;
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  align?: 'left' | 'center';
  children?: ReactNode;
  minHeight?: string;
}

export function HeroSection({
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  align = 'center',
  children,
  minHeight = 'min-h-[70vh]'
}: HeroSectionProps) {
  const isCentered = align === 'center';
  
  return (
    <section className={`relative flex items-center justify-center overflow-hidden ${minHeight} py-20`}>
      {/* Abstract Sunrise Motif Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-end justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 w-full h-[30vh] bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
      </div>

      <div className={`container mx-auto px-4 z-10 relative ${isCentered ? 'text-center' : 'text-left'}`}>
        <div className={`max-w-4xl ${isCentered ? 'mx-auto' : ''}`}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight mb-6 leading-tight"
          >
            {headline}
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed font-light"
          >
            {subheadline}
          </motion.div>
          
          {(primaryCta || secondaryCta) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
              className={`flex flex-col sm:flex-row gap-4 ${isCentered ? 'justify-center' : ''}`}
            >
              {primaryCta && (
                <Link href={primaryCta.href} className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                  {primaryCta.text}
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href} className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  {secondaryCta.text}
                </Link>
              )}
            </motion.div>
          )}

          {children && (
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
              className="mt-16"
             >
               {children}
             </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
