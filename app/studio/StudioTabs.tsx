import Link from 'next/link';

export type StudioTab = 'explore' | 'saved' | 'history';

interface Props {
  active: StudioTab;
}

const TABS: Array<{ id: StudioTab; label: string }> = [
  { id: 'explore', label: 'Explore' },
  { id: 'saved', label: 'My Characters' },
  { id: 'history', label: 'History' },
];

/**
 * Floating top-center tab pill — Artlist-style. Sits above the canvas with
 * subtle shadow + backdrop blur so the grid feels continuous beneath it.
 */
export default function StudioTabs({ active }: Props) {
  return (
    <nav
      aria-label="Studio sections"
      className="sticky top-4 z-30 mx-auto w-fit"
    >
      <div className="flex items-center gap-0.5 bg-white/85 backdrop-blur-md border border-gray-200 rounded-full shadow-md px-1 py-1">
        {TABS.map((t) => {
          const isActive = t.id === active;
          const href = t.id === 'explore' ? '/studio' : `/studio?tab=${t.id}`;
          return (
            <Link
              key={t.id}
              href={href}
              scroll={false}
              aria-current={isActive ? 'page' : undefined}
              className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
