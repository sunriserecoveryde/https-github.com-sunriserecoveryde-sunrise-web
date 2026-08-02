import app from "./app";
import { logger } from "./lib/logger";
import { getAuditOutboxWorker } from "./lib/auditOutboxWorker";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Start the audit-outbox worker after the server is bound.
  // The worker performs a startup-recovery drain so any events that were
  // pending when the previous process was stopped are processed immediately.
  const worker = getAuditOutboxWorker();
  worker.start();

  // Graceful shutdown: stop the worker cleanly on SIGTERM / SIGINT.
  const shutdown = () => {
    worker.stop().then(() => process.exit(0)).catch(() => process.exit(1));
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT",  shutdown);
});
