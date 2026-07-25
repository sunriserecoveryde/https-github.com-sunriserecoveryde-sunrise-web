import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { SectionHeading } from '@/components/SectionHeading';
import { Stethoscope, BrainCircuit, Users, ShieldCheck, GraduationCap, LineChart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

export function SunriseOS() {
  const features = [
    { icon: Stethoscope, title: "Clinical Care", desc: "Real-time patient census, vitals monitoring, and integrated CIWA/COWS protocol workflows." },
    { icon: BrainCircuit, title: "AI Assistance", desc: "Ambient clinical documentation that auto-drafts progress notes securely during patient encounters." },
    { icon: Users, title: "Operations", desc: "Intelligent staff scheduling, seamless shift handoffs, and operational dashboards." },
    { icon: ShieldCheck, title: "Compliance", desc: "Built-in CARF and Joint Commission readiness tools, audit trails, and policy management." },
    { icon: GraduationCap, title: "Education", desc: "Integrated Grow Motivational course delivery directly within the clinical and patient workflow." },
    { icon: LineChart, title: "Analytics", desc: "Outcomes dashboards, population health reports, and readmission risk indicators." }
  ];

  return (
    <Layout>
      <PageMeta
        title="SunriseOS — Intelligent Clinical Platform | Grow Motivational"
        description="SunriseOS is the AI-powered clinical operating system for behavioral health — combining real-time patient care, compliance tools, analytics, and integrated Grow Motivational education."
        ogUrl="https://www.growmotivational.com/sunriseos"
      />
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <BrainCircuit className="w-4 h-4" /> Technology Division
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight mb-6">
            One Intelligent Platform for <span className="text-gradient">Behavioral Health</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10">
            SunriseOS is the technology backbone of The Sunrise Group, powering clinical operations with AI-assisted documentation and seamlessly integrated educational delivery.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Schedule a Demo
            </Link>
            <button className="px-8 py-4 border border-border rounded-lg font-medium hover:bg-muted/50 transition-colors text-foreground">
              Join the Interest List
            </button>
          </div>
        </div>
      </section>

      {/* Image / Mockup Placeholder */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            <img
              src="/sunriseos-dashboard.jpg"
              alt="SunriseOS Dashboard Interface — the unified command center for clinicians, administrators, and educators"
              className="w-full h-auto block"
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card/20">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Purpose-Built for Recovery Care" 
            subtitle="A comprehensive suite replacing fragmented legacy EHRs with modern, intelligent workflows."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {features.map((feat, i) => (
              <div key={i} className="p-8 rounded-2xl border border-border bg-background hover:border-primary/40 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Diagram */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <SectionHeading 
            title="Education Powered by Technology" 
            subtitle="How Grow Motivational content reaches patients and staff through SunriseOS."
            align="center"
          />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-16 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0" />
            
            {[
              { step: 1, title: "Content Creation", desc: "Grow Motivational develops clinical education." },
              { step: 2, title: "Platform Integration", desc: "Modules loaded into SunriseOS library." },
              { step: 3, title: "Clinical Delivery", desc: "Providers prescribe content to patients." },
              { step: 4, title: "Outcomes", desc: "Engagement tracked alongside clinical data." }
            ].map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center w-full md:w-1/4 px-4 bg-background py-4">
                <div className="w-12 h-12 rounded-full bg-card border-2 border-primary flex items-center justify-center font-bold text-lg mb-4 text-primary">
                  {s.step}
                </div>
                <h4 className="font-heading font-semibold mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-gold/10 border-t border-b border-gold/20 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gold text-sm font-medium">
            SunriseOS is currently in active development. Features shown are representative of our planned platform capabilities. Availability subject to change.
          </p>
        </div>
      </div>

      {/* Demo Request */}
      <section className="py-24 bg-card/20">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-heading font-bold mb-3">Request a Demo</h2>
            <p className="text-muted-foreground">
              See SunriseOS in action. Leave your details and our team will reach out to schedule a personalized walkthrough of the platform.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8">
            <NewsletterSignup
              type="sunriseos-demo"
              title="Request a SunriseOS Demo"
              description="Tell us about your organization and we'll schedule a tailored demo walkthrough."
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}
