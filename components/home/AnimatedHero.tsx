'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Talent } from '@/lib/talent';
import { thumbUrl } from '@/lib/talent';

const PLACEHOLDER_EXAMPLES = [
  'a 30-year-old Korean detective in a rumpled blazer',
  'a grandmother from Lagos in a crimson sari',
  'a 45-year-old firefighter with weathered hands',
  'a 25-year-old violinist in a midnight-blue gown',
  'a 60-year-old silver-haired sommelier in Florence',
];

const SUGGESTION_CHIPS = [
  'a 28-year-old biotech founder in Seoul',
  'an Irish deckhand at sunset',
  'a Mumbai journalist in a linen suit',
  'a retired astronaut in the Mojave',
];

// Grid position for floating portraits — scattered across the viewport
const PORTRAIT_POSITIONS = [
  { top: '8%', left: '5%', size: 90, drift: 'drift-slow', opacity: 0.55 },
  { top: '15%', left: '18%', size: 72, drift: 'drift-medium', opacity: 0.35 },
  { top: '5%', left: '35%', size: 100, drift: 'drift-fast', opacity: 0.5 },
  { top: '22%', left: '52%', size: 82, drift: 'drift-slow', opacity: 0.4 },
  { top: '6%', left: '68%', size: 76, drift: 'drift-medium', opacity: 0.55 },
  { top: '18%', left: '82%', size: 94, drift: 'drift-slow', opacity: 0.45 },
  { top: '42%', left: '2%', size: 100, drift: 'drift-medium', opacity: 0.3 },
  { top: '50%', left: '14%', size: 70, drift: 'drift-fast', opacity: 0.25 },
  { top: '62%', left: '8%', size: 88, drift: 'drift-slow', opacity: 0.5 },
  { top: '55%', left: '78%', size: 82, drift: 'drift-medium', opacity: 0.4 },
  { top: '42%', left: '88%', size: 94, drift: 'drift-slow', opacity: 0.45 },
  { top: '72%', left: '22%', size: 78, drift: 'drift-fast', opacity: 0.35 },
  { top: '80%', left: '5%', size: 72, drift: 'drift-medium', opacity: 0.3 },
  { top: '70%', left: '72%', size: 86, drift: 'drift-slow', opacity: 0.5 },
  { top: '82%', left: '88%', size: 80, drift: 'drift-medium', opacity: 0.4 },
];

export default function AnimatedHero() {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [talents, setTalents] = useState<Talent[]>([]);
  const router = useRouter();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch characters for portrait wall
  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        setTalents(data.filter(t => !t.exclusive && (t.imgThumbnail || t.img)).slice(0, 20));
      })
      .catch(() => {});
  }, []);

  // Typewriter effect for placeholder
  useEffect(() => {
    if (query) return; // Don't animate if user is typing
    const target = PLACEHOLDER_EXAMPLES[placeholderIdx];
    let i = 0;
    const type = () => {
      if (i <= target.length) {
        setTypedPlaceholder(target.slice(0, i));
        i++;
        typingTimerRef.current = setTimeout(type, 40);
      } else {
        typingTimerRef.current = setTimeout(() => {
          setPlaceholderIdx(p => (p + 1) % PLACEHOLDER_EXAMPLES.length);
        }, 2500);
      }
    };
    type();
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, [placeholderIdx, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/create?prompt=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-mesh-gradient">
      {/* Floating portrait wall */}
      <div className="absolute inset-0 pointer-events-none">
        {PORTRAIT_POSITIONS.map((pos, i) => {
          const talent = talents[i % Math.max(talents.length, 1)];
          if (!talent) return null;
          const img = talent.imgThumbnail || talent.img;
          const url = thumbUrl(img, 200);
          return (
            <div
              key={i}
              className={`absolute ${pos.drift}`}
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.size,
                height: pos.size * 1.3,
                opacity: pos.opacity,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded-2xl shadow-lg shadow-black/5"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>

      {/* Soft white overlay so foreground text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/60 to-white/80 pointer-events-none" />

      {/* Foreground content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 sm:pt-40 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-black/5 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          Now in public beta — 2 free credits for the first 200 signups
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black leading-[0.95] mb-6 max-w-3xl">
          Cast any character.<br />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">In 90 seconds.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          The world&apos;s first AI character casting agency. Describe any character and get a photorealistic, commercially-safe AI actor with a 4K reference sheet — ready for Kling, Runway, and Veo.
        </p>

        {/* Search */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-5">
          <div className="flex items-center bg-white rounded-2xl border border-black/10 shadow-xl shadow-indigo-500/5 pl-5 pr-2 py-2 focus-within:border-indigo-300 focus-within:shadow-indigo-500/20 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={typedPlaceholder + (!query ? '|' : '')}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-base font-medium px-3 py-2 outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="bg-black text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Create →
            </button>
          </div>
        </form>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mb-10">
          <span className="text-xs text-gray-500 font-medium self-center mr-1">Try:</span>
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className="text-xs font-medium text-gray-600 bg-white/60 backdrop-blur-sm border border-black/10 rounded-full px-3 py-1.5 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Secondary CTA */}
        <div className="flex items-center gap-4 mb-12">
          <Link
            href="#roster"
            className="text-sm font-semibold text-gray-600 hover:text-black transition-colors"
          >
            or browse 130+ ready-made characters →
          </Link>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
            100% AI-generated
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
            Commercial-safe licensing
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
            4K reference sheets
          </div>
        </div>
      </div>
    </section>
  );
}
