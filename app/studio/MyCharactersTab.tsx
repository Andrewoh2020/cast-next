import Link from 'next/link';
import { Talent, thumbUrl } from '@/lib/talent';
import type { EntitlementSummary } from '@/lib/entitlements.server';

interface Props {
  characters: Talent[];
  savedIds: number[];
  entitlements: EntitlementSummary;
}

/**
 * Edge-to-edge card grid scoped to the user's saved roster. Week 2 will merge
 * AI-described and uploaded custom characters into the same surface.
 */
export default function MyCharactersTab({ characters, savedIds }: Props) {
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
    <ul
      className="grid gap-2 sm:gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
    >
      {saved.map((c) => {
        const ageLabel = c.ageRange === '60s+' ? '60s & up' : c.ageRange;
        const subtitle = c.ethnicity ? `${ageLabel} · ${c.ethnicity}` : ageLabel;
        return (
          <li key={c.id}>
            <Link
              href={`/studio/character/${c.id}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(c.img, 800)}
                alt={c.name}
                loading="lazy"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-5 right-5 text-white drop-shadow-sm">
                <p className="font-bold text-base sm:text-lg tracking-tight truncate">{c.name}</p>
                <p className="text-xs sm:text-sm text-white/80 truncate">{subtitle}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
