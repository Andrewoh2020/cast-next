'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLACEHOLDER_EXAMPLES = [
  '30-year-old Korean man, detective in a rumpled blazer',
  'Elderly Nigerian grandmother from Lagos in a crimson sari',
  '45-year-old American firefighter, man, weathered hands',
  'French woman, 25, violinist in a midnight-blue gown',
  'Retired American male astronaut with silver hair, Mojave',
  'Teenage Japanese boy skateboarder in Tokyo, bleached hair',
  '38-year-old Nigerian male architect, tailored charcoal suit',
];

const ARCHETYPE_CHIPS: { label: string; prompt: string }[] = [
  { label: 'CEO', prompt: 'Japanese-American woman CEO, 42, tailored navy suit, sharp side part' },
  { label: 'Athlete', prompt: 'Kenyan male marathoner, 28, race-day singlet, sweat on his brow' },
  { label: 'Chef', prompt: 'French woman chef, 38, white linen apron dusted with flour' },
  { label: 'Artist', prompt: 'Moroccan woman textile artist, 42, indigo-dyed hands, embroidered smock' },
  { label: 'Musician', prompt: 'Black male jazz pianist, 55, velvet blazer over an open collar, fedora' },
  { label: 'Journalist', prompt: 'Persian woman photojournalist, 29, leather jacket, camera strap' },
];

type Theme = 'light' | 'dark';

interface Props {
  theme?: Theme;
}

export default function HeroForeground({ theme = 'light' }: Props) {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [cursorOn, setCursorOn] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const router = useRouter();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (query) return;
    if (reduceMotion) {
      setTypedPlaceholder(PLACEHOLDER_EXAMPLES[placeholderIdx]);
      return;
    }
    const target = PLACEHOLDER_EXAMPLES[placeholderIdx];
    let i = 0;
    const type = () => {
      if (i <= target.length) {
        setTypedPlaceholder(target.slice(0, i));
        i++;
        typingTimerRef.current = setTimeout(type, 40);
      } else {
        typingTimerRef.current = setTimeout(() => {
          setPlaceholderIdx((p) => (p + 1) % PLACEHOLDER_EXAMPLES.length);
        }, 2500);
      }
    };
    type();
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, [placeholderIdx, query, reduceMotion]);

  useEffect(() => {
    if (query || reduceMotion) { setCursorOn(false); return; }
    const interval = setInterval(() => setCursorOn((c) => !c), 530);
    return () => clearInterval(interval);
  }, [query, reduceMotion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/create?prompt=${encodeURIComponent(q)}`);
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-10 text-center">
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5 ${
        isDark
          ? 'bg-white/10 border border-white/15 text-white/80 backdrop-blur-sm'
          : 'bg-gray-50 border border-gray-100 text-gray-600'
      }`}>
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full motion-safe:animate-pulse" aria-hidden="true" />
        10 free credits with every signup — limited time
      </div>

      <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-5 max-w-3xl mx-auto ${
        isDark ? 'text-white' : 'text-black'
      }`}>
        Cast any character.<br />
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          In 90 seconds.
        </span>
      </h1>

      <p className={`text-base sm:text-lg max-w-xl mx-auto mb-7 leading-relaxed ${
        isDark ? 'text-white/70' : 'text-gray-600'
      }`}>
        Photorealistic actors for films, ads, and stock photography. Made for every AI video tool. No shoot days required.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-4">
        <label htmlFor="hero-exp-prompt" className="sr-only">
          Describe the character to generate
        </label>
        <div className={`flex items-center rounded-2xl pl-5 pr-2 py-2 transition-all ${
          isDark
            ? 'bg-white/10 border border-white/15 backdrop-blur-md shadow-2xl shadow-black/30 focus-within:border-white/30 focus-within:bg-white/15'
            : 'bg-white border border-black/10 shadow-xl shadow-indigo-500/5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:ring-offset-1'
        }`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${isDark ? 'text-white/50' : 'text-gray-400'}`} aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="hero-exp-prompt"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={typedPlaceholder + (!query && cursorOn ? '|' : '')}
            aria-label="Describe the character to generate"
            className={`flex-1 bg-transparent text-base font-medium px-3 py-2 outline-none ${
              isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className={`hidden sm:block font-bold text-sm px-5 py-3 rounded-xl transition-colors disabled:opacity-40 whitespace-nowrap ${
              isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            Generate Character
          </button>
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className={`sm:hidden w-full mt-3 font-bold text-sm px-5 py-3.5 rounded-xl transition-colors disabled:opacity-40 ${
            isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          Generate Character
        </button>
      </form>

      <p className={`text-xs mb-3 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
        Already have a character?{' '}
        <Link href="/workshop" className={`font-semibold underline-offset-2 hover:underline ${
          isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-700'
        }`}>
          Make them AI-video-ready in Workshop — dress, scene, and export →
        </Link>
      </p>

      <div className="flex flex-wrap justify-center gap-2.5 sm:gap-2 max-w-xl mx-auto">
        <span className={`text-xs font-medium self-center mr-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Cast a:</span>
        {ARCHETYPE_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => {
              setQuery(chip.prompt);
              const el = inputRef.current;
              if (el) {
                el.focus();
                requestAnimationFrame(() => {
                  el.setSelectionRange(chip.prompt.length, chip.prompt.length);
                });
              }
            }}
            className={`text-sm sm:text-xs font-semibold rounded-full px-4 py-2 sm:px-3.5 sm:py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              isDark
                ? 'bg-white/10 border border-white/15 text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm focus-visible:ring-white/40'
                : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 focus-visible:ring-indigo-300'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
