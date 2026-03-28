export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readCharacters, writeCharacters, nextId } from '@/lib/characters.server';
import { Talent } from '@/lib/talent';

export async function GET() {
  const characters = await readCharacters();
  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<Talent, 'id'>;
  const characters = await readCharacters();
  const newCharacter: Talent = { ...body, id: nextId(characters), createdAt: new Date().toISOString() };
  await writeCharacters([...characters, newCharacter]);
  return NextResponse.json(newCharacter, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { ids } = await req.json() as { ids: number[] };
  if (!ids?.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
  const characters = await readCharacters();
  const idSet = new Set(ids);
  const filtered = characters.filter((c) => !idSet.has(c.id));
  const deletedCount = characters.length - filtered.length;
  if (deletedCount === 0) return NextResponse.json({ error: 'None found' }, { status: 404 });
  await writeCharacters(filtered);
  return NextResponse.json({ ok: true, deleted: deletedCount });
}
