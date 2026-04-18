import { beforeAll, describe, expect, test } from "vitest";
import { POST } from "@/app/api/search/route";
import { embed } from "@/lib/embeddings";
import { buildMoodText } from "@/lib/mood-text";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { toPgVector } from "@/lib/vector";

type SeedTrack = {
  name: string;
  artist: string;
  genre: string;
  popularity: number;
  valence: number;
  energy: number;
  tempo: number;
  danceability: number;
  acousticness: number;
};

function melancholicTracks(): SeedTrack[] {
  return Array.from({ length: 10 }, (_, index) => ({
    name: `Rain ${index + 1}`,
    artist: "A",
    genre: "ambient",
    popularity: 40 - index,
    valence: 0.1,
    energy: 0.2,
    tempo: 60,
    danceability: 0.2,
    acousticness: 0.9,
  }));
}

function euphoricTracks(): SeedTrack[] {
  return Array.from({ length: 10 }, (_, index) => ({
    name: `Euphoria ${index + 1}`,
    artist: "B",
    genre: "dance",
    popularity: 50 - index,
    valence: 0.95,
    energy: 0.95,
    tempo: 170,
    danceability: 0.95,
    acousticness: 0.05,
  }));
}

function buildFixtureId(track: SeedTrack): string {
  return `${track.name.toLowerCase().replaceAll(" ", "-")}-${track.artist.toLowerCase()}`;
}

async function seedTracks(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const fixtures = [...melancholicTracks(), ...euphoricTracks()];

  const rows = [];

  for (const fixture of fixtures) {
    const embedding = await embed(buildMoodText(fixture));

    rows.push({
      id: buildFixtureId(fixture),
      name: fixture.name,
      artist: fixture.artist,
      genre: fixture.genre,
      popularity: fixture.popularity,
      valence: fixture.valence,
      energy: fixture.energy,
      tempo: fixture.tempo,
      danceability: fixture.danceability,
      acousticness: fixture.acousticness,
      embedding: toPgVector(embedding),
    });
  }

  const { error } = await admin.from("tracks").upsert(rows, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

beforeAll(async () => {
  const admin = createSupabaseAdminClient();
  const fixtureIds = [...melancholicTracks(), ...euphoricTracks()].map(buildFixtureId);

  await admin
    .from("tracks")
    .delete()
    .in("id", fixtureIds);

  await seedTracks();
});

describe("POST /api/search", () => {
  test("ranks melancholic tracks ahead of euphoric ones for rainy moods", async () => {
    const request = new Request("http://localhost/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "dark melancholic rainy", n: 10 }),
    });
    const response = await POST(request);
    const body = (await response.json()) as {
      tracks: Array<{ name: string; similarity: number }>;
      blend_used: boolean;
    };

    expect(response.status).toBe(200);
    expect(body.tracks.length).toBeGreaterThanOrEqual(5);
    expect(body.tracks.slice(0, 3).some((track) => track.name.startsWith("Rain"))).toBe(true);
    expect(body.tracks.slice(0, 3).some((track) => track.name.startsWith("Euphoria"))).toBe(false);
    expect(body.tracks).toEqual(
      [...body.tracks].sort((left, right) => right.similarity - left.similarity),
    );
  });

  test("ranks euphoric tracks ahead of melancholic ones for dance moods", async () => {
    const request = new Request("http://localhost/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "euphoric dance party", n: 10 }),
    });
    const response = await POST(request);
    const body = (await response.json()) as {
      tracks: Array<{ name: string; similarity: number }>;
    };

    expect(response.status).toBe(200);
    expect(body.tracks.slice(0, 3).some((track) => track.name.startsWith("Euphoria"))).toBe(true);
    expect(body.tracks.slice(0, 3).some((track) => track.name.startsWith("Rain"))).toBe(false);
    expect(body.tracks).toEqual(
      [...body.tracks].sort((left, right) => right.similarity - left.similarity),
    );
  });
});
