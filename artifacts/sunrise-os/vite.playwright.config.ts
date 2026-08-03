/**
 * Vite config for Playwright browser tests.
 *
 * Starts the frontend in production-data mode with an API proxy so
 * "/api/*" reaches the dedicated test API server.
 *
 * The test API runs on PLAYWRIGHT_API_PORT (default 8081) with
 * DISABLE_AUTH_FALLBACK=true — no dev identity is injected for any request.
 */
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const port    = parseInt(process.env.PORT ?? "23456", 10);
const apiPort = parseInt(process.env.PLAYWRIGHT_API_PORT ?? "8099", 10);

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@":       path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  server: {
    port,
    strictPort: true,
    host:        "0.0.0.0",
    allowedHosts: true,
    proxy: {
      // Proxy /api/* → dedicated test API (DISABLE_AUTH_FALLBACK=true).
      // Keep the /api prefix intact — the API server mounts routes at
      // /api/v1/... so we must NOT strip the prefix.
      // changeOrigin rewrites the Host header to avoid "Host not allowed".
      "/api": {
        target:       `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
