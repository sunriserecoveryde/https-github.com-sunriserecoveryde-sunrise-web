import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment — no DOM required for pure-config tests.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
