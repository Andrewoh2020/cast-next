/**
 * Auto-Cast Leads — generate 5 "leading role" characters (20–40, athletic,
 * conventionally attractive) for hero-role casting in ads and short films.
 *
 * Each slot fills an ethnic gap the roster currently lacks at lead age.
 * Wardrobe handled by CHARACTER_DESCRIBE_SYSTEM_PROMPT.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-5.ts            # hidden-by-default
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-5.ts --visible  # straight to live
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-5.ts --dry-run  # no spend
 */

import { readCharacters, writeCharacters, nextId } from '../lib/characters.server';
import { describeCharacterFromSlot, validateAttributes, DescribeResult } from '../lib/auto-describe';
import { generateBoth, GenerateMeta } from '../lib/generation.server';
import { isDuplicate, DemographicSlot } from '../lib/casting-strategy';
import { Talent, TalentRace } from '../lib/talent';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const visible = args.includes('--visible');

// 5 lead-role archetypes, each filling a specific roster gap.
const SLOTS: DemographicSlot[] = [
  {
    sex: 'female',
    race: 'european',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Refined Italian leading lady in her early 30s — Milan or Rome sensibility. Cast for luxury (Ferragamo, Bulgari, Armani), automotive (Alfa Romeo, Lexus), travel (British Airways, Expedia), beauty (YSL, Dior). Warm sophistication, commercial beauty with editorial-cover presence, effortless camera confidence.',
  },
  {
    sex: 'female',
    race: 'black',
    ageRange: '20s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Modern American leading woman in her late 20s — Atlanta or Brooklyn sensibility. Cast for Nike Women, Peloton, Apple, Chase, Sephora, Lululemon, wellness and athleisure campaigns. Effortlessly athletic, confident, contemporary beauty with agency-friendly warmth and camera-ready presence.',
  },
  {
    sex: 'male',
    race: 'southeast-asian',
    ageRange: '20s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Vietnamese-American leading man in his late 20s — Ho Chi Minh City or San Francisco sensibility. Cast for tech (Apple, Google, Samsung), premium lifestyle (Uniqlo, Muji, Rhode), automotive (Honda, Lexus), Asian-American-forward brand campaigns. Sharp jawline, quietly confident leading-man presence, modern and grounded.',
  },
  {
    sex: 'male',
    race: 'european',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Swedish leading man in his early 30s — Stockholm sensibility. Cast for tech (Spotify, Volvo, IKEA, Klarna), luxury auto (Polestar, Porsche), financial services (BlackRock, Vanguard), outdoor (Patagonia, Arc\'teryx). Tall, clean-cut, quietly commanding Scandinavian presence with a warm smile and striking bone structure.',
  },
  {
    sex: 'female',
    race: 'middle-eastern',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Iranian-American leading woman in her early 30s — Los Angeles or Tehran-diaspora sensibility. Cast for luxury (Chanel, Dior), fragrance (Tom Ford, Byredo), premium skincare, architecture and design, global travel. Striking refined beauty: dark features, elegant bone structure, cosmopolitan polish and commercial warmth.',
  },
];

async function main(): Promise<void> {
  console.log(`\nAuto-Cast Leads — 5 leading-role characters`);
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

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`Auto-Cast Leads Complete`);
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
