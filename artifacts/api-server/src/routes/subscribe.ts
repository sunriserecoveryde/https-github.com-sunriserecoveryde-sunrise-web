import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { notifyTeam, sendConfirmation, buildNotificationHtml } from "../lib/email";

const router: IRouter = Router();

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const baseSchema = z.object({
  formType: z.enum([
    "general",
    "recovery-resources",
    "family-resources",
    "professional-training",
    "new-publications",
    "app-interest",
    "sunriseos-demo",
    "partnership",
    "contact",
  ]),
  firstName: z.string().min(1).max(100),
  email: z.string().email().max(300),
  // Optional fields used by some form types
  lastName: z.string().max(100).optional().default(""),
  organization: z.string().max(200).optional().default(""),
  title: z.string().max(100).optional().default(""),
  phone: z.string().max(50).optional().default(""),
  // Partnership
  partnerType: z.string().max(100).optional().default(""),
  goals: z.string().max(5000).optional().default(""),
  // App interest
  audienceType: z.string().max(100).optional().default(""),
  featuresOfInterest: z.array(z.string().max(100)).max(20).optional().default([]),
  // Contact form
  reason: z.string().max(100).optional().default(""),
  message: z.string().max(5000).optional().default(""),
  // Honeypot — bots fill it; real users never see it
  website: z.string().optional().default(""),
});

type SubscribePayload = z.infer<typeof baseSchema>;

// ── Human-readable labels for each form type ────────────────────────────────

const formLabels: Record<SubscribePayload["formType"], string> = {
  "general": "General Newsletter",
  "recovery-resources": "Recovery Resources Updates",
  "family-resources": "Family & Loved Ones Resources",
  "professional-training": "Professional Training Announcements",
  "new-publications": "New Publications",
  "app-interest": "Grow Motivational App — Early Access",
  "sunriseos-demo": "SunriseOS Demo Request",
  "partnership": "Partnership Inquiry",
  "contact": "General Contact",
};

// Confirmation email copy per form type
const confirmationCopy: Record<SubscribePayload["formType"], { subject: string; body: string }> = {
  "general": {
    subject: "You're subscribed to the Grow Motivational Newsletter",
    body: "Thanks for subscribing! You'll hear from us when we publish new content, courses, and organizational news.",
  },
  "recovery-resources": {
    subject: "You're signed up for Recovery Resources Updates",
    body: "You're on the list! We'll notify you when we publish new worksheets, guides, audio resources, and recovery tools.",
  },
  "family-resources": {
    subject: "You're signed up for Family & Loved Ones Resources",
    body: "Thanks for signing up. We'll send you educational content, support guides, and family wellness tools.",
  },
  "professional-training": {
    subject: "You're signed up for Professional Training Announcements",
    body: "You're on the list! We'll notify you about new CEU courses, clinical training programs, and professional development opportunities.",
  },
  "new-publications": {
    subject: "You'll be notified about New Publications",
    body: "Thanks for signing up. We'll let you know when we release new books, workbooks, treatment manuals, and journals.",
  },
  "app-interest": {
    subject: "You're on the Early Access List — Grow Motivational App",
    body: "You're on the early access list! We'll reach out as soon as the Grow Motivational app is ready for beta users. Thank you for your interest.",
  },
  "sunriseos-demo": {
    subject: "We received your SunriseOS Demo Request",
    body: "Thank you for your interest in SunriseOS! A member of our team will reach out within 2 business days to schedule a personalized demo.",
  },
  "partnership": {
    subject: "We received your Partnership Inquiry",
    body: "Thank you for reaching out about a partnership. Our partnerships team will review your submission and follow up within 3 business days.",
  },
  "contact": {
    subject: "We received your message — Grow Motivational",
    body: "Thank you for reaching out! Our team will review your inquiry and respond within 2 business days.",
  },
};

function buildConfirmationHtml(firstName: string, formType: SubscribePayload["formType"]): string {
  const { body } = confirmationCopy[formType];
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#4f46e5">Grow Motivational</h2>
<p>Hi ${firstName},</p>
<p>${body}</p>
<p>You can unsubscribe at any time by replying to this email with the word "unsubscribe."</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="color:#6b7280;font-size:12px">Grow Motivational &nbsp;·&nbsp; 100 Recovery Way, Suite 200, Rockville, MD 20850<br/>
This email was sent because you submitted a form at growmotivational.com.</p>
</body></html>`;
}

// ── Route ────────────────────────────────────────────────────────────────────

router.post("/subscribe", async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid form data", details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;

  // Honeypot: silently discard bot submissions
  if (data.website) {
    res.json({ ok: true });
    return;
  }

  const label = formLabels[data.formType];

  // Always log so leads are never silently lost, even without an email provider
  logger.info(
    {
      formType: data.formType,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName || undefined,
      organization: data.organization || undefined,
      partnerType: data.partnerType || undefined,
      audienceType: data.audienceType || undefined,
      reason: data.reason || undefined,
    },
    `Form submission received — ${label}`,
  );

  // Build the team notification fields
  const notifyFields: Record<string, string | undefined> = {
    "Form Type": label,
    "First Name": data.firstName,
    "Last Name": data.lastName || undefined,
    "Email": data.email,
    "Phone": data.phone || undefined,
    "Organization": data.organization || undefined,
    "Title / Role": data.title || undefined,
    "Partner Type": data.partnerType || undefined,
    "Who They Are": data.audienceType || undefined,
    "Features of Interest": data.featuresOfInterest?.join(", ") || undefined,
    "Contact Reason": data.reason || undefined,
    "Goals / Message": (data.goals || data.message) || undefined,
  };

  // Fire emails concurrently — failures are caught inside sendEmail/notifyTeam
  await Promise.all([
    notifyTeam(
      `[Grow Motivational] New ${label} — ${data.firstName} ${data.lastName || ""}`.trim(),
      buildNotificationHtml(`New ${label}`, notifyFields),
      data.email,
    ),
    sendConfirmation(
      data.email,
      confirmationCopy[data.formType].subject,
      buildConfirmationHtml(data.firstName, data.formType),
    ),
  ]);

  res.json({ ok: true });
});

export default router;
