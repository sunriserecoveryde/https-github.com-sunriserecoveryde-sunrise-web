/**
 * Phase 3 — Clinical Documentation Foundation
 * Repository for sos_clinical_notes.
 *
 * All mutations use optimistic concurrency (version check).
 * The repository never enforces business rules beyond what the DB constraints
 * already enforce — authorization and ownership are validated in the service layer.
 */

import { db } from "../client";
import {
  sosClinicalNotes,
  type SosClinicalNote,
  type InsertSosClinicalNote,
  type ClinicalNoteStatus,
} from "../schema";
import { and, eq, desc } from "drizzle-orm";
import { DatabaseError, NotFoundError } from "./errors";

// ── ConcurrencyError ─────────────────────────────────────────────────────────
export class ConcurrencyError extends Error {
  constructor(noteId: string) {
    super(`Clinical note ${noteId} was modified concurrently — please reload`);
    this.name = "ConcurrencyError";
  }
}

// ── Status transition error ──────────────────────────────────────────────────
export class NoteStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoteStatusError";
  }
}

// ── List query result (no content — minimum-necessary projection) ────────────
export interface ClinicalNoteListItem {
  id: string;
  orgId: string;
  facilityId: string;
  patientId: string;
  episodeId: string | null;
  authorUserId: string;
  noteType: string;
  status: string;
  version: number;
  signedAt: Date | null;
  signedByUserId: string | null;
  voidedAt: Date | null;
  voidedByUserId: string | null;
  voidReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  // content is intentionally excluded from the list projection
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createClinicalNote(
  data: InsertSosClinicalNote,
): Promise<SosClinicalNote> {
  try {
    const rows = await db
      .insert(sosClinicalNotes)
      .values({ ...data, version: 1, status: "draft" })
      .returning();
    if (!rows[0]) throw new DatabaseError("Insert returned no rows");
    return rows[0];
  } catch (err) {
    if (err instanceof DatabaseError) throw err;
    throw new DatabaseError("Failed to create clinical note", err);
  }
}

// ── List (without content) ───────────────────────────────────────────────────

export async function listClinicalNotes(
  orgId: string,
  patientId: string,
): Promise<ClinicalNoteListItem[]> {
  try {
    return await db
      .select({
        id:               sosClinicalNotes.id,
        orgId:            sosClinicalNotes.orgId,
        facilityId:       sosClinicalNotes.facilityId,
        patientId:        sosClinicalNotes.patientId,
        episodeId:        sosClinicalNotes.episodeId,
        authorUserId:     sosClinicalNotes.authorUserId,
        noteType:         sosClinicalNotes.noteType,
        status:           sosClinicalNotes.status,
        version:          sosClinicalNotes.version,
        signedAt:         sosClinicalNotes.signedAt,
        signedByUserId:   sosClinicalNotes.signedByUserId,
        voidedAt:         sosClinicalNotes.voidedAt,
        voidedByUserId:   sosClinicalNotes.voidedByUserId,
        voidReason:       sosClinicalNotes.voidReason,
        createdAt:        sosClinicalNotes.createdAt,
        updatedAt:        sosClinicalNotes.updatedAt,
        // content excluded — callers must call getClinicalNote for full content
      })
      .from(sosClinicalNotes)
      .where(
        and(
          eq(sosClinicalNotes.orgId, orgId),
          eq(sosClinicalNotes.patientId, patientId),
        ),
      )
      .orderBy(desc(sosClinicalNotes.createdAt));
  } catch (err) {
    throw new DatabaseError("Failed to list clinical notes", err);
  }
}

// ── Get by ID (full content) ─────────────────────────────────────────────────

export async function getClinicalNote(
  noteId: string,
  orgId: string,
): Promise<SosClinicalNote> {
  try {
    const rows = await db
      .select()
      .from(sosClinicalNotes)
      .where(
        and(
          eq(sosClinicalNotes.id, noteId),
          eq(sosClinicalNotes.orgId, orgId),
        ),
      )
      .limit(1);
    if (!rows[0]) throw new NotFoundError("ClinicalNote", noteId);
    return rows[0];
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError("Failed to get clinical note", err);
  }
}

// ── Update draft (optimistic concurrency) ────────────────────────────────────

export interface UpdateDraftInput {
  content?: string;
  noteType?: string;
}

export async function updateClinicalNoteDraft(
  noteId: string,
  orgId: string,
  expectedVersion: number,
  data: UpdateDraftInput,
): Promise<SosClinicalNote> {
  try {
    // First, verify it exists and is a draft in this org.
    const existing = await getClinicalNote(noteId, orgId);
    if (existing.status !== "draft") {
      throw new NoteStatusError(
        `Clinical note ${noteId} has status '${existing.status}' and cannot be edited`,
      );
    }

    const rows = await db
      .update(sosClinicalNotes)
      .set({
        ...data,
        version: expectedVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sosClinicalNotes.id, noteId),
          eq(sosClinicalNotes.orgId, orgId),
          eq(sosClinicalNotes.version, expectedVersion),
          eq(sosClinicalNotes.status, "draft"),
        ),
      )
      .returning();

    if (!rows[0]) {
      // Row matched on id+org but version check failed (concurrent update).
      throw new ConcurrencyError(noteId);
    }
    return rows[0];
  } catch (err) {
    if (
      err instanceof NotFoundError ||
      err instanceof ConcurrencyError ||
      err instanceof NoteStatusError
    ) throw err;
    throw new DatabaseError("Failed to update clinical note draft", err);
  }
}

// ── Sign (optimistic concurrency) ────────────────────────────────────────────

export async function signClinicalNote(
  noteId: string,
  orgId: string,
  signerUserId: string,
  expectedVersion: number,
): Promise<SosClinicalNote> {
  try {
    const existing = await getClinicalNote(noteId, orgId);
    if (existing.status !== "draft") {
      throw new NoteStatusError(
        `Clinical note ${noteId} has status '${existing.status}' — only drafts can be signed`,
      );
    }

    const now = new Date();
    const rows = await db
      .update(sosClinicalNotes)
      .set({
        status:           "signed" as ClinicalNoteStatus,
        signedAt:         now,
        signedByUserId:   signerUserId,
        version:          expectedVersion + 1,
        updatedAt:        now,
      })
      .where(
        and(
          eq(sosClinicalNotes.id, noteId),
          eq(sosClinicalNotes.orgId, orgId),
          eq(sosClinicalNotes.version, expectedVersion),
          eq(sosClinicalNotes.status, "draft"),
        ),
      )
      .returning();

    if (!rows[0]) throw new ConcurrencyError(noteId);
    return rows[0];
  } catch (err) {
    if (
      err instanceof NotFoundError ||
      err instanceof ConcurrencyError ||
      err instanceof NoteStatusError
    ) throw err;
    throw new DatabaseError("Failed to sign clinical note", err);
  }
}

// ── Void ─────────────────────────────────────────────────────────────────────

export async function voidClinicalNote(
  noteId: string,
  orgId: string,
  voidingUserId: string,
  voidReason: string,
  expectedVersion: number,
): Promise<SosClinicalNote> {
  try {
    const existing = await getClinicalNote(noteId, orgId);
    if (existing.status === "voided") {
      throw new NoteStatusError(`Clinical note ${noteId} is already voided`);
    }

    const now = new Date();
    const rows = await db
      .update(sosClinicalNotes)
      .set({
        status:         "voided" as ClinicalNoteStatus,
        voidedAt:       now,
        voidedByUserId: voidingUserId,
        voidReason:     voidReason.trim(),
        version:        expectedVersion + 1,
        updatedAt:      now,
      })
      .where(
        and(
          eq(sosClinicalNotes.id, noteId),
          eq(sosClinicalNotes.orgId, orgId),
          eq(sosClinicalNotes.version, expectedVersion),
        ),
      )
      .returning();

    if (!rows[0]) throw new ConcurrencyError(noteId);
    return rows[0];
  } catch (err) {
    if (
      err instanceof NotFoundError ||
      err instanceof ConcurrencyError ||
      err instanceof NoteStatusError
    ) throw err;
    throw new DatabaseError("Failed to void clinical note", err);
  }
}
