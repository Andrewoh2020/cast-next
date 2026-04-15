import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDraft, saveDraft, addToShowcase } from '@/lib/custom-characters.server';
import { deductCredit, addCredits } from '@/lib/user-data.server';
import { generateFull } from '@/lib/generation.server';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let user: Awaited<ReturnType<typeof currentUser>> | null = null;
  try { user = await currentUser(); } catch {}
  let draftId: string | null = null;
  try {
    const body = await req.json();
    draftId = body.draftId;
    if (!draftId) return NextResponse.json({ error: 'draftId is required' }, { status: 400 });

    let draft = await getDraft(userId, draftId);
    // Retry once after a short delay — Vercel Blob can be eventually consistent
    if (!draft) {
      await new Promise((r) => setTimeout(r, 1500));
      draft = await getDraft(userId, draftId);
    }
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    // If already complete or has assets, return existing data instead of regenerating
    if (draft.status === 'complete' || (draft.profileImageUrl && draft.referenceSheetUrl)) {
      return NextResponse.json({
        profileImageUrl: draft.profileImageUrl,
        profileThumbnailUrl: draft.profileThumbnailUrl,
        referenceSheetUrl: draft.referenceSheetUrl,
        referenceSheetThumbnailUrl: draft.referenceSheetThumbnailUrl,
        costs: { profile: 0, refsheet: 0, total: 0 },
      });
    }

    if (!draft.previewImageUrl) {
      return NextResponse.json({ error: 'Preview must be generated first' }, { status: 400 });
    }

    // Only deduct credit if not already in progress (status='generating' means credit was already taken)
    if (draft.status !== 'generating') {
      try {
        await deductCredit(userId);
      } catch {
        return NextResponse.json({ error: 'No credits available. Purchase credits first.' }, { status: 402 });
      }
      // Mark as generating
      await saveDraft(userId, { ...draft, status: 'generating', paidAt: new Date().toISOString() });
    }

    // Generate reference sheet + thumbnails — reuses profile from preview step
    const blobPrefix = `custom/${userId}`;
    const { profile, refSheet, profileThumbUrl, refSheetThumbUrl } = await generateFull(draft.description, draft.slug, {
      characterName: draft.name,
      characterSlug: draft.slug,
      userId,
    }, blobPrefix, draft.sourceProfileUrl);

    const now = new Date().toISOString();
    await saveDraft(userId, {
      ...draft,
      status: 'complete',
      profileImageUrl: profile.url,
      profileThumbnailUrl: profileThumbUrl,
      referenceSheetUrl: refSheet.url,
      referenceSheetThumbnailUrl: refSheetThumbUrl,
      paidAt: draft.paidAt ?? now,
      completedAt: now,
    });

    // Add to showcase if opted in
    if (draft.showInShowcase && draft.previewImageUrl) {
      await addToShowcase({
        characterId: draft.id,
        name: draft.name,
        previewImageUrl: profile.url,
        style: draft.attributes.style,
        createdAt: now,
        creatorName: user?.firstName || undefined,
        creatorImageUrl: user?.imageUrl || undefined,
      });
    }

    // Send receipt email before returning response (Vercel kills the function after response)
    try {
      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (email) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.castability.ai';
        const profileDownloadUrl = `${baseUrl}${profile.url}${profile.url.includes('?') ? '&' : '?'}download=1&filename=${draft.slug}-profile`;
        const referenceSheetDownloadUrl = `${baseUrl}${refSheet.url}${refSheet.url.includes('?') ? '&' : '?'}download=1&filename=${draft.slug}-reference-sheet`;

        const { Resend } = await import('resend');
        const { default: CustomCharacterReceipt } = await import('@/emails/CustomCharacterReceipt');

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Cast <no-reply@castability.ai>',
          to: email,
          subject: `Your character ${draft.name} is ready — Cast`,
          react: CustomCharacterReceipt({
            characterName: draft.name,
            description: draft.description,
            profileDownloadUrl,
            referenceSheetDownloadUrl,
            accountUrl: `${baseUrl}/account`,
            baseUrl,
          }),
        });
      }
    } catch (emailErr) {
      console.error('Receipt email error:', emailErr);
    }

    return NextResponse.json({
      profileImageUrl: profile.url,
      profileThumbnailUrl: profileThumbUrl,
      referenceSheetUrl: refSheet.url,
      referenceSheetThumbnailUrl: refSheetThumbUrl,
      costs: {
        profile: profile.cost,
        refsheet: refSheet.cost,
        total: profile.cost + refSheet.cost,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Full generation error:', message);

    // Refund credit and mark draft as failed so user can retry
    try {
      if (draftId) {
        const draft = await getDraft(userId, draftId);
        if (draft && draft.status === 'generating') {
          await saveDraft(userId, { ...draft, status: 'preview' });
          await addCredits(userId, 1, 0, `refund-${draftId}-${Date.now()}`);
        }
      }
    } catch {}

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
