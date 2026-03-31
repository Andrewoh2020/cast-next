import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/user-data.server';
import { readVisibleCharacters } from '@/lib/characters.server';
import { getUserDrafts } from '@/lib/custom-characters.server';
import AccountClient from '@/components/AccountClient';

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [user, userData, characters, drafts] = await Promise.all([
    currentUser(),
    getUserData(userId),
    readVisibleCharacters(),
    getUserDrafts(userId),
  ]);

  const favoriteCharacters = characters.filter((c) => userData.favorites.includes(c.id));
  const allDrafts = drafts;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Your Account</p>
          <h1 className="text-4xl font-black tracking-tighter text-black">
            {user?.firstName ? `Hey, ${user.firstName}.` : 'My Account'}
          </h1>
        </div>
        <AccountClient
          initialFavorites={favoriteCharacters}
          initialPurchases={userData.purchases}
          allCharacters={characters}
          customCharacters={allDrafts}
        />
      </div>
    </div>
  );
}
