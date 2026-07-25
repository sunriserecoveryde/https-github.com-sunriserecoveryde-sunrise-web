import { Resend } from "resend";
import { logger } from "./logger";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Grow Motivational <onboarding@resend.dev>";
const NOTIFY_EMAIL =
  process.env.NOTIFY_EMAIL ?? "info@growmotivational.com";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send a single email. Logs a warning (never throws) when Resend is not
 * configured so submissions are never silently lost — they always appear
 * in server logs regardless of email config.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!resend) {
    logger.warn(
      { to: payload.to, subject: payload.subject },
      "RESEND_API_KEY not set — email not sent (set it to enable real delivery)",
    );
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      logger.error({ error, to: payload.to }, "Resend API returned an error");
    } else {
      logger.info({ to: payload.to, subject: payload.subject }, "Email sent");
    }
  } catch (err) {
    logger.error({ err, to: payload.to }, "Failed to send email via Resend");
  }
}

/** Send a team notification email with form submission data. */
export async function notifyTeam(subject: string, html: string, replyTo?: string) {
  return sendEmail({ to: NOTIFY_EMAIL, subject, html, replyTo });
}

/** Send a confirmation email to the submitter. */
export async function sendConfirmation(to: string, subject: string, html: string) {
  return sendEmail({ to, subject, html });
}

function row(label: string, value: string | undefined) {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px;color:#6b7280;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 12px">${value}</td></tr>`;
}

/** Render a simple table of key/value pairs into a consistent HTML email body. */
export function buildNotificationHtml(
  title: string,
  fields: Record<string, string | undefined>,
): string {
  const rows = Object.entries(fields)
    .map(([k, v]) => row(k, v))
    .join("");

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px">
<h2 style="margin-bottom:4px">${title}</h2>
<p style="color:#6b7280;margin-top:0">Received ${new Date().toUTCString()}</p>
<table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
<tbody>${rows}</tbody>
</table>
<p style="color:#6b7280;font-size:12px;margin-top:24px">This message was generated automatically by growmotivational.com.</p>
</body></html>`;
}
