import { db } from "../client";
import {
  sosStaffProfiles,
  sosUserIdentityRefs,
  type SosStaffProfile,
  type InsertSosStaffProfile,
} from "../schema";
import { and, eq } from "drizzle-orm";
import { DatabaseError, NotFoundError } from "./errors";

export async function createStaffProfile(
  data: InsertSosStaffProfile,
): Promise<SosStaffProfile> {
  try {
    const rows = await db.insert(sosStaffProfiles).values(data).returning();
    return rows[0];
  } catch (err) {
    throw new DatabaseError("Failed to create staff profile", err);
  }
}

export async function createUserIdentityRef(orgId: string): Promise<typeof sosUserIdentityRefs.$inferSelect> {
  try {
    const rows = await db.insert(sosUserIdentityRefs).values({ orgId }).returning();
    return rows[0];
  } catch (err) {
    throw new DatabaseError("Failed to create user identity ref", err);
  }
}

export async function getStaffProfile(id: string, orgId: string): Promise<SosStaffProfile> {
  try {
    const rows = await db
      .select()
      .from(sosStaffProfiles)
      .where(and(eq(sosStaffProfiles.id, id), eq(sosStaffProfiles.orgId, orgId)))
      .limit(1);
    if (rows.length === 0) throw new NotFoundError("StaffProfile", id);
    return rows[0];
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError("Failed to get staff profile", err);
  }
}

export async function listStaffProfiles(orgId: string): Promise<SosStaffProfile[]> {
  try {
    return await db
      .select()
      .from(sosStaffProfiles)
      .where(eq(sosStaffProfiles.orgId, orgId))
      .orderBy(sosStaffProfiles.displayName);
  } catch (err) {
    throw new DatabaseError("Failed to list staff profiles", err);
  }
}
