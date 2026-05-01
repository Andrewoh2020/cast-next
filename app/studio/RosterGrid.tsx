'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Talent, thumbUrl, AGE_LABELS } from '@/lib/talent';
// Type-only import — keeps the server module out of the client bundle.
import type { EntitlementSummary } from '@/lib/entitlements.server';
import InlineCreatePrompt from './InlineCreatePrompt';
import UpgradeModal from './UpgradeModal';

interface Props {
  characters: Talent[];
  initialSavedIds: number[];
  entitlements: EntitlementSummary;
}

type SexFilter = 'all' | 'female' | 'male';
type AgeFilter = 'all' | '20s' | '30s' | '40s' | '50s+';

const SEX_PILLS: Array<{ id: SexFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
];

const AGE_PILLS: Array<{ id: AgeFilter; label: string }> = [
  { id: 'all', label: 'Any age' },
  { id: '20s', label: AGE_LABELS['20s'] },
  { id: '30s', label: AGE_LABELS['30s'] },
  { id: '40s', label: AGE_LABELS['40s'] },
  { id: '50s+', label: '50s & up' },
];

export default function RosterGrid({ characters, initialSavedIds, entitlements }: Props) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set(initialSavedIds));
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [sex, setSex] = useState<SexFilter>('all');
  const [age, setAge] = useState<AgeFilter>('all');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return characters.filter((c) => {
      if (sex !== 'all' && c.sex !== sex) return false;
      if (age !== 'all') {
        if (age === '50s+') {
          if (c.ageRange !== '50s' && c.ageRange !== '60s+') return false;
        } else if (c.ageRange !== age) return false;
      }
      if (q) {
        const hay = `${c.name} ${c.ethnicity ?? ''} ${c.vibe ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [characters, search, sex, age]);

  const atLimit = entitlements.savedCount + (savedIds.size - initialSavedIds.length) >= entitlements.storageLimit;

  async function toggleSave(c: Talent) {
    const isSaved = savedIds.has(c.id);
    if (!isSaved && atLimit) {
      setUpgradeOpen(true);
      return;
    }
    if (pending.has(c.id)) return;
    setPending((prev) => new Set(prev).add(c.id));
    // Optimistic toggle
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(c.id); else next.add(c.id);
      return next;
    });
    try {
      const res = await fetch('/api/studio/characters/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ characterId: c.id, action: isSaved ? 'unsave' : 'save' }),
      });
      if (!res.ok) {
        // Revert on failure
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(c.id); else next.delete(c.id);
          return next;
        });
        if (res.status === 402) setUpgradeOpen(true);
      } else {
        // Re-render header chip count via router refresh.
        router.refresh();
      }
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(c.id); else next.delete(c.id);
        return next;
      });
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
    }
  }

  return (
    <div>
      {/* Sticky filter row */}
      <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-[#faf7f2]/95 backdrop-blur-sm border-b border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search characters by name, ethnicity, vibe…"
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-400 outline-none"
            />
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1">
            <PillGroup pills={SEX_PILLS} value={sex} onChange={setSex} />
            <span aria-hidden className="text-gray-300">·</span>
            <PillGroup pills={AGE_PILLS} value={age} onChange={setAge} />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        {filtered.length} {filtered.length === 1 ? 'character' : 'characters'}
        {' · curated by Cast'}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-gray-500">No characters match those filters.</p>
          <button
            onClick={() => { setSearch(''); setSex('all'); setAge('all'); }}
            className="mt-3 text-xs font-bold text-black underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((c) => {
            const isSaved = savedIds.has(c.id);
            const isPending = pending.has(c.id);
            return (
              <li key={c.id}>
                <RosterCard
                  c={c}
                  isSaved={isSaved}
                  isPending={isPending}
                  showWatermark={!entitlements.subscribed}
                  onToggleSave={() => toggleSave(c)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-12">
        <InlineCreatePrompt />
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        savedCount={entitlements.savedCount}
        storageLimit={entitlements.storageLimit}
        tier={entitlements.tier}
      />
    </div>
  );
}

function PillGroup<T extends string>({
  pills, value, onChange,
}: {
  pills: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {pills.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          aria-pressed={p.id === value}
          className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors whitespace-nowrap ${
            p.id === value
              ? 'bg-black text-white'
              : 'bg-white text-gray-600 hover:text-black border border-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function RosterCard({
  c, isSaved, isPending, showWatermark, onToggleSave,
}: {
  c: Talent;
  isSaved: boolean;
  isPending: boolean;
  showWatermark: boolean;
  onToggleSave: () => void;
}) {
  const cardImg = c.imgThumbnail || thumbUrl(c.img, 600);
  return (
    <div className="group relative rounded-2xl bg-white overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all">
      <Link href={`/studio/character/${c.id}`} className="block">
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardImg}
            alt={c.name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {showWatermark && (
            <div className="absolute bottom-0 left-0 right-0 px-3 py-1 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-[10px] font-bold tracking-widest text-white/85 uppercase">Cast — preview</p>
            </div>
          )}
          <span className="absolute top-2.5 left-2.5 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-black bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            By Cast
          </span>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-sm font-bold text-black truncate">{c.name}</p>
          <p className="text-[11px] text-gray-500 truncate">
            {c.ageRange === '60s+' ? '60s & up' : c.ageRange} · {c.ethnicity ?? '—'}
          </p>
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
        disabled={isPending}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${c.name} from My Characters` : `Save ${c.name} to My Characters`}
        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
          isSaved
            ? 'bg-black text-white shadow-sm'
            : 'bg-white/90 text-gray-500 hover:text-black sm:opacity-0 sm:group-hover:opacity-100 shadow-sm'
        } ${isPending ? 'opacity-60 cursor-wait' : ''}`}
      >
        {isSaved ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>
    </div>
  );
}
