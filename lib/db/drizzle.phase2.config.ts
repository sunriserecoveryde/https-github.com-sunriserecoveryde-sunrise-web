/**
 * Phase 2 Upgrade Proof — drizzle-kit config for migrations 0000–0005 only.
 *
 * Used exclusively to simulate a clean Phase 2 install in the upgrade proof.
 * Points to `drizzle/phase2-proof/` which contains the same SQL files as the
 * main `drizzle/` directory for entries 0000–0005, with a journal that stops
 * at migration 0005.  The proof script then switches to the main config
 * (`drizzle.config.ts`) so drizzle-kit can apply migration 0006 as the sole
 * pending entry.
 *
 * This file must NOT be used for production migrations.
 */

import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL required");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./drizzle/phase2-proof"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    schema: "drizzle",
    table: "__drizzle_migrations",
  },
});
