/**
 * Phase 1A Hardening — Database constraint tests.
 *
 * Verifies that the hardened schema enforces:
 *   1. Status-enum CHECK constraints on all tables
 *   2. Date-order CHECK constraint (discharge_date >= admission_date)
 *   3. Composite FK constraints preventing cross-tenant assignment
 *   4. Migration correctness — date columns are type 'date' (not 'text')
 *
 * Each test suite creates isolated test data scoped to a unique org UUID
 * and cleans up in afterAll.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";
import { pool, db } from "../../client";
import { sosOrganizations, sosFacilities, sosPatients, sosEpisodesOfCare } from "../../schema";
import { eq } from "drizzle-orm";
import { createOrganization } from "../organizationRepo";
import { createFacility } from "../facilityRepo";
import { createPatient } from "../patientRepo";
import { createEpisode } from "../episodeRepo";

const RUN = randomUUID().slice(0, 8);

// ── Shared setup ─────────────────────────────────────────────────────────────
// ORG A and ORG B are created for cross-tenant tests.

let orgAId: string;
let orgBId: string;
let facAId: string;  // facility belonging to orgA
let facBId: string;  // facility belonging to orgB
let patAId: string;  // patient belonging to orgA + facA

async function cleanup() {
  if (orgAId) await db.delete(sosOrganizations).where(eq(sosOrganizations.id, orgAId));
  if (orgBId) await db.delete(sosOrganizations).where(eq(sosOrganizations.id, orgBId));
}

describe("Phase 1A Hardening — schema constraints", () => {
  beforeAll(async () => {
    const orgA = await createOrganization({ name: `[TEST-${RUN}] OrgA`, status: "active" });
    orgAId = orgA.id;
    const orgB = await createOrganization({ name: `[TEST-${RUN}] OrgB`, status: "active" });
    orgBId = orgB.id;

    const facA = await createFacility({ orgId: orgAId, name: `[TEST-${RUN}] FacA`, status: "active", timeZone: "America/New_York" });
    facAId = facA.id;
    const facB = await createFacility({ orgId: orgBId, name: `[TEST-${RUN}] FacB`, status: "active", timeZone: "America/New_York" });
    facBId = facB.id;

    const patA = await createPatient({
      orgId: orgAId,
      facilityId: facAId,
      mrn: `MRN-CONSTRAINT-${RUN}`,
      firstName: "Constraint",
      lastName: "TestPatient",
      dateOfBirth: "1985-06-15",
    });
    patAId = patA.id;
  });

  afterAll(cleanup);

  // ── Migration verification ────────────────────────────────────────────────

  it("date_of_birth column is type 'date' (not 'text')", async () => {
    const { rows } = await pool.query<{ data_type: string }>(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'sos_patients'
        AND column_name = 'date_of_birth'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].data_type).toBe("date");
  });

  it("admission_date column is type 'date' (not 'text')", async () => {
    const { rows } = await pool.query<{ data_type: string }>(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'sos_episodes_of_care'
        AND column_name = 'admission_date'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].data_type).toBe("date");
  });

  it("discharge_date column is type 'date' (not 'text')", async () => {
    const { rows } = await pool.query<{ data_type: string }>(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'sos_episodes_of_care'
        AND column_name = 'discharge_date'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].data_type).toBe("date");
  });

  it("sos_patients table has a CHECK constraint", async () => {
    const { rows } = await pool.query<{ constraint_name: string }>(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'sos_patients'
        AND constraint_type = 'CHECK'
    `);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.some(r => r.constraint_name.includes("status"))).toBe(true);
  });

  it("sos_episodes_of_care has both status and date_order CHECK constraints", async () => {
    const { rows } = await pool.query<{ constraint_name: string }>(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'sos_episodes_of_care'
        AND constraint_type = 'CHECK'
    `);
    const names = rows.map(r => r.constraint_name);
    expect(names.some(n => n.includes("status"))).toBe(true);
    expect(names.some(n => n.includes("date_order"))).toBe(true);
  });

  // ── Status enum CHECK constraints ─────────────────────────────────────────

  it("rejects patient with invalid status value", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_patients (id, org_id, facility_id, mrn, first_name, last_name, status)
        VALUES ($1, $2, $3, $4, 'Bad', 'Status', 'invalid_status')
      `, [randomUUID(), orgAId, facAId, `BAD-MRN-${RUN}`])
    ).rejects.toThrow(); // CHECK constraint violation
  });

  it("rejects episode with invalid episode_status value", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_episodes_of_care
          (id, org_id, facility_id, patient_id, program, episode_status)
        VALUES ($1, $2, $3, $4, 'Residential', 'invalid_status')
      `, [randomUUID(), orgAId, facAId, patAId])
    ).rejects.toThrow(); // CHECK constraint violation
  });

  it("accepts episode with each valid episode_status value", async () => {
    for (const status of ["active", "discharged", "transferred", "completed", "void"] as const) {
      const ep = await createEpisode({
        orgId: orgAId,
        facilityId: facAId,
        patientId: patAId,
        program: "Residential",
        episodeStatus: status,
        admissionDate: "2026-01-01",
        dischargeDate: status === "active" ? null : "2026-06-01",
      });
      expect(ep.id).toBeTruthy();
      // Cleanup this episode immediately to avoid interfering with later tests
      await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.id, ep.id));
    }
  });

  // ── Date-order CHECK constraint ───────────────────────────────────────────

  it("rejects episode where discharge_date is before admission_date", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_episodes_of_care
          (id, org_id, facility_id, patient_id, program, episode_status, admission_date, discharge_date)
        VALUES ($1, $2, $3, $4, 'Residential', 'discharged', '2026-07-10', '2026-07-01')
      `, [randomUUID(), orgAId, facAId, patAId])
    ).rejects.toThrow(); // date_order CHECK violation
  });

  it("accepts episode where discharge_date equals admission_date (same-day boundary)", async () => {
    const ep = await createEpisode({
      orgId: orgAId,
      facilityId: facAId,
      patientId: patAId,
      program: "Residential",
      episodeStatus: "discharged",
      admissionDate: "2026-06-01",
      dischargeDate: "2026-06-01",
    });
    expect(ep.id).toBeTruthy();
    await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.id, ep.id));
  });

  it("accepts episode with null discharge_date (no date_order constraint applies)", async () => {
    const ep = await createEpisode({
      orgId: orgAId,
      facilityId: facAId,
      patientId: patAId,
      program: "Residential",
      episodeStatus: "active",
      admissionDate: "2026-07-01",
      dischargeDate: null,
    });
    expect(ep.id).toBeTruthy();
    await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.id, ep.id));
  });

  // ── Composite FK cross-tenant isolation ───────────────────────────────────

  it("rejects patient where facility belongs to a different organisation", async () => {
    // Attempt to create a patient in orgA using a facility from orgB.
    // This violates fk_sos_patients_org_facility (composite FK on org_id + facility_id).
    await expect(
      pool.query(`
        INSERT INTO sos_patients
          (id, org_id, facility_id, mrn, first_name, last_name)
        VALUES ($1, $2, $3, 'CROSS-TENANT-MRN', 'Cross', 'Tenant')
      `, [randomUUID(), orgAId, facBId]) // orgA + facB → violation
    ).rejects.toThrow(); // FK violation
  });

  it("rejects episode where patient belongs to a different organisation", async () => {
    // Create a patient in orgB, then attempt to create an episode in orgA referencing it.
    const patB = await createPatient({
      orgId: orgBId,
      facilityId: facBId,
      mrn: `MRN-ORGB-${RUN}`,
      firstName: "OrgBPatient",
      lastName: "Test",
    });

    await expect(
      pool.query(`
        INSERT INTO sos_episodes_of_care
          (id, org_id, facility_id, patient_id, program, episode_status)
        VALUES ($1, $2, $3, $4, 'Residential', 'active')
      `, [randomUUID(), orgAId, facAId, patB.id]) // orgA episode referencing orgB patient
    ).rejects.toThrow(); // fk_sos_episodes_org_patient violation
  });
});
