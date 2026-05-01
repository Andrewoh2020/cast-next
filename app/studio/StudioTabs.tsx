import Link from 'next/link';

export type StudioTab = 'explore' | 'saved' | 'history';

interface Props {
  active: StudioTab;
  savedCount: number;
  storageLimit: number;
}

const TABS: Array<{ id: StudioTab; label: string }> = [
  { id: 'explore', label: 'Explore' },
  { id: 'saved', label: 'My Characters' },
  { id: 'history', label: 'History' },
];

/**
 * Tab nav for the Studio hub. Tab state is encoded in the ?tab= query param
 * so the URLs are shareable and the back button works as expected.
 */
export default function StudioTabs({ active, savedCount, storageLimit }: Props) {
  return (
    <nav
      aria-label="Studio sections"
      className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto"
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        const href = t.id === 'explore' ? '/studio' : `/studio?tab=${t.id}`;
        return (
          <Link
            key={t.id}
            href={href}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={`relative px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
              isActive ? 'text-black' : 'text-gray-500 hover:text-black'
            }`}
          >
            {t.label}
            {t.id === 'saved' && (
              <span className={`ml-2 inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {savedCount}/{storageLimit}
              </span>
            )}
            {isActive && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-black" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
