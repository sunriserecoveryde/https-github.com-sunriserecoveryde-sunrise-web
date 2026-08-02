/**
 * Phase 1A Hardening — Database constraint tests.
 *
 * Verifies all 11 constraint items required by the readiness review:
 *
 *  1. Patient whose organisation does not own the selected facility
 *  2. Staff profile whose organisation does not match the referenced identity
 *  3. Episode whose organisation does not match the patient
 *  4. Episode whose facility belongs to a different organisation
 *  5. Discharge date earlier than admission date
 *  6. Invalid organisation status
 *  7. Invalid facility status
 *  8. Invalid patient status
 *  9. Invalid episode status
 * 10. Duplicate MRN in the same organisation
 * 11. Duplicate external authentication reference in its prohibited scope
 *
 *  Also proves valid matching records can be inserted.
 *  Also proves date columns use PostgreSQL `date` type (not `text`).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";
import { pool, db } from "../../client";
import {
  sosOrganizations,
  sosFacilities,
  sosPatients,
  sosEpisodesOfCare,
  sosUserIdentityRefs,
  sosStaffProfiles,
} from "../../schema";
import { eq } from "drizzle-orm";
import { createOrganization } from "../organizationRepo";
import { createFacility } from "../facilityRepo";
import { createPatient } from "../patientRepo";
import { createEpisode } from "../episodeRepo";
import { createUserIdentityRef, createStaffProfile } from "../staffRepo";

const RUN = randomUUID().slice(0, 8);

// ── Shared setup ─────────────────────────────────────────────────────────────
// ORG A and ORG B for cross-tenant tests

let orgAId: string;
let orgBId: string;
let facAId: string;  // facility belonging to orgA
let facBId: string;  // facility belonging to orgB
let patAId: string;  // patient in orgA + facA

async function cleanup() {
  if (orgAId) await db.delete(sosOrganizations).where(eq(sosOrganizations.id, orgAId));
  if (orgBId) await db.delete(sosOrganizations).where(eq(sosOrganizations.id, orgBId));
}

describe("Phase 1A Hardening — schema constraints (all 11 required items)", () => {
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

  // ── Migration verification — date column types ────────────────────────────

  it("date_of_birth column is type 'date' (not 'text')", async () => {
    const { rows } = await pool.query<{ data_type: string }>(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'sos_patients' AND column_name = 'date_of_birth'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].data_type).toBe("date");
  });

  it("admission_date column is type 'date' (not 'text')", async () => {
    const { rows } = await pool.query<{ data_type: string }>(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'sos_episodes_of_care' AND column_name = 'admission_date'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].data_type).toBe("date");
  });

  it("discharge_date column is type 'date' (not 'text')", async () => {
    const { rows } = await pool.query<{ data_type: string }>(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'sos_episodes_of_care' AND column_name = 'discharge_date'
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].data_type).toBe("date");
  });

  // ── Constraint presence checks ────────────────────────────────────────────

  it("sos_patients has ck_sos_patients_status CHECK constraint", async () => {
    const { rows } = await pool.query<{ constraint_name: string }>(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'sos_patients' AND constraint_type = 'CHECK'
    `);
    expect(rows.some(r => r.constraint_name === "ck_sos_patients_status")).toBe(true);
  });

  it("sos_episodes_of_care has both ck_sos_episodes_status and ck_sos_episodes_date_order", async () => {
    const { rows } = await pool.query<{ constraint_name: string }>(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'sos_episodes_of_care' AND constraint_type = 'CHECK'
    `);
    const names = rows.map(r => r.constraint_name);
    expect(names).toContain("ck_sos_episodes_status");
    expect(names).toContain("ck_sos_episodes_date_order");
  });

  // ── Item 6: Invalid organisation status ──────────────────────────────────

  it("item 6 — rejects organisation with invalid status (constraint: ck_sos_organizations_status)", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_organizations (id, name, status)
        VALUES ($1, 'Bad Org', 'invalid_status')
      `, [randomUUID()])
    ).rejects.toThrow(); // ck_sos_organizations_status CHECK violation
  });

  it("item 6 — accepts organisation with each valid status value", async () => {
    for (const status of ["active", "inactive", "suspended"] as const) {
      const { rows } = await pool.query<{ id: string }>(`
        INSERT INTO sos_organizations (id, name, status)
        VALUES ($1, $2, $3) RETURNING id
      `, [randomUUID(), `[TEST-${RUN}] Status-${status}`, status]);
      expect(rows[0].id).toBeTruthy();
      await pool.query(`DELETE FROM sos_organizations WHERE id = $1`, [rows[0].id]);
    }
  });

  // ── Item 7: Invalid facility status ──────────────────────────────────────

  it("item 7 — rejects facility with invalid status (constraint: ck_sos_facilities_status)", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_facilities (id, org_id, name, status)
        VALUES ($1, $2, 'Bad Facility', 'invalid_status')
      `, [randomUUID(), orgAId])
    ).rejects.toThrow(); // ck_sos_facilities_status CHECK violation
  });

  it("item 7 — accepts facility with each valid status value", async () => {
    for (const status of ["active", "inactive", "closed"] as const) {
      const fac = await createFacility({ orgId: orgAId, name: `[TEST-${RUN}] Fac-${status}`, status, timeZone: "America/New_York" });
      expect(fac.id).toBeTruthy();
      await db.delete(sosFacilities).where(eq(sosFacilities.id, fac.id));
    }
  });

  // ── Item 8: Invalid patient status ───────────────────────────────────────

  it("item 8 — rejects patient with invalid status (constraint: ck_sos_patients_status)", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_patients (id, org_id, facility_id, mrn, first_name, last_name, status)
        VALUES ($1, $2, $3, $4, 'Bad', 'Status', 'invalid_status')
      `, [randomUUID(), orgAId, facAId, `BAD-MRN-${RUN}`])
    ).rejects.toThrow(); // ck_sos_patients_status CHECK violation
  });

  it("item 8 — accepts patient with each valid status value", async () => {
    for (const status of ["active", "inactive", "discharged", "transferred"] as const) {
      const pat = await createPatient({
        orgId: orgAId, facilityId: facAId,
        mrn: `MRN-STATUS-${status}-${RUN}`,
        firstName: "Status", lastName: "Test",
        status,
      });
      expect(pat.id).toBeTruthy();
      await db.delete(sosPatients).where(eq(sosPatients.id, pat.id));
    }
  });

  // ── Item 9: Invalid episode status ───────────────────────────────────────

  it("item 9 — rejects episode with invalid episode_status (constraint: ck_sos_episodes_status)", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_episodes_of_care
          (id, org_id, facility_id, patient_id, program, episode_status)
        VALUES ($1, $2, $3, $4, 'Residential', 'invalid_status')
      `, [randomUUID(), orgAId, facAId, patAId])
    ).rejects.toThrow(); // ck_sos_episodes_status CHECK violation
  });

  it("item 9 — accepts episode with each valid episode_status value", async () => {
    for (const status of ["active", "discharged", "transferred", "completed", "void"] as const) {
      const ep = await createEpisode({
        orgId: orgAId, facilityId: facAId, patientId: patAId,
        program: "Residential", episodeStatus: status,
        admissionDate: "2026-01-01",
        dischargeDate: status === "active" ? null : "2026-06-01",
      });
      expect(ep.id).toBeTruthy();
      await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.id, ep.id));
    }
  });

  // ── Item 5: Date-order CHECK constraint ──────────────────────────────────

  it("item 5 — rejects episode where discharge_date is before admission_date (constraint: ck_sos_episodes_date_order)", async () => {
    await expect(
      pool.query(`
        INSERT INTO sos_episodes_of_care
          (id, org_id, facility_id, patient_id, program, episode_status, admission_date, discharge_date)
        VALUES ($1, $2, $3, $4, 'Residential', 'discharged', '2026-07-10', '2026-07-01')
      `, [randomUUID(), orgAId, facAId, patAId])
    ).rejects.toThrow(); // ck_sos_episodes_date_order CHECK violation
  });

  it("item 5 — accepts same-day discharge (discharge_date = admission_date)", async () => {
    const ep = await createEpisode({
      orgId: orgAId, facilityId: facAId, patientId: patAId,
      program: "Residential", episodeStatus: "discharged",
      admissionDate: "2026-06-01", dischargeDate: "2026-06-01",
    });
    expect(ep.id).toBeTruthy();
    await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.id, ep.id));
  });

  it("item 5 — accepts null discharge_date (no date_order constraint applies)", async () => {
    const ep = await createEpisode({
      orgId: orgAId, facilityId: facAId, patientId: patAId,
      program: "Residential", episodeStatus: "active",
      admissionDate: "2026-07-01", dischargeDate: null,
    });
    expect(ep.id).toBeTruthy();
    await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.id, ep.id));
  });

  // ── Item 1: Patient facility cross-tenant FK ──────────────────────────────

  it("item 1 — rejects patient whose org does not own the facility (constraint: fk_sos_patients_org_facility)", async () => {
    // orgA + facB → orgA.id ≠ facB.org_id → FK violation
    await expect(
      pool.query(`
        INSERT INTO sos_patients
          (id, org_id, facility_id, mrn, first_name, last_name)
        VALUES ($1, $2, $3, 'CROSS-TENANT-1', 'Cross', 'Tenant')
      `, [randomUUID(), orgAId, facBId])
    ).rejects.toThrow(); // fk_sos_patients_org_facility composite FK violation
  });

  it("item 1 — accepts patient when org owns the facility (valid matching record)", async () => {
    const pat = await createPatient({
      orgId: orgAId, facilityId: facAId,
      mrn: `MRN-VALID-${RUN}`, firstName: "Valid", lastName: "MatchRecord",
    });
    expect(pat.id).toBeTruthy();
    await db.delete(sosPatients).where(eq(sosPatients.id, pat.id));
  });

  // ── Item 3: Episode patient cross-tenant FK ───────────────────────────────

  it("item 3 — rejects episode whose org_id does not match the patient's org_id (constraint: fk_sos_episodes_org_patient)", async () => {
    // Create a patient in orgB, then try to create an episode under orgA referencing it
    const patB = await createPatient({
      orgId: orgBId, facilityId: facBId,
      mrn: `MRN-ORGB-${RUN}`, firstName: "OrgBPat", lastName: "Test",
    });
    await expect(
      pool.query(`
        INSERT INTO sos_episodes_of_care
          (id, org_id, facility_id, patient_id, program, episode_status)
        VALUES ($1, $2, $3, $4, 'Residential', 'active')
      `, [randomUUID(), orgAId, facAId, patB.id]) // orgA episode → orgB patient
    ).rejects.toThrow(); // fk_sos_episodes_org_patient composite FK violation
  });

  // ── Item 4: Episode facility cross-tenant FK ──────────────────────────────

  it("item 4 — rejects episode whose org_id does not match the facility's org_id (constraint: fk_sos_episodes_org_facility)", async () => {
    // orgA episode that references facB (belongs to orgB) → FK violation
    await expect(
      pool.query(`
        INSERT INTO sos_episodes_of_care
          (id, org_id, facility_id, patient_id, program, episode_status)
        VALUES ($1, $2, $3, $4, 'Residential', 'active')
      `, [randomUUID(), orgAId, facBId, patAId]) // orgA episode → facB (orgB)
    ).rejects.toThrow(); // fk_sos_episodes_org_facility composite FK violation
  });

  it("item 4 — accepts episode when org matches both patient and facility", async () => {
    const ep = await createEpisode({
      orgId: orgAId, facilityId: facAId, patientId: patAId,
      program: "Residential", episodeStatus: "active",
    });
    expect(ep.id).toBeTruthy();
    await db.delete(sosEpisodesOfCare).where(eq(sosEpisodesOfCare.id, ep.id));
  });

  // ── Item 2: Staff profile cross-tenant FK ────────────────────────────────

  it("item 2 — rejects staff profile whose org_id does not match the user identity ref's org_id (constraint: fk_sos_staff_profiles_org_user)", async () => {
    // Create a user identity ref in orgB, then try to create a staff profile in orgA referencing it
    const userRefB = await createUserIdentityRef(orgBId);
    await expect(
      pool.query(`
        INSERT INTO sos_staff_profiles
          (id, org_id, user_id, display_name, professional_role, status)
        VALUES ($1, $2, $3, 'Bad Staff', 'clinician', 'active')
      `, [randomUUID(), orgAId, userRefB.id]) // orgA staff → orgB user identity
    ).rejects.toThrow(); // fk_sos_staff_profiles_org_user composite FK violation
  });

  it("item 2 — accepts staff profile when org matches the user identity ref", async () => {
    const userRefA = await createUserIdentityRef(orgAId);
    const staff = await createStaffProfile({
      orgId: orgAId,
      userId: userRefA.id,
      displayName: `[TEST-${RUN}] StaffValid`,
      professionalRole: "clinician",
      status: "active",
    });
    expect(staff.id).toBeTruthy();
    await db.delete(sosStaffProfiles).where(eq(sosStaffProfiles.id, staff.id));
    await db.delete(sosUserIdentityRefs).where(eq(sosUserIdentityRefs.id, userRefA.id));
  });

  // ── Item 10: Duplicate MRN in the same organisation ──────────────────────

  it("item 10 — rejects duplicate MRN in the same organisation (constraint: idx_sos_patients_org_mrn)", async () => {
    const mrn = `MRN-DUP-${RUN}`;
    // First patient — should succeed
    const pat1 = await createPatient({ orgId: orgAId, facilityId: facAId, mrn, firstName: "First", lastName: "DupTest" });
    expect(pat1.id).toBeTruthy();
    // Second patient with same mrn + same orgAId — must be rejected
    await expect(
      pool.query(`
        INSERT INTO sos_patients (id, org_id, facility_id, mrn, first_name, last_name)
        VALUES ($1, $2, $3, $4, 'Second', 'DupTest')
      `, [randomUUID(), orgAId, facAId, mrn])
    ).rejects.toThrow(); // idx_sos_patients_org_mrn UNIQUE violation
    // Cleanup
    await db.delete(sosPatients).where(eq(sosPatients.id, pat1.id));
  });

  it("item 10 — same MRN in a different organisation is permitted", async () => {
    const mrn = `MRN-CROSS-ORG-${RUN}`;
    const patA = await createPatient({ orgId: orgAId, facilityId: facAId, mrn, firstName: "SameMRN", lastName: "OrgA" });
    const patB = await createPatient({ orgId: orgBId, facilityId: facBId, mrn, firstName: "SameMRN", lastName: "OrgB" });
    expect(patA.id).toBeTruthy();
    expect(patB.id).toBeTruthy();
    await db.delete(sosPatients).where(eq(sosPatients.id, patA.id));
    await db.delete(sosPatients).where(eq(sosPatients.id, patB.id));
  });

  // ── Item 11: Duplicate ext_auth_ref per organisation ─────────────────────

  it("item 11 — rejects duplicate ext_auth_ref in the same organisation (constraint: idx_sos_user_refs_org_ext_auth_ref)", async () => {
    const extRef = `ext-auth-${RUN}`;
    // First user identity ref with this ext_auth_ref — should succeed
    const { rows: r1 } = await pool.query<{ id: string }>(`
      INSERT INTO sos_user_identity_refs (id, org_id, ext_auth_ref, status)
      VALUES ($1, $2, $3, 'active') RETURNING id
    `, [randomUUID(), orgAId, extRef]);
    expect(r1[0].id).toBeTruthy();
    // Second with same ext_auth_ref in same org — must be rejected
    await expect(
      pool.query(`
        INSERT INTO sos_user_identity_refs (id, org_id, ext_auth_ref, status)
        VALUES ($1, $2, $3, 'active')
      `, [randomUUID(), orgAId, extRef])
    ).rejects.toThrow(); // idx_sos_user_refs_org_ext_auth_ref UNIQUE violation
    await pool.query(`DELETE FROM sos_user_identity_refs WHERE id = $1`, [r1[0].id]);
  });

  it("item 11 — same ext_auth_ref in different organisations is permitted", async () => {
    const extRef = `ext-auth-cross-org-${RUN}`;
    const { rows: rA } = await pool.query<{ id: string }>(`
      INSERT INTO sos_user_identity_refs (id, org_id, ext_auth_ref, status)
      VALUES ($1, $2, $3, 'active') RETURNING id
    `, [randomUUID(), orgAId, extRef]);
    const { rows: rB } = await pool.query<{ id: string }>(`
      INSERT INTO sos_user_identity_refs (id, org_id, ext_auth_ref, status)
      VALUES ($1, $2, $3, 'active') RETURNING id
    `, [randomUUID(), orgBId, extRef]);
    expect(rA[0].id).toBeTruthy();
    expect(rB[0].id).toBeTruthy();
    await pool.query(`DELETE FROM sos_user_identity_refs WHERE id IN ($1, $2)`, [rA[0].id, rB[0].id]);
  });

  it("item 11 — null ext_auth_ref is never considered duplicate (partial index)", async () => {
    // Partial index: WHERE ext_auth_ref IS NOT NULL — so two NULLs in same org must succeed
    const { rows: r1 } = await pool.query<{ id: string }>(`
      INSERT INTO sos_user_identity_refs (id, org_id, status)
      VALUES ($1, $2, 'active') RETURNING id
    `, [randomUUID(), orgAId]);
    const { rows: r2 } = await pool.query<{ id: string }>(`
      INSERT INTO sos_user_identity_refs (id, org_id, status)
      VALUES ($1, $2, 'active') RETURNING id
    `, [randomUUID(), orgAId]);
    expect(r1[0].id).toBeTruthy();
    expect(r2[0].id).toBeTruthy();
    await pool.query(`DELETE FROM sos_user_identity_refs WHERE id IN ($1, $2)`, [r1[0].id, r2[0].id]);
  });
});
