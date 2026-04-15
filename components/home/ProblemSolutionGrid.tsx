import Link from 'next/link';

export default function ProblemSolutionGrid() {
  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      title: 'Copyright-safe for commercial use',
      description: 'Every character is 100% AI-generated with zero real-person training data. No likeness lawsuits. No model releases. Your legal team can sign off with confidence.',
      link: '/copyright-faq',
      linkLabel: 'Read the Copyright FAQ →',
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      title: 'Consistent across every shot',
      description: 'Every character comes with a 4K 8-panel reference sheet — front, side, back, and 4 close-ups. Drop any panel into Kling, Runway, or Veo as a starting frame.',
      link: '/blog/character-consistency-ai-video',
      linkLabel: 'Learn about reference sheets →',
      color: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: 'From prompt to cast in 90 seconds',
      description: 'Describe the character you need. Cast generates a photoreal profile photo and full reference sheet in about a minute and a half. No prompt engineering required.',
      link: '/how-it-works',
      linkLabel: 'See how it works →',
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
    },
  ];

  return (
    <section className="relative py-24 px-6 bg-gray-50 bg-dot-grid">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Why Cast</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4">
            Built for AI video production.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Everything you need to cast a character for film, ads, and commercial content — without the creative gamble or the legal risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="relative bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-xl hover:border-gray-200 transition-all hover:-translate-y-1">
              <div className={`w-14 h-14 ${f.bg} ${f.text} rounded-2xl flex items-center justify-center mb-5`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-black tracking-tight text-black mb-3">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{f.description}</p>
              <Link
                href={f.link}
                className={`inline-flex items-center text-sm font-semibold ${f.text} hover:opacity-80 transition-opacity`}
              >
                {f.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
