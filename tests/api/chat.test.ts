import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { geminiRL } from "@/lib/ratelimit";
import { searchTracks } from "@/lib/search";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { generateObject } from "ai";

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    generateObject: vi.fn(),
  };
});

vi.mock("@/lib/search", () => ({
  searchTracks: vi.fn(),
}));

const TEST_SESSION_ID = "11111111-1111-4111-8111-111111111111";
const TRACK_FIXTURES = [
  {
    id: "rain-1",
    name: "Rain 1",
    artist: "A",
    similarity: 0.98,
    spotify_uri: "spotify:track:rain1",
    album_art: null,
    preview_url: null,
    valence: 0.12,
    energy: 0.22,
  },
  {
    id: "rain-2",
    name: "Rain 2",
    artist: "A",
    similarity: 0.96,
    spotify_uri: "spotify:track:rain2",
    album_art: null,
    preview_url: null,
    valence: 0.14,
    energy: 0.24,
  },
];

async function waitForMessages(expectedCount: number): Promise<
  Array<{ role: "user" | "assistant"; content: string }>
> {
  const admin = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data, error } = await admin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", TEST_SESSION_ID)
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    if ((data ?? []).length === expectedCount) {
      return data ?? [];
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Timed out waiting for ${expectedCount} chat messages`);
}

describe("POST /api/chat", () => {
  beforeEach(async () => {
    process.env.DEMO_MODE_GEMINI_DISABLED = "false";
    vi.mocked(generateObject).mockReset();
    vi.mocked(searchTracks).mockReset();
    vi.mocked(searchTracks).mockResolvedValue({
      tracks: TRACK_FIXTURES,
      blend_used: false,
    });

    if (geminiRL) {
      vi.spyOn(geminiRL, "limit").mockResolvedValue({
        success: true,
        limit: 15,
        remaining: 14,
        reset: Date.now() + 60_000,
        pending: Promise.resolve(),
      });
    }

    const admin = createSupabaseAdminClient();
    await admin
      .from("chat_messages")
      .delete()
      .eq("session_id", TEST_SESSION_ID);
  });

  test("returns structured reply payload and persists chat rows", async () => {
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        query: "rainy melancholy",
        reply: "Here's something introspective for a dark, rainy drive.",
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${TEST_SESSION_ID}`,
        },
        body: JSON.stringify({ message: "dark rainy drive" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      query: "rainy melancholy",
      reply: "Here's something introspective for a dark, rainy drive.",
      blend_used: false,
    });
    expect(body.tracks).toHaveLength(2);

    const rows = await waitForMessages(2);
    expect(rows).toEqual([
      { role: "user", content: "dark rainy drive" },
      {
        role: "assistant",
        content: "Here's something introspective for a dark, rainy drive.",
      },
    ]);
  });

  test("skips Gemini in demo mode and searches the raw message", async () => {
    process.env.DEMO_MODE_GEMINI_DISABLED = "true";

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${TEST_SESSION_ID}`,
        },
        body: JSON.stringify({ message: "dark rainy drive" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reply).toContain("Demo quota reached");
    expect(vi.mocked(generateObject)).not.toHaveBeenCalled();
    expect(vi.mocked(searchTracks)).toHaveBeenCalledWith({
      query: "dark rainy drive",
      sessionId: TEST_SESSION_ID,
      n: 8,
    });
  });

  test("falls back cleanly when Gemini throws", async () => {
    vi.mocked(generateObject).mockRejectedValue(new Error("boom"));

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${TEST_SESSION_ID}`,
        },
        body: JSON.stringify({ message: "dark rainy drive" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reply).toBe("Searching for that mood...");
    expect(body.query).toBe("dark rainy drive");
  });
});
