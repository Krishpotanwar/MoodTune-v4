import { describe, expect, test } from "vitest";
import { buildMoodText } from "@/lib/mood-text";

describe("buildMoodText", () => {
  test("includes tuned descriptors for low-valence high-energy fast tracks", () => {
    const output = buildMoodText({
      name: "X",
      artist: "Y",
      valence: 0.1,
      energy: 0.9,
      tempo: 170,
    });

    expect(output).toContain("melancholic");
    expect(output).toContain("high energy");
    expect(output).toContain("very fast tempo");
  });

  test("returns stable output across calls", () => {
    const track = {
      name: "Stable",
      artist: "Track",
      genre: "ambient",
      valence: 0.3,
      energy: 0.2,
      tempo: 72,
      danceability: 0.1,
      acousticness: 0.8,
    };

    expect(buildMoodText(track)).toBe(buildMoodText(track));
  });
});
