import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ensureDripApplied } from '@/lib/user-data.server';
import { summarize } from '@/lib/entitlements.server';
import { readVisibleCharacters } from '@/lib/characters.server';
import StudioSidebar from './StudioSidebar';
import StudioTabs, { type StudioTab } from './StudioTabs';
import RosterGrid from './RosterGrid';
import MyCharactersTab from './MyCharactersTab';
import HistoryTab from './HistoryTab';
import InlineCreatePrompt from './InlineCreatePrompt';

/**
 * Studio — character hub with an Artlist-inspired shell:
 *  - Left vertical icon rail (Characters mode highlighted; placeholders for
 *    future modes).
 *  - Floating top-center tab pill (Explore / My Characters / History).
 *  - Full-bleed, edge-to-edge tight card grid.
 *  - Bottom-center floating chat that deep-links into /create.
 *
 * Tab state lives in the ?tab= query param so URLs stay shareable. No filter
 * row, no page header — the pill and the floating prompt are the chrome.
 */

export const metadata = {
  title: 'Studio — Cast',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

const VALID_TABS: StudioTab[] = ['explore', 'saved', 'history'];

export default async function StudioPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/studio');

  const params = await searchParams;
  const requested = (params.tab ?? 'explore') as StudioTab;
  const activeTab: StudioTab = VALID_TABS.includes(requested) ? requested : 'explore';

  const userData = await ensureDripApplied(userId);
  const ent = summarize(userData);
  const savedIds = userData.savedRosterCharacterIds ?? [];

  const characters = await readVisibleCharacters();

  return (
    <main className="min-h-screen bg-[#faf7f2] flex">
      <StudioSidebar />
      <div className="flex-1 min-w-0 relative">
        <div className="px-3 sm:px-4 pt-4 pb-32">
          <StudioTabs active={activeTab} />
          <div className="mt-4">
            {activeTab === 'explore' && (
              <RosterGrid
                characters={characters}
                initialSavedIds={savedIds}
                entitlements={ent}
              />
            )}
            {activeTab === 'saved' && (
              <MyCharactersTab
                characters={characters}
                savedIds={savedIds}
                entitlements={ent}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab />
            )}
          </div>
        </div>
        <InlineCreatePrompt />
      </div>
    </main>
  );
}
