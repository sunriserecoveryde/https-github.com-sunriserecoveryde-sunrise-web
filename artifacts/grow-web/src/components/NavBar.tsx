import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Sunrise, Menu, X } from 'lucide-react';

const links = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Education', href: '/education' },
  { name: 'Recovery Resources', href: '/recovery-resources' },
  { name: 'Professional Training', href: '/professional-training' },
  { name: 'Media', href: '/media' },
  { name: 'Publishing', href: '/publishing' },
  { name: 'SunriseOS', href: '/sunriseos' },
  { name: 'The Sunrise Group', href: '/the-sunrise-group' }
];

export function NavBar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-background/80 backdrop-blur-md border-white/10 shadow-sm'
            : 'bg-background border-transparent'
        }`}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Sunrise className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <span className="font-heading font-bold text-xl tracking-tight">
              Grow <span className="text-muted-foreground font-normal">Motivational</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? 'text-primary underline underline-offset-4 decoration-primary/50' : 'text-foreground/80'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/contact"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors border border-border px-4 py-2 rounded-md hover:bg-muted/50"
            >
              Partner With Us
            </Link>
            <Link
              href="/education"
              className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
            >
              Explore Resources
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col pt-6 pb-6 px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sunrise className="h-8 w-8 text-primary" />
              <span className="font-heading font-bold text-xl tracking-tight">
                Grow <span className="text-muted-foreground font-normal">Motivational</span>
              </span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-foreground">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto pb-20">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-2xl font-heading font-semibold py-2 border-b border-white/5 transition-colors ${
                  location === link.href ? 'text-primary' : 'text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-4">
              <Link
                href="/education"
                className="w-full text-center bg-primary text-primary-foreground font-medium py-4 rounded-md text-lg"
              >
                Explore Resources
              </Link>
              <Link
                href="/contact"
                className="w-full text-center border border-border text-foreground font-medium py-4 rounded-md text-lg"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
