import { writeFileSync } from 'fs';
import { join } from 'path';

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
const API_KEY = 'daa4e2bede5608ceaf03f29037ade41b';

const description = 'Hailey Kim, a 28-year-old Korean-American woman, slim athletic build, long dark hair, sharp elegant features';

const prompt = `Full-body standing studio portrait, head to toe visible. The subject is ${description}, standing upright in a relaxed natural pose, arms relaxed naturally at sides, weight shifted slightly to one leg. Wearing smart casual or professional business attire — dark blazer over a fitted top, tailored trousers or dress pants. Plain seamless light warm-gray paper backdrop, completely flat and uniform, solid color, no texture, no bokeh, no depth-of-field blur, no patterns. Soft even diffused studio lighting, clean catchlights, no harsh shadows. Sharp photorealistic DSLR photography, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no CGI retouch, no text overlays, no borders, no lines, no frames. HD quality. Not outdoors. No bokeh. No blurred background.`;

console.log('Creating Kie.ai task...');
const createRes = await fetch(KIE_API_URL, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'nano-banana-2', input: { prompt, aspect_ratio: '2:3', resolution: '2K', output_format: 'jpg' } }),
});
const createData = await createRes.json();
if (createData.code !== 200) throw new Error(`Kie.ai error: ${createData.msg}`);
const taskId = createData.data.taskId;
console.log(`Task created: ${taskId}`);

// Poll for result
const start = Date.now();
while (Date.now() - start < 120_000) {
  await new Promise(r => setTimeout(r, 2000));
  const pollRes = await fetch(`${KIE_STATUS_URL}?taskId=${taskId}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  });
  const pollData = await pollRes.json();
  const state = pollData.data?.state;
  process.stdout.write(`\r  State: ${state}...`);

  if (state === 'success') {
    const resultJson = JSON.parse(pollData.data.resultJson || '{}');
    const imageUrl = resultJson.resultUrls?.[0];
    if (!imageUrl) throw new Error('No image URL in result');
    console.log(`\nDownloading...`);
    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.arrayBuffer();
    const filepath = join(process.env.HOME, 'Downloads', 'test-facing-camera-kie.jpg');
    writeFileSync(filepath, Buffer.from(buffer));
    console.log(`Saved: ${filepath}`);
    process.exit(0);
  }
  if (state === 'fail') throw new Error(`Kie.ai failed: ${pollData.data.failMsg}`);
}
throw new Error('Timed out after 2 minutes');
