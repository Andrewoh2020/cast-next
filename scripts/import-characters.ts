/**
 * Bulk import characters from a teammate's output folder.
 *
 * Expected structure:
 *   output/
 *     character-slug/
 *       shot1-meta.json     { prompt, remote_url, task_id }
 *       shot1-portrait.png  (profile photo)
 *       shot2-turnaround.png (reference sheet)
 *
 * Usage:
 *   npx tsx scripts/import-characters.ts /path/to/output
 *
 * Requires BLOB_READ_WRITE_TOKEN and ANTHROPIC_API_KEY in .env.local
 */

import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';
import { Talent, TalentSex, TalentRace, TalentAgeRange, TalentBuild, TalentHeight } from '../lib/talent';

// ── Load env ────────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN in .env.local');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Prompt parser ───────────────────────────────────────────────────────────

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseSpecificAge(prompt: string): number | undefined {
  const m = prompt.match(/(\d{1,2})-year-old/i);
  return m ? parseInt(m[1]) : undefined;
}

function parseAge(prompt: string): TalentAgeRange {
  const m = prompt.match(/(\d{1,2})-year-old/i);
  if (m) {
    const age = parseInt(m[1]);
    if (age < 13) return 'child';
    if (age < 20) return 'teen';
    if (age < 30) return '20s';
    if (age < 40) return '30s';
    if (age < 50) return '40s';
    if (age < 60) return '50s';
    return '60s+';
  }
  return '30s';
}

function parseSex(prompt: string): TalentSex {
  const lower = prompt.toLowerCase();
  if (/\bnon-?binary\b/.test(lower)) return 'nonbinary';
  if (/\b(woman|female|she)\b/.test(lower)) return 'female';
  if (/\b(man|male|he)\b/.test(lower)) return 'male';
  return 'female';
}

function parseRace(prompt: string): TalentRace[] {
  const lower = prompt.toLowerCase();
  const result: TalentRace[] = [];

  if (/\b(japanese|chinese|korean|east[\s-]?asian)\b/.test(lower)) result.push('east-asian');
  if (/\b(indian|south[\s-]?asian|sri[\s-]?lank|bangladeshi|pakistani|nepali)\b/.test(lower)) result.push('south-asian');
  if (/\b(black|african|afro|nigerian|ghanaian|kenyan|haitian|jamaican|dark[\s-]?brown[\s-]?skin|deep[\s-]?brown[\s-]?skin|dark[\s-]?skin|rich[\s-]?brown[\s-]?skin|ebony)\b/.test(lower)) result.push('black');
  if (/\b(latin[ao]?|hispanic|mexican|brazilian|colombian|cuban|dominican|puerto[\s-]?rican|peruvian|chilean|argentinian|warm[\s-]?olive[\s-]?skin)\b/.test(lower)) result.push('latino');
  if (/\b(middle[\s-]?eastern|arab|persian|iranian|turkish|lebanese|iraqi|syrian|egyptian|moroccan|israeli)\b/.test(lower)) result.push('middle-eastern');
  if (/\b(white|caucasian|european|scandinavian|swedish|norwegian|finnish|danish|irish|british|german|french|italian|polish|russian|dutch|czech|fair[\s-]?skin|pale[\s-]?skin|light[\s-]?skin)\b/.test(lower)) result.push('white');
  if (/\b(southeast[\s-]?asian|vietnamese|thai|filipino|filipin[ao]|indonesian|malay|cambodian|burmese|singaporean)\b/.test(lower)) result.push('southeast-asian');
  if (/\bmixed\b/.test(lower)) result.push('mixed');

  return result.length > 0 ? result : ['white'];
}

function parseBuild(prompt: string): TalentBuild {
  const lower = prompt.toLowerCase();
  if (/\b(slim|slender|lean|thin|wiry|petite)\b/.test(lower)) return 'slim';
  if (/\b(athletic|muscular|toned|fit)\b/.test(lower)) return 'athletic';
  if (/\b(stocky|broad|heavyset|sturdy|thick)\b/.test(lower)) return 'stocky';
  if (/\b(curvy|hourglass)\b/.test(lower)) return 'curvy';
  if (/\b(plus[\s-]?size|large|heavy)\b/.test(lower)) return 'plus-size';
  return 'average';
}

function parseHeight(prompt: string): TalentHeight {
  const m = prompt.match(/(\d{2,3})\s*cm/i);
  if (m) {
    const cm = parseInt(m[1]);
    if (cm < 163) return 'short';
    if (cm > 180) return 'tall';
    return 'average';
  }
  return 'average';
}

// ── Claude API vibe generation ─────────────────────────────────────────────

async function generateVibe(prompt: string, name: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: `You are a character description writer for an AI character casting agency. Given an image generation prompt for a character, write a vivid 2-3 sentence character description suitable for a casting profile. Include their appearance, style, and the vibe they project. Neutral descriptive tone, no metaphors. Write in third person using the character's name. Respond with ONLY the description text, nothing else.`,
      messages: [
        {
          role: 'user',
          content: `Character name: ${name}\n\nImage generation prompt: ${prompt}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    if (text) return text;
  } catch (err) {
    console.warn(`    ⚠ Claude API failed for ${name}, falling back to prompt excerpt`);
  }

  // Fallback: use the prompt directly, trimmed
  return prompt.slice(0, 200);
}

// ── Image compression ──────────────────────────────────────────────────────

async function compressImage(filePath: string): Promise<Buffer> {
  return sharp(filePath)
    .jpeg({ quality: 95 })
    .toBuffer();
}

// ── Upload ──────────────────────────────────────────────────────────────────

async function uploadImage(filePath: string, slug: string, type: string): Promise<string> {
  const buffer = await compressImage(filePath);
  const blobPath = `characters/${slug}-${type}-${Date.now()}.jpg`;

  const blob = await put(blobPath, buffer, {
    access: 'private',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return `/api/media?p=${encodeURIComponent(blob.pathname)}`;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const outputDir = process.argv[2];
  if (!outputDir || !fs.existsSync(outputDir)) {
    console.error('Usage: npx tsx scripts/import-characters.ts /path/to/output');
    process.exit(1);
  }

  // Read existing characters to determine next ID
  const dataPath = path.join(process.cwd(), 'data', 'characters.json');
  let existing: Talent[] = [];
  if (fs.existsSync(dataPath)) {
    existing = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }
  let nextId = existing.length > 0 ? Math.max(...existing.map((c) => c.id)) + 1 : 1;

  // Check for existing slugs to avoid duplicates
  const existingSlugs = new Set(existing.map((c) => c.slug));

  const folders = fs.readdirSync(outputDir).filter((f) => {
    const fullPath = path.join(outputDir, f);
    return fs.statSync(fullPath).isDirectory() && !f.startsWith('__') && !f.startsWith('.');
  });

  console.log(`Found ${folders.length} character folders`);

  const imported: Talent[] = [];
  let skipped = 0;

  for (const folder of folders) {
    const charDir = path.join(outputDir, folder);
    const metaPath = path.join(charDir, 'shot1-meta.json');
    const portraitPath = path.join(charDir, 'shot1-portrait.png');
    const turnaroundPath = path.join(charDir, 'shot2-turnaround.png');

    const slug = folder;
    const name = slugToName(slug);

    if (existingSlugs.has(slug)) {
      console.log(`  SKIP ${name} (slug "${slug}" already exists)`);
      skipped++;
      continue;
    }

    // Parse meta
    let prompt = '';
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      prompt = meta.prompt ?? '';
    }

    console.log(`  [${imported.length + 1}/${folders.length - skipped}] Importing ${name}...`);

    // Upload compressed images
    let img = '';
    let referenceSheetUrl = '';

    if (fs.existsSync(portraitPath)) {
      img = await uploadImage(portraitPath, slug, 'profile');
      console.log(`    ✓ Profile photo compressed & uploaded`);
    } else {
      console.log(`    ⚠ No portrait found`);
    }

    if (fs.existsSync(turnaroundPath)) {
      referenceSheetUrl = await uploadImage(turnaroundPath, slug, 'reference-sheet');
      console.log(`    ✓ Reference sheet compressed & uploaded`);
    } else {
      console.log(`    ⚠ No turnaround found`);
    }

    // Generate rich description via Claude API
    const vibe = await generateVibe(prompt, name);
    console.log(`    ✓ Description generated`);

    const character: Talent = {
      id: nextId++,
      name,
      slug,
      vibe,
      img,
      referenceSheetUrl: referenceSheetUrl || undefined,
      sex: parseSex(prompt),
      race: parseRace(prompt),
      age: parseSpecificAge(prompt),
      ageRange: parseAge(prompt),
      build: parseBuild(prompt),
      height: parseHeight(prompt),
      style: 'realistic',
      prices: [
        { name: 'Single Project', price: '$50', amount: 50 },
        { name: 'Studio License', price: '$250', amount: 250 },
        { name: 'Exclusive Rights', price: '$1000', amount: 1000 },
      ],
      createdAt: new Date().toISOString(),
    };

    imported.push(character);
  }

  // Merge with existing and write
  const merged = [...existing, ...imported];

  // Write to local JSON
  fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`\n✓ Wrote ${merged.length} characters to ${dataPath}`);

  // Write to blob
  await put('characters.json', JSON.stringify(merged, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  console.log(`✓ Synced to Vercel Blob`);

  console.log(`\nDone! Imported ${imported.length} characters, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
