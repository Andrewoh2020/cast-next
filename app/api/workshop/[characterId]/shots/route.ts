import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readCharacters } from '@/lib/characters.server';
import { readWorkshop, addShot } from '@/lib/workshop.server';
import { deductCredit, addCredits, getCredits } from '@/lib/user-data.server';
import { generateSceneShot } from '@/lib/generation.server';
import type { SceneShot } from '@/lib/workshop.server';

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
  return NextResponse.json({ shots: workshop.shots });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId: raw } = await params;
  const characterId = parseCharacterId(raw);
  if (!characterId) return NextResponse.json({ error: 'Invalid characterId' }, { status: 400 });

  let body: { prompt?: string; sourceImageUrl?: string; sceneRefUrl?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt && !body.sceneRefUrl) {
    return NextResponse.json({ error: 'prompt or sceneRefUrl required' }, { status: 400 });
  }

  const balance = await getCredits(userId);
  if (balance < 1) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

  let sourceImageUrl = body.sourceImageUrl;
  const characters = await readCharacters();
  const character = characters.find((c) => c.id === characterId);
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  if (!sourceImageUrl) sourceImageUrl = character.img;

  await deductCredit(userId);
  try {
    const result = await generateSceneShot({
      sourceImageUrl,
      scenePrompt: prompt || 'the scene shown in the reference photo',
      sceneRefUrl: body.sceneRefUrl,
      userId,
      characterId,
      characterSlug: character.slug,
      characterName: character.name,
    });

    const shot: SceneShot = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      sceneRefUrl: body.sceneRefUrl,
      imageUrl: result.imageUrl,
      createdAt: new Date().toISOString(),
      creditsSpent: 1,
    };

    const workshop = await addShot(userId, characterId, shot);
    return NextResponse.json({ shot, workshop });
  } catch (err) {
    await addCredits(userId, 1, 0, `refund-shot-${Date.now()}`).catch(() => {});
    const message = err instanceof Error ? err.message : 'Generation failed';
    console.error('[workshop/shots] generation failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
