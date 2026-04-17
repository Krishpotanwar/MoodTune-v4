import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";

env.localModelPath = path.join(process.cwd(), "public", "models");
env.allowRemoteModels = false;

type EmbeddingPipeline = (input: string, options: {
  pooling: "mean";
  normalize: true;
}) => Promise<{ data: Float32Array | number[] }>;

let extractor: EmbeddingPipeline | null = null;

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
  const embeddingPipeline = await getExtractor();
  const output = await embeddingPipeline(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}
