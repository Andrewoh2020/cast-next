import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { CHARACTER_DESCRIBE_SYSTEM_PROMPT } from '@/lib/describe-prompt';
import { readCharacters } from '@/lib/characters.server';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const { description, attributes, mode } = await req.json();

    // Build a readable trait summary from the selected attributes
    const traitParts: string[] = [];
    if (attributes?.sex) traitParts.push(attributes.sex);
    if (attributes?.ageRange) traitParts.push(`age range: ${attributes.ageRange}`);
    if (attributes?.race?.length) {
      const raceLabels: Record<string, string> = {
        'east-asian': 'East Asian', 'south-asian': 'South Asian', 'southeast-asian': 'Southeast Asian',
        'pacific-islander': 'Pacific Islander', 'black': 'Black', 'latino': 'Latino/Hispanic',
        'middle-eastern': 'Middle Eastern', 'european': 'European', 'white': 'White',
        'indigenous': 'Indigenous', 'central-asian': 'Central Asian', 'mixed': 'Mixed Heritage',
      };
      traitParts.push(`race: ${attributes.race.map((r: string) => raceLabels[r] || r).join(', ')}`);
    }
    if (attributes?.build) traitParts.push(`build: ${attributes.build}`);
    if (attributes?.height) traitParts.push(`height: ${attributes.height}`);
    if (attributes?.style && attributes.style !== 'realistic') traitParts.push(`style: ${attributes.style}`);
    const traitSummary = traitParts.length > 0 ? traitParts.join(', ') : '';

    // Pull existing character names so Claude can avoid duplicates
    let avoidNames = '';
    try {
      const chars = await readCharacters();
      const names = chars.map((c) => c.name).slice(-100);
      if (names.length > 0) {
        avoidNames = `\n\nAvoid using these existing character names (or close variations): ${names.join(', ')}`;
      }
    } catch {}

    let userMessage: string;
    if (mode === 'generate') {
      if (description?.trim()) {
        userMessage = `Generate a detailed character based on these hints: "${description}". Use these traits: ${traitSummary}.${avoidNames}`;
      } else {
        userMessage = `Generate a detailed character for film or video production with these traits: ${traitSummary}. Interpret creatively — build a vivid, specific character around these constraints.${avoidNames}`;
      }
    } else {
      if (!description?.trim()) {
        return NextResponse.json({ error: 'description is required for improve mode' }, { status: 400 });
      }
      userMessage = `Improve this character description — make it more vivid, specific, and optimized for AI image generation. Keep the same character but enhance the details. Extract structured attributes from the result. Description: "${description}"`;
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: CHARACTER_DESCRIBE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    const inputCost = (message.usage.input_tokens / 1_000_000) * 1;
    const outputCost = (message.usage.output_tokens / 1_000_000) * 5;
    const claudeCost = inputCost + outputCost;

    return NextResponse.json({
      name: parsed.name ?? '',
      description: parsed.description ?? '',
      attributes: parsed.attributes ?? null,
      claudeCost,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Description generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
