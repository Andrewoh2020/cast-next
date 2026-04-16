/**
 * Backfill heightCm and weightKg for all characters missing them.
 * Uses Claude to infer realistic numbers from existing attributes.
 *
 * Usage:
 *   node scripts/backfill-height-weight.mjs           (all missing)
 *   node scripts/backfill-height-weight.mjs <slug>    (one character)
 *   DRY_RUN=1 node scripts/backfill-height-weight.mjs (preview only)
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DRY_RUN = !!process.env.DRY_RUN;
const filterSlug = process.argv[2];

async function fetchCharacters() {
  const res = await fetch('http://localhost:3000/api/characters');
  return await res.json();
}

async function inferHeightWeight(character) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Given this character profile, provide realistic height (cm) and weight (kg). Use real-world population data for their demographics.

Name: ${character.name}
Sex: ${character.sex}
Age: ${character.age || character.ageRange}
Build: ${character.build}
Height category: ${character.height}
Ethnicity: ${character.ethnicity || ''}
Race: ${(character.race || []).join(', ')}

Respond with ONLY JSON: {"heightCm": number, "weightKg": number}
No other text.`,
    }],
  });

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

async function main() {
  const characters = await fetchCharacters();
  const targets = characters.filter(c => {
    if (filterSlug && c.slug !== filterSlug) return false;
    return !c.heightCm || !c.weightKg;
  });

  console.log(`Found ${targets.length} characters missing height/weight`);

  const results = [];
  for (const c of targets) {
    process.stdout.write(`  ${c.name} (${c.slug})... `);
    try {
      const { heightCm, weightKg } = await inferHeightWeight(c);
      console.log(`${heightCm}cm / ${weightKg}kg`);
      results.push({ slug: c.slug, id: c.id, heightCm, weightKg });
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would update:', results.length, 'characters');
    return;
  }

  // Apply via the characters API
  console.log(`\nApplying ${results.length} updates...`);

  // Read from blob, update, write back
  const { get, put } = await import('@vercel/blob');
  const BLOB_KEY = 'characters.json';
  const result = await get(BLOB_KEY, { access: 'private', useCache: false });
  const text = await new Response(result.stream).text();
  const allChars = JSON.parse(text);

  let patched = 0;
  for (const r of results) {
    const char = allChars.find(c => c.id === r.id);
    if (char) {
      char.heightCm = r.heightCm;
      char.weightKg = r.weightKg;
      patched++;
    }
  }

  await put(BLOB_KEY, JSON.stringify(allChars, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(`✓ Patched ${patched} characters`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
