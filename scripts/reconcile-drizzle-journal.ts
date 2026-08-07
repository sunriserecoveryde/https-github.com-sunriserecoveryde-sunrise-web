/**
 * scripts/reconcile-drizzle-journal.ts
 *
 * Guarded Drizzle journal reconciliation script for Sunrise OS.
 *
 * Purpose:
 *   This script corrects the `created_at` timestamps stored in
 *   `drizzle.__drizzle_migrations` to match the canonical `when` values in
 *   `lib/db/drizzle/meta/_journal.json`.  It NEVER executes migration SQL.
 *
 * Why this is needed:
 *   Migrations 0000–0002 were initially applied when the journal `when` values
 *   reflected the time of the Phase 1/2 reconciliation work (timestamps in
 *   2026), while migrations 0003–0006 have `when` values from July–August 2025.
 *   Because Drizzle-kit skips journal entries where `when` < max(`created_at`),
 *   this drift causes the runner to silently skip newer migrations on any DB
 *   that already has 0000–0002 applied.
 *
 *   After running this script:
 *   - All `created_at` values match the journal's `when` values exactly.
 *   - `drizzle-kit migrate` can be used to apply any new migrations normally.
 *
 * Safety guarantees:
 *   1. Reads all SQL files and verifies their SHA-256 hashes match known values.
 *   2. Verifies each migration's schema fingerprint (key objects) exists in the DB.
 *   3. Only corrects `created_at` — never modifies `hash` or migration SQL.
 *   4. Inserts a missing journal row only when the full schema fingerprint is present.
 *   5. Refuses to run when ANY required schema object is absent.
 *   6. Refuses to run when unknown rows exist in `__drizzle_migrations`.
 *   7. Idempotent — running it twice produces the same result.
 *   8. Produces sanitized output (no credentials, no patient data).
 *
 * Usage:
 *   DATABASE_URL=<connection-string> pnpm tsx scripts/reconcile-drizzle-journal.ts
 *
 * Run on a clone first. After reconciliation, verify with:
 *   pnpm --filter @workspace/db migrate
 *   (should report: "No migrations to run.")
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Client } from "pg";

// ── Configuration ─────────────────────────────────────────────────────────────

const DRIZZLE_DIR = path.join(__dirname, "../lib/db/drizzle");
const JOURNAL_PATH = path.join(DRIZZLE_DIR, "meta/_journal.json");

// Canonical SHA-256 hashes for each migration SQL file.
// Any mismatch aborts reconciliation — the file was tampered with.
const KNOWN_HASHES: Record<string, string> = {
  "0000_perpetual_rafael_vega.sql":             "d469974922cc3fc74bbd81e20697f39d9732ae09456fc01871f6c210e4138c1c",
  "0001_authentication_authorization.sql":       "86b492875afcbdfe10daf7867f66fb31930148fe42c10fd33527c7809d34508d",
  "0002_authorization_correction.sql":           "8b64783c95ef5bace0826342cac4e007252c7faac029de5914de88f20b83050d",
  "0003_phase_2c_closure.sql":                   "2ad2d880dfe87b3b331459a50b8ddf8ec3c9dd7c76bf26edd297ea887d9af3a6",
  "0004_phase_2d_final_closure.sql":             "4584ae4def09750eb69fe431348e16b59e6a873c55a71147c7c8020db65240d4",
  "0005_rate_limit_window_cleared_event.sql":    "1694a931db81b17ef306132f5e916dd57f725a7f849a18d991da930eb8b00a4d",
  "0006_clinical_documentation_foundation.sql":  "83072a363b079a404b4286eb1eec2fe637796d0aa905760146cd79db6ed50c0f",
};

// Schema fingerprint verification: each migration must prove its objects exist.
// These checks run before any journal row is inserted or updated.
type SchemaCheck = { type: "table" | "column" | "index" | "trigger"; sql: string; label: string };

const MIGRATION_FINGERPRINTS: Record<string, SchemaCheck[]> = {
  "0000_perpetual_rafael_vega.sql": [
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_organizations'",  label: "table:sos_organizations" },
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_facilities'",     label: "table:sos_facilities" },
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_patients'",       label: "table:sos_patients" },
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_episodes_of_care'", label: "table:sos_episodes_of_care" },
  ],
  "0001_authentication_authorization.sql": [
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_user_accounts'",  label: "table:sos_user_accounts" },
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_sessions'",       label: "table:sos_sessions" },
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_auth_audit'",     label: "table:sos_auth_audit" },
  ],
  "0002_authorization_correction.sql": [
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_role_assignments'", label: "table:sos_role_assignments" },
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_patient_access'",  label: "table:sos_patient_access" },
    { type: "column",  sql: "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sos_organizations' AND column_name='slug'", label: "column:sos_organizations.slug" },
  ],
  "0003_phase_2c_closure.sql": [
    { type: "trigger", sql: "SELECT 1 FROM information_schema.triggers WHERE trigger_schema='public' AND trigger_name='sos_audit_no_update' AND event_object_table='sos_auth_audit'", label: "trigger:sos_audit_no_update" },
    { type: "trigger", sql: "SELECT 1 FROM information_schema.triggers WHERE trigger_schema='public' AND trigger_name='sos_audit_no_delete' AND event_object_table='sos_auth_audit'", label: "trigger:sos_audit_no_delete" },
  ],
  "0004_phase_2d_final_closure.sql": [
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_staff_profiles'", label: "table:sos_staff_profiles" },
    { type: "column",  sql: "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sos_sessions' AND column_name='user_id'", label: "column:sos_sessions.user_id" },
  ],
  "0005_rate_limit_window_cleared_event.sql": [
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_rate_limit_windows'", label: "table:sos_rate_limit_windows" },
  ],
  "0006_clinical_documentation_foundation.sql": [
    { type: "table",   sql: "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sos_clinical_notes'", label: "table:sos_clinical_notes" },
    { type: "column",  sql: "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sos_clinical_notes' AND column_name='signed_at'", label: "column:sos_clinical_notes.signed_at" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sha256File(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function log(msg: string): void {
  console.log(`[reconcile] ${msg}`);
}

function abort(msg: string): never {
  console.error(`[reconcile] ABORT: ${msg}`);
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) abort("DATABASE_URL environment variable is required");

  log("Starting Drizzle journal reconciliation (read-verify-correct only).");
  log("This script corrects timestamps — it NEVER executes migration SQL.");
  log("");

  // ── 1. Read and verify _journal.json ──────────────────────────────────────
  if (!fs.existsSync(JOURNAL_PATH)) abort(`Journal not found: ${JOURNAL_PATH}`);

  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf8")) as {
    entries: { idx: number; when: number; tag: string }[];
  };

  if (!Array.isArray(journal.entries) || journal.entries.length !== 7) {
    abort(`Expected 7 journal entries, found ${journal.entries?.length ?? 0}`);
  }

  log(`Journal loaded: ${journal.entries.length} entries (0000–0006)`);

  // ── 2. Verify SQL file hashes ──────────────────────────────────────────────
  log("Verifying SQL file SHA-256 hashes...");

  for (const [filename, expectedHash] of Object.entries(KNOWN_HASHES)) {
    const filePath = path.join(DRIZZLE_DIR, filename);
    if (!fs.existsSync(filePath)) abort(`SQL file missing: ${filename}`);
    const actual = sha256File(filePath);
    if (actual !== expectedHash) {
      abort(`SHA-256 mismatch for ${filename}. Expected ${expectedHash}, got ${actual}. Migration file was altered.`);
    }
    log(`  ✓ ${filename}`);
  }

  // ── 3. Build expected rows (from journal) ─────────────────────────────────
  // Map from SQL filename → expected { hash, when }
  const expectedByFilename: Record<string, { hash: string; when: number; tag: string; idx: number }> = {};
  for (const entry of journal.entries) {
    const filename = `${entry.tag}.sql`;
    expectedByFilename[filename] = {
      hash: KNOWN_HASHES[filename]!,
      when: entry.when,
      tag:  entry.tag,
      idx:  entry.idx,
    };
  }

  // ── 4. Connect to DB ───────────────────────────────────────────────────────
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  log("Connected to database.");

  try {
    // ── 5. Read existing journal rows ────────────────────────────────────────
    const result = await client.query<{ id: number; hash: string; created_at: string }>(
      `SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`,
    );
    const dbRows = result.rows;
    log(`Found ${dbRows.length} row(s) in drizzle.__drizzle_migrations`);

    // ── 6. Verify no unknown rows exist ───────────────────────────────────────
    const knownHashes = new Set(Object.values(KNOWN_HASHES));
    for (const row of dbRows) {
      if (!knownHashes.has(row.hash)) {
        abort(`Unknown hash in __drizzle_migrations (row id=${row.id}): ${row.hash}. Manual investigation required.`);
      }
    }

    // ── 7. Verify each migration's schema fingerprint ─────────────────────────
    log("Verifying schema fingerprints...");
    for (const [filename, checks] of Object.entries(MIGRATION_FINGERPRINTS)) {
      const expected = expectedByFilename[filename];
      if (!expected) continue;
      for (const check of checks) {
        const r = await client.query(check.sql);
        if (r.rowCount === 0) {
          abort(`Schema fingerprint failed for ${filename}: ${check.label} not found. Cannot reconcile — migration may not have been applied.`);
        }
        log(`  ✓ ${filename}: ${check.label}`);
      }
    }

    // ── 8. Correct timestamps and insert missing rows ─────────────────────────
    let corrected = 0;
    let inserted  = 0;
    let unchanged = 0;

    for (const [filename, expected] of Object.entries(expectedByFilename)) {
      const existingRow = dbRows.find((r) => r.hash === expected.hash);

      if (existingRow) {
        const dbWhen = parseInt(existingRow.created_at, 10);
        if (dbWhen !== expected.when) {
          log(`Correcting timestamp for ${filename}: ${dbWhen} → ${expected.when}`);
          await client.query(
            `UPDATE drizzle.__drizzle_migrations SET created_at = $1 WHERE id = $2`,
            [expected.when.toString(), existingRow.id],
          );
          corrected++;
        } else {
          log(`  ✓ ${filename}: timestamp already correct (${expected.when})`);
          unchanged++;
        }
      } else {
        // Schema is verified present (step 7 passed). Safe to insert.
        log(`Inserting missing journal row for ${filename} (when=${expected.when})`);
        await client.query(
          `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
          [expected.hash, expected.when.toString()],
        );
        inserted++;
      }
    }

    // ── 9. Final verification ─────────────────────────────────────────────────
    const finalResult = await client.query<{ id: number; hash: string; created_at: string }>(
      `SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`,
    );

    if (finalResult.rows.length !== 7) {
      abort(`Post-reconciliation row count is ${finalResult.rows.length}, expected 7. Manual review required.`);
    }

    log("");
    log("── Final state of drizzle.__drizzle_migrations ──────────────────────────");
    for (const row of finalResult.rows) {
      const file = Object.entries(KNOWN_HASHES).find(([, h]) => h === row.hash)?.[0] ?? "unknown";
      log(`  id=${row.id}  when=${row.created_at}  file=${file}`);
    }

    log("");
    log(`Reconciliation complete:`);
    log(`  Timestamps corrected : ${corrected}`);
    log(`  Rows inserted        : ${inserted}`);
    log(`  Already correct      : ${unchanged}`);
    log(`  Total rows           : ${finalResult.rows.length}`);
    log("");
    log("RESULT: drizzle.__drizzle_migrations is consistent with _journal.json.");
    log("Run 'pnpm --filter @workspace/db migrate' to verify no pending migrations.");

  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("[reconcile] Fatal error:", err);
  process.exit(1);
});
