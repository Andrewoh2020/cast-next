import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, mode } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = mode === 'outfit'
    ? `You are a fashion styling assistant. The user is describing an outfit for an AI character.
Your job: take their brief description and enrich it with specific, vivid clothing details — fabric types, cuts, colors, layering, accessories, shoes, jewelry, patterns, textures.
Do NOT add anything about lighting, camera angles, photography style, or the person's identity — those are handled separately.
Only describe the clothing and styling. Keep it concise (1-3 sentences). Return ONLY the improved description, nothing else.`
    : `You are a cinematography director placing a character into a scene. The user is describing a scene/location.
Your job: take their brief description and enrich it so the character will look natural and integrated in the scene. Include:
- Specific environmental details (time of day, weather, architecture, lighting)
- What the character should be DOING in the scene (walking, sitting at a cafe, browsing a market, leaning on a railing — a natural action that fits the setting)
- What they should be WEARING that fits the scene context (casual streetwear for a market, swimwear for a beach, formal attire for a gala, athletic gear for a gym)
Make it feel like a film director's shot description — the character is living in this scene, not posing.
Keep it concise (2-3 sentences). Return ONLY the improved description, nothing else.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt.trim() }],
    });

    const improved = message.content[0].type === 'text' ? message.content[0].text.trim() : prompt;
    return NextResponse.json({ improved });
  } catch (err) {
    console.error('[improve-prompt]', err);
    return NextResponse.json({ improved: prompt }); // fallback to original
  }
}
