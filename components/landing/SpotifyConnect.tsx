"use client";

import { useState, useEffect, useCallback } from "react";
import { buildPKCEChallenge, getSpotifyAuthURL, exchangeCode } from "@/lib/spotify-client";

type Props = {
  onConnect: (accessToken: string) => void;
  connected: boolean;
  trackCount: number;
};

export function SpotifyConnect({ onConnect, connected, trackCount }: Props) {
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "spotify-callback") return;

      const { code, error } = event.data as { type: string; code?: string; error?: string };
      if (error || !code) {
        setLoading(false);
        return;
      }

      const verifier = sessionStorage.getItem("spotify_verifier");
      const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
      const redirectUri = `${window.location.origin}/api/spotify/callback`;

      if (!verifier || !clientId) {
        setLoading(false);
        return;
      }

      try {
        const { accessToken } = await exchangeCode(code, verifier, clientId, redirectUri);
        sessionStorage.removeItem("spotify_verifier");
        onConnect(accessToken);
      } catch {
        setLoading(false);
      }
    },
    [onConnect],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Handle redirect flow (no popup)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("spotify_code");
    if (!code) return;
    const verifier = sessionStorage.getItem("spotify_verifier");
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
    const redirectUri = `${window.location.origin}/api/spotify/callback`;
    if (!verifier || !clientId) return;

    setLoading(true);
    exchangeCode(code, verifier, clientId, redirectUri)
      .then(({ accessToken }) => {
        sessionStorage.removeItem("spotify_verifier");
        const url = new URL(window.location.href);
        url.searchParams.delete("spotify_code");
        window.history.replaceState({}, "", url.toString());
        onConnect(accessToken);
      })
      .catch(() => setLoading(false));
  }, [onConnect]);

  const handleClick = async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
    if (!clientId) {
      setConfigError("Spotify is not configured for this deployment.");
      return;
    }
    setConfigError(null);
    setLoading(true);
    const { verifier, challenge } = await buildPKCEChallenge();
    sessionStorage.setItem("spotify_verifier", verifier);
    const redirectUri = `${window.location.origin}/api/spotify/callback`;
    const authUrl = getSpotifyAuthURL(clientId, redirectUri, challenge);

    const popup = window.open(authUrl, "spotify-auth", "width=480,height=640,resizable=yes");
    if (!popup) {
      window.location.href = authUrl;
    }
  };

  if (connected) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#1DB954]/40 bg-[#1DB954]/10 px-4 py-2 text-xs font-medium text-[#1DB954]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1DB954]" />
        {trackCount > 0 ? `${trackCount} tracks synced` : "Spotify connected"}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-[#1DB954]/50 bg-[#1DB954]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1DB954] transition hover:bg-[#1DB954]/20 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        {loading ? "Connecting…" : "Connect Spotify"}
      </button>
      {configError && (
        <p className="max-w-[200px] text-right text-[10px] text-red-400/80">{configError}</p>
      )}
    </div>
  );
}
