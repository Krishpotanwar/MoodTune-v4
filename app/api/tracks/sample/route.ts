import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const revalidate = 3600;

type SampleTrack = {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  valence: number;
  energy: number;
  danceability: number;
  tempo: number;
  popularity: number;
};

function hourlyOffset(total = 15000, window = 120): number {
  const hourBucket = Math.floor(Date.now() / 3_600_000);
  return (hourBucket * 137) % (total - window);
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeFallbackTracks(): SampleTrack[] {
  const rand = mulberry32(42_891);
  const clusters = [
    { valence: 0.85, energy: 0.85, dance: 0.78 },
    { valence: 0.15, energy: 0.25, dance: 0.30 },
    { valence: 0.55, energy: 0.70, dance: 0.65 },
    { valence: 0.30, energy: 0.80, dance: 0.45 },
    { valence: 0.72, energy: 0.35, dance: 0.55 },
  ];
  return Array.from({ length: 120 }, (_, i) => {
    const c = clusters[i % clusters.length];
    const spread = 0.12;
    const clamp = (v: number) => Math.max(0.05, Math.min(0.95, v));
    return {
      id: `fallback-${i}`,
      name: `Track ${i + 1}`,
      artist: "Demo Artist",
      albumArt: null,
      valence: clamp(c.valence + (rand() * 2 - 1) * spread),
      energy: clamp(c.energy + (rand() * 2 - 1) * spread),
      danceability: clamp(c.dance + (rand() * 2 - 1) * spread),
      tempo: 70 + rand() * 90,
      popularity: Math.floor(40 + rand() * 55),
    };
  });
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createSupabaseAdminClient();
    const offset = hourlyOffset();

    const { data, error } = await supabase
      .from("tracks")
      .select("id, name, artist, album_art, valence, energy, danceability, tempo, popularity")
      .not("valence", "is", null)
      .not("energy", "is", null)
      .not("danceability", "is", null)
      .range(offset, offset + 119);

    if (error || !data || data.length < 10) {
      return NextResponse.json(makeFallbackTracks());
    }

    const tracks: SampleTrack[] = data.map((row) => ({
      id: row.id,
      name: row.name,
      artist: row.artist,
      albumArt: row.album_art ?? null,
      valence: row.valence ?? 0.5,
      energy: row.energy ?? 0.5,
      danceability: row.danceability ?? 0.5,
      tempo: row.tempo ?? 120,
      popularity: row.popularity ?? 50,
    }));

    return NextResponse.json(tracks);
  } catch {
    return NextResponse.json(makeFallbackTracks());
  }
}
