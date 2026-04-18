"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MessageList } from "@/components/chat/MessageList";
import type { ConversationMessage } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { ChatResponseSchema } from "@/lib/schema";

const SUGGESTIONS = [
  "dark rainy drive",
  "nostalgic warm sunset",
  "high energy euphoric dance",
];

function buildMessageId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function sendMessage(message: string): Promise<void> {
    const trimmed = message.trim();

    if (!trimmed || pending) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: buildMessageId(),
        role: "user",
        content: trimmed,
      },
    ]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });
      const body = await response.json();

      if (!response.ok) {
        if (body?.error === "rate_limited") {
          throw new Error("Too many mood requests right now. Give it a minute.");
        }

        throw new Error("Mood search failed. Try again in a second.");
      }

      const parsed = ChatResponseSchema.parse(body);

      setMessages((current) => [
        ...current,
        {
          id: buildMessageId(),
          role: "assistant",
          content: parsed.reply,
          query: parsed.query,
          tracks: parsed.tracks,
          blendUsed: parsed.blend_used,
        },
      ]);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Mood search failed.";
      toast.error(messageText);
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  return (
    <section className="flex h-[72vh] min-h-[680px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/45 shadow-[0_28px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Chat
            </p>
            <h2 className="text-2xl font-medium tracking-tight text-white">
              Tell me the feeling. I’ll translate it into tracks.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-neutral-300 transition hover:bg-white/[0.08]"
                onClick={() => setInput(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <MessageList messages={messages} pending={pending} />
        <div ref={endRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 bg-black/70 px-4 py-4 sm:px-6"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="sr-only" htmlFor="mood-input">
            What&apos;s the mood?
          </label>
          <div className="relative flex-1">
            <textarea
              id="mood-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="What&apos;s the mood?"
              disabled={pending}
              rows={1}
              className="min-h-[68px] w-full resize-none rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5 text-base leading-7 text-white outline-none transition placeholder:text-neutral-500 focus:border-white/20 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={pending || !input.trim()}
            className="h-[68px] rounded-[24px] bg-white px-6 text-sm uppercase tracking-[0.2em] text-black hover:bg-neutral-200 disabled:bg-white/10 disabled:text-neutral-500"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                Send
                <ArrowUpRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
