import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { X, Menu, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoModal } from './DemoModal';

const navLinks = [
  { label: 'Problem', href: '#problem' },
  { label: 'Platform', href: '#solution' },
  { label: 'For Teams', href: '#roles' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Investors', href: '#investors' },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const openDemo = () => {
    setMobileOpen(false);
    setDemoOpen(true);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0B1120]/95 backdrop-blur-xl border-b border-slate-800/60 py-3'
          : 'bg-transparent py-5'
      }`}>
        <div className="container mx-auto px-5 md:px-10 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#hero" onClick={() => setMobileOpen(false)} className="shrink-0 hover:opacity-80 transition-opacity">
            <Logo />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={openDemo}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Contact
            </button>
            <button
              onClick={openDemo}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-sunrise-orange hover:bg-orange-500 rounded-lg transition-colors"
            >
              Book a Demo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0B1120] flex flex-col pt-24 px-6 pb-10 md:hidden"
          >
            <nav className="flex flex-col gap-1 mb-10">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center py-4 text-xl font-semibold text-slate-300 hover:text-white border-b border-slate-800 transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
            <div className="flex flex-col gap-3">
              <button
                onClick={openDemo}
                className="flex items-center justify-center gap-2 w-full py-4 text-base font-semibold text-white bg-sunrise-orange hover:bg-orange-500 rounded-xl transition-colors"
              >
                Book a Demo <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={openDemo}
                className="flex items-center justify-center w-full py-4 text-base font-medium text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
};
