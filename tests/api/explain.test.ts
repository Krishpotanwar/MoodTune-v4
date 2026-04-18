import { beforeEach, describe, expect, test, vi } from "vitest";
import { generateText } from "ai";
import { POST } from "@/app/api/explain/route";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";
import * as ratelimitModule from "@/lib/ratelimit";

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    generateText: vi.fn(),
  };
});

const TEST_SESSION_ID = "33333333-3333-4333-8333-333333333333";
const TRACK_ID = "explain-track-1";
const FALLBACK_EXPLANATION =
  "Couldn't generate explanation — try again in a moment.";

async function seedTrack() {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("tracks").upsert(
    {
      id: TRACK_ID,
      name: "Rain Signal",
      artist: "A",
      genre: "ambient",
      valence: 0.14,
      energy: 0.2,
      tempo: 68,
      danceability: 0.3,
      acousticness: 0.88,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function explain(query: string): Promise<Response> {
  return POST(
    new Request("http://localhost/api/explain", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${SESSION_COOKIE_NAME}=${TEST_SESSION_ID}`,
      },
      body: JSON.stringify({
        track_id: TRACK_ID,
        query,
      }),
    }),
  );
}

describe("POST /api/explain", () => {
  beforeEach(async () => {
    process.env.MOODTUNE_FAKE_GEMINI = "false";
    vi.restoreAllMocks();
    vi.spyOn(ratelimitModule, "limitOrAllow").mockResolvedValue({
      success: true,
      reset: Date.now() + 60_000,
    });

    const admin = createSupabaseAdminClient();
    await admin.from("explanation_cache").delete().neq("cache_key", "");
    await admin.from("taste_profiles").delete().eq("session_id", TEST_SESSION_ID);
    await admin.from("sessions").delete().eq("id", TEST_SESSION_ID);
    await seedTrack();
  });

  test("caches explanations by track, query, and profile hash", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "Its slow pulse and acoustic texture match the rainy introspection you asked for.",
    } as Awaited<ReturnType<typeof generateText>>);

    const first = await explain("dark rainy drive");
    const firstBody = await first.json();
    const second = await explain("dark rainy drive");
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(firstBody.cached).toBe(false);
    expect(second.status).toBe(200);
    expect(secondBody.cached).toBe(true);
    expect(vi.mocked(generateText)).toHaveBeenCalledTimes(1);
  });

  test("returns the fallback explanation and does not cache it", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("boom"));

    const first = await explain("storm walk");
    const firstBody = await first.json();
    const second = await explain("storm walk");
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(firstBody.explanation).toBe(FALLBACK_EXPLANATION);
    expect(firstBody.cached).toBe(false);
    expect(second.status).toBe(200);
    expect(secondBody.explanation).toBe(FALLBACK_EXPLANATION);
    expect(secondBody.cached).toBe(false);
    expect(vi.mocked(generateText)).toHaveBeenCalledTimes(2);
  });
});
