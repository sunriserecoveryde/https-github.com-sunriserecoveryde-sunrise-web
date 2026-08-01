import { db } from "../client";
import {
  sosPatients,
  sosEpisodesOfCare,
  sosPatientAccess,
  type SosPatient,
  type SosEpisodeOfCare,
  type InsertSosPatient,
} from "../schema";
import { and, eq, inArray, desc, isNull, or, gt } from "drizzle-orm";
import { DatabaseError, NotFoundError } from "./errors";

export type PatientWithEpisode = SosPatient & {
  episode: SosEpisodeOfCare | null;
};

/**
 * Attach active episodes to a list of patients (shared helper).
 */
async function attachEpisodes(
  patients: SosPatient[],
  orgId: string,
): Promise<PatientWithEpisode[]> {
  if (patients.length === 0) return [];

  const patientIds = patients.map((p) => p.id);

  const episodes = await db
    .select()
    .from(sosEpisodesOfCare)
    .where(
      and(
        eq(sosEpisodesOfCare.orgId, orgId),
        eq(sosEpisodesOfCare.episodeStatus, "active"),
        inArray(sosEpisodesOfCare.patientId, patientIds),
      ),
    );

  const episodeByPatient = new Map<string, SosEpisodeOfCare>();
  for (const ep of episodes) {
    if (!episodeByPatient.has(ep.patientId)) {
      episodeByPatient.set(ep.patientId, ep);
    }
  }

  return patients.map((p) => ({ ...p, episode: episodeByPatient.get(p.id) ?? null }));
}

/**
 * List all patients in an organisation, optionally scoped to one facility.
 * Cross-organisation records are structurally impossible because orgId is a
 * required WHERE condition.
 */
export async function listPatients(
  orgId: string,
  facilityId?: string,
): Promise<PatientWithEpisode[]> {
  try {
    const conditions = facilityId
      ? and(eq(sosPatients.orgId, orgId), eq(sosPatients.facilityId, facilityId))
      : eq(sosPatients.orgId, orgId);

    const patients = await db
      .select()
      .from(sosPatients)
      .where(conditions)
      .orderBy(sosPatients.lastName, sosPatients.firstName);

    return attachEpisodes(patients, orgId);
  } catch (err) {
    throw new DatabaseError("Failed to list patients", err);
  }
}

/**
 * List only the patients explicitly assigned to a user in a given facility
 * (caseload-limited access — for BHT, aftercare_staff, billing_staff).
 *
 * Used for scoped grants where facilityWide=false and requiresPatientAssignment=true.
 * Patients are returned in the same order as listPatients (lastName, firstName).
 */
export async function listAssignedPatients(
  orgId: string,
  userId: string,
  facilityId?: string,
): Promise<PatientWithEpisode[]> {
  try {
    const now = new Date();
    const accessConditions = [
      eq(sosPatientAccess.orgId, orgId),
      eq(sosPatientAccess.userId, userId),
      eq(sosPatientAccess.status, "active"),
      or(
        isNull(sosPatientAccess.expiresAt),
        gt(sosPatientAccess.expiresAt, now),
      ),
    ];
    if (facilityId) {
      accessConditions.push(eq(sosPatientAccess.facilityId, facilityId));
    }

    // Get all patient IDs explicitly assigned to this user.
    const accessRows = await db
      .select({ patientId: sosPatientAccess.patientId })
      .from(sosPatientAccess)
      .where(and(...accessConditions));

    if (accessRows.length === 0) return [];

    const patientIds = [...new Set(accessRows.map((r) => r.patientId))];

    const patientConditions = [
      eq(sosPatients.orgId, orgId),
      inArray(sosPatients.id, patientIds),
    ];
    if (facilityId) {
      patientConditions.push(eq(sosPatients.facilityId, facilityId));
    }

    const patients = await db
      .select()
      .from(sosPatients)
      .where(and(...patientConditions))
      .orderBy(sosPatients.lastName, sosPatients.firstName);

    return attachEpisodes(patients, orgId);
  } catch (err) {
    throw new DatabaseError("Failed to list assigned patients", err);
  }
}

/**
 * Get a single patient by ID — only within the caller's organisation.
 * Returns a 404-equivalent NotFoundError if the patient exists in a different org
 * to avoid leaking cross-tenant record existence.
 */
export async function getPatient(
  id: string,
  orgId: string,
): Promise<PatientWithEpisode> {
  try {
    const rows = await db
      .select()
      .from(sosPatients)
      .where(and(eq(sosPatients.id, id), eq(sosPatients.orgId, orgId)))
      .limit(1);

    if (rows.length === 0) throw new NotFoundError("Patient", id);

    const patient = rows[0];

    const episodeRows = await db
      .select()
      .from(sosEpisodesOfCare)
      .where(
        and(
          eq(sosEpisodesOfCare.patientId, patient.id),
          eq(sosEpisodesOfCare.orgId, orgId),
          eq(sosEpisodesOfCare.episodeStatus, "active"),
        ),
      )
      .orderBy(desc(sosEpisodesOfCare.createdAt))
      .limit(1);

    return { ...patient, episode: episodeRows[0] ?? null };
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError("Failed to get patient", err);
  }
}

export async function createPatient(data: InsertSosPatient): Promise<SosPatient> {
  try {
    const rows = await db.insert(sosPatients).values(data).returning();
    return rows[0];
  } catch (err) {
    throw new DatabaseError("Failed to create patient", err);
  }
}
