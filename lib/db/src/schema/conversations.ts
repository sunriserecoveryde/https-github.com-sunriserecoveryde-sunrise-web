import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // Per-device ownership token — a UUID generated on the mobile client and sent
  // as the X-Device-Id header. All read/write/delete operations are scoped to
  // this value so one device cannot access another device's conversations.
  deviceId: text("device_id").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // Truncated first-user-message text; updated server-side so the list API can
  // return previews without any extra per-conversation fetch.
  lastMessagePreview: text("last_message_preview"),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
