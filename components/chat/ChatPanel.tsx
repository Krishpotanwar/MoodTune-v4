"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Loader2, Sparkles } from "lucide-react";
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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Simple UUID v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    <section className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f0f]/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400/60" />
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500 font-medium">
                Music Chat
              </p>
            </div>
            <h2 className="text-xl font-serif tracking-tight text-white">
              Tell me the feeling. I&apos;ll translate it into tracks.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[11px] uppercase tracking-[0.12em] text-neutral-400 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-neutral-300"
                onClick={() => setInput(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <MessageList messages={messages} pending={pending} />
        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/[0.06] bg-[#0a0a0a]/50 px-5 py-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="sr-only" htmlFor="mood-input">
            What&apos;s the mood?
          </label>
          <div className="relative flex-1">
            <textarea
              id="mood-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe your mood..."
              disabled={pending}
              rows={1}
              className="min-h-[60px] w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-white placeholder:text-neutral-600 outline-none transition-all focus:border-white/[0.1] focus:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
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
            className="h-[60px] rounded-xl bg-white px-6 text-xs font-medium uppercase tracking-[0.15em] text-[#050505] hover:bg-neutral-200 disabled:bg-white/10 disabled:text-neutral-600"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Searching
              </>
            ) : (
              <>
                Send
                <ArrowUpRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}