'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LivingMarquee from './LivingMarquee';

const PLACEHOLDER_EXAMPLES = [
  '30-year-old Korean man, detective in a rumpled blazer',
  'Elderly Nigerian grandmother from Lagos in a crimson sari',
  '45-year-old American firefighter, man, weathered hands',
  'French woman, 25, violinist in a midnight-blue gown',
  'Retired American male astronaut with silver hair, Mojave',
  'Teenage Japanese boy skateboarder in Tokyo, bleached hair',
  '38-year-old Nigerian male architect, tailored charcoal suit',
  'Brazilian woman, 26, barista with ink-dark curls and hoop earrings',
  '52-year-old Scottish fisherman, man, weathered face',
  'Vietnamese woman chef in a linen apron, sweat on her brow',
  '29-year-old Persian woman photojournalist, leather jacket',
  'Elderly Polish grandfather in a wool newsboy cap',
  '34-year-old Indian male AI researcher in rimless glasses',
  'French woman pastry chef dusted with flour, smiling, 38',
  '40-year-old Ethiopian male marathoner in race-day kit',
  'Swedish woman, 33, architect in a minimalist cream turtleneck',
];

const SUGGESTION_CHIPS_POOL = [
  'Korean woman biotech founder, 28, Seoul',
  'American man park ranger in Montana, 32',
  'Indian male journalist, 41, linen suit',
  'Retired American male astronaut, Mojave',
  'Kenyan woman pilot, 36, leather flight jacket',
  'Japanese male sake brewer, 55',
  'Colombian woman street-food vendor at dawn, 48',
  'Greek male shipbuilder, 60, calloused hands',
  'Moroccan woman textile artist in an indigo kaftan, 42',
  'German woman DJ from Berlin, 30, platinum hair',
  'Mexican male wedding photographer in Oaxaca, 35',
  'Australian woman surf instructor on Bondi Beach, 29',
];

// Pick 3 random chips per page load for variety
function pickChips(): string[] {
  const shuffled = [...SUGGESTION_CHIPS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

/**
 * Variant B:2 — Text at top, marquee fills below
 * Every character visible and clickable; more utilitarian, marketplace-first
 */
export default function HeroB2() {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [cursorOn, setCursorOn] = useState(true);
  const [suggestionChips] = useState<string[]>(() => pickChips());
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

  // Blink the placeholder cursor every 530ms
  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => setCursorOn(c => !c), 530);
    return () => clearInterval(interval);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/create?prompt=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative bg-white overflow-hidden">
      {/* Top text block */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 mb-5">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          2 free credits for the first 200 signups
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black leading-[0.95] mb-5 max-w-3xl mx-auto">
          Cast any character.<br />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">In 90 seconds.</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-7 leading-relaxed">
          Photorealistic AI actors for commercial video. Browse the roster below or describe your own — ready for Kling, Runway, and Veo.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center bg-white rounded-2xl border border-black/10 shadow-xl shadow-indigo-500/5 pl-5 pr-2 py-2 focus-within:border-indigo-300 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={typedPlaceholder + (!query && cursorOn ? '|' : '')}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-base font-medium px-3 py-2 outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="bg-black text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Generate Character
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
          <span className="text-xs text-gray-500 font-medium self-center mr-1">Try:</span>
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Full marquee below */}
      <div className="pb-6">
        <LivingMarquee />
        <div className="text-center mt-4">
          <Link href="#roster" className="text-xs font-semibold text-gray-500 hover:text-black transition-colors">
            or browse the full roster ↓
          </Link>
        </div>
      </div>
    </section>
  );
}
