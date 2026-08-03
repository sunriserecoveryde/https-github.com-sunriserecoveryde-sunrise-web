import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    globals: false,
    coverage: { provider: "v8" },
    // Run each test file in a separate OS process so that vi.resetModules() calls
    // in auth-p2d-rate-limit.test.ts cannot pollute module registries in sibling
    // test files regardless of execution order.
    pool: "forks",
  },
  resolve: {
    alias: {
      "@workspace/db": path.resolve(__dirname, "../../lib/db/src/index.ts"),
    },
  },
});
