import React from 'react';
import { Logo } from '../Logo';
import { ArrowRight } from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const links: Record<string, FooterLink[]> = {
  Product: [
    { label: 'AI Note Engine', href: '#solution' },
    { label: 'Mobile App', href: '#mobile' },
    { label: 'For Every Role', href: '#roles' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Company: [
    { label: 'About', href: '#team' },
    { label: 'Investors', href: '#investors' },
    { label: 'Pitch Deck', href: '/sunrise-pitch/', external: true },
    { label: 'Contact', href: 'mailto:hello@getsunriseos.com', external: true },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'HIPAA Compliance', href: '#' },
    { label: 'BAA Available', href: 'mailto:hello@getsunriseos.com', external: true },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-[#060C18] border-t border-slate-800/50">
      {/* Top CTA strip */}
      <div className="border-b border-slate-800/50">
        <div className="container mx-auto px-5 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-medium">
            Ready to save 90 minutes per clinician per shift?
          </p>
          <a
            href="mailto:demo@getsunriseos.com"
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-sunrise-orange hover:bg-orange-500 rounded-lg transition-colors whitespace-nowrap"
          >
            Book a Demo <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-5 md:px-10 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-4" />
            <p className="text-slate-600 text-xs leading-relaxed mb-5 max-w-xs">
              The clinical operating platform for addiction treatment facilities. Built by a 17-year SUD professional.
            </p>
            <a
              href="mailto:hello@getsunriseos.com"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              hello@getsunriseos.com
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-600 mb-4">{category}</div>
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i}>
                    <a
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} Sunrise OS, Inc. All rights reserved.
          </p>
          <p className="text-xs text-slate-700">
            getsunriseos.com
          </p>
        </div>
      </div>
    </footer>
  );
};
