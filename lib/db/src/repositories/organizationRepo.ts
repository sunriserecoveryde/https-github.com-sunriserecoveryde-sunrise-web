import { db } from "../client";
import { sosOrganizations, type SosOrganization, type InsertSosOrganization } from "../schema";
import { eq } from "drizzle-orm";
import { DatabaseError } from "./errors";

export async function createOrganization(
  data: InsertSosOrganization,
): Promise<SosOrganization> {
  try {
    const rows = await db.insert(sosOrganizations).values(data).returning();
    return rows[0];
  } catch (err) {
    throw new DatabaseError("Failed to create organization", err);
  }
}

export async function getOrganization(id: string): Promise<SosOrganization | null> {
  try {
    const rows = await db
      .select()
      .from(sosOrganizations)
      .where(eq(sosOrganizations.id, id))
      .limit(1);
    return rows[0] ?? null;
  } catch (err) {
    throw new DatabaseError("Failed to get organization", err);
  }
}

export async function listOrganizations(): Promise<SosOrganization[]> {
  try {
    return await db.select().from(sosOrganizations).orderBy(sosOrganizations.name);
  } catch (err) {
    throw new DatabaseError("Failed to list organizations", err);
  }
}
