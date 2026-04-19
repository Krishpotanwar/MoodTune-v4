import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GalaxyCubeWrapper } from "@/components/landing/GalaxyCubeWrapper";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-[var(--foreground)]">
      {/* Full-viewport 3D galaxy — scroll to zoom into Kaggle track constellation */}
      <GalaxyCubeWrapper />

      {/* CTA card below the galaxy scroll section */}
      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-4 text-center sm:px-6">
        <section className="liquid-card rounded-[24px] px-6 py-8 sm:px-8">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
            Mood Navigation Engine
          </p>
          <h2 className="font-display mt-3 text-5xl leading-none text-white sm:text-6xl">
            MoodTune
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-300">
            Describe your mood. Discover the tracks that match how you feel.
            Powered by pgvector semantic search and AI-blended taste memory.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/studio"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/18 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-neutral-200"
            >
              Open Studio
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/profile"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.1]"
            >
              Taste Profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
