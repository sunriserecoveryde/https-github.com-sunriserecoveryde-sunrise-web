import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { AlertTriangle } from 'lucide-react';

export function TermsOfUse() {
  return (
    <Layout>
      <PageMeta
        title="Terms of Use | Grow Motivational"
        description="Terms of Use for the Grow Motivational website — acceptable use, intellectual property, medical advice disclaimers, AI tool limitations, and emergency services direction."
        ogUrl="https://www.growmotivational.com/terms-of-use"
      />

      <div className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Placeholder Notice */}
          <div className="mb-10 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/80">
              <strong className="text-amber-200">Placeholder Document.</strong> These Terms of Use are a professional draft and placeholder. They have not been reviewed by legal counsel and do not constitute legal advice. Grow Motivational, LLC will replace this with fully reviewed and finalized terms before launching any paid products, user accounts, or digital services that collect personal data.
            </div>
          </div>

          <h1 className="text-4xl font-heading font-bold mb-3">Terms of Use</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: July 25, 2026 (Draft — Placeholder)</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-10 [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:text-foreground [&_h2]:mb-4 [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-base [&_h3]:text-foreground [&_h3]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_li]:leading-relaxed">

            <section>
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing or using the website located at <strong className="text-foreground">growmotivational.com</strong> (the "Site"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, you must not access or use the Site. These Terms apply to all visitors, users, and others who access or use the Site.
              </p>
              <p>
                Grow Motivational, LLC reserves the right to update or modify these Terms at any time. Continued use of the Site after any such changes shall constitute your consent to such changes.
              </p>
            </section>

            <section>
              <h2>2. Acceptable Use</h2>
              <p>You agree to use this Site only for lawful purposes and in a manner that does not infringe the rights of others or restrict their use. Prohibited activities include but are not limited to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Attempting to gain unauthorized access to any portion of the Site or related systems</li>
                <li>Transmitting spam, malware, or other harmful content</li>
                <li>Harvesting or collecting personal information from the Site without authorization</li>
                <li>Using automated tools (bots, scrapers) to access or download content without our written consent</li>
                <li>Impersonating Grow Motivational or any of its employees, partners, or affiliates</li>
                <li>Submitting false, misleading, or fraudulent information through any form</li>
                <li>Submitting personal health information (PHI), medical records, or sensitive clinical data through our contact or inquiry forms</li>
                <li>Using the Site in any way that could disable, overburden, damage, or impair its functionality</li>
              </ul>
            </section>

            <section>
              <h2>3. Intellectual Property</h2>
              <p>
                All content on this Site — including but not limited to text, articles, course descriptions, graphics, logos, icons, images, audio clips, digital downloads, and software — is the property of Grow Motivational, LLC or its content suppliers and is protected by applicable intellectual property laws.
              </p>
              <p>
                You are granted a limited, non-exclusive, non-transferable license to access and view the Site and its content for your personal, non-commercial use. You may not reproduce, distribute, modify, create derivative works from, publicly display, publicly perform, republish, download, store, or transmit any material from the Site without the prior written consent of Grow Motivational, LLC, except as follows:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your computer may temporarily store copies of materials incidental to your accessing and viewing those materials</li>
                <li>You may store files that are automatically cached by your web browser for display enhancement purposes</li>
                <li>You may print or download a reasonable number of pages of the Site for your own personal, non-commercial use, provided you do not modify them or delete any copyright or proprietary notices</li>
              </ul>
            </section>

            <section>
              <h2>4. No Medical Advice</h2>
              <p>
                <strong className="text-foreground">The content on this Site is for educational and informational purposes only.</strong> It does not constitute medical advice, diagnosis, or treatment. Nothing on this Site should be interpreted as professional medical, clinical, psychiatric, psychological, or therapeutic advice. The information provided is general in nature and may not apply to your individual situation.
              </p>
              <p>
                Always seek the advice of your physician, licensed mental health professional, or other qualified healthcare provider with any questions you may have regarding a medical or mental health condition, substance use disorder, or treatment plan. Never disregard professional medical advice or delay seeking it because of something you have read on this Site.
              </p>
            </section>

            <section>
              <h2>5. AI Tool Limitations</h2>
              <p>
                Grow Motivational may offer or describe AI-powered tools — including the AI guidance feature in the Grow Motivational app (when launched) — for educational and supportive purposes. These tools are subject to important limitations:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>AI tools are not a substitute for licensed clinical care, therapy, counseling, or medical treatment</li>
                <li>AI-generated responses may be inaccurate, incomplete, or not appropriate for your individual situation</li>
                <li>AI tools are not designed to handle mental health crises, suicidal ideation, or medical emergencies</li>
                <li>AI tools do not establish a therapeutic relationship or any duty of care</li>
                <li>You should not rely on AI tools as your primary or sole source of support during a crisis</li>
              </ul>
              <p>
                Grow Motivational, LLC makes no warranties regarding the accuracy, completeness, reliability, suitability, or availability of any AI-generated content.
              </p>
            </section>

            <section>
              <h2>6. Emergency Services Direction</h2>
              <div className="p-5 rounded-xl bg-red-950/30 border border-red-500/30 my-4">
                <p className="text-red-200 font-medium">
                  If you are experiencing a mental health crisis, thoughts of suicide or self-harm, or a medical emergency, <strong>do not use this website or any AI tool for help</strong>. Contact emergency services immediately:
                </p>
                <ul className="mt-3 space-y-1 text-red-200/90">
                  <li>• <strong>911</strong> — Emergency services (US)</li>
                  <li>• <strong>988</strong> — Suicide & Crisis Lifeline (call or text, 24/7)</li>
                  <li>• <strong>1-800-662-4357</strong> — SAMHSA National Helpline (substance use, 24/7, free, confidential)</li>
                  <li>• <strong>Crisis Text Line</strong> — Text HOME to 741741</li>
                </ul>
              </div>
            </section>

            <section>
              <h2>7. HIPAA Notice</h2>
              <p>
                Grow Motivational, LLC is an educational content and media organization. We have not assessed, and do not currently claim to be compliant with, the Health Insurance Portability and Accountability Act (HIPAA). Our Site and services are not designed, configured, or certified to handle Protected Health Information (PHI).
              </p>
              <p>
                <strong className="text-foreground">Do not submit PHI, clinical data, patient records, or any health-related information about yourself or any third party through any form or communication channel on this Site.</strong>
              </p>
              <p>
                If Grow Motivational or its affiliated entities (SunriseOS) introduce services that trigger HIPAA obligations, appropriate compliance measures, Business Associate Agreements (BAAs), and updated notices will be published and applicable parties notified prior to such services going live.
              </p>
            </section>

            <section>
              <h2>8. Disclaimers of Warranties</h2>
              <p>
                THE SITE AND ALL CONTENT ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
              </p>
              <p>
                Grow Motivational, LLC does not warrant that: (a) the Site will function uninterrupted, secure, or error-free; (b) the results that may be obtained from the use of the Site will be accurate or reliable; or (c) the quality of any content, information, or other material obtained through the Site will meet your expectations.
              </p>
            </section>

            <section>
              <h2>9. Limitation of Liability</h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL GROW MOTIVATIONAL, LLC, ITS DIRECTORS, EMPLOYEES, PARTNERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE SITE OR ITS CONTENT.
              </p>
            </section>

            <section>
              <h2>10. Third-Party Links</h2>
              <p>
                The Site may contain links to third-party websites for your convenience and informational purposes. These links do not constitute an endorsement of such sites or their content. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them. External links, including to the future SunriseOS platform domain, will open in a new browser tab.
              </p>
            </section>

            <section>
              <h2>11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Maryland, without giving effect to any principles of conflicts of law. Any legal action or proceeding arising out of or relating to these Terms shall be instituted in a federal or state court in Montgomery County, Maryland.
              </p>
            </section>

            <section>
              <h2>12. Contact</h2>
              <p>Questions about these Terms of Use may be directed to:</p>
              <div className="mt-4 p-5 rounded-xl bg-card border border-border text-sm">
                <p className="font-semibold text-foreground mb-2">Grow Motivational, LLC</p>
                <p>100 Recovery Way, Suite 200</p>
                <p>Rockville, MD 20850</p>
                <p className="mt-2"><a href="mailto:legal@growmotivational.com" className="text-primary hover:underline">legal@growmotivational.com</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
}
