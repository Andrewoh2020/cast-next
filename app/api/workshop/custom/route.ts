import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import {
  createCustomWorkshop,
  listCustomWorkshops,
  updateCustomWorkshopAssets,
} from '@/lib/custom-workshop.server';
import { generateFromUpload } from '@/lib/generation.server';
import { peekFreeUpload, consumeFreeUpload, deductCredits, getCredits } from '@/lib/user-data.server';
import { CREDIT_COSTS } from '@/lib/credit-costs';

// Auto-conversion on upload runs ~2 generations (profile + ref sheet) at 4K
// image-to-image. Comfortably under Vercel's 300s function ceiling.
export const maxDuration = 300;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * GET — list the user's custom workshops.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workshops = await listCustomWorkshops(userId);
  return NextResponse.json({ workshops });
}

/**
 * POST — upload a character photo and create a new custom workshop.
 *
 * Flow:
 *   1. Save raw upload to private blob.
 *   2. Create the workshop with the raw upload as the source image.
 *   3. Auto-convert: generate a Cast-styled studio profile photo + 4K
 *      reference sheet via image-to-image. First conversion per account is
 *      free; subsequent conversions cost the regular character credit.
 *   4. Replace the workshop's sourceImageUrl with the cleaned profile and
 *      attach the reference sheet so the studio is immediately exportable.
 *
 * Expects multipart form-data: file (required), name (optional).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = ((formData.get('name') as string | null) ?? 'My character').trim() || 'My character';
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Invalid file type (JPEG, PNG, or WebP only)' }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (10 MB max)' }, { status: 413 });
  }

  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const pathname = `users/${userId}/custom-workshops/${id}/source.${ext}`;
  const bytes = await file.arrayBuffer();
  const blob = await put(pathname, bytes, {
    access: 'private',
    contentType: file.type,
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  const sourceImageUrl = `/api/media?p=${encodeURIComponent(blob.pathname)}`;
  const workshop = await createCustomWorkshop(userId, { id, name, sourceImageUrl });

  // ── Auto-convert: profile photo + 4K reference sheet ──────────────────
  // First upload conversion per account is free; the rest cost a regular
  // character credit. Pre-check eligibility, run the conversion, then settle
  // the ledger only after success — so a failed conversion never charges
  // and never burns the user's freebie.
  const hasFreeAvailable = await peekFreeUpload(userId);
  if (!hasFreeAvailable) {
    const balance = await getCredits(userId);
    if (balance < CREDIT_COSTS.character) {
      return NextResponse.json(
        {
          error: `Need ${CREDIT_COSTS.character} credits for character conversion. Top up or upgrade your plan.`,
          workshop,
          conversion: 'skipped-no-credits',
        },
        { status: 402 },
      );
    }
  }

  try {
    const blobPrefix = `users/${userId}/custom-workshops/${id}`;
    const { profile, refSheet } = await generateFromUpload(
      sourceImageUrl,
      'character',
      { characterName: name, characterSlug: id, userId },
      blobPrefix,
    );
    await updateCustomWorkshopAssets(userId, id, {
      sourceImageUrl: profile.url,
      referenceSheetUrl: refSheet.url,
    });
    // Settle only after a successful conversion.
    if (hasFreeAvailable) {
      await consumeFreeUpload(userId);
    } else {
      try {
        await deductCredits(userId, CREDIT_COSTS.character, 'spend-character');
      } catch (deductErr) {
        // Ledger race (user spent credits between precheck and now).
        // Conversion already succeeded — log and return success rather than
        // rolling back generated assets.
        console.error('post-conversion deduct failed:', deductErr instanceof Error ? deductErr.message : deductErr);
      }
    }
    return NextResponse.json({
      workshop: { ...workshop, sourceImageUrl: profile.url, referenceSheetUrl: refSheet.url },
      conversion: hasFreeAvailable ? 'free' : 'paid',
    });
  } catch (err) {
    // Conversion failed — leave the raw upload in place so the workshop is
    // still usable. No credits charged, freebie not consumed.
    console.error('upload auto-convert failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({
      workshop,
      conversion: 'failed',
      error: err instanceof Error ? err.message : 'conversion failed',
    });
  }
}
