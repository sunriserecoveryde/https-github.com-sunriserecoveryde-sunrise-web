/**
 * Phase 3 — Clinical Documentation Foundation
 * Clinical notes routes — scoped under /api/v1/patients/:patientId/clinical-notes
 *
 * Routes:
 *   POST   /v1/patients/:patientId/clinical-notes           — create draft
 *   GET    /v1/patients/:patientId/clinical-notes           — list notes (no content)
 *   GET    /v1/patients/:patientId/clinical-notes/:noteId   — get note detail (full content)
 *   PATCH  /v1/patients/:patientId/clinical-notes/:noteId   — edit draft (own, optimistic)
 *   POST   /v1/patients/:patientId/clinical-notes/:noteId/sign  — sign own draft
 *   POST   /v1/patients/:patientId/clinical-notes/:noteId/void  — void (supervisor/admin only)
 *
 * Security requirements per route:
 *   - Authenticated session
 *   - CSRF for all state-changing routes (POST, PATCH)
 *   - Organization scope from session (never from client)
 *   - Facility + patient scope from authorize()
 *   - Note-specific permission per route
 *   - Ownership enforced by service layer (edit, sign)
 *   - Current version required for mutations
 *   - Audit written inside same transaction as state change
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  createNote,
  listNotes,
  getNoteDetail,
  editDraft,
  signNote,
  voidNote,
  ConcurrencyError,
  NoteStatusError,
  OwnershipError,
  NotFoundError,
  DatabaseError,
} from "../lib/clinicalNoteService";
import { logger } from "../lib/logger";

const router = Router();

// ── UUID param validator ──────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();

function parseUuid(val: unknown): string | null {
  const r = uuidSchema.safeParse(val);
  return r.success ? r.data : null;
}

// ── Cache headers for clinical data ──────────────────────────────────────────

function setClinicalCacheHeaders(res: Response): void {
  res.set("Cache-Control", "private, no-store");
  res.set("Pragma", "no-cache");
}

// ── Centralised error handler ─────────────────────────────────────────────────

function handleNoteError(err: unknown, res: Response): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (err instanceof ConcurrencyError) {
    res.status(409).json({
      error: "Conflict",
      message: "Note was modified concurrently — reload to get the latest version",
    });
    return;
  }
  if (err instanceof NoteStatusError) {
    res.status(422).json({ error: "Unprocessable", message: err.message });
    return;
  }
  if (err instanceof OwnershipError) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  // AuthorizationError — opaque denial; do not reveal whether patient/note exists.
  if ((err as Error).name === "AuthorizationError") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (err instanceof DatabaseError) {
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }
  logger.error({ err }, "clinicalNotesV1: unexpected error");
  res.status(500).json({ error: "Internal server error" });
}

// ── POST /v1/patients/:patientId/clinical-notes ───────────────────────────────
// Create a draft note.

const createNoteSchema = z.object({
  noteType: z.enum(["progress_note", "nursing_note"]),
  content:  z.string().min(1, "Note content is required"),
  episodeId: z.string().uuid().optional().nullable(),
});

router.post(
  "/v1/patients/:patientId/clinical-notes",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) return void res.status(401).json({ error: "Authentication required" });

    const patientId = parseUuid(req.params.patientId);
    if (!patientId) return void res.status(400).json({ error: "Invalid patient id" });

    const parse = createNoteSchema.safeParse(req.body);
    if (!parse.success) {
      return void res.status(400).json({
        error: "Invalid request",
        details: parse.error.flatten().fieldErrors,
      });
    }

    try {
      const note = await createNote(
        { identity: auth, req },
        { patientId, ...parse.data },
      );
      setClinicalCacheHeaders(res);
      res.status(201).json(projectNoteResponse(note));
    } catch (err) {
      handleNoteError(err, res);
    }
  },
);

// ── GET /v1/patients/:patientId/clinical-notes ────────────────────────────────
// List notes (no content field returned — prevents bulk data exposure).

router.get(
  "/v1/patients/:patientId/clinical-notes",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) return void res.status(401).json({ error: "Authentication required" });

    const patientId = parseUuid(req.params.patientId);
    if (!patientId) return void res.status(400).json({ error: "Invalid patient id" });

    try {
      const notes = await listNotes({ identity: auth, req }, patientId);
      setClinicalCacheHeaders(res);
      res.json(notes.map(projectNoteListItem));
    } catch (err) {
      handleNoteError(err, res);
    }
  },
);

// ── GET /v1/patients/:patientId/clinical-notes/:noteId ───────────────────────
// Get full note detail including content.

router.get(
  "/v1/patients/:patientId/clinical-notes/:noteId",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) return void res.status(401).json({ error: "Authentication required" });

    const patientId = parseUuid(req.params.patientId);
    if (!patientId) return void res.status(400).json({ error: "Invalid patient id" });

    const noteId = parseUuid(req.params.noteId);
    if (!noteId) return void res.status(400).json({ error: "Invalid note id" });

    try {
      const note = await getNoteDetail({ identity: auth, req }, patientId, noteId);
      setClinicalCacheHeaders(res);
      res.json(projectNoteResponse(note));
    } catch (err) {
      handleNoteError(err, res);
    }
  },
);

// ── PATCH /v1/patients/:patientId/clinical-notes/:noteId ─────────────────────
// Edit a draft. Requires version for optimistic concurrency.

const editDraftSchema = z.object({
  content:         z.string().min(1).optional(),
  noteType:        z.enum(["progress_note", "nursing_note"]).optional(),
  expectedVersion: z.number().int().positive(),
});

router.patch(
  "/v1/patients/:patientId/clinical-notes/:noteId",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) return void res.status(401).json({ error: "Authentication required" });

    const patientId = parseUuid(req.params.patientId);
    if (!patientId) return void res.status(400).json({ error: "Invalid patient id" });

    const noteId = parseUuid(req.params.noteId);
    if (!noteId) return void res.status(400).json({ error: "Invalid note id" });

    const parse = editDraftSchema.safeParse(req.body);
    if (!parse.success) {
      return void res.status(400).json({
        error: "Invalid request",
        details: parse.error.flatten().fieldErrors,
      });
    }

    const { expectedVersion, ...data } = parse.data;

    try {
      const note = await editDraft(
        { identity: auth, req },
        patientId,
        noteId,
        expectedVersion,
        data,
      );
      setClinicalCacheHeaders(res);
      res.json(projectNoteResponse(note));
    } catch (err) {
      handleNoteError(err, res);
    }
  },
);

// ── POST /v1/patients/:patientId/clinical-notes/:noteId/sign ─────────────────
// Sign own draft. Requires version.

const signNoteSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

router.post(
  "/v1/patients/:patientId/clinical-notes/:noteId/sign",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) return void res.status(401).json({ error: "Authentication required" });

    const patientId = parseUuid(req.params.patientId);
    if (!patientId) return void res.status(400).json({ error: "Invalid patient id" });

    const noteId = parseUuid(req.params.noteId);
    if (!noteId) return void res.status(400).json({ error: "Invalid note id" });

    const parse = signNoteSchema.safeParse(req.body);
    if (!parse.success) {
      return void res.status(400).json({
        error: "Invalid request",
        details: parse.error.flatten().fieldErrors,
      });
    }

    try {
      const note = await signNote(
        { identity: auth, req },
        patientId,
        noteId,
        parse.data.expectedVersion,
      );
      setClinicalCacheHeaders(res);
      res.json(projectNoteResponse(note));
    } catch (err) {
      handleNoteError(err, res);
    }
  },
);

// ── POST /v1/patients/:patientId/clinical-notes/:noteId/void ─────────────────
// Void a signed note. Requires void permission + reason.

const voidNoteSchema = z.object({
  voidReason:      z.string().min(1, "Void reason is required"),
  expectedVersion: z.number().int().positive(),
});

router.post(
  "/v1/patients/:patientId/clinical-notes/:noteId/void",
  async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) return void res.status(401).json({ error: "Authentication required" });

    const patientId = parseUuid(req.params.patientId);
    if (!patientId) return void res.status(400).json({ error: "Invalid patient id" });

    const noteId = parseUuid(req.params.noteId);
    if (!noteId) return void res.status(400).json({ error: "Invalid note id" });

    const parse = voidNoteSchema.safeParse(req.body);
    if (!parse.success) {
      return void res.status(400).json({
        error: "Invalid request",
        details: parse.error.flatten().fieldErrors,
      });
    }

    try {
      const note = await voidNote(
        { identity: auth, req },
        patientId,
        noteId,
        parse.data,
      );
      setClinicalCacheHeaders(res);
      res.json(projectNoteResponse(note));
    } catch (err) {
      handleNoteError(err, res);
    }
  },
);

// ── Response projections ──────────────────────────────────────────────────────
// Minimum-necessary fields — never include org-internal IDs in list projection.
// Full content is only returned on the detail endpoint.

function projectNoteResponse(note: {
  id: string; orgId: string; facilityId: string; patientId: string; episodeId: string | null;
  authorUserId: string; noteType: string; status: string; content: string; version: number;
  signedAt: Date | null; signedByUserId: string | null;
  voidedAt: Date | null; voidedByUserId: string | null; voidReason: string | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id:              note.id,
    patientId:       note.patientId,
    episodeId:       note.episodeId,
    authorUserId:    note.authorUserId,
    noteType:        note.noteType,
    status:          note.status,
    content:         note.content,
    version:         note.version,
    signedAt:        note.signedAt?.toISOString() ?? null,
    signedByUserId:  note.signedByUserId,
    voidedAt:        note.voidedAt?.toISOString() ?? null,
    voidedByUserId:  note.voidedByUserId,
    voidReason:      note.voidReason,
    createdAt:       note.createdAt.toISOString(),
    updatedAt:       note.updatedAt.toISOString(),
  };
}

function projectNoteListItem(note: {
  id: string; patientId: string; episodeId: string | null;
  authorUserId: string; noteType: string; status: string; version: number;
  signedAt: Date | null; signedByUserId: string | null;
  voidedAt: Date | null; voidedByUserId: string | null; voidReason: string | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id:              note.id,
    patientId:       note.patientId,
    episodeId:       note.episodeId,
    authorUserId:    note.authorUserId,
    noteType:        note.noteType,
    status:          note.status,
    version:         note.version,
    signedAt:        note.signedAt?.toISOString() ?? null,
    signedByUserId:  note.signedByUserId,
    voidedAt:        note.voidedAt?.toISOString() ?? null,
    voidedByUserId:  note.voidedByUserId,
    voidReason:      note.voidReason,
    createdAt:       note.createdAt.toISOString(),
    updatedAt:       note.updatedAt.toISOString(),
    // content is intentionally excluded from list response
  };
}

export default router;
