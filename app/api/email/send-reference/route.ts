import { NextRequest, NextResponse } from 'next/server';
import { readCharacters } from '@/lib/characters.server';

export async function POST(req: NextRequest) {
  try {
    const { email, characterId, licenseIndex } = await req.json() as {
      email: string;
      characterId: number;
      licenseIndex: number;
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cast-next-silk.vercel.app';

    // Build reference sheet download URL
    let referenceSheetDownloadUrl: string | undefined;
    if (talent.referenceSheetUrl) {
      if (talent.referenceSheetUrl.startsWith('/api/media')) {
        referenceSheetDownloadUrl = `${baseUrl}${talent.referenceSheetUrl}&download=1`;
      } else if (talent.referenceSheetUrl.startsWith('http')) {
        referenceSheetDownloadUrl = talent.referenceSheetUrl;
      }
    }

    // Dynamic imports to avoid build-time module initialization issues
    const { Resend } = await import('resend');
    const { default: CharacterReferenceSheet } = await import('@/emails/CharacterReferenceSheet');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: 'Cast <onboarding@resend.dev>',
      to: email,
      subject: `Your ${talent.name} License — Cast`,
      react: CharacterReferenceSheet({
        talent,
        licenseName: license.name,
        licensePrice: license.price,
        referenceSheetDownloadUrl,
        baseUrl,
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
