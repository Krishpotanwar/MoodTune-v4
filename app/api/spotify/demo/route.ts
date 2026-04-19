import { NextResponse } from "next/server";

export const revalidate = 86400;

const ACCOUNTS = "https://accounts.spotify.com";
const API = "https://api.spotify.com/v1";

type AudioFeatures = {
  valence: number;
  energy: number;
  danceability: number;
  tempo: number;
};

type DemoTrack = {
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

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeFallbackTracks(): DemoTrack[] {
  const rand = mulberry32(42_891);
  const clusters = [
    { valence: 0.85, energy: 0.85, dance: 0.78 },
    { valence: 0.15, energy: 0.25, dance: 0.30 },
    { valence: 0.55, energy: 0.70, dance: 0.65 },
    { valence: 0.30, energy: 0.80, dance: 0.45 },
    { valence: 0.72, energy: 0.35, dance: 0.55 },
  ];
  return Array.from({ length: 80 }, (_, i) => {
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

async function getClientCredentialsToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

async function getFeaturedPlaylistId(token: string): Promise<string> {
  const res = await fetch(
    `${API}/browse/featured-playlists?limit=1&country=US`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Featured playlists failed: ${res.status}`);
  const data = await res.json();
  const id = data.playlists?.items?.[0]?.id as string | undefined;
  if (!id) throw new Error("No featured playlist found");
  return id;
}

async function getPlaylistTracks(
  playlistId: string,
  token: string,
): Promise<{ id: string; name: string; artist: string; albumArt: string | null; popularity: number }[]> {
  const res = await fetch(
    `${API}/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists,album(images),popularity))`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Playlist tracks failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? [])
    .map((item: { track?: { id: string; name: string; artists: { name: string }[]; album: { images: { url: string }[] }; popularity: number } }) => item.track)
    .filter(Boolean)
    .map((t: { id: string; name: string; artists: { name: string }[]; album: { images: { url: string }[] }; popularity: number }) => ({
      id: t.id,
      name: t.name,
      artist: t.artists[0]?.name ?? "Unknown",
      albumArt: t.album.images[0]?.url ?? null,
      popularity: t.popularity,
    }));
}

async function getAudioFeatures(
  ids: string[],
  token: string,
): Promise<Record<string, AudioFeatures>> {
  const res = await fetch(
    `${API}/audio-features?ids=${ids.join(",")}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<string, AudioFeatures> = {};
  for (const f of data.audio_features ?? []) {
    if (f) {
      map[f.id] = {
        valence: f.valence,
        energy: f.energy,
        danceability: f.danceability,
        tempo: f.tempo,
      };
    }
  }
  return map;
}

export async function GET(): Promise<NextResponse> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(makeFallbackTracks());
  }

  try {
    const token = await getClientCredentialsToken(clientId, clientSecret);
    const playlistId = await getFeaturedPlaylistId(token);
    const tracks = await getPlaylistTracks(playlistId, token);
    const ids = tracks.map((t) => t.id);
    const features = await getAudioFeatures(ids, token);

    const result: DemoTrack[] = tracks.map((t) => ({
      ...t,
      valence: features[t.id]?.valence ?? 0.5,
      energy: features[t.id]?.energy ?? 0.5,
      danceability: features[t.id]?.danceability ?? 0.5,
      tempo: features[t.id]?.tempo ?? 120,
    }));

    return NextResponse.json(result.length >= 10 ? result : makeFallbackTracks());
  } catch {
    return NextResponse.json(makeFallbackTracks());
  }
}
