import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readCharacters } from '@/lib/characters.server';
import { readSeo } from '@/lib/seo.server';
import {
  SEX_LABELS,
  RACE_LABELS,
  AGE_LABELS,
  BUILD_LABELS,
  HEIGHT_LABELS,
  thumbUrl,
} from '@/lib/talent';
import CharacterPageClient from './CharacterPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [characters, seo] = await Promise.all([readCharacters(), readSeo()]);
  const character = characters.find((c) => c.slug === slug);
  if (!character) return { title: 'Character Not Found' };

  const base = seo.canonicalUrl || 'https://www.castability.ai';
  const title = character.name;
  const description = character.vibe
    ? `${character.name} — ${character.vibe} License this AI-generated character for your next production.`
    : `License ${character.name}, a 100% AI-generated character for film and video production.`;

  return {
    title,
    description,
    openGraph: {
      title: `${character.name} | Cast`,
      description,
      url: `${base}/characters/${slug}`,
      images: character.img ? [{ url: character.img, width: 800, height: 1067 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${character.name} | Cast`,
      description,
      images: character.img ? [character.img] : [],
    },
    alternates: {
      canonical: `${base}/characters/${slug}`,
    },
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const [characters, seo] = await Promise.all([readCharacters(), readSeo()]);
  const character = characters.find((c) => c.slug === slug);
  if (!character) notFound();

  const base = seo.canonicalUrl || 'https://www.castability.ai';

  const tags = [
    SEX_LABELS[character.sex],
    AGE_LABELS[character.ageRange],
    ...(character.race || []).map((r) => RACE_LABELS[r]),
  ];

  const details = [
    { label: 'Sex', value: SEX_LABELS[character.sex] },
    { label: 'Age', value: character.age ? `${character.age}` : AGE_LABELS[character.ageRange] },
    { label: 'Build', value: BUILD_LABELS[character.build] },
    { label: 'Height', value: HEIGHT_LABELS[character.height] },
    { label: 'Race', value: (character.race || []).map((r) => RACE_LABELS[r]).join(', ') || '—' },
    { label: 'Ethnicity', value: character.ethnicity || '—' },
  ];

  // JSON-LD Product schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: character.name,
    description: character.vibe,
    image: character.img,
    url: `${base}/characters/${slug}`,
    brand: { '@type': 'Organization', name: 'Cast' },
    offers: character.prices.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: p.amount,
      priceCurrency: 'USD',
      availability: character.exclusive
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* Left — Image */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-gray-100" style={{ paddingBottom: '133%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(character.img, 800)}
                  alt={character.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {character.exclusive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-sm font-bold bg-amber-500/80 text-white px-4 py-2 rounded-full uppercase tracking-wider">
                      Exclusively Licensed
                    </span>
                  </div>
                )}
              </div>
              {character.referenceSheetUrl && (
                <div className="rounded-2xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(character.referenceSheetUrl, 800)}
                    alt={`${character.name} reference sheet`}
                    className="w-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Right — Details */}
            <div>
              <h1 className="text-4xl font-black tracking-tight text-black mb-3">
                {character.name}
              </h1>

              {character.vibe && (
                <p className="text-gray-500 text-base leading-relaxed mb-6">{character.vibe}</p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((tag) => (
                  <span key={tag} className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Attributes */}
              <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 mb-8">
                {details.map((d) => (
                  <div key={d.label} className="flex justify-between px-5 py-3.5">
                    <span className="text-sm text-gray-400">{d.label}</span>
                    <span className="text-sm font-semibold text-black">{d.value}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="mb-8">
                <h2 className="text-sm font-bold text-black mb-4">License Options</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border border-gray-100 rounded-xl px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold text-black">Free (Attribution)</div>
                      <div className="text-xs text-gray-400">Credit required</div>
                    </div>
                    <div className="text-lg font-black text-black">Free</div>
                  </div>
                  {character.prices.map((p, i) => (
                    <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl px-5 py-4">
                      <div>
                        <div className="text-sm font-semibold text-black">{p.name}</div>
                      </div>
                      <div className="text-lg font-black text-black">{p.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <CharacterPageClient character={character} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
