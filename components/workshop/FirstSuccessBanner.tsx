'use client';

interface Props {
  onDismiss: () => void;
}

/**
 * The "your character is ready" celebration banner. Renders inside the
 * canvas column above the canvas itself. Fires once per character per
 * session; dismissal is persisted by the parent via sessionStorage.
 *
 * Points users *down* to the persistent SendToVideoFooter — that's where
 * the actual handoff buttons live. The banner is the moment-of-aha
 * pointer; the footer is the always-on workflow continuation.
 */
export default function FirstSuccessBanner({ onDismiss }: Props) {
  return (
    <div className="relative w-full mb-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white/50 flex items-center justify-center transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className="pr-7 flex items-center gap-3">
        <span aria-hidden="true" className="hidden sm:flex w-8 h-8 rounded-full bg-indigo-500 text-white items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-black tracking-tight text-black">Your character is ready</p>
          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
            Send them to Kling, Higgsfield, or Artlist below
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true" className="text-indigo-500 animate-bounce">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </p>
        </div>
      </div>
    </div>
  );
}
