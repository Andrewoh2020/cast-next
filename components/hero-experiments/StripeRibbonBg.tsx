'use client';

import { useEffect, useRef } from 'react';

// Stripe hero reimplementation — a "bird of paradise" fan of ribbons
// emerging from a pinched point near the top-right corner. Each ribbon
// is a long, thin, tapered strip with its own gradient and visible
// silk-grain striations. Control points drift slowly via rAF so the
// bouquet sways without distracting from the foreground text.

interface Ribbon {
  // Normalized fractions of the viewport. Origin is shared; each ribbon
  // fans out toward its own end point.
  endX: number; endY: number;
  // Bezier control points bend the ribbon into a curve instead of a
  // straight line from origin → end.
  cx1: number; cy1: number;
  cx2: number; cy2: number;
  // Ribbon width tapers from the pinch (narrow) to the far end (wide,
  // then feathered to nothing at the tip).
  widthMax: number;
  // 3-stop gradient along the ribbon's length.
  stops: [string, string, string];
  // Independent drift so ribbons don't move in unison.
  phase: number;
  speed: number;
}

// Shared origin — a pinch point just off the top-right corner, so the
// ribbons appear to come from somewhere off-frame (more cinematic than
// starting exactly at the edge).
const ORIGIN = { x: 1.05, y: 0.08 };

const RIBBONS: Ribbon[] = [
  // Theater + camera palette: stage black, graphite, silver screen, with two
  // strips warmed by tungsten stage-light amber so the bouquet feels filmic
  // rather than purely monochrome. Multiply blend on white gives the
  // ribbons their translucent depth.

  // Deepest shadow — stage black curtain
  {
    endX: -0.05, endY: 0.35,
    cx1: 0.55, cy1: 0.05,
    cx2: 0.20, cy2: 0.30,
    widthMax: 0.11,
    stops: ['rgba(20, 20, 22, 0.0)', 'rgba(20, 20, 22, 0.92)', 'rgba(20, 20, 22, 0.0)'],
    phase: 0.0, speed: 0.00035,
  },
  // Charcoal
  {
    endX: 0.02, endY: 0.55,
    cx1: 0.60, cy1: 0.12,
    cx2: 0.25, cy2: 0.45,
    widthMax: 0.14,
    stops: ['rgba(46, 46, 50, 0.0)', 'rgba(46, 46, 50, 0.88)', 'rgba(46, 46, 50, 0.0)'],
    phase: 0.9, speed: 0.00030,
  },
  // Warm tungsten — stage-light glow (sepia cast)
  {
    endX: 0.18, endY: 0.78,
    cx1: 0.70, cy1: 0.22,
    cx2: 0.38, cy2: 0.62,
    widthMax: 0.17,
    stops: ['rgba(90, 72, 52, 0.0)', 'rgba(90, 72, 52, 0.78)', 'rgba(90, 72, 52, 0.0)'],
    phase: 2.1, speed: 0.00040,
  },
  // Graphite — camera body gray
  {
    endX: 0.38, endY: 0.95,
    cx1: 0.78, cy1: 0.30,
    cx2: 0.55, cy2: 0.78,
    widthMax: 0.20,
    stops: ['rgba(64, 64, 68, 0.0)', 'rgba(64, 64, 68, 0.90)', 'rgba(64, 64, 68, 0.0)'],
    phase: 3.3, speed: 0.00028,
  },
  // Silver — bright side of the lens barrel
  {
    endX: 0.60, endY: 1.05,
    cx1: 0.86, cy1: 0.38,
    cx2: 0.72, cy2: 0.88,
    widthMax: 0.22,
    stops: ['rgba(110, 110, 112, 0.0)', 'rgba(110, 110, 112, 0.85)', 'rgba(110, 110, 112, 0.0)'],
    phase: 4.6, speed: 0.00033,
  },
  // Warm cream — tungsten spill catching film stock
  {
    endX: 0.82, endY: 1.08,
    cx1: 0.92, cy1: 0.46,
    cx2: 0.85, cy2: 0.95,
    widthMax: 0.19,
    stops: ['rgba(140, 120, 96, 0.0)', 'rgba(140, 120, 96, 0.72)', 'rgba(140, 120, 96, 0.0)'],
    phase: 5.8, speed: 0.00038,
  },
  // Espresso — trailing deep warm brown
  {
    endX: 1.02, endY: 1.05,
    cx1: 0.98, cy1: 0.52,
    cx2: 1.00, cy2: 0.95,
    widthMax: 0.14,
    stops: ['rgba(38, 28, 22, 0.0)', 'rgba(38, 28, 22, 0.90)', 'rgba(38, 28, 22, 0.0)'],
    phase: 7.0, speed: 0.00042,
  },
];

export default function StripeRibbonBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Sample the centerline + perpendiculars for a ribbon at time t.
    const sample = (r: Ribbon, t: number) => {
      const wob = reduceMotion ? 0 : Math.sin(t * r.speed + r.phase);
      const wob2 = reduceMotion ? 0 : Math.cos(t * r.speed * 1.2 + r.phase);

      // Shared origin (pinch), doesn't wobble much — that's the anchor.
      const x0 = ORIGIN.x * w + wob * w * 0.005;
      const y0 = ORIGIN.y * h + wob2 * h * 0.005;
      // Far end drifts more — creates the natural sway.
      const x1 = (r.endX + wob * 0.03) * w;
      const y1 = (r.endY + wob2 * 0.025) * h;
      // Control points drift most — this is what gives the silk its curl.
      const cx1 = (r.cx1 + wob2 * 0.04) * w;
      const cy1 = (r.cy1 + wob * 0.035) * h;
      const cx2 = (r.cx2 + wob * 0.045) * w;
      const cy2 = (r.cy2 + wob2 * 0.04) * h;

      const STEPS = 72;
      const pts: { x: number; y: number; nx: number; ny: number; u: number }[] = [];
      for (let i = 0; i <= STEPS; i++) {
        const u = i / STEPS;
        const mu = 1 - u;
        const x = mu * mu * mu * x0 + 3 * mu * mu * u * cx1 + 3 * mu * u * u * cx2 + u * u * u * x1;
        const y = mu * mu * mu * y0 + 3 * mu * mu * u * cy1 + 3 * mu * u * u * cy2 + u * u * u * y1;
        const tx = 3 * mu * mu * (cx1 - x0) + 6 * mu * u * (cx2 - cx1) + 3 * u * u * (x1 - cx2);
        const ty = 3 * mu * mu * (cy1 - y0) + 6 * mu * u * (cy2 - cy1) + 3 * u * u * (y1 - cy2);
        const len = Math.hypot(tx, ty) || 1;
        pts.push({ x, y, nx: -ty / len, ny: tx / len, u });
      }
      return { pts, x0, y0, x1, y1 };
    };

    // Ribbon width profile: pinched at origin (tiny), peaks around 65%,
    // feathers to nothing at the far tip. This is what makes it read as
    // a ribbon emerging from a point rather than a uniform band.
    const widthAt = (u: number, maxFrac: number) => {
      // Piecewise — grow from 0.08 to 1.0 over 0..0.65, then fade to 0.0 over 0.65..1.
      const k = u < 0.65
        ? 0.08 + (u / 0.65) * 0.92
        : Math.max(0, 1 - ((u - 0.65) / 0.35));
      return k * maxFrac * Math.min(w, h);
    };

    const drawRibbon = (r: Ribbon, t: number) => {
      const { pts, x0, y0, x1, y1 } = sample(r, t);

      // Main ribbon fill: build the closed path from outer edge + inner edge.
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const { x, y, nx, ny, u } = pts[i];
        const halfW = widthAt(u, r.widthMax) / 2;
        const px = x + nx * halfW;
        const py = y + ny * halfW;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = pts.length - 1; i >= 0; i--) {
        const { x, y, nx, ny, u } = pts[i];
        const halfW = widthAt(u, r.widthMax) / 2;
        const px = x - nx * halfW;
        const py = y - ny * halfW;
        ctx.lineTo(px, py);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, r.stops[0]);
      grad.addColorStop(0.25, r.stops[1]);
      grad.addColorStop(1, r.stops[2]);
      ctx.fillStyle = grad;
      ctx.fill();

      // Silk-grain striations: many thin parallel lines along the flow,
      // each offset perpendicular to the centerline. Strongest near the
      // edges (where silk looks most "grainy" in Stripe's ribbon).
      const STRANDS = 40;
      for (let s = 0; s < STRANDS; s++) {
        const offsetFrac = (s / (STRANDS - 1)) - 0.5; // -0.5 .. +0.5
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const { x, y, nx, ny, u } = pts[i];
          const halfW = widthAt(u, r.widthMax) / 2;
          const off = offsetFrac * halfW * 1.92;
          const px = x + nx * off;
          const py = y + ny * off;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        // Alternate subtle lighten/darken so the stripes read as silk weave.
        const alpha = 0.07 * (1 - Math.pow(Math.abs(offsetFrac) * 2, 2));
        ctx.strokeStyle = s % 2 === 0
          ? `rgba(255, 255, 255, ${alpha * 2.5})`
          : `rgba(0, 0, 0, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const render = (t: number) => {
      // Pure white backdrop — no vignette, no tint. Stripe's is fully white.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Ribbons use screen blending so overlaps brighten (like translucent
      // silk layered over silk) instead of muddying.
      ctx.globalCompositeOperation = 'multiply';
      for (const r of RIBBONS) drawRibbon(r, t);
      ctx.globalCompositeOperation = 'source-over';

      if (!reduceMotion) rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <canvas ref={canvasRef} aria-hidden="true" className="block w-full h-full" />
    </div>
  );
}
