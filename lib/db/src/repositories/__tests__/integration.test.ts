/**
 * Phase 1A — Repository integration tests.
 *
 * These tests run against the real development PostgreSQL database using
 * deterministic test data scoped to a unique test organisation UUID.
 * Each test suite creates its own org + facility, runs assertions, and
 * cleans up in afterAll — making them safe to re-run and parallelise.
 *
 * Run with: pnpm --filter @workspace/db run test
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";
import { db } from "../../client";
import {
  sosOrganizations,
  sosFacilities,
  sosPatients,
  sosEpisodesOfCare,
} from "../../schema";
import { eq, and } from "drizzle-orm";
import {
  createOrganization,
  getOrganization,
  listOrganizations,
} from "../organizationRepo";
import { createFacility, getFacility, listFacilities } from "../facilityRepo";
import {
  createPatient,
  getPatient,
  listPatients,
  PatientWithEpisode,
} from "../patientRepo";
import { createEpisode, getActiveEpisode, listPatientEpisodes } from "../episodeRepo";
import { NotFoundError, DatabaseError } from "../errors";

// ── Test identifiers ─────────────────────────────────────────────────────────
// Random per run — avoids collisions when running tests concurrently.
const TEST_RUN_ID = randomUUID().slice(0, 8);

// ── Shared fixtures ──────────────────────────────────────────────────────────
let testOrgId: string;
let testFacilityId: string;
let testPatientId: string;
let testEpisodeId: string;

async function cleanupTestData() {
  if (!testOrgId) return;
  // Cascades handle dependent rows (episodes → patients → facilities → org).
  await db.delete(sosOrganizations).where(eq(sosOrganizations.id, testOrgId));
}

// ── Organization tests ───────────────────────────────────────────────────────
describe("organizationRepo", () => {
  beforeAll(async () => {
    const org = await createOrganization({
      name: `[TEST-${TEST_RUN_ID}] Phase 1A Org`,
      status: "active",
    });
    testOrgId = org.id;
  });

  afterAll(cleanupTestData);

  it("creates an organisation and returns it", async () => {
    expect(testOrgId).toBeTruthy();
    expect(testOrgId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("retrieves an organisation by id", async () => {
    const org = await getOrganization(testOrgId);
    expect(org).not.toBeNull();
    expect(org!.name).toContain("Phase 1A Org");
    expect(org!.status).toBe("active");
  });

  it("returns null for a non-existent organisation", async () => {
    const result = await getOrganization(randomUUID());
    expect(result).toBeNull();
  });

  it("lists organisations and includes the test org", async () => {
    const orgs = await listOrganizations();
    const found = orgs.find((o) => o.id === testOrgId);
    expect(found).toBeTruthy();
  });
});

// ── Facility tests ───────────────────────────────────────────────────────────
describe("facilityRepo", () => {
  beforeAll(async () => {
    // Create a fresh org for facility tests to allow independent cleanup.
    const org = await createOrganization({
      name: `[TEST-${TEST_RUN_ID}] Facility Org`,
      status: "active",
    });
    testOrgId = org.id;

    const fac = await createFacility({
      orgId: testOrgId,
      name: `[TEST-${TEST_RUN_ID}] Baltimore Center`,
      status: "active",
      timeZone: "America/New_York",
    });
    testFacilityId = fac.id;
  });

  afterAll(cleanupTestData);

  it("creates a facility scoped to an organisation", async () => {
    expect(testFacilityId).toBeTruthy();
  });

  it("retrieves a facility by id within its organisation", async () => {
    const fac = await getFacility(testFacilityId, testOrgId);
    expect(fac.name).toContain("Baltimore Center");
    expect(fac.orgId).toBe(testOrgId);
    expect(fac.timeZone).toBe("America/New_York");
  });

  it("throws NotFoundError for a facility in the wrong organisation", async () => {
    await expect(getFacility(testFacilityId, randomUUID())).rejects.toThrow(
      NotFoundError,
    );
  });

  it("lists facilities for an organisation", async () => {
    const facs = await listFacilities(testOrgId);
    expect(facs.length).toBeGreaterThanOrEqual(1);
    expect(facs.some((f) => f.id === testFacilityId)).toBe(true);
  });

  it("does not list facilities from other organisations", async () => {
    const facs = await listFacilities(randomUUID());
    expect(facs.length).toBe(0);
  });
});

// ── Patient tests ─────────────────────────────────────────────────────────────
describe("patientRepo", () => {
  beforeAll(async () => {
    const org = await createOrganization({
      name: `[TEST-${TEST_RUN_ID}] Patient Org`,
      status: "active",
    });
    testOrgId = org.id;

    const fac = await createFacility({
      orgId: testOrgId,
      name: `[TEST-${TEST_RUN_ID}] Main Facility`,
      status: "active",
      timeZone: "America/New_York",
    });
    testFacilityId = fac.id;

    const patient = await createPatient({
      orgId: testOrgId,
      facilityId: testFacilityId,
      mrn: `MRN-TEST-${TEST_RUN_ID}`,
      firstName: "TestFirst",
      lastName: "TestLast",
      dateOfBirth: "1990-01-15",
      gender: "F",
      insurancePayer: "BlueCross Test",
      primaryDiagnosis: "F11.20",
    });
    testPatientId = patient.id;
  });

  afterAll(cleanupTestData);

  it("creates a patient with all fields", async () => {
    expect(testPatientId).toBeTruthy();
  });

  it("retrieves a patient within the correct organisation", async () => {
    const result = await getPatient(testPatientId, testOrgId);
    expect(result.firstName).toBe("TestFirst");
    expect(result.lastName).toBe("TestLast");
    expect(result.mrn).toContain("MRN-TEST-");
    expect(result.orgId).toBe(testOrgId);
    expect(result.episode).toBeNull(); // no episode created yet
  });

  it("throws NotFoundError for patient in wrong organisation", async () => {
    await expect(getPatient(testPatientId, randomUUID())).rejects.toThrow(
      NotFoundError,
    );
  });

  it("lists patients within the organisation", async () => {
    const patients = await listPatients(testOrgId);
    expect(patients.length).toBeGreaterThanOrEqual(1);
    expect(patients.some((p) => p.id === testPatientId)).toBe(true);
  });

  it("lists patients scoped to a specific facility", async () => {
    const patients = await listPatients(testOrgId, testFacilityId);
    expect(patients.every((p) => p.facilityId === testFacilityId)).toBe(true);
  });

  it("returns empty array for unknown org/facility", async () => {
    const patients = await listPatients(randomUUID(), randomUUID());
    expect(patients).toHaveLength(0);
  });

  it("enforces unique MRN per organisation", async () => {
    await expect(
      createPatient({
        orgId: testOrgId,
        facilityId: testFacilityId,
        mrn: `MRN-TEST-${TEST_RUN_ID}`, // duplicate MRN
        firstName: "Another",
        lastName: "Patient",
      }),
    ).rejects.toThrow(); // unique constraint violation → DatabaseError
  });
});

// ── Episode tests ─────────────────────────────────────────────────────────────
describe("episodeRepo", () => {
  beforeAll(async () => {
    const org = await createOrganization({
      name: `[TEST-${TEST_RUN_ID}] Episode Org`,
      status: "active",
    });
    testOrgId = org.id;

    const fac = await createFacility({
      orgId: testOrgId,
      name: `[TEST-${TEST_RUN_ID}] Episode Facility`,
      status: "active",
      timeZone: "America/New_York",
    });
    testFacilityId = fac.id;

    const patient = await createPatient({
      orgId: testOrgId,
      facilityId: testFacilityId,
      mrn: `EP-MRN-${TEST_RUN_ID}`,
      firstName: "EpFirst",
      lastName: "EpLast",
    });
    testPatientId = patient.id;

    const episode = await createEpisode({
      orgId: testOrgId,
      facilityId: testFacilityId,
      patientId: testPatientId,
      program: "Residential",
      levelOfCare: "3.7",
      admissionDate: "2026-07-01",
      dischargeDate: null,
      episodeStatus: "active",
    });
    testEpisodeId = episode.id;
  });

  afterAll(cleanupTestData);

  it("creates an episode linked to a patient", async () => {
    expect(testEpisodeId).toBeTruthy();
  });

  it("retrieves the active episode for a patient", async () => {
    const ep = await getActiveEpisode(testPatientId, testOrgId);
    expect(ep).not.toBeNull();
    expect(ep!.program).toBe("Residential");
    expect(ep!.levelOfCare).toBe("3.7");
    expect(ep!.admissionDate).toBe("2026-07-01");
    expect(ep!.episodeStatus).toBe("active");
  });

  it("returns the episode joined to the patient via getPatient", async () => {
    const result = await getPatient(testPatientId, testOrgId);
    expect(result.episode).not.toBeNull();
    expect(result.episode!.id).toBe(testEpisodeId);
  });

  it("includes episode in listPatients result", async () => {
    const patients = await listPatients(testOrgId);
    const found = patients.find((p) => p.id === testPatientId);
    expect(found).toBeTruthy();
    expect(found!.episode).not.toBeNull();
    expect(found!.episode!.program).toBe("Residential");
  });

  it("returns null active episode for a patient without one", async () => {
    const patient2 = await createPatient({
      orgId: testOrgId,
      facilityId: testFacilityId,
      mrn: `EP-MRN2-${TEST_RUN_ID}`,
      firstName: "NoEp",
      lastName: "Patient",
    });
    const ep = await getActiveEpisode(patient2.id, testOrgId);
    expect(ep).toBeNull();
  });

  it("returns no active episode after org cross-check", async () => {
    const ep = await getActiveEpisode(testPatientId, randomUUID());
    expect(ep).toBeNull();
  });

  it("lists all episodes for a patient", async () => {
    const episodes = await listPatientEpisodes(testPatientId, testOrgId);
    expect(episodes.length).toBeGreaterThanOrEqual(1);
    expect(episodes[0].id).toBe(testEpisodeId);
  });
});
