import { writeFileSync } from 'fs';
import { join } from 'path';

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
const API_KEY = 'daa4e2bede5608ceaf03f29037ade41b';

const characters = [
  { slug: 'marcus-cole', desc: 'Marcus Cole, a 35-year-old Black American man, athletic build, short fade haircut, strong jawline, warm confident expression' },
  { slug: 'elena-vasquez', desc: 'Elena Vasquez, a 42-year-old Mexican woman, curvy build, shoulder-length wavy dark hair, expressive brown eyes, radiant smile' },
  { slug: 'ravi-patel', desc: 'Ravi Patel, a 26-year-old Indian man, slim build, neatly styled dark hair, trimmed beard, sharp cheekbones, thoughtful gaze' },
];

async function generate(char) {
  const prompt = `Full-body portrait of ${char.desc}, head to toe visible. Clean neutral background, natural relaxed pose, sharp photorealistic DSLR photography style, Canon SL3 with 85mm lens, fine skin texture, no airbrushing, no CGI retouch, even studio lighting, no text overlays. HD quality.`;

  console.log(`Generating ${char.slug}...`);
  const createRes = await fetch(KIE_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nano-banana-2', input: { prompt, aspect_ratio: '2:3', resolution: '2K', output_format: 'jpg' } }),
  });
  const createData = await createRes.json();
  if (createData.code !== 200) throw new Error(`Kie.ai error: ${createData.msg}`);
  const taskId = createData.data.taskId;

  const start = Date.now();
  while (Date.now() - start < 120_000) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`${KIE_STATUS_URL}?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    const pollData = await pollRes.json();
    const state = pollData.data?.state;
    if (state === 'success') {
      const resultJson = JSON.parse(pollData.data.resultJson || '{}');
      const imageUrl = resultJson.resultUrls?.[0];
      const imgRes = await fetch(imageUrl);
      const buffer = await imgRes.arrayBuffer();
      const filepath = join(process.env.HOME, 'Downloads', `test-${char.slug}.jpg`);
      writeFileSync(filepath, Buffer.from(buffer));
      console.log(`  ✓ ${filepath}`);
      return;
    }
    if (state === 'fail') throw new Error(`Failed: ${pollData.data.failMsg}`);
  }
  throw new Error('Timed out');
}

// Run all 3 in parallel
await Promise.all(characters.map(c => generate(c)));
console.log('\nDone!');
