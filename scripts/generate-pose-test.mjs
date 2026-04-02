import { fal } from '@fal-ai/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

fal.config({ credentials: '71de193d-03a0-4bf9-a8d3-93adadaf8f88:9999baa35f642ede7752308e8aa8a8d2' });

const BASE_DESCRIPTION = 'Hailey Kim, a 28-year-old Korean-American woman, slim athletic build, long dark hair, sharp elegant features, wearing a dark blazer over a fitted top and tailored trousers. Plain seamless light warm-gray paper backdrop.';

const POSES = [
  { id: 1, slug: '01-arms-relaxed-weight-shifted', pose: 'arms relaxed naturally at sides, weight shifted slightly to one leg' },
  { id: 2, slug: '02-arms-crossed-head-tilt', pose: 'arms loosely crossed, relaxed and confident, slight head tilt' },
  { id: 3, slug: '03-hand-on-lapel', pose: 'one hand adjusting jacket lapel, other arm relaxed at side' },
  { id: 4, slug: '04-hands-clasped-front', pose: 'hands clasped together in front at waist level, open and approachable' },
  { id: 5, slug: '05-arm-bent-forearm', pose: 'one arm bent with hand resting on opposite forearm, relaxed stance' },
  { id: 6, slug: '06-slight-turn-mid-stride', pose: 'slight turn with one foot forward, arms hanging naturally, mid-stride feel' },
  { id: 7, slug: '07-hands-gesturing-chest', pose: 'hands lightly touching or gesturing near chest level, expressive and open' },
  { id: 8, slug: '08-hand-on-hip', pose: 'one hand resting on hip, other arm relaxed, confident stance' },
  { id: 9, slug: '09-hand-in-pocket', pose: 'one hand casually in pocket, other arm relaxed at side' },
];

const DOWNLOADS = join(process.env.HOME, 'Downloads');

async function generatePose(pose) {
  const prompt = `Full-body standing studio portrait, head to toe visible. The subject is ${BASE_DESCRIPTION}, standing upright in a relaxed natural pose, slight 3/4 angle to camera, ${pose.pose}. Soft even diffused studio lighting, clean catchlights, no harsh shadows. Sharp photorealistic DSLR photography, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no text overlays, no borders. No bokeh. No blurred background.`;

  console.log(`[${pose.id}/9] Generating: ${pose.slug}...`);

  const result = await fal.subscribe('fal-ai/nano-banana-2', {
    input: {
      prompt,
      num_images: 1,
      aspect_ratio: '2:3',
      resolution: '1K',
      output_format: 'jpeg',
    },
  });

  const images = result.data?.images ?? result.images;
  const imageUrl = images?.[0]?.url;
  if (!imageUrl) throw new Error(`No image URL for pose ${pose.id}`);

  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();
  const filepath = join(DOWNLOADS, `hailey-kim-pose-${pose.slug}.jpg`);
  writeFileSync(filepath, Buffer.from(buffer));
  console.log(`  ✓ Saved: ${filepath}`);
}

async function main() {
  console.log('Generating 9 pose test images for Hailey Kim...\n');
  for (const pose of POSES) {
    try {
      await generatePose(pose);
    } catch (err) {
      console.error(`  ✗ Failed pose ${pose.id}: ${err.message}`);
    }
  }
  console.log('\nDone!');
}

main();
