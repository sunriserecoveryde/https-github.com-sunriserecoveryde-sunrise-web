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
    // Cap parallel file execution so that the 14 test-file forks do not exhaust
    // the PostgreSQL server's max_connections simultaneously.  Each fork creates
    // its own pg.Pool (up to 10 conns); with maxForks=4 the ceiling is 40 < 100.
    poolOptions: { forks: { maxForks: 4 } },
    // Raise test timeout from the 5 s default to 20 s.  Most tests complete in
    // < 200 ms; the elevated ceiling absorbs transient DB contention that can
    // push a request past 5 s when concurrent forks peak simultaneously.
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@workspace/db": path.resolve(__dirname, "../../lib/db/src/index.ts"),
    },
  },
});
