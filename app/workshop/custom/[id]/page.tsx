import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { readCustomWorkshop } from '@/lib/custom-workshop.server';
import { getCredits } from '@/lib/user-data.server';
import WorkshopClient from '../../[slug]/WorkshopClient';
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

  const workshop = await readCustomWorkshop(userId, id);
  if (!workshop) redirect('/workshop');

  const credits = await getCredits(userId);

  // Adapt the CustomWorkshopData shape to WorkshopClient's expected props
  const initialWorkshop: WorkshopData = {
    characterId: 0,
    outfits: workshop.outfits,
    shots: workshop.shots,
    voice: workshop.voice,
    updatedAt: workshop.updatedAt,
  };

  return (
    <WorkshopClient
      character={{
        id: workshop.id,
        slug: `custom-${workshop.id}`,
        name: workshop.name,
        img: workshop.sourceImageUrl,
        licenseName: 'Your upload',
      }}
      initialWorkshop={initialWorkshop}
      initialCredits={credits}
      apiBase={`/api/workshop/custom/${workshop.id}`}
    />
  );
}
