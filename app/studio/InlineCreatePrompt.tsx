'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Floating chat input pinned at the bottom-center of the Studio canvas.
 * Mirrors Artlist Studio's "Describe your character's look and personality"
 * affordance — always visible, always actionable. On submit, deep-links into
 * the existing /create flow with the prompt prefilled. Keeps /create as the
 * single source of truth for character generation.
 *
 * Image attach is a placeholder for now; clicking it routes to /create which
 * has its own image-upload affordance, so we don't fragment the upload flow.
 */
export default function InlineCreatePrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    router.push(`/create?prompt=${encodeURIComponent(trimmed)}`);
  }

  function attach() {
    router.push('/create?upload=1');
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 sm:px-0">
      <form
        onSubmit={submit}
        className="pointer-events-auto mx-auto w-full max-w-xl bg-white/95 backdrop-blur-md border border-gray-200 rounded-full shadow-xl flex items-center gap-2 pl-3 pr-2 py-2"
      >
        <button
          type="button"
          onClick={attach}
          aria-label="Attach a reference image"
          className="shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black flex items-center justify-center transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your character's look and personality"
          aria-label="Describe your character"
          className="flex-1 bg-transparent text-sm text-black placeholder-gray-400 outline-none py-1.5"
          maxLength={400}
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          aria-label="Open in Create"
          className="shrink-0 w-9 h-9 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
