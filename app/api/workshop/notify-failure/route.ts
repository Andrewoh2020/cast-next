import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Notify admin of a persistent workshop generation failure.
 * Sends an email via Resend if configured, otherwise just logs.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const body = await req.json().catch(() => ({}));

  const { characterName, mode, prompt, error } = body;
  const message = `Workshop generation failed persistently.
User: ${userId || 'unknown'}
Character: ${characterName || 'unknown'}
Mode: ${mode || 'unknown'}
Prompt: ${prompt || '(none)'}
Error: ${error || 'unknown'}
Time: ${new Date().toISOString()}`;

  console.error('[workshop/notify-failure]', message);

  // Email notification if Resend is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Cast Alerts <no-reply@castability.ai>',
        to: 'admin@castability.ai',
        subject: `[Workshop] Generation failure — ${characterName || 'unknown'}`,
        text: message,
      });
    } catch (emailErr) {
      console.error('[workshop/notify-failure] email send failed:', emailErr);
    }
  }

  return NextResponse.json({ ok: true });
}
