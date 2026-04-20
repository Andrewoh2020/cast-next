'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';

// Hydration-safe subscription to the reduced-motion media query. Server
// snapshot returns false so SSR matches the initial client render; once
// hydrated the real media query takes over. Avoids the double-render
// setState-in-effect pattern flagged by react-hooks/set-state-in-effect.
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

export interface ReelCharacter {
  name: string;
  img: string;
  /** Path to the per-character video clip (e.g. `/reel-clips/akira-tanaka.mp4`). */
  videoSrc: string;
  /** Whether the video clip should loop (default true). Set false for short
   *  one-shot clips — the reel advances to the next character as soon as the
   *  clip ends, rather than looping awkwardly to fill the 8s window. */
  videoLoop?: boolean;
}

interface Props {
  characters: ReelCharacter[];
  /** ms per cycle — how long before the reel advances to the next character */
  intervalMs?: number;
}

// AI video tools Cast characters get handed off to. Uses the official
// brand marks dropped in `/public/logos/` — square icon at 36×36 plus the
// wordmark text on `lg+` breakpoints. If the brand supplies a newer logo,
// drop-in replace the file at the same path.
interface Tool {
  name: string;
  iconSrc: string;
  /** Render size in px. Kling and Runway icons fill their canvases densely;
   *  Veo's swirl has more padding — scale the dense ones smaller so all three
   *  read as equal visual weight. Applied directly as Image width/height so
   *  the browser layout matches the intended display (no className override
   *  race that caused tool overlap in an earlier version). */
  size: number;
}

const TOOLS: Tool[] = [
  { name: 'Kling',  iconSrc: '/logos/kling.png',    size: 28 },
  { name: 'Runway', iconSrc: '/logos/runway-r.png', size: 28 },
  { name: 'Veo',    iconSrc: '/logos/veo.png',      size: 36 },
];

export default function ExportReel({ characters, intervalMs = 8000 }: Props) {
  const [idx, setIdx] = useState(0);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (reduceMotion || characters.length <= 1) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % characters.length), intervalMs);
    return () => clearTimeout(t);
  }, [idx, reduceMotion, characters.length, intervalMs]);

  if (characters.length === 0) return null;
  const current = characters[idx];

  return (
    <div className="relative w-full max-w-6xl mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-6 py-6">
        {/* ── Stage 1: Character portrait — emotional hook, "an actor you
            could cast." Tall portrait card so the face is the subject and
            visually distinct from the widescreen video output on the right.
            Outer wrapper matches the Stage 3 video wrapper width so the
            middle "Export to" tools land on the true page centerline
            instead of being biased toward the narrower portrait side. */}
        <div key={`p-${idx}`} className="reel-stage reel-stage-portrait shrink-0 md:w-72 flex flex-col items-center">
          <div className="relative w-40 md:w-44 aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-xl shadow-indigo-500/10 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${current.img}${current.img.includes('?') ? '&' : '?'}w=400`}
              alt={current.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 bg-gradient-to-t from-black/75 via-black/25 to-transparent">
              <p className="text-[10px] font-bold text-white truncate">{current.name}</p>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mt-2">
            Cast profile
          </p>
        </div>

        {/* ── Connector (desktop only) ─────────────────────────────────── */}
        <Connector direction="right" />
        <Connector direction="down" />

        {/* ── Stage 2: Tool gates ─────────────────────────────────────── */}
        <div key={`t-${idx}`} className="flex flex-col items-center gap-1 reel-gates">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Export to
          </p>
          <p className="text-[11px] text-gray-500 max-w-[18rem] text-center mb-2 leading-snug">
            Works with Seedance 2.0, Kling 3.0 Pro, and more
          </p>
          <div className="flex items-center gap-4 md:gap-5">
            {TOOLS.map((tool, i) => (
              <div
                key={tool.name}
                className="reel-gate flex items-center gap-1.5 shrink-0"
                style={{ animationDelay: `${0.9 + i * 0.35}s` }}
              >
                <Image
                  src={tool.iconSrc}
                  alt={tool.name}
                  width={tool.size}
                  height={tool.size}
                  className="object-contain shrink-0"
                  priority
                />
                <span className="hidden lg:inline text-sm font-black text-gray-800 tracking-tight">
                  {tool.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Connector direction="right" />
        <Connector direction="down" />

        {/* ── Stage 3: Video output — per-character clip playing in a widescreen
            frame that reads as "cinematic output." ──────────────────────────── */}
        <div key={`v-${idx}`} className="reel-stage reel-stage-video shrink-0 md:w-72 flex flex-col items-center">
          <div className="relative w-64 md:w-72 aspect-video rounded-2xl overflow-hidden ring-1 ring-black/10 shadow-xl shadow-pink-500/10 bg-black">
            <video
              key={current.videoSrc}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop={current.videoLoop !== false}
              playsInline
              preload="auto"
              poster={`${current.img}${current.img.includes('?') ? '&' : '?'}w=1200`}
              aria-label={`${current.name} video preview`}
              onEnded={current.videoLoop === false ? () => setIdx((i) => (i + 1) % characters.length) : undefined}
            >
              <source src={current.videoSrc} type="video/mp4" />
            </video>
            {/* LIVE indicator so the frame reads as "playing" at a glance */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 motion-safe:animate-pulse" aria-hidden="true" />
              <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live</span>
            </div>
            {/* Timeline bar animating along the bottom — playhead visual */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
              <div className="h-full bg-white reel-timeline" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mt-2">
            Your video
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Portrait entry — slides up from below */
        .reel-stage-portrait {
          animation: reel-in 0.85s cubic-bezier(0.22, 1, 0.36, 1);
        }
        /* Video output entry — waits until the gates have pulsed */
        .reel-stage-video {
          animation: reel-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) 2.0s backwards;
        }
        @keyframes reel-in {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* Tool gates — each badge lights up in sequence (Kling → Runway → Veo) */
        .reel-gate {
          opacity: 0.35;
          transform: scale(0.94);
          animation: reel-gate 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes reel-gate {
          0%   { opacity: 0.35; transform: scale(0.94); }
          45%  { opacity: 1;    transform: scale(1.12); }
          100% { opacity: 1;    transform: scale(1);    }
        }

        /* Timeline playhead — sweeps across after the video appears */
        .reel-timeline {
          width: 0%;
          animation: reel-timeline 5.2s linear 2.4s forwards;
        }
        @keyframes reel-timeline {
          from { width: 0%;   }
          to   { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .reel-stage-portrait,
          .reel-stage-video,
          .reel-gate,
          .reel-timeline {
            animation: none !important;
          }
          .reel-gate { opacity: 1; transform: none; }
          .reel-timeline { width: 40%; }
        }
      `}</style>
    </div>
  );
}

function Connector({ direction }: { direction: 'right' | 'down' }) {
  if (direction === 'right') {
    return (
      <div className="hidden md:flex items-center" aria-hidden="true">
        <div className="h-px w-8 lg:w-12 bg-gradient-to-r from-gray-200 to-gray-300" />
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gray-300">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    );
  }
  // 'down' — mobile-only vertical connector between stacked stages
  return (
    <div className="md:hidden flex flex-col items-center" aria-hidden="true">
      <div className="w-px h-4 bg-gradient-to-b from-gray-200 to-gray-300" />
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gray-300">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
