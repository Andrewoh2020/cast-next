import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraft, saveDraft, RefSheetAttempt } from '@/lib/custom-characters.server';
import { generateRefSheet, generateThumbnail } from '@/lib/generation.server';
import { updateCustomWorkshopRefSheet } from '@/lib/custom-workshop.server';

export const maxDuration = 300;

const MAX_REGENERATIONS = 3;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { draftId } = await req.json();
    if (!draftId) return NextResponse.json({ error: 'draftId is required' }, { status: 400 });

    const draft = await getDraft(userId, draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    if (draft.status !== 'complete') {
      return NextResponse.json({ error: 'Character must be fully generated first' }, { status: 400 });
    }

    if (!draft.profileImageUrl) {
      return NextResponse.json({ error: 'No profile image available' }, { status: 400 });
    }

    const regens = draft.refSheetRegenerations ?? 0;
    if (regens >= MAX_REGENERATIONS) {
      return NextResponse.json({ error: 'Maximum regeneration attempts reached' }, { status: 400 });
    }

    const blobPrefix = `custom/${userId}`;
    const result = await generateRefSheet(
      draft.description,
      draft.slug,
      draft.profileImageUrl,
      { characterName: draft.name, characterSlug: draft.slug, userId },
      blobPrefix,
    );

    const refSheetThumbUrl = await generateThumbnail(result.rawBuffer, draft.slug, 'refsheet', blobPrefix);

    // Backfill attempts list for older drafts that only have a single referenceSheetUrl
    const existingAttempts: RefSheetAttempt[] = draft.referenceSheetAttempts ?? (
      draft.referenceSheetUrl
        ? [{ id: 'v1', url: draft.referenceSheetUrl, thumbnailUrl: draft.referenceSheetThumbnailUrl, createdAt: draft.completedAt ?? draft.updatedAt }]
        : []
    );

    const newAttempt: RefSheetAttempt = {
      id: `v${existingAttempts.length + 1}`,
      url: result.url,
      thumbnailUrl: refSheetThumbUrl,
      createdAt: new Date().toISOString(),
    };
    const attempts = [...existingAttempts, newAttempt];

    await saveDraft(userId, {
      ...draft,
      referenceSheetUrl: result.url,
      referenceSheetThumbnailUrl: refSheetThumbUrl,
      referenceSheetAttempts: attempts,
      refSheetRegenerations: regens + 1,
    });

    // Propagate the newly-selected ref sheet to the linked workshop
    if (draft.workshopId) {
      await updateCustomWorkshopRefSheet(userId, draft.workshopId, result.url).catch(() => {});
    }

    return NextResponse.json({
      attempts,
      selectedId: newAttempt.id,
      refSheetRegenerations: regens + 1,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Refsheet regeneration error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
