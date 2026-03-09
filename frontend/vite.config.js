import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

export default defineConfig({
  base: process.env.VITE_ASSETS_BASE_URL || "/",
  plugins: [
    react(),
    // Pre-compress assets with Brotli at build time (~20-30% smaller than GZip)
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    // Also produce GZip fallback for older clients
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
  ],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true, // Ensure server listens on all IPs
    watch: {
      usePolling: true, // Necessary for Docker on Windows
    },
    proxy: {
      // Proxy API requests to the backend
      // Use 'backend' service name in Docker, localhost otherwise
      "/api": process.env.DOCKER_ENV 
        ? "http://backend:8000"
        : (process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000"),
      "/static": process.env.DOCKER_ENV 
        ? "http://backend:8000"
        : (process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
