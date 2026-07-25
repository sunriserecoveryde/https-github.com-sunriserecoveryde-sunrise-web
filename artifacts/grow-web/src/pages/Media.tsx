import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { SectionHeading } from '@/components/SectionHeading';
import { HeroSection } from '@/components/HeroSection';
import { mediaItems, MEDIA_AUDIENCES, MediaAudience, MediaType } from '@/data/mediaItems';
import {
  Mic, Play, FileText, Heart, Clock, Calendar, ArrowRight,
  Send, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';

const typeIcons: Record<MediaType, React.ElementType> = {
  'Podcast': Mic,
  'Documentary': Play,
  'Video': Play,
  'Article': FileText,
  'Recovery Story': Heart,
};

const typeColors: Record<MediaType, string> = {
  'Podcast': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  'Documentary': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'Video': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  'Article': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Recovery Story': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

function MediaCard({ item }: { item: (typeof mediaItems)[0] }) {
  const Icon = typeIcons[item.type];
  const colorClass = typeColors[item.type];
  const isPlayable = item.type === 'Podcast' || item.type === 'Documentary' || item.type === 'Video';

  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full hover-elevate transition-all group">
      {/* Thumbnail Placeholder */}
      <div className={`relative h-44 bg-gradient-to-br ${item.thumbnail ?? 'from-slate-900 to-slate-800'} flex items-center justify-center`}>
        <div className="p-4 bg-black/30 rounded-full group-hover:scale-110 transition-transform">
          <Icon className="w-8 h-8 text-white/80" />
        </div>
        <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}>
          {item.type}
        </span>
        {item.featured && (
          <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/80 text-primary-foreground">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-sm font-heading font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground flex-1 mb-4 line-clamp-3">
          {item.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {item.duration}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {item.date}
            </span>
          </div>
          <button className="flex items-center gap-1.5 text-primary hover:text-gold font-medium transition-colors">
            {isPlayable ? (
              <><Play className="w-3.5 h-3.5" /> {item.type === 'Podcast' ? 'Listen' : 'Watch'}</>
            ) : (
              <><ArrowRight className="w-3.5 h-3.5" /> Read</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Media() {
  const [activeAudience, setActiveAudience] = useState<MediaAudience | 'All'>('All');
  const [activeType, setActiveType] = useState<MediaType | 'All'>('All');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [newsletterError, setNewsletterError] = useState('');

  const featured = useMemo(() => mediaItems.filter(m => m.featured), []);

  const filtered = useMemo(() => {
    return mediaItems.filter(m => {
      const audMatch = activeAudience === 'All' || m.audience.includes(activeAudience);
      const typeMatch = activeType === 'All' || m.type === activeType;
      return audMatch && typeMatch;
    });
  }, [activeAudience, activeType]);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }
    if (!consent) {
      setNewsletterError('Please agree to receive emails before subscribing.');
      return;
    }
    setNewsletterError('');
    setNewsletterStatus('submitting');
    setTimeout(() => setNewsletterStatus('success'), 1000);
  };

  const types: MediaType[] = ['Podcast', 'Documentary', 'Video', 'Article', 'Recovery Story'];

  return (
    <Layout>
      <HeroSection
        headline="Stories That Move Recovery Forward."
        subheadline="Podcasts, documentaries, videos, articles, and recovery stories — created for people in recovery, their families, and the professionals who serve them."
        minHeight="min-h-[50vh]"
      />

      {/* Featured */}
      <section className="py-16 bg-card/20 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="This Month's Highlights"
            badge="Featured"
            subtitle="Our editors' picks — the content generating the most conversation right now."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.map(m => <MediaCard key={m.id} item={m} />)}
          </div>
        </div>
      </section>

      {/* Full Media Library with Filters */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Media Library"
            subtitle="Filter by audience or content type to find what you need."
          />

          {/* Filters */}
          <div className="flex flex-col gap-5 mb-10">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Audience</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveAudience('All')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeAudience === 'All' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                >All</button>
                {MEDIA_AUDIENCES.map(a => (
                  <button
                    key={a}
                    onClick={() => setActiveAudience(a)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeAudience === a ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >{a}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Type</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveType('All')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeType === 'All' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                >All Types</button>
                {types.map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeType === t ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >{t}</button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Showing {filtered.length} item{filtered.length !== 1 && 's'}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(m => <MediaCard key={m.id} item={m} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
              <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-heading font-medium mb-2">No media matches this filter</h3>
              <button
                onClick={() => { setActiveAudience('All'); setActiveType('All'); }}
                className="text-primary hover:underline text-sm mt-2"
              >Clear filters</button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-card/20 border-t border-white/5">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Send className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-3">New Episodes, Every Week</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Get the latest podcast episodes, recovery stories, and articles delivered to your inbox. No spam — one email per week.
          </p>

          {newsletterStatus === 'success' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-foreground font-medium">You're subscribed!</p>
              <p className="text-sm text-muted-foreground">
                Welcome to the list. Your first email will arrive within a few days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-center ${newsletterError && !consent ? 'border-border' : newsletterError ? 'border-red-500' : 'border-border'}`}
                />
              </div>
              <label className="flex items-start gap-3 text-left cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-1 shrink-0 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to receive weekly emails from Grow Motivational containing media content, recovery resources, and educational information. I can unsubscribe at any time. My information will not be sold or shared with third parties.
                </span>
              </label>
              {newsletterError && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {newsletterError}
                </div>
              )}
              <button
                type="submit"
                disabled={newsletterStatus === 'submitting'}
                className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {newsletterStatus === 'submitting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing…</>
                ) : (
                  'Subscribe to the Newsletter'
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
}
