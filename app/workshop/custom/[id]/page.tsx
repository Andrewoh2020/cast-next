import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { readCustomWorkshop, listCustomWorkshops } from '@/lib/custom-workshop.server';
import { getCredits, getUserData } from '@/lib/user-data.server';
import { readVisibleCharacters } from '@/lib/characters.server';
import WorkshopClient from '../../[slug]/WorkshopClient';
import type { WorkshopSummary } from '../../[slug]/WorkshopClient';
import type { WorkshopData } from '@/lib/workshop.server';

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Workshop — Cast',
  robots: { index: false, follow: false },
};

export default async function CustomWorkshopPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/workshop/custom/${id}`);

  const [workshop, customs, userData, credits, characters] = await Promise.all([
    readCustomWorkshop(userId, id),
    listCustomWorkshops(userId),
    getUserData(userId),
    getCredits(userId),
    readVisibleCharacters(),
  ]);

  if (!workshop) redirect('/workshop');

  const initialWorkshop: WorkshopData = {
    characterId: 0,
    outfits: workshop.outfits,
    shots: workshop.shots,
    voice: workshop.voice,
    updatedAt: workshop.updatedAt,
  };

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
        id: workshop.id,
        slug: `custom-${workshop.id}`,
        name: workshop.name,
        img: workshop.sourceImageUrl,
        referenceSheetUrl: workshop.referenceSheetUrl,
        isUploadedImage: true,
        licenseName: 'Your upload',
      }}
      initialWorkshop={initialWorkshop}
      initialCredits={credits}
      apiBase={`/api/workshop/custom/${workshop.id}`}
      workshops={workshopList}
    />
  );
}
