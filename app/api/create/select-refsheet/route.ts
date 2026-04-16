import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraft, saveDraft } from '@/lib/custom-characters.server';
import { updateCustomWorkshopRefSheet } from '@/lib/custom-workshop.server';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { draftId, attemptId } = await req.json() as { draftId?: string; attemptId?: string };
  if (!draftId || !attemptId) {
    return NextResponse.json({ error: 'draftId and attemptId are required' }, { status: 400 });
  }

  const draft = await getDraft(userId, draftId);
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

  const attempts = draft.referenceSheetAttempts ?? [];
  const chosen = attempts.find((a) => a.id === attemptId);
  if (!chosen) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

  await saveDraft(userId, {
    ...draft,
    referenceSheetUrl: chosen.url,
    referenceSheetThumbnailUrl: chosen.thumbnailUrl,
  });

  if (draft.workshopId) {
    await updateCustomWorkshopRefSheet(userId, draft.workshopId, chosen.url).catch(() => {});
  }

  return NextResponse.json({
    selectedId: chosen.id,
    referenceSheetUrl: chosen.url,
    referenceSheetThumbnailUrl: chosen.thumbnailUrl,
  });
}
