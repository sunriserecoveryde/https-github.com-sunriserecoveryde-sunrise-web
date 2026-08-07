/**
 * rotate-browser-test-credentials.mjs
 *
 * Phase 3 v8 — credential rotation helper.
 *
 * Generates a fresh argon2id password hash for all 8 browser-test accounts
 * and revokes every live session for those accounts.
 *
 * Usage (run from workspace root):
 *   NEW_PWD=$(openssl rand -hex 16) \
 *   DATABASE_URL="$DATABASE_URL" \
 *   node artifacts/sunrise-os/readiness/scripts/rotate-browser-test-credentials.mjs
 *
 * After running, verify with:
 *   node -e "require('argon2').verify(hash, process.env.NEW_PWD).then(ok=>console.log('ok',ok))"
 *
 * The new password is read from NEW_PWD env var.  On success, this script
 * prints "ROTATION COMPLETE" without echoing the password value.
 */

import argon2 from "argon2";
import pg from "pg";

const { Pool } = pg;

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost:   3,
  parallelism: 1,
};

// The 8 browser-test account emails (must match authSeed.ts)
const BROWSER_TEST_EMAILS = [
  "clinician@test.sunrise",
  "nurse@test.sunrise",
  "supervisor@test.sunrise",
  "other-facility@test.sunrise",
  "security-admin@test.sunrise",
  "hr@test.sunrise",
  "billing@test.sunrise",
  "multi-fac@test.sunrise",
];

async function main() {
  const newPwd = process.env.NEW_PWD;
  if (!newPwd || newPwd.length < 12) {
    console.error("ABORT: NEW_PWD env var must be set to a string of ≥12 characters.");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("ABORT: DATABASE_URL env var is required.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl, max: 2 });

  console.log("[rotate] Hashing new password with argon2id …");
  const passwordHash = await argon2.hash(newPwd, ARGON2_OPTIONS);

  console.log("[rotate] Updating password_hash for", BROWSER_TEST_EMAILS.length, "accounts …");
  for (const email of BROWSER_TEST_EMAILS) {
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW()
       WHERE email = $2
       RETURNING id, email`,
      [passwordHash, email],
    );
    if (result.rowCount === 0) {
      console.warn(`  [WARN] No user found for ${email} — account may not be seeded yet.`);
    } else {
      console.log(`  updated: ${result.rows[0].email} (id=${result.rows[0].id})`);
    }
  }

  console.log("[rotate] Revoking all live sessions for browser-test accounts …");
  const revokeResult = await pool.query(
    `DELETE FROM sessions
     WHERE sess::jsonb->'passport'->'user'->>'email' = ANY($1::text[])`,
    [BROWSER_TEST_EMAILS],
  );
  console.log(`  revoked: ${revokeResult.rowCount} session(s)`);

  // Also revoke via user_id join (if sessions table stores user_id directly)
  const revokeById = await pool.query(
    `DELETE FROM sessions
     WHERE (sess::jsonb->'passport'->'user'->>'userId')::uuid IN (
       SELECT id FROM users WHERE email = ANY($1::text[])
     )`,
    [BROWSER_TEST_EMAILS],
  );
  console.log(`  revoked (by userId): ${revokeById.rowCount} additional session(s)`);

  await pool.end();

  console.log("\n[rotate] ROTATION COMPLETE");
  console.log("  Accounts updated :", BROWSER_TEST_EMAILS.length);
  console.log("  Sessions revoked  : confirmed above");
  console.log("  Next step         : run tests with PHASE2D_TEST_PASSWORD=<new-value>");
}

main().catch(err => {
  console.error("[rotate] ERROR:", err.message);
  process.exit(1);
});
