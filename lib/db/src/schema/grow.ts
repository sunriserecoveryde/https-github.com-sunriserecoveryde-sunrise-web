import { pgTable, text, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// grow_users — one row per Grow app account
// ---------------------------------------------------------------------------
export const growUsers = pgTable("grow_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type GrowUser = typeof growUsers.$inferSelect;

// ---------------------------------------------------------------------------
// grow_user_state — stores the full serialised app state for a user
// ---------------------------------------------------------------------------
export const growUserState = pgTable("grow_user_state", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => growUsers.id, { onDelete: "cascade" }),
  state: jsonb("state").notNull().default("{}"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type GrowUserState = typeof growUserState.$inferSelect;
