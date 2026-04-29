import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { readCustomWorkshop, updateCustomWorkshopAssets } from '@/lib/custom-workshop.server';
import { regenerateRefSheet } from '@/lib/generation.server';
import { deductCredits, getCredits } from '@/lib/user-data.server';
import { CREDIT_COSTS } from '@/lib/credit-costs';

// Single i2i ref-sheet generation at 4K — well under Vercel's 300s function ceiling.
export const maxDuration = 300;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * POST — regenerate the 8-panel reference sheet for a custom workshop.
 *
 * Two paths:
 *   - No body / empty body: re-runs i2i from the existing source/profile photo
 *     (good when the original ref sheet had a stochastic issue like duplicate
 *     poses — a fresh seed usually fixes it).
 *   - multipart/form-data with `file`: uploads a new source photo and uses
 *     that as the i2i identity reference (good when the original photo was
 *     low quality and regen alone wouldn't help).
 *
 * Costs CREDIT_COSTS.refSheetRegen credits, charged on success only.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const workshop = await readCustomWorkshop(userId, id);
  if (!workshop) return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });

  // Pre-check credit balance — settle the ledger only after generation succeeds.
  const cost = CREDIT_COSTS.refSheetRegen;
  const balance = await getCredits(userId);
  if (balance < cost) {
    return NextResponse.json(
      { error: `Need ${cost} credits to regenerate the reference sheet. Top up or upgrade your plan.` },
      { status: 402 },
    );
  }

  // Detect input mode: if the request is multipart and includes a file, treat
  // it as a re-upload. Otherwise re-run from the existing source photo.
  let sourceImageUrl = workshop.sourceImageUrl;
  let newSourceImageUrl: string | undefined;
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (file) {
      const ext = ALLOWED_TYPES[file.type];
      if (!ext) return NextResponse.json({ error: 'Invalid file type (JPEG, PNG, or WebP only)' }, { status: 400 });
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (10 MB max)' }, { status: 413 });

      // Save the new upload as the workshop's profile source. We overwrite the
      // primary source slot rather than keeping the old one, since the user
      // explicitly chose this photo as the identity reference going forward.
      const pathname = `users/${userId}/custom-workshops/${id}/source-${Date.now()}.${ext}`;
      const bytes = await file.arrayBuffer();
      const blob = await put(pathname, bytes, {
        access: 'private',
        contentType: file.type,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      newSourceImageUrl = `/api/media?p=${encodeURIComponent(blob.pathname)}`;
      sourceImageUrl = newSourceImageUrl;
    }
  }

  try {
    const blobPrefix = `users/${userId}/custom-workshops/${id}`;
    const { refSheet } = await regenerateRefSheet(
      sourceImageUrl,
      id,
      { characterName: workshop.name, characterSlug: id, userId },
      blobPrefix,
    );

    await updateCustomWorkshopAssets(userId, id, {
      ...(newSourceImageUrl ? { sourceImageUrl: newSourceImageUrl } : {}),
      referenceSheetUrl: refSheet.url,
    });

    try {
      await deductCredits(userId, cost, 'spend-character');
    } catch (deductErr) {
      console.error('post-regen deduct failed:', deductErr instanceof Error ? deductErr.message : deductErr);
    }

    return NextResponse.json({
      ok: true,
      referenceSheetUrl: refSheet.url,
      ...(newSourceImageUrl ? { sourceImageUrl: newSourceImageUrl } : {}),
    });
  } catch (err) {
    console.error('regen ref sheet failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'regen failed' },
      { status: 500 },
    );
  }
}
