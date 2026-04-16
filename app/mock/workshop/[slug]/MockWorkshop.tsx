'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Mock data ───────────────────────────────────────────────────────────

const CHARACTER = {
  name: 'Min-ji Park',
  slug: 'min-ji-park',
  ageRange: '20s',
  ethnicity: 'Korean',
  license: 'Studio License',
  profileImg: '/api/media?p=custom%2Fuser_3CM1Wxh6LIF4NfkCwMyfn1qZUkp%2Fmin-ji-park-profile-1776180802444.jpg',
  referenceSheetUrl: '/api/media?p=custom%2Fuser_3CM1Wxh6LIF4NfkCwMyfn1qZUkp%2Fmin-ji-park-refsheet-1776181227543.jpg',
};

type Kind = 'outfit' | 'scene';
type Asset = { id: string; kind: Kind; prompt: string; img: string; createdAt: number };

const MOCK_LIBRARY: Asset[] = [
  { id: 'a1', kind: 'scene', prompt: 'Shibuya crossing at blue hour', img: '/api/media?p=scene-portraits%2Fmin-ji-park-1776252882422.jpg', createdAt: 3 },
  { id: 'a2', kind: 'outfit', prompt: 'Oversized cable-knit sweater', img: '/api/media?p=scene-portraits%2Fakira-shimizu-1776253612303.jpg', createdAt: 2 },
  { id: 'a3', kind: 'scene', prompt: 'Modern research lab', img: '/api/media?p=scene-portraits%2Fvera-liang-1776255518193.jpg', createdAt: 1 },
];

type Stage = 'idle' | 'generating';

// ── Component ───────────────────────────────────────────────────────────

export default function MockWorkshop() {
  const [mode, setMode] = useState<Kind>('outfit');
  const [canvasImg, setCanvasImg] = useState(CHARACTER.profileImg);
  const [canvasLabel, setCanvasLabel] = useState('Profile headshot');
  const [library, setLibrary] = useState<Asset[]>(MOCK_LIBRARY);
  const [credits, setCredits] = useState(23);
  const [prompt, setPrompt] = useState('');
  const [referenceFile, setReferenceFile] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [stageText, setStageText] = useState('');
  const [improving, setImproving] = useState(false);
  const [showRefSheet, setShowRefSheet] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  // Mode change clears transient inputs but keeps prompt (user may be iterating)
  useEffect(() => { setReferenceFile(null); }, [mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return;
      if (e.key === '1') setMode('outfit');
      if (e.key === '2') setMode('scene');
      if (e.key === 'r') setShowRefSheet(true);
      if (e.key === 'd') setShowDownload(true);
      if (e.key === 'Escape') { setShowRefSheet(false); setShowDownload(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const canGenerate = !!(prompt.trim() || referenceFile) && stage === 'idle' && credits > 0;

  const improve = () => {
    if (!prompt.trim() || improving) return;
    setImproving(true);
    setTimeout(() => {
      const suffix = mode === 'outfit'
        ? ', photographed in soft window light, 35mm film grain, editorial styling, fine fabric texture'
        : ', cinematic composition, 35mm film look, shallow depth of field, ambient natural lighting';
      setPrompt((p) => p + suffix);
      setImproving(false);
    }, 1100);
  };

  const generate = () => {
    if (!canGenerate) return;
    setStage('generating');
    setStageText(mode === 'outfit' ? 'Sketching the wardrobe…' : 'Building the scene…');
    setTimeout(() => setStageText(mode === 'outfit' ? 'Dressing Min-ji…' : 'Placing Min-ji in the scene…'), 1500);
    setTimeout(() => setStageText('Final polish…'), 3200);
    setTimeout(() => {
      // Use one of the pre-generated portraits as a fake result
      const samples = [
        '/api/media?p=scene-portraits%2Fmin-ji-park-1776252882422.jpg',
        '/api/media?p=scene-portraits%2Fakira-shimizu-1776253612303.jpg',
        '/api/media?p=scene-portraits%2Fvera-liang-1776255518193.jpg',
        '/api/media?p=scene-portraits%2Fblack-woman-amara-okonkwo-santos-1776255803474.jpg',
      ];
      const img = samples[Math.floor(Math.random() * samples.length)];
      const newAsset: Asset = {
        id: `a-${Date.now()}`,
        kind: mode,
        prompt: prompt || `Uploaded ${mode} reference`,
        img,
        createdAt: Date.now() / 1000,
      };
      setLibrary((prev) => [newAsset, ...prev]);
      setCanvasImg(img);
      setCanvasLabel(newAsset.prompt);
      setCredits((c) => c - 1);
      setStage('idle');
      setPrompt('');
      setReferenceFile(null);
    }, 4800);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#faf7f2] text-gray-900 overflow-hidden">
      {/* Header — slim, persistent */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link href={`/characters/${CHARACTER.slug}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </Link>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${CHARACTER.profileImg}&w=96`} alt="" className="w-6 h-6 rounded-full object-cover object-top shrink-0" />
            <span className="text-sm font-semibold truncate text-black">{CHARACTER.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 shrink-0">{CHARACTER.license}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowRefSheet(true)}
            title="Reference sheet · R"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            Reference sheet
          </button>
          <button
            onClick={() => setShowDownload(true)}
            title="Download package · D"
            className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Download
          </button>
          <div className="h-7 w-px bg-gray-200" />
          <CreditsChip credits={credits} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Far left — vertical library rail */}
        <div className="w-[120px] shrink-0 border-r border-gray-100 bg-white flex flex-col">
          <div className="p-3 pb-2 shrink-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 leading-tight">
              Her library
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">{library.length} looks & shots</p>
          </div>
          <div className="flex-1 px-3 pb-3 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {/* Pinned: originals that came with the license */}
              <LibraryThumb
                asset={{ id: 'pin-profile', kind: 'outfit', prompt: 'Profile headshot', img: CHARACTER.profileImg, createdAt: 0 }}
                pinnedLabel="Profile"
                active={canvasImg === CHARACTER.profileImg}
                onClick={() => { setCanvasImg(CHARACTER.profileImg); setCanvasLabel('Profile headshot'); }}
              />
              <LibraryThumb
                asset={{ id: 'pin-refsheet', kind: 'outfit', prompt: '8-panel reference sheet', img: CHARACTER.referenceSheetUrl, createdAt: 0 }}
                pinnedLabel="Ref sheet"
                active={canvasImg === CHARACTER.referenceSheetUrl}
                onClick={() => { setCanvasImg(CHARACTER.referenceSheetUrl); setCanvasLabel('8-panel reference sheet'); }}
              />

              {/* Divider */}
              <div className="my-1 border-t border-gray-100" />

              {library.length === 0 ? (
                <div className="text-[10px] text-gray-400 py-2 px-1">Generate your first look on the right.</div>
              ) : (
                library.map((a) => (
                  <LibraryThumb
                    key={a.id}
                    asset={a}
                    active={canvasImg === a.img}
                    onClick={() => { setCanvasImg(a.img); setCanvasLabel(a.prompt); }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Middle — canvas */}
        <div className="flex-1 flex items-center justify-center p-8 min-w-0">
          <CanvasArea
            img={canvasImg}
            label={canvasLabel}
            stage={stage}
            stageText={stageText}
            isRefSheet={canvasImg === CHARACTER.referenceSheetUrl}
          />
        </div>

        {/* Right — single tool panel */}
        <aside className="w-[440px] shrink-0 border-l border-gray-100 bg-white flex flex-col">
          {/* Mode segmented control */}
          <div className="p-5 pb-3">
            <div className="relative flex bg-gray-50 border border-gray-100 rounded-xl p-1">
              <button
                onClick={() => setMode('outfit')}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'outfit' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
              >
                Outfit
              </button>
              <button
                onClick={() => setMode('scene')}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${mode === 'scene' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
              >
                Scene
              </button>
              <button
                disabled
                className="flex-1 text-sm font-semibold py-2 rounded-lg opacity-40 text-gray-400 cursor-not-allowed"
              >
                Voice · soon
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 px-1">
              {mode === 'outfit'
                ? 'Swap the outfit. Identity stays locked.'
                : 'Place her current look into any scene.'}
            </p>
          </div>

          {/* Prompt area */}
          <div className="flex-1 px-5 overflow-y-auto">
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'outfit'
                  ? 'Charcoal three-piece suit with a silk pocket square'
                  : 'Shibuya crossing at dusk, neon billboards, subtle crowd blur'}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pb-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white resize-none transition-colors"
                rows={6}
                autoFocus
              />
              {/* Floating Improve chip — bottom-right of the input */}
              <button
                onClick={improve}
                disabled={!prompt.trim() || improving}
                title="Enrich your description with cinematic detail"
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 shadow-sm text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md disabled:text-gray-300 disabled:border-gray-100 disabled:shadow-none disabled:cursor-not-allowed transition-all rounded-full px-3 py-1.5"
              >
                {improving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                    Improving…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
                    </svg>
                    Improve
                  </>
                )}
              </button>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setReferenceFile(referenceFile ? null : (mode === 'outfit' ? 'silk-blouse.jpg' : 'shibuya-ref.jpg'))}
                className={`w-full border-2 border-dashed rounded-xl p-3 transition-all text-left ${
                  referenceFile
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {referenceFile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">IMG</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-black">{referenceFile}</p>
                      <p className="text-[10px] text-gray-500">Used as reference · click to remove</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-xs">
                      {mode === 'outfit' ? 'Or reference a garment photo' : 'Or reference a scene photo'}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Generate button */}
          <div className="p-5 pt-3 border-t border-gray-100 shrink-0">
            <button
              onClick={generate}
              disabled={!canGenerate}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-all shadow-sm shadow-indigo-500/30 disabled:shadow-none"
            >
              {stage === 'generating' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : credits === 0 ? (
                'Top up to generate'
              ) : (
                <>
                  Generate <span className="text-white/80">· 1 credit</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {showRefSheet && <RefSheetModal onClose={() => setShowRefSheet(false)} />}
      {showDownload && <DownloadModal library={library} onClose={() => setShowDownload(false)} />}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function CreditsChip({ credits }: { credits: number }) {
  const low = credits <= 3;
  return (
    <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${low ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${low ? 'bg-amber-500' : 'bg-indigo-500'}`} />
      <span className="text-sm font-semibold tabular-nums text-black">{credits}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">credits</span>
    </button>
  );
}

function CanvasArea({ img, label, stage, stageText, isRefSheet }: { img: string; label: string; stage: Stage; stageText: string; isRefSheet?: boolean }) {
  // Reference sheet is a wide 8-panel grid; portraits and generated variants are 3:4.
  // Adapt the canvas aspect + fit mode so the whole image is always visible.
  const containerClass = isRefSheet
    ? 'relative w-full max-w-5xl rounded-3xl overflow-hidden bg-white/5 shadow-2xl shadow-indigo-900/30 ring-1 ring-white/10'
    : 'relative w-full max-w-[520px] aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 shadow-2xl shadow-indigo-900/30 ring-1 ring-white/10';
  const imgClass = isRefSheet
    ? 'w-full h-auto object-contain'
    : 'w-full h-full object-cover object-top';

  const containerClassLight = isRefSheet
    ? 'relative w-full max-w-5xl rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100'
    : 'relative w-full max-w-[520px] aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/70 ring-1 ring-gray-100';

  return (
    <div className={`relative ${isRefSheet ? 'w-full max-w-5xl' : 'w-full max-w-[520px]'}`}>
      {/* Minimal neutral warmth behind canvas — paper itself does the heavy lift */}
      <div className="absolute -inset-12 bg-gradient-to-br from-amber-50/40 via-white/40 to-gray-50/40 blur-3xl pointer-events-none" />

      <div className={containerClassLight}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${img}${img.includes('?') ? '&' : '?'}w=2000`}
          alt={label}
          className={`${imgClass} transition-all duration-500 ${stage === 'generating' ? 'blur-xl opacity-40 scale-105' : 'blur-0 opacity-100 scale-100'}`}
        />

        {stage === 'generating' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
            </div>
            <div className="relative bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-lg">
              <p className="text-sm font-semibold text-black">{stageText}</p>
              <div className="h-1 w-48 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-progress" />
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-0.5">Working from</p>
          <p className="text-white font-semibold text-sm truncate">{label}</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        :global(.animate-shimmer) { animation: shimmer 2s ease-in-out infinite; }
        :global(.animate-progress) { animation: progress 4.5s ease-out forwards; }
      `}</style>
    </div>
  );
}

function LibraryThumb({ asset, active, onClick, pinnedLabel }: { asset: Asset; active: boolean; onClick: () => void; pinnedLabel?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full group relative rounded-lg overflow-hidden transition-all ${active ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20' : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-sm'}`}
      style={{ aspectRatio: '3 / 4' }}
      title={asset.prompt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${asset.img}${asset.img.includes('?') ? '&' : '?'}w=300`}
        alt={asset.prompt}
        className="w-full h-full object-cover object-top"
      />
      <div className="absolute top-1 left-1 text-[8px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 rounded bg-black/70 backdrop-blur">
        {pinnedLabel ?? (asset.kind === 'outfit' ? 'Look' : 'Shot')}
      </div>
    </button>
  );
}

function RefSheetModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <div className="relative max-w-5xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-8 right-0 text-white/80 hover:text-white text-sm font-medium">Close · Esc</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${CHARACTER.referenceSheetUrl}&w=2000`} alt="Reference sheet" className="w-full rounded-2xl shadow-2xl" />
      </div>
    </div>
  );
}

function DownloadModal({ library, onClose }: { library: Asset[]; onClose: () => void }) {
  const outfits = library.filter((a) => a.kind === 'outfit').length;
  const shots = library.filter((a) => a.kind === 'scene').length;
  const total = (2.3 + 11.1 + outfits * 4.7 + shots * 4.2).toFixed(1);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-md border border-gray-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xs font-medium">Esc</button>
        <h2 className="text-xl font-black tracking-tight mb-1 text-black">Your package</h2>
        <p className="text-xs text-gray-500 mb-5">Ready for Kling, Runway, and Veo.</p>
        <div className="space-y-1.5">
          <PkgRow label="Profile photo" />
          <PkgRow label="4K 8-panel reference sheet" />
          <PkgRow label={`${outfits} outfit${outfits === 1 ? '' : 's'}`} muted={outfits === 0} />
          <PkgRow label={`${shots} scene${shots === 1 ? '' : 's'}`} muted={shots === 0} />
          <PkgRow label="Kling / Runway / Veo guide" />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-5 pt-4 border-t border-gray-100">
          <span>Total</span>
          <span className="font-bold text-black">{total} MB</span>
        </div>
        <button className="w-full mt-4 bg-black text-white font-bold text-sm px-5 py-3.5 rounded-xl hover:bg-gray-800 transition-colors">
          Download (Free)
        </button>
      </div>
    </div>
  );
}

function PkgRow({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-sm ${muted ? 'opacity-40' : 'text-black'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${muted ? 'bg-gray-200' : 'bg-indigo-500'}`}>
        {!muted && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>}
      </div>
      <span>{label}</span>
    </div>
  );
}
