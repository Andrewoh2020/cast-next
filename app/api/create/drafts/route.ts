import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserDrafts, saveDraft, CustomCharacterDraft } from '@/lib/custom-characters.server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const drafts = await getUserDrafts(userId);
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const draft: CustomCharacterDraft = {
    id,
    userId,
    status: 'draft',
    description: body.description ?? '',
    name: body.name ?? '',
    slug: body.slug ?? '',
    attributes: body.attributes ?? {
      sex: 'female',
      race: [],
      ageRange: '20s',
      build: 'average',
      height: 'average',
      style: 'realistic',
    },
    previewImages: [],
    iterations: 0,
    showInShowcase: true,
    createdAt: now,
    updatedAt: now,
  };

  await saveDraft(userId, draft);
  return NextResponse.json(draft, { status: 201 });
}
