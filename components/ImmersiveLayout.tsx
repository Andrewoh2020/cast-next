'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Talent, filterTalent, ActiveFilters, FILTER_GROUPS, FilterKey } from '@/lib/talent';
import TalentCard from './TalentCard';
import TalentModal from './TalentModal';
import SuccessModal from './SuccessModal';
import FilterSidebar from './FilterSidebar';

const VALUE_PROPS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: '100% Copyright-Safe',
    desc: 'Every character is fully AI-generated. No talent releases, no rights issues.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: 'Instant. No Prompting.',
    desc: 'Browse ready-made characters. License in seconds, not hours.',
  },
];

const STEPS = [
  { n: '1', text: 'Browse the roster' },
  { n: '2', text: 'Choose your license' },
  { n: '3', text: 'Download & produce' },
];

export default function ImmersiveLayout() {
  const { user } = useUser();
  const [allTalents, setAllTalents] = useState<Talent[]>([]);
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [purchasedTalent, setPurchasedTalent] = useState<Talent | null>(null);
  const [purchasedPriceIdx, setPurchasedPriceIdx] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetch('/api/characters').then((r) => r.json()).then((data) => setAllTalents(data.filter((t: Talent) => !t.exclusive)));
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/favorites').then((r) => r.json()).then((d) => setFavorites(d.favorites ?? []));
    }
  }, [user]);

  const filtered = useMemo(() => filterTalent(allTalents, filters), [allTalents, filters]);

  const handlePurchase = async (talent: Talent, priceIdx: number) => {
    setSelectedTalent(null);
    if (priceIdx === -1) {
      setPurchasedTalent(talent);
      setPurchasedPriceIdx(0);
      return;
    }
    setPurchasedTalent(talent);
    setPurchasedPriceIdx(priceIdx);
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
      toast('Create a free account to save favorites', {
        description: 'Sign up to keep track of characters you love.',
        action: { label: 'Sign up', onClick: () => { window.location.href = '/sign-up'; } },
      });
      return;
    }
    const wasAlreadyFavorited = favorites.includes(talent.id);
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: talent.id }),
    });
    const data = await res.json();
    setFavorites(data.favorites ?? []);
    if (wasAlreadyFavorited) {
      toast(`Removed ${talent.name} from favorites`);
    } else {
      toast.success(`${talent.name} saved to favorites`, {
        description: 'Find all your saved characters in My Account.',
        action: { label: 'My Account', onClick: () => { window.location.href = '/account'; } },
      });
    }
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
    <>
      {/* ── Mobile header (visible < lg) ─────────────────────── */}
      <div className="lg:hidden pt-16 px-5 pb-4 bg-white border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">AI Character Casting</p>
        <h1 className="text-2xl font-black tracking-tighter text-black leading-tight">
          Cast Flawless<br />AI Actors.
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-3">
          100% copyright-safe. No prompting. Instant download.
        </p>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold bg-gray-100 px-4 py-2 rounded-xl"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters
          {totalActive > 0 && (
            <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalActive}</span>
          )}
        </button>
      </div>

      {/* ── Desktop two-column layout ─────────────────────────── */}
      <div id="roster" className="flex min-h-screen lg:pt-16">

        {/* Left sidebar — sticky */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-100 bg-white px-6 pt-8 pb-6">

          {/* Eyebrow */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-3">
            AI Character Casting
          </p>

          {/* Headline */}
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter text-black leading-[1.05] mb-4">
            Cast Flawless<br />AI Actors.
          </h1>

          {/* Value props */}
          <div className="space-y-3 mb-6">
            {VALUE_PROPS.map((vp) => (
              <div key={vp.label} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {vp.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-black">{vp.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{vp.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* How it works mini-stepper */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">How it works</p>
            <div className="space-y-2.5">
              {STEPS.map((step, i) => (
                <div key={step.n} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {step.n}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{step.text}</p>
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-[1.6rem] mt-5 w-px h-2.5 bg-indigo-200" style={{ position: 'relative', left: '-2.05rem', marginTop: '0.35rem', marginLeft: 'auto', width: '1px', height: '10px', background: '#c7d2fe', flexShrink: 0, display: 'none' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 flex-1">
            <FilterSidebar filters={filters} onChange={setFilters} resultCount={filtered.length} />
          </div>
        </aside>

        {/* Right — scrollable talent grid */}
        <div className="flex-1 bg-gray-50">

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 lg:px-6 pt-4">
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

          {/* Grid */}
          <div className="p-4 lg:p-5">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-4xl mb-3">🎭</div>
                <div className="font-semibold text-gray-600 mb-1">No characters match your filters</div>
                <button onClick={() => setFilters({})} className="text-sm text-indigo-500 hover:underline">Clear all filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {filtered.map((talent, i) => (
                  <div key={talent.id} style={{ animationDelay: `${i * 45}ms` }}>
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

      {/* Mobile filter drawer */}
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
    </>
  );
}
