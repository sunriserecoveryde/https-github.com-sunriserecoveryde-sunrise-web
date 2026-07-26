import React from 'react';
import PageWrapper, { FadeIn, Reveal } from '@/components/animations';

export default function Mission() {
  return (
    <PageWrapper>
      <div className="pt-40 pb-20 bg-background border-b border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            <Reveal>
              <h1 className="text-5xl md:text-7xl font-serif mb-6">Mission & Values</h1>
            </Reveal>
            <FadeIn delay={0.2}>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We believe that behavioral healthcare is fundamentally an infrastructure challenge. Solving it requires more than just clinical excellence; it requires engineering a better system of care from the ground up.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>

      <div className="py-24 bg-card">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-3xl mx-auto space-y-16">
            
            <FadeIn>
              <h2 className="text-3xl font-serif text-primary mb-6">The Philosophy</h2>
              <p className="text-lg text-foreground leading-relaxed mb-6">
                The behavioral health industry is fragmented. Excellent clinicians are hindered by outdated software. Treatment centers struggle with operational scalability. Patients navigate a disconnected continuum of care.
              </p>
              <p className="text-lg text-foreground leading-relaxed">
                The Sunrise Grp. was founded to vertically integrate the solution. By owning the clinical facilities (Sunrise Recovery), building the software that runs them (SunriseOS), educating the workforce (Grow Motivational), and funding access for the underserved (The Sunrise Foundation), we remove the friction that prevents excellent care from scaling.
              </p>
            </FadeIn>

            <div className="w-full h-px bg-border"></div>

            <FadeIn>
              <h2 className="text-3xl font-serif text-primary mb-8">Core Values</h2>
              
              <div className="space-y-12">
                <div>
                  <h3 className="text-xl font-serif mb-3">Institutional Precision</h3>
                  <p className="text-muted-foreground">
                    We approach behavioral health with the rigor of an enterprise corporation. Data drives our decisions, compliance dictates our operations, and measurable outcomes define our success.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-serif mb-3">Human Scale</h3>
                  <p className="text-muted-foreground">
                    Despite our corporate infrastructure, the end product is deeply human. We build systems so our clinicians can focus entirely on the patient in front of them, unburdened by operational friction.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-serif mb-3">Vertical Integration</h3>
                  <p className="text-muted-foreground">
                    We do not rely on third-party vendors for our core capabilities. If a tool doesn't exist to meet our standards, we build it. If a standard is lacking, we define it.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-serif mb-3">Uncompromising Ethics</h3>
                  <p className="text-muted-foreground">
                    Operating in healthcare demands the highest ethical threshold. Our governance model prioritizes patient welfare and regulatory compliance above short-term growth metrics.
                  </p>
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
