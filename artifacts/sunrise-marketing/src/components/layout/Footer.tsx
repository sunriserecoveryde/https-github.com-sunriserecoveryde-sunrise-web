export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A1020] border-t border-border/30 pt-16 pb-8 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          
          <div className="flex flex-col gap-4">
            <a href="#" className="flex items-center gap-2">
              <img 
                src={`${import.meta.env.BASE_URL}logo.png`} 
                alt="SunriseOS Logo" 
                className="h-8 w-auto opacity-90 grayscale hover:grayscale-0 transition-all duration-300"
              />
              <span className="font-bold text-xl tracking-tight text-white">SunriseOS</span>
            </a>
            <p className="text-sm text-muted-foreground max-w-xs">
              The clinical operating system purpose-built for behavioral health and substance use disorder treatment facilities.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-white mb-1">Product</h4>
              <a href="/" className="text-sm text-muted-foreground hover:text-white transition-colors">Product Demo</a>
              <a href="#platform" className="text-sm text-muted-foreground hover:text-white transition-colors">Features</a>
              <a href="#problem" className="text-sm text-muted-foreground hover:text-white transition-colors">Why SunriseOS</a>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-white mb-1">Company</h4>
              <a href="/sunrise-pitch/" className="text-sm text-muted-foreground hover:text-white transition-colors">Investor Deck</a>
              <a href="#market" className="text-sm text-muted-foreground hover:text-white transition-colors">Market Opportunity</a>
              <a href="#invest" className="text-sm text-muted-foreground hover:text-white transition-colors">Investment Case</a>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-white mb-1">Connect</h4>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-white transition-colors">Contact Us</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} SunriseOS Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
    </footer>
  );
}
