import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { put } from '@vercel/blob';

fal.config({ credentials: process.env.FAL_API_KEY });

const REFERENCE_SHEET_PROMPT = (description: string) =>
  `Create a professional character reference sheet of ${description}. Use a clean, neutral plain background and present the sheet as a technical model turnaround in a photographic style. Arrange the composition into two horizontal rows. Top row: four full-body standing views placed side-by-side in this order: front view, left profile view (facing left), right profile view (facing right), back view. Bottom row: three highly detailed close-up portraits aligned beneath the full-body row in this order: front portrait, left profile portrait (facing left), right profile portrait (facing right). Maintain perfect identity consistency across every panel. Keep the subject in a relaxed A-pose and with consistent scale and alignment between views, accurate anatomy, and clear silhouette; ensure even spacing and clean panel separation, with uniform framing and consistent head height across the full-body lineup and consistent facial scale across the portraits. Lighting should be consistent across all panels (same direction, intensity, and softness), with natural, controlled shadows that preserve detail without dramatic mood shifts. Output a crisp, print-ready reference sheet look, sharp details. Photographed with a Canon SL3 with 17-85mm lens. No text overlays. Maintain consistency and fine pores so the image appears more like traditional DSLR photography and photorealistic. Avoid airbrushed look and CGI retouch.`;

const PROFILE_PROMPT = (description: string) =>
  `Mid-body portrait of ${description}. Clean neutral background, natural relaxed pose, sharp photorealistic DSLR photography style, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no CGI retouch, even studio lighting, no text overlays. HD quality.`;

async function generateAndUpload(prompt: string, aspectRatio: string, resolution: string, slug: string, type: 'profile' | 'refsheet') {
  const result = await fal.subscribe('fal-ai/nano-banana-2', {
    input: {
      prompt,
      num_images: 1,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: 'jpeg',
    },
  }) as unknown as { images: { url: string }[] };

  const imageUrl = result.images[0].url;

  // Fetch the image and upload to Vercel Blob
  const imageRes = await fetch(imageUrl);
  const buffer = await imageRes.arrayBuffer();
  const filename = `characters/${slug}-${type}-${Date.now()}.jpg`;

  const blob = await put(filename, Buffer.from(buffer), {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return blob.url;
}

export async function POST(req: NextRequest) {
  try {
    const { description, slug, mode } = await req.json();
    if (!description || !slug) {
      return NextResponse.json({ error: 'description and slug are required' }, { status: 400 });
    }

    const safeSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (mode === 'profile') {
      const profileUrl = await generateAndUpload(PROFILE_PROMPT(description), '2:3', '2K', safeSlug, 'profile');
      return NextResponse.json({ profileUrl });
    }

    if (mode === 'refsheet') {
      const refSheetUrl = await generateAndUpload(REFERENCE_SHEET_PROMPT(description), '21:9', '4K', safeSlug, 'refsheet');
      return NextResponse.json({ refSheetUrl });
    }

    // mode === 'both' — generate in parallel
    const [profileUrl, refSheetUrl] = await Promise.all([
      generateAndUpload(PROFILE_PROMPT(description), '2:3', '2K', safeSlug, 'profile'),
      generateAndUpload(REFERENCE_SHEET_PROMPT(description), '21:9', '4K', safeSlug, 'refsheet'),
    ]);

    return NextResponse.json({ profileUrl, refSheetUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
