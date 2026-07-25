import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { Problem } from '@/components/sections/Problem';
import { Platform } from '@/components/sections/Platform';
import { Market } from '@/components/sections/Market';
import { Invest } from '@/components/sections/Invest';
import { Contact } from '@/components/sections/Contact';

export function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Navigation />
      <main className="flex-1">
        <Hero />
        <Problem />
        <Platform />
        <Market />
        <Invest />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
