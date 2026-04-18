export {};

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "csv-parse";
import { normalizeText } from "@/lib/taste";

type TrackRow = {
  source_id: string;
  name: string;
  artist: string;
  genre: string;
  popularity: number;
  valence: number | null;
  energy: number | null;
  tempo: number | null;
  danceability: number | null;
  acousticness: number | null;
};

const TARGET_ROWS = 15_000;
const RAW_CSV_PATH =
  process.env.RAW_CSV_PATH ??
  path.join(os.homedir(), "Downloads", "spotify_tracks_raw.csv");
const OUTPUT_PATH = path.join(process.cwd(), "data", "spotify_tracks.csv");



function parseNumber(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parsePopularity(value: string | undefined): number {
  return parseNumber(value) ?? 0;
}

function pickValue(
  record: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    if (record[key]) {
      return record[key];
    }
  }

  return undefined;
}

function normalizeArtist(value: string | undefined): string {
  if (!value) {
    return "Unknown Artist";
  }

  return value.split(/[;|]/)[0]?.trim() || "Unknown Artist";
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }

  return copy;
}

function escapeCsv(value: string | number | null): string {
  if (value == null) {
    return "";
  }

  const stringValue = String(value);
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

async function loadRows(): Promise<TrackRow[]> {
  if (!fs.existsSync(RAW_CSV_PATH)) {
    throw new Error(
      `Raw CSV not found at ${RAW_CSV_PATH}. Set RAW_CSV_PATH or place spotify_tracks_raw.csv in ~/Downloads.`,
    );
  }

  const parser = fs.createReadStream(RAW_CSV_PATH).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }),
  );
  const deduped = new Map<string, TrackRow>();

  for await (const record of parser) {
    const rowRecord = record as Record<string, string>;
    const name = pickValue(rowRecord, "name", "track_name");

    if (!name) {
      continue;
    }

    const artist = normalizeArtist(pickValue(rowRecord, "artists", "artist"));
    const dedupeKey = `${normalizeText(name)}|${normalizeText(artist)}`;

    if (deduped.has(dedupeKey)) {
      continue;
    }

    deduped.set(dedupeKey, {
      source_id: pickValue(rowRecord, "id", "track_id") ?? dedupeKey,
      name: name.trim(),
      artist,
      genre: pickValue(rowRecord, "track_genre", "genre")?.trim() || "unknown",
      popularity: parsePopularity(rowRecord.popularity),
      valence: parseNumber(rowRecord.valence),
      energy: parseNumber(rowRecord.energy),
      tempo: parseNumber(rowRecord.tempo),
      danceability: parseNumber(rowRecord.danceability),
      acousticness: parseNumber(rowRecord.acousticness),
    });
  }

  return [...deduped.values()];
}

function takeTopByPopularity(rows: TrackRow[], count: number): TrackRow[] {
  return [...rows]
    .sort((left, right) => right.popularity - left.popularity)
    .slice(0, count);
}

function takeStratifiedByGenre(rows: TrackRow[], count: number): TrackRow[] {
  if (rows.length <= count) {
    return [...rows];
  }

  const groups = new Map<string, TrackRow[]>();

  for (const row of rows) {
    const group = groups.get(row.genre) ?? [];
    group.push(row);
    groups.set(row.genre, group);
  }

  const bucketSize = Math.ceil(count / groups.size);
  const selected: TrackRow[] = [];
  const leftovers: TrackRow[] = [];

  for (const [, groupRows] of groups) {
    const shuffled = shuffle(groupRows);
    selected.push(...shuffled.slice(0, bucketSize));
    leftovers.push(...shuffled.slice(bucketSize));
  }

  if (selected.length >= count) {
    return shuffle(selected).slice(0, count);
  }

  return [...selected, ...shuffle(leftovers).slice(0, count - selected.length)];
}

function buildGenreDistribution(rows: TrackRow[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const row of rows) {
    distribution[row.genre] = (distribution[row.genre] ?? 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(distribution).sort((left, right) => right[1] - left[1]),
  );
}

async function writeRows(rows: TrackRow[]): Promise<void> {
  await fs.promises.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  const header = [
    "source_id",
    "name",
    "artist",
    "genre",
    "popularity",
    "valence",
    "energy",
    "tempo",
    "danceability",
    "acousticness",
  ].join(",");
  const lines = rows.map((row) =>
    [
      row.source_id,
      row.name,
      row.artist,
      row.genre,
      row.popularity,
      row.valence,
      row.energy,
      row.tempo,
      row.danceability,
      row.acousticness,
    ]
      .map(escapeCsv)
      .join(","),
  );

  await fs.promises.writeFile(OUTPUT_PATH, `${header}\n${lines.join("\n")}\n`);
}

async function main(): Promise<void> {
  const rows = await loadRows();
  const selectedKeys = new Set<string>();

  const topPopular = takeTopByPopularity(rows, 5_000);
  const markSelected = (row: TrackRow) => {
    selectedKeys.add(`${normalizeText(row.name)}|${normalizeText(row.artist)}`);
  };

  topPopular.forEach(markSelected);

  const remainderAfterPopular = rows.filter(
    (row) =>
      !selectedKeys.has(`${normalizeText(row.name)}|${normalizeText(row.artist)}`),
  );
  const randomSample = shuffle(remainderAfterPopular).slice(0, 5_000);
  randomSample.forEach(markSelected);

  const remainderAfterRandom = rows.filter(
    (row) =>
      !selectedKeys.has(`${normalizeText(row.name)}|${normalizeText(row.artist)}`),
  );
  const stratifiedSample = takeStratifiedByGenre(remainderAfterRandom, 5_000);

  const selected = [...topPopular, ...randomSample, ...stratifiedSample].slice(
    0,
    TARGET_ROWS,
  );

  await writeRows(selected);

  console.log(`Wrote ${selected.length} rows to ${OUTPUT_PATH}`);
  console.log(
    `Distinct genres: ${Object.keys(buildGenreDistribution(selected)).length}`,
  );
  console.log(
    JSON.stringify(buildGenreDistribution(selected), null, 2),
  );
}

main().catch((error) => {
  console.error("Filter script failed", error);
  process.exit(1);
});
