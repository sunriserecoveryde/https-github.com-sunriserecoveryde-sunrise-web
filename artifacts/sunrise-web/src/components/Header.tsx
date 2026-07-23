import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/80 py-3'
        : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <a href="#hero" className="hover:opacity-75 transition-opacity">
          <Logo />
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#problem" className="hover:text-white transition-colors">The Problem</a>
          <a href="#solution" className="hover:text-white transition-colors">Platform</a>
          <a href="#roles" className="hover:text-white transition-colors">For Teams</a>
          <a href="#investors" className="hover:text-white transition-colors">Investors</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <a
          href="mailto:demo@sunriseos.com"
          className="hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-sunrise-orange hover:bg-orange-500 rounded-lg transition-colors"
        >
          Book a Demo
        </a>
      </div>
    </header>
  );
};
