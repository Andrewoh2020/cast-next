/**
 * Generate a scene-placed still of a character using Fal Nano Banana 2 edit.
 * Takes the character's profile image and an edit prompt describing the scene.
 *
 * Usage:
 *   node scripts/generate-scene-still.mjs <slug> "<edit prompt>" [--out <path>]
 */

import { fal } from '@fal-ai/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs/promises';
import path from 'node:path';

if (!process.env.FAL_API_KEY) {
  console.error('FAL_API_KEY missing.');
  process.exit(1);
}
fal.config({ credentials: process.env.FAL_API_KEY });

const [, , slug, editPrompt, ...rest] = process.argv;
if (!slug || !editPrompt) {
  console.error('Usage: node scripts/generate-scene-still.mjs <slug> "<prompt>" [--out <path>]');
  process.exit(1);
}
const outIdx = rest.indexOf('--out');
const outPath = outIdx > -1 ? rest[outIdx + 1] : `/tmp/${slug}-scene.jpg`;

async function fetchCharacter(slug) {
  const res = await fetch('http://localhost:3002/api/characters');
  const all = await res.json();
  return all.find((c) => c.slug === slug) || null;
}

async function uploadProfileToFal(imageApiUrl) {
  const full = imageApiUrl.startsWith('http')
    ? imageApiUrl
    : `http://localhost:3002${imageApiUrl}&w=1200`;
  const r = await fetch(full);
  const buf = Buffer.from(await r.arrayBuffer());
  const file = new File([buf], 'profile.jpg', { type: 'image/jpeg' });
  return await fal.storage.upload(file);
}

async function main() {
  const character = await fetchCharacter(slug);
  if (!character) throw new Error(`No character ${slug}`);
  console.log(`Character: ${character.name}`);

  const profileUrl = await uploadProfileToFal(character.img);
  console.log(`Uploaded profile: ${profileUrl}`);

  console.log(`\nEditing via Nano Banana 2...\n  prompt: ${editPrompt}\n`);
  const result = await fal.subscribe('fal-ai/nano-banana-2/edit', {
    input: {
      prompt: editPrompt,
      image_urls: [profileUrl],
      aspect_ratio: '16:9',
      resolution: '2K',
      num_images: 1,
    },
    logs: true,
    onQueueUpdate: (u) => {
      if (u.status === 'IN_PROGRESS') process.stdout.write('.');
    },
  });

  const outUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url;
  if (!outUrl) {
    console.error('\nNo image URL in response:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(`\n✓ Got: ${outUrl}`);

  const dl = await fetch(outUrl);
  const bytes = Buffer.from(await dl.arrayBuffer());
  await fs.writeFile(outPath, bytes);
  console.log(`✓ Saved: ${outPath} (${(bytes.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => {
  console.error('\nFATAL:', e?.message || e);
  if (e?.body) console.error('body:', JSON.stringify(e.body).slice(0, 500));
  process.exit(1);
});
