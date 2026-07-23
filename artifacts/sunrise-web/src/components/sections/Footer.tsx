import React from 'react';
import { Logo } from '../Logo';

export const Footer = () => {
  return (
    <footer className="bg-[#060B14] py-12 border-t border-slate-800/60">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Logo />
            <p className="text-slate-600 text-xs tracking-wide">
              © {new Date().getFullYear()} Sunrise OS, Inc. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8 text-xs text-slate-500 font-medium tracking-wide">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">HIPAA Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
