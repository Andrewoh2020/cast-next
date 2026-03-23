export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { recordPurchase } from '@/lib/user-data.server';
import Link from 'next/link';
import AutoDownload from '@/components/AutoDownload';
import DownloadButton from '@/components/DownloadButton';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { session_id } = await searchParams;
  if (!session_id) redirect('/');

  const { userId } = await auth();

  const [session, user] = await Promise.all([
    stripe.checkout.sessions.retrieve(session_id),
    currentUser(),
  ]);
  if (session.payment_status !== 'paid') redirect('/');

  const m = session.metadata!;

  // Record purchase for signed-in users
  if (userId) {
    await recordPurchase(userId, {
      characterId: Number(m.characterId),
      characterName: m.characterName,
      characterSlug: m.characterSlug,
      characterImg: m.characterImg,
      licenseName: m.licenseName,
      licensePrice: m.licensePrice,
      purchasedAt: new Date().toISOString(),
      referenceSheetUrl: m.referenceSheetUrl || undefined,
      sessionId: session_id,
    });
  }

  // Send reference sheet email
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email) {
    const licenseIndex = m.licenseName === 'Exclusive Rights' ? 1 : 0;
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/email/send-reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, characterId: Number(m.characterId), licenseIndex }),
    }).catch(() => {}); // non-blocking — don't fail the page if email fails
  }

  // Mark character as exclusive if applicable
  if (m.isExclusive === 'true') {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/characters/${m.characterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exclusive: true }),
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">Payment confirmed</p>
        <h1 className="text-3xl font-black tracking-tighter text-black mb-3">You&apos;re all set.</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          <strong className="text-black">{m.characterName}</strong> ({m.licenseName} License) is now licensed to you.
        </p>

        {/* Download — reference sheet if available, otherwise character image */}
        {(() => {
          const downloadUrl = m.referenceSheetUrl
            ? `${m.referenceSheetUrl}${m.referenceSheetUrl.includes('?') ? '&' : '?'}download=1`
            : `${m.characterImg}`;
          const filename = m.referenceSheetUrl
            ? `${m.characterSlug}-reference-sheet`
            : `${m.characterSlug}`;
          return (
            <>
              <AutoDownload url={downloadUrl} filename={filename} />
              <DownloadButton
                url={downloadUrl}
                filename={filename}
                label={`Download ${m.referenceSheetUrl ? 'Reference Sheet' : 'Character Asset'}`}
                className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm mb-3 disabled:opacity-60"
              />
            </>
          );
        })()}

        <div className="flex flex-col gap-3">
          <Link href="/account" className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-colors text-sm">
            View in My Account
          </Link>
          <Link href="/#roster" className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:border-gray-400 transition-colors text-sm">
            Browse More Talent
          </Link>
        </div>
      </div>
    </div>
  );
}
