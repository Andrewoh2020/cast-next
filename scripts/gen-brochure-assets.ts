/**
 * Generate the 6 brochure prompts on both Nano Banana 2 (Fal) and GPT Image (OpenAI).
 * 6 prompts × 2 models = 12 images, saved to /Users/andrewoh/Downloads/brochure-images/.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/gen-brochure-assets.ts
 */

import { fal } from '@fal-ai/client';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = '/Users/andrewoh/Downloads/brochure-images';

// 6 prompts: 3 cover panels (tight editorial portraits) + 3 step illustrations.
const PROMPTS: { slug: string; role: 'cover' | 'step'; prompt: string }[] = [
  // ── COVER PANELS — tight editorial portraits, premium feel ──
  {
    slug: 'cover-1-asian-woman-blazer',
    role: 'cover',
    prompt:
      'Editorial commercial photograph, confident East Asian woman in her early 30s, sharp tailored navy blazer, soft natural directional light, modern minimalist office backdrop with shallow depth of field, 85mm portrait lens, hyperrealistic skin texture, premium brand aesthetic, vertical 4:5 portrait composition, 4K commercial photography',
  },
  {
    slug: 'cover-2-executive-male',
    role: 'cover',
    prompt:
      'Editorial commercial photograph, confident East Asian man early 30s, sharp tailored charcoal suit, modern Singapore CBD glass tower behind, soft natural window light, three-quarter pose looking at camera, 85mm portrait lens, shallow depth of field, hyperrealistic, premium aspirational brand aesthetic, vertical 4:5 portrait composition, 4K commercial photography',
  },
  {
    slug: 'cover-3-south-asian-woman',
    role: 'cover',
    prompt:
      'Editorial commercial photograph, confident South Asian woman early 30s, modern silk wrap dress in deep burgundy, soft golden directional light, minimalist warm beige backdrop, 85mm portrait lens, shallow depth of field, hyperrealistic skin texture, premium fashion brand aesthetic, vertical 4:5 portrait composition, 4K commercial photography',
  },

  // ── STEP ILLUSTRATIONS — fuller-body, scene/context, show product range ──
  {
    slug: 'step-1-create-character',
    role: 'step',
    prompt:
      'Studio reference photograph, Filipino woman 30s, urban professional, sharp smart-casual outfit, plain warm grey seamless backdrop, soft beauty lighting, three-quarter front pose, neutral confident expression, hyperrealistic, vertical 4:5 portrait composition, 4K commercial casting reference photo',
  },
  {
    slug: 'step-2-dress-stage',
    role: 'step',
    prompt:
      'Cinematic editorial photograph, woman early 30s in luxury black blazer with gold accessories, Marina Bay rooftop at golden hour, Singapore skyline softly blurred in background, holding a cocktail, looking off camera, warm directional light, shallow depth of field, shot on medium format, vertical 4:5 portrait composition, 4K hyperrealistic, premium fashion brand campaign',
  },
  {
    slug: 'step-3-export-cinematic',
    role: 'step',
    prompt:
      'Cinematic commercial photograph, confident mixed-race woman in tailored white blazer against modern Singapore architecture backdrop, soft natural light, three-quarter pose, premium fashion brand aesthetic, shallow depth of field, hyperrealistic, vertical 4:5 portrait composition, 4K editorial photography',
  },
];

async function genNanoBanana(prompt: string): Promise<Buffer> {
  const result = (await fal.subscribe('fal-ai/nano-banana-2', {
    input: { prompt, num_images: 1, aspect_ratio: '4:5', resolution: '4K', output_format: 'jpeg' },
  })) as { data?: { images?: { url: string }[] }; images?: { url: string }[] };
  const url = result.data?.images?.[0]?.url ?? result.images?.[0]?.url;
  if (!url) throw new Error('NB2: no image url');
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

async function genGptImage(prompt: string, apiKey: string): Promise<Buffer> {
  // OpenAI Image generation. gpt-image-1 is GA; gpt-image-2 may not exist yet.
  // Try gpt-image-2 first, fall back to gpt-image-1 on 404.
  const tryModel = async (model: string) => {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        size: '1024x1536',  // closest to 4:5 portrait
        n: 1,
        quality: 'high',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`OpenAI ${model} ${res.status}: ${text.slice(0, 200)}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    const data = (await res.json()) as { data: { b64_json?: string; url?: string }[] };
    const item = data.data?.[0];
    if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
    if (item?.url) {
      const r = await fetch(item.url);
      return Buffer.from(await r.arrayBuffer());
    }
    throw new Error(`OpenAI ${model}: no image data`);
  };

  try {
    return await tryModel('gpt-image-2');
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status === 404 || (err instanceof Error && /model/i.test(err.message))) {
      console.log('    (gpt-image-2 unavailable, falling back to gpt-image-1)');
      return await tryModel('gpt-image-1');
    }
    throw err;
  }
}

async function genOne(model: 'nb2' | 'gpt', prompt: string, apiKey: string): Promise<Buffer> {
  return model === 'nb2' ? genNanoBanana(prompt) : genGptImage(prompt, apiKey);
}

async function main(): Promise<void> {
  const falKey = process.env.FAL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!falKey) { console.error('Missing FAL_API_KEY'); process.exit(1); }
  if (!openaiKey) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }
  fal.config({ credentials: falKey });

  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log(`\nGenerating ${PROMPTS.length} prompts × 2 models = ${PROMPTS.length * 2} images`);
  console.log(`Output: ${OUT_DIR}\n`);

  // Run NB2 calls in parallel (Fal handles concurrency); run GPT calls in parallel.
  // Total ~6 in flight per model.

  const tasks: Promise<void>[] = [];
  for (const p of PROMPTS) {
    for (const model of ['nb2', 'gpt'] as const) {
      const ext = model === 'nb2' ? 'jpg' : 'png';
      const filepath = path.join(OUT_DIR, `${p.slug}--${model}.${ext}`);
      tasks.push(
        (async () => {
          const t0 = Date.now();
          console.log(`  → ${model}: ${p.slug}`);
          try {
            const buf = await genOne(model, p.prompt, openaiKey);
            await fs.writeFile(filepath, buf);
            const dt = ((Date.now() - t0) / 1000).toFixed(1);
            console.log(`    ✓ ${(buf.byteLength / 1024).toFixed(0)} KB in ${dt}s`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`    ✗ ${model} ${p.slug}: ${msg.slice(0, 200)}`);
          }
        })(),
      );
    }
  }

  await Promise.all(tasks);
  console.log('\n✅ Done.\n');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
