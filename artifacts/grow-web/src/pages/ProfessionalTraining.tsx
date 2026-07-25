import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { SectionHeading } from '@/components/SectionHeading';
import { HeroSection } from '@/components/HeroSection';
import { trainingCourses, TRAINING_CATEGORIES, DELIVERY_FORMATS, TrainingCategory, DeliveryFormat } from '@/data/trainingCourses';
import {
  BookOpen, Monitor, Award, GraduationCap, Building2, Users, Calendar,
  Clock, CheckCircle, ArrowRight, Send, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';

const categoryIcons: Record<TrainingCategory, React.ElementType> = {
  'Ethics': Award,
  'Clinical Documentation': BookOpen,
  'Motivational Interviewing': Users,
  'Relapse Prevention': CheckCircle,
  'Group Facilitation': Users,
  'Trauma-Informed Care': Award,
  'Case Management': Building2,
  'Family Engagement': Users,
  'ROSC': Building2,
  'Clinical Leadership': GraduationCap,
  'Staff Development': Users,
  'Compliance & QA': CheckCircle,
};

const deliveryColors: Record<DeliveryFormat, string> = {
  'Live Webinar': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  'Self-Paced': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Certificate Program': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'CEU Program': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  'On-Site': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const levelColors: Record<string, string> = {
  'Foundational': 'text-emerald-400',
  'Intermediate': 'text-amber-400',
  'Advanced': 'text-rose-400',
  'All Levels': 'text-sky-400',
};

interface FormState {
  name: string;
  organization: string;
  email: string;
  phone: string;
  staffCount: string;
  trainingInterest: string;
  deliveryPreference: string;
  message: string;
}

function TrainingCard({ course }: { course: (typeof trainingCourses)[0] }) {
  const colorClass = deliveryColors[course.delivery];
  const levelColor = levelColors[course.level];

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col h-full hover-elevate transition-all group">
      <div className="flex items-start justify-between mb-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}>
          {course.delivery}
        </span>
        <span className={`text-xs font-medium ${levelColor}`}>{course.level}</span>
      </div>

      <span className="text-xs text-muted-foreground mb-2">{course.category}</span>

      <h3 className="text-base font-heading font-semibold mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-2">
        {course.title}
      </h3>

      <p className="text-muted-foreground text-sm flex-1 mb-5 line-clamp-3">
        {course.description}
      </p>

      <div className="space-y-2 text-xs text-muted-foreground mb-5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{course.duration}</span>
          {course.ceuCredits && (
            <span className="ml-auto text-primary font-medium">{course.ceuCredits} CEU credits</span>
          )}
        </div>
        {course.instructor && (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{course.instructor}</span>
          </div>
        )}
        {course.nextSession && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary font-medium">Next: {course.nextSession}</span>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-white/5 mt-auto">
        <button className="w-full py-2 text-sm font-medium text-center rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
          Learn More <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const STAFF_COUNTS = ['1–5', '6–25', '26–100', '101–250', '250+'];
const TRAINING_INTERESTS = TRAINING_CATEGORIES;
const DELIVERY_PREFS = ['Live Webinar', 'Self-Paced Online', 'On-Site / In-Person', 'Hybrid', 'No Preference'];

export function ProfessionalTraining() {
  const [activeCategory, setActiveCategory] = useState<TrainingCategory | 'All'>('All');
  const [activeDelivery, setActiveDelivery] = useState<DeliveryFormat | 'All'>('All');
  const [formState, setFormState] = useState<FormState>({
    name: '', organization: '', email: '', phone: '',
    staffCount: '', trainingInterest: '', deliveryPreference: '', message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});

  const filtered = useMemo(() => {
    return trainingCourses.filter(c => {
      const catMatch = activeCategory === 'All' || c.category === activeCategory;
      const delMatch = activeDelivery === 'All' || c.delivery === activeDelivery;
      return catMatch && delMatch;
    });
  }, [activeCategory, activeDelivery]);

  const featured = useMemo(() => trainingCourses.filter(c => c.featured), []);

  const validate = (): boolean => {
    const errors: Partial<FormState> = {};
    if (!formState.name.trim()) errors.name = 'Name is required.';
    if (!formState.organization.trim()) errors.organization = 'Organization is required.';
    if (!formState.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email))
      errors.email = 'A valid email address is required.';
    if (!formState.staffCount) errors.staffCount = 'Please select a staff count range.';
    if (!formState.trainingInterest) errors.trainingInterest = 'Please select a training area.';
    if (!formState.deliveryPreference) errors.deliveryPreference = 'Please select a delivery preference.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormStatus('submitting');
    // Simulate async submission
    setTimeout(() => {
      setFormStatus('success');
    }, 1200);
  };

  const field = (key: keyof FormState) => ({
    value: formState[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFormState(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <Layout>
      <HeroSection
        headline="Train. Certify. Lead."
        subheadline="Evidence-based professional training for addiction counselors, clinical supervisors, and behavioral health organizations — with CEU credits recognized across multiple states."
        minHeight="min-h-[50vh]"
      />

      {/* Training Category Grid */}
      <section className="py-16 bg-card/20 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Training Areas"
            subtitle="Twelve specialized tracks covering the full spectrum of competencies for addiction treatment professionals."
            align="center"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {TRAINING_CATEGORIES.map(cat => {
              const Icon = categoryIcons[cat];
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    document.getElementById('course-library')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 text-center hover-elevate transition-all group hover:border-primary/40"
                >
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium leading-tight text-foreground/90">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Featured Programs"
            subtitle="Our highest-rated trainings — chosen by programs across the country."
            badge="Popular"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(c => (
              <TrainingCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Full Course Library */}
      <section id="course-library" className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Full Course Library"
            subtitle="Filter by training category or delivery format to find the right program for your team."
          />

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-10">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === 'All' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                >All</button>
                {TRAINING_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >{cat}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Delivery Format</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveDelivery('All')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeDelivery === 'All' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                >All Formats</button>
                {DELIVERY_FORMATS.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setActiveDelivery(fmt)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeDelivery === fmt ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >{fmt}</button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Showing {filtered.length} training{filtered.length !== 1 && 's'}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(c => <TrainingCard key={c.id} course={c} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-heading font-medium mb-2">No trainings match this filter</h3>
              <button
                onClick={() => { setActiveCategory('All'); setActiveDelivery('All'); }}
                className="text-primary hover:underline text-sm mt-2"
              >Clear filters</button>
            </div>
          )}
        </div>
      </section>

      {/* Org Licensing Section */}
      <section className="py-16 bg-card/20 border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHeading
                title="Organization-Wide Licensing"
                subtitle="Training your whole team? We offer site licenses, cohort pricing, and custom on-site delivery for organizations with five or more staff."
                badge="For Organizations"
              />
              <ul className="space-y-4">
                {[
                  { icon: Building2, text: 'Site licenses for unlimited staff access to self-paced courses' },
                  { icon: Users, text: 'Private live webinar cohorts for 10–200 participants' },
                  { icon: Monitor, text: 'Custom LMS integration for your existing learning platform' },
                  { icon: Award, text: 'Branded certificate templates with your organization\'s logo' },
                  { icon: CheckCircle, text: 'Centralized CEU tracking and compliance reporting' },
                ].map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-md shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">Get a Custom Quote</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Tell us about your team size, training goals, and timeline. We'll build a program and pricing proposal within 48 hours.
              </p>
              <a
                href="#inquiry-form"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                onClick={e => { e.preventDefault(); document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                Request a Quote <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry-form" className="py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <SectionHeading
            title="Request Training Information"
            subtitle="Fill out the form below and our training team will follow up within one business day."
            align="center"
          />

          {formStatus === 'success' ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">Request Received!</h3>
              <p className="text-muted-foreground">
                Thank you for reaching out. Our training team will contact you at <strong>{formState.email}</strong> within one business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
              {formStatus === 'error' && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  Something went wrong. Please try again.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    placeholder="Dr. Jane Smith"
                    {...field('name')}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${formErrors.name ? 'border-red-500' : 'border-border'}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Organization <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    placeholder="Sunrise Recovery Center"
                    {...field('organization')}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${formErrors.organization ? 'border-red-500' : 'border-border'}`}
                  />
                  {formErrors.organization && <p className="text-xs text-red-400 mt-1">{formErrors.organization}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    placeholder="jane@sunriserecovery.org"
                    {...field('email')}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${formErrors.email ? 'border-red-500' : 'border-border'}`}
                  />
                  {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="(555) 000-0000"
                    {...field('phone')}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Staff <span className="text-red-400">*</span></label>
                  <select
                    {...field('staffCount')}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${formErrors.staffCount ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Select range…</option>
                    {STAFF_COUNTS.map(s => <option key={s} value={s}>{s} staff</option>)}
                  </select>
                  {formErrors.staffCount && <p className="text-xs text-red-400 mt-1">{formErrors.staffCount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Training Interest <span className="text-red-400">*</span></label>
                  <select
                    {...field('trainingInterest')}
                    className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${formErrors.trainingInterest ? 'border-red-500' : 'border-border'}`}
                  >
                    <option value="">Select area…</option>
                    {TRAINING_INTERESTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.trainingInterest && <p className="text-xs text-red-400 mt-1">{formErrors.trainingInterest}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Delivery Format <span className="text-red-400">*</span></label>
                <select
                  {...field('deliveryPreference')}
                  className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm ${formErrors.deliveryPreference ? 'border-red-500' : 'border-border'}`}
                >
                  <option value="">Select format…</option>
                  {DELIVERY_PREFS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {formErrors.deliveryPreference && <p className="text-xs text-red-400 mt-1">{formErrors.deliveryPreference}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Information</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your training goals, timeline, or any specific needs…"
                  {...field('message')}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === 'submitting'}
                className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {formStatus === 'submitting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Training Request</>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
}
