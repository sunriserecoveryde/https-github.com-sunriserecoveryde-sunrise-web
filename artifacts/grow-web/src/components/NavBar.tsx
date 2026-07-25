import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ChevronDown } from 'lucide-react';

const mainLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  {
    name: 'Learn',
    children: [
      { name: 'Education & Courses', href: '/education' },
      { name: 'Recovery Resources', href: '/recovery-resources' },
      { name: 'Professional Training', href: '/professional-training' },
      { name: 'Digital Learning App', href: '/digital-learning' },
    ]
  },
  {
    name: 'Media & Publishing',
    children: [
      { name: 'Media', href: '/media' },
      { name: 'Publishing', href: '/publishing' },
    ]
  },
  { name: 'SunriseOS', href: '/sunriseos' },
  { name: 'The Sunrise Group', href: '/the-sunrise-group' },
  { name: 'Partnership', href: '/partnership' },
];

const mobileLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Education & Courses', href: '/education' },
  { name: 'Recovery Resources', href: '/recovery-resources' },
  { name: 'Professional Training', href: '/professional-training' },
  { name: 'Digital Learning App', href: '/digital-learning' },
  { name: 'Media', href: '/media' },
  { name: 'Publishing', href: '/publishing' },
  { name: 'SunriseOS', href: '/sunriseos' },
  { name: 'The Sunrise Group', href: '/the-sunrise-group' },
  { name: 'Partnership', href: '/partnership' },
];

interface DropdownItem {
  name: string;
  href: string;
}

interface NavLink {
  name: string;
  href?: string;
  children?: DropdownItem[];
}

function DropdownMenu({ link, location }: { link: NavLink; location: string }) {
  const [open, setOpen] = useState(false);
  const isActive = link.children?.some(c => c.href === location);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${
          isActive ? 'text-primary' : 'text-foreground/80'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {link.name}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
          {link.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={`block px-4 py-3 text-sm transition-colors hover:bg-primary/10 hover:text-primary ${
                location === child.href ? 'text-primary bg-primary/5' : 'text-foreground/80'
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavBar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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
          <Link href="/" className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            <img src="/logo.png" alt="Grow Motivational logo" className="h-10 w-10 transition-transform group-hover:scale-110" />
            <span className="font-heading font-bold text-xl tracking-tight">
              Grow <span className="text-muted-foreground font-normal">Motivational</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5" aria-label="Main navigation">
            {mainLinks.map((link) =>
              link.children ? (
                <DropdownMenu key={link.name} link={link} location={location} />
              ) : (
                <Link
                  key={link.name}
                  href={link.href!}
                  className={`text-sm font-medium transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${
                    location === link.href ? 'text-primary underline underline-offset-4 decoration-primary/50' : 'text-foreground/80'
                  }`}
                >
                  {link.name}
                </Link>
              )
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/contact"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors border border-border px-4 py-2 rounded-md hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Contact
            </Link>
            <Link
              href="/education"
              className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Explore Resources
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col pt-6 pb-6 px-4"
          role="dialog"
          aria-label="Navigation menu"
          aria-modal="true"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Grow Motivational logo" className="h-10 w-10" />
              <span className="font-heading font-bold text-xl tracking-tight">
                Grow <span className="text-muted-foreground font-normal">Motivational</span>
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="Close navigation menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 overflow-y-auto pb-20" aria-label="Mobile navigation">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xl font-heading font-semibold py-3 px-2 border-b border-white/5 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  location === link.href ? 'text-primary' : 'text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-4">
              <Link
                href="/education"
                className="w-full text-center bg-primary text-primary-foreground font-medium py-4 rounded-md text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Explore Resources
              </Link>
              <Link
                href="/contact"
                className="w-full text-center border border-border text-foreground font-medium py-4 rounded-md text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Contact Us
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
