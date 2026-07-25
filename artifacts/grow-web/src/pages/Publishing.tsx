import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { SectionHeading } from '@/components/SectionHeading';
import { HeroSection } from '@/components/HeroSection';
import { publications, PUBLICATION_CATEGORIES, PublicationCategory } from '@/data/publications';
import {
  BookOpen, Book, FileText, Users, Building2, Heart, Briefcase, Home,
  Download, Eye, ShoppingCart, ArrowRight, CreditCard, Info
} from 'lucide-react';

const categoryIcons: Record<PublicationCategory, React.ElementType> = {
  'Books': BookOpen,
  'Workbooks': FileText,
  'Journals': Book,
  'Group Curricula': Users,
  'Treatment Manuals': Briefcase,
  'Family Guides': Heart,
  'Professional Resources': Building2,
  'Recovery Residence Materials': Home,
  'Digital Downloads': Download,
};

const formatColors: Record<string, string> = {
  'Softcover': 'text-sky-400 bg-sky-400/10',
  'Hardcover': 'text-amber-400 bg-amber-400/10',
  'PDF': 'text-emerald-400 bg-emerald-400/10',
  'Softcover + PDF': 'text-violet-400 bg-violet-400/10',
  'Curriculum Kit': 'text-rose-400 bg-rose-400/10',
};

const audienceColors: Record<string, string> = {
  'Individuals in Recovery': 'text-sky-300',
  'Families': 'text-rose-300',
  'Clinicians': 'text-emerald-300',
  'Organizations': 'text-amber-300',
  'Peer Specialists': 'text-violet-300',
  'All': 'text-muted-foreground',
};

function PublicationCard({ pub }: { pub: (typeof publications)[0] }) {
  const formatColor = formatColors[pub.format] ?? 'text-muted-foreground bg-muted';
  const audienceColor = audienceColors[pub.audience] ?? 'text-muted-foreground';

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full hover-elevate transition-all group">
      {/* Cover Placeholder */}
      <div className={`relative h-52 bg-gradient-to-br ${pub.coverColor ?? 'from-slate-900 to-slate-800'} flex flex-col items-center justify-center p-6 text-center`}>
        <BookOpen className="w-10 h-10 text-white/30 mb-3" />
        <p className="text-white/80 font-heading font-bold text-sm leading-snug line-clamp-3">{pub.title}</p>
        {pub.featured && (
          <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/80 text-primary-foreground">
            Featured
          </span>
        )}
        <span className={`absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full ${formatColor}`}>
          {pub.format}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${audienceColor}`}>{pub.audience}</span>
          <span className="text-xs text-muted-foreground">{pub.category}</span>
        </div>

        <h3 className="text-sm font-heading font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {pub.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-1">by {pub.author}</p>

        <p className="text-xs text-muted-foreground flex-1 mt-2 mb-5 line-clamp-3">
          {pub.description}
        </p>

        {pub.pages && (
          <p className="text-xs text-muted-foreground mb-3">{pub.pages} pages</p>
        )}

        <div className="pt-4 border-t border-white/5 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold font-heading text-foreground">
              ${pub.price.toFixed(2)}
            </span>
            {pub.isbn && (
              <span className="text-xs text-muted-foreground/60">ISBN: {pub.isbn}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5" disabled>
              <ShoppingCart className="w-3.5 h-3.5" /> Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Publishing() {
  const [selectedCategory, setSelectedCategory] = useState<PublicationCategory | 'All'>('All');

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return publications;
    return publications.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const featured = useMemo(() => publications.filter(p => p.featured), []);

  return (
    <Layout>
      <HeroSection
        headline="Recovery Literature, Professionally Authored."
        subheadline="Books, workbooks, journals, curricula, and treatment manuals written by behavioral health clinicians — for people in recovery, their families, and the professionals who support them."
        minHeight="min-h-[50vh]"
      />

      {/* Coming Soon Notice */}
      <div className="bg-amber-950/40 border-y border-amber-700/40">
        <div className="container mx-auto px-4 py-5 flex gap-4 items-start">
          <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-200/80 leading-relaxed">
              <strong className="text-amber-300">Publishing Store Coming Soon.</strong>{' '}
              Our catalog is published here for preview. Paid transactions are not yet active — purchase buttons are placeholders.
              We are currently integrating with{' '}
              <strong>Stripe</strong>, <strong>Shopify</strong>, and <strong>Gumroad</strong>{' '}
              to enable seamless checkout for digital and physical products. Check back soon, or{' '}
              <a href="/contact" className="text-amber-300 underline hover:text-amber-100 transition-colors">
                contact us
              </a>{' '}
              to pre-order directly.
            </p>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <section className="py-14 bg-card/20 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Publication Categories"
            subtitle="Nine categories spanning the full behavioral health publishing ecosystem."
            align="center"
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4">
            {PUBLICATION_CATEGORIES.map(cat => {
              const Icon = categoryIcons[cat];
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    document.getElementById('pub-library')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`glass-card rounded-xl p-4 flex flex-col items-center gap-2 text-center hover-elevate transition-all group ${selectedCategory === cat ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'}`}
                >
                  <div className={`p-2.5 rounded-lg transition-colors ${selectedCategory === cat ? 'bg-primary/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium leading-tight text-foreground/90">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Publications */}
      <section className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Featured Titles"
            subtitle="Our most widely used publications — adopted by treatment programs and individuals across the country."
            badge="Popular"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map(p => <PublicationCard key={p.id} pub={p} />)}
          </div>
        </div>
      </section>

      {/* Full Catalog */}
      <section id="pub-library" className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Full Catalog"
            subtitle="Browse by category using the filters below."
          />

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'All' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
            >All Categories</button>
            {PUBLICATION_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
              >{cat}</button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Showing {filtered.length} title{filtered.length !== 1 && 's'}
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map(p => <PublicationCard key={p.id} pub={p} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-heading font-medium mb-2">No titles in this category yet</h3>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-primary hover:underline text-sm mt-2"
              >View all titles</button>
            </div>
          )}
        </div>
      </section>

      {/* Future Integration Note */}
      <section className="py-16 bg-card/20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="glass-card rounded-2xl p-8 border border-border">
            <div className="flex items-start gap-5">
              <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold mb-3">Payment Integration Coming Soon</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  We are in active development on our checkout system. When complete, you'll be able to purchase physical titles
                  through <strong>Shopify</strong>, digital downloads through <strong>Gumroad</strong>,
                  and pay for curriculum kits and bulk orders through <strong>Stripe</strong>.
                  We expect the store to go live in Q4 2026.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    Pre-Order via Email <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-muted transition-colors"
                  >
                    Bulk / Organizational Orders
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
