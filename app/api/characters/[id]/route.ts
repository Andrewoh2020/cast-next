import { NextRequest, NextResponse } from 'next/server';
import { readCharacters, writeCharacters } from '@/lib/characters.server';
import { Talent } from '@/lib/talent';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as Partial<Talent>;
    const characters = await readCharacters();
    const idx = characters.findIndex((c) => c.id === Number(id));
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    characters[idx] = { ...characters[idx], ...body, id: Number(id) };
    await writeCharacters(characters);
    return NextResponse.json(characters[idx]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const characters = await readCharacters();
  const filtered = characters.filter((c) => c.id !== Number(id));
  if (filtered.length === characters.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await writeCharacters(filtered);
  return NextResponse.json({ ok: true });
}
