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
      className="group h-full rounded-2xl border border-white/[0.06] bg-[#0f0f0f]/60 text-neutral-100 transition-all duration-300 hover:border-white/[0.1] hover:bg-[#0f0f0f]/80"
    >
      <CardHeader className="gap-4 p-4">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-900/50">
          {track.album_art ? (
            <img
              src={track.album_art}
              alt={`${track.name} cover art`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-600">
              <Disc3 className="size-10" />
            </div>
          )}
          <div className="absolute left-2.5 top-2.5">
            <Badge
              variant="outline"
              className="border-white/[0.08] bg-black/50 backdrop-blur-sm text-[10px] uppercase tracking-[0.15em] text-neutral-300"
            >
              {similarity}%
            </Badge>
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-base font-medium tracking-tight text-white line-clamp-1">
            {track.name}
          </CardTitle>
          <p className="text-sm text-neutral-500 line-clamp-1">{track.artist}</p>
        </div>
      </CardHeader>
      <CardContent
        className="space-y-3 px-4 pb-0 text-sm text-neutral-400 cursor-pointer"
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
        <div className="flex flex-wrap gap-1.5">
          {track.valence != null ? (
            <Badge
              variant="outline"
              className="border-white/[0.04] bg-white/[0.02] text-[10px] text-neutral-500"
            >
              {(track.valence * 100).toFixed(0)}% valence
            </Badge>
          ) : null}
          {track.energy != null ? (
            <Badge
              variant="outline"
              className="border-white/[0.04] bg-white/[0.02] text-[10px] text-neutral-500"
            >
              {(track.energy * 100).toFixed(0)}% energy
            </Badge>
          ) : null}
        </div>
        {expanded ? (
          <div className="rounded-xl border border-white/[0.06] bg-black/30 px-3.5 py-3 text-sm leading-relaxed text-neutral-400">
            {loadingExplanation ? (
              <div className="flex items-center gap-2 text-neutral-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : explanation ? (
              <p data-testid="track-explanation" className="text-neutral-300">{explanation}</p>
            ) : (
              <p className="text-neutral-600">Tap again in a moment.</p>
            )}
          </div>
        ) : (
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-600 group-hover:text-neutral-500 transition-colors">
            Tap for why this fits
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.04] bg-white/[0.01] px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              rating === 1
                ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "rounded-full border border-white/[0.06] bg-white/[0.02] text-neutral-500 hover:border-white/[0.1] hover:text-neutral-400"
            }
            aria-label={`Like ${track.name}`}
            disabled={feedbackPending}
            onClick={() => void submitFeedback(1)}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              rating === -1
                ? "rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                : "rounded-full border border-white/[0.06] bg-white/[0.02] text-neutral-500 hover:border-white/[0.1] hover:text-neutral-400"
            }
            aria-label={`Dislike ${track.name}`}
            disabled={feedbackPending}
            onClick={() => void submitFeedback(-1)}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </Button>
        </div>
        {spotifyUrl ? (
          <Button
            render={
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" />
            }
            size="sm"
            className="rounded-lg bg-white px-3.5 text-[11px] font-medium text-[#050505] hover:bg-neutral-200"
          >
            Open
            <ArrowUpRight className="ml-1.5 w-3 h-3" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled
            className="rounded-lg bg-white/5 px-3.5 text-[11px] text-neutral-600"
          >
            Unlinked
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}