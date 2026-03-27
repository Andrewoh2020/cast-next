import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function POST() {
  const JSON_FALLBACK = path.join(process.cwd(), 'data', 'characters.json');
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf-8');
  const characters = JSON.parse(raw);

  await put('characters.json', JSON.stringify(characters, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return NextResponse.json({ ok: true, count: characters.length });
}
