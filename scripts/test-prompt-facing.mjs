import { fal } from '@fal-ai/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

fal.config({ credentials: '71de193d-03a0-4bf9-a8d3-93adadaf8f88:9999baa35f642ede7752308e8aa8a8d2' });

const description = 'Hailey Kim, a 28-year-old Korean-American woman, slim athletic build, long dark hair, sharp elegant features';

// Current prompt (with 3/4 angle) — for reference
// const prompt = `Full-body standing studio portrait, head to toe visible. The subject is ${description}, standing upright in a relaxed natural pose, slight 3/4 angle to camera, arms relaxed naturally at sides, weight shifted slightly to one leg. ...`;

// Test prompt — facing camera directly, no 3/4 angle
const prompt = `Full-body standing studio portrait, head to toe visible. The subject is ${description}, standing upright in a relaxed natural pose, arms relaxed naturally at sides, weight shifted slightly to one leg. Wearing smart casual or professional business attire — dark blazer over a fitted top, tailored trousers or dress pants. Plain seamless light warm-gray paper backdrop, completely flat and uniform, solid color, no texture, no bokeh, no depth-of-field blur, no patterns. Soft even diffused studio lighting, clean catchlights, no harsh shadows. Sharp photorealistic DSLR photography, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no CGI retouch, no text overlays, no borders, no lines, no frames. HD quality. Not outdoors. No sports clothing, gym wear, uniforms, scrubs, jerseys, or occupation-specific costumes. No outdoor backgrounds, sports fields, gyms, kitchens, hospitals, offices, furniture, or architectural elements. No bokeh. No blurred background.`;

console.log('Generating test image (no 3/4 angle)...');

const result = await fal.subscribe('fal-ai/nano-banana-2', {
  input: { prompt, num_images: 1, aspect_ratio: '2:3', resolution: '2K', output_format: 'jpeg' },
});

const images = result.data?.images ?? result.images;
const imageUrl = images?.[0]?.url;
if (!imageUrl) throw new Error('No image URL returned');

const res = await fetch(imageUrl);
const buffer = await res.arrayBuffer();
const filepath = join(process.env.HOME, 'Downloads', 'test-facing-camera.jpg');
writeFileSync(filepath, Buffer.from(buffer));
console.log(`Saved: ${filepath}`);
