import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export function FounderStory() {
  return (
    <Layout>
      <PageMeta
        title="Jim Collins — Founder's Story | Grow Motivational"
        description="Jim Collins is an addiction treatment professional, clinical supervisor, entrepreneur, and person in long-term recovery with more than two decades of personal and professional experience."
        ogUrl="https://www.growmotivational.com/founder"
      />

      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href="/about" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" /> Back to About
          </Link>

          <span className="text-primary font-medium text-sm tracking-wider uppercase mb-3 block">Founder & CEO</span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-8">Jim Collins</h1>

          <div className="prose prose-invert prose-lg max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Jim is an addiction treatment professional, clinical supervisor, entrepreneur, and person in long-term recovery with more than two decades of personal and professional experience. His work combines clinical knowledge, lived experience, ethical leadership, and a genuine commitment to helping people rebuild their lives.
            </p>
            <p>
              Throughout his career, Jim has supported individuals and families affected by substance use disorders while helping clinical teams provide structured, accountable, and compassionate care. He believes treatment should go beyond stabilization — helping people develop honesty, responsibility, consistency, practical life skills, and a sustainable foundation for long-term recovery.
            </p>
            <p>
              Jim is the founder and visionary behind The Sunrise Group, a developing family of organizations focused on improving addiction treatment, recovery support, clinical operations, and community impact. His vision includes ethical, evidence-informed treatment, accountable recovery housing, innovative technology for treatment providers, and a charitable foundation for people who lack access to care.
            </p>
            <p>
              Known for being dependable, direct, supportive, and genuine, Jim believes people should never be permanently defined by their past. As a husband and father, he considers time his most valuable asset. His goal is to serve the recovery community, create security for his family, and build a legacy that continues helping others for generations.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
