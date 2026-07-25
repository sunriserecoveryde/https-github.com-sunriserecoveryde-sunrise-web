import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { CheckCircle, AlertCircle, Monitor, Mail, RefreshCw, Users } from 'lucide-react';

const sections = [
  {
    icon: CheckCircle,
    title: "Conformance Status",
    content: `Grow Motivational is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.

Grow Motivational aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible to people with disabilities. Conformance with these guidelines helps make the web more user-friendly for all people.

We conducted an internal accessibility sweep covering focus management, color contrast, alternative text, ARIA labeling, and form label associations. We are working to resolve any remaining gaps and achieve full WCAG 2.1 AA conformance.`
  },
  {
    icon: Monitor,
    title: "Assistive Technology Compatibility",
    content: `Grow Motivational is designed to be compatible with the following assistive technologies:

• Screen readers — including NVDA and VoiceOver on desktop and mobile
• Keyboard-only navigation — all interactive elements are reachable and operable via keyboard
• Browser zoom up to 200% — content reflows without loss of functionality or content
• High contrast modes — the site does not suppress OS-level contrast preferences
• Voice control software — interactive elements use accessible names suitable for voice commands

We test primarily against NVDA + Chrome on Windows and VoiceOver + Safari on macOS and iOS. If you encounter compatibility issues with another assistive technology, please let us know.`
  },
  {
    icon: AlertCircle,
    title: "Known Limitations",
    content: `Despite our best efforts, some areas of the site may not yet meet full WCAG 2.1 AA conformance. Known limitations include:

• Third-party embedded content — video players and external podcast embeds may not fully support keyboard navigation or screen reader announcement of playback state. We are working with our embedding partners to improve this.
• Legacy media content — older video recordings in our media archive may lack closed captions or audio descriptions. We are progressively captioning this content.
• PDF documents — some downloadable resources may not yet be tagged for screen reader accessibility. We are remediating documents as they are identified.

We are actively working to address these limitations. If you encounter a barrier not listed here, please contact us so we can prioritize a fix.`
  },
  {
    icon: RefreshCw,
    title: "Ongoing Efforts",
    content: `Accessibility is an ongoing commitment, not a one-time project. Our current efforts include:

• Reviewing all new pages and components against WCAG 2.1 AA success criteria before publication
• Including accessible focus indicators on all interactive elements
• Ensuring all images have meaningful alternative text or are marked decorative
• Associating all form inputs with visible or screen-reader-accessible labels
• Maintaining sufficient color contrast ratios for text and UI components
• Avoiding content that flashes more than three times per second

We welcome feedback from users and will use it to continuously improve the accessibility of our site.`
  },
  {
    icon: Users,
    title: "Scope of This Statement",
    content: `This statement applies to the Grow Motivational website at www.growmotivational.com, including all pages served under that domain.

It does not apply to:
• Third-party websites linked from our site (including partner organizations, SAMHSA, and crisis helplines)
• The Grow Motivational mobile app or the SunriseOS platform, which are governed by separate policies
• Content hosted on external platforms (YouTube, podcast hosts, social media)

We encourage those third-party providers to meet comparable accessibility standards and provide links for informational purposes only.`
  },
  {
    icon: Mail,
    title: "Contact Us About Accessibility",
    content: `We welcome your feedback on the accessibility of Grow Motivational. If you experience any accessibility barriers, need content in an alternative format, or have suggestions for improvement, please reach out:

• Email: accessibility@growmotivational.com
• General contact form: www.growmotivational.com/contact

We aim to respond to accessibility feedback within 5 business days. If your request involves providing content in an alternative format, we will work with you to find a reasonable solution.

If you are not satisfied with our response, you may contact the U.S. Department of Justice Civil Rights Division (www.ada.gov) for guidance on digital accessibility rights under the Americans with Disabilities Act.`
  }
];

export function AccessibilityStatement() {
  return (
    <Layout>
      <PageMeta
        title="Accessibility Statement | Grow Motivational"
        description="Grow Motivational's commitment to WCAG 2.1 AA accessibility — conformance status, known limitations, assistive technology compatibility, and how to report accessibility barriers."
        ogUrl="https://www.growmotivational.com/accessibility"
      />

      <div className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">

          <h1 className="text-4xl font-heading font-bold mb-3">Accessibility Statement</h1>
          <p className="text-muted-foreground text-sm mb-4">Last updated: July 25, 2026</p>
          <p className="text-muted-foreground leading-relaxed mb-12">
            Grow Motivational is committed to making our website accessible to all people, including those with disabilities. This statement describes our current accessibility posture, known limitations, and how to contact us if you encounter a barrier. If you need assistance or have feedback, email us at{' '}
            <a href="mailto:accessibility@growmotivational.com" className="text-primary hover:underline">
              accessibility@growmotivational.com
            </a>.
          </p>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5" aria-hidden="true" />
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
              Questions about accessibility?{' '}
              <a href="/contact" className="text-primary hover:underline">Contact us</a> or email{' '}
              <a href="mailto:accessibility@growmotivational.com" className="text-primary hover:underline">
                accessibility@growmotivational.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
