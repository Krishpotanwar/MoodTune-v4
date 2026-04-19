# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm test             # Unit + API tests (Vitest)
pnpm test:watch       # Vitest in watch mode
pnpm test:coverage    # Vitest with coverage report
pnpm test:e2e         # Playwright E2E tests
pnpm lint             # ESLint via Next.js

pnpm supabase:start   # Start local Supabase instance
pnpm supabase:stop    # Stop local Supabase instance
pnpm migrate          # Apply SQL migrations via scripts/apply-migrations.sh
pnpm seed             # Seed track data (tsx db/seed.ts)
pnpm filter           # Filter CSV data (tsx scripts/filter-csv.ts)
```

**Run a single test file:**
```bash
pnpm vitest run tests/unit/taste.test.ts
```

**E2E requires running app + local Supabase.** Tests read from `.env.test` (see `.env.test.example`). Set `MOODTUNE_FAKE_EMBEDDINGS=true` and `MOODTUNE_FAKE_GEMINI=true` to skip real AI calls in tests.

## Architecture Overview

### Data Flow

1. User types a mood description in `ChatPanel` → POST `/api/chat`
2. API route calls Gemini (via `lib/gemini.ts`) to extract and rewrite the emotional query
3. `lib/search.ts` calls `lib/embeddings.ts` to embed the query using bundled MiniLM (`Xenova/all-MiniLM-L6-v2` served from `public/models/`)
4. The embedding is optionally blended (30%) with the session's taste profile embedding from Supabase
5. `match_tracks` Supabase RPC (pgvector cosine similarity) returns ranked tracks
6. Feedback (like/skip) hits `/api/feedback` → updates `taste_profiles` table via `lib/taste.ts`

### Session / Auth Model

No user accounts. Sessions are anonymous UUIDs stored in cookies (`mt_sid`) and `x-mt-sid` header. `lib/session.ts` manages creation and parsing. All per-user data (feedback, taste profiles, chat history) is keyed by session UUID. Row-level security is enforced via the `x-session-id` header on the anon Supabase client (`createSupabaseSessionClient`).

### Embedding Strategy

`lib/embeddings.ts` has two modes:
- **Production**: Loads quantized `all-MiniLM-L6-v2` from `public/models/` via `@huggingface/transformers` (model must be present locally)
- **Fake mode** (`MOODTUNE_FAKE_EMBEDDINGS=true`): Lexicon-based deterministic vectors for testing — no model files needed

### 3D Galaxy Visualization (`components/landing/`)

`GalaxyCubeHero.tsx` is a Three.js scene (React Three Fiber) that plots tracks in 3D space using valence (X), energy (Y), and danceability (Z) as coordinates. The cube wireframe fades as the camera zooms in on scroll. It is always loaded client-side only via `GalaxyCubeWrapper.tsx` (`dynamic()` with `ssr: false`).

Demo tracks come from `/api/spotify/demo` (fetches Spotify's featured playlist using Client Credentials flow, falls back to seeded random tracks). User tracks load after OAuth via `SpotifyConnect.tsx` (PKCE flow with popup → postMessage → token exchange).

### Database Schema (Supabase + pgvector)

Key tables: `tracks` (with `embedding vector(384)`), `sessions`, `taste_profiles`, `feedback`, `explanation_cache`, `chat_messages`. The `match_tracks` RPC function performs cosine similarity search. Migrations live in `supabase/migrations/`.

### API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `/api/chat` | Main mood→tracks conversational endpoint |
| `/api/search` | Direct semantic search (no chat) |
| `/api/feedback` | Like/skip rating, triggers taste profile update |
| `/api/profile` | Fetch current session taste profile |
| `/api/explain` | Gemini-generated explanation for a track match |
| `/api/spotify/callback` | OAuth callback — posts code back to opener via postMessage |
| `/api/spotify/demo` | Public demo tracks (Client Credentials, cached 24h) |
| `/api/cron/keepalive` | Cron endpoint to keep Supabase warm |

### Environment Variables

Two Spotify credentials are required: `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` for the server-side demo endpoint (Client Credentials), and `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` for the client-side PKCE OAuth flow. The redirect URI must be `<origin>/api/spotify/callback` and registered in the Spotify dashboard.

### Path Aliases

`@/` maps to the project root. Use `@/lib/`, `@/components/`, etc.

### Test Environment

Vitest uses `jsdom` by default; API tests under `tests/api/` and `tests/unit/health.test.ts` override to `node` environment via `environmentMatchGlobs`. Unit tests for AI-dependent code should use fake mode env vars.
