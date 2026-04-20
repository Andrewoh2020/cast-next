'use client';

import { useEffect, useRef, useState } from 'react';

// Looping reel video behind a frosted glass overlay. A soft radial mask
// follows the cursor, punching a clear "spotlight" hole through the blur so
// the underlying video reveals sharp detail only where the user is looking.
export default function FrostedVideoBg() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || reduceMotion) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pendingPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingPosRef.current) setPos(pendingPosRef.current);
          rafRef.current = null;
        });
      }
    };

    const onLeave = () => setPos(null);

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion]);

  // The mask uses CSS radial-gradient with a transparent center so the blur
  // layer becomes a hole where the cursor is. Positioned at cursor, or far
  // off-screen when cursor isn't over the hero.
  const maskPos = pos ?? { x: -9999, y: -9999 };
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `radial-gradient(circle 180px at ${maskPos.x}px ${maskPos.y}px, transparent 0%, transparent 40%, black 85%)`,
    maskImage: `radial-gradient(circle 180px at ${maskPos.x}px ${maskPos.y}px, transparent 0%, transparent 40%, black 85%)`,
  };

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
      {/* Base video layer — always playing, always sharp */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/hero-videos/reel.mp4" type="video/mp4" />
      </video>

      {/* Frosted overlay — masked out around the cursor so the video peeks through */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(40px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.1)',
          backgroundColor: 'rgba(10, 15, 26, 0.55)',
          ...maskStyle,
        }}
      />

      {/* Darker vignette on top for foreground text contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}
