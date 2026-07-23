import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/sections/Hero';
import { Problem } from '@/components/sections/Problem';
import { AISection } from '@/components/sections/AISection';
import { Roles } from '@/components/sections/Roles';
import { Mobile } from '@/components/sections/Mobile';
import { Investors } from '@/components/sections/Investors';
import { Team } from '@/components/sections/Team';
import { Pricing } from '@/components/sections/Pricing';
import { CTABanner } from '@/components/sections/CTABanner';
import { Footer } from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="bg-[#0B1120] min-h-screen text-slate-50 selection:bg-sunrise-orange/30 selection:text-white">
      <Header />
      <main>
        <Hero />
        <Problem />
        <AISection />
        <Roles />
        <Mobile />
        <Investors />
        <Team />
        <Pricing />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
