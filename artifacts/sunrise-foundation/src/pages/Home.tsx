import React from 'react';
import { Link } from 'wouter';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';
import { ArrowRight, Heart, Home, Briefcase, ChevronRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-foreground/60 z-10" />
          <img 
            src="/hero-sunrise.jpg" 
            alt="Cinematic sunrise over a landscape" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight max-w-4xl mx-auto">
              Funding the First Light <br/>
              <span className="text-primary-foreground/90 italic font-light">of Recovery.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              We remove the financial and practical barriers that prevent people from entering addiction treatment, staying in recovery, and rebuilding independent lives.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.4} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/donate"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-sm font-medium hover:bg-primary/90 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Heart size={18} /> Give the Gift of Hope
            </Link>
            <Link 
              href="/programs"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white backdrop-blur-sm border border-white/20 rounded-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              Explore Our Programs <ArrowRight size={18} />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-8 leading-tight">
              Hope is not enough when you can't afford the door.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              The Sunrise Foundation stands independent, built around human stories and concrete solutions. We step in during those critical moments—the threshold of a treatment center, the first month of sober living, the return to the workforce—when a small grant changes the trajectory of a life forever.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Outcomes / Impact Grid */}
      <section className="py-24 bg-foreground text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-serif mb-4">Outcomes We Value</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                We don't just fund attempts; we invest in sustainable futures. Our metrics reflect real human stability.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Entry into Treatment", value: "Access", desc: "Crossing the first threshold safely." },
              { label: "Housing Retention", value: "30/90/180", desc: "Days of stable recovery residence." },
              { label: "Workforce Entry", value: "Careers", desc: "Credentialing and employment participation." },
              { label: "Family Reunification", value: "Healing", desc: "Rebuilding the critical support system." }
            ].map((stat, i) => (
              <StaggerItem key={i} className="bg-white/5 border border-white/10 p-8 rounded-lg text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="text-primary font-serif text-3xl mb-2">{stat.value}</div>
                <div className="font-medium text-lg mb-2">{stat.label}</div>
                <div className="text-sm text-gray-400">{stat.desc}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Programs Preview */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif text-foreground mb-4">Active Initiatives</h2>
              <p className="text-muted-foreground max-w-xl">
                Direct financial assistance where it matters most, bridging the gap between crisis and stability.
              </p>
            </div>
            <Link href="/programs" className="hidden md:flex text-primary hover:text-primary/80 font-medium items-center gap-1">
              View all programs <ArrowRight size={16} />
            </Link>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={0.1}>
              <div className="group border border-border bg-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img src="/recovery-community.jpg" alt="Recovery Community" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Up to $2,500
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Recovery Access Grants</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    Covering assessments, insurance deductibles, MAT costs, and critical needs to get individuals into treatment immediately.
                  </p>
                  <Link href="/programs" className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn more <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="group border border-border bg-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img src="/housing-program.jpg" alt="Housing Program" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Signature Program
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    Housing Scholarships
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    Funding the first 30-90 days of recovery housing, security deposits, and partial rent during early employment.
                  </p>
                  <Link href="/programs" className="text-secondary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn more <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="group border border-border bg-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img src="/workforce.jpg" alt="Workforce Development" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Up to $5,000
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Workforce Scholarships</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    Investing in the future of behavioral health by funding CPRS, CAC-AD training, and related college coursework.
                  </p>
                  <Link href="/programs" className="text-accent-foreground text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Learn more <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/programs" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1">
              View all programs <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-teal-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-serif mb-6">Be the turning point.</h2>
            <p className="text-lg md:text-xl text-teal-100 mb-10 max-w-2xl mx-auto font-light">
              Your donation directly removes the barriers standing between someone in crisis and their first light of recovery.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/donate"
                className="w-full sm:w-auto px-8 py-4 bg-white text-teal-900 rounded-sm font-bold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Donate Now
              </Link>
              <Link 
                href="/grants"
                className="w-full sm:w-auto px-8 py-4 border border-white/30 text-white rounded-sm font-medium hover:bg-white/10 transition-colors"
              >
                Apply for a Grant
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
