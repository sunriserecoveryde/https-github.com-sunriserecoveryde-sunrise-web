import React from 'react';
import { Link } from 'wouter';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <img
              src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/logos/foundation-logo-transparent.png`}
              alt="The Sunrise Foundation"
              className="h-20 w-auto mb-6 opacity-90"
            />
            <p className="text-gray-300 text-lg font-serif italic max-w-md mb-6">
              "Funding the First Light of Recovery."
            </p>
            <p className="text-gray-400 text-sm max-w-md">
              The Sunrise Foundation is an independent 501(c)(3) nonprofit organization dedicated to removing financial and practical barriers that prevent people from entering addiction treatment, staying in recovery, and rebuilding independent lives.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-400 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-primary transition-colors text-sm">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="/programs" className="text-gray-300 hover:text-primary transition-colors text-sm">
                  Programs & Initiatives
                </Link>
              </li>
              <li>
                <Link href="/grants" className="text-gray-300 hover:text-primary transition-colors text-sm">
                  Grants & Scholarships
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-primary transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-400 mb-4">Get Involved</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/donate" className="text-primary hover:text-primary/80 transition-colors text-sm font-medium flex items-center gap-2">
                  <Heart size={16} /> Make a Donation
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} The Sunrise Foundation. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>501(c)(3) Organization</span>
            <span>•</span>
            <span>Independent Entity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
