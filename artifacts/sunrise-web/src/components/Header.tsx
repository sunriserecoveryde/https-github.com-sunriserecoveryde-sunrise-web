import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-border/50 py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <a href="#hero" className="hover:opacity-80 transition-opacity">
          <Logo />
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#problem" className="hover:text-white transition-colors">The Problem</a>
          <a href="#solution" className="hover:text-white transition-colors">Platform</a>
          <a href="#roles" className="hover:text-white transition-colors">For Teams</a>
          <a href="#investors" className="hover:text-white transition-colors">Investors</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="mailto:demo@sunriseos.com" className="hidden md:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-sunrise-orange hover:bg-orange-500 rounded-full transition-colors shadow-lg shadow-orange-500/20">
            Book a Demo
          </a>
        </div>
      </div>
    </header>
  );
};
