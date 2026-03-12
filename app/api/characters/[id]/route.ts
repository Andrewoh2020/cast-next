import { NextRequest, NextResponse } from 'next/server';
import { readCharacters, writeCharacters } from '@/lib/characters.server';
import { Talent } from '@/lib/talent';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Talent;
  const characters = readCharacters();
  const idx = characters.findIndex((c) => c.id === Number(id));
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  characters[idx] = { ...body, id: Number(id) };
  writeCharacters(characters);
  return NextResponse.json(characters[idx]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const characters = readCharacters();
  const filtered = characters.filter((c) => c.id !== Number(id));
  if (filtered.length === characters.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  writeCharacters(filtered);
  return NextResponse.json({ ok: true });
}
