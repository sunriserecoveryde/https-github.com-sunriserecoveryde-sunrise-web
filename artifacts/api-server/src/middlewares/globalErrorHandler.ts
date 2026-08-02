/**
 * Global Express error handler — last middleware in the chain.
 *
 * Must be registered AFTER all routers so it catches every unhandled next(err).
 * Must have exactly four parameters so Express recognises it as an error handler.
 *
 * Behaviour (both production AND development):
 *   → Always responds HTTP 500 with { error: "Internal Server Error" }.
 *   → Never includes err.message, err.stack, or any internal path in the body.
 *   → Full error detail (message + stack) is written to the structured logger
 *     where it can be captured by log aggregation without reaching the client.
 *
 * Rationale for always-500 (never preserving err.status):
 *   If an error has a meaningful HTTP status it should be caught by a specific
 *   handler before reaching this fallback (e.g. the CSRF 403 handler at §8a).
 *   Any error that reaches this handler is unhandled by definition; surfacing
 *   its status code would leak internal error classification to clients.
 */

import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Log the full error (message + stack) for observability — never put this in
  // the HTTP response.
  logger.error(
    { err, method: req.method, url: req.url?.split("?")[0] },
    "Unhandled route error",
  );

  // Always return a generic 500 with no internal detail — production or not.
  res.status(500).json({ error: "Internal Server Error" });
}
