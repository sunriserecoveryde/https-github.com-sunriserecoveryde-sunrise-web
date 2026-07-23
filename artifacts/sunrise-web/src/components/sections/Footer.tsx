import React from 'react';
import { Logo } from '../Logo';

export const Footer = () => {
  return (
    <footer className="bg-[#0A0F1C] py-12 border-t border-slate-800">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo className="scale-90 origin-left" />
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Sunrise OS. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
