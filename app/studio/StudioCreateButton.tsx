'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Inline "Create new project" button + lightweight name prompt.
 * Used both in the page header and the empty-state card.
 */
export default function StudioCreateButton({ variant = 'header' }: { variant?: 'header' | 'primary' }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (creating) return;
    const name = window.prompt('Project name', 'New project')?.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
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

  const cls = variant === 'primary'
    ? 'bg-black hover:bg-gray-800 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors flex items-center gap-2'
    : 'bg-black hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5';

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={handleCreate} disabled={creating} className={cls}>
        {creating ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Creating…
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New project
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">{error}</p>
      )}
    </div>
  );
}
