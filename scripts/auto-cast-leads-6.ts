/**
 * Auto-Cast Leads (batch 3) — 6 lead-role characters filling specific
 * archetype gaps in the roster.
 *
 * Distribution (per user brief 2026-04-27):
 *   - 1 White American male 30s (all-American leading man — major gap)
 *   - 1 Black female 30s (modern editorial leading woman)
 *   - 1 South Asian female 30s (tech executive leading woman)
 *   - 1 Middle Eastern male 30s (cosmopolitan luxury leading man)
 *   - 1 Latina female 20s (Latin market beauty/fashion lead)
 *   - 1 Black male 20s (streetwear / sports leading man)
 *
 * All archetypes scrub smile/teeth language per the 2026-04-20 feedback.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-6.ts            # hidden-by-default
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-6.ts --visible  # straight to live
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-6.ts --dry-run  # no spend
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-6.ts --only 1,3 # specific slots
 */

import { readCharacters, writeCharacters, nextId } from '../lib/characters.server';
import { describeCharacterFromSlot, validateAttributes, DescribeResult } from '../lib/auto-describe';
import { generateBoth, GenerateMeta } from '../lib/generation.server';
import { isDuplicate, DemographicSlot } from '../lib/casting-strategy';
import { Talent, TalentRace } from '../lib/talent';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const visible = args.includes('--visible');
const onlyIdx = args.indexOf('--only');
const onlyArg = onlyIdx >= 0 ? args[onlyIdx + 1] : undefined;
const onlyIndexes: number[] | undefined = onlyArg
  ? onlyArg.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n))
  : undefined;

const SLOTS: DemographicSlot[] = [
  {
    sex: 'male',
    race: 'white',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'American leading man in his early 30s — cast for Apple, Nike, Ford, Disney+, Marvel-style streaming, financial services (Charles Schwab, Vanguard), pharma (Eli Lilly, Pfizer), aviation (Delta, United), classic-Americana brand campaigns. Clean-cut, athletic, intentional camera read, strong jawline. Boston or Denver sensibility.',
  },
  {
    sex: 'female',
    race: 'black',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'African American leading woman in her early 30s — cast for Sephora, Apple, Coach, Tory Burch, fintech (Chase, AmEx, Fidelity), wellness (Lululemon, Goop), beauty editorial (Vogue, Harper\'s Bazaar). Composed, sharp, modern beauty with editorial command. Brooklyn or Atlanta sensibility.',
  },
  {
    sex: 'female',
    race: 'south-asian',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Indian-American leading woman in her early 30s — cast for tech (Microsoft, Google, Adobe), fintech (Stripe, Plaid, Mercury), B2B SaaS (Notion, Figma, Airtable), premium consumer (Apple, Nike Women), higher-ed (Coursera, edX). Quiet intellectual confidence, contemporary polish. San Francisco or New York sensibility.',
  },
  {
    sex: 'male',
    race: 'middle-eastern',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Lebanese or Persian leading man in his early 30s — cast for premium luxury (Mr. Porter, Tom Ford), automotive (BMW, Audi, Mercedes), aviation (Emirates, Etihad, Qatar Airways), tech (Apple, Tesla), hospitality (Aman, Four Seasons). Composed cosmopolitan presence, strong bone structure, intentional gaze. Beirut-in-London or Tehran-in-Los Angeles sensibility.',
  },
  {
    sex: 'female',
    race: 'latino',
    ageRange: '20s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Latina leading woman of Colombian or Brazilian heritage in her late 20s — cast for beauty (Fenty, Glossier, NYX, Maybelline), fashion (Zara, Reformation, Vince), travel (Hilton, Marriott Bonvoy), entertainment (Netflix LATAM), fintech with bilingual market appeal. Fashion-editorial command, sharp eye contact, lived-in confidence. Bogotá-in-Miami or São Paulo-in-Los Angeles sensibility.',
  },
  {
    sex: 'male',
    race: 'black',
    ageRange: '20s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'African American leading man in his late 20s — cast for Nike, Adidas, Apple, Beats, fintech (Chime, Cash App, Robinhood), streetwear (Supreme, Stüssy, Aimé Leon Dore), wellness (Whoop, Oura), music-adjacent brands (Spotify, Tidal). Athletic composure, contemporary cool, sharp camera read. Brooklyn or Inglewood sensibility.',
  },
];

async function main(): Promise<void> {
  const slots = onlyIndexes
    ? onlyIndexes.map((i) => SLOTS[i - 1]).filter(Boolean)
    : SLOTS;
  if (onlyIndexes && slots.length === 0) {
    console.error(`Invalid --only indexes [${onlyIndexes.join(',')}]. Must be between 1 and ${SLOTS.length}.`);
    process.exit(1);
  }

  console.log(`\nAuto-Cast Leads (batch 3) — ${slots.length === SLOTS.length ? '6 leading-role characters' : `slots [${onlyIndexes?.join(',')}]`}`);
  console.log(`   Dry run: ${dryRun} | Visible: ${visible}\n`);

  const initial = await readCharacters();
  console.log(`   Current roster: ${initial.length} (${initial.filter((c) => !c.hidden).length} visible)\n`);

  if (dryRun) {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
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

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    console.log(`\n━━━ Character ${i + 1}/${slots.length} ━━━`);
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
  console.log(`Auto-Cast Leads (batch 3) Complete`);
  console.log(`   Created:  ${created.length}/${slots.length}`);
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
