import React, { useState } from 'react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';
import { Heart, ShieldCheck, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DonatePage() {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  
  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = customAmount ? customAmount : selectedAmount;
    toast({
      title: "Redirecting to Secure Checkout",
      description: `Thank you for choosing to donate $${amount}. Our payment gateway is currently in test mode.`,
    });
  };

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      
      {/* Hero / Why It Matters */}
      <div className="bg-foreground text-white py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <h1 className="text-4xl md:text-5xl font-serif mb-6 text-white">Fund the First Light.</h1>
            <p className="text-lg text-gray-300 font-light mb-6">
              Major donors want their gifts to land somewhere serious. We guarantee strict adherence to our programmatic budgets, ensuring every dollar breaks down a specific barrier to recovery.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              <ShieldCheck size={20} /> 501(c)(3) Tax Deductible Organization
            </div>
          </FadeIn>
          <FadeIn delay={0.2} className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-6 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-serif text-primary mb-2">$2.5k</div>
                <div className="text-sm text-gray-400">Can fund a complete Access Grant for residential entry.</div>
              </div>
              <div className="bg-white/5 p-6 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="text-3xl font-serif text-secondary mb-2">$1.5k</div>
                <div className="text-sm text-gray-400">Can cover the critical first 30 days of sober living.</div>
              </div>
              <div className="bg-white/5 p-6 rounded-lg border border-white/10 backdrop-blur-sm col-span-2">
                <div className="text-3xl font-serif text-accent mb-2">$5.0k</div>
                <div className="text-sm text-gray-400">Can fund a full Workforce Scholarship, creating a new professional to help thousands more.</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Context */}
          <div className="lg:col-span-5">
            <FadeIn>
              <h2 className="text-3xl font-serif text-foreground mb-6">Why The Foundation Matters</h2>
              <div className="prose prose-lg prose-p:text-muted-foreground">
                <p>
                  Every day, individuals summon the courage to ask for help, only to be turned away because they lack the $500 deductible for their insurance, or the $1,000 security deposit for a recovery house.
                </p>
                <p>
                  <strong>This is a solvable problem.</strong>
                </p>
                <p>
                  By donating to The Sunrise Foundation, you bypass administrative bloat. We pay providers and landlords directly. Your contribution translates immediately into a bed, an assessment, a medication, or a credential.
                </p>
              </div>
              
              <div className="mt-10 p-6 bg-secondary/10 rounded-xl border border-secondary/20">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Heart className="text-secondary" size={20}/> Corporate Partnerships
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Interested in establishing a named scholarship or directing a major corporate gift? Our board is ready to collaborate on targeted-impact giving.
                </p>
                <a href="/contact" className="text-secondary font-medium text-sm hover:underline">Contact our development team &rarr;</a>
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Donation Form */}
          <div className="lg:col-span-7">
            <FadeIn delay={0.2}>
              <div className="bg-card border border-border rounded-2xl shadow-lg p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
                
                <h2 className="text-2xl font-bold mb-8">Make a Secure Donation</h2>
                
                <form onSubmit={handleDonate}>
                  {/* Amount Selection */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-foreground mb-4">Select an Amount</label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[50, 100, 250, 500, 1500, 2500].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                          className={`py-3 px-4 rounded-lg border text-center font-medium transition-all ${
                            selectedAmount === amount && !customAmount
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-transparent text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-muted-foreground font-medium">$</span>
                      </div>
                      <input
                        type="number"
                        placeholder="Custom Amount"
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        className="block w-full pl-8 pr-4 py-3 border border-border rounded-lg bg-transparent focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Donor Info (Placeholder) */}
                  <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                        <input type="text" required className="w-full p-3 border border-border rounded-lg bg-transparent focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                        <input type="text" required className="w-full p-3 border border-border rounded-lg bg-transparent focus:ring-primary outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                      <input type="email" required className="w-full p-3 border border-border rounded-lg bg-transparent focus:ring-primary outline-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors shadow-md flex justify-center items-center gap-2 group"
                  >
                    Proceed to Secure Checkout <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <ShieldCheck size={14} /> Transactions are secure and encrypted.
                  </p>
                </form>
              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </div>
  );
}
