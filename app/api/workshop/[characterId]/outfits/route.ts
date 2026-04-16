import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readCharacters } from '@/lib/characters.server';
import { readWorkshop, addOutfit, OutfitVariant } from '@/lib/workshop.server';
import { deductCredit, addCredits, getCredits } from '@/lib/user-data.server';
import { generateOutfit } from '@/lib/generation.server';

export const maxDuration = 300;

function parseCharacterId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId: raw } = await params;
  const characterId = parseCharacterId(raw);
  if (!characterId) return NextResponse.json({ error: 'Invalid characterId' }, { status: 400 });


  const workshop = await readWorkshop(userId, characterId);
  return NextResponse.json({ outfits: workshop.outfits });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId: raw } = await params;
  const characterId = parseCharacterId(raw);
  if (!characterId) return NextResponse.json({ error: 'Invalid characterId' }, { status: 400 });


  let body: { prompt?: string; sourceImageUrl?: string; garmentRefUrl?: string; sourceType?: 'profile' | 'refsheet' | 'other' };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt && !body.garmentRefUrl) {
    return NextResponse.json({ error: 'prompt or garmentRefUrl required' }, { status: 400 });
  }

  const balance = await getCredits(userId);
  if (balance < 1) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

  // Need source image — default to character profile if client didn't supply
  let sourceImageUrl = body.sourceImageUrl;
  const characters = await readCharacters();
  const character = characters.find((c) => c.id === characterId);
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  if (!sourceImageUrl) sourceImageUrl = character.img;

  // Deduct credit up front — refund on failure
  await deductCredit(userId);
  try {
    const result = await generateOutfit({
      sourceImageUrl,
      outfitPrompt: prompt || 'the garment shown in the reference photo',
      garmentRefUrl: body.garmentRefUrl,
      sourceType: body.sourceType || 'profile',
      userId,
      characterId,
      characterSlug: character.slug,
      characterName: character.name,
    });

    const outfit: OutfitVariant = {
      id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      garmentRefUrl: body.garmentRefUrl,
      imageUrl: result.imageUrl,
      createdAt: new Date().toISOString(),
      creditsSpent: 1,
    };

    const workshop = await addOutfit(userId, characterId, outfit);
    return NextResponse.json({ outfit, workshop });
  } catch (err) {
    await addCredits(userId, 1, 0, `refund-outfit-${Date.now()}`).catch(() => {});
    const raw = err instanceof Error ? err.message : 'Generation failed';
    console.error('[workshop/outfits] generation failed:', raw);

    // Detect content policy violations and return a clear message
    const isModeration = /policy|prohibited|filtered|safety|blocked|content.*violation|nsfw/i.test(raw);
    const message = isModeration
      ? 'This prompt was flagged by the AI model\'s content policy. Try a different outfit description — suggestive, violent, or explicit content is not supported.'
      : raw;
    const status = isModeration ? 422 : 500;

    return NextResponse.json({ error: message, moderation: isModeration }, { status });
  }
}
