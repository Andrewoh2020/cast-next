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

import type { CustomWorkshopSummary } from '@/lib/custom-workshop.server';

interface Props {
  initialFavorites: Talent[];
  initialPurchases: PurchaseRecord[];
  allCharacters: Talent[];
  customCharacters?: CustomCharacterDraft[];
  customWorkshops?: CustomWorkshopSummary[];
  credits?: number;
}

type TabKey = 'workshops' | 'favorites' | 'purchases' | 'characters';

export default function AccountClient({
  initialFavorites,
  initialPurchases,
  customCharacters = [],
  customWorkshops = [],
}: Props) {
  const [tab, setTab] = useState<TabKey>('workshops');
  const [favorites, setFavorites] = useState<Talent[]>(initialFavorites);
  const [previewChar, setPreviewChar] = useState<CustomCharacterDraft | null>(null);

  const handleRemoveFavorite = async (talent: Talent) => {
    setFavorites((prev) => prev.filter((f) => f.id !== talent.id));
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: talent.id }),
    });
  };

  // Workshops auto-created from the /create flow are identified two ways
  // (legacy drafts may have been linked before workshopId was tracked):
  //   1. draft.workshopId matches the workshop id
  //   2. draft.profileImageUrl matches the workshop's sourceImageUrl
  const createdWorkshopIds = new Set(
    customCharacters.map((d) => d.workshopId).filter((id): id is string => !!id)
  );
  const createdSourceUrls = new Set(
    customCharacters.map((d) => d.profileImageUrl).filter((u): u is string => !!u)
  );
  const isCreatedWorkshop = (w: { id: string; sourceImageUrl: string }) =>
    createdWorkshopIds.has(w.id) || createdSourceUrls.has(w.sourceImageUrl);

  const allWorkshops = [
    ...customWorkshops.map((w) => ({
      key: `custom-${w.id}`,
      href: `/workshop/custom/${w.id}`,
      name: w.name,
      img: w.sourceImageUrl,
      detail: `${w.outfitCount} outfits · ${w.shotCount} shots`,
      kind: (isCreatedWorkshop(w) ? 'created' : 'custom') as 'created' | 'custom',
    })),
    ...initialPurchases.map((p) => ({
      key: `roster-${p.characterId}`,
      href: `/workshop/${p.characterSlug}`,
      name: p.characterName,
      img: p.characterImg,
      detail: `${p.licenseName} · Licensed`,
      kind: 'roster' as const,
    })),
  ];

  const kindLabel = (kind: 'created' | 'custom' | 'roster') =>
    kind === 'roster' ? 'Licensed' : kind === 'created' ? 'Created' : 'Custom';

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit mb-8 shadow-sm">
        {(['workshops', 'purchases', 'characters', 'favorites'] as const).map((t) => {
          const count =
            t === 'workshops' ? allWorkshops.length
            : t === 'purchases' ? initialPurchases.length
            : t === 'characters' ? customCharacters.length
            : favorites.length;
          const label = t === 'characters' ? 'Created Characters' : t === 'workshops' ? 'Workshops' : t;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize flex items-center gap-2 ${
                active ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              {label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Workshops */}
      {tab === 'workshops' && (
        allWorkshops.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2.5}>
                <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
              </svg>
            </div>
            <p className="font-bold text-black text-lg mb-2">Your workshop is empty</p>
            <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
              Upload a character photo, license a Cast actor, or build one from scratch — then dress them, place them in scenes, and export.
            </p>
            <Link href="/workshop" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
              </svg>
              Open Workshop
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{allWorkshops.length} workshops · click any to open</p>
              <Link href="/workshop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">+ New workshop</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allWorkshops.map((w) => (
                <Link key={w.key} href={w.href} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(w.img, 400)} alt={w.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur rounded px-2 py-0.5 ${
                      w.kind === 'created' ? 'bg-indigo-500/80' : 'bg-black/70'
                    }`}>
                      {kindLabel(w.kind)}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-black truncate">{w.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{w.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      )}

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
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/workshop/${p.characterSlug}`}
                    className="text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-2 rounded-lg transition-colors min-w-[100px] text-center"
                  >
                    Open Workshop
                  </Link>
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
                        label="Download assets"
                        className="text-xs font-semibold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 min-w-[100px] text-center"
                      />
                    ) : null;
                  })()}
                </div>
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
                <button
                  onClick={() => c.status === 'complete' ? setPreviewChar(c) : null}
                  className={`w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ${c.status === 'complete' ? 'cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-300 transition-all' : ''}`}
                >
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
                </button>
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
                <div className="flex flex-col gap-2 shrink-0">
                  {c.status === 'complete' && (
                    <button
                      onClick={() => setPreviewChar(c)}
                      className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors min-w-[80px] text-center"
                    >
                      Preview
                    </button>
                  )}
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
                        className="text-xs font-semibold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 min-w-[80px] text-center"
                      />
                    ) : null;
                  })() : (
                    <Link
                      href={`/create?draft=${c.id}`}
                      className="text-xs font-semibold text-indigo-500 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors min-w-[80px] text-center"
                    >
                      {c.status === 'generating' ? 'View' : 'Continue'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Character preview modal */}
      {previewChar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setPreviewChar(null)}>
          <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewChar(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                  {(previewChar.profileThumbnailUrl || previewChar.profileImageUrl) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewChar.profileThumbnailUrl || thumbUrl(previewChar.profileImageUrl!, 96)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-black">{previewChar.name}</h2>
                  <p className="text-xs text-gray-500">Created {new Date(previewChar.completedAt || previewChar.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile photo */}
                {previewChar.profileImageUrl && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Profile photo</p>
                    <div className="rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(previewChar.profileImageUrl, 800)} alt={`${previewChar.name} profile`} className="w-full h-auto" />
                    </div>
                  </div>
                )}

                {/* Reference sheet */}
                {previewChar.referenceSheetUrl && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Reference sheet</p>
                    <div className="rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(previewChar.referenceSheetUrl, 2000)} alt={`${previewChar.name} reference sheet`} className="w-full h-auto" />
                    </div>
                  </div>
                )}
              </div>

              {previewChar.description && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{previewChar.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

