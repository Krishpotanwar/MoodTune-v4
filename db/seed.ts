export {};

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import cliProgress from "cli-progress";
import { embed } from "@/lib/embeddings";
import { buildMoodText } from "@/lib/mood-text";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { toPgVector } from "@/lib/vector";

type SeedRow = {
  source_id?: string;
  name: string;
  artist: string;
  genre: string | null;
  popularity: number | null;
  valence: number | null;
  energy: number | null;
  tempo: number | null;
  danceability: number | null;
  acousticness: number | null;
};

type TrackInsert = {
  id: string;
  name: string;
  artist: string;
  genre: string | null;
  popularity: number | null;
  valence: number | null;
  energy: number | null;
  tempo: number | null;
  danceability: number | null;
  acousticness: number | null;
  embedding: string;
};

const DEFAULT_LIMIT = 15_000;
const DEFAULT_BATCH = 500;
const DATA_PATH = path.join(process.cwd(), "data", "spotify_tracks.csv");

function parseArgs(argv: string[]): { limit: number; batch: number } {
  let limit = DEFAULT_LIMIT;
  let batch = DEFAULT_BATCH;

  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      limit = Number.parseInt(arg.split("=")[1] ?? "", 10) || DEFAULT_LIMIT;
    }

    if (arg.startsWith("--batch=")) {
      batch = Number.parseInt(arg.split("=")[1] ?? "", 10) || DEFAULT_BATCH;
    }
  }

  return { limit, batch };
}

function normalize(value: string): string {
  return value.normalize("NFC").toLowerCase().trim();
}

function buildId(name: string, artist: string): string {
  return crypto
    .createHash("sha256")
    .update(`${normalize(name)}|${normalize(artist)}`)
    .digest("hex")
    .slice(0, 24);
}

function parseNumber(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function loadRows(limit: number): Promise<SeedRow[]> {
  const stream = fs.createReadStream(DATA_PATH);
  const parser = stream.pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );
  const rows: SeedRow[] = [];

  for await (const row of parser) {
    rows.push({
      source_id: row.source_id || undefined,
      name: row.name,
      artist: row.artist,
      genre: row.genre || null,
      popularity: parseNumber(row.popularity),
      valence: parseNumber(row.valence),
      energy: parseNumber(row.energy),
      tempo: parseNumber(row.tempo),
      danceability: parseNumber(row.danceability),
      acousticness: parseNumber(row.acousticness),
    });

    if (rows.length >= limit) {
      break;
    }
  }

  return rows;
}

async function loadExistingIds(ids: string[]): Promise<Set<string>> {
  const admin = createSupabaseAdminClient();
  const existing = new Set<string>();

  for (let index = 0; index < ids.length; index += 500) {
    const chunk = ids.slice(index, index + 500);
    const { data, error } = await admin
      .from("tracks")
      .select("id, embedding")
      .in("id", chunk);

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      if (row.embedding) {
        existing.add(row.id);
      }
    }
  }

  return existing;
}

async function flushBatch(batch: TrackInsert[]): Promise<void> {
  if (batch.length === 0) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("tracks").upsert(batch, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

function formatDuration(startTime: number): string {
  const elapsedMs = Date.now() - startTime;
  const totalSeconds = Math.round(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const { limit, batch } = parseArgs(process.argv.slice(2));
  const rows = await loadRows(limit);
  const ids = rows.map((row) => buildId(row.name, row.artist));
  const existingIds = await loadExistingIds(ids);
  const pendingRows = rows.filter(
    (row) => !existingIds.has(buildId(row.name, row.artist)),
  );

  if (pendingRows.length === 0) {
    console.log("All requested tracks already have embeddings.");
    console.log(`Total wall time: ${formatDuration(startedAt)}`);
    return;
  }

  const progress = new cliProgress.SingleBar(
    {
      format:
        "Embedding tracks [{bar}] {percentage}% | {value}/{total} | ETA: {eta_formatted}",
    },
    cliProgress.Presets.shades_classic,
  );
  const upsertBuffer: TrackInsert[] = [];

  progress.start(pendingRows.length, 0);

  for (const [index, row] of pendingRows.entries()) {
    const embedding = await embed(buildMoodText(row));

    upsertBuffer.push({
      id: buildId(row.name, row.artist),
      name: row.name,
      artist: row.artist,
      genre: row.genre,
      popularity: row.popularity,
      valence: row.valence,
      energy: row.energy,
      tempo: row.tempo,
      danceability: row.danceability,
      acousticness: row.acousticness,
      embedding: toPgVector(embedding),
    });

    if (upsertBuffer.length >= batch) {
      await flushBatch(upsertBuffer.splice(0, upsertBuffer.length));
    }

    progress.update(index + 1);
  }

  progress.stop();
  await flushBatch(upsertBuffer);

  console.log(`Seeded ${pendingRows.length} tracks.`);
  console.log(`Total wall time: ${formatDuration(startedAt)}`);
}

main().catch((error) => {
  console.error("Seed script failed", error);
  process.exit(1);
});
