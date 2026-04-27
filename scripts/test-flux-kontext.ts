/**
 * One-off test: Flux Kontext Pro outfit-edit.
 *
 * Tests whether Flux Kontext is permissive enough to do swimwear edits that
 * Nano Banana 2 / GPT-Image-2 reject or downgrade.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/test-flux-kontext.ts \
 *     --image /path/to/input.jpg --prompt "..." [--out ~/Downloads/foo.jpg]
 */

import { fal } from '@fal-ai/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

fal.config({ credentials: process.env.FAL_API_KEY });

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const imagePath = arg('image');
  const prompt = arg('prompt');
  const outPath = arg('out') ?? path.join(os.homedir(), 'Downloads', `cast-kontext-${Date.now()}.jpg`);

  if (!imagePath || !prompt) {
    console.error('Usage: --image <path> --prompt "..." [--out <path>]');
    process.exit(1);
  }
  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    process.exit(1);
  }

  console.log(`\nFlux Kontext Pro test`);
  console.log(`   Input:  ${imagePath}`);
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Output: ${outPath}\n`);

  // Upload the input image to Fal storage
  console.log(`Uploading input image to Fal…`);
  const buffer = fs.readFileSync(imagePath);
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const file = new File([blob], path.basename(imagePath), { type: 'image/jpeg' });
  const inputUrl = await fal.storage.upload(file);
  console.log(`   Uploaded: ${inputUrl}\n`);

  // Submit Flux Kontext Pro edit
  console.log(`Submitting Flux Kontext Pro edit…`);
  const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
    input: {
      prompt,
      image_url: inputUrl,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        for (const msg of update.logs ?? []) {
          if (msg.message) console.log(`   [fal] ${msg.message}`);
        }
      }
    },
  }) as unknown as {
    data: { images?: Array<{ url: string }>; image?: { url: string } };
    requestId?: string;
  };

  // Resolve output URL (Kontext returns either { image } or { images: [...] })
  const data = result.data ?? (result as unknown as { images?: Array<{ url: string }>; image?: { url: string } });
  const outputUrl = data.images?.[0]?.url ?? data.image?.url;
  if (!outputUrl) {
    console.error(`No output URL in response:`, JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log(`\nGeneration complete: ${outputUrl}`);

  // Download
  const dl = await fetch(outputUrl);
  if (!dl.ok) throw new Error(`Download failed: ${dl.status}`);
  const out = Buffer.from(await dl.arrayBuffer());
  fs.writeFileSync(outPath, out);
  console.log(`✅ Saved to ${outPath}\n`);
}

main().catch((err) => {
  console.error('Test failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
