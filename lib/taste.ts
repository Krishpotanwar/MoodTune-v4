import crypto from "node:crypto";
import type { Database } from "@/lib/supabase";

export type TrackMetadata = Pick<
  Database["public"]["Tables"]["tracks"]["Row"],
  | "id"
  | "name"
  | "artist"
  | "genre"
  | "valence"
  | "energy"
  | "tempo"
  | "danceability"
  | "acousticness"
>;

function average(values: Array<number | null>): number | null {
  const filtered = values.filter((value): value is number => value != null);

  if (filtered.length === 0) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function valenceLabel(value: number | null): string {
  if (value == null) {
    return "balanced";
  }

  if (value < 0.25) {
    return "melancholic";
  }

  if (value < 0.55) {
    return "reflective";
  }

  if (value < 0.8) {
    return "uplifting";
  }

  return "euphoric";
}

function energyLabel(value: number | null): string {
  if (value == null) {
    return "steady";
  }

  if (value < 0.3) {
    return "low-energy";
  }

  if (value < 0.7) {
    return "mid-energy";
  }

  return "high-energy";
}

function tempoLabel(value: number | null): string {
  if (value == null) {
    return "moderate-tempo";
  }

  if (value < 80) {
    return "slower";
  }

  if (value < 120) {
    return "mid-tempo";
  }

  return "faster";
}

function textureLabel(value: number | null): string {
  if (value == null) {
    return "balanced";
  }

  if (value >= 0.65) {
    return "acoustic";
  }

  if (value <= 0.2) {
    return "glossy";
  }

  return "textured";
}

function compactQuery(query: string | null | undefined): string {
  if (!query) {
    return "your current mood";
  }

  return query
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");
}

export function normalizeText(value: string): string {
  return value.normalize("NFC").toLowerCase().trim();
}

export function hashText(value: string, length: number): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, length);
}

export function buildFallbackTasteProfile(opts: {
  liked: TrackMetadata[];
  disliked: TrackMetadata[];
}): string {
  const likedValence = average(opts.liked.map((track) => track.valence));
  const likedEnergy = average(opts.liked.map((track) => track.energy));
  const likedTempo = average(opts.liked.map((track) => track.tempo));
  const likedTexture = average(opts.liked.map((track) => track.acousticness));

  const dislikedValence = average(opts.disliked.map((track) => track.valence));
  const dislikedEnergy = average(opts.disliked.map((track) => track.energy));
  const dislikedTempo = average(opts.disliked.map((track) => track.tempo));

  return [
    `You lean toward ${valenceLabel(likedValence)} ${energyLabel(likedEnergy)} music with a ${tempoLabel(likedTempo)} pulse and ${textureLabel(likedTexture)} texture.`,
    `Your sessions tend to favor ${opts.liked.length > 0 ? (opts.liked[0]?.genre ?? "mood-driven") : "mood-driven"} tracks that feel emotionally specific instead of generic.`,
    `You tend to skip ${valenceLabel(dislikedValence)} ${energyLabel(dislikedEnergy)} songs that push a ${tempoLabel(dislikedTempo)} pace.`,
  ].join(" ");
}

export function buildFallbackExplanation(opts: {
  track: TrackMetadata;
  query?: string | null;
  summary?: string | null;
}): string {
  const tasteHint = opts.summary ? " and fits your usual taste." : ".";

  return `Its ${valenceLabel(opts.track.valence)} mood, ${tempoLabel(opts.track.tempo)} pulse, and ${textureLabel(opts.track.acousticness)} texture match ${compactQuery(opts.query)}${tasteHint}`;
}

export function isFakeGeminiEnabled(): boolean {
  return process.env.MOODTUNE_FAKE_GEMINI === "true";
}
