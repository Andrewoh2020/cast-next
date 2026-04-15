/**
 * Batch-generate environmental portrait variants for the 10 homepage marquee
 * characters. For each, runs Nano Banana 2 edit with a prompt that preserves
 * identity (face/skin/hair/body) while changing wardrobe to fit the scene.
 *
 * Outputs:
 *   - Local file: public/scene-portraits/<slug>.jpg (for local review)
 *   - Vercel Blob: scene-portraits/<slug>-<ts>.jpg (for production)
 *
 * The Blob URLs are appended to /tmp/marquee-scene-urls.json so we can wire
 * them into character data in a follow-up step.
 *
 * Usage:
 *   node scripts/generate-marquee-scenes.mjs              (all 10)
 *   node scripts/generate-marquee-scenes.mjs <slug>       (just one)
 *   DRY_RUN=1 node scripts/generate-marquee-scenes.mjs    (print prompts, don't call Fal)
 */

import { fal } from '@fal-ai/client';
import { put } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs/promises';
import path from 'node:path';

if (!process.env.FAL_API_KEY) {
  console.error('FAL_API_KEY missing.');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN missing.');
  process.exit(1);
}
fal.config({ credentials: process.env.FAL_API_KEY });

const DRY_RUN = !!process.env.DRY_RUN;

// Choose image-edit model. Override with MODEL=seedream | flux | nano (default).
const MODEL_PROVIDERS = {
  nano: {
    name: 'Nano Banana 2',
    endpoint: 'fal-ai/nano-banana-2/edit',
    buildInput: (prompt, imageUrl) => ({
      prompt,
      image_urls: [imageUrl],
      aspect_ratio: '3:4',
      resolution: '4K',
      num_images: 1,
    }),
  },
  seedream: {
    name: 'Seedream 5.0 Lite',
    endpoint: 'fal-ai/bytedance/seedream/v5/lite/edit',
    buildInput: (prompt, imageUrl) => ({
      prompt,
      image_urls: [imageUrl],
      aspect_ratio: '3:4',
    }),
  },
  flux: {
    name: 'Flux.2 Max',
    endpoint: 'fal-ai/flux-2-max/edit',
    buildInput: (prompt, imageUrl) => ({
      prompt,
      image_urls: [imageUrl],
      aspect_ratio: '3:4',
    }),
  },
};
const MODEL_KEY = (process.env.MODEL || 'nano').toLowerCase();
const MODEL = MODEL_PROVIDERS[MODEL_KEY];
if (!MODEL) {
  console.error(`Unknown MODEL="${MODEL_KEY}". Options: ${Object.keys(MODEL_PROVIDERS).join(', ')}`);
  process.exit(1);
}

// ── Scene assignments ───────────────────────────────────────────────────
// Each entry: the character's slug + the scene + the outfit for that scene.
// Identity is always preserved; wardrobe is always swapped to fit the scene.

const ASSIGNMENTS = [
  {
    slug: 'min-ji-park',
    scene: 'seated at a sunlit Seoul rooftop cafe at midday, soft matcha latte on the table in front of her, cream patio umbrella overhead, potted greenery and warm brick walls, city skyline softly blurred behind her',
    outfit: 'a cream trench coat over a black turtleneck and tailored charcoal trousers',
  },
  {
    slug: 'diego-mrquez',
    scene: 'seated at a Barcelona cafe terrace at golden hour, Gothic Quarter architecture behind him',
    outfit: 'a rolled-sleeve beige linen shirt and tan chinos',
  },
  {
    slug: 'black-man-mark-hall',
    scene: 'leaning against a grand piano in a dimly lit NYC jazz club, warm tungsten spotlights',
    outfit: 'a black three-piece pinstripe suit with a crisp white shirt',
  },
  {
    slug: 'dr-amara-okonkwo',
    scene: 'walking down a warmly lit hospital corridor, medical charts in hand, soft afternoon light through windows',
    outfit: "a white doctor's coat open over teal hospital scrubs, stethoscope around her neck",
  },
  {
    slug: 'akira-shimizu',
    scene: 'inside a quiet Tokyo bookstore cafe, tall walls of books, warm window light falling across the table',
    outfit: 'an oversized beige cable-knit sweater and wire-frame glasses',
  },
  {
    slug: 'moana-tui',
    scene: 'on a Pacific beach at sunrise, a wooden longboard planted in the sand beside her, gentle waves and palms in the background',
    outfit: 'a flowing ivory linen wrap dress and leather sandals',
  },
  {
    slug: 'koa-kahale',
    scene: 'standing on a weathered pier at golden hour after surfing, the Pacific glowing behind him',
    outfit: 'a wet black wetsuit half-unzipped to the waist',
  },
  {
    slug: 'viktor-rosenberg',
    scene: 'inside a grand old-world Vienna library, leather armchairs, warm lamplight falling across mahogany shelves',
    outfit: 'a navy wool tweed jacket over a charcoal turtleneck',
  },
  {
    slug: 'ratana-keo',
    scene: 'inside the stone courtyard of a Buddhist temple at dawn, soft morning mist, saffron pennants in the background',
    outfit: 'a traditional sampot-style wrap skirt in indigo with a cream cotton blouse',
  },
  {
    slug: 'takoda-birdsong',
    scene: 'standing on a vast open prairie at golden hour, tall wild grasses moving in the breeze, distant mountains',
    outfit: 'a sheepskin-lined denim jacket over a dark henley, a bone-beaded necklace',
  },
  // ── Batch 2 ──
  {
    slug: 'james-whitmore',
    scene: 'seated in a private London club library at evening, leather chesterfield chair, crystal tumbler on a side table, warm lamp light on mahogany shelves',
    outfit: 'a charcoal three-piece bespoke suit with a silk pocket square',
  },
  {
    slug: 'vera-liang',
    scene: 'inside a sleek modern research lab, clean white walls, glass beakers catching soft overhead light, quiet focus',
    outfit: 'a white lab coat over a minimalist black turtleneck',
  },
  {
    slug: 'katalin-kovcs',
    scene: 'at the barre of a sunlit Budapest ballet studio, polished hardwood floor, mirrored wall behind her, morning window light',
    outfit: 'a black dance leotard with soft wrap skirt and pointe shoes',
  },
  {
    slug: 'talia-nafanua',
    scene: 'walking along a black-sand Pacific coastal village beach at golden hour, palm trees and distant outrigger canoes behind her',
    outfit: 'a traditional ocean-blue lavalava wrap with a cream short-sleeve blouse, barefoot',
  },
  {
    slug: 'greta-lindstrm',
    scene: 'seated by a stone fireplace in a Scandinavian cabin, snow falling outside the window, warm firelight playing on wooden walls',
    outfit: 'an oversized cream cable-knit turtleneck sweater over dark denim, wool socks',
  },
  {
    slug: 'black-woman-amara-okonkwo-santos',
    scene: 'on a Rio de Janeiro rooftop bar at sunset, the city skyline glowing gold behind her, string lights overhead',
    outfit: 'a flowing emerald silk cocktail dress with gold hoop earrings',
  },
  {
    slug: 'european-man-declan-oshaughnessy',
    scene: 'standing on a windswept Irish coastal cliff, green fields rolling behind him, the Atlantic below, overcast soft light',
    outfit: 'a heavy navy wool peacoat over a cable-knit fisherman sweater',
  },
  {
    slug: 'european-man-marco-rossini',
    scene: 'on an Amalfi cliffside terrace at late afternoon, lemon trees and ceramic tiles, the Mediterranean glittering behind him',
    outfit: 'a cream linen summer suit with an open-collar white shirt, no tie',
  },
  {
    slug: 'tenzin-dorje',
    scene: 'in a Himalayan monastery courtyard at dawn, prayer flags strung overhead, cold mountain light catching his face',
    outfit: 'traditional maroon monastic robes over a saffron underlayer',
  },
  {
    slug: 'priya-sharma',
    scene: 'in a sunlit Jaipur palace courtyard, pink sandstone arches and intricate lattice screens behind her, soft golden afternoon light',
    outfit: 'a fuchsia silk sari with gold embroidery and matching bangles',
  },
];

// ── Fetch character data ────────────────────────────────────────────────
async function fetchCharacters() {
  const res = await fetch('http://localhost:3000/api/characters');
  if (!res.ok) throw new Error(`Dev server not reachable at 3000: ${res.status}`);
  return await res.json();
}

async function uploadProfileToFal(imageApiUrl) {
  const full = imageApiUrl.startsWith('http')
    ? imageApiUrl
    : `http://localhost:3000${imageApiUrl}&w=1200`;
  const r = await fetch(full);
  if (!r.ok) throw new Error(`Could not fetch image: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const file = new File([buf], 'profile.jpg', { type: 'image/jpeg' });
  return await fal.storage.upload(file);
}

function buildPrompt({ scene, outfit }) {
  return (
    `Place this person in a scene: ${scene}. ` +
    `Keep their face, skin tone, hair, and body type IDENTICAL to the reference — this must clearly be the same person, no facial changes. ` +
    `Change only their wardrobe to fit the scene: ${outfit}. ` +
    `CRITICAL lighting integration: the subject must be lit by the ambient scene light only — no studio lighting, no brightening of the subject relative to the environment. Match skin tone and exposure to the scene's ambient light (color temperature, shadows, contrast, reflections). The subject should sit in the scene naturally, not pop forward like a sticker. ` +
    `Photorealistic cinematic framing, 35mm film look, shallow depth of field, commercial editorial photography.`
  );
}

// ── Main ────────────────────────────────────────────────────────────────
async function processOne(assignment, character) {
  const prompt = buildPrompt(assignment);
  console.log(`\n━━━ ${character.name} (${assignment.slug}) ━━━`);
  console.log(`  Scene: ${assignment.scene}`);
  console.log(`  Outfit: ${assignment.outfit}`);

  if (DRY_RUN) {
    console.log('  [DRY RUN] skipping Fal call');
    return { slug: assignment.slug, dryRun: true };
  }

  console.log('  Uploading profile → Fal...');
  const profileUrl = await uploadProfileToFal(character.img);

  console.log(`  Running ${MODEL.name} edit...`);
  const result = await fal.subscribe(MODEL.endpoint, {
    input: MODEL.buildInput(prompt, profileUrl),
    onQueueUpdate: (u) => {
      if (u.status === 'IN_PROGRESS') process.stdout.write('.');
    },
  });
  const outUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url;
  if (!outUrl) throw new Error('No image URL in response');

  console.log(`\n  ✓ Generated: ${outUrl}`);

  // Download + save locally
  const outDir = path.join(process.cwd(), 'public', 'scene-portraits');
  await fs.mkdir(outDir, { recursive: true });
  const localPath = path.join(outDir, `${assignment.slug}.jpg`);
  const dl = await fetch(outUrl);
  const bytes = Buffer.from(await dl.arrayBuffer());
  await fs.writeFile(localPath, bytes);
  console.log(`  ✓ Saved locally: ${localPath} (${(bytes.length / 1024).toFixed(0)} KB)`);

  // Upload to private Blob (served via /api/media proxy)
  const ts = Date.now();
  const blobKey = `scene-portraits/${assignment.slug}-${ts}.jpg`;
  const blob = await put(blobKey, bytes, {
    access: 'private',
    contentType: 'image/jpeg',
    allowOverwrite: true,
  });
  const apiMediaPath = `/api/media?p=${encodeURIComponent(blobKey)}`;
  console.log(`  ✓ Uploaded to Blob: ${blob.url}`);
  console.log(`  ✓ Served at: ${apiMediaPath}`);

  return {
    slug: assignment.slug,
    localPath,
    blobUrl: blob.url,
    blobKey,
    apiMediaPath,
    falUrl: outUrl,
  };
}

async function main() {
  const filterSlug = process.argv[2];
  const targets = filterSlug ? ASSIGNMENTS.filter((a) => a.slug === filterSlug) : ASSIGNMENTS;
  if (targets.length === 0) {
    console.error(`No assignment for slug "${filterSlug}". Options: ${ASSIGNMENTS.map(a => a.slug).join(', ')}`);
    process.exit(1);
  }

  const characters = await fetchCharacters();
  const results = [];

  for (const a of targets) {
    const character = characters.find((c) => c.slug === a.slug);
    if (!character) {
      console.warn(`⚠ No character found for slug "${a.slug}" — skipping`);
      continue;
    }
    try {
      const r = await processOne(a, character);
      results.push(r);
    } catch (err) {
      console.error(`  ✗ FAILED for ${a.slug}: ${err?.message || err}`);
      if (err?.body) console.error('    body:', JSON.stringify(err.body).slice(0, 300));
      results.push({ slug: a.slug, error: err?.message || String(err) });
    }
  }

  // Write summary
  const summaryPath = '/tmp/marquee-scene-urls.json';
  await fs.writeFile(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\n━━━ Summary ━━━`);
  console.log(`Wrote ${results.length} results to ${summaryPath}`);
  for (const r of results) {
    if (r.error) console.log(`  ✗ ${r.slug}: ${r.error}`);
    else if (r.dryRun) console.log(`  — ${r.slug}: dry run`);
    else console.log(`  ✓ ${r.slug}: ${r.blobUrl}`);
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
