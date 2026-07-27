import React from 'react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';
import { Link } from 'wouter';
import { ArrowRight, Key, Home, GraduationCap, Clock } from 'lucide-react';

export default function ProgramsPage() {
  return (
    <div className="w-full bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="bg-foreground text-white py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="text-4xl md:text-6xl font-serif mb-6">Programs & Initiatives</h1>
            <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
              Strategic financial assistance designed to dismantle the specific barriers preventing individuals from accessing care and sustaining recovery.
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Active Programs */}
        <div className="mb-24">
          <FadeIn>
            <h2 className="text-3xl font-serif text-foreground mb-2">Active Programs</h2>
            <div className="h-1 w-20 bg-primary mb-10"></div>
          </FadeIn>

          <div className="space-y-16">
            
            {/* Program 1: Recovery Access Grants */}
            <FadeIn className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="h-full min-h-[300px] lg:min-h-[400px] relative">
                <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/recovery-community.jpg`} alt="Support group" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-3 rounded-full"><Key className="text-primary" size={24}/></div>
                  <h3 className="text-2xl font-bold">Recovery Access Grants</h3>
                </div>
                <div className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium mb-6 border border-border">
                  Up to $2,500 per person
                </div>
                <p className="text-muted-foreground mb-6">
                  The initial step into treatment is often blocked by immediate, out-of-pocket costs. This grant ensures that when an individual is ready, money is not the reason they are turned away.
                </p>
                <ul className="space-y-2 text-sm text-foreground/80 font-medium list-disc list-inside ml-4 mb-8">
                  <li>Treatment assessments & psychiatric evaluations</li>
                  <li>Insurance deductibles and copays</li>
                  <li>Medication-Assisted Treatment (MAT) costs</li>
                  <li>ID documents needed for admission</li>
                  <li>Childcare during residential treatment</li>
                  <li>Transportation to treatment facilities</li>
                </ul>
                <Link href="/grants" className="text-primary font-bold inline-flex items-center hover:underline">
                  Apply for this Grant <ArrowRight size={18} className="ml-2" />
                </Link>
              </div>
            </FadeIn>

            {/* Program 2: Housing Scholarships */}
            <FadeIn className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="order-2 lg:order-1 p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-secondary/10 p-3 rounded-full"><Home className="text-secondary" size={24}/></div>
                  <h3 className="text-2xl font-bold">Recovery Housing Scholarships</h3>
                </div>
                <div className="inline-block bg-secondary text-white px-3 py-1 rounded-full text-sm font-medium mb-2 mr-2">
                  Signature Program
                </div>
                <div className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium mb-6 border border-border">
                  $1,500 – $4,500 per person
                </div>
                <p className="text-muted-foreground mb-4">
                  Stable housing is the foundation of lasting recovery. We utilize a declining-support structure (100% Month 1, 75% Month 2, 50% Month 3, 25% Month 4) to foster independence while providing a crucial safety net.
                </p>
                <ul className="space-y-2 text-sm text-foreground/80 font-medium list-disc list-inside ml-4 mb-8">
                  <li>Recovery residence admission fees & deposits</li>
                  <li>First 30–90 days of housing coverage</li>
                  <li>Partial rent during early employment search</li>
                  <li>Drug testing fees</li>
                  <li>Basic move-in supplies and transportation to work</li>
                </ul>
                <Link href="/grants" className="text-secondary font-bold inline-flex items-center hover:underline">
                  Apply for this Scholarship <ArrowRight size={18} className="ml-2" />
                </Link>
              </div>
              <div className="order-1 lg:order-2 h-full min-h-[300px] lg:min-h-[400px] relative">
                <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/housing-bedroom.jpg`} alt="Recovery housing bedroom" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </FadeIn>

            {/* Program 3: Workforce Scholarships */}
            <FadeIn className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="h-full min-h-[300px] lg:min-h-[400px] relative">
                <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/workforce.jpg`} alt="Person studying for certification" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-accent/20 p-3 rounded-full"><GraduationCap className="text-accent-foreground" size={24}/></div>
                  <h3 className="text-2xl font-bold">Recovery Workforce Scholarships</h3>
                </div>
                <div className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium mb-6 border border-border">
                  Up to $3,000/yr (Certs) or $5,000 (College)
                </div>
                <p className="text-muted-foreground mb-4">
                  We believe people in recovery make the best healers. This scholarship funds the education and certification of future behavioral health professionals. Recipients complete 25–50 volunteer service hours.
                </p>
                <ul className="space-y-2 text-sm text-foreground/80 font-medium list-disc list-inside ml-4 mb-8">
                  <li>CPRS and CAC-AD training</li>
                  <li>Continuing Education Units (CEUs)</li>
                  <li>Social work & counseling coursework</li>
                  <li>Exam fees and clinical supervision</li>
                  <li>CPR/Naloxone & Community Health Worker certs</li>
                </ul>
                <Link href="/grants" className="text-accent-foreground font-bold inline-flex items-center hover:underline">
                  Apply for this Scholarship <ArrowRight size={18} className="ml-2" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Budget Allocation & Future Programs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-24">
          <FadeIn>
            <h2 className="text-2xl font-serif text-foreground mb-6 border-b border-border pb-4">Startup Funding Allocation</h2>
            <p className="text-muted-foreground mb-8">
              For our first two years, we adhere to a strict budgetary breakdown to ensure funds are directed toward our highest-impact, immediate-need initiatives. For every $100K in program budget:
            </p>
            <div className="space-y-4">
              {[
                { name: "Recovery Housing Scholarships", pct: 40, color: "bg-secondary" },
                { name: "Recovery Access Grants", pct: 30, color: "bg-primary" },
                { name: "Recovery Workforce Scholarships", pct: 15, color: "bg-accent" },
                { name: "Recovery Stability Microgrants", pct: 10, color: "bg-blue-500" },
                { name: "Family Recovery Assistance", pct: 5, color: "bg-purple-500" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="text-2xl font-serif text-foreground mb-6 border-b border-border pb-4 flex items-center gap-2">
              <Clock className="text-muted-foreground" size={24}/> Coming Next
            </h2>
            <p className="text-muted-foreground mb-8">
              As the Foundation grows, we will launch secondary programs targeting niche barriers in the recovery ecosystem.
            </p>
            <div className="space-y-4">
              <div className="bg-card border border-border p-4 rounded-lg">
                <h4 className="font-bold text-foreground">Recovery Stability Microgrants</h4>
                <p className="text-sm text-muted-foreground">The "Sunrise Second Chance Fund" ($100–$1,000) for fast-action barriers: license reinstatement, work tools, utilities, or phone bills.</p>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg">
                <h4 className="font-bold text-foreground">Family & Justice-Reentry Grants</h4>
                <p className="text-sm text-muted-foreground">Specialized assistance for family reunification efforts and those reentering society from the justice system.</p>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg">
                <h4 className="font-bold text-foreground">Community Organization Grants</h4>
                <p className="text-sm text-muted-foreground">Macro-level funding for local partners driving recovery innovation and grassroots education.</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
