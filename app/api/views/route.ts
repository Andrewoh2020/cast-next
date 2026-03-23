import { NextRequest, NextResponse } from 'next/server';
import { appendViewLog } from '@/lib/views-log.server';

export async function POST(req: NextRequest) {
  try {
    const { characterId, sessionId } = await req.json();
    if (!characterId || !sessionId) return NextResponse.json({ ok: false }, { status: 400 });
    await appendViewLog({ characterId: Number(characterId), sessionId, viewedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
