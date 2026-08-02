import { db } from "../client";
import {
  sosPatients,
  sosEpisodesOfCare,
  sosPatientAccess,
  type SosPatient,
  type SosEpisodeOfCare,
  type InsertSosPatient,
} from "../schema";
import { and, eq, inArray, desc, isNotNull, isNull, lte, or, gt } from "drizzle-orm";
import { sosRoleAssignments } from "../schema";
import { DatabaseError, NotFoundError } from "./errors";

export type PatientWithEpisode = SosPatient & {
  episode: SosEpisodeOfCare | null;
};

/**
 * §1 (Phase 2C): Permission-tiered query control.
 *
 * Controls which columns are fetched from sos_patients and whether
 * episodes are joined.  The route layer determines the appropriate tier
 * from the caller's permission set and passes it here so the DB never
 * returns more data than the caller is authorised to see.
 *
 *  "identity"     → id, orgId, facilityId, firstName, lastName only
 *  "demographics" → identity + mrn, dateOfBirth, gender, insurancePayer
 *  "episode"      → demographics + full patient row + active episode join
 *  "chart"        → same as episode (all columns + episode join)
 */
export type PatientQueryTier = "identity" | "demographics" | "episode" | "chart";

// ── Per-tier column maps for Drizzle ─────────────────────────────────────────

const IDENTITY_COLUMNS = {
  id:         sosPatients.id,
  orgId:      sosPatients.orgId,
  facilityId: sosPatients.facilityId,
  firstName:  sosPatients.firstName,
  lastName:   sosPatients.lastName,
} as const;

const DEMOGRAPHICS_COLUMNS = {
  ...IDENTITY_COLUMNS,
  mrn:            sosPatients.mrn,
  dateOfBirth:    sosPatients.dateOfBirth,
  gender:         sosPatients.gender,
  insurancePayer: sosPatients.insurancePayer,
} as const;

const FULL_COLUMNS = {
  ...DEMOGRAPHICS_COLUMNS,
  primaryDiagnosis: sosPatients.primaryDiagnosis,
  status:           sosPatients.status,
  createdAt:        sosPatients.createdAt,
  updatedAt:        sosPatients.updatedAt,
} as const;

function columnsForTier(tier: PatientQueryTier) {
  if (tier === "identity")     return IDENTITY_COLUMNS;
  if (tier === "demographics") return DEMOGRAPHICS_COLUMNS;
  return FULL_COLUMNS; // episode | chart
}

/**
 * Attach active episodes to a list of patients (shared helper).
 * Only called when the tier is "episode" or "chart".
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
 *
 * @param tier - Controls which columns are fetched and whether episodes
 *   are joined.  Lower tiers fetch fewer columns and skip the episode join,
 *   minimising the data returned from the database.
 */
export async function listPatients(
  orgId: string,
  facilityId?: string,
  tier: PatientQueryTier = "chart",
): Promise<PatientWithEpisode[]> {
  try {
    const conditions = facilityId
      ? and(eq(sosPatients.orgId, orgId), eq(sosPatients.facilityId, facilityId))
      : eq(sosPatients.orgId, orgId);

    // §1: Select only the columns required by this tier.
    const rows = await db
      .select(columnsForTier(tier))
      .from(sosPatients)
      .where(conditions)
      .orderBy(sosPatients.lastName, sosPatients.firstName) as SosPatient[];

    if (tier === "identity" || tier === "demographics") {
      // No episode join needed — projectPatient will not access episode fields.
      return rows.map((p) => ({ ...p, episode: null }));
    }
    return attachEpisodes(rows, orgId);
  } catch (err) {
    throw new DatabaseError("Failed to list patients", err);
  }
}

/**
 * List only the patients explicitly assigned to a user in a given facility
 * (caseload-limited access — for BHT, aftercare_staff, billing_staff).
 *
 * @param tier                  - Same semantics as `listPatients`.
 * @param presentingAssignmentId - §6 exact-binding: when provided, only patient-access
 *   rows whose `role_assignment_id` equals this ID (or is NULL for backward compat)
 *   are included.  This ensures that in multi-grant scenarios, access rows bound to
 *   assignment B are not surfaced when the caller is presenting grant A.
 */
export async function listAssignedPatients(
  orgId: string,
  userId: string,
  facilityId?: string,
  tier: PatientQueryTier = "chart",
  presentingAssignmentId?: string,
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

    // §6: Get patient IDs where the linked role assignment is also still active.
    // Backward-compat: rows without role_assignment_id (created pre-Phase 2C) are
    // still authorized via the LEFT JOIN — only their own status/expiry gates them.
    // Rows WITH role_assignment_id must reference an active, effective assignment.
    //
    // §6 exact-binding: when presentingAssignmentId is provided, restrict the LEFT JOIN
    // to only that specific assignment.  Access rows bound to a DIFFERENT assignment ID
    // will not find a JOIN match and will be rejected by the WHERE condition below.
    const leftJoinConditions = presentingAssignmentId
      ? and(
          eq(sosRoleAssignments.id, sosPatientAccess.roleAssignmentId),
          eq(sosRoleAssignments.id, presentingAssignmentId),          // §6: exact
          eq(sosRoleAssignments.orgId, orgId),
          eq(sosRoleAssignments.userId, userId),
          eq(sosRoleAssignments.status, "active"),
          lte(sosRoleAssignments.effectiveAt, now),
          or(
            isNull(sosRoleAssignments.expiresAt),
            gt(sosRoleAssignments.expiresAt, now),
          ),
        )
      : and(
          eq(sosRoleAssignments.id, sosPatientAccess.roleAssignmentId),
          eq(sosRoleAssignments.orgId, orgId),
          eq(sosRoleAssignments.userId, userId),
          eq(sosRoleAssignments.status, "active"),
          lte(sosRoleAssignments.effectiveAt, now),
          or(
            isNull(sosRoleAssignments.expiresAt),
            gt(sosRoleAssignments.expiresAt, now),
          ),
        );

    // §2D exact-binding WHERE: NULL role_assignment_id is no longer authorized.
    // Every active access row must carry an exact assignment FK (Phase 2D migration).
    //
    // With presentingAssignmentId: only rows whose FK equals that specific assignment
    //   AND whose LEFT JOIN confirmed the assignment is active.
    // Without presentingAssignmentId: only rows whose LEFT JOIN to any active
    //   assignment succeeded (null FK rows rejected).
    const assignmentBindingCondition = presentingAssignmentId
      ? and(
          eq(sosPatientAccess.roleAssignmentId, presentingAssignmentId),
          isNotNull(sosRoleAssignments.id),
        )
      : isNotNull(sosRoleAssignments.id);

    const accessRows = await db
      .select({ patientId: sosPatientAccess.patientId, raId: sosRoleAssignments.id })
      .from(sosPatientAccess)
      .leftJoin(sosRoleAssignments, leftJoinConditions)
      .where(and(...accessConditions, assignmentBindingCondition));

    if (accessRows.length === 0) return [];

    const patientIds = [...new Set(accessRows.map((r) => r.patientId))];

    const patientConditions = [
      eq(sosPatients.orgId, orgId),
      inArray(sosPatients.id, patientIds),
    ];
    if (facilityId) {
      patientConditions.push(eq(sosPatients.facilityId, facilityId));
    }

    // §1: Select only the columns required by this tier.
    const patients = await db
      .select(columnsForTier(tier))
      .from(sosPatients)
      .where(and(...patientConditions))
      .orderBy(sosPatients.lastName, sosPatients.firstName) as SosPatient[];

    if (tier === "identity" || tier === "demographics") {
      return patients.map((p) => ({ ...p, episode: null }));
    }
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
