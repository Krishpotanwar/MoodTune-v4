# MoodTune

Describe how you feel. Get music that matches.

MoodTune turns emotional language into track recommendations. Tell it "dark rainy drive" or "nostalgic warm sunset" and it finds songs that hit that exact mood — not by genre, but by emotional texture.

## The Problem

Music apps think in genres. Clubs get EDM. Road trips get classic rock. But what happens when you're in your feels? When "the weather in your head" doesn't match any playlist?

We built MoodTune to solve that. It's mood-first music search — describe the feeling, get tracks that match.

## The Stack

- **Next.js 15** with App Router
- **Supabase** + pgvector for semantic search
- **Google Gemini** via AI SDK for understanding intent
- **Transformers.js** with bundled MiniLM for local embeddings
- **Upstash Redis** for rate limiting
- **Tailwind CSS** for styling
- **Vitest** + **Playwright** for testing

This is a Next.js 15 + React 19 app running on Vercel.

## How It Works

1. You describe a mood or feeling in plain language
2. Gemini extracts the emotional intent and rewrites it as a search query
3. pgvector finds tracks with the closest emotional match
4. Your ratings train a personal taste profile that improves future results

The app uses cookie-backed sessions to remember your taste. Rate a few songs and it starts blending your profile into searches.

## Quick Start

```bash
# Install
pnpm install

# Dev server
pnpm dev
```

Open http://localhost:3000 and try describing a mood.

## Environment Variables

Required for production:

```
GOOGLE_GENERATIVE_AI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Add these in Vercel or GitHub Secrets. The app disables rate limiting gracefully if Upstash isn't configured.

## Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm test     # Unit + API tests
pnpm test:e2e  # Playwright e2e
```

## Design

Premium/editorial aesthetic with Playfair Display for headings, DM Sans for body. Dark theme with high contrast and subtle texture. The vibe is refined, not loud — just like the music it recommends.

---

Built by Krish. Questions? Open an issue.