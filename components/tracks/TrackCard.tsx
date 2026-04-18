"use client";

import { useState } from "react";
import { ArrowUpRight, Disc3, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Track } from "@/lib/schema";

function spotifyHref(spotifyUri: string | null | undefined): string | null {
  if (!spotifyUri) {
    return null;
  }

  if (spotifyUri.startsWith("http://") || spotifyUri.startsWith("https://")) {
    return spotifyUri;
  }

  if (spotifyUri.startsWith("spotify:track:")) {
    return `https://open.spotify.com/track/${spotifyUri.replace("spotify:track:", "")}`;
  }

  return spotifyUri;
}

export function TrackCard({
  track,
  query,
}: {
  track: Track;
  query?: string;
}) {
  const similarity = Math.round(track.similarity * 100);
  const spotifyUrl = spotifyHref(track.spotify_uri);
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  async function submitFeedback(nextRating: 1 | -1) {
    const previousRating = rating;
    setRating(nextRating);
    setFeedbackPending(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          track_id: track.id,
          rating: nextRating,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body?.error === "rate_limited"
            ? "Too many ratings too quickly. Try again in a minute."
            : "Could not save your feedback.",
        );
      }

      if (body.profile_updated) {
        toast.success("Your taste profile updated.");
      } else {
        toast.success(nextRating === 1 ? "Saved as a like." : "Saved as a skip.");
      }
    } catch (error) {
      setRating(previousRating);
      toast.error(
        error instanceof Error ? error.message : "Could not save your feedback.",
      );
    } finally {
      setFeedbackPending(false);
    }
  }

  async function toggleExplanation() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (!nextExpanded || explanation || loadingExplanation) {
      return;
    }

    setLoadingExplanation(true);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          track_id: track.id,
          query,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body?.error === "rate_limited"
            ? "Too many explanation requests. Try again shortly."
            : "Could not load the explanation.",
        );
      }

      setExplanation(body.explanation);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load the explanation.",
      );
    } finally {
      setLoadingExplanation(false);
    }
  }

  return (
    <Card
      data-testid="track-card"
      className="h-full rounded-[28px] border border-white/10 bg-white/[0.03] text-neutral-100 ring-0"
      >
        <CardHeader className="gap-4 p-4">
        <div className="relative aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.01))]">
          {track.album_art ? (
            // Album art can come from arbitrary Spotify/CDN hosts, so a native img is safer here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.album_art}
              alt={`${track.name} cover art`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-500">
              <Disc3 className="size-10" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge
              variant="outline"
              className="border-white/10 bg-black/45 text-[11px] uppercase tracking-[0.18em] text-neutral-200"
            >
              {similarity}% match
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-lg font-medium tracking-tight text-white">
            {track.name}
          </CardTitle>
          <p className="text-sm text-neutral-400">{track.artist}</p>
        </div>
      </CardHeader>
      <CardContent
        className="space-y-3 px-4 pb-0 text-sm text-neutral-300"
        onClick={() => void toggleExplanation()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void toggleExplanation();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <div className="flex flex-wrap gap-2">
          {track.valence != null ? (
            <Badge
              variant="outline"
              className="border-white/10 bg-white/[0.02] text-neutral-300"
            >
              Valence {track.valence.toFixed(2)}
            </Badge>
          ) : null}
          {track.energy != null ? (
            <Badge
              variant="outline"
              className="border-white/10 bg-white/[0.02] text-neutral-300"
            >
              Energy {track.energy.toFixed(2)}
            </Badge>
          ) : null}
        </div>
        {expanded ? (
          <div className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-3 text-sm leading-7 text-neutral-300">
            {loadingExplanation ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <Loader2 className="size-4 animate-spin" />
                Loading explanation...
              </div>
            ) : explanation ? (
              <p data-testid="track-explanation">{explanation}</p>
            ) : (
              <p className="text-neutral-500">Tap again in a moment.</p>
            )}
          </div>
        ) : (
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Tap for why this fits
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between gap-2 border-white/10 bg-white/[0.02] px-4 py-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              rating === 1
                ? "rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20"
                : "rounded-full border border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08]"
            }
            aria-label={`Like ${track.name}`}
            disabled={feedbackPending}
            onClick={() => void submitFeedback(1)}
          >
            <ThumbsUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              rating === -1
                ? "rounded-full border border-rose-400/40 bg-rose-400/15 text-rose-200 hover:bg-rose-400/20"
                : "rounded-full border border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08]"
            }
            aria-label={`Dislike ${track.name}`}
            disabled={feedbackPending}
            onClick={() => void submitFeedback(-1)}
          >
            <ThumbsDown className="size-4" />
          </Button>
        </div>
        {spotifyUrl ? (
          <Button
            render={
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" />
            }
            size="sm"
            className="rounded-full bg-white px-4 text-black hover:bg-neutral-200"
          >
            Open
            <ArrowUpRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled
            className="rounded-full bg-white/10 px-4 text-neutral-500"
          >
            Unlinked
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
