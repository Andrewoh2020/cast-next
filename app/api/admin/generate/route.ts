import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { put, get } from '@vercel/blob';
import { appendGenerationLog, GENERATION_COST } from '@/lib/generation-log.server';

fal.config({ credentials: process.env.FAL_API_KEY });

const REFERENCE_SHEET_PROMPT = (description: string) =>
  `Create a professional 8-panel character reference sheet of ${description}. Clean neutral light gray seamless paper backdrop, consistent across all panels. Photorealistic DSLR photography, Canon SL3 with 17-85mm lens, fine skin texture, no airbrushing, no CGI retouch, no text overlays.

CRITICAL RULE: Every panel must show a STRICTLY DIFFERENT camera angle. No two panels may share the same angle or orientation. Do not repeat any view. The 4 close-up panels must each show a clearly distinct direction — front, right 3/4, left 3/4, and back of head.

Arrange as follows:

TOP ROW — 4 full-body standing shots, subject in relaxed A-pose, head to toe:
Panel 1: Camera DIRECTLY IN FRONT — subject faces straight into lens, full front view.
Panel 2: Camera 90 degrees to subject's LEFT — subject's LEFT side of body faces camera, right side hidden, strict 90-degree side profile showing left ear, left shoulder, left arm only.
Panel 3: Camera 90 degrees to subject's RIGHT — subject's RIGHT side of body faces camera, left side hidden, strict 90-degree side profile showing right ear, right shoulder, right arm only. THIS MUST BE A MIRROR OPPOSITE OF PANEL 2.
Panel 4: Camera DIRECTLY BEHIND — subject's back faces lens, back of head and back of clothing fully visible, zero front-facing elements.

RIGHT SIDE — 4 tight close-up portrait shots arranged in a 2x2 grid, shoulders and head only. All 4 must show a completely different camera angle:
Panel 5 (top-left): Camera directly in front — subject looks straight into lens, face perfectly centered and symmetrical. Full front view.
Panel 6 (top-right): Camera angled 45 degrees to subject's RIGHT — subject's RIGHT cheek and ear are prominent, left cheek partially visible. Clear 3/4 right view. Face must be noticeably turned RIGHT compared to Panel 5.
Panel 7 (bottom-left): Camera angled 45 degrees to subject's LEFT — subject's LEFT cheek and ear are prominent, right cheek partially visible. Clear 3/4 left view. Face must be noticeably turned LEFT, OPPOSITE direction to Panel 6.
Panel 8 (bottom-right): Camera positioned directly BEHIND the subject's head — back of skull and back of neck fully visible, zero front-facing features, hair visible from behind. Complete rear view of the head.

Consistent identity across all 8 panels. Consistent lighting across all panels: soft diffused studio light, even fill, no harsh shadows. Uniform spacing between panels. Consistent head height across top row, consistent face scale across bottom row. Crisp print-ready output. No visible panel borders, no dividing lines, no grid lines, no white lines, no black lines between panels. Panels are separated only by the background color — no drawn separators of any kind.`;

const PROFILE_PROMPT = (description: string) =>
  `Full-body standing studio portrait, head to toe visible. The subject is ${description}, standing upright in a relaxed natural pose, slight 3/4 angle to camera, arms relaxed at sides or one hand in pocket. Wearing smart casual or professional business attire — dark blazer over a fitted top, tailored trousers or dress pants. Plain seamless light warm-gray paper backdrop, completely flat and uniform, solid color, no texture, no bokeh, no depth-of-field blur, no patterns. Soft even diffused studio lighting, clean catchlights, no harsh shadows. Sharp photorealistic DSLR photography, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no CGI retouch, no text overlays, no borders, no lines, no frames. HD quality. Not outdoors. No sports clothing, gym wear, uniforms, scrubs, jerseys, or occupation-specific costumes. No outdoor backgrounds, sports fields, gyms, kitchens, hospitals, offices, furniture, or architectural elements. No bokeh. No blurred background.`;

/**
 * Resolve a profile image URL to a publicly fetchable URL for fal.ai.
 * Handles relative /api/media?p=... URLs by looking up the blob directly,
 * and passes through absolute URLs as-is.
 */
async function resolveToPublicUrl(url: string): Promise<string> {
  if (url.startsWith('http')) return url;

  // Extract blob pathname from /api/media?p=...
  const match = url.match(/[?&]p=([^&]+)/);
  if (match) {
    const blobPath = decodeURIComponent(match[1]);
    const result = await get(blobPath, { access: 'private' });
    if (result?.blob?.url) return result.blob.url;
  }

  return url;
}

interface GenerateResult {
  url: string;
  blobUrl: string;
  cost: number;
}

async function generateAndUpload(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  slug: string,
  type: 'profile' | 'refsheet',
  meta: { characterId?: number; characterName?: string; characterSlug?: string; claudeCost?: number },
  referenceImageUrls?: string[],
): Promise<GenerateResult> {
  const cost = GENERATION_COST[type];
  const startedAt = Date.now();

  let resultUrl: string | undefined;
  try {
    // Use the edit endpoint (img2img) when reference images are provided
    const endpoint = referenceImageUrls?.length
      ? 'fal-ai/nano-banana-2/edit' as const
      : 'fal-ai/nano-banana-2' as const;

    const input: Record<string, unknown> = {
      prompt,
      num_images: 1,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: 'jpeg',
    };

    if (referenceImageUrls?.length) {
      input.image_urls = referenceImageUrls;
    }

    const result = await fal.subscribe(endpoint, {
      input,
    }) as unknown as { data?: { images: { url: string }[] }; images?: { url: string }[] };

    const images = result.data?.images ?? result.images;
    if (!images?.[0]?.url) {
      throw new Error(`Unexpected fal.ai response: ${JSON.stringify(result)}`);
    }

    const imageUrl = images[0].url;
    const imageRes = await fetch(imageUrl);
    const buffer = await imageRes.arrayBuffer();
    const filename = `characters/${slug}-${type}-${Date.now()}.jpg`;

    const blob = await put(filename, Buffer.from(buffer), {
      access: 'private',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    resultUrl = `/api/media?p=${encodeURIComponent(blob.pathname)}`;
    const blobDirectUrl = blob.url;

    await appendGenerationLog({
      characterId: meta.characterId,
      characterName: meta.characterName,
      characterSlug: meta.characterSlug,
      type,
      cost,
      claudeCost: meta.claudeCost,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      url: resultUrl,
      failed: false,
    });

    return { url: resultUrl, blobUrl: blobDirectUrl, cost };
  } catch (err) {
    await appendGenerationLog({
      characterId: meta.characterId,
      characterName: meta.characterName,
      characterSlug: meta.characterSlug,
      type,
      cost,
      claudeCost: meta.claudeCost,
      generatedAt: new Date().toISOString(),
      url: resultUrl,
      failed: true,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { description, slug, mode, characterId, characterName, claudeCost, profileImageUrl } = await req.json();
    if (!description || !slug) {
      return NextResponse.json({ error: 'description and slug are required' }, { status: 400 });
    }

    const safeSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const meta = { characterId, characterName, characterSlug: safeSlug, claudeCost: claudeCost ?? 0 };

    if (mode === 'profile') {
      const { url: profileUrl, cost: profileCost } = await generateAndUpload(
        PROFILE_PROMPT(description), '2:3', '2K', safeSlug, 'profile', meta,
      );
      return NextResponse.json({ profileUrl, costs: { profile: profileCost, total: profileCost } });
    }

    if (mode === 'refsheet') {
      if (!profileImageUrl) {
        return NextResponse.json({ error: 'A profile photo is required before generating a reference sheet' }, { status: 400 });
      }
      // Resolve to a publicly fetchable URL for fal.ai
      const publicProfileUrl = await resolveToPublicUrl(profileImageUrl);
      const { url: refSheetUrl, cost: refCost } = await generateAndUpload(
        REFERENCE_SHEET_PROMPT(description), '21:9', '4K', safeSlug, 'refsheet', meta,
        [publicProfileUrl],
      );
      return NextResponse.json({ refSheetUrl, costs: { refsheet: refCost, total: refCost } });
    }

    // mode === 'both' — generate profile first, then use it as reference for refsheet
    const profileResult = await generateAndUpload(
      PROFILE_PROMPT(description), '2:3', '2K', safeSlug, 'profile', meta,
    );

    // Use the direct blob URL (publicly fetchable by fal.ai)
    const refResult = await generateAndUpload(
      REFERENCE_SHEET_PROMPT(description), '21:9', '4K', safeSlug, 'refsheet', meta,
      [profileResult.blobUrl],
    );

    return NextResponse.json({
      profileUrl: profileResult.url,
      refSheetUrl: refResult.url,
      costs: {
        profile: profileResult.cost,
        refsheet: refResult.cost,
        total: profileResult.cost + refResult.cost,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
