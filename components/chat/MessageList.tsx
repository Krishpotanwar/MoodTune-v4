import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrackGrid } from "@/components/tracks/TrackGrid";
import type { ConversationMessage } from "@/components/chat/types";

export function MessageList({
  messages,
  pending,
}: {
  messages: ConversationMessage[];
  pending: boolean;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] px-8 py-16 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <Sparkles className="w-6 h-6 text-neutral-500" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-600 font-medium mb-3">
          Mood-first search
        </p>
        <h2 className="max-w-lg text-2xl font-serif tracking-tight text-white mb-4">
          Describe a feeling, a drive, a weather pattern, or a moment.
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-neutral-500">
          MoodTune turns your words into a search query, replies with a quick read on
          the feeling, and ranks tracks that match the emotional texture.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {messages.map((message) => (
        <section
          key={message.id}
          className={cn(
            "flex w-full",
            message.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "max-w-[85%] space-y-3",
              message.role === "user" ? "items-end text-right" : "items-start",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-3.5",
                message.role === "user"
                  ? "bg-white text-[#050505]"
                  : "bg-white/[0.03] border border-white/[0.04] text-neutral-200",
              )}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
            {message.role === "assistant" && message.tracks?.length ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {message.query ? (
                    <Badge
                      variant="outline"
                      className="border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-neutral-500"
                    >
                      {message.query}
                    </Badge>
                  ) : null}
                  {message.blendUsed ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-500/70"
                    >
                      Taste blend on
                    </Badge>
                  ) : null}
                </div>
                <TrackGrid tracks={message.tracks} query={message.query} />
              </div>
            ) : null}
          </div>
        </section>
      ))}
      {pending ? (
        <section className="flex justify-start">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-neutral-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Searching your mood...
          </div>
        </section>
      ) : null}
    </div>
  );
}