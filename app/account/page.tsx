import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserData, getCredits } from '@/lib/user-data.server';
import { readVisibleCharacters } from '@/lib/characters.server';
import { getUserDrafts } from '@/lib/custom-characters.server';
import { listCustomWorkshops } from '@/lib/custom-workshop.server';
import AccountClient from '@/components/AccountClient';
import BillingSuccessPoller from '@/components/BillingSuccessPoller';
import { Suspense } from 'react';

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [user, userData, characters, drafts, customWorkshops, credits] = await Promise.all([
    currentUser(),
    getUserData(userId),
    readVisibleCharacters(),
    getUserDrafts(userId),
    listCustomWorkshops(userId),
    getCredits(userId),
  ]);

  const favoriteCharacters = characters.filter((c) => userData.favorites.includes(c.id));

  return (
    <div className="min-h-screen bg-[#faf7f2] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Your Account</p>
          <h1 className="text-4xl font-black tracking-tighter text-black">
            {user?.firstName ? `Hey, ${user.firstName}.` : 'My Account'}
          </h1>
        </div>
        <Suspense fallback={null}>
          <BillingSuccessPoller
            initialTier={userData.subscription?.tier ?? 'free'}
            initialCredits={credits}
          />
        </Suspense>
        <AccountClient
          initialFavorites={favoriteCharacters}
          initialPurchases={userData.purchases}
          allCharacters={characters}
          customCharacters={drafts}
          customWorkshops={customWorkshops}
          credits={credits}
        />
      </div>
    </div>
  );
}
