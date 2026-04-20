'use client';

import { useEffect, useMemo, useState } from 'react';

interface CharacterLike {
  id: number | string;
  referenceSheetUrl?: string;
  img?: string;
}

// Heavily blurred scrolling columns of character reference sheets — the sharp
// details bleed into a shifting mosaic of skin tones, wardrobe, and lighting.
export default function BlurredCascadeBg() {
  const [refSheets, setRefSheets] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/characters')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = (Array.isArray(data) ? data : data?.characters) as CharacterLike[] | undefined;
        const sheets = list
          ?.map((c) => c.referenceSheetUrl || c.img)
          .filter((u): u is string => !!u) ?? [];
        setRefSheets(sheets);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Split into 4 staggered columns, each column infinitely scrolls at slightly
  // different speeds so no visible seams form.
  const columns = useMemo(() => {
    if (refSheets.length === 0) return [] as string[][];
    const cols: string[][] = [[], [], [], []];
    refSheets.forEach((u, i) => cols[i % 4].push(u));
    // Duplicate each column so the CSS loop can translate -50% seamlessly
    return cols.map((c) => [...c, ...c]);
  }, [refSheets]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0f1a]">
      {/* The cascading columns. Heavy CSS blur + scale pushes them into pure color. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 gap-4 p-4"
        style={{ filter: 'blur(80px) saturate(1.2)', transform: 'scale(1.1)' }}
      >
        {columns.map((imgs, ci) => (
          <div
            key={ci}
            className="relative overflow-hidden"
            style={{
              animation: `cascade-scroll ${90 + ci * 12}s linear infinite`,
              animationDirection: ci % 2 === 0 ? 'normal' : 'reverse',
            }}
          >
            {imgs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${ci}-${i}`}
                src={`${src}${src.includes('?') ? '&' : '?'}w=600`}
                alt=""
                loading="lazy"
                className="w-full aspect-[3/4] object-cover mb-4 rounded-xl"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Dark gradient overlay so the foreground text stays readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(10,15,26,0.55) 0%, rgba(10,15,26,0.75) 60%, rgba(10,15,26,0.88) 100%)',
        }}
      />

      <style jsx>{`
        @keyframes cascade-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="cascade-scroll"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
