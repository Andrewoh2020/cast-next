import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readCustomWorkshop, addCustomOutfit } from '@/lib/custom-workshop.server';
import { deductCredits, addCredits, getCredits } from '@/lib/user-data.server';
import { generateOutfit } from '@/lib/generation.server';
import type { OutfitVariant } from '@/lib/workshop.server';
import { CREDIT_COSTS } from '@/lib/credit-costs';

export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const workshop = await readCustomWorkshop(userId, id);
  if (!workshop) return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });

  let body: { prompt?: string; sourceImageUrl?: string; garmentRefUrl?: string; sourceType?: 'profile' | 'refsheet' | 'other'; aspectRatio?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt && !body.garmentRefUrl) {
    return NextResponse.json({ error: 'prompt or garmentRefUrl required' }, { status: 400 });
  }

  const balance = await getCredits(userId);
  if (balance < CREDIT_COSTS.outfit) return NextResponse.json({ error: `Need ${CREDIT_COSTS.outfit} credits` }, { status: 402 });

  const sourceImageUrl = body.sourceImageUrl || workshop.sourceImageUrl;

  await deductCredits(userId, CREDIT_COSTS.outfit, 'spend-outfit');
  try {
    const result = await generateOutfit({
      sourceImageUrl,
      outfitPrompt: prompt || 'the garment shown in the reference photo',
      garmentRefUrl: body.garmentRefUrl,
      sourceType: body.sourceType || 'profile',
      userId,
      characterId: 0,
      characterSlug: `custom-${workshop.id}`,
      characterName: workshop.name,
      aspectRatio: body.aspectRatio,
    });

    const outfit: OutfitVariant = {
      id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      garmentRefUrl: body.garmentRefUrl,
      imageUrl: result.imageUrl,
      createdAt: new Date().toISOString(),
      creditsSpent: CREDIT_COSTS.outfit,
    };

    const updated = await addCustomOutfit(userId, id, outfit);
    return NextResponse.json({ outfit, workshop: updated });
  } catch (err) {
    await addCredits(userId, CREDIT_COSTS.outfit, 0, `refund-custom-outfit-${Date.now()}`, 'refund', { kind: 'custom-outfit' }).catch(() => {});
    const raw = err instanceof Error ? err.message : 'Generation failed';
    console.error('[workshop/custom/outfits] failed:', raw);
    const isModeration = /policy|prohibited|filtered|safety|blocked|content.*violation|nsfw/i.test(raw);
    const message = isModeration
      ? 'This prompt was flagged by the AI model\'s content policy. Try a different outfit description — suggestive, violent, or explicit content is not supported.'
      : raw;
    return NextResponse.json({ error: message, moderation: isModeration }, { status: isModeration ? 422 : 500 });
  }
}
