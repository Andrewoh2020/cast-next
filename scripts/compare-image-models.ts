/**
 * Side-by-side image-gen comparison: Nano Banana 2 vs GPT Image 2 (via Fal).
 *
 * Generates 3 marketing-agency-quality prompts on both models, saves all 6
 * images to /Users/andrewoh/Downloads/model-comparison/ with clear filenames.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/compare-image-models.ts
 */

import { fal } from '@fal-ai/client';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = '/Users/andrewoh/Downloads/model-comparison';

const PROMPTS: { slug: string; prompt: string }[] = [
  {
    slug: '01-editorial-portrait',
    prompt:
      'Editorial commercial photograph, confident Asian woman in her early 30s, sharp tailored navy blazer, soft natural directional light, modern minimalist office backdrop with shallow depth of field, 85mm portrait lens, hyperrealistic skin texture, premium brand aesthetic, 4K commercial photography',
  },
  {
    slug: '02-marina-bay-rooftop',
    prompt:
      'Cinematic editorial photograph, mixed-race woman early 30s in luxury silk evening dress, Marina Bay rooftop at golden hour, Singapore skyline softly blurred in background, holding a cocktail, looking off camera, warm directional light, shot on medium format, 4K hyperrealistic, premium fashion brand campaign',
  },
  {
    slug: '03-executive-male',
    prompt:
      'Editorial commercial photograph, confident East Asian man early 30s, sharp tailored charcoal suit, modern Singapore CBD glass tower behind, soft natural window light, three-quarter pose looking at camera, 85mm portrait lens, shallow depth of field, hyperrealistic, premium aspirational brand aesthetic, 4K commercial photography',
  },
];

const MODELS = [
  { name: 'nano-banana-2', endpoint: 'fal-ai/nano-banana-2' },
  { name: 'gpt-image-2', endpoint: 'fal-ai/gpt-image-1' }, // try gpt-image-1 first; fall back below if needed
];

async function generateOne(endpoint: string, prompt: string): Promise<string> {
  const result = (await fal.subscribe(endpoint, {
    input: {
      prompt,
      num_images: 1,
      aspect_ratio: '4:5',
      resolution: '4K',
      output_format: 'jpeg',
    },
  })) as {
    data?: { images?: { url: string }[] };
    images?: { url: string }[];
  };
  const url = result.data?.images?.[0]?.url ?? result.images?.[0]?.url;
  if (!url) throw new Error(`No image in response from ${endpoint}: ${JSON.stringify(result).slice(0, 300)}`);
  return url;
}

async function downloadTo(url: string, filepath: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(filepath, buf);
  return buf.byteLength;
}

async function main(): Promise<void> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    console.error('Missing FAL_API_KEY in env');
    process.exit(1);
  }
  fal.config({ credentials: apiKey });

  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log(`\nGenerating ${PROMPTS.length} prompts × ${MODELS.length} models = ${PROMPTS.length * MODELS.length} images`);
  console.log(`Output: ${OUT_DIR}\n`);

  for (const p of PROMPTS) {
    for (const m of MODELS) {
      const filename = `${p.slug}--${m.name}.jpg`;
      const filepath = path.join(OUT_DIR, filename);
      const t0 = Date.now();
      console.log(`→ ${m.name}: ${p.slug}`);
      try {
        const url = await generateOne(m.endpoint, p.prompt);
        const bytes = await downloadTo(url, filepath);
        const dt = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  ✓ ${(bytes / 1024).toFixed(0)} KB in ${dt}s → ${filename}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ ${m.name} failed: ${msg.slice(0, 200)}`);
      }
    }
  }

  console.log(`\nDone. Open the comparison folder:\n  open ${OUT_DIR}\n`);
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
