# GEMINI.md: MoodTune v4 Project Context

## Project Overview

This is MoodTune v4, a Next.js 15 application designed for AI-powered music recommendation. It allows users to describe a mood or feeling in a chat interface and receive a curated list of tracks that match the vibe.

The project uses a hybrid AI strategy:
-   **Generative AI**: Google's Gemini model (via `@ai-sdk/google`) is used for conversational chat and generating text-based explanations.
-   **Semantic Search**: A locally-hosted, quantized `all-MiniLM-L6-v2` sentence-transformer model (via `@huggingface/transformers`) is used to create vector embeddings for semantic search of the music library.

**Core Technologies:**
-   **Framework**: Next.js 15 with App Router (React 19, TypeScript)
-   **Database**: Supabase Postgres with `pgvector` for vector similarity search.
-   **AI SDKs**: Vercel AI SDK (`ai`) for frontend components and Google AI SDK for Gemini.
-   **Rate Limiting**: Upstash Redis.
-   **Testing**: Vitest for unit/integration tests and Playwright for E2E tests.

## Building and Running

The project uses `pnpm` for package management. Key commands are defined in `package.json`:

-   **`pnpm dev`**: Starts the Next.js development server.
-   **`pnpm build`**: Creates a production build of the application.
-   **`pnpm start`**: Starts the production server.
-   **`pnpm test`**: Runs the Vitest unit and integration tests.
-   **`pnpm test:coverage`**: Runs Vitest tests and generates a code coverage report.
-   **`pnpm test:e2e`**: Runs the Playwright end-to-end tests.
-   **`pnpm supabase:start` / `stop`**: Manages the local Supabase development environment.
-   **`pnpm seed`**: Seeds the database with track data.

## Development Conventions & Improvement Plan

The codebase is structured with API routes in `app/api/`, core logic in `lib/`, and React components in `components/`. While the architecture is sound, a recent audit identified several critical areas for improvement to make the project production-ready.

The following is a high-level plan to address these issues.

### 1. [CRITICAL] Modernize Dependencies

The project's dependencies are severely outdated, posing a security and maintenance risk.
-   **Action**: Plan and execute a phased upgrade of all dependencies.
-   **Priority**:
    1.  `next` (v15 -> latest)
    2.  `@ai-sdk/google` & `ai` (v1/v4 -> latest)
    3.  `@supabase/ssr`
    4.  `typescript`, `vitest`, `zod`, and other major packages.
-   **Note**: These upgrades, especially for the AI SDKs and Next.js, will likely introduce breaking changes and require significant code modifications.

### 2. [HIGH] Increase Test Coverage

The current test coverage is very low (~29%), making the codebase brittle.
-   **Action**: Implement a comprehensive testing strategy.
-   **Priority**:
    1.  Write unit tests for the core business logic in `lib/`, focusing on `lib/taste.ts`, `lib/embeddings.ts`, and `lib/search.ts`.
    2.  Add component tests (e.g., using Vitest or React Testing Library) for the main UI components (`ChatPanel.tsx`, `TasteProfileCard.tsx`) to prevent UI regressions.
    3.  Add tests for utility scripts and cron jobs.

### 3. [MEDIUM] Refactor Database Access

The Supabase admin client is overused, violating the principle of least privilege.
-   **Action**: Refactor data access logic to use the appropriate Supabase client.
    -   Use `createSupabaseServerClient` for user-specific data fetching in Server Components and API routes.
    -   Reserve `createSupabaseAdminClient` only for true administrative tasks (like seeding).
    -   Remove the unused `createSupabaseBrowserClient` and `createSupabaseServerClient` functions after refactoring.

### 4. [LOW] General Code Cleanup

Address minor code quality issues.
-   **Action**:
    -   Refactor `scripts/filter-csv.ts` to import the `normalizeText` function from `lib/taste.ts` instead of redefining it.
    -   Replace "magic numbers" (like the `0.3` blending factor in `lib/search.ts`) with named constants for better readability.
