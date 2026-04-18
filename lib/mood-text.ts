export function buildMoodText(track: {
  name: string;
  artist: string;
  genre?: string | null;
  valence?: number | null;
  energy?: number | null;
  tempo?: number | null;
  danceability?: number | null;
  acousticness?: number | null;
}): string {
  const parts: string[] = [`${track.name} by ${track.artist}.`];
  if (track.genre) parts.push(`${track.genre}.`);

  const mood = describeValence(track.valence);
  const intensity = describeEnergy(track.energy);
  const pace = describeTempo(track.tempo);
  const dance = describeDance(track.danceability);
  const texture = describeAcoustic(track.acousticness);

  const descriptors = [mood, intensity, pace, dance, texture].filter(Boolean);
  if (descriptors.length) parts.push(descriptors.join(", ") + ".");
  return parts.join(" ");
}

function describeValence(v?: number | null): string {
  if (v == null) return "";
  if (v < 0.2) return "melancholic, sad, somber";
  if (v < 0.4) return "introspective, subdued";
  if (v < 0.6) return "bittersweet, reflective";
  if (v < 0.8) return "upbeat, cheerful";
  return "euphoric, joyful, bright";
}

function describeEnergy(e?: number | null): string {
  if (e == null) return "";
  if (e < 0.2) return "calm, still, gentle";
  if (e < 0.4) return "relaxed, soft";
  if (e < 0.6) return "moderate intensity";
  if (e < 0.8) return "energetic, driving";
  return "high energy, intense, aggressive";
}

function describeTempo(t?: number | null): string {
  if (t == null) return "";
  if (t < 70) return "slow tempo";
  if (t < 100) return "medium-slow tempo";
  if (t < 130) return "medium tempo";
  if (t < 160) return "fast tempo";
  return "very fast tempo";
}

function describeDance(d?: number | null): string {
  if (d == null) return "";
  if (d < 0.3) return "not danceable";
  if (d < 0.7) return "";
  return "danceable, groovy";
}

function describeAcoustic(a?: number | null): string {
  if (a == null) return "";
  if (a > 0.7) return "acoustic, organic";
  if (a < 0.1) return "electronic, synthetic";
  return "";
}
