import { NextResponse } from "next/server";
import { SearchRequestSchema, TrackSchema } from "@/lib/schema";
import { searchTracks } from "@/lib/search";
import { getSessionId } from "@/lib/session";

export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = SearchRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { query, n } = parsed.data;
  const response = await searchTracks({
    query,
    sessionId: getSessionId(request),
    n,
  });

  return NextResponse.json({
    tracks: TrackSchema.array().parse(response.tracks),
    blend_used: response.blend_used,
  });
}
