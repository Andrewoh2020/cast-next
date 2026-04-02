import { writeFileSync } from 'fs';
import { join } from 'path';

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
const API_KEY = 'daa4e2bede5608ceaf03f29037ade41b';

const description = 'Hailey Kim, a 28-year-old Korean-American woman, slim athletic build, long dark hair, sharp elegant features';

// Exact March 25th prompt
const prompt = `Mid-body portrait of ${description}. Clean neutral background, natural relaxed pose, sharp photorealistic DSLR photography style, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no CGI retouch, even studio lighting, no text overlays. HD quality.`;

console.log('Generating with March 25th prompt via Kie.ai...');
const createRes = await fetch(KIE_API_URL, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'nano-banana-2', input: { prompt, aspect_ratio: '2:3', resolution: '2K', output_format: 'jpg' } }),
});
const createData = await createRes.json();
if (createData.code !== 200) throw new Error(`Kie.ai error: ${createData.msg}`);
const taskId = createData.data.taskId;
console.log(`Task: ${taskId}`);

const start = Date.now();
while (Date.now() - start < 120_000) {
  await new Promise(r => setTimeout(r, 2000));
  const pollRes = await fetch(`${KIE_STATUS_URL}?taskId=${taskId}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  });
  const pollData = await pollRes.json();
  const state = pollData.data?.state;
  process.stdout.write(`\r  ${state}...`);
  if (state === 'success') {
    const resultJson = JSON.parse(pollData.data.resultJson || '{}');
    const imageUrl = resultJson.resultUrls?.[0];
    console.log('\nDownloading...');
    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.arrayBuffer();
    const filepath = join(process.env.HOME, 'Downloads', 'test-march25-prompt.jpg');
    writeFileSync(filepath, Buffer.from(buffer));
    console.log(`Saved: ${filepath}`);
    process.exit(0);
  }
  if (state === 'fail') throw new Error(`Failed: ${pollData.data.failMsg}`);
}
throw new Error('Timed out');
