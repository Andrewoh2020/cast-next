'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Create-new-project control. Click the button → it transforms in place
 * into an inline input + Create / Cancel. Enter submits, Esc cancels.
 */
export default function StudioCreateButton({ variant = 'header' }: { variant?: 'header' | 'primary' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const reset = () => {
    setOpen(false);
    setName('');
    setError(null);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to create project');
      }
      const json = await res.json();
      router.push(`/studio/${json.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setCreating(false);
    }
  };

  if (!open) {
    const cls = variant === 'primary'
      ? 'bg-black hover:bg-gray-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors flex items-center gap-2'
      : 'bg-black hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5';
    return (
      <button onClick={() => setOpen(true)} className={cls}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New project
      </button>
    );
  }

  const inputCls = variant === 'primary'
    ? 'flex-1 sm:flex-none sm:w-72 bg-white border border-indigo-300 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-black placeholder-gray-400'
    : 'flex-1 sm:flex-none sm:w-56 bg-white border border-indigo-300 focus:border-indigo-500 outline-none rounded-lg px-3 py-2 text-sm text-black placeholder-gray-400';

  const submitCls = variant === 'primary'
    ? 'bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors flex items-center gap-2'
    : 'bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5';

  const cancelCls = variant === 'primary'
    ? 'text-sm font-semibold text-gray-500 hover:text-black px-3 py-3'
    : 'text-xs font-semibold text-gray-500 hover:text-black px-2 py-2';

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); submit(); }
            if (e.key === 'Escape') { e.preventDefault(); reset(); }
          }}
          placeholder="Name your project"
          maxLength={80}
          aria-label="Project name"
          className={inputCls}
        />
        <button onClick={submit} disabled={creating || !name.trim()} className={submitCls}>
          {creating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating…
            </>
          ) : (
            'Create'
          )}
        </button>
        <button onClick={reset} disabled={creating} className={cancelCls}>Cancel</button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">{error}</p>
      )}
    </div>
  );
}
