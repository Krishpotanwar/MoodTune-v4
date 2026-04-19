"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SpotifyConnect } from "./SpotifyConnect";
import type { SpotifyTrack } from "@/lib/spotify-client";
import { playlistIdToHue } from "@/lib/spotify-client";

// ─── types ────────────────────────────────────────────────────────────────────

type TrackPoint = SpotifyTrack & { recentlyPlayed?: boolean; playlistId?: string };

// ─── helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── cube geometry ────────────────────────────────────────────────────────────

const H = 1.15;
const CUBE_VERTS: THREE.Vector3[] = [
  new THREE.Vector3(-H, -H, -H), new THREE.Vector3( H, -H, -H),
  new THREE.Vector3( H,  H, -H), new THREE.Vector3(-H,  H, -H),
  new THREE.Vector3(-H, -H,  H), new THREE.Vector3( H, -H,  H),
  new THREE.Vector3( H,  H,  H), new THREE.Vector3(-H,  H,  H),
];
const CUBE_EDGES = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
] as const;

const CUBE_GEO = (() => {
  const verts: number[] = [];
  for (const [a, b] of CUBE_EDGES) {
    const va = CUBE_VERTS[a], vb = CUBE_VERTS[b];
    verts.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return g;
})();

// ─── CubeWireframe ────────────────────────────────────────────────────────────

function CubeWireframe({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);

  useFrame(() => {
    if (!matRef.current) return;
    const p = easeInOut(clamp(progressRef.current, 0, 1));
    matRef.current.opacity = clamp(0.65 - p * 0.68, 0.01, 0.65);
  });

  return (
    <lineSegments geometry={CUBE_GEO}>
      <lineBasicMaterial
        ref={matRef}
        color={new THREE.Color(0.8, 0.88, 1.0)}
        transparent
        opacity={0.65}
      />
    </lineSegments>
  );
}

// ─── StarField ────────────────────────────────────────────────────────────────

type TrackData = {
  x: number; y: number; z: number;
  color: THREE.Color;
  baseScale: number;
  recentlyPlayed: boolean;
};

function StarField({ tracks }: { tracks: TrackPoint[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const trackData = useMemo<TrackData[]>(() =>
    tracks.map((t) => {
      const hue = t.playlistId
        ? playlistIdToHue(t.playlistId)
        : lerp(240, 45, t.valence) / 360;
      const sat = 0.75 + t.energy * 0.25;
      const lit = t.recentlyPlayed ? 0.92 : clamp(0.55 + t.energy * 0.35, 0.55, 0.88);
      return {
        x: (t.valence - 0.5) * 2.05,
        y: (t.energy - 0.5) * 2.05,
        z: (t.danceability - 0.5) * 2.05,
        color: new THREE.Color().setHSL(hue, sat, lit),
        baseScale: 0.012 + (t.popularity / 100) * 0.022,
        recentlyPlayed: t.recentlyPlayed ?? false,
      };
    }),
    [tracks],
  );

  // Set initial matrices + colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || trackData.length === 0) return;
    for (let i = 0; i < trackData.length; i++) {
      const td = trackData[i];
      dummy.position.set(td.x, td.y, td.z);
      dummy.scale.setScalar(td.baseScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, td.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [trackData, dummy]);

  // Pulse recently-played stars
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    timeRef.current += delta;
    const t = timeRef.current;
    let changed = false;
    for (let i = 0; i < trackData.length; i++) {
      if (!trackData[i].recentlyPlayed) continue;
      const pulse = 1 + Math.sin(t * 2.4 + i * 0.8) * 0.28;
      dummy.position.set(trackData[i].x, trackData[i].y, trackData[i].z);
      dummy.scale.setScalar(trackData[i].baseScale * pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      changed = true;
    }
    if (changed) mesh.instanceMatrix.needsUpdate = true;
  });

  if (tracks.length === 0) return null;

  return (
    <instancedMesh
      key={tracks.length}
      ref={meshRef}
      args={[undefined, undefined, tracks.length]}
    >
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({
  progressRef,
  tracks,
}: {
  progressRef: React.MutableRefObject<number>;
  tracks: TrackPoint[];
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const raw = clamp(progressRef.current, 0, 1);
    const p = easeInOut(raw);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.z = lerp(5.0, 0.06, p);
    cam.fov = lerp(60, 102, p);
    cam.updateProjectionMatrix();

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * lerp(0.22, 0.04, p);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        lerp(0.22, 0.04, p),
        0.04,
      );
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <CubeWireframe progressRef={progressRef} />
      <StarField tracks={tracks} />
    </group>
  );
}

// ─── GalaxyCubeHero ───────────────────────────────────────────────────────────

export function GalaxyCubeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [tracks, setTracks] = useState<TrackPoint[]>([]);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);

  // Scroll tracking
  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const p = clamp(-rect.top / scrollable, 0, 1);
      progressRef.current = p;
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Load Kaggle-seeded demo tracks
  useEffect(() => {
    fetch("/api/tracks/sample")
      .then((r) => r.json())
      .then((data: TrackPoint[]) => { if (Array.isArray(data)) setTracks(data); })
      .catch(() => {});
  }, []);

  // Load user tracks + playlists after Spotify connect
  const handleSpotifyConnect = useCallback(async (token: string) => {
    setSpotifyToken(token);
    const { fetchTopTracks, fetchRecentlyPlayed, fetchUserPlaylists, fetchPlaylistTracks } =
      await import("@/lib/spotify-client");

    const [top, recent, playlists] = await Promise.all([
      fetchTopTracks(token),
      fetchRecentlyPlayed(token),
      fetchUserPlaylists(token),
    ]);

    const playlistTrackArrays = await Promise.all(
      playlists.slice(0, 5).map((pl) => fetchPlaylistTracks(pl.id, token)),
    );
    const playlistTracks = playlistTrackArrays.flat();

    const seen = new Set<string>();
    const merged: TrackPoint[] = [];
    for (const t of recent) {
      if (!seen.has(t.id)) { seen.add(t.id); merged.push({ ...t, recentlyPlayed: true }); }
    }
    for (const t of playlistTracks) {
      if (!seen.has(t.id)) { seen.add(t.id); merged.push({ ...t, playlistId: t.playlistId }); }
    }
    for (const t of top) {
      if (!seen.has(t.id)) { seen.add(t.id); merged.push(t); }
    }

    setTracks(merged);
    setConnectedCount(merged.length);
  }, []);

  const overlayOpacity = clamp(1 - progress * 2.1, 0, 1);
  const overlayTranslate = progress * -56;
  const notesOpacity = clamp(1 - progress * 1.3, 0, 1);

  return (
    <section ref={sectionRef} className="relative h-[260vh]">
      <div className="sticky top-0 h-screen">
        {/* WebGL Canvas */}
        <Canvas
          className="absolute inset-0 h-full w-full"
          camera={{ position: [0, 0, 5], fov: 60, near: 0.05, far: 50 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#080808" }}
        >
          <Scene progressRef={progressRef} tracks={tracks} />
          <EffectComposer>
            <Bloom
              mipmapBlur
              luminanceThreshold={0.08}
              luminanceSmoothing={0.9}
              intensity={2.2}
              radius={0.88}
            />
            <Vignette offset={0.28} darkness={0.68} />
          </EffectComposer>
        </Canvas>

        {/* HTML overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col justify-between px-6 py-8 sm:px-8 lg:px-12 lg:py-10"
          style={{ opacity: overlayOpacity, transform: `translateY(${overlayTranslate}px)` }}
        >
          {/* Top bar */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.24em] text-neutral-300 backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
              MoodTune · Music Galaxy
            </div>
            <div className="pointer-events-auto">
              <SpotifyConnect
                onConnect={handleSpotifyConnect}
                connected={!!spotifyToken}
                trackCount={connectedCount}
              />
            </div>
          </header>

          {/* Center headline */}
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-neutral-500">
              {spotifyToken
                ? `${connectedCount} tracks from your library`
                : "Valence · Energy · Danceability"}
            </p>
            <h1 className="font-display mt-5 text-6xl leading-[0.94] text-white sm:text-7xl lg:text-[6.9rem]">
              Your Music
              <br />
              <span className="text-neutral-400">Universe</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
              Every track you love, suspended in 3D emotional space. Scroll
              forward and the camera dives into the center — travelling through
              the constellation like a galaxy.
            </p>

            <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/studio"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/18 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-neutral-200"
              >
                Enter The Studio
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/profile"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.1]"
              >
                Taste Profile
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <p className="mt-5 text-xs uppercase tracking-[0.24em] text-neutral-500">
              Scroll to zoom into the cube · watch the tracks become a galaxy
            </p>
          </div>

          {/* Bottom notes */}
          <div
            className="grid gap-3 md:grid-cols-3"
            style={{ opacity: notesOpacity }}
          >
            {[
              "Valence × Energy × Danceability",
              "AI-powered mood navigation",
              "Scroll to enter the galaxy",
            ].map((note) => (
              <div
                key={note}
                className="rounded-[22px] border border-white/10 bg-black/35 px-4 py-4 text-sm leading-7 text-neutral-300 backdrop-blur-sm"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
