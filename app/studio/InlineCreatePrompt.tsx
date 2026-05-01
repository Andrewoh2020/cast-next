'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Floating chat input pinned at the bottom-center of the Studio canvas.
 * Mirrors Artlist Studio's "Describe your character's look and personality"
 * affordance — translucent glass panel, always visible. On submit, deep-links
 * into /create with the prompt prefilled. Clicking Upload routes to /create's
 * existing image-upload flow so we don't fragment the upload pipeline.
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

  function uploadPhoto() {
    router.push('/create?upload=1');
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 px-4 sm:px-0">
      <form
        onSubmit={submit}
        className="pointer-events-auto mx-auto w-full max-w-xl bg-white/55 backdrop-blur-2xl border border-white/60 rounded-full shadow-2xl shadow-black/10 flex items-center gap-1.5 pl-1.5 pr-1.5 py-1.5"
      >
        <button
          type="button"
          onClick={uploadPhoto}
          aria-label="Upload a photo of your character"
          title="Upload a photo of your character"
          className="shrink-0 inline-flex items-center gap-1.5 bg-white/70 hover:bg-white text-gray-800 hover:text-black font-bold text-xs pl-2.5 pr-3 py-2 rounded-full transition-colors border border-white/70"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 11-8.48-8.49l8.57-8.57A4 4 0 1118 8.84l-8.59 8.57a2 2 0 11-2.83-2.83l8.49-8.48" />
          </svg>
          Upload photo
        </button>
        <span aria-hidden className="h-5 w-px bg-black/10" />
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your character's look and personality"
          aria-label="Describe your character"
          className="flex-1 min-w-0 bg-transparent text-sm text-black placeholder-gray-500 outline-none py-1.5 pl-1"
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
