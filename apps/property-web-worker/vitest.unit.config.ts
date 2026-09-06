import { defineConfig } from "vitest/config";

/** Unit tests only — no Cloudflare Vite plugin (needs API token remotely). */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/worker/**/*.test.ts", "src/**/*.test.ts"],
  },
});
