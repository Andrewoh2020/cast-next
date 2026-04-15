'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/create?prompt=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className={`flex items-center bg-white/10 backdrop-blur-md rounded-2xl border transition-all ${focused ? 'border-white/40 bg-white/15' : 'border-white/20'}`}>
        <div className="pl-4 text-white/40">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe your ideal character..."
          className="flex-1 bg-transparent text-white placeholder-white/40 text-sm font-medium px-3 py-3.5 outline-none"
        />
        {query.trim() ? (
          <button
            type="submit"
            className="text-xs font-bold bg-indigo-500 text-white px-4 py-2 rounded-xl mr-1.5 hover:bg-indigo-600 transition-colors whitespace-nowrap"
          >
            Create →
          </button>
        ) : (
          <span className="text-xs text-white/30 pr-4 hidden sm:block">e.g. &ldquo;a 35-year-old firefighter with short red hair&rdquo;</span>
        )}
      </div>
    </form>
  );
}
