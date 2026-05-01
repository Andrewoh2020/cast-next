'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EntitlementSummary } from '@/lib/entitlements.server';
import UpgradeModal from '../../UpgradeModal';

interface Props {
  characterId: number;
  characterName: string;
  initialSaved: boolean;
  entitlements: EntitlementSummary;
  referenceSheetUrl?: string;
  workshopSlug: string;
}

/**
 * Header action row on the character detail page — Save, Open in Workshop,
 * Download. Save calls /api/studio/characters/save and surfaces the upgrade
 * modal on a 402 (storage limit reached). Download is sub-gated client-side
 * for fast feedback, with the actual asset URL guarded server-side too.
 */
export default function CharacterActions({
  characterId, characterName, initialSaved, entitlements, referenceSheetUrl, workshopSlug,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function toggleSave() {
    if (pending) return;
    if (!saved && !entitlements.canSaveAnother) {
      setUpgradeOpen(true);
      return;
    }
    setPending(true);
    const want = !saved;
    setSaved(want); // optimistic
    try {
      const res = await fetch('/api/studio/characters/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ characterId, action: want ? 'save' : 'unsave' }),
      });
      if (!res.ok) {
        setSaved(!want);
        if (res.status === 402) setUpgradeOpen(true);
      } else {
        router.refresh();
      }
    } catch {
      setSaved(!want);
    } finally {
      setPending(false);
    }
  }

  function downloadSheet() {
    if (!referenceSheetUrl) return;
    if (!entitlements.fullRes) {
      setUpgradeOpen(true);
      return;
    }
    window.open(referenceSheetUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button
          onClick={toggleSave}
          disabled={pending}
          aria-pressed={saved}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors ${
            saved
              ? 'bg-black text-white'
              : 'bg-white border border-gray-200 text-black hover:border-gray-400'
          } ${pending ? 'opacity-60' : ''}`}
        >
          {saved ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          {saved ? 'Saved' : 'Save'}
        </button>

        <Link
          href={`/workshop/${workshopSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-gray-200 text-black hover:border-gray-400 px-3.5 py-2 rounded-xl transition-colors"
        >
          Open in Workshop
        </Link>

        {referenceSheetUrl && (
          <button
            onClick={downloadSheet}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-black hover:bg-gray-800 text-white px-3.5 py-2 rounded-xl transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {entitlements.fullRes ? 'Download sheet' : 'Download (subscribe)'}
          </button>
        )}
      </div>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        savedCount={entitlements.savedCount}
        storageLimit={entitlements.storageLimit}
        tier={entitlements.tier}
      />
      <span className="sr-only" aria-live="polite">
        {saved ? `${characterName} saved to My Characters.` : `${characterName} removed from My Characters.`}
      </span>
    </>
  );
}
