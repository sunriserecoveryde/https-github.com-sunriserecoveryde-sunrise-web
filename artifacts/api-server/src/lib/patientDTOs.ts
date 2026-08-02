/**
 * Phase 2C — Field-level patient response DTOs (§1)
 *
 * Applies per-permission field gates to patient data before it leaves the server.
 * The caller's permission set determines which fields are included in the response.
 *
 * Permission tiers (additive):
 *  patient.list.view       → PatientIdentityDTO   (identity only)
 *  patient.demographics.view → PatientDemographicsDTO (+ PII fields)
 *  patient.episode.view    → PatientEpisodeSummaryDTO (+ episode data)
 *  patient.chart.view      → PatientChartDTO       (+ full clinical record)
 *
 * Rules:
 *  - No field from a higher tier can leak into a lower tier response.
 *  - The projection is computed from the UNION of all the caller's grants.
 *  - Multiple grants may cover different permissions; the union is taken.
 *  - Fields NOT in the caller's tier are completely absent from the object
 *    (not null, not undefined — absent).
 */

import type { PatientWithEpisode } from "@workspace/db";
import type { PermissionCode } from "./permissionPolicy";

// ── DTO types ─────────────────────────────────────────────────────────────────

/** Tier 1: patient.list.view only */
export interface PatientIdentityDTO {
  id: string;
  firstName: string;
  lastName: string;
  facilityId: string;
  orgId: string;
}

/** Tier 2: + patient.demographics.view */
export interface PatientDemographicsDTO extends PatientIdentityDTO {
  mrn: string;
  dateOfBirth: string | null;
  gender: string | null;
  insurancePayer: string | null;
}

/** Tier 3: + patient.episode.view */
export interface PatientEpisodeSummaryDTO extends PatientDemographicsDTO {
  episode: {
    id: string;
    program: string;
    levelOfCare: string | null;
    admissionDate: string | null;
    dischargeDate: string | null;
    episodeStatus: string;
    createdAt: string;
  } | null;
}

/** Tier 4: + patient.chart.view */
export interface PatientChartDTO extends PatientEpisodeSummaryDTO {
  /** Timestamp the patient record was first created */
  createdAt: string;
  /** Timestamp the patient record was last updated */
  updatedAt: string;
}

export type AnyPatientDTO =
  | PatientIdentityDTO
  | PatientDemographicsDTO
  | PatientEpisodeSummaryDTO
  | PatientChartDTO;

// ── Projection function ───────────────────────────────────────────────────────

/**
 * Project a full patient record to the field set authorized by the caller's
 * permission set.
 *
 * The permissionSet must already have been validated (caller has patient.list.view).
 */
export function projectPatient(
  patient: PatientWithEpisode,
  permissionSet: ReadonlySet<PermissionCode>,
): AnyPatientDTO {
  // Tier 1 — always included (caller must have patient.list.view to reach here)
  const identity: PatientIdentityDTO = {
    id:         patient.id,
    firstName:  patient.firstName,
    lastName:   patient.lastName,
    facilityId: patient.facilityId,
    orgId:      patient.orgId,
  };

  if (!permissionSet.has("patient.demographics.view")) {
    return identity;
  }

  // Tier 2 — demographics fields added
  const demographics: PatientDemographicsDTO = {
    ...identity,
    mrn:            patient.mrn,
    dateOfBirth:    patient.dateOfBirth ?? null,
    gender:         patient.gender ?? null,
    insurancePayer: patient.insurancePayer ?? null,
  };

  if (!permissionSet.has("patient.episode.view")) {
    return demographics;
  }

  // Tier 3 — episode summary added
  const ep = patient.episode;
  const episodeSummary: PatientEpisodeSummaryDTO = {
    ...demographics,
    episode: ep
      ? {
          id:           ep.id,
          program:      ep.program,
          levelOfCare:  ep.levelOfCare ?? null,
          admissionDate: ep.admissionDate ?? null,
          dischargeDate: ep.dischargeDate ?? null,
          episodeStatus: ep.episodeStatus,
          createdAt:    ep.createdAt.toISOString(),
        }
      : null,
  };

  if (!permissionSet.has("patient.chart.view")) {
    return episodeSummary;
  }

  // Tier 4 — full chart record
  const chart: PatientChartDTO = {
    ...episodeSummary,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };

  return chart;
}

/**
 * Build the effective permission set for the list/detail routes.
 * Takes the UNION of permissions across all grants that authorize patient.list.view.
 */
export function buildPatientPermissionSet(
  grantPermissions: readonly PermissionCode[][],
): ReadonlySet<PermissionCode> {
  const set = new Set<PermissionCode>();
  for (const perms of grantPermissions) {
    for (const p of perms) {
      set.add(p);
    }
  }
  return set;
}
