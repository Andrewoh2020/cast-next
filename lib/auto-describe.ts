import Anthropic from '@anthropic-ai/sdk';
import { CHARACTER_DESCRIBE_SYSTEM_PROMPT } from './describe-prompt';
import { DemographicSlot } from './casting-strategy';
import type { TalentRace } from './talent';

const RACE_LABELS: Record<TalentRace, string> = {
  'east-asian': 'East Asian',
  'south-asian': 'South Asian',
  'southeast-asian': 'Southeast Asian',
  'pacific-islander': 'Pacific Islander',
  'black': 'Black',
  'latino': 'Latino/Hispanic',
  'middle-eastern': 'Middle Eastern',
  'european': 'European',
  'white': 'White',
  'indigenous': 'Indigenous',
  'central-asian': 'Central Asian',
  'mixed': 'Mixed Heritage',
};

export interface DescribeResult {
  name: string;
  slug: string;
  description: string;
  attributes: {
    sex: string;
    race: string[];
    ethnicity?: string;
    age?: number;
    ageRange: string;
    build: string;
    height: string;
    heightCm?: number;
    weightKg?: number;
    style: string;
  };
  claudeCost: number;
}

/**
 * Generate a character description from a demographic slot using Claude Opus 4.6.
 * The prompt is more directive than the admin dashboard's random mode —
 * it specifies exact demographics so the casting strategy is enforced.
 */
export async function describeCharacterFromSlot(
  slot: DemographicSlot,
  existingNames: string[],
  apiKey?: string,
): Promise<DescribeResult> {
  const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  const raceLabel = RACE_LABELS[slot.race] || slot.race;

  const avoidNames = existingNames.length > 0
    ? `\n\nDo NOT use any of these existing character names (or close variations): ${existingNames.slice(-50).join(', ')}`
    : '';

  const userMessage = `Generate a character for film/video production with these EXACT demographics:
- Sex: ${slot.sex}
- Race/ethnicity: ${raceLabel}
- Age range: ${slot.ageRange}
- Build: ${slot.build}
- Style: ${slot.style}
- Archetype/role: ${slot.archetype}

Do NOT deviate from the specified sex, race, or age range. The character MUST match these demographics exactly.
Interpret the archetype creatively — give them a specific profession, backstory hint, and distinct visual identity.${avoidNames}`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    system: CHARACTER_DESCRIBE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned);

  // Claude Opus 4.6: $15/MTok input, $75/MTok output
  const inputCost = (message.usage.input_tokens / 1_000_000) * 15;
  const outputCost = (message.usage.output_tokens / 1_000_000) * 75;
  const claudeCost = inputCost + outputCost;

  const name = parsed.name ?? 'Unnamed Character';
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    name,
    slug,
    description: parsed.description ?? '',
    attributes: parsed.attributes ?? {
      sex: slot.sex,
      race: [slot.race],
      ageRange: slot.ageRange,
      build: slot.build,
      height: 'average',
      style: slot.style,
    },
    claudeCost,
  };
}

/**
 * Validate that the generated attributes match the requested slot.
 * Returns true if they match, false if the description needs to be regenerated.
 */
export function validateAttributes(
  result: DescribeResult,
  slot: DemographicSlot,
): boolean {
  if (result.attributes.sex !== slot.sex) return false;
  if (result.attributes.ageRange !== slot.ageRange) return false;

  const resultRaces = Array.isArray(result.attributes.race) ? result.attributes.race : [];
  if (!resultRaces.includes(slot.race)) return false;

  return true;
}
