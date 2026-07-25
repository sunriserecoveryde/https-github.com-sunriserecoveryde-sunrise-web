import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { SectionHeading } from '@/components/SectionHeading';
import { HeroSection } from '@/components/HeroSection';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, AlertCircle, Building2, Heart, GraduationCap, Briefcase, Scale, Stethoscope, Users, FlaskConical, DollarSign, Code2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const partnerTypes = [
  "Treatment Organizations",
  "Recovery Residences",
  "Schools & Universities",
  "Community Organizations",
  "Employers & Workforce Programs",
  "Courts & Justice-Involved Programs",
  "Healthcare Organizations",
  "Professional Associations",
  "Content Collaborators",
  "Researchers & Academic Institutions",
  "Sponsors & Philanthropic Partners",
  "Investors",
  "Technology Partners",
  "Other"
];

const partnerCategories = [
  {
    icon: Building2,
    title: "Treatment Organizations",
    desc: "Integrate Grow Motivational education into patient and staff workflows, and access SunriseOS for clinical operations.",
    opportunities: ["Staff training curricula", "Patient education licensing", "SunriseOS pilot program"]
  },
  {
    icon: Heart,
    title: "Recovery Residences",
    desc: "Supplement your recovery community with science-based content and wellness tools.",
    opportunities: ["Resident skill-building modules", "Co-branded recovery guides", "Community referral partnerships"]
  },
  {
    icon: GraduationCap,
    title: "Schools & Universities",
    desc: "Bring evidence-based behavioral health education to campus counseling and academic programs.",
    opportunities: ["Course licensing", "Research collaborations", "Campus wellness programs"]
  },
  {
    icon: Briefcase,
    title: "Employers & Workforce",
    desc: "Equip your workforce with mental health and substance-use literacy programs that reduce absenteeism.",
    opportunities: ["Employee wellness programs", "EAP content integration", "Manager training modules"]
  },
  {
    icon: Scale,
    title: "Courts & Justice-Involved",
    desc: "Provide court-mandated education and reentry support through evidence-based behavioral health content.",
    opportunities: ["Diversion program curriculum", "Reentry support kits", "Digital learning access"]
  },
  {
    icon: Stethoscope,
    title: "Healthcare Organizations",
    desc: "Extend behavioral health literacy to primary care teams and integrate Grow content into patient care.",
    opportunities: ["Provider education programs", "Patient-facing content licensing", "Co-development projects"]
  },
  {
    icon: Users,
    title: "Professional Associations",
    desc: "Offer members CEU-eligible training, resources, and conference programming developed by clinical experts.",
    opportunities: ["Member discount programs", "Conference presentations", "Journal partnerships"]
  },
  {
    icon: FlaskConical,
    title: "Researchers",
    desc: "Collaborate on outcomes research and validation studies for our educational programs and tools.",
    opportunities: ["Data-sharing agreements", "Curriculum efficacy studies", "Grant co-applications"]
  },
  {
    icon: DollarSign,
    title: "Sponsors & Investors",
    desc: "Support the mission of making behavioral health education universally accessible and scalable.",
    opportunities: ["Program sponsorships", "Grant funding", "Impact investment opportunities"]
  },
  {
    icon: Code2,
    title: "Technology Partners",
    desc: "Integrate with SunriseOS or co-develop tools that advance the reach of behavioral health technology.",
    opportunities: ["API integrations", "White-label opportunities", "Co-development agreements"]
  },
  {
    icon: BookOpen,
    title: "Content Collaborators",
    desc: "Partner with our editorial team to produce books, workbooks, podcasts, and media.",
    opportunities: ["Co-authored publications", "Podcast guest slots", "Media co-productions"]
  },
];

const partnershipSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  organization: z.string().min(2, "Organization name is required"),
  title: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  partnerType: z.string().min(1, "Please select a partner type"),
  goals: z.string().min(20, "Please describe your goals (at least 20 characters)"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy policy" })
  })
});

type PartnershipFormValues = z.infer<typeof partnershipSchema>;

export function Partnership() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const form = useForm<PartnershipFormValues>({
    resolver: zodResolver(partnershipSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      organization: "",
      title: "",
      email: "",
      phone: "",
      partnerType: "",
      goals: "",
    }
  });

  const onSubmit = async (data: PartnershipFormValues) => {
    setStatus('submitting');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'partnership', ...data }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Layout>
      <PageMeta
        title="Partnership Opportunities | Grow Motivational"
        description="Partner with Grow Motivational to bring evidence-based behavioral health education to your organization. We work with treatment centers, schools, employers, courts, healthcare systems, and more."
        ogUrl="https://www.growmotivational.com/partnership"
      />

      <HeroSection
        headline={<>Build Something <span className="text-gradient">Bigger Together.</span></>}
        subheadline="We believe recovery thrives in community. Grow Motivational partners with organizations that share a commitment to accessible, evidence-based behavioral health education."
        primaryCta={{ text: "Start a Conversation", href: "#partnership-form" }}
        secondaryCta={{ text: "View Partner Types", href: "#partner-types" }}
      />

      {/* Intro */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <SectionHeading
            title="Why Partner With Us?"
            subtitle="We combine clinical rigor with modern media production to create behavioral health education that actually reaches people — and we're looking for partners who amplify that reach."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
            {[
              { title: "Clinical Credibility", desc: "All content is developed or reviewed by licensed clinicians and addiction medicine specialists." },
              { title: "Multi-Modal Delivery", desc: "We publish courses, books, podcasts, digital tools, and clinical software — meeting your audience where they are." },
              { title: "Shared Mission", desc: "We exist to make recovery education universally accessible. Partnerships that advance this mission get our full commitment." }
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 rounded-xl">
                <h3 className="font-heading font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types Grid */}
      <section id="partner-types" className="py-24 scroll-mt-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Who We Partner With"
            subtitle="From clinical organizations to technology companies, we collaborate across the full ecosystem of behavioral health."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {partnerCategories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <cat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{cat.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{cat.desc}</p>
                <ul className="space-y-1.5">
                  {cat.opportunities.map((opp, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">›</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="partnership-form" className="py-24 bg-card/30 scroll-mt-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <SectionHeading
            title="Start a Partnership Conversation"
            subtitle="Tell us about your organization and goals. Our partnerships team will respond within 3 business days."
            align="center"
          />
          <div className="mt-12">
            {status === 'success' ? (
              <div className="glass-card rounded-2xl p-12 text-center border-primary/20">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-3xl font-heading font-bold mb-4">Thank you for reaching out!</h3>
                <p className="text-muted-foreground text-lg mb-8">
                  Your partnership inquiry has been received. Our team will review your submission and follow up within 3 business days.
                </p>
                <button
                  onClick={() => { form.reset(); setStatus('idle'); }}
                  className="text-primary font-medium hover:underline"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8">
                {status === 'error' && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Submission Failed</h4>
                      <p className="text-sm opacity-90">There was a network error. Please try again.</p>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <input {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <input {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization *</FormLabel>
                            <FormControl>
                              <input {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Title / Role</FormLabel>
                            <FormControl>
                              <input {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <input type="email" {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <input type="tel" {...field} className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="partnerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type *</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-foreground"
                            >
                              <option value="" disabled>Select your organization type...</option>
                              {partnerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are you hoping to accomplish through this partnership? *</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              rows={5}
                              placeholder="Tell us about your organization's goals and how you envision working together..."
                              className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="consent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-border rounded-lg bg-background/50">
                          <FormControl>
                            <input
                              id="partnership-consent"
                              type="checkbox"
                              checked={field.value === true}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="mt-1 w-4 h-4 rounded border-input accent-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel htmlFor="partnership-consent" className="text-sm font-normal text-muted-foreground cursor-pointer">
                              I agree to the <a href="/privacy-policy" className="text-primary hover:underline">privacy policy</a> and consent to be contacted regarding this partnership inquiry. I understand that no personal health information should be submitted through this form.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      {status === 'submitting' ? 'Sending...' : 'Start a Partnership Conversation'}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                      Your information is handled in accordance with our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>. We will never sell or share your contact information.
                    </p>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
