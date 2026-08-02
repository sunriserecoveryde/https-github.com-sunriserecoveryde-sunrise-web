/**
 * requireIdentity — Express middleware that enforces the presence of a resolved
 * identity before any /api/v1 route handler runs.
 *
 * In development (NODE_ENV !== 'production'):
 *   devIdentityMiddleware runs first and always sets req.devIdentity.
 *   This middleware then calls next().
 *
 * In production (NODE_ENV === 'production'):
 *   devIdentityMiddleware is NOT registered (see app.ts).
 *   req.devIdentity is therefore never set.
 *   This middleware returns 401 for every /api/v1 request.
 *   Phase 2 will replace this with a real JWT / session auth layer.
 *
 * ⚠️  This is a Phase 1A placeholder.  In production the response is always
 *     401 — no real auth token is accepted yet.
 */

import { Request, Response, NextFunction } from "express";

export function requireIdentity(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.devIdentity) {
    // No identity was attached (production: devIdentityMiddleware not registered).
    // Return 401 — do NOT reveal whether a dev-identity header was present.
    res.status(401).json({
      error: "Authentication required",
    });
    return;
  }
  next();
}
