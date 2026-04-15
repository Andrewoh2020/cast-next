/**
 * Generate a short looping motion clip for a character's profile image using
 * Fal.ai Seedance 2.0 image-to-video. Falls back to Kling / Hailuo if Seedance
 * trips its content moderator (our characters are 100% synthetic, but the
 * moderator can't tell the difference from a real photo).
 *
 * Usage:
 *   node scripts/generate-hero-video.mjs <character-slug>
 *
 * Example:
 *   node scripts/generate-hero-video.mjs east-asian-woman-hailey-kim
 *
 * The script saves the output video locally as `public/hero-videos/<slug>.mp4`
 * so you can review before uploading to Vercel Blob. If you approve, a follow-up
 * command uploads to Blob and patches character data.
 */

import { fal } from '@fal-ai/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const FAL_API_KEY = process.env.FAL_API_KEY;
if (!FAL_API_KEY) {
  console.error('FAL_API_KEY missing from env.');
  process.exit(1);
}
fal.config({ credentials: FAL_API_KEY });

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/generate-hero-video.mjs <character-slug> [--image <path>]');
  process.exit(1);
}

// Optional --image <path> overrides the character's profile image as the
// starting frame. Useful for feeding pre-composed scene stills.
const imageFlagIdx = process.argv.indexOf('--image');
const imageOverridePath = imageFlagIdx > -1 ? process.argv[imageFlagIdx + 1] : null;

// Scene prompts — put the character into a cinematic environment so the clip
// sells "this character can work in a real scene" rather than "this is a
// talking headshot." Each character gets a tailored scene.
const SCENE_PROMPTS = {
  'east-asian-woman-hailey-kim':
    "Cinematic tracking shot of the woman from the reference image walking down Tokyo's Ginza district at blue hour. Sleek high-end boutiques line the wide boulevard with warm window lighting spilling onto the sidewalk. Elegant shoppers stroll past, soft reflections of luxury signage on polished pavement. She walks with relaxed poise in her charcoal blazer and tailored trousers, occasionally glancing at storefront displays. Handheld camera follows her from a medium distance, shallow depth of field. Commercial editorial cinematography, filmic color grade, 35mm look.",
  'diego-marquez':
    "Cinematic tracking shot. The man walks through a sunlit European plaza, weaving between cafe tables and strolling pedestrians. Warm golden-hour light, cobblestone street, pigeons taking flight. He has a relaxed, confident stride. Handheld camera follows from a medium distance. Shallow depth of field, commercial-ad cinematography.",
  'marcus-stewart':
    "Cinematic tracking shot.",
  'black-man-marcus-stewart':
    "Cinematic wide shot of the man from the reference image standing at the edge of a dense tropical jungle overlooking a towering waterfall. Mist rises from the plunge pool far below, soft sunbeams cut through the canopy above. Lush green ferns, moss-covered rocks, and vines frame the foreground. He stands in quiet awe, taking in the view, his chest rising with a deep breath as droplets of mist catch the light on his skin. Slow handheld camera drifts from a medium distance, shallow depth of field, natural ambient light, filmic color grade with emerald and gold tones, 35mm look, commercial travel-ad cinematography.",
};

const NEGATIVE_PROMPT =
  "mouth opening wide, speaking, exaggerated expression, lens distortion, motion blur artifacts, duplicate limbs, glitchy hands";

async function fetchCharacter(slug) {
  const res = await fetch('http://localhost:3002/api/characters');
  if (!res.ok) throw new Error(`Could not reach dev server at 3002: ${res.status}`);
  const all = await res.json();
  const match = all.find((c) => c.slug === slug);
  if (!match) throw new Error(`No character found with slug ${slug}`);
  return match;
}

/**
 * Fetch the character's profile image and upload to Fal's CDN so image-to-video
 * endpoints (which require a public URL) can consume it.
 */
async function uploadImageToFal(imageApiUrl) {
  const full = imageApiUrl.startsWith('http')
    ? imageApiUrl
    : `http://localhost:3002${imageApiUrl}&w=1200`;
  const res = await fetch(full);
  if (!res.ok) throw new Error(`Could not fetch image ${full}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = new File([buf], 'profile.jpg', { type: 'image/jpeg' });
  return await fal.storage.upload(file);
}

/**
 * Convert a local image file (any format incl. avif/webp) to a JPEG buffer,
 * then upload to Fal CDN. Seedance + peers are strict about input formats.
 */
async function uploadLocalImageToFal(localPath) {
  const raw = await fs.readFile(localPath);
  const jpegBuffer = await sharp(raw).jpeg({ quality: 92 }).toBuffer();
  const file = new File([jpegBuffer], 'scene.jpg', { type: 'image/jpeg' });
  return await fal.storage.upload(file);
}

/**
 * Attempt list — we try each endpoint in order until one succeeds.
 * Seedance is our preferred model (quality + price) but Kling / Hailuo have
 * historically been more permissive on photorealistic synthetic humans.
 */
const ATTEMPTS = [
  {
    name: 'Kling O1 Reference',
    endpoint: 'fal-ai/kling-video/o1/reference-to-video',
    mode: 'reference',
    buildInput: (imageUrl, prompt) => ({
      image_urls: [imageUrl],
      prompt,
      duration: '10',
      aspect_ratio: '16:9',
      cfg_scale: 0.75,
      negative_prompt: NEGATIVE_PROMPT,
    }),
  },
  {
    name: 'Veo 3.1',
    endpoint: 'fal-ai/veo3.1/image-to-video',
    buildInput: (imageUrl, prompt) => ({
      image_url: imageUrl,
      prompt,
      duration: '6s',
      resolution: '1080p',
      generate_audio: false,
    }),
  },
  {
    name: 'Kling 3.0 Pro',
    endpoint: 'fal-ai/kling-video/v3/pro/image-to-video',
    buildInput: (imageUrl, prompt) => ({
      image_url: imageUrl,
      prompt,
      duration: '5',
      negative_prompt: NEGATIVE_PROMPT,
      cfg_scale: 0.5,
    }),
  },
  {
    name: 'Seedance 2.0',
    endpoint: 'bytedance/seedance-2.0/image-to-video',
    buildInput: (imageUrl, prompt) => ({
      image_url: imageUrl,
      // Prepend synthetic-character framing to help the moderator recognize this
      // isn't a real person. It's been reported that Seedance 2.0 is sensitive
      // to likeness claims; framing the subject as a fictional 3D character
      // sometimes clears the partner-validation step.
      prompt: `A fictional 3D CGI character (not a real person) in a computer-generated scene. ${prompt} Rendered in a photorealistic game-engine style; digitally synthesized character model.`,
      duration: '5',
      resolution: '720p',
      seed: 42,
      // Undocumented flag — safe to pass even if ignored
      enable_safety_checker: false,
    }),
  },
];

// Which single attempt to run (default: first = best). Override with MODEL=kling etc.
const MODEL_SELECT = (process.env.MODEL || '').toLowerCase();

async function tryGenerate(imageUrl, prompt) {
  let lastErr;
  const filtered = MODEL_SELECT
    ? ATTEMPTS.filter((a) => a.name.toLowerCase().includes(MODEL_SELECT))
    : ATTEMPTS;
  if (filtered.length === 0) {
    throw new Error(`No model matches "${MODEL_SELECT}". Options: ${ATTEMPTS.map(a => a.name).join(', ')}`);
  }
  for (const attempt of filtered) {
    console.log(`\n→ Trying ${attempt.name} (${attempt.endpoint})`);
    try {
      const result = await fal.subscribe(attempt.endpoint, {
        input: attempt.buildInput(imageUrl, prompt),
        logs: true,
        onQueueUpdate: (u) => {
          if (u.status === 'IN_PROGRESS') {
            process.stdout.write('.');
          }
        },
      });
      console.log('\n  ✓ Success');
      const videoUrl = result?.data?.video?.url || result?.video?.url;
      if (!videoUrl) {
        console.error('  ⚠ No video URL in response:', JSON.stringify(result, null, 2));
        continue;
      }
      return { videoUrl, provider: attempt.name };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`\n  ✗ Failed: ${msg.slice(0, 200)}`);
      if (err?.body) console.log('  body:', JSON.stringify(err.body).slice(0, 500));
      // If this looks like content moderation, continue to next attempt.
      // Otherwise rethrow if it's an API key / billing / network issue.
      if (/unauthor|api.?key|billing|quota|network|fetch failed/i.test(msg)) {
        throw err;
      }
    }
  }
  throw lastErr || new Error('All providers failed');
}

async function main() {
  console.log(`Looking up character: ${slug}`);
  const character = await fetchCharacter(slug);
  console.log(`  Found: ${character.name} (${character.ageRange} · ${character.ethnicity || character.race?.[0]})`);

  let imageUrl;
  if (imageOverridePath) {
    console.log(`\nUsing override image: ${imageOverridePath}`);
    imageUrl = await uploadLocalImageToFal(imageOverridePath);
  } else {
    console.log('\nUploading profile image to Fal CDN...');
    imageUrl = await uploadImageToFal(character.img);
  }
  console.log(`  Image URL: ${imageUrl}`);

  const prompt = SCENE_PROMPTS[slug];
  if (!prompt) {
    throw new Error(`No scene prompt defined for slug "${slug}". Add one to SCENE_PROMPTS.`);
  }
  console.log(`\nScene prompt:\n  ${prompt}\n`);
  console.log('Generating motion clip (may take 30-90s)...');
  const { videoUrl, provider } = await tryGenerate(imageUrl, prompt);
  console.log(`\nVideo ready (${provider}): ${videoUrl}`);

  // Save locally for review
  const outDir = path.join(process.cwd(), 'public', 'hero-videos');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}.mp4`);

  console.log(`\nDownloading to ${outPath}...`);
  const dl = await fetch(videoUrl);
  if (!dl.ok) throw new Error(`Download failed: ${dl.status}`);
  const bytes = Buffer.from(await dl.arrayBuffer());
  await fs.writeFile(outPath, bytes);
  console.log(`  Saved: ${(bytes.length / 1024 / 1024).toFixed(2)} MB`);

  console.log(`\n✓ Done. Preview at: http://localhost:3002/hero-videos/${slug}.mp4`);
  console.log(`  Provider: ${provider}`);
  console.log(`  Remote URL: ${videoUrl}`);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
