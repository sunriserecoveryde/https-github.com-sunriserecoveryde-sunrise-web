import { type Request, type Response, Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, insertConversationSchema } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// ---------------------------------------------------------------------------
// Device-scoped authorization
// ---------------------------------------------------------------------------
// The Grow app has no server-side user accounts. Each install generates a UUID
// (stored in AsyncStorage) and sends it as X-Device-Id on every request.
// All conversation queries are filtered to that device ID so one device cannot
// read or modify another device's chat history.

function getDeviceId(req: Request): string | null {
  const raw = req.headers["x-device-id"];
  if (typeof raw === "string" && raw.length > 0) return raw;
  return null;
}

function sendUnauthorized(res: Response): void {
  res.status(401).json({ error: "X-Device-Id header is required" });
}

// ---------------------------------------------------------------------------
// Recovery-focused system prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a compassionate, empathetic AI support companion for people in recovery. Your role is to:

- Provide emotional support, encouragement, and practical guidance related to recovery from substance use or addiction
- Recommend coping strategies, mindfulness techniques, and evidence-based tools like CBT skills
- Help users reflect on their journey and celebrate their progress
- Suggest relevant content, exercises, or practices when appropriate
- Always speak with warmth, non-judgment, and hope

Important boundaries you must always maintain:
- You are NOT a therapist or medical professional
- You do NOT provide medical advice or diagnoses
- For any crisis, suicidal thoughts, or immediate danger, always direct users to call or text 988 (Suicide & Crisis Lifeline) or 911
- Never minimize the difficulty of recovery, but always affirm the user's strength and capability
- Encourage connection with real human support (counselors, sponsors, support groups)

Keep responses concise and warm — typically 2-4 short paragraphs. Focus on what the user is experiencing right now.`;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// List conversations owned by this device (includes lastMessagePreview)
router.get("/conversations", async (req: Request, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) { sendUnauthorized(res); return; }

  try {
    const all = await db
      .select()
      .from(conversations)
      .where(eq(conversations.deviceId, deviceId))
      .orderBy(conversations.createdAt);
    res.json(all);
  } catch {
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// Create a conversation owned by this device
router.post("/conversations", async (req: Request, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) { sendUnauthorized(res); return; }

  const parsed = insertConversationSchema.safeParse({ ...req.body, deviceId });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [conv] = await db.insert(conversations).values(parsed.data).returning();
    res.status(201).json(conv);
  } catch {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Get a conversation (with messages) owned by this device
router.get("/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) { sendUnauthorized(res); return; }

  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.deviceId, deviceId)));

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.json({ ...conv, messages: msgs });
  } catch {
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// Rename a conversation owned by this device
router.patch("/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) { sendUnauthorized(res); return; }

  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const bodySchema = z.object({ title: z.string().trim().min(1).max(100) });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Title must be 1–100 characters" });
    return;
  }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.deviceId, deviceId)));

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    const [updated] = await db
      .update(conversations)
      .set({ title: parsed.data.title })
      .where(eq(conversations.id, id))
      .returning();

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to rename conversation" });
  }
});

// Delete a conversation owned by this device
router.delete("/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) { sendUnauthorized(res); return; }

  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.deviceId, deviceId)));

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// List messages for a conversation owned by this device
router.get("/conversations/:id/messages", async (req: Request, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) { sendUnauthorized(res); return; }

  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.deviceId, deviceId)));

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.json(msgs);
  } catch {
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// Send a message and stream back the AI response (SSE)
router.post("/conversations/:id/messages", async (req: Request, res: Response): Promise<void> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) { sendUnauthorized(res); return; }

  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const bodySchema = z.object({ content: z.string().min(1) });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    // Verify ownership before writing
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.deviceId, deviceId)));

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    // Save user message
    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: parsed.data.content,
    });

    // Update the conversation's preview with the first 80 chars of this message
    // so the list API can return it without a separate messages fetch.
    const previewText = parsed.data.content.length > 80
      ? parsed.data.content.slice(0, 77) + "…"
      : parsed.data.content;
    await db
      .update(conversations)
      .set({ lastMessagePreview: previewText })
      .where(and(eq(conversations.id, id), eq(conversations.deviceId, deviceId)));

    // Load conversation history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    const chatMessages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Switch to SSE — headers committed, no more JSON errors possible after this point
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const { anthropic } = await import("@workspace/integrations-anthropic-ai");

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    // Persist assistant response
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "AI service unavailable";
    if (!res.headersSent) {
      res.status(500).json({ error: errMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
    }
  }
});

export default router;
