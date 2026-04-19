"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

type Point3D = {
  x: number;
  y: number;
  z: number;
  size: number;
  hue: number;
  opacity: number;
  phase: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  scale: number;
  depth: number;
};

const CUBE_VERTICES = [
  { x: -1, y: -1, z: -1 },
  { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
  { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 },
  { x: -1, y: 1, z: 1 },
];

const CUBE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

const HERO_NOTES = [
  "Valence × Energy × Danceability",
  "A rotating mood cube full of track constellations",
  "Scroll to dive through the center like a galaxy",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateMoodPoints(count: number): Point3D[] {
  const random = mulberry32(84_113);
  const clusters = [
    { x: -0.48, y: -0.2, z: -0.3 },
    { x: -0.18, y: 0.34, z: 0.12 },
    { x: 0.24, y: -0.4, z: 0.22 },
    { x: 0.42, y: 0.22, z: -0.18 },
    { x: 0.02, y: 0.02, z: 0.4 },
  ];

  return Array.from({ length: count }, (_, index) => {
    const cluster = clusters[index % clusters.length];
    const spread = 0.16 + random() * 0.22;
    const x = clamp(cluster.x + (random() * 2 - 1) * spread, -0.96, 0.96);
    const y = clamp(cluster.y + (random() * 2 - 1) * spread, -0.96, 0.96);
    const z = clamp(cluster.z + (random() * 2 - 1) * spread, -0.96, 0.96);

    return {
      x,
      y,
      z,
      size: 0.55 + random() * 1.7,
      hue: 205 + random() * 55,
      opacity: 0.35 + random() * 0.55,
      phase: random() * Math.PI * 2,
    };
  });
}

function rotatePoint(point: Point3D, ax: number, ay: number, az: number): Point3D {
  let { x, y, z } = point;

  const cosX = Math.cos(ax);
  const sinX = Math.sin(ax);
  const y1 = y * cosX - z * sinX;
  const z1 = y * sinX + z * cosX;
  y = y1;
  z = z1;

  const cosY = Math.cos(ay);
  const sinY = Math.sin(ay);
  const x2 = x * cosY + z * sinY;
  const z2 = -x * sinY + z * cosY;
  x = x2;
  z = z2;

  const cosZ = Math.cos(az);
  const sinZ = Math.sin(az);
  const x3 = x * cosZ - y * sinZ;
  const y3 = x * sinZ + y * cosZ;

  return { ...point, x: x3, y: y3, z };
}

function projectPoint(
  point: Point3D,
  width: number,
  height: number,
  viewScale: number,
  cameraDistance: number,
): ProjectedPoint | null {
  const depth = cameraDistance - point.z;

  if (depth <= 0.12) {
    return null;
  }

  const scale = viewScale / depth;

  return {
    x: width / 2 + point.x * scale,
    y: height / 2 + point.y * scale,
    scale,
    depth,
  };
}

export function ImmersiveCubeHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const points = useMemo(() => generateMoodPoints(960), []);

  useEffect(() => {
    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const totalScrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const nextProgress = clamp(-rect.top / totalScrollable, 0, 1);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resizeCanvas = () => {
      if (!canvas.parentElement) {
        return;
      }

      const bounds = canvas.parentElement.getBoundingClientRect();
      width = Math.max(1, Math.floor(bounds.width));
      height = Math.max(1, Math.floor(bounds.height));
      devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const draw = (timestamp: number) => {
      const reducedMotion = reduceMotionQuery.matches;
      const scrollProgress = easeOutCubic(progressRef.current);
      const sceneTilt = lerp(0.88, 0.26, scrollProgress);
      const spinY = (reducedMotion ? 0.48 : timestamp * 0.00022) + scrollProgress * 0.42;
      const spinZ = (reducedMotion ? 0.16 : timestamp * 0.00008) + scrollProgress * 0.75;
      const spinX = (reducedMotion ? 0.18 : Math.sin(timestamp * 0.00028) * 0.08) + sceneTilt;
      const cameraDistance = lerp(4.8, 0.95, scrollProgress);
      const sceneShiftZ = lerp(-0.35, 2.45, scrollProgress);
      const viewScale = Math.min(width, height) * lerp(0.22, 0.9, scrollProgress);

      context.clearRect(0, 0, width, height);

      const glow = context.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.min(width, height) * 0.45,
      );
      glow.addColorStop(0, `rgba(255,255,255,${0.08 + scrollProgress * 0.08})`);
      glow.addColorStop(0.4, "rgba(255,255,255,0.035)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const cubePoints = CUBE_VERTICES.map((vertex) =>
        rotatePoint(
          {
            ...vertex,
            size: 1,
            hue: 0,
            opacity: 1,
            phase: 0,
            z: vertex.z + sceneShiftZ,
          },
          spinX,
          spinY,
          spinZ,
        ),
      );

      const projectedCube = cubePoints.map((vertex) =>
        projectPoint(vertex, width, height, viewScale, cameraDistance),
      );

      context.beginPath();
      for (const [fromIndex, toIndex] of CUBE_EDGES) {
        const from = projectedCube[fromIndex];
        const to = projectedCube[toIndex];

        if (!from || !to) {
          continue;
        }

        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
      }
      context.strokeStyle = `rgba(255,255,255,${0.42 - scrollProgress * 0.34})`;
      context.lineWidth = 1.2 + (1 - scrollProgress) * 0.7;
      context.stroke();

      const pointDrawData = points
        .map((point) => {
          const animatedPoint = {
            ...point,
            x: point.x + Math.cos(timestamp * 0.0003 + point.phase) * 0.01,
            y: point.y + Math.sin(timestamp * 0.00035 + point.phase) * 0.01,
            z: point.z + sceneShiftZ,
          };
          const rotated = rotatePoint(animatedPoint, spinX, spinY, spinZ);
          const projected = projectPoint(rotated, width, height, viewScale, cameraDistance);

          if (!projected) {
            return null;
          }

          const previousRotated = rotatePoint(
            { ...animatedPoint, z: animatedPoint.z - (0.24 + scrollProgress * 0.5) },
            spinX,
            spinY,
            spinZ,
          );
          const previousProjection = projectPoint(
            previousRotated,
            width,
            height,
            viewScale,
            cameraDistance,
          );

          return {
            point,
            projected,
            previousProjection,
          };
        })
        .filter(
          (
            item,
          ): item is {
            point: Point3D;
            projected: ProjectedPoint;
            previousProjection: ProjectedPoint | null;
          } => item !== null,
        )
        .sort((a, b) => b.projected.depth - a.projected.depth);

      for (const item of pointDrawData) {
        const { point, projected, previousProjection } = item;
        const radius = clamp(point.size * projected.scale * 0.026, 0.6, 6.4);
        const alpha = clamp(
          point.opacity * (0.16 + scrollProgress * 0.9) * (1.5 - projected.depth / 6),
          0.05,
          0.95,
        );

        if (scrollProgress > 0.18 && previousProjection) {
          context.beginPath();
          context.moveTo(previousProjection.x, previousProjection.y);
          context.lineTo(projected.x, projected.y);
          context.strokeStyle = `hsla(${point.hue}, 90%, 85%, ${alpha * 0.35})`;
          context.lineWidth = Math.max(0.5, radius * 0.7);
          context.stroke();
        }

        const gradient = context.createRadialGradient(
          projected.x,
          projected.y,
          0,
          projected.x,
          projected.y,
          radius * 2.4,
        );
        gradient.addColorStop(0, `hsla(${point.hue}, 100%, 92%, ${alpha})`);
        gradient.addColorStop(0.45, `hsla(${point.hue}, 80%, 76%, ${alpha * 0.45})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(projected.x, projected.y, radius * 2.1, 0, Math.PI * 2);
        context.fill();
      }

      if (scrollProgress > 0.4) {
        context.beginPath();
        context.arc(
          width / 2,
          height / 2,
          lerp(24, 68, scrollProgress),
          0,
          Math.PI * 2,
        );
        context.strokeStyle = `rgba(255,255,255,${0.08 + scrollProgress * 0.12})`;
        context.lineWidth = 1.2;
        context.stroke();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [points]);

  const overlayOpacity = clamp(1 - progress * 1.55, 0.08, 1);
  const overlayTranslate = progress * -54;
  const noteOpacity = clamp(1 - progress * 0.8, 0.2, 1);

  return (
    <section ref={sectionRef} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen px-4 pt-4 sm:px-6 lg:px-8">
        <div className="liquid-card relative mx-auto h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[30px] border border-white/12 bg-[#090909]/90">
          <div className="boot-grid absolute inset-0 opacity-35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,_rgba(255,255,255,0.09),_transparent_28%),radial-gradient(circle_at_80%_22%,_rgba(255,255,255,0.06),_transparent_24%),radial-gradient(circle_at_52%_78%,_rgba(255,255,255,0.03),_transparent_26%)]" />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          <div
            className="relative z-10 flex h-full flex-col justify-between px-6 py-8 sm:px-8 lg:px-12 lg:py-10"
            style={{
              opacity: overlayOpacity,
              transform: `translateY(${overlayTranslate}px)`,
            }}
          >
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.24em] text-neutral-300">
                <span className="h-2 w-2 rounded-full bg-white/70" />
                MoodTune Immersive System
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.18em] text-neutral-400">
                v2 landing rebuilt on v4
              </div>
            </header>

            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <p className="text-xs uppercase tracking-[0.34em] text-neutral-500">
                Mood Navigation Engine
              </p>
              <h1 className="hero-title font-display mt-5 text-6xl leading-none text-white sm:text-7xl lg:text-[6.9rem]">
                Explore The Mood Space
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
                A rotating mood cube, every track suspended like a star in 3D
                emotional space. Scroll forward and the camera dives into the
                center, traveling through the constellation exactly like the old
                v2 landing experience.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#studio"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/18 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-neutral-200"
                >
                  Enter The Studio
                  <ArrowDown className="size-4" />
                </a>
                <Link
                  href="/profile"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.1]"
                >
                  Taste Profile
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>

              <p className="mt-5 text-xs uppercase tracking-[0.24em] text-neutral-500">
                Scroll to zoom into the cube · watch the tracks turn into a galaxy
              </p>
            </div>

            <div
              className="grid gap-3 md:grid-cols-3"
              style={{ opacity: noteOpacity }}
            >
              {HERO_NOTES.map((note) => (
                <div
                  key={note}
                  className="rounded-[22px] border border-white/10 bg-black/35 px-4 py-4 text-sm leading-7 text-neutral-300"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
