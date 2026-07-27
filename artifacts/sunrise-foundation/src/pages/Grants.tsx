import React from 'react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/fade-in';
import { CheckCircle2, XCircle, FileText, Send, UserCheck, Activity } from 'lucide-react';
import { Link } from 'wouter';

export default function GrantsPage() {
  return (
    <div className="w-full bg-background min-h-screen">
      {/* Header */}
      <div className="bg-teal-900 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <h1 className="text-4xl md:text-5xl font-serif mb-6 text-white">Grants & Scholarships</h1>
            <p className="text-lg text-teal-100 max-w-2xl mx-auto font-light">
              We provide direct funding to individuals and treatment providers. Review our eligibility requirements and application process below.
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Eligibility Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          <div className="lg:col-span-1">
            <FadeIn>
              <div className="sticky top-32">
                <h2 className="text-3xl font-serif text-foreground mb-4">Are you eligible?</h2>
                <p className="text-muted-foreground mb-6">
                  Our grants are strictly regulated to ensure we maximize our impact and maintain compliance with 501(c)(3) standards. Please verify you meet these criteria before applying.
                </p>
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Activity className="text-primary" size={20} /> Multi-Pathway Welcome
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    We never require a specific religion or Twelve-Step membership. We only ask for a documented commitment to your own structured recovery path.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
          
          <div className="lg:col-span-2">
            <FadeIn delay={0.2}>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border bg-gray-50/50">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <CheckCircle2 className="text-green-600" /> Core Requirements
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-foreground"><strong>Diagnosis or Impact:</strong> Documented Substance Use Disorder (SUD) or an affected immediate family member.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-foreground"><strong>Financial Need:</strong> Demonstrated and verifiable financial hardship preventing access to care.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-foreground"><strong>Recovery Plan:</strong> A written treatment or recovery plan verified by a provider or counselor.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-foreground"><strong>Accredited Providers:</strong> Funds must be directed to licensed and accredited facilities or vendors.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-foreground"><strong>Outcome Tracking:</strong> Agreement to participate in limited, confidential outcome follow-ups at 30, 90, and 180 days.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* What We Fund vs What We Don't */}
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            <div className="bg-green-50/50 border border-green-100 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-green-600" /> What We Fund
              </h3>
              <ul className="space-y-3 text-green-800">
                <li>• Clinical assessments and psychiatric evals</li>
                <li>• First 30-90 days of recovery housing</li>
                <li>• Medical copays and insurance deductibles</li>
                <li>• Required IDs and admission documents</li>
                <li>• Professional credentialing (CPRS, CAC-AD)</li>
                <li>• Direct transportation to treatment</li>
              </ul>
            </div>
            
            <div className="bg-red-50/50 border border-red-100 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">
                <XCircle className="text-red-600" /> What We Do NOT Fund
              </h3>
              <ul className="space-y-3 text-red-800">
                <li>• Direct cash payments to applicants</li>
                <li>• Unlicensed or unaccredited facilities</li>
                <li>• Legal fees, fines, or court costs</li>
                <li>• Long-term luxury residential treatment</li>
                <li>• Non-recovery related personal debts</li>
                <li>• General living expenses outside recovery housing</li>
              </ul>
            </div>
          </div>
        </FadeIn>

        {/* Application Process */}
        <FadeIn>
          <h2 className="text-3xl font-serif text-center mb-12">The Application Process</h2>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 z-0"></div>
            
            <StaggerContainer className="space-y-12 relative z-10">
              
              <StaggerItem className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 flex justify-end text-right">
                  <div className="bg-card border border-border p-6 rounded-xl shadow-sm max-w-sm w-full">
                    <h4 className="text-lg font-bold mb-2">1. Initial Inquiry</h4>
                    <p className="text-muted-foreground text-sm">Submit a basic inquiry outlining your need, program choice, and current situation via our secure portal.</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white font-bold shrink-0">1</div>
                <div className="md:w-1/2"></div>
              </StaggerItem>

              <StaggerItem className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2"></div>
                <div className="w-12 h-12 bg-secondary rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white font-bold shrink-0">2</div>
                <div className="md:w-1/2 text-left">
                  <div className="bg-card border border-border p-6 rounded-xl shadow-sm max-w-sm w-full">
                    <h4 className="text-lg font-bold mb-2">2. Documentation</h4>
                    <p className="text-muted-foreground text-sm">Our case managers will request verification of identity, financial need, and a clinical recommendation or recovery plan.</p>
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 flex justify-end text-right">
                  <div className="bg-card border border-border p-6 rounded-xl shadow-sm max-w-sm w-full">
                    <h4 className="text-lg font-bold mb-2">3. Committee Review</h4>
                    <p className="text-muted-foreground text-sm">The Foundation's disbursement committee reviews the application. We aim for a 48-72 hour turnaround for crisis access grants.</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full border-4 border-white shadow-sm flex items-center justify-center font-bold shrink-0">3</div>
                <div className="md:w-1/2"></div>
              </StaggerItem>

              <StaggerItem className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2"></div>
                <div className="w-12 h-12 bg-foreground rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white font-bold shrink-0">4</div>
                <div className="md:w-1/2 text-left">
                  <div className="bg-card border border-border p-6 rounded-xl shadow-sm max-w-sm w-full">
                    <h4 className="text-lg font-bold mb-2">4. Direct Disbursement</h4>
                    <p className="text-muted-foreground text-sm">If approved, funds are distributed directly to the credentialed provider, landlord, or educational institution.</p>
                  </div>
                </div>
              </StaggerItem>

            </StaggerContainer>
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={0.4} className="mt-24 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10 max-w-3xl mx-auto">
            <h2 className="text-2xl font-serif mb-4">Ready to take the next step?</h2>
            <p className="text-muted-foreground mb-8">
              If you meet the criteria and need assistance removing a barrier to your recovery journey, our application portal is open.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-sm text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              Start Application Inquiry
            </Link>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
