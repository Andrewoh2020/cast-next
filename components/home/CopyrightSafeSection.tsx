import Link from 'next/link';

const PILLARS = [
  {
    title: 'No real-person likeness',
    body: 'Every character is 100% synthetic — composed from scratch, not trained on a single person. No face scans, no celebrity look-alikes, no likeness risk.',
  },
  {
    title: 'Commercial license on every cast',
    body: 'From free attribution tier to full ownership, every character ships with explicit commercial rights. Use them in ads, films, series, campaigns.',
  },
  {
    title: 'Written indemnity on Exclusive',
    body: 'Buy a character outright and we back it with a written indemnity clause. You own the likeness. We stand behind it.',
  },
];

export default function CopyrightSafeSection() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-white to-indigo-50/30 overflow-hidden">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Safe to ship</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4 leading-[1.05]">
            100% synthetic.<br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">0% likeness risk.</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real cameras photograph real people, and real people sue. Cast characters don&apos;t exist — so no one can claim you used their face.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="relative bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {/* Shield check icon */}
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h3 className="font-black text-black text-lg mb-2 tracking-tight">{pillar.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/copyright-faq"
            className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
          >
            Read the full copyright FAQ →
          </Link>
          <span className="text-gray-300 hidden sm:inline">·</span>
          <span className="text-gray-500">
            Every license includes a plain-English terms sheet.
          </span>
        </div>
      </div>
    </section>
  );
}
