'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WorkshopRedirect({ slug }: { slug: string }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          router.push(`/workshop/${slug}`);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [slug, router]);

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/workshop/${slug}`}
        className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-colors text-sm flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
        </svg>
        Continue to Workshop
      </Link>
      <p className="text-xs text-gray-400 text-center">
        Redirecting in {seconds}s…
      </p>
      <Link href="/#roster" className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:border-gray-400 transition-colors text-sm text-center">
        Browse More Talent
      </Link>
    </div>
  );
}
