'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { thumbUrl } from '@/lib/talent';

interface ShowcaseEntry {
  characterId: string;
  name: string;
  previewImageUrl: string;
  style: string;
  createdAt: string;
  creatorName?: string;
  creatorImageUrl?: string;
}

// Generate a consistent color from a string
function initialColor(name: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function CommunityShowcase() {
  const [entries, setEntries] = useState<ShowcaseEntry[]>([]);

  useEffect(() => {
    fetch('/api/create/showcase')
      .then((r) => r.json())
      .then((data) => setEntries(data))
      .catch(() => {});
  }, []);

  // Don't render until there are entries to show
  if (entries.length === 0) return null;

  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">Community</p>
            <h2 className="text-2xl font-black tracking-tighter text-black">Recently Created</h2>
          </div>
          <Link
            href="/create"
            className="text-sm font-semibold bg-indigo-500 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-colors"
          >
            Create Yours
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {entries.slice(0, 12).map((entry) => {
            const displayName = entry.creatorName || 'A creator';
            const initial = (entry.creatorName || '?')[0].toUpperCase();

            return (
              <div key={entry.characterId} className="group relative">
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '133%' }}>
                  <Image
                    src={thumbUrl(entry.previewImageUrl, 800)}
                    alt={entry.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-bold truncate mb-1.5">{entry.name}</p>
                    <div className="flex items-center gap-1.5">
                      {entry.creatorImageUrl ? (
                        <img
                          src={entry.creatorImageUrl}
                          alt={displayName}
                          className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-white"
                          style={{ backgroundColor: initialColor(displayName) }}
                        >
                          {initial}
                        </div>
                      )}
                      <span className="text-white/70 text-[10px] font-medium truncate">
                        by {displayName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
