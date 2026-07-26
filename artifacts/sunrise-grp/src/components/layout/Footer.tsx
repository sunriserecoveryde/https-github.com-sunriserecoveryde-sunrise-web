import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/30 pt-20 pb-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <img 
                src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sunrise-grp-logo.png`} 
                alt="The Sunrise Grp." 
                className="h-12 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="hidden font-serif text-2xl font-semibold tracking-wide text-foreground">
                The Sunrise Grp.
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              An enterprise holding company dedicated to establishing the gold standard in behavioral healthcare through integrated clinical services, proprietary technology, and education.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif text-lg mb-6 text-foreground">Portfolio</h4>
            <ul className="space-y-4">
              <li><Link href="/subsidiaries" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sunrise Recovery</Link></li>
              <li><Link href="/subsidiaries" className="text-sm text-muted-foreground hover:text-primary transition-colors">SunriseOS</Link></li>
              <li><Link href="/subsidiaries" className="text-sm text-muted-foreground hover:text-primary transition-colors">Grow Motivational</Link></li>
              <li><Link href="/subsidiaries" className="text-sm text-muted-foreground hover:text-primary transition-colors">The Sunrise Foundation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-6 text-foreground">Corporate</h4>
            <ul className="space-y-4">
              <li><Link href="/governance" className="text-sm text-muted-foreground hover:text-primary transition-colors">Governance & Leadership</Link></li>
              <li><Link href="/mission" className="text-sm text-muted-foreground hover:text-primary transition-colors">Mission & Values</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Investor Relations</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {year} The Sunrise Grp., Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
