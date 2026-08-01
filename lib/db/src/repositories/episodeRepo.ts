import { db } from "../client";
import {
  sosEpisodesOfCare,
  type SosEpisodeOfCare,
  type InsertSosEpisode,
} from "../schema";
import { and, eq, desc } from "drizzle-orm";
import { DatabaseError, NotFoundError } from "./errors";

export async function createEpisode(data: InsertSosEpisode): Promise<SosEpisodeOfCare> {
  try {
    const rows = await db.insert(sosEpisodesOfCare).values(data).returning();
    return rows[0];
  } catch (err) {
    throw new DatabaseError("Failed to create episode", err);
  }
}

export async function getActiveEpisode(
  patientId: string,
  orgId: string,
): Promise<SosEpisodeOfCare | null> {
  try {
    const rows = await db
      .select()
      .from(sosEpisodesOfCare)
      .where(
        and(
          eq(sosEpisodesOfCare.patientId, patientId),
          eq(sosEpisodesOfCare.orgId, orgId),
          eq(sosEpisodesOfCare.episodeStatus, "active"),
        ),
      )
      .orderBy(desc(sosEpisodesOfCare.createdAt))
      .limit(1);
    return rows[0] ?? null;
  } catch (err) {
    throw new DatabaseError("Failed to get active episode", err);
  }
}

export async function listPatientEpisodes(
  patientId: string,
  orgId: string,
): Promise<SosEpisodeOfCare[]> {
  try {
    return await db
      .select()
      .from(sosEpisodesOfCare)
      .where(
        and(
          eq(sosEpisodesOfCare.patientId, patientId),
          eq(sosEpisodesOfCare.orgId, orgId),
        ),
      )
      .orderBy(desc(sosEpisodesOfCare.createdAt));
  } catch (err) {
    throw new DatabaseError("Failed to list patient episodes", err);
  }
}
