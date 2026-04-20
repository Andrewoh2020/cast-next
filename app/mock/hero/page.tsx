import Link from 'next/link';

export const metadata = {
  title: 'Hero experiments — Cast',
  robots: { index: false, follow: false },
};

const VARIANTS = [
  {
    slug: 'pipeline',
    title: 'Export Reel (narrative)',
    desc: 'Hero keeps the production text/search on white. Bottom strip narrates the pipeline: Cast profile → Kling / Runway / Veo gates → your video. Rotates through characters every 8s.',
  },
  {
    slug: 'stripe',
    title: 'Stripe Ribbon (light)',
    desc: 'Stripe-style flowing ribbon from the top-right corner on a white backdrop. Indigo → violet → pink → coral → tangerine → gold, morphing slowly. Positions Cast as infrastructure, not just a product.',
  },
  {
    slug: 'lens',
    title: 'Cinematic Lens (dark)',
    desc: 'Canvas-animated bokeh mesh gradient. Deep slate + teal + tungsten orange drifting through a soft-focus haze.',
  },
  {
    slug: 'cascade',
    title: 'Blurred Turnaround Cascade (dark)',
    desc: 'Real reference sheets scrolled in staggered columns, heavily blurred into a shifting mosaic of skin tones and wardrobe.',
  },
  {
    slug: 'frosted',
    title: 'Frosted Reveal (dark)',
    desc: 'Looping reel video behind a frosted-glass overlay. A cursor spotlight punches through the blur to reveal sharp video underneath.',
  },
];

export default function HeroExperimentsIndex() {
  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">
          Internal
        </p>
        <h1 className="text-4xl font-black tracking-tighter text-black mb-4">
          Hero background experiments
        </h1>
        <p className="text-gray-600 mb-10">
          Three variants swapping the homepage hero background while keeping the same foreground copy, search form, and archetype chips.
        </p>

        <div className="space-y-4">
          {VARIANTS.map((v) => (
            <Link
              key={v.slug}
              href={`/mock/hero/${v.slug}`}
              className="block bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-black mb-2">
                    {v.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </div>
                <span className="shrink-0 text-indigo-500 font-bold text-xl">→</span>
              </div>
              <p className="mt-3 text-[11px] font-mono text-gray-400">
                /mock/hero/{v.slug}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
