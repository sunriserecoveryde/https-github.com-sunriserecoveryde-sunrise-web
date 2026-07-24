import { logger } from "./logger";

/**
 * Dedup map: IP → timestamp of the last alert sent.
 * Cleared automatically once the entry ages past WINDOW_MS so the next
 * burst from the same IP triggers a fresh alert.
 */
const alertedIps = new Map<string, number>();

/** Match the rate-limiter window so we re-alert after the window resets. */
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Notify the team that an IP has hit the contact-form rate limit.
 * - Suppresses duplicate alerts for the same IP within the window.
 * - Posts to Slack if SLACK_WEBHOOK_URL is set; otherwise emits a
 *   prominent logger.warn so the event is always visible in logs.
 */
export async function notifySpamAlert(ip: string): Promise<void> {
  const now = Date.now();

  // Prune stale entries
  for (const [key, ts] of alertedIps) {
    if (now - ts > WINDOW_MS) alertedIps.delete(key);
  }

  // Suppress duplicates within the window
  if (alertedIps.has(ip)) return;
  alertedIps.set(ip, now);

  const timestamp = new Date(now).toISOString();
  const message = `🚨 Contact-form rate limit hit — IP: ${ip} at ${timestamp}`;

  logger.warn({ ip, timestamp }, "Contact-form spam alert: rate limit triggered");

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return; // No webhook configured; log-only mode

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Contact-form rate limit triggered*\n• IP: \`${ip}\`\n• Time: ${timestamp}\n• Action: requests from this IP are being blocked for the next hour.`,
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      logger.error(
        { status: res.status, ip },
        "Slack spam alert webhook returned a non-OK status",
      );
    }
  } catch (err) {
    logger.error({ err, ip }, "Failed to send Slack spam alert");
  }
}
