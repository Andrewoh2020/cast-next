'use client';

interface Props {
  currentTier: string;
  currentMonthlyCredits: number;
  remainingCredits: number;
  periodEndIso: string | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirming?: boolean;
}

const TIER_LABEL: Record<string, string> = {
  starter: 'Starter',
  studio: 'Studio',
  pro: 'Pro',
};

export default function CancelSubscriptionModal({
  currentTier, currentMonthlyCredits, remainingCredits, periodEndIso, onClose, onConfirm, confirming,
}: Props) {
  const tierName = TIER_LABEL[currentTier] ?? currentTier;
  const periodEndLabel = periodEndIso
    ? new Date(periodEndIso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative bg-white rounded-3xl w-full max-w-md border border-gray-100 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1">Switch to Free</p>
              <h2 className="text-2xl font-black tracking-tight text-black">Cancel {tierName}?</h2>
              <p className="text-sm text-gray-500 mt-1">No charge today.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        <div className="px-8 py-2 space-y-3">
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">What happens</p>
            <Row label="Your plan stays active until" value={periodEndLabel ?? 'end of cycle'} />
            <Row label="You keep your remaining credits" value={`${remainingCredits.toLocaleString()}`} valueClass="text-green-600" />
            <Row label="Then you drop to" value="Free (10 credits/day, capped at 25)" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs text-amber-800">
              You&apos;ll lose your <strong>{currentMonthlyCredits.toLocaleString()}-credit/mo</strong> allowance after {periodEndLabel ?? 'the period ends'}. You can come back anytime — pick any paid plan and you&apos;ll be reactivated immediately.
            </p>
          </div>
        </div>

        <div className="px-8 pt-4 pb-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            Keep {tierName}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-[2] bg-black hover:bg-gray-800 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Canceling…</>
            ) : (
              `Cancel at period end`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-sm font-bold tabular-nums text-right ${valueClass ?? 'text-black'}`}>{value}</p>
    </div>
  );
}
