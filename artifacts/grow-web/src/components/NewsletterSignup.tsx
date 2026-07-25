import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

export type NewsletterType =
  | 'general'
  | 'recovery-resources'
  | 'family-resources'
  | 'professional-training'
  | 'new-publications'
  | 'app-interest'
  | 'sunriseos-demo'
  | 'partnership';

interface NewsletterSignupProps {
  type: NewsletterType;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

const labels: Record<NewsletterType, { title: string; description: string; listLabel: string; submitLabel: string }> = {
  'general': {
    title: "Stay in the Loop",
    description: "Get updates on new educational content, courses, media releases, and organizational news.",
    listLabel: "Grow Motivational Newsletter",
    submitLabel: "Subscribe"
  },
  'recovery-resources': {
    title: "Recovery Resources Updates",
    description: "Receive notifications when we publish new worksheets, guides, audio resources, and recovery tools.",
    listLabel: "Recovery Resources List",
    submitLabel: "Sign Up for Recovery Resources"
  },
  'family-resources': {
    title: "Family & Loved Ones Resources",
    description: "Get educational content, support guides, and family wellness tools delivered to your inbox.",
    listLabel: "Family Resources List",
    submitLabel: "Sign Up for Family Resources"
  },
  'professional-training': {
    title: "Professional Training Announcements",
    description: "Be the first to know about new CEU courses, clinical training programs, and professional development opportunities.",
    listLabel: "Professional Training Announcements",
    submitLabel: "Sign Up for Training Updates"
  },
  'new-publications': {
    title: "New Publications",
    description: "Get notified when we release new books, workbooks, treatment manuals, and journals.",
    listLabel: "New Publications List",
    submitLabel: "Notify Me of New Publications"
  },
  'app-interest': {
    title: "Get Early App Access",
    description: "Sign up to be among the first to try the Grow Motivational app when it launches.",
    listLabel: "Grow Motivational App Interest List",
    submitLabel: "Request Early Access"
  },
  'sunriseos-demo': {
    title: "Request a SunriseOS Demo",
    description: "Interested in SunriseOS for your clinical organization? Request a personalized demo.",
    listLabel: "SunriseOS Demo Request",
    submitLabel: "Request a Demo"
  },
  'partnership': {
    title: "Partnership Opportunities",
    description: "Stay informed about partnership programs, collaborations, and co-development opportunities.",
    listLabel: "Partnership Opportunities List",
    submitLabel: "Notify Me of Partnership Opportunities"
  }
};

const baseSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  email: z.string().email("Please enter a valid email address"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the privacy policy" })
  })
});

const orgSchema = baseSchema.extend({
  organization: z.string().optional(),
});

type BaseFormValues = z.infer<typeof baseSchema>;
type OrgFormValues = z.infer<typeof orgSchema>;

function needsOrgField(type: NewsletterType) {
  return ['professional-training', 'sunriseos-demo', 'partnership'].includes(type);
}

export function NewsletterSignup({
  type,
  title,
  description,
  className = '',
  compact = false
}: NewsletterSignupProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const meta = labels[type];
  const showOrg = needsOrgField(type);

  const schema = showOrg ? orgSchema : baseSchema;
  const form = useForm<OrgFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      email: "",
      organization: "",
    }
  });

  const onSubmit = async (data: OrgFormValues) => {
    setStatus('submitting');
    try {
      const res = await fetch('https://formsubmit.co/ajax/info@growmotivational.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...data,
          listType: type,
          _subject: `Sign-up: ${meta.listLabel} — ${data.firstName}`,
          _replyto: data.email,
          _captcha: 'false',
        }),
      });
      const json = await res.json();
      if (json.success !== 'true' && json.success !== true) throw new Error('Failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const displayTitle = title ?? meta.title;
  const displayDesc = description ?? meta.description;

  if (status === 'success') {
    return (
      <div className={`flex flex-col items-center justify-center text-center py-8 ${className}`}>
        <CheckCircle className="w-12 h-12 text-primary mb-4" />
        <h3 className="font-heading font-semibold text-xl mb-2">You're signed up!</h3>
        <p className="text-muted-foreground text-sm mb-4">
          You've been added to our <strong className="text-foreground">{meta.listLabel}</strong>. We'll be in touch soon.
        </p>
        <button
          onClick={() => { form.reset(); setStatus('idle'); }}
          className="text-primary text-sm hover:underline"
        >
          Sign up again or with a different email
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-xl">{displayTitle}</h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{displayDesc}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Submission Failed</h4>
            <p className="text-xs opacity-90">Please try again in a moment.</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className={compact ? 'flex gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className={compact ? 'flex-1' : ''}>
                  {!compact && <FormLabel>First Name *</FormLabel>}
                  <FormControl>
                    <input
                      {...field}
                      placeholder="First name"
                      className="w-full bg-background border border-input rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className={compact ? 'flex-1' : ''}>
                  {!compact && <FormLabel>Email Address *</FormLabel>}
                  <FormControl>
                    <input
                      type="email"
                      {...field}
                      placeholder="Email address"
                      className="w-full bg-background border border-input rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showOrg && (
            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  {!compact && <FormLabel>Organization (Optional)</FormLabel>}
                  <FormControl>
                    <input
                      {...field}
                      placeholder="Organization name (optional)"
                      className="w-full bg-background border border-input rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    id={`consent-${type}`}
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-input accent-primary focus:ring-primary shrink-0"
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel htmlFor={`consent-${type}`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                    I agree to the <a href="/privacy-policy" className="text-primary hover:underline">privacy policy</a> and consent to receive communications. I can unsubscribe at any time. No personal health information should be submitted here.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting...' : meta.submitLabel}
          </button>
        </form>
      </Form>
    </div>
  );
}
