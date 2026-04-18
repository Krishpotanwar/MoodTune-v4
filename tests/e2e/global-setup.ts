import { embed } from "../../lib/embeddings";
import { buildMoodText } from "../../lib/mood-text";
import { createSupabaseAdminClient } from "../../lib/supabase";
import { toPgVector } from "../../lib/vector";

type SeedTrack = {
  id: string;
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

const FIXTURES: SeedTrack[] = [
  {
    id: "e2e-rain-1",
    name: "Rain 1",
    artist: "A",
    genre: "ambient",
    popularity: 52,
    valence: 0.1,
    energy: 0.18,
    tempo: 62,
    danceability: 0.28,
    acousticness: 0.9,
  },
  {
    id: "e2e-rain-2",
    name: "Rain 2",
    artist: "A",
    genre: "ambient",
    popularity: 51,
    valence: 0.11,
    energy: 0.2,
    tempo: 66,
    danceability: 0.3,
    acousticness: 0.88,
  },
  {
    id: "e2e-rain-3",
    name: "Rain 3",
    artist: "A",
    genre: "ambient",
    popularity: 50,
    valence: 0.13,
    energy: 0.22,
    tempo: 68,
    danceability: 0.31,
    acousticness: 0.86,
  },
  {
    id: "e2e-rain-4",
    name: "Rain 4",
    artist: "A",
    genre: "ambient",
    popularity: 49,
    valence: 0.12,
    energy: 0.19,
    tempo: 64,
    danceability: 0.29,
    acousticness: 0.89,
  },
  {
    id: "e2e-rain-5",
    name: "Rain 5",
    artist: "A",
    genre: "ambient",
    popularity: 48,
    valence: 0.14,
    energy: 0.24,
    tempo: 70,
    danceability: 0.32,
    acousticness: 0.84,
  },
  {
    id: "e2e-rain-6",
    name: "Rain 6",
    artist: "A",
    genre: "ambient",
    popularity: 47,
    valence: 0.15,
    energy: 0.26,
    tempo: 72,
    danceability: 0.34,
    acousticness: 0.82,
  },
  {
    id: "e2e-rain-7",
    name: "Rain 7",
    artist: "A",
    genre: "ambient",
    popularity: 46,
    valence: 0.16,
    energy: 0.28,
    tempo: 74,
    danceability: 0.35,
    acousticness: 0.8,
  },
  {
    id: "e2e-rain-8",
    name: "Rain 8",
    artist: "A",
    genre: "ambient",
    popularity: 45,
    valence: 0.18,
    energy: 0.3,
    tempo: 78,
    danceability: 0.36,
    acousticness: 0.78,
  },
];

export default async function globalSetup(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const rows = [];

  for (const track of FIXTURES) {
    const embedding = await embed(buildMoodText(track));

    rows.push({
      ...track,
      embedding: toPgVector(embedding),
    });
  }

  const { error } = await admin.from("tracks").upsert(rows, { onConflict: "id" });

  if (error) {
    throw error;
  }
}
