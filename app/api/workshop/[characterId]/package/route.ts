import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { get } from '@vercel/blob';
import { readCharacters } from '@/lib/characters.server';
import { readWorkshop } from '@/lib/workshop.server';
import { buildPackageReadme } from '@/lib/workshop-tools';
import archiver from 'archiver';

export const maxDuration = 120;

function parseCharacterId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Internal blob URLs (/api/media?p=<encoded-path>) are read directly from
// Vercel Blob — going over HTTP back to ourselves was the source of a prod
// bug where NEXT_PUBLIC_BASE_URL missed in production and every image fetch
// failed silently, shipping ZIPs that contained only the README.
async function fetchBuffer(url: string): Promise<Buffer> {
  const mediaMatch = url.match(/[?&]p=([^&]+)/);
  if (mediaMatch) {
    const blobPath = decodeURIComponent(mediaMatch[1]);
    const result = await get(blobPath, { access: 'private' });
    if (!result?.stream) throw new Error(`Blob not found: ${blobPath}`);
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  if (!url.startsWith('http')) throw new Error(`Unsupported URL: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { characterId: raw } = await params;
  const characterId = parseCharacterId(raw);
  if (!characterId) return NextResponse.json({ error: 'Invalid characterId' }, { status: 400 });

  const characters = await readCharacters();
  const character = characters.find((c) => c.id === characterId);
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });

  const workshop = await readWorkshop(userId, characterId);
  const slug = character.slug;

  // Stream a zip
  const archive = archiver('zip', { zlib: { level: 5 } });
  const chunks: Uint8Array[] = [];
  archive.on('data', (chunk: Uint8Array) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  // Track whether any image actually made it into the archive. If every
  // fetch fails the ZIP would otherwise ship with only the README, which is
  // exactly the silent-failure mode we just fixed.
  let imagesAdded = 0;
  const tryAppend = async (url: string, name: string, label: string) => {
    try {
      const buf = await fetchBuffer(url);
      archive.append(buf, { name });
      imagesAdded++;
    } catch (err) {
      console.error(`[workshop/package] ${label} fetch failed: ${err instanceof Error ? err.message : String(err)} (url=${url})`);
    }
  };

  await tryAppend(character.img, `${slug}-profile.jpg`, 'profile');
  if (character.referenceSheetUrl) {
    await tryAppend(character.referenceSheetUrl, `${slug}-reference-sheet.jpg`, 'reference-sheet');
  }
  for (let i = 0; i < workshop.outfits.length; i++) {
    await tryAppend(workshop.outfits[i].imageUrl, `wardrobe/${slug}-outfit-${i + 1}.jpg`, `outfit-${i + 1}`);
  }
  for (let i = 0; i < workshop.shots.length; i++) {
    await tryAppend(workshop.shots[i].imageUrl, `scenes/${slug}-scene-${i + 1}.jpg`, `scene-${i + 1}`);
  }

  if (imagesAdded === 0) {
    console.error(`[workshop/package] all image fetches failed for character ${characterId} user ${userId} — refusing to ship README-only ZIP`);
    return NextResponse.json(
      { error: 'Could not assemble your package. Please try again shortly, or contact admin@castability.ai if this persists.' },
      { status: 502 },
    );
  }

  const readme = buildPackageReadme({
    characterName: character.name,
    filenamePrefix: slug,
    hasReferenceSheet: !!character.referenceSheetUrl,
    outfitCount: workshop.outfits.length,
    shotCount: workshop.shots.length,
  });
  archive.append(Buffer.from(readme, 'utf-8'), { name: 'README.md' });

  archive.finalize();
  const zipBuffer = await done;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}-cast-package.zip"`,
    },
  });
}
