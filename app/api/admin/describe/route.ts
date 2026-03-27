import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a character description writer for an AI character casting agency.

When given a request, respond with a JSON object containing:
- "name": A compelling, memorable character name (first name + last name). Should feel cinematic and fit the character's ethnicity and archetype. No generic names.
- "description": A vivid 2-3 sentence character description optimized for AI image generation. Include age, gender, ethnicity, build, hair, distinctive facial features, wardrobe/style, and overall vibe. Neutral descriptive tone, no metaphors.
- "attributes": Structured fields extracted from the description:
  - "sex": one of "male", "female", "nonbinary"
  - "ethnicities": array of applicable values from: "east-asian", "south-asian", "black", "latino", "middle-eastern", "white", "southeast-asian", "mixed"
  - "ageRange": one of "child", "teen", "20s", "30s", "40s", "50s", "60s+"
  - "build": one of "slim", "athletic", "average", "stocky", "curvy", "plus-size"
  - "height": one of "short", "average", "tall"
  - "style": one of "realistic", "anime", "cartoon", "3d-cgi", "stylized"

Respond ONLY with valid JSON, no markdown, no extra text.`;

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { description, mode } = await req.json();

    let userMessage: string;
    if (mode === 'generate') {
      userMessage = description?.trim()
        ? `Generate a detailed character based on these hints: "${description}"`
        : 'Generate a detailed character for a random interesting character suitable for film or video production.';
    } else {
      if (!description?.trim()) {
        return NextResponse.json({ error: 'description is required for improve mode' }, { status: 400 });
      }
      userMessage = `Improve this character description and extract structured attributes: "${description}"`;
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // Claude Haiku 4.5: $1/MTok input, $5/MTok output
    const inputCost = (message.usage.input_tokens / 1_000_000) * 1;
    const outputCost = (message.usage.output_tokens / 1_000_000) * 5;
    const claudeCost = inputCost + outputCost;

    return NextResponse.json({
      name: parsed.name ?? '',
      description: parsed.description ?? '',
      attributes: parsed.attributes ?? null,
      claudeCost,
      usage: { input: message.usage.input_tokens, output: message.usage.output_tokens },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Description generation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
