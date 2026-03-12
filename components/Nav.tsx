'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-3xl font-black tracking-tight text-black">
          Cast<span className="text-indigo-500">.</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#roster" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Talent Roster
          </Link>
          <Link href="#how" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            How It Works
          </Link>
          {isSignedIn ? (
            <>
              <Link href="/account" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                My Account
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="text-sm font-semibold bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">
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
          <span className={`block w-5 h-0.5 bg-black transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-black transition-all ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-black transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 pb-5 flex flex-col gap-1">
          <Link href="#roster" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
            Talent Roster
          </Link>
          <Link href="#how" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
            How It Works
          </Link>
          {isSignedIn ? (
            <Link href="/account" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-gray-700 border-b border-gray-100">
              My Account
            </Link>
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
  );
}
