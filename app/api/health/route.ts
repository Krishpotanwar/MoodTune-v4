import { NextResponse } from "next/server";
import { embed } from "@/lib/embeddings";
import { callWithFallback, isGeminiDisabled, pingGemini } from "@/lib/gemini";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const maxDuration = 30;

export interface HealthPayload {
  status: "ok" | "degraded";
  db_ok: boolean;
  gemini_ok: boolean;
  embed_ok: boolean;
  corpus_size: number;
}

async function getHealthPayload(): Promise<HealthPayload> {
  let dbOk = false;
  let corpusSize = 0;

  try {
    const admin = createSupabaseAdminClient();
    const { count, error } = await admin
      .from("tracks")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    dbOk = true;
    corpusSize = count ?? 0;
  } catch (error) {
    console.error("Health check DB probe failed", error);
  }

  const geminiOk = isGeminiDisabled()
    ? true
    : await callWithFallback(pingGemini, false);

  let embedOk = false;

  try {
    const vector = await embed("test");
    embedOk = vector.length === 384;
  } catch (error) {
    console.error("Health check embedding probe failed", error);
  }

  return {
    status: dbOk && geminiOk && embedOk ? "ok" : "degraded",
    db_ok: dbOk,
    gemini_ok: geminiOk,
    embed_ok: embedOk,
    corpus_size: corpusSize,
  };
}

export async function GET(): Promise<Response> {
  const payload = await getHealthPayload();

  return NextResponse.json(payload, {
    status: payload.status === "ok" ? 200 : 503,
  });
}
