import { NextRequest, NextResponse } from 'next/server';
import {
  generateProfile,
  generateRefSheet,
  generateBoth,
  generateThumbnail,
  GenerateMeta,
} from '@/lib/generation.server';

export async function POST(req: NextRequest) {
  try {
    const { description, slug, mode, characterId, characterName, claudeCost, profileImageUrl } = await req.json();
    if (!description || !slug) {
      return NextResponse.json({ error: 'description and slug are required' }, { status: 400 });
    }

    const safeSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const meta: GenerateMeta = { characterId, characterName, characterSlug: safeSlug, claudeCost: claudeCost ?? 0 };

    if (mode === 'profile') {
      const result = await generateProfile(description, safeSlug, meta);
      const imgThumbnail = await generateThumbnail(result.rawBuffer, safeSlug, 'profile');
      return NextResponse.json({
        profileUrl: result.url,
        imgThumbnail,
        costs: { profile: result.cost, total: result.cost },
        provider: result.provider,
      });
    }

    if (mode === 'refsheet') {
      if (!profileImageUrl) {
        return NextResponse.json({ error: 'A profile photo is required before generating a reference sheet' }, { status: 400 });
      }
      const result = await generateRefSheet(description, safeSlug, profileImageUrl, meta);
      const refSheetThumbnail = await generateThumbnail(result.rawBuffer, safeSlug, 'refsheet');
      return NextResponse.json({
        refSheetUrl: result.url,
        refSheetThumbnail,
        costs: { refsheet: result.cost, total: result.cost },
        provider: result.provider,
      });
    }

    // mode === 'both'
    const { profile, refSheet, profileThumbUrl, refSheetThumbUrl } = await generateBoth(description, safeSlug, meta);
    return NextResponse.json({
      profileUrl: profile.url,
      imgThumbnail: profileThumbUrl,
      refSheetUrl: refSheet.url,
      refSheetThumbnail: refSheetThumbUrl,
      costs: {
        profile: profile.cost,
        refsheet: refSheet.cost,
        total: profile.cost + refSheet.cost,
      },
      provider: { profile: profile.provider, refsheet: refSheet.provider },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
