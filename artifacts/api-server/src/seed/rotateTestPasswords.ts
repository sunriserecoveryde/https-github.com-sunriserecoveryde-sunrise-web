/**
 * rotateTestPasswords.ts — Direct credential rotation script for Phase 3 v8.
 *
 * Run from workspace root with:
 *   cd artifacts/api-server
 *   NEW_PWD=<newpassword> node_modules/.bin/tsx src/seed/rotateTestPasswords.ts
 *
 * Updates password_hash for all 8 browser-test accounts and revokes their sessions.
 * Reports success/failure per account and session revocation count.
 * Does NOT print the password value.
 */

import * as argon2 from "argon2";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

const ARGON2_OPTIONS: argon2.HashOptions = {
  type:        argon2.argon2id,
  memoryCost:  65536,
  timeCost:    3,
  parallelism: 1,
};

const BROWSER_TEST_EMAILS = [
  "clinician@test.sunrise",
  "nurse@test.sunrise",
  "org-admin@test.sunrise",
  "other-facility@test.sunrise",
  "security-admin@test.sunrise",
  "hr@test.sunrise",
  "billing@test.sunrise",
  "multi-facility@test.sunrise",
];

async function main(): Promise<void> {
  const newPwd = process.env.NEW_PWD?.trim();
  if (!newPwd || newPwd.length < 8) {
    console.error("ABORT: NEW_PWD env var must be set to ≥8 characters.");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("ABORT: DATABASE_URL env var is required.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl, max: 2 });
  const db   = drizzle({ client: pool });

  console.log(`[rotate] Computing argon2id hash (pwd length=${newPwd.length}) …`);
  const passwordHash = await argon2.hash(newPwd, ARGON2_OPTIONS);
  console.log(`[rotate] Hash computed. Prefix: ${passwordHash.substring(0, 30)} …`);

  // Verify the hash immediately (smoke test)
  const verifyOk = await argon2.verify(passwordHash, newPwd);
  if (!verifyOk) {
    console.error("[rotate] ABORT: argon2.verify() returned false immediately after hashing. Something is wrong.");
    await pool.end();
    process.exit(1);
  }
  console.log("[rotate] Self-verify passed.");

  let updated = 0;
  for (const email of BROWSER_TEST_EMAILS) {
    const r = await db.execute(
      sql`UPDATE sos_user_accounts
          SET password_hash = ${passwordHash},
              failed_login_count = 0,
              locked_until = NULL,
              updated_at   = NOW()
          WHERE email = ${email}
          RETURNING id, email`,
    );
    if ((r as any).rows?.length) {
      const row = (r as any).rows[0];
      console.log(`  [update] ${row.email} (id=${row.id})`);
      updated++;
    } else {
      console.warn(`  [warn] No user found for ${email} — account may not be seeded.`);
    }
  }

  // Revoke sessions
  const revoke = await db.execute(
    sql`DELETE FROM sos_sessions
        WHERE user_id IN (
          SELECT id FROM sos_user_accounts
          WHERE email = ANY(${BROWSER_TEST_EMAILS}::text[])
        )`,
  );
  const revokedCount = (revoke as any).rowCount ?? 0;
  console.log(`[rotate] Sessions revoked: ${revokedCount}`);

  await pool.end();

  if (updated < BROWSER_TEST_EMAILS.length) {
    console.warn(`[rotate] WARNING: only ${updated}/${BROWSER_TEST_EMAILS.length} accounts updated.`);
    process.exit(1);
  }

  console.log(`\n[rotate] ROTATION COMPLETE`);
  console.log(`  Accounts updated : ${updated}/${BROWSER_TEST_EMAILS.length}`);
  console.log(`  Sessions revoked : ${revokedCount}`);
  console.log(`  Self-verify      : PASS`);
}

main().catch(err => {
  console.error("[rotate] ERROR:", err.message);
  process.exit(1);
});
