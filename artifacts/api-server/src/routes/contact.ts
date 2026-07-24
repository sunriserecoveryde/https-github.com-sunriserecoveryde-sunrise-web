import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  facility: z.string().min(1).max(300),
  bedCount: z.string().max(50).optional().default(""),
  message: z.string().max(2000).optional().default(""),
  plan: z.string().max(100).optional().default(""),
  // Honeypot — bots fill it in; real users never see it
  website: z.string().optional().default(""),
});

// In-memory lead store — swap for a DB write or email send once you
// wire up a transactional email provider (e.g. Postmark, SendGrid, Resend).
const leads: Array<{ receivedAt: string; data: z.infer<typeof ContactSchema> }> = [];

router.post("/contact", (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid form data", details: parsed.error.flatten() });
    return;
  }

  // Honeypot: silently discard if a bot filled in the hidden field
  if (parsed.data.website) {
    res.json({ ok: true });
    return;
  }

  const lead = { receivedAt: new Date().toISOString(), data: parsed.data };
  leads.push(lead);

  logger.info(
    {
      name: lead.data.name,
      email: lead.data.email,
      facility: lead.data.facility,
      bedCount: lead.data.bedCount,
      plan: lead.data.plan,
      receivedAt: lead.receivedAt,
    },
    "Demo request received — forward to sales@getsunriseos.com",
  );

  res.json({ ok: true });
});


export default router;
