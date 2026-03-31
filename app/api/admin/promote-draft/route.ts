import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraft } from '@/lib/custom-characters.server';
import { readCharacters, writeCharacters, nextId } from '@/lib/characters.server';
import { Talent, TalentRace } from '@/lib/talent';

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { draftId, draftUserId } = await req.json();
  if (!draftId) return NextResponse.json({ error: 'draftId is required' }, { status: 400 });

  // Use draftUserId if provided (admin promoting another user's draft), otherwise own drafts
  const ownerUserId = draftUserId || userId;
  const draft = await getDraft(ownerUserId, draftId);
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

  if (!draft.profileImageUrl && !draft.previewImageUrl) {
    return NextResponse.json({ error: 'Draft has no images' }, { status: 400 });
  }

  const characters = await readCharacters();

  const newCharacter: Talent = {
    id: nextId(characters),
    name: draft.name,
    slug: draft.slug,
    vibe: draft.description,
    img: draft.profileImageUrl || draft.previewImageUrl!,
    imgThumbnail: draft.profileThumbnailUrl,
    referenceSheetUrl: draft.referenceSheetUrl,
    refSheetThumbnail: draft.referenceSheetThumbnailUrl,
    sex: draft.attributes.sex,
    race: draft.attributes.race as TalentRace[],
    ageRange: draft.attributes.ageRange,
    build: draft.attributes.build,
    height: draft.attributes.height,
    style: draft.attributes.style,
    prices: [
      { name: 'Single Project', price: '$50', amount: 50 },
      { name: 'Studio License', price: '$250', amount: 250 },
      { name: 'Exclusive Rights', price: '$1000', amount: 1000 },
    ],
    createdAt: new Date().toISOString(),
  };

  await writeCharacters([...characters, newCharacter]);

  return NextResponse.json(newCharacter, { status: 201 });
}
