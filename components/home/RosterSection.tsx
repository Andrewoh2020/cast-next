'use client';

import { useState, useEffect, useMemo } from 'react';
import { Talent, filterTalent, ActiveFilters, thumbUrl, RACE_LABELS, AGE_LABELS, BUILD_LABELS } from '@/lib/talent';

type QuickFilter = { label: string; key: 'sex' | 'race' | 'ageRange' | 'build'; value: string };

const QUICK_FILTERS: QuickFilter[] = [
  { label: 'Female', key: 'sex', value: 'female' },
  { label: 'Male', key: 'sex', value: 'male' },
  { label: '20s', key: 'ageRange', value: '20s' },
  { label: '30s', key: 'ageRange', value: '30s' },
  { label: '40s+', key: 'ageRange', value: '40s' },
  { label: 'Athletic', key: 'build', value: 'athletic' },
  { label: 'East Asian', key: 'race', value: 'east-asian' },
  { label: 'Black', key: 'race', value: 'black' },
  { label: 'Latino', key: 'race', value: 'latino' },
  { label: 'South Asian', key: 'race', value: 'south-asian' },
  { label: 'White', key: 'race', value: 'white' },
  { label: 'Middle Eastern', key: 'race', value: 'middle-eastern' },
];

const VISIBLE_LIMIT = 20;

export default function RosterSection() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then((data: Talent[]) => {
        setTalents(data.filter(t => !t.exclusive));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let base = filterTalent(talents, filters);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.ethnicity || '').toLowerCase().includes(q) ||
        (t.vibe || '').toLowerCase().includes(q)
      );
    }
    return base;
  }, [talents, filters, search]);

  const toggleQuickFilter = (qf: QuickFilter) => {
    setFilters(prev => {
      const current = prev[qf.key] || [];
      const next = current.includes(qf.value)
        ? current.filter(v => v !== qf.value)
        : [...current, qf.value];
      return { ...prev, [qf.key]: next };
    });
  };

  const isActive = (qf: QuickFilter) => (filters[qf.key] || []).includes(qf.value);

  const visible = showAll ? filtered : filtered.slice(0, VISIBLE_LIMIT);

  return (
    <section id="roster" className="relative py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">The Roster</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4">
            Browse 130+ ready-made characters
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Every character is licensed for commercial use, ready for download, and comes with a 4K reference sheet.
          </p>
        </div>

        {/* Sticky search + pill filters */}
        <div className="sticky top-16 z-30 -mx-6 px-6 py-4 bg-white/90 backdrop-blur-md mb-8 border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl border border-gray-200 pl-4 pr-2 py-1.5 shadow-sm mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ethnicity, or vibe..."
                className="flex-1 bg-transparent text-sm px-3 py-2 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-black px-2">
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_FILTERS.map(qf => (
                <button
                  key={`${qf.key}-${qf.value}`}
                  onClick={() => toggleQuickFilter(qf)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                    isActive(qf)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {qf.label}
                </button>
              ))}
              {Object.keys(filters).length > 0 && (
                <button
                  onClick={() => setFilters({})}
                  className="text-xs font-medium text-indigo-500 hover:text-indigo-600 px-3 py-1.5"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="mb-5 text-center">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `Showing ${Math.min(visible.length, filtered.length)} of ${filtered.length}`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No characters match your filters.</p>
            <button onClick={() => { setFilters({}); setSearch(''); }} className="text-sm font-semibold text-indigo-500 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {visible.map(t => (
                <a
                  key={t.id}
                  href={`/characters/${t.slug}`}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(t.imgThumbnail || t.img, 400)}
                    alt={t.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-black text-black shadow">
                    From $50
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/50 to-transparent">
                    <p className="text-white font-bold text-sm mb-0.5 truncate">{t.name}</p>
                    <p className="text-white/70 text-[11px] truncate">
                      {t.ageRange} · {t.ethnicity || (t.race?.[0]) || ''}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {/* Load all */}
            {!showAll && filtered.length > VISIBLE_LIMIT && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setShowAll(true)}
                  className="bg-black text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Load all {filtered.length} characters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
