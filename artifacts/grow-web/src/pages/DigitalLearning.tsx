import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { SectionHeading } from '@/components/SectionHeading';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  CheckCircle, AlertCircle, Smartphone, BookOpen, Brain, Target, Heart,
  BarChart3, Lightbulb, Zap, Shield, BellRing, MapPin, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: BookOpen, title: "Personalized Learning Paths", desc: "Adaptive content sequences tailored to your stage of recovery, goals, and learning preferences." },
  { icon: Clock, title: "Daily Lessons", desc: "Bite-sized, science-backed lessons designed to fit into even the busiest recovery day." },
  { icon: Brain, title: "Guided Journaling", desc: "Structured prompts rooted in CBT and DBT to help you process emotions and track your thinking patterns." },
  { icon: Target, title: "Sobriety Tracking", desc: "Milestone tracking with meaningful celebrations and motivational messages at key recovery anniversaries." },
  { icon: Heart, title: "Craving Management Tools", desc: "In-the-moment exercises to navigate cravings, urges, and high-risk situations with evidence-based techniques." },
  { icon: Lightbulb, title: "Coping Skills Library", desc: "Over 200 categorized coping strategies searchable by situation, emotion, or skill type." },
  { icon: BarChart3, title: "Progress Tracking", desc: "Visual dashboards showing your growth across domains: emotional regulation, skill use, knowledge, and milestones." },
  { icon: Zap, title: "Quizzes & Assessments", desc: "Knowledge checks and self-assessments that personalize your path and validate your learning." },
  { icon: Brain, title: "AI-Guided Support", desc: "An empathetic AI assistant to answer questions about recovery, recommend content, and provide reflective prompts. Not a substitute for clinical care." },
  { icon: BellRing, title: "Smart Reminders", desc: "Gentle, customizable check-in prompts that meet you where you are — not push notifications that feel intrusive." },
  { icon: Shield, title: "Peer Goal Setting", desc: "Set recovery goals privately or share them with a trusted support person for accountability." },
  { icon: MapPin, title: "Emergency Resource Links", desc: "One-tap access to 988 Suicide & Crisis Lifeline, SAMHSA National Helpline, and local crisis resources at all times." },
];

const audiences = [
  {
    title: "Individuals in Recovery",
    value: "Tools to sustain your journey, build daily habits, and navigate setbacks with evidence-based support.",
    color: "from-primary/20 to-primary/5"
  },
  {
    title: "Family Members & Loved Ones",
    value: "Education about addiction, communication strategies, and self-care resources to support yourself while helping someone you love.",
    color: "from-gold/20 to-gold/5"
  },
  {
    title: "Clinicians & Counselors",
    value: "A supplemental tool to assign between sessions, track client engagement, and extend therapeutic work into daily life.",
    color: "from-emerald-500/20 to-emerald-500/5"
  },
  {
    title: "Students & Training Professionals",
    value: "Applied learning companion for behavioral health coursework — quizzes, case-based scenarios, and skills practice.",
    color: "from-purple-500/20 to-purple-500/5"
  }
];

const featureOptions = [
  "Personalized learning paths",
  "Daily lessons & micro-content",
  "Guided journaling",
  "Sobriety tracking & milestones",
  "Craving management tools",
  "Coping skills library",
  "Progress tracking dashboards",
  "Quizzes & self-assessments",
  "AI-guided support",
  "Smart reminders",
  "Goal setting & accountability",
  "Emergency resource links"
];

const appInterestSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  email: z.string().email("Please enter a valid email address"),
  audienceType: z.string().min(1, "Please select who you are"),
  featuresOfInterest: z.array(z.string()).min(1, "Select at least one feature"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy policy" })
  })
});

type AppInterestFormValues = z.infer<typeof appInterestSchema>;

export function DigitalLearning() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const form = useForm<AppInterestFormValues>({
    resolver: zodResolver(appInterestSchema),
    defaultValues: {
      firstName: "",
      email: "",
      audienceType: "",
      featuresOfInterest: [],
    }
  });

  const onSubmit = async (data: AppInterestFormValues) => {
    setStatus('submitting');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType: 'app-interest', ...data }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const watchedFeatures = form.watch('featuresOfInterest') ?? [];

  const toggleFeature = (feature: string) => {
    const current = watchedFeatures;
    if (current.includes(feature)) {
      form.setValue('featuresOfInterest', current.filter(f => f !== feature), { shouldValidate: true });
    } else {
      form.setValue('featuresOfInterest', [...current, feature], { shouldValidate: true });
    }
  };

  return (
    <Layout>
      <PageMeta
        title="Grow Motivational App — Coming Soon | Digital Learning"
        description="The Grow Motivational app brings personalized recovery education, daily lessons, journaling, sobriety tracking, coping skills, and AI-guided support to your pocket. Sign up for early access."
        ogUrl="https://www.growmotivational.com/digital-learning"
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0" />
        <div className="container mx-auto px-4 relative z-10 max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4" /> Coming Soon
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-6">
                Recovery Education <span className="text-gradient">In Your Pocket.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                The Grow Motivational app is the digital companion to our entire educational ecosystem — bringing personalized learning paths, daily lessons, craving-management tools, and AI-guided support to individuals, families, and clinicians wherever life takes them.
              </p>
              <a
                href="#app-signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Get Early Access
              </a>
            </div>

            {/* App mockup placeholder */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="w-72 h-[540px] bg-card rounded-[3rem] border-2 border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-card border-b border-white/10 rounded-b-2xl z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-heading font-semibold mb-1">Grow Motivational</p>
                  <p className="text-xs text-muted-foreground">Your recovery journey companion</p>
                  <div className="mt-6 w-full space-y-2">
                    {["Daily Lesson", "Coping Skills", "My Progress", "Resources"].map(label => (
                      <div key={label} className="w-full h-10 bg-background/40 rounded-lg flex items-center px-3 gap-2">
                        <div className="w-4 h-4 rounded bg-primary/30" />
                        <span className="text-xs text-foreground/60">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Value Props */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Built for Everyone in the Recovery Ecosystem"
            subtitle="Whether you're in recovery, a family member, a clinician, or a student — the app meets you where you are."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {audiences.map((aud, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-2xl bg-gradient-to-br ${aud.color} border border-white/5`}
              >
                <h3 className="text-lg font-heading font-semibold mb-3">{aud.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{aud.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="What the App Will Do"
            subtitle="A comprehensive suite of recovery support tools grounded in clinical evidence and human-centered design."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-16">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-sm mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinical disclaimer banner */}
      <div className="py-6 bg-amber-950/30 border-y border-amber-500/20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-sm text-amber-200/80">
            <strong className="text-amber-200">Important:</strong> The Grow Motivational app is an educational and wellness tool. It is not a substitute for clinical treatment, therapy, or medical care. If you are experiencing a crisis, call <strong>988</strong> (Suicide & Crisis Lifeline) or <strong>911</strong>.
          </p>
        </div>
      </div>

      {/* Sign-up form */}
      <section id="app-signup" className="py-24 bg-card/30 scroll-mt-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <SectionHeading
            title="Get Early Access"
            subtitle="Sign up to be among the first to try the Grow Motivational app when it launches. We'll keep you updated on progress and invite you to our beta program."
            align="center"
          />

          <div className="mt-12">
            {status === 'success' ? (
              <div className="glass-card rounded-2xl p-12 text-center border-primary/20">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-3xl font-heading font-bold mb-4">You're on the list!</h3>
                <p className="text-muted-foreground text-lg mb-4">
                  We'll notify you as soon as the Grow Motivational app is ready for early access. Thank you for your interest.
                </p>
                <button
                  onClick={() => { form.reset(); setStatus('idle'); }}
                  className="text-primary font-medium hover:underline"
                >
                  Sign up another person
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8">
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
                    </div>

                    <FormField
                      control={form.control}
                      name="audienceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Who are you? *</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full bg-background border border-input rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-foreground"
                            >
                              <option value="" disabled>Select one...</option>
                              <option value="individual">Individual in Recovery</option>
                              <option value="family">Family Member / Loved One</option>
                              <option value="clinician">Clinician or Counselor</option>
                              <option value="student">Student / Training Professional</option>
                              <option value="other">Other</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featuresOfInterest"
                      render={() => (
                        <FormItem>
                          <FormLabel>Features of greatest interest (select all that apply) *</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {featureOptions.map(feature => (
                              <label
                                key={feature}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  watchedFeatures.includes(feature)
                                    ? 'border-primary bg-primary/10 text-foreground'
                                    : 'border-border bg-background/50 text-muted-foreground hover:border-primary/40'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={watchedFeatures.includes(feature)}
                                  onChange={() => toggleFeature(feature)}
                                  className="w-4 h-4 accent-primary"
                                />
                                <span className="text-xs">{feature}</span>
                              </label>
                            ))}
                          </div>
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
                              id="app-consent"
                              type="checkbox"
                              checked={field.value === true}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="mt-1 w-4 h-4 rounded border-input accent-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="leading-none">
                            <FormLabel htmlFor="app-consent" className="text-sm font-normal text-muted-foreground cursor-pointer">
                              I agree to the <a href="/privacy-policy" className="text-primary hover:underline">privacy policy</a> and consent to receive updates about the Grow Motivational app. I understand this form collects no personal health information and I can unsubscribe at any time.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? 'Submitting...' : 'Request Early Access'}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                      Your information is handled in accordance with our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>. We never sell or share your information.
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
