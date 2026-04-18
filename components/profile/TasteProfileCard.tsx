"use client";

import { useState } from "react";
import { PencilLine, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type FeedbackHistoryItem = {
  track_id: string;
  rating: number;
  created_at: string | null;
  track_name: string;
  artist: string;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function TasteProfileCard({
  initialSummary,
  ratingCount,
  updatedAt,
  history,
}: {
  initialSummary: string | null;
  ratingCount: number;
  updatedAt: string | null;
  history: FeedbackHistoryItem[];
}) {
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [savedSummary, setSavedSummary] = useState(initialSummary ?? "");
  const [pending, setPending] = useState(false);
  const hasSummary = savedSummary.trim().length > 0;

  async function saveSummary() {
    if (!summary.trim()) {
      toast.error("Write a short taste summary before saving.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ summary: summary.trim() }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error("Profile update failed.");
      }

      setSavedSummary(body.summary);
      setSummary(body.summary);
      setEditing(false);
      toast.success("Taste profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
              Taste Profile
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-white">
              Your listening center of gravity
            </h1>
            <p className="text-sm text-neutral-500">
              {ratingCount} ratings
              {updatedAt ? ` · updated ${formatDate(updatedAt)}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08]"
            onClick={() => {
              setEditing((value) => !value);
              setSummary(savedSummary);
            }}
          >
            <PencilLine className="size-4" />
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-black/30 p-5">
          {editing ? (
            <div className="space-y-4">
              <Textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="min-h-[160px] border-white/10 bg-white/[0.03] text-neutral-100 placeholder:text-neutral-500"
                placeholder="Shape your profile in your own words."
              />
              <Button
                type="button"
                onClick={saveSummary}
                disabled={pending}
                className="rounded-full bg-white px-5 text-black hover:bg-neutral-200"
              >
                <Save className="size-4" />
                {pending ? "Saving" : "Save"}
              </Button>
            </div>
          ) : hasSummary ? (
            <p
              data-testid="taste-profile-summary"
              className="font-serif text-xl leading-8 text-neutral-300 italic"
            >
              {savedSummary}
            </p>
          ) : (
            <p
              data-testid="taste-profile-empty"
              className="text-base leading-8 text-neutral-400"
            >
              Rate a few songs to see your taste profile.
            </p>
          )}
        </div>
      </article>

      <aside className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.45)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
            Recent Feedback
          </p>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Last 20 ratings
          </h2>
        </div>
        <div className="mt-6 max-h-[400px] space-y-3 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="rounded-[24px] border border-dashed border-white/10 px-4 py-6 text-sm leading-7 text-neutral-400">
              No ratings yet. Head back to the chat and start shaping the profile.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={`${item.track_id}-${item.created_at ?? "now"}`}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-black/25 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.track_name}
                  </p>
                  <p className="truncate text-sm text-neutral-400">{item.artist}</p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      item.rating === 1
                        ? "text-sm font-medium text-emerald-300"
                        : "text-sm font-medium text-rose-300"
                    }
                  >
                    {item.rating === 1 ? "Liked" : "Skipped"}
                  </p>
                  <p className="text-xs text-neutral-500">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
