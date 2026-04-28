'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CustomCharacterDraft, RefSheetAttempt } from '@/lib/custom-characters.server';
import { thumbUrl } from '@/lib/talent';

interface Props {
  draft: CustomCharacterDraft;
  generating?: boolean;
  generationError?: string;
  onRetry?: () => void;
}

const MAX_REFSHEET_REGENS = 3;

function buildInitialAttempts(draft: CustomCharacterDraft): RefSheetAttempt[] {
  if (draft.referenceSheetAttempts && draft.referenceSheetAttempts.length > 0) {
    return draft.referenceSheetAttempts;
  }
  if (draft.referenceSheetUrl) {
    return [{
      id: 'v1',
      url: draft.referenceSheetUrl,
      thumbnailUrl: draft.referenceSheetThumbnailUrl,
      createdAt: draft.completedAt ?? draft.updatedAt,
    }];
  }
  return [];
}

export default function CompleteStep({ draft, generating, generationError, onRetry }: Props) {
  const [downloadingProfile, setDownloadingProfile] = useState(false);
  const [downloadingRef, setDownloadingRef] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<RefSheetAttempt[]>(() => buildInitialAttempts(draft));
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initial = buildInitialAttempts(draft);
    const match = initial.find((a) => a.url === draft.referenceSheetUrl);
    return match?.id ?? initial[initial.length - 1]?.id ?? null;
  });
  const [selecting, setSelecting] = useState(false);
  const [regenCount, setRegenCount] = useState(draft.refSheetRegenerations ?? 0);
  const [sendingToWorkshop, setSendingToWorkshop] = useState(false);
  const [workshopError, setWorkshopError] = useState<string | null>(null);

  const selectedAttempt = attempts.find((a) => a.id === selectedId);
  const refSheetUrl = selectedAttempt?.url ?? draft.referenceSheetUrl;

  const sendToWorkshop = async () => {
    setSendingToWorkshop(true);
    setWorkshopError(null);
    try {
      const res = await fetch('/api/create/send-to-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open Character Studio');
      window.location.href = `/workshop/custom/${data.workshopId}`;
    } catch (err) {
      setWorkshopError(err instanceof Error ? err.message : 'Failed to open Character Studio');
      setSendingToWorkshop(false);
    }
  };

  // Keep local state in sync when draft prop updates (e.g., after generation completes or switching drafts)
  useEffect(() => {
    const nextAttempts = buildInitialAttempts(draft);
    setAttempts(nextAttempts);
    const match = nextAttempts.find((a) => a.url === draft.referenceSheetUrl);
    setSelectedId(match?.id ?? nextAttempts[nextAttempts.length - 1]?.id ?? null);
    setRegenCount(draft.refSheetRegenerations ?? 0);
    // Intentionally narrow deps — re-running on every draft mutation would
    // reset selection during normal interaction. The four watched fields
    // cover the cases that actually require resync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, draft.referenceSheetUrl, draft.refSheetRegenerations, draft.referenceSheetAttempts]);

  // Animated progress bar for ref sheet generation — climbs to 95% over ~180s
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLoading = generating || (!draft.profileImageUrl && !generationError);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const startTime = Date.now();
      const targetMs = 180_000;
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(95, Math.floor((elapsed / targetMs) * 95));
        setProgress(pct);
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading]);

  const regenerateRefSheet = async () => {
    setRegenerating(true);
    setRegenError(null);
    try {
      const res = await fetch('/api/create/regenerate-refsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Regeneration failed');
      setAttempts(data.attempts ?? []);
      setSelectedId(data.selectedId);
      setRegenCount(data.refSheetRegenerations);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed');
    }
    setRegenerating(false);
  };

  const selectAttempt = async (attemptId: string) => {
    if (attemptId === selectedId || selecting) return;
    const previousId = selectedId;
    setSelectedId(attemptId);
    setSelecting(true);
    try {
      const res = await fetch('/api/create/select-refsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, attemptId }),
      });
      if (!res.ok) throw new Error('Failed to select attempt');
    } catch {
      setSelectedId(previousId);
    }
    setSelecting(false);
  };

  const downloadFile = async (url: string, filename: string, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}download=1&filename=${filename}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback to direct link
      const sep = url.includes('?') ? '&' : '?';
      const a = document.createElement('a');
      a.href = `${url}${sep}download=1&filename=${filename}`;
      a.download = filename;
      a.click();
    }
    setLoading(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-black mb-1">Generating Your Assets</h2>
        <p className="text-sm text-gray-400 mb-6">
          Creating the 4K reference sheet for <strong className="text-black">{draft.name}</strong>.
        </p>

        <div className="max-w-sm mx-auto space-y-3 mb-6">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="w-5 h-5 text-green-500 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <span className="text-sm text-gray-600">2K profile photo ready</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-gray-600">Generating 4K reference sheet...</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-sm mx-auto mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-2">{progress}%</p>
        </div>

        <p className="text-xs text-gray-400 max-w-sm mx-auto">This can take up to 2–3 minutes. You can leave this page — a receipt with download links will be emailed to you as soon as your assets are ready.</p>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-black mb-1">Generation Failed</h2>
        <p className="text-sm text-gray-400 mb-2">
          Something went wrong while generating assets for <strong className="text-black">{draft.name}</strong>.
        </p>
        <p className="text-sm text-red-500 mb-6">{generationError}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="text-2xl font-black tracking-tight text-black mb-1">Your Character is Ready!</h2>
      <p className="text-sm text-gray-400 mb-5">
        <strong className="text-black">{draft.name}</strong> has been purchased. The real magic happens next.
      </p>

      {/* Primary CTA — Take to Workshop (moved above assets so it's visible without scrolling) */}
      <div className="max-w-lg mx-auto mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 text-left">
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
          </svg>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Next step — Character Studio</p>
        </div>
        <h3 className="text-base font-black text-black mb-1">Unlock {draft.name}&apos;s full potential</h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          Dress them in new outfits, place them in any scene, and export a package ready for Kling, Higgsfield, or Artlist.
        </p>
        <button
          onClick={sendToWorkshop}
          disabled={sendingToWorkshop}
          className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {sendingToWorkshop ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Opening Studio...</>
          ) : (
            <>Open in Character Studio
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
        {workshopError && <p className="mt-2 text-xs text-red-500 text-center">{workshopError}</p>}
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
        {draft.profileImageUrl && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Profile Photo</p>
            <p className="text-[10px] text-gray-400 mb-2">2K resolution</p>
            <Image
              src={thumbUrl(draft.profileImageUrl, 400)}
              alt={`${draft.name} profile`}
              width={400}
              height={600}
              className="w-full rounded-xl object-cover"
            />
            <button
              disabled={downloadingProfile}
              onClick={() => downloadFile(draft.profileImageUrl!, `${draft.slug}-profile`, setDownloadingProfile)}
              className="mt-2 w-full text-sm font-semibold bg-black text-white py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {downloadingProfile ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Downloading...</>
              ) : 'Download Profile'}
            </button>
          </div>
        )}
        {refSheetUrl && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reference Sheet</p>
            <p className="text-[10px] text-gray-400 mb-2">4K resolution</p>
            <Image
              src={thumbUrl(refSheetUrl, 400)}
              alt={`${draft.name} reference sheet`}
              width={400}
              height={172}
              className="w-full rounded-xl object-cover"
              key={refSheetUrl}
            />

            {/* Attempt switcher — shown when there are 2+ attempts */}
            {attempts.length > 1 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 text-left">
                  Choose your favorite ({attempts.length} attempts)
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {attempts.map((a) => {
                    const active = a.id === selectedId;
                    return (
                      <button
                        key={a.id}
                        onClick={() => selectAttempt(a.id)}
                        disabled={selecting}
                        className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          active ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400'
                        } disabled:opacity-60`}
                        title={active ? 'Selected' : `Use ${a.id.toUpperCase()}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbUrl(a.thumbnailUrl ?? a.url, 200)}
                          alt={`Attempt ${a.id}`}
                          className="w-24 h-12 object-cover"
                        />
                        <span className={`absolute bottom-0.5 left-0.5 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          active ? 'bg-indigo-500 text-white' : 'bg-black/60 text-white'
                        }`}>
                          {a.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              disabled={downloadingRef}
              onClick={() => downloadFile(refSheetUrl!, `${draft.slug}-reference-sheet`, setDownloadingRef)}
              className="mt-2 w-full text-sm font-semibold bg-black text-white py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {downloadingRef ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Downloading...</>
              ) : 'Download Reference Sheet'}
            </button>

            {/* Regenerate reference sheet */}
            {regenCount < MAX_REFSHEET_REGENS ? (
              <button
                disabled={regenerating}
                onClick={regenerateRefSheet}
                className="mt-2 w-full text-xs font-medium text-gray-500 py-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {regenerating ? (
                  <><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Regenerating...</>
                ) : (
                  <>Try Another Version ({MAX_REFSHEET_REGENS - regenCount} {MAX_REFSHEET_REGENS - regenCount === 1 ? 'attempt' : 'attempts'} left)</>
                )}
              </button>
            ) : (
              <p className="mt-2 text-xs text-gray-400 text-center">
                No regenerations remaining. Need help? Contact <a href="mailto:admin@castability.ai" className="text-indigo-500 hover:underline">admin@castability.ai</a>
              </p>
            )}
            {regenError && <p className="mt-1 text-xs text-red-500 text-center">{regenError}</p>}
          </div>
        )}
      </div>

    </div>
  );
}
