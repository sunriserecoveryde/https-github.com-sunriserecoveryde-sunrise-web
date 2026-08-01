import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests hit the real dev PostgreSQL database.
    // Run sequentially within a single worker to avoid inter-suite interference.
    singleThread: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
