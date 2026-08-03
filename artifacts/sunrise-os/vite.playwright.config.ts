/**
 * Vite config for Playwright browser tests.
 * Starts the frontend in production-data mode with an API proxy
 * so "/api/*" reaches the API server running on localhost:8080.
 */
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const port = parseInt(process.env.PORT ?? "23456", 10);

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    // Proxy /api/* → API server on port 8080.
    // The Replit proxy strips the /api prefix before forwarding; replicate that here.
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/api/, ""),
      },
    },
  },
});
