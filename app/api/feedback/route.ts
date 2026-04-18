import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { model, callWithFallback } from "@/lib/gemini";
import { TASTE_PROFILE_SYSTEM } from "@/lib/prompts";
import {
  feedbackRL,
  getRedisValue,
  limitOrAllow,
  rlKey,
  setRedisValue,
} from "@/lib/ratelimit";
import { ensureSession, getSessionId } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  buildFallbackTasteProfile,
  isFakeGeminiEnabled,
  type TrackMetadata,
} from "@/lib/taste";

export const maxDuration = 30;

const PROFILE_COOLDOWN_KEY_PREFIX = "profile:last:";
const PROFILE_COOLDOWN_SECONDS = 60;

const FeedbackRequestSchema = z.object({
  track_id: z.string().min(1).max(32),
  rating: z.union([z.literal(1), z.literal(-1)]),
});

const TasteProfileSummarySchema = z.object({
  summary: z.string().max(400),
});

async function loadFeedbackSnapshot(sessionId: string): Promise<{
  totalCount: number;
  recentCount: number;
  existingProfile: {
    summary: string;
    rating_count: number;
    updated_at: string | null;
  } | null;
}> {
  const admin = createSupabaseAdminClient();
  const { data: existingProfile, error: profileError } = await admin
    .from("taste_profiles")
    .select("summary, rating_count, updated_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { count: totalCount, error: totalError } = await admin
    .from("feedback")
    .select("*", { head: true, count: "exact" })
    .eq("session_id", sessionId);

  if (totalError) {
    throw totalError;
  }

  let recentCount = totalCount ?? 0;

  if (existingProfile?.updated_at) {
    const { count, error } = await admin
      .from("feedback")
      .select("*", { head: true, count: "exact" })
      .eq("session_id", sessionId)
      .gt("created_at", existingProfile.updated_at);

    if (error) {
      throw error;
    }

    recentCount = count ?? 0;
  }

  return {
    totalCount: totalCount ?? 0,
    recentCount,
    existingProfile,
  };
}

async function loadProfileTracks(sessionId: string): Promise<{
  liked: TrackMetadata[];
  disliked: TrackMetadata[];
}> {
  const admin = createSupabaseAdminClient();
  const { data: feedbackRows, error: feedbackError } = await admin
    .from("feedback")
    .select("track_id, rating, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (feedbackError) {
    throw feedbackError;
  }

  const trackIds = [...new Set((feedbackRows ?? []).map((row) => row.track_id))];

  if (trackIds.length === 0) {
    return { liked: [], disliked: [] };
  }

  const { data: tracks, error: trackError } = await admin
    .from("tracks")
    .select(
      "id, name, artist, genre, valence, energy, tempo, danceability, acousticness",
    )
    .in("id", trackIds);

  if (trackError) {
    throw trackError;
  }

  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));
  const liked: TrackMetadata[] = [];
  const disliked: TrackMetadata[] = [];

  for (const row of feedbackRows ?? []) {
    const track = trackMap.get(row.track_id);

    if (!track) {
      continue;
    }

    if (row.rating === 1 && liked.length < 10) {
      liked.push(track);
    }

    if (row.rating === -1 && disliked.length < 10) {
      disliked.push(track);
    }
  }

  return { liked, disliked };
}

async function createTasteSummary(
  liked: TrackMetadata[],
  disliked: TrackMetadata[],
): Promise<string | null> {
  if (liked.length === 0 && disliked.length === 0) {
    return null;
  }

  if (isFakeGeminiEnabled()) {
    return buildFallbackTasteProfile({ liked, disliked });
  }

  return callWithFallback(
    () =>
      generateObject({
        model,
        system: TASTE_PROFILE_SYSTEM,
        schema: TasteProfileSummarySchema,
        prompt: JSON.stringify({ liked, disliked }),
      }).then((result) => result.object.summary),
    null,
  );
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = FeedbackRequestSchema.safeParse(payload);

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
    feedbackRL,
    rlKey("feedback", sessionId, request),
  );

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", reset: rateLimit.reset },
      { status: 429 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { error: insertError } = await admin.from("feedback").insert({
    session_id: sessionId,
    track_id: parsed.data.track_id,
    rating: parsed.data.rating,
  });

  if (insertError) {
    throw insertError;
  }

  const snapshot = await loadFeedbackSnapshot(sessionId);
  let profileUpdated = false;
  let newSummary: string | undefined;
  let ratingCount = snapshot.totalCount;

  const cooldownKey = `${PROFILE_COOLDOWN_KEY_PREFIX}${sessionId}`;
  const onCooldown = Boolean(await getRedisValue<string>(cooldownKey));

  if (snapshot.recentCount >= 3 && !onCooldown) {
    const { liked, disliked } = await loadProfileTracks(sessionId);
    const summary = await createTasteSummary(liked, disliked);

    if (summary) {
      const updatedAt = new Date().toISOString();
      const { error } = await admin.from("taste_profiles").upsert(
        {
          session_id: sessionId,
          summary,
          rating_count: snapshot.totalCount,
          updated_at: updatedAt,
        },
        { onConflict: "session_id" },
      );

      if (error) {
        throw error;
      }

      await setRedisValue(cooldownKey, updatedAt, PROFILE_COOLDOWN_SECONDS);
      profileUpdated = true;
      newSummary = summary;
      ratingCount = snapshot.totalCount;
    }
  }

  return NextResponse.json({
    profile_updated: profileUpdated,
    new_summary: newSummary,
    rating_count: ratingCount,
  });
}
