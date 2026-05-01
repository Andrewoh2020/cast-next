import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ensureDripApplied } from '@/lib/user-data.server';
import { summarize } from '@/lib/entitlements.server';
import { readVisibleCharacters } from '@/lib/characters.server';
import {
  thumbUrl,
  SEX_LABELS,
  AGE_LABELS,
  RACE_LABELS,
  BUILD_LABELS,
  HEIGHT_LABELS,
} from '@/lib/talent';
import RefSheetGrid from './RefSheetGrid';
import CharacterActions from './CharacterActions';

export const metadata = {
  title: 'Character — Studio · Cast',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CharacterDetailPage({ params }: Props) {
  const { id } = await params;
  const characterId = Number(id);
  if (!Number.isFinite(characterId)) notFound();

  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/studio/character/${id}`);

  const userData = await ensureDripApplied(userId);
  const ent = summarize(userData);

  const characters = await readVisibleCharacters();
  const character = characters.find((c) => c.id === characterId);
  if (!character) notFound();

  const isSaved = (userData.savedRosterCharacterIds ?? []).includes(characterId);
  // Display quality is the same for everyone — matches the homepage roster.
  // Subscription gates the 4K download / audio, not what you see on screen.
  const heroSrc = thumbUrl(character.img, 1600);

  const exclusiveAvailable = !character.exclusiveDisabled;
  const exclusivePrice = character.prices.find((p) => p.name === 'Exclusive Rights');

  return (
    <main className="min-h-screen bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="flex items-center justify-between gap-3 mb-5">
          <Link
            href="/studio"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Studio
          </Link>
          <CharacterActions
            characterId={characterId}
            characterName={character.name}
            initialSaved={isSaved}
            entitlements={ent}
            referenceSheetUrl={character.referenceSheetUrl}
            workshopSlug={character.slug}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-10">
          <div className="relative rounded-3xl overflow-hidden bg-gray-100 aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroSrc}
              alt={character.name}
              className="w-full h-full object-cover object-top"
            />
            <span className="absolute top-3 left-3 inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-black bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
              By Cast
            </span>
          </div>

          <aside className="flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Character</p>
              <h1 className="text-3xl font-black tracking-tight text-black">{character.name}</h1>
              {character.vibe && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-5">{character.vibe}</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Identity</p>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gray-500">Sex</dt>
                <dd className="text-black font-semibold text-right">{SEX_LABELS[character.sex]}</dd>
                <dt className="text-gray-500">Age</dt>
                <dd className="text-black font-semibold text-right">{AGE_LABELS[character.ageRange]}</dd>
                {character.ethnicity && (
                  <>
                    <dt className="text-gray-500">Ethnicity</dt>
                    <dd className="text-black font-semibold text-right">{character.ethnicity}</dd>
                  </>
                )}
                {character.race && character.race.length > 0 && (
                  <>
                    <dt className="text-gray-500">Race</dt>
                    <dd className="text-black font-semibold text-right">{character.race.map((r) => RACE_LABELS[r]).join(', ')}</dd>
                  </>
                )}
                <dt className="text-gray-500">Build</dt>
                <dd className="text-black font-semibold text-right">{BUILD_LABELS[character.build]}</dd>
                <dt className="text-gray-500">Height</dt>
                <dd className="text-black font-semibold text-right">{HEIGHT_LABELS[character.height]}</dd>
              </dl>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Voice</p>
              <p className="text-sm text-gray-500">
                Voice presets land in the next polish round — preview in-page, download with a subscription.
              </p>
            </div>

            {exclusiveAvailable && exclusivePrice && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Exclusive rights</p>
                <p className="text-sm text-amber-900 mb-3">
                  Lock {character.name} for {exclusivePrice.price}. Removes them from the public roster — they remain yours indefinitely.
                </p>
                <Link
                  href={`/character/${character.slug}?exclusive=1`}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-amber-900 hover:bg-amber-950 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  Buy exclusive rights
                </Link>
              </div>
            )}
          </aside>
        </div>

        {character.referenceSheetUrl ? (
          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Reference sheet</p>
                <h2 className="text-xl font-black tracking-tight text-black">
                  Eight directable poses — grab any panel.
                </h2>
              </div>
            </div>
            <RefSheetGrid
              src={character.referenceSheetUrl}
              characterName={character.name}
              canDownload={ent.fullRes}
            />
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Reference sheet not available for this character yet.</p>
          </section>
        )}
      </div>
    </main>
  );
}
