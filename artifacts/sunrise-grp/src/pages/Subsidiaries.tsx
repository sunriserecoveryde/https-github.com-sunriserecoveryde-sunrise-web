import React from 'react';
import PageWrapper, { FadeIn, Reveal } from '@/components/animations';
import { Building2, Server, GraduationCap, Heart, ArrowRight } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function Subsidiaries() {
  return (
    <PageWrapper>
      <div className="pt-40 pb-20 bg-background border-b border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            <Reveal>
              <h1 className="text-5xl md:text-7xl font-serif mb-6">The Portfolio</h1>
            </Reveal>
            <FadeIn delay={0.2}>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Four distinct operating entities. One integrated ecosystem. The Sunrise Grp. portfolio spans the entire behavioral healthcare continuum—from clinical delivery and technological infrastructure to professional education and philanthropic access.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>

      <div className="py-24 bg-card">
        <div className="container mx-auto px-6 md:px-12 space-y-32">
          
          {/* Sunrise Recovery */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <FadeIn className="lg:col-span-5 lg:sticky top-32">
              <div className="p-4 bg-primary/10 w-fit rounded-lg mb-6 text-primary">
                <Building2 size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl font-serif mb-4">Sunrise Recovery</h2>
              <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">Clinical Operations</p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                The flagship clinical delivery arm of The Sunrise Grp., operating premium treatment facilities across Delaware and the Mid-Atlantic. Sunrise Recovery provides a full continuum of care including Inpatient, Partial Hospitalization (PHP), and Intensive Outpatient (IOP) services.
              </p>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Evidence-based clinical protocols
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Multi-state operational footprint
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Joint Commission Accredited facilities
                </li>
              </ul>
            </FadeIn>
            <div className="lg:col-span-7 bg-background border border-border h-[600px] relative overflow-hidden">
              <div className="absolute inset-0 bg-muted/20"></div>
              {/* Image placeholder - normally a real photo of the facility */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-serif text-2xl">
                Facility Imagery
              </div>
            </div>
          </section>

          {/* SunriseOS */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <FadeIn className="lg:col-span-5 lg:sticky top-32 lg:order-2">
              <div className="p-4 bg-primary/10 w-fit rounded-lg mb-6 text-primary">
                <Server size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl font-serif mb-4">SunriseOS</h2>
              <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">Proprietary Technology</p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                A modern, purpose-built Electronic Health Record (EHR) and facility management platform. Born from the operational needs of Sunrise Recovery, SunriseOS eliminates the friction between clinical documentation and administrative workflow.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                By controlling the software that powers our facilities, The Sunrise Grp. maintains an unprecedented level of data agility, compliance oversight, and operational efficiency.
              </p>
              <div className="pt-4">
                <a href="#" className="inline-flex items-center text-primary font-medium hover:gap-3 gap-2 transition-all">
                  Visit SunriseOS <ArrowRight size={16} />
                </a>
              </div>
            </FadeIn>
            <div className="lg:col-span-7 bg-background border border-border h-[600px] relative overflow-hidden lg:order-1 p-12">
               <div className="w-full h-full border border-border rounded-lg shadow-2xl bg-card overflow-hidden flex flex-col">
                  {/* Fake App Header */}
                  <div className="h-12 border-b border-border bg-background flex items-center px-4 gap-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-border" />
                      <div className="w-3 h-3 rounded-full bg-border" />
                      <div className="w-3 h-3 rounded-full bg-border" />
                    </div>
                    <div className="h-6 w-48 bg-muted rounded" />
                  </div>
                  {/* Fake App Body */}
                  <div className="flex-1 p-6 flex gap-6">
                    <div className="w-48 h-full bg-background rounded-lg border border-border hidden md:block p-4 space-y-4">
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-5/6 bg-muted rounded" />
                    </div>
                    <div className="flex-1 h-full space-y-6">
                      <div className="h-32 w-full bg-background rounded-lg border border-border p-6">
                         <div className="h-6 w-1/3 bg-muted rounded mb-4" />
                         <div className="h-4 w-full bg-muted/50 rounded mb-2" />
                         <div className="h-4 w-2/3 bg-muted/50 rounded" />
                      </div>
                      <div className="flex-1 w-full bg-background rounded-lg border border-border" />
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Grow Motivational */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <FadeIn className="lg:col-span-5 lg:sticky top-32">
              <div className="p-4 bg-primary/10 w-fit rounded-lg mb-6 text-primary">
                <GraduationCap size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl font-serif mb-4">Grow Motivational</h2>
              <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">Education & Training</p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                The educational arm of The Grp., dedicated to elevating the standard of care across the industry. Grow Motivational provides accredited Continuing Education Units (CEUs) for clinicians, leadership training, and recovery education programs.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                By investing in the professionals who deliver care, we ensure the behavioral health workforce remains equipped with the latest clinical methodologies.
              </p>
            </FadeIn>
            <div className="lg:col-span-7 bg-background border border-border h-[600px] relative overflow-hidden flex items-center justify-center">
               <div className="text-center p-12 border border-primary/20 bg-primary/5">
                 <GraduationCap size={64} className="mx-auto mb-6 text-primary opacity-50" />
                 <h3 className="text-2xl font-serif mb-2">Grow Motivational Institute</h3>
                 <p className="text-muted-foreground">Professional Development Portal</p>
               </div>
            </div>
          </section>

          {/* The Sunrise Foundation */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <FadeIn className="lg:col-span-5 lg:sticky top-32 lg:order-2">
              <div className="p-4 bg-primary/10 w-fit rounded-lg mb-6 text-primary">
                <Heart size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl font-serif mb-4">The Sunrise Foundation</h2>
              <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-8">Philanthropy</p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                The 501(c)(3) nonprofit arm of The Sunrise Grp. The Foundation exists to remove financial barriers to critical behavioral healthcare for underserved populations.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Through scholarships, community grants, and public health advocacy, the Foundation ensures that quality care remains accessible to those who need it most, regardless of their financial status.
              </p>
              <div className="pt-4">
                <a href="#" className="inline-flex items-center text-primary font-medium hover:gap-3 gap-2 transition-all">
                  Support the Foundation <ArrowRight size={16} />
                </a>
              </div>
            </FadeIn>
            <div className="lg:col-span-7 bg-background border border-border h-[600px] relative overflow-hidden lg:order-1 flex items-center justify-center p-12">
               <div className="w-full h-full bg-card border border-border p-12 flex flex-col justify-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Heart size={200} />
                 </div>
                 <h3 className="text-4xl font-serif mb-6 relative z-10">Removing Barriers.</h3>
                 <h3 className="text-4xl font-serif text-muted-foreground relative z-10">Restoring Lives.</h3>
               </div>
            </div>
          </section>

        </div>
      </div>
    </PageWrapper>
  );
}
