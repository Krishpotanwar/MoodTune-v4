import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  Compass,
  MessagesSquare,
  Network,
  Route,
  Waypoints,
} from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { GalaxyCubeWrapper } from "@/components/landing/GalaxyCubeWrapper";

const AMBIENT_WORDS = [
  { word: "sargam", top: "8%", left: "9%", delay: "0s", duration: "18s" },
  { word: "rhythm", top: "18%", left: "76%", delay: "2s", duration: "20s" },
  { word: "sur", top: "29%", left: "18%", delay: "1.2s", duration: "17s" },
  { word: "raag", top: "42%", left: "82%", delay: "3s", duration: "19s" },
  { word: "groove", top: "55%", left: "12%", delay: "1.8s", duration: "18s" },
  { word: "dil", top: "68%", left: "74%", delay: "2.2s", duration: "16s" },
  { word: "beat", top: "76%", left: "24%", delay: "0.8s", duration: "19s" },
  { word: "vibe", top: "14%", left: "44%", delay: "3.6s", duration: "21s" },
  { word: "journey", top: "84%", left: "56%", delay: "2.8s", duration: "22s" },
  { word: "tempo", top: "24%", left: "60%", delay: "4.2s", duration: "17s" },
  { word: "mood", top: "62%", left: "38%", delay: "1.1s", duration: "20s" },
  { word: "echo", top: "36%", left: "4%", delay: "2.4s", duration: "18s" },
];

const SIGNALS = [
  {
    icon: Compass,
    title: "Mood Space Studio",
    description:
      "The old app let you pick a start and target feeling. v4 keeps that emotional-navigation idea, but starts with conversation.",
  },
  {
    icon: MessagesSquare,
    title: "Text Mapping First",
    description:
      "Describe a feeling, a drive, or a room. Gemini softens the query and pgvector searches the nearest emotional texture.",
  },
  {
    icon: Route,
    title: "Journey-Ready Core",
    description:
      "The landing page mirrors the Streamlit version now, while the new stack keeps feedback, profiles, and future journey generation in place.",
  },
];

const FLOW_STEPS = [
  {
    label: "Input Layer",
    text:
      "Mood text, profile feedback, and future journey controls all point to the same emotional search surface.",
  },
  {
    label: "Search Engine",
    text:
      "Bundled embeddings shape the request, pgvector matches tracks, and a safe fallback keeps the demo responsive.",
  },
  {
    label: "Taste Memory",
    text:
      "Like and skip actions build a session-tied taste profile so the results start bending toward the listener over time.",
  },
  {
    label: "Journey Mode",
    text:
      "The old MoodTune promise stays intact: discovery should feel like path-planning through emotion, not one static recommendation.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {AMBIENT_WORDS.map((item) => (
          <span
            key={`${item.word}-${item.top}-${item.left}`}
            className="ambient-word"
            style={
              {
                top: item.top,
                left: item.left,
                "--delay": item.delay,
                "--duration": item.duration,
              } as CSSProperties
            }
          >
            {item.word}
          </span>
        ))}
      </div>

      <GalaxyCubeWrapper />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
        <section className="liquid-card mx-auto rounded-[24px] px-6 py-6 text-center sm:px-8">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
            Mood Navigation Engine
          </p>
          <h2 className="font-display mt-3 text-5xl leading-none text-white sm:text-6xl">
            MoodTune
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-neutral-300 sm:text-base">
            The old Streamlit app was about mood-space exploration, guided journeys,
            and a professor-friendly explanation of how the system works. This v4
            homepage now restores that same first impression while keeping the new
            chat, profile, and API architecture underneath.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.18em] text-neutral-300">
              Mood Space
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.18em] text-neutral-300">
              Journey-Ready
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.18em] text-neutral-300">
              Profile Memory
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.18em] text-neutral-300">
              Graphify Audited
            </span>
          </div>
        </section>

        <section
          id="studio"
          className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.18fr] lg:items-start"
        >
          <aside className="space-y-6">
            <section className="liquid-card rounded-[30px] p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                Mood Space Studio
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-white">
                Choose your route through the emotional map.
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                The graph reports for the old Streamlit repo and the new Next repo
                show the same backbone: emotional input, recommendation logic,
                visible explanation, and a guided listening path. This page leans
                back into that story instead of feeling like a generic chat box.
              </p>
            </section>

            <section className="grid gap-3">
              {SIGNALS.map((signal) => {
                const Icon = signal.icon;

                return (
                  <article
                    key={signal.title}
                    className="liquid-card rounded-[24px] px-5 py-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                        <Icon className="size-5 text-neutral-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                          {signal.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-neutral-300">
                          {signal.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="liquid-card rounded-[28px] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <Network className="size-5 text-neutral-100" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                    Graphify Read
                  </p>
                  <h3 className="text-xl font-medium text-white">
                    Old and new systems are mapped already.
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                I used the built `graphify-out` reports from both repos to mirror the
                old MoodTune landing structure instead of guessing from scattered
                files. That keeps the Streamlit identity while staying grounded in the
                real v4 architecture.
              </p>
            </section>
          </aside>

          <div className="lg:sticky lg:top-6">
            <ChatPanel />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <article className="liquid-card rounded-[30px] p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-white">
              Music discovery as path planning through emotional space
            </h2>
            <div className="mt-6 space-y-5">
              {FLOW_STEPS.map((step, index) => (
                <div key={step.label} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                      {step.label}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-neutral-300">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="liquid-card rounded-[30px] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Waypoints className="size-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  System Map
                </p>
                <h2 className="text-2xl font-medium tracking-tight text-white">
                  Same promise, newer engine
                </h2>
              </div>
            </div>

            <pre className="mt-6 overflow-x-auto rounded-[24px] border border-white/10 bg-black/35 px-5 py-5 text-xs leading-7 text-neutral-300">
{`Input Layer
[Mood Text] ────────┐
[Taste Profile] ────┼──► emotional query
[Journey Mode] ─────┘
         │
         ▼
  embeddings + pgvector
         │
         ▼
  ranked tracks + explanation
         │
         ▼
   feedback -> profile memory`}
            </pre>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm leading-7 text-neutral-300">
                The Streamlit version framed MoodTune as a visible emotional map. The
                new landing page now says that upfront again, while the v4 backend
                keeps the stronger foundation: session middleware, search APIs,
                feedback capture, and deployable infrastructure.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-300">
                Legacy UI recovered
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-300">
                New tech preserved
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-300">
                Journey next
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.1]"
              >
                <BrainCircuit className="size-4" />
                Taste Profile
              </Link>
              <a
                href="#studio"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.1]"
              >
                <ArrowUpRight className="size-4" />
                Open Studio
              </a>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
