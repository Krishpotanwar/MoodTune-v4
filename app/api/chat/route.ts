import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { generateObject } from "ai";
import { model, callWithFallback, isGeminiDisabled } from "@/lib/gemini";
import { ChatRequestSchema, ChatResponseSchema } from "@/lib/schema";
import { CHAT_SYSTEM } from "@/lib/prompts";
import { limitOrAllow, geminiRL, rlKey } from "@/lib/ratelimit";
import { searchTracks } from "@/lib/search";
import { ensureSession, getSessionId, createSessionId } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const maxDuration = 60;

const FALLBACK_REPLY = "Searching for that mood...";
const DEMO_REPLY =
  "Demo quota reached for today — searching your words directly. Rate a few songs to improve results.";

async function persistChatMessages(
  sessionId: string,
  message: string,
  reply: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("chat_messages").insert([
    {
      session_id: sessionId,
      role: "user",
      content: message,
    },
    {
      session_id: sessionId,
      role: "assistant",
      content: reply,
    },
  ]);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let sessionId = getSessionId(request);

  if (!sessionId || sessionId.length < 10) {
    sessionId = createSessionId();
  }

  const validSessionId = await ensureSession(sessionId);

  const rateLimit = await limitOrAllow(geminiRL, rlKey("gemini", validSessionId, request));

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", reset: rateLimit.reset },
      { status: 429 },
    );
  }

  const { message } = parsed.data;
  let query = message;
  let reply = DEMO_REPLY;

  if (!isGeminiDisabled()) {
    const result = await callWithFallback(
      () =>
        generateObject({
          model,
          schema: ChatResponseSchema.pick({
            query: true,
            reply: true,
          }),
          system: CHAT_SYSTEM,
          prompt: message,
        }).then((response) => response.object),
      {
        query: message,
        reply: FALLBACK_REPLY,
      },
    );

    query = result.query;
    reply = result.reply;
  }

  const searchResult = await searchTracks({
    query,
    sessionId,
    n: 8,
  });

  const persistence = persistChatMessages(sessionId, message, reply).catch((error) => {
    console.error("Failed to persist chat messages", error);
  });

  waitUntil(persistence);

  return NextResponse.json(
    ChatResponseSchema.parse({
      reply,
      query,
      tracks: searchResult.tracks,
      blend_used: searchResult.blend_used,
    }),
  );
}
