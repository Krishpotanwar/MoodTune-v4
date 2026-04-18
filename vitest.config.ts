import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir),
    },
  },
  test: {
    globals: true,
    setupFiles: ["dotenv/config", "./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/api/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    testTimeout: 120000,
    hookTimeout: 120000,
    environment: "jsdom",
    environmentMatchGlobs: [
      ["tests/api/**", "node"],
      ["tests/unit/health.test.ts", "node"],
      ["tests/lib/**", "node"],
    ],
    env: {
      DOTENV_CONFIG_PATH: path.resolve(rootDir, ".env.test"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
