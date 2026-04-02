/**
 * generate-characters.mjs
 *
 * Generates profile photos, reference sheets, and thumbnails for characters
 * that have no images yet (img === '') and saves them to Vercel Blob.
 *
 * Usage:
 *   node scripts/generate-characters.mjs              # all chars with empty img
 *   node scripts/generate-characters.mjs 90,91,92     # specific IDs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CHARACTERS_FILE = join(ROOT, 'data', 'characters.json');

// ── Load .env.local ──────────────────────────────────────────────────────
const envContent = readFileSync(join(ROOT, '.env.local'), 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] ??= val;
}

fal.config({ credentials: process.env.FAL_API_KEY });

// ── Prompts ──────────────────────────────────────────────────────────────
const PROFILE_PROMPT = (description) =>
  `Full-body portrait of ${description}, head to toe visible. Plain seamless light warm-gray studio backdrop. Natural relaxed pose, sharp photorealistic DSLR photography style, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no CGI retouch, soft even diffused studio lighting, no text overlays. Not outdoors. HD quality.`;

const REFERENCE_SHEET_PROMPT = (description) =>
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

// ── Kie.ai ────────────────────────────────────────────────────────────────
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';

async function kieGenerate(prompt, aspectRatio, resolution, imageInput) {
  const apiKey = process.env.KIE_API_KEY;
  const input = { prompt, aspect_ratio: aspectRatio, resolution, output_format: 'jpg' };
  if (imageInput?.length) input.image_input = imageInput;

  const res = await fetch(KIE_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nano-banana-2', input }),
  });
  const data = await res.json();
  if (data.code !== 200) throw new Error(`Kie.ai: ${data.msg}`);
  const taskId = data.data.taskId;

  const start = Date.now();
  while (Date.now() - start < 120_000) {
    await new Promise(r => setTimeout(r, 2000));
    const poll = await fetch(`${KIE_STATUS_URL}?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const pollData = await poll.json();
    const state = pollData.data?.state;
    if (state === 'success') {
      const resultJson = JSON.parse(pollData.data.resultJson || '{}');
      const url = resultJson.resultUrls?.[0];
      if (!url) throw new Error('Kie.ai: no image URL in response');
      return url;
    }
    if (state === 'fail') throw new Error(`Kie.ai: ${pollData.data.failMsg}`);
  }
  throw new Error('Kie.ai: timed out after 2 minutes');
}

async function falGenerate(prompt, aspectRatio, resolution, referenceImageUrls) {
  const endpoint = referenceImageUrls?.length ? 'fal-ai/nano-banana-2/edit' : 'fal-ai/nano-banana-2';
  const input = { prompt, num_images: 1, aspect_ratio: aspectRatio, resolution, output_format: 'jpeg' };
  if (referenceImageUrls?.length) input.image_urls = referenceImageUrls;
  const result = await fal.subscribe(endpoint, { input });
  const images = result.data?.images ?? result.images;
  if (!images?.[0]?.url) throw new Error('fal.ai: no image URL');
  return images[0].url;
}

async function generateImage(prompt, aspectRatio, resolution, imageInput) {
  try {
    return await kieGenerate(prompt, aspectRatio, resolution, imageInput);
  } catch (err) {
    console.warn(`    Kie.ai failed (${err.message}), falling back to fal.ai...`);
    return await falGenerate(prompt, aspectRatio, resolution, imageInput);
  }
}

// ── Storage ───────────────────────────────────────────────────────────────
async function uploadToBlob(buffer, filename) {
  const blob = await put(filename, Buffer.from(buffer), {
    access: 'private',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return `/api/media?p=${encodeURIComponent(blob.pathname)}`;
}

async function uploadToFalCdn(buffer) {
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const file = new File([blob], `ref-${Date.now()}.jpg`, { type: 'image/jpeg' });
  return await fal.storage.upload(file);
}

async function makeThumbnail(buffer, slug, type) {
  const thumb = await sharp(Buffer.from(buffer))
    .resize(200, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();
  return uploadToBlob(thumb.buffer, `characters/${slug}-${type}-${Date.now()}-thumb.jpg`);
}

// ── Per-character generation ──────────────────────────────────────────────
async function generateCharacter(character) {
  const { id, name, slug, vibe } = character;
  console.log(`\n[${id}] ${name}`);

  // 1. Profile photo (4K, 2:3)
  console.log(`  → Profile...`);
  const profileUrl = await generateImage(PROFILE_PROMPT(vibe), '2:3', '4K');
  const profileBuffer = await fetch(profileUrl).then(r => r.arrayBuffer());
  const profileBlobUrl = await uploadToBlob(profileBuffer, `characters/${slug}-profile-${Date.now()}.jpg`);
  console.log(`  ✓ Profile uploaded`);

  // 2. Upload profile to fal CDN so Kie.ai can reference it for the ref sheet
  const publicProfileUrl = await uploadToFalCdn(profileBuffer);

  // 3. Reference sheet (4K, 21:9) using profile as reference
  console.log(`  → Reference sheet...`);
  const refUrl = await generateImage(REFERENCE_SHEET_PROMPT(vibe), '21:9', '4K', [publicProfileUrl]);
  const refBuffer = await fetch(refUrl).then(r => r.arrayBuffer());
  const refBlobUrl = await uploadToBlob(refBuffer, `characters/${slug}-refsheet-${Date.now()}.jpg`);
  console.log(`  ✓ Reference sheet uploaded`);

  // 4. Thumbnails (parallel)
  console.log(`  → Thumbnails...`);
  const [profileThumb, refThumb] = await Promise.all([
    makeThumbnail(profileBuffer, slug, 'profile'),
    makeThumbnail(refBuffer, slug, 'refsheet'),
  ]);
  console.log(`  ✓ Thumbnails done`);

  return {
    img: profileBlobUrl,
    imgThumbnail: profileThumb,
    referenceSheetUrl: refBlobUrl,
    refSheetThumbnail: refThumb,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv[2];
  const characters = JSON.parse(readFileSync(CHARACTERS_FILE, 'utf8'));

  let targets;
  if (args) {
    const ids = args.split(',').map(Number);
    targets = characters.filter(c => ids.includes(c.id));
  } else {
    targets = characters.filter(c => !c.img || c.img === '');
  }

  if (!targets.length) {
    console.log('No characters to generate.');
    return;
  }

  console.log(`Generating ${targets.length} character(s): ${targets.map(c => `${c.id} (${c.name})`).join(', ')}`);

  for (const char of targets) {
    try {
      const updates = await generateCharacter(char);
      const idx = characters.findIndex(c => c.id === char.id);
      characters[idx] = { ...characters[idx], ...updates, hidden: false, createdAt: new Date().toISOString() };

      // Save locally
      writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));

      // Sync to Vercel Blob so the app reads the latest data
      await put('characters.json', JSON.stringify(characters, null, 2), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      console.log(`  ✓ ${char.name} saved and unhidden`);
    } catch (err) {
      console.error(`  ✗ ${char.name} FAILED: ${err.message}`);
    }
  }

  console.log('\nAll done!');
}

main().catch(err => { console.error(err); process.exit(1); });
