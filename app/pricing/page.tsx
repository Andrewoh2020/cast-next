import { auth } from '@clerk/nextjs/server';
import { ensureDripApplied } from '@/lib/user-data.server';
import PricingTiers from '@/components/PricingTiers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing — Cast',
  description: 'Subscriptions, top-up packs, and a free daily drip.',
};

export default async function PricingPage() {
  const { userId } = await auth();
  let currentTier: 'free' | 'starter' | 'studio' | 'pro' = 'free';
  let hasActiveSub = false;
  let currentCredits = 0;
  let currentPeriodEnd: string | null = null;
  let cancelAtPeriodEnd = false;
  if (userId) {
    const data = await ensureDripApplied(userId);
    currentTier = data.subscription?.tier ?? 'free';
    const status = data.subscription?.status;
    hasActiveSub = currentTier !== 'free' && (status === 'active' || status === 'trialing' || status === 'past_due');
    currentCredits = data.credits ?? 0;
    currentPeriodEnd = data.subscription?.currentPeriodEnd ?? null;
    cancelAtPeriodEnd = !!data.subscription?.cancelAtPeriodEnd;
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-3">Pricing</p>
          <h1 className="text-5xl font-black tracking-tighter text-black mb-4">One subscription. Every character. Every tool.</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cast, dress, and stage your characters; export to any AI video tool. Commercial rights persist after cancellation.
            Every character is 100% synthetic — no SAG-AFTRA exposure, no likeness risk.
          </p>
        </div>

        <PricingTiers
          currentTier={currentTier}
          hasActiveSub={hasActiveSub}
          isSignedIn={!!userId}
          currentCredits={currentCredits}
          currentPeriodEnd={currentPeriodEnd}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
        />
      </div>
    </div>
  );
}
