import React from 'react';
import PageWrapper, { FadeIn, Reveal } from '@/components/animations';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function Governance() {
  return (
    <PageWrapper>
      <div className="relative pt-40 pb-32 bg-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${basePath}/attached_assets/generated_images/governance.jpg`}
            alt="Corporate governance"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>

        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            <Reveal>
              <h1 className="text-5xl md:text-7xl font-serif mb-6">Corporate Governance</h1>
            </Reveal>
            <FadeIn delay={0.2}>
              <p className="text-xl text-muted-foreground leading-relaxed">
                The Sunrise Grp. operates on a foundation of rigorous oversight, strict compliance, and centralized strategic leadership. Our governance model ensures that every subsidiary aligns with our enterprise-wide standards for clinical excellence and operational integrity.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>

      <div className="py-24 bg-card">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            <FadeIn delay={0.1} className="space-y-6">
              <div className="h-1 w-12 bg-primary"></div>
              <h3 className="text-2xl font-serif">Centralized Oversight</h3>
              <p className="text-muted-foreground leading-relaxed">
                While each subsidiary maintains operational autonomy, The Sunrise Grp. executive board provides centralized strategic direction, financial oversight, and compliance auditing. This hub-and-spoke model allows for rapid execution at the facility level while maintaining institutional risk controls.
              </p>
            </FadeIn>

            <FadeIn delay={0.2} className="space-y-6">
              <div className="h-1 w-12 bg-primary"></div>
              <h3 className="text-2xl font-serif">Clinical Compliance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our clinical operations are subject to redundant internal auditing, entirely separate from facility-level management. The Sunrise Grp. compliance committee ensures all facilities exceed Joint Commission standards and state-specific regulatory requirements.
              </p>
            </FadeIn>

            <FadeIn delay={0.3} className="space-y-6">
              <div className="h-1 w-12 bg-primary"></div>
              <h3 className="text-2xl font-serif">Data & Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Through our proprietary SunriseOS platform, the holding company maintains real-time visibility into operational metrics across the portfolio. Data governance is managed at the enterprise level, ensuring HIPAA compliance and robust cyber resilience.
              </p>
            </FadeIn>

          </div>
        </div>
      </div>

      <div className="py-24 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <Reveal>
            <h2 className="text-4xl font-serif mb-16 text-center">Organizational Structure</h2>
          </Reveal>

          <div className="max-w-4xl mx-auto">
            {/* Very simple structural visual */}
            <div className="flex flex-col items-center">
              <FadeIn className="w-64 py-4 px-6 bg-primary text-primary-foreground text-center rounded-sm font-medium tracking-wide shadow-lg border border-primary-foreground/10 z-10 relative">
                The Sunrise Grp., Inc.
                <div className="text-xs font-normal opacity-80 mt-1 uppercase tracking-widest">Holding Company</div>
              </FadeIn>
              
              <div className="w-px h-12 bg-border"></div>
              <div className="w-[80%] md:w-[90%] h-px bg-border"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full pt-8">
                {[
                  { name: "Sunrise Recovery", type: "Clinical", logo: null },
                  { name: "SunriseOS", type: "Technology", logo: `${basePath}/logo-sunriseos-official.png` },
                  { name: "Grow Motivational", type: "Education", logo: null },
                  { name: "Sunrise Foundation", type: "Non-Profit", logo: `${basePath}/logos/sunrise-foundation-corona-transparent.png` }
                ].map((entity, i) => (
                  <FadeIn key={i} delay={0.2 + (i * 0.1)} className="flex flex-col items-center">
                    <div className="w-px h-8 bg-border mb-0 hidden md:block -mt-8"></div>
                    <div className="w-full h-32 border border-border bg-card p-4 flex flex-col justify-center items-center text-center hover:border-primary/50 transition-colors">
                      {entity.logo
                        ? <img src={entity.logo} alt={entity.name} className="h-10 w-auto object-contain mb-1" />
                        : <span className="font-serif text-lg mb-2">{entity.name}</span>
                      }
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">{entity.type}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
