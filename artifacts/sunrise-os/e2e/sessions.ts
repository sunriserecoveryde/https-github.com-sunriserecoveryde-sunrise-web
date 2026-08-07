/**
 * Shared session-file path constants.
 *
 * Both global-setup.ts (writer) and the spec file (reader) import from here
 * so the paths are defined in exactly one place.
 *
 * Sessions are written once per Playwright run in globalSetup and are
 * intentionally excluded from git (see .gitignore at project root).
 * They contain only localhost auth cookies for test personas — no
 * production credentials are ever stored here.
 */

import path   from "path";

const SESSIONS_DIR = path.join(import.meta.dirname, "sessions");

export { SESSIONS_DIR };

export const SESSION_PATHS = {
  clinician:     path.join(SESSIONS_DIR, "clinician.json"),
  nurse:         path.join(SESSIONS_DIR, "nurse.json"),
  supervisor:    path.join(SESSIONS_DIR, "supervisor.json"),
  otherFacility: path.join(SESSIONS_DIR, "other-facility.json"),
  securityAdmin: path.join(SESSIONS_DIR, "security-admin.json"),
  hr:            path.join(SESSIONS_DIR, "hr.json"),
  billing:       path.join(SESSIONS_DIR, "billing.json"),
  multiFac:      path.join(SESSIONS_DIR, "multi-facility.json"),
  bht:           path.join(SESSIONS_DIR, "bht.json"),
} as const;

export type PersonaKey = keyof typeof SESSION_PATHS;
