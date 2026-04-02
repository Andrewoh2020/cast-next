import { Metadata } from 'next';
import { launches } from '@/lib/launches';

export const metadata: Metadata = {
  title: 'Recent Launches',
  description:
    'See the latest features, updates, and improvements to Cast — the AI character casting agency. New characters, tools, and capabilities shipping regularly.',
  openGraph: {
    title: 'Recent Launches — Cast',
    description:
      'See the latest features, updates, and improvements to Cast — the AI character casting agency.',
  },
};

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function LaunchesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Cast — Recent Launches',
    description: 'Product updates and new features from Cast, the AI character casting agency.',
    blogPost: launches.map((l) => ({
      '@type': 'BlogPosting',
      headline: l.title,
      description: l.summary,
      datePublished: l.date,
    })),
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
          Changelog
        </p>

        <h1 className="text-5xl font-black tracking-tighter text-black leading-[1.05] mb-6">
          Recent Launches
        </h1>

        <p className="text-lg text-gray-500 leading-relaxed mb-16 max-w-xl">
          Everything new at Cast — features, improvements, and milestones as we build the future of AI casting.
        </p>

        <div className="space-y-16">
          {launches.map((launch) => (
            <article key={launch.date} className="relative pl-8 border-l-2 border-indigo-100">
              <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-indigo-500" />

              <time className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                {formatDate(launch.date)}
              </time>

              <h2 className="text-2xl font-black tracking-tight text-black mb-3 leading-snug">
                {launch.title}
              </h2>

              <p className="text-gray-500 leading-relaxed mb-4">{launch.summary}</p>

              <ul className="space-y-2">
                {launch.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
