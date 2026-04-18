import { Loader2 } from "lucide-react";
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
      <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
          Mood-first search
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Describe a feeling, a drive, a weather pattern, or a moment.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
          MoodTune turns your words into a search query, replies with a quick read on
          the feeling, and ranks tracks that match the emotional texture.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              "max-w-4xl space-y-4",
              message.role === "user" ? "items-end text-right" : "items-start",
            )}
          >
            <div
              className={cn(
                "rounded-[26px] border px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)]",
                message.role === "user"
                  ? "border-white/12 bg-white text-black"
                  : "border-white/10 bg-white/[0.04] text-neutral-100",
              )}
            >
              <p className="text-[15px] leading-7">{message.content}</p>
            </div>
            {message.role === "assistant" && message.tracks?.length ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {message.query ? (
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-300"
                    >
                      Query · {message.query}
                    </Badge>
                  ) : null}
                  {message.blendUsed ? (
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-300"
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
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-neutral-300">
            <Loader2 className="size-4 animate-spin" />
            Searching your mood...
          </div>
        </section>
      ) : null}
    </div>
  );
}
