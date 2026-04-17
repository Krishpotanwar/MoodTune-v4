import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const supabaseApiUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseApi = new URL(supabaseApiUrl);

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command:
      `bash -lc 'if ! nc -z ${supabaseApi.hostname} ${supabaseApi.port}; then echo "Supabase API is not running on ${supabaseApi.hostname}:${supabaseApi.port}. Run pnpm supabase:start first."; exit 1; fi; if [ ! -f .env.test ]; then cp .env.test.example .env.test; fi; DOTENV_CONFIG_PATH=.env.test node -r dotenv/config ./node_modules/next/dist/bin/next dev'`,
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
