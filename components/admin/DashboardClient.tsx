'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Talent, RACE_LABELS, SEX_LABELS, AGE_LABELS, STYLE_LABELS } from '@/lib/talent';
import CharacterTable from './CharacterTable';
import CharacterForm from './CharacterForm';
import SeoConfigurator from './SeoConfigurator';
import { cn } from '@/lib/utils';

interface RosterFilters {
  // Representation
  sex: string[];
  race: string[];
  ageRange: string[];
  style: string[];
  // Performance
  noSales: boolean;
  highViewsNoPurchase: boolean;
  // Status
  exclusivelyLicensed: boolean;
  exclusiveDisabled: boolean;
  missingRefSheet: boolean;
  missingProfileImage: boolean;
}

const EMPTY_FILTERS: RosterFilters = {
  sex: [], race: [], ageRange: [], style: [],
  noSales: false, highViewsNoPurchase: false,
  exclusivelyLicensed: false, exclusiveDisabled: false,
  missingRefSheet: false, missingProfileImage: false,
};

function activeFilterCount(f: RosterFilters) {
  return f.sex.length + f.race.length + f.ageRange.length + f.style.length
    + [f.noSales, f.highViewsNoPurchase, f.exclusivelyLicensed, f.exclusiveDisabled, f.missingRefSheet, f.missingProfileImage].filter(Boolean).length;
}

interface Props {
  initialCharacters: Talent[];
}

type Tab = 'roster' | 'review' | 'hidden' | 'analytics' | 'seo';

interface CharacterStat {
  purchases: number;
  revenue: number;
  byLicense: Record<string, { count: number; revenue: number }>;
  viewsThisWeek: number;
}

interface GenerationHistoryEntry {
  characterName?: string;
  characterSlug?: string;
  type: 'profile' | 'refsheet';
  cost: number;
  generatedAt: string;
  url?: string;
  failed: boolean;
  error?: string;
  provider?: 'kie' | 'fal' | 'google';
}

interface GenerationStats {
  totalCost: number;
  totalImageCost: number;
  totalFalCost: number;
  totalKieCost: number;
  totalClaudeCost: number;
  totalSuccessful: number;
  totalFailed: number;
  avgProfileCost: number;
  avgRefsheetCost: number;
  byCharacter: Record<string, { totalCost: number; count: number; slug?: string }>;
  history: GenerationHistoryEntry[];
}

interface LaunchMetricsBucket {
  paidPurchases: number;
  freeDownloads: number;
  revenue: number;
  uniqueViewers?: number;
  totalViews?: number;
  conversionRate?: number;
}

interface LaunchMetrics {
  today: LaunchMetricsBucket;
  last7d: LaunchMetricsBucket;
  allTime: LaunchMetricsBucket;
}

interface StatsData {
  totalRevenue: number;
  totalPurchases: number;
  byCharacter: Record<number, CharacterStat>;
  launchMetrics?: LaunchMetrics;
  generation: GenerationStats;
}

export default function DashboardClient({ initialCharacters }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('roster');
  const [characters, setCharacters] = useState<Talent[]>(initialCharacters);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Talent | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [filters, setFilters] = useState<RosterFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'auto'>('all');

  const loadStats = async () => {
    setStatsLoading(true);
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setStatsData(data);
    setStatsLoading(false);
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === 'analytics' && !statsData) loadStats();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t: Talent) => { setEditing(t); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const handleSave = async (data: Omit<Talent, 'id'> & { id?: number }, opts?: { autoSave?: boolean }): Promise<Talent> => {
    if (data.id) {
      const res = await fetch(`/api/characters/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (!opts?.autoSave) closeForm();
      return updated;
    } else {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      setCharacters((prev) => [...prev, created]);
      if (!opts?.autoSave) closeForm();
      return created;
    }
  };

  const deleteByIds = async (ids: number[]) => {
    const res = await fetch('/api/characters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      console.error('Delete failed:', await res.text());
      return false;
    }
    setCharacters((prev) => prev.filter((c) => !ids.includes(c.id)));
    return true;
  };

  const handleDelete = async (id: number) => {
    if (await deleteByIds([id])) setDeleteId(null);
  };

  const handleBatchDelete = async (ids: number[]) => {
    await deleteByIds(ids);
  };

  const handleToggleHidden = async (ids: number[], hidden: boolean) => {
    await fetch('/api/characters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, update: { hidden } }),
    });
    setCharacters((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, hidden } : c))
    );
  };

  const handleToggleFeatured = async (ids: number[], featured: boolean) => {
    await fetch('/api/characters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, update: { featured } }),
    });
    setCharacters((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, featured } : c))
    );
  };

  const rosterStats = {
    total: characters.length,
    exclusive: characters.filter((c) => c.exclusive).length,
    available: characters.filter((c) => !c.exclusive && !c.hidden).length,
    hidden: characters.filter((c) => c.hidden).length,
  };

  const toggleArr = (key: 'sex' | 'race' | 'ageRange' | 'style', val: string) =>
    setFilters((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });

  const toggleBool = (key: keyof RosterFilters) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredCharacters = useMemo(() => {
    const f = filters;
    const numActive = activeFilterCount(f);
    let result = characters.filter((c) => !c.hidden);
    if (sourceFilter === 'auto') result = result.filter((c) => c.autoGenerated);
    else if (sourceFilter === 'manual') result = result.filter((c) => !c.autoGenerated);
    if (numActive > 0) result = result.filter((c) => {
      if (f.sex.length && !f.sex.includes(c.sex)) return false;
      if (f.race.length && !f.race.some((r) => (c.race || []).includes(r as never))) return false;
      if (f.ageRange.length && !f.ageRange.includes(c.ageRange)) return false;
      if (f.style.length && !f.style.includes(c.style)) return false;
      if (f.exclusivelyLicensed && !c.exclusive) return false;
      if (f.exclusiveDisabled && !c.exclusiveDisabled) return false;
      if (f.missingRefSheet && c.referenceSheetUrl) return false;
      if (f.missingProfileImage && c.img) return false;
      if (f.noSales && statsData) {
        const s = statsData.byCharacter[c.id];
        if (s?.purchases > 0) return false;
      }
      if (f.highViewsNoPurchase && statsData) {
        const s = statsData.byCharacter[c.id];
        if (!s || s.viewsThisWeek < 3 || s.purchases > 0) return false;
      }
      return true;
    });

    if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id - a.id);
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id - b.id);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [characters, filters, statsData, sortBy, sourceFilter]);

  const hiddenCharacters = useMemo(() =>
    characters
      .filter((c) => c.hidden && !c.autoGenerated)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id - a.id),
    [characters]
  );

  const reviewCharacters = useMemo(() =>
    characters
      .filter((c) => c.autoGenerated && c.hidden)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id - a.id),
    [characters]
  );

  const numFilters = activeFilterCount(filters);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-black">
            Cast<span className="text-indigo-500">.</span>
          </span>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-sm text-gray-500 hover:text-black transition-colors">
            View Site ↗
          </a>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { key: 'roster', label: 'Talent Roster' },
            { key: 'review', label: 'To Review', badge: reviewCharacters.length },
            { key: 'hidden', label: 'Hidden', badge: hiddenCharacters.length },
            { key: 'analytics', label: 'Analytics' },
            { key: 'seo', label: 'SEO' },
          ] as { key: Tab; label: string; badge?: number }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5',
                tab === t.key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="bg-gray-300 text-gray-600 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Talent Roster tab ── */}
        {tab === 'roster' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">Talent Roster</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {numFilters > 0 ? `${filteredCharacters.length} of ${characters.length} characters` : `${characters.length} characters`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as 'all' | 'manual' | 'auto')}
                  className="text-sm font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-2.5 rounded-xl hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <option value="all">All sources</option>
                  <option value="manual">Manual</option>
                  <option value="auto">Auto-generated</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                  className="text-sm font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-2.5 rounded-xl hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name A–Z</option>
                </select>
                <button
                  onClick={() => {
                    setFiltersOpen((v) => !v);
                    if (!filtersOpen && (filters.noSales || filters.highViewsNoPurchase) && !statsData) loadStats();
                  }}
                  className={cn(
                    'flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl border text-sm transition-colors',
                    numFilters > 0
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  Filters{numFilters > 0 && <span className="bg-indigo-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{numFilters}</span>}
                </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-colors text-sm"
              >
                <span className="text-lg leading-none">+</span> Add Character
              </button>
              </div>
            </div>

            {/* ── Filter panel ── */}
            {filtersOpen && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 space-y-5">
                {/* Representation */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Representation</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Sex</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.entries(SEX_LABELS) as [string, string][]).map(([val, label]) => (
                          <button key={val} onClick={() => toggleArr('sex', val)}
                            className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                              filters.sex.includes(val) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                            )}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Race</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.entries(RACE_LABELS) as [string, string][]).map(([val, label]) => (
                          <button key={val} onClick={() => toggleArr('race', val)}
                            className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                              filters.race.includes(val) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                            )}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">Age Range</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.entries(AGE_LABELS) as [string, string][]).map(([val, label]) => (
                            <button key={val} onClick={() => toggleArr('ageRange', val)}
                              className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                                filters.ageRange.includes(val) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                              )}>{label}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">Style</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.entries(STYLE_LABELS) as [string, string][]).map(([val, label]) => (
                            <button key={val} onClick={() => toggleArr('style', val)}
                              className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                                filters.style.includes(val) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                              )}>{label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Performance</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'noSales', label: 'No sales yet' },
                      { key: 'highViewsNoPurchase', label: 'High views, no purchase' },
                    ].map(({ key, label }) => (
                      <button key={key}
                        onClick={() => {
                          toggleBool(key as keyof RosterFilters);
                          if (!statsData) loadStats();
                        }}
                        className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                          filters[key as keyof RosterFilters] ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                        )}>{label}</button>
                    ))}
                    {(filters.noSales || filters.highViewsNoPurchase) && !statsData && (
                      <span className="text-xs text-gray-400 self-center animate-pulse">Loading analytics…</span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'exclusivelyLicensed', label: 'Exclusively Licensed' },
                      { key: 'exclusiveDisabled', label: 'Exclusive Rights Disabled' },
                      { key: 'missingRefSheet', label: 'Missing Ref Sheet' },
                      { key: 'missingProfileImage', label: 'Missing Profile Image' },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => toggleBool(key as keyof RosterFilters)}
                        className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                          filters[key as keyof RosterFilters] ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                        )}>{label}</button>
                    ))}
                  </div>
                </div>

                {numFilters > 0 && (
                  <div className="border-t border-gray-100 pt-3 flex justify-end">
                    <button onClick={() => setFilters(EMPTY_FILTERS)}
                      className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Characters', value: rosterStats.total, color: 'text-indigo-600' },
                { label: 'Available', value: rosterStats.available, color: 'text-emerald-600' },
                { label: 'Exclusively Licensed', value: rosterStats.exclusive, color: 'text-amber-600' },
                { label: 'Hidden', value: rosterStats.hidden, color: 'text-gray-400' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
                  <div className="text-xs font-medium text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            <CharacterTable
              characters={filteredCharacters}
              onEdit={openEdit}
              onDelete={(id) => setDeleteId(id)}
              onBatchDelete={handleBatchDelete}
              onToggleHidden={handleToggleHidden}
              onToggleFeatured={handleToggleFeatured}
            />
          </>
        )}

        {/* ── To Review tab (auto-generated, hidden) ── */}
        {tab === 'review' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">To Review</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {reviewCharacters.length} auto-generated character{reviewCharacters.length !== 1 ? 's' : ''} awaiting review · unhide to publish
                </p>
              </div>
            </div>
            {reviewCharacters.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                <p className="text-gray-400 font-medium">No characters to review</p>
                <p className="text-xs text-gray-300 mt-1">Run the Auto-Cast agent to generate characters</p>
              </div>
            ) : (
              <CharacterTable
                characters={reviewCharacters}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
                onBatchDelete={handleBatchDelete}
                onToggleHidden={handleToggleHidden}
                onToggleFeatured={handleToggleFeatured}
              />
            )}
          </>
        )}

        {/* ── Hidden tab ── */}
        {tab === 'hidden' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">Hidden Characters</h1>
                <p className="text-sm text-gray-500 mt-1">{hiddenCharacters.length} character{hiddenCharacters.length !== 1 ? 's' : ''} hidden from marketplace · sorted by newest</p>
              </div>
            </div>
            {hiddenCharacters.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                <p className="text-gray-400 font-medium">No hidden characters</p>
              </div>
            ) : (
              <CharacterTable
                characters={hiddenCharacters}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
                onBatchDelete={handleBatchDelete}
                onToggleHidden={handleToggleHidden}
                onToggleFeatured={handleToggleFeatured}
              />
            )}
          </>
        )}

        {/* ── Analytics tab ── */}
        {tab === 'analytics' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Revenue, purchases, and character views</p>
              </div>
              <button
                onClick={loadStats}
                className="text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
              >
                Refresh
              </button>
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : statsData ? (
              <>
                {/* Launch Metrics — today and last 7 days */}
                {statsData.launchMetrics && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Launch Metrics</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Today */}
                      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-3">Today</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-2xl font-black text-black">{statsData.launchMetrics.today.uniqueViewers ?? 0}</div>
                            <div className="text-[11px] text-gray-500">Unique visitors</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-black">{statsData.launchMetrics.today.totalViews ?? 0}</div>
                            <div className="text-[11px] text-gray-500">Character views</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-emerald-600">${statsData.launchMetrics.today.revenue.toLocaleString()}</div>
                            <div className="text-[11px] text-gray-500">Revenue</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-indigo-600">{statsData.launchMetrics.today.paidPurchases}</div>
                            <div className="text-[11px] text-gray-500">Paid purchases</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-black">{statsData.launchMetrics.today.freeDownloads}</div>
                            <div className="text-[11px] text-gray-500">Free downloads</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-purple-600">
                              {((statsData.launchMetrics.today.conversionRate ?? 0) * 100).toFixed(1)}%
                            </div>
                            <div className="text-[11px] text-gray-500">Conversion rate</div>
                          </div>
                        </div>
                      </div>

                      {/* Last 7 days */}
                      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Last 7 Days</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-2xl font-black text-black">{statsData.launchMetrics.last7d.uniqueViewers ?? 0}</div>
                            <div className="text-[11px] text-gray-500">Unique visitors</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-emerald-600">${statsData.launchMetrics.last7d.revenue.toLocaleString()}</div>
                            <div className="text-[11px] text-gray-500">Revenue</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-indigo-600">{statsData.launchMetrics.last7d.paidPurchases}</div>
                            <div className="text-[11px] text-gray-500">Paid purchases</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-black">{statsData.launchMetrics.last7d.freeDownloads}</div>
                            <div className="text-[11px] text-gray-500">Free downloads</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="text-3xl font-black text-emerald-600 mb-1">
                      ${statsData.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-gray-500">Total Revenue</div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="text-3xl font-black text-indigo-600 mb-1">
                      {statsData.totalPurchases}
                    </div>
                    <div className="text-xs font-medium text-gray-500">Total Purchases</div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="text-3xl font-black text-violet-600 mb-1">
                      {statsData.totalPurchases > 0
                        ? `$${Math.round(statsData.totalRevenue / statsData.totalPurchases)}`
                        : '—'}
                    </div>
                    <div className="text-xs font-medium text-gray-500">Avg. Order Value</div>
                  </div>
                </div>

                {/* Generation cost summary */}
                {statsData.generation && (
                  <>
                    <div className="flex items-center gap-2 mb-4 mt-8">
                      <p className="text-base font-black tracking-tight text-black">AI Generation Costs</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">kie.ai</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">fal.ai fallback</span>
                    </div>

                    {/* Budget warning */}
                    {statsData.generation.totalCost > 16 && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium">
                        ⚠ You&apos;ve spent ${statsData.generation.totalCost.toFixed(2)} on generation. Consider reviewing usage.
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: 'Total Gen. Cost', value: `$${statsData.generation.totalCost.toFixed(4)}`, color: 'text-rose-600' },
                        { label: 'Kie.ai Cost', value: `$${(statsData.generation.totalKieCost ?? 0).toFixed(2)}`, color: 'text-emerald-600' },
                        { label: 'Fal.ai Cost', value: `$${statsData.generation.totalFalCost.toFixed(2)}`, color: 'text-orange-600' },
                        { label: 'Claude Cost', value: `$${statsData.generation.totalClaudeCost.toFixed(4)}`, color: 'text-purple-600' },
                        { label: 'Successful Runs', value: statsData.generation.totalSuccessful, color: 'text-emerald-600' },
                        { label: 'Avg. Profile Cost', value: statsData.generation.avgProfileCost ? `$${statsData.generation.avgProfileCost.toFixed(2)}` : '—', color: 'text-indigo-600' },
                        { label: 'Avg. Ref Sheet Cost', value: statsData.generation.avgRefsheetCost ? `$${statsData.generation.avgRefsheetCost.toFixed(2)}` : '—', color: 'text-violet-600' },
                        { label: 'Image Cost', value: `$${(statsData.generation.totalImageCost ?? 0).toFixed(2)}`, color: 'text-amber-600' },
                      ].map((s) => (
                        <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
                          <div className={`text-2xl font-black mb-1 ${s.color}`}>{s.value}</div>
                          <div className="text-xs font-medium text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Failed generations */}
                    {statsData.generation.totalFailed > 0 && (
                      <div className="mb-6 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                        <span className="font-bold">{statsData.generation.totalFailed} failed generation{statsData.generation.totalFailed !== 1 ? 's' : ''}</span>
                        {' '}— the provider may still charge for these runs.
                      </div>
                    )}

                    {/* Per-character gen cost */}
                    {Object.keys(statsData.generation.byCharacter).length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
                        <div className="px-5 py-4 border-b border-gray-100">
                          <p className="text-sm font-bold text-black">Cost per Character</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {Object.entries(statsData.generation.byCharacter)
                            .sort((a, b) => b[1].totalCost - a[1].totalCost)
                            .map(([name, data]) => (
                              <div key={name} className="px-5 py-3 flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-sm text-black">{name}</span>
                                  <span className="ml-2 text-xs text-gray-400">{data.count} run{data.count !== 1 ? 's' : ''}</span>
                                  {data.count > 2 && (
                                    <span className="ml-2 text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                                      {data.count - 1} regen{data.count - 1 !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  {data.slug && (
                                    <a href={`/characters/${data.slug}`} target="_blank"
                                      className="text-xs text-indigo-500 hover:underline">View ↗</a>
                                  )}
                                  <span className="font-bold text-rose-600 text-sm">${data.totalCost.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Generation history */}
                    {statsData.generation.history.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-8">
                        <div className="px-5 py-4 border-b border-gray-100">
                          <p className="text-sm font-bold text-black">Generation History</p>
                          <p className="text-xs text-gray-400 mt-0.5">Most recent 50 runs</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Preview</th>
                                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Character</th>
                                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Type</th>
                                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Cost</th>
                                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Provider</th>
                                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {statsData.generation.history.map((entry, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-5 py-3">
                                    {entry.url && !entry.failed ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={entry.url} alt="" className="w-10 h-12 object-cover rounded-lg" />
                                    ) : (
                                      <div className="w-10 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-400 text-xs">✕</div>
                                    )}
                                  </td>
                                  <td className="px-5 py-3">
                                    <div className="font-semibold text-black">{entry.characterName ?? '—'}</div>
                                    {entry.characterSlug && (
                                      <a href={`/characters/${entry.characterSlug}`} target="_blank"
                                        className="text-xs text-indigo-500 hover:underline">View ↗</a>
                                    )}
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                      entry.type === 'profile'
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'bg-violet-50 text-violet-700'
                                    }`}>
                                      {entry.type === 'profile' ? 'Profile' : 'Ref Sheet'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 font-bold text-rose-600">${entry.cost.toFixed(2)}</td>
                                  <td className="px-5 py-3">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                      entry.provider === 'google'
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : entry.provider === 'kie'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-orange-50 text-orange-700'
                                    }`}>
                                      {entry.provider === 'google' ? 'Google' : entry.provider === 'kie' ? 'Kie.ai' : 'Fal.ai'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    {entry.failed ? (
                                      <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full" title={entry.error}>Failed</span>
                                    ) : (
                                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">OK</span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3 text-xs text-gray-400">
                                    {new Date(entry.generatedAt).toLocaleDateString('en-SG', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Per-character breakdown */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-sm font-bold text-black">Per-Character Stats</p>
                    <p className="text-xs text-gray-400 mt-0.5">Views are unique sessions in the last 7 days</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Character</th>
                          <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Views (7d)</th>
                          <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Purchases</th>
                          <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Revenue</th>
                          <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">License Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {characters.map((c) => {
                          const s = statsData.byCharacter[c.id];
                          return (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={c.img} alt={c.name} className="w-9 h-12 rounded-lg object-cover flex-shrink-0" />
                                  <span className="font-semibold text-black">{c.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-bold text-violet-600">{s?.viewsThisWeek ?? 0}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-bold text-indigo-600">{s?.purchases ?? 0}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-bold text-emerald-600">
                                  {s?.revenue ? `$${s.revenue.toLocaleString()}` : '—'}
                                </span>
                              </td>
                              <td className="px-5 py-4 hidden lg:table-cell">
                                {s?.byLicense ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(s.byLicense).map(([name, data]) => (
                                      <span key={name} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {name}: {data.count} (${data.revenue})
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 text-xs">No sales yet</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-24 text-gray-400">
                <p className="font-semibold text-gray-600 mb-1">Failed to load stats</p>
                <button onClick={loadStats} className="text-sm text-indigo-500 hover:underline">Try again</button>
              </div>
            )}
          </>
        )}

        {/* ── SEO tab ── */}
        {tab === 'seo' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-black tracking-tight text-black">SEO Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Manage metadata, Open Graph, and search engine configuration</p>
            </div>
            <SeoConfigurator />
          </>
        )}
      </main>

      <CharacterForm
        open={formOpen}
        character={editing}
        onClose={closeForm}
        onSave={handleSave}
      />

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-black mb-2">Delete character?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-400 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
