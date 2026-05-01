import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ensureDripApplied } from '@/lib/user-data.server';
import { summarize } from '@/lib/entitlements.server';
import { readVisibleCharacters } from '@/lib/characters.server';
import StudioTabs, { type StudioTab } from './StudioTabs';
import RosterGrid from './RosterGrid';
import MyCharactersTab from './MyCharactersTab';
import HistoryTab from './HistoryTab';

/**
 * Studio — character hub. One round of polish on character creation,
 * roster, and management before paid-ad validation.
 *
 * Three tabs:
 *  - Explore (roster) — default
 *  - My Characters (saved + custom + uploaded)
 *  - History (recent activity)
 *
 * Tab state is URL-driven via ?tab= so URLs are shareable. Free users see
 * watermarked, lower-resolution previews; subscribers get full-res + audio
 * downloads. Saved-character count is capped per subscription tier.
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

  // Apply daily drip + signup bonus on visit (matches /account, /workshop pattern).
  const userData = await ensureDripApplied(userId);
  const ent = summarize(userData);
  const savedIds = userData.savedRosterCharacterIds ?? [];

  const characters = await readVisibleCharacters();

  return (
    <main className="min-h-screen bg-[#faf7f2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">Studio</h1>
            <p className="text-sm text-gray-500 mt-1">
              Browse characters, save your roster, and direct what comes next.
            </p>
          </div>
          {!ent.subscribed ? (
            <Link
              href="/account?upgrade=1"
              className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-bold bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl transition-colors"
            >
              Upgrade for full-resolution + audio
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <span className="self-start sm:self-auto inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              {ent.tier} subscription
            </span>
          )}
        </header>

        <StudioTabs active={activeTab} savedCount={ent.savedCount} storageLimit={ent.storageLimit} />

        <div className="mt-6">
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
    </main>
  );
}
