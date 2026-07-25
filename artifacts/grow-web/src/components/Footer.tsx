import { Link } from 'wouter';
import { Sunrise, Linkedin, Instagram, Facebook, Youtube, Mail, ArrowRight } from 'lucide-react';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Col 1 */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <Sunrise className="h-8 w-8 text-primary" />
              <span className="font-heading font-bold text-xl tracking-tight">
                Grow <span className="text-muted-foreground font-normal">Motivational</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Education for the journey of recovery.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
                aria-label="Subscribe"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-heading font-semibold mb-6 text-foreground">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Home</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">About</Link></li>
              <li><Link href="/education" className="text-muted-foreground hover:text-primary transition-colors text-sm">Education</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-heading font-semibold mb-6 text-foreground">Resources</h4>
            <ul className="space-y-4">
              <li><Link href="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors text-sm">Recovery Resources</Link></li>
              <li><Link href="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors text-sm">Professional Training</Link></li>
              <li><Link href="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors text-sm">Media</Link></li>
              <li><Link href="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors text-sm">Publishing</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-heading font-semibold mb-6 text-foreground">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/sunriseos" className="text-muted-foreground hover:text-primary transition-colors text-sm">SunriseOS</Link></li>
              <li><Link href="/the-sunrise-group" className="text-muted-foreground hover:text-primary transition-colors text-sm">The Sunrise Group</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">The Sunrise Foundation</a></li>
              <li><Link href="/coming-soon" className="text-muted-foreground hover:text-primary transition-colors text-sm">Careers</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></a>
          </div>
          
          <div className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Grow Motivational, LLC. All rights reserved.
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:text-primary transition-colors">Terms of Use</a>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:text-primary transition-colors">Accessibility Statement</a>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:text-primary transition-colors">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
