'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Talent, filterTalent, ActiveFilters, FILTER_GROUPS, FilterKey } from '@/lib/talent';
import TalentCard from './TalentCard';
import TalentModal from './TalentModal';
import SuccessModal from './SuccessModal';
import FilterSidebar from './FilterSidebar';

export default function TalentRoster() {
  const { user } = useUser();
  const [allTalents, setAllTalents] = useState<Talent[]>([]);
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [purchasedTalent, setPurchasedTalent] = useState<Talent | null>(null);
  const [purchasedPriceIdx, setPurchasedPriceIdx] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetch('/api/characters').then((r) => r.json()).then(setAllTalents);
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/favorites').then((r) => r.json()).then((d) => setFavorites(d.favorites ?? []));
    }
  }, [user]);

  const filtered = useMemo(() => filterTalent(allTalents, filters), [allTalents, filters]);

  const handlePurchase = async (talent: Talent, priceIdx: number) => {
    setSelectedTalent(null);
    setPurchasedTalent(talent);
    setPurchasedPriceIdx(priceIdx);
    // Record purchase if signed in
    if (user) {
      await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: talent.id,
          characterName: talent.name,
          characterSlug: talent.slug,
          characterImg: talent.img,
          licenseName: talent.prices[priceIdx].name,
          licensePrice: talent.prices[priceIdx].price,
          purchasedAt: new Date().toISOString(),
          referenceSheetUrl: talent.referenceSheetUrl ?? null,
        }),
      });
    }
  };

  const handleToggleFavorite = async (talent: Talent) => {
    if (!user) {
      window.location.href = '/sign-in';
      return;
    }
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: talent.id }),
    });
    const data = await res.json();
    setFavorites(data.favorites ?? []);
  };

  const totalActive = Object.values(filters).reduce((acc, v) => acc + (v?.length ?? 0), 0);

  const activeChips = FILTER_GROUPS.flatMap((group) =>
    (filters[group.key] ?? []).map((val) => ({
      key: group.key as FilterKey,
      value: val,
      label: group.options.find((o) => o.value === val)?.label ?? val,
      groupLabel: group.label,
    }))
  );

  const removeChip = (key: FilterKey, value: string) => {
    const next = (filters[key] ?? []).filter((v) => v !== value);
    setFilters({ ...filters, [key]: next.length > 0 ? next : undefined });
  };

  return (
    <section id="roster" className="py-24 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">The Talent</div>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-3">Meet the cast.</h2>
        <p className="text-gray-500 mb-8 text-base">Every character is unique, fully AI-generated, and ready for your production.</p>

        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 mb-6 text-sm font-semibold bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:border-indigo-300 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters
          {totalActive > 0 && (
            <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalActive}</span>
          )}
        </button>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                onClick={() => removeChip(chip.key, chip.value)}
                className="flex items-center gap-1.5 text-xs font-medium bg-indigo-500 text-white px-3 py-1.5 rounded-full hover:bg-indigo-600 transition-colors"
              >
                <span className="opacity-70">{chip.groupLabel}:</span> {chip.label}
                <span className="ml-0.5 opacity-70">×</span>
              </button>
            ))}
            <button
              onClick={() => setFilters({})}
              className="text-xs font-medium text-gray-500 hover:text-black px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8 items-start">
          <div className="hidden lg:block sticky top-24">
            <FilterSidebar filters={filters} onChange={setFilters} resultCount={filtered.length} />
          </div>

          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-4xl mb-3">🎭</div>
                <div className="font-semibold text-gray-600 mb-1">No characters match your filters</div>
                <button onClick={() => setFilters({})} className="text-sm text-indigo-500 hover:underline">Clear all filters</button>
              </div>
            ) : (
              <div className="columns-2 sm:columns-2 md:columns-3 xl:columns-4 gap-3">
                {filtered.map((talent, i) => (
                  <div key={talent.id} className="break-inside-avoid mb-3" style={{ animationDelay: `${i * 45}ms` }}>
                    <TalentCard
                      talent={talent}
                      onClick={setSelectedTalent}
                      index={i}
                      isFavorited={favorites.includes(talent.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-50 rounded-t-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-base font-bold text-black">Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">×</button>
            </div>
            <FilterSidebar filters={filters} onChange={setFilters} resultCount={filtered.length} />
            <button onClick={() => setMobileFiltersOpen(false)} className="mt-5 w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl">
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}

      <TalentModal talent={selectedTalent} onClose={() => setSelectedTalent(null)} onPurchase={handlePurchase} />
      <SuccessModal talent={purchasedTalent} priceIdx={purchasedPriceIdx} onClose={() => setPurchasedTalent(null)} />
    </section>
  );
}
