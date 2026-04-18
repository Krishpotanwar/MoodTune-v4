import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });
process.env.MOODTUNE_FAKE_EMBEDDINGS = "true";
process.env.MOODTUNE_FAKE_GEMINI = "true";

const supabaseApiUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseApi = new URL(supabaseApiUrl);

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command:
      `bash -lc 'if ! nc -z ${supabaseApi.hostname} ${supabaseApi.port}; then echo "Supabase API is not running on ${supabaseApi.hostname}:${supabaseApi.port}. Run pnpm supabase:start first."; exit 1; fi; if [ ! -f .env.test ]; then cp .env.test.example .env.test; fi; MOODTUNE_FAKE_EMBEDDINGS=true MOODTUNE_FAKE_GEMINI=true DOTENV_CONFIG_PATH=.env.test node -r dotenv/config ./node_modules/next/dist/bin/next dev'`,
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
