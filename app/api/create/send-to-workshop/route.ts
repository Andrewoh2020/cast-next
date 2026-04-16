import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraft, saveDraft } from '@/lib/custom-characters.server';
import { createCustomWorkshop, readCustomWorkshop } from '@/lib/custom-workshop.server';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { draftId } = await req.json() as { draftId?: string };
  if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });

  const draft = await getDraft(userId, draftId);
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  if (!draft.profileImageUrl) return NextResponse.json({ error: 'Draft is not ready' }, { status: 400 });

  // Reuse the auto-created workshop if the draft already has one
  if (draft.workshopId) {
    const existing = await readCustomWorkshop(userId, draft.workshopId);
    if (existing) return NextResponse.json({ workshopId: existing.id });
  }

  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const workshop = await createCustomWorkshop(userId, {
    id,
    name: draft.name,
    sourceImageUrl: draft.profileImageUrl,
    referenceSheetUrl: draft.referenceSheetUrl,
  });

  await saveDraft(userId, { ...draft, workshopId: workshop.id });

  return NextResponse.json({ workshopId: workshop.id });
}
