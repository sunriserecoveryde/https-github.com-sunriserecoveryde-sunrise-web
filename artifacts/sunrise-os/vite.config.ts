import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// PORT and BASE_PATH are required at dev/preview runtime but not during
// a CI production build (vite build), where server/preview config is unused.
const isBuild = process.argv.includes('build');

const rawPort = process.env.PORT;
if (!rawPort && !isBuild) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}
const port = rawPort ? Number(rawPort) : 3000;
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;
if (!basePath && !isBuild) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    // Prevent Vite's file-watcher from triggering HMR on files written by
    // Playwright during test runs (sessions, traces, snapshots, logs).
    // Without these exclusions the SPA remounts in a tight loop every ~0.5 s
    // for the entire 120 s test window, making navigateToPatient/tab clicks
    // time out consistently.
    watch: {
      // Exclude every directory that Playwright writes to during a test run.
      // Without these, Vite's chokidar watcher detects the writes (session JSON,
      // screenshot PNGs, trace ZIPs, HAR files) and fires HMR updates.  Each
      // HMR update causes the SPA to remount, triggering rapid AuthContext
      // csrf-token + auth/session calls (~2/s) for the entire 120 s test window.
      ignored: [
        '**/e2e/sessions/**',
        '**/e2e/screenshots/**',
        '**/e2e/traces/**',
        '**/playwright-results/**',
        '**/playwright-report/**',
        '**/readiness/**',
        '**/.playwright-artifacts**',
      ],
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
