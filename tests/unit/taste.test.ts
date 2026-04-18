import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildFallbackTasteProfile,
  buildFallbackExplanation,
  isFakeGeminiEnabled,
  type TrackMetadata,
} from "@/lib/taste";

// We need to import the label functions, but they are not exported.
// This is a common issue when testing legacy code. For this test,
// we will not test the private functions directly, but will test them
// indirectly through the public functions that use them.

const mockTrack = (overrides: Partial<TrackMetadata> = {}): TrackMetadata => ({
  id: "test-id",
  name: "Test Track",
  artist: "Test Artist",
  genre: "test-genre",
  valence: 0.5,
  energy: 0.5,
  tempo: 120,
  danceability: 0.5,
  acousticness: 0.5,
  ...overrides,
});

describe("lib/taste", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("buildFallbackTasteProfile", () => {
    it("should generate a summary based on liked and disliked tracks", () => {
      const liked = [
        mockTrack({ valence: 0.9, energy: 0.9, tempo: 140, acousticness: 0.1 }), // euphoric, high-energy, faster, glossy
      ];
      const disliked = [
        mockTrack({ valence: 0.1, energy: 0.2, tempo: 70 }), // melancholic, low-energy, slower
      ];
      const result = buildFallbackTasteProfile({ liked, disliked });
      
      expect(result).toContain("euphoric");
      expect(result).toContain("high-energy");
      expect(result).toContain("faster");
      expect(result).toContain("glossy");
      expect(result).toContain("melancholic");
      expect(result).toContain("low-energy");
      expect(result).toContain("slower");
      expect(result).toContain("test-genre");
    });

    it("should handle empty lists", () => {
        const result = buildFallbackTasteProfile({ liked: [], disliked: [] });
        expect(result).toContain("balanced");
        expect(result).toContain("steady");
        expect(result).toContain("moderate-tempo");
    });
  });

  describe("buildFallbackExplanation", () => {
    it("should generate an explanation for a track and query", () => {
      const track = mockTrack({ valence: 0.8, tempo: 130, acousticness: 0.8 }); // euphoric, faster, acoustic
      const result = buildFallbackExplanation({ track, query: "happy energetic music" });

      expect(result).toContain("euphoric");
      expect(result).toContain("faster");
      expect(result).toContain("acoustic");
      expect(result).toContain("happy energetic music");
      expect(result).not.toContain("your usual taste");
    });

    it("should mention user taste if a summary is provided", () => {
        const track = mockTrack();
        const result = buildFallbackExplanation({ track, query: "test", summary: "You like..." });
        expect(result).toContain("fits your usual taste");
    });
  });

  describe("isFakeGeminiEnabled", () => {
    it("should return true when env var is 'true'", () => {
      process.env.MOODTUNE_FAKE_GEMINI = "true";
      expect(isFakeGeminiEnabled()).toBe(true);
    });

    it("should return false when env var is not 'true'", () => {
      process.env.MOODTUNE_FAKE_GEMINI = "false";
      expect(isFakeGeminiEnabled()).toBe(false);

      delete process.env.MOODTUNE_FAKE_GEMINI;
      expect(isFakeGeminiEnabled()).toBe(false);
    });
  });
});
