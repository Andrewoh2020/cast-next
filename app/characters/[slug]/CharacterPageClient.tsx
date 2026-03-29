'use client';

import { Talent } from '@/lib/talent';
import Link from 'next/link';

interface Props {
  character: Talent;
}

export default function CharacterPageClient({ character }: Props) {
  if (character.exclusive) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-center">
        <p className="text-sm font-semibold text-amber-800">This character has been exclusively licensed.</p>
        <Link href="/" className="text-sm text-indigo-500 hover:underline mt-2 inline-block">
          Browse available characters
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={`/?character=${character.slug}`}
      className="block w-full bg-indigo-500 text-white font-bold text-center py-4 rounded-xl hover:bg-indigo-600 transition-colors text-sm"
    >
      License This Character
    </Link>
  );
}
