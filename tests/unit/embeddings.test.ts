import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Hugging Face pipeline so we don't try to load a real model
vi.mock("@huggingface/transformers", () => ({
  pipeline: vi.fn().mockResolvedValue(
    (text: string) => {
      const vector = new Array(384).fill(0);
      vector[0] = text.length / 10;
      return Promise.resolve({ data: Float32Array.from(vector) });
    }
  ),
  env: {
    localModelPath: "",
    allowRemoteModels: false,
  },
}));

describe("lib/embeddings", () => {
  beforeEach(() => {
    // Reset modules before each test to re-evaluate top-level constants
    vi.resetModules();
  });

  describe("embed() with real embeddings", () => {
    it("should return a vector from the HF pipeline", async () => {
      process.env.MOODTUNE_FAKE_EMBEDDINGS = "false";
      const { embed } = await import("@/lib/embeddings");

      const result = await embed("test query");
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(384);
      // Based on our mock implementation
      expect(result[0]).toBe(1.0);
    });
  });

  describe("embed() with fake embeddings", () => {
    it("should return a normalized vector using fakeEmbed", async () => {
      process.env.MOODTUNE_FAKE_EMBEDDINGS = "true";
      const { embed } = await import("@/lib/embeddings");

      const result = await embed("test query");
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(384);
      expect(Math.hypot(...result)).toBeCloseTo(1);
    });

    it("should correctly apply weight for a known LEXICON token", async () => {
      process.env.MOODTUNE_FAKE_EMBEDDINGS = "true";
      const { embed } = await import("@/lib/embeddings");

      // "dark" maps to dimension 0 with weight 1.4
      const result = await embed("dark");
      
      // The vector should be normalized
      expect(Math.hypot(...result)).toBeCloseTo(1);
      // And the weighted dimension should have a significant value
      expect(result[0]).toBeGreaterThan(0.5);
    });

    it("should correctly apply weights for multiple known tokens", async () => {
      process.env.MOODTUNE_FAKE_EMBEDDINGS = "true";
      const { embed } = await import("@/lib/embeddings");
      
      // "rainy" maps to [[0, 1.2], [2, 0.5]]
      const result = await embed("rainy");
      
      expect(Math.hypot(...result)).toBeCloseTo(1);
      expect(result[0]).toBeGreaterThan(0);
      expect(result[2]).toBeGreaterThan(0);
    });

    it("should handle unknown tokens by applying only the hash bucket value", async () => {
      process.env.MOODTUNE_FAKE_EMBEDDINGS = "true";
      const { embed } = await import("@/lib/embeddings");

      const result = await embed("zyxw"); // an unlikely token
      
      const nonZeroValues = result.filter(v => v > 0);
      // We expect only one non-zero value from the hash bucket
      expect(nonZeroValues.length).toBe(1);
      expect(Math.hypot(...result)).toBeCloseTo(1);
    });

    it("should handle an empty string", async () => {
      process.env.MOODTUNE_FAKE_EMBEDDINGS = "true";
      const { embed } = await import("@/lib/embeddings");

      const result = await embed("");
      expect(result[0]).toBe(1);
      const otherValues = result.slice(1);
      expect(otherValues.every(v => v === 0)).toBe(true);
    });
  });
});
