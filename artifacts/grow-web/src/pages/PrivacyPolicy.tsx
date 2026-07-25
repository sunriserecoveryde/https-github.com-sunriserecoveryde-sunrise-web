import { Layout } from '@/components/Layout';
import { PageMeta } from '@/components/PageMeta';
import { AlertTriangle } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <Layout>
      <PageMeta
        title="Privacy Policy | Grow Motivational"
        description="Grow Motivational Privacy Policy — how we collect, use, and protect your personal information."
        ogUrl="https://www.growmotivational.com/privacy-policy"
      />

      <div className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Placeholder Notice */}
          <div className="mb-10 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/80">
              <strong className="text-amber-200">Placeholder Document.</strong> This Privacy Policy is a professional draft and placeholder. It has not yet been reviewed by legal counsel and does not constitute legal advice. Grow Motivational, LLC will replace this with a fully reviewed and finalized policy before accepting user registrations, enabling any digital service that collects personal data, or launching any paid product.
            </div>
          </div>

          <h1 className="text-4xl font-heading font-bold mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: July 25, 2026 (Draft — Placeholder)</p>

          <div className="prose prose-invert prose-sm max-w-none space-y-10 [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:text-foreground [&_h2]:mb-4 [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-base [&_h3]:text-foreground [&_h3]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_li]:leading-relaxed">

            <section>
              <h2>1. Introduction</h2>
              <p>
                Grow Motivational, LLC ("Grow Motivational," "we," "us," or "our") operates the website located at <strong className="text-foreground">growmotivational.com</strong> (the "Site") and, in the future, the Grow Motivational mobile application (the "App"). This Privacy Policy describes how we collect, use, disclose, and protect information about you when you visit our Site, use our services, submit a contact form, or otherwise interact with us.
              </p>
              <p>
                By using our Site, you agree to the practices described in this Privacy Policy. If you do not agree, please discontinue use of the Site.
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              <h3>2a. Information You Provide to Us</h3>
              <p>We may collect personal information you provide voluntarily, including:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Name and email address (via newsletter sign-up or interest forms)</li>
                <li>Organization name, title, and phone number (via partnership or contact forms)</li>
                <li>Message content submitted through contact or inquiry forms</li>
                <li>Responses to interest surveys (e.g., audience type, features of interest)</li>
              </ul>
              <p>
                <strong className="text-foreground">Important:</strong> Our contact and inquiry forms are not intended for and must not be used to submit any personal health information (PHI), medical records, or sensitive clinical data. Do not include diagnoses, treatment details, or any information protected under HIPAA in your form submissions.
              </p>

              <h3>2b. Information Collected Automatically</h3>
              <p>When you visit our Site, we may automatically collect:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>IP address and general geographic location</li>
                <li>Browser type and version</li>
                <li>Pages visited, time on site, and referring URLs</li>
                <li>Device type and operating system</li>
              </ul>
              <p>This data is collected through standard web server logs and, in the future, analytics tools. It is used to understand how visitors use our Site and to improve our content and services.</p>

              <h3>2c. Cookies and Tracking Technologies</h3>
              <p>
                We may use cookies, web beacons, or similar technologies to enhance your experience, remember preferences, and analyze Site performance. You may set your browser to refuse cookies, though some features may not function properly if you do. We do not currently use advertising cookies or behavioral retargeting. A full cookie policy will be published prior to any deployment of advertising or tracking technologies.
              </p>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Respond to your inquiries, contact form submissions, and partnership requests</li>
                <li>Send newsletters, updates, and educational content you have opted into</li>
                <li>Notify you about product launches, events, or beta programs you have requested information about</li>
                <li>Improve our Site content, user experience, and educational offerings</li>
                <li>Comply with legal obligations and protect against fraudulent or harmful activity</li>
              </ul>
              <p>We will not use your personal information for purposes materially different from those described above without your consent.</p>
            </section>

            <section>
              <h2>4. How We Share Your Information</h2>
              <p>We do not sell, rent, or trade your personal information. We may share information in limited circumstances:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-foreground">Service Providers:</strong> We may share data with trusted vendors who assist us in operating the Site, sending communications, or providing services (e.g., email platforms, analytics providers). These vendors are contractually required to protect your data and use it only for the purposes we specify.</li>
                <li><strong className="text-foreground">The Sunrise Group Affiliates:</strong> We may share information within our affiliated entities (The Sunrise Group, SunriseOS) when relevant to your inquiry or when you have indicated interest in their services.</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required to do so by law, court order, or to protect the rights, safety, or property of Grow Motivational or others.</li>
              </ul>
            </section>

            <section>
              <h2>5. Data Retention</h2>
              <p>
                We retain personal information for as long as necessary to fulfill the purposes outlined in this policy, to respond to your inquiry, or as required by applicable law. Contact form data is retained for a reasonable period to allow for follow-up and relationship management. You may request deletion of your data at any time by contacting us at <a href="mailto:privacy@growmotivational.com" className="text-primary hover:underline">privacy@growmotivational.com</a>.
              </p>
            </section>

            <section>
              <h2>6. Data Security</h2>
              <p>
                We implement reasonable administrative, technical, and physical safeguards to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no internet transmission or electronic storage system is completely secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section>
              <h2>7. Children's Privacy</h2>
              <p>
                Our Site is not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us and we will promptly delete it.
              </p>
            </section>

            <section>
              <h2>8. HIPAA Notice</h2>
              <p>
                Grow Motivational, LLC is an educational content and media organization. As of the date of this policy, we have not assessed whether we qualify as a Covered Entity or Business Associate under HIPAA. We do not currently collect, process, store, or transmit Protected Health Information (PHI) and our systems are not configured or certified for PHI. Users must not submit any PHI through our contact forms, newsletter sign-ups, or any other feature of this Site.
              </p>
              <p>
                If and when we launch clinical technology features through our affiliated entity SunriseOS that may trigger HIPAA obligations, a separate, compliant Business Associate Agreement (BAA) and HIPAA Notice will be published and applicable users will be notified.
              </p>
            </section>

            <section>
              <h2>9. Third-Party Services and Links</h2>
              <p>
                Our Site may contain links to third-party websites or reference third-party services. We are not responsible for the privacy practices of those services. We encourage you to review the privacy policies of any third-party sites you visit. We do not control and are not responsible for the content or privacy practices of linked sites.
              </p>
            </section>

            <section>
              <h2>10. Your Rights and Choices</h2>
              <p>Depending on your location and applicable law, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of marketing communications at any time</li>
                <li>Lodge a complaint with a supervisory authority (if applicable in your jurisdiction)</li>
              </ul>
              <p>To exercise any of these rights, please contact us at <a href="mailto:privacy@growmotivational.com" className="text-primary hover:underline">privacy@growmotivational.com</a>.</p>
            </section>

            <section>
              <h2>11. Educational and Medical Disclaimer</h2>
              <p>
                All content on this Site — including articles, course descriptions, resource listings, podcasts, and publications — is provided for educational and informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making decisions about your health, recovery, or treatment plan. In an emergency, call 911 or the 988 Suicide & Crisis Lifeline.
              </p>
            </section>

            <section>
              <h2>12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we make material changes, we will post the updated policy on this page with a revised "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2>13. Contact Us</h2>
              <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="mt-4 p-5 rounded-xl bg-card border border-border text-sm">
                <p className="font-semibold text-foreground mb-2">Grow Motivational, LLC</p>
                <p>100 Recovery Way, Suite 200</p>
                <p>Rockville, MD 20850</p>
                <p className="mt-2"><a href="mailto:privacy@growmotivational.com" className="text-primary hover:underline">privacy@growmotivational.com</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
}
