'use client';

import { useState } from 'react';
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

export default function CompleteStep({ draft, generating, generationError, onRetry, onNewCharacter }: Props) {
  const [downloadingProfile, setDownloadingProfile] = useState(false);
  const [downloadingRef, setDownloadingRef] = useState(false);

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

  const isReady = draft.profileImageUrl && draft.referenceSheetUrl && !generating;

  // If no URLs and not explicitly in error state, treat as still generating
  const effectivelyGenerating = generating || (!draft.profileImageUrl && !generationError);

  if (effectivelyGenerating) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-black mb-1">Generating Your Assets</h2>
        <p className="text-sm text-gray-400 mb-6">
          Creating the hi-res profile photo and 8-panel reference sheet for <strong className="text-black">{draft.name}</strong>.
        </p>

        <div className="max-w-sm mx-auto space-y-3 mb-6">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-gray-600">Generating hi-res profile photo...</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="w-5 h-5 border-2 border-gray-200 rounded-full flex-shrink-0" />
            <span className="text-sm text-gray-400">8-panel reference sheet</span>
          </div>
        </div>

        <p className="text-xs text-gray-400">This may take up to 4 minutes. You can leave this page — a receipt with download links will be emailed to you as soon as your assets are ready.</p>
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
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Profile Photo</p>
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
        {draft.referenceSheetUrl && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reference Sheet</p>
            <Image
              src={thumbUrl(draft.referenceSheetUrl, 400)}
              alt={`${draft.name} reference sheet`}
              width={400}
              height={172}
              className="w-full rounded-xl object-cover"
            />
            <button
              disabled={downloadingRef}
              onClick={() => downloadFile(draft.referenceSheetUrl!, `${draft.slug}-reference-sheet`, setDownloadingRef)}
              className="mt-2 w-full text-sm font-semibold bg-black text-white py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {downloadingRef ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Downloading...</>
              ) : 'Download Reference Sheet'}
            </button>
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
