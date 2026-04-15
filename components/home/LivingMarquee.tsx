'use client';

import { useState, useEffect } from 'react';
import { Talent, thumbUrl } from '@/lib/talent';

interface MarqueeRowProps {
  talents: Talent[];
  duration: number; // seconds for one full loop
  cardHeight: number; // px
}

function MarqueeRow({ talents, duration, cardHeight }: MarqueeRowProps) {
  if (talents.length === 0) return null;
  // Duplicate the array so the scroll loops seamlessly
  const doubled = [...talents, ...talents];
  const cardWidth = Math.round(cardHeight * 0.75); // 3:4 aspect ratio

  return (
    <div className="relative overflow-hidden w-full" style={{ height: cardHeight }}>
      <div
        className="flex gap-3 animate-marquee"
        style={{
          animationDuration: `${duration}s`,
          width: 'max-content',
        }}
      >
        {doubled.map((talent, i) => {
          const img = talent.imgThumbnail || talent.img;
          return (
            <a
              key={`${talent.id}-${i}`}
              href={`/characters/${talent.slug}`}
              className="shrink-0 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-105 hover:z-10 transition-all relative group"
              style={{ width: cardWidth, height: cardHeight }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(img, 800)}
                alt={talent.name}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-bold text-xs truncate">{talent.name}</p>
                <p className="text-white/70 text-[10px] mt-0.5 truncate">{talent.ageRange} · {talent.ethnicity || (talent.race?.[0]) || ''}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function LivingMarquee() {
  const [talents, setTalents] = useState<Talent[]>([]);

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        setTalents(data.filter(t => !t.exclusive && (t.imgThumbnail || t.img)));
      })
      .catch(() => {});
  }, []);

  if (talents.length === 0) {
    return <div className="h-[560px] bg-gray-50" />;
  }

  // Split into 3 groups with some overlap for visual variety
  const third = Math.ceil(talents.length / 3);
  const row1 = talents.slice(0, third);
  const row2 = talents.slice(third, third * 2);
  const row3 = talents.slice(third * 2);

  return (
    <div className="relative w-full">
      <div className="flex flex-col gap-3">
        <MarqueeRow talents={row1} duration={90} cardHeight={220} />
        <MarqueeRow talents={row2} duration={110} cardHeight={220} />
        <MarqueeRow talents={row3} duration={130} cardHeight={220} />
      </div>
    </div>
  );
}
