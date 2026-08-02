import { db } from "../client";
import { sosFacilities, type SosFacility, type InsertSosFacility } from "../schema";
import { and, eq } from "drizzle-orm";
import { DatabaseError, NotFoundError } from "./errors";

export async function createFacility(data: InsertSosFacility): Promise<SosFacility> {
  try {
    const rows = await db.insert(sosFacilities).values(data).returning();
    return rows[0];
  } catch (err) {
    throw new DatabaseError("Failed to create facility", err);
  }
}

export async function getFacility(id: string, orgId: string): Promise<SosFacility> {
  try {
    const rows = await db
      .select()
      .from(sosFacilities)
      .where(and(eq(sosFacilities.id, id), eq(sosFacilities.orgId, orgId)))
      .limit(1);
    if (rows.length === 0) throw new NotFoundError("Facility", id);
    return rows[0];
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError("Failed to get facility", err);
  }
}

export async function listFacilities(orgId: string): Promise<SosFacility[]> {
  try {
    return await db
      .select()
      .from(sosFacilities)
      .where(eq(sosFacilities.orgId, orgId))
      .orderBy(sosFacilities.name);
  } catch (err) {
    throw new DatabaseError("Failed to list facilities", err);
  }
}
