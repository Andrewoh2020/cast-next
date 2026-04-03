import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a character description writer for an AI character casting agency.

IMPORTANT: Generate diverse characters. Vary sex, age, race, ethnicity, and build widely across requests. Do NOT default to any single demographic. Aim for a broad, global cast — young and old, male and female, every race and region.

When given a request, respond with a JSON object containing:
- "name": A compelling, memorable character name (first name + last name). Should feel cinematic and fit the character's ethnicity and archetype. No generic names.
- "description": A vivid 2-3 sentence character description optimized for AI image generation. Include age, gender, ethnicity, build, hair, distinctive facial features, wardrobe/style, and overall vibe. Neutral descriptive tone, no metaphors. Characters should look polished and professional — think clean tailored clothing, smart-casual or business attire, well-groomed appearance. Avoid streetwear, hoodies, graphic tees, baggy clothing, or overly casual looks.
- "attributes": Structured fields extracted from the description:
  - "sex": one of "male", "female"
  - "race": array of applicable race categories from: "east-asian", "south-asian", "southeast-asian", "pacific-islander", "black", "latino", "middle-eastern", "european", "white", "indigenous", "central-asian", "mixed". MUST contain at least one value — pick the closest match. Use "european" for characters with specific European heritage (French, Italian, Swedish). Use "white" for broader White/Caucasian (American, Australian, South African). Use "indigenous" for Native American, First Nations, Aboriginal Australian, Inuit. Use "central-asian" for Kazakh, Uzbek, Kyrgyz, etc.
  - "ethnicity": the specific national/cultural background as a string (e.g. "Korean", "Nigerian", "Swedish", "Mexican", "Japanese / Irish")
  - "age": the character's specific age as a number (e.g. 28, 42, 16)
  - "ageRange": one of "child", "teen", "20s", "30s", "40s", "50s", "60s+"
  - "build": one of "slim", "athletic", "average", "stocky", "curvy", "plus-size"
  - "height": one of "short", "average", "tall"
  - "style": one of "realistic", "anime", "cartoon", "3d-cgi", "stylized"

Respond ONLY with valid JSON, no markdown, no extra text.`;

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

    let userMessage: string;
    if (mode === 'generate') {
      if (description?.trim()) {
        userMessage = `Generate a detailed character based on these hints: "${description}". Use these traits: ${traitSummary}.`;
      } else {
        userMessage = `Generate a detailed character for film or video production with these traits: ${traitSummary}. Interpret creatively — build a vivid, specific character around these constraints.`;
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
      system: SYSTEM_PROMPT,
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
