import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { stampBuildEnvironment } from "./stamp-build-env.mjs";

export default defineConfig({
  plugins: [react(), cloudflare({
    // Local QA must not require Cloudflare API token / remote AI proxy
    remoteBindings: false,
  }), {
    name: "stamp-build-environment",
    apply: "build",
    closeBundle() {
      // Vite loads this config in Node. This tsconfig has no @types/node.
      // @ts-expect-error process is provided by the Node runtime that loads vite.config.ts
      stampBuildEnvironment("dist", process.env.CLOUDFLARE_ENV);
    },
  }],
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
