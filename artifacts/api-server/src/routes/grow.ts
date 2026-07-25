/**
 * Grow Motivational App — user authentication and data sync routes
 *
 * POST /grow/register  — create account
 * POST /grow/login     — sign in
 * GET  /grow/me        — fetch synced state (Bearer token required)
 * PUT  /grow/sync      — upload full state (Bearer token required)
 */

import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { growUsers, growUserState } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET env var is required for Grow JWT auth — server cannot start without it.",
  );
}
const JWT_SECRET: string = process.env.SESSION_SECRET;
const JWT_EXPIRES_IN = "90d";
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const AuthSchema = z.object({
  email: z.string().email().max(320).toLowerCase(),
  password: z.string().min(8).max(200),
});

const StateSnapshotSchema = z.object({
  userName: z.string().max(80).optional().default(""),
  userType: z.string().max(40).optional().default(""),
  sobrietyStartDate: z.string().nullable().optional().default(null),
  lessonsCompleted: z.array(z.string()).optional().default([]),
  skillsUsed: z.array(z.string()).optional().default([]),
  journalEntries: z.array(z.any()).optional().default([]),
  dailyMoods: z.array(z.any()).optional().default([]),
});

type StateSnapshot = z.infer<typeof StateSnapshotSchema>;

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------
function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string };
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
interface AuthedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Token expired or invalid" });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EMPTY_SNAPSHOT: StateSnapshot = {
  userName: "",
  userType: "",
  sobrietyStartDate: null,
  lessonsCompleted: [],
  skillsUsed: [],
  journalEntries: [],
  dailyMoods: [],
};

async function getState(userId: string): Promise<StateSnapshot> {
  const rows = await db
    .select()
    .from(growUserState)
    .where(eq(growUserState.userId, userId));
  if (rows.length === 0) return EMPTY_SNAPSHOT;
  return (rows[0].state as StateSnapshot) ?? EMPTY_SNAPSHOT;
}

// ---------------------------------------------------------------------------
// POST /grow/register
// ---------------------------------------------------------------------------
router.post("/grow/register", async (req, res) => {
  const parsed = AuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  // Check duplicate
  const existing = await db.select().from(growUsers).where(eq(growUsers.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [user] = await db
    .insert(growUsers)
    .values({ email, passwordHash })
    .returning();

  const token = signToken(user.id);
  logger.info({ userId: user.id }, "Grow user registered");

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email },
    data: EMPTY_SNAPSHOT,
  });
});

// ---------------------------------------------------------------------------
// POST /grow/login
// ---------------------------------------------------------------------------
router.post("/grow/login", async (req, res) => {
  const parsed = AuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const { email, password } = parsed.data;
  const rows = await db.select().from(growUsers).where(eq(growUsers.email, email));
  if (rows.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user.id);
  const data = await getState(user.id);
  logger.info({ userId: user.id }, "Grow user logged in");

  res.json({
    token,
    user: { id: user.id, email: user.email },
    data,
  });
});

// ---------------------------------------------------------------------------
// GET /grow/me
// ---------------------------------------------------------------------------
router.get("/grow/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const rows = await db.select().from(growUsers).where(eq(growUsers.id, userId));
  if (rows.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const user = rows[0];
  const data = await getState(userId);

  res.json({ user: { id: user.id, email: user.email }, data });
});

// ---------------------------------------------------------------------------
// PUT /grow/sync
// ---------------------------------------------------------------------------
router.put("/grow/sync", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = StateSnapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid state payload", details: parsed.error.flatten() });
    return;
  }

  const userId = req.userId!;
  await db
    .insert(growUserState)
    .values({ userId, state: parsed.data as object, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: growUserState.userId,
      set: { state: parsed.data as object, updatedAt: new Date() },
    });

  res.json({ ok: true });
});

export default router;
