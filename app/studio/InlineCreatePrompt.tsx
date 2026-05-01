'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STYLE_CHIPS = [
  { id: 'cinematic', label: 'Cinematic', tail: 'cinematic, dramatic lighting' },
  { id: 'editorial', label: 'Editorial', tail: 'editorial fashion photography' },
  { id: 'anime', label: 'Anime', tail: 'anime style' },
  { id: '3d', label: '3D', tail: '3D rendered, Pixar-quality' },
  { id: 'stylized', label: 'Stylized', tail: 'stylized illustration' },
];

/**
 * Bottom-of-Explore prompt — Artlist-style "Describe a character" input that
 * deep-links into the existing /create flow with the prompt prefilled. Keeps
 * /create as the single source of truth for character generation; this is just
 * a more accessible entry point on the Studio surface.
 */
export default function InlineCreatePrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [styleTail, setStyleTail] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const composed = styleTail ? `${trimmed} — ${styleTail}` : trimmed;
    router.push(`/create?prompt=${encodeURIComponent(composed)}`);
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Describe a character</p>
      <h2 className="text-lg sm:text-xl font-black tracking-tight text-black mb-3">
        Couldn&apos;t find one? Cast it from scratch.
      </h2>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Late-30s Korean American detective, weathered trench coat, rain-soaked alley…"
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:border-indigo-400 outline-none"
          maxLength={400}
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Open in Create
          <span aria-hidden>→</span>
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Style</span>
        {STYLE_CHIPS.map((chip) => {
          const active = styleTail === chip.tail;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStyleTail(active ? null : chip.tail)}
              aria-pressed={active}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${
                active
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-black'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
