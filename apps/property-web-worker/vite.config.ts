import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three") || id.includes("@react-three")) return "three";
            if (id.includes("maplibre")) return "map";
            if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router"))
              return "vendor";
          }
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
