import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { readVisibleCharacters } from '@/lib/characters.server';
import { readWorkshop } from '@/lib/workshop.server';
import { getCredits, getUserData } from '@/lib/user-data.server';
import { listCustomWorkshops } from '@/lib/custom-workshop.server';
import WorkshopClient from './WorkshopClient';
import type { WorkshopSummary } from './WorkshopClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata = {
  title: 'Workshop — Cast',
  robots: { index: false, follow: false },
};

export default async function WorkshopPage({ params }: Props) {
  const { slug } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/workshop/${slug}`);

  const [characters, credits, customs, userData] = await Promise.all([
    readVisibleCharacters(),
    getCredits(userId),
    listCustomWorkshops(userId),
    getUserData(userId),
  ]);

  const character = characters.find((c) => c.slug === slug);
  if (!character) redirect('/');

  const workshop = await readWorkshop(userId, character.id);

  // Determine license status for display (not for gating)
  const purchase = userData.purchases.find((p) => p.characterId === character.id);
  const licenseName = purchase?.licenseName ?? 'No license';

  // Workshop switcher list
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

  return (
    <WorkshopClient
      character={{
        id: character.id,
        slug: character.slug,
        name: character.name,
        ageRange: character.ageRange,
        ethnicity: character.ethnicity,
        img: character.img,
        referenceSheetUrl: character.referenceSheetUrl,
        licenseName,
      }}
      initialWorkshop={workshop}
      initialCredits={credits}
      apiBase={`/api/workshop/${character.id}`}
      workshops={workshopList}
      isRosterCharacter={true}
      hasLicense={!!purchase}
    />
  );
}
