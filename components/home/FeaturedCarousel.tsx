'use client';

import { useState, useEffect, useRef } from 'react';
import { Talent, thumbUrl } from '@/lib/talent';

export default function FeaturedCarousel() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        // Mix of featured and regular, include exclusive with a chip
        const featured = data.filter(t => t.featured);
        const regular = data.filter(t => !t.featured && !t.exclusive).slice(0, 10);
        const exclusive = data.filter(t => t.exclusive).slice(0, 3);
        setTalents([...featured, ...regular, ...exclusive].slice(0, 16));
      })
      .catch(() => {});
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Featured Talent</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-black">
              Hand-picked characters
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
              aria-label="Scroll left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
              aria-label="Scroll right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth px-6 pb-4"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="shrink-0 w-[calc((100vw-80rem)/2)] hidden xl:block" />
        {talents.map((talent) => {
          const img = talent.imgThumbnail || talent.img;
          return (
            <a
              key={talent.id}
              href={`/characters/${talent.slug}`}
              className="relative shrink-0 w-[280px] sm:w-[320px] aspect-[3/4] rounded-3xl overflow-hidden snap-start group bg-gray-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(img, 600)}
                alt={talent.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />

              {/* Price badge — always visible */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-black shadow-lg">
                From $50
              </div>

              {/* Exclusive chip */}
              {talent.exclusive && (
                <div className="absolute top-4 left-4 bg-amber-400/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-[10px] font-black text-black uppercase tracking-wide">
                  Licensed Exclusively
                </div>
              )}

              {/* Bottom gradient + name */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black via-black/60 to-transparent">
                <p className="text-white font-black text-lg tracking-tight mb-0.5">{talent.name}</p>
                <p className="text-white/80 text-xs font-medium">
                  {talent.ageRange} · {talent.ethnicity || (talent.race?.[0]) || ''}
                </p>
              </div>
            </a>
          );
        })}
        <div className="shrink-0 w-6" />
      </div>
    </section>
  );
}
