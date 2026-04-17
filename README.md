# MoodTune v4

MoodTune v4 is a free-tier music recommendation rebuild using Next.js 15, React 19,
Supabase, Gemini, local Transformers.js embeddings, and Upstash-compatible Redis.
This Phase 1 scaffold sets up the infrastructure only: migrations, middleware,
health checks, and test tooling.

## Stack

- Next.js 15 App Router
- React 19 + TypeScript 5.6
- Supabase Postgres + pgvector
- Google Gemini via AI SDK
- Transformers.js with a bundled MiniLM q8 model
- Upstash Redis-compatible rate limiting
- Vitest + Playwright

## Free-Tier Notes

- Vercel Hobby cron jobs support daily cadence only.
- Upstash Redis local tests in this repo use the SRH proxy from `docker-compose.test.yml`.
- The embedding model is bundled locally from `public/models/` so health checks
  can run without remote model downloads.

## Setup

1. Install Codex CLI and verify `codex --version`.
2. Install Supabase CLI: `brew install supabase/tap/supabase`.
3. Create your Supabase, Upstash Redis, Google AI Studio, and Spotify app credentials.
4. Install dependencies: `corepack pnpm install`.
5. Copy `.env.example` to `.env.local` and fill in real values.
6. For local tests, copy `.env.test.example` to `.env.test`.
7. Start local Supabase: `corepack pnpm supabase:start`.
8. Start the local Redis + SRH proxy:
   `docker compose -f docker-compose.test.yml up -d redis serverless-redis-http`
9. Apply migrations locally:
   `SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54332/postgres corepack pnpm migrate`
10. Run the dev server: `corepack pnpm dev`.

## Commands

- `corepack pnpm dev` starts the Next.js app.
- `corepack pnpm build` runs the production build.
- `corepack pnpm test` runs Vitest.
- `corepack pnpm test:e2e` runs Playwright.
- `corepack pnpm supabase:start` boots the isolated local Supabase stack on API `:54331` and Postgres `:54332`.
- `docker compose -f docker-compose.test.yml up -d redis serverless-redis-http`
  boots the SRH proxy on `:8079` for `@upstash/redis` tests.
- `corepack pnpm filter` and `corepack pnpm seed` are placeholders until the
  Phase 2 data pipeline lands.
