import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { listCustomWorkshops } from '@/lib/custom-workshop.server';
import { getUserData, getCredits } from '@/lib/user-data.server';
import { readVisibleCharacters } from '@/lib/characters.server';
import WorkshopClient from './[slug]/WorkshopClient';
import type { WorkshopSummary } from './[slug]/WorkshopClient';

export const metadata = {
  title: 'Workshop — Cast',
  description: 'Dress, direct, and export any character for AI video.',
};

export default async function WorkshopPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/workshop');

  const [customs, userData, credits, characters] = await Promise.all([
    listCustomWorkshops(userId),
    getUserData(userId),
    getCredits(userId),
    readVisibleCharacters(),
  ]);

  // Build workshop summary list for the switcher + empty state
  const workshopList: WorkshopSummary[] = [
    ...customs.map((w) => ({
      id: `custom-${w.id}`,
      name: w.name,
      img: w.sourceImageUrl,
      detail: `${w.outfitCount} outfits · ${w.shotCount} shots`,
      href: `/workshop/custom/${w.id}`,
    })),
    ...userData.purchases.map((p) => {
      const c = characters.find((ch) => ch.id === p.characterId);
      return {
        id: `roster-${p.characterId}`,
        name: p.characterName,
        img: c?.img ?? p.characterImg,
        detail: `${p.licenseName} · Licensed`,
        href: `/workshop/${c?.slug ?? p.characterSlug}`,
      };
    }),
  ];

  // Render the workshop shell in empty-state mode (no character loaded).
  // The user uploads or picks from here.
  return (
    <WorkshopClient
      character={null}
      initialCredits={credits}
      workshops={workshopList}
    />
  );
}
