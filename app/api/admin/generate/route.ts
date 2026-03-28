import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { put, get } from '@vercel/blob';
import { appendGenerationLog, GENERATION_COST } from '@/lib/generation-log.server';

fal.config({ credentials: process.env.FAL_API_KEY });

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
const KIE_POLL_INTERVAL = 2000; // 2 seconds
const KIE_MAX_POLL_TIME = 120_000; // 2 minutes

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
 * Convert a profile image URL to a base64 data URI.
 * Handles relative /api/media?p=... URLs by fetching from blob storage,
 * and absolute URLs by fetching directly.
 */
async function toDataUri(url: string): Promise<string> {
  let buffer: ArrayBuffer;
  let contentType = 'image/jpeg';

  const match = url.match(/[?&]p=([^&]+)/);
  if (match) {
    const blobPath = decodeURIComponent(match[1]);
    const result = await get(blobPath, { access: 'private' });
    if (!result?.stream) throw new Error('Could not fetch profile image from blob storage');
    contentType = result.blob.contentType ?? 'image/jpeg';
    buffer = await new Response(result.stream).arrayBuffer();
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not fetch profile image: ${res.status}`);
    contentType = res.headers.get('content-type') ?? 'image/jpeg';
    buffer = await res.arrayBuffer();
  }

  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

/** Convert a raw image buffer to a data URI */
function bufferToDataUri(buf: ArrayBuffer, contentType = 'image/jpeg'): string {
  return `data:${contentType};base64,${Buffer.from(buf).toString('base64')}`;
}

// ── Kie.ai API helpers ─────────────────────────────────────────────────────

async function kieCreateTask(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  imageInput?: string[],
): Promise<string> {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) throw new Error('KIE_API_KEY not configured');

  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    resolution,
    output_format: 'jpg',
  };
  if (imageInput?.length) {
    input.image_input = imageInput;
  }

  const res = await fetch(KIE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'nano-banana-2', input }),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 200) {
    const msg = data.msg || `Kie.ai error ${res.status}`;
    throw new Error(`Kie.ai: ${msg}`);
  }

  const taskId = data.data?.taskId;
  if (!taskId) throw new Error('Kie.ai: no taskId in response');
  return taskId;
}

async function kiePollResult(taskId: string): Promise<string> {
  const apiKey = process.env.KIE_API_KEY!;
  const start = Date.now();

  while (Date.now() - start < KIE_MAX_POLL_TIME) {
    const res = await fetch(`${KIE_STATUS_URL}?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await res.json();

    if (data.data?.state === 'success') {
      const resultJson = JSON.parse(data.data.resultJson || '{}');
      const imageUrl = resultJson.resultUrls?.[0];
      if (!imageUrl) throw new Error('Kie.ai: no image URL in completed task');
      return imageUrl;
    }

    if (data.data?.state === 'fail') {
      const failMsg = data.data.failMsg || 'Generation failed';
      throw new Error(`Kie.ai: ${failMsg}`);
    }

    // Still processing — wait and poll again
    await new Promise((r) => setTimeout(r, KIE_POLL_INTERVAL));
  }

  throw new Error('Kie.ai: generation timed out after 2 minutes');
}

async function kieGenerate(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  imageInput?: string[],
): Promise<string> {
  const taskId = await kieCreateTask(prompt, aspectRatio, resolution, imageInput);
  return kiePollResult(taskId);
}

// ── Fal.ai fallback ────────────────────────────────────────────────────────

async function falGenerate(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  referenceImageUrls?: string[],
): Promise<string> {
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

  const result = await fal.subscribe(endpoint, { input }) as unknown as {
    data?: { images: { url: string }[] };
    images?: { url: string }[];
  };

  const images = result.data?.images ?? result.images;
  if (!images?.[0]?.url) {
    throw new Error(`Unexpected fal.ai response: ${JSON.stringify(result)}`);
  }
  return images[0].url;
}

// ── Generate with Kie.ai primary, Fal.ai fallback ─────────────────────────

interface GenerateResult {
  url: string;
  rawBuffer: ArrayBuffer;
  cost: number;
  provider: 'kie' | 'fal';
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
  const startedAt = Date.now();
  let resultUrl: string | undefined;
  let provider: 'kie' | 'fal' = 'kie';

  try {
    // Try Kie.ai first (cheaper)
    let imageUrl: string;
    try {
      imageUrl = await kieGenerate(prompt, aspectRatio, resolution, referenceImageUrls);
      provider = 'kie';
    } catch (kieErr) {
      console.warn(`Kie.ai failed, falling back to fal.ai: ${kieErr instanceof Error ? kieErr.message : kieErr}`);
      imageUrl = await falGenerate(prompt, aspectRatio, resolution, referenceImageUrls);
      provider = 'fal';
    }

    const cost = GENERATION_COST[provider][type];

    // Download and store in Vercel Blob
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
      provider,
    });

    return { url: resultUrl, rawBuffer: buffer, cost, provider };
  } catch (err) {
    await appendGenerationLog({
      characterId: meta.characterId,
      characterName: meta.characterName,
      characterSlug: meta.characterSlug,
      type,
      cost: GENERATION_COST.kie[type],
      claudeCost: meta.claudeCost,
      generatedAt: new Date().toISOString(),
      url: resultUrl,
      failed: true,
      error: err instanceof Error ? err.message : String(err),
      provider,
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
      const { url: profileUrl, cost: profileCost, provider } = await generateAndUpload(
        PROFILE_PROMPT(description), '2:3', '4K', safeSlug, 'profile', meta,
      );
      return NextResponse.json({ profileUrl, costs: { profile: profileCost, total: profileCost }, provider });
    }

    if (mode === 'refsheet') {
      if (!profileImageUrl) {
        return NextResponse.json({ error: 'A profile photo is required before generating a reference sheet' }, { status: 400 });
      }
      const profileDataUri = await toDataUri(profileImageUrl);
      const { url: refSheetUrl, cost: refCost, provider } = await generateAndUpload(
        REFERENCE_SHEET_PROMPT(description), '21:9', '4K', safeSlug, 'refsheet', meta,
        [profileDataUri],
      );
      return NextResponse.json({ refSheetUrl, costs: { refsheet: refCost, total: refCost }, provider });
    }

    // mode === 'both' — generate profile first, then use it as reference for refsheet
    const profileResult = await generateAndUpload(
      PROFILE_PROMPT(description), '2:3', '4K', safeSlug, 'profile', meta,
    );

    const profileDataUri = bufferToDataUri(profileResult.rawBuffer);
    const refResult = await generateAndUpload(
      REFERENCE_SHEET_PROMPT(description), '21:9', '4K', safeSlug, 'refsheet', meta,
      [profileDataUri],
    );

    return NextResponse.json({
      profileUrl: profileResult.url,
      refSheetUrl: refResult.url,
      costs: {
        profile: profileResult.cost,
        refsheet: refResult.cost,
        total: profileResult.cost + refResult.cost,
      },
      provider: { profile: profileResult.provider, refsheet: refResult.provider },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
