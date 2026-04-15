'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CustomCharacterDraft } from '@/lib/custom-characters.server';
import { thumbUrl } from '@/lib/talent';

interface Props {
  draft: CustomCharacterDraft;
  generating?: boolean;
  generationError?: string;
  onRetry?: () => void;
  onNewCharacter: () => void;
}

const MAX_REFSHEET_REGENS = 3;

export default function CompleteStep({ draft, generating, generationError, onRetry, onNewCharacter }: Props) {
  const [downloadingProfile, setDownloadingProfile] = useState(false);
  const [downloadingRef, setDownloadingRef] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [refSheetUrl, setRefSheetUrl] = useState(draft.referenceSheetUrl);
  const [regenCount, setRegenCount] = useState(draft.refSheetRegenerations ?? 0);

  // Keep local state in sync when draft prop updates (e.g., after generation completes or switching drafts)
  useEffect(() => {
    setRefSheetUrl(draft.referenceSheetUrl);
    setRegenCount(draft.refSheetRegenerations ?? 0);
  }, [draft.id, draft.referenceSheetUrl, draft.refSheetRegenerations]);

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
      setRefSheetUrl(data.referenceSheetUrl);
      setRegenCount(data.refSheetRegenerations);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed');
    }
    setRegenerating(false);
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
      <p className="text-sm text-gray-400 mb-8">
        <strong className="text-black">{draft.name}</strong> has been purchased. Download your assets below.
      </p>

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
                  <>Regenerate Reference Sheet ({MAX_REFSHEET_REGENS - regenCount} {MAX_REFSHEET_REGENS - regenCount === 1 ? 'attempt' : 'attempts'} remaining)</>
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

      {/* Actions */}
      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <button
          onClick={onNewCharacter}
          className="w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200"
        >
          Create Another Character
        </button>
        <a
          href="/account"
          className="w-full border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:border-gray-400 transition-colors block text-center"
        >
          View in My Account
        </a>
      </div>
    </div>
  );
}
