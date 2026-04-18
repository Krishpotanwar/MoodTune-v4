import { NextResponse } from "next/server";
import { generateText } from "ai";
import { z } from "zod";
import { model, callWithFallback } from "@/lib/gemini";
import { EXPLAIN_SYSTEM } from "@/lib/prompts";
import { explainRL, limitOrAllow, rlKey } from "@/lib/ratelimit";
import { ensureSession, getSessionId } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  buildFallbackExplanation,
  hashText,
  isFakeGeminiEnabled,
  normalizeText,
  type TrackMetadata,
} from "@/lib/taste";

export const maxDuration = 30;

const FALLBACK_EXPLANATION =
  "Couldn't generate explanation — try again in a moment.";

const ExplainRequestSchema = z.object({
  track_id: z.string().min(1).max(32),
  query: z.string().max(200).optional(),
});

function buildExplainPrompt(track: TrackMetadata, query?: string, summary?: string | null) {
  return JSON.stringify({
    query: query ?? "neutral",
    taste_profile: summary ?? null,
    track,
  });
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ExplainRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sessionId = getSessionId(request);

  if (!sessionId) {
    return NextResponse.json({ error: "session_missing" }, { status: 400 });
  }

  await ensureSession(sessionId);

  const rateLimit = await limitOrAllow(
    explainRL,
    rlKey("explain", sessionId, request),
  );

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", reset: rateLimit.reset },
      { status: 429 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("taste_profiles")
    .select("summary")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const profileHash = hashText(normalizeText(profile?.summary ?? "none"), 16);
  const normalizedQuery = normalizeText(parsed.data.query ?? "neutral");
  const cacheKey = hashText(
    `${parsed.data.track_id}|${normalizedQuery}|${profileHash}`,
    32,
  );

  const { data: cachedRow, error: cacheError } = await admin
    .from("explanation_cache")
    .select("explanation")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (cacheError) {
    throw cacheError;
  }

  if (cachedRow) {
    return NextResponse.json({
      explanation: cachedRow.explanation,
      cached: true,
    });
  }

  const { data: track, error: trackError } = await admin
    .from("tracks")
    .select(
      "id, name, artist, genre, valence, energy, tempo, danceability, acousticness",
    )
    .eq("id", parsed.data.track_id)
    .maybeSingle();

  if (trackError) {
    throw trackError;
  }

  if (!track) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const explanation = isFakeGeminiEnabled()
    ? buildFallbackExplanation({
        track,
        query: parsed.data.query,
        summary: profile?.summary,
      })
    : await callWithFallback(
        () =>
          generateText({
            model,
            system: EXPLAIN_SYSTEM,
            maxTokens: 80,
            prompt: buildExplainPrompt(track, parsed.data.query, profile?.summary),
          }).then((result) => result.text),
        FALLBACK_EXPLANATION,
      );

  if (explanation !== FALLBACK_EXPLANATION) {
    const { error } = await admin.from("explanation_cache").upsert(
      {
        cache_key: cacheKey,
        explanation,
      },
      { onConflict: "cache_key" },
    );

    if (error) {
      throw error;
    }
  }

  return NextResponse.json({
    explanation,
    cached: false,
  });
}
