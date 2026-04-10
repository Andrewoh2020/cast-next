import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDraft, saveDraft } from '@/lib/custom-characters.server';
import { generatePreview } from '@/lib/generation.server';

export const maxDuration = 300;

const MAX_ITERATIONS = 2;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { draftId } = await req.json();
    if (!draftId) return NextResponse.json({ error: 'draftId is required' }, { status: 400 });

    let draft = await getDraft(userId, draftId);
    // Retry once after a short delay — Vercel Blob can be eventually consistent
    if (!draft) {
      await new Promise((r) => setTimeout(r, 1500));
      draft = await getDraft(userId, draftId);
    }
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    if (!draft.description || !draft.name) {
      return NextResponse.json({ error: 'Description and name are required before generating' }, { status: 400 });
    }

    // Check iteration limit (initial generation doesn't count, so we check > MAX_ITERATIONS)
    if (draft.previewImageUrl && draft.iterations >= MAX_ITERATIONS) {
      return NextResponse.json({ error: 'Maximum regeneration limit reached (2 re-rolls)' }, { status: 400 });
    }

    const blobPrefix = `custom/${userId}`;
    const result = await generatePreview(draft.description, draft.slug, {
      characterName: draft.name,
      characterSlug: draft.slug,
    }, blobPrefix);

    const updatedIterations = draft.previewImageUrl ? draft.iterations + 1 : 0;
    const previewImages = [...(draft.previewImages ?? []), result.url];
    // Backfill sourceProfileUrls for old drafts that don't have it
    const existingSourceUrls = draft.sourceProfileUrls
      ?? (draft.previewImages ?? []).map(() => draft.sourceProfileUrl ?? '');
    const sourceProfileUrls = [...existingSourceUrls, result.sourceProfileUrl];
    await saveDraft(userId, {
      ...draft,
      status: 'preview',
      previewImageUrl: result.url,
      previewImages,
      sourceProfileUrl: result.sourceProfileUrl,
      sourceProfileUrls,
      iterations: updatedIterations,
    });

    return NextResponse.json({
      previewImageUrl: result.url,
      previewImages,
      iterations: updatedIterations,
      maxIterations: MAX_ITERATIONS,
      provider: result.provider,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Preview generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
