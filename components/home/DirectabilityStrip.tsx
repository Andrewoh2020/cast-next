'use client';

import { useState, useEffect } from 'react';
import { Talent, thumbUrl } from '@/lib/talent';

const FEATURED_SLUG = 'east-asian-woman-hailey-kim';

export default function DirectabilityStrip() {
  const [character, setCharacter] = useState<Talent | null>(null);

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        const match = data.find(t => t.slug === FEATURED_SLUG) ||
          data.find(t => !t.exclusive && t.referenceSheetUrl && t.img);
        if (match) setCharacter(match);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative py-24 px-6 bg-black overflow-hidden">
      {/* Subtle spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(79, 70, 229, 0.2) 0%, transparent 60%)' }}
      />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Directability</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-4 leading-[1.05]">
            One cast. Eight angles.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Every shot on the storyboard.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Every Cast character ships with a 4K reference sheet — the same actor in every angle you&apos;d need to cut a scene.
            Drop any panel into Kling, Higgsfield, or Artlist and the character stays consistent.
          </p>
        </div>

        {character && character.referenceSheetUrl ? (
          <>
            {/* Character attribution */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/10 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(character.img, 200)}
                  alt={character.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">{character.name}</p>
                <p className="text-gray-400 text-xs">{character.ageRange} · {character.ethnicity || character.race?.[0] || ''}</p>
              </div>
            </div>

            {/* Full reference sheet — single image */}
            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-indigo-900/20 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(character.referenceSheetUrl, 2000)}
                alt={`${character.name} — 8-panel reference sheet`}
                className="w-full h-auto block"
              />
            </div>

            <p className="text-center text-xs text-gray-500 mt-6">
              4K · 8-panel reference sheet · <span className="text-gray-300 font-semibold">{character.name}</span>
            </p>
          </>
        ) : (
          <div className="aspect-[21/9] bg-white/5 rounded-2xl animate-pulse" />
        )}
      </div>
    </section>
  );
}
