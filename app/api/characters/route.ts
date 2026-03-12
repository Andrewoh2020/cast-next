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
  const newCharacter: Talent = { ...body, id: nextId(characters) };
  await writeCharacters([...characters, newCharacter]);
  return NextResponse.json(newCharacter, { status: 201 });
}
