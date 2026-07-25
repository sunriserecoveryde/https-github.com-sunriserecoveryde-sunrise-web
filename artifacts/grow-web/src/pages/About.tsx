import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { HeroSection } from '@/components/HeroSection';
import { SectionHeading } from '@/components/SectionHeading';
import { CTABanner } from '@/components/CTABanner';
import { Target, Heart, Shield, Users, BookOpen, Lightbulb, Activity, Globe, Compass, Scale, Sun, Sparkles, ArrowRight } from 'lucide-react';

const values = [
  { icon: Shield, title: "Integrity", desc: "Honesty and ethical practice in every interaction." },
  { icon: Heart, title: "Compassion", desc: "Empathy as the foundation of our educational approach." },
  { icon: Activity, title: "Evidence-Based", desc: "Rooted in science and clinical best practices." },
  { icon: Globe, title: "Accessibility", desc: "Making vital knowledge available to all who need it." },
  { icon: Users, title: "Cultural Humility", desc: "Honoring diverse backgrounds and lived experiences." },
  { icon: Target, title: "Empowerment", desc: "Giving individuals agency over their recovery journey." },
  { icon: Users, title: "Collaboration", desc: "Working across disciplines for better outcomes." },
  { icon: Lightbulb, title: "Innovation", desc: "Pioneering new ways to deliver behavioral health education." },
  { icon: Compass, title: "Community", desc: "Building networks of support and shared learning." },
  { icon: Scale, title: "Accountability", desc: "Taking responsibility for our outcomes and impact." },
  { icon: Sun, title: "Hope", desc: "Believing deeply in the human capacity for change." },
  { icon: Sparkles, title: "Continuous Learning", desc: "Always evolving our understanding and methods." }
];

export function About() {
  return (
    <Layout>
      <PageMeta
        title="About Grow Motivational | Our Mission & Values"
        description="Grow Motivational is a behavioral health education company committed to translating clinical science into accessible content for individuals in recovery, families, and clinicians."
        ogUrl="https://www.growmotivational.com/about"
      />
      <HeroSection 
        headline="Our Purpose"
        subheadline="We believe that recovery is not just a destination, but a continuous journey of learning and growth."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-6 text-primary">Our Mission</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Grow Motivational exists to bridge the gap between clinical science and lived experience. We turn complex behavioral health concepts into accessible, actionable education that empowers individuals in recovery, equips families to support them, and elevates the professionals who treat them.
              </p>
            </div>
            
            <div className="pl-6 border-l-4 border-gold">
              <h2 className="text-3xl font-heading font-bold mb-6 text-gold">Our Vision</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                A world where the stigma of addiction is dismantled through understanding, and every person touched by behavioral health challenges has immediate access to the knowledge they need to heal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Core Values" 
            subtitle="The principles that guide our content creation, partnerships, and daily operations."
            align="center"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-16">
            {values.map((val, i) => (
              <div key={i} className="bg-background border border-border p-6 rounded-xl hover:border-primary/50 transition-colors">
                <val.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">{val.title}</h3>
                <p className="text-muted-foreground text-sm">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-card border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="grid md:grid-cols-5 h-full">
              <div className="md:col-span-2 relative min-h-[300px] bg-gradient-to-br from-primary/40 via-card to-accent/20">
                <div className="absolute inset-0 mix-blend-overlay z-10 bg-black/20" />
              </div>
              <div className="md:col-span-3 p-10 md:p-16 flex flex-col justify-center">
                <span className="text-primary font-medium text-sm tracking-wider uppercase mb-2">Founder & Chief Educational Officer</span>
                <h3 className="text-3xl font-heading font-bold mb-6">Dr. Elena Richardson</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  With over two decades of clinical experience in addiction medicine, Dr. Richardson founded Grow Motivational to address a critical gap: patients leaving treatment without the ongoing educational support needed to maintain recovery. Her vision for a "curriculum of recovery" has now reached thousands of individuals and organizations.
                </p>
                <div>
                  <button className="text-primary hover:text-gold font-medium flex items-center gap-2 transition-colors">
                    Read the Founder's Story <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* General Newsletter */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-10">
            <h2 className="text-2xl font-heading font-bold mb-2">Stay in Touch</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Sign up for our newsletter to receive updates on new educational content, organizational news, and recovery resources.
            </p>
            <NewsletterSignup type="general" compact={false} />
          </div>
        </div>
      </section>

      <CTABanner />
    </Layout>
  );
}

