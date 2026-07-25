import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated SVG Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[1000px] sm:h-[1000px] rounded-full bg-primary/20 blur-[120px] opacity-60 mix-blend-screen" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center opacity-30"
        >
          <svg viewBox="0 0 100 100" className="w-[150vw] h-[150vh] min-w-[1000px]">
            <defs>
              <radialGradient id="rays" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M50 50 L0 0 M50 50 L50 0 M50 50 L100 0 M50 50 L100 50 M50 50 L100 100 M50 50 L50 100 M50 50 L0 100 M50 50 L0 50" stroke="url(#rays)" strokeWidth="0.5" fill="none" />
          </svg>
        </motion.div>
      </div>

      <div className="container relative z-10 mx-auto px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <img 
            src={`${import.meta.env.BASE_URL}logo.png`} 
            alt="SunriseOS" 
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl mx-auto"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-4xl text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent"
        >
          The clinical operating system for behavioral health.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10"
        >
          One unified platform replacing 5-8 disconnected legacy systems. Clinical documentation, MAR, bed management, billing, and AI risk alerts in a single institutional-grade solution.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a
            href="/"
            data-testid="link-hero-platform"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-0.5"
          >
            See the Platform
          </a>
          <a
            href="/sunrise-pitch/"
            data-testid="link-hero-pitch"
            className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-[#1A2A45]/50 backdrop-blur-sm px-8 text-base font-medium text-white shadow-sm hover:bg-[#1A2A45] hover:border-muted-foreground/30 transition-all hover:-translate-y-0.5"
          >
            Investor Deck
          </a>
        </motion.div>
      </div>
    </section>
  );
}
