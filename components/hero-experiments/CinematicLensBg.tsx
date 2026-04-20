'use client';

import { useEffect, useRef } from 'react';

// Cinematic palette — deep slate, subtle teal, warm tungsten
const PALETTE = [
  { r: 26, g: 35, b: 50 },     // deep slate
  { r: 45, g: 90, b: 94 },     // teal
  { r: 212, g: 146, b: 95 },   // tungsten orange
  { r: 88, g: 101, b: 242 },   // indigo accent
  { r: 30, g: 41, b: 59 },     // slate-800
];

interface Blob {
  x: number;
  y: number;
  r: number;
  color: { r: number; g: number; b: number };
  driftX: number;
  driftY: number;
  phase: number;
  speed: number;
}

export default function CinematicLensBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed blobs — large soft circles that drift slowly
    const blobs: Blob[] = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 280 + Math.random() * 220,
      color: PALETTE[i % PALETTE.length],
      driftX: 60 + Math.random() * 60,
      driftY: 40 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
      speed: 0.00008 + Math.random() * 0.00008,
    }));

    const draw = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Base backdrop — very dark slate
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a0f1a');
      bgGrad.addColorStop(1, '#141a28');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Additive blending so blobs overlap into richer hues
      ctx.globalCompositeOperation = 'lighter';

      for (const b of blobs) {
        const x = b.x + Math.sin(t * b.speed + b.phase) * b.driftX;
        const y = b.y + Math.cos(t * b.speed * 1.3 + b.phase) * b.driftY;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        grad.addColorStop(0, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, 0.55)`);
        grad.addColorStop(0.5, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, 0.18)`);
        grad.addColorStop(1, `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';

      if (!reduceMotion) rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        // CSS blur creates the bokeh softness; blur-3xl in Tailwind is ~64px
        className="block w-full h-full"
        style={{ filter: 'blur(70px) saturate(1.15)' }}
      />
      {/* Subtle film grain + vignette for cinematic feel */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='1'/></svg>\")",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  );
}
