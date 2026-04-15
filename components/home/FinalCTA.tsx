'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FinalCTA() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/create?prompt=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      <div className="absolute inset-0 bg-dot-grid opacity-40" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-black leading-[0.95] mb-6">
          What character<br />will you bring to life?
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
          Start with an idea. Cast delivers the actor.
        </p>

        <form onSubmit={submit} className="mb-6">
          <div className="flex items-center bg-white rounded-2xl border border-black/10 shadow-xl shadow-indigo-500/10 pl-5 pr-2 py-2 focus-within:border-indigo-300 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your ideal character..."
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-base font-medium px-3 py-2 outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="bg-black text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              Create →
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-4 text-sm">
          <a href="/#roster" className="font-semibold text-gray-600 hover:text-black transition-colors">
            Browse the roster →
          </a>
          <span className="text-gray-300">·</span>
          <a href="/how-it-works" className="font-semibold text-gray-600 hover:text-black transition-colors">
            How it works →
          </a>
        </div>
      </div>
    </section>
  );
}
