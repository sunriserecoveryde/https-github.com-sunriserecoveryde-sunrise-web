import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Persists the compliance audit state for each org across server restarts.
 * One row per orgId — upserted on every PUT /api/compliance/audit-state call.
 */
export const complianceAuditState = pgTable("compliance_audit_state", {
  orgId:            text("org_id").primaryKey(),
  completedIds:     jsonb("completed_ids").$type<string[]>().notNull().default([]),
  evidenceInputs:   jsonb("evidence_inputs").$type<Record<string, string>>().notNull().default({}),
  corrActionInputs: jsonb("corr_action_inputs").$type<Record<string, string>>().notNull().default({}),
  ownerInputs:      jsonb("owner_inputs").$type<Record<string, string>>().notNull().default({}),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ComplianceAuditStateRow = typeof complianceAuditState.$inferSelect;
