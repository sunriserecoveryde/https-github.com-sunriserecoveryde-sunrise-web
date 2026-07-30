import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Persists the compliance audit state for each org across server restarts.
 * One row per orgId — upserted on every PUT /api/compliance/audit-state call.
 *
 * auditResetAt — stamped whenever a compliance officer triggers a full audit
 * reset.  The client compares this against its locally-stored reset timestamp
 * on mount; if the server value is newer it clears the local audit log so a
 * reload after a reset never re-populates from stale localStorage data.
 */
export const complianceAuditState = pgTable("compliance_audit_state", {
  orgId:            text("org_id").primaryKey(),
  completedIds:     jsonb("completed_ids").$type<string[]>().notNull().default([]),
  evidenceInputs:   jsonb("evidence_inputs").$type<Record<string, string>>().notNull().default({}),
  corrActionInputs: jsonb("corr_action_inputs").$type<Record<string, string>>().notNull().default({}),
  ownerInputs:      jsonb("owner_inputs").$type<Record<string, string>>().notNull().default({}),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  auditResetAt:     timestamp("audit_reset_at", { withTimezone: true }),
});

export type ComplianceAuditStateRow = typeof complianceAuditState.$inferSelect;
