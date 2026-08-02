/**
 * Phase 2B — Clean Migration Proof (§11)
 *
 * Proves that all three migrations have been applied to the database and that
 * the resulting schema has the expected tables/indexes/triggers/constraints.
 * Also proves the 0002 migration is idempotent (re-running it does not error).
 *
 * Uses the shared pgPool from @workspace/db (same DB as the API server).
 *
 * Run: pnpm --filter @workspace/api-server test auth-p2b-migration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { pool as pgPool } from "@workspace/db";

const MIGRATION_DIR = path.join(process.cwd(), "../../lib/db/drizzle");

// ── Helpers ───────────────────────────────────────────────────────────────────

type QueryRow = Record<string, unknown>;

async function queryOne<T extends QueryRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const result = await pgPool.query<T>(sql, params as never[]);
  return result.rows[0] ?? null;
}

async function tableExists(tableName: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  );
  return row?.exists ?? false;
}

async function indexExists(indexName: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM pg_indexes
       WHERE schemaname = 'public' AND indexname = $1
     ) AS exists`,
    [indexName],
  );
  return row?.exists ?? false;
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
     ) AS exists`,
    [tableName, columnName],
  );
  return row?.exists ?? false;
}

async function triggerExists(triggerName: string, tableName: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM information_schema.triggers
       WHERE trigger_schema = 'public'
         AND trigger_name = $1
         AND event_object_table = $2
     ) AS exists`,
    [triggerName, tableName],
  );
  return row?.exists ?? false;
}

// ── §11.1 Core table presence ─────────────────────────────────────────────────

describe("§11.1 Core tables exist after all migrations", () => {
  const expectedTables = [
    "sos_organizations",
    "sos_facilities",
    "sos_user_identity_refs",
    "sos_user_accounts",
    "sos_staff_profiles",
    "sos_role_assignments",
    "sos_sessions",
    "sos_auth_audit",
    "sos_patient_access",
    "sos_rate_limit_windows",   // Added in 0002
  ];

  for (const table of expectedTables) {
    it(`table exists: ${table}`, async () => {
      expect(await tableExists(table)).toBe(true);
    });
  }
});

// ── §11.2 Phase 2B column additions ──────────────────────────────────────────

describe("§11.2 Phase 2B columns present", () => {
  it("sos_organizations.slug column exists", async () => {
    expect(await columnExists("sos_organizations", "slug")).toBe(true);
  });

  it("sos_sessions.user_id column exists", async () => {
    expect(await columnExists("sos_sessions", "user_id")).toBe(true);
  });
});

// ── §11.3 Phase 2B indexes ────────────────────────────────────────────────────

describe("§11.3 Phase 2B indexes present", () => {
  it("idx_sos_organizations_slug index exists", async () => {
    expect(await indexExists("idx_sos_organizations_slug")).toBe(true);
  });

  it("idx_sos_rate_limit_window_end index exists", async () => {
    // The composite PK (key, window_end) provides the uniqueness index.
    // A secondary index on window_end enables fast pruning of expired windows.
    expect(await indexExists("idx_sos_rate_limit_window_end")).toBe(true);
  });
});

// ── §11.4 Phase 2B triggers ───────────────────────────────────────────────────

describe("§11.4 Phase 2B audit append-only triggers", () => {
  it("sos_audit_no_update trigger exists on sos_auth_audit", async () => {
    expect(await triggerExists("sos_audit_no_update", "sos_auth_audit")).toBe(true);
  });

  it("sos_audit_no_delete trigger exists on sos_auth_audit", async () => {
    expect(await triggerExists("sos_audit_no_delete", "sos_auth_audit")).toBe(true);
  });

  it("audit rows are append-only — UPDATE is rejected", async () => {
    // Insert a real audit row using a raw pool query (trigger fires at DB level).
    // Use a valid event_type from the CHECK constraint.
    const insertResult = await pgPool.query(`
      INSERT INTO sos_auth_audit (event_type, outcome, ip_address)
      VALUES ('authorization_denied', 'failure', '127.0.0.1')
      RETURNING id
    `);
    const auditId = insertResult.rows[0]?.id as string;
    expect(auditId).toBeTruthy();

    // Attempt to UPDATE — must throw.
    await expect(
      pgPool.query(`UPDATE sos_auth_audit SET outcome = 'failure' WHERE id = $1`, [auditId]),
    ).rejects.toThrow();
  });

  it("audit rows are append-only — DELETE is rejected", async () => {
    const insertResult = await pgPool.query(`
      INSERT INTO sos_auth_audit (event_type, outcome, ip_address)
      VALUES ('authorization_denied', 'failure', '127.0.0.2')
      RETURNING id
    `);
    const auditId = insertResult.rows[0]?.id as string;
    expect(auditId).toBeTruthy();

    await expect(
      pgPool.query(`DELETE FROM sos_auth_audit WHERE id = $1`, [auditId]),
    ).rejects.toThrow();
  });
});

// ── §11.5 sos_patient_access facility consistency trigger ─────────────────────

describe("§11.5 patient_access facility consistency trigger", () => {
  it("sos_patient_access_facility_check trigger exists", async () => {
    expect(await triggerExists("sos_patient_access_facility_check", "sos_patient_access")).toBe(true);
  });
});

// ── §11.6 Rate limit windows table structure ──────────────────────────────────

describe("§11.6 sos_rate_limit_windows table structure", () => {
  it("key column exists", async () => {
    expect(await columnExists("sos_rate_limit_windows", "key")).toBe(true);
  });

  it("window_end column exists", async () => {
    expect(await columnExists("sos_rate_limit_windows", "window_end")).toBe(true);
  });

  it("count column exists", async () => {
    expect(await columnExists("sos_rate_limit_windows", "count")).toBe(true);
  });

  it("rate limit window can be inserted and queried", async () => {
    const testKey = `migtest:${Date.now()}`;
    const windowEnd = new Date(Date.now() + 60_000).toISOString();

    await pgPool.query(
      `INSERT INTO sos_rate_limit_windows (key, window_end, count) VALUES ($1, $2, 1)
       ON CONFLICT (key, window_end) DO UPDATE SET count = sos_rate_limit_windows.count + 1`,
      [testKey, windowEnd],
    );

    const row = await queryOne<{ count: string }>(
      `SELECT count FROM sos_rate_limit_windows WHERE key = $1`,
      [testKey],
    );
    expect(parseInt(row?.count ?? "0", 10)).toBe(1);

    // Clean up (this is rate_limit_windows, not audit — allowed to delete)
    await pgPool.query(`DELETE FROM sos_rate_limit_windows WHERE key = $1`, [testKey]);
  });
});

// ── §11.7 Migration journal integrity ────────────────────────────────────────

describe("§11.7 Migration journal", () => {
  it("journal file has 6 entries (0000–0005)", () => {
    const journalPath = path.join(MIGRATION_DIR, "meta/_journal.json");
    expect(fs.existsSync(journalPath)).toBe(true);
    const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as {
      entries: { idx: number; tag: string }[];
    };
    expect(journal.entries).toHaveLength(7); // Phase 3 added entry idx=6 (0006_clinical_documentation_foundation)
    expect(journal.entries[0].idx).toBe(0);
    expect(journal.entries[1].idx).toBe(1);
    expect(journal.entries[2].idx).toBe(2);
    expect(journal.entries[3].idx).toBe(3);
    expect(journal.entries[4].idx).toBe(4);
    expect(journal.entries[5].idx).toBe(5);
  });

  it("all migration SQL files exist", () => {
    // Filenames come from Drizzle's generated naming convention.
    const files = [
      "0000_perpetual_rafael_vega.sql",
      "0001_authentication_authorization.sql",
      "0002_authorization_correction.sql",
      "0003_phase_2c_closure.sql",
      "0004_phase_2d_final_closure.sql",
      "0005_rate_limit_window_cleared_event.sql",
    ];
    for (const file of files) {
      expect(fs.existsSync(path.join(MIGRATION_DIR, file))).toBe(true);
    }
  });
});

// ── §11.8 Idempotency proof ───────────────────────────────────────────────────

describe("§11.8 Migration idempotency", () => {
  it("re-applying 0002 migration does not throw (IF NOT EXISTS / CREATE OR REPLACE guards)", async () => {
    const sql = fs.readFileSync(
      path.join(MIGRATION_DIR, "0002_authorization_correction.sql"),
      "utf8",
    );
    // The migration uses IF NOT EXISTS / CREATE OR REPLACE — must not error on re-run.
    await expect(pgPool.query(sql)).resolves.not.toThrow();
  });
});

// ── §11.9 DB-level constraint: org slug is unique ─────────────────────────────

describe("§11.9 org slug uniqueness constraint", () => {
  it("duplicate slug insert is rejected", async () => {
    // The existing org has slug='sunrise'. Trying to insert another with the same slug must fail.
    await expect(
      pgPool.query(`
        INSERT INTO sos_organizations (id, name, slug, status)
        VALUES (gen_random_uuid(), 'Duplicate Org', 'sunrise', 'active')
      `),
    ).rejects.toThrow();
  });
});
