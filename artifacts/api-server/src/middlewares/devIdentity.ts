/**
 * Dev-only identity adapter — Phase 1A placeholder for real authentication.
 *
 * In development mode (NODE_ENV !== 'production') this middleware reads
 * X-Dev-Org-Id and X-Dev-Facility-Id request headers and attaches them to
 * req.devIdentity.  If the headers are absent it falls back to the known
 * seed values so the app works out-of-the-box after running the seed script.
 *
 * In production mode this middleware is NOT registered and any route that
 * checks req.devIdentity will return 401.
 *
 * ⚠️ This adapter provides NO security.  It exists only to allow API
 * development before Phase 2 authentication is implemented.  It must be
 * removed or replaced entirely during Phase 2.
 */

import { Request, Response, NextFunction } from "express";

/** Seed values — these match the deterministic UUIDs used in developmentSeed.ts */
export const DEV_SEED_ORG_ID = "00000000-0000-4000-a000-000000000001";
export const DEV_SEED_FACILITY_ID = "00000000-0000-4000-a000-000000000002";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      devIdentity?: { orgId: string; facilityId: string | undefined };
    }
  }
}

export function devIdentityMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const orgId =
    (req.headers["x-dev-org-id"] as string | undefined) ?? DEV_SEED_ORG_ID;
  const facilityId =
    (req.headers["x-dev-facility-id"] as string | undefined) ?? DEV_SEED_FACILITY_ID;

  req.devIdentity = { orgId, facilityId };
  next();
}
