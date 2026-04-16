import { fal } from '@fal-ai/client';
import { put, get } from '@vercel/blob';
import sharp from 'sharp';
import { appendGenerationLog, GENERATION_COST } from '@/lib/generation-log.server';

fal.config({ credentials: process.env.FAL_API_KEY });

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
const KIE_POLL_INTERVAL = 2000;
const KIE_MAX_POLL_TIME = 120_000;
const FAL_TIMEOUT = 160_000; // 2 minutes 40 seconds

// ── Prompts ──────────────────────────────────────────────────────────────

export const REFERENCE_SHEET_PROMPT = (description: string) =>
  `Create a professional 8-panel character reference sheet of ${description}. Clean neutral light gray seamless paper backdrop, consistent across all panels. Photorealistic DSLR photography, Canon SL3 with 17-85mm lens, fine skin texture, no airbrushing, no CGI retouch.

ABSOLUTELY NO TEXT OR NUMBERS anywhere in the image. Do NOT render panel numbers (no "1", "2", "3", "4", "5", "6", "7", "8"), panel labels, captions, watermarks, signatures, legends, titles, or any written characters of any language or script. The image must contain only photographic imagery of the subject — zero typography, zero numerals, zero letters. This rule overrides any implied labeling.

CRITICAL RULE: Every panel must show a STRICTLY DIFFERENT camera angle. No two panels may share the same angle or orientation. Do not repeat any view. The 4 close-up panels must each show a clearly distinct direction — front, right 3/4, left 3/4, and back of head.

Arrange as follows:

TOP ROW — 4 FULL-BODY standing shots showing the ENTIRE body from head to feet including shoes. Every panel MUST show the full figure — head, torso, legs, and feet all visible. Do NOT crop at the waist or knees. Relaxed A-pose:
Panel 1: FRONT VIEW — subject faces the camera directly.
Panel 2: LEFT SIDE — subject's nose points to the RIGHT edge of the image. We see their LEFT ear and LEFT shoulder. Their body faces →→→ RIGHT.
Panel 3: RIGHT SIDE — subject's nose points to the LEFT edge of the image. We see their RIGHT ear and RIGHT shoulder. Their body faces ←←← LEFT. CRITICAL: Panel 3 must be the MIRROR OPPOSITE of Panel 2. If Panel 2 faces right, Panel 3 MUST face left. They cannot both face the same direction.
Panel 4: BACK VIEW — subject's back faces the camera. Back of head, back of clothing visible. No face visible.

RIGHT SIDE — 4 tight close-up portrait shots arranged in a 2x2 grid, shoulders and head only. All 4 must show a completely different camera angle:
Panel 5 (top-left): Camera directly in front — subject looks straight into lens, face perfectly centered and symmetrical. Full front view.
Panel 6 (top-right): Camera angled 45 degrees to subject's RIGHT — subject's RIGHT cheek and ear are prominent, left cheek partially visible. Clear 3/4 right view. Face must be noticeably turned RIGHT compared to Panel 5.
Panel 7 (bottom-left): Camera angled 45 degrees to subject's LEFT — subject's LEFT cheek and ear are prominent, right cheek partially visible. Clear 3/4 left view. Face must be noticeably turned LEFT, OPPOSITE direction to Panel 6.
Panel 8 (bottom-right): Camera positioned directly BEHIND the subject's head — back of skull and back of neck fully visible, zero front-facing features, hair visible from behind. Complete rear view of the head.

Consistent identity across all 8 panels. CRITICAL: The subject must wear the EXACT SAME clothing as shown in the reference image — same garments, same colors, same style. Do NOT change or reinterpret the outfit. Match the reference photo's wardrobe precisely. Consistent lighting across all panels: soft diffused studio light, even fill, no harsh shadows. Uniform spacing between panels. Consistent head height across top row, consistent face scale across bottom row. Crisp print-ready output. No visible panel borders, no dividing lines, no grid lines, no white lines, no black lines between panels. Panels are separated only by the background color — no drawn separators of any kind.`;

export const PROFILE_PROMPT = (description: string) =>
  `Medium shot portrait of ${description}, cropped at the knees, head-to-knees framing only. Body turned slightly toward camera, relaxed natural pose. Plain seamless warm-gray studio backdrop, no environment, no props. Photorealistic DSLR, 85mm lens, soft diffused studio lighting, sharp skin detail, no retouching. Do NOT show full body, do NOT show feet or ankles.`;

// ── Helpers ──────────────────────────────────────────────────────────────

/** Fetch an image from private blob storage (via /api/media?p=...) or a remote URL and return the raw buffer. */
async function fetchImageBuffer(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const match = url.match(/[?&]p=([^&]+)/);
  if (match) {
    const blobPath = decodeURIComponent(match[1]);
    const result = await get(blobPath, { access: 'private' });
    if (!result?.stream) throw new Error('Could not fetch image from blob storage');
    const contentType = result.blob.contentType ?? 'image/jpeg';
    const buffer = await new Response(result.stream).arrayBuffer();
    return { buffer, contentType };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch image: ${res.status}`);
  return { buffer: await res.arrayBuffer(), contentType: res.headers.get('content-type') ?? 'image/jpeg' };
}

/** Upload an image buffer to fal.ai's CDN. Returns a publicly accessible URL usable by any external API. */
async function uploadToFalCdn(buffer: ArrayBuffer, contentType = 'image/jpeg'): Promise<string> {
  const blob = new Blob([buffer], { type: contentType });
  const file = new File([blob], `ref-${Date.now()}.jpg`, { type: contentType });
  return await fal.storage.upload(file);
}

// Keep these for backward compatibility with admin generation
export async function toDataUri(url: string): Promise<string> {
  const { buffer, contentType } = await fetchImageBuffer(url);
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

export function bufferToDataUri(buf: ArrayBuffer, contentType = 'image/jpeg'): string {
  return `data:${contentType};base64,${Buffer.from(buf).toString('base64')}`;
}

// ── Kie.ai API ──────────────────────────────────────────────────────────

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

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Kie.ai: invalid response (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok || data.code !== 200) {
    const msg = (data.msg as string) || `Kie.ai error ${res.status}`;
    throw new Error(`Kie.ai: ${msg}`);
  }

  const taskId = (data.data as Record<string, unknown> | undefined)?.taskId as string | undefined;
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

// ── Google Gemini (Nano Banana 2) — primary ─────────────────────────────

async function googleGenerate(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  referenceImageUrls?: string[],
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_KEY not configured');

  // Build parts array — text prompt plus optional reference images as inline data
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (referenceImageUrls?.length) {
    for (const url of referenceImageUrls) {
      const { buffer, contentType } = await fetchImageBuffer(url);
      parts.push({
        inline_data: {
          mime_type: contentType,
          data: Buffer.from(buffer).toString('base64'),
        },
      });
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio,
        imageSize: resolution, // '1K', '2K', '4K'
      },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Google: invalid response (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const errMsg = (data.error as { message?: string } | undefined)?.message || `Google API error ${res.status}`;
    console.error(`[google] API error (${res.status}) for aspectRatio=${aspectRatio} resolution=${resolution} refImages=${referenceImageUrls?.length || 0}: ${errMsg}`);
    throw new Error(`Google: ${errMsg}`);
  }

  // Extract the image data from candidates[0].content.parts[*].inline_data
  type GeminiPart = {
    inline_data?: { data?: string; mime_type?: string };
    inlineData?: { data?: string; mimeType?: string };
  };
  const candidates = (data.candidates as Array<{ content?: { parts?: GeminiPart[] } }> | undefined) ?? [];
  const partsOut = candidates[0]?.content?.parts ?? [];

  for (const part of partsOut) {
    const snake = part.inline_data;
    const camel = part.inlineData;
    const dataStr = snake?.data || camel?.data;
    if (dataStr) {
      const mimeType = snake?.mime_type || camel?.mimeType || 'image/jpeg';
      return `data:${mimeType};base64,${dataStr}`;
    }
  }

  throw new Error(`Google: no image in response: ${JSON.stringify(data).slice(0, 300)}`);
}

// ── Fal.ai fallback ─────────────────────────────────────────────────────

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

  const result = await Promise.race([
    fal.subscribe(endpoint, { input }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('fal.ai: generation timed out after 160 seconds')), FAL_TIMEOUT)),
  ]) as unknown as {
    data?: { images: { url: string }[] };
    images?: { url: string }[];
  };

  const images = result.data?.images ?? result.images;
  if (!images?.[0]?.url) {
    throw new Error(`Unexpected fal.ai response: ${JSON.stringify(result)}`);
  }
  return images[0].url;
}

// ── Core generation function ────────────────────────────────────────────

export interface GenerateResult {
  url: string;
  rawBuffer: ArrayBuffer;
  cost: number;
  provider: 'kie' | 'fal' | 'google';
}

export interface GenerateMeta {
  characterId?: number;
  characterName?: string;
  characterSlug?: string;
  claudeCost?: number;
  userId?: string;
}

/**
 * Generate an image using Kie.ai (primary) or Fal.ai (fallback),
 * upload to Vercel Blob, and log the generation.
 *
 * referenceImageUrls should be publicly accessible URLs (e.g. fal CDN URLs).
 * Both Kie.ai and fal.ai require real HTTP URLs — not data URIs or private blob paths.
 */
export async function generateAndUpload(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  slug: string,
  type: 'profile' | 'refsheet' | 'outfit' | 'shot',
  meta: GenerateMeta,
  referenceImageUrls?: string[],
  blobPrefix = 'characters',
): Promise<GenerateResult> {
  const startedAt = Date.now();
  let resultUrl: string | undefined;
  let provider: 'kie' | 'fal' | 'google' = 'fal';

  try {
    let imageUrl: string;
    // Workshop operations (outfit/shot) skip Google fallback and go straight
    // to Kie.ai, which gives clear content-policy errors instead of hanging.
    const isWorkshop = type === 'outfit' || type === 'shot';

    try {
      imageUrl = await falGenerate(prompt, aspectRatio, resolution, referenceImageUrls);
      provider = 'fal';
    } catch (falErr) {
      const falMsg = falErr instanceof Error ? falErr.message : String(falErr);

      if (isWorkshop) {
        console.warn(`[generation] fal.ai failed for ${type}, falling back to Kie.ai: ${falMsg}`);
        imageUrl = await kieGenerate(prompt, aspectRatio, resolution, referenceImageUrls);
        provider = 'kie';
      } else {
        console.warn(`[generation] fal.ai failed for ${type}, falling back to Google: ${falMsg}`);
        try {
          imageUrl = await googleGenerate(prompt, aspectRatio, resolution, referenceImageUrls);
          provider = 'google';
        } catch (googleErr) {
          console.warn(`[generation] Google failed for ${type}, falling back to Kie.ai: ${googleErr instanceof Error ? googleErr.message : googleErr}`);
          imageUrl = await kieGenerate(prompt, aspectRatio, resolution, referenceImageUrls);
          provider = 'kie';
        }
      }
    }

    const cost = GENERATION_COST[provider][type];

    // Handle data URI (Google returns base64) vs HTTP URL (fal/kie)
    let buffer: ArrayBuffer;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64').buffer as ArrayBuffer;
    } else {
      const imageRes = await fetch(imageUrl);
      buffer = await imageRes.arrayBuffer();
    }
    const filename = `${blobPrefix}/${slug}-${type}-${Date.now()}.jpg`;

    const blob = await put(filename, Buffer.from(buffer), {
      access: 'private',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    resultUrl = `/api/media?p=${encodeURIComponent(blob.pathname)}`;

    // Model identifier for provenance
    const modelMap = {
      fal: referenceImageUrls?.length ? 'fal-ai/nano-banana-2/edit' : 'fal-ai/nano-banana-2',
      google: 'gemini-3.1-flash-image-preview',
      kie: 'kie-ai/nano-banana-2',
    };

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
      userId: meta.userId,
      prompt,
      model: modelMap[provider],
      referenceImageUrl: referenceImageUrls?.[0]?.startsWith('data:') ? '(data-uri-from-profile)' : referenceImageUrls?.[0],
    });

    return { url: resultUrl, rawBuffer: buffer, cost, provider };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
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
      error: errorMessage,
      provider,
    });

    // Detect provider credit/quota exhaustion and notify admin
    if (isProviderCreditError(errorMessage)) {
      // Fire-and-forget admin alert email — don't block the throw
      notifyAdminOfCreditExhaustion(errorMessage, meta).catch(() => {});
      // Throw a user-friendly error instead of the raw provider message
      throw new Error('Image generation is temporarily unavailable. Our team has been notified and is restoring service. Please try again shortly — your draft has been saved.');
    }

    throw err;
  }
}

/** Detect errors that indicate the provider is out of credits or has hit a quota limit. */
function isProviderCreditError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('insufficient') ||
    lower.includes('quota') ||
    lower.includes('out of credits') ||
    lower.includes('billing') ||
    lower.includes('payment required') ||
    lower.includes('exhausted') ||
    lower.includes('balance') ||
    lower.includes('exceeded')
  );
}

/** Send an alert email to the admin when all providers fail with credit/quota errors. */
async function notifyAdminOfCreditExhaustion(errorMessage: string, meta: GenerateMeta): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Cast Alerts <no-reply@castability.ai>',
      to: 'admin@castability.ai',
      subject: '🚨 Image generation provider credit exhausted',
      html: `
        <div style="font-family:sans-serif;max-width:600px;">
          <h2 style="color:#dc2626;">Image generation provider is out of credits</h2>
          <p>All fallback providers failed when generating an image. This usually means one of the API providers (fal.ai, Google, or Kie.ai) has run out of credits or hit a quota.</p>
          <p><strong>Error:</strong></p>
          <pre style="background:#f3f4f6;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;">${errorMessage.replace(/[<>]/g, '')}</pre>
          <p><strong>Character:</strong> ${meta.characterName ?? '(unknown)'} (slug: ${meta.characterSlug ?? '—'})</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <h3>Action needed:</h3>
          <ul>
            <li><a href="https://fal.ai/dashboard/billing">Top up fal.ai credits</a></li>
            <li><a href="https://console.cloud.google.com/billing">Check Google Cloud billing</a></li>
            <li><a href="https://kie.ai">Check Kie.ai credits</a></li>
          </ul>
          <p style="color:#9ca3af;font-size:12px;">Sent automatically by Cast generation pipeline.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin alert email:', err);
  }
}

// ── High-level generation functions ─────────────────────────────────────

export async function generateProfile(
  description: string,
  slug: string,
  meta: GenerateMeta,
  blobPrefix = 'characters',
): Promise<GenerateResult> {
  return generateAndUpload(
    PROFILE_PROMPT(description), '3:4', '4K', slug, 'profile', meta, undefined, blobPrefix,
  );
}

async function applyWatermark(imageBuffer: ArrayBuffer): Promise<Buffer> {
  const img = sharp(Buffer.from(imageBuffer));
  const { width = 720, height = 1080 } = await img.metadata();

  const fontSize = Math.round(width * 0.07);
  const lineSpacing = Math.round(fontSize * 3.5);
  const rows = Math.ceil((height * 2) / lineSpacing);
  const cols = Math.ceil((width * 2) / lineSpacing);

  const textElements: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * lineSpacing - width * 0.3;
      const y = r * lineSpacing - height * 0.3;
      textElements.push(
        `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" fill-opacity="0.18" transform="rotate(-35, ${x}, ${y})">CAST PREVIEW</text>`
      );
    }
  }

  const watermarkSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${textElements.join('')}</svg>`;

  return img
    .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Generate a 2K profile photo for preview. Returns both:
 * - url: the watermarked preview image (for display)
 * - sourceProfileUrl: the unwatermarked original (reused during full generation)
 */
export async function generatePreview(
  description: string,
  slug: string,
  meta: GenerateMeta,
  blobPrefix = 'characters',
): Promise<GenerateResult & { sourceProfileUrl: string }> {
  const result = await generateAndUpload(
    PROFILE_PROMPT(description), '3:4', '2K', slug, 'profile', meta, undefined, blobPrefix,
  );

  const sourceProfileUrl = result.url;

  // Watermark for preview display
  const watermarked = await applyWatermark(result.rawBuffer);
  const filename = `${blobPrefix}/${slug}-preview-${Date.now()}.jpg`;
  const blob = await put(filename, watermarked, {
    access: 'private',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return {
    ...result,
    url: `/api/media?p=${encodeURIComponent(blob.pathname)}`,
    rawBuffer: watermarked.buffer as ArrayBuffer,
    sourceProfileUrl,
  };
}

export async function generateRefSheet(
  description: string,
  slug: string,
  profileImageUrl: string,
  meta: GenerateMeta,
  blobPrefix = 'characters',
): Promise<GenerateResult> {
  const profileDataUri = await toDataUri(profileImageUrl);
  return generateAndUpload(
    REFERENCE_SHEET_PROMPT(description), '21:9', '4K', slug, 'refsheet', meta, [profileDataUri], blobPrefix,
  );
}

/**
 * Generate and upload a thumbnail (200px wide JPEG) from a raw image buffer.
 */
export async function generateThumbnail(
  rawBuffer: ArrayBuffer,
  slug: string,
  type: 'profile' | 'refsheet',
  blobPrefix = 'characters',
): Promise<string> {
  const thumb = await sharp(Buffer.from(rawBuffer))
    .resize(200, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  const filename = `${blobPrefix}/${slug}-${type}-thumb-${Date.now()}.jpg`;
  const blob = await put(filename, thumb, {
    access: 'private',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return `/api/media?p=${encodeURIComponent(blob.pathname)}`;
}

/**
 * Full generation: reuse the existing profile from preview, generate only the reference sheet.
 *
 * 1. Fetch the existing profile from private blob storage
 * 2. Upload it to fal's CDN so both Kie.ai and fal.ai can access it
 * 3. Generate the 4K reference sheet using the profile as reference
 * 4. Generate thumbnails for both
 */
export async function generateFull(
  description: string,
  slug: string,
  meta: GenerateMeta,
  blobPrefix = 'characters',
  sourceProfileUrl?: string,
): Promise<{ profile: GenerateResult; refSheet: GenerateResult; profileThumbUrl: string; refSheetThumbUrl: string }> {
  let profile: GenerateResult;
  let publicProfileUrl: string;

  if (sourceProfileUrl) {
    // Reuse the 2K profile from preview — no regeneration needed
    const { buffer, contentType } = await fetchImageBuffer(sourceProfileUrl);
    profile = { url: sourceProfileUrl, rawBuffer: buffer, cost: 0, provider: 'kie' };
    publicProfileUrl = await uploadToFalCdn(buffer, contentType);
  } else {
    // Fallback: generate a new 4K profile (e.g. admin flow or missing sourceProfileUrl)
    profile = await generateAndUpload(
      PROFILE_PROMPT(description), '3:4', '4K', slug, 'profile', meta, undefined, blobPrefix,
    );
    publicProfileUrl = await uploadToFalCdn(profile.rawBuffer);
  }

  // Generate 4K reference sheet using the public profile URL as reference
  const refSheet = await generateAndUpload(
    REFERENCE_SHEET_PROMPT(description), '21:9', '4K', slug, 'refsheet', meta, [publicProfileUrl], blobPrefix,
  );

  // Generate thumbnails in parallel
  const [profileThumbUrl, refSheetThumbUrl] = await Promise.all([
    generateThumbnail(profile.rawBuffer, slug, 'profile', blobPrefix),
    generateThumbnail(refSheet.rawBuffer, slug, 'refsheet', blobPrefix),
  ]);

  return { profile, refSheet, profileThumbUrl, refSheetThumbUrl };
}

/** Alias for admin flow — generates both profile and reference sheet from scratch. */
export const generateBoth = generateFull;

// ── Aspect ratio detection ──────────────────────────────────────────────

const SUPPORTED_RATIOS: [string, number][] = [
  ['1:1', 1],
  ['4:3', 4/3],
  ['3:2', 3/2],
  ['16:9', 16/9],
  ['21:9', 21/9],
  ['8:1', 8],
  ['3:4', 3/4],
  ['2:3', 2/3],
  ['9:16', 9/16],
  ['4:5', 4/5],
  ['5:4', 5/4],
  ['1:4', 1/4],
  ['4:1', 4],
  ['1:8', 1/8],
];

/** Find the closest supported aspect ratio string for a given width × height. */
function findClosestAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  let best = '3:4';
  let bestDiff = Infinity;
  for (const [label, value] of SUPPORTED_RATIOS) {
    const diff = Math.abs(ratio - value);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = label;
    }
  }
  return best;
}

// ── Workshop: outfit & scene generation ─────────────────────────────────

/**
 * Identity-lock prompt template. Preserves face/skin/hair/body and only
 * swaps wardrobe, with lighting-integration guidance so the subject doesn't
 * pop forward like a sticker pasted into the scene.
 */
function outfitPrompt(outfit: string, sourceType: 'profile' | 'refsheet' | 'other' = 'profile'): string {
  if (sourceType === 'refsheet') {
    return (
      `This is a multi-panel character reference sheet showing the same person from multiple angles. ` +
      `Recreate this EXACT reference sheet — same layout, same number of panels, same poses, same angles, same framing, same background. ` +
      `The ONLY change: dress the person in ${outfit}. ` +
      `Keep their face, skin tone, hair, body type, and proportions IDENTICAL across all panels — this must clearly be the same person. ` +
      `Every panel must show the new outfit from the same angle as the original. ` +
      `Maintain the same studio lighting, backdrop, and overall composition. No text, no watermarks.`
    );
  }
  if (sourceType === 'other') {
    return (
      `Recreate this EXACT image — same person, same pose, same angle, same framing, same background, same lighting, same composition. ` +
      `Change ONLY their clothing to: ${outfit}. ` +
      `Everything else must remain pixel-perfect identical: face, skin tone, hair, body position, expression, environment, camera angle. ` +
      `This must look like the same photograph with only a wardrobe swap. No text, no watermarks.`
    );
  }
  return (
    `Dress this person in: ${outfit}. ` +
    `Keep their face, skin tone, hair, and body type IDENTICAL to the reference — this must clearly be the same person, no facial changes, no rejuvenation, no reshaping. ` +
    `Maintain photorealistic skin texture and natural proportions. ` +
    `Soft diffused studio lighting, neutral warm-gray seamless backdrop, 35mm film look, shallow depth of field. ` +
    `Editorial full-body to 3/4 framing. No text, no watermarks.`
  );
}

function scenePrompt(scene: string): string {
  return (
    `Place this person naturally into a scene: ${scene}. ` +
    `CRITICAL IDENTITY: Keep their face, skin tone, hair, and body type IDENTICAL to the reference — this must clearly be the same person. ` +
    `NATURAL INTEGRATION: The person must look like they belong in this scene. Give them a natural pose and body language that fits the context — walking, sitting, leaning, interacting with the environment. Do NOT copy their pose from the reference photo. They should be actively part of the scene, not standing stiffly in front of a backdrop. ` +
    `SCENE-APPROPRIATE CLOTHING: Dress them in clothing that fits the scene naturally. If the scene is a beach, put them in beachwear. If it's a formal event, dress them formally. If it's a street scene, dress them in contextually appropriate streetwear. Do not keep their studio outfit unless it genuinely fits the scene. ` +
    `LIGHTING: The subject must be lit by the ambient scene light only — match skin tone and exposure to the scene's color temperature, shadows, and reflections. No studio lighting, no unnatural brightening. ` +
    `Photorealistic cinematic framing, 35mm film look, shallow depth of field, commercial editorial photography.`
  );
}

export interface WorkshopGenerateResult {
  /** /api/media?p=... path to serve through the blob proxy */
  imageUrl: string;
  /** Cost in USD of the underlying Fal call, for logging */
  cost: number;
}

/**
 * Generate an outfit variant of the character, preserving identity.
 * `sourceImageUrl` is the current canvas image (usually /api/media?p=...).
 * `garmentRefUrl` is optional — if present, the garment photo is sent as a
 * second reference image so the model matches the specific garment.
 */
export async function generateOutfit(params: {
  sourceImageUrl: string;
  outfitPrompt: string;
  garmentRefUrl?: string;
  sourceType?: 'profile' | 'refsheet' | 'other';
  userId: string;
  characterId: number;
  characterSlug: string;
  characterName: string;
}): Promise<WorkshopGenerateResult> {
  const refs: string[] = [];

  // Source image → Fal CDN
  const sourceFull = params.sourceImageUrl.startsWith('http')
    ? params.sourceImageUrl
    : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${params.sourceImageUrl}${params.sourceImageUrl.includes('?') ? '&' : '?'}w=1200`;
  const { buffer: sourceBuf, contentType: sourceCt } = await fetchImageBuffer(sourceFull);
  refs.push(await uploadToFalCdn(sourceBuf, sourceCt));

  // Optional garment reference → Fal CDN
  if (params.garmentRefUrl) {
    const garmentFull = params.garmentRefUrl.startsWith('http')
      ? params.garmentRefUrl
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${params.garmentRefUrl}${params.garmentRefUrl.includes('?') ? '&' : '?'}w=1200`;
    const { buffer: garmentBuf, contentType: garmentCt } = await fetchImageBuffer(garmentFull);
    refs.push(await uploadToFalCdn(garmentBuf, garmentCt));
  }

  // Auto-detect aspect ratio from the source image for non-profile sources.
  // Profiles always use 3:4. For everything else, read dimensions and find the
  // closest supported ratio so reference sheets and uploads keep their shape.
  let aspectRatio = '3:4';
  if (params.sourceType !== 'profile') {
    try {
      const meta = await sharp(Buffer.from(sourceBuf)).metadata();
      if (meta.width && meta.height) {
        aspectRatio = findClosestAspectRatio(meta.width, meta.height);
      }
    } catch {}
  }

  const result = await generateAndUpload(
    outfitPrompt(params.outfitPrompt, params.sourceType),
    aspectRatio,
    '2K',
    `${params.characterSlug}-outfit`,
    'outfit',
    {
      userId: params.userId,
      characterId: params.characterId,
      characterName: params.characterName,
      characterSlug: params.characterSlug,
    },
    refs,
    `workshop/${params.userId}/${params.characterId}`,
  );

  return { imageUrl: result.url, cost: result.cost };
}

/**
 * Generate a scene shot. Mirrors outfit generation but applies the scene prompt.
 */
export async function generateSceneShot(params: {
  sourceImageUrl: string;
  scenePrompt: string;
  sceneRefUrl?: string;
  userId: string;
  characterId: number;
  characterSlug: string;
  characterName: string;
}): Promise<WorkshopGenerateResult> {
  const refs: string[] = [];
  const sourceFull = params.sourceImageUrl.startsWith('http')
    ? params.sourceImageUrl
    : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${params.sourceImageUrl}${params.sourceImageUrl.includes('?') ? '&' : '?'}w=1200`;
  const { buffer: sourceBuf, contentType: sourceCt } = await fetchImageBuffer(sourceFull);
  refs.push(await uploadToFalCdn(sourceBuf, sourceCt));

  if (params.sceneRefUrl) {
    const sceneFull = params.sceneRefUrl.startsWith('http')
      ? params.sceneRefUrl
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${params.sceneRefUrl}${params.sceneRefUrl.includes('?') ? '&' : '?'}w=1200`;
    const { buffer: sceneBuf, contentType: sceneCt } = await fetchImageBuffer(sceneFull);
    refs.push(await uploadToFalCdn(sceneBuf, sceneCt));
  }

  const result = await generateAndUpload(
    scenePrompt(params.scenePrompt),
    '3:4',
    '2K',
    `${params.characterSlug}-shot`,
    'shot',
    {
      userId: params.userId,
      characterId: params.characterId,
      characterName: params.characterName,
      characterSlug: params.characterSlug,
    },
    refs,
    `workshop/${params.userId}/${params.characterId}`,
  );

  return { imageUrl: result.url, cost: result.cost };
}
