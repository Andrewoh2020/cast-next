import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'Cast is an AI character casting agency by Ability AI Technologies. Browse and license 100% AI-generated characters for film and video production.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">

        {/* Eyebrow */}
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">About Cast</p>

        {/* Hero headline */}
        <h1 className="text-5xl font-black tracking-tighter text-black leading-[1.05] mb-6">
          The future of film<br />doesn&apos;t wait for<br />a casting call.
        </h1>

        <p className="text-lg text-gray-500 leading-relaxed mb-16 max-w-xl">
          We built Cast for the filmmakers, studios, and creators who are writing the next chapter of entertainment — with AI as their lead actor.
        </p>

        {/* Origin story */}
        <div className="space-y-6 text-gray-600 leading-relaxed mb-16">
          <p>
            For most of human history, storytelling required a cast. That meant auditions, agents, contracts, release forms, rights negotiations, and the occasional ego. It meant that the vision in a creator&apos;s head was always held hostage — even a little — by the availability of the right human face.
          </p>
          <p>
            AI changed that. Suddenly, any filmmaker, anywhere in the world, could conjure a cold-eyed corporate villain, a warm-hearted mentor, or a Gen-Z hacker — exactly as imagined — without a single callback.
          </p>
          <p>
            But a new problem appeared: the characters were everywhere, and the rights were nowhere. Prompting tools created a wild west of unlicensed, legally murky assets that no serious production could rely on.
          </p>
          <p className="text-black font-semibold">
            Cast was built to fix that.
          </p>
          <p>
            We are a curated marketplace of fully AI-generated characters, each offered under clear, enforceable license terms. Every character on Cast is ready for commercial use — no prompting required, no rights headaches, no surprises.
          </p>
        </div>

        {/* Mission statement */}
        <div className="bg-black text-white rounded-2xl p-8 mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Our Mission</p>
          <p className="text-2xl font-black tracking-tighter leading-snug">
            To give every creator on the planet access to world-class characters — so the only limit on their story is their imagination.
          </p>
        </div>

        {/* Beliefs */}
        <div className="mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">What We Believe</p>
          <div className="space-y-5">
            {[
              {
                title: 'AI is a creative tool, not a shortcut.',
                body: 'The best AI-assisted films will be made by people with genuine vision. We exist to remove friction from that process — not to replace the craft.',
              },
              {
                title: 'Creators deserve legal clarity.',
                body: 'Ambiguous rights have killed more projects than bad scripts. Every Cast license is plain-language, enforceable, and built for real productions.',
              },
              {
                title: 'The new entertainment economy is already here.',
                body: 'AI films are reaching millions of viewers on YouTube, TikTok, and streaming platforms right now. We are not preparing for the future — we are operating in it.',
              },
              {
                title: 'Quality over quantity, always.',
                body: 'We are a curated roster, not a stock photo dump. Every character on Cast is reviewed for quality, distinctiveness, and commercial viability before it goes live.',
              },
            ].map((belief) => (
              <div key={belief.title} className="border-l-2 border-indigo-200 pl-5">
                <p className="font-bold text-black mb-1">{belief.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{belief.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company info */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">The Company</p>
          <p className="text-gray-600 leading-relaxed text-sm">
            Cast is a product of <strong className="text-black">Ability AI Technologies Private Limited</strong>, incorporated in Singapore (UEN: 202548889G). We are a small team with a focused mandate: make AI filmmaking accessible, legitimate, and extraordinary.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">Ready to cast your next production?</p>
          <Link
            href="/"
            className="inline-block bg-black text-white font-bold px-10 py-4 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Browse the Roster
          </Link>
          <p className="text-xs text-gray-400 mt-5">
            Questions?{' '}
            <a href="mailto:admin@ability.new" className="text-indigo-500 hover:underline">
              admin@ability.new
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
