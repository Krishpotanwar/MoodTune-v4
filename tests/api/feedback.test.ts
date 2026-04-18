import { beforeEach, describe, expect, test, vi } from "vitest";
import { generateObject } from "ai";
import { POST } from "@/app/api/feedback/route";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import * as ratelimitModule from "@/lib/ratelimit";

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    generateObject: vi.fn(),
  };
});

const TEST_SESSION_ID = "22222222-2222-4222-8222-222222222222";

const TRACKS = [
  { id: "feedback-track-1", name: "Rain", artist: "A", genre: "ambient" },
  { id: "feedback-track-2", name: "Glow", artist: "B", genre: "indie" },
  { id: "feedback-track-3", name: "Pulse", artist: "C", genre: "dance" },
];

async function seedTracks() {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("tracks").upsert(
    TRACKS.map((track, index) => ({
      ...track,
      popularity: 60 - index,
      valence: 0.2 + index * 0.3,
      energy: 0.25 + index * 0.2,
      tempo: 70 + index * 30,
      danceability: 0.3 + index * 0.2,
      acousticness: 0.8 - index * 0.25,
    })),
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function sendFeedback(trackId: string, rating: 1 | -1): Promise<Response> {
  return POST(
    new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${SESSION_COOKIE_NAME}=${TEST_SESSION_ID}`,
      },
      body: JSON.stringify({
        track_id: trackId,
        rating,
      }),
    }),
  );
}

describe("POST /api/feedback", () => {
  beforeEach(async () => {
    process.env.MOODTUNE_FAKE_GEMINI = "false";
    vi.restoreAllMocks();

    vi.spyOn(ratelimitModule, "limitOrAllow").mockResolvedValue({
      success: true,
      reset: Date.now() + 60_000,
    });
    vi.spyOn(ratelimitModule, "getRedisValue").mockResolvedValue(null);
    vi.spyOn(ratelimitModule, "setRedisValue").mockResolvedValue();

    const admin = createSupabaseAdminClient();
    await admin.from("feedback").delete().eq("session_id", TEST_SESSION_ID);
    await admin.from("taste_profiles").delete().eq("session_id", TEST_SESSION_ID);
    await admin.from("sessions").delete().eq("id", TEST_SESSION_ID);
    await seedTracks();
  });

  test("creates a taste profile after three ratings", async () => {
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        summary:
          "You lean toward introspective, low-energy songs. Your sessions tend to stay textured and emotionally specific. You tend to skip brighter, faster tracks.",
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    await sendFeedback(TRACKS[0]!.id, 1);
    await sendFeedback(TRACKS[1]!.id, 1);
    const response = await sendFeedback(TRACKS[2]!.id, -1);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile_updated).toBe(true);
    expect(body.rating_count).toBe(3);
    expect(body.new_summary).toContain("You lean toward");

    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("taste_profiles")
      .select("summary, rating_count")
      .eq("session_id", TEST_SESSION_ID)
      .maybeSingle();

    expect(data?.summary).toContain("You lean toward");
    expect(data?.rating_count).toBe(3);
  });

  test("returns 429 when the feedback rate limit is exceeded", async () => {
    let calls = 0;

    vi.spyOn(ratelimitModule, "limitOrAllow").mockImplementation(async () => ({
      success: ++calls <= 30,
      reset: Date.now() + 60_000,
    }));
    vi.spyOn(ratelimitModule, "getRedisValue").mockResolvedValue("cooldown");
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        summary: "You lean toward mood-first selections.",
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    let response: Response = new Response();

    for (let index = 0; index < 31; index += 1) {
      response = await sendFeedback(TRACKS[0]!.id, 1);
    }

    const body = await response.json();
    expect(response.status).toBe(429);
    expect(body.error).toBe("rate_limited");
  });
});
