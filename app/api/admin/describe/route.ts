import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CHARACTER_DESCRIBE_SYSTEM_PROMPT } from '@/lib/describe-prompt';

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { description, mode } = await req.json();

    const sexPool = ['male', 'female'];
    const agePool = ['teens', '20s', '30s', '40s', '50s', '60s+'];
    const racePool = ['East Asian', 'South Asian', 'Black', 'Latino/Hispanic', 'Middle Eastern', 'White/European', 'Southeast Asian', 'Mixed'];
    const randomSex = sexPool[Math.floor(Math.random() * sexPool.length)];
    const randomAge = agePool[Math.floor(Math.random() * agePool.length)];
    const randomRace = racePool[Math.floor(Math.random() * racePool.length)];

    let userMessage: string;
    if (mode === 'generate') {
      userMessage = description?.trim()
        ? `Generate a detailed character based on these hints: "${description}"`
        : `Generate a detailed character for film or video production. For diversity, lean toward: ${randomSex}, ${randomAge}, ${randomRace}. But feel free to interpret creatively.`;
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
