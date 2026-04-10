import { NextRequest, NextResponse } from 'next/server';
import { readCharacters } from '@/lib/characters.server';

export async function POST(req: NextRequest) {
  try {
    const { email, characterId, licenseIndex, sessionId } = await req.json() as {
      email: string;
      characterId: number;
      licenseIndex: number;
      sessionId?: string;
    };

    if (!email || !characterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const characters = await readCharacters();
    const talent = characters.find((c) => c.id === Number(characterId));
    if (!talent) return NextResponse.json({ error: 'Character not found' }, { status: 404 });

    const priceIdx = licenseIndex ?? 0;
    const license = talent.prices[priceIdx];
    if (!license) return NextResponse.json({ error: 'Invalid license index' }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.castability.ai';

    // Build download URLs
    let referenceSheetDownloadUrl: string | undefined;
    if (talent.referenceSheetUrl) {
      if (talent.referenceSheetUrl.startsWith('/api/media')) {
        referenceSheetDownloadUrl = `${baseUrl}${talent.referenceSheetUrl}&download=1&filename=${talent.slug}-reference-sheet`;
      } else if (talent.referenceSheetUrl.startsWith('http')) {
        referenceSheetDownloadUrl = talent.referenceSheetUrl;
      }
    }

    let profilePhotoDownloadUrl: string | undefined;
    if (talent.img) {
      if (talent.img.startsWith('/api/media')) {
        profilePhotoDownloadUrl = `${baseUrl}${talent.img}&download=1&filename=${talent.slug}-profile`;
      } else if (talent.img.startsWith('http')) {
        profilePhotoDownloadUrl = `${talent.img}${talent.img.includes('?') ? '&' : '?'}download=1`;
      }
    }

    // Dynamic imports to avoid build-time module initialization issues
    const { Resend } = await import('resend');
    const { default: CharacterReferenceSheet } = await import('@/emails/CharacterReferenceSheet');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: 'Cast <no-reply@castability.ai>',
      to: email,
      subject: `Your ${talent.name} License — Cast`,
      react: CharacterReferenceSheet({
        talent,
        licenseName: license.name,
        licensePrice: license.price,
        referenceSheetDownloadUrl,
        profilePhotoDownloadUrl,
        baseUrl,
        orderId: sessionId,
        purchaseDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
