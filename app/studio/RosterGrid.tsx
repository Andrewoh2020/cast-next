'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Talent, thumbUrl } from '@/lib/talent';
import type { EntitlementSummary } from '@/lib/entitlements.server';
import UpgradeModal from './UpgradeModal';

interface Props {
  characters: Talent[];
  initialSavedIds: number[];
  entitlements: EntitlementSummary;
}

/**
 * Edge-to-edge tight roster grid. Mirrors Artlist Studio's framing — full-bleed
 * cards with names overlaid in white, no card frames or paddings. Image quality
 * matches the homepage Recently Created section (`thumbUrl(c.img, 800)`).
 *
 * Filters and search are intentionally absent on this surface — the floating
 * tab pill and the bottom-center create input are the only chrome.
 *
 * Save is enforced server-side by /api/studio/characters/save (returns 402 at
 * the tier cap) — the upgrade modal opens on local pre-check or on a 402.
 */
export default function RosterGrid({ characters, initialSavedIds, entitlements }: Props) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set(initialSavedIds));
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Effective saved count for tier-cap enforcement: server-known count + any
  // optimistic delta from this session.
  const optimisticDelta = savedIds.size - initialSavedIds.length;
  const atLimit = entitlements.savedCount + optimisticDelta >= entitlements.storageLimit;

  async function toggleSave(c: Talent) {
    const isSaved = savedIds.has(c.id);
    if (!isSaved && atLimit) {
      setUpgradeOpen(true);
      return;
    }
    if (pending.has(c.id)) return;
    setPending((prev) => new Set(prev).add(c.id));
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
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(c.id); else next.delete(c.id);
          return next;
        });
        if (res.status === 402) setUpgradeOpen(true);
      } else {
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
    <>
      <ul
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {characters.map((c) => (
          <li key={c.id}>
            <RosterCard
              c={c}
              isSaved={savedIds.has(c.id)}
              isPending={pending.has(c.id)}
              onToggleSave={() => toggleSave(c)}
            />
          </li>
        ))}
      </ul>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        savedCount={entitlements.savedCount}
        storageLimit={entitlements.storageLimit}
        tier={entitlements.tier}
      />
    </>
  );
}

function RosterCard({
  c, isSaved, isPending, onToggleSave,
}: {
  c: Talent;
  isSaved: boolean;
  isPending: boolean;
  onToggleSave: () => void;
}) {
  const ageLabel = c.ageRange === '60s+' ? '60s & up' : c.ageRange;
  const subtitle = c.ethnicity ? `${ageLabel} · ${c.ethnicity}` : ageLabel;
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100">
      <Link href={`/studio/character/${c.id}`} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl(c.img, 800)}
          alt={c.name}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-5 right-14 text-white drop-shadow-sm">
          <p className="font-bold text-base sm:text-lg tracking-tight truncate">{c.name}</p>
          <p className="text-xs sm:text-sm text-white/80 truncate">{subtitle}</p>
        </div>
      </Link>
      <button
        onClick={onToggleSave}
        disabled={isPending}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${c.name} from My Characters` : `Save ${c.name}`}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
          isSaved
            ? 'bg-white text-black shadow-md'
            : 'bg-black/40 text-white hover:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100'
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
