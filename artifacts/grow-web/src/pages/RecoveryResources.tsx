import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { SectionHeading } from '@/components/SectionHeading';
import { HeroSection } from '@/components/HeroSection';
import { recoveryResources, RECOVERY_CATEGORIES, RecoveryCategory } from '@/data/recoveryResources';
import {
  BookOpen, FileText, Headphones, CheckSquare, PenLine, Dumbbell,
  Phone, AlertTriangle, Info, Download, ArrowRight, Heart
} from 'lucide-react';

const formatIconMap: Record<string, React.ElementType> = {
  'PDF': FileText,
  'Worksheet': PenLine,
  'Audio Guide': Headphones,
  'Checklist': CheckSquare,
  'Reflection Prompt': BookOpen,
  'Exercise': Dumbbell,
};

const categoryColorMap: Record<RecoveryCategory, string> = {
  'Daily Readings': 'text-amber-400 bg-amber-400/10',
  'Worksheets': 'text-sky-400 bg-sky-400/10',
  'Journaling Prompts': 'text-violet-400 bg-violet-400/10',
  'Meeting Preparation': 'text-emerald-400 bg-emerald-400/10',
  'Gratitude Exercises': 'text-rose-400 bg-rose-400/10',
  'Relapse Warning Signs': 'text-red-400 bg-red-400/10',
  'Personal Inventory': 'text-orange-400 bg-orange-400/10',
  'Coping Skills': 'text-teal-400 bg-teal-400/10',
  'Family Conversations': 'text-indigo-400 bg-indigo-400/10',
};

function ResourceCard({ resource }: { resource: (typeof recoveryResources)[0] }) {
  const Icon = formatIconMap[resource.format] || FileText;
  const colorClass = categoryColorMap[resource.category];

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col h-full hover-elevate transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClass} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>
          {resource.format}
        </span>
      </div>

      <span className="text-xs font-medium text-muted-foreground mb-2">{resource.category}</span>

      <h3 className="text-base font-heading font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
        {resource.title}
      </h3>

      <p className="text-muted-foreground text-sm flex-1 mb-5 line-clamp-3">
        {resource.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <span className="text-xs text-muted-foreground">
          {resource.duration ?? (resource.pages ? `${resource.pages} pages` : resource.format)}
        </span>
        <button className="text-primary hover:text-gold transition-colors flex items-center gap-1 text-sm font-medium group/btn">
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}

export function RecoveryResources() {
  const [selectedCategory, setSelectedCategory] = useState<RecoveryCategory | 'All'>('All');

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return recoveryResources;
    return recoveryResources.filter(r => r.category === selectedCategory);
  }, [selectedCategory]);

  const featured = useMemo(() => recoveryResources.filter(r => r.featured), []);

  return (
    <Layout>
      <PageMeta
        title="Recovery Resources | Grow Motivational"
        description="Free worksheets, audio guides, checklists, and recovery tools created by behavioral health clinicians — for individuals in recovery, families, and their support networks."
        ogUrl="https://www.growmotivational.com/recovery-resources"
      />
      <HeroSection
        headline="Your Recovery, Supported."
        subheadline="Free tools, worksheets, guides, and exercises created by clinicians and grounded in evidence — for every stage of the recovery journey."
        minHeight="min-h-[50vh]"
      />

      {/* Educational Disclaimer */}
      <div className="bg-amber-950/40 border-y border-amber-700/40">
        <div className="container mx-auto px-4 py-5 flex gap-4 items-start">
          <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-200/80 leading-relaxed">
            <strong className="text-amber-300">Educational Use Only.</strong>{' '}
            The resources on this page are for educational and self-help purposes only.
            They are not a substitute for professional medical advice, diagnosis, or treatment.
            If you or someone you know is in crisis, please contact{' '}
            <strong>emergency services (911)</strong> or call/text the{' '}
            <strong>988 Suicide &amp; Crisis Lifeline</strong> at <strong>988</strong>.
          </p>
        </div>
      </div>

      {/* Crisis Resources Banner */}
      <section className="py-8 bg-red-950/30 border-b border-red-900/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-1">In a Crisis Right Now?</h3>
                <p className="text-muted-foreground text-sm">
                  Don't wait. Reach out to trained crisis counselors 24/7.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <a
                href="tel:911"
                className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call 911 — Emergency
              </a>
              <a
                href="tel:988"
                className="flex items-center gap-2 px-5 py-3 bg-card hover:bg-card/80 border border-red-700/50 text-foreground rounded-lg font-semibold text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-red-400" />
                Call or Text 988 — Crisis Lifeline
              </a>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span><strong className="text-foreground">988 Lifeline</strong> — call or text 988, 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span><strong className="text-foreground">Crisis Text Line</strong> — text HOME to 741741</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span><strong className="text-foreground">SAMHSA Helpline</strong> — 1-800-662-4357</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-16 bg-card/20 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Most Downloaded"
            subtitle="Our most-used tools — chosen by thousands of people in recovery and the clinicians who support them."
            badge="Featured"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(r => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      </section>

      {/* Full Library with Category Filter */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Full Resource Library"
            subtitle="Browse by category to find the right tool for where you are in your recovery."
          />

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All Categories
            </button>
            {RECOVERY_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filtered.length} resource{filtered.length !== 1 && 's'}
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(r => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter signup */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-10">
            <h2 className="text-2xl font-heading font-bold mb-2">Get New Resources in Your Inbox</h2>
            <p className="text-muted-foreground text-sm mb-8">
              We add new worksheets, guides, and tools regularly. Sign up to be notified when new recovery resources are published.
            </p>
            <NewsletterSignup type="recovery-resources" compact={false} />
          </div>
        </div>
      </section>

      {/* Suggest More */}
      <section className="py-20 border-t border-border bg-card/20 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-4">Have a Resource Request?</h2>
          <p className="text-muted-foreground mb-8">
            Our clinical team is always developing new materials. If there's a topic or format you'd
            like to see, let us know — most of our resources started as suggestions from people in recovery.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Submit a Request <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </Layout>
  );
}
