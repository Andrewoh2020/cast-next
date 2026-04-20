import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { readCustomWorkshop, addCustomShot } from '@/lib/custom-workshop.server';
import { deductCredits, addCredits, getCredits } from '@/lib/user-data.server';
import { generateSceneShot } from '@/lib/generation.server';
import type { SceneShot } from '@/lib/workshop.server';
import { CREDIT_COSTS } from '@/lib/credit-costs';

export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const workshop = await readCustomWorkshop(userId, id);
  if (!workshop) return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });

  let body: { prompt?: string; sourceImageUrl?: string; sceneRefUrl?: string; aspectRatio?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt && !body.sceneRefUrl) {
    return NextResponse.json({ error: 'prompt or sceneRefUrl required' }, { status: 400 });
  }

  const balance = await getCredits(userId);
  if (balance < CREDIT_COSTS.shot) return NextResponse.json({ error: `Need ${CREDIT_COSTS.shot} credits` }, { status: 402 });

  const sourceImageUrl = body.sourceImageUrl || workshop.sourceImageUrl;

  await deductCredits(userId, CREDIT_COSTS.shot, 'spend-shot');
  try {
    const result = await generateSceneShot({
      sourceImageUrl,
      scenePrompt: prompt || 'the scene shown in the reference photo',
      sceneRefUrl: body.sceneRefUrl,
      userId,
      characterId: 0,
      characterSlug: `custom-${workshop.id}`,
      characterName: workshop.name,
      aspectRatio: body.aspectRatio,
    });

    const shot: SceneShot = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      sceneRefUrl: body.sceneRefUrl,
      imageUrl: result.imageUrl,
      createdAt: new Date().toISOString(),
      creditsSpent: CREDIT_COSTS.shot,
    };

    const updated = await addCustomShot(userId, id, shot);
    return NextResponse.json({ shot, workshop: updated });
  } catch (err) {
    await addCredits(userId, CREDIT_COSTS.shot, 0, `refund-custom-shot-${Date.now()}`).catch(() => {});
    const raw = err instanceof Error ? err.message : 'Generation failed';
    console.error('[workshop/custom/shots] failed:', raw);
    const isModeration = /policy|prohibited|filtered|safety|blocked|content.*violation|nsfw/i.test(raw);
    const message = isModeration
      ? 'This prompt was flagged by the AI model\'s content policy. Try a different scene description — suggestive, violent, or explicit content is not supported.'
      : raw;
    return NextResponse.json({ error: message, moderation: isModeration }, { status: isModeration ? 422 : 500 });
  }
}
