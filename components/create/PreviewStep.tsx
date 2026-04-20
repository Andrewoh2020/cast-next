'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { CustomCharacterDraft } from '@/lib/custom-characters.server';
import { thumbUrl } from '@/lib/talent';

interface Props {
  draft: CustomCharacterDraft;
  isGenerating: boolean;
  generationError: string;
  credits: number;
  onGenerate: () => void;
  onSelectPreview: (url: string) => void;
  onComplete: (draft: CustomCharacterDraft) => void;
  onBack: () => void;
}

const MAX_ITERATIONS = 2;

export default function PreviewStep({ draft, isGenerating, generationError, credits, onGenerate, onSelectPreview, onComplete, onBack }: Props) {
  const selectedUrl = draft.previewImageUrl ?? '';
  const previewImages = draft.previewImages ?? [];
  const iterations = draft.iterations ?? 0;

  // Animated progress bar — climbs to 95% over ~180s, completes when done
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating) {
      // Reset + tick are both legitimate state syncs to the isGenerating prop;
      // an extra render on the start tick is acceptable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);
      const startTime = Date.now();
      const targetMs = 180_000; // 3 minutes
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
  }, [isGenerating]);

  const handleContinue = () => {
    onComplete({
      ...draft,
      previewImageUrl: selectedUrl,
      iterations,
      status: 'preview',
    });
  };

  const canRegenerate = iterations < MAX_ITERATIONS && !isGenerating;
  const remainingRerolls = MAX_ITERATIONS - iterations;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <h2 className="text-xl font-black tracking-tight text-black mb-1">Preview</h2>
      <p className="text-sm text-gray-400 mb-6">
        Here&apos;s your AI-generated character. You can regenerate up to {MAX_ITERATIONS} times.
        {previewImages.length > 1 && ' Click a thumbnail below to compare versions.'}
      </p>

      {/* Selected preview image */}
      <div className="relative w-full max-w-sm mx-auto mb-6">
        {isGenerating ? (
          <div className="w-full rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center px-6" style={{ aspectRatio: '2/3' }}>
            <div className="text-center w-full max-w-xs">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-black">Generating preview...</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">This can take up to 2–3 minutes</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-semibold">{progress}%</p>
            </div>
          </div>
        ) : selectedUrl ? (
          <Image
            src={thumbUrl(selectedUrl, 400)}
            alt={draft.name}
            width={400}
            height={600}
            className="w-full rounded-2xl object-cover"
          />
        ) : null}

        {generationError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {generationError}
          </div>
        )}
      </div>

      {/* Thumbnail selector — shown when there are multiple previews */}
      {!isGenerating && previewImages.length > 1 && (
        <div className="flex items-center justify-center gap-3 mb-6">
          {previewImages.map((url, i) => (
            <button
              key={url}
              onClick={() => onSelectPreview(url)}
              className={`relative w-16 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                selectedUrl === url
                  ? 'border-indigo-500 shadow-md shadow-indigo-100 scale-105'
                  : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'
              }`}
            >
              <Image
                src={thumbUrl(url, 80)}
                alt={`Version ${i + 1}`}
                fill
                className="object-cover"
              />
              <span className={`absolute bottom-0 inset-x-0 text-center text-[10px] font-bold py-0.5 ${
                selectedUrl === url ? 'bg-indigo-500 text-white' : 'bg-black/40 text-white/80'
              }`}>
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Character info */}
      {!isGenerating && selectedUrl && (
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-black">{draft.name}</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">{draft.description}</p>
        </div>
      )}

      {/* Regenerate */}
      {!isGenerating && selectedUrl && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={onGenerate}
            disabled={!canRegenerate}
            className="text-sm font-semibold border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Regenerate
          </button>
          <span className="text-xs text-gray-400">
            {remainingRerolls > 0
              ? `${remainingRerolls} re-roll${remainingRerolls > 1 ? 's' : ''} remaining`
              : 'No re-rolls remaining'}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:border-gray-400 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedUrl || isGenerating}
          className="flex-1 bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {credits > 0 ? 'Generate Character' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
}
