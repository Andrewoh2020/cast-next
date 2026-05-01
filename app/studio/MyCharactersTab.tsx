import Link from 'next/link';
import { Talent, thumbUrl } from '@/lib/talent';
import type { EntitlementSummary } from '@/lib/entitlements.server';

interface Props {
  characters: Talent[];
  savedIds: number[];
  entitlements: EntitlementSummary;
}

/**
 * My Characters tab — Week 1 surface only renders saved roster bookmarks.
 * Custom-described characters and uploaded characters merge in here in Week 2.
 */
export default function MyCharactersTab({ characters, savedIds, entitlements }: Props) {
  const saved = characters.filter((c) => savedIds.includes(c.id));

  if (saved.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-black tracking-tight text-black mb-1">No characters saved yet</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
          Browse the roster and tap the + on any character to keep them here.
          {entitlements.tier === 'free' && (
            <> Free accounts can save up to {entitlements.storageLimit}.</>
          )}
        </p>
        <Link
          href="/studio"
          className="inline-block bg-black hover:bg-gray-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
        >
          Browse the roster
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        {saved.length} saved · using {entitlements.savedCount} of {entitlements.storageLimit} slots
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {saved.map((c) => (
          <li key={c.id}>
            <Link
              href={`/studio/character/${c.id}`}
              className="group relative block rounded-2xl bg-white overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imgThumbnail || thumbUrl(c.img, 600)}
                  alt={c.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {!entitlements.subscribed && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-1 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[10px] font-bold tracking-widest text-white/85 uppercase">Cast — preview</p>
                  </div>
                )}
              </div>
              <div className="px-3 py-2.5">
                <p className="text-sm font-bold text-black truncate">{c.name}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {c.ageRange === '60s+' ? '60s & up' : c.ageRange} · {c.ethnicity ?? '—'}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
