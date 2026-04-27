/**
 * Auto-Cast Seed — generate 5 hand-picked characters that fill specific
 * sales-archetype gaps in the roster.
 *
 * Each slot below encodes the casting target (demographics + archetype).
 * Wardrobe is left to CHARACTER_DESCRIBE_SYSTEM_PROMPT.
 *
 * Usage:
 *   npx tsx scripts/auto-cast-seed-5.ts              # run (hidden-by-default)
 *   npx tsx scripts/auto-cast-seed-5.ts --visible    # publish to live roster
 *   npx tsx scripts/auto-cast-seed-5.ts --dry-run    # print slots, no spend
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config(); // fall back to .env if .env.local missing vars
import { readCharacters, writeCharacters, nextId } from '../lib/characters.server';
import { describeCharacterFromSlot, validateAttributes, DescribeResult } from '../lib/auto-describe';
import { generateBoth, GenerateMeta } from '../lib/generation.server';
import { isDuplicate, DemographicSlot } from '../lib/casting-strategy';
import { Talent, TalentRace } from '../lib/talent';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const visible = args.includes('--visible');

// ── 5 sales-targeted archetypes, hand-picked to fill real roster gaps ──
// Each slot maps to a concrete ad-industry buyer profile.
const SLOTS: DemographicSlot[] = [
  {
    sex: 'female',
    race: 'black',
    ageRange: '40s',
    build: 'plus-size',
    style: 'realistic',
    archetype: 'Warm American mother in her mid-40s — the kind of face agencies cast for Target, State Farm, Pampers, CVS Health, Aldi, Blue Apron, healthcare ads. Relatable and trustworthy, lived-in rather than glamorous, genuine warmth. Brooklyn or Atlanta vibe.',
  },
  {
    sex: 'female',
    race: 'latino',
    ageRange: '30s',
    build: 'slim',
    style: 'realistic',
    archetype: 'Senior Latina corporate executive in her late 30s — cast for Salesforce, American Express, Delta, Lexus, JP Morgan, Bank of America, B2B SaaS campaigns. Quiet authority, sharp and polished, bilingual market appeal. Downtown Manhattan or Los Angeles sensibility.',
  },
  {
    sex: 'male',
    race: 'south-asian',
    ageRange: '60s+',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Distinguished senior Indian physician or academic in his early 60s — cast for Pfizer, Johnson & Johnson, TIAA, AARP, Coursera, edX, financial advisory campaigns. Warm confidence and intellectual gravitas. Mumbai or Boston/Cambridge sensibility.',
  },
  {
    sex: 'female',
    race: 'mixed',
    ageRange: '20s',
    build: 'slim',
    style: 'realistic',
    archetype: 'Gen Z fashion editorial subject in their mid-20s — mixed Korean-Black heritage, androgynous-leaning presentation — cast for Glossier, Fenty, Calvin Klein, Prada, Apple, Gen Z aspirational campaigns. Cool, confident, minimal. Seoul-meets-Brooklyn aesthetic.',
  },
  {
    sex: 'male',
    race: 'white',
    ageRange: '50s',
    build: 'stocky',
    style: 'realistic',
    archetype: 'American working-class man in his early 50s — cast for Home Depot, Progressive, Ford F-150, USAA, Lowe\'s, Farmers Insurance, Budweiser campaigns. The "guy you can trust": weathered, capable, warm, salt-and-pepper. Chicago or Denver sensibility.',
  },
];

async function main(): Promise<void> {
  console.log(`\nAuto-Cast Seed — 5 sales-targeted characters`);
  console.log(`   Dry run: ${dryRun} | Visible: ${visible}\n`);

  const initial = await readCharacters();
  console.log(`   Current roster: ${initial.length} (${initial.filter((c) => !c.hidden).length} visible)\n`);

  if (dryRun) {
    for (let i = 0; i < SLOTS.length; i++) {
      const s = SLOTS[i];
      console.log(`   ${i + 1}. ${s.sex} · ${s.race} · ${s.ageRange} · ${s.build}`);
      console.log(`      ${s.archetype}\n`);
    }
    console.log(`Dry run complete — no spend.\n`);
    return;
  }

  let characters = initial;
  let totalClaudeCost = 0;
  let totalImageCost = 0;
  const created: { name: string; slug: string; sex: string; race: string[]; ageRange: string }[] = [];
  const failures: { slot: DemographicSlot; error: string }[] = [];

  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i];
    console.log(`\n━━━ Character ${i + 1}/${SLOTS.length} ━━━`);
    console.log(`   Slot: ${slot.sex} · ${slot.race} · ${slot.ageRange} · ${slot.build}`);

    try {
      // Describe (3 attempts for unique + valid)
      let describe: DescribeResult | null = null;
      const existingNames = characters.map((c) => c.name);

      for (let attempt = 0; attempt < 3; attempt++) {
        console.log(`   Describing (attempt ${attempt + 1})…`);
        const candidate = await describeCharacterFromSlot(slot, existingNames);
        if (isDuplicate(candidate.name, candidate.slug, characters)) {
          console.log(`   Duplicate name "${candidate.name}" — retrying`);
          continue;
        }
        if (!validateAttributes(candidate, slot)) {
          console.log(`   Demographics mismatch — retrying`);
          continue;
        }
        describe = candidate;
        break;
      }
      if (!describe) throw new Error('Failed to get unique valid description in 3 attempts');

      console.log(`   ✅ ${describe.name}`);
      console.log(`   ${describe.description.slice(0, 120)}${describe.description.length > 120 ? '…' : ''}`);
      totalClaudeCost += describe.claudeCost;

      // Generate profile + reference sheet
      console.log(`   Generating profile + reference sheet…`);
      const id = nextId(characters);
      const meta: GenerateMeta = {
        characterId: id,
        characterName: describe.name,
        characterSlug: describe.slug,
        claudeCost: describe.claudeCost,
      };
      const { profile, refSheet, profileThumbUrl, refSheetThumbUrl } = await generateBoth(
        describe.description,
        describe.slug,
        meta,
      );
      totalImageCost += profile.cost + refSheet.cost;
      console.log(`   Images: profile=${profile.provider} ref=${refSheet.provider} cost=$${(profile.cost + refSheet.cost).toFixed(4)}`);

      // Build Talent record
      const attrs = describe.attributes;
      const newCharacter: Talent & { autoGenerated: boolean } = {
        id,
        name: describe.name,
        slug: describe.slug,
        vibe: describe.description,
        img: profile.url,
        imgThumbnail: profileThumbUrl,
        referenceSheetUrl: refSheet.url,
        refSheetThumbnail: refSheetThumbUrl,
        sex: attrs.sex as Talent['sex'],
        race: (Array.isArray(attrs.race) ? attrs.race : [slot.race]) as TalentRace[],
        ethnicity: attrs.ethnicity,
        age: attrs.age,
        ageRange: attrs.ageRange as Talent['ageRange'],
        build: attrs.build as Talent['build'],
        height: (attrs.height || 'average') as Talent['height'],
        style: (attrs.style || 'realistic') as Talent['style'],
        prices: [
          { name: 'Single Project', price: '$50', amount: 50 },
          { name: 'Studio License', price: '$250', amount: 250 },
          { name: 'Exclusive Rights', price: '$1000', amount: 1000 },
        ],
        createdAt: new Date().toISOString(),
        hidden: !visible,
        autoGenerated: true,
      };

      // Re-read to avoid race, then append + persist
      characters = await readCharacters();
      characters.push(newCharacter);
      await writeCharacters(characters);
      console.log(`   Saved as ID ${id} (hidden=${!visible})`);

      created.push({
        name: describe.name,
        slug: describe.slug,
        sex: attrs.sex,
        race: Array.isArray(attrs.race) ? attrs.race : [slot.race],
        ageRange: attrs.ageRange,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Failed: ${msg}`);
      failures.push({ slot, error: msg });
    }
  }

  // Summary
  console.log(`\n${'━'.repeat(50)}`);
  console.log(`Auto-Cast Seed Complete`);
  console.log(`   Created:  ${created.length}/${SLOTS.length}`);
  console.log(`   Failures: ${failures.length}`);
  console.log(`   Claude cost: $${totalClaudeCost.toFixed(4)}`);
  console.log(`   Image cost:  $${totalImageCost.toFixed(4)}`);
  console.log(`   Total:       $${(totalClaudeCost + totalImageCost).toFixed(4)}\n`);

  if (created.length > 0) {
    console.log(`Characters created:`);
    for (const c of created) {
      console.log(`  - ${c.name} (${c.sex}, ${c.race.join('/')}, ${c.ageRange}) · /characters/${c.slug}`);
    }
    console.log();
  }

  if (failures.length > 0) {
    console.log(`Failures:`);
    for (const f of failures) {
      console.log(`  - ${f.slot.sex}/${f.slot.race}/${f.slot.ageRange}: ${f.error}`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
