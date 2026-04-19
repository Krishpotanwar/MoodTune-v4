export type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  valence: number;
  energy: number;
  danceability: number;
  tempo: number;
  popularity: number;
  recentlyPlayed?: boolean;
  playlistId?: string;
};

export type SpotifyPlaylist = { id: string; name: string };

const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";
const SPOTIFY_API = "https://api.spotify.com/v1";
const SCOPES = "user-top-read user-read-recently-played playlist-read-private";

function base64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function buildPKCEChallenge(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  const verifier = base64url(array.buffer);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = base64url(hash);
  return { verifier, challenge };
}

export function getSpotifyAuthURL(
  clientId: string,
  redirectUri: string,
  challenge: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  return `${SPOTIFY_ACCOUNTS}/authorize?${params}`;
}

export async function exchangeCode(
  code: string,
  verifier: string,
  clientId: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function getAudioFeatures(
  ids: string[],
  token: string,
): Promise<Record<string, { valence: number; energy: number; danceability: number; tempo: number }>> {
  if (ids.length === 0) return {};
  const res = await fetch(
    `${SPOTIFY_API}/audio-features?ids=${ids.slice(0, 100).join(",")}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<string, { valence: number; energy: number; danceability: number; tempo: number }> = {};
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

export async function fetchTopTracks(token: string): Promise<SpotifyTrack[]> {
  const res = await fetch(
    `${SPOTIFY_API}/me/top/tracks?time_range=medium_term&limit=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const items: SpotifyItem[] = data.items ?? [];
  const ids = items.map((t) => t.id);
  const features = await getAudioFeatures(ids, token);
  return items.map((t) => buildTrack(t, features[t.id]));
}

export async function fetchRecentlyPlayed(token: string): Promise<SpotifyTrack[]> {
  const res = await fetch(
    `${SPOTIFY_API}/me/player/recently-played?limit=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const seen = new Set<string>();
  const items: SpotifyItem[] = [];
  for (const entry of data.items ?? []) {
    if (!seen.has(entry.track.id)) {
      seen.add(entry.track.id);
      items.push(entry.track);
    }
  }
  const ids = items.map((t) => t.id);
  const features = await getAudioFeatures(ids, token);
  return items.map((t) => ({ ...buildTrack(t, features[t.id]), recentlyPlayed: true }));
}

type SpotifyItem = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  popularity: number;
};

function buildTrack(
  item: SpotifyItem,
  features?: { valence: number; energy: number; danceability: number; tempo: number },
): SpotifyTrack {
  return {
    id: item.id,
    name: item.name,
    artist: item.artists[0]?.name ?? "Unknown",
    albumArt: item.album.images[0]?.url ?? null,
    valence: features?.valence ?? 0.5,
    energy: features?.energy ?? 0.5,
    danceability: features?.danceability ?? 0.5,
    tempo: features?.tempo ?? 120,
    popularity: item.popularity,
  };
}

export function playlistIdToHue(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) ^ id.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = Math.abs(hash) / 2147483647;
  return (normalized * 0.6180339887) % 1.0;
}

export async function fetchUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  const res = await fetch(`${SPOTIFY_API}/me/playlists?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((p: { id: string; name: string }) => ({
    id: p.id,
    name: p.name,
  }));
}

export async function fetchPlaylistTracks(
  playlistId: string,
  token: string,
): Promise<SpotifyTrack[]> {
  const res = await fetch(
    `${SPOTIFY_API}/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,artists,album(images),popularity))`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const items: SpotifyItem[] = (data.items ?? [])
    .map((e: { track?: SpotifyItem }) => e.track)
    .filter((t: SpotifyItem | undefined): t is SpotifyItem => Boolean(t?.id));
  if (items.length === 0) return [];
  const ids = items.map((t) => t.id);
  const features = await getAudioFeatures(ids, token);
  return items.map((t) => ({ ...buildTrack(t, features[t.id]), playlistId }));
}
