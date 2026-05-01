import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put, get } from '@vercel/blob';
import { ensureDripApplied } from '@/lib/user-data.server';
import { canSaveAnotherCharacter } from '@/lib/entitlements.server';
import { readVisibleCharacters } from '@/lib/characters.server';

/**
 * Toggle a roster character on/off the user's saved roster ("My Characters").
 *
 * Body: { characterId: number; action: 'save' | 'unsave' }
 *
 * Returns 402 (Payment Required) when the user is at their tier's storage cap
 * and tries to save another. Idempotent: saving an already-saved character or
 * unsaving an already-unsaved one returns 200 with the current state.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { characterId?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const characterId = typeof body.characterId === 'number' ? body.characterId : NaN;
  const action = body.action === 'save' || body.action === 'unsave' ? body.action : null;
  if (!Number.isFinite(characterId) || !action) {
    return NextResponse.json({ error: 'characterId (number) and action ("save" | "unsave") required' }, { status: 400 });
  }

  // Confirm the character actually exists in the visible roster — prevents
  // saving stale/deleted IDs that would clutter My Characters.
  const characters = await readVisibleCharacters();
  if (!characters.some((c) => c.id === characterId)) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  const data = await ensureDripApplied(userId);
  const current = new Set(data.savedRosterCharacterIds ?? []);
  const wasSaved = current.has(characterId);

  if (action === 'save') {
    if (wasSaved) {
      return NextResponse.json({ ok: true, saved: true, count: current.size });
    }
    if (!canSaveAnotherCharacter(data)) {
      return NextResponse.json(
        { error: 'Storage limit reached', code: 'storage-limit', count: current.size },
        { status: 402 },
      );
    }
    current.add(characterId);
  } else {
    if (!wasSaved) {
      return NextResponse.json({ ok: true, saved: false, count: current.size });
    }
    current.delete(characterId);
  }

  // Inline write — no helper exists yet; mirrors writeUserBlob pattern.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Re-read fresh to merge concurrent updates (drip / Stripe webhooks).
    const fresh = await get(`users/${userId}/data.json`, { access: 'private', useCache: false });
    let freshData = data;
    if (fresh && fresh.statusCode !== 304 && fresh.stream) {
      try {
        const text = await new Response(fresh.stream).text();
        freshData = JSON.parse(text);
      } catch { /* fall back to in-memory */ }
    }
    const updated = { ...freshData, savedRosterCharacterIds: Array.from(current) };
    await put(`users/${userId}/data.json`, JSON.stringify(updated, null, 2), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }

  return NextResponse.json({ ok: true, saved: action === 'save', count: current.size });
}
