import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary"],
      // The logic that matters: models, services, and server actions. UI components
      // are covered by the Playwright suite instead.
      include: ["src/services/**", "src/lib/**"],
      exclude: ["src/lib/supabase/**", "src/lib/data.ts"],
      // Regression gate: measured 86 / 82 / 96 / 86 when this was set.
      thresholds: { statements: 80, branches: 75, functions: 90, lines: 80 },
    },
  },
});
