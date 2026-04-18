import { embed } from "@/lib/embeddings";
import { TrackSchema, type Track } from "@/lib/schema";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { l2Normalize, lerpVectors } from "@/lib/vector";

export async function searchTracks(opts: {
  query: string;
  sessionId: string | null;
  n?: number;
}): Promise<{ tracks: Track[]; blend_used: boolean }> {
  const { query, sessionId, n = 10 } = opts;
  const admin = createSupabaseAdminClient();
  const queryEmbedding = await embed(query);
  let combined = queryEmbedding;
  let blendUsed = false;

  if (sessionId) {
    const { data, error } = await admin
      .from("taste_profiles")
      .select("summary, rating_count")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.summary && data.rating_count >= 3) {
      const tasteEmbedding = await embed(data.summary);
      combined = l2Normalize(lerpVectors(queryEmbedding, tasteEmbedding, 0.3));
      blendUsed = true;
    }
  }

  const { data, error } = await admin.rpc("match_tracks", {
    query_embedding: combined,
    match_count: n,
  });

  if (error) {
    throw error;
  }

  return {
    tracks: TrackSchema.array().parse(data ?? []),
    blend_used: blendUsed,
  };
}
