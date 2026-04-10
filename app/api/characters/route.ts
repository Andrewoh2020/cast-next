export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readCharacters, readVisibleCharacters, writeCharacters, nextId } from '@/lib/characters.server';
import { Talent } from '@/lib/talent';
import { pingIndexNow } from '@/lib/indexnow.server';

export async function GET(req: NextRequest) {
  const showAll = req.nextUrl.searchParams.get('all') === '1';
  const characters = showAll ? await readCharacters() : await readVisibleCharacters();
  const sorted = [...characters].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '') ||
    b.id - a.id
  );
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<Talent, 'id'>;
  const characters = await readCharacters();

  // Slug deduplication: if slug already exists, append -2, -3, etc.
  let uniqueSlug = body.slug;
  if (uniqueSlug) {
    const existingSlugs = new Set(characters.map((c) => c.slug));
    if (existingSlugs.has(uniqueSlug)) {
      let suffix = 2;
      while (existingSlugs.has(`${body.slug}-${suffix}`)) suffix++;
      uniqueSlug = `${body.slug}-${suffix}`;
    }
  }

  const newCharacter: Talent = { ...body, slug: uniqueSlug, id: nextId(characters), createdAt: new Date().toISOString() };
  await writeCharacters([...characters, newCharacter]);

  // Notify search engines via IndexNow if the character is publicly visible
  if (!newCharacter.hidden) {
    pingIndexNow([`/characters/${newCharacter.slug}`, '/']).catch(() => {});
  }

  return NextResponse.json(newCharacter, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { ids, update } = await req.json() as { ids: number[]; update: Partial<Talent> };
  if (!ids?.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
  const characters = await readCharacters();
  const idSet = new Set(ids);

  // Detect characters that are being unhidden (going public for the first time)
  const newlyVisible: string[] = [];
  if (update.hidden === false) {
    for (const c of characters) {
      if (idSet.has(c.id) && c.hidden && c.slug) {
        newlyVisible.push(`/characters/${c.slug}`);
      }
    }
  }

  const updated = characters.map((c) => idSet.has(c.id) ? { ...c, ...update, id: c.id } : c);
  await writeCharacters(updated);

  if (newlyVisible.length > 0) {
    pingIndexNow([...newlyVisible, '/']).catch(() => {});
  }

  return NextResponse.json({ ok: true, updated: ids.length });
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
