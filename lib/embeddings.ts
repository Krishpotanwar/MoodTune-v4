import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";

env.localModelPath = path.join(process.cwd(), "public", "models");
env.allowRemoteModels = false;

const EMBEDDING_DIMENSIONS = 384;
const USE_FAKE_EMBEDDINGS = process.env.MOODTUNE_FAKE_EMBEDDINGS === "true";

type EmbeddingPipeline = (input: string, options: {
  pooling: "mean";
  normalize: true;
}) => Promise<{ data: Float32Array | number[] }>;

let extractor: EmbeddingPipeline | null = null;

const LEXICON: Record<string, Array<[number, number]>> = {
  dark: [[0, 1.4]],
  rainy: [[0, 1.2], [2, 0.5]],
  melancholic: [[0, 1.5], [6, 0.9]],
  sad: [[0, 1.2]],
  moody: [[0, 1.1], [6, 0.5]],
  introspective: [[6, 1.4]],
  reflective: [[6, 1.2]],
  calm: [[2, 1.1]],
  soft: [[2, 0.8], [4, 0.8]],
  acoustic: [[4, 1.4]],
  warm: [[1, 0.7], [6, 0.5]],
  nostalgic: [[6, 1.1]],
  bright: [[1, 1.2]],
  euphoric: [[1, 1.6], [3, 1.1]],
  sunrise: [[1, 1.1]],
  energy: [[3, 1.0]],
  energetic: [[3, 1.2]],
  dance: [[3, 1.2], [5, 1.3]],
  danceable: [[5, 1.5]],
  party: [[3, 1.1], [5, 1.3]],
  drive: [[7, 1.5]],
  highway: [[7, 1.2]],
  road: [[7, 1.1]],
  slow: [[2, 0.8]],
  fast: [[3, 0.9]],
};

function normalizeVector(values: number[]): number[] {
  const norm = Math.hypot(...values) || 1;
  return values.map((value) => value / norm);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function hashToken(token: string): number {
  let hash = 0;

  for (const char of token) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function fakeEmbed(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    for (const [dimension, weight] of LEXICON[token] ?? []) {
      vector[dimension] += weight;
    }

    const bucket = 16 + (hashToken(token) % (EMBEDDING_DIMENSIONS - 16));
    vector[bucket] += 0.35;
  }

  if (tokens.length === 0) {
    vector[0] = 1;
  }

  return normalizeVector(vector);
}

async function getExtractor(): Promise<EmbeddingPipeline> {
  if (!extractor) {
    const createPipeline = pipeline as (...args: unknown[]) => Promise<unknown>;

    extractor = (await createPipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      {
        dtype: "q8",
      },
    )) as EmbeddingPipeline;
  }

  return extractor;
}

export async function embed(text: string): Promise<number[]> {
  if (USE_FAKE_EMBEDDINGS) {
    return fakeEmbed(text);
  }

  const embeddingPipeline = await getExtractor();
  const output = await embeddingPipeline(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}
