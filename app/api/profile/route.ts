import { NextResponse } from "next/server";
import { z } from 'zod/v3';
import { ensureSession, getSessionId } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const maxDuration = 30;

const ProfilePatchSchema = z.object({
  summary: z.string().min(1).max(400),
});

export async function GET(request: Request): Promise<Response> {
  const sessionId = getSessionId(request);

  if (!sessionId) {
    return NextResponse.json({ error: "session_missing" }, { status: 400 });
  }

  await ensureSession(sessionId);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("taste_profiles")
    .select("summary, rating_count, updated_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ProfilePatchSchema.safeParse(payload);

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

  const admin = createSupabaseAdminClient();
  const { data: existingProfile, error: existingError } = await admin
    .from("taste_profiles")
    .select("rating_count")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const updatedAt = new Date().toISOString();
  const { error } = await admin.from("taste_profiles").upsert(
    {
      session_id: sessionId,
      summary: parsed.data.summary,
      rating_count: existingProfile?.rating_count ?? 0,
      updated_at: updatedAt,
    },
    { onConflict: "session_id" },
  );

  if (error) {
    throw error;
  }

  return NextResponse.json({
    summary: parsed.data.summary,
    updated_at: updatedAt,
  });
}
