'use client';

import { useEffect, useState } from 'react';
import { Talent, thumbUrl } from '@/lib/talent';

export default function ExclusiveRoster() {
  const [exclusives, setExclusives] = useState<Talent[]>([]);

  useEffect(() => {
    fetch('/api/characters')
      .then((r) => r.json())
      .then((data: Talent[]) => setExclusives(data.filter((t) => t.exclusive)));
  }, []);

  if (exclusives.length === 0) return null;

  return (
    <section className="py-16 px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Exclusively Claimed</div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-black mb-2">Already spoken for.</h2>
        <p className="text-gray-400 text-sm mb-8">These characters have been exclusively licensed. Their demand speaks for itself.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {exclusives.map((talent) => (
            <div key={talent.id} className="relative rounded-2xl overflow-hidden bg-gray-100" style={{ paddingBottom: '133%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(talent.img, 400)}
                alt={talent.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-sm tracking-tight">{talent.name}</p>
                <span className="text-[10px] font-bold bg-amber-500/80 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Exclusively Licensed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
