import React from 'react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';
import { Check, ShieldCheck, Scale, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full bg-background min-h-screen">
      {/* Header */}
      <div className="bg-foreground text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="/about-mission.jpg" 
            alt="Sun breaking through trees" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/90 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <h1 className="text-4xl md:text-6xl font-serif mb-6">Our Mission</h1>
            <p className="text-xl text-gray-300 max-w-2xl font-light">
              The philanthropic heart of recovery. Independent, donor-facing, and entirely focused on removing the practical barriers to human healing.
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Left Column: Who We Are */}
          <div>
            <FadeIn>
              <h2 className="text-3xl font-serif text-foreground mb-6">Who We Are</h2>
              <div className="prose prose-lg prose-p:text-muted-foreground">
                <p>
                  The Sunrise Foundation is an independent 501(c)(3) nonprofit organization, existing as the philanthropic counterpart to The Sunrise Grp., Inc. While clinical businesses treat the patient, the Foundation focuses on the person—specifically the systemic, financial, and logistical walls that stand in their way.
                </p>
                <p>
                  We are built around human stories. Our focus is upstream of the clinical setting. We believe that no one should be denied the chance to rebuild their life simply because they lack the funds for a security deposit, the co-pay for a vital assessment, or the money for an ID card to gain admission.
                </p>
                <p>
                  Our work is grounded and serious. We treat addiction recovery not merely as a clinical outcome, but as a community imperative. 
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2} className="mt-12">
              <h2 className="text-3xl font-serif text-foreground mb-6">Our Independence</h2>
              <div className="bg-card border border-border p-8 rounded-xl shadow-sm">
                <ShieldCheck className="text-primary mb-4" size={32} />
                <h3 className="text-xl font-bold mb-3">Conflict-of-Interest Safeguards</h3>
                <p className="text-muted-foreground">
                  The Foundation maintains strict independence from The Sunrise Grp's clinical operations. Our grants are distributed to an open network of licensed and accredited providers. We operate under a rigorous ethical framework ensuring that donor funds go directly to the individual's needs, irrespective of which provider they choose, empowering patients with choice and dignity.
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Guiding Principles */}
          <div>
            <FadeIn delay={0.1}>
              <h2 className="text-3xl font-serif text-foreground mb-6">Guiding Principles</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Recovery is not a monolith. We honor the diverse paths that lead a person from darkness back into the light.
              </p>

              <StaggerContainer className="space-y-6">
                <StaggerItem className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 bg-primary/10 p-3 rounded-full h-12 w-12 flex items-center justify-center">
                    <Scale className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-2">Multi-Pathway Philosophy</h4>
                    <p className="text-muted-foreground">
                      We support evidence-based, medically assisted, and holistic approaches to recovery. We do not require any specific religious adherence or mandatory Twelve-Step affiliation. Our only requirement is a genuine commitment to a written recovery plan.
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 bg-secondary/10 p-3 rounded-full h-12 w-12 flex items-center justify-center">
                    <Check className="text-secondary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-2">Concrete Solutions</h4>
                    <p className="text-muted-foreground">
                      We pay providers directly whenever possible. By funding exact, itemized needs—rent, exam fees, deductibles—we ensure funds are utilized effectively and directly impact the applicant's journey.
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 bg-accent/20 p-3 rounded-full h-12 w-12 flex items-center justify-center">
                    <HeartHandshake className="text-accent-foreground" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-2">Dignity in Crisis</h4>
                    <p className="text-muted-foreground">
                      We interact with individuals at the most vulnerable moments of their lives. Our process is designed to be rigorous but not humiliating. We look for potential, not perfection.
                    </p>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>
          </div>

        </div>
      </div>
    </div>
  );
}
