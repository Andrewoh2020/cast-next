'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import BuyCreditsModal from './BuyCreditsModal';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/create/credits')
      .then(r => r.json())
      .then(d => setCredits(d.credits ?? 0))
      .catch(() => {});
  }, [isSignedIn]);

  // The new homepage hero has a white background, so the nav stays solid
  // everywhere. Keep the scrolled flag available for future variants.
  void scrolled;
  const transparent = false;

  // Workshop is a full-bleed studio experience — hide the site nav entirely.
  if (pathname === '/workshop' || pathname.startsWith('/workshop/') || pathname.startsWith('/mock/workshop')) {
    return null;
  }

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${transparent ? 'bg-transparent border-b border-transparent' : 'bg-white/90 backdrop-blur-md border-b border-black/5'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className={`text-3xl font-black tracking-tight transition-colors ${transparent ? 'text-white' : 'text-black'}`}>
          Cast<span className="text-indigo-500">.</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/how-it-works" className={`text-sm font-medium transition-colors ${transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
            How It Works
          </Link>
          <a href="/create" className={`text-sm font-medium transition-colors ${transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
            Create
          </a>
          <Link href="/workshop" className={`text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${transparent ? 'text-white hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
            </svg>
            Workshop
          </Link>
          <Link href="/launches" className={`text-sm font-medium transition-colors ${transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
            Recent Launches
          </Link>
          {isSignedIn ? (
            <>
              {credits !== null && (
                <button onClick={() => setShowBuyCredits(true)} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${credits === 0 ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' : transparent ? 'bg-white/20 text-white border border-white/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'}`}>
                  {credits} {credits === 1 ? 'credit' : 'credits'}
                </button>
              )}
              <Link href="/account" className={`text-sm font-medium transition-colors ${transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                My Account
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={`text-sm font-medium transition-colors ${transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                Sign In
              </Link>
              <Link href="/sign-up" className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors ${transparent ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' : 'bg-black text-white hover:bg-gray-800'}`}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 transition-all ${transparent ? 'bg-white' : 'bg-black'} ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 transition-all ${transparent ? 'bg-white' : 'bg-black'} ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 transition-all ${transparent ? 'bg-white' : 'bg-black'} ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 pb-5 flex flex-col gap-1">
          <Link href="/how-it-works" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
            How It Works
          </Link>
          <a href="/create" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
            Create Character
          </a>
          <Link href="/workshop" onClick={() => setOpen(false)} className="py-3 text-sm font-semibold text-indigo-600 border-b border-gray-100 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
            </svg>
            Workshop
          </Link>
          <Link href="/launches" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
            Recent Launches
          </Link>
          {isSignedIn ? (
            <>
              {credits !== null && (
                <Link href="/create" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100 flex items-center justify-between">
                  Credits
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{credits}</span>
                </Link>
              )}
              <Link href="/account" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
                Sign In
              </Link>
              <Link href="/sign-up" onClick={() => setOpen(false)} className="mt-3 text-center text-sm font-semibold bg-black text-white px-5 py-3 rounded-lg">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>

    {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}
    </>
  );
}
