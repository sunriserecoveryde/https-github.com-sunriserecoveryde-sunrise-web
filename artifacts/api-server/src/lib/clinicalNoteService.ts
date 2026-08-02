/**
 * Phase 3 — Clinical Documentation Foundation
 * Service layer for clinical notes.
 *
 * Enforces:
 *  - Patient authorization (via authorize() from authorizationService)
 *  - Permission checks per operation
 *  - Draft ownership (edit and sign: must be note author)
 *  - Status transitions (cannot edit signed notes; void requires void permission)
 *  - Optimistic concurrency (version checking via WHERE version = expectedVersion)
 *  - Transactional audit events (audit write inside same transaction as state change)
 *
 * Authorization rules (from approved Phase 3 decisions):
 *  - clinical_note.create       — certified_clinician, mh_therapist, clinical_supervisor,
 *                                  cmo, nursing, prescriber
 *  - clinical_note.view         — same roles plus bht
 *  - clinical_note.edit_own_draft — same as create (author only)
 *  - clinical_note.sign_own     — same as create (author only)
 *  - clinical_note.void         — clinical_supervisor, cmo
 *  - clinical_note.audit_view   — clinical_supervisor, cmo, security_admin
 *
 * NOTE: Clinical note content MUST NOT appear in audit metadata.
 */

import { db } from "@workspace/db";
import { sosClinicalNotes, sosAuthAudit, type SosClinicalNote } from "@workspace/db";
import {
  listClinicalNotes,
  getClinicalNote,
  NotFoundError,
  DatabaseError,
  ConcurrencyError,
  NoteStatusError,
  type ClinicalNoteListItem,
  type UpdateDraftInput,
} from "@workspace/db";
import { getPatient } from "@workspace/db";
import { and, eq, ne } from "drizzle-orm";
import {
  authorize,
  type AuthenticatedIdentity,
} from "./authorizationService";
import type { PermissionCode } from "./permissionPolicy";
import type { Request } from "express";
import { logger } from "./logger";

// ── Auth context ─────────────────────────────────────────────────────────────

interface AuthContext {
  identity: AuthenticatedIdentity;
  req: Request;
}

// ── Ownership error ──────────────────────────────────────────────────────────

export class OwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnershipError";
  }
}

// ── Audit event types ────────────────────────────────────────────────────────

type ClinicalNoteAuditEvent =
  | "clinical_note_created"
  | "clinical_note_viewed"
  | "clinical_note_updated"
  | "clinical_note_signed"
  | "clinical_note_voided"
  | "clinical_note_access_denied";

interface AuditEventInput {
  eventType: ClinicalNoteAuditEvent;
  orgId: string;
  userId: string;
  sessionId: string | null;
  patientId: string;
  noteId?: string;
  outcome?: "success" | "failure" | "error";
  reasonCode?: string;
  ipAddress?: string | undefined;
}

// Fire-and-forget audit for read operations.
async function writeAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await db.insert(sosAuthAudit).values({
      orgId:      input.orgId,
      userId:     input.userId,
      sessionId:  input.sessionId ?? undefined,
      eventType:  input.eventType,
      outcome:    input.outcome ?? "success",
      reasonCode: input.reasonCode ?? undefined,
      ipAddress:  input.ipAddress ?? undefined,
      // Metadata: note id + patient id only — NEVER note content.
      metadata: {
        patientId: input.patientId,
        ...(input.noteId ? { noteId: input.noteId } : {}),
      },
    });
  } catch (err) {
    logger.error({ err, eventType: input.eventType }, "clinicalNoteService: audit write failed");
  }
}

// Transactional audit write — failure propagates to caller, rolling back the transaction.
async function writeAuditTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: AuditEventInput,
): Promise<void> {
  await tx.insert(sosAuthAudit).values({
    orgId:      input.orgId,
    userId:     input.userId,
    sessionId:  input.sessionId ?? undefined,
    eventType:  input.eventType,
    outcome:    input.outcome ?? "success",
    reasonCode: input.reasonCode ?? undefined,
    ipAddress:  input.ipAddress ?? undefined,
    metadata: {
      patientId: input.patientId,
      ...(input.noteId ? { noteId: input.noteId } : {}),
    },
  });
}

// ── Authorization helper ──────────────────────────────────────────────────────

async function authorizeNoteOp(
  auth: AuthContext,
  permission: PermissionCode,
  facilityId: string,
  patientId: string,
): Promise<void> {
  const decision = await authorize({
    identity:   auth.identity,
    permission,
    orgId:      auth.identity.orgId,
    facilityId,
    patientId,
    ipAddress:  auth.req.ip,
  });
  if (!decision.allowed) {
    // Audit denial already written inside authorize().
    const err = new Error(`Permission denied: ${permission}`);
    err.name = "AuthorizationError";
    throw err;
  }
}

// ── Create draft ─────────────────────────────────────────────────────────────

export interface CreateNoteInput {
  patientId: string;
  noteType: string;
  content: string;
  episodeId?: string | null;
}

export async function createNote(
  auth: AuthContext,
  input: CreateNoteInput,
): Promise<SosClinicalNote> {
  const patient = await getPatient(input.patientId, auth.identity.orgId);
  await authorizeNoteOp(auth, "clinical_note.create", patient.facilityId, patient.id);

  const note = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(sosClinicalNotes)
      .values({
        orgId:        auth.identity.orgId,
        facilityId:   patient.facilityId,
        patientId:    patient.id,
        episodeId:    input.episodeId ?? null,
        authorUserId: auth.identity.userId,
        noteType:     input.noteType,
        status:       "draft",
        content:      input.content,
        version:      1,
      })
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Insert returned no rows");

    await writeAuditTx(tx, {
      eventType: "clinical_note_created",
      orgId:     auth.identity.orgId,
      userId:    auth.identity.userId,
      sessionId: auth.identity.sessionId,
      patientId: patient.id,
      noteId:    row.id,
      ipAddress: auth.req.ip,
    });

    return row;
  });

  return note;
}

// ── List notes (no content) ──────────────────────────────────────────────────

export async function listNotes(
  auth: AuthContext,
  patientId: string,
): Promise<ClinicalNoteListItem[]> {
  const patient = await getPatient(patientId, auth.identity.orgId);
  await authorizeNoteOp(auth, "clinical_note.view", patient.facilityId, patient.id);

  const notes = await listClinicalNotes(auth.identity.orgId, patient.id);

  // Non-transactional audit — list view is informational.
  void writeAuditEvent({
    eventType: "clinical_note_viewed",
    orgId:     auth.identity.orgId,
    userId:    auth.identity.userId,
    sessionId: auth.identity.sessionId,
    patientId: patient.id,
    ipAddress: auth.req.ip,
  });

  return notes;
}

// ── Get note detail (full content) ───────────────────────────────────────────

export async function getNoteDetail(
  auth: AuthContext,
  patientId: string,
  noteId: string,
): Promise<SosClinicalNote> {
  const patient = await getPatient(patientId, auth.identity.orgId);
  await authorizeNoteOp(auth, "clinical_note.view", patient.facilityId, patient.id);

  const note = await getClinicalNote(noteId, auth.identity.orgId);
  // Ensure note belongs to this patient (prevents cross-patient access).
  if (note.patientId !== patient.id) throw new NotFoundError("ClinicalNote", noteId);

  void writeAuditEvent({
    eventType: "clinical_note_viewed",
    orgId:     auth.identity.orgId,
    userId:    auth.identity.userId,
    sessionId: auth.identity.sessionId,
    patientId: patient.id,
    noteId:    note.id,
    ipAddress: auth.req.ip,
  });

  return note;
}

// ── Edit draft ───────────────────────────────────────────────────────────────

export async function editDraft(
  auth: AuthContext,
  patientId: string,
  noteId: string,
  expectedVersion: number,
  data: UpdateDraftInput,
): Promise<SosClinicalNote> {
  const patient = await getPatient(patientId, auth.identity.orgId);
  await authorizeNoteOp(auth, "clinical_note.edit_own_draft", patient.facilityId, patient.id);

  // Load before transaction to verify ownership (read-only check).
  const existing = await getClinicalNote(noteId, auth.identity.orgId);
  if (existing.patientId !== patient.id) throw new NotFoundError("ClinicalNote", noteId);
  if (existing.authorUserId !== auth.identity.userId) {
    throw new OwnershipError("You can only edit your own draft notes");
  }
  if (existing.status !== "draft") {
    throw new NoteStatusError(
      `Note has status '${existing.status}' and cannot be edited`,
    );
  }

  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(sosClinicalNotes)
      .set({
        ...data,
        version:   expectedVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sosClinicalNotes.id, noteId),
          eq(sosClinicalNotes.orgId, auth.identity.orgId),
          eq(sosClinicalNotes.version, expectedVersion),
          eq(sosClinicalNotes.status, "draft"),
        ),
      )
      .returning();

    if (!rows[0]) throw new ConcurrencyError(noteId);

    await writeAuditTx(tx, {
      eventType: "clinical_note_updated",
      orgId:     auth.identity.orgId,
      userId:    auth.identity.userId,
      sessionId: auth.identity.sessionId,
      patientId: patient.id,
      noteId,
      ipAddress: auth.req.ip,
    });

    return rows[0];
  });

  return updated;
}

// ── Sign ─────────────────────────────────────────────────────────────────────

export async function signNote(
  auth: AuthContext,
  patientId: string,
  noteId: string,
  expectedVersion: number,
): Promise<SosClinicalNote> {
  const patient = await getPatient(patientId, auth.identity.orgId);
  await authorizeNoteOp(auth, "clinical_note.sign_own", patient.facilityId, patient.id);

  const existing = await getClinicalNote(noteId, auth.identity.orgId);
  if (existing.patientId !== patient.id) throw new NotFoundError("ClinicalNote", noteId);
  if (existing.authorUserId !== auth.identity.userId) {
    throw new OwnershipError("You can only sign your own notes");
  }
  if (existing.status !== "draft") {
    throw new NoteStatusError(
      `Note has status '${existing.status}' — only drafts can be signed`,
    );
  }

  const signed = await db.transaction(async (tx) => {
    const now = new Date();
    const rows = await tx
      .update(sosClinicalNotes)
      .set({
        status:         "signed",
        signedAt:       now,
        signedByUserId: auth.identity.userId,
        version:        expectedVersion + 1,
        updatedAt:      now,
      })
      .where(
        and(
          eq(sosClinicalNotes.id, noteId),
          eq(sosClinicalNotes.orgId, auth.identity.orgId),
          eq(sosClinicalNotes.version, expectedVersion),
          eq(sosClinicalNotes.status, "draft"),
        ),
      )
      .returning();

    if (!rows[0]) throw new ConcurrencyError(noteId);

    await writeAuditTx(tx, {
      eventType: "clinical_note_signed",
      orgId:     auth.identity.orgId,
      userId:    auth.identity.userId,
      sessionId: auth.identity.sessionId,
      patientId: patient.id,
      noteId,
      ipAddress: auth.req.ip,
    });

    return rows[0];
  });

  return signed;
}

// ── Void ─────────────────────────────────────────────────────────────────────

export interface VoidNoteInput {
  voidReason: string;
  expectedVersion: number;
}

export async function voidNote(
  auth: AuthContext,
  patientId: string,
  noteId: string,
  input: VoidNoteInput,
): Promise<SosClinicalNote> {
  const patient = await getPatient(patientId, auth.identity.orgId);
  await authorizeNoteOp(auth, "clinical_note.void", patient.facilityId, patient.id);

  const existing = await getClinicalNote(noteId, auth.identity.orgId);
  if (existing.patientId !== patient.id) throw new NotFoundError("ClinicalNote", noteId);
  if (existing.status === "voided") {
    throw new NoteStatusError("Note is already voided");
  }

  const voided = await db.transaction(async (tx) => {
    const now = new Date();
    const rows = await tx
      .update(sosClinicalNotes)
      .set({
        status:         "voided",
        voidedAt:       now,
        voidedByUserId: auth.identity.userId,
        voidReason:     input.voidReason.trim(),
        version:        input.expectedVersion + 1,
        updatedAt:      now,
      })
      .where(
        and(
          eq(sosClinicalNotes.id, noteId),
          eq(sosClinicalNotes.orgId, auth.identity.orgId),
          eq(sosClinicalNotes.version, input.expectedVersion),
          ne(sosClinicalNotes.status, "voided"),
        ),
      )
      .returning();

    if (!rows[0]) throw new ConcurrencyError(noteId);

    await writeAuditTx(tx, {
      eventType: "clinical_note_voided",
      orgId:     auth.identity.orgId,
      userId:    auth.identity.userId,
      sessionId: auth.identity.sessionId,
      patientId: patient.id,
      noteId,
      ipAddress: auth.req.ip,
    });

    return rows[0];
  });

  return voided;
}

// Re-export error classes for route handlers.
export { ConcurrencyError, NoteStatusError, NotFoundError, DatabaseError };
