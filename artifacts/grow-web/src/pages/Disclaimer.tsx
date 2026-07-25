import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { AlertTriangle, Phone, ShieldAlert, BookOpen, Bot, Heart } from 'lucide-react';

const sections = [
  {
    icon: BookOpen,
    title: "Educational Content — Not Medical Advice",
    content: `All content published by Grow Motivational, LLC — including but not limited to website pages, course materials, workbooks, podcasts, media productions, and publications — is provided for educational and informational purposes only.

Nothing on this website or in our published materials constitutes medical advice, psychiatric advice, psychological advice, clinical diagnosis, or professional treatment of any kind. The information presented does not establish a patient-provider relationship.

Always consult a licensed physician, psychiatrist, licensed clinical social worker, licensed professional counselor, or other qualified healthcare professional before making any decisions related to your health, mental health, substance use, or treatment plan.`
  },
  {
    icon: Bot,
    title: "AI Tools — Limitations and Scope",
    content: `Grow Motivational may describe, link to, or in the future offer AI-powered educational tools, including an AI guidance feature within the Grow Motivational app. These tools are designed for educational and supportive purposes only.

AI tools offered or described by Grow Motivational:
• Are NOT a substitute for licensed clinical care, therapy, or medical treatment
• May produce inaccurate, incomplete, or contextually inappropriate responses
• Do NOT establish any therapeutic relationship or duty of care
• Are NOT designed or equipped to handle mental health crises, suicidal ideation, psychosis, or medical emergencies
• Should NOT be relied upon as a primary or sole source of support

Grow Motivational, LLC accepts no liability for actions taken or not taken based on AI-generated content.`
  },
  {
    icon: Phone,
    title: "Emergency Services — Act Immediately",
    content: `If you or someone you know is in crisis, experiencing thoughts of suicide or self-harm, or facing a medical emergency, do not rely on this website, any AI tool, or any form submission for help.

Contact emergency services immediately:

• 911 — Emergency services (United States)
• 988 — Suicide & Crisis Lifeline (call or text, available 24/7, free)
• 1-800-662-4357 — SAMHSA National Helpline (substance use disorders, 24/7, free, confidential)
• Crisis Text Line — Text HOME to 741741

For local or international crisis resources, visit www.findahelpline.com.`
  },
  {
    icon: ShieldAlert,
    title: "No PHI Through Contact Forms",
    content: `Our contact forms, newsletter sign-ups, partnership inquiries, and all other submission forms are not designed, configured, or certified to receive Protected Health Information (PHI) as defined under the Health Insurance Portability and Accountability Act (HIPAA).

You must NOT submit through any form on this Site:
• Your name combined with a medical diagnosis, treatment history, or substance use history
• Anyone else's health, mental health, or substance use information
• Insurance information or clinical records of any kind
• Any other information you would expect to be protected as PHI

Grow Motivational, LLC does not have HIPAA-compliant infrastructure in place for form submissions and cannot guarantee the security of PHI submitted through web forms.`
  },
  {
    icon: AlertTriangle,
    title: "HIPAA — Not Yet Assessed or Configured",
    content: `Grow Motivational, LLC is a behavioral health education and media organization. As of the date of this disclaimer, we have NOT:

• Assessed our obligations under HIPAA as a Covered Entity or Business Associate
• Implemented HIPAA-compliant infrastructure, access controls, or audit trails for this website
• Executed Business Associate Agreements (BAAs) with our current web vendors
• Engaged legal counsel to complete a formal HIPAA risk assessment

We do not currently handle Protected Health Information (PHI) in the operation of this website, and we are not advertising compliance with HIPAA.

If and when our affiliated clinical technology entity, SunriseOS, launches services that trigger HIPAA obligations for Covered Entities or Business Associates, appropriate compliance measures will be implemented, and applicable clients will be notified and presented with a formal BAA before any PHI is handled.`
  },
  {
    icon: Heart,
    title: "SunriseOS — Under Development",
    content: `SunriseOS is a clinical operating system currently under active development by The Sunrise Group. References to SunriseOS features, capabilities, screenshots, and demonstrations on this website represent the intended product design and are subject to change.

SunriseOS is not yet a certified or cleared medical device. Features described, including AI-assisted clinical documentation, are not FDA-cleared and are not intended to diagnose, treat, cure, or prevent any disease.

Organizations interested in SunriseOS should contact us for the most current information about availability, regulatory status, and compliance posture before making any procurement or implementation decisions.`
  }
];

export function Disclaimer() {
  return (
    <Layout>
      <PageMeta
        title="Legal Disclaimer | Grow Motivational"
        description="Important legal and ethical disclosures for Grow Motivational — educational content limitations, AI tool scope, emergency services direction, PHI restrictions, HIPAA status, and SunriseOS development notice."
        ogUrl="https://www.growmotivational.com/disclaimer"
      />

      <div className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">

          <h1 className="text-4xl font-heading font-bold mb-3">Disclaimer</h1>
          <p className="text-muted-foreground text-sm mb-4">Last updated: July 25, 2026</p>
          <p className="text-muted-foreground leading-relaxed mb-12">
            This page consolidates the legal and ethical disclosures that apply to the Grow Motivational website, publications, media, and digital tools. Please read each section carefully. If you have questions, contact us at{' '}
            <a href="mailto:legal@growmotivational.com" className="text-primary hover:underline">legal@growmotivational.com</a>.
          </p>

          {/* Emergency callout — always first */}
          <div className="mb-10 p-6 rounded-2xl bg-red-950/40 border border-red-500/40">
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-red-400 shrink-0 mt-1" />
              <div>
                <h2 className="font-heading font-bold text-xl text-red-300 mb-3">In a Crisis? Get Help Now.</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-red-200/90">
                  <div className="p-3 bg-red-950/40 rounded-lg">
                    <strong className="text-red-200 block">911</strong>
                    Emergency services
                  </div>
                  <div className="p-3 bg-red-950/40 rounded-lg">
                    <strong className="text-red-200 block">988</strong>
                    Suicide & Crisis Lifeline (24/7)
                  </div>
                  <div className="p-3 bg-red-950/40 rounded-lg">
                    <strong className="text-red-200 block">1-800-662-4357</strong>
                    SAMHSA Helpline (24/7, free)
                  </div>
                  <div className="p-3 bg-red-950/40 rounded-lg">
                    <strong className="text-red-200 block">Text HOME to 741741</strong>
                    Crisis Text Line
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-heading font-semibold text-xl text-foreground pt-1.5">{section.title}</h2>
                </div>
                <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line pl-14">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground text-center">
            <p>
              Questions about this Disclaimer?{' '}
              <a href="/contact" className="text-primary hover:underline">Contact us</a> or email{' '}
              <a href="mailto:legal@growmotivational.com" className="text-primary hover:underline">legal@growmotivational.com</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
