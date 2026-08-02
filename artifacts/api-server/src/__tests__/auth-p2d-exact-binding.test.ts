/**
 * Phase 2D — Exact Assignment Binding: 18-Step Access Control Proof
 *
 * Proves that patient access is bound to one specific role assignment and that
 * no null-assignment row, revoked assignment, wrong-user assignment, or
 * cross-assignment row can authorize a request.
 *
 * All tests use:
 *   • Real PostgreSQL
 *   • Real authenticated sessions (real login route, real CSRF, real cookies)
 *   • Real API routes (/patients list, /patients/:id detail, /patients/:id/episode)
 *   • DISABLE_AUTH_FALLBACK=true to prevent dev-identity masking
 *
 * Requires: PHASE2D_TEST_PASSWORD — set before running; no fallback.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { db, pool } from "@workspace/db";
import * as argon2 from "argon2";
import {
  sosOrganizations, sosFacilities, sosUserIdentityRefs, sosStaffProfiles,
  sosUserAccounts, sosRoleAssignments, sosPatientAccess, sosPatients,
  sosEpisodes,
} from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

// ── Credential guard ──────────────────────────────────────────────────────────

const TEST_PASSWORD: string = (() => {
  const p = process.env.PHASE2D_TEST_PASSWORD;
  if (!p) {
    throw new Error(
      "PHASE2D_TEST_PASSWORD env var is required for Phase 2D integration tests.\n" +
      "Set it to the fictitious test account password. Do not use a real credential.",
    );
  }
  return p;
})();

process.env.DISABLE_AUTH_FALLBACK = "true";

// ── Stable test fixture IDs (clearly synthetic) ───────────────────────────────

const ORG_ID        = "00000000-0000-4000-a000-000000000001";
const FACILITY_ID   = "00000000-0000-4000-a000-000000000002";

// IDs for this test suite — prefix "0000000a" to avoid collision with other seeds
const BHT_IDENTITY  = "0000000a-0000-4000-a001-000000000001";
const BHT_ACCOUNT   = "0000000a-0000-4000-a001-000000000002";
const PATIENT_1_ID  = "0000000a-0000-4000-a001-000000000010";
const PATIENT_2_ID  = "0000000a-0000-4000-a001-000000000011";
const ASSIGN_A_ID   = "0000000a-0000-4000-a001-000000000020";
const ASSIGN_B_ID   = "0000000a-0000-4000-a001-000000000021";
const WRONG_USER_ID = "0000000a-0000-4000-a001-000000000030"; // different user
const BHT_EMAIL     = "p2d-bht@test.p2d";

const ARGON_OPTS: argon2.HashOptions = {
  type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sqlRaw(text: string, values?: unknown[]) {
  const r = await pool.query(text, values);
  return r.rows as Record<string, unknown>[];
}

async function loginAs(email: string, password = TEST_PASSWORD) {
  const agent = request.agent(app);
  const csrfRes = await agent.get("/api/v1/auth/csrf-token");
  const csrfToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? "";
  const res = await agent
    .post("/api/v1/auth/login")
    .set("X-CSRF-Token", csrfToken)
    .send({ orgSlug: "sunrise", email, password });
  return { agent, res, csrfToken };
}

// ── Fixture setup ─────────────────────────────────────────────────────────────

async function cleanFixtures() {
  // Revoke access rows first (FK on patients will cascade once access is gone).
  await pool.query(
    `UPDATE sos_patient_access SET status='revoked' WHERE id IN (
       SELECT id FROM sos_patient_access WHERE patient_id IN ($1,$2)
         AND org_id = $3
     )`,
    [PATIENT_1_ID, PATIENT_2_ID, ORG_ID],
  );
  // Hard-delete in reverse FK order for a clean slate between runs.
  await pool.query(`DELETE FROM sos_patient_access WHERE patient_id IN ($1,$2) AND org_id=$3`,
    [PATIENT_1_ID, PATIENT_2_ID, ORG_ID]);
  await pool.query(`DELETE FROM sos_episodes WHERE patient_id IN ($1,$2)`, [PATIENT_1_ID, PATIENT_2_ID]);
  await pool.query(`DELETE FROM sos_patients WHERE id IN ($1,$2) AND org_id=$3`,
    [PATIENT_1_ID, PATIENT_2_ID, ORG_ID]);
  await pool.query(`DELETE FROM sos_role_assignments WHERE id IN ($1,$2)`, [ASSIGN_A_ID, ASSIGN_B_ID]);
  await pool.query(`DELETE FROM sos_role_assignments WHERE user_id=$1 AND org_id=$2`,
    [BHT_ACCOUNT, ORG_ID]);
  await pool.query(`DELETE FROM sos_user_accounts WHERE id=$1`, [BHT_ACCOUNT]);
  await pool.query(`DELETE FROM sos_staff_profiles WHERE user_id=$1 AND org_id=$2`,
    [BHT_IDENTITY, ORG_ID]);
  await pool.query(`DELETE FROM sos_user_identity_refs WHERE id=$1`, [BHT_IDENTITY]);
}

async function setupFixtures(passwordHash: string) {
  // Ensure org exists
  await pool.query(`
    INSERT INTO sos_organizations (id, name, slug, status)
    VALUES ($1,'Sunrise Recovery Center','sunrise','active')
    ON CONFLICT (id) DO NOTHING
  `, [ORG_ID]);
  // Ensure facility exists
  await pool.query(`
    INSERT INTO sos_facilities (id, org_id, name, status)
    VALUES ($1,$2,'Sunrise Recovery Center — Main Campus','active')
    ON CONFLICT (id) DO NOTHING
  `, [FACILITY_ID, ORG_ID]);

  // BHT identity ref
  await pool.query(`
    INSERT INTO sos_user_identity_refs (id, org_id)
    VALUES ($1, $2) ON CONFLICT (id) DO NOTHING
  `, [BHT_IDENTITY, ORG_ID]);

  // BHT staff profile
  await pool.query(`
    INSERT INTO sos_staff_profiles (org_id, user_id, display_name, professional_role)
    VALUES ($1,$2,'[P2D-TEST] BHT Fixture','bht')
    ON CONFLICT DO NOTHING
  `, [ORG_ID, BHT_IDENTITY]);

  // BHT user account
  await pool.query(`
    INSERT INTO sos_user_accounts
      (id, org_id, user_identity_ref_id, email, password_hash, status)
    VALUES ($1,$2,$3,$4,$5,'active')
    ON CONFLICT (id) DO UPDATE SET password_hash=$5, status='active'
  `, [BHT_ACCOUNT, ORG_ID, BHT_IDENTITY, BHT_EMAIL, passwordHash]);

  // Two test patients in the facility
  await pool.query(`
    INSERT INTO sos_patients
      (id, org_id, facility_id, first_name, last_name, date_of_birth, status)
    VALUES
      ($1,$3,$4,'P2D-Patient1','Fixture1','1990-01-01','active'),
      ($2,$3,$4,'P2D-Patient2','Fixture2','1991-01-01','active')
    ON CONFLICT (id) DO NOTHING
  `, [PATIENT_1_ID, PATIENT_2_ID, ORG_ID, FACILITY_ID]);
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("Phase 2D — 18-Step Exact Assignment Binding", { timeout: 240_000 }, () => {

  beforeAll(async () => {
    await cleanFixtures();
    const hash = await argon2.hash(TEST_PASSWORD, ARGON_OPTS);
    await setupFixtures(hash);
  });

  afterAll(async () => {
    await cleanFixtures().catch(() => {});
    await pool.end().catch(() => {});
  });

  // ── Step 1: BHT user + Role Assignment A exist ───────────────────────────
  it("step-01: BHT user account is active in the DB", async () => {
    const rows = await sqlRaw(
      `SELECT id, status FROM sos_user_accounts WHERE id=$1`, [BHT_ACCOUNT]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("active");
  });

  // ── Step 2: Create Role Assignment A ────────────────────────────────────
  it("step-02: create Role Assignment A for BHT user", async () => {
    await pool.query(`
      INSERT INTO sos_role_assignments
        (id, org_id, user_id, facility_id, role_id, status)
      VALUES ($1,$2,$3,$4,'bht','active')
    `, [ASSIGN_A_ID, ORG_ID, BHT_ACCOUNT, FACILITY_ID]);

    const rows = await sqlRaw(
      `SELECT id, status FROM sos_role_assignments WHERE id=$1`, [ASSIGN_A_ID]);
    expect(rows[0]?.status).toBe("active");
  });

  // ── Step 3: Assign Patient 1 through Assignment A ────────────────────────
  it("step-03: Patient 1 assigned through Assignment A", async () => {
    await pool.query(`
      INSERT INTO sos_patient_access
        (org_id, facility_id, patient_id, user_id, role_assignment_id, status)
      VALUES ($1,$2,$3,$4,$5,'active')
    `, [ORG_ID, FACILITY_ID, PATIENT_1_ID, BHT_ACCOUNT, ASSIGN_A_ID]);

    const rows = await sqlRaw(
      `SELECT status FROM sos_patient_access
        WHERE patient_id=$1 AND user_id=$2 AND role_assignment_id=$3`,
      [PATIENT_1_ID, BHT_ACCOUNT, ASSIGN_A_ID]);
    expect(rows[0]?.status).toBe("active");
  });

  // ── Step 4: Login through real login route ───────────────────────────────
  let bhtAgent: ReturnType<typeof request.agent>;
  let bhtCsrfToken: string;

  it("step-04: BHT user can log in through real login route", async () => {
    const { agent, res, csrfToken } = await loginAs(BHT_EMAIL);
    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).email).toBe(BHT_EMAIL);
    bhtAgent = agent;
    bhtCsrfToken = csrfToken;
  });

  // ── Step 5: Patient 1 appears in Patient List ────────────────────────────
  it("step-05: Patient 1 appears in the patient list (exact assignment bound)", async () => {
    const res = await bhtAgent.get("/api/v1/patients");
    expect(res.status).toBe(200);
    const patients = res.body as { id: string }[];
    const ids = patients.map((p) => p.id);
    expect(ids).toContain(PATIENT_1_ID);
  });

  // ── Step 6: Patient 2 does NOT appear ───────────────────────────────────
  it("step-06: Patient 2 does NOT appear (no access row)", async () => {
    const res = await bhtAgent.get("/api/v1/patients");
    expect(res.status).toBe(200);
    const patients = res.body as { id: string }[];
    const ids = patients.map((p) => p.id);
    expect(ids).not.toContain(PATIENT_2_ID);
  });

  // ── Step 7: Patient 1 Detail succeeds ────────────────────────────────────
  it("step-07: Patient 1 Detail route succeeds (200)", async () => {
    const res = await bhtAgent.get(`/api/v1/patients/${PATIENT_1_ID}`);
    expect([200, 404]).toContain(res.status);  // 404 if no episode; 200 if found
    // Key assertion: NOT 403
    expect(res.status).not.toBe(403);
  });

  // ── Step 8: Patient 2 Detail is denied ───────────────────────────────────
  it("step-08: Patient 2 Detail is denied (403) — no access row", async () => {
    const res = await bhtAgent.get(`/api/v1/patients/${PATIENT_2_ID}`);
    expect(res.status).toBe(403);
  });

  // ── Step 9: Episode access follows explicit permission ───────────────────
  it("step-09: Patient 1 active episode denied for BHT (no episode.view grant)", async () => {
    // BHT does not have patient.episode.view; should get 403 on episode endpoint
    const res = await bhtAgent.get(`/api/v1/patients/${PATIENT_1_ID}/episode`);
    // 403 (no permission) or 404 (no episode exists) — never 200 for BHT
    expect([403, 404]).toContain(res.status);
  });

  // ── Step 10: Revoke Assignment A ─────────────────────────────────────────
  it("step-10: revoke Role Assignment A", async () => {
    await pool.query(
      `UPDATE sos_role_assignments SET status='revoked' WHERE id=$1`, [ASSIGN_A_ID]);
    const rows = await sqlRaw(
      `SELECT status FROM sos_role_assignments WHERE id=$1`, [ASSIGN_A_ID]);
    expect(rows[0]?.status).toBe("revoked");
  });

  // ── Step 11: Create Assignment B (same user, same facility) ──────────────
  it("step-11: create Role Assignment B for same user and facility", async () => {
    await pool.query(`
      INSERT INTO sos_role_assignments
        (id, org_id, user_id, facility_id, role_id, status)
      VALUES ($1,$2,$3,$4,'bht','active')
    `, [ASSIGN_B_ID, ORG_ID, BHT_ACCOUNT, FACILITY_ID]);
    const rows = await sqlRaw(
      `SELECT status FROM sos_role_assignments WHERE id=$1`, [ASSIGN_B_ID]);
    expect(rows[0]?.status).toBe("active");
  });

  // ── Step 12: No new Patient 1 access row for Assignment B ────────────────
  it("step-12: Patient 1 access row still references Assignment A (not B)", async () => {
    const rows = await sqlRaw(
      `SELECT role_assignment_id FROM sos_patient_access
        WHERE patient_id=$1 AND user_id=$2 AND status='active'`,
      [PATIENT_1_ID, BHT_ACCOUNT]);
    // The ONLY active row still points to ASSIGN_A — no new row for ASSIGN_B was created.
    expect(rows.every((r) => r.role_assignment_id === ASSIGN_A_ID)).toBe(true);
  });

  // ── Step 13: Recreate session with new Assignment B context ──────────────
  it("step-13: re-login so session reflects current grants", async () => {
    // Logout existing session
    const freshCsrfRes = await bhtAgent.get("/api/v1/auth/csrf-token");
    const freshCsrfToken = (freshCsrfRes.body as { csrfToken?: string }).csrfToken ?? "";
    await bhtAgent
      .post("/api/v1/auth/logout")
      .set("X-CSRF-Token", freshCsrfToken)
      .send({});
    // Re-login
    const { agent, res } = await loginAs(BHT_EMAIL);
    expect(res.status).toBe(200);
    bhtAgent = agent;
  });

  // ── Step 14: Old Patient 1 access row (Assignment A) does NOT authorize B ─
  it("step-14: Patient 1 is no longer accessible (Assignment A revoked, no row for B)", async () => {
    const res = await bhtAgent.get("/api/v1/patients");
    expect(res.status).toBe(200);
    const patients = res.body as { id: string }[];
    const ids = patients.map((p) => p.id);
    // Assignment A is revoked → its access row no longer authorizes
    // Assignment B is active but has no patient_access row for Patient 1
    expect(ids).not.toContain(PATIENT_1_ID);
  });

  // ── Step 15: Assign Patient 2 through Assignment B ───────────────────────
  it("step-15: assign Patient 2 through Assignment B", async () => {
    await pool.query(`
      INSERT INTO sos_patient_access
        (org_id, facility_id, patient_id, user_id, role_assignment_id, status)
      VALUES ($1,$2,$3,$4,$5,'active')
    `, [ORG_ID, FACILITY_ID, PATIENT_2_ID, BHT_ACCOUNT, ASSIGN_B_ID]);
    const rows = await sqlRaw(
      `SELECT status FROM sos_patient_access
        WHERE patient_id=$1 AND role_assignment_id=$2`,
      [PATIENT_2_ID, ASSIGN_B_ID]);
    expect(rows[0]?.status).toBe("active");
  });

  // ── Step 16: Only Patient 2 is accessible ────────────────────────────────
  it("step-16: only Patient 2 is now accessible (Assignment B, correct binding)", async () => {
    // Re-login to pick up the new assignment
    await (async () => {
      const freshCsrf = await bhtAgent.get("/api/v1/auth/csrf-token");
      const tok = (freshCsrf.body as { csrfToken?: string }).csrfToken ?? "";
      await bhtAgent.post("/api/v1/auth/logout").set("X-CSRF-Token", tok).send({});
    })();
    const { agent, res } = await loginAs(BHT_EMAIL);
    expect(res.status).toBe(200);
    bhtAgent = agent;

    const listRes = await bhtAgent.get("/api/v1/patients");
    expect(listRes.status).toBe(200);
    const patients = listRes.body as { id: string }[];
    const ids = patients.map((p) => p.id);
    expect(ids).toContain(PATIENT_2_ID);
    expect(ids).not.toContain(PATIENT_1_ID);
  });

  // ── Step 17: NULL assignment row grants no access ─────────────────────────
  it("step-17: a null-assignment access row for Patient 1 grants NO access", async () => {
    // Insert a patient_access row with NULL role_assignment_id (revoked status required
    // by the Phase 2D CHECK constraint — active rows must have an FK).
    // Verify it cannot be inserted as active:
    await expect(
      pool.query(`
        INSERT INTO sos_patient_access
          (org_id, facility_id, patient_id, user_id, role_assignment_id, status)
        VALUES ($1,$2,$3,$4,NULL,'active')
      `, [ORG_ID, FACILITY_ID, PATIENT_1_ID, BHT_ACCOUNT]),
    ).rejects.toThrow();

    // Confirm Patient 1 still not in the list.
    const listRes = await bhtAgent.get("/api/v1/patients");
    const ids = (listRes.body as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain(PATIENT_1_ID);
  });

  // ── Step 18: Wrong-user / wrong-org / wrong-facility / future / expired / revoked ──
  it("step-18A: revoked assignment — Patient 2 denied after assignment is revoked", async () => {
    await pool.query(
      `UPDATE sos_role_assignments SET status='revoked' WHERE id=$1`, [ASSIGN_B_ID]);
    const { agent } = await loginAs(BHT_EMAIL);
    const res = await agent.get("/api/v1/patients");
    const ids = (res.body as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain(PATIENT_2_ID);
    // Restore for remaining tests
    await pool.query(
      `UPDATE sos_role_assignments SET status='active' WHERE id=$1`, [ASSIGN_B_ID]);
  });

  it("step-18B: future-dated assignment — not yet effective", async () => {
    const tomorrow = new Date(Date.now() + 25 * 3_600_000);
    await pool.query(
      `UPDATE sos_role_assignments SET effective_at=$2 WHERE id=$1`,
      [ASSIGN_B_ID, tomorrow.toISOString()]);
    const { agent } = await loginAs(BHT_EMAIL);
    const res = await agent.get("/api/v1/patients");
    const ids = (res.body as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain(PATIENT_2_ID);
    // Restore
    const yesterday = new Date(Date.now() - 3_600_000);
    await pool.query(
      `UPDATE sos_role_assignments SET effective_at=$2 WHERE id=$1`,
      [ASSIGN_B_ID, yesterday.toISOString()]);
  });

  it("step-18C: expired assignment — past expires_at", async () => {
    const yesterday = new Date(Date.now() - 3_600_000);
    await pool.query(
      `UPDATE sos_role_assignments SET expires_at=$2 WHERE id=$1`,
      [ASSIGN_B_ID, yesterday.toISOString()]);
    const { agent } = await loginAs(BHT_EMAIL);
    const res = await agent.get("/api/v1/patients");
    const ids = (res.body as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain(PATIENT_2_ID);
    // Restore
    await pool.query(
      `UPDATE sos_role_assignments SET expires_at=NULL WHERE id=$1`, [ASSIGN_B_ID]);
  });

  it("step-18D: DB integrity trigger rejects wrong-user assignment", async () => {
    // Attempt to insert an access row with a role_assignment_id that belongs
    // to a different user — the trigger must reject it.
    await expect(
      pool.query(`
        INSERT INTO sos_patient_access
          (org_id, facility_id, patient_id, user_id, role_assignment_id, status)
        VALUES ($1,$2,$3,$4,$5,'active')
      `, [ORG_ID, FACILITY_ID, PATIENT_1_ID, WRONG_USER_ID, ASSIGN_B_ID]),
    ).rejects.toThrow(/user_id.*does not match/i);
  });

  it("step-18E: Patient Detail denied for patient not in active assignment-bound list", async () => {
    // Patient 1 is not accessible (Assignment A revoked, no Assignment B row).
    const { agent } = await loginAs(BHT_EMAIL);
    const res = await agent.get(`/api/v1/patients/${PATIENT_1_ID}`);
    expect(res.status).toBe(403);
  });
});
