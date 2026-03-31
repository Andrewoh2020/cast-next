'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Talent, thumbUrl } from '@/lib/talent';
import { PurchaseRecord } from '@/lib/user-data.server';
import { CustomCharacterDraft } from '@/lib/custom-characters.server';
import DownloadButton from '@/components/DownloadButton';

function LicenseExpiry({ licenseName, purchasedAt }: { licenseName: string; purchasedAt: string }) {
  if (licenseName === 'Exclusive Rights') {
    return <span className="text-xs text-gray-400">No expiry</span>;
  }

  const purchased = new Date(purchasedAt);
  const expiry = new Date(purchased);
  expiry.setFullYear(expiry.getFullYear() + 1);

  const now = new Date();
  const msLeft = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return (
      <span className="text-xs font-semibold text-red-500">
        Expired
      </span>
    );
  }

  if (daysLeft <= 30) {
    return (
      <span className="text-xs font-semibold text-amber-500">
        {daysLeft}d left
      </span>
    );
  }

  const monthsLeft = Math.floor(daysLeft / 30);
  return (
    <span className="text-xs font-semibold text-green-600">
      {monthsLeft}mo left
    </span>
  );
}

interface Props {
  initialFavorites: Talent[];
  initialPurchases: PurchaseRecord[];
  allCharacters: Talent[];
  customCharacters?: CustomCharacterDraft[];
}

export default function AccountClient({ initialFavorites, initialPurchases, customCharacters = [] }: Props) {
  const [tab, setTab] = useState<'favorites' | 'purchases' | 'characters'>('favorites');
  const [favorites, setFavorites] = useState<Talent[]>(initialFavorites);

  const handleRemoveFavorite = async (talent: Talent) => {
    setFavorites((prev) => prev.filter((f) => f.id !== talent.id));
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: talent.id }),
    });
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-8">
        {(['favorites', 'purchases', 'characters'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            {t === 'characters' ? 'My Characters' : t}
          </button>
        ))}
      </div>

      {/* Favorites */}
      {tab === 'favorites' && (
        favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🤍</div>
            <p className="font-semibold text-gray-600 mb-1">No favorites yet</p>
            <p className="text-sm text-gray-400 mb-5">Browse the roster and heart characters you love.</p>
            <Link href="/#roster" className="text-sm font-semibold text-indigo-500 hover:underline">
              Browse Talent →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {favorites.map((talent) => (
              <div key={talent.id} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <Link href="/#roster" className="block">
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(talent.img, 400)} alt={talent.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-black">{talent.name}</p>
                    <p className="text-xs text-gray-400">From {talent.prices[0]?.price}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveFavorite(talent)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from favorites"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Purchases */}
      {tab === 'purchases' && (
        initialPurchases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🎬</div>
            <p className="font-semibold text-gray-600 mb-1">No purchases yet</p>
            <p className="text-sm text-gray-400 mb-5">License a character to get started.</p>
            <Link href="/#roster" className="text-sm font-semibold text-indigo-500 hover:underline">
              Browse Talent →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {initialPurchases.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(p.characterImg, 96)} alt={p.characterName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-black">{p.characterName}</p>
                  <p className="text-sm text-gray-500">{p.licenseName} License · {p.licensePrice}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{new Date(p.purchasedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <span className="text-gray-300">·</span>
                    <LicenseExpiry licenseName={p.licenseName} purchasedAt={p.purchasedAt} />
                  </div>
                </div>
                {(() => {
                  const files: { url: string; filename: string }[] = [];
                  if (p.characterImg) {
                    files.push({
                      url: `${p.characterImg}${p.characterImg.includes('?') ? '&' : '?'}download=1&filename=${p.characterSlug}-profile`,
                      filename: `${p.characterSlug}-profile`,
                    });
                  }
                  if (p.referenceSheetUrl) {
                    files.push({
                      url: `${p.referenceSheetUrl}${p.referenceSheetUrl.includes('?') ? '&' : '?'}download=1&filename=${p.characterSlug}-reference-sheet`,
                      filename: `${p.characterSlug}-reference-sheet`,
                    });
                  }
                  return files.length > 0 ? (
                    <DownloadButton
                      files={files}
                      label="Download"
                      className="flex-shrink-0 text-xs font-semibold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 min-w-[80px] text-center"
                    />
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        )
      )}

      {/* My Characters */}
      {tab === 'characters' && (
        customCharacters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">✨</div>
            <p className="font-semibold text-gray-600 mb-1">No custom characters yet</p>
            <p className="text-sm text-gray-400 mb-5">Create your own AI character from scratch.</p>
            <Link href="/create" className="text-sm font-semibold text-indigo-500 hover:underline">
              Create a Character →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {customCharacters.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {(c.profileThumbnailUrl || c.profileImageUrl) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={c.profileThumbnailUrl || thumbUrl(c.profileImageUrl!, 96)}
                      alt={c.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : c.previewImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumbUrl(c.previewImageUrl, 96)}
                      alt={c.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl font-bold">
                      {c.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-black">{c.name}</p>
                    {c.status !== 'complete' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'generating' ? 'bg-indigo-100 text-indigo-600' :
                        c.status === 'preview' || c.status === 'paid' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {c.status === 'generating' ? 'Generating' :
                         c.status === 'preview' || c.status === 'paid' ? 'In Progress' :
                         'Draft'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{c.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Created {new Date(c.completedAt || c.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {c.status === 'complete' ? (() => {
                  const files: { url: string; filename: string }[] = [];
                  if (c.profileImageUrl) {
                    files.push({
                      url: `${c.profileImageUrl}${c.profileImageUrl.includes('?') ? '&' : '?'}download=1&filename=${c.slug}-profile`,
                      filename: `${c.slug}-profile`,
                    });
                  }
                  if (c.referenceSheetUrl) {
                    files.push({
                      url: `${c.referenceSheetUrl}${c.referenceSheetUrl.includes('?') ? '&' : '?'}download=1&filename=${c.slug}-reference-sheet`,
                      filename: `${c.slug}-reference-sheet`,
                    });
                  }
                  return files.length > 0 ? (
                    <DownloadButton
                      files={files}
                      label="Download"
                      className="flex-shrink-0 text-xs font-semibold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 min-w-[80px] text-center"
                    />
                  ) : null;
                })() : (
                  <Link
                    href={`/create?draft=${c.id}`}
                    className="flex-shrink-0 text-xs font-semibold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors min-w-[80px] text-center"
                  >
                    {c.status === 'generating' ? 'View' : 'Continue'}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
