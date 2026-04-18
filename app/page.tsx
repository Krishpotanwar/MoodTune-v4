import { ChatPanel } from "@/components/chat/ChatPanel";

const SIGNALS = [
  "Cookie-backed sessions keep taste and chat history attached to one listener.",
  "Gemini extracts a softer emotional query, then pgvector finds the closest mood match.",
  "Thumb feedback is stubbed in the UI now and gets activated in the next phase.",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.11),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.08),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_18%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <section className="grid flex-1 gap-6 lg:grid-cols-[0.95fr_1.35fr]">
          <aside className="flex flex-col justify-between rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
            <div className="space-y-6">
              <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs uppercase tracking-[0.28em] text-neutral-300">
                MoodTune v4
              </div>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-medium tracking-tight text-white sm:text-5xl">
                  Conversational music search built around emotional texture.
                </h1>
                <p className="max-w-xl text-sm leading-7 text-neutral-400 sm:text-base">
                  Describe the weather in your head, the speed of the moment, or the
                  way you want the room to feel. MoodTune turns that into a mood-first
                  query and a ranked set of tracks.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {SIGNALS.map((signal) => (
                <article
                  key={signal}
                  className="rounded-[24px] border border-white/10 bg-black/35 px-4 py-4 text-sm leading-7 text-neutral-300"
                >
                  {signal}
                </article>
              ))}
            </div>
          </aside>

          <ChatPanel />
        </section>
      </div>
    </main>
  );
}
