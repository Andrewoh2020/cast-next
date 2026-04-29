'use client';

interface Props {
  onExport: () => void;
  onShowMeHow: () => void;
  onDismiss: () => void;
}

/**
 * The "your character is ready" celebration banner. Renders inside the
 * canvas column above the canvas itself. Fires once per character per
 * session; dismissal is persisted by the parent via sessionStorage.
 */
export default function FirstSuccessBanner({ onExport, onShowMeHow, onDismiss }: Props) {
  return (
    <div className="relative w-full mb-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white/50 flex items-center justify-center transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pr-7">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-black tracking-tight text-black">Your character is ready</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Drop them into Kling, Higgsfield, or Artlist to start generating video.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onShowMeHow}
            className="text-xs font-semibold text-gray-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-white/60 transition-colors"
          >
            Show me how
          </button>
          <button
            onClick={onExport}
            className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            Export package
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
