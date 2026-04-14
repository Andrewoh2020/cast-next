'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LivingMarquee from './LivingMarquee';

const PLACEHOLDER_EXAMPLES = [
  'a 30-year-old Korean detective in a rumpled blazer',
  'a grandmother from Lagos in a crimson sari',
  'a 45-year-old firefighter with weathered hands',
  'a 25-year-old violinist in a midnight-blue gown',
];

const SUGGESTION_CHIPS = [
  'a 28-year-old biotech founder in Seoul',
  'an Irish deckhand at sunset',
  'a Mumbai journalist in a linen suit',
];

/**
 * Variant B:1 — Centered overlay on top of marquee
 * Most dramatic; text floats cinematically over the character wall
 */
export default function HeroB1() {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const router = useRouter();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query) return;
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
    <section className="relative overflow-hidden bg-white pt-20 pb-6">
      {/* Marquee fills the whole section */}
      <div className="relative">
        <LivingMarquee />

        {/* Darkening overlay behind text */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white/30 pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60%] bg-gradient-to-r from-white/60 via-white/85 to-white/60 pointer-events-none" />

        {/* Centered overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-black/5 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            2 free credits for the first 200 signups
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black leading-[0.95] mb-5 max-w-3xl drop-shadow-sm">
            Cast any character.<br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">In 90 seconds.</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-700 max-w-xl mb-7 leading-relaxed font-medium">
            130+ photorealistic AI actors. Browse the roster or describe your own — ready for Kling, Runway, and Veo.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-4">
            <div className="flex items-center bg-white rounded-2xl border border-black/10 shadow-2xl shadow-indigo-500/10 pl-5 pr-2 py-2 focus-within:border-indigo-300 transition-all">
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

          <div className="flex flex-wrap justify-center gap-2 max-w-xl mb-5">
            <span className="text-xs text-gray-500 font-medium self-center mr-1">Try:</span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setQuery(chip)}
                className="text-xs font-medium text-gray-600 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full px-3 py-1.5 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          <Link href="#roster" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">
            or browse 130+ ready-made characters ↓
          </Link>
        </div>
      </div>
    </section>
  );
}
