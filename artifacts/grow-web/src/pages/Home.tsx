import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { HeroSection } from '@/components/HeroSection';
import { SectionHeading } from '@/components/SectionHeading';
import { AudienceCard } from '@/components/AudienceCard';
import { EcosystemDiagram } from '@/components/EcosystemDiagram';
import { ResourceCard } from '@/components/ResourceCard';
import { MediaCard } from '@/components/MediaCard';
import { CTABanner } from '@/components/CTABanner';
import { resources } from '@/data/resources';
import { mediaItems } from '@/data/mediaItems';
import { BookOpen, Stethoscope, Users, Building, GraduationCap, Mic, Library, MonitorPlay, Heart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

export function Home() {
  const purposeCards = [
    { icon: GraduationCap, title: "Education that Empowers", desc: "Actionable knowledge that turns theory into daily practice." },
    { icon: Library, title: "Science-Based Content", desc: "Rooted in the latest addiction medicine and psychological research." },
    { icon: Users, title: "Community-Centered", desc: "Designed for individuals, families, and the professionals who support them." },
    { icon: Activity, title: "Measurable Outcomes", desc: "Content built to deliver real-world impact and sustain recovery." }
  ];

  const divisions = [
    { icon: BookOpen, title: "Education & Courses", desc: "Self-guided and instructor-led curriculums.", link: "/education" },
    { icon: Mic, title: "Media & Podcasts", desc: "Conversations that break down stigma.", link: "/media" },
    { icon: Library, title: "Publishing & Books", desc: "Workbooks, guides, and memoirs.", link: "/publishing" },
    { icon: GraduationCap, title: "Professional Training", desc: "CEUs and certification prep.", link: "/professional-training" }
  ];

  return (
    <Layout>
      <PageMeta
        title="Grow Motivational | Education for the Journey of Recovery"
        description="Grow Motivational delivers science-based behavioral health education for individuals in recovery, families, and clinicians — courses, resources, media, and more."
        ogUrl="https://www.growmotivational.com/"
      />
      <HeroSection 
        headline={
          <>
            Education for the <br />
            <span className="text-gradient">Journey of Recovery.</span>
          </>
        }
        subheadline="We translate behavioral health science into accessible content, training programs, and media to support individuals, families, and clinicians."
        primaryCta={{ text: "Explore Resources", href: "/education" }}
        secondaryCta={{ text: "Partner With Us", href: "/contact" }}
      />

      {/* Purpose & Divisions */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Our Core Divisions" 
            subtitle="Providing comprehensive educational support across multiple modalities."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {divisions.map((div, i) => (
              <Link key={i} href={div.link} className="glass-card p-8 rounded-2xl hover:border-primary/50 transition-colors group text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <div.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-3">{div.title}</h3>
                <p className="text-muted-foreground text-sm">{div.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Who We Serve" 
            subtitle="Recovery is a collective effort. Our resources are tailored for every stakeholder in the journey."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AudienceCard 
              icon={Users}
              title="Individuals in Recovery"
              description="Workbooks, courses, and daily practices to sustain long-term wellness."
            />
            <AudienceCard 
              icon={Heart}
              title="Families & Loved Ones"
              description="Guides and support systems to navigate addiction as a family unit."
            />
            <AudienceCard 
              icon={Stethoscope}
              title="Clinicians & Counselors"
              description="Advanced training, CEUs, and clinical protocols for practitioners."
            />
            <AudienceCard 
              icon={Building}
              title="Treatment Organizations"
              description="Staff development and patient education curriculums."
            />
          </div>
        </div>
      </section>

      {/* The Ecosystem */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Part of The Sunrise Group" 
            subtitle="Grow Motivational operates within a broader ecosystem of clinical care, technology, and advocacy."
            align="center"
          />
          <div className="mt-16">
            <EcosystemDiagram />
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <SectionHeading 
              title="Featured Resources" 
              subtitle="Curated education from our clinical experts."
              align="left"
            />
            <Link href="/education" className="text-primary hover:text-gold transition-colors font-medium pb-4">
              View all resources →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resources.filter(r => r.featured).slice(0, 4).map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      </section>

      {/* Media Highlights */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/3">
              <SectionHeading 
                badge="Media & Publishing"
                title="Conversations That Matter." 
                subtitle="Tune into our award-winning podcast series and documentaries exploring the realties of behavioral health."
              />
              <Link href="/media" className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors mt-4">
                Explore Media Library
              </Link>
            </div>
            <div className="w-full lg:w-2/3 flex flex-col gap-4">
              {mediaItems.slice(0, 3).map(item => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / General Updates Sign-up */}
      <section className="py-20 bg-card/20 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-10 text-center">
            <h2 className="text-2xl font-heading font-bold mb-3">Stay Connected</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Get updates on new courses, recovery resources, media releases, and educational content from Grow Motivational.
            </p>
            <NewsletterSignup type="general" compact={false} />
          </div>
        </div>
      </section>

      <CTABanner />
    </Layout>
  );
}

