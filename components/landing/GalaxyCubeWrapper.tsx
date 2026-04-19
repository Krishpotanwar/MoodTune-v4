"use client";

import dynamic from "next/dynamic";

const GalaxyCubeHero = dynamic(
  () =>
    import("./GalaxyCubeHero").then((m) => ({ default: m.GalaxyCubeHero })),
  { ssr: false, loading: () => <div className="h-[260vh] bg-[#080808]" /> },
);

export function GalaxyCubeWrapper() {
  return <GalaxyCubeHero />;
}
