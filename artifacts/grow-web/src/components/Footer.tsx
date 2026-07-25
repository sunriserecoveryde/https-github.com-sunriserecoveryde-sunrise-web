import { Link } from 'wouter';
import { Sunrise, Linkedin, Instagram, Facebook, Youtube, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function Footer() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "Thank you for joining our newsletter.",
      });
      setEmail('');
    }
  };

  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Col 1 — Brand + newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
              <Sunrise className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="font-heading font-bold text-xl tracking-tight">
                Grow <span className="text-muted-foreground font-normal">Motivational</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Education for the journey of recovery. Science-based content for individuals, families, and the professionals who support them.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2" aria-label="Newsletter sign-up">
              <label htmlFor="footer-email" className="sr-only">Email address for newsletter</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Subscribe to newsletter"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Col 2 — Learn */}
          <div>
            <h4 className="font-heading font-semibold mb-5 text-foreground">Learn</h4>
            <ul className="space-y-3">
              <li><Link href="/education" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Education & Courses</Link></li>
              <li><Link href="/recovery-resources" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Recovery Resources</Link></li>
              <li><Link href="/professional-training" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Professional Training</Link></li>
              <li><Link href="/digital-learning" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Digital Learning App</Link></li>
              <li><Link href="/media" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Media & Podcasts</Link></li>
              <li><Link href="/publishing" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Publishing</Link></li>
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <h4 className="font-heading font-semibold mb-5 text-foreground">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">About</Link></li>
              <li><Link href="/the-sunrise-group" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">The Sunrise Group</Link></li>
              <li><Link href="/sunriseos" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">SunriseOS</Link></li>
              <li><Link href="/partnership" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Partner With Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Contact</Link></li>
              <li><Link href="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Careers</Link></li>
            </ul>
          </div>

          {/* Col 4 — Legal */}
          <div>
            <h4 className="font-heading font-semibold mb-5 text-foreground">Legal & Safety</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Privacy Policy</Link></li>
              <li><Link href="/terms-of-use" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Terms of Use</Link></li>
              <li><Link href="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Disclaimer</Link></li>
              <li><Link href="/accessibility" className="text-muted-foreground hover:text-primary transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Accessibility Statement</Link></li>
            </ul>
            <div className="mt-6 p-4 rounded-xl bg-red-950/20 border border-red-500/20">
              <p className="text-xs text-red-200/70 leading-relaxed">
                <strong className="text-red-200">Crisis support?</strong><br />
                Call <strong>988</strong> (Suicide & Crisis Lifeline) or <strong>911</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="Grow Motivational on LinkedIn"
            >
              <Linkedin className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="Grow Motivational on Instagram"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="Grow Motivational on Facebook"
            >
              <Facebook className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="Grow Motivational on YouTube"
            >
              <Youtube className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Grow Motivational, LLC. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Privacy Policy</Link>
            <span className="hidden md:inline" aria-hidden="true">·</span>
            <Link href="/terms-of-use" className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Terms of Use</Link>
            <span className="hidden md:inline" aria-hidden="true">·</span>
            <Link href="/disclaimer" className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Disclaimer</Link>
          </div>
        </div>

        {/* Educational disclaimer */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed max-w-4xl mx-auto">
            Content on this site is for educational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider. AI tools described on this site are not substitutes for clinical care. SunriseOS is under development and not a certified medical device.
          </p>
        </div>
      </div>
    </footer>
  );
}
