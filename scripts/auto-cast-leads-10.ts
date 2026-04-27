/**
 * Auto-Cast Leads (batch 2) — 10 lead-role characters across teen / 20s /
 * 30s / 50s for ad, YA, and editorial casting briefs.
 *
 * Distribution (per user brief 2026-04-24):
 *   - 3 teens (lead-pipeline: YA, sports, coming-of-age)
 *   - 3 in 20s (fintech/tech/adventure/active lifestyle leads)
 *   - 3 in 30s (luxury, fintech, tech-executive leads)
 *   - 1 in 50s (powerful mature lead — underserved age/gender slot)
 *
 * All archetypes scrub smile/teeth language per the 2026-04-20 feedback
 * (Nano Banana 2 renders open-mouth smiles poorly).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-10.ts            # hidden-by-default
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-10.ts --visible  # straight to live
 *   npx tsx --env-file=.env.local scripts/auto-cast-leads-10.ts --dry-run  # no spend
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
  // ── 3 teens ─────────────────────────────────────────────────
  {
    sex: 'female',
    race: 'east-asian',
    ageRange: 'teen',
    build: 'athletic',
    style: 'realistic',
    archetype: 'East Asian American high-school senior athlete in her mid-teens — cast for Nike Jr., Under Armour Youth, Gatorade teen campaigns, Duolingo, College Board, high-school-set streaming content. Grounded, focused, quietly competitive camera presence. Los Angeles or Seattle sensibility.',
  },
  {
    sex: 'male',
    race: 'black',
    ageRange: 'teen',
    build: 'athletic',
    style: 'realistic',
    archetype: 'African American kid in his mid-teens — cast for Apple, Roblox, Fortnite Crew partnerships, Disney Channel, family-friendly financial services (Greenlight, Acorns Early), Nike Kids, Spotify teen-music campaigns. Bright-eyed curiosity, grounded and cool without being precocious. Atlanta or Brooklyn sensibility.',
  },
  {
    sex: 'female',
    race: 'latino',
    ageRange: 'teen',
    build: 'slim',
    style: 'realistic',
    archetype: 'Mexican-American high-school senior in her late teens — cast for Sephora Teen, Glossier Play, Shein, Hollister, Netflix YA and Disney+ coming-of-age shows, CoverGirl, college brands. Quiet introspection, poised and reserved camera read. Los Angeles or Chicago sensibility.',
  },

  // ── 3 in 20s ───────────────────────────────────────────────
  {
    sex: 'male',
    race: 'south-asian',
    ageRange: '20s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Indian-American young professional in his mid-20s — cast for fintech (Robinhood, Betterment, Fidelity, Chase), B2B SaaS (Notion, Linear, Slack, Figma), tech recruiting campaigns, higher-ed (Khan Academy, Coursera). Quiet intellectual confidence, modern and grounded, sharp features. New York or Austin sensibility.',
  },
  {
    sex: 'male',
    race: 'latino',
    ageRange: '20s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'South American leading man of Colombian or Argentinian heritage in his late 20s — cast for Patagonia, Nike Running, Hydro Flask, Corona Extra, Marriott, Airbnb, Expedia, sports apparel. Athletic composure, weathered-but-warm camera presence, lived-in look. Bogotá-in-Brooklyn or Buenos Aires-in-Los Angeles sensibility.',
  },
  {
    sex: 'female',
    race: 'pacific-islander',
    ageRange: '20s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Pacific Islander leading woman of Hawaiian or Samoan heritage in her late 20s — cast for Patagonia, Lululemon, Hydro Flask, REI, Hawaiian Airlines, Roxy, Oakley, Ironman campaigns, surf and outdoor brands. Strong athletic composure, grounded confident presence. Honolulu or Oceanside sensibility.',
  },

  // ── 3 in 30s ───────────────────────────────────────────────
  {
    sex: 'male',
    race: 'east-asian',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Japanese leading man in his mid-30s — cast for Uniqlo, Muji, Japanese auto (Lexus, Acura, Infiniti), tech (Sony, Panasonic Pro), Japanese whisky (Suntory, Hibiki), minimalist luxury (Mr. Porter, Common Projects). Composed, precise, intentional camera read, sharp jawline. Tokyo Ginza or San Francisco sensibility.',
  },
  {
    sex: 'male',
    race: 'black',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Nigerian-American leading man in his early 30s — cast for Apple, Meta, fintech (Chime, Cash App, Current), premium lifestyle (Beats, Audemars Piguet, Tag Heuer), music-adjacent brands (Spotify, Tidal), wellness tech (Oura, Whoop). Quiet authority, contemporary polished look, strong jawline. Brooklyn or Lagos-in-London sensibility.',
  },
  {
    sex: 'female',
    race: 'mixed',
    ageRange: '30s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Mixed-race leading woman of Chinese-American or Filipino-American heritage in her late 30s — cast for tech-executive roles (Microsoft, Snowflake, Stripe, Figma, Canva), premium airline (Delta One, United Polaris, British Airways Club), fintech (Ramp, Brex, Mercury). Sharp, composed, quietly commanding presence. San Francisco Bay or Singapore-diaspora sensibility.',
  },

  // ── 1 in 50s ───────────────────────────────────────────────
  {
    sex: 'female',
    race: 'east-asian',
    ageRange: '50s',
    build: 'athletic',
    style: 'realistic',
    archetype: 'Korean or Chinese leading woman in her early 50s — cast for luxury (Chanel No 5 mature editorial, Rolex, Mercedes-Benz), wellness and longevity (Oura, Form Nutrition, Function Health), financial services (Morgan Stanley Wealth, TIAA), premium travel (Singapore Airlines Suites, Emirates First). Powerful mature presence, Michelle-Yeoh-grade composure, strong bone structure. Seoul Gangnam or Shanghai sensibility.',
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

  console.log(`\nAuto-Cast Leads (batch 2) — ${slots.length === SLOTS.length ? '10 leading-role characters' : `slots [${onlyIndexes?.join(',')}]`}`);
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
  console.log(`Auto-Cast Leads (batch 2) Complete`);
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
