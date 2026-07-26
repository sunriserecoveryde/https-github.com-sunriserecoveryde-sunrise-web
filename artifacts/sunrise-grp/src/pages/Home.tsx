import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, Building2, Server, GraduationCap, Heart } from 'lucide-react';
import PageWrapper, { FadeIn, Reveal } from '@/components/animations';
import { SunriseOSMark } from '@/components/SunriseOSLogo';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function Home() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center pt-24 pb-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${basePath}/attached_assets/generated_images/hero-bg.jpg`}
            alt="Corporate background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/85"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        </div>

        <div className="container relative z-10 mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 mb-8 border border-primary/30 bg-primary/5 px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">The Sunrise Grp., Inc.</span>
              </div>
            </Reveal>
            
            <Reveal delay={0.1}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[1.1] tracking-tight mb-8">
                Institutional precision.<br />
                <span className="text-muted-foreground italic">Human scale.</span>
              </h1>
            </Reveal>

            <FadeIn delay={0.3}>
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mb-12">
                A behavioral health holding company establishing the gold standard in care through clinical excellence, proprietary technology, and education.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/subsidiaries"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-primary/90 transition-colors"
                >
                  Explore Portfolio
                  <ArrowRight size={16} />
                </Link>
                <Link 
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 border border-border bg-card/50 backdrop-blur-sm text-foreground font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-card hover:border-primary/50 transition-all"
                >
                  Investor Relations
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Brand Statement / Philosophy */}
      <section className="py-32 bg-card relative z-20 border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-serif leading-tight">
                We believe that behavioral healthcare is fundamentally an <span className="text-primary italic">infrastructure challenge.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2} className="space-y-6 text-muted-foreground text-lg leading-relaxed">
              <p>
                The Sunrise Grp. was founded on a singular premise: to truly solve the behavioral health crisis, we must own the entire ecosystem. 
              </p>
              <p>
                From front-line clinical treatment and proprietary operational software, to staff credentialing and philanthropic access, our integrated model removes the friction between delivery and scale. We don't just invest in companies; we engineer systems of care.
              </p>
              <div className="pt-6">
                <Link href="/mission" className="inline-flex items-center text-primary font-medium tracking-wide hover:gap-3 gap-2 transition-all">
                  Read our philosophy <ArrowRight size={16} />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* The Portfolio / Subsidiaries */}
      <section className="py-32 bg-background relative z-20 border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <FadeIn>
            <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">Our Operations</h3>
            <h2 className="text-4xl font-serif mb-16">The Portfolio</h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubsidiaryCard 
              icon={<Building2 size={32} strokeWidth={1.5} />}
              title="Sunrise Recovery"
              category="Clinical Operations"
              description="Premier clinical treatment centers across Delaware and the Mid-Atlantic, delivering evidence-based inpatient and outpatient behavioral healthcare."
              delay={0}
            />
            <SubsidiaryCard 
              icon={<Server size={32} strokeWidth={1.5} />}
              title="SunriseOS"
              category="Healthcare Technology"
              description="A proprietary, purpose-built Electronic Health Record and facility management platform deployed across all group facilities."
              delay={0.1}
              logoNode={<SunriseOSMark size={48} />}
            />
            <SubsidiaryCard 
              icon={<GraduationCap size={32} strokeWidth={1.5} />}
              title="Grow Motivational"
              category="Education & Training"
              description="Providing critical CEU training, professional development, and recovery education to clinicians nationwide."
              delay={0.2}
              logoNode={<img src={`${basePath}/logo-grow.png`} alt="Grow Motivational logo" className="h-12 w-12 object-contain rounded-lg" />}
            />
            <SubsidiaryCard 
              icon={<Heart size={32} strokeWidth={1.5} />}
              title="The Sunrise Foundation"
              category="Philanthropy"
              description="Our non-profit arm dedicated to removing financial barriers to care and funding community-level behavioral health initiatives."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Scale/Impact Stats */}
      <section className="py-24 bg-card border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src={`${basePath}/attached_assets/generated_images/data-waves.jpg`}
            alt="Data visualization"
            className="w-full h-full object-cover mix-blend-overlay grayscale"
          />
        </div>
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <Stat label="States of Operation" value="2" />
            <Stat label="Operating Entities" value="4" />
            <Stat label="Care Model" value="Integrated" />
            <Stat label="HQ Location" value="Delaware" />
          </div>
        </div>
      </section>

      {/* Corporate Governance CTA */}
      <section className="py-32 bg-background border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <h2 className="text-4xl font-serif mb-6">Rigorous Oversight. Operational Excellence.</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Discover how The Sunrise Grp. manages its entities through a centralized governance model designed for scalability and compliance.
              </p>
              <Link 
                href="/governance"
                className="inline-flex items-center justify-center px-8 py-4 border border-primary/50 text-primary font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                View Corporate Governance
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}

function SubsidiaryCard({ icon, title, category, description, delay, logoNode }: { icon: React.ReactNode, title: string, category: string, description: string, delay: number, logoNode?: React.ReactNode }) {
  return (
    <FadeIn delay={delay}>
      <Link href="/subsidiaries" className="block group h-full">
        <div className="h-full p-8 md:p-10 border border-border bg-card/30 hover:bg-card hover:border-primary/50 transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="text-primary group-hover:scale-110 transition-transform origin-left">
              {icon}
            </div>
            {logoNode && (
              <div className="shrink-0">{logoNode}</div>
            )}
          </div>
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">{category}</p>
          <h3 className="text-2xl font-serif mb-4 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
          <div className="mt-8 flex items-center text-sm font-medium tracking-wide text-foreground group-hover:text-primary transition-colors gap-2">
            View Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </FadeIn>
  );
}

function Stat({ label, value }: { label: string, value: string }) {
  return (
    <FadeIn className="text-center">
      <div className="text-4xl md:text-5xl font-serif text-foreground mb-2">{value}</div>
      <div className="text-sm tracking-widest uppercase text-muted-foreground font-medium">{label}</div>
    </FadeIn>
  );
}
