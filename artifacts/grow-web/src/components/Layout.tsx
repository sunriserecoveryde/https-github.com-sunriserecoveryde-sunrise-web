import { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { ScrollProgressBar } from './ScrollProgressBar';
import { FloatingCTA } from './FloatingCTA';
import { AmbientPlayer } from './AmbientPlayer';
import { CursorGlow } from './CursorGlow';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <ScrollProgressBar />
      <CursorGlow />
      <NavBar />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
      <FloatingCTA />
      <AmbientPlayer />
    </div>
  );
}
