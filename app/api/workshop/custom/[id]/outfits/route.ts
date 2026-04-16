import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readCustomWorkshop, addCustomOutfit } from '@/lib/custom-workshop.server';
import { deductCredit, addCredits, getCredits } from '@/lib/user-data.server';
import { generateOutfit } from '@/lib/generation.server';
import type { OutfitVariant } from '@/lib/workshop.server';

export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const workshop = await readCustomWorkshop(userId, id);
  if (!workshop) return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });

  let body: { prompt?: string; sourceImageUrl?: string; garmentRefUrl?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt && !body.garmentRefUrl) {
    return NextResponse.json({ error: 'prompt or garmentRefUrl required' }, { status: 400 });
  }

  const balance = await getCredits(userId);
  if (balance < 1) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

  const sourceImageUrl = body.sourceImageUrl || workshop.sourceImageUrl;

  await deductCredit(userId);
  try {
    const result = await generateOutfit({
      sourceImageUrl,
      outfitPrompt: prompt || 'the garment shown in the reference photo',
      garmentRefUrl: body.garmentRefUrl,
      userId,
      characterId: 0, // custom workshops have no roster id
      characterSlug: `custom-${workshop.id}`,
      characterName: workshop.name,
    });

    const outfit: OutfitVariant = {
      id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      garmentRefUrl: body.garmentRefUrl,
      imageUrl: result.imageUrl,
      createdAt: new Date().toISOString(),
      creditsSpent: 1,
    };

    const updated = await addCustomOutfit(userId, id, outfit);
    return NextResponse.json({ outfit, workshop: updated });
  } catch (err) {
    await addCredits(userId, 1, 0, `refund-custom-outfit-${Date.now()}`).catch(() => {});
    const message = err instanceof Error ? err.message : 'Generation failed';
    console.error('[workshop/custom/outfits] failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
